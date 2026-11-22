import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { freshDb } from "./helpers.ts";
import { syncFromSeed } from "../src/services/seedSync.ts";
import { installLibraryPack } from "../src/services/libraryImporter.ts";
import { BUNDLED_MANIFEST } from "../src/content/bundledManifest.ts";
import { getBook, listAllBooks, listBookQuestionIds, listUnits } from "../src/repositories/library.ts";
import { loadQuestions } from "../src/repositories/content.ts";
import type { LibraryPack } from "../src/types/library-pack.ts";

// Real generated seed + real bundled manifest -> fresh user database. Skips when the (gitignored) seed is not built.
const SEED = new URL("../assets/content/content_seed.db", import.meta.url).pathname;
const PACK = new URL("../data/library-packs/ruv-aspect-library-pack.json", import.meta.url).pathname;
const BOOK = "aspect-ru-question-bank-verified-sets";
const present = existsSync(SEED) && existsSync(PACK);

test("bundled RU-V ASPECT book syncs from the seed into a fresh database, idempotently", { skip: !present && "seed or pack not built" }, async () => {
  const pack = JSON.parse(readFileSync(PACK, "utf8")) as LibraryPack;
  assert.ok(BUNDLED_MANIFEST.packs.some((p) => p.libraryBookId === BOOK && p.questions === 1828));
  const db = await freshDb();
  const open = async () => ({ path: SEED, release: async () => undefined });
  const first = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed: open, now: 1 });
  assert.deepEqual(first.filter((o) => o.status === "failed"), []);

  const book = await getBook(db, BOOK);
  assert.ok(book);
  assert.equal(book.collection, "ASPECT");
  assert.equal(book.installState, "bundled");
  assert.equal(book.licenseStatus, "licensed");
  assert.equal(book.verificationStatus, "verified");
  assert.equal(book.contentVersion, 2);
  // owner attestation 2026-11-18: 1,826 verified (1,804 scorable + 22 no-correct-option); 2 conflicts stay unverified
  assert.equal(book.eligibleCount, 1804);
  assert.equal(book.reviewCandidateCount, 0, "no provisional candidates remain: every scorable question is verified");
  const statuses = await db.getAllAsync<{ answer_status: string; content_status: string; n: number }>(
    "SELECT answer_status, content_status, COUNT(*) AS n FROM questions WHERE batch_id = ? GROUP BY answer_status, content_status ORDER BY n DESC", [`lib-${BOOK}`]);
  assert.deepEqual(statuses.map((r) => `${r.answer_status}/${r.content_status}/${Number(r.n)}`), ["verified/verified/1826", "unverified/unverified/2"]);
  assert.equal(book.questionCount, 1828);
  assert.equal((await listUnits(db, BOOK)).length, 26);
  assert.equal((await listBookQuestionIds(db, { bookId: BOOK }, 5000, 0)).length, 1828);
  const counts = await db.getFirstAsync<{ q: number; o: number; src: number; e: number; assets: number }>(
    `SELECT COUNT(*) AS q, (SELECT COUNT(*) FROM question_options o JOIN questions x ON x.id=o.question_id WHERE x.batch_id='lib-${BOOK}') AS o,
       (SELECT COUNT(*) FROM question_sources s JOIN questions x ON x.id=s.question_id WHERE x.batch_id='lib-${BOOK}' AND s.page_number IS NOT NULL) AS src,
       SUM(explanation IS NOT NULL) AS e, SUM(asset_paths IS NOT NULL) AS assets FROM questions WHERE batch_id='lib-${BOOK}'`);
  assert.deepEqual({ ...counts }, { q: 1828, o: 7312, src: 1828, e: 1828, assets: 17 });
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE id LIKE 'ru-vq-%' OR id LIKE 'ru-c-%'"))?.n, 0);

  // every figure is a real file and is registered in the Metro asset index (the index uses require(), so it is read as text here)
  const index = readFileSync(new URL("../src/content/questionAssets.ts", import.meta.url), "utf8");
  let figures = 0;
  for (const q of pack.questions) for (const a of q.assetPaths ?? []) {
    figures++;
    assert.ok(existsSync(new URL(`../data/question-packs/${a}`, import.meta.url)), `missing file ${a}`);
    assert.ok(index.includes(`"${a}":`), `not indexed ${a}`);
  }
  assert.equal(figures, 17);
  const noFigureIds = [
    "aspect-ru-vq-2022-2023-c-all-p044-q003-p055-n0127",
    "aspect-ru-vq-2020-2021-c-all-p089-q013-p089-n0012",
    "aspect-ru-vq-2021-2022-c-all-p067-q020-p079-n0137",
  ];
  for (const id of noFigureIds) {
    const question = pack.questions.find((q) => q.id === id);
    assert.ok(question, `missing text-only source question ${id}`);
    assert.deepEqual(question.assetPaths ?? [], [], `text-only source question should not receive generated artwork: ${id}`);
  }
  // provenance is surfaced for library questions
  const [view] = await loadQuestions(db, [pack.questions[0]!.id]);
  assert.equal(view?.source?.filename, "RU Question Bank.pdf");

  // second launch: nothing pending, no duplicates
  const again = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed: open, now: 2 });
  assert.ok(again.every((o) => o.status === "unchanged"));
  assert.equal((await listAllBooks(db)).length, 1);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE batch_id = ?", [`lib-${BOOK}`]))?.n, 1828);
});


