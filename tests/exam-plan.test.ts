import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { loadExam, startStandardExam } from "../src/services/practiceService.ts";
import { getSession } from "../src/repositories/sessions.ts";
import { CUSTOM_PRACTICE_LIMITS, isValidCustomPractice, planExam, STANDARD_EXAM_QUESTIONS, STANDARD_EXAM_SECONDS } from "../src/services/exam.ts";
import type { QuestionPack, QuestionPackExamRule } from "../src/types/question-pack.ts";

const rng = () => 0.42;

/** SYNTHETIC: one paper per entry, `perPaper` questions each, with the given rule (or none). */
function packWith(papers: { id: string; rule?: Partial<QuestionPackExamRule> }[], perPaper: number): QuestionPack {
  const base = syntheticPack({}, 1);
  const template = base.questions[0]!;
  const questions = papers.flatMap((p, pi) => Array.from({ length: perPaper }, (_, i) => ({
    ...template,
    id: `q-${p.id}-${i + 1}`,
    text: `Synthetic ${p.id} question ${i + 1}`,
    appearances: [{ paperId: p.id, questionNumber: i + 1, pageNumber: pi + 1, sourceDocumentId: "src-syn" }],
    source: { documentId: "src-syn", pageNumber: pi + 1, questionNumber: i + 1 }
  })));
  return {
    ...base,
    papers: papers.map((p) => ({ id: p.id, institutionId: "inst-syn", category: "varsity" as const, year: 2025, unit: p.id })),
    examRules: papers.flatMap((p) => p.rule ? [{ id: `rule-${p.id}`, paperId: p.id, verificationStatus: "unconfigured" as const, ...p.rule }] : []),
    questions
  };
}

test("planExam: generic defaults apply only without an exact paper", () => {
  assert.deepEqual(planExam(undefined, null), { kind: "generic", required: STANDARD_EXAM_QUESTIONS, durationSeconds: STANDARD_EXAM_SECONDS });
  assert.deepEqual(planExam("p", { status: "verified", totalQuestions: 80, durationSeconds: 3600 }), { kind: "paper", required: 80, durationSeconds: 3600, official: true });
  assert.deepEqual(planExam("p", { status: "illustrative", totalQuestions: 40, durationSeconds: 1800 }), { kind: "paper", required: 40, durationSeconds: 1800, official: false });
});

test("planExam: missing, unconfigured or incomplete paper rules never become 100/60", () => {
  assert.deepEqual(planExam("p", null), { kind: "unavailable", reason: "no_rule" });
  assert.deepEqual(planExam("p", { status: "unconfigured", totalQuestions: 80, durationSeconds: 3600 }), { kind: "unavailable", reason: "unconfigured_rule" });
  assert.deepEqual(planExam("p", { status: "verified", totalQuestions: 80 }), { kind: "unavailable", reason: "incomplete_rule" });
  assert.deepEqual(planExam("p", { status: "verified", durationSeconds: 3600 }), { kind: "unavailable", reason: "incomplete_rule" });
  assert.deepEqual(planExam("p", { status: "verified", totalQuestions: 0, durationSeconds: 3600 }), { kind: "unavailable", reason: "incomplete_rule" });
});

test("custom practice bounds are enforced", () => {
  const l = CUSTOM_PRACTICE_LIMITS;
  assert.equal(isValidCustomPractice({ questions: 20, seconds: 1200 }), true);
  assert.equal(isValidCustomPractice({ questions: l.minQuestions - 1, seconds: 1200 }), false);
  assert.equal(isValidCustomPractice({ questions: l.maxQuestions + 1, seconds: 1200 }), false);
  assert.equal(isValidCustomPractice({ questions: 20, seconds: l.minSeconds - 1 }), false);
  assert.equal(isValidCustomPractice({ questions: 20.5, seconds: 1200 }), false);
  assert.equal(isValidCustomPractice(undefined), false);
});

test("global practice keeps the generic 100-question / 60-minute defaults", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, packWith([{ id: "paper-a" }], 100))).ok, true);
  const started = await startStandardExam(db, {}, 1000, rng);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.equal(session.deadlineAt, 1000 + STANDARD_EXAM_SECONDS * 1000);
  assert.equal((await loadExam(db, started.sessionId))!.questions.length, 100);
  assert.equal(session.filter.customPractice, undefined);
});

