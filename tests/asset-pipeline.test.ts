import assert from "node:assert/strict";
import { test } from "node:test";
import { freshDb, openMemoryDb, syntheticPack } from "./helpers.ts";
import { MIGRATIONS, migrate } from "../src/db/schema.ts";
import { assetPathProblem, collectQuestionAssetRefs, validateAssetList, validateQuestionAssets } from "../src/services/assetRefs.mjs";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";
import { validateLibraryPack } from "../src/services/libraryPackValidator.ts";
import { contentHash, importQuestionPack } from "../src/services/importer.ts";
import { installLibraryPack } from "../src/services/libraryImporter.ts";
import { loadQuestions } from "../src/repositories/content.ts";
import { figureAspectRatio, DEFAULT_FIGURE_ASPECT, MAX_FIGURE_ASPECT, MIN_FIGURE_ASPECT } from "../src/features/questions/figureLayout.ts";
import type { LibraryPack } from "../src/types/library-pack.ts";
import type { QuestionPackItem } from "../src/types/question-pack.ts";

const OK = "assets/test-ns/fig-1.png";

test("asset path rules accept namespaced offline images and reject unsafe or malformed paths", () => {
  for (const ok of [OK, "assets/ru-v/abc123.png", "assets/lokkho/008c3a8b364389451e4135af.png", "assets/x/y.JPG", "assets/x/y.webp"]) assert.equal(assetPathProblem(ok), null, ok);
  for (const bad of ["", "fig.png", "assets/fig.png", "/assets/x/y.png", "assets/../x/y.png", "assets/x/../y.png", "assets\\x\\y.png", "assets/x//y.png", "assets/x/y.svg", "assets/x/y.gif", "assets/x/.hidden.png", "assets/x/y", "https://example.com/assets/x/y.png", "assets/x/y z.png"]) {
    assert.notEqual(assetPathProblem(bad), null, JSON.stringify(bad));
  }
  assert.notEqual(assetPathProblem(42 as unknown), null);
  assert.notEqual(assetPathProblem("assets/x/" + "a".repeat(220) + ".png"), null);
});

test("asset lists reject non-arrays, duplicates and oversized lists; absent lists are fine", () => {
  assert.deepEqual(validateAssetList(undefined, "x"), []);
  assert.deepEqual(validateAssetList([OK], "x"), []);
  assert.equal(validateAssetList("assets/x/y.png", "x").length, 1);
  assert.equal(validateAssetList([OK, OK], "x").length, 1);
  assert.equal(validateAssetList(Array.from({ length: 9 }, (_, i) => `assets/x/f${i}.png`), "x").length, 1);
});

test("collectQuestionAssetRefs finds stem, option and explanation assets", () => {
  const refs = collectQuestionAssetRefs({
    assetPaths: ["assets/n/a.png"], explanationAssetPaths: ["assets/n/e.png"],
    options: [{ id: "a", assetPaths: ["assets/n/oa.png"] }, { id: "b" }]
  });
  assert.deepEqual(refs.map((r) => [r.kind, r.optionId ?? null, r.path]), [["question", null, "assets/n/a.png"], ["option", "a", "assets/n/oa.png"], ["explanation", null, "assets/n/e.png"]]);
  assert.deepEqual(validateQuestionAssets({ assetPaths: ["bad"], options: [{ id: "a", assetPaths: ["bad2"] }], explanationAssetPaths: ["bad3"] }, "Q").length, 3);
});

function visualPack() {
  const pack = syntheticPack({}, 2);
  const q = pack.questions[0]!;
  q.assetPaths = [OK];
  q.explanationAssetPaths = ["assets/test-ns/expl-1.png"];
  q.options = [
    { id: "a", text: "", order: 1, assetPaths: ["assets/test-ns/opt-a.png"] },
    { id: "b", text: "Option B", order: 2 },
    { id: "c", text: "Option C", order: 3, assetPaths: ["assets/test-ns/opt-c.png"] },
    { id: "d", text: "Option D", order: 4 }
  ];
  return pack;
}

test("university pack validator allows image-only option labels but still requires text otherwise and validates paths", () => {
  assert.deepEqual(validateQuestionPack(visualPack()).errors, []);
  const blank = visualPack(); blank.questions[0]!.options[1]!.text = "";
  assert.equal(validateQuestionPack(blank).errors.some((e) => e.includes("text is required")), true);
  const bad = visualPack(); bad.questions[0]!.options[0]!.assetPaths = ["../escape.png"];
  assert.equal(validateQuestionPack(bad).errors.some((e) => e.includes("option a") && e.includes("../escape.png")), true);
  const badExpl = visualPack(); badExpl.questions[0]!.explanationAssetPaths = ["nope.png"];
  assert.equal(validateQuestionPack(badExpl).errors.some((e) => e.includes("explanation")), true);
});

