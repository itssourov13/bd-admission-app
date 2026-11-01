import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, openMemoryDb, syntheticPack } from "./helpers.ts";
import { translations } from "../src/i18n/translations.ts";
import { hasImportedBatches, syncBundledPacks, type SyncProgress } from "../src/services/contentSync.ts";
import { runStartup, type StartupHooks } from "../src/services/startup.ts";
import {
  advanceProgress, INITIAL_STARTUP_PROGRESS, libraryWithin, overallFraction, percentOf,
  STAGE_RANGE, STARTUP_STAGES, stageIndex, type StartupProgress
} from "../src/services/startupProgress.ts";
import { getProfile, toggleBookmark, updateProfile, bookmarkedIds } from "../src/repositories/userData.ts";
import type { QuestionPack } from "../src/types/question-pack.ts";
import type { SqlDb } from "../src/db/types.ts";

/** Independent synthetic pack #n: every id is namespaced so many can live in one database. */
function pack(n: number, questions = 3): QuestionPack {
  const text = JSON.stringify(syntheticPack({}, questions))
    .replaceAll("batch-syn", `batch-syn-${n}`)
    .replaceAll("src-syn", `src-syn-${n}`)
    .replaceAll("inst-syn", `inst-syn-${n}`)
    .replaceAll("paper-syn-2025", `paper-syn-${n}-2025`)
    .replaceAll("rule-syn", `rule-syn-${n}`)
    .replaceAll("q-syn-", `q-syn-${n}-`)
    .replaceAll('"code":"SYN"', `"code":"SYN${n}"`);
  return JSON.parse(text) as QuestionPack;
}

const count = async (db: SqlDb, table: string) => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n;

function recordingHooks(loadPacks: () => Promise<readonly unknown[]>) {
  const patches: Partial<StartupProgress>[] = [];
  let merged: StartupProgress = INITIAL_STARTUP_PROGRESS;
  const timeline: StartupProgress[] = [];
  const hooks: StartupHooks = {
    report(patch) {
      patches.push(patch);
      merged = advanceProgress(merged, patch);
      timeline.push(merged);
    },
    async yieldToUi() { /* no UI in tests */ },
    loadPacks
  };
  return { hooks, patches, timeline };
}

test("startup progress: stage slices are contiguous, ordered and cover 0..1", () => {
  assert.deepEqual([...STARTUP_STAGES], ["database", "appData", "library", "finalizing", "ready"]);
  assert.equal(STAGE_RANGE.database[0], 0);
  assert.equal(STAGE_RANGE.ready[1], 1);
  for (let i = 1; i < STARTUP_STAGES.length; i++) {
    assert.equal(STAGE_RANGE[STARTUP_STAGES[i]][0], STAGE_RANGE[STARTUP_STAGES[i - 1]][1], `${STARTUP_STAGES[i]} starts where the previous stage ends`);
  }
  assert.ok(STAGE_RANGE.library[1] - STAGE_RANGE.library[0] > 0.7, "the import stage owns most of the bar");
});

test("startup progress: library progress is weighted by questions and falls back to pack counts", () => {
  assert.equal(libraryWithin(1, 10, 900, 1000), 0.9);
  assert.equal(libraryWithin(5, 10), 0.5);
  assert.equal(libraryWithin(0, 0), 0);
  assert.equal(libraryWithin(20, 10), 1);
  assert.equal(libraryWithin(Number.NaN, 10), 0);
  assert.equal(overallFraction("library", 0), STAGE_RANGE.library[0]);
  assert.equal(overallFraction("library", 1), STAGE_RANGE.library[1]);
  assert.equal(overallFraction("library", 2), STAGE_RANGE.library[1], "inner progress is clamped");
  assert.equal(percentOf(0.425), 43);
  assert.equal(percentOf(7), 100);
});

test("startup progress: the bar and stage never move backwards within an attempt; reset starts over", () => {
  let p = advanceProgress(INITIAL_STARTUP_PROGRESS, { stage: "library", fraction: 0.5 });
  p = advanceProgress(p, { stage: "appData", fraction: 0.2 });
  assert.equal(p.stage, "library");
  assert.equal(p.fraction, 0.5);
  p = advanceProgress(p, { packsDone: 3, packsTotal: 9 });
  assert.equal(p.packsDone, 3);
  assert.equal(stageIndex(p.stage), 2);
  const reset = advanceProgress(p, {}, { reset: true });
  assert.deepEqual(reset, INITIAL_STARTUP_PROGRESS);
});

