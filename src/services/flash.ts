import { accuracyPercent } from "./scoring.ts";

export type FlashOutcome = "correct" | "incorrect" | "skipped" | "timed_out";

export interface FlashRecord {
  position: number;
  cycle: number;
  questionId: string;
  outcome: FlashOutcome;
  selectedKeys: string[];
  timeSpentMs: number;
  at: number;
}

export interface FlashState {
  status: "running" | "finished";
  poolIds: string[];
  order: string[];
  cursor: number;
  cycle: number;
  /** 1-based position of the question currently shown. */
  position: number;
  currentQuestionId: string | null;
  shownAt: number;
  deadline: number;
  perQuestionMs: number;
  records: FlashRecord[];
  startedAt: number;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function newCycleOrder(pool: string[], previousLast: string | null, rng: Rng): string[] {
  const order = shuffle(pool, rng);
  // Avoid showing the same question twice in a row across a cycle boundary.
  if (order.length > 1 && previousLast !== null && order[0] === previousLast) {
    [order[0], order[order.length - 1]] = [order[order.length - 1], order[0]];
  }
  return order;
}

/** Returns null when the pool is empty (the UI shows an empty state). */
export function startFlash(poolIds: string[], perQuestionSeconds: number, now: number, rng: Rng = Math.random): FlashState | null {
  const pool = Array.from(new Set(poolIds));
  if (pool.length === 0) return null;
  const order = newCycleOrder(pool, null, rng);
  const perQuestionMs = Math.round(perQuestionSeconds * 1000);
  return {
    status: "running",
    poolIds: pool,
    order,
    cursor: 0,
    cycle: 1,
    position: 1,
    currentQuestionId: order[0],
    shownAt: now,
    deadline: now + perQuestionMs,
    perQuestionMs,
    records: [],
    startedAt: now
  };
}

export type FlashEvent =
  | { type: "answer"; position: number; selectedKeys: string[]; correct: boolean }
  | { type: "skip"; position: number }
  | { type: "timeout"; position: number };

/**
 * Applies one event. Stale, duplicate or early-timeout events are ignored (applied=false), so a
 * timeout racing a tap can never score a question twice. An answer arriving at or after the
 * deadline is recorded as timed out, not answered.
 */
export function applyFlashEvent(
  state: FlashState,
  event: FlashEvent,
  now: number,
  rng: Rng = Math.random
): { state: FlashState; applied: boolean; record?: FlashRecord } {
  if (state.status !== "running" || event.position !== state.position || state.currentQuestionId === null) {
    return { state, applied: false };
  }
  const expired = now >= state.deadline;
  if (event.type === "timeout" && !expired) return { state, applied: false };

  let outcome: FlashOutcome;
  let selectedKeys: string[] = [];
  if (event.type === "timeout" || expired) outcome = "timed_out";
  else if (event.type === "skip") outcome = "skipped";
  else {
    selectedKeys = event.selectedKeys;
    outcome = event.correct ? "correct" : "incorrect";
  }

  const record: FlashRecord = {
    position: state.position,
    cycle: state.cycle,
    questionId: state.currentQuestionId,
    outcome,
    selectedKeys,
    timeSpentMs: Math.min(Math.max(0, now - state.shownAt), state.perQuestionMs),
    at: now
  };

  let { order, cursor, cycle } = state;
  cursor += 1;
  if (cursor >= order.length) {
    cycle += 1;
    order = newCycleOrder(state.poolIds, state.currentQuestionId, rng);
    cursor = 0;
  }
  const next: FlashState = {
    ...state,
    order,
    cursor,
    cycle,
    position: state.position + 1,
    currentQuestionId: order[cursor],
    shownAt: now,
    deadline: now + state.perQuestionMs,
    records: [...state.records, record]
  };
  return { state: next, applied: true, record };
}

/** The question on screen at exit is NOT counted, because it was never resolved. */
export function finishFlash(state: FlashState): FlashState {
  return state.status === "finished" ? state : { ...state, status: "finished", currentQuestionId: null };
}

export interface FlashSummary {
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timedOut: number;
  seen: number;
  accuracyPercent: number;
  avgAnswerSeconds: number | null;
  fastestAnswerSeconds: number | null;
  slowestAnswerSeconds: number | null;
  totalSeconds: number;
  cyclesCompleted: number;
}

export function summarizeFlash(records: FlashRecord[], startedAt: number, endedAt: number, poolSize: number): FlashSummary {
  const correct = records.filter((r) => r.outcome === "correct").length;
  const incorrect = records.filter((r) => r.outcome === "incorrect").length;
  const skipped = records.filter((r) => r.outcome === "skipped").length;
  const timedOut = records.filter((r) => r.outcome === "timed_out").length;
  const answeredMs = records.filter((r) => r.outcome === "correct" || r.outcome === "incorrect").map((r) => r.timeSpentMs);
  const sec = (ms: number) => Math.round(ms / 100) / 10;
  return {
    answered: correct + incorrect,
    correct,
    incorrect,
    skipped,
    timedOut,
    seen: records.length,
    accuracyPercent: accuracyPercent(correct, correct + incorrect),
    avgAnswerSeconds: answeredMs.length ? sec(answeredMs.reduce((a, b) => a + b, 0) / answeredMs.length) : null,
    fastestAnswerSeconds: answeredMs.length ? sec(Math.min(...answeredMs)) : null,
    slowestAnswerSeconds: answeredMs.length ? sec(Math.max(...answeredMs)) : null,
    totalSeconds: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
    cyclesCompleted: poolSize > 0 ? Math.floor(records.length / poolSize) : 0
  };
}
