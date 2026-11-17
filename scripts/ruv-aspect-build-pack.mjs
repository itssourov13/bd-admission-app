#!/usr/bin/env node
// Builds the Library pack for RU-V / ASPECT from the staging workspace. Deterministic, read-only on the staging
// inputs, writes only <staging>/library-pack/. Does NOT touch the app repo, its database or data/question-packs.
//   node scripts/ruv-aspect-build-pack.mjs
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
for (const s of sets) {
  const file = readdirSync(join(STAGING, "questions")).find((n) => n.startsWith(s.id));
  const qs = JSON.parse(readFileSync(join(STAGING, "questions", file), "utf8")).questions;
  for (const q of qs) {
    const a = av.get(q.id); const d = disp.get(q.id); const e = expl.get(q.id);
    if (!a || !d) throw new Error(`No staging verdict for ${q.id}`);
    const figs = figByQ.get(q.id) ?? [];
    const out = {
      id: q.id, text: q.text, type: q.type, category: book.targetCategory, subject: q.subject ?? null, topic: q.topic ?? null,
      options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      correctOptionIds: a.proposedCorrectOptionIds,
      answerVerificationStatus: d.proposedAnswerVerificationStatus,
      contentVerificationStatus: d.proposedContentVerificationStatus,
      explanation: e?.authored?.text ?? e?.source?.text ?? null,
      unitIds: [d.unitId],
      source: { documentId: DOC_ID, pageNumber: q.provenance.pdfPage, questionNumber: q.printedQuestionNumber }
    };
    if (a.answerDisposition === "no_correct_option") out.answerDisposition = "no_correct_option";
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
    coverageNote: "17 printed Rajshahi University admission-test source sets (2016-17 to 2024-25) transcribed from RU Question Bank.pdf. Answer keys are the markers printed in the source; independent solving has not been performed."
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
const manifest = {
  generatedBy: "scripts/ruv-aspect-build-pack.mjs", status: "PREPARED, NOT IMPORTED (Phase 3 needs explicit approval)",
  packSha256: createHash("sha256").update(packText).digest("hex"),
  counts: { units: units.length, questions: questions.length, scoredCandidates: questions.filter((q) => q.answerVerificationStatus === "verified").length, browseOnly: questions.filter((q) => q.answerVerificationStatus !== "verified").length, withExplanation: questions.filter((q) => q.explanation).length, assets: assetRows.length },
  assets: assetRows
};
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(JSON.stringify({ ...manifest, assets: undefined }));
