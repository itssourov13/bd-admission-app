import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { freshDb, openDbAt, openMemoryDb, syntheticPack } from "./helpers.ts";
import { buildSeedDatabase } from "../src/services/seedBuilder.ts";
import { groupPending, syncFromSeed, type SeedHandle } from "../src/services/seedSync.ts";
import { hasImportedBatches, syncBundledPacks, type SyncProgress } from "../src/services/contentSync.ts";
import { runStartup, type StartupHooks } from "../src/services/startup.ts";
import { createStartupMetrics } from "../src/services/perf.ts";
import { createStartupCoordinator, type AppLifecycle } from "../src/services/startupCoordinator.ts";
import { advanceProgress, INITIAL_STARTUP_PROGRESS, stageIndex, type StartupProgress } from "../src/services/startupProgress.ts";
import { LATEST_VERSION, MIGRATIONS, migrate } from "../src/db/schema.ts";
import { bookmarkedIds, getProfile, toggleBookmark, updateProfile } from "../src/repositories/userData.ts";
import { createSession, getSessionAnswers, recordFlashResult } from "../src/repositories/sessions.ts";
import { SEED_FORMAT, type ContentManifest } from "../src/content/seedFormat.ts";
import type { QuestionPack } from "../src/types/question-pack.ts";
import type { SqlDb } from "../src/db/types.ts";

/** Independent synthetic pack #n: every id is namespaced so many packs can live in one database. */
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
const packs = (count: number): QuestionPack[] => Array.from({ length: count }, (_, i) => pack(i + 1));

const count = async (db: SqlDb, table: string): Promise<number> => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n;

interface Seed { manifest: ContentManifest; file: string; calls: { opened: number; released: number }; openSeed: () => Promise<SeedHandle> }

/** Builds a real seed database file with the production builder and returns an opener that counts materializations. */
async function buildSeed(dir: string, name: string, source: readonly unknown[]): Promise<Seed> {
  const file = join(dir, name);
  const seedDb = openDbAt(file);
  const manifest = await buildSeedDatabase(seedDb, source);
  seedDb.raw.close();
  const calls = { opened: 0, released: 0 };
  return {
    manifest, file, calls,
    openSeed: async () => { calls.opened++; return { path: file, release: async () => { calls.released++; } }; }
  };
}

function withTempDir(fn: (dir: string) => Promise<void>): () => Promise<void> {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), "bd-seed-test-"));
    try { await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
  };
}

function seedHooks(seed: Seed, extra: Partial<StartupHooks> = {}) {
  const timeline: StartupProgress[] = [];
  let merged: StartupProgress = INITIAL_STARTUP_PROGRESS;
  const hooks: StartupHooks = {
    report(patch) { merged = advanceProgress(merged, patch); timeline.push(merged); },
    async yieldToUi() { /* no UI in tests */ },
    syncContent: (db, onProgress, now) => syncFromSeed(db, { manifest: seed.manifest, openSeed: seed.openSeed, now, onProgress, metrics: extra.metrics }),
    ...extra
  };
  return { hooks, timeline };
}

/** Normalised content dump, excluding timestamps and counters that legitimately differ between import paths. */
async function dumpContent(db: SqlDb) {
  const all = (sql: string) => db.getAllAsync<Record<string, unknown>>(sql);
  return {
    batches: await all("SELECT id, category, description, schema_version, pack_signature FROM question_batches ORDER BY id"),
    institutions: await all("SELECT * FROM institutions ORDER BY id"),
    papers: await all("SELECT * FROM exam_papers ORDER BY id"),
    rules: await all("SELECT * FROM exam_rules ORDER BY id"),
    sources: await all("SELECT * FROM source_documents ORDER BY id"),
    questions: await all("SELECT * FROM questions ORDER BY id"),
    options: await all("SELECT * FROM question_options ORDER BY question_id, option_key"),
    questionSources: await all("SELECT * FROM question_sources ORDER BY question_id"),
    appearances: await all("SELECT question_id, paper_id, question_number, page_number, source_document_id FROM question_appearances ORDER BY question_id, paper_id, question_number")
  };
}

