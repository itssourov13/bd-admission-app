// node:sqlite behind the same SqlDb adapter the app uses for expo-sqlite (build scripts and benchmarks only).
import { DatabaseSync } from "node:sqlite";
import { createSqlDb } from "../../src/db/adapter.ts";

export function openNodeDb(location) {
  const raw = new DatabaseSync(location);
  const rawDb = {
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params) {
      const r = raw.prepare(sql).run(...params);
      return { changes: Number(r.changes) };
    },
    async getAllAsync(sql, params) { return raw.prepare(sql).all(...params); },
    async getFirstAsync(sql, params) { return raw.prepare(sql).get(...params) ?? null; },
    async withTransactionAsync(task) {
      raw.exec("BEGIN");
      try {
        await task();
        raw.exec("COMMIT");
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    }
  };
  return Object.assign(createSqlDb(rawDb), { raw });
}
