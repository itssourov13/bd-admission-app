import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { freshDb } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import { eligibleQuestionIds } from "../src/repositories/content.ts";
import { loadExam, startStandardExam } from "../src/services/practiceService.ts";

type Pack = { batch: { id: string }; papers: { academicSession?: string | null }[]; questions: { id: string; subject: string; answerVerificationStatus: string; correctOptionIds: string[] | null; source: { questionNumber?: number | null } }[] };
const packFiles = ["du-a-2024-2025.json", "du-a-2025-2026.json"];
const loadPacks = (): Pack[] => packFiles.map((name) =>
  JSON.parse(readFileSync(resolve("data/question-packs", name), "utf8")) as Pack
);

const sourceAnswerKeys: Record<string, Record<string, string[]>> = {
  "2024-2025": {
    "Physics": ["d","a","c","b","d","c","a","c","b","a","c","b","b","d","-"],
    "Chemistry": ["c","a","b","d","a","b","a","b","a","d","c","d","c","b","c"],
    "Higher Mathematics": ["b","a","c","b","a","c","b","d","b","a","c","b","d","c","c"],
    "Biology": ["c","b","a","b","a","b","d","a","c","c","d","c","b","a","a"],
    "Bangla": ["c","b","c","d","c","a","d","b","a","c","d","a","b","d","a"],
    "English": ["b","a","c","b","a","d","c","b","a","b","d","b","d","a","c"],
  },
  "2025-2026": {
    "Physics": ["c","a","d","-","c","b","c","c","d","c","a","c","b","d","b"],
    "Chemistry": ["a","b","b","d","c","a","d","c","a","a","d","c","c","a","d"],
    "Higher Mathematics": ["c","a","d","c","b","a","b","c","b","d","b","c","a","d","a"],
    "Biology": ["b","a","b","c","a","d","c","a","c","d","d","b","b","d","c"],
    "Bangla": ["d","a","b","a","b","c","c","b","a","d","a","a","d","c","c"],
    "English": ["b","a","c","-","a","d","c","a","d","c","b","d","a","c","b"],
  },
};

test("paper section-selection config must reference available subjects and matching counts", () => {
  const pack = loadPacks()[0]!;
  const valid = validateQuestionPack(pack);
  assert.equal(valid.valid, true, valid.errors.join("; "));

  const badSubject = JSON.parse(JSON.stringify(pack)) as Pack & { examRules: { selectionConfig: { subjects: string[] } }[] };
  badSubject.examRules[0]!.selectionConfig.subjects[0] = "Not a real paper subject";
  const invalidSubject = validateQuestionPack(badSubject);
  assert.equal(invalidSubject.valid, false);
  assert.ok(invalidSubject.errors.some((error) => error.includes("selectionConfig references subject with no questions")));

  const badCount = JSON.parse(JSON.stringify(pack)) as Pack & { examRules: { selectionConfig: { questionsPerSubject: number } }[] };
  badCount.examRules[0]!.selectionConfig.questionsPerSubject = 14;
  const invalidCount = validateQuestionPack(badCount);
  assert.equal(invalidCount.valid, false);
  assert.ok(invalidCount.errors.some((error) => error.includes("subjectCount × questionsPerSubject must equal totalQuestions")));
});

