import type { SqlDb } from "../db/types.ts";
import type { QuestionPack, QuestionPackItem } from "../types/question-pack.ts";
import { validateQuestionPack } from "./questionPackValidator.mjs";

export interface EntityCounts {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface ImportReport {
  ok: boolean;
  batchId: string | null;
  errors: string[];
  warnings: string[];
  /** Records refused. A pack that fails validation or rolls back rejects all of its questions. */
  rejected: number;
  institutions: EntityCounts;
  papers: EntityCounts;
  examRules: EntityCounts;
  questions: EntityCounts;
  appearances: EntityCounts;
}

const zero = (): EntityCounts => ({ inserted: 0, updated: 0, skipped: 0 });

/** Stable content fingerprint (FNV-1a 53-bit-safe) so re-imports detect real changes only. */
export function contentHash(q: QuestionPackItem): string {
  const payload = JSON.stringify([
    q.text, q.type, q.category, q.subject ?? null, q.topic ?? null,
    q.answerVerificationStatus, q.contentVerificationStatus, q.explanation ?? null,
    (q.assetPaths ?? []).slice(),
    q.options.slice().sort((a, b) => a.order - b.order).map((o) => [o.id, o.text, o.order]),
    q.correctOptionIds ? q.correctOptionIds.slice().sort() : null
  ]);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2246822519) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0") + payload.length.toString(16);
}

function emptyReport(): ImportReport {
  return {
    ok: false, batchId: null, errors: [], warnings: [], rejected: 0,
    institutions: zero(), papers: zero(), examRules: zero(), questions: zero(), appearances: zero()
  };
}

/**
 * Validates then imports a pack in ONE transaction. Idempotent: importing the same batch twice
 * changes nothing the second time. Never deletes questions, appearances or any user-owned data.
 * Questions are never merged by text similarity; identity is the pack's stable question id.
 */
