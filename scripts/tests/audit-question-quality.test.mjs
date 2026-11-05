import test from "node:test";
import assert from "node:assert/strict";
import { auditQuestionPack, renderMarkdownReport } from "../audit-question-quality.mjs";

function packWith(questionText, options) {
  return {
    batch: { id: "fixture-batch" },
    questions: [{
      id: "fixture-question",
      text: questionText,
      options: options.map((text, i) => ({ id: String.fromCharCode(97 + i), text, order: i + 1 })),
      correctOptionIds: ["a"],
      appearances: [{ paperId: "fixture-paper", questionNumber: 1, pageNumber: 2 }],
      source: { documentId: "fixture-source", pageNumber: 2, questionNumber: 1 }
    }]
  };
}

test("audit does not flag legitimate book-page distractors or scientific names as extraction noise", () => {
  const findings = auditQuestionPack(packWith("Choose the best term.", [
    "Open at page 16 of the book.",
    "B. denitrificans",
    "Solution not possible",
    "Tollen's solution"
  ]), "fixture.json");
  assert.equal(findings.some((f) => f.code === "OPT_PAGE_MARKER" || f.code === "OPT_LABEL_PREFIX" || f.code === "OPT_EXTRACTION_NOTE"), false);
});

test("audit catches explicit stray option labels before formula transcription", () => {
  const findings = auditQuestionPack(packWith("Select the correct vector relation.", [
    "(B) \\( \\vec{Q}>\\vec{P} \\)",
    "ordinary distractor"
  ]), "fixture.json");
  assert.equal(findings.filter((f) => f.code === "OPT_LABEL_PREFIX").length, 1);
});

test("audit catches explicit extraction and page markers but not ordinary transcription vocabulary or algebra", () => {
  const extraction = auditQuestionPack(packWith("Read the transcription passage.", [
    "Transcription",
    "OCR extraction note: option was unreadable"
  ]), "fixture.json");
  assert.equal(extraction.some((f) => f.code === "OPT_EXTRACTION_NOTE"), true);
  assert.equal(extraction.some((f) => f.code === "Q_EXTRACTION_NOTE"), false);

  const page = auditQuestionPack(packWith("Reference: page 16", ["ordinary option", "other option"]), "fixture.json");
  assert.equal(page.some((f) => f.code === "Q_PAGE_MARKER"), true);

  const algebra = auditQuestionPack(packWith("If a − ib = − 1 − i, find a.", ["0", "1"]), "fixture.json");
  assert.equal(algebra.some((f) => f.code === "Q_PAGE_MARKER"), false);
});

test("markdown audit report names its scope and preserves review-only language", () => {
  const findings = auditQuestionPack(packWith("Question", ["one", "one"]), "fixture.json");
  const report = renderMarkdownReport({ packs: 1, questions: 1, findings }, "review");
  assert.match(report, /Read-only scan/);
  assert.match(report, /candidate-finding heuristic/);
  assert.match(report, /fixture-question/);
  assert.match(report, /No question\/option content is changed/);
});
