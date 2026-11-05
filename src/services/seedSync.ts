import type { SqlDb } from "../db/types.ts";
import { SEED_FORMAT, type ContentManifest, type BundledPackEntry } from "../content/seedFormat.ts";
import type { SyncOutcome, SyncProgress, SyncProgressListener } from "./contentSync.ts";
import { NOOP_METRICS, type StartupMetrics } from "./perf.ts";

/** A readable copy of the bundled seed on disk. `release` removes the temporary copy. */
export interface SeedHandle {
  /** Absolute filesystem path (not a file:// URI) usable in `ATTACH DATABASE`. */
  path: string;
  release(): Promise<void>;
}

export interface SeedSyncOptions {
  manifest: ContentManifest;
  /** Materializes the bundled seed on disk. Only called when at least one pack is pending. */
  openSeed(): Promise<SeedHandle>;
  now?: number;
  onProgress?: SyncProgressListener;
  metrics?: StartupMetrics;
}

const SHARED_STATEMENTS = [
  `INSERT INTO institutions (id, code, name)
   SELECT id, code, name FROM seed.institutions WHERE true
   ON CONFLICT(id) DO UPDATE SET code = excluded.code, name = excluded.name
   WHERE institutions.code IS NOT excluded.code OR institutions.name IS NOT excluded.name`,
  `INSERT INTO exam_papers (id, institution_id, category, year, academic_session, unit, title)
   SELECT id, institution_id, category, year, academic_session, unit, title FROM seed.exam_papers WHERE true
   ON CONFLICT(id) DO UPDATE SET institution_id = excluded.institution_id, category = excluded.category, year = excluded.year,
     academic_session = excluded.academic_session, unit = excluded.unit, title = excluded.title
   WHERE exam_papers.institution_id IS NOT excluded.institution_id OR exam_papers.category IS NOT excluded.category
     OR exam_papers.year IS NOT excluded.year OR exam_papers.academic_session IS NOT excluded.academic_session
     OR exam_papers.unit IS NOT excluded.unit OR exam_papers.title IS NOT excluded.title`,
  `INSERT INTO exam_rules (id, paper_id, correct_marks, incorrect_penalty, unanswered_marks, duration_seconds, total_questions, total_marks, verification_status, source_note, selection_config)
   SELECT id, paper_id, correct_marks, incorrect_penalty, unanswered_marks, duration_seconds, total_questions, total_marks, verification_status, source_note, selection_config FROM seed.exam_rules WHERE true
   ON CONFLICT(id) DO UPDATE SET paper_id = excluded.paper_id, correct_marks = excluded.correct_marks, incorrect_penalty = excluded.incorrect_penalty,
     unanswered_marks = excluded.unanswered_marks, duration_seconds = excluded.duration_seconds, total_questions = excluded.total_questions,
     total_marks = excluded.total_marks, verification_status = excluded.verification_status, source_note = excluded.source_note, selection_config = excluded.selection_config
   WHERE exam_rules.paper_id IS NOT excluded.paper_id OR exam_rules.correct_marks IS NOT excluded.correct_marks
     OR exam_rules.incorrect_penalty IS NOT excluded.incorrect_penalty OR exam_rules.unanswered_marks IS NOT excluded.unanswered_marks
     OR exam_rules.duration_seconds IS NOT excluded.duration_seconds OR exam_rules.total_questions IS NOT excluded.total_questions
     OR exam_rules.total_marks IS NOT excluded.total_marks OR exam_rules.verification_status IS NOT excluded.verification_status
     OR exam_rules.source_note IS NOT excluded.source_note OR exam_rules.selection_config IS NOT excluded.selection_config`
] as const;

const BATCH_ROW = `INSERT INTO question_batches (id, category, description, schema_version, imported_at, updated_at, import_count, pack_signature)
  SELECT id, category, description, schema_version, ?, ?, 1, pack_signature FROM seed.question_batches WHERE id = ?
  ON CONFLICT(id) DO UPDATE SET description = excluded.description, updated_at = excluded.updated_at,
    import_count = question_batches.import_count + 1, pack_signature = excluded.pack_signature`;

