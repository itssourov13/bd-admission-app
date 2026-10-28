/**
 * Minimal async SQL surface used by repositories, migrations and the importer.
 * expo-sqlite's SQLiteDatabase satisfies it structurally; tests provide an
 * adapter over node:sqlite, so SQL is exercised for real without React Native.
 */
export type SqlParam = string | number | null;
export type SqlRow = Record<string, unknown>;

export interface SqlDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlParam[]): Promise<{ changes: number }>;
  getAllAsync<T = SqlRow>(sql: string, params?: SqlParam[]): Promise<T[]>;
  getFirstAsync<T = SqlRow>(sql: string, params?: SqlParam[]): Promise<T | null>;
  /** Runs `task` inside one transaction; rolls back when it throws. */
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
