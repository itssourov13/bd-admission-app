import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { scopeFromParams, scopeParams } from "../src/features/navigation/links.ts";
import {
  combinedCount, formatSubjectsParam, isValidSubjectName, parseSubjectsParam, pruneUnavailable, sanitizeSubjects,
  selectedSubjectsOf, selectionMode, SUBJECT_SELECTION_MAX, toggleSubject, withSubjectSelection
} from "../src/services/subjectSelection.ts";
import { subjectLabelKey } from "../src/services/subjects.ts";
import { clampCustomQuestions, customCountOptions, customMinuteOptions, defaultCustomQuestions, suggestCustomMinutes } from "../src/services/exam.ts";
import { countEligible, countPoolBySubject, eligibleQuestionIds, loadQuestions } from "../src/repositories/content.ts";
import { startStandardExam, loadExam } from "../src/services/practiceService.ts";
import { translations } from "../src/i18n/translations.ts";

test("subject names: valid ones pass, injection-looking or comma values are rejected", () => {
  assert.equal(isValidSubjectName("Higher Mathematics"), true);
  assert.equal(isValidSubjectName("General Knowledge"), true);
  assert.equal(isValidSubjectName("বাংলা"), true);
  for (const bad of ["", " Physics", "Physics,Chemistry", "x'; DROP TABLE questions;--", "a".repeat(80), "<b>"]) {
    assert.equal(isValidSubjectName(bad), false, bad);
  }
  assert.equal(isValidSubjectName(undefined), false);
});

test("sanitize/parse/format: canonical order first, duplicates and junk dropped, size capped", () => {
  assert.deepEqual(sanitizeSubjects(["Chemistry", "Physics", "Chemistry", "bad,value", "Geology"]), ["Physics", "Chemistry", "Geology"]);
  assert.deepEqual(parseSubjectsParam("English,Physics,,;DROP,Physics"), ["Physics", "English"]);
  assert.deepEqual(parseSubjectsParam(undefined), []);
  assert.equal(formatSubjectsParam([]), undefined);
  assert.equal(formatSubjectsParam(["Biology", "Physics"]), "Physics,Biology");
  const many = Array.from({ length: 40 }, (_, i) => `Subject ${i}`);
  assert.equal(sanitizeSubjects(many).length, SUBJECT_SELECTION_MAX);
});

test("selection modes and toggling follow All / Single / Multiple", () => {
  assert.equal(selectionMode([]), "all");
  assert.equal(selectionMode(["Physics"]), "single");
  assert.equal(selectionMode(["Physics", "Biology"]), "multiple");
  let sel: string[] = [];
  sel = toggleSubject(sel, "Biology");
  sel = toggleSubject(sel, "Physics");
  assert.deepEqual(sel, ["Physics", "Biology"]);
  sel = toggleSubject(sel, "Physics");
  assert.deepEqual(sel, ["Biology"]);
  assert.deepEqual(toggleSubject(sel, "bad,name"), ["Biology"]);
  assert.deepEqual(toggleSubject(["A1", "A2"], "A3", 2), ["A1", "A2"]);
});

test("withSubjectSelection uses subject for one, subjects for several, and clears both for all", () => {
  const base = { category: "varsity" as const, institutionIds: ["ru"] };
  assert.deepEqual(withSubjectSelection({ ...base, subject: "Physics", subjects: ["A", "B"] }, []), base);
  assert.deepEqual(withSubjectSelection(base, ["Physics"]), { ...base, subject: "Physics" });
  assert.deepEqual(withSubjectSelection(base, ["Biology", "Physics"]), { ...base, subjects: ["Physics", "Biology"] });
  assert.deepEqual(selectedSubjectsOf({ subject: "Physics" }), ["Physics"]);
  assert.deepEqual(selectedSubjectsOf({ subjects: ["Biology", "Physics"] }), ["Physics", "Biology"]);
  assert.deepEqual(selectedSubjectsOf({}), []);
});

test("prune and combined count: combined count is the sum of selected subjects, 'all' uses the scope total", () => {
  const counts = { Physics: 4, Chemistry: 0, Biology: 6 };
  assert.deepEqual(pruneUnavailable(["Physics", "Chemistry", "Unknown"], counts), ["Physics"]);
  assert.equal(combinedCount([], counts, 11), 11);
  assert.equal(combinedCount(["Physics", "Biology"], counts, 11), 10);
  assert.equal(combinedCount(["Chemistry"], counts, 11), 0);
});

test("route params: subjects round-trip, malformed values are dropped, old keys are unchanged", () => {
  const filter = withSubjectSelection({ category: "varsity", institutionIds: ["ru"] }, ["Biology", "Physics"]);
  const params = scopeParams(filter) as Record<string, string>;
  assert.equal(params.subjects, "Physics,Biology");
  assert.deepEqual(scopeFromParams(params).subjects, ["Physics", "Biology"]);
  assert.deepEqual(scopeFromParams({ subjects: "ok,bad;name,x'y--" }).subjects, ["ok"]);
  assert.equal("subjects" in scopeFromParams({ subjects: "" }), false);
  assert.equal("subjects" in scopeParams({ category: "medical", paperId: "p1" }), false);
  assert.equal(scopeFromParams({ subject: "Physics" }).subject, "Physics");
  assert.equal(scopeFromParams({ subject: "Physics,Biology" }).subject, undefined);
  assert.equal(scopeFromParams({ subject: "x'; DROP" }).subject, undefined);
  assert.deepEqual(scopeParams(withSubjectSelection({}, ["Physics"])).subject, "Physics");
});

