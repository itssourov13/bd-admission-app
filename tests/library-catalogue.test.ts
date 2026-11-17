import assert from "node:assert/strict";
import { test } from "node:test";
import { openMemoryDb } from "./helpers.ts";
import { MIGRATIONS, LATEST_VERSION, migrate } from "../src/db/schema.ts";
import { installLibraryPack } from "../src/services/libraryImporter.ts";
import { validateLibraryPack } from "../src/services/libraryPackValidator.ts";
import { getBook, listBooks, listPublishers } from "../src/repositories/library.ts";
import { filterBooks } from "../src/features/library/model.ts";
import type { LibraryPack } from "../src/types/library-pack.ts";

/** SYNTHETIC fixtures only (ids prefixed test-). No RU-V, ASPECT or any real publication data is loaded here. */
function pack(publisher: { id: string; slug: string; name: string }, bookId: string, over: Partial<LibraryPack["book"]> = {}): LibraryPack {
  return {
    schemaVersion: 1, kind: "library", publisher,
    book: { id: bookId, title: `Synthetic ${bookId}`, language: "en", targetCategory: "varsity", contentType: "question_bank", verificationStatus: "unverified", contentVersion: 1, licenseStatus: "metadata_only", ...over },
    sourceDocuments: [], units: [], questions: []
  };
}

