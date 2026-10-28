import type { SqlDb, SqlParam } from "../db/types.ts";
import type {
  AppearanceView, InstitutionSummary, OptionView, PaperSummary, PoolFilter, QuestionCategory, QuestionView, RuleStatus
} from "../types/domain.ts";
import { resolveRule, UNCONFIGURED_RULE, type ScoringRule } from "../services/scoring.ts";

/** Scored-practice questions require verified content and key, single-choice type, 2+ options and one correct option. */
const ELIGIBLE_SQL = `q.answer_status = 'verified' AND q.content_status = 'verified' AND q.type = 'single_choice'
  AND (SELECT COUNT(*) FROM question_options o WHERE o.question_id = q.id) >= 2
  AND EXISTS (SELECT 1 FROM question_options o WHERE o.question_id = q.id AND o.is_correct = 1)`;

/** Source-key candidates remain unverified. Exclude ambiguous or structurally unsupported options. */
const REVIEW_CANDIDATE_SQL = `(q.answer_status <> 'verified' OR q.content_status <> 'verified') AND q.type = 'single_choice'
  AND (SELECT COUNT(*) FROM question_options o WHERE o.question_id = q.id) >= 2
  AND (SELECT COUNT(*) FROM question_options o WHERE o.question_id = q.id AND o.is_correct = 1) = 1
  AND NOT EXISTS (
    SELECT 1 FROM question_options oa JOIN question_options ob
      ON oa.question_id = ob.question_id AND oa.option_key < ob.option_key
    WHERE oa.question_id = q.id AND lower(trim(oa.text)) = lower(trim(ob.text))
  )`;

function chunk<T>(items: T[], size = 400): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function filterClauses(filter: PoolFilter): { joins: string; where: string; params: SqlParam[] } {
  const params: SqlParam[] = [];
  let joins = "";
  const where: string[] = [];
  if (filter.category) { where.push("q.category = ?"); params.push(filter.category); }
  if (filter.subject) { where.push("q.subject = ?"); params.push(filter.subject); }
  if (filter.subjects?.length) {
    where.push(`q.subject IN (${filter.subjects.map(() => "?").join(",")})`);
    params.push(...filter.subjects);
  }
  if (filter.institutionId || filter.paperId) {
    joins = " JOIN question_appearances a ON a.question_id = q.id JOIN exam_papers p ON p.id = a.paper_id";
    if (filter.institutionId) { where.push("p.institution_id = ?"); params.push(filter.institutionId); }
    if (filter.paperId) { where.push("p.id = ?"); params.push(filter.paperId); }
  }
  return { joins, where: where.length ? " AND " + where.join(" AND ") : "", params };
}

export async function eligibleQuestionIds(db: SqlDb, filter: PoolFilter): Promise<string[]> {
  const c = filterClauses(filter);
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT DISTINCT q.id AS id FROM questions q${c.joins} WHERE ${ELIGIBLE_SQL}${c.where}`,
    c.params
  );
  return rows.map((r) => r.id);
}

/** Count candidates that may be used only with an explicit provisional-answer warning. */
export async function countReviewCandidates(db: SqlDb, filter: PoolFilter): Promise<number> {
  const c = filterClauses(filter);
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(DISTINCT q.id) AS n FROM questions q${c.joins} WHERE (${REVIEW_CANDIDATE_SQL})${c.where}`,
    c.params
  );
  return Number(row?.n ?? 0);
}

/**
 * Return a verified-only pool by default. Provisional mode additionally includes structurally valid
 * single-choice questions whose third-party source keys or text have not been independently verified.
 */
export async function practiceQuestionIds(db: SqlDb, filter: PoolFilter, includeUnverified = false): Promise<string[]> {
  if (!includeUnverified) return eligibleQuestionIds(db, filter);
  const c = filterClauses(filter);
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT DISTINCT q.id AS id FROM questions q${c.joins} WHERE ((${ELIGIBLE_SQL}) OR (${REVIEW_CANDIDATE_SQL}))${c.where}`,
    c.params
  );
  return rows.map((r) => r.id);
}

export async function countEligible(db: SqlDb, filter: PoolFilter): Promise<number> {
  const c = filterClauses(filter);
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(DISTINCT q.id) AS n FROM questions q${c.joins} WHERE ${ELIGIBLE_SQL}${c.where}`,
    c.params
  );
  return Number(row?.n ?? 0);
}