test("first install: the seed path imports the whole library and reports ordered, monotonic progress", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(5));
  const db = openMemoryDb();
  const { hooks, timeline } = seedHooks(seed);
  const result = await runStartup(db, hooks);

  assert.equal(result.firstRun, true);
  assert.equal(result.libraryComplete, true);
  assert.deepEqual(result.importIssues, []);
  assert.equal(await count(db, "question_batches"), 5);
  assert.equal(await count(db, "questions"), 15);
  assert.equal(await count(db, "question_options"), 60);
  assert.equal(await hasImportedBatches(db), true);
  assert.equal(seed.calls.opened, 1);
  assert.equal(seed.calls.released, 1, "the temporary seed copy is always released");

  for (let i = 1; i < timeline.length; i++) {
    assert.ok(timeline[i].fraction >= timeline[i - 1].fraction, "the bar never moves backwards");
    assert.ok(stageIndex(timeline[i].stage) >= stageIndex(timeline[i - 1].stage), "stages never move backwards");
  }
  const last = timeline[timeline.length - 1];
  assert.equal(last.stage, "finalizing");
  assert.equal(last.packsDone, 5);
  assert.equal(last.packsTotal, 5);
  assert.ok(timeline.some((p) => p.mode === "firstRun"));
}));

test("seed import produces exactly the same content as the legacy per-row importer", withTempDir(async (dir) => {
  const source = packs(6);
  const seed = await buildSeed(dir, "seed.db", source);
  const viaSeed = await freshDb();
  await syncFromSeed(viaSeed, { manifest: seed.manifest, openSeed: seed.openSeed });
  const viaLegacy = await freshDb();
  await syncBundledPacks(viaLegacy, source);

  assert.deepEqual(await dumpContent(viaSeed), await dumpContent(viaLegacy));
}));

test("returning launch: unchanged packs are skipped and the seed asset is never materialized", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(4));
  const db = openMemoryDb();
  await runStartup(db, seedHooks(seed).hooks);
  const batchRows = await db.getAllAsync("SELECT id, imported_at, updated_at, import_count FROM question_batches ORDER BY id");
  assert.equal(seed.calls.opened, 1);

  const metrics = createStartupMetrics();
  const second = seedHooks(seed, { metrics });
  const result = await runStartup(db, second.hooks);
  assert.equal(result.firstRun, false);
  assert.equal(result.libraryComplete, true);
  assert.equal(seed.calls.opened, 1, "no pending pack means the seed is not even copied");
  assert.deepEqual(await db.getAllAsync("SELECT id, imported_at, updated_at, import_count FROM question_batches ORDER BY id"), batchRows, "unchanged packs are not rewritten");
  assert.ok(second.timeline.some((p) => p.mode === "returning"));
  assert.equal(metrics.snapshot().counters["content.packs.unchanged"], 4);
}));

test("idempotent re-initialization: repeated startups never duplicate or alter content", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(3));
  const db = openMemoryDb();
  await runStartup(db, seedHooks(seed).hooks);
  const before = await dumpContent(db);
  for (let i = 0; i < 3; i++) await runStartup(db, seedHooks(seed).hooks);
  assert.deepEqual(await dumpContent(db), before);
  assert.equal(await count(db, "question_appearances"), 9);
}));

