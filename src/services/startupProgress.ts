/**
 * Pure model of the first-launch / startup setup progress. No React Native imports, so it is covered by `node --test`.
 *
 * Progress is stage-based and driven by real work:
 *  - the database, application-data and finalizing stages report only that they started (no invented inner percentages);
 *  - the library stage reports real counters (question packs processed, weighted by their question counts).
 * The overall fraction maps each stage onto a fixed slice of the bar. The library slice is the largest because it
 * is where nearly all the time is spent on first launch.
 */

export const STARTUP_STAGES = ["database", "appData", "library", "finalizing", "ready"] as const;
export type StartupStage = (typeof STARTUP_STAGES)[number];

/** `unknown` until the database is open and we can tell whether the question library has ever been imported. */
export type StartupMode = "unknown" | "firstRun" | "returning";

export interface StartupProgress {
  stage: StartupStage;
  /** Overall progress 0..1. Never decreases within one attempt. */
  fraction: number;
  packsDone: number;
  packsTotal: number;
  mode: StartupMode;
}

export const INITIAL_STARTUP_PROGRESS: StartupProgress = {
  stage: "database",
  fraction: 0,
  packsDone: 0,
  packsTotal: 0,
  mode: "unknown"
};

/** [start, end] slice of the overall bar owned by each stage. */
export const STAGE_RANGE: Record<StartupStage, readonly [number, number]> = {
  database: [0, 0.1],
  appData: [0.1, 0.16],
  library: [0.16, 0.94],
  finalizing: [0.94, 1],
  ready: [1, 1]
};

export function stageIndex(stage: StartupStage): number {
  return STARTUP_STAGES.indexOf(stage);
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Overall fraction for a stage, given 0..1 progress inside that stage. */
export function overallFraction(stage: StartupStage, within = 0): number {
  const [start, end] = STAGE_RANGE[stage];
  return start + (end - start) * clamp01(within);
}

/**
 * Progress inside the library stage. Weighted by question counts when known so a large pack moves the bar more than
 * a tiny one; falls back to the pack count.
 */
export function libraryWithin(packsDone: number, packsTotal: number, questionsDone = 0, questionsTotal = 0): number {
  if (questionsTotal > 0) return clamp01(questionsDone / questionsTotal);
  if (packsTotal > 0) return clamp01(packsDone / packsTotal);
  return 0;
}

/** Whole-number percent for display and accessibility values. */
export function percentOf(fraction: number): number {
  return Math.round(clamp01(fraction) * 100);
}

/**
 * Merges an update into the current progress. Within one attempt the bar only moves forward and a stage never goes
 * back; pass `reset: true` (retry) to start over.
 */
export function advanceProgress(
  prev: StartupProgress,
  patch: Partial<StartupProgress>,
  options: { reset?: boolean } = {}
): StartupProgress {
  if (options.reset) return { ...INITIAL_STARTUP_PROGRESS, ...patch };
  const next: StartupProgress = { ...prev, ...patch };
  if (stageIndex(next.stage) < stageIndex(prev.stage)) next.stage = prev.stage;
  next.fraction = Math.max(prev.fraction, clamp01(next.fraction));
  return next;
}
