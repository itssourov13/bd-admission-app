import { isAnswerCorrect, type ScorableQuestion } from "./scoring.ts";

/** Pure helpers for the Standard Exam palette, warnings, submission summary, result breakdown and review filters (Phase 5). */

export type PaletteState = "unanswered" | "answered" | "flagged" | "flaggedAnswered";

export function paletteState(answered: boolean, flagged: boolean): PaletteState {
  if (flagged) return answered ? "flaggedAnswered" : "flagged";
  return answered ? "answered" : "unanswered";
}

export interface ExamProgress { total: number; answered: number; unanswered: number; flagged: number; flaggedUnanswered: number }

/** Counts for the header and the submission summary. Ids not in `ids` (stale flags) are ignored. */
export function examProgress(ids: readonly string[], selected: Readonly<Record<string, readonly string[]>>, flagged: ReadonlySet<string>): ExamProgress {
  let answered = 0; let flaggedCount = 0; let flaggedUnanswered = 0;
  for (const id of ids) {
    const isAnswered = (selected[id]?.length ?? 0) > 0;
    if (isAnswered) answered++;
    if (flagged.has(id)) { flaggedCount++; if (!isAnswered) flaggedUnanswered++; }
  }
  return { total: ids.length, answered, unanswered: ids.length - answered, flagged: flaggedCount, flaggedUnanswered };
}

export type TimeLevel = "normal" | "low" | "final";

/**
 * Timer urgency. "low" starts at 5 minutes, or at 15% of a short exam (never below 1 minute); "final" is the last
 * minute and only exists for exams of 3+ minutes, so a very short exam is not permanently red.
 */
export function timeLevel(remainingSeconds: number, durationSeconds: number): TimeLevel {
  if (durationSeconds >= 180 && remainingSeconds <= 60) return "final";
  const lowAt = Math.max(60, Math.min(300, Math.round(durationSeconds * 0.15)));
  return remainingSeconds <= lowAt ? "low" : "normal";
}

export const WARNING_THRESHOLDS: readonly number[] = [600, 300, 60];

/** How long (seconds) a time warning stays visible after its threshold is reached. */
export const WARNING_VISIBLE_SECONDS = 20;

/**
 * The time-left warning (threshold in seconds) to show right now, or null. Derived purely from the remaining time, so it
 * needs no stored state and also appears correctly after the app is resumed. Thresholds longer than half the exam are
 * skipped so a 10-minute exam does not warn at 10:00.
 */
export function activeWarning(remainingSeconds: number, durationSeconds: number): number | null {
  if (remainingSeconds <= 0) return null;
  const hit = WARNING_THRESHOLDS.filter((t) => t <= durationSeconds / 2 && remainingSeconds <= t && remainingSeconds > t - WARNING_VISIBLE_SECONDS);
  return hit.length ? Math.min(...hit) : null;
}

export interface SubjectRow {
  subject: string | null;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** Answered, but the answer key is not verified so it cannot be graded. */
  ungraded: number;
  /** correct / (correct + incorrect) as a whole percent; null when nothing graded was answered. */
  accuracyPercent: number | null;
}

export interface ReviewItem { id: string; subject: string | null; scorable: ScorableQuestion }

/** Per-subject performance in first-seen subject order. */
export function subjectBreakdown(items: readonly ReviewItem[], selected: Readonly<Record<string, readonly string[]>>): SubjectRow[] {
  const rows = new Map<string | null, SubjectRow>();
  for (const item of items) {
    let row = rows.get(item.subject);
    if (!row) {
      row = { subject: item.subject, total: 0, answered: 0, correct: 0, incorrect: 0, unanswered: 0, ungraded: 0, accuracyPercent: null };
      rows.set(item.subject, row);
    }
    row.total++;
    const sel = selected[item.id] ?? [];
    if (sel.length === 0) { row.unanswered++; continue; }
    row.answered++;
    const verdict = isAnswerCorrect(item.scorable, [...sel]);
    if (verdict === null) row.ungraded++;
    else if (verdict) row.correct++;
    else row.incorrect++;
  }
  return [...rows.values()].map((r) => {
    const graded = r.correct + r.incorrect;
    return { ...r, accuracyPercent: graded > 0 ? Math.round((r.correct / graded) * 100) : null };
  });
}

export type ReviewStatus = "correct" | "incorrect" | "unanswered" | "ungraded";
export type ReviewFilter = "all" | "incorrect" | "unanswered" | "flagged";

export function reviewStatus(scorable: ScorableQuestion, selected: readonly string[]): ReviewStatus {
  if (selected.length === 0) return "unanswered";
  const verdict = isAnswerCorrect(scorable, [...selected]);
  return verdict === null ? "ungraded" : verdict ? "correct" : "incorrect";
}

export function matchesReviewFilter(status: ReviewStatus, flagged: boolean, filter: ReviewFilter): boolean {
  switch (filter) {
    case "all": return true;
    case "incorrect": return status === "incorrect";
    case "unanswered": return status === "unanswered";
    case "flagged": return flagged;
  }
}

export interface ResultHeadline { score: number | null; maxScore: number | null; accuracyPercent: number | null }

/** Reads the headline numbers of a stored result for history rows. Malformed or unknown JSON yields nulls, never an error. */
export function resultHeadline(resultJson: string | null, mode: "exam" | "flash"): ResultHeadline {
  const empty: ResultHeadline = { score: null, maxScore: null, accuracyPercent: null };
  if (!resultJson) return empty;
  try {
    const r = JSON.parse(resultJson) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    if (mode === "exam") return { score: num(r.score), maxScore: num(r.maxScore), accuracyPercent: num(r.accuracyPercent) };
    const summary = (r.summary ?? {}) as Record<string, unknown>;
    return { score: num(r.score), maxScore: null, accuracyPercent: num(summary.accuracyPercent) };
  } catch {
    return empty;
  }
}
