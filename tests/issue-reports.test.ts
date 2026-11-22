import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, openMemoryDb, syntheticPack } from "./helpers.ts";
import { LATEST_VERSION, MIGRATIONS, migrate } from "../src/db/schema.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { loadQuestions } from "../src/repositories/content.ts";
import { ensureProfile, listBookmarkIds, saveDisplayName, toggleBookmark } from "../src/repositories/userData.ts";
import {
  IssueReportValidationError, countIssueReports, deleteIssueReport, getIssueReport, getIssueReportForQuestion, listIssueReports,
  markIssueReportsExported, reportedQuestionIds, saveIssueReport, updateIssueReport
} from "../src/repositories/issueReports.ts";
import {
  ISSUE_DETAILS_MAX, ISSUE_EXPORT_FORMAT, ISSUE_EXPORT_SCHEMA_VERSION, ISSUE_TYPES, buildIssueExport, buildQuestionSnapshot, exportStateOf,
  isIssueExportFileName, issueExportFileName, normalizeIssueTypes, parseQuestionSnapshot, questionPreview, serializeIssueExport, validateIssueReport
} from "../src/services/issueReports.ts";
import { startStandardExam, persistFlag, persistSelection, loadExam } from "../src/services/practiceService.ts";

const META = { appVersion: "0.1.11", platform: "android", language: "bn" as const, dbSchemaVersion: LATEST_VERSION };

async function seeded(count = 6) {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack({}, count))).ok, true);
  const questions = await loadQuestions(db, Array.from({ length: count }, (_, i) => `q-syn-${i + 1}`));
  assert.equal(questions.length, count);
  return { db, questions };
}

test("validation: category required, 'Other' alone needs a note, unknown ids and duplicates are dropped", () => {
  assert.deepEqual(validateIssueReport([], "x"), { ok: false, error: "no_type" });
  assert.deepEqual(validateIssueReport(["bogus"], "x"), { ok: false, error: "no_type" });
  assert.deepEqual(validateIssueReport(["other"], "   "), { ok: false, error: "other_needs_details" });
  assert.deepEqual(validateIssueReport(["other", "option"], ""), { ok: true, types: ["option", "other"], details: "" });
  assert.deepEqual(normalizeIssueTypes(["other", "answer_key", "answer_key", "nope", 3]), ["answer_key", "other"]);
  const long = validateIssueReport(["other"], "y".repeat(ISSUE_DETAILS_MAX + 50));
  assert.ok(long.ok && long.details.length === ISSUE_DETAILS_MAX);
  assert.equal(ISSUE_TYPES.length, 7);
});

test("create, read back, dedupe per question, update, delete", async () => {
  const { db, questions } = await seeded();
  const [q1, q2] = questions;
  const first = await saveIssueReport(db, { question: q1, issueTypes: ["answer_key"], details: " wrong key ", surface: "flash", now: 1000 });
  assert.equal(first.details, "wrong key");
  assert.deepEqual(first.issueTypes, ["answer_key"]);
  assert.equal(first.createdAt, 1000);
  assert.equal(first.exportedAt, null);
  assert.equal(first.surface, "flash");

  // Re-reporting the same canonical question edits the row: no duplicate, original snapshot/surface/created kept.
  const again = await saveIssueReport(db, { question: q1, issueTypes: ["option", "answer_key"], details: "also option B", surface: "exam", now: 2000 });
  assert.equal(again.id, first.id);
  assert.equal(await countIssueReports(db), 1);
  assert.deepEqual(again.issueTypes, ["option", "answer_key"]);
  assert.equal(again.createdAt, 1000);
  assert.equal(again.updatedAt, 2000);
  assert.equal(again.surface, "flash");

  await saveIssueReport(db, { question: q2, issueTypes: ["figure"], details: "", surface: "browse", now: 3000 });
  assert.deepEqual((await listIssueReports(db)).map((r) => r.questionId), [q2.id, q1.id], "newest update first");
  assert.deepEqual([...(await reportedQuestionIds(db))].sort(), [q1.id, q2.id].sort());
  assert.deepEqual([...(await reportedQuestionIds(db, [q1.id, "missing"]))], [q1.id]);
  assert.equal((await reportedQuestionIds(db, [])).size, 0);

  const edited = await updateIssueReport(db, first.id, ["explanation"], "explanation is unclear", 4000);
  assert.deepEqual(edited?.issueTypes, ["explanation"]);
  assert.equal(edited?.updatedAt, 4000);
  assert.equal(await updateIssueReport(db, "missing", ["option"], "", 5000), null);

  assert.equal(await deleteIssueReport(db, first.id), true);
  assert.equal(await deleteIssueReport(db, first.id), false);
  assert.equal(await getIssueReport(db, first.id), null);
  assert.equal(await getIssueReportForQuestion(db, q1.id), null);
  assert.equal(await countIssueReports(db), 1);
});

