import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { loadExam, startStandardExam } from "../src/services/practiceService.ts";
import { getSession } from "../src/repositories/sessions.ts";
import { listExamPatterns } from "../src/repositories/content.ts";
import {
  examEntryAvailable, groupExamPatterns, patternScope, planExam, planPatternScope, STANDARD_EXAM_QUESTIONS, STANDARD_EXAM_SECONDS,
  type PatternPaper
} from "../src/services/exam.ts";
import { scopeFromParams, scopeParams } from "../src/features/navigation/links.ts";
import type { QuestionPack, QuestionPackExamRule } from "../src/types/question-pack.ts";

const rng = () => 0.42;
const verified80 = { status: "verified" as const, totalQuestions: 80, durationSeconds: 3300 };

test("planExam: a university scope without a resolved pattern is never generic 100/60", () => {
  assert.deepEqual(planExam(undefined, null, { institutionScoped: true }), { kind: "unavailable", reason: "no_rule" });
  // The all-catalogue / category scope keeps the intentional generic defaults.
  assert.deepEqual(planExam(undefined, null), { kind: "generic", required: STANDARD_EXAM_QUESTIONS, durationSeconds: STANDARD_EXAM_SECONDS });
});

test("planPatternScope: identical complete rules resolve; anything else never becomes 100/60", () => {
  assert.deepEqual(planPatternScope([verified80, verified80]), { kind: "paper", required: 80, durationSeconds: 3300, official: true });
  assert.deepEqual(planPatternScope([]), { kind: "unavailable", reason: "no_rule" });
  assert.deepEqual(planPatternScope([verified80, null]), { kind: "unavailable", reason: "no_rule" });
  assert.deepEqual(planPatternScope([verified80, { status: "unconfigured" }]), { kind: "unavailable", reason: "unconfigured_rule" });
  assert.deepEqual(planPatternScope([{ status: "verified", totalQuestions: 80 }]), { kind: "unavailable", reason: "incomplete_rule" });
  assert.deepEqual(planPatternScope([verified80, { ...verified80, totalQuestions: 60 }]), { kind: "unavailable", reason: "mixed_rules" });
  assert.deepEqual(planPatternScope([verified80, { ...verified80, status: "illustrative" }]), { kind: "unavailable", reason: "mixed_rules" });
  assert.equal(planPatternScope([{ ...verified80, selectionConfig: { mode: "select_subjects" } }]).kind, "unavailable");
});

const papers: PatternPaper[] = [
  { id: "ju-a-set02", academicSession: "2024-2025", unit: "A", rule: verified80 },
  { id: "ju-d-set12", academicSession: "2024-2025", unit: "D", rule: verified80 },
  { id: "ju-d-set13", academicSession: "2024-2025", unit: "D", rule: verified80 },
  { id: "ju-a-2023", academicSession: "2023-2024", unit: "A", rule: { status: "unconfigured" } },
  { id: "hstu-a", academicSession: "2024-2025", unit: "A", rule: { status: "verified" } },
  { id: "ru-a", academicSession: "2024-2025", unit: "A", rule: null },
  { id: "du-a", academicSession: "2024-2025", unit: "A", rule: { status: "illustrative", totalQuestions: 60, durationSeconds: 2700, selectionConfig: { mode: "select_subjects", subjects: ["a", "b"], subjectCount: 1 } } }
];

test("groupExamPatterns: only complete stored patterns become options, grouped by session and unit", () => {
  const options = groupExamPatterns(papers);
  assert.deepEqual(options.map((o) => [o.academicSession, o.unit, o.required, o.durationSeconds, o.official, o.paperIds]), [
    ["2024-2025", "A", 80, 3300, true, ["ju-a-set02"]],
    ["2024-2025", "D", 80, 3300, true, ["ju-d-set12", "ju-d-set13"]],
    ["2024-2025", "A", 60, 2700, false, ["du-a"]]
  ]);
  assert.deepEqual(patternScope(options[0]!), { paperId: "ju-a-set02" });
  assert.deepEqual(patternScope(options[1]!), { paperIds: ["ju-d-set12", "ju-d-set13"] });
  // Unconfigured, partial (HSTU marks only) and rule-less (RU) papers contribute nothing and are not defaulted.
  assert.equal(options.some((o) => o.paperIds.some((id) => ["ju-a-2023", "hstu-a", "ru-a"].includes(id))), false);
});