test("changed-pack detection: only the changed pack is copied, and user-owned data survives the update", withTempDir(async (dir) => {
  const v1 = packs(4);
  const seedV1 = await buildSeed(dir, "v1.db", v1);
  const db = openMemoryDb();
  await runStartup(db, seedHooks(seedV1).hooks);

  // User-owned data created between app versions.
  await updateProfile(db, { displayName: "Rafi", language: "en", flashSeconds: 45 });
  await toggleBookmark(db, "q-syn-2-1");
  await createSession(db, { id: "s-keep", mode: "flash", filter: {} as never, startedAt: 1000 });
  await recordFlashResult(db, "s-keep", { position: 1, cycle: 1, questionId: "q-syn-2-1", outcome: "correct", selectedKeys: ["b"], timeSpentMs: 900, at: 1100 });

  const v2 = packs(4);
  v2[1].questions[0].text = "Synthetic question 1 (corrected wording)";
  const seedV2 = await buildSeed(dir, "v2.db", v2);
  assert.notEqual(seedV2.manifest.packs[1].signature, seedV1.manifest.packs[1].signature);
  assert.equal(seedV2.manifest.packs[0].signature, seedV1.manifest.packs[0].signature);

  const outcomes = await syncFromSeed(db, { manifest: seedV2.manifest, openSeed: seedV2.openSeed });
  assert.deepEqual(outcomes.map((o) => o.status), ["unchanged", "imported", "unchanged", "unchanged"]);
  assert.equal(seedV2.calls.opened, 1);

  const updated = await db.getFirstAsync<{ text: string }>("SELECT text FROM questions WHERE id = 'q-syn-2-1'");
  assert.equal(updated?.text, "Synthetic question 1 (corrected wording)");
  assert.equal(await count(db, "questions"), 12);
  assert.equal((await db.getAllAsync("SELECT 1 FROM question_options WHERE question_id = 'q-syn-2-1'")).length, 4, "options are replaced, not duplicated");

  const profile = await getProfile(db);
  assert.equal(profile.displayName, "Rafi");
  assert.equal(profile.language, "en");
  assert.equal(profile.flashSeconds, 45);
  assert.ok((await bookmarkedIds(db, ["q-syn-2-1"])).has("q-syn-2-1"));
  const answers = await getSessionAnswers(db, "s-keep");
  assert.equal(answers.length, 1);
  assert.equal(answers[0].outcome, "correct");
}));

test("existing install imported by the legacy importer is adopted by the seed without duplicates or data loss", withTempDir(async (dir) => {
  const source = packs(3);
  const db = await freshDb();
  await syncBundledPacks(db, source); // what v0.1.2 did on first launch
  await toggleBookmark(db, "q-syn-1-2");
  await updateProfile(db, { displayName: "Mina" });
  const before = await dumpContent(db);

  const seed = await buildSeed(dir, "seed.db", source);
  const outcomes = await syncFromSeed(db, { manifest: seed.manifest, openSeed: seed.openSeed });
  assert.deepEqual(outcomes.map((o) => o.status), ["unchanged", "unchanged", "unchanged"], "identical signatures: nothing to do");
  assert.equal(seed.calls.opened, 0);
  assert.deepEqual(await dumpContent(db), before);
  assert.equal((await getProfile(db)).displayName, "Mina");
  assert.ok((await bookmarkedIds(db, ["q-syn-1-2"])).has("q-syn-1-2"));
}));

test("interrupted import: a failing pack rolls back alone, completed packs keep their checkpoint, and the next launch resumes only the rest", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(5));
  const db = openDbAt(join(dir, "user.db"));
  await migrate(db);
  // Simulates an interruption inside pack 3 (a killed write): everything of that pack must roll back.
  await db.execAsync(`CREATE TRIGGER boom BEFORE INSERT ON questions WHEN NEW.id = 'q-syn-3-1' BEGIN SELECT RAISE(ABORT, 'simulated interruption'); END`);

  const first = await runStartup(db, seedHooks(seed).hooks);
  assert.equal(first.libraryComplete, false, "an incomplete library is never reported as complete");
  assert.equal(first.importIssues.length, 1);
  assert.match(first.importIssues[0], /batch-syn-3/);
  assert.equal(await count(db, "questions"), 12);
  assert.equal((await db.getAllAsync("SELECT 1 FROM question_batches WHERE id = 'batch-syn-3'")).length, 0, "no checkpoint for the interrupted pack");
  assert.equal((await db.getAllAsync("SELECT 1 FROM questions WHERE batch_id = 'batch-syn-3'")).length, 0, "no partial content for the interrupted pack");
  assert.equal((await db.getAllAsync("SELECT 1 FROM question_appearances WHERE paper_id = 'paper-syn-3-2025'")).length, 0);
  assert.equal(seed.calls.opened, 1);
  assert.equal(seed.calls.released, 1);

  // "Relaunch": a brand-new connection to the same file.
  db.raw.close();
  const reopened = openDbAt(join(dir, "user.db"));
  const second = await runStartup(reopened, seedHooks(seed).hooks);
  assert.equal(second.libraryComplete, false, "still failing while the trigger exists; completed packs are skipped, not redone");
  await reopened.execAsync("DROP TRIGGER boom");

  const metrics = createStartupMetrics();
  const third = await runStartup(reopened, seedHooks(seed, { metrics }).hooks);
  assert.equal(third.libraryComplete, true);
  assert.deepEqual(third.importIssues, []);
  assert.equal(metrics.snapshot().counters["content.packs.pending"], 1, "only the interrupted pack is resumed");
  assert.equal(metrics.snapshot().counters["content.packs.imported"], 1);
  assert.equal(await count(reopened, "questions"), 15);
  assert.equal(await count(reopened, "question_options"), 60);
  assert.equal(await count(reopened, "question_appearances"), 15);
  reopened.raw.close();
}));

