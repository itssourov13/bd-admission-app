import test from "node:test";
import assert from "node:assert/strict";
import { validateQuestionPack } from "../validate-question-pack.mjs";

function validPack() {
  return {
    schemaVersion: 1,
    batch: { id: "batch-test", category: "varsity", sourceDocumentIds: ["source-test"] },
    sourceDocuments: [{ id: "source-test", filename: "test.pdf", sourceType: "pdf" }],
    institutions: [{ id: "uni-test", code: "UT", name: "Fictional Test University" }],
    papers: [{ id: "paper-test", institutionId: "uni-test", category: "varsity", year: 2025 }],
    examRules: [{
      id: "rule-test", paperId: "paper-test", correctMarks: 1, incorrectPenalty: 0.25,
      unansweredMarks: 0, verificationStatus: "illustrative"
    }],
    questions: [{
      id: "question-test", text: "Synthetic validator fixture; not a historical admission question.",
      type: "single_choice", category: "varsity",
      options: [{ id: "a", text: "Option A", order: 1 }, { id: "b", text: "Option B", order: 2 }],
      correctOptionIds: ["a"], answerVerificationStatus: "verified",
      contentVerificationStatus: "verified", appearances: [{ paperId: "paper-test", questionNumber: 1, pageNumber: 1 }],
      source: { documentId: "source-test", pageNumber: 1, questionNumber: 1 }
    }]
  };
}

test("accepts a structurally valid synthetic question pack", () => {
  const result = validateQuestionPack(validPack());
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("rejects a question referencing an unknown paper", () => {
  const pack = validPack();
  pack.questions[0].appearances[0].paperId = "missing-paper";
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes("unknown paper")));
});

test("rejects duplicated option IDs and a verified answer that points nowhere", () => {
  const pack = validPack();
  pack.questions[0].options[1].id = "a";
  pack.questions[0].correctOptionIds = ["missing-option"];
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes("duplicate option id")));
  assert.ok(result.errors.some((message) => message.includes("unknown correct option")));
});

test("rejects duplicate institution codes, a second rule per paper and a repeated appearance", () => {
  const pack = validPack();
  pack.institutions.push({ id: "uni-other", code: "ut", name: "Another" });
  pack.examRules.push({ id: "rule-2", paperId: "paper-test", verificationStatus: "unconfigured" });
  pack.questions[0].appearances.push({ paperId: "paper-test", questionNumber: 1, pageNumber: 1 });
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes("duplicates the code")));
  assert.ok(result.errors.some((m) => m.includes("second rule for paper")));
  assert.ok(result.errors.some((m) => m.includes("duplicates an earlier appearance")));
});

test("a verified rule must define every scoring value; unverified answers never need a key", () => {
  const pack = validPack();
  pack.examRules[0].verificationStatus = "verified";
  delete pack.examRules[0].unansweredMarks;
  pack.questions[0].answerVerificationStatus = "unknown";
  pack.questions[0].correctOptionIds = null;
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes("marked verified but does not define all scoring values")));
  assert.equal(result.errors.some((m) => m.includes("verified answer")), false);
});

test("supports explicit replacement of active paper appearances and validates the flag type", () => {
  const pack = validPack();
  pack.replaceExistingPaperContent = true;
  assert.equal(validateQuestionPack(pack).valid, true);
  pack.replaceExistingPaperContent = "true";
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes("replaceExistingPaperContent must be a boolean")));
});

test("rejects unsupported schema versions with an actionable message", () => {
  const pack = validPack();
  pack.schemaVersion = 2;
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes("schemaVersion must be 1")));
});


test("accepts a verified source marker that explicitly says no listed option is correct", () => {
  const pack = validPack();
  pack.questions[0].correctOptionIds = [];
  pack.questions[0].answerDisposition = "no_correct_option";
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, true, result.errors.join("\n"));

  delete pack.questions[0].answerDisposition;
  const rejected = validateQuestionPack(pack);
  assert.equal(rejected.valid, false);
  assert.ok(rejected.errors.some((message) => message.includes("cannot have a verified answer without at least one correct option")));
});

test("accepts a verified multiple-choice source answer with multiple correct options", () => {
  const pack = validPack();
  pack.questions[0].type = "multiple_choice";
  pack.questions[0].correctOptionIds = ["a", "b"];
  const result = validateQuestionPack(pack);
  assert.equal(result.valid, true, result.errors.join("\n"));
});
