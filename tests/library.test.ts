import assert from "node:assert/strict";
import { test } from "node:test";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { installLibraryPack, libraryBatchId } from "../src/services/libraryImporter.ts";
import { validateLibraryPack } from "../src/services/libraryPackValidator.ts";
import { getBook, getBookScopeLabel, getPublisher, listBookQuestionIds, listBooks, listPublishers, listUnits, refreshBookCounts, setBookAvailable } from "../src/repositories/library.ts";
import { countEligible, countPoolBySubject, eligibleQuestionIds, resolveRuleForQuestions } from "../src/repositories/content.ts";
import { href, scopeFromParams, scopeParams } from "../src/features/navigation/links.ts";
import { bookPracticeState, isBookAvailable, orderUnitTree, publisherMonogram } from "../src/features/library/model.ts";
import { checkExamEligibility, planExam } from "../src/services/exam.ts";
import { startStandardExam } from "../src/services/practiceService.ts";
import { toggleBookmark } from "../src/repositories/userData.ts";
import { MIGRATIONS, LATEST_VERSION } from "../src/db/schema.ts";
import type { LibraryPack } from "../src/types/library-pack.ts";

/** SYNTHETIC test content only (ids prefixed test-). Never bundled and never presented as a real publication. */
function libPack(over: Partial<LibraryPack["book"]> = {}, questionCount = 6, version = 1): LibraryPack {
  const questions = Array.from({ length: questionCount }, (_, i) => ({
    id: `test-lq-${i + 1}`,
    text: `Synthetic library question ${i + 1}`,
    type: "single_choice" as const,
    category: "varsity" as const,
    subject: i % 2 === 0 ? "Physics" : "Chemistry",
    options: ["a", "b", "c", "d"].map((id, n) => ({ id, text: `Option ${id.toUpperCase()}${i}`, order: n + 1 })),
    correctOptionIds: ["b"],
    answerVerificationStatus: "verified" as const,
    contentVerificationStatus: "verified" as const,
    // 1-2 -> section 1.1, 3 -> chapter 1 directly, 4-6 -> chapter 2
    unitIds: i < 2 ? ["test-u-1-1"] : i === 2 ? ["test-u-1"] : ["test-u-2"],
    source: { documentId: "test-doc", pageNumber: i + 1, questionNumber: i + 1 }
  }));
  return {
    schemaVersion: 1, kind: "library",
    publisher: { id: "pub-udvash", slug: "udvash", name: "Udvash" },
    book: {
      id: "test-book-1", title: "Synthetic Question Bank", edition: "Test", publicationYear: 2026, subject: "Physics", language: "en",
      targetCategory: "varsity", contentType: "question_bank", verificationStatus: "verified", contentVersion: version,
      licenseStatus: "owner_created", licenseNote: "Synthetic test fixture", ...over
    },
    sourceDocuments: [{ id: "test-doc", filename: "synthetic-library.json", sourceType: "structured-data" }],
    units: [
      { id: "test-u-1", kind: "chapter", title: "Chapter 1", sortOrder: 1 },
      { id: "test-u-1-1", parentId: "test-u-1", kind: "section", title: "Section 1.1", sortOrder: 1 },
      { id: "test-u-2", kind: "chapter", title: "Chapter 2", sortOrder: 2 }
    ],
    questions
  };
}

test("migration v8 creates the library tables and seeds exactly five metadata-only publishers", async () => {
  assert.equal(LATEST_VERSION >= 8, true);
  assert.equal(MIGRATIONS.some((m) => m.version === 8 && m.name === "publications_library"), true);
  const db = await freshDb();
  const publishers = await listPublishers(db);
  assert.deepEqual(publishers.map((p) => p.slug), ["udvash", "aspect", "acs", "pankouri", "joykoli"]);
  for (const p of publishers) {
    assert.equal(p.availableBooks, 0); assert.equal(p.questionCount, 0); assert.equal(p.logoKey, null); assert.deepEqual(p.categories, []);
  }
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_books"))?.n, 0);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_unit_questions"))?.n, 0);
});