test("groupExamPatterns: different universities/sessions keep different counts; section patterns are not pooled", () => {
  const two = groupExamPatterns([
    { id: "x1", academicSession: "2024-2025", unit: "A", rule: verified80 },
    { id: "y1", academicSession: "2025-2026", unit: "A", rule: { status: "verified", totalQuestions: 100, durationSeconds: 3600 } }
  ]);
  assert.deepEqual(two.map((o) => [o.academicSession, o.required, o.durationSeconds]), [["2025-2026", 100, 3600], ["2024-2025", 80, 3300]]);
  const sectioned = { status: "illustrative" as const, totalQuestions: 60, durationSeconds: 2700, selectionConfig: { mode: "select_subjects" } };
  assert.deepEqual(groupExamPatterns([
    { id: "s1", academicSession: "2024-2025", unit: "A", rule: sectioned },
    { id: "s2", academicSession: "2024-2025", unit: "A", rule: sectioned }
  ]), []);
});

test("examEntryAvailable derives from patterns and pool, not a universal threshold", () => {
  assert.equal(examEntryAvailable([{ required: 80, eligible: 80 }], 80), true);
  assert.equal(examEntryAvailable([{ required: 80, eligible: 79 }], 4), false);
  assert.equal(examEntryAvailable([], 60), true, "Custom Practice is possible for a 60-question pool");
  assert.equal(examEntryAvailable([], 3), false);
});

test("scope params round-trip paperIds and exact papers win", () => {
  const scope = scopeFromParams({ institutionIds: "ju", paperIds: "p1,p2" });
  assert.deepEqual(scope.paperIds, ["p1", "p2"]);
  assert.deepEqual(scopeFromParams(scopeParams(scope)).paperIds, ["p1", "p2"]);
  assert.equal(scopeFromParams({ paperId: "p1", paperIds: "p2" }).paperIds, undefined);
  assert.equal(scopeFromParams({ paperIds: "bad id;drop" }).paperIds, undefined);
});

/** SYNTHETIC: papers of one institution with explicit session/unit and rule. */
function institutionPack(defs: { id: string; unit: string; rule?: Partial<QuestionPackExamRule> }[], perPaper: number): QuestionPack {
  const base = syntheticPack({}, 1);
  const template = base.questions[0]!;
  const questions = defs.flatMap((p, pi) => Array.from({ length: perPaper }, (_, i) => ({
    ...template,
    id: `q-${p.id}-${i + 1}`,
    text: `Synthetic ${p.id} question ${i + 1}`,
    appearances: [{ paperId: p.id, questionNumber: i + 1, pageNumber: pi + 1, sourceDocumentId: "src-syn" }],
    source: { documentId: "src-syn", pageNumber: pi + 1, questionNumber: i + 1 }
  })));
  return {
    ...base,
    papers: defs.map((p) => ({ id: p.id, institutionId: "inst-syn", category: "varsity" as const, year: 2025, academicSession: "2024-2025", unit: p.unit })),
    examRules: defs.flatMap((p) => p.rule ? [{ id: `rule-${p.id}`, paperId: p.id, verificationStatus: "unconfigured" as const, ...p.rule }] : []),
    questions
  };
}

const full = { correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, totalQuestions: 12, durationSeconds: 720, verificationStatus: "verified" as const };

