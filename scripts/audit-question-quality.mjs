#!/usr/bin/env node
/**
 * Question-pack text-quality audit (read-only).
 *
 * Detects *candidates* for extraction/transcription contamination in question text, options and explanations.
 * It never edits data: a finding is a prompt for a human to compare against the original source page.
 * Words such as "answer", "page", "source" or "solution" are legitimate MCQ content, so no rule deletes or rewrites
 * anything and every finding carries the exact pack, question id, paper appearance and source page.
 *
 *   node scripts/audit-question-quality.mjs [--dir data/question-packs] [--json out.json] [--md out.md] [--min review|info]
 *
 * Exit code is 0 even when findings exist (findings are review items); it is non-zero only for unreadable input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** severity: "likely" = strong contamination signal; "review" = needs a source check; "info" = known-benign family. */
export const RULES = [
  { code: "OPT_EMPTY", severity: "likely", field: "option", test: (t) => t.trim() === "" },
  { code: "OPT_LABEL_PREFIX", severity: "likely", field: "option", test: (t) => /^\s*(?:\([A-Da-dকখগঘ]\)|\[[A-Da-dকখগঘ]\]|[A-Da-d][.)])\s+(?=(?:\\|[\d({±√∫=<>]))/.test(t) },
  { code: "OPT_REFERENCE_LABEL", severity: "likely", field: "option", test: (t) => /^\s*(ans(wer)?|source|ref(erence)?|solution|explanation|note|উত্তর|সূত্র)\s*[:：]/i.test(t) || /\((ans(wer)?|ref|source)\s*[:：][^)]*\)\s*$/i.test(t) },
  { code: "OPT_EXTRACTION_NOTE", severity: "likely", field: "option", test: (t) => /\b(OCR|illegible|unclear|figure not|see (the )?(image|figure|page)|extraction note|\[?sic\]?)\b/i.test(t) },
  { code: "OPT_PAGE_MARKER", severity: "review", field: "option", test: (t) => !/^\s*open\b.*\bpage\s*\d+\b.*\bbook\b/i.test(t) && /(^|\s)(page|pg|p\.)\s*\d+\b/i.test(t) },
  { code: "OPT_BOOK_OR_ANSWER_WORDS", severity: "info", field: "option", test: (t) => /\b(solution|answer|source|reference)\b/i.test(t) },
  { code: "OPT_TOO_LONG", severity: "review", field: "option", test: (t) => t.length > 300 },
  { code: "OPT_NEWLINE", severity: "review", field: "option", test: (t) => /\n/.test(t) && t.length > 120 },
  { code: "OPT_REPLACEMENT_CHAR", severity: "likely", field: "any", test: (t) => /[\uFFFD\u0000]/.test(t) },
  { code: "BANGLA_CARET_ARTEFACT", severity: "review", field: "any", test: (t) => /[\u0980-\u09FF]\^[\u0980-\u09FF]/.test(t) },
  { code: "Q_NUMBER_PREFIX", severity: "review", field: "text", test: (t) => /^\s*\d{1,3}\s*[.)]\s+\S/.test(t) },
  { code: "Q_PAGE_MARKER", severity: "review", field: "text", test: (t) => /(?:^|\s)(?:page|pg\.?|p\.)\s*\d+(?:\s+of\s+\d+)?\s*$/i.test(t) },
  { code: "Q_OPTIONS_IN_TEXT", severity: "info", field: "text", test: (t) => /\(\s*[aAকক]\s*\).+\(\s*[bBখ]\s*\).+\(\s*[cCগ]\s*\)/s.test(t) },
  { code: "Q_EXTRACTION_NOTE", severity: "likely", field: "text", test: (t) => /\b(OCR|illegible|extraction note|\[?figure missing\]?)\b/i.test(t) },
  { code: "EXP_EXTRACTION_NOTE", severity: "review", field: "explanation", test: (t) => /\b(OCR|extraction note|imported from)\b/i.test(t) },
];

const normalize = (t) => t.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

/** Structural checks that need the whole question rather than one string. */
function structuralFindings(q) {
  const out = [];
  const opts = q.options ?? [];
  if (opts.length < 2) out.push({ code: "STRUCT_FEW_OPTIONS", severity: "likely", detail: `${opts.length} options` });
  if (opts.length > 6) out.push({ code: "STRUCT_MANY_OPTIONS", severity: "review", detail: `${opts.length} options` });
  const seen = new Map();
  for (const o of opts) {
    const key = normalize(o.text ?? "");
    if (key && seen.has(key)) out.push({ code: "OPT_DUPLICATE", severity: "review", detail: `${seen.get(key)} and ${o.id} are identical` });
    else seen.set(key, o.id);
  }
  const ids = new Set(opts.map((o) => o.id));
  for (const id of q.correctOptionIds ?? []) if (!ids.has(id)) out.push({ code: "STRUCT_KEY_MISSING_OPTION", severity: "likely", detail: `correct option ${id} is not an option` });
  const orders = opts.map((o) => o.order);
  if (orders.some((v, i) => v !== i + 1)) out.push({ code: "STRUCT_OPTION_ORDER", severity: "review", detail: `orders ${orders.join(",")}` });
  return out;
}