const SOURCE_DOCUMENTS = `INSERT INTO source_documents (id, batch_id, filename, title, sha256, source_type, notes)
  SELECT id, batch_id, filename, title, sha256, source_type, notes FROM seed.source_documents WHERE batch_id = ?
  ON CONFLICT(id) DO UPDATE SET filename = excluded.filename, title = excluded.title, sha256 = excluded.sha256,
    source_type = excluded.source_type, notes = excluded.notes`;

const QUESTIONS = `INSERT INTO questions (id, batch_id, category, text, type, subject, topic, answer_status, content_status, explanation, asset_paths, content_hash)
  SELECT id, batch_id, category, text, type, subject, topic, answer_status, content_status, explanation, asset_paths, content_hash FROM seed.questions WHERE batch_id = ?
  ON CONFLICT(id) DO UPDATE SET category = excluded.category, text = excluded.text, type = excluded.type, subject = excluded.subject,
    topic = excluded.topic, answer_status = excluded.answer_status, content_status = excluded.content_status,
    explanation = excluded.explanation, asset_paths = excluded.asset_paths, content_hash = excluded.content_hash
  WHERE questions.content_hash <> excluded.content_hash`;

const OPTIONS = `INSERT OR IGNORE INTO question_options (question_id, option_key, text, sort_order, is_correct)
  SELECT o.question_id, o.option_key, o.text, o.sort_order, o.is_correct
  FROM seed.question_options o JOIN seed.questions q ON q.id = o.question_id WHERE q.batch_id = ?`;

const SOURCES = `INSERT INTO question_sources (question_id, source_document_id, page_number, question_number)
  SELECT s.question_id, s.source_document_id, s.page_number, s.question_number
  FROM seed.question_sources s JOIN seed.questions q ON q.id = s.question_id WHERE q.batch_id = ?
  ON CONFLICT(question_id) DO UPDATE SET source_document_id = excluded.source_document_id, page_number = excluded.page_number, question_number = excluded.question_number`;

const APPEARANCES = `INSERT OR IGNORE INTO question_appearances (question_id, paper_id, question_number, page_number, source_document_id)
  SELECT a.question_id, a.paper_id, a.question_number, a.page_number, a.source_document_id
  FROM seed.question_appearances a JOIN seed.questions q ON q.id = a.question_id WHERE q.batch_id = ? ORDER BY a.id`;

/** Replacement packs own the appearances of their papers: clear them, then restore every seed appearance for those papers. */
const REPLACE_DELETE = `DELETE FROM question_appearances WHERE paper_id IN (SELECT paper_id FROM seed.seed_replace_papers WHERE batch_id = ?)`;
const REPLACE_RESTORE = `INSERT OR IGNORE INTO question_appearances (question_id, paper_id, question_number, page_number, source_document_id)
  SELECT a.question_id, a.paper_id, a.question_number, a.page_number, a.source_document_id
  FROM seed.question_appearances a
  WHERE a.paper_id IN (SELECT paper_id FROM seed.seed_replace_papers WHERE batch_id = ?)
    AND a.question_id IN (SELECT id FROM questions) ORDER BY a.id`;

const OPTIONS_OF_CHANGED = `DELETE FROM question_options WHERE question_id IN (
  SELECT s.id FROM seed.questions s JOIN questions m ON m.id = s.id WHERE s.batch_id = ? AND m.content_hash <> s.content_hash)`;

