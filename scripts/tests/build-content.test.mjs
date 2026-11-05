import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { buildContent, renderManifest } from "../build-content.mjs";
import { syntheticPack } from "../../tests/helpers.ts";

function packFor(n) {
  const text = JSON.stringify(syntheticPack({}, 2))
    .replaceAll("batch-syn", `batch-syn-${n}`)
    .replaceAll("src-syn", `src-syn-${n}`)
    .replaceAll("inst-syn", `inst-syn-${n}`)
    .replaceAll("paper-syn-2025", `paper-syn-${n}-2025`)
    .replaceAll("rule-syn", `rule-syn-${n}`)
    .replaceAll("q-syn-", `q-syn-${n}-`)
    .replaceAll('"code":"SYN"', `"code":"SYN${n}"`);
  return JSON.parse(text);
}

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "bd-content-"));
  const packDir = join(dir, "packs");
  return { dir, files: { packDir, manifestFile: join(dir, "bundledManifest.ts"), seedFile: join(dir, "seed", "content-seed.db") } };
}

async function setup(packCount = 3) {
  const w = workspace();
  mkdirSync(w.files.packDir, { recursive: true });
  for (let i = 1; i <= packCount; i++) writeFileSync(join(w.files.packDir, `p${i}.json`), JSON.stringify(packFor(i)));
  return w;
}

const seedIdOf = (file) => {
  const db = new DatabaseSync(file, { readOnly: true });
  try { return db.prepare("SELECT value FROM seed_meta WHERE key = 'seed_id'").get().value; } finally { db.close(); }
};

test("content build writes a deterministic manifest and a seed carrying the same seed id", async () => {
  const w = await setup();
  try {
    const first = await buildContent(w.files);
    assert.equal(first.ok, true);
    assert.equal(first.seedBuilt, true);
    const manifestText = readFileSync(w.files.manifestFile, "utf8");
    assert.equal(manifestText, renderManifest(first.manifest));
    assert.equal(first.manifest.packs.length, 3);
    assert.equal(seedIdOf(w.files.seedFile), first.manifest.seedId);

    await buildContent(w.files);
    assert.equal(readFileSync(w.files.manifestFile, "utf8"), manifestText, "rebuilding identical content yields an identical manifest");
  } finally { rmSync(w.dir, { recursive: true, force: true }); }
});

test("--ensure is a no-op when current, and rebuilds when the seed is missing or the data changed", async () => {
  const w = await setup();
  try {
    await buildContent(w.files);
    assert.equal((await buildContent({ ...w.files, ensure: true })).seedBuilt, false);

    rmSync(w.files.seedFile);
    assert.equal((await buildContent({ ...w.files, ensure: true })).seedBuilt, true);
    assert.ok(existsSync(w.files.seedFile));

    const changed = packFor(2);
    changed.questions[0].text = "Changed wording";
    writeFileSync(join(w.files.packDir, "p2.json"), JSON.stringify(changed));
    const before = seedIdOf(w.files.seedFile);
    const rebuilt = await buildContent({ ...w.files, ensure: true });
    assert.equal(rebuilt.seedBuilt, true);
    assert.notEqual(seedIdOf(w.files.seedFile), before);
  } finally { rmSync(w.dir, { recursive: true, force: true }); }
});

test("--check reports stale output without writing anything", async () => {
  const w = await setup();
  try {
    assert.equal((await buildContent({ ...w.files, check: true })).ok, false, "nothing built yet");
    assert.equal(existsSync(w.files.manifestFile), false, "check never writes");

    await buildContent(w.files);
    assert.equal((await buildContent({ ...w.files, check: true })).ok, true);

    const changed = packFor(1);
    changed.questions[1].text = "Edited after the build";
    writeFileSync(join(w.files.packDir, "p1.json"), JSON.stringify(changed));
    const manifestBefore = readFileSync(w.files.manifestFile, "utf8");
    const stale = await buildContent({ ...w.files, check: true });
    assert.equal(stale.ok, false);
    assert.equal(stale.stale.length, 2, "manifest and seed are both out of date");
    assert.equal(readFileSync(w.files.manifestFile, "utf8"), manifestBefore);
  } finally { rmSync(w.dir, { recursive: true, force: true }); }
});

test("--check detects a logically damaged SQLite seed and --ensure repairs it", async () => {
  const w = await setup();
  try {
    await buildContent(w.files);
    const damaged = new DatabaseSync(w.files.seedFile);
    try {
      // The SQLite file remains structurally valid, but one pack's content no longer matches its checkpoint.
      damaged.prepare("DELETE FROM questions WHERE batch_id = ?").run("batch-syn-2");
    } finally { damaged.close(); }

    const checked = await buildContent({ ...w.files, check: true });
    assert.equal(checked.ok, false);
    assert.ok(checked.problems.some((p) => p.includes("seed table questions") || p.includes("seed content for batch-syn-2")));

    const repaired = await buildContent({ ...w.files, ensure: true });
    assert.equal(repaired.ok, true);
    assert.equal(repaired.seedBuilt, true);
    assert.equal((await buildContent({ ...w.files, check: true })).ok, true);
  } finally { rmSync(w.dir, { recursive: true, force: true }); }
});

test("invalid or duplicate packs stop the build before anything is written", async () => {
  const w = await setup(2);
  try {
    writeFileSync(join(w.files.packDir, "bad.json"), JSON.stringify({ schemaVersion: 9 }));
    const bad = await buildContent(w.files);
    assert.equal(bad.ok, false);
    assert.ok(bad.problems.some((p) => p.startsWith("bad.json:")));
    assert.equal(existsSync(w.files.manifestFile), false);
    assert.equal(existsSync(w.files.seedFile), false);

    rmSync(join(w.files.packDir, "bad.json"));
    writeFileSync(join(w.files.packDir, "dup.json"), JSON.stringify(packFor(1)));
    const dup = await buildContent(w.files);
    assert.equal(dup.ok, false);
    assert.ok(dup.problems.some((p) => /Duplicate batch id/.test(p)));
    assert.equal(existsSync(w.files.seedFile), false);
  } finally { rmSync(w.dir, { recursive: true, force: true }); }
});