export async function contentTotals(db: SqlDb): Promise<{ questions: number; eligible: number; institutions: number }> {
  const q = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions");
  const e = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM questions q WHERE ${ELIGIBLE_SQL}`);
  const i = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM institutions");
  return { questions: Number(q?.n ?? 0), eligible: Number(e?.n ?? 0), institutions: Number(i?.n ?? 0) };
}

export async function listInstitutions(db: SqlDb, category: QuestionCategory): Promise<InstitutionSummary[]> {
  const rows = await db.getAllAsync<{ id: string; code: string; name: string; paper_count: number }>(
    `SELECT i.id, i.code, i.name, COUNT(DISTINCT p.id) AS paper_count
     FROM institutions i JOIN exam_papers p ON p.institution_id = i.id AND p.category = ?
     GROUP BY i.id ORDER BY i.code`,
    [category]
  );
  const out: InstitutionSummary[] = [];
  for (const r of rows) {
    const total = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(DISTINCT a.question_id) AS n FROM question_appearances a JOIN exam_papers p ON p.id = a.paper_id
       WHERE p.institution_id = ? AND p.category = ?`,
      [r.id, category]
    );
    const eligible = await countEligible(db, { category, institutionId: r.id });
    const reviewCandidateCount = await countReviewCandidates(db, { category, institutionId: r.id });
    out.push({
      id: r.id, code: r.code, name: r.name, paperCount: Number(r.paper_count),
      questionCount: Number(total?.n ?? 0), eligibleCount: eligible, reviewCandidateCount
    });
  }
  return out;
}

export async function getInstitution(db: SqlDb, id: string): Promise<{ id: string; code: string; name: string } | null> {
  return db.getFirstAsync("SELECT id, code, name FROM institutions WHERE id = ?", [id]);
}

interface PaperRow {
  id: string; institution_id: string; code: string; iname: string; category: QuestionCategory; year: number;
  academic_session: string | null; unit: string | null; title: string | null; qn: number; rule_status: RuleStatus | null;
}

export async function listPapers(db: SqlDb, opts: { institutionId?: string; category?: QuestionCategory; paperId?: string }): Promise<PaperSummary[]> {
  const where: string[] = [];
  const params: SqlParam[] = [];
  if (opts.institutionId) { where.push("p.institution_id = ?"); params.push(opts.institutionId); }
  if (opts.category) { where.push("p.category = ?"); params.push(opts.category); }
  if (opts.paperId) { where.push("p.id = ?"); params.push(opts.paperId); }
  const rows = await db.getAllAsync<PaperRow>(
    `SELECT p.id, p.institution_id, i.code, i.name AS iname, p.category, p.year, p.academic_session, p.unit, p.title,
       (SELECT COUNT(DISTINCT a.question_id) FROM question_appearances a WHERE a.paper_id = p.id) AS qn,
       (SELECT r.verification_status FROM exam_rules r WHERE r.paper_id = p.id ORDER BY r.id LIMIT 1) AS rule_status
     FROM exam_papers p JOIN institutions i ON i.id = p.institution_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY p.year DESC, p.unit, p.id`,
    params
  );
  const out: PaperSummary[] = [];
  for (const r of rows) {
    const eligible = await countEligible(db, { paperId: r.id });
    const reviewCandidateCount = await countReviewCandidates(db, { paperId: r.id });
    out.push({
      id: r.id, institutionId: r.institution_id, institutionCode: r.code, institutionName: r.iname, category: r.category,
      year: Number(r.year), academicSession: r.academic_session, unit: r.unit, title: r.title,
      questionCount: Number(r.qn), eligibleCount: eligible, reviewCandidateCount, ruleStatus: r.rule_status
    });
  }
  return out;
}

/** Paper question IDs grouped in canonical subject order, then printed order within each subject. */
export async function listPaperQuestionIds(db: SqlDb, paperId: string, limit: number, offset: number, subject?: string): Promise<string[]> {
  const params: SqlParam[] = [paperId];
  if (subject) params.push(subject);
  params.push(limit, offset);
  const rows = await db.getAllAsync<{ question_id: string }>(
    `SELECT a.question_id AS question_id FROM question_appearances a
     JOIN questions q ON q.id = a.question_id
     WHERE a.paper_id = ?${subject ? " AND q.subject = ?" : ""}
     ORDER BY
       CASE
         WHEN q.subject = 'Physics' THEN 0
         WHEN q.subject = 'Chemistry' THEN 1
         WHEN q.subject = 'Biology' THEN 2
         WHEN q.subject = 'Higher Mathematics' THEN 3
         WHEN q.subject = 'Bangla' THEN 4
         WHEN q.subject = 'English' THEN 5
         WHEN q.subject = 'ICT' THEN 6
         WHEN q.subject IS NULL THEN 8
         ELSE 7
       END,
       CASE WHEN q.subject IN ('Physics', 'Chemistry', 'Biology', 'Higher Mathematics', 'Bangla', 'English', 'ICT') THEN '' ELSE COALESCE(q.subject, '') END COLLATE NOCASE,
       IFNULL(a.question_number, 1000000), a.id
     LIMIT ? OFFSET ?`,
    params
  );
  return rows.map((r) => r.question_id);
}

