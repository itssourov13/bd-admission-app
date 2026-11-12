import { effectiveRule, type ProfileChoice } from "./markingProfiles.ts";
import type { SqlDb } from "../db/types.ts";
import type { PoolFilter, QuestionView, SessionRow } from "../types/domain.ts";
import { getPaperRule, loadQuestions, practiceQuestionIds, resolveRuleForQuestions } from "../repositories/content.ts";
import {
  addExamQuestions, createSession, finalizeExamSession, getActiveExam, getSession, getSessionAnswers, newSessionId, saveExamSelection, type SessionAnswerRow
} from "../repositories/sessions.ts";
import { checkExamEligibility, isValidCustomPractice, pickExamQuestions, planExam, type CustomPracticeConfig, type ExamEligibility } from "./exam.ts";
import { scoreAttempt, isAnswerCorrect, UNCONFIGURED_RULE, type ExamScore, type ScorableQuestion, type ScoringRule } from "./scoring.ts";
import { examAdvice, type AdviceKey } from "./advice.ts";
import type { Rng } from "./flash.ts";

export function toScorable(q: QuestionView, allowProvisionalKey = false): ScorableQuestion {
  const correctKeys = q.options.filter((o) => o.isCorrect).map((o) => o.key);
  const verified = q.answerStatus === "verified" && q.contentStatus === "verified";
  return {
    id: q.id,
    correctKeys,
    answerVerified: verified || (allowProvisionalKey && correctKeys.length === 1),
    type: q.type
  };
}

export type StartExamResult =
  | { ok: true; sessionId: string }
  | { ok: false; eligibility: ExamEligibility; reason?: "subject_selection" | "incomplete_section" | "rule_unavailable" | "invalid_custom" };

/**
 * Starts a paper-specific exam when a source-backed pattern exists; the generic 100-question/60-minute mode is only
 * for global (no exact paper) practice (ADR-013). An exact paper without a usable stored pattern is refused with
 * `rule_unavailable` unless the caller passes an explicit `custom` count/duration, which starts a clearly marked
 * Custom Practice session (filter.customPractice) that is never scored or presented as an official exam.
 * Section-selection papers must select the exact subject count, and each selected section must have its required
 * number of graded items.
 */
export async function startStandardExam(
  db: SqlDb, filter: PoolFilter, now = Date.now(), rng?: Rng, opts: { includeUnverified?: boolean; custom?: CustomPracticeConfig; markingChoice?: ProfileChoice | null } = {}
): Promise<StartExamResult> {
  const getPool = (poolFilter: PoolFilter) => practiceQuestionIds(db, poolFilter, opts.includeUnverified === true);
  const storedRule = filter.paperId ? await getPaperRule(db, filter.paperId) : null;
  const plan = planExam(filter.paperId, storedRule);
  const customRequested = plan.kind === "unavailable" && opts.custom !== undefined;
  if (plan.kind === "unavailable" && !customRequested) {
    return { ok: false, eligibility: checkExamEligibility(0, 0), reason: "rule_unavailable" };
  }
  if (customRequested && !isValidCustomPractice(opts.custom)) {
    return { ok: false, eligibility: checkExamEligibility(0, 0), reason: "invalid_custom" };
  }
  const custom = customRequested ? opts.custom! : null;
  // Never consume another source's values: an official/source plan only supplies its own stored pattern.
  const paperPattern = plan.kind === "paper" ? storedRule : null;
  const required = plan.kind === "unavailable" ? custom!.questions : plan.required;
  const durationSeconds = plan.kind === "unavailable" ? custom!.seconds : plan.durationSeconds;
  const selection = paperPattern?.selectionConfig ?? null;
  let picked: string[] | null = null;
  let available = 0;

  if (selection?.mode === "select_subjects") {
    const subjects = filter.subjects ?? [];
    if (subjects.length !== selection.subjectCount || new Set(subjects).size !== subjects.length ||
        subjects.some((subject) => !selection.subjects.includes(subject))) {
      return { ok: false, eligibility: checkExamEligibility(0, required), reason: "subject_selection" };
    }

    const perSubject = selection.questionsPerSubject;
    const sectionPools = await Promise.all(subjects.map((subject) =>
      getPool({ ...filter, subject, subjects: undefined })
    ));
    available = sectionPools.reduce((sum, ids) => sum + ids.length, 0);
    if (perSubject && sectionPools.some((ids) => ids.length < perSubject)) {
      return { ok: false, eligibility: checkExamEligibility(available, required), reason: "incomplete_section" };
    }
    const combined: string[] = [];
    for (const sectionIds of sectionPools) {
      const chosen = perSubject ? pickExamQuestions(sectionIds, perSubject, rng) : sectionIds;
      if (!chosen) return { ok: false, eligibility: checkExamEligibility(available, required), reason: "incomplete_section" };
      combined.push(...chosen);
    }
    // Keep the subject quota, but mix selected sections into one exam sequence.
    picked = pickExamQuestions(combined, required, rng);
    if (picked && picked.length !== required) picked = null;
  } else {
    const eligible = await getPool(filter);
    available = eligible.length;
    picked = pickExamQuestions(eligible, required, rng);
  }

  const eligibility = checkExamEligibility(selection?.questionsPerSubject ? (picked?.length ?? 0) : available, required);
  if (!picked || !eligibility.ok) {
    return { ok: false, eligibility: checkExamEligibility(available, required), reason: selection ? "incomplete_section" : undefined };
  }

  const resolved = await resolveRuleForQuestions(db, picked, filter);
  // Never attach one paper's question-count/section pattern to an all-institution or global mock exam.
  const rule = custom ? { ...UNCONFIGURED_RULE } : filter.paperId ? (paperPattern ?? resolved) : {
    ...resolved, totalQuestions: null, durationSeconds: null, selectionConfig: null
  };
  // Marking profile (Phase 4): same resolution for every exam type; a complete stored rule still wins over an automatic default.
  const effective = effectiveRule(rule, opts.markingChoice ?? null, { customPractice: custom !== null });
  const id = newSessionId(now);
  const sessionFilter = { ...filter, ...(opts.includeUnverified ? { reviewUnverified: true } : {}), ...(custom ? { customPractice: true } : {}) };
  await createSession(db, { id, mode: "exam", filter: sessionFilter, startedAt: now, deadlineAt: now + durationSeconds * 1000, durationSeconds, rule: effective.rule, ruleProfile: effective.snapshot });
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
    correctMarks: session.ruleCorrect, incorrectPenalty: session.rulePenalty, unansweredMarks: session.ruleUnanswered,
    totalMarks: session.ruleTotalMarks, status: session.ruleStatus ?? "unconfigured"
  };
  const scorable = questions.map((q) => toScorable(q, session.filter.reviewUnverified === true));
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
