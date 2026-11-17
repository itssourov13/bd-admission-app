#!/usr/bin/env node
// Creates / verifies the external archive of the RU-V verified question packs (15 batch files = 17 printed source sets).
//   node scripts/archive-ruv.mjs --create [--dest DIR]
//   node scripts/archive-ruv.mjs --verify [--dest DIR]
// --create refuses to overwrite and never deletes. Pack files are copied byte-identical; figure crops staged by
// bd-admission-app-data/ruv-work/crop_figures.py (figures/, FIGURE_INVENTORY.json) are included in the manifest.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packsDir = resolve(here, "../data/question-packs");
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const dest = resolve(arg("--dest") ?? "/home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive");
const ruvWork = "/home/kali/gpt-workspace/bd-admission-app-data/ruv-work";
const SOURCE_PDF = "/home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf";
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const isRuv = (f) => /^ru-vq-.*\.json$/.test(f);
const META = ["MANIFEST.json", "SHA256SUMS", "README.md"];

function walk(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), base) : [relative(base, join(dir, e.name)).split("\\").join("/")]);
}

function stats(packFiles, root) {
  let questions = 0, single = 0, multiple = 0, noCorrect = 0, nonVerified = 0;
  for (const f of packFiles) {
    const j = JSON.parse(readFileSync(join(root, f), "utf8"));
    for (const q of j.questions) {
      questions++;
      if (q.type === "multiple_choice") multiple++; else single++;
      if ((q.correctOptionIds ?? []).length === 0) noCorrect++;
      if (q.answerVerificationStatus !== "verified" || q.contentVerificationStatus !== "verified") nonVerified++;
    }
  }
  return { packs: packFiles.length, questions, singleChoice: single, multipleChoice: multiple, singleChoiceWithNoCorrectOption: noCorrect, notFullyVerified: nonVerified };
}

/** 17 printed source sets from the extraction workspace, assigned to the batch file that starts on or before their page. */
function printedSets(packFiles) {
  const p = join(ruvWork, "raw_questions.json");
  if (!existsSync(p)) return [];
  const starts = packFiles.map((f) => ({ f, page: Number(/-p(\d{3})\.json$/.exec(f)?.[1]) })).sort((a, b) => a.page - b.page);
  return JSON.parse(readFileSync(p, "utf8")).exams.map((e) => {
    const pack = [...starts].reverse().find((s) => s.page <= e.page);
    return { examIndex: e.idx, pdfPage: e.page, title: e.title_lines.join(" | "), packFile: pack?.f };
  });
}

function verify(root) {
  const errors = [];
  const manifest = JSON.parse(readFileSync(join(root, "MANIFEST.json"), "utf8"));
  const actual = new Set(walk(root).filter((p) => !META.includes(p)));
  for (const e of manifest.files) {
    const p = join(root, e.path);
    if (!existsSync(p)) { errors.push(`missing ${e.path}`); continue; }
    if (statSync(p).size !== e.bytes) errors.push(`size mismatch ${e.path}`);
    if (sha(p) !== e.sha256) errors.push(`sha256 mismatch ${e.path}`);
    actual.delete(e.path);
  }
  for (const extra of actual) errors.push(`unlisted file ${extra}`);
  const packFiles = manifest.files.filter((e) => e.kind === "pack").map((e) => e.path.replace("question-packs/", ""));
  const s = stats(packFiles, join(root, "question-packs"));
  for (const k of Object.keys(manifest.summary.counts)) if (manifest.summary.counts[k] !== s[k]) errors.push(`count ${k}: manifest ${manifest.summary.counts[k]} vs files ${s[k]}`);
  const inv = JSON.parse(readFileSync(join(root, "FIGURE_INVENTORY.json"), "utf8"));
  for (const e of inv) if (e.assetPath && !existsSync(join(root, e.assetPath))) errors.push(`inventory asset missing ${e.assetPath}`);
  return { errors, ...s, figures: inv.length, files: manifest.files.length, printedSets: manifest.summary.printedSets.length };
}

