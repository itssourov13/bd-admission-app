import type { SqlDb, SqlParam } from "../db/types.ts";
import type { HistoryItem, PoolFilter, RuleStatus, SessionMode, SessionRow } from "../types/domain.ts";
import type { ScoringRule } from "../services/scoring.ts";

interface RawSession {
  id: string; mode: SessionMode; status: SessionRow["status"]; filter_json: string; started_at: number; ended_at: number | null;
  deadline_at: number | null; duration_seconds: number | null; per_question_seconds: number | null; finish_reason: SessionRow["finishReason"];
  rule_correct_marks: number | null; rule_incorrect_penalty: number | null; rule_unanswered_marks: number | null;
  rule_status: RuleStatus | null; result_json: string | null;
}

function toSession(r: RawSession): SessionRow {
  return {
    id: r.id, mode: r.mode, status: r.status, filter: JSON.parse(r.filter_json) as PoolFilter, startedAt: Number(r.started_at),
    endedAt: r.ended_at, deadlineAt: r.deadline_at, durationSeconds: r.duration_seconds, perQuestionSeconds: r.per_question_seconds,
    finishReason: r.finish_reason, ruleCorrect: r.rule_correct_marks, rulePenalty: r.rule_incorrect_penalty,
    ruleUnanswered: r.rule_unanswered_marks, ruleStatus: r.rule_status, resultJson: r.result_json
  };
}

