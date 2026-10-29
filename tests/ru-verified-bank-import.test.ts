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
  questions: {
    id: string; text: string; answerVerificationStatus: string; contentVerificationStatus: string;
    correctOptionIds: string[] | null; options: { id: string; text: string; order: number }[];
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
  const paperIds = new Set<string>();
  const batchIds = new Set<string>();
  let questionCount = 0;
  let keyed = 0;
  let unknownKeys = 0;

  for (const [index, pack] of packs.entries()) {
    assert.equal(pack.schemaVersion, 1);
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
      assert.ok(q.answerVerificationStatus === "verified" || q.answerVerificationStatus === "unknown", q.id);
      assert.ok(q.text.trim().length > 0, q.id);
      assert.ok(q.options.length >= 2, q.id);
      assert.ok(q.options.every((o) => o.text.trim().length > 0), q.id);
      assert.ok(q.source.pageNumber >= 1 && q.source.pageNumber <= 156, q.id);
      assert.equal(q.appearances[0]!.sourceDocumentId, q.source.documentId);
      if (q.answerVerificationStatus === "verified") {
        assert.equal(q.correctOptionIds?.length, 1, q.id);
        keyed++;
      } else {
        assert.equal(q.correctOptionIds, null, q.id);
        unknownKeys++;
      }
    }
    questionCount += pack.questions.length;
  }

  assert.equal(questionCount, 1815);
  assert.equal(keyed, 1720);
  assert.equal(unknownKeys, 95);
  assert.equal(questionIds.size, 1815);
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
  assert.deepEqual({ ...counts }, { questions: 1815, papers: 15, batches: 15, answerVerified: 1720, keyUnknown: 95, contentVerified: 1815 });
  assert.equal((await eligibleQuestionIds(db, { institutionId: "ru-verified-bank" })).length, 1720);

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
  assert.equal(finalCount?.n, 1815);
});
