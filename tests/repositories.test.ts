import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, openMemoryDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { migrate, MIGRATIONS, LATEST_VERSION } from "../src/db/schema.ts";
import {
  contentTotals, countEligible, eligibleQuestionIds, listBatches, listInstitutions, listPapers, loadQuestions, resolveRuleForQuestions
} from "../src/repositories/content.ts";
import { getSession, getSessionAnswers, listHistory, closeStaleFlash, getActiveExam, abandonSession } from "../src/repositories/sessions.ts";
import { activitySummary, bookmarkedIds, getProfile, toggleBookmark, updateProfile } from "../src/repositories/userData.ts";
import { finalizeOverdueExam, finalizeStandardExam, loadExam, persistSelection, startStandardExam, type ExamResult } from "../src/services/practiceService.ts";
import { FlashController } from "../src/services/flashController.ts";
import { mulberry32 } from "../src/services/flash.ts";

type Db = Awaited<ReturnType<typeof freshDb>>;
const count = async (db: Db, table: string) => Number((await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n);

async function seeded(n = 3): Promise<Db> {
  const db = await freshDb();
  const report = await importQuestionPack(db, syntheticPack({}, n));
  assert.equal(report.ok, true);
  return db;
}

test("adapter: concurrent transactions are serialized and outer statements wait", async () => {
  const db = await freshDb();
  const order: string[] = [];
  const slow = db.withTransactionAsync(async (tx) => {
    order.push("a-start");
    await tx.runAsync("INSERT INTO institutions (id, code, name) VALUES ('i1','C1','N1')");
    await new Promise((r) => setTimeout(r, 20));
    order.push("a-end");
  });
  const second = db.withTransactionAsync(async (tx) => {
    order.push("b-start");
    await tx.runAsync("INSERT INTO institutions (id, code, name) VALUES ('i2','C2','N2')");
    order.push("b-end");
  });
  const outer = db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM institutions").then((r) => { order.push("read"); return r; });
  await Promise.all([slow, second, outer]);
  assert.deepEqual(order.slice(0, 2), ["a-start", "a-end"]);
  assert.equal(order.includes("read"), true);
  assert.equal(await count(db, "institutions"), 2);
});

test("adapter: nested transaction is rejected and the outer one rolls back", async () => {
  const db = await freshDb();
  await assert.rejects(db.withTransactionAsync(async (tx) => {
    await tx.runAsync("INSERT INTO institutions (id, code, name) VALUES ('i1','C1','N1')");
    await tx.withTransactionAsync(async () => undefined);
  }), /Nested/);
  assert.equal(await count(db, "institutions"), 0);
});

test("migration: failure rolls back its own changes and keeps the previous version", async () => {
  const db = openMemoryDb();
  await migrate(db);
  const bad = [...MIGRATIONS, { version: LATEST_VERSION + 1, name: "bad", sql: "CREATE TABLE half_done (id INTEGER); INSERT INTO missing_table VALUES (1);" }];
  await assert.rejects(migrate(db, bad));
  const v = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  assert.equal(v!.user_version, LATEST_VERSION);
  const t = await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'half_done'");
  assert.equal(t, null);
});

test("migration: refuses a database newer than the app", async () => {
  const db = openMemoryDb();
  await db.execAsync(`PRAGMA user_version = ${LATEST_VERSION + 5}`);
  await assert.rejects(migrate(db), /newer than this app/);
});

test("empty database: queries return empty results, not errors", async () => {
  const db = await freshDb();
  assert.deepEqual(await contentTotals(db), { questions: 0, eligible: 0, institutions: 0 });
  assert.deepEqual(await listInstitutions(db, "varsity"), []);
  assert.deepEqual(await listPapers(db, { category: "medical" }), []);
  assert.deepEqual(await listBatches(db), []);
  assert.equal(await FlashController.start(db, {}, 30), null);
  const exam = await startStandardExam(db, {});
  assert.equal(exam.ok, false);
  assert.equal(await count(db, "practice_sessions"), 0);
  const profile = await getProfile(db);
  assert.deepEqual([profile.language, profile.flashSeconds, profile.displayName], ["bn", 30, ""]);
  assert.deepEqual(await activitySummary(db), { sessions: 0, answered: 0, correct: 0, accuracyPercent: 0, bookmarks: 0 });
});

test("content: institutions/papers/questions are data-driven; ineligible questions are excluded from the pool", async () => {
  const db = await freshDb();
  const pack = syntheticPack({}, 4);
  pack.questions[2].answerVerificationStatus = "unverified";
  pack.questions[3].type = "multiple_choice";
  pack.questions[3].correctOptionIds = ["a", "b"];
  assert.equal((await importQuestionPack(db, pack)).ok, true);
  assert.deepEqual((await eligibleQuestionIds(db, { category: "varsity" })).sort(), ["q-syn-1", "q-syn-2"]);
  assert.equal(await countEligible(db, { institutionId: "inst-syn" }), 2);
  assert.equal(await countEligible(db, { category: "medical" }), 0);
  const [inst] = await listInstitutions(db, "varsity");
  assert.deepEqual([inst.code, inst.paperCount, inst.questionCount, inst.eligibleCount], ["SYN", 1, 4, 2]);
  const [paper] = await listPapers(db, { institutionId: "inst-syn" });
  assert.deepEqual([paper.year, paper.unit, paper.questionCount, paper.eligibleCount, paper.ruleStatus], [2025, "A", 4, 2, "illustrative"]);
  const [q] = await loadQuestions(db, ["q-syn-1"]);
  assert.equal(q.options.length, 4);
  assert.equal(q.options.find((o) => o.isCorrect)!.key, "b");
  assert.deepEqual([q.appearances[0].institutionCode, q.appearances[0].year, q.appearances[0].questionNumber, q.appearances[0].pageNumber, q.appearances[0].sourceFilename], ["SYN", 2025, 1, 1, "synthetic.json"]);
  assert.equal((await listBatches(db))[0].questionCount, 4);
});

test("rule resolution keeps the verification status and never blends mixed rules", async () => {
  const db = await freshDb();
  const pack = syntheticPack({}, 2);
  pack.papers.push({ id: "paper-syn-2024", institutionId: "inst-syn", category: "varsity", year: 2024 });
  pack.examRules.push({ id: "rule-2024", paperId: "paper-syn-2024", correctMarks: 1, incorrectPenalty: 0.5, unansweredMarks: 0, verificationStatus: "verified" });
  pack.questions[1].appearances = [{ paperId: "paper-syn-2024", questionNumber: 1, pageNumber: 1, sourceDocumentId: "src-syn" }];
  await importQuestionPack(db, pack);
  const single = await resolveRuleForQuestions(db, ["q-syn-1"], { paperId: "paper-syn-2025" });
  assert.deepEqual([single.status, single.incorrectPenalty], ["illustrative", 0.25]);
  const verified = await resolveRuleForQuestions(db, ["q-syn-2"], { paperId: "paper-syn-2024" });
  assert.deepEqual([verified.status, verified.incorrectPenalty], ["verified", 0.5]);
  const mixed = await resolveRuleForQuestions(db, ["q-syn-1", "q-syn-2"], {});
  assert.equal(mixed.status, "unconfigured");
  assert.equal(mixed.incorrectPenalty, 0);
});

test("standard exam: refuses to start below 100 eligible questions and creates nothing", async () => {
  const db = await seeded(99);
  const r = await startStandardExam(db, {});
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual([r.eligibility.available, r.eligibility.shortfall], [99, 1]);
  assert.equal(await count(db, "practice_sessions"), 0);
});

test("standard exam: exactly 100 questions, exactly-once finalization, late input refused, fractional negative marking", async () => {
  const db = await seeded(120);
  const t0 = 1_000_000;
  const started = await startStandardExam(db, {}, t0, mulberry32(7));
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const loaded = (await loadExam(db, started.sessionId))!;
  assert.equal(loaded.questions.length, 100);
  assert.equal(new Set(loaded.questions.map((q) => q.id)).size, 100);
  assert.equal(loaded.session.deadlineAt, t0 + 3600_000);
  assert.equal(loaded.session.ruleStatus, "illustrative");

  const [q1, q2, q3] = loaded.questions;
  assert.equal(await persistSelection(db, started.sessionId, q1.id, ["b"], t0 + 1000), true);   // correct
  assert.equal(await persistSelection(db, started.sessionId, q2.id, ["a"], t0 + 2000), true);   // wrong
  assert.equal(await persistSelection(db, started.sessionId, q3.id, ["a"], t0 + 3000), true);
  assert.equal(await persistSelection(db, started.sessionId, q3.id, ["b"], t0 + 4000), true);   // revised to correct
  assert.equal(await persistSelection(db, started.sessionId, q2.id, ["c"], t0 + 3600_000), false); // at the deadline: refused

  const [first, second] = await Promise.all([
    finalizeStandardExam(db, started.sessionId, "submitted", t0 + 10_000),
    finalizeStandardExam(db, started.sessionId, "time_expired", t0 + 10_000)
  ]);
  assert.equal([first, second].filter(Boolean).length, 1);
  const result = (first ?? second) as ExamResult;
  assert.deepEqual([result.correct, result.incorrect, result.unanswered, result.answered], [2, 1, 97, 3]);
  assert.equal(result.score, 1.75); // 2 x 1 - 1 x 0.25
  assert.equal(result.ruleStatus, "illustrative");
  assert.equal(result.isOfficialRule, false);
  assert.equal(await finalizeStandardExam(db, started.sessionId, "time_expired", t0 + 20_000), null);
  const stored = (await getSession(db, started.sessionId))!;
  assert.equal(stored.status, "completed");
  assert.equal(JSON.parse(stored.resultJson!).score, 1.75);
  assert.equal(await persistSelection(db, started.sessionId, q1.id, ["a"], t0 + 30_000), false);
  const answers = await getSessionAnswers(db, started.sessionId);
  assert.equal(answers.length, 100);
  assert.equal(answers.filter((a) => a.outcome === "correct").length, 2);
});

test("standard exam: overdue active exam is finalized once with the pre-deadline answers", async () => {
  const db = await seeded(100);
  const t0 = 5_000_000;
  const started = await startStandardExam(db, {}, t0, mulberry32(3));
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const loaded = (await loadExam(db, started.sessionId))!;
  await persistSelection(db, started.sessionId, loaded.questions[0].id, ["b"], t0 + 5000);
  assert.equal(await finalizeOverdueExam(db, t0 + 1000), null);
  assert.equal((await getActiveExam(db))?.id, started.sessionId);
  assert.equal(await finalizeOverdueExam(db, t0 + 3600_000 + 60_000), started.sessionId);
  assert.equal(await finalizeOverdueExam(db, t0 + 3600_000 + 120_000), null);
  const s = (await getSession(db, started.sessionId))!;
  assert.deepEqual([s.status, s.finishReason], ["completed", "time_expired"]);
  const result = JSON.parse(s.resultJson!) as ExamResult;
  assert.deepEqual([result.correct, result.elapsedSeconds], [1, 3600]);
});

test("flash: no question repeats until the pool is exhausted, then it reshuffles", async () => {
  const db = await seeded(5);
  let now = 10_000;
  const c = (await FlashController.start(db, {}, 30, { now, rng: mulberry32(11), clock: () => now }))!;
  assert.equal(c.poolSize, 5);
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) {
    seen.push(c.question!.id);
    now += 1000;
    await c.skip(c.state.position, now);
  }
  for (let cycle = 0; cycle < 2; cycle++) assert.equal(new Set(seen.slice(cycle * 5, cycle * 5 + 5)).size, 5);
  assert.notEqual(seen[4], seen[5]);
  const result = await c.finish(now);
  assert.deepEqual([result.summary.seen, result.summary.skipped, result.summary.cyclesCompleted], [12, 12, 2]);
});

