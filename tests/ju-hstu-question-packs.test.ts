import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { freshDb } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import { countEligible, contentTotals, getPaperRule, listInstitutions, listPapers, listPaperQuestionIds } from "../src/repositories/content.ts";
import type { QuestionPack } from "../src/types/question-pack.ts";
import { planExam } from "../src/services/exam.ts";

const packDirectory = resolve("data/question-packs");

function loadAllPacks(): { filename: string; pack: QuestionPack }[] {
  return readdirSync(packDirectory)
    .filter((filename) => filename.endsWith(".json"))
    .sort()
    .map((filename) => ({
      filename,
      pack: JSON.parse(readFileSync(join(packDirectory, filename), "utf8")) as QuestionPack
    }));
}

function targetPacks() {
  return loadAllPacks().filter(({ pack }) =>
    pack.institutions.some((institution) => institution.code === "JU" || institution.code === "HSTU") &&
    !pack.institutions.some((institution) => institution.code === "HSTU-U")
  );
}

test("JU and HSTU packs preserve Muse metadata, statuses, and globally unique references", () => {
  const entries = targetPacks();
  assert.equal(entries.length, 57);

  const questions = entries.flatMap(({ pack }) => pack.questions);
  const counts = {
    JU: { packs: 0, questions: 0, verified: 0, unverified: 0, unknown: 0, multipleChoice: 0 },
    HSTU: { packs: 0, questions: 0, verified: 0, unverified: 0, unknown: 0, multipleChoice: 0 }
  };
  const batches = new Set<string>();
  const papers = new Set<string>();
  const questionIds = new Set<string>();
  const sourceIds = new Set<string>();
  const ruleIds = new Set<string>();
  let warningCount = 0;
  let duplicateOptionQuestions = 0;
  let normalizedSharedSourceIds = 0;

  for (const { filename, pack } of entries) {
    const institution = pack.institutions[0];
    assert.ok(institution && (institution.code === "JU" || institution.code === "HSTU"), filename);
    const stats = counts[institution.code];
    stats.packs += 1;
    stats.questions += pack.questions.length;

    const validation = validateQuestionPack(pack);
    assert.equal(validation.valid, true, `${filename}: ${validation.errors.join("; ")}`);
    warningCount += validation.warnings.length;

    assert.ok(!batches.has(pack.batch.id), `duplicate batch id: ${pack.batch.id}`);
    batches.add(pack.batch.id);

    const declaredSourceIds = new Set(pack.sourceDocuments.map((source) => source.id));
    for (const source of pack.sourceDocuments) {
      assert.ok(!sourceIds.has(source.id), `source id is not globally unique: ${source.id}`);
      sourceIds.add(source.id);
      if (source.id.startsWith("udvash-ju-abswer-combined--")) normalizedSharedSourceIds += 1;
    }
    for (const sourceId of pack.batch.sourceDocumentIds) {
      assert.ok(declaredSourceIds.has(sourceId), `${filename}: batch source reference ${sourceId}`);
    }

    for (const paper of pack.papers) {
      assert.ok(!papers.has(paper.id), `duplicate paper id: ${paper.id}`);
      papers.add(paper.id);
    }
    for (const rule of pack.examRules) {
      assert.ok(!ruleIds.has(rule.id), `duplicate exam-rule id: ${rule.id}`);
      ruleIds.add(rule.id);
      const hstu2024 = institution.code === "HSTU" && pack.papers[0]?.academicSession === "2024-2025";
      const ju2024 = institution.code === "JU" && pack.papers[0]?.academicSession === "2024-2025" &&
        ["ju-a-2024-2025-set02", "ju-d-2024-2025-set12", "ju-d-2024-2025-set13"].includes(rule.paperId);
      if (hstu2024) {
        assert.equal(rule.verificationStatus, "verified", `${filename}: HSTU circular verifies the MCQ component total`);
        assert.equal(rule.totalMarks, 100, filename);
        assert.equal(rule.correctMarks, undefined, filename);
        assert.equal(rule.incorrectPenalty, undefined, filename);
        assert.equal(rule.unansweredMarks, undefined, filename);
        assert.equal(rule.totalQuestions, undefined, filename);
        assert.equal(rule.durationSeconds, undefined, filename);
      } else if (ju2024) {
        assert.equal(rule.verificationStatus, "verified", `${filename}: JU circular partially verifies the exam pattern`);
        assert.equal(rule.totalMarks, 80, filename);
        assert.equal(rule.totalQuestions, 80, filename);
        assert.equal(rule.durationSeconds, 3300, filename);
        assert.equal(rule.incorrectPenalty, 0.2, filename);
        assert.equal(rule.correctMarks, undefined, filename);
        assert.equal(rule.unansweredMarks, undefined, filename);
      } else {
        assert.equal(rule.verificationStatus, "unconfigured", `${filename}: no exact official rule was verified`);
      }
      for (const sourceId of rule.sourceDocumentIds ?? []) {
        assert.ok(declaredSourceIds.has(sourceId), `${filename}: rule source reference ${sourceId}`);
      }
    }

    for (const question of pack.questions) {
      assert.ok(!questionIds.has(question.id), `duplicate question id: ${question.id}`);
      questionIds.add(question.id);
      assert.ok(declaredSourceIds.has(question.source.documentId), `${filename}: source reference ${question.id}`);
      for (const appearance of question.appearances) {
        if (appearance.sourceDocumentId) {
          assert.ok(declaredSourceIds.has(appearance.sourceDocumentId), `${filename}: appearance source ${question.id}`);
        }
      }
      stats[question.answerVerificationStatus] += 1;
      if (question.type === "multiple_choice") stats.multipleChoice += 1;
      if (new Set(question.options.map((option) => option.text.trim())).size !== question.options.length) {
        duplicateOptionQuestions += 1;
      }
    }
  }

  assert.deepEqual(counts, {
    JU: { packs: 50, questions: 1526, verified: 1414, unverified: 111, unknown: 1, multipleChoice: 6 },
    HSTU: { packs: 7, questions: 293, verified: 282, unverified: 1, unknown: 10, multipleChoice: 0 }
  });
  assert.equal(questions.length, 1819);
  assert.ok(questions.every((question) => question.contentVerificationStatus === "verified"));
  assert.equal(warningCount, 118);
  assert.equal(duplicateOptionQuestions, 6);
  assert.equal(normalizedSharedSourceIds, 24);
  assert.equal(batches.size, 57);
  assert.equal(papers.size, 57);
  assert.equal(questionIds.size, 1819);
  assert.equal(ruleIds.size, 57);
  assert.equal(sourceIds.size, 120);
});

