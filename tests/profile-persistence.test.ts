import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDbAt, syntheticPack } from "./helpers.ts";
import { migrate } from "../src/db/schema.ts";
import { runStartup } from "../src/services/startup.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { activitySummary, getProfile, saveDisplayName, toggleBookmark, updateProfile } from "../src/repositories/userData.ts";

const hooks = (packs: readonly unknown[] = []) => ({ report: () => undefined, yieldToUi: async () => undefined, loadPacks: async () => packs });

test("profile name survives closing and reopening the same database file (simulated app restart + returning startup)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bd-profile-"));
  const file = join(dir, "bd-admission.db");
  try {
    const first = openDbAt(file);
    first.raw.exec("PRAGMA journal_mode = WAL;");
    await runStartup(first, hooks([syntheticPack()]));
    assert.equal(await saveDisplayName(first, "  Rahim Uddin  ", 10), "Rahim Uddin");
    await updateProfile(first, { language: "en", flashSeconds: 45 });
    await toggleBookmark(first, "q-syn-1", 20);
    first.raw.close();

    // Normal returning-user startup: migrations + ensureProfile + content sync must not reset anything.
    for (let launch = 0; launch < 2; launch++) {
      const again = openDbAt(file);
      again.raw.exec("PRAGMA journal_mode = WAL;");
      await runStartup(again, hooks([syntheticPack()]));
      const p = await getProfile(again);
      assert.equal(p.displayName, "Rahim Uddin");
      assert.equal(p.language, "en");
      assert.equal(p.flashSeconds, 45);
      assert.equal((await activitySummary(again)).bookmarks, 1);
      again.raw.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("saveDisplayName trims, caps at 60 characters, can clear the name and reads back the stored value", async () => {
  const db = openDbAt(":memory:");
  await migrate(db);
  assert.equal(await saveDisplayName(db, "x".repeat(80)), "x".repeat(60));
  assert.equal(await saveDisplayName(db, "   "), "");
  assert.equal((await getProfile(db)).displayName, "");
});

test("saveDisplayName reports a failed write instead of assuming success", async () => {
  const db = openDbAt(":memory:");
  await migrate(db);
  db.raw.exec("CREATE TRIGGER block_name BEFORE UPDATE OF display_name ON user_profile BEGIN SELECT RAISE(IGNORE); END;");
  await assert.rejects(saveDisplayName(db, "Blocked"), /not persisted/);
  assert.equal((await getProfile(db)).displayName, "");
});

test("a content re-import never touches the profile", async () => {
  const db = openDbAt(":memory:");
  await migrate(db);
  await saveDisplayName(db, "Keep");
  assert.equal((await importQuestionPack(db, syntheticPack())).ok, true);
  assert.equal((await getProfile(db)).displayName, "Keep");
});