export function auditQuestionPack(pack, fileName = "") {
  const findings = [];
  const batchId = pack.batch?.id ?? fileName;
  for (const q of pack.questions ?? []) {
    const where = {
      pack: fileName, batchId, questionId: q.id,
      appearances: (q.appearances ?? []).map((a) => `${a.paperId}#${a.questionNumber ?? "?"}@p${a.pageNumber ?? "?"}`),
      source: q.source ? `${q.source.documentId}@p${q.source.pageNumber ?? "?"}#${q.source.questionNumber ?? "?"}` : null
    };
    const push = (rule, field, optionId, text, detail) => findings.push({ ...where, code: rule, severity: findingSeverity(rule), field, optionId: optionId ?? null, text: text ?? null, detail: detail ?? null });
    const strings = [
      { field: "text", id: null, text: q.text ?? "" },
      ...(q.options ?? []).map((o) => ({ field: "option", id: o.id, text: o.text ?? "" })),
      ...(q.explanation ? [{ field: "explanation", id: null, text: q.explanation }] : [])
    ];
    for (const s of strings) {
      for (const rule of RULES) {
        if (rule.field !== "any" && rule.field !== s.field) continue;
        if (rule.test(s.text)) push(rule.code, s.field, s.id, s.text);
      }
    }
    for (const sf of structuralFindings(q)) findings.push({ ...where, code: sf.code, severity: sf.severity, field: "structure", optionId: null, text: null, detail: sf.detail });
  }
  return findings;
}

function findingSeverity(code) {
  return RULES.find((r) => r.code === code)?.severity ?? "review";
}

export function auditDirectory(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json").sort();
  const findings = [];
  let questions = 0;
  for (const f of files) {
    const pack = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!Array.isArray(pack.questions)) continue;
    questions += pack.questions.length;
    findings.push(...auditQuestionPack(pack, f));
  }
  return { packs: files.length, questions, findings };
}

export function summarize(findings) {
  const byCode = {};
  for (const f of findings) {
    const k = `${f.severity}:${f.code}`;
    byCode[k] = (byCode[k] ?? 0) + 1;
  }
  return Object.entries(byCode).sort((a, b) => b[1] - a[1]);
}

export function renderMarkdownReport(result, minSeverity = "review") {
  const rank = { info: 0, review: 1, likely: 2 };
  const shown = result.findings.filter((f) => rank[f.severity] >= rank[minSeverity]);
  const cell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").slice(0, 220);
  const summary = summarize(result.findings).map(([key, count]) => `| ${cell(key)} | ${count} |`).join("\n");
  const samples = shown.map((f) => {
    const location = [f.pack, f.questionId, f.appearances?.join(", "), f.source].filter(Boolean).join(" · ");
    return `| ${f.severity} | ${f.code} | ${cell(location)} | ${cell(f.text ?? f.detail)} |`;
  }).join("\n");
  return [
    "# Question text-quality audit",
    "",
    `Read-only scan of **${result.packs} packs** and **${result.questions.toLocaleString("en-US")} questions**. This is a candidate-finding heuristic, not a source-verification verdict. No question/option content is changed by the scanner.`,
    "",
    `Showing findings at severity **${minSeverity}** or higher. Total findings: **${result.findings.length}**; displayed: **${shown.length}**.`,
    "",
    "## Summary",
    "",
    "| Severity and signal | Count |",
    "|---|---:|",
    summary || "| None | 0 |",
    "",
    "## Findings (all reviewable candidates)",
    "",
    "| Severity | Signal | Pack / question / source location | Extracted text or structural detail |",
    "|---|---|---|---|",
    samples || "| — | — | — | No findings at the selected severity |",
    "",
    "## Review policy",
    "",
    "Compare every likely contamination candidate against its original paper/source image before editing it. Duplicate option text, page references, words such as answer/solution/source, scientific names, mathematical operators and Bangla characters may all be legitimate question content. Preserve option order, answer IDs, question IDs, appearances and provenance. Unresolved cases remain unchanged and should be logged for human review.",
    "",
    "The report intentionally does not infer correctness, official authenticity, answer-key quality or mathematical transcription accuracy.",
    ""
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const arg = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
  const dir = arg("--dir", "data/question-packs");
  const minSeverity = arg("--min", "review");
  const rank = { info: 0, review: 1, likely: 2 };
  const result = auditDirectory(dir);
  const shown = result.findings.filter((f) => rank[f.severity] >= rank[minSeverity]);
  console.log(`audited ${result.packs} packs / ${result.questions} questions; ${result.findings.length} findings total, ${shown.length} at >= ${minSeverity}`);
  for (const [k, n] of summarize(result.findings)) console.log(String(n).padStart(6), k);
  const jsonOut = arg("--json");
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ packs: result.packs, questions: result.questions, findings: shown }, null, 1));
  const markdownOut = arg("--md");
  if (markdownOut) fs.writeFileSync(markdownOut, renderMarkdownReport(result, minSeverity));
}