test("the two supplied DU A Unit packs import completely, preserve unknown keys, and are idempotent", async () => {
  const db = await freshDb();
  const packs = loadPacks();
  for (const pack of packs) {
    const session = pack.papers[0]!.academicSession!;
    const expected = sourceAnswerKeys[session];
    assert.ok(expected, `missing source answer-key fixture for ${session}`);
    for (const [subject, letters] of Object.entries(expected)) {
      const subjectQuestions = pack.questions.filter((q) => q.subject === subject)
        .sort((a, b) => (a.source.questionNumber ?? 0) - (b.source.questionNumber ?? 0));
      assert.equal(subjectQuestions.length, 15, `${session}/${subject} question count`);
      assert.deepEqual(subjectQuestions.map((q) => q.correctOptionIds?.[0] ?? "-"), letters, `${session}/${subject} printed answer key`);
    }
  }

  for (const [index, pack] of packs.entries()) {
    const report = await importQuestionPack(db, pack, Date.UTC(2026, 9, 28) + index);
    assert.equal(report.ok, true, `${pack.batch.id}: ${report.errors.join("; ")}`);
    assert.equal(report.questions.inserted, 90);
  }

  const totals = await db.getFirstAsync<{ questions: number; batches: number; papers: number; rules: number; sources: number; appearances: number; options: number; unknown: number }>(
    `SELECT
      (SELECT COUNT(*) FROM questions) AS questions,
      (SELECT COUNT(*) FROM question_batches) AS batches,
      (SELECT COUNT(*) FROM exam_papers) AS papers,
      (SELECT COUNT(*) FROM exam_rules) AS rules,
      (SELECT COUNT(*) FROM source_documents) AS sources,
      (SELECT COUNT(*) FROM question_appearances) AS appearances,
      (SELECT COUNT(*) FROM question_options) AS options,
      (SELECT COUNT(*) FROM questions WHERE answer_status = 'unknown') AS unknown`
  );
  assert.deepEqual({ ...totals }, { questions: 180, batches: 2, papers: 2, rules: 2, sources: 2, appearances: 180, options: 720, unknown: 3 });
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM institutions WHERE code = 'DU'"))?.n, 1);
  assert.equal((await db.getFirstAsync<{ status: string }>("SELECT verification_status AS status FROM exam_rules WHERE paper_id = ?", [packs[0]!.batch.id]))?.status, "illustrative");
  assert.equal((await eligibleQuestionIds(db, { category: "varsity" })).length, 175);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE content_status = 'unverified'"))?.n, 2);

  const subjectCounts = await db.getAllAsync<{ session: string; subject: string; n: number }>(
    `SELECT p.academic_session AS session, q.subject AS subject, COUNT(DISTINCT q.id) AS n
     FROM questions q JOIN question_appearances a ON a.question_id = q.id
     JOIN exam_papers p ON p.id = a.paper_id GROUP BY p.academic_session, q.subject ORDER BY p.academic_session, q.subject`
  );
  assert.equal(subjectCounts.length, 12);
  assert.ok(subjectCounts.every((row) => row.n === 15));
  const banglaStems = await db.getAllAsync<{ text: string }>("SELECT text FROM questions WHERE subject = 'Bangla'");
  assert.equal(banglaStems.length, 30);
  assert.ok(banglaStems.every((row) => /[\u0980-\u09FF]/u.test(row.text)));

  const missingKeyIds = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM questions WHERE answer_status = 'unknown' ORDER BY id"
  );
  assert.deepEqual(missingKeyIds.map((row) => row.id), [
    "du-a-2024-2025-physics-15",
    "du-a-2025-2026-english-04",
    "du-a-2025-2026-physics-04",
  ]);

  const badProvenance = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM question_appearances
     WHERE question_number IS NULL OR question_number < 1 OR question_number > 15
       OR page_number IS NULL OR page_number < 1 OR page_number > 4
       OR source_document_id IS NULL`
  );
  assert.equal(badProvenance?.n, 0);

  for (const pack of packs) {
    const second = await importQuestionPack(db, pack, Date.UTC(2026, 9, 29));
    assert.equal(second.ok, true, `${pack.batch.id} re-import: ${second.errors.join("; ")}`);
    assert.deepEqual([second.questions.inserted, second.questions.updated, second.questions.skipped], [0, 0, 90]);
  }
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))?.n, 180);
});

test("paper-specific DU A exam uses 60 questions, 45 minutes, and four complete subject sections", async () => {
  const db = await freshDb();
  for (const pack of loadPacks()) {
    const report = await importQuestionPack(db, pack);
    assert.equal(report.ok, true, report.errors.join("; "));
  }

  const paperId = "du-a-2025-2026";
  const pickedSubjects = ["Chemistry", "Higher Mathematics", "Biology", "Bangla"];
  const t0 = Date.UTC(2026, 9, 28);
  const started = await startStandardExam(db, { paperId, subjects: pickedSubjects }, t0, () => 0.42);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const exam = await loadExam(db, started.sessionId);
  assert.ok(exam);
  assert.equal(exam.questions.length, 60);
  assert.equal(exam.session.durationSeconds, 45 * 60);
  assert.equal(exam.session.deadlineAt, t0 + 45 * 60 * 1000);
  assert.equal(exam.session.filter.paperId, paperId);
  assert.deepEqual(exam.session.filter.subjects, pickedSubjects);
  assert.equal(exam.session.ruleStatus, "illustrative");
  assert.equal(exam.session.ruleCorrect, 1);
  assert.equal(exam.session.rulePenalty, 0.25);
  for (const subject of pickedSubjects) {
    assert.equal(exam.questions.filter((q) => q.subject === subject).length, 15, subject);
  }

  const missingSectionKey = await startStandardExam(db, { paperId, subjects: ["Physics", "Chemistry", "Biology", "Bangla"] }, t0 + 1);
  assert.equal(missingSectionKey.ok, false);
  if (!missingSectionKey.ok) assert.equal(missingSectionKey.reason, "incomplete_section");
  const badSectionCount = await startStandardExam(db, { paperId, subjects: ["Chemistry", "Biology", "Bangla"] }, t0 + 2);
  assert.equal(badSectionCount.ok, false);
  if (!badSectionCount.ok) assert.equal(badSectionCount.reason, "subject_selection");

  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM practice_sessions WHERE mode = 'exam'"))?.n, 1);
});