test("a seed that cannot be opened: first launch is a retryable error, a populated library stays usable with a warning", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(2));
  const broken = async (): Promise<SeedHandle> => { throw new Error("asset unavailable"); };

  const empty = openMemoryDb();
  await assert.rejects(runStartup(empty, seedHooks(seed, { syncContent: (db, onProgress, now) => syncFromSeed(db, { manifest: seed.manifest, openSeed: broken, now, onProgress }) }).hooks), /asset unavailable/);
  assert.equal(await count(empty, "questions"), 0, "nothing half-imported");

  const populated = openMemoryDb();
  await runStartup(populated, seedHooks(seed).hooks);
  const newer = await buildSeed(dir, "newer.db", [pack(1), pack(2), pack(3)]);
  const result = await runStartup(populated, seedHooks(newer, { syncContent: (db, onProgress, now) => syncFromSeed(db, { manifest: newer.manifest, openSeed: broken, now, onProgress }) }).hooks);
  assert.equal(result.libraryComplete, false);
  assert.match(result.importIssues.join(" "), /asset unavailable/);
  assert.equal(await count(populated, "questions"), 6, "existing content untouched");

  // Retry after the transient failure succeeds.
  const retried = await runStartup(populated, seedHooks(newer).hooks);
  assert.equal(retried.libraryComplete, true);
  assert.equal(await count(populated, "questions"), 9);
}));

test("a seed that does not match the app build is rejected, detached and released", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(2));
  const other = await buildSeed(dir, "other.db", [pack(7), pack(8)]);
  const db = await freshDb();
  // Manifest of one build, seed file of another.
  await assert.rejects(syncFromSeed(db, { manifest: other.manifest, openSeed: seed.openSeed }), /does not match this app build/);
  assert.equal(seed.calls.released, 1);
  assert.deepEqual((await db.getAllAsync<{ name: string }>("PRAGMA database_list")).map((r) => r.name), ["main"], "seed is detached");
  assert.equal(await count(db, "questions"), 0);

  const wrongFormat: ContentManifest = { ...seed.manifest, seedFormat: SEED_FORMAT + 1 };
  await assert.rejects(syncFromSeed(db, { manifest: wrongFormat, openSeed: seed.openSeed }), /not supported/);
}));

test("a seed whose pack metadata disagrees with the manifest is rejected before any content is copied", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(3));
  const tampered: ContentManifest = { ...seed.manifest, packs: seed.manifest.packs.map((p, i) => (i === 1 ? { ...p, questions: p.questions + 1 } : p)) };
  const db = await freshDb();
  await assert.rejects(syncFromSeed(db, { manifest: tampered, openSeed: seed.openSeed }), /batch-syn-2 is missing, incomplete, or mismatched/);
  assert.equal(await count(db, "questions"), 0, "no part of a seed with an inconsistent manifest is trusted");
  assert.deepEqual((await db.getAllAsync<{ name: string }>("PRAGMA database_list")).map((r) => r.name), ["main"], "the failed asset is detached");
}));

test("progress callbacks are real, monotonic and survive a throwing listener", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(4));
  const db = await freshDb();
  const seen: SyncProgress[] = [];
  await syncFromSeed(db, {
    manifest: seed.manifest, openSeed: seed.openSeed,
    onProgress: (p) => { seen.push(p); if (p.index === 2) throw new Error("listener bug"); }
  });
  assert.equal(seen[0].index, 0);
  assert.equal(seen[seen.length - 1].index, 4);
  assert.equal(seen[seen.length - 1].questionsDone, 12);
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i].index >= seen[i - 1].index);
    assert.ok(seen[i].questionsDone >= seen[i - 1].questionsDone);
  }
  assert.equal(await count(db, "questions"), 12);
}));

