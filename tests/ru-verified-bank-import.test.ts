import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { freshDb } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import { eligibleQuestionIds, loadQuestions } from "../src/repositories/content.ts";
import { loadExam, startStandardExam } from "../src/services/practiceService.ts";

type Pack = {
  schemaVersion: number;
  batch: { id: string; category: string; sourceDocumentIds: string[] };
  institutions: { id: string; code: string; name: string }[];
  papers: { id: string; institutionId: string; academicSession: string; unit: string; year: number }[];
  sourceDocuments: { id: string; filename: string; sha256: string; sourceType: string }[];
  examRules: unknown[];
  replaceExistingPaperContent?: boolean;
  questions: {
    id: string; text: string; type: string; subject: string | null; answerVerificationStatus: string; contentVerificationStatus: string;
    answerDisposition?: string; correctOptionIds: string[] | null; options: { id: string; text: string; order: number }[];
    source: { documentId: string; pageNumber: number; questionNumber: number };
    appearances: { paperId: string; pageNumber: number; questionNumber: number; sourceDocumentId: string }[];
  }[];
};

const packDir = resolve("data/question-packs");
const packFiles = readdirSync(packDir).filter((name) => /^ru-vq-.*\.json$/.test(name)).sort();
const loadPacks = (): Pack[] => packFiles.map((name) => JSON.parse(readFileSync(resolve(packDir, name), "utf8")) as Pack);
const SOURCE_SHA256 = "f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7";

