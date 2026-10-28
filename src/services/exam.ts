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
