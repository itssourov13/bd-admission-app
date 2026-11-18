import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openDbAt } from "./helpers.ts";
import { DU_PAPER, duPack, JU_PAPER, juPack, RU_PAPER, RUV_PAPER, ruPack, ruvPack } from "./fixtures/packFactory.ts";
import { LATEST_VERSION, MIGRATIONS, migrate } from "../src/db/schema.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { buildSeedDatabase } from "../src/services/seedBuilder.ts";
import { syncFromSeed, type SeedHandle } from "../src/services/seedSync.ts";
import { BUNDLED_MANIFEST } from "../src/content/bundledManifest.ts";
import {
  categoriesWithContent, contentTotals, countPoolBySubject, countReviewCandidates, eligibleQuestionIds, getInstitution, listBatches, listExamPatterns,
  listInstitutions, listPaperQuestionIds, listPapers, listPapersByInstitutions, loadQuestions, practiceQuestionIds
} from "../src/repositories/content.ts";
import {
  addExamQuestions, createSession, finalizeExamSession, finishFlashSession, getActiveExam, getSession, getSessionAnswers, listHistory,
  recordFlashResult, saveExamSelection
} from "../src/repositories/sessions.ts";
import { bookmarkedIds, toggleBookmark } from "../src/repositories/userData.ts";
import { loadExam, startStandardExam } from "../src/services/practiceService.ts";
import type { QuestionPack } from "../src/types/question-pack.ts";
import type { SqlDb } from "../src/db/types.ts";

type FileDb = SqlDb & { raw: ReturnType<typeof openDbAt>["raw"] };

const RULE = { correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, status: "verified" as const, totalQuestions: 4, durationSeconds: 1200, totalMarks: 4, selectionConfig: null };
const SNAPSHOT = { v: 1, id: "builtin-fixture", kind: "builtin", name: { en: "Fixture", bn: "ফিক্সচার" }, origin: "default", status: "verified", passMarks: 2, questionCount: 4, provenance: {} };
const isRuId = (id: string) => id.startsWith("ru-");
const isLegacyRuId = (id: string) => id.startsWith("ru-c-") || id.startsWith("ru-vq-");

const withTemp = (fn: (dir: string) => Promise<void>) => async () => {
  const dir = mkdtempSync(join(tmpdir(), "bd-v11-"));
  try { await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
};

function assertIntegrity(db: FileDb, label: string): void {
  assert.equal((db.raw.prepare("PRAGMA quick_check").get() as { quick_check: string }).quick_check, "ok", `${label}: quick_check`);
  assert.equal(db.raw.prepare("PRAGMA foreign_key_check").all().length, 0, `${label}: foreign_key_check`);
}

/**
 * User-owned tables (whole) plus the RU and JU content rows, in a stable order, excluding the columns v11 adds.
 * RU = retired history; JU = untouched active content. Rows of newly synced seed packs (DU) are intentionally out of scope.
 */
const R = "(x LIKE 'ru-%' OR x LIKE 'ju-%')";
const scope = (col: string) => R.replaceAll("x", col);
const SNAPSHOT_SQL: Record<string, string> = {
  institutions: "SELECT * FROM institutions WHERE id LIKE 'ru%' OR id = 'ju' ORDER BY id",
  exam_papers: `SELECT id, institution_id, category, year, academic_session, unit, title FROM exam_papers WHERE ${scope("id")} ORDER BY id`,
  exam_rules: `SELECT * FROM exam_rules WHERE ${scope("paper_id")} ORDER BY id`,
  question_batches: `SELECT id, category, description, schema_version, imported_at, updated_at, import_count, pack_signature FROM question_batches WHERE ${scope("id")} ORDER BY id`,
  source_documents: `SELECT * FROM source_documents WHERE ${scope("batch_id")} ORDER BY id`,
  questions: `SELECT * FROM questions WHERE ${scope("batch_id")} ORDER BY id`,
  question_options: `SELECT * FROM question_options WHERE ${scope("question_id")} ORDER BY question_id, option_key`,
  question_sources: `SELECT * FROM question_sources WHERE ${scope("question_id")} ORDER BY question_id`,
  question_appearances: `SELECT * FROM question_appearances WHERE ${scope("question_id")} ORDER BY id`,
  bookmarks: "SELECT * FROM bookmarks ORDER BY question_id",
  practice_sessions: "SELECT * FROM practice_sessions ORDER BY id",
  session_questions: "SELECT * FROM session_questions ORDER BY session_id, position",
  session_answers: "SELECT * FROM session_answers ORDER BY session_id, position"
};

function snapshot(db: FileDb): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, sql] of Object.entries(SNAPSHOT_SQL)) out[name] = JSON.stringify(db.raw.prepare(sql).all());
  return out;
}

