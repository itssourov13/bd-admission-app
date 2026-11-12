import type { SqlDb, SqlParam } from "../db/types.ts";
import type { BookSummary, BookTargetCategory, InstallState, PublisherSummary, UnitRow } from "../types/domain.ts";
import { orderUnitTree, bookScopeLabel, localizedName, scopeKey } from "../features/library/model.ts";
import { ELIGIBLE_SQL, REVIEW_CANDIDATE_SQL } from "./content.ts";

const AVAILABLE = "('bundled','installed')";

interface PublisherRow {
  id: string; slug: string; name: string; name_bn: string | null; kind: PublisherSummary["kind"];
  description: string | null; website: string | null; logo_key: string | null;
}

/**
 * Publishers with counts computed from the real book/question rows (never invented). A publisher with metadata
 * but no books returns zero counts so the UI can show an honest empty state.
 */
export async function listPublishers(db: SqlDb): Promise<PublisherSummary[]> {
  const rows = await db.getAllAsync<PublisherRow>(
    "SELECT id, slug, name, name_bn, kind, description, website, logo_key FROM publishers ORDER BY sort_order, name"
  );
  const bookCounts = await db.getAllAsync<{ publisher_id: string; available: number; installed: number; unavailable: number }>(
    `SELECT publisher_id,
       SUM(CASE WHEN install_state IN ${AVAILABLE} THEN 1 ELSE 0 END) AS available,
       SUM(CASE WHEN install_state = 'installed' THEN 1 ELSE 0 END) AS installed,
       SUM(CASE WHEN install_state IN ('catalogue_only','removed') THEN 1 ELSE 0 END) AS unavailable
     FROM content_books GROUP BY publisher_id`
  );
  const questionCounts = await db.getAllAsync<{ publisher_id: string; n: number }>(
    `SELECT b.publisher_id AS publisher_id, COUNT(DISTINCT cq.question_id) AS n
     FROM content_unit_questions cq JOIN content_books b ON b.id = cq.book_id
     WHERE b.install_state IN ${AVAILABLE} GROUP BY b.publisher_id`
  );
  const categories = await db.getAllAsync<{ publisher_id: string; target_category: BookTargetCategory }>(
    `SELECT DISTINCT publisher_id, target_category FROM content_books WHERE install_state IN ${AVAILABLE} ORDER BY target_category`
  );
  const counts = new Map(bookCounts.map((c) => [c.publisher_id, c]));
  const qn = new Map(questionCounts.map((c) => [c.publisher_id, Number(c.n)]));
  return rows.map((r) => {
    const c = counts.get(r.id);
    return {
      id: r.id, slug: r.slug, name: r.name, nameBn: r.name_bn, kind: r.kind, description: r.description, website: r.website, logoKey: r.logo_key,
      availableBooks: Number(c?.available ?? 0), installedBooks: Number(c?.installed ?? 0), unavailableBooks: Number(c?.unavailable ?? 0),
      questionCount: qn.get(r.id) ?? 0,
      categories: categories.filter((x) => x.publisher_id === r.id).map((x) => x.target_category)
    };
  });
}

export async function getPublisher(db: SqlDb, id: string): Promise<PublisherSummary | null> {
  return (await listPublishers(db)).find((p) => p.id === id) ?? null;
}

interface BookRow {
  id: string; publisher_id: string; pname: string; pname_bn: string | null; title: string; title_bn: string | null; edition: string | null;
  publication_year: number | null; subject: string | null; language: BookSummary["language"]; target_category: BookTargetCategory;
  content_type: BookSummary["contentType"]; verification_status: BookSummary["verificationStatus"]; content_version: number;
  version_label: string | null; source_note: string | null; license_status: BookSummary["licenseStatus"]; license_note: string | null;
  install_state: InstallState;
}

