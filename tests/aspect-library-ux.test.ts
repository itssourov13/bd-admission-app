import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { orderUnitTree } from "../src/features/library/model.ts";
import { booksForPublisher, effectivePublisherId, presentPublishers, universityKeyForBook } from "../src/features/library/presentation.ts";
import { groupUnitsByRoot, hasSessionHierarchy, setCardTitle, splitSetTitle } from "../src/features/library/sessions.ts";
import { KNOWN_UNIVERSITIES } from "../src/features/catalog/universities.ts";
import type { BookSummary, PublisherSummary, UnitRow } from "../src/types/domain.ts";

const PACK = JSON.parse(readFileSync(new URL("../data/library-packs/ruv-aspect-library-pack.json", import.meta.url), "utf8"));

const pub = (id: string, slug: string, name: string, over: Partial<PublisherSummary> = {}): PublisherSummary => ({
  id, slug, name, nameBn: null, kind: "publisher", description: null, website: null, logoKey: null,
  availableBooks: 0, installedBooks: 0, unavailableBooks: 0, questionCount: 0, categories: [], ...over
});
const book = (id: string, publisherId: string, collection: string | null, over: Partial<BookSummary> = {}) =>
  ({ id, publisherId, collection, installState: "bundled", questionCount: 10, targetCategory: "varsity", ...over }) as BookSummary;

test("brand attribution moves an unidentified book under its ASPECT collection publisher and drops the empty duplicate", () => {
  const unid = pub("pub-unidentified", "unidentified", "Unknown", { availableBooks: 1, questionCount: 1828, categories: ["varsity"] });
  const aspect = pub("pub-aspect", "aspect", "ASPECT");
  const udvash = pub("pub-udvash", "udvash", "Udvash");
  const b = book("b1", "pub-unidentified", "ASPECT", { questionCount: 1828 });
  const out = presentPublishers([unid, aspect, udvash], [b]);
  assert.deepEqual(out.map((p) => p.id), ["pub-aspect", "pub-udvash"]);
  const a = out[0];
  assert.equal(a.availableBooks, 1);
  assert.equal(a.questionCount, 1828);
  assert.deepEqual(a.categories, ["varsity"]);
  assert.strictEqual(out[1], udvash, "unaffected publisher rows are returned unchanged");
  assert.deepEqual(booksForPublisher([b], [unid, aspect, udvash], "pub-aspect"), [b]);
  assert.deepEqual(booksForPublisher([b], [unid, aspect, udvash], "pub-unidentified"), []);
  assert.equal(b.publisherId, "pub-unidentified", "stored provenance is never rewritten");
});

test("brand attribution never hijacks a genuinely attributed book or an unrelated collection", () => {
  const unid = pub("pub-unidentified", "unidentified", "Unknown");
  const aspect = pub("pub-aspect", "aspect", "ASPECT");
  const udvash = pub("pub-udvash", "udvash", "Udvash");
  assert.equal(effectivePublisherId(book("x", "pub-udvash", "ASPECT"), [unid, aspect, udvash]), "pub-udvash");
  assert.equal(effectivePublisherId(book("y", "pub-unidentified", "Some Series"), [unid, aspect, udvash]), "pub-unidentified");
  assert.equal(effectivePublisherId(book("z", "pub-unidentified", null), [unid, aspect, udvash]), "pub-unidentified");
  const kept = pub("pub-unidentified", "unidentified", "Unknown", { availableBooks: 1 });
  assert.deepEqual(presentPublishers([kept, aspect], [book("y", "pub-unidentified", "Some Series")]).map((p) => p.id), ["pub-unidentified", "pub-aspect"]);
  // An unidentified publisher that still has other books stays, with recomputed counts.
  const out = presentPublishers([kept, aspect], [book("m", "pub-unidentified", "aspect"), book("n", "pub-unidentified", "Other", { questionCount: 7 })]);
  assert.equal(out.find((p) => p.id === "pub-unidentified")!.questionCount, 7);
  assert.equal(out.find((p) => p.id === "pub-aspect")!.availableBooks, 1);
});

test("a book matching a collection brand is recognised case-insensitively and NFC-normalised", () => {
  const unid = pub("pub-unidentified", "unidentified", "Unknown");
  const aspect = pub("pub-aspect", "aspect", "ASPECT");
  assert.equal(effectivePublisherId(book("a", "pub-unidentified", "  Aspect "), [unid, aspect]), "pub-aspect");
});