test("validator accepts a licensed pack and blocks content without a content licence", () => {
  assert.equal(validateLibraryPack(libPack()).valid, true);
  for (const licenseStatus of ["permission_pending", "metadata_only"] as const) {
    const v = validateLibraryPack(libPack({ licenseStatus }));
    assert.equal(v.valid, false);
    assert.match(v.errors.join("|"), /licenseStatus/);
  }
  const meta = libPack({ licenseStatus: "permission_pending", verificationStatus: "metadata_only" }, 0);
  meta.units = [];
  assert.equal(validateLibraryPack(meta).valid, true);
});

test("validator rejects structural problems", () => {
  const bad = libPack();
  bad.units.push({ id: "test-u-orphan", parentId: "missing", kind: "section", title: "x", sortOrder: 9 });
  bad.questions[0].unitIds = ["nope"];
  bad.questions[1].correctOptionIds = ["zzz"];
  bad.questions[2].id = bad.questions[3].id;
  const v = validateLibraryPack(bad);
  assert.equal(v.valid, false);
  const text = v.errors.join("|");
  assert.match(text, /missing parent/); assert.match(text, /missing unit/); assert.match(text, /does not exist/); assert.match(text, /Duplicate question id/);
  const cyc = libPack();
  cyc.units[0].parentId = "test-u-1-1";
  assert.match(validateLibraryPack(cyc).errors.join("|"), /cycle/);
  assert.equal(validateLibraryPack({ kind: "library" }).valid, false);
  assert.equal(validateLibraryPack(null).valid, false);
});

test("install adds a book with units, membership and honest counts", async () => {
  const db = await freshDb();
  const report = await installLibraryPack(db, libPack());
  assert.equal(report.ok, true, report.errors.join("; "));
  assert.deepEqual(report.questions, { inserted: 6, updated: 0, skipped: 0 });
  assert.equal(report.units, 3);
  assert.equal(report.memberships, 6);
  const book = await getBook(db, "test-book-1");
  assert.ok(book);
  assert.equal(book.installState, "installed"); assert.equal(book.questionCount, 6); assert.equal(book.eligibleCount, 6);
  assert.equal(bookPracticeState(book), "ready");
  const udvash = await getPublisher(db, "pub-udvash");
  assert.equal(udvash?.availableBooks, 1); assert.equal(udvash?.installedBooks, 1); assert.equal(udvash?.questionCount, 6); assert.deepEqual(udvash?.categories, ["varsity"]);
  assert.equal((await getPublisher(db, "pub-aspect"))?.availableBooks, 0);
  assert.equal((await listBooks(db, "pub-udvash")).length, 1);
  // Denormalized cache agrees with live counts.
  const cache = await db.getFirstAsync<{ question_count: number }>("SELECT question_count FROM content_books WHERE id = 'test-book-1'");
  assert.equal(Number(cache?.question_count), 6);
});

test("unit tree: depth/order and descendant-inclusive distinct counts", async () => {
  const db = await freshDb();
  await installLibraryPack(db, libPack());
  const units = await listUnits(db, "test-book-1");
  assert.deepEqual(units.map((u) => [u.id, u.depth, u.questionCount]), [["test-u-1", 0, 3], ["test-u-1-1", 1, 2], ["test-u-2", 0, 3]]);
  const cache = await db.getAllAsync<{ id: string; question_count: number }>("SELECT id, question_count FROM content_units WHERE book_id = 'test-book-1' ORDER BY id");
  assert.deepEqual(cache.map((c) => [c.id, Number(c.question_count)]), [["test-u-1", 3], ["test-u-1-1", 2], ["test-u-2", 3]]);
  // A question filed in both a chapter and its section is counted once.
  const dup = libPack();
  dup.questions[0].unitIds = ["test-u-1", "test-u-1-1"];
  const db2 = await freshDb();
  assert.equal((await installLibraryPack(db2, dup)).ok, true);
  assert.equal((await listUnits(db2, "test-book-1")).find((u) => u.id === "test-u-1")?.questionCount, 3);
});

