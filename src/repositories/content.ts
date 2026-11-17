import type { SqlDb, SqlParam } from "../db/types.ts";
import { likePattern } from "./search.ts";
import type {
  AppearanceView, InstitutionSummary, OptionView, PaperSummary, PoolFilter, QuestionCategory, QuestionView, RuleStatus
} from "../types/domain.ts";
import { resolveRule, UNCONFIGURED_RULE, type ScoringRule } from "../services/scoring.ts";
import { groupExamPatterns, patternScope, type ExamPatternOption, type PatternPaper } from "../services/exam.ts";

/**
 * Scored-practice questions require verified content and key, 2+ options and a correct-option count that matches the
 * type: exactly one for single_choice, two or more for multiple_choice. Verified no-correct-option records (zero correct
 * options) are a separate disposition and never enter scored pools.
 */
export const ELIGIBLE_SQL = `q.answer_status = 'verified' AND q.content_status = 'verified'
  AND (SELECT COUNT(*) FROM question_options o WHERE o.question_id = q.id) >= 2
  AND (
    (q.type = 'single_choice' AND (SELECT COUNT(*) FROM question_options o WHERE o.question_id = q.id AND o.is_correct = 1) = 1)
    OR (q.type = 'multiple_choice' AND (SELECT COUNT(*) FROM question_options o WHERE o.question_id = q.id AND o.is_correct = 1) >= 2)
  )
  AND NOT EXISTS (
    SELECT 1 FROM question_options oc JOIN question_options od ON od.question_id = oc.question_id AND od.option_key <> oc.option_key
    WHERE oc.question_id = q.id AND oc.is_correct = 1 AND trim(oc.text) <> '' AND trim(oc.text) = trim(od.text)
  )`;