test("invalid input and unknown questions are rejected without writing", async () => {
  const { db, questions } = await seeded(2);
  await assert.rejects(saveIssueReport(db, { question: questions[0], issueTypes: [], details: "", surface: "flash" }), IssueReportValidationError);
  await assert.rejects(saveIssueReport(db, { question: questions[0], issueTypes: ["other"], details: "  ", surface: "flash" }), IssueReportValidationError);
  const ghost = { ...questions[0], id: "q-does-not-exist" };
  await assert.rejects(saveIssueReport(db, { question: ghost, issueTypes: ["option"], details: "", surface: "flash" }), "FK to questions is enforced");
  assert.equal(await countIssueReports(db), 0);
});

test("snapshot preserves the question as seen, even after the stored question changes", async () => {
  const { db, questions } = await seeded(2);
  const q = questions[0];
  const report = await saveIssueReport(db, { question: q, issueTypes: ["question_text"], details: "", surface: "browse", now: 10 });
  assert.deepEqual(report.snapshot, buildQuestionSnapshot(q));
  assert.equal(report.snapshot?.text, q.text);
  assert.equal(report.snapshot?.options.length, 4);
  assert.ok(report.snapshot?.options.some((o) => o.isCorrect));
  assert.ok((report.snapshot?.appearances.length ?? 0) > 0);
  await db.runAsync("UPDATE questions SET text = 'corrected later' WHERE id = ?", [q.id]);
  const [changed] = await loadQuestions(db, [q.id]);
  assert.equal(changed.text, "corrected later");
  await saveIssueReport(db, { question: changed, issueTypes: ["question_text", "option"], details: "again", surface: "result", now: 20 });
  const stored = (await getIssueReportForQuestion(db, q.id))!;
  assert.equal(stored.snapshot?.text, q.text, "the original snapshot is kept on later edits");
});

test("reports survive a content re-import and do not affect bookmarks", async () => {
  const { db, questions } = await seeded(3);
  await toggleBookmark(db, questions[0].id);
  await saveIssueReport(db, { question: questions[0], issueTypes: ["duplicate"], details: "", surface: "bookmarks" });
  await saveIssueReport(db, { question: questions[1], issueTypes: ["figure"], details: "", surface: "browse" });
  assert.equal((await importQuestionPack(db, syntheticPack({}, 3))).ok, true);
  assert.equal(await countIssueReports(db), 2);
  // Bookmark and report are independent: removing one never touches the other.
  assert.deepEqual(await listBookmarkIds(db), [questions[0].id]);
  await toggleBookmark(db, questions[0].id);
  assert.equal(await countIssueReports(db), 2);
  await deleteIssueReport(db, (await getIssueReportForQuestion(db, questions[0].id))!.id);
  assert.deepEqual(await listBookmarkIds(db), []);
  await toggleBookmark(db, questions[1].id);
  assert.deepEqual(await listBookmarkIds(db), [questions[1].id]);
});

