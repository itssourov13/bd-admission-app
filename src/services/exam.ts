import { shuffle, type Rng } from "./flash.ts";

export const STANDARD_EXAM_QUESTIONS = 100;
export const STANDARD_EXAM_SECONDS = 60 * 60;

export interface ExamEligibility {
  ok: boolean;
  required: number;
  available: number;
  shortfall: number;
}

/** A Standard Exam needs exactly `required` eligible questions; partial sets are never presented as complete. */
export function checkExamEligibility(available: number, required = STANDARD_EXAM_QUESTIONS): ExamEligibility {
  return { ok: available >= required, required, available, shortfall: Math.max(0, required - available) };
}

export function pickExamQuestions(eligibleIds: string[], required = STANDARD_EXAM_QUESTIONS, rng: Rng = Math.random): string[] | null {
  const unique = Array.from(new Set(eligibleIds));
  if (unique.length < required) return null;
  return shuffle(unique, rng).slice(0, required);
}

export interface ExamState {
  sessionId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  startedAt: number;
  deadline: number;
  status: "active" | "finalized";
  finishReason: "submitted" | "time_expired" | null;
  finalizedAt: number | null;
}

export function createExamState(sessionId: string, questionIds: string[], startedAt: number, durationSeconds = STANDARD_EXAM_SECONDS): ExamState {
  return {
    sessionId,
    questionIds,
    answers: {},
    startedAt,
    deadline: startedAt + durationSeconds * 1000,
    status: "active",
    finishReason: null,
    finalizedAt: null
  };
}

/** Selecting the already-selected key on a single-choice question keeps it selected; use clearAnswer to unselect. */
export function selectOption(state: ExamState, questionId: string, key: string, now: number, multiple = false): ExamState {
  if (state.status !== "active" || now >= state.deadline || !state.questionIds.includes(questionId)) return state;
  const current = state.answers[questionId] ?? [];
  let next: string[];
  if (multiple) next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
  else next = [key];
  return { ...state, answers: { ...state.answers, [questionId]: next } };
}

export function clearAnswer(state: ExamState, questionId: string, now: number): ExamState {
  if (state.status !== "active" || now >= state.deadline || !(questionId in state.answers)) return state;
  const { [questionId]: _removed, ...rest } = state.answers;
  return { ...state, answers: rest };
}

export function answeredCount(state: ExamState): number {
  return state.questionIds.filter((id) => (state.answers[id] ?? []).length > 0).length;
}

/** Idempotent: only the first call finalizes; later calls return applied=false. */
export function finalizeExam(state: ExamState, reason: "submitted" | "time_expired", now: number): { state: ExamState; applied: boolean } {
  if (state.status === "finalized") return { state, applied: false };
  return { state: { ...state, status: "finalized", finishReason: reason, finalizedAt: now }, applied: true };
}

/** Bounds for an explicitly user-chosen Custom Practice session (never an official exam). */
export const CUSTOM_PRACTICE_LIMITS = { minQuestions: 5, maxQuestions: 200, minSeconds: 60, maxSeconds: 4 * 60 * 60 } as const;

export interface CustomPracticeConfig {
  questions: number;
  seconds: number;
}

export function isValidCustomPractice(c: CustomPracticeConfig | undefined | null): c is CustomPracticeConfig {
  const l = CUSTOM_PRACTICE_LIMITS;
  return Boolean(c) && Number.isInteger(c!.questions) && Number.isInteger(c!.seconds) &&
    c!.questions >= l.minQuestions && c!.questions <= l.maxQuestions && c!.seconds >= l.minSeconds && c!.seconds <= l.maxSeconds;
}

/**
 * Custom Practice sizing (Phase 3). The question count stays user-adjustable, but the choices are derived from the
 * pool the selected subjects actually provide, so a user can never pick a size the pool cannot fill, and the duration
 * defaults to the generic exam pace (100 questions / 60 minutes = 0.6 min per question) instead of a free-form guess.
 */
export const CUSTOM_COUNT_PRESETS = [5, 10, 20, 30, 50, 100, 150, 200] as const;
export const CUSTOM_MINUTE_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;
const CUSTOM_DEFAULT_QUESTIONS = 30;