async function queryBooks(db: SqlDb, where: string, params: SqlParam[]): Promise<BookSummary[]> {
  const rows = await db.getAllAsync<BookRow>(
    `SELECT b.id, b.publisher_id, p.name AS pname, p.name_bn AS pname_bn, b.title, b.title_bn, b.edition, b.publication_year, b.subject,
       b.language, b.target_category, b.content_type, b.verification_status, b.content_version, b.version_label, b.source_note,
       b.license_status, b.license_note, b.install_state
     FROM content_books b JOIN publishers p ON p.id = b.publisher_id
     WHERE ${where}
     ORDER BY CASE WHEN b.install_state IN ${AVAILABLE} THEN 0 ELSE 1 END, b.title, b.id`,
    params
  );
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const ph = ids.map(() => "?").join(",");
  const total = await db.getAllAsync<{ book_id: string; n: number }>(
    `SELECT book_id, COUNT(DISTINCT question_id) AS n FROM content_unit_questions WHERE book_id IN (${ph}) GROUP BY book_id`, ids
  );
  const eligible = await db.getAllAsync<{ book_id: string; n: number }>(
    `SELECT cq.book_id AS book_id, COUNT(DISTINCT q.id) AS n FROM questions q JOIN content_unit_questions cq ON cq.question_id = q.id
     WHERE cq.book_id IN (${ph}) AND (${ELIGIBLE_SQL}) GROUP BY cq.book_id`, ids
  );
  const candidates = await db.getAllAsync<{ book_id: string; n: number }>(
    `SELECT cq.book_id AS book_id, COUNT(DISTINCT q.id) AS n FROM questions q JOIN content_unit_questions cq ON cq.question_id = q.id
     WHERE cq.book_id IN (${ph}) AND (${REVIEW_CANDIDATE_SQL}) GROUP BY cq.book_id`, ids
  );
  const map = (list: { book_id: string; n: number }[]) => new Map(list.map((x) => [x.book_id, Number(x.n)]));
  const t = map(total), e = map(eligible), c = map(candidates);
  return rows.map((r) => ({
    id: r.id, publisherId: r.publisher_id, publisherName: r.pname, publisherNameBn: r.pname_bn, title: r.title, titleBn: r.title_bn,
    edition: r.edition, publicationYear: r.publication_year, subject: r.subject, language: r.language, targetCategory: r.target_category,
    contentType: r.content_type, verificationStatus: r.verification_status, contentVersion: Number(r.content_version), versionLabel: r.version_label,
    sourceNote: r.source_note, licenseStatus: r.license_status, licenseNote: r.license_note, installState: r.install_state,
    questionCount: t.get(r.id) ?? 0, eligibleCount: e.get(r.id) ?? 0, reviewCandidateCount: c.get(r.id) ?? 0
  }));
}

export async function listBooks(db: SqlDb, publisherId: string): Promise<BookSummary[]> {
  return queryBooks(db, "b.publisher_id = ?", [publisherId]);
}

export async function getBook(db: SqlDb, id: string): Promise<BookSummary | null> {
  return (await queryBooks(db, "b.id = ?", [id]))[0] ?? null;
}

/** SQL fragment: ids of a unit and all of its descendants (recursive), bound to (unitId, bookId). */
const UNIT_TREE_SQL = `WITH RECURSIVE tree(id) AS (
  SELECT id FROM content_units WHERE id = ? AND book_id = ?
  UNION ALL SELECT u.id FROM content_units u JOIN tree t ON u.parent_id = t.id
) SELECT id FROM tree`;

/**
 * Units of a book in display order with distinct question counts that include every descendant, computed by one
 * set-based recursive query (a question filed under both a chapter and its section is counted once).
 */
export async function listUnits(db: SqlDb, bookId: string): Promise<UnitRow[]> {
  const rows = await db.getAllAsync<{ id: string; book_id: string; parent_id: string | null; kind: UnitRow["kind"]; title: string; title_bn: string | null; sort_order: number }>(
    "SELECT id, book_id, parent_id, kind, title, title_bn, sort_order FROM content_units WHERE book_id = ?", [bookId]
  );
  if (rows.length === 0) return [];
  const counts = await db.getAllAsync<{ root: string; n: number }>(
    `WITH RECURSIVE closure(root, id) AS (
       SELECT id, id FROM content_units WHERE book_id = ?
       UNION ALL SELECT c.root, u.id FROM content_units u JOIN closure c ON u.parent_id = c.id
     )
     SELECT c.root AS root, COUNT(DISTINCT cq.question_id) AS n FROM closure c
     JOIN content_unit_questions cq ON cq.unit_id = c.id GROUP BY c.root`, [bookId]
  );
  const n = new Map(counts.map((c) => [c.root, Number(c.n)]));
  return orderUnitTree(rows.map((r) => ({
    id: r.id, bookId: r.book_id, parentId: r.parent_id, kind: r.kind, title: r.title, titleBn: r.title_bn, sortOrder: Number(r.sort_order),
    questionCount: n.get(r.id) ?? 0
  }))) as UnitRow[];
}

export async function getUnit(db: SqlDb, bookId: string, unitId: string): Promise<UnitRow | null> {
  return (await listUnits(db, bookId)).find((u) => u.id === unitId) ?? null;
}

/**
 * Question ids of an AVAILABLE book (optionally one unit and its sub-units) in the book's own order. A removed or
 * catalogue-only book yields nothing, matching the practice pool.
 */
export async function listBookQuestionIds(
  db: SqlDb, scope: { bookId: string; unitId?: string }, limit: number, offset: number, subject?: string
): Promise<string[]> {
  const params: SqlParam[] = [scope.bookId];
  let unitFilter = "";
  if (scope.unitId) {
    unitFilter = ` AND unit_id IN (${UNIT_TREE_SQL})`;
    params.push(scope.unitId, scope.bookId);
  }
  params.push(scope.bookId);
  if (subject) params.push(subject);
  params.push(limit, offset);
  const rows = await db.getAllAsync<{ question_id: string }>(
    `SELECT q.id AS question_id FROM questions q
     JOIN (SELECT question_id, MIN(position) AS pos FROM content_unit_questions WHERE book_id = ?${unitFilter} GROUP BY question_id) m ON m.question_id = q.id
     WHERE EXISTS (SELECT 1 FROM content_books b WHERE b.id = ? AND b.install_state IN ${AVAILABLE})${subject ? " AND q.subject = ?" : ""}
     ORDER BY m.pos, q.id LIMIT ? OFFSET ?`,
    params
  );
  return rows.map((r) => r.question_id);
}