/** Source-key candidates remain unverified. Exclude ambiguous or structurally unsupported options. */
export const REVIEW_CANDIDATE_SQL = `(q.answer_status <> 'verified' OR q.content_status <> 'verified') AND q.type = 'single_choice'
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
  // Join parameters appear before WHERE parameters in the final SQL, so they are collected separately and prepended.
  const joinParams: SqlParam[] = [];
  let joins = "";
  // Historical question rows may remain after a source-paper replacement so old
  // bookmarks and attempts keep resolving. Only rows with a current active paper
  // appearance belong to the active browse/practice catalogue.
  const where: string[] = [];
  if (filter.bookId) {
    // Publisher/book scope: membership in an AVAILABLE book (bundled/installed). Removed or catalogue-only books drop
    // out of practice, but their question rows (and all user data referencing them) stay untouched.
    // Performance: the scope DRIVES the query. A derived table of the book's (or unit subtree's) distinct member ids is
    // joined to questions by primary key, so the verification/option predicates run only for the scope's rows (~1.8k)
    // instead of every question in the catalogue (~9.6k) with a per-row membership EXISTS probe.
    where.push("EXISTS (SELECT 1 FROM content_books cb WHERE cb.id = ? AND cb.install_state IN ('bundled','installed'))");
    params.push(filter.bookId);
    const unitTree = filter.unitId
      ? ` AND unit_id IN (WITH RECURSIVE tree(id) AS (SELECT id FROM content_units WHERE id = ? AND book_id = ? UNION ALL SELECT u.id FROM content_units u JOIN tree t ON u.parent_id = t.id) SELECT id FROM tree)`
      : "";
    joins = ` JOIN (SELECT DISTINCT question_id FROM content_unit_questions WHERE book_id = ?${unitTree}) scope_m ON scope_m.question_id = q.id`;
    joinParams.push(filter.bookId);
    if (filter.unitId) joinParams.push(filter.unitId, filter.bookId);
  } else {
    // Default pool = university paper content only; book-only questions stay out of it. A retired paper
    // (exam_papers.retired_at, migration v11 — e.g. RU/RU-V) keeps its appearances for history, but a
    // question whose ONLY appearances are on retired papers is not active catalogue/practice content.
    where.push(`EXISTS (SELECT 1 FROM question_appearances active_a JOIN exam_papers active_p ON active_p.id = active_a.paper_id
      WHERE active_a.question_id = q.id AND active_p.retired_at IS NULL)`);
  }
  if (filter.category) { where.push("q.category = ?"); params.push(filter.category); }
  if (filter.subject) { where.push("q.subject = ?"); params.push(filter.subject); }
  if (filter.subjects?.length) {
    where.push(`q.subject IN (${filter.subjects.map(() => "?").join(",")})`);
    params.push(...filter.subjects);
  }
  if (filter.retrySessionId) {
    // Incorrect, skipped, timed-out and never-answered questions of one finished session (read-only on user data).
    where.push(`q.id IN (SELECT sa.question_id FROM session_answers sa WHERE sa.session_id = ?
      AND (sa.outcome IN ('incorrect','skipped','timed_out') OR (sa.outcome = 'unanswered' AND sa.selected_keys = '[]')))`);
    params.push(filter.retrySessionId);
  }
  const institutionIds = filter.institutionIds?.length ? filter.institutionIds : null;
  const paperIds = filter.paperIds?.length ? filter.paperIds : null;
  if (filter.institutionId || institutionIds || filter.paperId || paperIds) {
    joins += " JOIN question_appearances a ON a.question_id = q.id JOIN exam_papers p ON p.id = a.paper_id AND p.retired_at IS NULL";
    if (filter.institutionId) { where.push("p.institution_id = ?"); params.push(filter.institutionId); }
    if (institutionIds) {
      where.push(`p.institution_id IN (${institutionIds.map(() => "?").join(",")})`);
      params.push(...institutionIds);
    }
    if (filter.paperId) { where.push("p.id = ?"); params.push(filter.paperId); }
    if (paperIds) {
      where.push(`p.id IN (${paperIds.map(() => "?").join(",")})`);
      params.push(...paperIds);
    }
  }
  return { joins, where: where.length ? " AND " + where.join(" AND ") : "", params: [...joinParams, ...params] };
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
  const active = filterClauses({});
  const q = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM questions q WHERE 1 = 1${active.where}`);
  const e = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM questions q WHERE ${ELIGIBLE_SQL}${active.where}`);
  // Institutions with at least one active (non-retired) paper, not every institution row ever imported.
  const i = await db.getFirstAsync<{ n: number }>("SELECT COUNT(DISTINCT institution_id) AS n FROM exam_papers WHERE retired_at IS NULL");
  return { questions: Number(q?.n ?? 0), eligible: Number(e?.n ?? 0), institutions: Number(i?.n ?? 0) };
}

export async function listInstitutions(db: SqlDb, category: QuestionCategory): Promise<InstitutionSummary[]> {
  const rows = await db.getAllAsync<{ id: string; code: string; name: string; paper_count: number }>(
    `SELECT i.id, i.code, i.name, COUNT(DISTINCT p.id) AS paper_count
     FROM institutions i JOIN exam_papers p ON p.institution_id = i.id AND p.category = ? AND p.retired_at IS NULL
     GROUP BY i.id ORDER BY i.code`,
    [category]
  );
  const out: InstitutionSummary[] = [];
  for (const r of rows) {
    const total = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(DISTINCT a.question_id) AS n FROM question_appearances a JOIN exam_papers p ON p.id = a.paper_id
       WHERE p.institution_id = ? AND p.category = ? AND p.retired_at IS NULL`,
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

/**
 * Papers of several institutions with all per-paper counts computed in three grouped queries (instead of two queries
 * per paper), so a whole university - or every university - can be listed without an N+1 cost.
 */
