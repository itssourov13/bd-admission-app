import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { eligibleQuestionIds } from "../src/repositories/content.ts";
import { getSessionAnswers } from "../src/repositories/sessions.ts";
import { finalizeStandardExam, loadExam, persistSelection, startStandardExam } from "../src/services/practiceService.ts";
import { FlashController } from "../src/services/flashController.ts";
import { mulberry32 } from "../src/services/flash.ts";

/** 5 verified questions: two 2-answer, one 3-answer multiple choice, two single choice. */
async function mixedDb() {
  const db = await freshDb();
  const pack = syntheticPack({}, 5);
  pack.questions[0]!.type = "multiple_choice"; pack.questions[0]!.correctOptionIds = ["a", "c"];
  pack.questions[1]!.type = "multiple_choice"; pack.questions[1]!.correctOptionIds = ["b", "c", "d"];
  pack.questions[2]!.type = "multiple_choice"; pack.questions[2]!.correctOptionIds = ["a", "d"];
  assert.equal((await importQuestionPack(db, pack)).ok, true);
  return db;
}

test("eligibility admits verified multiple-choice questions whose correct-option count matches", async () => {
  const db = await mixedDb();
  assert.equal((await eligibleQuestionIds(db, {})).length, 5);
  // A verified multiple_choice row with a single correct option is structurally inconsistent and stays out of scored pools.
  await db.runAsync("UPDATE question_options SET is_correct = 0 WHERE question_id = 'q-syn-1' AND option_key = 'c'");
  assert.deepEqual((await eligibleQuestionIds(db, {})).sort(), ["q-syn-2", "q-syn-3", "q-syn-4", "q-syn-5"]);
  // No correct option at all (no_correct_option disposition) is never scorable.
  await db.runAsync("UPDATE question_options SET is_correct = 0 WHERE question_id = 'q-syn-4'");
  assert.deepEqual((await eligibleQuestionIds(db, {})).sort(), ["q-syn-2", "q-syn-3", "q-syn-5"]);
});

test("flash: multiple-choice answers are validated, exact-set scored and persisted as arrays", async () => {
  const db = await mixedDb();
  let now = 1_000;
  const c = (await FlashController.start(db, {}, 30, { now, rng: mulberry32(3), clock: () => now }))!;
  const expected: { id: string; outcome: string; keys: string[] }[] = [];
  for (let i = 0; i < 5; i++) {
    const q = c.question!;
    const correct = q.options.filter((o) => o.isCorrect).map((o) => o.key);
    const pos = c.state.position;
    assert.equal((await c.answer(pos, [])).applied, false, "empty submission is rejected");
    assert.equal((await c.answer(pos, ["zz"])).applied, false, "unknown key is rejected");
    assert.equal((await c.answer(pos, [correct[0]!, correct[0]!])).applied, false, "duplicate keys are rejected");
    if (q.type === "single_choice") assert.equal((await c.answer(pos, ["a", "b"])).applied, false, "single choice takes one key");
    // Even positions: exact set submitted in reverse tap order; odd positions: one correct key only (partial).
    const submit = i % 2 === 0 ? [...correct].reverse() : q.type === "multiple_choice" ? [correct[0]!] : correct;
    now += 1000;
    const r = await c.answer(pos, submit, now);
    assert.equal(r.applied, true);
    const exact = submit.length === correct.length;
    expected.push({ id: q.id, outcome: exact ? "correct" : "incorrect", keys: q.options.map((o) => o.key).filter((k) => submit.includes(k)) });
    assert.equal(r.feedback!.record.outcome, exact ? "correct" : "incorrect");
    await c.next();
  }
  await c.finish(now);
  const rows = await getSessionAnswers(db, c.sessionId);
  for (const e of expected) {
    const row = rows.find((r) => r.questionId === e.id)!;
    assert.equal(row.outcome, e.outcome);
    assert.deepEqual(row.selectedKeys, e.keys);
  }
});

test("exam: multi-select answers persist, restore after restart, clear, and finalize with exact-set scoring", async () => {
  const db = await mixedDb();
  const t0 = 5_000_000;
  const started = await startStandardExam(db, { institutionId: "inst-syn" }, t0, mulberry32(1), { custom: { questions: 5, seconds: 600 } });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const loaded = (await loadExam(db, started.sessionId))!;
  const byId = new Map(loaded.questions.map((q) => [q.id, q]));
  const correctOf = (id: string) => byId.get(id)!.options.filter((o) => o.isCorrect).map((o) => o.key);
  const [exact, partial, extra, cleared, untouched] = loaded.questions;
  const exactKeys = correctOf(exact!.id);
  assert.equal(await persistSelection(db, started.sessionId, exact!.id, exactKeys, t0 + 1), true);
  assert.equal(await persistSelection(db, started.sessionId, partial!.id, correctOf(partial!.id).slice(0, 1), t0 + 2), true);
  const wrongKey = ["a", "b", "c", "d"].find((k) => !correctOf(extra!.id).includes(k))!;
  assert.equal(await persistSelection(db, started.sessionId, extra!.id, [...correctOf(extra!.id), wrongKey], t0 + 3), true);
  assert.equal(await persistSelection(db, started.sessionId, cleared!.id, correctOf(cleared!.id), t0 + 4), true);
  assert.equal(await persistSelection(db, started.sessionId, cleared!.id, [], t0 + 5), true);

  // Restart: selections come back from storage as arrays.
  const restored = (await loadExam(db, started.sessionId))!;
  assert.deepEqual(restored.selected[exact!.id], exactKeys);
  assert.equal(restored.selected[partial!.id]!.length, 1);
  assert.equal(restored.selected[extra!.id]!.length, correctOf(extra!.id).length + 1);
  assert.equal(restored.selected[cleared!.id]?.length ?? 0, 0);

  const result = (await finalizeStandardExam(db, started.sessionId, "submitted", t0 + 10))!;
  assert.equal(result.correct, 1, "only the exact set is correct");
  assert.equal(result.incorrect, 2, "partial and extra-selection answers are incorrect");
  assert.equal(result.unanswered, 2);
});
