#!/usr/bin/env node
/**
 * RU-V → ASPECT Library staging builder (Phase 1, preparation only).
 *
 * Reads the IMMUTABLE RU-V verified-pack archive + extraction evidence and writes a reviewable, isolated staging
 * dataset OUTSIDE the app repository. It never writes into the repo, the active question-pack directory, the seed or
 * any SQLite database, and it refuses an output directory inside the repo.
 *
 *   node scripts/ruv-aspect-staging.mjs --build     (re)generate the staging dataset (deterministic)
 *   node scripts/ruv-aspect-staging.mjs --verify    re-hash the staging dataset against its SHA256SUMS
 *
 * Nothing here "verifies" content against the PDF page images: that remains a human/visual step and is reported as such.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DATA = process.env.RUV_DATA_ROOT ?? "/home/kali/gpt-workspace/bd-admission-app-data";
const PDF = path.join(DATA, "ru", "RU Question Bank.pdf");
const PDF_SHA = "f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7";
const PDF_PAGES = 156; // recorded by the 2026-11-17 source audit; page count is not re-derived here (no PDF library dependency)
const ARCHIVE = path.join(DATA, "ru", "verified-pack-archive");
const WORK = path.join(DATA, "ruv-work");
const OUT = path.resolve(process.env.RUV_STAGING_OUT ?? path.join(DATA, "ru", "ruv-aspect-staging"));
const GENERATOR = "scripts/ruv-aspect-staging.mjs";

// Printed identity of each source set, transcribed from the archive README / source audit (examIndex order).
// `unit` is the printed unit label of the source, NOT an official admission-unit classification.
const SETS = [
  [0, "2024-2025", "A", "মহানন্দা", 130, 126, 4], [1, "2024-2025", "A", "পদ্মা", 130, 126, 4],
  [2, "2023-2024", "C", "সুরমা", 130, 118, 12], [3, "2023-2024", "C", "মেঘনা", 130, 116, 14],
  [4, "2022-2023", "C", "Feldsper-1", 130, 125, 5], [5, "2022-2023", "C", "Quartz-2", 130, 127, 3],
  [6, "2021-2022", "C", "নেপচুন-২", 130, 122, 8], [7, "2021-2022", "C", "ভেনাস-১", 130, 130, 0],
  [8, "2020-2021", "C", "সায়নোভ্যাক", 130, 125, 5], [9, "2019-2020", "C", "গ্রুপ-০১", 128, 87, 41],
  [10, "2018-2019", "C", "সেট ০২", 86, 76, 10], [11, "2018-2019", "D1", "সেট ০১", 150, 135, 15],
  [12, "2017-2018", "C", "মেঘনা-৩", 79, 76, 3], [13, "2017-2018", "F", "সেট-১", 112, 105, 7],
  [14, "2017-2018", "H", "সেট-২", 71, 64, 7], [15, "2016-2017", "C", "ODD", 78, 72, 6],
  [16, "2016-2017", "F", "ODD", 108, 98, 10]
].map(([examIndex, session, unit, setName, rawExpected, importedExpected, excludedExpected]) => ({ examIndex, session, unit, setName, rawExpected, importedExpected, excludedExpected }));

// Source-page defects already CONFIRMED visually by the 2026-11-17 interim audit (examIndex, pdfPage, printed number).
const CONFIRMED_BOUNDARY_DEFECTS = [[0, 1, 4], [4, 45, 15], [3, 33, 6], [13, 133, 40], [1, 17, 66]];

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const sha256File = (p) => sha256(fs.readFileSync(p));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (rel, data) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
};
const pad = (n, w) => String(n).padStart(w, "0");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const setSlugAscii = (s) => `${s.session}-${s.unit.toLowerCase()}-p${pad(s.startPage, 3)}`;
const norm = (s) => String(s ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function guardOut() {
  const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  if (OUT === repo || OUT.startsWith(repo + path.sep)) throw new Error(`Refusing to stage inside the app repository: ${OUT}`);
  if (!OUT.startsWith(path.resolve(DATA) + path.sep)) throw new Error(`Staging output must live under ${DATA}: ${OUT}`);
  if (/question-packs|\/seed/.test(OUT)) throw new Error("Staging output must not be an active content directory.");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

function verifyStaging() {
  const sums = fs.readFileSync(path.join(OUT, "SHA256SUMS"), "utf8").trim().split("\n");
  let bad = 0;
  for (const line of sums) {
    const [h, ...r] = line.split("  "); const rel = r.join("  ");
    const p = path.join(OUT, rel);
    if (!fs.existsSync(p) || sha256File(p) !== h) { bad++; console.error("MISMATCH", rel); }
  }
  const listed = new Set(sums.map((l) => l.split("  ").slice(1).join("  ")));
  for (const f of walk(OUT)) { const rel = path.relative(OUT, f); if (rel !== "SHA256SUMS" && !listed.has(rel)) { bad++; console.error("UNLISTED", rel); } }
  console.log(JSON.stringify({ staging: OUT, files: sums.length, ok: bad === 0 }, null, 2));
  process.exit(bad === 0 ? 0 : 1);
}

function build() {
  guardOut();
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true }); // staging only; sources are never touched
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Source integrity -----------------------------------------------------------------------------------------
  const pdfSha = sha256File(PDF);
  if (pdfSha !== PDF_SHA) throw new Error(`Original PDF hash changed: ${pdfSha}`);
  const manifest = readJson(path.join(ARCHIVE, "MANIFEST.json"));
  const archiveBad = manifest.files.filter((f) => sha256File(path.join(ARCHIVE, f.path)) !== f.sha256);
  if (archiveBad.length) throw new Error(`Archive hash mismatch: ${archiveBad.map((f) => f.path).join(", ")}`);
  const packSha = Object.fromEntries(manifest.files.filter((f) => f.kind === "pack").map((f) => [path.basename(f.path), f.sha256]));

  // 2. Set table ------------------------------------------------------------------------------------------------
  const printed = manifest.summary.printedSets;
  if (printed.length !== SETS.length) throw new Error(`Expected ${SETS.length} printed sets, archive lists ${printed.length}`);
  const sets = SETS.map((s, i) => {
    const p = printed[i];
    if (p.examIndex !== s.examIndex) throw new Error("examIndex order mismatch");
    const next = printed[i + 1];
    return { ...s, startPage: p.pdfPage, endPage: next ? next.pdfPage - 1 : PDF_PAGES, printedTitle: p.title, packFile: p.packFile };
  });
  for (const s of sets) {
    s.id = `ruv-set-${setSlugAscii(s)}`;
    s.unitId = `aspect-ru-qb-t-${s.session}-${s.unit.toLowerCase()}-p${pad(s.startPage, 3)}`;
    s.sessionUnitId = `aspect-ru-qb-s-${s.session}`;
  }

  // 3. Evidence: exclusion ledger + figure inventory -----------------------------------------------------------
  const exclusions = parseCsv(fs.readFileSync(path.join(WORK, "EXCLUSION_MANIFEST.csv"), "utf8"));
  const exclByExam = {}, exclReasonByExam = {};
  for (const e of exclusions) {
    const i = Number(e.examIndex); exclByExam[i] = (exclByExam[i] ?? 0) + 1;
    (exclReasonByExam[i] ??= {})[e.reason] = (exclReasonByExam[i][e.reason] ?? 0) + 1;
  }
  const figInv = readJson(path.join(ARCHIVE, "FIGURE_INVENTORY.json"));
  const figByQ = new Map(figInv.map((f) => [f.questionId, f]));
  const rawLedger = readJson(path.join(WORK, "raw_questions.json"));
  const rawIndex = new Map();
  for (const rq of rawLedger.questions) {
    const k = `${rq.page}|${rq.number}`;
    const list = rawIndex.get(k) ?? []; if (!list.includes(rq.exam)) list.push(rq.exam); rawIndex.set(k, list);
  }

  // 4. Load questions, assign each to its printed set -----------------------------------------------------------
  const questions = [], issues = [];
  const packs = fs.readdirSync(path.join(ARCHIVE, "question-packs")).filter((f) => f.endsWith(".json")).sort();
  for (const file of packs) {
    const pack = readJson(path.join(ARCHIVE, "question-packs", file));
    const own = sets.filter((s) => s.packFile === file);
    let curExam = own[0].examIndex;
    for (const [idx, q] of pack.questions.entries()) {
      // Set membership comes from the extraction ledger (exam index per raw record), NOT from page ranges: two sets can
      // share a page (title in the right column, previous set's tail in the left column).
      const page = q.source?.pageNumber ?? q.appearances?.[0]?.pageNumber;
      const printedNo = q.source?.questionNumber ?? q.appearances?.[0]?.questionNumber;
      const cands = (rawIndex.get(`${page}|${printedNo}`) ?? []).filter((e) => own.some((s) => s.examIndex === e));
      const exam = cands.includes(curExam) ? curExam : cands.filter((e) => e > curExam).sort((a, b) => a - b)[0];
      if (exam === undefined) { issues.push({ kind: "set_assignment_failed", questionId: q.id, page, printedNo }); continue; }
      if (cands.length > 1) issues.push({ kind: "set_assignment_ambiguous_resolved_by_order", questionId: q.id, page, printedNo, candidates: cands, chosen: exam });
      curExam = exam;
      const set = sets[exam];
      if (page < set.startPage) issues.push({ kind: "page_before_set_start", questionId: q.id, page, setStart: set.startPage });
      questions.push({ q, set, file, packPosition: idx, page, printedNo });
    }
  }

  // 5. Per-question checks (automation only; NOT a substitute for visual verification) ------------------------------
  const caret = /[\u0980-\u09FF]\^|\^[\u0980-\u09FF]/u;
  const defectKeys = new Set(CONFIRMED_BOUNDARY_DEFECTS.map((d) => d.join("|")));
  const normalized = [], answers = [], explanations = [], mapping = [];
  const bySet = new Map(sets.map((s) => [s.id, []]));
  const stat = { answerStatus: {}, flags: {}, explanation: {}, dispositions: {} };
  const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
  for (const { q, set, file, packPosition, page, printedNo } of questions) {
    const opts = q.options.map((o) => ({ id: o.id, label: o.id.toUpperCase(), text: o.text, order: o.order }));
    const flags = [];
    const optNorm = opts.map((o) => norm(o.text));
    const dupPairs = [];
    for (let a = 0; a < opts.length; a++) for (let b = a + 1; b < opts.length; b++) if (optNorm[a] && optNorm[a] === optNorm[b]) dupPairs.push([opts[a].id, opts[b].id]);
    const keyed = new Set(q.correctOptionIds);
    if (dupPairs.length) flags.push({ code: "duplicate_option_text", severity: dupPairs.some((p) => p.some((x) => keyed.has(x))) ? "blocking" : "review", detail: dupPairs.map((p) => p.join("=")).join(",") });
    if (opts.length !== 4) flags.push({ code: "option_count_not_4", severity: "blocking", detail: String(opts.length) });
    if ([q.text, ...opts.map((o) => o.text), q.explanation ?? ""].some((t) => caret.test(t))) flags.push({ code: "bangla_caret_artefact", severity: "review" });
    if ([q.text, ...opts.map((o) => o.text), q.explanation ?? ""].some((t) => t.includes("\uFFFD"))) flags.push({ code: "replacement_character", severity: "blocking" });
    if (opts.some((o) => o.text.length > 90 && /[।.]\s/.test(o.text))) flags.push({ code: "option_possible_explanation_spill", severity: "review", detail: "heuristic: long multi-sentence option" });
    if (defectKeys.has([set.examIndex, page, printedNo].join("|"))) flags.push({ code: "confirmed_option_explanation_boundary_defect", severity: "blocking", detail: "visually confirmed by 2026-11-17 interim audit" });
    const fig = figByQ.get(q.id);
    if (fig) flags.push({ code: "figure_dependent", severity: "info", detail: fig.representation });
    const multi = q.type === "multiple_choice" || q.correctOptionIds.length > 1;
    const noCorrect = q.answerDisposition === "no_correct_option" || q.correctOptionIds.length === 0;
    if (noCorrect) flags.push({ code: "no_correct_option_in_source", severity: "blocking" });
    if (multi) flags.push({ code: "multiple_correct_options", severity: "blocking", detail: "needs multi-select engine support and key review" });

    // Answer status. Printed source marker => official_answer_key (the PDF is a compiled source; whether it equals the
    // university's own key is NOT established - see README). Any blocking flag => needs_review; never independently_verified here.
    const blocking = flags.some((f) => f.severity === "blocking");
    const status = blocking ? "needs_review" : "official_answer_key";
    const proposed = noCorrect ? [] : q.correctOptionIds;
    bump(stat.answerStatus, status); flags.forEach((f) => bump(stat.flags, f.code));
    bump(stat.dispositions, noCorrect ? "no_correct_option" : multi ? "multiple" : "single");

    const explanationStatus = q.explanation ? "source_provided_unreviewed" : "pending";
    bump(stat.explanation, explanationStatus);
    const legacyId = q.id;
    const libId = `aspect-${legacyId}`;
    const order = bySet.get(set.id).length + 1;
    const rec = {
      id: libId, legacyQuestionId: legacyId, setId: set.id, unitId: set.unitId, order, printedQuestionNumber: printedNo,
      text: q.text, type: q.type, subject: q.subject, topic: q.topic ?? null, options: opts,
      assetPaths: fig ? [fig.assetPath] : [],
      provenance: { pdfSha256: PDF_SHA, pdfPage: page, printedQuestionNumber: printedNo, packFile: file, packSha256: packSha[file], packPosition, sourceDocumentId: q.source.documentId }
    };
    bySet.get(set.id).push(rec); normalized.push(rec);
    answers.push({
      questionId: libId, legacyQuestionId: legacyId, status, proposedCorrectOptionIds: proposed, answerDisposition: noCorrect ? "no_correct_option" : multi ? "multiple" : "single",
      evidence: noCorrect ? "Source key absent or matches no printed option; not forced to A/B/C/D." : "Printed answer marker in the source PDF (extracted by the RU-V pipeline).",
      keyBasis: "printed_marker_in_source_pdf", independentlySolved: false, conflicts: [], flags: flags.map((f) => f.code),
      note: noCorrect ? "Candidate independent solve (if any) must be recorded separately and labelled independently_verified; never promoted to the official key." : null
    });
    explanations.push({
      questionId: libId, status: explanationStatus,
      source: q.explanation ? { text: q.explanation, origin: "source_pdf_printed_explanation", reviewed: false } : null,
      authored: null,
      pendingReason: q.explanation ? "Source explanation preserved verbatim; no reviewed Bangla explanation authored yet." : "No explanation in source and none authored yet."
    });
    const importable = status === "official_answer_key";
    mapping.push({
      libraryQuestionId: libId, legacyQuestionId: legacyId, unitId: set.unitId, position: order,
      proposedAnswerVerificationStatus: importable ? "verified" : "unverified",
      proposedContentVerificationStatus: "unverified",
      importDisposition: importable ? "import_scored_candidate" : "import_browse_only_needs_review",
      holdReasons: flags.filter((f) => f.severity === "blocking").map((f) => f.code)
    });
  }

  // 6. Reconciliation against the audit ledger ---------------------------------------------------------------------
  const reconciliation = sets.map((s) => {
    const n = bySet.get(s.id).length;
    const excl = exclByExam[s.examIndex] ?? 0;
    return {
      setId: s.id, examIndex: s.examIndex, session: s.session, printedUnit: s.unit, setName: s.setName, pdfPages: [s.startPage, s.endPage],
      rawExpected: s.rawExpected, importedExpected: s.importedExpected, excludedExpected: s.excludedExpected,
      importedFound: n, excludedInLedger: excl, exclusionReasons: exclReasonByExam[s.examIndex] ?? {},
      match: n === s.importedExpected && excl === s.excludedExpected && n + excl === s.rawExpected
    };
  });
  for (const r of reconciliation) if (!r.match) issues.push({ kind: "count_mismatch", ...r });

  // 7. Duplicate / near-duplicate analysis (non-destructive) --------------------------------------------------------
  const sig = normalized.map((r) => ({ id: r.id, set: r.setId, text: norm(r.text), key: norm(r.text) + "||" + r.options.map((o) => norm(o.text)).sort().join("|") }));
  const exactMap = new Map();
  for (const s of sig) (exactMap.get(s.key) ?? exactMap.set(s.key, []).get(s.key)).push(s);
  const exactGroups = [...exactMap.values()].filter((g) => g.length > 1).map((g) => g.map((x) => x.id));
  const shingles = (t) => { const w = t.split(" "); const out = new Set(); for (let i = 0; i + 2 < w.length; i++) out.add(w.slice(i, i + 3).join(" ")); if (!out.size) out.add(t); return out; };
  const sh = sig.map((s) => shingles(s.key));
  const near = [];
  for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) {
    if (sig[i].key === sig[j].key) continue;
    const a = sh[i], b = sh[j]; if (Math.min(a.size, b.size) / Math.max(a.size, b.size) < 0.8) continue;
    let inter = 0; for (const x of a) if (b.has(x)) inter++;
    const jac = inter / (a.size + b.size - inter);
    if (jac >= 0.85) near.push({ a: sig[i].id, b: sig[j].id, jaccard: Number(jac.toFixed(3)), sameSet: sig[i].set === sig[j].set });
  }

  // 8. Figures --------------------------------------------------------------------------------------------------------
  const figures = figInv.map((f) => {
    const src = path.join(ARCHIVE, f.assetPath);
    const exists = fs.existsSync(src);
    const dest = `figures/${path.basename(f.assetPath)}`;
    if (exists) { fs.mkdirSync(path.join(OUT, "figures"), { recursive: true }); fs.copyFileSync(src, path.join(OUT, dest)); }
    else issues.push({ kind: "figure_file_missing", questionId: f.questionId, assetPath: f.assetPath });
    const inSet = normalized.find((r) => r.legacyQuestionId === f.questionId);
    if (!inSet) issues.push({ kind: "figure_question_not_found", questionId: f.questionId });
    return { libraryQuestionId: inSet?.id ?? null, legacyQuestionId: f.questionId, pdfPage: f.pdfPage, printedQuestionNumber: f.printedQuestionNumber, representation: f.representation, file: dest, widthPx: f.widthPx, heightPx: f.heightPx, sha256: exists ? sha256File(src) : null, cropBoxPdfPoints: f.cropBoxPdfPoints, provenance: f.provenance };
  });
  for (const r of normalized) if (r.assetPaths.length) r.assetPaths = r.assetPaths.map((p) => `figures/${path.basename(p)}`);

  return { sets, normalized, answers, explanations, mapping, reconciliation, exclusions, exactGroups, near, figures, issues, stat, bySet, pdfSha, packSha, packs, manifest };
}

function emit(r) {
  const { sets, normalized, answers, explanations, mapping, reconciliation, exclusions, exactGroups, near, figures, issues, stat, bySet, pdfSha, packSha, packs, manifest } = r;
  const count = (arr, f) => arr.filter(f).length;
  const ansBy = Object.fromEntries(answers.map((a) => [a.questionId, a]));

  write("source-sets.json", {
    generatedBy: GENERATOR, pdf: { path: PDF, sha256: pdfSha, pages: PDF_PAGES, note: "Page count recorded by the 2026-11-17 audit." },
    sets: sets.map((s) => ({
      id: s.id, examIndex: s.examIndex, session: s.session, printedUnit: s.unit, setName: s.setName, printedTitle: s.printedTitle,
      pdfPages: [s.startPage, s.endPage], pdfPagesNote: "start = page carrying the set title; end = next set's title page - 1 (a boundary page can hold the tail of one set and the title of the next in separate columns)",
      pdfPagesObserved: [Math.min(...bySet.get(s.id).map((q) => q.provenance.pdfPage)), Math.max(...bySet.get(s.id).map((q) => q.provenance.pdfPage))], sourcePackFile: s.packFile, sourcePackSha256: packSha[s.packFile], proposedLibraryUnitId: s.unitId,
      questionsPrepared: bySet.get(s.id).length, excludedRecords: reconciliation[s.examIndex].excludedInLedger
    }))
  });
  write("source-inventory.json", {
    note: "Reconciliation of the 17 printed sets against the 15 archived packs and the extraction ledger. Counts describe previous artifacts, not proof of the final import count.",
    packsToSets: Object.fromEntries(packs.map((p) => [p, sets.filter((s) => s.packFile === p).map((s) => s.id)])),
    reconciliation,
    sourceFiles: [
      { role: "original_pdf", path: PDF, sha256: pdfSha },
      { role: "archive_manifest", path: path.join(ARCHIVE, "MANIFEST.json"), sha256: sha256File(path.join(ARCHIVE, "MANIFEST.json")) },
      { role: "figure_inventory", path: path.join(ARCHIVE, "FIGURE_INVENTORY.json"), sha256: sha256File(path.join(ARCHIVE, "FIGURE_INVENTORY.json")) },
      ...["raw_questions.json", "EXCLUSION_MANIFEST.csv", "PACK_RECONCILIATION.csv", "IDENTICAL_OPTION_TEXT_AUDIT.csv"].map((f) => ({ role: "extraction_evidence", path: path.join(WORK, f), sha256: sha256File(path.join(WORK, f)) })),
      ...packs.map((p) => ({ role: "archived_pack", path: path.join(ARCHIVE, "question-packs", p), sha256: packSha[p] }))
    ]
  });
  for (const s of sets) write(`questions/${s.id}.json`, { setId: s.id, session: s.session, printedUnit: s.unit, setName: s.setName, pdfPages: [s.startPage, s.endPage], questions: bySet.get(s.id) });
  write("answer-verification.json", { statuses: ["official_answer_key", "independently_verified", "unverified", "needs_review"], keyBasisNote: "official_answer_key here means: answer printed in the supplied source PDF. The PDF is a compiled question bank; equality with the university's own answer key has not been established. independently_verified is 0: nothing was independently solved in this pass.", answers });
  write("explanations.json", { note: "source = verbatim explanation printed in the source PDF (unreviewed). authored = reviewed explanation written for the Library (none yet).", explanations });
  write("figure-manifest.json", { note: "Crops come from the immutable archive (200 dpi, cropped from the original PDF). Coverage is the archive's 20 figure-dependent questions only; a full per-question visual inventory is still pending.", figures });
  // Exclusion review: one decision per record, derived from the extraction ledger. Nothing is returned to staging automatically.
  const reviewRecords = exclusions.map((e) => {
    const base = { examIndex: Number(e.examIndex), setId: sets[Number(e.examIndex)].id, pdfPage: Number(e.page), printedQuestionNumber: Number(e.printedQuestionNumber), ledgerReason: e.reason, answerMarker: e.answerMarker || null, extractedOptionCount: Number(e.extractedOptionCount), stemStart: String(e.stem).slice(0, 80) };
    if (e.reason === "written_part") return { ...base, classification: "written_part_not_mcq", decision: "keep_excluded", evidence: "Ledger: source banner marks this as a WRITTEN part; no options exist to import.", pdfPageConfirmation: "pending" };
    if (e.reason === "answer_marker_missing") return { ...base, classification: "writing_instruction_not_mcq", decision: "keep_excluded", evidence: "Ledger: stem is a write-a-sentence instruction with no options and no answer marker.", pdfPageConfirmation: "pending" };
    return { ...base, classification: "real_mcq_options_unrecoverable", decision: "keep_excluded_needs_manual_recovery", evidence: `Ledger: ${e.reason}; stem and printed answer marker ${e.answerMarker || "(none)"} were extracted but only ${e.extractedOptionCount} of 4 options were recovered (graphic/math options). Not imported because a question must not be published with fabricated or missing options.`, pdfPageConfirmation: "pending" };
  });
  const reviewCounts = {}; for (const x of reviewRecords) reviewCounts[x.decision] = (reviewCounts[x.decision] ?? 0) + 1;
  write("exclusion-review.json", { note: "Decision per excluded record (ledger evidence). Decisions are provisional until each PDF page is visually confirmed.", counts: reviewCounts, records: reviewRecords });
  write("exclusion-review.md", `# RU-V excluded records — review\n\n${reviewRecords.length} records reviewed from the extraction ledger.\n\n| Decision | Count |\n|---|---|\n${Object.entries(reviewCounts).map(([k, v]) => `| ${k} | ${v} |`).join("\n")}\n\nPer-record evidence: \`exclusion-review.json\`. Written parts and writing instructions are legitimately not MCQs. The 116 real MCQs stay excluded until their graphic/math options are recovered from the PDF and visually verified; none is returned to staging automatically. PDF-page confirmation of every decision is pending.\n`);
  write("excluded-records.json", { note: "154 raw extraction records that were never imported (see EXCLUSION_MANIFEST.csv). Not part of the Library dataset; kept for review.", records: exclusions.map((e) => ({ examIndex: Number(e.examIndex), pdfPage: Number(e.page), printedQuestionNumber: Number(e.printedQuestionNumber), reason: e.reason, detail: e.detail, answerMarker: e.answerMarker, extractedOptionCount: Number(e.extractedOptionCount), stem: e.stem })) });

  const hierarchy = {
    // ASPECT is the Library section/collection, NOT the publisher: the PDF names no publisher, so the publisher is recorded as unidentified.
    publisher: { id: "pub-unidentified", slug: "unidentified", name: "Unknown / not identified", nameBn: "অজানা / শনাক্ত করা হয়নি", kind: "publisher" },
    book: { id: "aspect-ru-question-bank-verified-sets", title: "Rajshahi University Question Bank — Source Sets", titleBn: "রাজশাহী বিশ্ববিদ্যালয় প্রশ্নব্যাংক — উৎস সেট", language: "mixed", targetCategory: "varsity", contentType: "question_bank", contentVersion: 1, collection: "ASPECT", examRelevance: ["Rajshahi University"], sourceNote: "Source: RU Question Bank.pdf. Publisher and rights holder are not identified in the inspected source. Licence and reuse permission have not been verified.", licenseStatus: "permission_pending", licenseNote: "Not verified", rightsHolder: null, rightsReference: "Earlier session recorded an owner statement (2026-11-17) that the owner holds the licence; no written evidence is stored. Status kept at permission_pending until the owner records a reference.", rightsReviewedOn: null },
    units: [
      ...[...new Set(sets.map((s) => s.session))].map((ses, i) => ({ id: `aspect-ru-qb-s-${ses}`, parentId: null, kind: "section", title: `Session ${ses}`, sortOrder: i + 1 })),
      ...sets.map((s, i) => ({ id: s.unitId, parentId: s.sessionUnitId, kind: "test", title: `Unit ${s.unit} — ${s.setName}`, titleBn: `ইউনিট ${s.unit} — ${s.setName}`, sortOrder: i + 1, sourcePdfPages: [s.startPage, s.endPage] }))
    ]
  };
  write("import-mapping.json", {
    status: "PROPOSAL ONLY — not applied to any database, seed or question-pack directory. Phase 3 requires explicit user approval.",
    idPolicy: "Library question ids are prefixed 'aspect-' so they cannot collide with the legacy retired ru-vq-* rows (the importer refuses ids owned by another batch). legacyQuestionId is kept for audit/history mapping.",
    hierarchy, questions: mapping
  });

  // Reports -----------------------------------------------------------------------------------------------------------
  const nQ = normalized.length;
  const official = count(answers, (a) => a.status === "official_answer_key"), needs = count(answers, (a) => a.status === "needs_review");
  const noKey = count(answers, (a) => a.answerDisposition === "no_correct_option"), multi = count(answers, (a) => a.answerDisposition === "multiple");
  const withExplSrc = count(r.explanations, (e) => e.source), pending = nQ - withExplSrc;
  const provOk = count(normalized, (q) => q.provenance.pdfPage && q.provenance.printedQuestionNumber != null && q.provenance.packSha256);
  const cross = near.filter((n) => !n.sameSet).length;
  const validation = {
    generatedBy: GENERATOR, pdfSha256: pdfSha, setsExpected: 17, setsFound: sets.filter((s) => bySet.get(s.id).length > 0).length,
    questionsPrepared: nQ, questionsExcludedFromPacks: exclusions.length, rawRecords: nQ + exclusions.length,
    answers: { officialAnswerKey: official, independentlyVerified: 0, unverified: 0, needsReview: needs, noCorrectOption: noKey, multipleCorrect: multi, byStatus: stat.answerStatus },
    explanations: { sourceProvidedUnreviewed: withExplSrc, authoredReviewed: 0, pending, coveragePctSourceProvided: Number((100 * withExplSrc / nQ).toFixed(2)) },
    contentVerification: { visuallyVerifiedAgainstPdf: 0, extractionOnly: nQ, note: "No question has been compared page-by-page with the PDF in this pass." },
    provenanceCoverage: { withPageNumberAndPackHash: provOk, of: nQ },
    flags: stat.flags, figures: { cropped: figures.length, missingFiles: count(figures, (f) => !f.sha256) },
    duplicates: { exactDuplicateGroups: exactGroups.length, exactDuplicateQuestions: exactGroups.flat().length, nearDuplicatePairs: near.length, nearDuplicateCrossSet: cross, policy: "Non-destructive: legitimate repeats across years/sets are preserved." },
    reconciliationAllMatch: reconciliation.every((x) => x.match), issues
  };
  write("validation-report.json", validation);
  write("duplicate-analysis.json", { exactGroups, nearDuplicatePairs: near });
  write("validation-report.md", `# RU-V staging — validation report

Generated by \`${GENERATOR}\`. Source PDF sha256 \`${pdfSha}\`.

| Check | Result |
|---|---|
| Source sets expected / found | 17 / ${validation.setsFound} |
| Questions prepared | ${nQ} |
| Raw records excluded at extraction (never imported) | ${exclusions.length} |
| Per-set reconciliation with audit ledger | ${validation.reconciliationAllMatch ? "all 17 match" : "MISMATCH — see issues"} |
| Answer: official_answer_key (printed marker, no blocking flag) | ${official} |
| Answer: independently_verified | 0 |
| Answer: needs_review | ${needs} (no-correct ${noKey}, multi-answer ${multi}, other blocking flags) |
| Explanations: source-provided, unreviewed | ${withExplSrc} (${validation.explanations.coveragePctSourceProvided}%) |
| Explanations: authored and reviewed | 0 |
| Explanations: pending | ${pending} |
| Questions visually verified against PDF pages | 0 |
| Provenance (page + printed number + pack hash) | ${provOk}/${nQ} |
| Figures cropped | ${figures.length} (full visual inventory pending) |
| Exact-duplicate groups / near-duplicate pairs | ${exactGroups.length} / ${near.length} |

Flag counts: ${Object.entries(stat.flags).map(([k, v]) => `${k}=${v}`).join(", ")}

"official_answer_key" means the key printed in the supplied PDF; equality with the university's official key is unproven.
`);
  const unresolved = [
    { id: "U1", severity: "blocking", item: "Visual page-by-page verification of all questions/options/keys not performed", count: nQ },
    { id: "U2", severity: "blocking", item: "Questions needing answer review (blocking flags)", count: needs, questionIds: answers.filter((a) => a.status === "needs_review").map((a) => a.questionId) },
    { id: "U3", severity: "blocking", item: "No-correct-option records (kept unscored, not forced to A-D)", count: noKey },
    { id: "U4", severity: "blocking", item: "Multi-answer records (require multi-select engine before scored use)", count: multi },
    { id: "U5", severity: "high", item: "Reviewed Bangla explanations not authored; only unreviewed source explanations preserved", count: nQ },
    { id: "U6", severity: "high", item: "154 excluded records are classified in exclusion-review.json (ledger evidence): 38 legitimate non-MCQ exclusions, 116 real MCQs whose options could not be extracted (kept excluded; manual option recovery needed). PDF-page confirmation of each decision is still pending", count: exclusions.length },
    { id: "U7", severity: "info", item: "Rights metadata: publisher and rights holder not identified in the PDF, licence not verified (permission_pending). Informational only; it does not block preparation. An earlier owner statement of holding the licence has no stored evidence.", count: 1 },
    { id: "U8", severity: "medium", item: "Per-question visual/math inventory incomplete (only 20 figure crops exist); known uncropped examples are listed in the 2026-11-17 audit (matrix/circuit/isotope notation)", count: null },
    { id: "U9", severity: "medium", item: "Archived pack JSON labels the 2024-25 sets 'C Unit'; the printed source unit is A. Staging uses printed A.", count: 2 },
    { id: "U10", severity: "info", item: "Archive source documents carry the owner's 'verified' label by instruction, which is not independent verification", count: nQ }
  ];
  write("unresolved-items.json", { items: unresolved });
  write("unresolved-items.md", `# RU-V staging — unresolved items\n\n${unresolved.map((u) => `- **${u.id}** [${u.severity}] ${u.item}${u.count != null ? ` — ${u.count}` : ""}`).join("\n")}\n`);

  write("README.md", `# RU-V → ASPECT staging dataset

STATUS: **STAGED, NOT IMPORTED.** Nothing here is connected to the app's active question packs, seed or SQLite database. Importing requires explicit owner approval (Phase 3).

## How it was created
\`${GENERATOR} --build\` (deterministic) reads the immutable archive \`${ARCHIVE}\` and extraction evidence in \`${WORK}\`, verifies their SHA-256 hashes first, and re-assigns each of the 1,828 archived questions to one of the 17 printed source sets using the extraction ledger (page ranges are only a sanity check; boundary pages can hold two sets). Question text, option text/order, keys and source explanations are copied **verbatim**; no OCR correction, answer or explanation was invented.

## Layout
- \`source-sets.json\`, \`source-inventory.json\` — the 17 sets, PDF page ranges, pack mapping, counts, source file hashes
- \`questions/<set>.json\` — normalized questions with provenance
- \`answer-verification.json\` — status per question (official_answer_key | independently_verified | unverified | needs_review) and flags
- \`explanations.json\` — source-provided (unreviewed) vs authored (none yet)
- \`figures/\`, \`figure-manifest.json\` — 20 archived crops with hashes
- \`import-mapping.json\` — PROPOSED hierarchy and id mapping (not applied)
- \`validation-report.{json,md}\`, \`duplicate-analysis.json\`, \`unresolved-items.{json,md}\`, \`excluded-records.json\`
- \`SHA256SUMS\` — \`node scripts/ruv-aspect-staging.mjs --verify\`

## How to review
Start with \`unresolved-items.md\`, then \`validation-report.md\`. Records with status \`needs_review\` carry their reasons in \`answer-verification.json\`. Compare any record with its PDF page via \`provenance.pdfPage\` in \`questions/\`.
`);

  const files = walk(OUT).map((f) => path.relative(OUT, f)).filter((f) => f !== "SHA256SUMS").sort();
  fs.writeFileSync(path.join(OUT, "SHA256SUMS"), files.map((f) => `${sha256File(path.join(OUT, f))}  ${f}`).join("\n") + "\n");
  console.log(JSON.stringify({ staging: OUT, files: files.length + 1, questions: nQ, sets: validation.setsFound, official, needsReview: needs, issues: issues.length, reconciliationAllMatch: validation.reconciliationAllMatch }, null, 2));
}

const arg = process.argv[2];
if (arg === "--build") emit(build());
else if (arg === "--verify") { guardOut(); verifyStaging(); }
else { console.error("use --build or --verify"); process.exit(2); }
