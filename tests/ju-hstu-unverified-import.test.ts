import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { freshDb } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import {
  countEligible,
  countReviewCandidates,
  contentTotals,
  listInstitutions,
  listPapers,
  practiceQuestionIds
} from "../src/repositories/content.ts";
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

function loadUnverifiedPacks() {
  return loadAllPacks().filter(({ pack }) =>
    pack.institutions.some((institution) => institution.code === "JU-U" || institution.code === "HSTU-U")
  );
}

test("JU/HSTU unverified packs preserve statuses and are isolated from verified-bank identities", () => {
  const allEntries = loadAllPacks();
  const entries = loadUnverifiedPacks();
  assert.equal(allEntries.length, 217);
  assert.equal(entries.length, 99);

  const expected = {
    "JU-U": {
      id: "ju-unverified-bank",
      name: "UNVERIFIED — Jahangirnagar University",
      packs: 84,
      questions: 5011,
      unverifiedAnswers: 4820,
      unknownAnswers: 191,
      multipleChoice: 12,
      provisionalCandidates: 4780,
      duplicateOptionQuestions: 28
    },
    "HSTU-U": {
      id: "hstu-unverified-bank",
      name: "UNVERIFIED — Hajee Mohammad Danesh Science and Technology University",
      packs: 15,
      questions: 762,
      unverifiedAnswers: 743,
      unknownAnswers: 19,
      multipleChoice: 7,
      provisionalCandidates: 722,
      duplicateOptionQuestions: 14
    }
  } as const;

  const counts = {
    "JU-U": { packs: 0, questions: 0, unverifiedAnswers: 0, unknownAnswers: 0, multipleChoice: 0, provisionalCandidates: 0, duplicateOptionQuestions: 0 },
    "HSTU-U": { packs: 0, questions: 0, unverifiedAnswers: 0, unknownAnswers: 0, multipleChoice: 0, provisionalCandidates: 0, duplicateOptionQuestions: 0 }
  };
  const ids = {
    batch: new Set<string>(),
    paper: new Set<string>(),
    rule: new Set<string>(),
    question: new Set<string>(),
    source: new Set<string>()
  };
  const allIds = {
    batch: new Set<string>(),
    paper: new Set<string>(),
    rule: new Set<string>(),
    question: new Set<string>(),
    source: new Set<string>()
  };

  for (const { filename, pack } of allEntries) {
    assert.ok(!allIds.batch.has(pack.batch.id), `global batch ID collision: ${pack.batch.id}`);
    allIds.batch.add(pack.batch.id);
    for (const paper of pack.papers) {
      assert.ok(!allIds.paper.has(paper.id), `global paper ID collision: ${paper.id}`);
      allIds.paper.add(paper.id);
    }
    for (const rule of pack.examRules) {
      assert.ok(!allIds.rule.has(rule.id), `global exam-rule ID collision: ${rule.id}`);
      allIds.rule.add(rule.id);
    }
    for (const question of pack.questions) {
      assert.ok(!allIds.question.has(question.id), `global question ID collision: ${question.id}`);
      allIds.question.add(question.id);
    }
    for (const source of pack.sourceDocuments) {
      assert.ok(!allIds.source.has(source.id), `global source ID collision: ${source.id}`);
      allIds.source.add(source.id);
    }

    if (!pack.institutions.some((institution) => institution.code === "JU-U" || institution.code === "HSTU-U")) continue;
    const institution = pack.institutions[0]!;
    const bank = institution.code as keyof typeof expected;
    const spec = expected[bank];
    const stats = counts[bank];
    assert.deepEqual(institution, { id: spec.id, code: bank, name: spec.name }, filename);
    assert.equal(pack.batch.category, "varsity", filename);
    assert.ok(pack.batch.id.startsWith(bank === "JU-U" ? "batch-ju-unverified-" : "batch-hstu-unverified-"), filename);
    assert.ok(pack.papers.every((paper) => paper.institutionId === spec.id), filename);

    const validation = validateQuestionPack(pack);
    assert.equal(validation.valid, true, `${filename}: ${validation.errors.join("; ")}`);

    assert.ok(!ids.batch.has(pack.batch.id), `duplicate imported batch ID: ${pack.batch.id}`);
    ids.batch.add(pack.batch.id);
    for (const source of pack.sourceDocuments) {
      assert.ok(!ids.source.has(source.id), `duplicate imported source ID: ${source.id}`);
      ids.source.add(source.id);
    }
    const sourceIds = new Set(pack.sourceDocuments.map((source) => source.id));
    for (const id of pack.batch.sourceDocumentIds) assert.ok(sourceIds.has(id), `${filename}: invalid batch source reference ${id}`);

    for (const paper of pack.papers) {
      assert.ok(paper.id.startsWith(bank === "JU-U" ? "ju-unverified-" : "hstu-unverified-"), filename);
      assert.ok(!ids.paper.has(paper.id), `duplicate imported paper ID: ${paper.id}`);
      ids.paper.add(paper.id);
    }
    for (const rule of pack.examRules) {
      assert.ok(rule.id.startsWith(bank === "JU-U" ? "rule-ju-unverified-" : "rule-hstu-unverified-"), filename);
      assert.equal(rule.verificationStatus, "unconfigured", filename);
      assert.ok(!ids.rule.has(rule.id), `duplicate imported rule ID: ${rule.id}`);
      ids.rule.add(rule.id);
      for (const sourceId of rule.sourceDocumentIds ?? []) assert.ok(sourceIds.has(sourceId), `${filename}: invalid rule source ${sourceId}`);
    }

    stats.packs += 1;
    for (const question of pack.questions) {
      assert.ok(question.id.startsWith(bank === "JU-U" ? "ju-unverified-" : "hstu-unverified-"), filename);
      assert.ok(!ids.question.has(question.id), `duplicate imported question ID: ${question.id}`);
      ids.question.add(question.id);
      assert.equal(question.contentVerificationStatus, "unverified", question.id);
      assert.ok(question.answerVerificationStatus === "unverified" || question.answerVerificationStatus === "unknown", question.id);
      assert.ok(sourceIds.has(question.source.documentId), `${filename}: invalid source for ${question.id}`);
      for (const appearance of question.appearances) {
        assert.ok(pack.papers.some((paper) => paper.id === appearance.paperId), `${filename}: invalid paper for ${question.id}`);
        if (appearance.sourceDocumentId) assert.ok(sourceIds.has(appearance.sourceDocumentId), `${filename}: invalid appearance source for ${question.id}`);
      }

      stats.questions += 1;
      if (question.answerVerificationStatus === "unverified") stats.unverifiedAnswers += 1;
      else stats.unknownAnswers += 1;
      if (question.type === "multiple_choice") stats.multipleChoice += 1;

      const oneSourceKey = Array.isArray(question.correctOptionIds) && question.correctOptionIds.length === 1;
      if (question.type === "single_choice" && question.options.length >= 2 && oneSourceKey) {
        const normalizedOptions = question.options.map((option) => option.text.trim().toLocaleLowerCase());
        if (new Set(normalizedOptions).size === normalizedOptions.length) stats.provisionalCandidates += 1;
        else stats.duplicateOptionQuestions += 1;
      }
    }
  }

  assert.deepEqual(counts, {
    "JU-U": {
      packs: expected["JU-U"].packs,
      questions: expected["JU-U"].questions,
      unverifiedAnswers: expected["JU-U"].unverifiedAnswers,
      unknownAnswers: expected["JU-U"].unknownAnswers,
      multipleChoice: expected["JU-U"].multipleChoice,
      provisionalCandidates: expected["JU-U"].provisionalCandidates,
      duplicateOptionQuestions: expected["JU-U"].duplicateOptionQuestions
    },
    "HSTU-U": {
      packs: expected["HSTU-U"].packs,
      questions: expected["HSTU-U"].questions,
      unverifiedAnswers: expected["HSTU-U"].unverifiedAnswers,
      unknownAnswers: expected["HSTU-U"].unknownAnswers,
      multipleChoice: expected["HSTU-U"].multipleChoice,
      provisionalCandidates: expected["HSTU-U"].provisionalCandidates,
      duplicateOptionQuestions: expected["HSTU-U"].duplicateOptionQuestions
    }
  });
  assert.equal(ids.batch.size, 99);
  assert.equal(ids.paper.size, 99);
  assert.equal(ids.rule.size, 99);
  assert.equal(ids.question.size, 5773);
  assert.equal(ids.source.size, 105);

  const institutions = new Set(allEntries.flatMap(({ pack }) => pack.institutions.map((institution) => institution.id)));
  assert.equal(institutions.has("ju-unverified-bank"), true);
  assert.equal(institutions.has("hstu-unverified-bank"), true);
  assert.equal(institutions.size, 7);
  assert.equal(entries.some(({ filename }) => filename.startsWith("gst-")), false, "GST_CLUSTER packs must remain excluded");
});