export async function importQuestionPack(db: SqlDb, pack: unknown, now: number = Date.now()): Promise<ImportReport> {
  const report = emptyReport();
  const validation = validateQuestionPack(pack);
  report.warnings = validation.warnings;
  const total = Array.isArray((pack as QuestionPack | undefined)?.questions) ? (pack as QuestionPack).questions.length : 0;
  if (!validation.valid) {
    report.errors = validation.errors;
    report.rejected = total;
    return report;
  }
  const p = pack as QuestionPack;
  report.batchId = p.batch.id;

  try {
    await db.withTransactionAsync(async (tx) => {
      const existingBatch = await tx.getFirstAsync<{ id: string }>("SELECT id FROM question_batches WHERE id = ?", [p.batch.id]);
      if (existingBatch) {
        await tx.runAsync("UPDATE question_batches SET description = ?, updated_at = ?, import_count = import_count + 1 WHERE id = ?", [p.batch.description ?? null, now, p.batch.id]);
      } else {
        await tx.runAsync(
          "INSERT INTO question_batches (id, category, description, schema_version, imported_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [p.batch.id, p.batch.category, p.batch.description ?? null, p.schemaVersion, now, now]
        );
      }

      for (const s of p.sourceDocuments) {
        const owner = await tx.getFirstAsync<{ batch_id: string }>("SELECT batch_id FROM source_documents WHERE id = ?", [s.id]);
        if (owner && owner.batch_id !== p.batch.id) throw new Error(`Source document ${s.id} belongs to another batch (${owner.batch_id}).`);
        await tx.runAsync(
          `INSERT INTO source_documents (id, batch_id, filename, title, sha256, source_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET filename = excluded.filename, title = excluded.title, sha256 = excluded.sha256, source_type = excluded.source_type, notes = excluded.notes`,
          [s.id, p.batch.id, s.filename, s.title ?? null, s.sha256 ?? null, s.sourceType, s.notes ?? null]
        );
      }

      for (const inst of p.institutions) {
        const row = await tx.getFirstAsync<{ code: string; name: string }>("SELECT code, name FROM institutions WHERE id = ?", [inst.id]);
        if (!row) {
          await tx.runAsync("INSERT INTO institutions (id, code, name) VALUES (?, ?, ?)", [inst.id, inst.code, inst.name]);
          report.institutions.inserted++;
        } else if (row.code !== inst.code || row.name !== inst.name) {
          await tx.runAsync("UPDATE institutions SET code = ?, name = ? WHERE id = ?", [inst.code, inst.name, inst.id]);
          report.institutions.updated++;
        } else report.institutions.skipped++;
      }

      for (const paper of p.papers) {
        const row = await tx.getFirstAsync<{ id: string }>("SELECT id FROM exam_papers WHERE id = ?", [paper.id]);
        const params = [paper.institutionId, paper.category, paper.year, paper.academicSession ?? null, paper.unit ?? null, paper.title ?? null];
        if (!row) {
          await tx.runAsync("INSERT INTO exam_papers (id, institution_id, category, year, academic_session, unit, title) VALUES (?, ?, ?, ?, ?, ?, ?)", [paper.id, ...params]);
          report.papers.inserted++;
        } else {
          const r = await tx.runAsync(
            `UPDATE exam_papers SET institution_id = ?, category = ?, year = ?, academic_session = ?, unit = ?, title = ?
             WHERE id = ? AND (institution_id IS NOT ? OR category IS NOT ? OR year IS NOT ? OR academic_session IS NOT ? OR unit IS NOT ? OR title IS NOT ?)`,
            [...params, paper.id, ...params]
          );
          if (r.changes > 0) report.papers.updated++;
          else report.papers.skipped++;
        }
      }

      for (const rule of p.examRules) {
        const row = await tx.getFirstAsync<{ id: string }>("SELECT id FROM exam_rules WHERE id = ?", [rule.id]);
        const params = [rule.correctMarks ?? null, rule.incorrectPenalty ?? null, rule.unansweredMarks ?? null, rule.durationSeconds ?? null, rule.totalQuestions ?? null, rule.verificationStatus, rule.sourceNote ?? null];
        if (!row) {
          await tx.runAsync(
            "INSERT INTO exam_rules (id, paper_id, correct_marks, incorrect_penalty, unanswered_marks, duration_seconds, total_questions, verification_status, source_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [rule.id, rule.paperId, ...params]
          );
          report.examRules.inserted++;
        } else {
          const r = await tx.runAsync(
            `UPDATE exam_rules SET paper_id = ?, correct_marks = ?, incorrect_penalty = ?, unanswered_marks = ?, duration_seconds = ?, total_questions = ?, verification_status = ?, source_note = ?
             WHERE id = ? AND (paper_id IS NOT ? OR correct_marks IS NOT ? OR incorrect_penalty IS NOT ? OR unanswered_marks IS NOT ? OR duration_seconds IS NOT ? OR total_questions IS NOT ? OR verification_status IS NOT ? OR source_note IS NOT ?)`,
            [rule.paperId, ...params, rule.id, rule.paperId, ...params]
          );
          if (r.changes > 0) report.examRules.updated++;
          else report.examRules.skipped++;
        }
      }

      for (const q of p.questions) {
        const hash = contentHash(q);
        const existing = await tx.getFirstAsync<{ batch_id: string; content_hash: string }>("SELECT batch_id, content_hash FROM questions WHERE id = ?", [q.id]);
        if (existing && existing.batch_id !== p.batch.id) {
          throw new Error(`Question ${q.id} already exists in batch ${existing.batch_id}; ids must be unique across batches.`);
        }
        if (!existing || existing.content_hash !== hash) {
          const correct = new Set(q.correctOptionIds ?? []);
          if (!existing) {
            await tx.runAsync(
              `INSERT INTO questions (id, batch_id, category, text, type, subject, topic, answer_status, content_status, explanation, asset_paths, content_hash)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [q.id, p.batch.id, q.category, q.text, q.type, q.subject ?? null, q.topic ?? null, q.answerVerificationStatus, q.contentVerificationStatus, q.explanation ?? null, q.assetPaths?.length ? JSON.stringify(q.assetPaths) : null, hash]
            );
            report.questions.inserted++;
          } else {
            await tx.runAsync(
              `UPDATE questions SET category = ?, text = ?, type = ?, subject = ?, topic = ?, answer_status = ?, content_status = ?, explanation = ?, asset_paths = ?, content_hash = ? WHERE id = ?`,
              [q.category, q.text, q.type, q.subject ?? null, q.topic ?? null, q.answerVerificationStatus, q.contentVerificationStatus, q.explanation ?? null, q.assetPaths?.length ? JSON.stringify(q.assetPaths) : null, hash, q.id]
            );
            await tx.runAsync("DELETE FROM question_options WHERE question_id = ?", [q.id]);
            report.questions.updated++;
          }
          for (const o of q.options) {
            await tx.runAsync(
              "INSERT INTO question_options (question_id, option_key, text, sort_order, is_correct) VALUES (?, ?, ?, ?, ?)",
              [q.id, o.id, o.text, o.order, correct.has(o.id) ? 1 : 0]
            );
          }
        } else {
          report.questions.skipped++;
        }

        await tx.runAsync(
          `INSERT INTO question_sources (question_id, source_document_id, page_number, question_number) VALUES (?, ?, ?, ?)
           ON CONFLICT(question_id) DO UPDATE SET source_document_id = excluded.source_document_id, page_number = excluded.page_number, question_number = excluded.question_number`,
          [q.id, q.source.documentId, q.source.pageNumber ?? null, q.source.questionNumber ?? null]
        );
        for (const a of q.appearances) {
          const r = await tx.runAsync(
            "INSERT OR IGNORE INTO question_appearances (question_id, paper_id, question_number, page_number, source_document_id) VALUES (?, ?, ?, ?, ?)",
            [q.id, a.paperId, a.questionNumber ?? null, a.pageNumber ?? null, a.sourceDocumentId ?? null]
          );
          if (r.changes > 0) report.appearances.inserted++;
          else report.appearances.skipped++;
        }
      }
    });
    report.ok = true;
    return report;
  } catch (error) {
    // The transaction rolled back: nothing from this pack was written.
    const fresh = emptyReport();
    fresh.batchId = p.batch.id;
    fresh.warnings = validation.warnings;
    fresh.errors = [error instanceof Error ? error.message : String(error)];
    fresh.rejected = total;
    return fresh;
  }
}
