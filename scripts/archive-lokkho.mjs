#!/usr/bin/env node
// Copies the RU Lokkho candidate packs + referenced assets to an external archive,
// writes MANIFEST.json / SHA256SUMS, and verifies them. Never deletes anything.
//   node scripts/archive-lokkho.mjs --create [--dest DIR]
//   node scripts/archive-lokkho.mjs --verify [--dest DIR]
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packsDir = resolve(here, "../data/question-packs");
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const dest = resolve(arg("--dest") ?? "/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive");
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const isLokkhoPack = (f) => /^ru-c-.*\.json$/.test(f);

function walk(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), base) : [relative(base, join(dir, e.name)).split("\\").join("/")]);
}

function collectRefs(packRoot) {
  const refs = [];
  for (const f of readdirSync(packRoot).filter(isLokkhoPack)) {
    const j = JSON.parse(readFileSync(join(packRoot, f), "utf8"));
    for (const q of j.questions) {
      const lists = [q.assetPaths ?? [], ...(q.options ?? []).map((o) => o.assetPaths ?? [])];
      for (const l of lists) for (const a of l) refs.push({ pack: f, question: q.id, path: a });
    }
  }
  return refs;
}

function verify(root) {
  const errors = [];
  const manifest = JSON.parse(readFileSync(join(root, "MANIFEST.json"), "utf8"));
  const actual = new Set(walk(root).filter((p) => !["MANIFEST.json", "SHA256SUMS", "README.md"].includes(p)));
  for (const e of manifest.files) {
    const p = join(root, e.path);
    if (!existsSync(p)) { errors.push(`missing ${e.path}`); continue; }
    if (statSync(p).size !== e.bytes) errors.push(`size mismatch ${e.path}`);
    if (sha(p) !== e.sha256) errors.push(`sha256 mismatch ${e.path}`);
    actual.delete(e.path);
  }
  for (const extra of actual) errors.push(`unlisted file ${extra}`);
  const qp = join(root, "question-packs");
  const refs = collectRefs(qp);
  for (const r of refs) if (!existsSync(join(qp, r.path))) errors.push(`unresolved asset ${r.path} (${r.pack}:${r.question})`);
  const packs = manifest.files.filter((e) => e.kind === "pack").length;
  const assets = manifest.files.filter((e) => e.kind === "asset").length;
  return { errors, packs, assets, refs: refs.length, uniqueRefs: new Set(refs.map((r) => r.path)).size, questions: manifest.summary.questions };
}

if (process.argv.includes("--verify")) {
  const r = verify(dest);
  console.log(JSON.stringify({ dest, ...r, errors: r.errors.length ? r.errors : undefined, ok: r.errors.length === 0 }, null, 2));
  process.exit(r.errors.length ? 1 : 0);
}

if (!process.argv.includes("--create")) { console.error("use --create or --verify"); process.exit(2); }
if (existsSync(join(dest, "MANIFEST.json"))) { console.error(`archive already exists at ${dest}; refusing to overwrite`); process.exit(3); }

const packFiles = readdirSync(packsDir).filter(isLokkhoPack).sort();
const refs = collectRefs(packsDir);
const assetSet = [...new Set(refs.map((r) => r.path))].sort();
const missing = assetSet.filter((a) => !existsSync(join(packsDir, a)));
if (missing.length) { console.error("missing source assets:", missing); process.exit(4); }

const entries = [];
const put = (kind, rel) => {
  const src = join(packsDir, rel);
  const out = join(dest, "question-packs", rel);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(src, out);
  entries.push({ kind, path: `question-packs/${rel}`, bytes: statSync(src).size, sha256: sha(src) });
};
let questions = 0, unverified = 0;
for (const f of packFiles) {
  put("pack", f);
  const j = JSON.parse(readFileSync(join(packsDir, f), "utf8"));
  questions += j.questions.length;
  unverified += j.questions.filter((q) => q.answerVerificationStatus !== "verified").length;
}
for (const a of assetSet) put("asset", a);
put("provenance", "README.md");

const summary = { packs: packFiles.length, questions, questionsNotAnswerVerified: unverified, assetReferences: refs.length, uniqueAssets: assetSet.length, status: "UNVERIFIED third-party candidate data; not ASPECT, not RU-V" };
writeFileSync(join(dest, "MANIFEST.json"), JSON.stringify({ archive: "ru-lokkho-candidate-archive", createdFrom: "bd-admission-app data/question-packs", summary, files: entries }, null, 2) + "\n");
writeFileSync(join(dest, "SHA256SUMS"), entries.map((e) => `${e.sha256}  ${e.path}`).join("\n") + "\n");
writeFileSync(join(dest, "README.md"), `# RU Lokkho candidate archive\n\nExternal, immutable archive of the RU Lokkho (third-party, unverified) candidate question packs removed from the BD Admission App bundle.\n\n- Packs: ${summary.packs}\n- Candidate questions: ${summary.questions} (answer-unverified: ${summary.questionsNotAnswerVerified})\n- Asset references: ${summary.assetReferences} (unique files: ${summary.uniqueAssets})\n- Layout mirrors \`data/question-packs/\`; asset paths such as \`assets/lokkho/x.png\` resolve relative to \`question-packs/\`.\n- Integrity: \`MANIFEST.json\` (path, bytes, SHA-256) and \`SHA256SUMS\` (\`sha256sum -c SHA256SUMS\` from this directory).\n\nStatus: ${summary.status}. Never treat these answers as verified, never import into ASPECT, never merge with RU-V. Kept only for optional future comparison (e.g., against Muse's separately prepared pack).\n`);
const r = verify(dest);
console.log(JSON.stringify({ dest, summary, verify: { ok: r.errors.length === 0, errors: r.errors } }, null, 2));
process.exit(r.errors.length ? 1 : 0);