test("all 217 bundled packs import transactionally, preserve eligibility, and re-import idempotently", async () => {
  const entries = loadAllPacks();
  const additions = targetPacks();
  assert.equal(entries.length, 217);
  assert.equal(additions.length, 57);

  const db = await freshDb();
  for (const { filename, pack } of entries) {
    const report = await importQuestionPack(db, pack);
    assert.equal(report.ok, true, `${filename}: ${report.errors.join("; ")}`);
  }

  const scalar = async (sql: string): Promise<number> =>
    Number((await db.getFirstAsync<{ n: number }>(sql))?.n ?? 0);
  assert.deepEqual(await contentTotals(db), { questions: 13609, eligible: 4307, institutions: 7 });
  assert.deepEqual({
    batches: await scalar("SELECT COUNT(*) AS n FROM question_batches"),
    papers: await scalar("SELECT COUNT(*) AS n FROM exam_papers"),
    rules: await scalar("SELECT COUNT(*) AS n FROM exam_rules"),
    unconfiguredRules: await scalar("SELECT COUNT(*) AS n FROM exam_rules WHERE verification_status = 'unconfigured'"),
    sources: await scalar("SELECT COUNT(*) AS n FROM source_documents"),
    appearances: await scalar("SELECT COUNT(*) AS n FROM question_appearances"),
    options: await scalar("SELECT COUNT(*) AS n FROM question_options"),
    verified: await scalar("SELECT COUNT(*) AS n FROM questions WHERE answer_status = 'verified'"),
    unverified: await scalar("SELECT COUNT(*) AS n FROM questions WHERE answer_status = 'unverified'"),
    unknown: await scalar("SELECT COUNT(*) AS n FROM questions WHERE answer_status = 'unknown'"),
    unverifiedContent: await scalar("SELECT COUNT(*) AS n FROM questions WHERE content_status = 'unverified'")
  }, {
    batches: 217,
    papers: 232,
    rules: 173,
    unconfiguredRules: 163,
    sources: 286,
    appearances: 13609,
    options: 54436,
    verified: 4358,
    unverified: 9043,
    unknown: 208,
    unverifiedContent: 9127
  });
  assert.equal((await countEligible(db, { institutionId: "ju" })), 1393);
  assert.equal((await countEligible(db, { institutionId: "hstu" })), 939);
  assert.equal(await scalar("SELECT COUNT(*) AS n FROM exam_rules WHERE total_marks = 100 AND verification_status = 'verified'"), 5);
  const partialRule = await getPaperRule(db, "hstu-a-2024-2025-shift-1");
  assert.equal(partialRule?.status, "verified");
  assert.equal(partialRule?.totalMarks, 100);
  assert.equal(partialRule?.correctMarks, null);
  assert.equal(partialRule?.incorrectPenalty, null);
  assert.equal(partialRule?.unansweredMarks, null);
  assert.equal(partialRule?.totalQuestions, null);
  assert.equal(partialRule?.durationSeconds, null);
  assert.equal(planExam("hstu-a-2024-2025-shift-1", partialRule).kind, "unavailable");

  const juPartialRule = await getPaperRule(db, "ju-a-2024-2025-set02");
  assert.equal(juPartialRule?.status, "verified");
  assert.equal(juPartialRule?.totalMarks, 80);
  assert.equal(juPartialRule?.totalQuestions, 80);
  assert.equal(juPartialRule?.durationSeconds, 3300);
  assert.equal(juPartialRule?.incorrectPenalty, 0.2);
  assert.equal(juPartialRule?.correctMarks, null);
  assert.equal(juPartialRule?.unansweredMarks, null);
  assert.deepEqual(planExam("ju-a-2024-2025-set02", juPartialRule), {
    kind: "paper", required: 80, durationSeconds: 3300, official: true
  });

  const institutions = await listInstitutions(db, "varsity");
  const ju = institutions.find((institution) => institution.code === "JU");
  const hstu = institutions.find((institution) => institution.code === "HSTU");
  assert.ok(ju, "JU must appear in the Varsity catalogue");
  assert.ok(hstu, "HSTU must appear in the Varsity catalogue");
  assert.deepEqual(
    { papers: ju.paperCount, questions: ju.questionCount, eligible: ju.eligibleCount },
    { papers: 50, questions: 1526, eligible: 1393 }
  );
  assert.deepEqual(
    { papers: hstu.paperCount, questions: hstu.questionCount, eligible: hstu.eligibleCount },
    { papers: 22, questions: 950, eligible: 939 }
  );

  const juPapers = await listPapers(db, { institutionId: "ju" });
  const hstuPapers = await listPapers(db, { institutionId: "hstu" });
  assert.equal(juPapers.length, 50);
  assert.equal(hstuPapers.length, 22);
  assert.equal(juPapers.reduce((sum, paper) => sum + paper.questionCount, 0), 1526);
  assert.equal(hstuPapers.reduce((sum, paper) => sum + paper.questionCount, 0), 950);
  assert.equal((await listPaperQuestionIds(db, "ju-a-2010-2011-set1", 100, 0)).length, 14);
  assert.equal((await listPaperQuestionIds(db, "hstu-a-2016-2017", 100, 0)).length, 26);

  for (const { filename, pack } of additions) {
    const report = await importQuestionPack(db, pack);
    assert.equal(report.ok, true, `${filename} re-import: ${report.errors.join("; ")}`);
    assert.equal(report.questions.inserted, 0, filename);
    assert.equal(report.questions.updated, 0, filename);
    assert.equal(report.questions.skipped, pack.questions.length, filename);
    assert.equal(report.appearances.inserted, 0, filename);
    assert.equal(report.appearances.skipped, pack.questions.length, filename);
  }

  assert.equal(await scalar("SELECT COUNT(*) AS n FROM questions"), 13609);
  assert.equal(await scalar("SELECT COUNT(*) AS n FROM question_appearances"), 13609);
});