const FOREIGN_QUESTION = `SELECT s.id AS id, m.batch_id AS owner FROM seed.questions s JOIN questions m ON m.id = s.id WHERE s.batch_id = ? AND m.batch_id <> s.batch_id LIMIT 1`;
const FOREIGN_SOURCE = `SELECT s.id AS id, m.batch_id AS owner FROM seed.source_documents s JOIN source_documents m ON m.id = s.id WHERE s.batch_id = ? AND m.batch_id <> s.batch_id LIMIT 1`;
const MISSING_QUESTIONS = `SELECT COUNT(*) AS n FROM seed.questions s LEFT JOIN questions m ON m.id = s.id WHERE s.batch_id = ? AND m.id IS NULL`;
const SEED_QUESTION_COUNT = `SELECT COUNT(*) AS n FROM seed.questions WHERE batch_id = ?`;
const HAS_REPLACE = `SELECT 1 AS x FROM seed.seed_replace_papers WHERE batch_id = ? LIMIT 1`;

/**
 * Copies ONE pack from the attached seed using set-based SQL instead of per-row work. Must run inside a transaction.
 * The batch's `pack_signature` is written in the same transaction as its content, so a committed signature is the
 * durable per-pack checkpoint: a pack is either fully present with its signature or not present at all.
 * Only content tables are written. User-owned tables are never touched; question options are replaced only for
 * questions whose content hash changed (the importer's rule), and no question row is ever deleted.
 */
async function copyBatchIn(tx: SqlDb, entry: BundledPackEntry, now: number, metrics: StartupMetrics): Promise<void> {
  const expected = await tx.getFirstAsync<{ n: number }>(SEED_QUESTION_COUNT, [entry.batchId]);
  if (Number(expected?.n ?? 0) !== entry.questions) {
    throw new Error(`Bundled seed holds ${expected?.n ?? 0} questions for ${entry.batchId}; the app expects ${entry.questions}.`);
  }
  const foreignQuestion = await tx.getFirstAsync<{ id: string; owner: string }>(FOREIGN_QUESTION, [entry.batchId]);
  if (foreignQuestion) throw new Error(`Question ${foreignQuestion.id} already exists in batch ${foreignQuestion.owner}; ids must be unique across batches.`);
  const foreignSource = await tx.getFirstAsync<{ id: string; owner: string }>(FOREIGN_SOURCE, [entry.batchId]);
  if (foreignSource) throw new Error(`Source document ${foreignSource.id} belongs to another batch (${foreignSource.owner}).`);

  await tx.runAsync(BATCH_ROW, [now, now, entry.batchId]);
  await tx.runAsync(SOURCE_DOCUMENTS, [entry.batchId]);
  const replaces = (await tx.getFirstAsync(HAS_REPLACE, [entry.batchId])) !== null;
  if (replaces) await tx.runAsync(REPLACE_DELETE, [entry.batchId]);
  await metrics.span("content.batch.questionWrites", async () => {
    await tx.runAsync(OPTIONS_OF_CHANGED, [entry.batchId]);
    await tx.runAsync(QUESTIONS, [entry.batchId]);
    await tx.runAsync(OPTIONS, [entry.batchId]);
  });
  await tx.runAsync(SOURCES, [entry.batchId]);
  await tx.runAsync(APPEARANCES, [entry.batchId]);
  if (replaces) await tx.runAsync(REPLACE_RESTORE, [entry.batchId]);

  const missing = await tx.getFirstAsync<{ n: number }>(MISSING_QUESTIONS, [entry.batchId]);
  if (Number(missing?.n ?? 0) !== 0) throw new Error(`Batch ${entry.batchId} is incomplete after copying; rolled back.`);
}

/** Question budget per transaction. Fewer commits is the main speed-up; the cap keeps a rollback and a UI stall small. */
export const GROUP_QUESTION_BUDGET = 1500;