/** SYNTHETIC library fixture (test- ids). */
function visualLibraryPack(version = 1): LibraryPack {
  const q = (i: number) => ({
    id: `test-vq-${i}`, text: `Synthetic visual library question ${i}`, type: (i === 2 ? "multiple_choice" : "single_choice") as "single_choice" | "multiple_choice", category: "varsity" as const,
    subject: "Physics", options: ["a", "b", "c", "d"].map((id, n) => ({ id, text: id === "a" && i === 1 ? "" : `Opt ${id}${i}`, order: n + 1, ...(id === "a" && i === 1 ? { assetPaths: ["assets/test-ns/lib-opt-a.png"] } : {}) })),
    correctOptionIds: i === 2 ? ["b", "c"] : ["b"], answerVerificationStatus: "verified" as const, contentVerificationStatus: "verified" as const,
    ...(i === 1 ? { assetPaths: ["assets/test-ns/lib-stem.png"], explanationAssetPaths: ["assets/test-ns/lib-expl.png"] } : {}),
    unitIds: ["test-vu-1"], source: { documentId: "test-vdoc", pageNumber: i, questionNumber: i }
  });
  return {
    schemaVersion: 1, kind: "library", publisher: { id: "pub-aspect", slug: "aspect", name: "ASPECT" },
    book: { id: "test-vbook", title: "Synthetic Visual Bank", language: "en", targetCategory: "varsity", contentType: "question_bank", verificationStatus: "verified", contentVersion: version, licenseStatus: "owner_created", licenseNote: "Synthetic test fixture" },
    sourceDocuments: [{ id: "test-vdoc", filename: "synthetic.json", sourceType: "structured-data" }],
    units: [{ id: "test-vu-1", kind: "test", title: "Test 1", sortOrder: 1 }],
    questions: [q(1), q(2)]
  };
}

test("Library pack validator uses the same asset rules and allows image-only options", () => {
  assert.deepEqual(validateLibraryPack(visualLibraryPack()).errors, []);
  const bad = visualLibraryPack(); bad.questions[0]!.assetPaths = ["assets/x.png"];
  assert.equal(validateLibraryPack(bad).errors.some((e) => e.includes("test-vq-1") && e.includes("assets/x.png")), true);
  const badOpt = visualLibraryPack(); badOpt.questions[1]!.options[0]!.text = "";
  assert.equal(validateLibraryPack(badOpt).valid, false);
});

test("university pack: stem, option and explanation assets survive import into SQLite and load through the shared view", async () => {
  const db = await freshDb();
  const report = await importQuestionPack(db, visualPack());
  assert.equal(report.ok, true, JSON.stringify(report));
  const [q1, q2] = await loadQuestions(db, ["q-syn-1", "q-syn-2"]);
  assert.deepEqual(q1!.assetPaths, [OK]);
  assert.deepEqual(q1!.explanationAssetPaths, ["assets/test-ns/expl-1.png"]);
  assert.deepEqual(q1!.options.map((o) => o.assetPaths), [["assets/test-ns/opt-a.png"], [], ["assets/test-ns/opt-c.png"], []]);
  assert.equal(q1!.options[0]!.text, "");
  assert.deepEqual(q2!.assetPaths, []); assert.deepEqual(q2!.explanationAssetPaths, []);
  assert.deepEqual(q2!.options.map((o) => o.assetPaths), [[], [], [], []]);
});

test("LibraryPack: the same asset fields round-trip, multi-select coexists, and a changed asset is applied on update", async () => {
  const db = await freshDb();
  const r1 = await installLibraryPack(db, visualLibraryPack(1), { installState: "bundled" });
  assert.equal(r1.ok, true, JSON.stringify(r1.errors));
  const [a, b] = await loadQuestions(db, ["test-vq-1", "test-vq-2"]);
  assert.deepEqual(a!.assetPaths, ["assets/test-ns/lib-stem.png"]);
  assert.deepEqual(a!.explanationAssetPaths, ["assets/test-ns/lib-expl.png"]);
  assert.deepEqual(a!.options[0]!.assetPaths, ["assets/test-ns/lib-opt-a.png"]);
  assert.equal(b!.type, "multiple_choice");
  assert.deepEqual(b!.options.filter((o) => o.isCorrect).map((o) => o.key), ["b", "c"]);

  const v2 = visualLibraryPack(2);
  v2.questions[0]!.options[0]!.assetPaths = ["assets/test-ns/lib-opt-a-v2.png"];
  const r2 = await installLibraryPack(db, v2, { installState: "bundled" });
  assert.equal(r2.ok, true, JSON.stringify(r2.errors));
  assert.equal(r2.questions.updated, 1);
  const [a2] = await loadQuestions(db, ["test-vq-1"]);
  assert.deepEqual(a2!.options[0]!.assetPaths, ["assets/test-ns/lib-opt-a-v2.png"]);
});

