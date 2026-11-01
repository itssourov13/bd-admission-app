import type { SqlDb } from "../db/types.ts";
import { importQuestionPack, packSignature, type ImportReport } from "./importer.ts";

export interface SyncOutcome {
  batchId: string | null;
  status: "imported" | "unchanged" | "failed";
  report?: ImportReport;
  errors: string[];
}

/** Real work counters reported while syncing. `index` packs of `total` have been processed (including failures). */
export interface SyncProgress {
  index: number;
  total: number;
  questionsDone: number;
  questionsTotal: number;
  batchId: string | null;
  status: SyncOutcome["status"] | null;
}

/** May return a promise (e.g. to yield to the UI). Errors are swallowed: progress reporting is cosmetic. */
export type SyncProgressListener = (progress: SyncProgress) => void | Promise<void>;

function questionCount(pack: unknown): number {
  const questions = (pack as { questions?: unknown } | null)?.questions;
  return Array.isArray(questions) ? questions.length : 0;
}

/** True once any question batch exists, i.e. this database has had content imported before (not a first launch). */
export async function hasImportedBatches(db: SqlDb): Promise<boolean> {
  const row = await db.getFirstAsync<{ id: string }>("SELECT id FROM question_batches LIMIT 1");
  return row !== null && row !== undefined;
}

/**
 * Imports bundled question packs at startup. A pack whose signature already matches the stored batch is
 * skipped (no per-question queries), so returning launches avoid re-importing unchanged content. One bad pack never blocks the others, and a
 * failed import rolls back completely (see importQuestionPack).
 *
 * `onProgress` is called once before any work (index 0) and after every pack attempt, so a UI can show real progress.
 */
export async function syncBundledPacks(
  db: SqlDb,
  packs: readonly unknown[],
  now = Date.now(),
  onProgress?: SyncProgressListener
): Promise<SyncOutcome[]> {
  const outcomes: SyncOutcome[] = [];
  const counts = packs.map(questionCount);
  const questionsTotal = counts.reduce((sum, n) => sum + n, 0);
  let questionsDone = 0;

  const notify = async (index: number, batchId: string | null, status: SyncOutcome["status"] | null): Promise<void> => {
    if (!onProgress) return;
    try {
      await onProgress({ index, total: packs.length, questionsDone, questionsTotal, batchId, status });
    } catch {
      // Progress display must never affect the import.
    }
  };

  await notify(0, null, null);
  for (let i = 0; i < packs.length; i++) {
    const pack = packs[i];
    const batchId = (pack as { batch?: { id?: unknown } } | null)?.batch?.id;
    let outcome: SyncOutcome | null = null;
    if (typeof batchId === "string") {
      const row = await db.getFirstAsync<{ pack_signature: string | null }>("SELECT pack_signature FROM question_batches WHERE id = ?", [batchId]);
      if (row && row.pack_signature === packSignature(pack)) outcome = { batchId, status: "unchanged", errors: [] };
    }
    if (!outcome) {
      const report = await importQuestionPack(db, pack, now);
      outcome = { batchId: report.batchId, status: report.ok ? "imported" : "failed", report, errors: report.errors };
    }
    outcomes.push(outcome);
    questionsDone += counts[i];
    await notify(i + 1, outcome.batchId, outcome.status);
  }
  return outcomes;
}