test("large libraries are copied in bounded transactions", () => {
  const item = (batchId: string, questions: number) => ({ entry: { batchId, signature: "s", questions } });
  const groups = groupPending([item("a", 600), item("b", 600), item("c", 600), item("d", 2000), item("e", 10)], 1500);
  assert.deepEqual(groups.map((g) => g.map((x) => x.entry.batchId)), [["a", "b"], ["c"], ["d"], ["e"]]);
  assert.deepEqual(groupPending([]), []);
});

test("migration compatibility: the seed has the app's schema, and an install one version behind upgrades and then syncs", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(3));
  const seedDb = openDbAt(seed.file);
  assert.equal((await seedDb.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version, LATEST_VERSION);
  const seedTables = (await seedDb.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'seed_%' ORDER BY name")).map((r) => r.name);
  seedDb.raw.close();
  const current = await freshDb();
  const appTables = (await current.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
  assert.deepEqual(seedTables, appTables);

  const old = openMemoryDb();
  await migrate(old, MIGRATIONS.slice(0, MIGRATIONS.length - 1));
  assert.equal((await old.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version, LATEST_VERSION - 1);
  const result = await runStartup(old, seedHooks(seed).hooks);
  assert.equal((await old.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version, LATEST_VERSION);
  assert.equal(result.libraryComplete, true);
  assert.equal(await count(old, "questions"), 9);
}));

test("the seed copy never touches user-owned tables", withTempDir(async (dir) => {
  const seed = await buildSeed(dir, "seed.db", packs(3));
  const db = openMemoryDb();
  await runStartup(db, seedHooks(seed).hooks);
  for (const table of ["practice_sessions", "session_questions", "session_answers", "bookmarks"]) {
    assert.equal(await count(db, table), 0, `${table} stays empty`);
  }
  assert.equal(await count(db, "user_profile"), 1);
}));

// ---------------------------------------------------------------- lifecycle coordinator

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("coordinator: start, retry and double effects share ONE in-flight attempt; a success is remembered", async () => {
  let runs = 0;
  const gate = deferred();
  const c = createStartupCoordinator<string>({ runAttempt: async () => { runs++; await gate.promise; return "db"; } });
  const a = c.start();
  const b = c.start();
  const r = c.retry();
  assert.equal(runs, 1, "no second writer");
  gate.resolve();
  const results = await Promise.all([a, b, r]);
  assert.ok(results.every((x) => x.ok));
  await c.start();
  assert.equal(runs, 1, "start() after success is memoized");
  await c.retry();
  assert.equal(runs, 2, "an explicit retry() after success runs once more");
});

test("coordinator: a failure while backgrounded resumes once the app is foregrounded again", async () => {
  const attempts: { resumed: boolean }[] = [];
  const gates = [deferred<string>(), deferred<string>()];
  const c = createStartupCoordinator<string>({
    runAttempt: async (info) => { attempts.push({ resumed: info.resumed }); return gates[info.attempt - 1].promise; }
  });
  const first = c.start();
  c.setLifecycle("background");
  gates[0].reject(new Error("db handle closed by the OS"));
  assert.equal((await first).ok, false);
  assert.equal(c.getState().status, "failed");

  c.setLifecycle("active");
  assert.equal(c.getState().status, "running", "foreground return auto-resumes");
  assert.deepEqual(attempts, [{ resumed: false }, { resumed: true }]);
  c.setLifecycle("inactive");
  c.setLifecycle("active");
  assert.equal(attempts.length, 2, "no extra attempt while one is in flight");
  gates[1].resolve("db");
  const outcome = await c.start();
  assert.ok(outcome.ok);
  assert.equal(c.getState().status, "succeeded");
});

test("coordinator: foreground return before a backgrounded attempt rejects still triggers a bounded retry", async () => {
  const attempts: { resumed: boolean }[] = [];
  const gates = [deferred<string>(), deferred<string>()];
  const c = createStartupCoordinator<string>({
    runAttempt: async (info) => { attempts.push({ resumed: info.resumed }); return gates[info.attempt - 1].promise; }
  });

  const first = c.start();
  c.setLifecycle("background");
  c.setLifecycle("active"); // app returns before SQLite/JS surfaces the interrupted transaction
  gates[0].reject(new Error("database was interrupted while backgrounded"));
  assert.equal((await first).ok, false, "the failed attempt still reports its own failure");
  assert.equal(c.getState().status, "running", "coordinator immediately starts the automatic recovery attempt");
  assert.deepEqual(attempts, [{ resumed: false }, { resumed: true }]);
  gates[1].resolve("db");
  assert.ok((await c.start()).ok);
  assert.equal(c.getState().status, "succeeded");
});

test("coordinator: a failure in the foreground is never auto-retried (the user sees the retry screen)", async () => {
  let runs = 0;
  const c = createStartupCoordinator<string>({ runAttempt: async () => { runs++; throw new Error("migration failed"); } });
  assert.equal((await c.start()).ok, false);
  c.setLifecycle("background");
  c.setLifecycle("active");
  assert.equal(runs, 1);
  assert.equal(c.getState().status, "failed");
  assert.equal((await c.retry()).ok, false, "explicit retry still works");
  assert.equal(runs, 2);
});

test("coordinator: automatic resumes are capped, and a user retry restores the budget", async () => {
  let runs = 0;
  const pending: ReturnType<typeof deferred<string>>[] = [];
  const c = createStartupCoordinator<string>({
    maxAutoResumes: 2,
    runAttempt: () => { runs++; const d = deferred<string>(); pending.push(d); return d.promise; }
  });
  const fail = async (lifecycle: AppLifecycle = "background") => {
    c.setLifecycle(lifecycle);
    pending[pending.length - 1].reject(new Error("suspended"));
    await new Promise((r) => setImmediate(r));
  };
  void c.start();
  await fail();
  c.setLifecycle("active"); // resume 1
  await fail();
  c.setLifecycle("active"); // resume 2
  await fail();
  c.setLifecycle("active"); // budget exhausted
  assert.equal(runs, 3);
  assert.equal(c.getState().status, "failed");
  void c.retry();
  assert.equal(runs, 4);
  assert.equal(c.getState().autoResumes, 0);
  pending[pending.length - 1].resolve("db");
  assert.ok((await c.start()).ok);
});

test("coordinator notifies the UI of attempt start and settle", async () => {
  const events: string[] = [];
  const c = createStartupCoordinator<number>({
    runAttempt: async () => 7,
    onAttemptStart: (i) => events.push(`start#${i.attempt}`),
    onSettled: (o) => events.push(o.ok ? `ok:${o.value}` : "fail")
  });
  await c.start();
  assert.deepEqual(events, ["start#1", "ok:7"]);
});

// ---------------------------------------------------------------- instrumentation

test("startup metrics: monotonic spans, first-wins marks, counters, reset and no payload data", async () => {
  let now = 100;
  const m = createStartupMetrics(() => now);
  const out = await m.span("db.open", async () => { now += 30; return "x"; });
  assert.equal(out, "x");
  await assert.rejects(m.span("db.open", async () => { now += 20; throw new Error("boom"); }), /boom/);
  m.time("sync", () => { now += 5; });
  m.mark("fonts.ready");
  now += 10;
  m.mark("fonts.ready");
  m.count("packs", 2);
  m.count("packs");
  const s = m.snapshot();
  assert.deepEqual(s.spans["db.open"], { ms: 50, calls: 2, maxMs: 30 });
  assert.equal(s.spans.sync.ms, 5);
  assert.equal(s.marks["fonts.ready"], 55, "the first mark wins");
  assert.equal(s.counters.packs, 3);
  assert.match(m.summary(), /db\.open=50ms\/2x/);
  m.reset();
  assert.deepEqual(m.snapshot().spans, {});
  assert.deepEqual(m.snapshot().counters, {});
  assert.equal(m.snapshot().marks["fonts.ready"], 55, "process-relative marks survive a retry reset");
  assert.equal(m.snapshot().elapsedMs, 0, "the current attempt clock resets independently of process age");
  now += 10;
  m.mark("ready");
  assert.equal(m.snapshot().marks.ready, 75, "marks after a reset still use the process clock");
});
