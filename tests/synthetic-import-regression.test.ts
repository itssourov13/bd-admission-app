import test from "node:test";
import assert from "node:assert/strict";
import { freshDb } from "./helpers.ts";
import { duPack, fixturePack, juPack, RU_INST, ruPack, ruvPack } from "./fixtures/packFactory.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { countReviewCandidates, eligibleQuestionIds, loadQuestions, practiceQuestionIds } from "../src/repositories/content.ts";
import { startStandardExam } from "../src/services/practiceService.ts";

/**
 * Synthetic-fixture regression coverage that replaces the behavioural parts of the removed RU-specific import tests
 * (ru-c-unit-import / ru-verified-bank-import). No production question pack or external archive is read.
 */

type Db = Awaited<ReturnType<typeof freshDb>>;
const scalar = async (db: Db, sql: string, params: (string | number)[] = []): Promise<number> =>
  Number((await db.getFirstAsync<{ n: number }>(sql, params))?.n ?? 0);

test("unverified third-party pack: never verified-eligible; provisional pool is explicit and hides duplicate-option items", async () => {
  const db = await freshDb();
  const pack = ruPack();
  const report = await importQuestionPack(db, pack, 1000);
  assert.equal(report.ok, true, report.errors.join("; "));
  assert.equal(report.questions.inserted, 4);
  assert.equal(pack.examRules.length, 0, "no rule is inferred from a third-party listing");
  assert.equal(await scalar(db, "SELECT COUNT(*) AS n FROM questions WHERE answer_status = ? AND content_status = ?", ["unverified", "unverified"]), 4);
  assert.equal((await eligibleQuestionIds(db, {})).length, 0);
  assert.equal((await practiceQuestionIds(db, { institutionId: "ru" })).length, 0);
  // 4 questions; the last has two options with identical text, so 3 are safe provisional candidates.
  assert.equal(await countReviewCandidates(db, { institutionId: "ru" }), 3);
  const provisional = await practiceQuestionIds(db, { institutionId: "ru" }, true);
  assert.equal(provisional.length, 3);
  assert.equal(provisional.includes(pack.questions[3]!.id), false, "duplicate-option question stays out of provisional practice");
  const [q] = await loadQuestions(db, [pack.questions[0]!.id]);
  assert.deepEqual(q!.options.map((o) => [o.key, o.order]), [["a", 1], ["b", 2], ["c", 3], ["d", 4]]);
  const again = await importQuestionPack(db, pack, 2000);
  assert.deepEqual([again.questions.inserted, again.questions.updated, again.questions.skipped], [0, 0, 4]);
  assert.equal(await scalar(db, "SELECT COUNT(*) AS n FROM questions"), 4);
});

test("verified pack: separated from unverified content; multiple-choice keys, provenance and exam eligibility", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, ruPack(), 1)).ok, true);
  const pack = ruvPack();
  const report = await importQuestionPack(db, pack, 2);
  assert.equal(report.ok, true, report.errors.join("; "));

  assert.equal((await eligibleQuestionIds(db, { institutionId: "ru-verified-bank" })).length, 4);
  assert.equal((await eligibleQuestionIds(db, { institutionId: "ru" })).length, 0);

  const [multi, single] = await loadQuestions(db, [pack.questions[0]!.id, pack.questions[1]!.id]);
  assert.equal(multi!.type, "multiple_choice");
  assert.deepEqual(multi!.options.filter((o) => o.isCorrect).map((o) => o.key), ["b", "c"]);
  assert.equal(single!.type, "single_choice");
  assert.deepEqual(single!.options.filter((o) => o.isCorrect).map((o) => o.key), ["b"]);

  assert.ok(multi!.appearances.length === 1 && multi!.appearances.every((a) => a.sourceFilename === "fixture-verified-bank.pdf" && a.institutionCode === "RU-V"));
  const src = await db.getFirstAsync<{ sha256: string; source_type: string }>("SELECT sha256, source_type FROM source_documents WHERE batch_id = ?", [pack.batch.id]);
  assert.deepEqual({ ...src }, { sha256: "f".repeat(64), source_type: "pdf" });

  const paper = await startStandardExam(db, { paperId: pack.papers[0]!.id }, 5000);
  assert.equal(paper.ok, true);
  const refused = await startStandardExam(db, { institutionId: "ru-verified-bank" }, 5000);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.reason, "rule_unavailable");
});

test("source provenance: a printed-unit mismatch in the source document stays separate from the paper unit", async () => {
  const db = await freshDb();
  const pack = ruPack();
  assert.equal((await importQuestionPack(db, pack, 1)).ok, true);
  const paper = await db.getFirstAsync<{ unit: string }>("SELECT unit FROM exam_papers WHERE id = ?", [pack.papers[0]!.id]);
  assert.equal(paper!.unit, "C Unit — Science");
  const src = await db.getFirstAsync<{ title: string; notes: string }>("SELECT title, notes FROM source_documents WHERE batch_id = ?", [pack.batch.id]);
  assert.match(src!.title, /RU A Unit/);
  assert.match(src!.notes, /header prints Unit A/);
});

test("content replacement removes stale appearances but preserves questions, bookmarks and attempt history", async () => {
  const initial = fixturePack({ batchId: "rep-batch", institution: RU_INST, paperId: "rep-paper", verified: true, count: 4 });
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, initial, 100)).ok, true);

  const removed = initial.questions[0]!;
  await db.runAsync("INSERT INTO bookmarks (question_id, created_at) VALUES (?, ?)", [removed.id, 100]);
  await db.runAsync("INSERT INTO practice_sessions (id, mode, status, filter_json, started_at) VALUES ('hist', 'flash', 'active', '{}', 100)");
  await db.runAsync("INSERT INTO session_questions (session_id, position, question_id) VALUES ('hist', 0, ?)", [removed.id]);
  await db.runAsync("INSERT INTO session_answers (session_id, position, question_id, selected_keys, outcome) VALUES ('hist', 0, ?, '[\"a\"]', 'correct')", [removed.id]);

  const replacement = structuredClone(initial);
  replacement.replaceExistingPaperContent = true;
  replacement.questions = replacement.questions.slice(1);
  assert.equal((await importQuestionPack(db, replacement, 101)).ok, true);

  const stale = await db.getFirstAsync<Record<string, number>>(
    `SELECT (SELECT COUNT(*) FROM questions WHERE id = ?1) AS questions,
            (SELECT COUNT(*) FROM question_appearances WHERE question_id = ?1 AND paper_id = ?2) AS appearances,
            (SELECT COUNT(*) FROM bookmarks WHERE question_id = ?1) AS bookmarks,
            (SELECT COUNT(*) FROM session_questions WHERE question_id = ?1) AS sessionQuestions,
            (SELECT COUNT(*) FROM session_answers WHERE question_id = ?1) AS sessionAnswers`,
    [removed.id, "rep-paper"]
  );
  assert.deepEqual({ ...stale }, { questions: 1, appearances: 0, bookmarks: 1, sessionQuestions: 1, sessionAnswers: 1 });
  const pool = await eligibleQuestionIds(db, {});
  assert.equal(pool.length, 3);
  assert.equal(pool.includes(removed.id), false, "orphaned historical rows never leak into practice pools");
  assert.equal((await loadQuestions(db, [removed.id])).length, 1, "but remain loadable by id");
});

test("active non-RU fixtures import and pool independently of retired-content logic", async () => {
  const db = await freshDb();
  for (const p of [juPack(), duPack()]) assert.equal((await importQuestionPack(db, p, 1)).ok, true);
  assert.equal((await eligibleQuestionIds(db, {})).length, 8);
});