test("flash: a tap and a timeout racing each other score the question exactly once", async () => {
  const db = await seeded(4);
  let now = 20_000;
  const c = (await FlashController.start(db, {}, 30, { now, rng: mulberry32(5), clock: () => now }))!;
  const position = c.state.position;
  const q = c.question!;
  now += 30_000; // deadline reached
  const [tap, timeout, tap2] = await Promise.all([c.answer(position, ["b"], now), c.timeout(position, now), c.answer(position, ["b"], now)]);
  assert.equal([tap, timeout, tap2].filter((r) => r.applied).length, 1);
  await c.next();
  const result = await c.finish(now + 1000);
  assert.equal(result.summary.seen, 1);
  assert.equal(result.summary.timedOut + result.summary.answered, 1);
  const rows = await getSessionAnswers(db, c.sessionId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].questionId, q.id);
});

test("flash: answers are scored against the verified key, the timer is re-based after feedback, results persist", async () => {
  const db = await seeded(3);
  let now = 100_000;
  const c = (await FlashController.start(db, {}, 20, { now, rng: mulberry32(2), clock: () => now }))!;
  assert.equal(c.rule.status, "illustrative");
  now += 4000;
  const right = await c.answer(c.state.position, ["b"], now);
  assert.equal(right.feedback!.record.outcome, "correct");
  assert.deepEqual(right.feedback!.correctKeys, ["b"]);
  now += 60_000; // user reads feedback for a minute: no timeout must be charged
  assert.equal((await c.timeout(c.state.position, now)).applied, false);
  await c.next();
  assert.equal(c.remainingSeconds(now), 20);
  now += 5000;
  assert.equal(c.remainingSeconds(now), 15);
  const wrong = await c.answer(c.state.position, ["a"], now);
  assert.equal(wrong.feedback!.record.outcome, "incorrect");
  await c.next();
  const result = await c.finish(now + 1000);
  assert.deepEqual([result.summary.answered, result.summary.correct, result.summary.incorrect, result.summary.accuracyPercent], [2, 1, 1, 50]);
  assert.equal(result.score, 0.75);
  assert.equal(result.ruleStatus, "illustrative");
  assert.equal(c.persistFailures, 0);
  assert.equal((await c.finish(now + 9999)), result);
  const [item] = await listHistory(db, 10, "flash");
  assert.deepEqual([item.id, item.status, item.total, item.correct, item.incorrect], [c.sessionId, "completed", 2, 1, 1]);
});