test("reporting is independent of the Standard Exam 'Flag for review' (session_answers.flagged)", async () => {
  const { db } = await seeded(60);
  const started = await startStandardExam(db, { paperId: "paper-syn-2025" }, Date.now(), undefined, { custom: { questions: 10, seconds: 600 } });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const exam = (await loadExam(db, started.sessionId))!;
  const [q1, q2] = exam.questions;
  await persistFlag(db, started.sessionId, q1.id, true);
  await persistSelection(db, started.sessionId, q1.id, [q1.options[0].key]);
  const answerState = () => db.getAllAsync<{ question_id: string; flagged: number; selected_keys: string; outcome: string }>(
    "SELECT question_id, flagged, selected_keys, outcome FROM session_answers WHERE session_id = ? ORDER BY position", [started.sessionId]
  );
  const before = await answerState();
  assert.equal(before.filter((r) => r.flagged === 1).length, 1);

  // Reporting a flagged question, an unflagged one, then deleting both reports changes nothing in the exam.
  await saveIssueReport(db, { question: q1, issueTypes: ["answer_key"], details: "", surface: "exam" });
  await saveIssueReport(db, { question: q2, issueTypes: ["option"], details: "", surface: "exam" });
  await deleteIssueReport(db, (await getIssueReportForQuestion(db, q1.id))!.id);
  const after = await answerState();
  assert.deepEqual(after, before);
  assert.deepEqual((await loadExam(db, started.sessionId))!.flagged, [q1.id]);

  // And flagging/unflagging never creates or removes a report.
  await persistFlag(db, started.sessionId, q2.id, true);
  await persistFlag(db, started.sessionId, q2.id, false);
  assert.equal(await countIssueReports(db), 1);
  assert.equal((await getIssueReportForQuestion(db, q2.id))?.questionId, q2.id);
});

