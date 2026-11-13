import type { StartupMode } from "./startupProgress.ts";

/** Keep the branded setup visible only for first-run setup or an actionable startup failure. */
export function shouldShowSetupScreen(mode: StartupMode, failed: boolean, previouslyRequired: boolean): boolean {
  return previouslyRequired || failed || mode === "firstRun";
}

/** Returning launches have no branded setup layout, so they must release the startup sync gate directly. */
export function shouldReleaseSetupGateWithoutScreen(mode: StartupMode): boolean {
  return mode === "returning";
}

/** The branded first-run overlay may leave only after both startup and the initial Home content view are ready. */
export function canDismissSetupScreen(databaseReady: boolean, homeReady: boolean): boolean {
  return databaseReady && homeReady;
}

/**
 * A returning launch normally finishes behind the native splash in a few milliseconds. If it is still working after
 * this long (typically a new app release that re-syncs content packs) the branded progress UI takes over so the user
 * never stares at a frozen splash.
 */
export const RETURNING_ESCALATION_MS = 1500;

export function shouldEscalateReturningStartup(mode: StartupMode, databaseReady: boolean, failed: boolean, waitedMs: number): boolean {
  return mode === "returning" && !databaseReady && !failed && waitedMs >= RETURNING_ESCALATION_MS;
}

/**
 * Upper bound on waiting for Home's first data-backed layout after the database is ready. Home is not guaranteed to be
 * the initial route (deep link, restored route) and its loader could stall; the splash/overlay must still be released.
 */
export const HOME_READY_TIMEOUT_MS = 4000;

/** Dwell on the completed first-run state: long enough for the last checkmark animation, none under Reduce Motion. */
export const FIRST_RUN_READY_HOLD_MS = 520;
export const REDUCED_MOTION_READY_HOLD_MS = 150;

export function readyHoldMs(reduceMotion: boolean): number {
  return reduceMotion ? REDUCED_MOTION_READY_HOLD_MS : FIRST_RUN_READY_HOLD_MS;
}

/** Spinners appear only for loads slower than this, so fast tab switches never flash an indicator. */
export const LOADING_INDICATOR_DELAY_MS = 150;