test("book and unit scopes select only book questions; descendants are included", async () => {
  const db = await freshDb();
  await installLibraryPack(db, libPack());
  assert.equal((await eligibleQuestionIds(db, { bookId: "test-book-1" })).length, 6);
  assert.deepEqual((await eligibleQuestionIds(db, { bookId: "test-book-1", unitId: "test-u-1" })).sort(), ["test-lq-1", "test-lq-2", "test-lq-3"]);
  assert.deepEqual((await eligibleQuestionIds(db, { bookId: "test-book-1", unitId: "test-u-1-1" })).sort(), ["test-lq-1", "test-lq-2"]);
  assert.deepEqual((await eligibleQuestionIds(db, { bookId: "test-book-1", unitId: "test-u-2" })).sort(), ["test-lq-4", "test-lq-5", "test-lq-6"]);
  // A unit id from another book never matches.
  assert.equal((await eligibleQuestionIds(db, { bookId: "test-book-1", unitId: "unit-of-another-book" })).length, 0);
  assert.equal((await eligibleQuestionIds(db, { bookId: "no-such-book" })).length, 0);
  const pool = await countPoolBySubject(db, { bookId: "test-book-1" }, false);
  assert.equal(pool.total, 6); assert.deepEqual(pool.bySubject, { Physics: 3, Chemistry: 3 });
  // Browse order follows the book's own order and honours unit + subject filters.
  assert.deepEqual(await listBookQuestionIds(db, { bookId: "test-book-1" }, 4, 0), ["test-lq-1", "test-lq-2", "test-lq-3", "test-lq-4"]);
  assert.deepEqual(await listBookQuestionIds(db, { bookId: "test-book-1", unitId: "test-u-2" }, 10, 0, "Physics"), ["test-lq-5"]);
});

test("book-only questions never enter the university pool; university content never enters a book pool", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack())).ok, true);
  await installLibraryPack(db, libPack());
  const university = await eligibleQuestionIds(db, {});
  assert.deepEqual(university.sort(), ["q-syn-1", "q-syn-2", "q-syn-3"]);
  assert.equal((await countEligible(db, { category: "varsity" })), 3);
  assert.equal((await eligibleQuestionIds(db, { bookId: "test-book-1" })).every((id) => id.startsWith("test-lq-")), true);
});

test("a removed book leaves practice but keeps rows, bookmarks and session history intact", async () => {
  const db = await freshDb();
  await installLibraryPack(db, libPack());
  await toggleBookmark(db, "test-lq-1");
  const started = await startStandardExam(db, { bookId: "test-book-1" }, 1_000, undefined, { custom: { questions: 5, seconds: 600 } });
  assert.equal(started.ok, true);
  const before = {
    q: (await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))?.n,
    sq: (await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM session_questions"))?.n
  };
  assert.equal(await setBookAvailable(db, "test-book-1", false, 2_000), true);
  assert.equal((await getBook(db, "test-book-1"))?.installState, "removed");
  assert.equal(isBookAvailable("removed"), false);
  assert.equal((await eligibleQuestionIds(db, { bookId: "test-book-1" })).length, 0);
  assert.equal((await listBookQuestionIds(db, { bookId: "test-book-1" }, 10, 0)).length, 0);
  assert.equal((await getPublisher(db, "pub-udvash"))?.availableBooks, 0);
  assert.equal((await getPublisher(db, "pub-udvash"))?.unavailableBooks, 1);
  assert.equal(bookPracticeState((await getBook(db, "test-book-1"))!), "none");
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))?.n, before.q);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM session_questions"))?.n, before.sq);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM bookmarks WHERE question_id = 'test-lq-1'"))?.n, 1);
  // Content is still present, so it can be made available again without a download.
  assert.equal(await setBookAvailable(db, "test-book-1", true, 3_000), true);
  assert.equal((await eligibleQuestionIds(db, { bookId: "test-book-1" })).length, 6);
});

