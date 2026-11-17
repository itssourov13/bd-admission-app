import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { freshDb } from "./helpers.ts";
import { installLibraryPack } from "../src/services/libraryImporter.ts";
import { validateLibraryPack } from "../src/services/libraryPackValidator.ts";
import { getBook, listAllBooks, listBookQuestionIds, listPublishers, listUnits } from "../src/repositories/library.ts";

// Isolated dry-run of the prepared RU-V/ASPECT Library pack into an IN-MEMORY database. The pack lives in the external
// staging workspace, so this skips (not fails) when that workspace is absent. It never touches the active database.
const STAGING = process.env.RUV_STAGING ?? "/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging";
const PACK = `${STAGING}/library-pack/ruv-aspect-library-pack.json`;
const present = existsSync(PACK);

test("RU-V ASPECT pack: validates and dry-runs into an isolated database", { skip: !present && "staging pack not present" }, async () => {
  const text = readFileSync(PACK, "utf8");
  const manifest = JSON.parse(readFileSync(`${STAGING}/library-pack/manifest.json`, "utf8"));
  assert.equal(createHash("sha256").update(text).digest("hex"), manifest.packSha256, "pack matches its manifest hash");
  const pack = JSON.parse(text);

  const v = validateLibraryPack(pack);
  assert.deepEqual(v.errors, []);
  assert.equal(v.valid, true);
  // pending rights are informational only
  assert.ok(v.warnings.some((w) => w.includes("permission_pending")));

  const db = await freshDb();
  const before = await listPublishers(db);
  const report = await installLibraryPack(db, pack);
  assert.deepEqual(report.errors, []);
  assert.equal(report.ok, true);
  assert.equal(report.questions.inserted, 1828);
  assert.equal(report.units, 26);

  const book = await getBook(db, pack.book.id);
  assert.ok(book);
  assert.equal(book.collection, "ASPECT");
  assert.equal(book.licenseStatus, "permission_pending");
  assert.equal(book.rightsHolder, null);
  // ASPECT is a collection, never claimed as the publisher; the unidentified publisher row is the owner.
  const after = await listPublishers(db);
  assert.equal(after.length, before.length + 1);
  const pub = after.find((p) => p.id === "pub-unidentified");
  assert.ok(pub);
  assert.equal(pub.name, "Unknown / not identified");
  assert.equal((await listAllBooks(db)).length, 1);

  // 17 source-set units + 9 sessions
  const units = await listUnits(db, pack.book.id);
  assert.equal(units.length, 26);
  const setUnits = units.filter((u) => u.parentId !== null);
  assert.equal(setUnits.length, 17);

  // whole-book listing reaches every question in printed order; a set unit reaches exactly its own questions
  assert.equal((await listBookQuestionIds(db, { bookId: pack.book.id }, 5000, 0)).length, 1828);
  for (const u of setUnits) {
    const expected = pack.questions.filter((q: { unitIds: string[] }) => q.unitIds[0] === u.id).length;
    assert.equal((await listBookQuestionIds(db, { bookId: pack.book.id, unitId: u.id }, 5000, 0)).length, expected, u.id);
  }
  const rows = await db.getFirstAsync<{ n: number; s: number; w: number; a: number }>(
    "SELECT COUNT(*) AS n, SUM(answer_status='verified') AS s, SUM(explanation IS NOT NULL) AS w, SUM(asset_paths IS NOT NULL) AS a FROM questions WHERE batch_id = ?",
    [`lib-${pack.book.id}`]
  );
  assert.deepEqual({ n: rows?.n, s: rows?.s, w: rows?.w, a: rows?.a }, { n: 1828, s: 1775, w: 1825, a: 20 });
  // none of the retired legacy ids were reintroduced
  const legacy = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE id LIKE 'ru-vq-%'");
  assert.equal(legacy?.n, 0);

  // idempotent re-install of the same version changes nothing
  const again = await installLibraryPack(db, pack);
  assert.equal(again.ok, true);
  assert.equal(again.questions.inserted, 0);
});