test("older bundled Library seed never overwrites a newer installed book and is checkpointed once", { skip: !present && "seed or pack not built" }, async () => {
  const pack = JSON.parse(readFileSync(PACK, "utf8")) as LibraryPack;
  const db = await freshDb();
  const opened = { copies: 0, released: 0 };
  const openSeed = async () => {
    opened.copies++;
    return { path: SEED, release: async () => { opened.released++; } };
  };
  const first = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed, now: 1 });
  assert.ok(first.every((o) => o.status === "imported"));

  // Simulate a user installing a newer edition of the same Library book after the older app seed was installed.
  const newer = JSON.parse(JSON.stringify(pack)) as LibraryPack;
  newer.book.contentVersion = pack.book.contentVersion + 1;
  newer.book.title = `${pack.book.title} — Newer installed edition`;
  newer.units[0]!.title = `${newer.units[0]!.title} — v2`;
  newer.questions[0]!.text = `${newer.questions[0]!.text} [installed v2]`;
  newer.questions[0]!.options[0]!.text = `${newer.questions[0]!.options[0]!.text} [installed v2]`;
  const installed = await installLibraryPack(db, newer, { installState: "installed", now: 2 });
  assert.equal(installed.ok, true, installed.errors.join("; "));

  const questionId = newer.questions[0]!.id;
  const newerQuestion = await db.getFirstAsync<{ text: string }>("SELECT text FROM questions WHERE id = ?", [questionId]);
  const newerOption = await db.getFirstAsync<{ text: string }>("SELECT text FROM question_options WHERE question_id = ? AND option_key = ?", [questionId, newer.questions[0]!.options[0]!.id]);
  const newerUnit = await db.getFirstAsync<{ title: string }>("SELECT title FROM content_units WHERE id = ?", [newer.units[0]!.id]);
  assert.ok(newerQuestion?.text.endsWith("[installed v2]"));
  assert.ok(newerOption?.text.endsWith("[installed v2]"));
  assert.ok(newerUnit?.title.endsWith("— v2"));

  // Force the old bundled pack to be considered pending, as it would be after an app update.
  const batchId = `lib-${BOOK}`;
  await db.runAsync("UPDATE question_batches SET pack_signature = NULL WHERE id = ?", [batchId]);
  const bundledEntry = BUNDLED_MANIFEST.packs.find((p) => p.libraryBookId === BOOK)!;
  const second = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed, now: 3 });
  assert.equal(second.find((o) => o.batchId === bundledEntry.batchId)?.status, "unchanged");

  const book = await getBook(db, BOOK);
  assert.equal(book?.contentVersion, newer.book.contentVersion);
  assert.equal(book?.title, newer.book.title);
  assert.equal(book?.installState, "installed");
  assert.equal((await db.getFirstAsync<{ text: string }>("SELECT text FROM questions WHERE id = ?", [questionId]))?.text, newerQuestion?.text);
  assert.equal((await db.getFirstAsync<{ text: string }>("SELECT text FROM question_options WHERE question_id = ? AND option_key = ?", [questionId, newer.questions[0]!.options[0]!.id]))?.text, newerOption?.text);
  assert.equal((await db.getFirstAsync<{ title: string }>("SELECT title FROM content_units WHERE id = ?", [newer.units[0]!.id]))?.title, newerUnit?.title);
  assert.equal((await db.getFirstAsync<{ pack_signature: string }>("SELECT pack_signature FROM question_batches WHERE id = ?", [batchId]))?.pack_signature, bundledEntry.signature);

  // The seed checkpoint prevents a repeated retry on every returning launch.
  const third = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed, now: 4 });
  assert.ok(third.every((o) => o.status === "unchanged"));
  assert.equal(opened.copies, 2);
  assert.equal(opened.released, 2);
  assert.equal((await listBookQuestionIds(db, { bookId: BOOK }, 5000, 0)).length, 1828);
});

