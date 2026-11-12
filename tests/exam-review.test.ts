import test from "node:test";
import assert from "node:assert/strict";
import {
  activeWarning, examProgress, matchesReviewFilter, paletteState, resultHeadline, reviewStatus, subjectBreakdown, timeLevel, type ReviewItem
} from "../src/services/examReview.ts";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { startStandardExam, persistSelection, persistFlag, finalizeStandardExam, loadExam } from "../src/services/practiceService.ts";
import { practiceQuestionIds } from "../src/repositories/content.ts";
import { scopeFromParams, scopeParams } from "../src/features/navigation/links.ts";
import { getSession } from "../src/repositories/sessions.ts";

const sc = (id: string, key: string | null) => ({ id, correctKeys: key ? [key] : null, answerVerified: key !== null });

test("palette state and progress counts ignore stale flags", () => {
  assert.deepEqual([paletteState(false, false), paletteState(true, false), paletteState(false, true), paletteState(true, true)],
    ["unanswered", "answered", "flagged", "flaggedAnswered"]);
  const p = examProgress(["a", "b", "c", "d"], { a: ["A"], c: ["B"] }, new Set(["a", "b", "zzz"]));
  assert.deepEqual(p, { total: 4, answered: 2, unanswered: 2, flagged: 2, flaggedUnanswered: 1 });
});

test("time level and warning thresholds scale with the exam length", () => {
  assert.equal(timeLevel(3000, 3600), "normal");
  assert.equal(timeLevel(300, 3600), "low");
  assert.equal(timeLevel(60, 3600), "final");
  assert.equal(timeLevel(100, 600), "normal", "a 10-minute exam is not red until 90 s");
  assert.equal(timeLevel(90, 600), "low");
  assert.equal(timeLevel(30, 120), "low", "no 'final' level for exams shorter than 3 minutes");
  assert.equal(activeWarning(3000, 3600), null);
  assert.equal(activeWarning(600, 3600), 600);
  assert.equal(activeWarning(581, 3600), 600);
  assert.equal(activeWarning(580, 3600), null, "the 10-minute warning disappears after 20 s");
  assert.equal(activeWarning(300, 3600), 300);
  assert.equal(activeWarning(45, 3600), 60);
  assert.equal(activeWarning(0, 3600), null);
  assert.equal(activeWarning(600, 900), null, "600 s is more than half of a 15-minute exam");
  assert.equal(activeWarning(60, 900), 60);
});

test("subject breakdown counts correct, incorrect, unanswered and ungraded per subject", () => {
  const items: ReviewItem[] = [
    { id: "p1", subject: "Physics", scorable: sc("p1", "A") }, { id: "p2", subject: "Physics", scorable: sc("p2", "B") },
    { id: "c1", subject: "Chemistry", scorable: sc("c1", "A") }, { id: "c2", subject: "Chemistry", scorable: sc("c2", null) },
    { id: "x1", subject: null, scorable: sc("x1", "C") }
  ];
  const rows = subjectBreakdown(items, { p1: ["A"], p2: ["A"], c2: ["D"] });
  assert.deepEqual(rows.map((r) => r.subject), ["Physics", "Chemistry", null]);
  assert.deepEqual(rows[0], { subject: "Physics", total: 2, answered: 2, correct: 1, incorrect: 1, unanswered: 0, ungraded: 0, accuracyPercent: 50 });
  assert.deepEqual([rows[1].unanswered, rows[1].ungraded, rows[1].accuracyPercent], [1, 1, null]);
  assert.deepEqual([rows[2].total, rows[2].unanswered], [1, 1]);
});

test("review status and filters", () => {
  assert.equal(reviewStatus(sc("a", "A"), []), "unanswered");
  assert.equal(reviewStatus(sc("a", "A"), ["A"]), "correct");
  assert.equal(reviewStatus(sc("a", "A"), ["B"]), "incorrect");
  assert.equal(reviewStatus(sc("a", null), ["B"]), "ungraded");
  assert.equal(matchesReviewFilter("incorrect", false, "incorrect"), true);
  assert.equal(matchesReviewFilter("correct", true, "flagged"), true);
  assert.equal(matchesReviewFilter("correct", false, "unanswered"), false);
  assert.equal(matchesReviewFilter("ungraded", false, "all"), true);
});

test("retry route param is validated and round-trips", () => {
  assert.equal(scopeFromParams({ retry: "sabc123" }).retrySessionId, "sabc123");
  assert.equal(scopeFromParams({ retry: "a'; DROP TABLE x;--" }).retrySessionId, undefined);
  assert.equal(scopeParams({ retrySessionId: "sabc123" }).retry, "sabc123");
});

test("flag persistence, retry pool and finalization guard on a real exam", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack({}, 60))).ok, true);
  const started = await startStandardExam(db, { paperId: "paper-syn-2025" }, Date.now(), undefined, { custom: { questions: 10, seconds: 600 } });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const exam = (await loadExam(db, started.sessionId))!;
  assert.deepEqual(exam.flagged, []);
  const [q1, q2, q3] = exam.questions;
  assert.equal(await persistFlag(db, started.sessionId, q1.id, true), true);
  assert.equal(await persistFlag(db, started.sessionId, q2.id, true), true);
  assert.equal(await persistFlag(db, started.sessionId, q2.id, false), true);
  assert.deepEqual((await loadExam(db, started.sessionId))!.flagged, [q1.id], "flags survive a reload (crash recovery)");
  // Flagging never changes the stored answer.
  const wrong = q1.options.find((o) => !o.isCorrect)!.key;
  assert.equal(await persistSelection(db, started.sessionId, q1.id, [wrong]), true);
  assert.deepEqual((await loadExam(db, started.sessionId))!.selected[q1.id], [wrong]);
  await persistSelection(db, started.sessionId, q3.id, [q3.options.find((o) => o.isCorrect)!.key]);
  const result = await finalizeStandardExam(db, started.sessionId, "submitted");
  assert.ok(result);
  // A finished exam refuses further flag writes and keeps its flags.
  assert.equal(await persistFlag(db, started.sessionId, q1.id, false), false);
  assert.deepEqual((await loadExam(db, started.sessionId))!.flagged, [q1.id]);
  assert.equal((await getSession(db, started.sessionId))!.status, "completed");
  // Retry pool = incorrect + never-answered questions only (q3 was correct and is excluded).
  const retry = await practiceQuestionIds(db, { retrySessionId: started.sessionId });
  assert.ok(retry.includes(q1.id));
  assert.ok(!retry.includes(q3.id));
  assert.equal(retry.length, 9, "10 questions minus the one correct answer");
});

test("history headline parsing is defensive", () => {
  assert.deepEqual(resultHeadline(JSON.stringify({ score: 62.5, maxScore: 100, accuracyPercent: 71 }), "exam"), { score: 62.5, maxScore: 100, accuracyPercent: 71 });
  assert.deepEqual(resultHeadline(JSON.stringify({ score: null, maxScore: null, accuracyPercent: 40 }), "exam"), { score: null, maxScore: null, accuracyPercent: 40 });
  assert.deepEqual(resultHeadline(JSON.stringify({ score: 3, summary: { accuracyPercent: 60 } }), "flash"), { score: 3, maxScore: null, accuracyPercent: 60 });
  assert.deepEqual(resultHeadline("not json", "exam"), { score: null, maxScore: null, accuracyPercent: null });
  assert.deepEqual(resultHeadline(null, "flash"), { score: null, maxScore: null, accuracyPercent: null });
});
