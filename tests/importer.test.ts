import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { migrate, LATEST_VERSION } from "../src/db/schema.ts";

const count = async (db: Awaited<ReturnType<typeof freshDb>>, table: string) =>
  Number((await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n);

test("migrate is idempotent and sets user_version", async () => {
  const db = await freshDb();
  assert.equal(await migrate(db), LATEST_VERSION);
  const v = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  assert.equal(v!.user_version, LATEST_VERSION);
});

test("import inserts everything, then is idempotent", async () => {
  const db = await freshDb();
  const first = await importQuestionPack(db, syntheticPack());
  assert.equal(first.ok, true);
  assert.equal(first.questions.inserted, 3);
  assert.equal(first.appearances.inserted, 3);
  assert.equal(await count(db, "question_options"), 12);
  const second = await importQuestionPack(db, syntheticPack());
  assert.equal(second.ok, true);
  assert.deepEqual([second.questions.inserted, second.questions.updated, second.questions.skipped], [0, 0, 3]);
  assert.equal(second.appearances.inserted, 0);
  assert.equal(await count(db, "questions"), 3);
  assert.equal(await count(db, "question_appearances"), 3);
  assert.equal(await count(db, "question_options"), 12);
});

test("changed question is updated; user answers and bookmarks survive", async () => {
  const db = await freshDb();
  await importQuestionPack(db, syntheticPack());
  const now = Date.now();
  await db.runAsync("INSERT INTO bookmarks (question_id, created_at) VALUES (?, ?)", ["q-syn-1", now]);
  await db.runAsync("INSERT INTO practice_sessions (id, mode, status, filter_json, started_at) VALUES ('s1','flash','completed','{}',?)", [now]);
  await db.runAsync("INSERT INTO session_questions (session_id, position, question_id) VALUES ('s1',1,'q-syn-1')");
  await db.runAsync("INSERT INTO session_answers (session_id, position, question_id, selected_keys, outcome) VALUES ('s1',1,'q-syn-1','[\"a\"]','incorrect')");
  const changed = syntheticPack();
  changed.questions[0].text = "Synthetic question 1 (corrected)";
  const report = await importQuestionPack(db, changed);
  assert.deepEqual([report.questions.updated, report.questions.skipped], [1, 2]);
  assert.equal(await count(db, "bookmarks"), 1);
  assert.equal(await count(db, "session_answers"), 1);
  assert.equal(await count(db, "question_options"), 12);
});

test("multiple appearances of one question are preserved; similar text is not merged", async () => {
  const db = await freshDb();
  const pack = syntheticPack();
  pack.papers.push({ id: "paper-syn-2024", institutionId: "inst-syn", category: "varsity", year: 2024 });
  pack.questions[0].appearances.push({ paperId: "paper-syn-2024", questionNumber: 9, pageNumber: 2, sourceDocumentId: "src-syn" });
  pack.questions[1].text = pack.questions[0].text; // identical text, different id
  const report = await importQuestionPack(db, pack);
  assert.equal(report.ok, true);
  assert.equal(await count(db, "questions"), 3);
  assert.equal(await count(db, "question_appearances"), 4);
});

test("invalid pack writes nothing; failure mid-import rolls back", async () => {
  const db = await freshDb();
  const bad = syntheticPack();
  bad.questions[0].options = [bad.questions[0].options[0]];
  const r1 = await importQuestionPack(db, bad);
  assert.equal(r1.ok, false);
  assert.equal(r1.rejected, 3);
  assert.equal(await count(db, "question_batches"), 0);

  await importQuestionPack(db, syntheticPack());
  const other = syntheticPack();
  other.batch.id = "batch-other";
  other.sourceDocuments[0].id = "src-other";
  other.batch.sourceDocumentIds = ["src-other"];
  other.questions.forEach((q) => { q.source.documentId = "src-other"; q.appearances[0].sourceDocumentId = "src-other"; });
  other.questions.push({ ...other.questions[0], id: "q-new-ok" });
  other.questions[0].id = "q-syn-1"; // collides with a question owned by batch-syn -> must roll back
  const r2 = await importQuestionPack(db, other);
  assert.equal(r2.ok, false);
  assert.match(r2.errors[0], /already exists in batch/);
  assert.equal(await count(db, "question_batches"), 1);
  assert.equal(await count(db, "questions"), 3);
  assert.equal(await count(db, "source_documents"), 1);
});

test("source references and rule status are preserved", async () => {
  const db = await freshDb();
  await importQuestionPack(db, syntheticPack());
  const src = await db.getFirstAsync<{ page_number: number; question_number: number }>("SELECT page_number, question_number FROM question_sources WHERE question_id = 'q-syn-2'");
  assert.deepEqual({ ...src }, { page_number: 1, question_number: 2 });
  const rule = await db.getFirstAsync<{ verification_status: string }>("SELECT verification_status FROM exam_rules WHERE id = 'rule-syn'");
  assert.equal(rule!.verification_status, "illustrative");
});
