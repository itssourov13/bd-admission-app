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
