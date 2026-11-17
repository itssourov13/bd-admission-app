import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSubmission, reviewSelection, selectionModeOf, toggleSelection } from "../src/services/answerSelection.ts";
import { isAnswerCorrect, scoreAttempt, type ScorableQuestion } from "../src/services/scoring.ts";

const KEYS = ["a", "b", "c", "d"];

test("selection mode follows question type", () => {
  assert.equal(selectionModeOf({ type: "single_choice" }), "single");
  assert.equal(selectionModeOf({ type: "multiple_choice" }), "multiple");
});

test("single choice replaces; multiple choice toggles and keeps option order", () => {
  assert.deepEqual(toggleSelection("single", ["a"], "c", KEYS), ["c"]);
  assert.deepEqual(toggleSelection("single", ["c"], "c", KEYS), ["c"]);
  let s: string[] = [];
  s = toggleSelection("multiple", s, "c", KEYS);
  s = toggleSelection("multiple", s, "a", KEYS);
  assert.deepEqual(s, ["a", "c"]);
  s = toggleSelection("multiple", s, "c", KEYS);
  assert.deepEqual(s, ["a"]);
  s = toggleSelection("multiple", s, "a", KEYS);
  assert.deepEqual(s, []);
  assert.deepEqual(toggleSelection("multiple", ["a"], "zz", KEYS), ["a"]);
});

test("submission validation rejects empty, unknown, duplicate and multi-key single answers", () => {
  assert.equal(normalizeSubmission("single", [], KEYS), null);
  assert.equal(normalizeSubmission("single", ["a", "b"], KEYS), null);
  assert.equal(normalizeSubmission("multiple", ["a", "a"], KEYS), null);
  assert.equal(normalizeSubmission("multiple", ["a", "x"], KEYS), null);
  assert.deepEqual(normalizeSubmission("multiple", ["c", "a"], KEYS), ["a", "c"]);
  assert.deepEqual(normalizeSubmission("single", ["d"], KEYS), ["d"]);
});

test("review separates matched, missing and extra selections", () => {
  assert.deepEqual(reviewSelection(["a", "c"], ["a", "b"], KEYS), { matched: ["a"], missing: ["c"], extra: ["b"] });
  assert.deepEqual(reviewSelection(["a", "c"], [], KEYS), { matched: [], missing: ["a", "c"], extra: [] });
});

test("exact-set scoring: partial, extra and empty selections are never correct", () => {
  const q: ScorableQuestion = { id: "m", correctKeys: ["a", "c"], answerVerified: true, type: "multiple_choice" };
  assert.equal(isAnswerCorrect(q, ["c", "a"]), true);
  assert.equal(isAnswerCorrect(q, ["a"]), false);
  assert.equal(isAnswerCorrect(q, ["a", "c", "d"]), false);
  assert.equal(isAnswerCorrect(q, []), false);
  const three: ScorableQuestion = { id: "t", correctKeys: ["a", "b", "d"], answerVerified: true, type: "multiple_choice" };
  assert.equal(isAnswerCorrect(three, ["d", "b", "a"]), true);
  assert.equal(isAnswerCorrect(three, ["a", "b"]), false);
  const s = scoreAttempt([q, three], { m: ["a"], t: [] }, { status: "verified", correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0 });
  assert.deepEqual([s.correct, s.incorrect, s.unanswered], [0, 1, 1]);
});

test("a verified no-correct-option record is ungraded, never incorrect", () => {
  const q: ScorableQuestion = { id: "n", correctKeys: [], answerVerified: true, type: "single_choice" };
  assert.equal(isAnswerCorrect(q, ["a"]), null);
  const s = scoreAttempt([q], { n: ["a"] }, { status: "verified", correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0 });
  assert.deepEqual([s.correct, s.incorrect, s.ungradedQuestions], [0, 0, 1]);
});