test("reinstall is idempotent; update replaces membership but never deletes dropped questions", async () => {
  const db = await freshDb();
  await installLibraryPack(db, libPack());
  const again = await installLibraryPack(db, libPack());
  assert.equal(again.ok, true); assert.deepEqual(again.questions, { inserted: 0, updated: 0, skipped: 6 }); assert.equal(again.previousVersion, 1);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))?.n, 6);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_unit_questions"))?.n, 6);

  await toggleBookmark(db, "test-lq-6");
  const v2 = libPack({}, 5, 2); // question 6 is dropped in version 2
  v2.questions[0].text = "Synthetic library question 1 (revised)";
  const upd = await installLibraryPack(db, v2);
  assert.equal(upd.ok, true, upd.errors.join("; "));
  assert.deepEqual(upd.questions, { inserted: 0, updated: 1, skipped: 4 });
  assert.equal((await getBook(db, "test-book-1"))?.contentVersion, 2);
  assert.equal((await eligibleQuestionIds(db, { bookId: "test-book-1" })).includes("test-lq-6"), false);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE id = 'test-lq-6'"))?.n, 1);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM bookmarks WHERE question_id = 'test-lq-6'"))?.n, 1);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM question_options WHERE question_id = 'test-lq-1'"))?.n, 4);

  const down = await installLibraryPack(db, libPack({}, 6, 1));
  assert.equal(down.ok, false); assert.match(down.errors.join("|"), /downgrade/);
  assert.equal((await getBook(db, "test-book-1"))?.contentVersion, 2);
});

test("failed installs roll back completely and ids never merge across batches", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack())).ok, true);
  const clash = libPack();
  clash.questions[3].id = "q-syn-1"; // already owned by a university pack
  const r = await installLibraryPack(db, clash);
  assert.equal(r.ok, false); assert.match(r.errors.join("|"), /already exists in batch/);
  for (const table of ["content_books", "content_units", "content_unit_questions"]) {
    assert.equal((await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n, 0, table);
  }
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE id LIKE 'test-lq-%'"))?.n, 0);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM question_batches WHERE id = ?", [libraryBatchId("test-book-1")]))?.n, 0);
  const invalid = await installLibraryPack(db, libPack({ licenseStatus: "permission_pending" }));
  assert.equal(invalid.ok, false);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_books"))?.n, 0);
});

test("book practice never inherits a university paper's rule, even for questions that also appear in a paper", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack({}, 3))).ok, true);
  const shared = libPack({}, 3);
  const r = await installLibraryPack(db, shared);
  assert.equal(r.ok, true);
  // Make a book question also a university paper question (same row, extra appearance).
  await db.runAsync("INSERT INTO question_appearances (question_id, paper_id, question_number, page_number) VALUES ('test-lq-1', 'paper-syn-2025', 99, 1)");
  const paperRule = await resolveRuleForQuestions(db, ["test-lq-1"], {});
  assert.equal(paperRule.status, "illustrative");
  const bookRule = await resolveRuleForQuestions(db, ["test-lq-1"], { bookId: "test-book-1" });
  assert.equal(bookRule.status, "unconfigured");
  assert.equal(bookRule.correctMarks, null);
});