test("content sync: reports real counters before work, after every pack, and swallows listener errors", async () => {
  const db = await freshDb();
  const packs = [pack(1, 2), { schemaVersion: 1, batch: { id: "bad", category: "varsity", sourceDocumentIds: [] }, questions: [1, 2, 3] }, pack(3, 4)];
  const events: SyncProgress[] = [];
  const outcomes = await syncBundledPacks(db, packs, Date.now(), (p) => { events.push(p); });
  assert.deepEqual(outcomes.map((o) => o.status), ["imported", "failed", "imported"]);
  assert.equal(events.length, 4);
  assert.deepEqual(events.map((e) => e.index), [0, 1, 2, 3]);
  assert.ok(events.every((e) => e.total === 3 && e.questionsTotal === 9));
  assert.deepEqual(events.map((e) => e.questionsDone), [0, 2, 5, 9]);
  assert.equal(events[0].status, null);
  assert.deepEqual(events.slice(1).map((e) => e.status), ["imported", "failed", "imported"]);

  const db2 = await freshDb();
  const noisy = await syncBundledPacks(db2, [pack(1)], Date.now(), () => { throw new Error("listener exploded"); });
  assert.deepEqual(noisy.map((o) => o.status), ["imported"]);
  assert.equal(await count(db2, "questions"), 3);
});

test("content sync: hasImportedBatches distinguishes an empty library from a populated one", async () => {
  const db = await freshDb();
  assert.equal(await hasImportedBatches(db), false);
  await syncBundledPacks(db, [pack(1)]);
  assert.equal(await hasImportedBatches(db), true);
});

test("startup waits for the setup screen layout before loading the bundled question packs", async () => {
  const db = openMemoryDb();
  const { hooks } = recordingHooks(async () => [pack(1)]);
  let release!: () => void;
  let waitStarted!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const waiting = new Promise<void>((resolve) => { waitStarted = resolve; });
  let loadStarted = false;
  hooks.waitForSetupScreen = async () => { waitStarted(); await gate; };
  hooks.loadPacks = async () => { loadStarted = true; return [pack(1)]; };

  const startup = runStartup(db, hooks);
  await waiting;
  assert.equal(loadStarted, false, "the large bundle must stay unevaluated before the setup screen is visible");
  release();
  const result = await startup;
  assert.equal(result.firstRun, true);
  assert.equal(loadStarted, true);
  assert.equal(await count(db, "questions"), 3);
});

test("startup: first launch reports ordered stages with real counters and imports everything", async () => {
  const db = openMemoryDb();
  const packs = [pack(1, 2), pack(2, 3), pack(3, 5)];
  const { hooks, patches, timeline } = recordingHooks(async () => packs);
  const result = await runStartup(db, hooks);

  assert.equal(result.firstRun, true);
  assert.deepEqual(result.importIssues, []);
  assert.equal(await count(db, "questions"), 10);
  assert.equal(await count(db, "question_batches"), 3);

  const stages = patches.filter((p) => p.stage).map((p) => p.stage);
  assert.deepEqual(stages, ["appData", "library", "finalizing"]);
  assert.equal(patches.find((p) => p.stage === "library")?.mode, "firstRun");
  const last = timeline.at(-1)!;
  assert.equal(last.stage, "finalizing");
  assert.equal(last.packsDone, 3);
  assert.equal(last.packsTotal, 3);
  assert.equal(last.fraction, STAGE_RANGE.finalizing[0]);
  for (let i = 1; i < timeline.length; i++) assert.ok(timeline[i].fraction >= timeline[i - 1].fraction, "fraction is monotonic");
  // Weighted by questions: after the 5-question third pack the library slice is complete.
  assert.ok(timeline.some((p) => p.stage === "library" && p.packsDone === 3 && p.fraction === STAGE_RANGE.library[1]));
});

