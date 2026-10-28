import type { SqlDb, SqlParam } from "./types.ts";

/** The subset of expo-sqlite's SQLiteDatabase (and of the node:sqlite test adapter) the app needs. */
export interface RawDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlParam[]): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlParam[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/**
 * Wraps one connection so transactions are strictly serialized and isolated:
 * - only one transaction runs at a time (a second caller waits instead of nesting and failing);
 * - statements issued outside the active transaction wait for it to finish;
 * - statements inside the task go through the `tx` handle on the same connection (foreign keys stay enforced).
 */
export function createSqlDb(raw: RawDb): SqlDb {
  let active: Promise<void> | null = null;

  const direct = {
    execAsync: (sql: string) => raw.execAsync(sql),
    runAsync: (sql: string, params: SqlParam[] = []) => raw.runAsync(sql, params),
    getAllAsync: <T>(sql: string, params: SqlParam[] = []) => raw.getAllAsync<T>(sql, params),
    getFirstAsync: <T>(sql: string, params: SqlParam[] = []) => raw.getFirstAsync<T>(sql, params)
  };

  const txHandle: SqlDb = {
    ...direct,
    withTransactionAsync: () => Promise.reject(new Error("Nested transactions are not supported."))
  };

  return {
    // The wait loop and the statement/transaction start must not be separated by an await:
    // otherwise two callers could both observe "idle" and start overlapping transactions.
    execAsync: async (sql) => { while (active) await active; return direct.execAsync(sql); },
    runAsync: async (sql, params) => { while (active) await active; return direct.runAsync(sql, params); },
    getAllAsync: async <T>(sql: string, params?: SqlParam[]) => { while (active) await active; return direct.getAllAsync<T>(sql, params); },
    getFirstAsync: async <T>(sql: string, params?: SqlParam[]) => { while (active) await active; return direct.getFirstAsync<T>(sql, params); },
    async withTransactionAsync(task) {
      while (active) await active;
      let release!: () => void;
      active = new Promise<void>((resolve) => { release = resolve; });
      try {
        await raw.withTransactionAsync(() => task(txHandle));
      } finally {
        active = null;
        release();
      }
    }
  };
}