test("the separate RU verified-source bank imports as its own institution, preserving old RU candidates and enabling standard practice", async () => {
  const packs = loadPacks();
  assert.equal(packFiles.length, 15);
  const questionIds = new Set<string>();
  let recoveredMathItem = false;
  const paperIds = new Set<string>();
  const batchIds = new Set<string>();
  let questionCount = 0;
  let keyed = 0;
  let unknownKeys = 0;
  let noCorrectOption = 0;
  let multipleChoice = 0;

  for (const [index, pack] of packs.entries()) {
    assert.equal(pack.schemaVersion, 1);
    assert.equal(pack.replaceExistingPaperContent, true, "new RU-V packs must replace only their own active paper appearances");
    assert.equal(pack.batch.category, "varsity");
    assert.equal(pack.institutions.length, 1);
    assert.deepEqual(pack.institutions[0], {
      id: "ru-verified-bank", code: "RU-V", name: "Rajshahi University — Verified Question Bank"
    });
    assert.equal(pack.papers.length, 1);
    assert.equal(pack.papers[0]!.institutionId, "ru-verified-bank");
    assert.equal(pack.papers[0]!.id, pack.batch.id);
    assert.equal(pack.examRules.length, 0, "this import must not invent historic RU exam rules");
    assert.equal(pack.sourceDocuments.length, 1);
    assert.equal(pack.sourceDocuments[0]!.filename, "RU Question Bank.pdf");
    assert.equal(pack.sourceDocuments[0]!.sha256, SOURCE_SHA256);
    assert.equal(pack.sourceDocuments[0]!.sourceType, "pdf");
    assert.ok(/pages? \d+-\d+/i.test(pack.sourceDocuments[0]!.notes ?? ""));

    const validation = validateQuestionPack(pack);
    assert.equal(validation.valid, true, `${packFiles[index]}: ${validation.errors.join("; ")}`);
    assert.equal(batchIds.has(pack.batch.id), false, `duplicate batch ${pack.batch.id}`);
    batchIds.add(pack.batch.id);
    assert.equal(paperIds.has(pack.papers[0]!.id), false, `duplicate paper ${pack.papers[0]!.id}`);
    paperIds.add(pack.papers[0]!.id);

    for (const q of pack.questions) {
      assert.equal(questionIds.has(q.id), false, `duplicate question ${q.id}`);
      questionIds.add(q.id);
      assert.equal(q.contentVerificationStatus, "verified", q.id);
      assert.equal(q.answerVerificationStatus, "verified", q.id);
      assert.ok(["Physics", "Chemistry", "Biology", "Higher Mathematics", "ICT", "English"].includes(q.subject ?? ""), q.id);
      assert.ok(q.text.trim().length > 0, q.id);
      assert.equal(q.options.length, 4, q.id);
      assert.deepEqual(q.options.map((o) => o.id), ["a", "b", "c", "d"], q.id);
      assert.ok(q.options.every((o) => o.text.trim().length > 0), q.id);
      assert.ok(q.source.pageNumber >= 1 && q.source.pageNumber <= 156, q.id);
      assert.equal(q.appearances[0]!.sourceDocumentId, q.source.documentId);
      if (q.source.pageNumber === 137 && q.source.questionNumber === 4) {
        assert.equal(q.subject, "Higher Mathematics", q.id);
        assert.deepEqual(q.correctOptionIds, ["b"], q.id);
        recoveredMathItem = true;
      }
      assert.ok(q.type === "single_choice" || q.type === "multiple_choice", q.id);
      if (q.answerDisposition === "no_correct_option") {
        assert.equal(q.type, "single_choice", q.id);
        assert.deepEqual(q.correctOptionIds, [], q.id);
        noCorrectOption++;
        keyed++;
      } else if (q.type === "multiple_choice") {
        assert.ok((q.correctOptionIds?.length ?? 0) >= 2, q.id);
        multipleChoice++;
        keyed++;
      } else if (q.answerVerificationStatus === "verified") {
        assert.equal(q.correctOptionIds?.length, 1, q.id);
        keyed++;
      } else {
        assert.equal(q.correctOptionIds, null, q.id);
        unknownKeys++;
      }
    }
    questionCount += pack.questions.length;
  }

  assert.equal(questionCount, 1828);
  assert.equal(keyed, 1828);
  assert.equal(unknownKeys, 0);
  assert.equal(noCorrectOption, 22);
  assert.equal(multipleChoice, 6);
  assert.equal(questionIds.size, 1828);
  assert.equal(recoveredMathItem, true, "page 137 question 4 must retain its printed B answer marker");
  assert.equal(paperIds.size, 15);
  assert.equal(batchIds.size, 15);

  const db = await freshDb();
  // Import one old pack too: its identity/data remains separate and prominently labelled UNVERIFIED.
  const oldPack = JSON.parse(readFileSync(resolve(packDir, "ru-c-2010-2011-ruc-mcq.json"), "utf8")) as Pack;
  const oldImport = await importQuestionPack(db, oldPack as never, Date.UTC(2026, 9, 29));
  assert.equal(oldImport.ok, true, oldImport.errors.join("; "));
  assert.equal(oldImport.questions.inserted, oldPack.questions.length);

  for (const pack of packs) {
    const report = await importQuestionPack(db, pack as never, Date.UTC(2026, 9, 29));
    assert.equal(report.ok, true, `${pack.batch.id}: ${report.errors.join("; ")}`);
    assert.equal(report.questions.inserted, pack.questions.length, pack.batch.id);
  }

  const oldInstitution = await db.getFirstAsync<{ id: string; code: string; name: string }>(
    "SELECT id, code, name FROM institutions WHERE id = 'ru'"
  );
  const newInstitution = await db.getFirstAsync<{ id: string; code: string; name: string }>(
    "SELECT id, code, name FROM institutions WHERE id = 'ru-verified-bank'"
  );
  assert.deepEqual({ ...oldInstitution }, { id: "ru", code: "RU", name: "UNVERIFIED — University of Rajshahi" });
  assert.deepEqual({ ...newInstitution }, {
    id: "ru-verified-bank", code: "RU-V", name: "Rajshahi University — Verified Question Bank"
  });

  const counts = await db.getFirstAsync<{ questions: number; papers: number; batches: number; answerVerified: number; keyUnknown: number; contentVerified: number }>(
    `SELECT
       (SELECT COUNT(DISTINCT a.question_id) FROM question_appearances a JOIN exam_papers p ON p.id=a.paper_id WHERE p.institution_id='ru-verified-bank') AS questions,
       (SELECT COUNT(*) FROM exam_papers WHERE institution_id='ru-verified-bank') AS papers,
       (SELECT COUNT(*) FROM question_batches WHERE id LIKE 'ru-vq-%') AS batches,
       (SELECT COUNT(*) FROM questions q JOIN question_appearances a ON a.question_id=q.id JOIN exam_papers p ON p.id=a.paper_id WHERE p.institution_id='ru-verified-bank' AND q.answer_status='verified') AS answerVerified,
       (SELECT COUNT(*) FROM questions q JOIN question_appearances a ON a.question_id=q.id JOIN exam_papers p ON p.id=a.paper_id WHERE p.institution_id='ru-verified-bank' AND q.answer_status='unknown') AS keyUnknown,
       (SELECT COUNT(*) FROM questions q JOIN question_appearances a ON a.question_id=q.id JOIN exam_papers p ON p.id=a.paper_id WHERE p.institution_id='ru-verified-bank' AND q.content_status='verified') AS contentVerified`
  );
  assert.deepEqual({ ...counts }, { questions: 1828, papers: 15, batches: 15, answerVerified: 1828, keyUnknown: 0, contentVerified: 1828 });
  assert.equal((await eligibleQuestionIds(db, { institutionId: "ru-verified-bank" })).length, 1800);

  const started = await startStandardExam(db, { institutionId: "ru-verified-bank" }, Date.UTC(2026, 9, 29));
  assert.equal(started.ok, true, "the separate verified bank should expose Standard Exam");
  if (!started.ok) return;
  const exam = await loadExam(db, started.sessionId);
  assert.ok(exam);
  assert.equal(exam.questions.length, 100);
  assert.equal(exam.session.durationSeconds, 3600);
  assert.ok(exam.questions.every((q) => q.contentStatus === "verified" && q.answerStatus === "verified"));
  const loadedFirst = await loadQuestions(db, [packs[0]!.questions[0]!.id]);
  assert.equal(loadedFirst.length, 1);
  assert.ok(loadedFirst[0]!.appearances.every((a) => a.sourceFilename === "RU Question Bank.pdf"));

  const repeat = await importQuestionPack(db, packs[0]! as never, Date.UTC(2026, 9, 30));
  assert.equal(repeat.ok, true);
  assert.equal(repeat.questions.inserted, 0);
  assert.equal(repeat.questions.updated, 0);
  assert.equal(repeat.questions.skipped, packs[0]!.questions.length);
  const finalCount = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(DISTINCT a.question_id) AS n FROM question_appearances a JOIN exam_papers p ON p.id=a.paper_id WHERE p.institution_id='ru-verified-bank'"
  );
  assert.equal(finalCount?.n, 1828);
});


