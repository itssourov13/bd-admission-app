#!/usr/bin/env node
// Startup benchmark (Node + node:sqlite). Compares the previous per-row JS import with the seed-copy path using the
// same instrumentation the app uses. Absolute numbers are NOT phone numbers (a phone's JS engine and storage are much
// slower); use the RATIOS and the per-phase breakdown. Requires a built seed: pnpm content:build.
//
//   node scripts/bench-startup.mjs [--legacy-packs=25]
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "../src/db/schema.ts";
import { importQuestionPack, packSignature } from "../src/services/importer.ts";
import { syncBundledPacks } from "../src/services/contentSync.ts";
import { syncFromSeed } from "../src/services/seedSync.ts";
import { createStartupMetrics } from "../src/services/perf.ts";
import { openNodeDb } from "./lib/node-sqlite-db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const packDir = resolve(here, "../data/question-packs");
const seedFile = resolve(here, "../assets/content/content_seed.db");
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
};
const legacyPacks = arg("legacy-packs", 25);

const files = readdirSync(packDir).filter((f) => f.endsWith(".json")).sort();
const loadStart = performance.now();
const packs = files.map((f) => JSON.parse(readFileSync(join(packDir, f), "utf8")));
const loadMs = performance.now() - loadStart;
const questionsOf = (list) => list.reduce((s, p) => s + p.questions.length, 0);
const totalQuestions = questionsOf(packs);
const dir = mkdtempSync(join(tmpdir(), "bd-bench-"));
const line = (label, ms, extra = "") => console.log(`${label.padEnd(46)} ${ms.toFixed(0).padStart(8)} ms  ${extra}`);

console.log(`packs=${packs.length} questions=${totalQuestions} json load/parse=${loadMs.toFixed(0)} ms (the app pays this evaluating the bundled JSON module)`);

// Returning-launch cost of the previous design: hash every pack (the old sync did this once, the importer a second time).
let t = performance.now();
for (const p of packs) packSignature(p);
line("previous returning launch: signatures only", performance.now() - t, "(JSON.stringify + hash of all packs)");

// Previous first launch, measured on a sample and extrapolated by question count.
{
  const sample = packs.slice(0, Math.min(legacyPacks, packs.length));
  const db = openNodeDb(join(dir, "legacy.db"));
  db.raw.exec("PRAGMA journal_mode = WAL");
  await migrate(db);
  const metrics = createStartupMetrics();
  t = performance.now();
  await syncBundledPacks(db, sample, Date.now(), undefined, metrics);
  const ms = performance.now() - t;
  const scaled = (ms / questionsOf(sample)) * totalQuestions;
  line(`previous first launch (sample ${sample.length} packs)`, ms, `${questionsOf(sample)} questions`);
  line("  extrapolated to all packs", scaled);
  const s = metrics.snapshot().spans;
  for (const k of ["sync.signature", "import.validate", "import.signature", "import.tx"]) if (s[k]) console.log(`    ${k.padEnd(20)} ${s[k].ms.toFixed(0).padStart(7)} ms over ${s[k].calls} call(s)`);
  db.raw.close();
}

// New first launch: full seed copy.
{
  const db = openNodeDb(join(dir, "seed.db"));
  db.raw.exec("PRAGMA journal_mode = WAL");
  await migrate(db);
  const { BUNDLED_MANIFEST } = await import("../src/content/bundledManifest.ts");
  const metrics = createStartupMetrics();
  const openSeed = async () => ({ path: seedFile, release: async () => undefined });
  t = performance.now();
  const outcomes = await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed, metrics });
  const ms = performance.now() - t;
  const failed = outcomes.filter((o) => o.status === "failed");
  line(`NEW first launch: seed copy, all ${packs.length} packs`, ms, failed.length ? `FAILED: ${failed.length}` : "ok");
  for (const [k, v] of Object.entries(metrics.snapshot().spans)) console.log(`    ${k.padEnd(28)} ${v.ms.toFixed(0).padStart(7)} ms over ${v.calls} call(s) (max ${v.maxMs.toFixed(0)})`);
  // New returning launch: nothing pending, seed not even opened.
  let opened = 0;
  t = performance.now();
  await syncFromSeed(db, { manifest: BUNDLED_MANIFEST, openSeed: async () => { opened++; return { path: seedFile, release: async () => undefined }; } });
  line("NEW returning launch (signature compare only)", performance.now() - t, `seed copies: ${opened}`);
  db.raw.close();
}
console.log(`seed asset: ${(statSync(seedFile).size / 1048576).toFixed(2)} MiB, raw pack JSON: ${(files.reduce((s, f) => s + statSync(join(packDir, f)).size, 0) / 1048576).toFixed(2)} MiB`);
rmSync(dir, { recursive: true, force: true });
