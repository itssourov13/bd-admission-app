import { DatabaseSync } from "node:sqlite";
import type { SqlDb, SqlParam } from "../src/db/types.ts";
import { migrate } from "../src/db/schema.ts";
import type { QuestionPack } from "../src/types/question-pack.ts";

/** node:sqlite adapter implementing the same SqlDb contract expo-sqlite provides. */
export function openMemoryDb(): SqlDb & { raw: DatabaseSync } {
  const raw = new DatabaseSync(":memory:");
  let depth = 0;
  return {
    raw,
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params: SqlParam[] = []) {
      const r = raw.prepare(sql).run(...params);
      return { changes: Number(r.changes) };
    },
    async getAllAsync<T>(sql: string, params: SqlParam[] = []) { return raw.prepare(sql).all(...params) as T[]; },
    async getFirstAsync<T>(sql: string, params: SqlParam[] = []) { return (raw.prepare(sql).get(...params) as T | undefined) ?? null; },
    async withTransactionAsync(task) {
      if (depth > 0) throw new Error("nested transaction");
      depth++;
      raw.exec("BEGIN");
      try {
        await task();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      } finally {
        depth--;
      }
    }
  };
}

export async function freshDb() {
  const db = openMemoryDb();
  await migrate(db);
  return db;
}

/** SYNTHETIC test data only. Never presented as genuine historical questions. */
export function syntheticPack(overrides: Partial<QuestionPack> = {}, count = 3): QuestionPack {
  const questions = Array.from({ length: count }, (_, i) => ({
    id: `q-syn-${i + 1}`,
    text: `Synthetic question ${i + 1}`,
    type: "single_choice" as const,
    category: "varsity" as const,
    subject: "Synthetic",
    options: [
      { id: "a", text: "Option A", order: 1 },
      { id: "b", text: "Option B", order: 2 },
      { id: "c", text: "Option C", order: 3 },
      { id: "d", text: "Option D", order: 4 }
    ],
    correctOptionIds: ["b"],
    answerVerificationStatus: "verified" as const,
    contentVerificationStatus: "verified" as const,
    appearances: [{ paperId: "paper-syn-2025", questionNumber: i + 1, pageNumber: 1, sourceDocumentId: "src-syn" }],
    source: { documentId: "src-syn", pageNumber: 1, questionNumber: i + 1 }
  }));
  return {
    schemaVersion: 1,
    batch: { id: "batch-syn", category: "varsity", description: "synthetic", sourceDocumentIds: ["src-syn"] },
    sourceDocuments: [{ id: "src-syn", filename: "synthetic.json", sourceType: "structured-data" }],
    institutions: [{ id: "inst-syn", code: "SYN", name: "Synthetic University" }],
    papers: [{ id: "paper-syn-2025", institutionId: "inst-syn", category: "varsity", year: 2025, unit: "A" }],
    examRules: [{ id: "rule-syn", paperId: "paper-syn-2025", correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, verificationStatus: "illustrative" }],
    questions,
    ...overrides
  };
}
