import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { openMemoryDb } from "./helpers.ts";
import { LATEST_VERSION, MIGRATIONS, migrate } from "../src/db/schema.ts";

const dataDir = new URL("../data/question-packs/", import.meta.url);
const readPack = (name: string) => JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));

const hstuPairs = [
  { unit: "a", shift: 1, extra: 12, pending: 4 },
  { unit: "a", shift: 2, extra: 9, pending: 4 },
  { unit: "a", shift: 3, extra: 7, pending: 3 },
  { unit: "b", shift: 1, extra: 4, pending: 4 },
  { unit: "b", shift: 2, extra: 2, pending: 0 }
] as const;

test("HSTU split verified questions now reference the five canonical 2024-2025 papers", () => {
  const allFiles = readdirSync(fileURLToPath(dataDir)).filter((name) => name.startsWith("hstu-") && name.endsWith(".json"));
  const packs = allFiles.map(readPack);
  const hstuPaperIds = new Set<string>();

  for (const pack of packs) {
    for (const paper of pack.papers) {
      if (paper.institutionId === "hstu") hstuPaperIds.add(paper.id);
    }
  }
  assert.equal(hstuPaperIds.size, 17);

  for (const pair of hstuPairs) {
    const canonicalId = "hstu-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    const oldId = "hstu-import-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    const pendingId = "hstu-unverified-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    const base = readPack(canonicalId + ".json");
    const extra = readPack("hstu-unverified-" + pair.unit + "-2024-2025-shift-" + pair.shift + ".json");

    assert.ok(hstuPaperIds.has(canonicalId));
    assert.deepEqual(extra.papers.map((paper: { id: string }) => paper.id).sort(), [canonicalId, pendingId].sort());
    assert.equal(extra.papers.some((paper: { id: string }) => paper.id === oldId), false);
    assert.equal(extra.questions.length, pair.extra + pair.pending);

    const moved = extra.questions.flatMap((question: any) => question.appearances)
      .filter((appearance: any) => appearance.paperId === canonicalId);
    const pending = extra.questions.flatMap((question: any) => question.appearances)
      .filter((appearance: any) => appearance.paperId === pendingId);
    assert.equal(moved.length, pair.extra);
    assert.equal(pending.length, pair.pending);
    assert.ok(moved.every((appearance: any) => appearance.sourceDocumentId));
    assert.ok(extra.questions.filter((question: any) => question.appearances.some((a: any) => a.paperId === canonicalId))
      .every((question: any) => question.answerVerificationStatus === "verified" && question.contentVerificationStatus === "verified"));
    assert.equal(extra.questions.some((question: any) => question.appearances.some((a: any) => a.paperId === oldId)), false);

    const pendingRule = extra.examRules.find((rule: any) => rule.paperId === pendingId);
    assert.equal(pendingRule?.verificationStatus, "unconfigured");
    assert.equal(extra.examRules.some((rule: any) => rule.paperId === canonicalId || rule.paperId === oldId), false);

    const canonicalRule = base.examRules.find((rule: any) => rule.paperId === canonicalId);
    assert.equal(canonicalRule?.verificationStatus, "verified");
    assert.equal(canonicalRule?.totalMarks, 100);
    assert.equal(canonicalRule?.correctMarks, undefined);
    assert.equal(canonicalRule?.incorrectPenalty, undefined);
    assert.equal(canonicalRule?.unansweredMarks, undefined);
    assert.equal(canonicalRule?.durationSeconds, undefined);
    assert.equal(canonicalRule?.totalQuestions, undefined);
  }

  const normalQuestions = new Map<string, any>();
  for (const pack of packs) {
    for (const question of pack.questions) {
      if (question.appearances.some((appearance: any) => hstuPaperIds.has(appearance.paperId))) {
        normalQuestions.set(question.id, question);
      }
    }
  }
  assert.equal(normalQuestions.size, 950);
  assert.equal([...normalQuestions.values()].filter((question: any) =>
    question.answerVerificationStatus === "verified" && question.contentVerificationStatus === "verified"
  ).length, 939);
});

