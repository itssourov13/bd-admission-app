import type { ExamSelectionConfig } from "../types/question-pack.ts";

export type RuleStatus = "verified" | "illustrative" | "unconfigured";

export interface ScoringRule {
  correctMarks?: number | null;
  incorrectPenalty?: number | null;
  unansweredMarks?: number | null;
  status: RuleStatus;
  totalQuestions?: number | null;
  totalMarks?: number | null;
  durationSeconds?: number | null;
  selectionConfig?: ExamSelectionConfig | null;
}

/** Used when no rule is stored. All scoring values are deliberately absent. */
export const UNCONFIGURED_RULE: ScoringRule = {
  correctMarks: null,
  incorrectPenalty: null,
  unansweredMarks: null,
  status: "unconfigured"
};

export interface ScorableQuestion {
  id: string;
  /** Verified correct option keys, or null/empty when the answer is not verified. */
  correctKeys: string[] | null;
  answerVerified: boolean;
  type?: "single_choice" | "multiple_choice";
}

export interface ExamScore {
  totalQuestions: number;
  gradedQuestions: number;
  ungradedQuestions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  marksFromCorrect: number | null;
  penaltyTotal: number | null;
  unansweredMarksTotal: number | null;
  score: number | null;
  maxScore: number | null;
  hasScoringRule: boolean;
  /** correct / answered (graded) questions as a percentage; 0 when nothing was answered. */
  accuracyPercent: number;
  answered: number;
  ruleStatus: RuleStatus;
  /** True only when the rule is verified; illustrative and unconfigured scores are not official. */
  isOfficialRule: boolean;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((key) => set.has(key)) && set.size === a.length;
}

export function isAnswerCorrect(q: ScorableQuestion, selected: string[]): boolean | null {
  if (!q.answerVerified || !q.correctKeys || q.correctKeys.length === 0) return null;
  return sameSet(q.correctKeys, selected);
}

/** Rounds to avoid floating point noise such as 0.30000000000000004. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function hasCompleteScoringRule(rule: ScoringRule): boolean {
  return rule.status !== "unconfigured" &&
    [rule.correctMarks, rule.incorrectPenalty, rule.unansweredMarks]
      .every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0);
}

export function validateRule(rule: ScoringRule): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries({
    correctMarks: rule.correctMarks,
    incorrectPenalty: rule.incorrectPenalty,
    unansweredMarks: rule.unansweredMarks,
    totalMarks: rule.totalMarks
  })) {
    if (value != null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      errors.push(`${key} must be a finite non-negative number`);
    }
  }
  return errors;
}

/**
 * Scores an attempt. `answers` maps question id to the selected option keys; a missing
 * or empty selection means unanswered. Questions without a verified answer are ungraded:
 * they never count as correct or incorrect and are excluded from maxScore.
 * The penalty is subtracted; the final score may be negative.
 */
export function scoreAttempt(
  questions: ScorableQuestion[],
  answers: Record<string, string[] | undefined>,
  rule: ScoringRule
): ExamScore {
  const problems = validateRule(rule);
  if (problems.length) throw new Error("Invalid scoring rule: " + problems.join("; "));
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let ungraded = 0;
  for (const q of questions) {
    const selected = answers[q.id] ?? [];
    const verdict = isAnswerCorrect(q, selected);
    if (verdict === null) {
      ungraded += 1;
      continue;
    }
    if (selected.length === 0) unanswered += 1;
    else if (verdict) correct += 1;
    else incorrect += 1;
  }
  const graded = correct + incorrect + unanswered;
  const answered = correct + incorrect;
  const hasScoring = hasCompleteScoringRule(rule);
  const marksFromCorrect = hasScoring ? round(correct * rule.correctMarks!) : null;
  const penaltyTotal = hasScoring ? round(incorrect * rule.incorrectPenalty!) : null;
  const unansweredMarksTotal = hasScoring ? round(unanswered * rule.unansweredMarks!) : null;
  return {
    totalQuestions: questions.length,
    gradedQuestions: graded,
    ungradedQuestions: ungraded,
    correct,
    incorrect,
    unanswered,
    answered,
    marksFromCorrect,
    penaltyTotal,
    unansweredMarksTotal,
    score: hasScoring ? round(marksFromCorrect! - penaltyTotal! + unansweredMarksTotal!) : null,
    maxScore: hasScoring ? round(Math.max(graded * rule.correctMarks!, 0)) : null,
    hasScoringRule: hasScoring,
    accuracyPercent: accuracyPercent(correct, answered),
    ruleStatus: rule.status,
    isOfficialRule: hasScoring && rule.status === "verified"
  };
}

/** Accuracy = correct / (correct + incorrect). Skipped and timed-out items are excluded. 0 when none answered. */
export function accuracyPercent(correct: number, answered: number): number {
  if (!Number.isFinite(correct) || !Number.isFinite(answered) || answered <= 0) return 0;
  return Math.round((correct / answered) * 1000) / 10;
}

/**
 * Picks one rule for a set of papers. All papers must share an identical rule (same values and
 * status) otherwise the result is the unconfigured fallback — mixed rules are never blended.
 */
export function resolveRule(rules: (ScoringRule | null | undefined)[]): ScoringRule {
  if (rules.length === 0 || rules.some((r) => !r)) return UNCONFIGURED_RULE;
  const first = rules[0] as ScoringRule;
  if (first.status === "unconfigured") return UNCONFIGURED_RULE;
  const same = rules.every((r) => {
    const x = r as ScoringRule;
    return (
      x.status === first.status &&
      x.correctMarks === first.correctMarks &&
      x.incorrectPenalty === first.incorrectPenalty &&
      x.unansweredMarks === first.unansweredMarks &&
      x.totalQuestions === first.totalQuestions &&
      x.totalMarks === first.totalMarks &&
      x.durationSeconds === first.durationSeconds &&
      JSON.stringify(x.selectionConfig ?? null) === JSON.stringify(first.selectionConfig ?? null)
    );
  });
  return same ? first : UNCONFIGURED_RULE;
}

/**
 * Score for a Flash session under `rule`: correct x marks, minus penalty per incorrect, plus the unanswered value for
 * each skipped or timed-out question. Returns null when no rule is configured (no score is invented).
 */
export function flashScore(counts: { correct: number; incorrect: number; skipped: number; timedOut: number }, rule: ScoringRule): number | null {
  if (!hasCompleteScoringRule(rule)) return null;
  const problems = validateRule(rule);
  if (problems.length) throw new Error("Invalid scoring rule: " + problems.join("; "));
  return round(counts.correct * rule.correctMarks! - counts.incorrect * rule.incorrectPenalty! + (counts.skipped + counts.timedOut) * rule.unansweredMarks!);
}