test("migration v12 is additive: new nullable columns, no rows created or changed, retirement untouched", async () => {
  const db = openMemoryDb();
  assert.equal(await migrate(db, MIGRATIONS.filter((m) => m.version <= 11)), 11);
  const before = {
    books: Number((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_books"))?.n),
    publishers: Number((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM publishers"))?.n),
    batches: db.raw.prepare("SELECT id, retired_at FROM question_batches ORDER BY id").all()
  };
  assert.equal(await migrate(db), LATEST_VERSION);
  assert.ok(LATEST_VERSION >= 12);
  const cols = (db.raw.prepare("PRAGMA table_info(content_books)").all() as { name: string }[]).map((c) => c.name);
  for (const c of ["authors", "description", "collection", "identifiers_json", "exam_relevance_json", "coverage_note"]) assert.ok(cols.includes(c), c);
  assert.equal(Number((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_books"))?.n), before.books);
  assert.equal(Number((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM publishers"))?.n), before.publishers);
  assert.deepEqual(db.raw.prepare("SELECT id, retired_at FROM question_batches ORDER BY id").all(), before.batches);
  // Fresh database ends in the same shape and no ASPECT book exists after migration.
  assert.equal(Number((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM content_books WHERE publisher_id = 'pub-aspect'"))?.n), 0);
});

test("catalogue metadata round-trips through validator, importer and repository; absent metadata stays empty", async () => {
  const db = openMemoryDb();
  await migrate(db);
  const rich = pack({ id: "test-pub-a", slug: "test-pub-a", name: "Test Publisher A" }, "test-book-rich", {
    authors: "A. Author; B. Editor", description: "Synthetic description.", collection: "Synthetic Series",
    identifiers: { isbn: "000-0-00-000000-0" }, examRelevance: ["Test University"], coverageNote: "Sessions 2020-2021"
  });
  assert.equal(validateLibraryPack(rich).valid, true);
  const bare = pack({ id: "test-pub-b", slug: "test-pub-b", name: "Test Publisher B" }, "test-book-bare");
  for (const p of [rich, bare]) assert.equal((await installLibraryPack(db, p)).ok, true);
  const r = (await getBook(db, "test-book-rich"))!;
  assert.equal(r.authors, "A. Author; B. Editor");
  assert.equal(r.collection, "Synthetic Series");
  assert.deepEqual(r.identifiers, { isbn: "000-0-00-000000-0" });
  assert.deepEqual(r.examRelevance, ["Test University"]);
  assert.equal(r.coverageNote, "Sessions 2020-2021");
  const b = (await getBook(db, "test-book-bare"))!;
  assert.equal(b.authors, null);
  assert.deepEqual(b.identifiers, {});
  assert.deepEqual(b.examRelevance, []);
  // A second publisher's book never appears under the first publisher.
  assert.deepEqual((await listBooks(db, "test-pub-a")).map((x) => x.id), ["test-book-rich"]);
  // Reinstall with metadata removed clears it (data-driven, no stale values).
  assert.equal((await installLibraryPack(db, pack({ id: "test-pub-a", slug: "test-pub-a", name: "Test Publisher A" }, "test-book-rich", { contentVersion: 2 }))).ok, true);
  assert.equal((await getBook(db, "test-book-rich"))!.authors, null);
  assert.equal((await listPublishers(db)).find((p) => p.id === "pub-aspect")?.availableBooks, 0);
});

test("validator rejects malformed catalogue metadata", () => {
  const p = pack({ id: "test-pub-a", slug: "test-pub-a", name: "A" }, "test-book-x", { identifiers: { isbn: 5 as unknown as string }, examRelevance: "x" as unknown as string[] });
  const res = validateLibraryPack(p);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("identifiers")));
  assert.ok(res.errors.some((e) => e.includes("examRelevance")));
});

test("filterBooks is publisher-agnostic: text over title/collection/authors/identifiers, category and type", () => {
  const mk = (over: object) => ({ title: "T", titleBn: null, subject: null, collection: null, authors: null, publisherName: "P", publisherNameBn: null, identifiers: {}, targetCategory: "varsity" as const, contentType: "question_bank" as const, ...over });
  const books = [
    mk({ title: "Alpha Bank", collection: "Series One" }),
    mk({ title: "Beta Guide", contentType: "book", targetCategory: "medical", authors: "Dr. Rahman" }),
    mk({ title: "Gamma", identifiers: { isbn: "978-1" }, publisherName: "Other Press" })
  ];
  assert.equal(filterBooks(books, {}).length, 3);
  assert.deepEqual(filterBooks(books, { text: "series one" }).map((b) => b.title), ["Alpha Bank"]);
  assert.deepEqual(filterBooks(books, { text: "rahman" }).map((b) => b.title), ["Beta Guide"]);
  assert.deepEqual(filterBooks(books, { text: "978" }).map((b) => b.title), ["Gamma"]);
  assert.deepEqual(filterBooks(books, { text: "other press" }).map((b) => b.title), ["Gamma"]);
  assert.deepEqual(filterBooks(books, { category: "medical" }).map((b) => b.title), ["Beta Guide"]);
  assert.deepEqual(filterBooks(books, { contentType: "book" }).map((b) => b.title), ["Beta Guide"]);
  assert.equal(filterBooks(books, { category: "all", contentType: "all", text: "  " }).length, 3);
});

test("rights metadata: optional, round-trips, is owner-editable, and never blocks installation", async () => {
  const { updateBookRights } = await import("../src/repositories/library.ts");
  const { rightsNeedsAttention } = await import("../src/features/library/model.ts");
  const db = openMemoryDb();
  await migrate(db);
  const cols = (db.raw.prepare("PRAGMA table_info(content_books)").all() as { name: string }[]).map((c) => c.name);
  for (const c of ["rights_holder", "rights_reference", "rights_reviewed_on"]) assert.ok(cols.includes(c), c);

  // A book that declares no rights metadata at all stays valid and installs.
  const bare = pack({ id: "test-pub-unknown", slug: "test-pub-unknown", name: "Unknown / not identified" }, "test-book-rights", { licenseStatus: "permission_pending" });
  assert.equal(validateLibraryPack(bare).valid, true);
  assert.equal((await installLibraryPack(db, bare)).ok, true);
  let book = (await getBook(db, "test-book-rights"))!;
  assert.equal(book.rightsHolder, null);
  assert.equal(book.licenseStatus, "permission_pending");
  assert.equal(rightsNeedsAttention(book), true);

  // The owner records rights information; unknown details stay null, "" clears to null.
  assert.equal(await updateBookRights(db, "test-book-rights", { rightsHolder: "  ", rightsReference: "Letter on file (synthetic)", rightsReviewedOn: "2026-11-17" }), true);
  book = (await getBook(db, "test-book-rights"))!;
  assert.equal(book.rightsHolder, null);
  assert.equal(book.rightsReference, "Letter on file (synthetic)");
  assert.equal(book.rightsReviewedOn, "2026-11-17");
  assert.equal(await updateBookRights(db, "test-book-rights", { licenseStatus: "licensed", rightsHolder: "Synthetic Holder" }), true);
  book = (await getBook(db, "test-book-rights"))!;
  assert.equal(book.licenseStatus, "licensed");
  assert.equal(rightsNeedsAttention(book), false);
  assert.equal(book.installState, "catalogue_only"); // nothing else about the book changed

  // Invalid patches and unknown books are rejected without writing.
  assert.equal(await updateBookRights(db, "test-book-rights", { licenseStatus: "bogus" as never }), false);
  assert.equal(await updateBookRights(db, "test-book-rights", { rightsReviewedOn: "17/11/2026" }), false);
  assert.equal(await updateBookRights(db, "test-missing", { rightsHolder: "x" }), false);
  assert.equal((await getBook(db, "test-book-rights"))!.licenseStatus, "licensed");

  // Pack-level rights fields are type-checked.
  assert.equal(validateLibraryPack(pack({ id: "test-p", slug: "test-p", name: "P" }, "test-b", { rightsReviewedOn: "yesterday" })).valid, false);
});

test("collection discovery and filtering are data-driven and publisher-agnostic", async () => {
  const { listCollections, isFilterActive } = await import("../src/features/library/model.ts");
  const { listAllBooks } = await import("../src/repositories/library.ts");
  const db = openMemoryDb();
  await migrate(db);
  // Two different synthetic publishers; one book in a collection, one without, one in a differently-cased collection.
  await installLibraryPack(db, pack({ id: "test-pub-a", slug: "test-pub-a", name: "Alpha Press" }, "test-book-a", { collection: "Test Section", subject: "Physics" }));
  await installLibraryPack(db, pack({ id: "test-pub-b", slug: "test-pub-b", name: "Beta Books" }, "test-book-b", { collection: "test section", authors: "Synthetic Author" }));
  await installLibraryPack(db, pack({ id: "test-pub-b", slug: "test-pub-b", name: "Beta Books" }, "test-book-c"));
  const all = await listAllBooks(db);
  assert.equal(all.length, 3);
  assert.deepEqual(listCollections(all).map((c) => [c.name, c.count]), [["Test Section", 2]]);
  assert.equal(filterBooks(all, { collection: "TEST SECTION" }).length, 2);
  assert.deepEqual(filterBooks(all, { collection: "Test Section", text: "synthetic author" }).map((b) => b.id), ["test-book-b"]);
  assert.equal(filterBooks(all, { collection: "all" }).length, 3);
  assert.equal(filterBooks(all, { text: "beta" }).length, 2); // publisher name search
  assert.equal(filterBooks(all, { text: "no-such-thing" }).length, 0);
  assert.equal(isFilterActive({}), false);
  assert.equal(isFilterActive({ collection: "all", category: "all", text: "  " }), false);
  assert.equal(isFilterActive({ text: "x" }), true);
  assert.equal(isFilterActive({ collection: "Test Section" }), true);
});
