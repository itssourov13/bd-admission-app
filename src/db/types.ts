/**
 * Minimal async SQL surface used by repositories, migrations and the importer.
 * `createSqlDb` (src/db/adapter.ts) adapts expo-sqlite to it; tests adapt node:sqlite through
 * the same adapter, so SQL and transaction serialization are exercised for real without React Native.
 */
export type SqlParam = string | number | null;
export type SqlRow = Record<string, unknown>;

export interface SqlDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlParam[]): Promise<{ changes: number }>;
  getAllAsync<T = SqlRow>(sql: string, params?: SqlParam[]): Promise<T[]>;
  getFirstAsync<T = SqlRow>(sql: string, params?: SqlParam[]): Promise<T | null>;
  /**
   * Runs `task` inside one transaction and rolls back when it throws. All statements inside the task
   * MUST use the `tx` handle. Calls made on the outer handle wait until the transaction ends, so a
   * concurrent UI query can never be swallowed by (or roll back with) someone else's transaction.
   */
  withTransactionAsync(task: (tx: SqlDb) => Promise<void>): Promise<void>;
}