/** Frozen copy of the pre-Phase-C hash formula: questions that use none of the new fields must hash exactly as before. */
function legacyHash(q: QuestionPackItem): string {
  const payload = JSON.stringify([
    q.text, q.type, q.category, q.subject ?? null, q.topic ?? null, q.answerVerificationStatus, q.contentVerificationStatus, q.explanation ?? null,
    (q.assetPaths ?? []).slice(), q.options.slice().sort((a, b) => a.order - b.order).map((o) => [o.id, o.text, o.order]),
    q.correctOptionIds ? q.correctOptionIds.slice().sort() : null
  ]);
  let h1 = 0x811c9dc5; let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i++) { const c = payload.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0") + payload.length.toString(16);
}

test("content hash is unchanged for existing questions and changes when option or explanation assets change", () => {
  const plain = syntheticPack({}, 1).questions[0]!;
  assert.equal(contentHash(plain), legacyHash(plain));
  const withStem = { ...plain, assetPaths: [OK] };
  assert.equal(contentHash(withStem), legacyHash(withStem));
  const withExpl = { ...plain, explanationAssetPaths: [OK] };
  assert.notEqual(contentHash(withExpl), contentHash(plain));
  const withOpt = { ...plain, options: plain.options.map((o, i) => (i === 0 ? { ...o, assetPaths: [OK] } : o)) };
  assert.notEqual(contentHash(withOpt), contentHash(plain));
  assert.notEqual(contentHash(withOpt), contentHash(withExpl));
});

test("migration v10 upgrades a v9 database: existing rows get NULL asset columns and stay readable", async () => {
  assert.equal(MIGRATIONS.some((m) => m.version === 10 && m.name === "option_and_explanation_assets"), true);
  const db = openMemoryDb();
  await migrate(db, MIGRATIONS.filter((m) => m.version <= 9));
  assert.equal((await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version, 9);
  // Seed a pre-v10 question with raw SQL (the importer already targets v10 columns).
  db.raw.exec("PRAGMA foreign_keys = OFF");
  db.raw.exec("INSERT INTO question_batches (id, category, description, schema_version, imported_at, updated_at) VALUES ('old-batch', 'varsity', 'old', 1, 0, 0)");
  db.raw.exec("INSERT INTO questions (id, batch_id, category, text, type, answer_status, content_status, asset_paths, content_hash) VALUES ('old-q', 'old-batch', 'varsity', 'Old question', 'single_choice', 'verified', 'verified', '[\"assets/lokkho/old.png\"]', 'h')");
  db.raw.exec("INSERT INTO question_options (question_id, option_key, text, sort_order, is_correct) VALUES ('old-q', 'a', 'A', 1, 1), ('old-q', 'b', 'B', 2, 0)");
  await migrate(db, MIGRATIONS.filter((m) => m.version <= 10));
  assert.equal((await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version, 10);
  const rows = await db.getAllAsync<{ explanation_asset_paths: string | null }>("SELECT explanation_asset_paths FROM questions");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.explanation_asset_paths, null);
  const opts = await db.getAllAsync<{ asset_paths: string | null }>("SELECT asset_paths FROM question_options");
  assert.equal(opts.length, 2);
  assert.equal(opts.every((o) => o.asset_paths === null), true);
  const [q] = await loadQuestions(db, ["old-q"]);
  assert.deepEqual(q!.assetPaths, ["assets/lokkho/old.png"]);
  assert.deepEqual(q!.explanationAssetPaths, []);
  assert.deepEqual(q!.options.map((o) => o.assetPaths), [[], []]);
});

test("figure aspect ratio is clamped and falls back safely", () => {
  assert.equal(figureAspectRatio(undefined, undefined), DEFAULT_FIGURE_ASPECT);
  assert.equal(figureAspectRatio(0, 10), DEFAULT_FIGURE_ASPECT);
  assert.equal(figureAspectRatio(400, 200), 2);
  assert.equal(figureAspectRatio(10000, 10), MAX_FIGURE_ASPECT);
  assert.equal(figureAspectRatio(10, 10000), MIN_FIGURE_ASPECT);
});
