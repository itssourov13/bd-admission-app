#!/usr/bin/env node
// Builds the Library pack for RU-V / ASPECT from the staging workspace. Deterministic, read-only on the staging
// inputs, writes only <staging>/library-pack/.
//   node scripts/ruv-aspect-build-pack.mjs             build into the staging workspace only
//   node scripts/ruv-aspect-build-pack.mjs --publish   also copy the verified pack + figure assets into the app repo
//                                                      (data/library-packs, data/question-packs/assets/ruv-aspect), where the
//                                                      shared content build bundles them into the offline seed.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STAGING = process.env.RUV_STAGING ?? "/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging";
const OUT = join(STAGING, "library-pack");
const ASSET_NS = "ruv-aspect";
const read = (f) => JSON.parse(readFileSync(join(STAGING, f), "utf8"));

const mapping = read("import-mapping.json");
const av = new Map(read("answer-verification.json").answers.map((a) => [a.questionId, a]));
const expl = new Map(read("explanations.json").explanations.map((e) => [e.questionId, e]));
const figures = read("figure-manifest.json").figures;
const disp = new Map(mapping.questions.map((m) => [m.libraryQuestionId, m]));
const inv = read("source-inventory.json");
const figByQ = new Map();
for (const f of figures) {
  const name = f.file.split("/").pop();
  (figByQ.get(f.libraryQuestionId) ?? figByQ.set(f.libraryQuestionId, []).get(f.libraryQuestionId)).push({ name, src: join(STAGING, f.file), sha256: f.sha256 });
}

const { publisher, book, units } = mapping.hierarchy;
const DOC_ID = "ruv-source-pdf";
const sets = read("source-sets.json").sets;
const questions = [];
const withheld = []; let sourceMarked = 0;
for (const s of sets) {
  const file = readdirSync(join(STAGING, "questions")).find((n) => n.startsWith(s.id));
  const qs = JSON.parse(readFileSync(join(STAGING, "questions", file), "utf8")).questions;
  for (const q of qs) {
    const a = av.get(q.id); const d = disp.get(q.id); const e = expl.get(q.id);
    if (!a || !d) throw new Error(`No staging verdict for ${q.id}`);
    const figs = figByQ.get(q.id) ?? [];
    // The source key is a marker printed in a compiled PDF; it has not been independently solved or confirmed by the university.
    // Every RU-V key is therefore stored as "unverified": the app labels it a provisional source key and never as verified
    // (the earlier proposal to store it as "verified" would have presented it as an independently confirmed answer).
    // - source-marked single-choice (import_scored_candidate): key kept; becomes a provisional practice candidate.
    // - "no correct option" (22) and multiple-answer (6): not scoring candidates (no key / multi-select without a verified rule).
    // - unresolved source contradictions (3): the printed marker conflicts with the printed working, so the key is WITHHELD
    //   (correctOptionIds = []); keeping it would make them provisional candidates scored against a doubtful marker.
    const scoredCandidate = d.importDisposition === "import_scored_candidate";
    const contradiction = !scoredCandidate && q.type === "single_choice" && a.answerDisposition !== "no_correct_option" && a.proposedCorrectOptionIds.length > 0;
    const out = {
      id: q.id, text: q.text, type: q.type, category: book.targetCategory, subject: q.subject ?? null, topic: q.topic ?? null,
      options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      correctOptionIds: contradiction ? [] : a.proposedCorrectOptionIds,
      answerVerificationStatus: "unverified",
      contentVerificationStatus: d.proposedContentVerificationStatus,
      explanation: e?.authored?.text ?? e?.source?.text ?? null,
      unitIds: [d.unitId],
      source: { documentId: DOC_ID, pageNumber: q.provenance.pdfPage, questionNumber: q.printedQuestionNumber }
    };
    if (a.answerDisposition === "no_correct_option") out.answerDisposition = "no_correct_option";
    if (contradiction) { withheld.push({ id: q.id, page: q.provenance.pdfPage, number: q.printedQuestionNumber, printedMarker: a.proposedCorrectOptionIds }); }
    if (scoredCandidate) sourceMarked++;
    if (figs.length) out.assetPaths = figs.map((f) => `assets/${ASSET_NS}/${f.name}`);
    questions.push(out);
  }
}

const pdfSha = inv.pdf?.sha256 ?? read("validation-report.json").pdfSha256;
const pack = {
  schemaVersion: 1, kind: "library",
  publisher,
  book: {
    ...book, verificationStatus: "unverified", licenseStatus: book.licenseStatus,
    coverageNote: "17 printed Rajshahi University admission-test source sets (2016-17 to 2024-25) transcribed from RU Question Bank.pdf. Answer keys are the markers printed in the source (provisional, unverified); independent solving has not been performed. 31 questions are browse-only: 22 print no correct option, 6 have several correct options and 3 have an unresolved source contradiction (their keys are withheld)."
  },
  sourceDocuments: [{ id: DOC_ID, filename: "RU Question Bank.pdf", title: "RU Question Bank", sha256: pdfSha, sourceType: "pdf", notes: "Publisher and rights holder not identified in the source; licence not verified." }],
  units, questions
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets", ASSET_NS), { recursive: true });
const assetRows = [];
for (const list of figByQ.values()) for (const f of list) {
  const dest = join(OUT, "assets", ASSET_NS, f.name); copyFileSync(f.src, dest);
  const sha = createHash("sha256").update(readFileSync(dest)).digest("hex");
  if (sha !== f.sha256) throw new Error(`Hash mismatch for ${f.name}`);
  assetRows.push({ path: `assets/${ASSET_NS}/${f.name}`, sha256: sha });
}
const packText = JSON.stringify(pack, null, 1);
writeFileSync(join(OUT, "ruv-aspect-library-pack.json"), packText);
const publish = process.argv.includes("--publish");
const manifest = {
  generatedBy: "scripts/ruv-aspect-build-pack.mjs",
  status: publish ? "IMPORTED: bundled into the app content build (data/library-packs); see docs/RUV_ASPECT_IMPORT.md" : "PREPARED, NOT IMPORTED",
  packSha256: createHash("sha256").update(packText).digest("hex"),
  counts: {
    units: units.length, questions: questions.length,
    // "scored candidates" = source-marked single-choice questions; stored as answer "unverified" provisional source keys.
    scoredCandidates: sourceMarked, browseOnly: questions.length - sourceMarked,
    withheldKeys: withheld.length, withExplanation: questions.filter((q) => q.explanation).length, assets: assetRows.length
  },
  withheldContradictions: withheld,
  assets: assetRows
};
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));

if (publish) {
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  mkdirSync(join(repo, "data", "library-packs"), { recursive: true });
  writeFileSync(join(repo, "data", "library-packs", "ruv-aspect-library-pack.json"), packText);
  const assetDir = join(repo, "data", "question-packs", "assets", ASSET_NS);
  mkdirSync(assetDir, { recursive: true });
  for (const a of assetRows) {
    const dest = join(repo, "data", "question-packs", a.path);
    copyFileSync(join(OUT, a.path), dest);
    if (createHash("sha256").update(readFileSync(dest)).digest("hex") !== a.sha256) throw new Error(`Published asset hash mismatch: ${a.path}`);
  }
}
console.log(JSON.stringify({ ...manifest, assets: undefined, published: publish }));
