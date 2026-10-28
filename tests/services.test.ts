import test from "node:test";
import assert from "node:assert/strict";
import { scoreAttempt, accuracyPercent, resolveRule, UNCONFIGURED_RULE, type ScorableQuestion, type ScoringRule } from "../src/services/scoring.ts";
import { remainingMs, remainingSeconds, isExpired, formatClock, clampFlashSeconds } from "../src/services/timer.ts";
import { startFlash, applyFlashEvent, summarizeFlash, finishFlash, mulberry32 } from "../src/services/flash.ts";
import { createExamState, selectOption, clearAnswer, finalizeExam, checkExamEligibility, pickExamQuestions, answeredCount } from "../src/services/exam.ts";
import { flashAdvice } from "../src/services/advice.ts";

const qs: ScorableQuestion[] = ["q1", "q2", "q3", "q4"].map((id) => ({ id, correctKeys: ["a"], answerVerified: true }));
const rule = (over: Partial<ScoringRule> = {}): ScoringRule => ({ correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, status: "verified", ...over });

test("scoring: correct, incorrect, unanswered with negative marking", () => {
  const s = scoreAttempt(qs, { q1: ["a"], q2: ["b"], q3: [] }, rule());
  assert.equal(s.correct, 1);
  assert.equal(s.incorrect, 1);
  assert.equal(s.unanswered, 2);
  assert.equal(s.score, 0.75);
  assert.equal(s.maxScore, 4);
  assert.equal(s.accuracyPercent, 50);
  assert.equal(s.isOfficialRule, true);
});

test("scoring: score can go negative and zero-answer accuracy is 0", () => {
  assert.equal(scoreAttempt(qs, { q1: ["b"], q2: ["b"] }, rule({ incorrectPenalty: 0.5 })).score, -1);
  assert.equal(scoreAttempt(qs, {}, rule()).accuracyPercent, 0);
  assert.equal(accuracyPercent(0, 0), 0);
});

test("scoring: ungraded questions are excluded, illustrative rule is not official", () => {
  const mixed = [...qs, { id: "q5", correctKeys: null, answerVerified: false }];
  const s = scoreAttempt(mixed, { q5: ["a"] }, rule({ status: "illustrative" }));
  assert.equal(s.ungradedQuestions, 1);
  assert.equal(s.gradedQuestions, 4);
  assert.equal(s.isOfficialRule, false);
});

test("scoring: unanswered marks, float rounding, invalid rule, rule resolution", () => {
  assert.equal(scoreAttempt(qs, { q1: ["a"], q2: ["a"], q3: ["a"], q4: ["b"] }, rule({ incorrectPenalty: 0.1 })).score, 2.9);
  assert.throws(() => scoreAttempt(qs, {}, rule({ incorrectPenalty: -1 })));
  assert.equal(scoreAttempt(qs, {}, rule({ unansweredMarks: 0.5 })).score, 2);
  assert.equal(resolveRule([]).status, "unconfigured");
  assert.equal(resolveRule([rule(), rule()]).status, "verified");
  assert.deepEqual(resolveRule([rule(), rule({ incorrectPenalty: 0.5 })]), UNCONFIGURED_RULE);
  assert.deepEqual(resolveRule([rule(), null]), UNCONFIGURED_RULE);
});

test("timer: deadline math and clamping", () => {
  assert.equal(remainingMs(10_000, 4_000), 6_000);
  assert.equal(remainingMs(10_000, 20_000), 0);
  assert.equal(remainingSeconds(10_000, 9_001), 1);
  assert.equal(isExpired(10_000, 10_000), true);
  assert.equal(formatClock(3600), "1:00:00");
  assert.equal(formatClock(75), "01:15");
  assert.equal(clampFlashSeconds(1), 5);
  assert.equal(clampFlashSeconds(9999), 600);
  assert.equal(clampFlashSeconds(Number.NaN), 30);
});