test("v12 -> v13 upgrade keeps profile, bookmarks, content and adds an empty reports table", async () => {
  const db = openMemoryDb();
  const v12 = MIGRATIONS.filter((m) => m.version <= 12);
  assert.equal(await migrate(db, v12), 12);
  assert.equal(
    (await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'question_issue_reports'"))!.n, 0
  );
  await ensureProfile(db);
  await saveDisplayName(db, "Existing User");
  assert.equal((await importQuestionPack(db, syntheticPack({}, 3))).ok, true);
  await toggleBookmark(db, "q-syn-1");
  const questionsBefore = (await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))!.n;

  assert.equal(await migrate(db), LATEST_VERSION);
  assert.ok(LATEST_VERSION >= 13);
  assert.equal((await db.getFirstAsync<{ display_name: string }>("SELECT display_name FROM user_profile WHERE id = 1"))!.display_name, "Existing User");
  assert.deepEqual(await listBookmarkIds(db), ["q-syn-1"]);
  assert.equal((await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions"))!.n, questionsBefore);
  assert.equal(await countIssueReports(db), 0);
  assert.equal(await migrate(db), LATEST_VERSION, "re-running is a no-op");
  const [q] = await loadQuestions(db, ["q-syn-1"]);
  assert.equal((await saveIssueReport(db, { question: q, issueTypes: ["option"], details: "", surface: "browse" })).questionId, "q-syn-1");
});

test("export state reflects sharing and later edits but never claims delivery", async () => {
  const { db, questions } = await seeded(2);
  const r = await saveIssueReport(db, { question: questions[0], issueTypes: ["option"], details: "", surface: "flash", now: 100 });
  assert.equal(exportStateOf(r), "never");
  await markIssueReportsExported(db, [r.id], 200);
  const shared = (await getIssueReport(db, r.id))!;
  assert.equal(shared.exportedAt, 200);
  assert.equal(exportStateOf(shared), "current");
  const edited = (await updateIssueReport(db, r.id, ["option", "figure"], "", 300))!;
  assert.equal(edited.exportedAt, 200, "editing keeps the previous share time");
  assert.equal(exportStateOf(edited), "edited");
  await markIssueReportsExported(db, [], 400);
});

test("JSON export: versioned, valid, complete snapshot and no personal or attempt data", async () => {
  const { db, questions } = await seeded(3);
  await saveDisplayName(db, "Secret Learner Name");
  await toggleBookmark(db, questions[2].id);
  const r1 = await saveIssueReport(db, { question: questions[0], issueTypes: ["answer_key", "explanation"], details: "Key should be C \u0995\u0996 \"quoted\"\nnew line", surface: "result", now: Date.UTC(2026, 10, 22, 9, 0, 0) });
  await saveIssueReport(db, { question: questions[1], issueTypes: ["figure"], details: "", surface: "browse", now: Date.UTC(2026, 10, 22, 10, 0, 0) });
  const reports = await listIssueReports(db);
  const now = Date.UTC(2026, 10, 22, 12, 30, 45, 123);
  const text = serializeIssueExport(buildIssueExport(reports, META, now));

  const doc = JSON.parse(text);
  assert.equal(doc.format, ISSUE_EXPORT_FORMAT);
  assert.equal(doc.schemaVersion, ISSUE_EXPORT_SCHEMA_VERSION);
  assert.equal(doc.exportedAt, "2026-11-22T12:30:45.123Z");
  assert.deepEqual(doc.app, META);
  assert.equal(doc.reportCount, 2);
  assert.equal(doc.reports.length, 2);
  const entry = doc.reports.find((x: { reportId: string }) => x.reportId === r1.id);
  assert.equal(entry.questionId, questions[0].id);
  assert.equal(entry.createdAt, "2026-11-22T09:00:00.000Z");
  assert.equal(entry.reportedFrom, "result");
  assert.deepEqual(entry.issueTypes, ["explanation", "answer_key"].sort((a, b) => ISSUE_TYPES.indexOf(a as never) - ISSUE_TYPES.indexOf(b as never)));
  assert.equal(entry.details, "Key should be C \u0995\u0996 \"quoted\"\nnew line");
  assert.equal(entry.questionSnapshot.text, questions[0].text);
  assert.deepEqual(entry.questionSnapshot.options.map((o: { key: string }) => o.key), questions[0].options.map((o) => o.key));
  assert.equal(entry.questionSnapshot.options.filter((o: { isCorrect: boolean }) => o.isCorrect).length, 1);
  assert.equal(entry.questionSnapshot.answerStatus, "verified");
  assert.ok(entry.questionSnapshot.appearances[0].paperId);
  assert.ok(entry.questionSnapshot.appearances[0].institutionCode);

  assert.ok(!text.includes("Secret Learner Name"), "profile name is never exported");
  for (const forbidden of ["display_name", "selected", "sessionId", "bookmark", "flagged", "deviceId"]) {
    assert.ok(!text.includes(forbidden), `export must not contain ${forbidden}`);
  }
  // A stored snapshot round-trips through the parser used by the detail screen.
  assert.deepEqual(parseQuestionSnapshot(JSON.stringify(entry.questionSnapshot))?.options.length, 4);
  assert.equal(parseQuestionSnapshot("not json"), null);
  assert.equal(parseQuestionSnapshot(JSON.stringify({ id: 1 })), null);
});

test("export file naming and previews", () => {
  const name = issueExportFileName(Date.UTC(2026, 10, 22, 15, 30, 45));
  assert.equal(name, "bd-admission-question-issues-20261122-153045.json");
  assert.ok(isIssueExportFileName(name));
  assert.ok(!isIssueExportFileName("content_seed.db"));
  assert.ok(!/[\\/:*?"<>|\s]/.test(name));
  assert.equal(questionPreview("  a \n  b  "), "a b");
  assert.equal(questionPreview("x".repeat(300), 20).length, 20);
  assert.ok(questionPreview("x".repeat(300), 20).endsWith("…"));
});
