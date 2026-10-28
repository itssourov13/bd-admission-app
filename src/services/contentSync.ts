import type { SqlDb } from "../db/types.ts";
import { importQuestionPack, packSignature, type ImportReport } from "./importer.ts";

export interface SyncOutcome {
  batchId: string | null;
  status: "imported" | "unchanged" | "failed";
  report?: ImportReport;
  errors: string[];
}

/**
 * Imports bundled question packs at startup. A pack whose signature already matches the stored batch is
 * skipped (no per-question queries), so cold start stays fast. One bad pack never blocks the others, and a
 * failed import rolls back completely (see importQuestionPack).
 */
export async function syncBundledPacks(db: SqlDb, packs: readonly unknown[], now = Date.now()): Promise<SyncOutcome[]> {
  const outcomes: SyncOutcome[] = [];
  for (const pack of packs) {
    const batchId = (pack as { batch?: { id?: unknown } } | null)?.batch?.id;
    if (typeof batchId === "string") {
      const row = await db.getFirstAsync<{ pack_signature: string | null }>("SELECT pack_signature FROM question_batches WHERE id = ?", [batchId]);
      if (row && row.pack_signature === packSignature(pack)) {
        outcomes.push({ batchId, status: "unchanged", errors: [] });
        continue;
      }
    }
    const report = await importQuestionPack(db, pack, now);
    outcomes.push({ batchId: report.batchId, status: report.ok ? "imported" : "failed", report, errors: report.errors });
  }
  return outcomes;
}