if (process.argv.includes("--verify")) {
  const r = verify(dest);
  console.log(JSON.stringify({ dest, ...r, errors: r.errors.length ? r.errors : undefined, ok: r.errors.length === 0 }, null, 2));
  process.exit(r.errors.length ? 1 : 0);
}
if (!process.argv.includes("--create")) { console.error("use --create or --verify"); process.exit(2); }
if (existsSync(join(dest, "MANIFEST.json"))) { console.error(`archive already exists at ${dest}; refusing to overwrite`); process.exit(3); }

const packFiles = readdirSync(packsDir).filter(isRuv).sort();
const entries = [];
const record = (kind, rel, abs) => entries.push({ kind, path: rel, bytes: statSync(abs).size, sha256: sha(abs) });
for (const f of packFiles) {
  const out = join(dest, "question-packs", f);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(join(packsDir, f), out);
  record("pack", `question-packs/${f}`, out);
}
if (!existsSync(join(dest, "FIGURE_INVENTORY.json"))) { console.error("FIGURE_INVENTORY.json is missing; run ruv-work/crop_figures.py first"); process.exit(4); }
record("figure-inventory", "FIGURE_INVENTORY.json", join(dest, "FIGURE_INVENTORY.json"));
for (const p of walk(join(dest, "figures")).sort()) record("figure", `figures/${p}`, join(dest, "figures", p));

const counts = stats(packFiles, packsDir);
const sets = printedSets(packFiles);
const pdfSha = existsSync(SOURCE_PDF) ? sha(SOURCE_PDF) : undefined;
const summary = { counts, printedSets: sets, sourcePdf: { path: SOURCE_PDF, sha256: pdfSha, note: "referenced, not duplicated" }, extractionWorkspace: ruvWork };
const readme = `# RU-V verified question pack archive

External, immutable copy of the RU-V ("ru-vq-*") verified question packs removed from the BD Admission App. Separate from, and not to be mixed with, the unverified RU Lokkho archive (\`../lokkho-archive/\`).

## Inventory
- ${counts.packs} pack JSON files = ${sets.length || 17} printed source sets (a batch file can hold more than one printed set; the 2021-22 and 2022-23 batches hold two sets each).
- ${counts.questions} verified questions: ${counts.singleChoice} single-choice records (including ${counts.singleChoiceWithNoCorrectOption} verified no-correct-option records) and ${counts.multipleChoice} multiple-choice records.
- Figures: \`figures/\` holds 200 dpi crops of the ${JSON.parse(readFileSync(join(dest, "FIGURE_INVENTORY.json"), "utf8")).length} figure-dependent questions cropped from the original PDF. \`FIGURE_INVENTORY.json\` maps each question id to its source document, PDF page, printed number, representation, crop box and provenance. The pack files do NOT reference these assets (packs are byte-identical to the app copies); attach them as \`assetPaths\` when importing.

## Provenance
- Original PDF (referenced, not copied): \`${SOURCE_PDF}\`, sha256 \`${pdfSha}\`.
- Extraction/reconciliation workspace (referenced, not copied): \`${ruvWork}/\` (PROGRESS.md, raw_questions.json, PACK_RECONCILIATION.csv, EXCLUSION_MANIFEST.csv).
- 154 source records were excluded from packs (written part 36, option text missing 26, incomplete options 90, answer marker missing 2).

## Integrity
\`MANIFEST.json\` lists every file with size and SHA-256; \`SHA256SUMS\` is \`sha256sum -c\` compatible. Verify with \`node scripts/archive-ruv.mjs --verify\` from the app repo (at the commit that created it) or \`sha256sum -c SHA256SUMS\` here.

## Printed source sets
${sets.map((s) => `- exam ${s.examIndex}: PDF p.${s.pdfPage} — ${s.title} — batch \`${s.packFile}\``).join("\n")}
`;
writeFileSync(join(dest, "README.md"), readme);
writeFileSync(join(dest, "MANIFEST.json"), JSON.stringify({ archive: "ru-v-verified-pack-archive", createdFrom: "bd-admission-app data/question-packs", summary, files: entries }, null, 2) + "\n");
writeFileSync(join(dest, "SHA256SUMS"), entries.map((e) => `${e.sha256}  ${e.path}`).join("\n") + "\n");
const r = verify(dest);
console.log(JSON.stringify({ dest, counts, printedSets: sets.length, verify: { ok: r.errors.length === 0, errors: r.errors } }, null, 2));
process.exit(r.errors.length ? 1 : 0);