test("RU verified-source replacement removes stale appearances but preserves bookmarks and attempt history", async () => {
  const pack = loadPacks()[0]!;
  const initial = structuredClone(pack);
  initial.replaceExistingPaperContent = false;
  const db = await freshDb();
  const firstImport = await importQuestionPack(db, initial as never, Date.UTC(2026, 9, 30));
  assert.equal(firstImport.ok, true, firstImport.errors.join("; "));

  const removed = initial.questions[0]!;
  await db.runAsync("INSERT INTO bookmarks (question_id, created_at) VALUES (?, ?)", [removed.id, 100]);
  await db.runAsync(
    "INSERT INTO practice_sessions (id, mode, status, filter_json, started_at) VALUES (?, 'flash', 'active', '{}', ?)",
    ["history-session", 100]
  );
  await db.runAsync(
    "INSERT INTO session_questions (session_id, position, question_id) VALUES (?, 0, ?)",
    ["history-session", removed.id]
  );
  await db.runAsync(
    "INSERT INTO session_answers (session_id, position, question_id, selected_keys, outcome) VALUES (?, 0, ?, '[\"a\"]', 'correct')",
    ["history-session", removed.id]
  );

  const replacement = structuredClone(initial);
  replacement.replaceExistingPaperContent = true;
  replacement.questions = replacement.questions.slice(1);
  const replaceReport = await importQuestionPack(db, replacement as never, Date.UTC(2026, 9, 30) + 1);
  assert.equal(replaceReport.ok, true, replaceReport.errors.join("; "));

  const stale = await db.getFirstAsync<{ questions: number; appearances: number; bookmarks: number; sessionQuestions: number; sessionAnswers: number }>(
    "SELECT " +
      "(SELECT COUNT(*) FROM questions WHERE id = ?) AS questions, " +
      "(SELECT COUNT(*) FROM question_appearances WHERE question_id = ? AND paper_id = ?) AS appearances, " +
      "(SELECT COUNT(*) FROM bookmarks WHERE question_id = ?) AS bookmarks, " +
      "(SELECT COUNT(*) FROM session_questions WHERE question_id = ?) AS sessionQuestions, " +
      "(SELECT COUNT(*) FROM session_answers WHERE question_id = ?) AS sessionAnswers",
    [removed.id, removed.id, initial.papers[0]!.id, removed.id, removed.id, removed.id]
  );
  assert.deepEqual({ ...stale }, { questions: 1, appearances: 0, bookmarks: 1, sessionQuestions: 1, sessionAnswers: 1 });

  // Historical orphan rows stay loadable by ID but must not leak into global practice pools.
  const activePracticeIds = await eligibleQuestionIds(db, {});
  assert.equal(activePracticeIds.length, replacement.questions.length);
  assert.equal(activePracticeIds.includes(removed.id), false);

  const active = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(DISTINCT question_id) AS n FROM question_appearances WHERE paper_id = ?",
    [initial.papers[0]!.id]
  );
  assert.equal(active?.n, replacement.questions.length);
});
