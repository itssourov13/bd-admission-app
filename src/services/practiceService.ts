import type { SqlDb } from "../db/types.ts";
import type { PoolFilter, QuestionView, SessionRow } from "../types/domain.ts";
import { eligibleQuestionIds, loadQuestions, resolveRuleForQuestions } from "../repositories/content.ts";
import {
  addExamQuestions, createSession, finalizeExamSession, getActiveExam, getSession, getSessionAnswers, newSessionId, saveExamSelection, type SessionAnswerRow
} from "../repositories/sessions.ts";
import { checkExamEligibility, pickExamQuestions, STANDARD_EXAM_QUESTIONS, STANDARD_EXAM_SECONDS, type ExamEligibility } from "./exam.ts";
import { scoreAttempt, isAnswerCorrect, type ExamScore, type ScorableQuestion, type ScoringRule } from "./scoring.ts";
import { examAdvice, type AdviceKey } from "./advice.ts";
import type { Rng } from "./flash.ts";

export function toScorable(q: QuestionView): ScorableQuestion {
  return { id: q.id, correctKeys: q.options.filter((o) => o.isCorrect).map((o) => o.key), answerVerified: q.answerStatus === "verified", type: q.type };
}

export type StartExamResult =
  | { ok: true; sessionId: string }
  | { ok: false; eligibility: ExamEligibility };

/** Creates a Standard Exam of exactly 100 eligible questions, or reports the shortfall without creating anything. */
export async function startStandardExam(db: SqlDb, filter: PoolFilter, now = Date.now(), rng?: Rng): Promise<StartExamResult> {
  const eligible = await eligibleQuestionIds(db, filter);
  const eligibility = checkExamEligibility(eligible.length);
  if (!eligibility.ok) return { ok: false, eligibility };
  const picked = pickExamQuestions(eligible, STANDARD_EXAM_QUESTIONS, rng);
  if (!picked) return { ok: false, eligibility };
  const rule = await resolveRuleForQuestions(db, picked, filter);
  const id = newSessionId(now);
  await createSession(db, { id, mode: "exam", filter, startedAt: now, deadlineAt: now + STANDARD_EXAM_SECONDS * 1000, durationSeconds: STANDARD_EXAM_SECONDS, rule });
  await addExamQuestions(db, id, picked);
  return { ok: true, sessionId: id };
}

/** Returns false when the selection was refused (exam finalized or past its deadline). */
export async function persistSelection(db: SqlDb, sessionId: string, questionId: string, keys: string[], now = Date.now()): Promise<boolean> {
  return saveExamSelection(db, sessionId, questionId, keys, now);
}

export interface LoadedExam {
  session: SessionRow;
  /** Questions in exam order (position 1..n). */
  questions: QuestionView[];
  selected: Record<string, string[]>;
}

export async function loadExam(db: SqlDb, sessionId: string): Promise<LoadedExam | null> {
  const session = await getSession(db, sessionId);
  if (!session || session.mode !== "exam") return null;
  const answers = await getSessionAnswers(db, sessionId);
  const questions = await loadQuestions(db, answers.map((a) => a.questionId));
  const selected: Record<string, string[]> = {};
  answers.forEach((a) => { if (a.selectedKeys.length) selected[a.questionId] = a.selectedKeys; });
  return { session, questions, selected };
}

/** Finalizes an active exam whose deadline already passed (app was closed). Safe to call repeatedly. */
export async function finalizeOverdueExam(db: SqlDb, now = Date.now()): Promise<string | null> {
  const active = await getActiveExam(db);
  if (!active || active.deadlineAt === null || now < active.deadlineAt) return null;
  const result = await finalizeStandardExam(db, active.id, "time_expired", now);
  return result ? active.id : null;
}

export interface ExamResult extends ExamScore {
  elapsedSeconds: number;
  reason: "submitted" | "time_expired";
  advice: AdviceKey[];
}

/**
 * Scores and finalizes an exam attempt exactly once. Returns null when the attempt was already
 * finalized (duplicate submit/timeout); the existing result stays untouched.
 */
export async function finalizeStandardExam(db: SqlDb, sessionId: string, reason: "submitted" | "time_expired", now = Date.now()): Promise<ExamResult | null> {
  const session = await getSession(db, sessionId);
  if (!session || session.mode !== "exam" || session.status !== "active") return null;
  const answers = await getSessionAnswers(db, sessionId);
  const questions = await loadQuestions(db, answers.map((a) => a.questionId));
  const selected: Record<string, string[]> = {};
  answers.forEach((a) => { selected[a.questionId] = a.selectedKeys; });
  const rule: ScoringRule = {
    correctMarks: session.ruleCorrect ?? 1, incorrectPenalty: session.rulePenalty ?? 0, unansweredMarks: session.ruleUnanswered ?? 0,
    status: session.ruleStatus ?? "unconfigured"
  };
  const scorable = questions.map(toScorable);
  const score = scoreAttempt(scorable, selected, rule);
  const outcomes: { questionId: string; outcome: SessionAnswerRow["outcome"] }[] = scorable.map((q) => {
    const sel = selected[q.id] ?? [];
    const v = isAnswerCorrect(q, sel);
    if (sel.length === 0) return { questionId: q.id, outcome: "unanswered" };
    return { questionId: q.id, outcome: v === null ? "unanswered" : v ? "correct" : "incorrect" };
  });
  const endAt = Math.min(now, session.deadlineAt ?? now);
  // A late timeout/submit finalizes with the selections stored before the deadline; nothing after it is counted.
  const result: ExamResult = {
    ...score,
    elapsedSeconds: Math.max(0, Math.round((endAt - session.startedAt) / 1000)),
    reason,
    advice: examAdvice(score.accuracyPercent, score.unanswered, score.gradedQuestions)
  };
  const applied = await finalizeExamSession(db, sessionId, reason, now, outcomes, JSON.stringify(result));
  return applied ? result : null;
}