test("flash: no repeats until pool exhausted, then a new shuffled cycle", () => {
  const pool = ["a", "b", "c", "d"];
  let state = startFlash(pool, 30, 0, mulberry32(1))!;
  const seen: string[] = [];
  let now = 0;
  for (let i = 0; i < 4; i++) {
    seen.push(state.currentQuestionId!);
    now += 1000;
    state = applyFlashEvent(state, { type: "skip", position: state.position }, now, mulberry32(i)).state;
  }
  assert.deepEqual([...seen].sort(), pool);
  assert.equal(state.cycle, 2);
  assert.notEqual(state.currentQuestionId, "never");
  assert.notEqual(state.currentQuestionId, seen[3]);
});

test("flash: timeout vs interaction race records exactly once", () => {
  const s0 = startFlash(["a", "b"], 30, 0)!;
  const answered = applyFlashEvent(s0, { type: "answer", position: 1, selectedKeys: ["a"], correct: true }, 10_000);
  assert.equal(answered.applied, true);
  const late = applyFlashEvent(answered.state, { type: "timeout", position: 1 }, 30_000);
  assert.equal(late.applied, false);
  assert.equal(late.state.records.length, 1);
  assert.equal(applyFlashEvent(s0, { type: "timeout", position: 1 }, 29_999).applied, false);
  const timedOut = applyFlashEvent(s0, { type: "timeout", position: 1 }, 30_000);
  assert.equal(timedOut.record?.outcome, "timed_out");
  const lateAnswer = applyFlashEvent(s0, { type: "answer", position: 1, selectedKeys: ["a"], correct: true }, 31_000);
  assert.equal(lateAnswer.record?.outcome, "timed_out");
});

test("flash: summary stats, accuracy, empty pool and advice", () => {
  assert.equal(startFlash([], 30, 0), null);
  let s = startFlash(["a", "b", "c", "d"], 30, 0)!;
  const events = [
    { type: "answer" as const, selectedKeys: ["a"], correct: true },
    { type: "answer" as const, selectedKeys: ["b"], correct: false },
    { type: "skip" as const },
    { type: "timeout" as const }
  ];
  let now = 0;
  for (const e of events) {
    now += e.type === "timeout" ? 30_000 : 4_000;
    s = applyFlashEvent(s, { ...e, position: s.position } as never, now).state;
  }
  const sum = summarizeFlash(finishFlash(s).records, 0, now, 4);
  assert.deepEqual([sum.correct, sum.incorrect, sum.skipped, sum.timedOut, sum.answered], [1, 1, 1, 1, 2]);
  assert.equal(sum.accuracyPercent, 50);
  assert.equal(sum.cyclesCompleted, 1);
  assert.deepEqual(flashAdvice(summarizeFlash([], 0, 0, 4), 30), ["advice.noAnswers"]);
  assert.equal(flashAdvice(sum, 30).length > 0, true);
});

test("exam: eligibility needs exactly 100, pick is unique", () => {
  assert.equal(checkExamEligibility(99).ok, false);
  assert.equal(checkExamEligibility(99).shortfall, 1);
  const ids = Array.from({ length: 150 }, (_, i) => "q" + i);
  const picked = pickExamQuestions(ids)!;
  assert.equal(picked.length, 100);
  assert.equal(new Set(picked).size, 100);
  assert.equal(pickExamQuestions(ids.slice(0, 99)), null);
});

test("exam: answers persist, change, clear; finalize once; expired ignores input", () => {
  let st = createExamState("s1", ["q1", "q2"], 0, 60);
  st = selectOption(st, "q1", "a", 1000);
  st = selectOption(st, "q1", "c", 2000);
  assert.deepEqual(st.answers.q1, ["c"]);
  assert.equal(answeredCount(st), 1);
  st = clearAnswer(st, "q1", 3000);
  assert.equal(answeredCount(st), 0);
  const expiredTry = selectOption(st, "q2", "a", 60_000);
  assert.equal(expiredTry, st);
  const f1 = finalizeExam(st, "submitted", 5000);
  const f2 = finalizeExam(f1.state, "time_expired", 60_000);
  assert.equal(f1.applied, true);
  assert.equal(f2.applied, false);
  assert.equal(f2.state.finishReason, "submitted");
});
