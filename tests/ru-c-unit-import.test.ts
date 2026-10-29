import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { freshDb } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import { countReviewCandidates, eligibleQuestionIds, practiceQuestionIds } from "../src/repositories/content.ts";

type Pack = {
  schemaVersion: number;
  batch: { id: string };
  institutions: { id: string; code: string; name: string }[];
  papers: { id: string; academicSession?: string | null; unit?: string | null }[];
  sourceDocuments: { id: string; sourceType: string; notes?: string }[];
  examRules: unknown[];
  questions: {
    id: string;
    answerVerificationStatus: string;
    contentVerificationStatus: string;
    correctOptionIds: string[] | null;
    assetPaths?: string[];
    options: { id: string; text: string }[];
  }[];
};

const packDir = resolve("data/question-packs");
const packFiles = readdirSync(packDir).filter((name) => /^ru-c-\d{4}-\d{4}-.+\.json$/.test(name)).sort();
const loadPacks = (): Pack[] => packFiles.map((name) =>
  JSON.parse(readFileSync(resolve(packDir, name), "utf8")) as Pack
);

test("RU C Unit Science packs remain unverified, while provisional mode can select safe candidates and hides duplicate-option items", async () => {
  assert.equal(packFiles.length, 44, "all 44 curated RU C pack files should be bundled");
  const packs = loadPacks();
  const allQuestionIds = new Set<string>();
  const allPaperIds = new Set<string>();
  const allBatchIds = new Set<string>();
  let expectedQuestions = 0;
  let expectedAssetRefs = 0;
  let expectedWarnings = 0;

  for (const [index, pack] of packs.entries()) {
    assert.equal(pack.schemaVersion, 1);
    assert.equal(pack.batch.id.startsWith("ru-c-"), true);
    assert.equal(pack.institutions.length, 1);
    assert.deepEqual(pack.institutions[0], { id: "ru", code: "RU", name: "UNVERIFIED — University of Rajshahi" });
    assert.equal(pack.papers.length, 1);
    assert.equal(pack.papers[0]!.unit, "C Unit — Science");
    assert.equal(pack.examRules.length, 0, "do not infer historical exam rules from third-party listings");
    assert.equal(pack.sourceDocuments.length, 1);
    assert.equal(pack.sourceDocuments[0]!.sourceType, "structured-data");
    assert.match(pack.sourceDocuments[0]!.notes ?? "", /third-party/i);

    const validation = validateQuestionPack(pack);
    assert.equal(validation.valid, true, `${packFiles[index]}: ${validation.errors.join("; ")}`);
    expectedWarnings += validation.warnings.length;
    assert.equal(allBatchIds.has(pack.batch.id), false, `duplicate batch ${pack.batch.id}`);
    allBatchIds.add(pack.batch.id);

    for (const paper of pack.papers) {
      assert.equal(allPaperIds.has(paper.id), false, `duplicate paper ${paper.id}`);
      allPaperIds.add(paper.id);
    }

    expectedQuestions += pack.questions.length;
    for (const question of pack.questions) {
      assert.equal(allQuestionIds.has(question.id), false, `duplicate question ${question.id}`);
      allQuestionIds.add(question.id);
      assert.equal(question.answerVerificationStatus, "unverified", question.id);
      assert.equal(question.contentVerificationStatus, "unverified", question.id);
      assert.ok(question.options.length >= 2, question.id);
      if (question.assetPaths) {
        for (const assetPath of question.assetPaths) {
          expectedAssetRefs++;
          assert.match(assetPath, /^assets\/lokkho\/[^/]+\.png$/, `${question.id}: non-normalized asset path ${assetPath}`);
          assert.equal(existsSync(resolve(packDir, assetPath)), true, `${question.id}: missing asset ${assetPath}`);
        }
      }
    }
  }

  assert.equal(expectedQuestions, 4009);
  assert.equal(allQuestionIds.size, expectedQuestions);
  assert.equal(allPaperIds.size, 44);
  assert.equal(allBatchIds.size, 44);
  assert.equal(expectedAssetRefs, 46);
  assert.equal(expectedWarnings, 4023, "expected candidate-key and duplicate-option warnings remain visible");

  const db = await freshDb();
  for (const pack of packs) {
    const report = await importQuestionPack(db, pack as never, Date.UTC(2026, 9, 29));
    assert.equal(report.ok, true, `${pack.batch.id}: ${report.errors.join("; ")}`);
    assert.equal(report.questions.inserted, pack.questions.length, pack.batch.id);
  }

  const totals = await db.getFirstAsync<{
    questions: number; batches: number; papers: number; rules: number; sources: number;
    appearances: number; options: number; unverifiedAnswers: number; unverifiedContent: number;
    answerStatusesOtherThanUnverified: number; contentStatusesOtherThanUnverified: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM questions) AS questions,
      (SELECT COUNT(*) FROM question_batches) AS batches,
      (SELECT COUNT(*) FROM exam_papers) AS papers,
      (SELECT COUNT(*) FROM exam_rules) AS rules,
      (SELECT COUNT(*) FROM source_documents) AS sources,
      (SELECT COUNT(*) FROM question_appearances) AS appearances,
      (SELECT COUNT(*) FROM question_options) AS options,
      (SELECT COUNT(*) FROM questions WHERE answer_status = 'unverified') AS unverifiedAnswers,
      (SELECT COUNT(*) FROM questions WHERE content_status = 'unverified') AS unverifiedContent,
      (SELECT COUNT(*) FROM questions WHERE answer_status <> 'unverified') AS answerStatusesOtherThanUnverified,
      (SELECT COUNT(*) FROM questions WHERE content_status <> 'unverified') AS contentStatusesOtherThanUnverified`
  );
  assert.equal(totals?.questions, 4009);
  assert.equal(totals?.batches, 44);
  assert.equal(totals?.papers, 44);
  assert.equal(totals?.rules, 0);
  assert.equal(totals?.sources, 44);
  assert.equal(totals?.appearances, 4009);
  assert.ok((totals?.options ?? 0) >= 16000);
  assert.equal(totals?.unverifiedAnswers, 4009);
  assert.equal(totals?.unverifiedContent, 4009);
  assert.equal(totals?.answerStatusesOtherThanUnverified, 0);
  assert.equal(totals?.contentStatusesOtherThanUnverified, 0);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM institutions WHERE code = 'RU'"))?.n, 1);
  assert.equal((await eligibleQuestionIds(db, { category: "varsity" })).length, 0,
    "unverified questions are never in the verified-only pool");
  const reviewCount = await countReviewCandidates(db, { institutionId: "ru" });
  assert.ok(reviewCount >= 3980 && reviewCount < 4009,
    "review mode should allow structurally safe candidates while withholding duplicate-option items");
  assert.equal((await practiceQuestionIds(db, { institutionId: "ru" }, true)).length, reviewCount,
    "provisional practice must be a separate explicit pool and exclude structurally ambiguous options");

  const importedAssets = await db.getAllAsync<{ asset_paths: string }>(
    "SELECT asset_paths FROM questions WHERE asset_paths IS NOT NULL"
  );
  const databaseAssetPaths = importedAssets.flatMap((row) => JSON.parse(row.asset_paths) as string[]);
  assert.equal(databaseAssetPaths.length, expectedAssetRefs);
  for (const assetPath of databaseAssetPaths) {
    assert.equal(existsSync(resolve(packDir, assetPath)), true, `imported asset not on disk: ${assetPath}`);
  }

  const repeat = await importQuestionPack(db, packs[0]! as never, Date.UTC(2026, 9, 30));
  assert.equal(repeat.ok, true);
  assert.equal(repeat.questions.inserted, 0);
  assert.equal(repeat.questions.updated, 0);
  assert.equal(repeat.questions.skipped, packs[0]!.questions.length);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))?.n, 4009);
});
