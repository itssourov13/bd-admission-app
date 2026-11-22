import type { AppearanceView, OptionView, QuestionSourceView, QuestionView } from "../types/domain.ts";

/**
 * Question issue reports: a learner tells the maintainer that a question's CONTENT looks wrong. Not a bookmark (personal
 * save) and not the Standard Exam "Flag for review" (a per-attempt revision marker in session_answers.flagged).
 * Pure module (no React Native imports) so validation, snapshots and the JSON export are unit-testable.
 */

/** Stable ids written to storage and to the export file; labels live in the translations. Order = display order. */
export const ISSUE_TYPES = ["question_text", "option", "answer_key", "explanation", "figure", "duplicate", "other"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const REPORT_SURFACES = ["flash", "exam", "result", "browse", "bookmarks"] as const;
export type ReportSurface = (typeof REPORT_SURFACES)[number];

export const ISSUE_DETAILS_MAX = 1000;

export type IssueValidationError = "no_type" | "other_needs_details";

export function isIssueType(value: unknown): value is IssueType {
  return typeof value === "string" && (ISSUE_TYPES as readonly string[]).includes(value);
}

export function isReportSurface(value: unknown): value is ReportSurface {
  return typeof value === "string" && (REPORT_SURFACES as readonly string[]).includes(value);
}

/** Drops unknown values and duplicates and returns the types in canonical display order. */
export function normalizeIssueTypes(input: readonly unknown[]): IssueType[] {
  const set = new Set(input.filter(isIssueType));
  return ISSUE_TYPES.filter((t) => set.has(t));
}

export function normalizeDetails(details: string): string {
  return details.trim().slice(0, ISSUE_DETAILS_MAX);
}

export type IssueValidation =
  | { ok: true; types: IssueType[]; details: string }
  | { ok: false; error: IssueValidationError };

/** At least one category is required; "Other" alone needs a description because it carries no information by itself. */
export function validateIssueReport(types: readonly unknown[], details: string): IssueValidation {
  const normalized = normalizeIssueTypes(types);
  if (normalized.length === 0) return { ok: false, error: "no_type" };
  const text = normalizeDetails(details);
  if (normalized.length === 1 && normalized[0] === "other" && text === "") return { ok: false, error: "other_needs_details" };
  return { ok: true, types: normalized, details: text };
}

/** The question exactly as the learner saw it. Same shape as the QuestionView fields it copies, so it renders with QuestionCard. */
export interface QuestionSnapshot {
  id: string;
  text: string;
  type: QuestionView["type"];
  category: QuestionView["category"];
  subject: string | null;
  topic: string | null;
  answerStatus: QuestionView["answerStatus"];
  contentStatus: QuestionView["contentStatus"];
  explanation: string | null;
  assetPaths: string[];
  explanationAssetPaths: string[];
  options: OptionView[];
  appearances: AppearanceView[];
  source: QuestionSourceView | null;
}

export function buildQuestionSnapshot(q: QuestionView): QuestionSnapshot {
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    category: q.category,
    subject: q.subject,
    topic: q.topic,
    answerStatus: q.answerStatus,
    contentStatus: q.contentStatus,
    explanation: q.explanation,
    assetPaths: [...q.assetPaths],
    explanationAssetPaths: [...q.explanationAssetPaths],
    options: q.options.map((o) => ({ key: o.key, text: o.text, order: o.order, isCorrect: o.isCorrect, assetPaths: [...o.assetPaths] })),
    appearances: q.appearances.map((a) => ({ ...a })),
    source: q.source ? { ...q.source } : null
  };
}

/** A stored snapshot is JSON the app itself wrote; still validated structurally because it crosses a storage boundary. */
export function parseQuestionSnapshot(json: string): QuestionSnapshot | null {
  try {
    const v = JSON.parse(json) as Partial<QuestionSnapshot> | null;
    if (!v || typeof v !== "object" || typeof v.id !== "string" || typeof v.text !== "string" || !Array.isArray(v.options)) return null;
    return {
      id: v.id,
      text: v.text,
      type: v.type === "multiple_choice" ? "multiple_choice" : "single_choice",
      category: v.category === "medical" || v.category === "engineering" ? v.category : "varsity",
      subject: v.subject ?? null,
      topic: v.topic ?? null,
      answerStatus: v.answerStatus === "verified" || v.answerStatus === "unverified" ? v.answerStatus : "unknown",
      contentStatus: v.contentStatus === "verified" ? "verified" : "unverified",
      explanation: v.explanation ?? null,
      assetPaths: Array.isArray(v.assetPaths) ? v.assetPaths : [],
      explanationAssetPaths: Array.isArray(v.explanationAssetPaths) ? v.explanationAssetPaths : [],
      options: v.options.map((o) => ({ key: String(o.key), text: String(o.text ?? ""), order: Number(o.order ?? 0), isCorrect: Boolean(o.isCorrect), assetPaths: Array.isArray(o.assetPaths) ? o.assetPaths : [] })),
      appearances: Array.isArray(v.appearances) ? v.appearances : [],
      source: v.source ?? null
    };
  } catch {
    return null;
  }
}