export async function listPapersByInstitutions(db: SqlDb, opts: { institutionIds: string[]; category?: QuestionCategory }): Promise<PaperSummary[]> {
  if (opts.institutionIds.length === 0) return [];
  const ph = opts.institutionIds.map(() => "?").join(",");
  const params: SqlParam[] = [...opts.institutionIds];
  let categoryClause = "";
  if (opts.category) { categoryClause = " AND p.category = ?"; params.push(opts.category); }
  const rows = await db.getAllAsync<PaperRow>(
    `SELECT p.id, p.institution_id, i.code, i.name AS iname, p.category, p.year, p.academic_session, p.unit, p.title,
       (SELECT COUNT(DISTINCT a.question_id) FROM question_appearances a WHERE a.paper_id = p.id) AS qn,
       (SELECT r.verification_status FROM exam_rules r WHERE r.paper_id = p.id ORDER BY r.id LIMIT 1) AS rule_status
     FROM exam_papers p JOIN institutions i ON i.id = p.institution_id
     WHERE p.institution_id IN (${ph})${categoryClause} AND p.retired_at IS NULL ORDER BY p.year DESC, p.unit, p.id`,
    params
  );
  const grouped = async (predicate: string): Promise<Map<string, number>> => {
    const counts = await db.getAllAsync<{ paper_id: string; n: number }>(
      `SELECT a.paper_id AS paper_id, COUNT(DISTINCT q.id) AS n FROM questions q
       JOIN question_appearances a ON a.question_id = q.id JOIN exam_papers p ON p.id = a.paper_id
       WHERE (${predicate}) AND p.institution_id IN (${ph})${categoryClause} GROUP BY a.paper_id`,
      params
    );
    return new Map(counts.map((c) => [c.paper_id, Number(c.n)]));
  };
  const eligible = await grouped(ELIGIBLE_SQL);
  const candidates = await grouped(REVIEW_CANDIDATE_SQL);
  return rows.map((r) => ({
    id: r.id, institutionId: r.institution_id, institutionCode: r.code, institutionName: r.iname, category: r.category,
    year: Number(r.year), academicSession: r.academic_session, unit: r.unit, title: r.title,
    questionCount: Number(r.qn), eligibleCount: eligible.get(r.id) ?? 0, reviewCandidateCount: candidates.get(r.id) ?? 0, ruleStatus: r.rule_status
  }));
}

export async function getInstitution(db: SqlDb, id: string): Promise<{ id: string; code: string; name: string } | null> {
  return db.getFirstAsync("SELECT id, code, name FROM institutions WHERE id = ?", [id]);
}

interface PaperRow {
  id: string; institution_id: string; code: string; iname: string; category: QuestionCategory; year: number;
  academic_session: string | null; unit: string | null; title: string | null; qn: number; rule_status: RuleStatus | null;
}

