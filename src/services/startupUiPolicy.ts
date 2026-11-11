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