/** Selectable question counts for a pool of `available` questions: presets that fit, plus "all of it" when it fits the limits. */
export function customCountOptions(available: number): number[] {
  const l = CUSTOM_PRACTICE_LIMITS;
  const max = Math.min(Math.floor(available), l.maxQuestions);
  if (!Number.isFinite(max) || max < l.minQuestions) return [];
  const options = CUSTOM_COUNT_PRESETS.filter((n) => n <= max) as number[];
  if (!options.includes(max)) options.push(max);
  return options;
}

/** Default count: the largest option not above 30; falls back to the smallest option. Null when the pool is too small. */
export function defaultCustomQuestions(available: number): number | null {
  const options = customCountOptions(available);
  if (options.length === 0) return null;
  const fitting = options.filter((n) => n <= CUSTOM_DEFAULT_QUESTIONS);
  return fitting.length ? fitting[fitting.length - 1] : options[0];
}

/** Keeps a previously chosen count valid after the pool changed (e.g. a subject was deselected). */
export function clampCustomQuestions(chosen: number | null, available: number): number | null {
  const options = customCountOptions(available);
  if (options.length === 0) return null;
  if (chosen !== null && options.includes(chosen)) return chosen;
  const smaller = options.filter((n) => chosen !== null && n <= chosen);
  return smaller.length ? smaller[smaller.length - 1] : defaultCustomQuestions(available);
}

/** Pace-based duration suggestion (0.6 min/question, rounded up to 5 minutes), within the Custom Practice limits. */
export function suggestCustomMinutes(questions: number): number {
  const l = CUSTOM_PRACTICE_LIMITS;
  const minutes = Math.max(5, Math.ceil((questions * 0.6) / 5) * 5);
  return Math.min(minutes, l.maxSeconds / 60);
}

/** Minute choices: the presets plus the pace suggestion for the current count, ascending. */
export function customMinuteOptions(questions: number): number[] {
  const l = CUSTOM_PRACTICE_LIMITS;
  const all = new Set<number>([...CUSTOM_MINUTE_PRESETS, suggestCustomMinutes(questions)]);
  return [...all].filter((m) => m * 60 >= l.minSeconds && m * 60 <= l.maxSeconds).sort((a, b) => a - b);
}

/** The subset of a stored paper rule that decides whether an exam format may be used. */
export interface PaperRuleShape {
  status: "verified" | "illustrative" | "unconfigured";
  totalQuestions?: number | null;
  durationSeconds?: number | null;
  /** Present only for "choose N of M subjects" patterns. */
  selectionConfig?: unknown;
}

/**
 * What a session may use as its question count and duration (ADR-013).
 * - generic: no exact paper; the all-catalogue 100-question/60-minute practice defaults apply.
 * - paper: the exact paper's own configured count and duration; `official` only for a verified rule
 *   (an illustrative rule is a labelled, non-official source-pattern practice).
 * - unavailable: an exact paper (or a publisher book) without a usable stored pattern. Generic 100/60 is never substituted.
 */
export type ExamPlan =
  | { kind: "generic"; required: number; durationSeconds: number }
  | { kind: "paper"; required: number; durationSeconds: number; official: boolean }
  | { kind: "unavailable"; reason: "no_rule" | "unconfigured_rule" | "incomplete_rule" | "mixed_rules" };

export function planExam(paperId: string | undefined | null, rule: PaperRuleShape | null, opts: { bookScoped?: boolean; institutionScoped?: boolean } = {}): ExamPlan {
  // Publisher books carry no source-backed exam pattern (Phase 8): the generic 100/60 defaults are only for the
  // all-catalogue scope, so a book scope is always an explicit, unscored Custom Practice session.
  if (opts.bookScoped && !paperId) return { kind: "unavailable", reason: "no_rule" };
  // A university scope without a resolved pattern is never generic (Phase 11): the caller must pick one of the
  // university's stored patterns (planPatternScope) or an explicit Custom Practice.
  if (opts.institutionScoped && !paperId) return { kind: "unavailable", reason: "no_rule" };
  if (!paperId) return { kind: "generic", required: STANDARD_EXAM_QUESTIONS, durationSeconds: STANDARD_EXAM_SECONDS };
  if (!rule) return { kind: "unavailable", reason: "no_rule" };
  if (rule.status === "unconfigured") return { kind: "unavailable", reason: "unconfigured_rule" };
  const q = rule.totalQuestions;
  const s = rule.durationSeconds;
  if (!q || q <= 0 || !s || s <= 0) return { kind: "unavailable", reason: "incomplete_rule" };
  return { kind: "paper", required: q, durationSeconds: s, official: rule.status === "verified" };
}