/** retired_at of every RU paper and batch (exact stamps, to prove stability across sync / reopen). */
const ruStamps = (db: FileDb): string => JSON.stringify({
  papers: db.raw.prepare("SELECT id, retired_at FROM exam_papers WHERE id LIKE 'ru-%' ORDER BY id").all(),
  batches: db.raw.prepare("SELECT id, retired_at FROM question_batches WHERE id LIKE 'ru-%' ORDER BY id").all()
});

interface Fixture { db: FileDb; file: string; before: Record<string, string>; ruQuestionIds: string[]; ruvQuestionIds: string[]; juQuestionIds: string[] }

/** A realistic schema-v10 installation: real migrations up to v10, real importer, real session repository writes. */
async function buildV10(dir: string): Promise<Fixture> {
  const file = join(dir, "user.db");
  const db = openDbAt(file);
  await migrate(db, MIGRATIONS.filter((m) => m.version <= 10));
  assert.equal((await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version, 10);
  const ru = ruPack(), ruv = ruvPack(), ju = juPack();
  for (const p of [ru, ruv, ju]) {
    const r = await importQuestionPack(db, p, 1_000);
    assert.equal(r.ok, true, r.errors.join("; "));
  }
  const ids = (p: QuestionPack) => p.questions.map((q) => q.id);

  await db.runAsync("INSERT INTO user_profile (id, display_name, language, flash_seconds, created_at, updated_at) VALUES (1, 'Learner', 'en', 30, 1, 2)");
  // Bookmarks: one RU, one RU-V, one non-RU.
  for (const id of [ru.questions[0]!.id, ruv.questions[0]!.id, ju.questions[0]!.id]) await toggleBookmark(db, id, 1_500);

  // ACTIVE exam on RU-V with a multiple-select answer saved on the multiple_choice question.
  await createSession(db, { id: "s-ruv-active", mode: "exam", filter: { paperId: RUV_PAPER }, startedAt: 2_000, deadlineAt: 9_000_000_000_000, durationSeconds: 1200, rule: RULE, ruleProfile: SNAPSHOT as never });
  await addExamQuestions(db, "s-ruv-active", ids(ruv));
  assert.equal(await saveExamSelection(db, "s-ruv-active", ruv.questions[0]!.id, ["b", "c"], 2_100), true);
  assert.equal(await saveExamSelection(db, "s-ruv-active", ruv.questions[1]!.id, ["a"], 2_200), true);

  // COMPLETED exam on RU-V, with result JSON and scoring snapshot.
  await createSession(db, { id: "s-ruv-done", mode: "exam", filter: { institutionId: "ru-verified-bank", paperId: RUV_PAPER }, startedAt: 3_000, deadlineAt: 9_000_000_000_000, durationSeconds: 1200, rule: RULE, ruleProfile: SNAPSHOT as never });
  await addExamQuestions(db, "s-ruv-done", ids(ruv));
  await saveExamSelection(db, "s-ruv-done", ruv.questions[0]!.id, ["b", "c"], 3_100);
  await saveExamSelection(db, "s-ruv-done", ruv.questions[1]!.id, ["b"], 3_200);
  const outcomes = ruv.questions.map((q, i) => ({ questionId: q.id, outcome: (i < 2 ? "correct" : "unanswered") as "correct" | "unanswered" }));
  assert.equal(await finalizeExamSession(db, "s-ruv-done", "submitted", 3_900, outcomes, JSON.stringify({ score: 2, correct: 2, incorrect: 0, unanswered: 2, total: 4, status: "verified" })), true);

  // COMPLETED flash on RU (unverified, provisional) and on JU.
  await createSession(db, { id: "s-ru-flash", mode: "flash", filter: { institutionId: "ru" }, startedAt: 4_000, perQuestionSeconds: 30 });
  await recordFlashResult(db, "s-ru-flash", { position: 1, cycle: 1, questionId: ru.questions[0]!.id, outcome: "correct", selectedKeys: ["b"], timeSpentMs: 1200, at: 4_100 });
  await recordFlashResult(db, "s-ru-flash", { position: 2, cycle: 1, questionId: ru.questions[1]!.id, outcome: "incorrect", selectedKeys: ["a"], timeSpentMs: 900, at: 4_200 });
  assert.equal(await finishFlashSession(db, "s-ru-flash", 4_300, JSON.stringify({ correct: 1, incorrect: 1 })), true);

  await createSession(db, { id: "s-ju-flash", mode: "flash", filter: { institutionId: "ju" }, startedAt: 5_000, perQuestionSeconds: 30 });
  await recordFlashResult(db, "s-ju-flash", { position: 1, cycle: 1, questionId: ju.questions[0]!.id, outcome: "correct", selectedKeys: ["b", "c"], timeSpentMs: 800, at: 5_100 });
  assert.equal(await finishFlashSession(db, "s-ju-flash", 5_200, JSON.stringify({ correct: 1 })), true);

  assertIntegrity(db, "v10 fixture");
  return { db, file, before: snapshot(db), ruQuestionIds: ids(ru), ruvQuestionIds: ids(ruv), juQuestionIds: ids(ju) };
}

function seedOpener(file: string): () => Promise<SeedHandle> {
  return async () => ({ path: file, release: async () => undefined });
}
async function buildSeed(dir: string, name: string, packs: QuestionPack[]) {
  const file = join(dir, name);
  const seedDb = openDbAt(file);
  const manifest = await buildSeedDatabase(seedDb, packs);
  seedDb.raw.close();
  return { manifest, openSeed: seedOpener(file), file };
}

async function assertActiveCatalogueExcludesRu(db: FileDb, label: string, allowCuratedRuScience = false): Promise<void> {
  const institutions = await listInstitutions(db, "varsity");
  const ru = institutions.find((i) => i.id === "ru");
  assert.equal(Boolean(ru), allowCuratedRuScience, `${label}: curated RU institution state`);
  assert.ok(institutions.every((i) => i.id !== "ru-verified-bank"), `${label}: legacy RU-V institution retired`);
  assert.ok(institutions.some((i) => i.id === "ju"), `${label}: JU stays active`);

  const activePapers = await listPapers(db, {});
  assert.ok(activePapers.every((p) => !isLegacyRuId(p.id) && p.institutionId !== "ru-verified-bank"), `${label}: legacy papers`);
  const activeRuPapers = await listPapersByInstitutions(db, { institutionIds: ["ru", "ru-verified-bank"], category: "varsity" });
  if (allowCuratedRuScience) {
    assert.equal(activeRuPapers.length, 46, `${label}: curated RU Science papers`);
    assert.ok(activeRuPapers.every((p) => p.institutionId === "ru" && p.id.startsWith("ru-sci-")), `${label}: only curated RU papers active`);
    assert.deepEqual(
      { questions: ru!.questionCount, eligible: ru!.eligibleCount, candidates: ru!.reviewCandidateCount },
      { questions: 4249, eligible: 4144, candidates: 86 }, `${label}: curated RU Science counts`
    );
    assert.equal((await practiceQuestionIds(db, { institutionId: "ru" })).length, 4144, `${label}: verified RU pool`);
    assert.equal((await practiceQuestionIds(db, { institutionId: "ru" }, true)).length, 4230, `${label}: explicit provisional RU pool`);
    assert.equal(await countReviewCandidates(db, { institutionId: "ru" }), 86, `${label}: RU review candidates`);
  } else {
    assert.deepEqual(activeRuPapers, [], `${label}: no RU content before curated seed import`);
    assert.equal(await countReviewCandidates(db, { institutionId: "ru" }), 0, `${label}: review candidates`);
  }
  assert.deepEqual(await listExamPatterns(db, ["ru", "ru-verified-bank"], true), [], `${label}: no unsupported RU exam patterns`);
  assert.ok((await listExamPatterns(db, ["ju"])).length >= 1, `${label}: JU exam pattern remains`);
  for (const filter of [{}, { institutionId: "ru" }, { institutionId: "ru-verified-bank" }, { paperId: RU_PAPER }, { paperId: RUV_PAPER }, { category: "varsity" as const }]) {
    assert.ok((await eligibleQuestionIds(db, filter)).every((id) => !isLegacyRuId(id)), `${label}: verified pool ${JSON.stringify(filter)}`);
    assert.ok((await practiceQuestionIds(db, filter, true)).every((id) => !isLegacyRuId(id)), `${label}: provisional pool ${JSON.stringify(filter)}`);
  }
  assert.equal((await countPoolBySubject(db, { institutionId: "ru-verified-bank" }, true)).total, 0, `${label}: retired RU-V subject counts`);
  assert.deepEqual(await listPaperQuestionIds(db, RUV_PAPER, 50, 0), [], `${label}: browse retired paper`);
  assert.ok((await listBatches(db)).every((b) => !isLegacyRuId(b.id)), `${label}: legacy imported batches retired`);
  assert.ok((await categoriesWithContent(db)).includes("varsity"));
  const refused = await startStandardExam(db, { institutionId: "ru-verified-bank" }, 9_000, undefined, { custom: { questions: 2, seconds: 600 } });
  assert.equal(refused.ok, false, `${label}: no new exam on RU-V`);
  const refusedPaper = await startStandardExam(db, { paperId: RUV_PAPER }, 9_000);
  assert.equal(refusedPaper.ok, false, `${label}: no new exam on retired RU-V paper`);
}
async function assertHistoryIntact(f: Fixture, db: FileDb, label: string, skip: string[] = []): Promise<void> {
  const now = snapshot(db);
  for (const key of Object.keys(SNAPSHOT_SQL).filter((k) => !skip.includes(k))) assert.equal(now[key], f.before[key], `${label}: table ${key} unchanged`);
  // Resolution APIs the history screens use.
  const questions = await loadQuestions(db, [...f.ruQuestionIds, ...f.ruvQuestionIds]);
  assert.equal(questions.length, 8);
  assert.ok(questions.every((q) => q.appearances.length === 1 && q.appearances[0]!.sourceFilename !== undefined));
  assert.deepEqual(questions.filter((q) => q.id === f.ruvQuestionIds[0]).flatMap((q) => q.appearances.map((a) => a.institutionCode)), ["RU-V"]);
  assert.equal((await getInstitution(db, "ru"))?.code, "RU");
  assert.equal((await getInstitution(db, "ru-verified-bank"))?.code, "RU-V");
  assert.deepEqual([...(await bookmarkedIds(db))].sort(), [f.ruQuestionIds[0]!, f.ruvQuestionIds[0]!, f.juQuestionIds[0]!].sort());
  assert.deepEqual((await getSessionAnswers(db, "s-ruv-active")).slice(0, 2).map((a) => a.selectedKeys), [["b", "c"], ["a"]]);
  assert.deepEqual((await getSessionAnswers(db, "s-ju-flash"))[0]!.selectedKeys, ["b", "c"]);
  const done = await getSession(db, "s-ruv-done");
  assert.equal(done?.status, "completed");
  assert.equal(JSON.parse(done!.resultJson!).score, 2);
  assert.equal(done?.ruleProfile?.id, "builtin-fixture");
  assert.deepEqual(done?.filter, { institutionId: "ru-verified-bank", paperId: RUV_PAPER });
  const active = await getActiveExam(db);
  assert.equal(active?.id, "s-ruv-active");
  const resumed = await loadExam(db, "s-ruv-active");
  assert.equal(resumed?.questions.length, 4);
  assert.deepEqual(resumed?.selected[f.ruvQuestionIds[0]!], ["b", "c"]);
  assert.deepEqual((await listHistory(db)).map((h) => h.id).sort(), ["s-ju-flash", "s-ru-flash", "s-ruv-done"]);
}

test("v10 → v11: RU/RU-V are retired from active flows while every historical and user record is preserved", withTemp(async (dir) => {
  const f = await buildV10(dir);
  const { db } = f;
  assert.equal(await migrate(db), LATEST_VERSION);
  assert.ok(LATEST_VERSION >= 11); // v12 (additive library metadata) follows the v11 retirement migration
  assertIntegrity(db, "after v11");

  // Retirement flags: RU/RU-V retired, everything else active.
  const papers = db.raw.prepare("SELECT id, retired_at FROM exam_papers").all() as { id: string; retired_at: number | null }[];
  for (const p of papers) assert.equal(p.retired_at !== null, isRuId(p.id), `paper ${p.id}`);
  const batches = db.raw.prepare("SELECT id, retired_at FROM question_batches").all() as { id: string; retired_at: number | null }[];
  for (const b of batches) assert.equal(b.retired_at !== null, isRuId(b.id), `batch ${b.id}`);

  await assertHistoryIntact(f, db, "post-migration");
  await assertActiveCatalogueExcludesRu(db, "post-migration");
  assert.deepEqual(await contentTotals(db), { questions: 4, eligible: 4, institutions: 1 });

  // JU still usable end to end.
  const ju = await startStandardExam(db, { paperId: JU_PAPER }, 9_000);
  assert.equal(ju.ok, true);
  db.raw.close();
}));

test("v10 → v11 → bundled-seed sync: repeated sync, a re-delivered RU paper and reopening never reactivate RU", withTemp(async (dir) => {
  const f = await buildV10(dir);
  const { db } = f;
  await migrate(db);
  const stampsInitial = ruStamps(db);
  assert.ok(JSON.parse(stampsInitial).papers.length === 2 && JSON.parse(stampsInitial).papers.every((p: { retired_at: number | null }) => p.retired_at !== null));

  const seed = await buildSeed(dir, "seed1.db", [juPack(), duPack()]);
  const first = await syncFromSeed(db, { manifest: seed.manifest, openSeed: seed.openSeed, now: 10_000 });
  assert.deepEqual(first.map((o) => [o.batchId, o.status]), [[JU_PAPER, "unchanged"], [DU_PAPER, "imported"]]);
  assertIntegrity(db, "after seed sync");
  assert.equal(await db.getFirstAsync("SELECT 1 FROM questions WHERE id LIKE 'du-%'") !== null, true);
  await assertHistoryIntact(f, db, "after sync");
  await assertActiveCatalogueExcludesRu(db, "after sync");
  assert.equal((await contentTotals(db)).institutions, 2, "JU and DU are the active institutions");
  assert.equal((await listInstitutions(db, "varsity")).some((i) => i.id === "du"), true);
  assert.equal(ruStamps(db), stampsInitial, "sync leaves RU retirement stamps untouched");

  // Second sync: nothing pending.
  const second = await syncFromSeed(db, { manifest: seed.manifest, openSeed: seed.openSeed, now: 11_000 });
  assert.ok(second.every((o) => o.status === "unchanged"));

  // A seed that RE-DELIVERS the RU paper (changed title) must update content columns but never clear retired_at.
  const ruChanged = ruPack();
  ruChanged.papers[0]!.title = "RU C Unit retitled by a hypothetical seed";
  const seed2 = await buildSeed(dir, "seed2.db", [juPack(), duPack(), ruChanged]);
  const third = await syncFromSeed(db, { manifest: seed2.manifest, openSeed: seed2.openSeed, now: 12_000 });
  assert.equal(third.find((o) => o.batchId === RU_PAPER)?.status, "imported");
  const ruPaper = db.raw.prepare("SELECT title, retired_at FROM exam_papers WHERE id = ?").get(RU_PAPER) as { title: string; retired_at: number | null };
  assert.equal(ruPaper.title, "RU C Unit retitled by a hypothetical seed");
  assert.notEqual(ruPaper.retired_at, null, "seed upsert never clears retirement");
  assert.notEqual((db.raw.prepare("SELECT retired_at FROM question_batches WHERE id = ?").get(RU_PAPER) as { retired_at: number | null }).retired_at, null);
  await assertHistoryIntact(f, db, "after RU re-delivery", ["exam_papers", "question_batches"]);
  await assertActiveCatalogueExcludesRu(db, "after RU re-delivery");
  assertIntegrity(db, "after RU re-delivery");

  // Reopen the database file like an app restart; migration is idempotent and retirement stable.
  const stampsBefore = ruStamps(db);
  db.raw.close();
  const reopened = openDbAt(f.file);
  assert.equal(await migrate(reopened), LATEST_VERSION);
  assert.equal(ruStamps(reopened), stampsBefore);
  await assertActiveCatalogueExcludesRu(reopened, "after reopen");
  assertIntegrity(reopened, "after reopen");
  reopened.raw.close();
}));

test("fresh install on the v11 schema with a non-RU seed contains no RU content and nothing retired", withTemp(async (dir) => {
  const db = openDbAt(join(dir, "fresh.db"));
  await migrate(db);
  const seed = await buildSeed(dir, "seed.db", [juPack(), duPack()]);
  const out = await syncFromSeed(db, { manifest: seed.manifest, openSeed: seed.openSeed, now: 1 });
  assert.ok(out.every((o) => o.status === "imported"));
  for (const sql of [
    "SELECT COUNT(*) AS n FROM institutions WHERE id LIKE 'ru%'",
    "SELECT COUNT(*) AS n FROM exam_papers WHERE id LIKE 'ru-%' OR institution_id LIKE 'ru%'",
    "SELECT COUNT(*) AS n FROM question_batches WHERE id LIKE 'ru-%'",
    "SELECT COUNT(*) AS n FROM questions WHERE id LIKE 'ru-%'",
    "SELECT COUNT(*) AS n FROM exam_papers WHERE retired_at IS NOT NULL",
    "SELECT COUNT(*) AS n FROM question_batches WHERE retired_at IS NOT NULL"
  ]) assert.equal((db.raw.prepare(sql).get() as { n: number }).n, 0, sql);
  assert.deepEqual(await contentTotals(db), { questions: 8, eligible: 8, institutions: 2 });
  assertIntegrity(db, "fresh");
  db.raw.close();
}));

test("fresh install with the REAL bundled seed: active curated RU Science plus the separate RU-V ASPECT Library", { skip: !existsSync(resolve("assets/content/content_seed.db")) && "bundled seed not built" }, withTemp(async (dir) => {
  const db = openDbAt(join(dir, "real.db"));
  await migrate(db);
  const out = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed: seedOpener(resolve("assets/content/content_seed.db")), now: 1 });
  assert.equal(out.length, 205);
  assert.ok(out.every((o) => o.status === "imported"), out.filter((o) => o.status !== "imported").map((o) => o.batchId).join(","));
  const n = (sql: string) => (db.raw.prepare(sql).get() as { n: number }).n;
  assert.equal(n("SELECT COUNT(*) AS n FROM question_batches"), 205);
  assert.equal(n("SELECT COUNT(*) AS n FROM questions"), 13849);
  assert.equal(n("SELECT COUNT(*) AS n FROM content_books WHERE collection = 'ASPECT' AND id = 'aspect-ru-question-bank-verified-sets'"), 1);
  assert.equal(n("SELECT COUNT(*) AS n FROM content_unit_questions WHERE book_id = 'aspect-ru-question-bank-verified-sets'"), 1828);
  assert.equal(n("SELECT COUNT(*) AS n FROM institutions WHERE id = 'ru' AND code = 'RU'"), 1);
  assert.equal(n("SELECT COUNT(*) AS n FROM institutions WHERE id = 'ru-verified-bank'"), 0);
  assert.equal(n("SELECT COUNT(*) AS n FROM question_batches WHERE id LIKE 'ru-c-%' OR id LIKE 'ru-vq-%'"), 0);
  assert.equal(n("SELECT COUNT(*) AS n FROM question_batches WHERE id LIKE 'ru-sci-%'"), 46);
  assert.equal(n("SELECT COUNT(*) AS n FROM questions WHERE batch_id LIKE 'ru-sci-%'"), 4249);
  assert.equal(n("SELECT COUNT(*) AS n FROM exam_papers WHERE institution_id = 'ru' AND retired_at IS NULL"), 46);
  assert.equal(n("SELECT COUNT(*) AS n FROM exam_rules WHERE paper_id IN (SELECT id FROM exam_papers WHERE institution_id = 'ru')"), 0);
  assert.equal(n("SELECT COUNT(*) AS n FROM exam_papers WHERE retired_at IS NOT NULL"), 0);
  // contentTotals() describes university/paper catalogue questions only; Library questions are counted through book membership.
  assert.deepEqual(await contentTotals(db), { questions: 12021, eligible: 6654, institutions: 6 });
  await assertActiveCatalogueExcludesRu(db, "real seed fresh", true);
  assertIntegrity(db, "real seed fresh");
  db.raw.close();
}));