test("exact paper with a verified rule uses that paper's own count and duration", async () => {
  const db = await freshDb();
  const rule = { correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, totalQuestions: 10, durationSeconds: 600, verificationStatus: "verified" as const };
  assert.equal((await importQuestionPack(db, packWith([{ id: "paper-a", rule }], 100))).ok, true);
  const started = await startStandardExam(db, { paperId: "paper-a" }, 1000, rng);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.equal(session.deadlineAt, 1000 + 600 * 1000);
  assert.equal((await loadExam(db, started.sessionId))!.questions.length, 10);
  assert.equal(session.ruleStatus, "verified");
});

test("exact paper with an unconfigured rule does not start with 100/60 and is refused by the service", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, packWith([{ id: "paper-a", rule: { verificationStatus: "unconfigured" } }, { id: "paper-b" }], 100))).ok, true);
  for (const paperId of ["paper-a", "paper-b"]) {
    const r = await startStandardExam(db, { paperId }, 1000, rng);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "rule_unavailable");
  }
});

test("a paper rule missing duration or question count is incomplete, never filled with generic values", async () => {
  const db = await freshDb();
  const partial = { correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, verificationStatus: "verified" as const };
  assert.equal((await importQuestionPack(db, packWith([
    { id: "paper-a", rule: { ...partial, totalQuestions: 20 } },
    { id: "paper-b", rule: { ...partial, durationSeconds: 1200 } }
  ], 100))).ok, true);
  for (const paperId of ["paper-a", "paper-b"]) {
    const r = await startStandardExam(db, { paperId }, 1000, rng);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "rule_unavailable");
  }
});

test("custom practice is explicit, bounded, unscored and marked as not official", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, packWith([{ id: "paper-a" }], 30))).ok, true);
  const bad = await startStandardExam(db, { paperId: "paper-a" }, 1000, rng, { custom: { questions: 2, seconds: 10 } });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.reason, "invalid_custom");

  const started = await startStandardExam(db, { paperId: "paper-a" }, 1000, rng, { custom: { questions: 10, seconds: 300 } });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.equal(session.filter.customPractice, true);
  assert.equal(session.ruleStatus, "unconfigured", "custom practice never carries an official or illustrative rule");
  assert.equal(session.deadlineAt, 1000 + 300 * 1000);
  assert.equal((await loadExam(db, started.sessionId))!.questions.length, 10);
});

test("custom values are ignored when the exact paper already has its own pattern", async () => {
  const db = await freshDb();
  const rule = { correctMarks: 1, incorrectPenalty: 0, unansweredMarks: 0, totalQuestions: 10, durationSeconds: 600, verificationStatus: "verified" as const };
  assert.equal((await importQuestionPack(db, packWith([{ id: "paper-a", rule }], 30))).ok, true);
  const started = await startStandardExam(db, { paperId: "paper-a" }, 1000, rng, { custom: { questions: 25, seconds: 3000 } });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.equal(session.filter.customPractice, undefined);
  assert.equal((await loadExam(db, started.sessionId))!.questions.length, 10);
});

test("different paper rules in one institution scope are never merged into a false common rule", async () => {
  const db = await freshDb();
  const a = { correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, totalQuestions: 10, durationSeconds: 600, verificationStatus: "verified" as const };
  const b = { ...a, incorrectPenalty: 0.5, totalQuestions: 20 };
  assert.equal((await importQuestionPack(db, packWith([{ id: "paper-a", rule: a }, { id: "paper-b", rule: b }], 60))).ok, true);
  // Phase 11: an institution scope no longer inherits the generic defaults; only the category/all-catalogue scope does.
  const institution = await startStandardExam(db, { institutionId: "inst-syn" }, 1000, rng);
  assert.equal(institution.ok, false);
  if (!institution.ok) assert.equal(institution.reason, "rule_unavailable");
  const started = await startStandardExam(db, { category: "varsity" }, 1000, rng);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.notEqual(session.ruleStatus, "verified", "conflicting paper rules cannot become one official rule");
  assert.equal((await loadExam(db, started.sessionId))!.questions.length, 100, "the category scope uses the generic defaults, not either paper's count");
});
