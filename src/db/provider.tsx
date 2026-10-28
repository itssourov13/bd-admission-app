import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { openDatabaseAsync } from "expo-sqlite";
import type { SqlDb } from "./types";
import { createSqlDb, type RawDb } from "./adapter";
import { migrate } from "./schema";
import { ensureProfile } from "../repositories/userData";
import { closeStaleFlash } from "../repositories/sessions";
import { finalizeOverdueExam } from "../services/practiceService";
import { syncBundledPacks } from "../services/contentSync";
import { BUNDLED_PACKS } from "../content/bundledPacks";

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

/**
 * Opens SQLite, runs migrations, closes stale sessions, finalizes an exam that timed out while the app was closed and
 * syncs bundled question packs. Content failures are reported as warnings and never block the app; a database or
 * migration failure is shown as an error state with retry (no data is deleted).
 */
export function DbProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DbState>({ status: "loading", db: null, error: null, importIssues: [] });
  const [attempt, setAttempt] = useState(0);
  const opened = useRef<{ closeAsync(): Promise<void> } | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await openDatabaseAsync(DB_NAME);
        opened.current = raw;
        await raw.execAsync("PRAGMA journal_mode = WAL;");
        const db = createSqlDb(raw as unknown as RawDb);
        await migrate(db);
        const now = Date.now();
        await ensureProfile(db, now);
        await closeStaleFlash(db, now);
        await finalizeOverdueExam(db, now);
        const importIssues: string[] = [];
        try {
          const outcomes = await syncBundledPacks(db, BUNDLED_PACKS, now);
          outcomes.filter((o) => o.status === "failed").forEach((o) => importIssues.push(`${o.batchId ?? "pack"}: ${o.errors.slice(0, 3).join("; ")}`));
        } catch (error) {
          importIssues.push(error instanceof Error ? error.message : String(error));
        }
        if (active) setState({ status: "ready", db, error: null, importIssues });
      } catch (error) {
        if (active) setState({ status: "error", db: null, error: error instanceof Error ? error : new Error(String(error)), importIssues: [] });
      }
    })();
    return () => { active = false; };
  }, [attempt]);

  const retry = useCallback(() => { setState({ status: "loading", db: null, error: null, importIssues: [] }); setAttempt((n) => n + 1); }, []);
  return <DbContext.Provider value={{ state, retry }}>{children}</DbContext.Provider>;
}

export function useDbState(): DbContextValue {
  return useContext(DbContext);
}

/** Only call below the ready gate in app/_layout.tsx. */
export function useDb(): SqlDb {
  const { state } = useContext(DbContext);
  if (state.status !== "ready") throw new Error("Database is not ready.");
  return state.db;
}