test("standard exam on a book is explicit unscored Custom Practice and retains the book scope", async () => {
  const db = await freshDb();
  await installLibraryPack(db, libPack({}, 10));
  assert.equal(planExam(undefined, null, { bookScoped: true }).kind, "unavailable");
  assert.equal(planExam(undefined, null).kind, "generic");
  const refused = await startStandardExam(db, { bookId: "test-book-1" }, 1_000);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.reason, "rule_unavailable");
  const ok = await startStandardExam(db, { bookId: "test-book-1", unitId: "test-u-2" }, 1_000, undefined, { custom: { questions: 5, seconds: 300 } });
  assert.equal(ok.ok, true); // unit 2 holds 7 of the 10 questions
  if (ok.ok) {
    const f = JSON.parse((await db.getFirstAsync<{ filter_json: string }>("SELECT filter_json FROM practice_sessions WHERE id = ?", [ok.sessionId]))!.filter_json);
    assert.equal(f.unitId, "test-u-2");
  }
  const whole = await startStandardExam(db, { bookId: "test-book-1" }, 1_000, undefined, { custom: { questions: 5, seconds: 300 } });
  assert.equal(whole.ok, true);
  if (whole.ok) {
    const s = await db.getFirstAsync<{ filter_json: string; rule_status: string; rule_correct_marks: number | null }>("SELECT filter_json, rule_status, rule_correct_marks FROM practice_sessions WHERE id = ?", [whole.sessionId]);
    const filter = JSON.parse(s!.filter_json);
    assert.equal(filter.bookId, "test-book-1"); assert.equal(filter.customPractice, true);
    assert.equal(s!.rule_correct_marks, null);
    const ids = (await db.getAllAsync<{ question_id: string }>("SELECT question_id FROM session_questions WHERE session_id = ?", [whole.sessionId])).map((r) => r.question_id);
    assert.equal(ids.length, 5); assert.equal(ids.every((id) => id.startsWith("test-lq-")), true);
  }
  assert.equal(checkExamEligibility(3, 5).ok, false);
});

test("scope params round-trip bookId/unitId and reject malformed ids", () => {
  const p = scopeParams({ bookId: "test-book-1", unitId: "test-u-1" });
  assert.deepEqual([p.bookId, p.unitId], ["test-book-1", "test-u-1"]);
  assert.equal(String(href("/flash/setup", p)).includes("bookId=test-book-1"), true);
  assert.deepEqual(scopeFromParams({ bookId: "test-book-1", unitId: "test-u-1" }), { bookId: "test-book-1", unitId: "test-u-1", category: undefined, institutionId: undefined, paperId: undefined, subject: undefined });
  assert.equal(scopeFromParams({ bookId: "bad id; DROP TABLE" }).bookId, undefined);
  // A unit without a valid book is dropped, never trusted on its own.
  assert.equal(scopeFromParams({ unitId: "test-u-1" }).unitId, undefined);
  assert.equal(scopeParams({ unitId: "orphan" }).unitId, undefined);
});

test("scope labels resolve book and unit titles with Bangla fallback", async () => {
  const db = await freshDb();
  const pack = libPack({ titleBn: "সিন্থেটিক বই" });
  pack.units[0].titleBn = "অধ্যায় ১";
  await installLibraryPack(db, pack);
  assert.equal(await getBookScopeLabel(db, { bookId: "test-book-1" }, "en"), "Synthetic Question Bank");
  assert.equal(await getBookScopeLabel(db, { bookId: "test-book-1", unitId: "test-u-1" }, "bn"), "সিন্থেটিক বই — অধ্যায় ১");
  assert.equal(await getBookScopeLabel(db, { bookId: "test-book-1", unitId: "test-u-2" }, "bn"), "সিন্থেটিক বই — Chapter 2");
  assert.equal(await getBookScopeLabel(db, { bookId: "missing" }, "en"), null);
});

test("catalogue-only metadata pack records a book without content or counts", async () => {
  const db = await freshDb();
  const meta = libPack({ licenseStatus: "permission_pending", verificationStatus: "metadata_only" }, 0);
  meta.units = [];
  const r = await installLibraryPack(db, meta);
  assert.equal(r.ok, true, r.errors.join("; "));
  const book = await getBook(db, "test-book-1");
  assert.equal(book?.installState, "catalogue_only"); assert.equal(book?.questionCount, 0);
  assert.equal((await getPublisher(db, "pub-udvash"))?.availableBooks, 0);
  assert.equal((await getPublisher(db, "pub-udvash"))?.unavailableBooks, 1);
  assert.equal(await setBookAvailable(db, "test-book-1", true), false); // nothing to make available
  await refreshBookCounts(db, "test-book-1");
});