export interface IssueReport {
  id: string;
  questionId: string;
  issueTypes: IssueType[];
  details: string;
  surface: ReportSurface;
  /** Null only if the stored snapshot could not be parsed; callers fall back to the question id. */
  snapshot: QuestionSnapshot | null;
  createdAt: number;
  updatedAt: number;
  /** Last time the report was handed to the share sheet. Not a delivery receipt. */
  exportedAt: number | null;
}

export type ExportState = "never" | "current" | "edited";

/** "edited" = changed after it was last shared, so a re-share would carry new content. */
export function exportStateOf(r: Pick<IssueReport, "updatedAt" | "exportedAt">): ExportState {
  if (r.exportedAt === null) return "never";
  return r.updatedAt > r.exportedAt ? "edited" : "current";
}

export function newReportId(now: number, rng: () => number = Math.random): string {
  return `r${now.toString(36)}${rng().toString(36).slice(2, 8)}`;
}

/** Short single-line preview of a question for lists and the composer. */
export function questionPreview(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

// ---- JSON export ----------------------------------------------------------------------------------------------

export const ISSUE_EXPORT_FORMAT = "bd-admission-question-issues";
export const ISSUE_EXPORT_SCHEMA_VERSION = 1;
export const ISSUE_EXPORT_MIME = "application/json";

export interface IssueExportMeta {
  appVersion: string;
  platform: string;
  language: "bn" | "en";
  /** SQLite user_version of the reporting app, so a maintainer knows which content schema the snapshot came from. */
  dbSchemaVersion: number;
}

export interface IssueExportDocument {
  format: typeof ISSUE_EXPORT_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  app: IssueExportMeta;
  reportCount: number;
  reports: {
    reportId: string;
    questionId: string;
    createdAt: string;
    updatedAt: string;
    reportedFrom: ReportSurface;
    issueTypes: IssueType[];
    details: string;
    questionSnapshot: QuestionSnapshot | null;
  }[];
}

/**
 * Privacy boundary: only what is needed to investigate a content defect. Never the profile name, chosen answers, attempt
 * history, bookmarks, device identifiers or session ids; the learner's own note is the only free text.
 */
export function buildIssueExport(reports: readonly IssueReport[], meta: IssueExportMeta, now: number): IssueExportDocument {
  const iso = (ms: number) => new Date(ms).toISOString();
  return {
    format: ISSUE_EXPORT_FORMAT,
    schemaVersion: ISSUE_EXPORT_SCHEMA_VERSION,
    exportedAt: iso(now),
    app: { appVersion: meta.appVersion, platform: meta.platform, language: meta.language, dbSchemaVersion: meta.dbSchemaVersion },
    reportCount: reports.length,
    reports: reports.map((r) => ({
      reportId: r.id,
      questionId: r.questionId,
      createdAt: iso(r.createdAt),
      updatedAt: iso(r.updatedAt),
      reportedFrom: r.surface,
      issueTypes: [...r.issueTypes],
      details: r.details,
      questionSnapshot: r.snapshot
    }))
  };
}

export function serializeIssueExport(doc: IssueExportDocument): string {
  return JSON.stringify(doc, null, 2);
}

export const ISSUE_EXPORT_FILE_PREFIX = "bd-admission-question-issues-";

/** `bd-admission-question-issues-20261122-153045.json` (UTC, filesystem-safe). */
export function issueExportFileName(now: number): string {
  const d = new Date(now).toISOString(); // 2026-11-22T15:30:45.123Z
  return `${ISSUE_EXPORT_FILE_PREFIX}${d.slice(0, 10).replace(/-/g, "")}-${d.slice(11, 19).replace(/:/g, "")}.json`;
}

export function isIssueExportFileName(name: string): boolean {
  return name.startsWith(ISSUE_EXPORT_FILE_PREFIX) && name.endsWith(".json");
}
