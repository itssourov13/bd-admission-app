export type RuleStatus = "verified" | "illustrative" | "unconfigured";

export interface ScoringRule {
  correctMarks: number;
  incorrectPenalty: number;
  unansweredMarks: number;
  status: RuleStatus;
  totalQuestions?: number | null;
  durationSeconds?: number | null;
}

/** Used when no rule is stored. Counts one point per correct answer; NOT an official rule. */
export const UNCONFIGURED_RULE: ScoringRule = {
  correctMarks: 1,
  incorrectPenalty: 0,
  unansweredMarks: 0,
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
  marksFromCorrect: number;
  penaltyTotal: number;
  unansweredMarksTotal: number;
  score: number;
  maxScore: number;
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

export function validateRule(rule: ScoringRule): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries({
    correctMarks: rule.correctMarks,
    incorrectPenalty: rule.incorrectPenalty,
    unansweredMarks: rule.unansweredMarks
  })) {
    if (!Number.isFinite(value) || value < 0) errors.push(`${key} must be a finite non-negative number`);
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
  const marksFromCorrect = round(correct * rule.correctMarks);
  const penaltyTotal = round(incorrect * rule.incorrectPenalty);
  const unansweredMarksTotal = round(unanswered * rule.unansweredMarks);
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
    score: round(marksFromCorrect - penaltyTotal + unansweredMarksTotal),
    maxScore: round(Math.max(graded * rule.correctMarks, 0)),
    accuracyPercent: accuracyPercent(correct, answered),
    ruleStatus: rule.status,
    isOfficialRule: rule.status === "verified"
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
export function resolveRule(rules: Array<ScoringRule | null | undefined>): ScoringRule {
  if (rules.length === 0 || rules.some((r) => !r)) return UNCONFIGURED_RULE;
  const first = rules[0] as ScoringRule;
  if (first.status === "unconfigured") return UNCONFIGURED_RULE;
  const same = rules.every((r) => {
    const x = r as ScoringRule;
    return (
      x.status === first.status &&
      x.correctMarks === first.correctMarks &&
      x.incorrectPenalty === first.incorrectPenalty &&
      x.unansweredMarks === first.unansweredMarks
    );
  });
  return same ? first : UNCONFIGURED_RULE;
}
