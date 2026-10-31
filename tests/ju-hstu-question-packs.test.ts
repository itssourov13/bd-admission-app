import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { freshDb } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import { countEligible, contentTotals, listInstitutions, listPapers, listPaperQuestionIds } from "../src/repositories/content.ts";
import type { QuestionPack } from "../src/types/question-pack.ts";

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
    pack.institutions.some((institution) => institution.code === "JU" || institution.code === "HSTU")
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
      assert.equal(rule.verificationStatus, "unconfigured", `${filename}: no official exam rule was supplied`);
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
    HSTU: { packs: 7, questions: 293, verified: 275, unverified: 8, unknown: 10, multipleChoice: 0 }
  });
  assert.equal(questions.length, 1819);
  assert.ok(questions.every((question) => question.contentVerificationStatus === "verified"));
  assert.equal(warningCount, 125);
  assert.equal(duplicateOptionQuestions, 6);
  assert.equal(normalizedSharedSourceIds, 24);
  assert.equal(batches.size, 57);
  assert.equal(papers.size, 57);
  assert.equal(questionIds.size, 1819);
  assert.equal(ruleIds.size, 57);
  assert.equal(sourceIds.size, 107);
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
  assert.deepEqual(await contentTotals(db), { questions: 13609, eligible: 3643, institutions: 7 });
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
    papers: 217,
    rules: 158,
    unconfiguredRules: 156,
    sources: 273,
    appearances: 13609,
    options: 54436,
    verified: 3694,
    unverified: 9691,
    unknown: 224,
    unverifiedContent: 9784
  });
  assert.equal((await countEligible(db, { institutionId: "ju" })), 1393);
  assert.equal((await countEligible(db, { institutionId: "hstu" })), 275);

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
    { papers: 7, questions: 293, eligible: 275 }
  );

  const juPapers = await listPapers(db, { institutionId: "ju" });
  const hstuPapers = await listPapers(db, { institutionId: "hstu" });
  assert.equal(juPapers.length, 50);
  assert.equal(hstuPapers.length, 7);
  assert.equal(juPapers.reduce((sum, paper) => sum + paper.questionCount, 0), 1526);
  assert.equal(hstuPapers.reduce((sum, paper) => sum + paper.questionCount, 0), 293);
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