/** Display label for a book/unit scope (used by setup screens and history). Null when the book is unknown. */
export async function getBookScopeLabel(db: SqlDb, scope: { bookId: string; unitId?: string }, lang: "bn" | "en"): Promise<string | null> {
  const book = await db.getFirstAsync<{ title: string; title_bn: string | null }>("SELECT title, title_bn FROM content_books WHERE id = ?", [scope.bookId]);
  if (!book) return null;
  const title = localizedName(book.title, book.title_bn, lang);
  if (!scope.unitId) return title;
  const unit = await db.getFirstAsync<{ title: string; title_bn: string | null }>("SELECT title, title_bn FROM content_units WHERE id = ? AND book_id = ?", [scope.unitId, scope.bookId]);
  return bookScopeLabel(title, unit ? localizedName(unit.title, unit.title_bn, lang) : null);
}

/**
 * Soft availability switch. Never deletes questions or membership: removed content disappears from practice but every
 * bookmark, session answer and result keeps resolving. Making a book available again requires its content to still
 * be present (otherwise it must be reinstalled from a package); returns false in that case.
 */
export async function setBookAvailable(db: SqlDb, bookId: string, available: boolean, now: number = Date.now()): Promise<boolean> {
  if (!available) {
    const r = await db.runAsync("UPDATE content_books SET install_state = 'removed', updated_at = ? WHERE id = ? AND install_state IN ('bundled','installed')", [now, bookId]);
    return r.changes === 1;
  }
  const has = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_unit_questions WHERE book_id = ?", [bookId]);
  if (Number(has?.n ?? 0) === 0) return false;
  const r = await db.runAsync("UPDATE content_books SET install_state = 'installed', updated_at = ? WHERE id = ? AND install_state = 'removed'", [now, bookId]);
  return r.changes === 1;
}

/**
 * Recomputes the denormalized question_count cache for one book and its units in set-based statements. Display code
 * counts live rows instead; this cache only serves cheap catalogue listings and is refreshed on every install.
 */
export async function refreshBookCounts(db: SqlDb, bookId: string): Promise<void> {
  await db.runAsync(
    "UPDATE content_books SET question_count = (SELECT COUNT(DISTINCT question_id) FROM content_unit_questions WHERE book_id = ?) WHERE id = ?",
    [bookId, bookId]
  );
  await db.runAsync(
    `UPDATE content_units SET question_count = COALESCE((
       WITH RECURSIVE sub(id) AS (SELECT content_units.id UNION ALL SELECT u.id FROM content_units u JOIN sub s ON u.parent_id = s.id)
       SELECT COUNT(DISTINCT cq.question_id) FROM content_unit_questions cq WHERE cq.unit_id IN (SELECT id FROM sub)
     ), 0) WHERE book_id = ?`,
    [bookId]
  );
}

/**
 * Display labels for many book/unit scopes at once (history list): two set-based lookups, no per-session queries.
 * Scopes whose book no longer exists are omitted (the caller simply shows no label).
 */
export async function getScopeLabels(db: SqlDb, scopes: { bookId: string; unitId?: string | null }[], lang: "bn" | "en"): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (scopes.length === 0) return out;
  const bookIds = [...new Set(scopes.map((s) => s.bookId))];
  const unitIds = [...new Set(scopes.map((s) => s.unitId).filter((u): u is string => Boolean(u)))];
  const books = await db.getAllAsync<{ id: string; title: string; title_bn: string | null }>(
    `SELECT id, title, title_bn FROM content_books WHERE id IN (${bookIds.map(() => "?").join(",")})`, bookIds
  );
  const units = unitIds.length === 0 ? [] : await db.getAllAsync<{ id: string; book_id: string; title: string; title_bn: string | null }>(
    `SELECT id, book_id, title, title_bn FROM content_units WHERE id IN (${unitIds.map(() => "?").join(",")})`, unitIds
  );
  const bookMap = new Map(books.map((b) => [b.id, localizedName(b.title, b.title_bn, lang)]));
  const unitMap = new Map(units.map((u) => [`${u.book_id}|${u.id}`, localizedName(u.title, u.title_bn, lang)]));
  for (const s of scopes) {
    const title = bookMap.get(s.bookId);
    if (!title) continue;
    out.set(scopeKey(s), bookScopeLabel(title, s.unitId ? unitMap.get(`${s.bookId}|${s.unitId}`) ?? null : null));
  }
  return out;
}