test("v10 upgrade + REAL bundled seed: RU stays retired and historical, bundled content becomes active", { skip: !existsSync(resolve("assets/content/content_seed.db")) && "bundled seed not built" }, withTemp(async (dir) => {
  const f = await buildV10(dir);
  await migrate(f.db);
  const out = await syncFromSeed(f.db, { manifest: BUNDLED_MANIFEST, openSeed: seedOpener(resolve("assets/content/content_seed.db")), now: 20_000 });
  assert.ok(out.every((o) => o.status === "imported"));
  await assertActiveCatalogueExcludesRu(f.db, "real seed upgrade", true);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM questions WHERE batch_id LIKE 'ru-c-%' OR batch_id LIKE 'ru-vq-%'").get() as { n: number }).n, 8);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM questions WHERE batch_id LIKE 'ru-sci-%'").get() as { n: number }).n, 4249);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM exam_papers WHERE institution_id = 'ru' AND retired_at IS NULL").get() as { n: number }).n, 46);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM exam_rules WHERE paper_id IN (SELECT id FROM exam_papers WHERE institution_id = 'ru')").get() as { n: number }).n, 0);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM exam_papers WHERE retired_at IS NOT NULL").get() as { n: number }).n, 2);
  // Existing installations receive RU-V through the Library tree while the old RU/RU-V university rows stay retired.
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM content_books WHERE id = 'aspect-ru-question-bank-verified-sets' AND collection = 'ASPECT' AND install_state = 'bundled'").get() as { n: number }).n, 1);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM questions WHERE batch_id = 'lib-aspect-ru-question-bank-verified-sets'").get() as { n: number }).n, 1828);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM content_unit_questions WHERE book_id = 'aspect-ru-question-bank-verified-sets'").get() as { n: number }).n, 1828);
  assert.equal((f.db.raw.prepare("SELECT COUNT(*) AS n FROM questions WHERE batch_id = 'lib-aspect-ru-question-bank-verified-sets' AND answer_status = 'unverified'").get() as { n: number }).n, 2);
  assertIntegrity(f.db, "real seed upgrade");
  f.db.raw.close();
}));