test("university key is derived from exam relevance, never guessed", () => {
  assert.equal(universityKeyForBook(["Rajshahi University"], KNOWN_UNIVERSITIES), "ru");
  assert.equal(universityKeyForBook(["Dhaka University admission"], KNOWN_UNIVERSITIES), "du");
  assert.equal(universityKeyForBook([], KNOWN_UNIVERSITIES), null);
  assert.equal(universityKeyForBook(["BUET"], KNOWN_UNIVERSITIES), null);
});

const units = (): UnitRow[] => orderUnitTree(PACK.units.map((u: { id: string; parentId: string | null; kind: UnitRow["kind"]; title: string; titleBn: string | null; sortOrder: number }) =>
  ({ id: u.id, bookId: PACK.book.id, parentId: u.parentId, kind: u.kind, title: u.title, titleBn: u.titleBn, sortOrder: u.sortOrder, questionCount: 0 }))) as UnitRow[];

test("ASPECT pack units group into 9 session drawers holding the 17 source sets", () => {
  const groups = groupUnitsByRoot(units());
  assert.equal(groups.length, 9);
  assert.equal(groups.reduce((n, g) => n + g.children.length, 0), 17);
  assert.equal(hasSessionHierarchy(groups), true);
  const by = Object.fromEntries(groups.map((g) => [g.root.title, g.children.map((c) => c.title)]));
  assert.deepEqual(by["Session 2024-2025"], ["Unit A — মহানন্দা", "Unit A — পদ্মা"]);
  assert.equal(by["Session 2017-2018"].length, 3);
  assert.equal(by["Session 2018-2019"].length, 2);
  assert.equal(by["Session 2020-2021"].length, 1);
  assert.ok(groups.every((g) => g.root.depth === 0 && g.children.every((c) => c.parentId === g.root.id)));
});

test("flat books keep the plain list and orphan children are never dropped", () => {
  const flat = orderUnitTree([{ id: "u1", bookId: "b", parentId: null, kind: "chapter", title: "One", titleBn: null, sortOrder: 1, questionCount: 3 }]) as UnitRow[];
  assert.equal(hasSessionHierarchy(groupUnitsByRoot(flat)), false);
  assert.equal(groupUnitsByRoot([{ ...flat[0], depth: 1 }]).length, 1);
});

test("set titles split on the dash separator and number sets within their session", () => {
  assert.deepEqual(splitSetTitle("Unit C — মেঘনা"), { unit: "Unit C", name: "মেঘনা" });
  assert.deepEqual(splitSetTitle("Unit C — Feldsper-1"), { unit: "Unit C", name: "Feldsper-1" });
  assert.deepEqual(splitSetTitle("Plain"), { unit: null, name: "Plain" });
  const digits = (n: number) => String(n);
  assert.equal(setCardTitle({ title: "Unit A — পদ্মা", titleBn: "ইউনিট A — পদ্মা" }, 2, "en", digits, "Set").heading, "Set 2 — পদ্মা");
  assert.equal(setCardTitle({ title: "Unit D1 — সেট ০১", titleBn: null }, 2, "bn", digits, "সেট").heading, "সেট ০১", "no 'Set 1 — Set 01' duplication");
  assert.equal(setCardTitle({ title: "Unit A — মহানন্দা", titleBn: "ইউনিট A — মহানন্দা" }, 1, "bn", digits, "সেট").unitLabel, "ইউনিট A");
});

test("ASPECT pack verification state is consistent between book and questions", () => {
  assert.equal(PACK.book.verificationStatus, "verified");
  assert.equal(PACK.book.licenseStatus, "licensed");
  assert.equal(PACK.book.contentVersion, 2);
  assert.equal(PACK.publisher.id, "pub-unidentified", "stored provenance stays (ADR-038)");
  let verified = 0, noCorrect = 0, held = 0, multi = 0;
  for (const q of PACK.questions) {
    const keys: string[] = q.correctOptionIds ?? [];
    if (q.answerDisposition === "no_correct_option") { noCorrect++; assert.equal(keys.length, 0); assert.equal(q.answerVerificationStatus, "verified"); continue; }
    if (q.answerDisposition === "source_conflict") { held++; assert.equal(keys.length, 0); assert.notEqual(q.answerVerificationStatus, "verified"); continue; }
    assert.ok(keys.length >= 1, `${q.id} must keep its source key`);
    const ids = new Set(q.options.map((o: { id: string }) => o.id));
    assert.ok(keys.every((k) => ids.has(k)), `${q.id} key maps to an option`);
    assert.equal(q.answerVerificationStatus, "verified");
    assert.equal(q.contentVerificationStatus, "verified");
    verified++;
    if (keys.length > 1) multi++;
  }
  assert.equal(noCorrect, 22);
  assert.equal(held, 2);
  assert.equal(multi, 6);
  assert.equal(verified + noCorrect, 1826);
});