export function newSessionId(now = Date.now()): string {
  return `s${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateSessionInput {
  id: string; mode: SessionMode; filter: PoolFilter; startedAt: number;
  deadlineAt?: number | null; durationSeconds?: number | null; perQuestionSeconds?: number | null; rule?: ScoringRule | null;
}

export async function createSession(db: SqlDb, s: CreateSessionInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO practice_sessions (id, mode, status, filter_json, started_at, deadline_at, duration_seconds, per_question_seconds,
       rule_correct_marks, rule_incorrect_penalty, rule_unanswered_marks, rule_status)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.id, s.mode, JSON.stringify(s.filter), s.startedAt, s.deadlineAt ?? null, s.durationSeconds ?? null, s.perQuestionSeconds ?? null,
      s.rule?.correctMarks ?? null, s.rule?.incorrectPenalty ?? null, s.rule?.unansweredMarks ?? null, s.rule?.status ?? null]
  );
}

/** Exam: stores the fixed question list and an unanswered row per position in one transaction. */
export async function addExamQuestions(db: SqlDb, sessionId: string, questionIds: string[]): Promise<void> {
  await db.withTransactionAsync(async (tx) => {
    for (let i = 0; i < questionIds.length; i++) {
      await tx.runAsync("INSERT INTO session_questions (session_id, position, question_id, cycle) VALUES (?, ?, ?, 1)", [sessionId, i + 1, questionIds[i]]);
      await tx.runAsync("INSERT INTO session_answers (session_id, position, question_id, selected_keys, outcome) VALUES (?, ?, ?, '[]', 'unanswered')", [sessionId, i + 1, questionIds[i]]);
    }
  });
}

/** Flash: records one resolved question (served + outcome) atomically. Idempotent on (session, position). */
export async function recordFlashResult(
  db: SqlDb, sessionId: string,
  r: { position: number; cycle: number; questionId: string; outcome: "correct" | "incorrect" | "skipped" | "timed_out"; selectedKeys: string[]; timeSpentMs: number; at: number }
): Promise<void> {
  await db.withTransactionAsync(async (tx) => {
    await tx.runAsync("INSERT OR IGNORE INTO session_questions (session_id, position, question_id, cycle) VALUES (?, ?, ?, ?)", [sessionId, r.position, r.questionId, r.cycle]);
    await tx.runAsync(
      "INSERT OR IGNORE INTO session_answers (session_id, position, question_id, selected_keys, outcome, time_spent_ms, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sessionId, r.position, r.questionId, JSON.stringify(r.selectedKeys), r.outcome, r.timeSpentMs, r.at]
    );
  });
}

/**
 * Saves an exam selection. The statement refuses to write once the session is finalized or its deadline has
 * passed, so a late tap can never alter a result. Returns whether the selection was stored.
 */
export async function saveExamSelection(db: SqlDb, sessionId: string, questionId: string, keys: string[], at: number): Promise<boolean> {
  const r = await db.runAsync(
    `UPDATE session_answers SET selected_keys = ?, answered_at = ?
     WHERE session_id = ? AND question_id = ? AND outcome = 'unanswered'
       AND EXISTS (SELECT 1 FROM practice_sessions s WHERE s.id = ? AND s.status = 'active' AND (s.deadline_at IS NULL OR s.deadline_at > ?))`,
    [JSON.stringify(keys), at, sessionId, questionId, sessionId, at]
  );
  return r.changes === 1;
}

export async function getSession(db: SqlDb, id: string): Promise<SessionRow | null> {
  const r = await db.getFirstAsync<RawSession>("SELECT * FROM practice_sessions WHERE id = ?", [id]);
  return r ? toSession(r) : null;
}

export interface SessionAnswerRow {
  position: number; questionId: string; selectedKeys: string[]; outcome: "correct" | "incorrect" | "skipped" | "timed_out" | "unanswered"; timeSpentMs: number | null;
}

export async function getSessionAnswers(db: SqlDb, sessionId: string): Promise<SessionAnswerRow[]> {
  const rows = await db.getAllAsync<{ position: number; question_id: string; selected_keys: string; outcome: SessionAnswerRow["outcome"]; time_spent_ms: number | null }>(
    "SELECT position, question_id, selected_keys, outcome, time_spent_ms FROM session_answers WHERE session_id = ? ORDER BY position", [sessionId]
  );
  return rows.map((r) => ({ position: Number(r.position), questionId: r.question_id, selectedKeys: JSON.parse(r.selected_keys) as string[], outcome: r.outcome, timeSpentMs: r.time_spent_ms }));
}

export async function getActiveExam(db: SqlDb): Promise<SessionRow | null> {
  const r = await db.getFirstAsync<RawSession>("SELECT * FROM practice_sessions WHERE mode = 'exam' AND status = 'active' ORDER BY started_at DESC LIMIT 1");
  return r ? toSession(r) : null;
}

/** Abandons an unfinished exam without scoring (used when the user discards it). */
export async function abandonSession(db: SqlDb, id: string, at: number): Promise<void> {
  await db.runAsync("UPDATE practice_sessions SET status = 'abandoned', ended_at = ?, finish_reason = 'exited' WHERE id = ? AND status = 'active'", [at, id]);
}

/** Flash sessions left active by a force-close are closed as abandoned; their recorded answers remain in history. */
export async function closeStaleFlash(db: SqlDb, at: number): Promise<void> {
  await db.runAsync("UPDATE practice_sessions SET status = 'abandoned', ended_at = ?, finish_reason = 'exited' WHERE mode = 'flash' AND status = 'active'", [at]);
}

export async function finishFlashSession(db: SqlDb, id: string, at: number, resultJson: string): Promise<boolean> {
  const r = await db.runAsync(
    "UPDATE practice_sessions SET status = 'completed', ended_at = ?, finish_reason = 'exited', result_json = ? WHERE id = ? AND status = 'active'",
    [at, resultJson, id]
  );
  return r.changes === 1;
}

/**
 * Finalizes an exam exactly once. The conditional UPDATE is the single-finalization guard at the database level:
 * returns false (and writes nothing else) when another call already finalized the session.
 */
export async function finalizeExamSession(
  db: SqlDb, id: string, reason: "submitted" | "time_expired", at: number, outcomes: { questionId: string; outcome: SessionAnswerRow["outcome"] }[], resultJson: string
): Promise<boolean> {
  let applied = false;
  await db.withTransactionAsync(async (tx) => {
    const r = await tx.runAsync(
      "UPDATE practice_sessions SET status = 'completed', ended_at = ?, finish_reason = ?, result_json = ? WHERE id = ? AND status = 'active'",
      [at, reason, resultJson, id]
    );
    if (r.changes !== 1) return;
    applied = true;
    for (const o of outcomes) {
      await tx.runAsync("UPDATE session_answers SET outcome = ? WHERE session_id = ? AND question_id = ?", [o.outcome, id, o.questionId]);
    }
  });
  return applied;
}

/** Finished sessions (completed, or abandoned with at least one recorded answer), newest first. */
export async function listHistory(db: SqlDb, limit = 50, mode?: SessionMode): Promise<HistoryItem[]> {
  const params: SqlParam[] = [];
  let where = "WHERE s.status != 'active'";
  if (mode) { where += " AND s.mode = ?"; params.push(mode); }
  params.push(limit);
  const rows = await db.getAllAsync<RawSession & { total: number; c: number; i: number; s: number; t: number }>(
    `SELECT s.*, COUNT(a.position) AS total,
       SUM(CASE WHEN a.outcome='correct' THEN 1 ELSE 0 END) AS c, SUM(CASE WHEN a.outcome='incorrect' THEN 1 ELSE 0 END) AS i,
       SUM(CASE WHEN a.outcome='skipped' THEN 1 ELSE 0 END) AS s, SUM(CASE WHEN a.outcome='timed_out' THEN 1 ELSE 0 END) AS t
     FROM practice_sessions s LEFT JOIN session_answers a ON a.session_id = s.id ${where}
     GROUP BY s.id HAVING s.status = 'completed' OR COUNT(a.position) > 0
     ORDER BY s.started_at DESC LIMIT ?`, params
  );
  return rows.map((r) => ({ ...toSession(r), total: Number(r.total), correct: Number(r.c ?? 0), incorrect: Number(r.i ?? 0), skipped: Number(r.s ?? 0), timedOut: Number(r.t ?? 0) }));
}