test("all 217 packs import without replacing verified JU/HSTU data and expose separate provisional pools", async () => {
  const entries = loadAllPacks();
  const additions = loadUnverifiedPacks();
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

  // Existing verified banks remain unchanged and separate from the new provisional banks.
  assert.equal(await countEligible(db, { institutionId: "ju" }), 1393);
  assert.equal(await countEligible(db, { institutionId: "hstu" }), 275);
  assert.equal(await countEligible(db, { institutionId: "ju-unverified-bank" }), 0);
  assert.equal(await countEligible(db, { institutionId: "hstu-unverified-bank" }), 0);
  assert.equal(await countReviewCandidates(db, { institutionId: "ju-unverified-bank" }), 4780);
  assert.equal(await countReviewCandidates(db, { institutionId: "hstu-unverified-bank" }), 722);
  assert.equal((await practiceQuestionIds(db, { institutionId: "ju-unverified-bank" })).length, 0);
  assert.equal((await practiceQuestionIds(db, { institutionId: "hstu-unverified-bank" })).length, 0);
  assert.equal((await practiceQuestionIds(db, { institutionId: "ju-unverified-bank" }, true)).length, 4780);
  assert.equal((await practiceQuestionIds(db, { institutionId: "hstu-unverified-bank" }, true)).length, 722);

  const institutions = await listInstitutions(db, "varsity");
  const ju = institutions.find((institution) => institution.id === "ju");
  const hstu = institutions.find((institution) => institution.id === "hstu");
  const juUnverified = institutions.find((institution) => institution.id === "ju-unverified-bank");
  const hstuUnverified = institutions.find((institution) => institution.id === "hstu-unverified-bank");
  assert.ok(ju && hstu && juUnverified && hstuUnverified);
  assert.deepEqual(
    { papers: ju.paperCount, questions: ju.questionCount, eligible: ju.eligibleCount },
    { papers: 50, questions: 1526, eligible: 1393 }
  );
  assert.deepEqual(
    { papers: hstu.paperCount, questions: hstu.questionCount, eligible: hstu.eligibleCount },
    { papers: 7, questions: 293, eligible: 275 }
  );
  assert.deepEqual(
    { papers: juUnverified.paperCount, questions: juUnverified.questionCount, eligible: juUnverified.eligibleCount, candidates: juUnverified.reviewCandidateCount },
    { papers: 84, questions: 5011, eligible: 0, candidates: 4780 }
  );
  assert.deepEqual(
    { papers: hstuUnverified.paperCount, questions: hstuUnverified.questionCount, eligible: hstuUnverified.eligibleCount, candidates: hstuUnverified.reviewCandidateCount },
    { papers: 15, questions: 762, eligible: 0, candidates: 722 }
  );

  const juPapers = await listPapers(db, { institutionId: "ju-unverified-bank" });
  const hstuPapers = await listPapers(db, { institutionId: "hstu-unverified-bank" });
  assert.equal(juPapers.length, 84);
  assert.equal(hstuPapers.length, 15);
  assert.equal(juPapers.reduce((sum, paper) => sum + paper.questionCount, 0), 5011);
  assert.equal(hstuPapers.reduce((sum, paper) => sum + paper.questionCount, 0), 762);

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