test("flash: zero-answer session reports zeros and no score is invented without a rule", async () => {
  const db = await freshDb();
  const pack = syntheticPack({}, 2);
  pack.examRules = [];
  await importQuestionPack(db, pack);
  const c = (await FlashController.start(db, {}, 30, { now: 1, clock: () => 1 }))!;
  assert.equal(c.rule.status, "unconfigured");
  const result = await c.finish(1000);
  assert.deepEqual([result.summary.seen, result.summary.accuracyPercent, result.score, result.advice], [0, 0, null, ["advice.noAnswers"]]);
});

test("stale flash sessions are closed; their recorded answers stay in history", async () => {
  const db = await seeded(3);
  let now = 1;
  const c = (await FlashController.start(db, {}, 30, { now, clock: () => now }))!;
  now = 2;
  await c.skip(c.state.position, now);
  await c.finish(now); // finish flushes persistence; simulate a force close for a second session
  const d = (await FlashController.start(db, {}, 30, { now: 5, clock: () => 5 }))!;
  await d.skip(d.state.position, 6);
  await closeStaleFlash(db, 10);
  const hist = await listHistory(db, 10);
  assert.equal(hist.length, 2);
  assert.equal((await getSession(db, d.sessionId))!.status, "abandoned");
});

test("bookmarks, profile and activity summary persist and survive re-imports", async () => {
  const db = await seeded(3);
  assert.equal(await toggleBookmark(db, "q-syn-1"), true);
  assert.deepEqual([...(await bookmarkedIds(db))], ["q-syn-1"]);
  await updateProfile(db, { displayName: "  Rahim  ", language: "en", flashSeconds: 9999, targetCategory: "medical" });
  const p = await getProfile(db);
  assert.deepEqual([p.displayName, p.language, p.flashSeconds, p.targetCategory], ["Rahim", "en", 600, "medical"]);
  await importQuestionPack(db, syntheticPack({}, 3));
  assert.equal((await bookmarkedIds(db)).size, 1);
  assert.equal(await toggleBookmark(db, "q-syn-1"), false);
  assert.equal((await bookmarkedIds(db)).size, 0);
});

test("discarded exam can be abandoned and a new one started", async () => {
  const db = await seeded(100);
  const a = await startStandardExam(db, {}, 1);
  assert.equal(a.ok, true);
  if (!a.ok) return;
  await abandonSession(db, a.sessionId, 2);
  assert.equal(await getActiveExam(db), null);
  assert.equal((await startStandardExam(db, {}, 3)).ok, true);
});