test("pure model helpers: monogram and unit ordering", () => {
  assert.equal(publisherMonogram("ACS"), "ACS");
  assert.equal(publisherMonogram("ASPECT"), "AS");
  assert.equal(publisherMonogram("Udvash"), "UD");
  assert.equal(publisherMonogram("Joy Koli"), "JK");
  assert.equal(publisherMonogram("  "), "?");
  const rows = [
    { id: "b", bookId: "x", parentId: "a", kind: "section" as const, title: "B", titleBn: null, sortOrder: 1 },
    { id: "a", bookId: "x", parentId: null, kind: "chapter" as const, title: "A", titleBn: null, sortOrder: 2 },
    { id: "c", bookId: "x", parentId: "ghost", kind: "chapter" as const, title: "C", titleBn: null, sortOrder: 1 },
    { id: "loop1", bookId: "x", parentId: "loop2", kind: "unit" as const, title: "L1", titleBn: null, sortOrder: 5 },
    { id: "loop2", bookId: "x", parentId: "loop1", kind: "unit" as const, title: "L2", titleBn: null, sortOrder: 5 }
  ];
  const ordered = orderUnitTree(rows);
  assert.equal(ordered.length, rows.length); // nothing hidden, even for orphans and cycles
  assert.deepEqual(ordered.slice(0, 3).map((r) => [r.id, r.depth]), [["c", 0], ["a", 0], ["b", 1]]);
});

test("batch scope labels (history) match single lookups and omit unknown books", async () => {
  const { getScopeLabels } = await import("../src/repositories/library.ts");
  const { scopeKey } = await import("../src/features/library/model.ts");
  const db = await freshDb();
  const pack = libPack({ titleBn: "সিন্থেটিক বই" });
  pack.units[0].titleBn = "অধ্যায় ১";
  await installLibraryPack(db, pack);
  const labels = await getScopeLabels(db, [{ bookId: "test-book-1" }, { bookId: "test-book-1", unitId: "test-u-1" }, { bookId: "missing" }], "bn");
  assert.equal(labels.get(scopeKey({ bookId: "test-book-1" })), "সিন্থেটিক বই");
  assert.equal(labels.get(scopeKey({ bookId: "test-book-1", unitId: "test-u-1" })), "সিন্থেটিক বই — অধ্যায় ১");
  assert.equal(labels.has(scopeKey({ bookId: "missing" })), false);
  assert.equal((await getScopeLabels(db, [], "en")).size, 0);
});

test("publisher sections group books by real metadata and hide empty sections", async () => {
  const { groupBooksIntoSections, bookSectionOf } = await import("../src/features/library/model.ts");
  const mk = (contentType: "book" | "question_bank" | "model_test" | "mixed", targetCategory: "varsity" | "medical" | "engineering" | "general", subject: string | null = null) => ({ contentType, targetCategory, subject });
  assert.equal(bookSectionOf(mk("book", "varsity")), "books");
  assert.equal(bookSectionOf(mk("question_bank", "varsity")), "varsity");
  assert.equal(bookSectionOf(mk("question_bank", "engineering")), "engineering");
  assert.equal(bookSectionOf(mk("model_test", "medical")), "medical");
  assert.equal(bookSectionOf(mk("question_bank", "general", "Physics")), "subject");
  assert.equal(bookSectionOf(mk("mixed", "general")), "other");
  assert.deepEqual(groupBooksIntoSections([]), []);
  const grouped = groupBooksIntoSections([mk("mixed", "general"), mk("question_bank", "varsity"), mk("book", "medical")]);
  assert.deepEqual(grouped.map((g) => g.key), ["books", "varsity", "other"]);
});
