#!/usr/bin/env node
// Library query benchmark (Node + node:sqlite, host-side). Measures the real repository functions used by the Library
// journeys against a TEMP COPY of the bundled seed. Absolute numbers are NOT phone numbers; compare before/after ratios.
//   node scripts/bench-library.mjs [--out=file.json] [--runs=5]
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as content from "../src/repositories/content.ts";
import * as library from "../src/repositories/library.ts";
import { openNodeDb } from "./lib/node-sqlite-db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const seed = resolve(here, "../assets/content/content_seed.db");
const arg = (n, d) => (process.argv.find((a) => a.startsWith("--" + n + "=")) ?? "").split("=")[1] ?? d;
const runs = Number(arg("runs", 5));
const outFile = arg("out", "");

const tmp = mkdtempSync(join(tmpdir(), "bench-library-"));
const file = join(tmp, "seed.db");
copyFileSync(seed, file);
const db = openNodeDb(file);

const BOOK = "aspect-ru-question-bank-verified-sets";
const SESSION = "aspect-ru-qb-s-2024-2025";
const SET = "aspect-ru-qb-t-2024-2025-a-p001";
const book = { bookId: BOOK };
const session = { bookId: BOOK, unitId: SESSION };
const set = { bookId: BOOK, unitId: SET };

// The Flash setup fallback: verified pool, then (only if empty) the provisional pool. Uses the single-pass helper when it exists.
async function flashSetup(scope) {
  if (typeof content.countFlashPool === "function") return content.countFlashPool(db, scope);
  const verified = await content.countPoolBySubject(db, scope, false);
  if (verified.total > 0) return verified;
  const candidates = await content.countPoolBySubject(db, scope, true);
  return candidates.total > 0 ? await content.countPoolBySubject(db, scope, true) : verified;
}

const journeys = {
  "library landing (publishers+books)": async () => { await library.listPublishers(db); await library.listAllBooks(db); },
  "book detail (getBook+listUnits)": async () => { await library.getBook(db, BOOK); await library.listUnits(db, BOOK); },
  "flash setup / whole book": () => flashSetup(book),
  "flash setup / session": () => flashSetup(session),
  "flash setup / set": () => flashSetup(set),
  "custom practice setup / book (pool ids)": () => content.practiceQuestionIds(db, book, true),
  "browse entry / book (subject counts)": () => content.countQuestionsBySubject(db, book),
  "browse entry / session (subject counts)": () => content.countQuestionsBySubject(db, session),
  "browse first page / book (20 ids)": () => library.listBookQuestionIds(db, { bookId: BOOK }, 20, 0),
  "browse first page / session (20 ids)": () => library.listBookQuestionIds(db, { bookId: BOOK, unitId: SESSION }, 20, 0),
  "load 20 question views": async () => content.loadQuestions(db, await library.listBookQuestionIds(db, { bookId: BOOK }, 20, 0))
};

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const result = {};
for (const [name, fn] of Object.entries(journeys)) {
  await fn(); // warm the page cache/statement cache
  const times = [];
  for (let i = 0; i < runs; i++) { const t = performance.now(); await fn(); times.push(performance.now() - t); }
  result[name] = { medianMs: Math.round(median(times) * 100) / 100, minMs: Math.round(Math.min(...times) * 100) / 100 };
}
const counts = {
  verifiedBook: (await content.countPoolBySubject(db, book, false)).total,
  provisionalBook: (await content.countPoolBySubject(db, book, true)).total,
  browseBook: (await content.countQuestionsBySubject(db, book)).total,
  session2024: (await content.countQuestionsBySubject(db, session)).total
};
console.log(JSON.stringify({ runs, counts, result }, null, 2));
if (outFile) writeFileSync(outFile, JSON.stringify({ runs, counts, result }, null, 2));
db.raw.close();
rmSync(tmp, { recursive: true, force: true });