test("labels: every extra subject has an English and Bangla translation", () => {
  for (const s of ["General Knowledge", "IQ", "Mathematics", "General Mathematics", "Geology", "Physics"]) {
    const key = subjectLabelKey(s);
    assert.ok(key && key in translations, s);
  }
  assert.equal(subjectLabelKey("Unknown subject"), undefined);
  for (const key of ["subject.summaryAll", "subject.summarySingle", "subject.summaryMultiple", "subject.clear", "history.subjects", "exam.customCountHint", "exam.customTooFew"]) {
    assert.ok(key in translations, key);
  }
});

test("Custom Practice sizing follows the selected pool and the generic exam pace", () => {
  assert.deepEqual(customCountOptions(3), []);
  assert.deepEqual(customCountOptions(7), [5, 7]);
  assert.deepEqual(customCountOptions(45), [5, 10, 20, 30, 45]);
  assert.deepEqual(customCountOptions(500), [5, 10, 20, 30, 50, 100, 150, 200]);
  assert.equal(defaultCustomQuestions(3), null);
  assert.equal(defaultCustomQuestions(7), 7);
  assert.equal(defaultCustomQuestions(45), 30);
  assert.equal(clampCustomQuestions(50, 45), 45);
  assert.equal(clampCustomQuestions(20, 7), 7);
  assert.equal(clampCustomQuestions(null, 45), 30);
  assert.equal(clampCustomQuestions(10, 3), null);
  assert.equal(suggestCustomMinutes(5), 5);
  assert.equal(suggestCustomMinutes(20), 15);
  assert.equal(suggestCustomMinutes(100), 60);
  assert.equal(suggestCustomMinutes(200), 120);
  assert.ok(customMinuteOptions(20).includes(15));
  assert.deepEqual(customMinuteOptions(20), [...customMinuteOptions(20)].sort((a, b) => a - b));
});

async function multiSubjectDb(total = 120) {
  const db = await freshDb();
  const pack = syntheticPack({}, total);
  const subjects = ["Physics", "Chemistry", "Biology"];
  // 70 Physics, 30 Chemistry, rest Biology; every question is verified and single-choice (eligible).
  pack.questions.forEach((q, i) => { q.subject = i < 70 ? subjects[0] : i < 100 ? subjects[1] : subjects[2]; });
  assert.equal((await importQuestionPack(db, pack)).ok, true);
  return db;
}

test("grouped pool counts equal per-subject and combined filter counts (no per-subject queries needed)", async () => {
  const db = await multiSubjectDb();
  const { total, bySubject } = await countPoolBySubject(db, {});
  assert.equal(total, 120);
  assert.deepEqual(bySubject, { Physics: 70, Chemistry: 30, Biology: 20 });
  assert.equal(await countEligible(db, { subject: "Physics" }), 70);
  const two = withSubjectSelection({}, ["Physics", "Chemistry"]);
  assert.equal(await countEligible(db, two), combinedCount(["Physics", "Chemistry"], bySubject, total));
  assert.equal((await eligibleQuestionIds(db, two)).length, 100);
  // The selection itself never changes the counts (they describe the scope).
  assert.deepEqual((await countPoolBySubject(db, two)).bySubject, bySubject);
  assert.deepEqual((await countPoolBySubject(db, { subject: "Biology" })).total, 120);
  assert.equal((await countPoolBySubject(db, { institutionIds: ["inst-syn"] })).total, 120);
  assert.equal((await countPoolBySubject(db, { institutionIds: ["nope"] })).total, 0);
});

test("generic Standard Exam honours a multi-subject selection and records it in the session filter", async () => {
  const db = await multiSubjectDb();
  const tooSmall = await startStandardExam(db, withSubjectSelection({}, ["Physics"]));
  assert.equal(tooSmall.ok, false);
  const ok = await startStandardExam(db, withSubjectSelection({}, ["Physics", "Chemistry"]));
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  const loaded = await loadExam(db, ok.sessionId);
  assert.ok(loaded);
  assert.equal(loaded!.questions.length, 100);
  assert.ok(loaded!.questions.every((q) => q.subject === "Physics" || q.subject === "Chemistry"));
  assert.deepEqual(selectedSubjectsOf(loaded!.session.filter), ["Physics", "Chemistry"]);
});

test("Custom Practice on a paper without a usable rule honours a single or multiple subject selection", async () => {
  const db = await multiSubjectDb();
  const filter = withSubjectSelection({ paperId: "paper-syn-2025" }, ["Chemistry"]);
  const custom = { questions: 10, seconds: 600 };
  const single = await startStandardExam(db, filter, Date.now(), undefined, { custom });
  assert.equal(single.ok, true);
  if (!single.ok) return;
  const s = await loadExam(db, single.sessionId);
  assert.ok(s!.questions.every((q) => q.subject === "Chemistry"));
  assert.equal(s!.session.filter.customPractice, true);
  // Abandon-free restart is not possible while one exam is active; use a fresh DB for the multiple case.
  const db2 = await multiSubjectDb();
  const multi = await startStandardExam(db2, withSubjectSelection({ paperId: "paper-syn-2025" }, ["Chemistry", "Biology"]), Date.now(), undefined, { custom: { questions: 40, seconds: 1800 } });
  assert.equal(multi.ok, true);
  if (!multi.ok) return;
  const m = await loadExam(db2, multi.sessionId);
  assert.equal(m!.questions.length, 40);
  assert.ok(m!.questions.every((q) => q.subject === "Chemistry" || q.subject === "Biology"));
  // More questions than the selection can provide is refused, never silently padded from other subjects.
  const db3 = await multiSubjectDb();
  const tooMany = await startStandardExam(db3, withSubjectSelection({ paperId: "paper-syn-2025" }, ["Biology"]), Date.now(), undefined, { custom: { questions: 30, seconds: 1800 } });
  assert.equal(tooMany.ok, false);
  assert.equal((await loadQuestions(db3, [])).length, 0);
});