/**
 * Plan for a university exam-pattern scope (`PoolFilter.paperIds`): every paper must carry the same complete stored
 * pattern. Missing, unconfigured, incomplete, section-selection or differing rules never fall back to 100/60.
 */
export function planPatternScope(rules: (PaperRuleShape | null)[]): ExamPlan {
  if (rules.length === 0 || rules.some((r) => !r)) return { kind: "unavailable", reason: "no_rule" };
  const list = rules as PaperRuleShape[];
  if (list.some((r) => r.status === "unconfigured")) return { kind: "unavailable", reason: "unconfigured_rule" };
  if (list.some((r) => r.selectionConfig)) return { kind: "unavailable", reason: "incomplete_rule" };
  const plans = list.map((r) => planExam("pattern", r));
  const first = plans[0]!;
  if (first.kind !== "paper" || plans.some((p) => p.kind !== "paper")) return { kind: "unavailable", reason: "incomplete_rule" };
  const same = plans.every((p) => p.kind === "paper" && p.required === first.required && p.durationSeconds === first.durationSeconds && p.official === first.official);
  return same ? first : { kind: "unavailable", reason: "mixed_rules" };
}

/** One stored paper of a university with its (possibly absent) rule, as read from the catalogue. */
export interface PatternPaper {
  id: string;
  academicSession?: string | null;
  unit?: string | null;
  rule: PaperRuleShape | null;
}

/** A selectable university exam pattern: papers of one session+unit that share one complete stored pattern. */
export interface ExamPatternOption {
  key: string;
  academicSession: string | null;
  unit: string | null;
  required: number;
  durationSeconds: number;
  /** True only for a verified rule; an illustrative rule is a labelled source-pattern practice. */
  official: boolean;
  paperIds: string[];
  /** Section-selection patterns (e.g. DU choose 4 of 6) only exist for one exact paper and route through it. */
  hasSections: boolean;
}

/** Groups a university's papers into usable exam patterns. Papers without a complete rule contribute nothing. */
export function groupExamPatterns(papers: PatternPaper[]): ExamPatternOption[] {
  const groups = new Map<string, ExamPatternOption>();
  for (const paper of papers) {
    const plan = planExam(paper.id, paper.rule);
    if (plan.kind !== "paper") continue;
    const hasSections = Boolean(paper.rule?.selectionConfig);
    const sections = hasSections ? JSON.stringify(paper.rule!.selectionConfig) : "";
    const key = [paper.academicSession ?? "", paper.unit ?? "", plan.required, plan.durationSeconds, plan.official ? "v" : "i", sections].join("|");
    const found = groups.get(key);
    if (found) found.paperIds.push(paper.id);
    else groups.set(key, {
      key, academicSession: paper.academicSession ?? null, unit: paper.unit ?? null, required: plan.required,
      durationSeconds: plan.durationSeconds, official: plan.official, paperIds: [paper.id], hasSections
    });
  }
  // Section patterns cannot be pooled across papers: keep only the single-paper ones.
  return [...groups.values()]
    .filter((o) => !o.hasSections || o.paperIds.length === 1)
    .sort((a, b) => Number(b.official) - Number(a.official) || (b.academicSession ?? "").localeCompare(a.academicSession ?? "") || (a.unit ?? "").localeCompare(b.unit ?? ""));
}

/** Route/scope keys that run a pattern option: an exact paper for section patterns or single papers, else a paper set. */
export function patternScope(option: ExamPatternOption): { paperId?: string; paperIds?: string[] } {
  return option.paperIds.length === 1 ? { paperId: option.paperIds[0] } : { paperIds: option.paperIds };
}

/**
 * Whether an institution-level Mock Exam entry should be shown: some stored pattern has enough eligible questions, or
 * the pool is big enough for an explicit Custom Practice. No universal question-count threshold is involved.
 */
export function examEntryAvailable(patterns: { required: number; eligible: number }[], poolSize: number): boolean {
  return patterns.some((p) => p.eligible >= p.required) || customCountOptions(poolSize).length > 0;
}