/** Splits pending packs, in manifest order, into groups of consecutive packs that stay within the question budget. */
export function groupPending<T extends { entry: BundledPackEntry }>(pending: readonly T[], budget: number = GROUP_QUESTION_BUDGET): T[][] {
  const groups: T[][] = [];
  let current: T[] = [];
  let size = 0;
  for (const item of pending) {
    if (current.length > 0 && size + item.entry.questions > budget) {
      groups.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += item.entry.questions;
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

async function attachSeed(db: SqlDb, path: string): Promise<void> {
  // A previous attempt on this connection may have left the seed attached.
  try { await db.execAsync("DETACH DATABASE seed"); } catch { /* not attached */ }
  await db.execAsync(`ATTACH DATABASE '${path.replace(/'/g, "''")}' AS seed`);
}

async function verifySeed(db: SqlDb, manifest: ContentManifest): Promise<void> {
  const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM seed.seed_meta");
  const meta = new Map(rows.map((r) => [r.key, r.value]));
  if (meta.get("format") !== String(SEED_FORMAT) || meta.get("format") !== String(manifest.seedFormat)) {
    throw new Error(`Bundled content seed format ${meta.get("format") ?? "?"} is not supported (expected ${SEED_FORMAT}).`);
  }
  if (meta.get("seed_id") !== manifest.seedId) throw new Error("Bundled content seed does not match this app build.");

  const packs = await db.getAllAsync<{
    batch_id: string;
    ordinal: number;
    pack_signature: string;
    question_count: number;
    stored_signature: string | null;
    actual_questions: number;
  }>(
    "SELECT p.batch_id, p.ordinal, p.pack_signature, p.question_count, b.pack_signature AS stored_signature, COUNT(q.id) AS actual_questions " +
    "FROM seed.seed_packs p " +
    "LEFT JOIN seed.question_batches b ON b.id = p.batch_id " +
    "LEFT JOIN seed.questions q ON q.batch_id = p.batch_id " +
    "GROUP BY p.batch_id, p.ordinal, p.pack_signature, p.question_count, b.pack_signature " +
    "ORDER BY p.ordinal"
  );
  if (packs.length !== manifest.packs.length) {
    throw new Error(`Bundled seed has ${packs.length} pack records; this app expects ${manifest.packs.length}.`);
  }
  for (const [index, expected] of manifest.packs.entries()) {
    const actual = packs[index];
    if (
      actual.batch_id !== expected.batchId ||
      actual.ordinal !== index ||
      actual.pack_signature !== expected.signature ||
      actual.question_count !== expected.questions ||
      actual.stored_signature !== expected.signature ||
      actual.actual_questions !== expected.questions
    ) {
      throw new Error(`Bundled seed pack ${expected.batchId} is missing, incomplete, or mismatched.`);
    }
  }
}

/**
 * Brings the user's database up to the bundled content using the pre-built seed.
 *
 *  1. One query reads the stored signature of every batch; packs whose signature equals the manifest are UNCHANGED and cost nothing
 *     (the seed asset is not even copied when nothing is pending: this is the returning-launch fast path).
 *  2. Otherwise the seed is copied to a temporary file, attached (the app issues no writes to it), and verified. Pending
 *     packs are committed in bounded groups of at most 1,500 questions; every batch signature is written in the same
 *     transaction as its rows. A process interruption rolls back the active group and the next launch resumes from the
 *     first pack whose signature was not committed.
 *  3. If a group fails, it is rolled back and retried one pack at a time so a single bad pack cannot block its neighbours.
 *
 * Never overwrites the user's database file and never touches user-owned tables.
 */
export async function syncFromSeed(db: SqlDb, options: SeedSyncOptions): Promise<SyncOutcome[]> {
  const { manifest, openSeed, onProgress } = options;
  const metrics = options.metrics ?? NOOP_METRICS;
  const now = options.now ?? Date.now();
  const total = manifest.packs.length;
  const questionsTotal = manifest.packs.reduce((sum, p) => sum + p.questions, 0);
  let questionsDone = 0;
  let index = 0;

  const notify = async (batchId: string | null, status: SyncOutcome["status"] | null): Promise<void> => {
    if (!onProgress) return;
    const progress: SyncProgress = { index, total, questionsDone, questionsTotal, batchId, status };
    try {
      await onProgress(progress);
    } catch {
      // Progress display must never affect the content sync.
    }
  };

  const stored = await metrics.span("content.plan", async () => {
    const rows = await db.getAllAsync<{ id: string; pack_signature: string | null }>("SELECT id, pack_signature FROM question_batches");
    return new Map(rows.map((r) => [r.id, r.pack_signature]));
  });

  const outcomes: SyncOutcome[] = new Array(total);
  const pending: { entry: BundledPackEntry; at: number }[] = [];
  manifest.packs.forEach((entry, at) => {
    if (stored.get(entry.batchId) === entry.signature) {
      outcomes[at] = { batchId: entry.batchId, status: "unchanged", errors: [] };
      questionsDone += entry.questions;
      index += 1;
    } else {
      pending.push({ entry, at });
    }
  });
  metrics.count("content.packs.total", total);
  metrics.count("content.packs.unchanged", total - pending.length);
  metrics.count("content.packs.pending", pending.length);

  await notify(null, null);
  if (pending.length === 0) return outcomes;

  let handle: SeedHandle | null = null;
  let attached = false;
  let previousSync: number | null = null;
  try {
    handle = await metrics.span("content.seedCopy", () => openSeed());
    await metrics.span("content.seedAttach", async () => {
      await attachSeed(db, handle!.path);
      attached = true;
      await verifySeed(db, manifest);
    });
    // Content copy only: NORMAL avoids an fsync per group commit. After an OS/power failure a recent group may be lost;
    // its signatures and rows roll back together, so the next launch simply retries that group.
    previousSync = (await db.getFirstAsync<{ synchronous: number }>("PRAGMA synchronous"))?.synchronous ?? null;
    await db.execAsync("PRAGMA synchronous = NORMAL");
    await metrics.span("content.shared", () => db.withTransactionAsync(async (tx) => {
      for (const sql of SHARED_STATEMENTS) await tx.runAsync(sql);
    }));

    const settle = async (entry: BundledPackEntry, at: number, outcome: SyncOutcome): Promise<void> => {
      outcomes[at] = outcome;
      if (outcome.status === "imported") {
        metrics.count("content.packs.imported");
        metrics.count("content.questions.copied", entry.questions);
      } else {
        metrics.count("content.packs.failed");
      }
      questionsDone += entry.questions;
      index += 1;
      await notify(entry.batchId, outcome.status);
    };
    const failure = (error: unknown): SyncOutcome["errors"] => [error instanceof Error ? error.message : String(error)];

    for (const group of groupPending(pending)) {
      try {
        // One commit for the whole group: all-or-nothing, so a committed signature still means "this pack is complete".
        await metrics.span("content.group", () => db.withTransactionAsync(async (tx) => {
          for (const { entry } of group) await copyBatchIn(tx, entry, now, metrics);
        }));
        for (const { entry, at } of group) await settle(entry, at, { batchId: entry.batchId, status: "imported", errors: [] });
      } catch (groupError) {
        if (group.length === 1) {
          const { entry, at } = group[0];
          await settle(entry, at, { batchId: entry.batchId, status: "failed", errors: failure(groupError) });
          continue;
        }
        // The group rolled back as a whole. Retry its packs one by one so a single bad pack cannot block its neighbours.
        metrics.count("content.groups.fallback");
        for (const { entry, at } of group) {
          try {
            await metrics.span("content.batch", () => db.withTransactionAsync((tx) => copyBatchIn(tx, entry, now, metrics)));
            await settle(entry, at, { batchId: entry.batchId, status: "imported", errors: [] });
          } catch (error) {
            await settle(entry, at, { batchId: entry.batchId, status: "failed", errors: failure(error) });
          }
        }
      }
    }
    return outcomes;
  } finally {
    if (previousSync !== null) await db.execAsync(`PRAGMA synchronous = ${previousSync}`).catch(() => undefined);
    if (attached) await db.execAsync("DETACH DATABASE seed").catch(() => undefined);
    if (handle) await handle.release().catch(() => undefined);
  }
}