export async function listPapers(db: SqlDb, opts: { institutionId?: string; category?: QuestionCategory; paperId?: string }): Promise<PaperSummary[]> {
  const where: string[] = ["p.retired_at IS NULL"];
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

/** Paper question IDs grouped in canonical subject order, then printed order within each subject. A retired paper (migration v11) yields nothing: its appearances remain for history only. */
export async function listPaperQuestionIds(db: SqlDb, paperId: string, limit: number, offset: number, subject?: string, search?: string): Promise<string[]> {
  const params: SqlParam[] = [paperId];
  if (subject) params.push(subject);
  const pattern = likePattern(search);
  if (pattern) params.push(pattern);
  params.push(limit, offset);
  const rows = await db.getAllAsync<{ question_id: string }>(
    `SELECT a.question_id AS question_id FROM question_appearances a
     JOIN questions q ON q.id = a.question_id
     JOIN exam_papers rp ON rp.id = a.paper_id AND rp.retired_at IS NULL
     WHERE a.paper_id = ?${subject ? " AND q.subject = ?" : ""}${pattern ? " AND q.text LIKE ? ESCAPE '\\'" : ""}
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
  // One grouped pass: a question has a single subject, so the group sizes (including the NULL-subject group) sum to the
  // distinct total. This replaces a second full COUNT(DISTINCT) query over the same scope.
  const rows = await db.getAllAsync<{ subject: string | null; n: number }>(
    `SELECT q.subject AS subject, COUNT(DISTINCT q.id) AS n FROM questions q${c.joins} WHERE 1 = 1${c.where} GROUP BY q.subject`,
    c.params
  );
  const bySubject: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    total += Number(r.n);
    if (r.subject) bySubject[r.subject] = Number(r.n);
  }
  return { total, bySubject };
}

/**
 * Flash/Custom setup pool counts with ONE fallback query: the verified pool when it has questions, otherwise the
 * provisional-inclusive pool (computed once and reused as both the "has candidates" probe and the pool itself).
 * `reviewMode` is true only when the provisional pool was used.
 */
export async function countFlashPool(
  db: SqlDb, filter: PoolFilter
): Promise<{ total: number; bySubject: Record<string, number>; reviewMode: boolean }> {
  const verified = await countPoolBySubject(db, filter, false);
  if (verified.total > 0) return { ...verified, reviewMode: false };
  const provisional = await countPoolBySubject(db, filter, true);
  return provisional.total > 0 ? { ...provisional, reviewMode: true } : { ...verified, reviewMode: false };
}

/**
 * Practice-pool size per subject for a scope in ONE grouped query (replaces one count query per subject).
 * `includeUnverified` mirrors practiceQuestionIds (verified OR provisional candidates). `total` also counts
 * questions without a subject. Any `subject`/`subjects` restriction on `filter` is ignored on purpose: the counts
 * describe the scope the selection is made from.
 */
export async function countPoolBySubject(
  db: SqlDb, filter: PoolFilter, includeUnverified = false
): Promise<{ total: number; bySubject: Record<string, number> }> {
  const c = filterClauses({ ...filter, subject: undefined, subjects: undefined });
  const cond = includeUnverified ? `((${ELIGIBLE_SQL}) OR (${REVIEW_CANDIDATE_SQL}))` : `(${ELIGIBLE_SQL})`;
  const rows = await db.getAllAsync<{ subject: string | null; n: number }>(
    `SELECT q.subject AS subject, COUNT(DISTINCT q.id) AS n FROM questions q${c.joins} WHERE ${cond}${c.where} GROUP BY q.subject`,
    c.params
  );
  const bySubject: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    total += Number(r.n);
    if (r.subject) bySubject[r.subject] = Number(r.n);
  }
  return { total, bySubject };
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
      answer_status: QuestionView["answerStatus"]; content_status: QuestionView["contentStatus"]; explanation: string | null; asset_paths: string | null; explanation_asset_paths: string | null;
    }>(`SELECT id, text, type, category, subject, topic, answer_status, content_status, explanation, asset_paths, explanation_asset_paths FROM questions WHERE id IN (${ph})`, part);
    for (const q of qs) {
      byId.set(q.id, {
        id: q.id, text: q.text, type: q.type, category: q.category, subject: q.subject, topic: q.topic,
        answerStatus: q.answer_status, contentStatus: q.content_status, explanation: q.explanation,
        assetPaths: q.asset_paths ? (JSON.parse(q.asset_paths) as string[]) : [],
        explanationAssetPaths: q.explanation_asset_paths ? (JSON.parse(q.explanation_asset_paths) as string[]) : [], options: [], appearances: []
      });
    }
    const opts = await db.getAllAsync<{ question_id: string; option_key: string; text: string; sort_order: number; is_correct: number; asset_paths: string | null }>(
      `SELECT question_id, option_key, text, sort_order, is_correct, asset_paths FROM question_options WHERE question_id IN (${ph}) ORDER BY question_id, sort_order`, part
    );
    for (const o of opts) {
      const target: OptionView = { key: o.option_key, text: o.text, order: o.sort_order, isCorrect: o.is_correct === 1, assetPaths: o.asset_paths ? (JSON.parse(o.asset_paths) as string[]) : [] };
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
    const sourceRows = await db.getAllAsync<{ question_id: string; filename: string; title: string | null; page_number: number | null; question_number: number | null }>(
      `SELECT s.question_id, d.filename, d.title, s.page_number, s.question_number
       FROM question_sources s JOIN source_documents d ON d.id = s.source_document_id WHERE s.question_id IN (${ph})`, part
    );
    for (const r of sourceRows) {
      const target = byId.get(r.question_id);
      if (target) target.source = { filename: r.filename, title: r.title, pageNumber: r.page_number, questionNumber: r.question_number };
    }
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
  duration_seconds: number | null; total_questions: number | null; total_marks: number | null; verification_status: RuleStatus; selection_config: string | null;
}

/**
 * Resolves the single rule that applies to a set of questions, limited to the papers selected by `filter`.
 * Mixed or missing rules yield the unconfigured fallback; an illustrative rule stays illustrative. Retired papers (v11) never
 * contribute a rule: a question shared with a retired paper must not turn an active scope into a "mixed" rule.
 */
export async function resolveRuleForQuestions(db: SqlDb, questionIds: string[], filter: PoolFilter): Promise<ScoringRule> {
  if (questionIds.length === 0) return UNCONFIGURED_RULE;
  // A publisher book has no source-backed exam pattern. A book question that also appears in a university paper must
  // not pick up that paper's official rule just because the book is being practised.
  if (filter.bookId) return UNCONFIGURED_RULE;
  const paperIds = new Set<string>();
  for (const part of chunk(questionIds)) {
    const ph = part.map(() => "?").join(",");
    const params: SqlParam[] = [...part];
    let extra = "";
    if (filter.paperId) { extra += " AND a.paper_id = ?"; params.push(filter.paperId); }
    if (filter.paperIds?.length) {
      extra += ` AND a.paper_id IN (${filter.paperIds.map(() => "?").join(",")})`;
      params.push(...filter.paperIds);
    }
    if (filter.institutionId) { extra += " AND p.institution_id = ?"; params.push(filter.institutionId); }
    if (filter.institutionIds?.length) {
      extra += ` AND p.institution_id IN (${filter.institutionIds.map(() => "?").join(",")})`;
      params.push(...filter.institutionIds);
    }
    const rows = await db.getAllAsync<{ paper_id: string }>(
      `SELECT DISTINCT a.paper_id FROM question_appearances a JOIN exam_papers p ON p.id = a.paper_id AND p.retired_at IS NULL WHERE a.question_id IN (${ph})${extra}`, params
    );
    rows.forEach((r) => paperIds.add(r.paper_id));
  }
  const rules: (ScoringRule | null)[] = [];
  for (const paperId of paperIds) {
    const r = await db.getFirstAsync<RuleRow>("SELECT * FROM exam_rules WHERE paper_id = ? ORDER BY id LIMIT 1", [paperId]);
    if (!r) { rules.push(null); continue; }
    rules.push({
      correctMarks: r.correct_marks, incorrectPenalty: r.incorrect_penalty, unansweredMarks: r.unanswered_marks,
      status: r.verification_status, totalQuestions: r.total_questions, durationSeconds: r.duration_seconds,
      totalMarks: r.total_marks, selectionConfig: r.selection_config ? JSON.parse(r.selection_config) : null
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

/** Imported question packs, newest first (used for the profile "content" section). Retired packs (e.g. RU) are excluded. */
export async function listBatches(db: SqlDb): Promise<BatchSummary[]> {
  const rows = await db.getAllAsync<{ id: string; category: QuestionCategory; description: string | null; imported_at: number; n: number }>(
    `SELECT b.id, b.category, b.description, b.imported_at, (SELECT COUNT(*) FROM questions q WHERE q.batch_id = b.id) AS n
     FROM question_batches b WHERE b.retired_at IS NULL ORDER BY b.imported_at DESC, b.id`
  );
  return rows.map((r) => ({ id: r.id, category: r.category, description: r.description, importedAt: Number(r.imported_at), questionCount: Number(r.n) }));
}

/** Distinct categories that currently have at least one active (non-retired) paper (drives data-driven category screens). */
export async function categoriesWithContent(db: SqlDb): Promise<QuestionCategory[]> {
  const rows = await db.getAllAsync<{ category: QuestionCategory }>("SELECT DISTINCT category FROM exam_papers WHERE retired_at IS NULL");
  return rows.map((r) => r.category);
}

/** The single marking rule stored for a paper, or null when none/incomplete. */
export async function getPaperRule(db: SqlDb, paperId: string): Promise<ScoringRule | null> {
  const r = await db.getFirstAsync<RuleRow>("SELECT * FROM exam_rules WHERE paper_id = ? ORDER BY id LIMIT 1", [paperId]);
  if (!r) return null;
  return {
    correctMarks: r.correct_marks, incorrectPenalty: r.incorrect_penalty, unansweredMarks: r.unanswered_marks,
    status: r.verification_status, totalQuestions: r.total_questions, durationSeconds: r.duration_seconds,
    totalMarks: r.total_marks, selectionConfig: r.selection_config ? JSON.parse(r.selection_config) : null
  };
}

/** The rule that would apply to a practice/exam scope (used to tell the user how scoring will work before starting). */
export async function scopeRule(db: SqlDb, filter: PoolFilter, includeUnverified = false): Promise<ScoringRule> {
  // A publisher book never has a source-backed rule (resolveRuleForQuestions returns UNCONFIGURED_RULE for it), so do not
  // materialise the whole practice pool just to learn that.
  if (filter.bookId) return UNCONFIGURED_RULE;
  return resolveRuleForQuestions(db, await practiceQuestionIds(db, filter, includeUnverified), filter);
}

export interface ExamPatternChoice extends ExamPatternOption {
  /** Eligible (or provisional, when `includeUnverified`) questions this pattern can draw from. */
  eligible: number;
}

/**
 * The exam patterns a university (one or more stored institutions) can run: only papers with a complete stored
 * pattern count (see groupExamPatterns). Nothing is inferred for papers without a rule. Retired papers (e.g. RU/RU-V)
 * are excluded so they cannot surface as a runnable Standard Exam pattern.
 */
export async function listExamPatterns(db: SqlDb, institutionIds: string[], includeUnverified = false): Promise<ExamPatternChoice[]> {
  if (institutionIds.length === 0) return [];
  const rows = await db.getAllAsync<RuleRow & { id: string; academic_session: string | null; unit: string | null }>(
    `SELECT p.id AS id, p.academic_session, p.unit, r.paper_id, r.correct_marks, r.incorrect_penalty, r.unanswered_marks,
            r.duration_seconds, r.total_questions, r.total_marks, r.verification_status, r.selection_config
     FROM exam_papers p LEFT JOIN exam_rules r ON r.id = (SELECT x.id FROM exam_rules x WHERE x.paper_id = p.id ORDER BY x.id LIMIT 1)
     WHERE p.institution_id IN (${institutionIds.map(() => "?").join(",")}) AND p.retired_at IS NULL ORDER BY p.id`,
    institutionIds
  );
  const papers: PatternPaper[] = rows.map((r) => ({
    id: r.id,
    academicSession: r.academic_session,
    unit: r.unit,
    rule: r.verification_status
      ? { status: r.verification_status, totalQuestions: r.total_questions, durationSeconds: r.duration_seconds, selectionConfig: r.selection_config ? JSON.parse(r.selection_config) : null }
      : null
  }));
  const options = groupExamPatterns(papers);
  const out: ExamPatternChoice[] = [];
  for (const option of options) {
    const pool = await practiceQuestionIds(db, { institutionIds, ...patternScope(option) }, includeUnverified);
    out.push({ ...option, eligible: pool.length });
  }
  return out;
}