test("existing v1 (unverified) install upgrades in place to the attested v2 without losing question rows or user data", { skip: !present && "seed or pack not built" }, async () => {
  const pack = JSON.parse(readFileSync(PACK, "utf8")) as LibraryPack;
  // Reconstruct the shipped v1 shape from the real pack: everything unverified, version 1, permission pending.
  const v1 = JSON.parse(JSON.stringify(pack)) as LibraryPack;
  v1.book.contentVersion = 1;
  v1.book.verificationStatus = "unverified";
  v1.book.licenseStatus = "permission_pending";
  for (const q of v1.questions) { q.answerVerificationStatus = "unverified"; q.contentVerificationStatus = "unverified"; }
  const db = await freshDb();
  await installLibraryPack(db, v1, { installState: "bundled", now: 1 });
  const before = await getBook(db, BOOK);
  assert.equal(before?.eligibleCount, 0);
  const ids = (await db.getAllAsync<{ id: string }>("SELECT id FROM questions WHERE batch_id = ? ORDER BY id", [`lib-${BOOK}`])).map((r) => r.id);
  assert.equal(ids.length, 1828);

  const open = async () => ({ path: SEED, release: async () => undefined });
  const out = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed: open, now: 2 });
  assert.deepEqual(out.filter((o) => o.status === "failed"), []);

  const after = await getBook(db, BOOK);
  assert.equal(after?.contentVersion, 2);
  assert.equal(after?.verificationStatus, "verified");
  assert.equal(after?.eligibleCount, 1804);
  assert.deepEqual((await db.getAllAsync<{ id: string }>("SELECT id FROM questions WHERE batch_id = ? ORDER BY id", [`lib-${BOOK}`])).map((r) => r.id), ids, "question ids are stable across the upgrade");
  // correct-option mapping survives for the multiple-answer questions
  const multi = await db.getAllAsync<{ question_id: string; n: number }>(
    "SELECT o.question_id, COUNT(*) AS n FROM question_options o JOIN questions q ON q.id = o.question_id WHERE q.batch_id = ? AND o.is_correct = 1 GROUP BY o.question_id HAVING n > 1", [`lib-${BOOK}`]);
  assert.equal(multi.length, 6);
  // repeated startup is a no-op
  const again = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed: open, now: 3 });
  assert.ok(again.every((o) => o.status === "unchanged"));
});