/**
 * All questions (not only exam-eligible ones, matching what the read-only browser lists) in the scope, in total
 * and per subject. Questions without a subject count toward the total only.
 */
export async function countQuestionsBySubject(db: SqlDb, filter: PoolFilter): Promise<{ total: number; bySubject: Record<string, number> }> {
  const c = filterClauses({ ...filter, subject: undefined, subjects: undefined });
  const rows = await db.getAllAsync<{ subject: string | null; n: number }>(
    `SELECT q.subject AS subject, COUNT(DISTINCT q.id) AS n FROM questions q${c.joins} WHERE 1 = 1${c.where} GROUP BY q.subject`,
    c.params
  );
  const totalRow = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(DISTINCT q.id) AS n FROM questions q${c.joins} WHERE 1 = 1${c.where}`, c.params);
  const bySubject: Record<string, number> = {};
  for (const r of rows) if (r.subject) bySubject[r.subject] = Number(r.n);
  return { total: Number(totalRow?.n ?? 0), bySubject };
}

export async function listSubjects(db: SqlDb, filter: PoolFilter): Promise<string[]> {
  const c = filterClauses({ ...filter, subject: undefined });
  const rows = await db.getAllAsync<{ subject: string }>(
    `SELECT DISTINCT q.subject AS subject FROM questions q${c.joins} WHERE q.subject IS NOT NULL${c.where} ORDER BY q.subject`,
    c.params
  );
  return rows.map((r) => r.subject);
}

/** Loads full question views in the order of `ids` (missing ids are skipped). */
export async function loadQuestions(db: SqlDb, ids: string[]): Promise<QuestionView[]> {
  if (ids.length === 0) return [];
  const byId = new Map<string, QuestionView>();
  for (const part of chunk(ids)) {
    const ph = part.map(() => "?").join(",");
    const qs = await db.getAllAsync<{
      id: string; text: string; type: QuestionView["type"]; category: QuestionCategory; subject: string | null; topic: string | null;
      answer_status: QuestionView["answerStatus"]; content_status: QuestionView["contentStatus"]; explanation: string | null; asset_paths: string | null;
    }>(`SELECT id, text, type, category, subject, topic, answer_status, content_status, explanation, asset_paths FROM questions WHERE id IN (${ph})`, part);
    for (const q of qs) {
      byId.set(q.id, {
        id: q.id, text: q.text, type: q.type, category: q.category, subject: q.subject, topic: q.topic,
        answerStatus: q.answer_status, contentStatus: q.content_status, explanation: q.explanation,
        assetPaths: q.asset_paths ? (JSON.parse(q.asset_paths) as string[]) : [], options: [], appearances: []
      });
    }
    const opts = await db.getAllAsync<{ question_id: string; option_key: string; text: string; sort_order: number; is_correct: number }>(
      `SELECT question_id, option_key, text, sort_order, is_correct FROM question_options WHERE question_id IN (${ph}) ORDER BY question_id, sort_order`, part
    );
    for (const o of opts) {
      const target: OptionView = { key: o.option_key, text: o.text, order: o.sort_order, isCorrect: o.is_correct === 1 };
      byId.get(o.question_id)?.options.push(target);
    }
    const apps = await db.getAllAsync<{
      question_id: string; paper_id: string; code: string; iname: string; year: number; unit: string | null; session: string | null;
      question_number: number | null; page_number: number | null; filename: string | null;
    }>(
      `SELECT a.question_id, a.paper_id, i.code, i.name AS iname, p.year, p.unit, p.academic_session AS session,
         a.question_number, a.page_number, sd.filename
       FROM question_appearances a JOIN exam_papers p ON p.id = a.paper_id JOIN institutions i ON i.id = p.institution_id
       LEFT JOIN source_documents sd ON sd.id = a.source_document_id
       WHERE a.question_id IN (${ph}) ORDER BY p.year DESC, a.id`, part
    );
    for (const a of apps) {
      const view: AppearanceView = {
        paperId: a.paper_id, institutionCode: a.code, institutionName: a.iname, year: Number(a.year), unit: a.unit, session: a.session,
        questionNumber: a.question_number, pageNumber: a.page_number, sourceFilename: a.filename
      };
      byId.get(a.question_id)?.appearances.push(view);
    }
  }
  return ids.map((id) => byId.get(id)).filter((q): q is QuestionView => Boolean(q));
}

interface RuleRow {
  paper_id: string; correct_marks: number | null; incorrect_penalty: number | null; unanswered_marks: number | null;
  duration_seconds: number | null; total_questions: number | null; verification_status: RuleStatus; selection_config: string | null;
}

/**
 * Resolves the single rule that applies to a set of questions, limited to the papers selected by `filter`.
 * Mixed or missing rules yield the unconfigured fallback; an illustrative rule stays illustrative.
 */
export async function resolveRuleForQuestions(db: SqlDb, questionIds: string[], filter: PoolFilter): Promise<ScoringRule> {
  if (questionIds.length === 0) return UNCONFIGURED_RULE;
  const paperIds = new Set<string>();
  for (const part of chunk(questionIds)) {
    const ph = part.map(() => "?").join(",");
    const params: SqlParam[] = [...part];
    let extra = "";
    if (filter.paperId) { extra += " AND a.paper_id = ?"; params.push(filter.paperId); }
    if (filter.institutionId) { extra += " AND p.institution_id = ?"; params.push(filter.institutionId); }
    const rows = await db.getAllAsync<{ paper_id: string }>(
      `SELECT DISTINCT a.paper_id FROM question_appearances a JOIN exam_papers p ON p.id = a.paper_id WHERE a.question_id IN (${ph})${extra}`, params
    );
    rows.forEach((r) => paperIds.add(r.paper_id));
  }
  const rules: (ScoringRule | null)[] = [];
  for (const paperId of paperIds) {
    const r = await db.getFirstAsync<RuleRow>("SELECT * FROM exam_rules WHERE paper_id = ? ORDER BY id LIMIT 1", [paperId]);
    if (!r || r.correct_marks == null) { rules.push(null); continue; }
    rules.push({
      correctMarks: r.correct_marks, incorrectPenalty: r.incorrect_penalty ?? 0, unansweredMarks: r.unanswered_marks ?? 0,
      status: r.verification_status, totalQuestions: r.total_questions, durationSeconds: r.duration_seconds,
      selectionConfig: r.selection_config ? JSON.parse(r.selection_config) : null
    });
  }
  return resolveRule(rules);
}

export interface BatchSummary {
  id: string;
  category: QuestionCategory;
  description: string | null;
  importedAt: number;
  questionCount: number;
}

/** Imported question packs, newest first (used for the profile "content" section). */
export async function listBatches(db: SqlDb): Promise<BatchSummary[]> {
  const rows = await db.getAllAsync<{ id: string; category: QuestionCategory; description: string | null; imported_at: number; n: number }>(
    `SELECT b.id, b.category, b.description, b.imported_at, (SELECT COUNT(*) FROM questions q WHERE q.batch_id = b.id) AS n
     FROM question_batches b ORDER BY b.imported_at DESC, b.id`
  );
  return rows.map((r) => ({ id: r.id, category: r.category, description: r.description, importedAt: Number(r.imported_at), questionCount: Number(r.n) }));
}

/** Distinct categories that currently have at least one paper (drives data-driven category screens). */
export async function categoriesWithContent(db: SqlDb): Promise<QuestionCategory[]> {
  const rows = await db.getAllAsync<{ category: QuestionCategory }>("SELECT DISTINCT category FROM exam_papers");
  return rows.map((r) => r.category);
}

/** The single marking rule stored for a paper, or null when none/incomplete. */
export async function getPaperRule(db: SqlDb, paperId: string): Promise<ScoringRule | null> {
  const r = await db.getFirstAsync<RuleRow>("SELECT * FROM exam_rules WHERE paper_id = ? ORDER BY id LIMIT 1", [paperId]);
  if (!r || r.correct_marks == null) return null;
  return {
    correctMarks: r.correct_marks, incorrectPenalty: r.incorrect_penalty ?? 0, unansweredMarks: r.unanswered_marks ?? 0,
    status: r.verification_status, totalQuestions: r.total_questions, durationSeconds: r.duration_seconds,
    selectionConfig: r.selection_config ? JSON.parse(r.selection_config) : null
  };
}

/** The rule that would apply to a practice/exam scope (used to tell the user how scoring will work before starting). */
export async function scopeRule(db: SqlDb, filter: PoolFilter, includeUnverified = false): Promise<ScoringRule> {
  return resolveRuleForQuestions(db, await practiceQuestionIds(db, filter, includeUnverified), filter);
}
