import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { openDatabaseAsync } from "expo-sqlite";
import type { SqlDb } from "./types";
import { createSqlDb, type RawDb } from "./adapter";
import { runStartup } from "../services/startup";
import {
  advanceProgress,
  INITIAL_STARTUP_PROGRESS,
  overallFraction,
  type StartupProgress
} from "../services/startupProgress";
import { loadBundledPacks } from "../content/loadBundledPacks";

export const DB_NAME = "bd-admission.db";

type DbState =
  | { status: "loading"; db: null; error: null; importIssues: string[] }
  | { status: "ready"; db: SqlDb; error: null; importIssues: string[] }
  | { status: "error"; db: null; error: Error; importIssues: string[] };

interface DbContextValue {
  state: DbState;
  retry: () => void;
}

const DbContext = createContext<DbContextValue>({ state: { status: "loading", db: null, error: null, importIssues: [] }, retry: () => undefined });
/** Separate context so the frequently changing setup progress never re-renders `useDbState` consumers. */
const ProgressContext = createContext<StartupProgress>(INITIAL_STARTUP_PROGRESS);
const SetupVisibleContext = createContext<() => void>(() => undefined);

/** Minimum gap between progress renders; stage and mode changes are always published immediately. */
const PROGRESS_EMIT_MS = 100;
/** Time-slice for yielding to the UI between pack imports so the setup screen keeps painting. */
const YIELD_SLICE_MS = 50;

/**
 * Opens SQLite, then runs the startup sequence (see services/startup.ts): migrations, closing stale sessions,
 * finalizing an exam that timed out while the app was closed and syncing bundled question packs. Real progress is
 * published through `useStartupProgress` for the setup screen. Individual pack failures are warnings; a database or
 * migration failure (or a first-launch import that produced nothing) is an error state with retry. No data is deleted.
 */
export function DbProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DbState>({ status: "loading", db: null, error: null, importIssues: [] });
  const [progress, setProgress] = useState<StartupProgress>(INITIAL_STARTUP_PROGRESS);
  const [attempt, setAttempt] = useState(0);
  const [setupScreenGate] = useState(() => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => { resolve = done; });
    return { promise, resolve };
  });
  const markSetupScreenReady = useCallback(() => { setupScreenGate.resolve(); }, [setupScreenGate]);
  const opened = useRef<{ closeAsync(): Promise<void> } | null>(null);

  useEffect(() => {
    let active = true;
    let current = advanceProgress(INITIAL_STARTUP_PROGRESS, {}, { reset: true });
    let lastEmit = 0;
    let lastYield = 0;
    let forceYield = false;

    const emit = (force: boolean) => {
      const at = Date.now();
      if (!active || (!force && at - lastEmit < PROGRESS_EMIT_MS)) return;
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

    void (async () => {
      try {
        // Let the setup screen paint before the first heavy step.
        await yieldToUi();
        const raw = await openDatabaseAsync(DB_NAME);
        opened.current = raw;
        await raw.execAsync("PRAGMA journal_mode = WAL;");
        const db = createSqlDb(raw as unknown as RawDb);
        const { importIssues } = await runStartup(db, {
          report,
          yieldToUi,
          waitForSetupScreen: () => setupScreenGate.promise,
          loadPacks: loadBundledPacks
        });
        report({ stage: "ready", fraction: overallFraction("ready") });
        emit(true);
        if (active) setState({ status: "ready", db, error: null, importIssues });
      } catch (error) {
        // Release the failed connection so a retry opens a fresh one. Stored data is not touched.
        const stale = opened.current;
        opened.current = null;
        if (stale) await stale.closeAsync().catch(() => undefined);
        if (active) {
          emit(true);
          setState({ status: "error", db: null, error: error instanceof Error ? error : new Error(String(error)), importIssues: [] });
        }
      }
    })();
    return () => { active = false; };
  }, [attempt, setupScreenGate]);

  const retry = useCallback(() => {
    setState({ status: "loading", db: null, error: null, importIssues: [] });
    setProgress(INITIAL_STARTUP_PROGRESS);
    setAttempt((n) => n + 1);
  }, []);
  const dbContextValue = useMemo(() => ({ state, retry }), [state, retry]);
  return (
    <DbContext.Provider value={dbContextValue}>
      <SetupVisibleContext.Provider value={markSetupScreenReady}>
        <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
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

/** Only call below the ready gate in app/_layout.tsx. */
export function useDb(): SqlDb {
  const { state } = useContext(DbContext);
  if (state.status !== "ready") throw new Error("Database is not ready.");
  return state.db;
}
