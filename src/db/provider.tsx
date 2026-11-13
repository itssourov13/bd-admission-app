import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";
import type { SqlDb } from "./types";
import { createSqlDb, type RawDb } from "./adapter";
import { runStartup } from "../services/startup";
import { syncFromSeed } from "../services/seedSync";
import { createStartupCoordinator, type AppLifecycle } from "../services/startupCoordinator";
import { startupMetrics } from "../services/perf";
import {
  advanceProgress,
  INITIAL_STARTUP_PROGRESS,
  overallFraction,
  type StartupProgress
} from "../services/startupProgress";
import { BUNDLED_MANIFEST } from "../content/bundledManifest";
import { openBundledSeed } from "../content/bundledSeed";

export const DB_NAME = "bd-admission.db";

type DbState =
  | { status: "loading"; db: null; error: null; importIssues: string[] }
  | { status: "ready"; db: SqlDb; error: null; importIssues: string[]; libraryComplete: boolean }
  | { status: "error"; db: null; error: Error; importIssues: string[] };

interface DbContextValue {
  state: DbState;
  retry: () => void;
}

const DbContext = createContext<DbContextValue>({ state: { status: "loading", db: null, error: null, importIssues: [] }, retry: () => undefined });
/** Separate context so the frequently changing setup progress never re-renders `useDbState` consumers. */
const ProgressContext = createContext<StartupProgress>(INITIAL_STARTUP_PROGRESS);
const SetupVisibleContext = createContext<() => void>(() => undefined);
const HomeVisibleContext = createContext<{
  markReady: () => void;
  waitUntilReady: () => Promise<void>;
}>({
  markReady: () => undefined,
  waitUntilReady: () => Promise.resolve()
});

/** Minimum gap between progress renders; stage and mode changes are always published immediately. */
const PROGRESS_EMIT_MS = 100;
/** Time-slice for yielding to the UI between content groups so the setup screen keeps painting. */
const YIELD_SLICE_MS = 50;
/** Release builds log the timing summary only when startup was slow or failed; development always logs it. */
const SLOW_STARTUP_LOG_MS = 3000;

interface AttemptResult {
  db: SqlDb;
  importIssues: string[];
  libraryComplete: boolean;
}

function toLifecycle(status: AppStateStatus): AppLifecycle {
  return status === "active" ? "active" : status === "background" ? "background" : "inactive";
}

function logStartup(failed: boolean): void {
  const snapshot = startupMetrics.snapshot();
  if (__DEV__ || failed || snapshot.elapsedMs >= SLOW_STARTUP_LOG_MS) {
    // Metric names and numbers only; never question text or profile data.
    console.info(startupMetrics.summary());
  }
}

/**
 * Opens SQLite, then runs the startup sequence (see services/startup.ts): migrations, closing stale sessions,
 * finalizing an exam that timed out while the app was closed and syncing the bundled question library from the
 * pre-built seed (services/seedSync.ts). Real progress is published through `useStartupProgress`.
 *
 * Reliability model (see docs/STARTUP_PERFORMANCE.md):
 *  - one single-flight coordinator owns every attempt, so StrictMode double effects, retries and foreground resumes
 *    can never run two writers on the database at once;
 *  - AppState transitions are fed to the coordinator; a failure that happened while the app was backgrounded is resumed
 *    once when the app returns to the foreground;
 *  - the content copy is checkpointed per pack inside SQLite, so a resumed attempt or a relaunch after the process was
 *    killed continues at the first pack without a committed signature;
 *  - individual pack failures are warnings; a database or migration failure (or a first-launch sync that produced
 *    nothing) is an error state with retry. No user data is ever deleted.
 */
