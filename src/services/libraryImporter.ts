import type { SqlDb, SqlParam } from "../db/types.ts";
import type { LibraryPack } from "../types/library-pack.ts";
import type { QuestionPackItem } from "../types/question-pack.ts";
import { contentHash } from "./importer.ts";
import { validateLibraryPack } from "./libraryPackValidator.ts";
import { refreshBookCounts } from "../repositories/library.ts";

export interface LibraryInstallReport {
  ok: boolean;
  bookId: string | null;
  errors: string[];
  warnings: string[];
  /** Version that was installed before this call (null = first install). */
  previousVersion: number | null;
  questions: { inserted: number; updated: number; skipped: number };
  units: number;
  memberships: number;
}

export interface LibraryInstallOptions {
  /** 'bundled' for packs shipped inside the app, 'installed' (default) for downloaded/imported packs. */
  installState?: "bundled" | "installed";
  now?: number;
}

export const libraryBatchId = (bookId: string): string => `lib-${bookId}`;

const MAX_PARAMS = 900;

/** Multi-row INSERT in chunks that stay under SQLite's host-parameter limit (set-based instead of one round trip per row). */
async function insertRows(tx: SqlDb, head: string, tail: string, columns: number, rows: SqlParam[][]): Promise<void> {
  if (rows.length === 0) return;
  const perChunk = Math.max(1, Math.floor(MAX_PARAMS / columns));
  const group = `(${new Array(columns).fill("?").join(",")})`;
  for (let i = 0; i < rows.length; i += perChunk) {
    const part = rows.slice(i, i + perChunk);
    await tx.runAsync(`${head} VALUES ${part.map(() => group).join(",")}${tail}`, part.flat());
  }
}

function emptyReport(bookId: string | null): LibraryInstallReport {
  return { ok: false, bookId, errors: [], warnings: [], previousVersion: null, questions: { inserted: 0, updated: 0, skipped: 0 }, units: 0, memberships: 0 };
}

/**
 * Installs (or updates/reinstalls) one library pack in ONE transaction; any failure rolls everything back.
 *
 * - Identity: question ids are unique across all batches; an id already owned by a university pack is refused, never merged.
 * - Updates: the book's units and membership are replaced. Questions that left the book keep their rows (bookmarks,
 *   session answers and results still resolve) but drop out of the book's practice pool.
 * - Downgrades are refused; re-installing the same version is allowed (restores a removed book).
 * - User-owned tables are never touched.
 */