test("v9 migration merges existing HSTU aliases and preserves user-owned practice history", async () => {
  const db = openMemoryDb();
  await migrate(db, MIGRATIONS.slice(0, 8));

  await db.runAsync("INSERT INTO institutions (id, code, name) VALUES ('hstu', 'HSTU', 'HSTU')");
  await db.runAsync("INSERT INTO institutions (id, code, name) VALUES ('hstu-unverified-bank', 'HSTU-U', 'HSTU pending bank')");
  await db.runAsync(
    "INSERT INTO question_batches (id, category, schema_version, imported_at, updated_at) VALUES ('hstu-legacy-batch', 'varsity', 1, 1, 1)"
  );
  await db.runAsync(
    "INSERT INTO question_batches (id, category, schema_version, imported_at, updated_at) VALUES ('hstu-pending-batch', 'varsity', 1, 1, 1)"
  );

  for (const pair of hstuPairs) {
    const canonicalId = "hstu-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    const oldId = "hstu-import-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    const metadata = ["varsity", 2025, "2024-2025", pair.unit.toUpperCase(), "HSTU " + pair.unit.toUpperCase() + " Unit Shift " + pair.shift];
    await db.runAsync(
      "INSERT INTO exam_papers (id, institution_id, category, year, academic_session, unit, title) VALUES (?, 'hstu', ?, ?, ?, ?, ?)",
      [canonicalId, ...metadata]
    );
    await db.runAsync(
      "INSERT INTO exam_papers (id, institution_id, category, year, academic_session, unit, title) VALUES (?, 'hstu', ?, ?, ?, ?, ?)",
      [oldId, ...metadata]
    );
    await db.runAsync(
      "INSERT INTO exam_rules (id, paper_id, total_marks, verification_status) VALUES (?, ?, 100, 'verified')",
      ["rule-" + canonicalId, canonicalId]
    );
    await db.runAsync(
      "INSERT INTO exam_rules (id, paper_id, verification_status) VALUES (?, ?, 'unconfigured')",
      ["rule-" + oldId, oldId]
    );
    const questionId = "legacy-question-" + pair.unit + pair.shift;
    await db.runAsync(
      "INSERT INTO questions (id, batch_id, category, text, type, answer_status, content_status, content_hash) VALUES (?, 'hstu-legacy-batch', 'varsity', 'Legacy question', 'single_choice', 'verified', 'verified', ?)",
      [questionId, "hash-" + questionId]
    );
    await db.runAsync(
      "INSERT INTO question_appearances (question_id, paper_id, question_number, source_document_id) VALUES (?, ?, 1, NULL)",
      [questionId, oldId]
    );
  }

  const pendingPaperId = "hstu-unverified-a-2024-2025-shift-1";
  await db.runAsync(
    "INSERT INTO exam_papers (id, institution_id, category, year, academic_session, unit, title) VALUES (?, 'hstu-unverified-bank', 'varsity', 2025, '2024-2025', 'A', 'HSTU-U pending')",
    [pendingPaperId]
  );
  await db.runAsync(
    "INSERT INTO exam_rules (id, paper_id, verification_status) VALUES ('rule-hstu-u-pending', ?, 'unconfigured')",
    [pendingPaperId]
  );
  await db.runAsync(
    "INSERT INTO questions (id, batch_id, category, text, type, answer_status, content_status, content_hash) VALUES ('pending-question', 'hstu-pending-batch', 'varsity', 'Pending question', 'single_choice', 'unverified', 'unverified', 'pending-hash')"
  );
  await db.runAsync(
    "INSERT INTO question_appearances (question_id, paper_id, question_number, source_document_id) VALUES ('pending-question', ?, 1, NULL)",
    [pendingPaperId]
  );

  const firstQuestion = "legacy-question-a1";
  await db.runAsync("INSERT INTO bookmarks (question_id, created_at) VALUES (?, 123)", [firstQuestion]);
  await db.runAsync(
    "INSERT INTO practice_sessions (id, mode, status, filter_json, started_at, result_json, rule_profile_json) VALUES ('legacy-session', 'exam', 'completed', ?, 123, ?, ?)",
    [
      JSON.stringify({ paperId: "hstu-import-a-2024-2025-shift-1" }),
      JSON.stringify({ sourcePaperId: "hstu-import-a-2024-2025-shift-1", score: 1 }),
      JSON.stringify({ paperId: "hstu-import-a-2024-2025-shift-1" })
    ]
  );
  await db.runAsync(
    "INSERT INTO session_questions (session_id, position, question_id) VALUES ('legacy-session', 1, ?)",
    [firstQuestion]
  );
  await db.runAsync(
    "INSERT INTO session_answers (session_id, position, question_id, selected_keys, outcome) VALUES ('legacy-session', 1, ?, '[\"b\"]', 'correct')",
    [firstQuestion]
  );

  assert.equal(await migrate(db), LATEST_VERSION);

  for (const pair of hstuPairs) {
    const canonicalId = "hstu-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    const oldId = "hstu-import-" + pair.unit + "-2024-2025-shift-" + pair.shift;
    assert.equal(await db.getFirstAsync("SELECT id FROM exam_papers WHERE id = ?", [oldId]), null);
    assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM question_appearances WHERE paper_id = ?", [oldId]))?.n), 0);
    assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM question_appearances WHERE paper_id = ?", [canonicalId]))?.n), 1);
    const rule = await db.getFirstAsync<{ total_marks: number; verification_status: string }>(
      "SELECT total_marks, verification_status FROM exam_rules WHERE paper_id = ?",
      [canonicalId]
    );
    assert.deepEqual(rule ? { ...rule } : null, { total_marks: 100, verification_status: "verified" });
    assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM exam_rules WHERE paper_id = ?", [oldId]))?.n), 0);
  }

  assert.ok(await db.getFirstAsync("SELECT id FROM exam_papers WHERE id = ?", [pendingPaperId]));
  assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM question_appearances WHERE paper_id = ?", [pendingPaperId]))?.n), 1);
  assert.equal((await db.getFirstAsync<{ verification_status: string }>(
    "SELECT verification_status FROM exam_rules WHERE id = 'rule-hstu-u-pending'"
  ))?.verification_status, "unconfigured");

  const session = await db.getFirstAsync<{ filter_json: string; result_json: string; rule_profile_json: string }>(
    "SELECT filter_json, result_json, rule_profile_json FROM practice_sessions WHERE id = 'legacy-session'"
  );
  assert.equal(JSON.parse(session!.filter_json).paperId, "hstu-a-2024-2025-shift-1");
  assert.equal(JSON.parse(session!.result_json).sourcePaperId, "hstu-import-a-2024-2025-shift-1");
  assert.equal(JSON.parse(session!.rule_profile_json).paperId, "hstu-import-a-2024-2025-shift-1");
  assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM bookmarks WHERE question_id = ?", [firstQuestion]))?.n), 1);
  assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM session_questions WHERE session_id = 'legacy-session'"))?.n), 1);
  assert.equal(Number((await db.getFirstAsync("SELECT COUNT(*) AS n FROM session_answers WHERE session_id = 'legacy-session'"))?.n), 1);
  assert.equal((await db.getFirstAsync<{ selected_keys: string; outcome: string }>(
    "SELECT selected_keys, outcome FROM session_answers WHERE session_id = 'legacy-session'"
  ))?.outcome, "correct");

  assert.equal(await migrate(db), LATEST_VERSION);
});