test("institution exam: never generic 100/60; a stored pattern resolves from that university's papers only", async () => {
  const db = await freshDb();
  const pack = institutionPack([
    { id: "p-a1", unit: "A", rule: full },
    { id: "p-d1", unit: "D", rule: full },
    { id: "p-d2", unit: "D", rule: full },
    { id: "p-old", unit: "A", rule: { verificationStatus: "unconfigured" } },
    { id: "p-none", unit: "H" }
  ], 30);
  assert.equal((await importQuestionPack(db, pack)).ok, true);

  const refused = await startStandardExam(db, { institutionId: "inst-syn" }, 1000, rng);
  assert.equal(refused.ok, false, "institution scope must not inherit 100/60");
  if (!refused.ok) assert.equal(refused.reason, "rule_unavailable");
  const refusedMany = await startStandardExam(db, { institutionIds: ["inst-syn"] }, 1000, rng);
  assert.equal(refusedMany.ok, false);

  const options = await listExamPatterns(db, ["inst-syn"]);
  assert.deepEqual(options.map((o) => [o.unit, o.required, o.durationSeconds, o.paperIds, o.eligible]), [
    ["A", 12, 720, ["p-a1"], 30],
    ["D", 12, 720, ["p-d1", "p-d2"], 60]
  ]);

  const started = await startStandardExam(db, { institutionIds: ["inst-syn"], paperIds: ["p-d1", "p-d2"] }, 1000, rng);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.equal(session.durationSeconds, 720);
  assert.equal(session.deadlineAt, 1000 + 720 * 1000);
  assert.equal(session.ruleStatus, "verified");
  const loaded = await loadExam(db, started.sessionId);
  assert.equal(loaded!.questions.length, 12);
  assert.ok(loaded!.questions.every((q) => q.id.startsWith("q-p-d1-") || q.id.startsWith("q-p-d2-")), "pool is limited to the pattern's papers");
  assert.equal(session.filter.customPractice, undefined);
});

test("paperIds with an unconfigured, missing or differing rule is refused, never 100/60", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, institutionPack([
    { id: "p-ok", unit: "A", rule: full },
    { id: "p-diff", unit: "A", rule: { ...full, totalQuestions: 10 } },
    { id: "p-un", unit: "A", rule: { verificationStatus: "unconfigured" } },
    { id: "p-none", unit: "A" }
  ], 30))).ok, true);
  for (const paperIds of [["p-ok", "p-diff"], ["p-ok", "p-un"], ["p-ok", "p-none"]]) {
    const r = await startStandardExam(db, { institutionIds: ["inst-syn"], paperIds }, 1000, rng);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "rule_unavailable");
  }
});

test("institution Custom Practice stays explicit, unscored and user-sized; insufficient pools are refused", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, institutionPack([{ id: "p-a", unit: "A", rule: full }], 30))).ok, true);
  const custom = await startStandardExam(db, { institutionId: "inst-syn" }, 1000, rng, { custom: { questions: 15, seconds: 900 } });
  assert.equal(custom.ok, true);
  if (custom.ok) {
    const session = (await getSession(db, custom.sessionId))!;
    assert.equal(session.filter.customPractice, true);
    assert.equal(session.ruleStatus, "unconfigured");
    assert.equal(session.deadlineAt, 1000 + 900 * 1000);
  }
  const tooMany = await startStandardExam(db, { institutionId: "inst-syn", paperIds: ["p-a"] }, 1000, rng);
  assert.equal(tooMany.ok, true, "12-question pattern fits a 30-question pool");
  const small = institutionPack([{ id: "p-s", unit: "A", rule: { ...full, totalQuestions: 20 } }], 8);
  const db2 = await freshDb();
  assert.equal((await importQuestionPack(db2, small)).ok, true);
  const short = await startStandardExam(db2, { institutionIds: ["inst-syn"], paperIds: ["p-s"] }, 1000, rng);
  assert.equal(short.ok, false);
  if (!short.ok) { assert.equal(short.eligibility.available, 8); assert.equal(short.eligibility.shortfall, 12); }
});