export async function installLibraryPack(db: SqlDb, pack: unknown, opts: LibraryInstallOptions = {}): Promise<LibraryInstallReport> {
  const validation = validateLibraryPack(pack);
  const maybeId = (pack as { book?: { id?: unknown } } | null)?.book?.id;
  const report = emptyReport(typeof maybeId === "string" ? maybeId : null);
  report.warnings = validation.warnings;
  if (!validation.valid) { report.errors = validation.errors; return report; }
  const p = pack as LibraryPack;
  const now = opts.now ?? Date.now();
  const bookId = p.book.id;
  const batchId = libraryBatchId(bookId);
  const hasQuestions = p.questions.length > 0;
  const state = hasQuestions ? (opts.installState ?? "installed") : "catalogue_only";
  const category = p.book.targetCategory !== "general" ? p.book.targetCategory : (p.questions[0]?.category ?? "varsity");

  try {
    await db.withTransactionAsync(async (tx) => {
      const existing = await tx.getFirstAsync<{ content_version: number }>("SELECT content_version FROM content_books WHERE id = ?", [bookId]);
      if (existing) {
        report.previousVersion = Number(existing.content_version);
        if (report.previousVersion > p.book.contentVersion) {
          throw new Error(`Installed version ${report.previousVersion} is newer than package version ${p.book.contentVersion}; downgrade refused.`);
        }
      }

      const pub = p.publisher;
      await tx.runAsync(
        `INSERT INTO publishers (id, slug, name, name_bn, kind, description, website, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, name_bn = COALESCE(excluded.name_bn, publishers.name_bn),
           kind = excluded.kind, description = COALESCE(excluded.description, publishers.description),
           website = COALESCE(excluded.website, publishers.website), updated_at = excluded.updated_at`,
        [pub.id, pub.slug, pub.name, pub.nameBn ?? null, pub.kind ?? "publisher", pub.description ?? null, pub.website ?? null, now]
      );

      // Batch row exists only because questions.batch_id is a required FK; library batches carry no pack signature,
      // so startup content sync (which reconciles seed packs by signature) never treats them as pending or stale.
      await tx.runAsync(
        `INSERT INTO question_batches (id, category, description, schema_version, imported_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET description = excluded.description, updated_at = excluded.updated_at, import_count = import_count + 1`,
        [batchId, category, `Library: ${p.book.title}`, now, now]
      );

      for (const d of p.sourceDocuments) {
        const owner = await tx.getFirstAsync<{ batch_id: string }>("SELECT batch_id FROM source_documents WHERE id = ?", [d.id]);
        if (owner && owner.batch_id !== batchId) throw new Error(`Source document ${d.id} belongs to another batch (${owner.batch_id}).`);
        await tx.runAsync(
          `INSERT INTO source_documents (id, batch_id, filename, title, sha256, source_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET filename = excluded.filename, title = excluded.title, sha256 = excluded.sha256, source_type = excluded.source_type, notes = excluded.notes`,
          [d.id, batchId, d.filename, d.title ?? null, d.sha256 ?? null, d.sourceType, d.notes ?? null]
        );
      }

      // The book row must exist before its units/membership (immediate FK checks).
      const b = p.book;
      await tx.runAsync(
        `INSERT INTO content_books (id, publisher_id, title, title_bn, edition, publication_year, subject, language, target_category, content_type,
           verification_status, content_version, version_label, source_note, license_status, license_note, install_state, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET publisher_id = excluded.publisher_id, title = excluded.title, title_bn = excluded.title_bn, edition = excluded.edition,
           publication_year = excluded.publication_year, subject = excluded.subject, language = excluded.language, target_category = excluded.target_category,
           content_type = excluded.content_type, verification_status = excluded.verification_status, content_version = excluded.content_version,
           version_label = excluded.version_label, source_note = excluded.source_note, license_status = excluded.license_status,
           license_note = excluded.license_note, install_state = excluded.install_state, updated_at = excluded.updated_at`,
        [b.id, pub.id, b.title, b.titleBn ?? null, b.edition ?? null, b.publicationYear ?? null, b.subject ?? null, b.language, b.targetCategory, b.contentType,
          b.verificationStatus, b.contentVersion, b.versionLabel ?? null, b.sourceNote ?? null, b.licenseStatus, b.licenseNote ?? null, state, now]
      );

      // Replace the unit tree and membership for this book (units/membership are library-owned, never user data).
      await tx.runAsync("DELETE FROM content_unit_questions WHERE book_id = ?", [bookId]);
      await tx.runAsync("DELETE FROM content_units WHERE book_id = ?", [bookId]);
      const parentOf = new Map(p.units.map((u) => [u.id, u.parentId ?? null]));
      const depthOf = (id: string): number => { let d = 0; let c = parentOf.get(id) ?? null; while (c !== null && d < 64) { d++; c = parentOf.get(c) ?? null; } return d; };
      const orderedUnits = p.units.slice().sort((a, b) => depthOf(a.id) - depthOf(b.id));
      await insertRows(tx, "INSERT INTO content_units (id, book_id, parent_id, kind, title, title_bn, sort_order)", "", 7,
        orderedUnits.map((u) => [u.id, bookId, u.parentId ?? null, u.kind, u.title, u.titleBn ?? null, u.sortOrder]));
      report.units = p.units.length;

      // Classify questions against what is already stored (one chunked lookup, not one query per question).
      const stored = new Map<string, { batch_id: string; content_hash: string }>();
      for (let i = 0; i < p.questions.length; i += 400) {
        const ids = p.questions.slice(i, i + 400).map((q) => q.id);
        const rows = await tx.getAllAsync<{ id: string; batch_id: string; content_hash: string }>(
          `SELECT id, batch_id, content_hash FROM questions WHERE id IN (${ids.map(() => "?").join(",")})`, ids
        );
        rows.forEach((r) => stored.set(r.id, r));
      }
      const fresh: SqlParam[][] = []; const optionRows: SqlParam[][] = [];
      for (const q of p.questions) {
        const hash = contentHash(q as unknown as QuestionPackItem);
        const prior = stored.get(q.id);
        if (prior && prior.batch_id !== batchId) throw new Error(`Question ${q.id} already exists in batch ${prior.batch_id}; ids must be unique across batches.`);
        if (prior && prior.content_hash === hash) { report.questions.skipped++; continue; }
        const correct = new Set(q.correctOptionIds ?? []);
        const assets = q.assetPaths?.length ? JSON.stringify(q.assetPaths) : null;
        if (prior) {
          await tx.runAsync(
            "UPDATE questions SET category = ?, text = ?, type = ?, subject = ?, topic = ?, answer_status = ?, content_status = ?, explanation = ?, asset_paths = ?, content_hash = ? WHERE id = ?",
            [q.category, q.text, q.type, q.subject ?? null, q.topic ?? null, q.answerVerificationStatus, q.contentVerificationStatus, q.explanation ?? null, assets, hash, q.id]
          );
          await tx.runAsync("DELETE FROM question_options WHERE question_id = ?", [q.id]);
          report.questions.updated++;
        } else {
          fresh.push([q.id, batchId, q.category, q.text, q.type, q.subject ?? null, q.topic ?? null, q.answerVerificationStatus, q.contentVerificationStatus, q.explanation ?? null, assets, hash]);
          report.questions.inserted++;
        }
        for (const o of q.options) optionRows.push([q.id, o.id, o.text, o.order, correct.has(o.id) ? 1 : 0]);
      }
      await insertRows(tx, "INSERT INTO questions (id, batch_id, category, text, type, subject, topic, answer_status, content_status, explanation, asset_paths, content_hash)", "", 12, fresh);
      await insertRows(tx, "INSERT INTO question_options (question_id, option_key, text, sort_order, is_correct)", "", 5, optionRows);
      await insertRows(tx, "INSERT INTO question_sources (question_id, source_document_id, page_number, question_number)",
        " ON CONFLICT(question_id) DO UPDATE SET source_document_id = excluded.source_document_id, page_number = excluded.page_number, question_number = excluded.question_number", 4,
        p.questions.map((q) => [q.id, q.source.documentId, q.source.pageNumber ?? null, q.source.questionNumber ?? null]));

      const membership: SqlParam[][] = [];
      p.questions.forEach((q, index) => { for (const unitId of new Set(q.unitIds)) membership.push([unitId, bookId, q.id, index + 1]); });
      await insertRows(tx, "INSERT INTO content_unit_questions (unit_id, book_id, question_id, position)", "", 4, membership);
      report.memberships = membership.length;

      await refreshBookCounts(tx, bookId);
    });
    report.ok = true;
    return report;
  } catch (error) {
    // Rolled back: nothing from this pack was written.
    const failed = emptyReport(bookId);
    failed.warnings = validation.warnings;
    failed.errors = [error instanceof Error ? error.message : String(error)];
    return failed;
  }
}