export function DbProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DbState>({ status: "loading", db: null, error: null, importIssues: [] });
  const [progress, setProgress] = useState<StartupProgress>(INITIAL_STARTUP_PROGRESS);
  const [setupScreenGate] = useState(() => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => { resolve = done; });
    return { promise, resolve };
  });
  const markSetupScreenReady = useCallback(() => { setupScreenGate.resolve(); }, [setupScreenGate]);
  const [homeScreenGate] = useState(() => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => { resolve = done; });
    return { promise, resolve };
  });
  const markHomeScreenReady = useCallback(() => { homeScreenGate.resolve(); }, [homeScreenGate]);
  const waitForHomeScreenReady = useCallback(() => homeScreenGate.promise, [homeScreenGate]);
  const homeContextValue = useMemo(
    () => ({ markReady: markHomeScreenReady, waitUntilReady: waitForHomeScreenReady }),
    [markHomeScreenReady, waitForHomeScreenReady]
  );
  const [coordinator] = useState(() => {
    startupMetrics.mark("provider.created");
    // Progress bookkeeping is per attempt and lives inside the closure the coordinator calls.
    let current = advanceProgress(INITIAL_STARTUP_PROGRESS, {}, { reset: true });
    let lastEmit = 0;
    let lastYield = 0;
    let forceYield = false;

    const emit = (force: boolean) => {
      const at = Date.now();
      if (!force && at - lastEmit < PROGRESS_EMIT_MS) return;
      lastEmit = at;
      setProgress(current);
    };
    const report = (patch: Partial<StartupProgress>) => {
      const changedPhase = patch.stage !== undefined || patch.mode !== undefined;
      current = advanceProgress(current, patch);
      if (changedPhase) forceYield = true;
      emit(changedPhase);
    };
    const yieldToUi = async () => {
      const at = Date.now();
      if (!forceYield && at - lastYield < YIELD_SLICE_MS) return;
      const wait = forceYield ? 16 : 0;
      forceYield = false;
      await new Promise<void>((resolve) => setTimeout(resolve, wait));
      lastYield = Date.now();
    };

    const coord = createStartupCoordinator<AttemptResult>({
      onAttemptStart: () => {
        current = advanceProgress(INITIAL_STARTUP_PROGRESS, {}, { reset: true });
        lastEmit = 0;
        // Start a fresh attempt window while preserving process-relative app.jsStart/fonts.ready marks.
        startupMetrics.reset();
        startupMetrics.count("startup.attempts");
        setProgress(current);
        setState({ status: "loading", db: null, error: null, importIssues: [] });
      },
      async runAttempt() {
        let raw: { closeAsync(): Promise<void> } | null = null;
        try {
          await yieldToUi();
          const opened = await startupMetrics.span("db.open", () => openDatabaseAsync(DB_NAME));
          raw = opened;
          await startupMetrics.span("db.wal", () => opened.execAsync("PRAGMA journal_mode = WAL;"));
          const db = createSqlDb(opened as unknown as RawDb);
          const { importIssues, libraryComplete } = await runStartup(db, {
            report,
            yieldToUi,
            metrics: startupMetrics,
            waitForSetupScreen: () => setupScreenGate.promise,
            syncContent: (target, onProgress, now) =>
              syncFromSeed(target, { manifest: BUNDLED_MANIFEST, openSeed: openBundledSeed, now, onProgress, metrics: startupMetrics })
          });
          report({ stage: "ready", fraction: overallFraction("ready") });
          emit(true);
          startupMetrics.mark("ready");
          logStartup(false);
          return { db, importIssues, libraryComplete };
        } catch (error) {
          // Release the failed connection so the next attempt opens a fresh one. Stored data is not touched.
          const stale = raw;
          raw = null;
          if (stale) await stale.closeAsync().catch(() => undefined);
          logStartup(true);
          throw error;
        }
      },
      onSettled: (outcome) => {
        emit(true);
        if (outcome.ok) setState({ status: "ready", db: outcome.value.db, error: null, importIssues: outcome.value.importIssues, libraryComplete: outcome.value.libraryComplete });
        else setState({ status: "error", db: null, error: outcome.error, importIssues: [] });
      }
    });
    return coord;
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => coordinator.setLifecycle(toLifecycle(next)));
    coordinator.setLifecycle(toLifecycle(AppState.currentState));
    // StrictMode runs this effect twice in development; start() joins the in-flight attempt instead of starting another.
    void coordinator.start();
    return () => subscription.remove();
  }, [coordinator]);

  const retry = useCallback(() => {
    void coordinator.retry();
  }, [coordinator]);
  const dbContextValue = useMemo(() => ({ state, retry }), [state, retry]);
  return (
    <DbContext.Provider value={dbContextValue}>
      <SetupVisibleContext.Provider value={markSetupScreenReady}>
        <HomeVisibleContext.Provider value={homeContextValue}>
          <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
        </HomeVisibleContext.Provider>
      </SetupVisibleContext.Provider>
    </DbContext.Provider>
  );
}

export function useDbState(): DbContextValue {
  return useContext(DbContext);
}

/** Real first-launch / startup progress for the setup screen. */
export function useStartupProgress(): StartupProgress {
  return useContext(ProgressContext);
}

/** Signals that the branded setup screen has completed its first layout. */
export function useMarkSetupScreenReady(): () => void {
  return useContext(SetupVisibleContext);
}

/** Signals that Home has rendered its first data-backed (or actionable error) state. */
export function useMarkHomeScreenReady(): () => void {
  return useContext(HomeVisibleContext).markReady;
}

/** Resolves after Home reports its first data-backed (or actionable error) state. */
export function useWaitForHomeScreenReady(): () => Promise<void> {
  return useContext(HomeVisibleContext).waitUntilReady;
}

/** Only call below the ready gate in app/_layout.tsx. */
export function useDb(): SqlDb {
  const { state } = useContext(DbContext);
  if (state.status !== "ready") throw new Error("Database is not ready.");
  return state.db;
}
