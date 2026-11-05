import type { SqlDb } from "../db/types.ts";
import { migrate } from "../db/schema.ts";
import type { QuestionPack } from "../types/question-pack.ts";
import { computeSeedId, SEED_FORMAT, SEED_META_DDL, type BundledPackEntry, type ContentManifest } from "../content/seedFormat.ts";
import { importQuestionPack, packSignature } from "./importer.ts";

/**
 * Builds the content seed inside an empty database (build time / tests; the app never calls this).
 * Runs the real migrations and the real importer over each pack in order, so the seed holds exactly what a sequential
 * import would produce. Throws on the first pack that fails; the build must never ship a partial seed.
 * `now` is fixed (default 0) so the seed does not depend on the build time; real timestamps are written when the
 * app copies content into the user's database.
 */
export async function buildSeedDatabase(db: SqlDb, packs: readonly unknown[], now = 0): Promise<ContentManifest> {
  await migrate(db);
  const entries: BundledPackEntry[] = [];
  const replacePapers: { batchId: string; paperId: string }[] = [];
  const seen = new Set<string>();

  for (const [index, pack] of packs.entries()) {
    const report = await importQuestionPack(db, pack, now);
    if (!report.ok || !report.batchId) {
      throw new Error(`Pack #${index} (${report.batchId ?? "unknown batch"}) failed: ${report.errors.slice(0, 3).join("; ")}`);
    }
    if (seen.has(report.batchId)) throw new Error(`Duplicate batch id ${report.batchId}; batch ids must be unique across packs.`);
    seen.add(report.batchId);
    const p = pack as QuestionPack;
    entries.push({ batchId: report.batchId, signature: packSignature(pack), questions: p.questions.length });
    if (p.replaceExistingPaperContent) for (const paper of p.papers) replacePapers.push({ batchId: report.batchId, paperId: paper.id });
  }

  const manifest: ContentManifest = { seedFormat: SEED_FORMAT, seedId: computeSeedId(entries), packs: entries };
  await db.execAsync(SEED_META_DDL);
  await db.withTransactionAsync(async (tx) => {
    await tx.runAsync("INSERT INTO seed_meta (key, value) VALUES ('format', ?), ('seed_id', ?)", [String(SEED_FORMAT), manifest.seedId]);
    for (const [ordinal, e] of entries.entries()) {
      await tx.runAsync("INSERT INTO seed_packs (batch_id, ordinal, pack_signature, question_count) VALUES (?, ?, ?, ?)", [e.batchId, ordinal, e.signature, e.questions]);
    }
    for (const r of replacePapers) await tx.runAsync("INSERT INTO seed_replace_papers (batch_id, paper_id) VALUES (?, ?)", [r.batchId, r.paperId]);
  });
  return manifest;
}