test("startup: returning launch keeps profile, bookmarks and content, skips unchanged packs and reports returning mode", async () => {
  const db = openMemoryDb();
  const packs = [pack(1, 2), pack(2, 2)];
  await runStartup(db, recordingHooks(async () => packs).hooks);
  await updateProfile(db, { displayName: "Keep Me", flashSeconds: 45 });
  await toggleBookmark(db, "q-syn-1-1");

  const second = recordingHooks(async () => packs);
  const result = await runStartup(db, second.hooks);
  assert.equal(result.firstRun, false);
  assert.deepEqual(result.importIssues, []);
  assert.equal(second.patches.find((p) => p.stage === "library")?.mode, "returning");
  assert.equal((await getProfile(db)).displayName, "Keep Me");
  assert.equal((await getProfile(db)).flashSeconds, 45);
  assert.ok((await bookmarkedIds(db, ["q-syn-1-1"])).has("q-syn-1-1"));
  assert.equal(await count(db, "questions"), 4);
});

test("startup failure policy: bad packs are warnings; first-launch total failure or a throw is retryable; returning launches stay usable", async () => {
  // Mixed first launch: one bad pack is a warning, the app still opens.
  const mixed = openMemoryDb();
  const bad = { schemaVersion: 1, batch: { id: "bad", category: "varsity", sourceDocumentIds: [] } };
  const partial = await runStartup(mixed, recordingHooks(async () => [bad, pack(1)]).hooks);
  assert.equal(partial.importIssues.length, 1);
  assert.match(partial.importIssues[0], /^pack: /, "a pack that fails validation has no batch id yet");

  // First launch where nothing could be imported: surfaces as an error so the user can retry.
  const allBad = openMemoryDb();
  await assert.rejects(() => runStartup(allBad, recordingHooks(async () => [bad]).hooks), /None of the bundled question packs/);

  // First launch where loading throws: error, not a silently empty app.
  const loadFails = openMemoryDb();
  await assert.rejects(() => runStartup(loadFails, recordingHooks(async () => { throw new Error("bundle unavailable"); }).hooks), /bundle unavailable/);

  // Retry after a transient failure succeeds and resumes (the first attempt's data is kept).
  const retry = openMemoryDb();
  await assert.rejects(() => runStartup(retry, recordingHooks(async () => { throw new Error("transient"); }).hooks));
  const ok = await runStartup(retry, recordingHooks(async () => [pack(1)]).hooks);
  assert.equal(ok.firstRun, true, "nothing was imported before the failure, so the retry is still a first launch");
  assert.equal(await count(retry, "questions"), 3);

  // Returning launch: a failing sync keeps the existing library and only warns.
  const returning = openMemoryDb();
  await runStartup(returning, recordingHooks(async () => [pack(1)]).hooks);
  const survived = await runStartup(returning, recordingHooks(async () => { throw new Error("bundle unavailable"); }).hooks);
  assert.equal(survived.firstRun, false);
  assert.deepEqual(survived.importIssues, ["bundle unavailable"]);
  assert.equal(await count(returning, "questions"), 3);
});

test("setup translations: every stage, detail and chrome string exists in Bangla and English", () => {
  const keys = [
    ...STARTUP_STAGES.map((s) => `setup.stage.${s}`),
    "setup.detail.database", "setup.detail.appData", "setup.detail.libraryLoading", "setup.detail.library", "setup.detail.finalizing", "setup.detail.ready",
    "setup.note.neutral", "setup.note.firstRun", "setup.note.returning",
    "setup.title", "setup.titleReady", "setup.step", "setup.percent", "setup.a11y.progress",
    "setup.error.title", "setup.error.body", "setup.error.failedAt", "setup.error.hint"
  ];
  for (const key of keys) {
    const entry = (translations as Record<string, { bn: string; en: string }>)[key];
    assert.ok(entry, `${key} is missing`);
    assert.ok(entry.bn.trim() && entry.en.trim(), `${key} needs both languages`);
  }
  assert.match(translations["setup.detail.library"].en, /\{done\}.*\{total\}/);
  assert.match(translations["setup.step"].bn, /\{n\}.*\{total\}/);
});
