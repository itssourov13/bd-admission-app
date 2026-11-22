import type { SqlDb } from "../db/types.ts";
import type { QuestionView } from "../types/domain.ts";
import {
  buildQuestionSnapshot, isReportSurface, newReportId, normalizeIssueTypes, parseQuestionSnapshot, validateIssueReport,
  type IssueReport, type IssueType, type IssueValidationError, type ReportSurface
} from "../services/issueReports.ts";

/** User-owned issue reports (migration v13). Never touches bookmarks or session_answers.flagged. */

interface Row {
  id: string;
  question_id: string;
  issue_types_json: string;
  details: string;
  surface: string;
  question_snapshot_json: string;
  created_at: number;
  updated_at: number;
  exported_at: number | null;
}

const COLUMNS = "id, question_id, issue_types_json, details, surface, question_snapshot_json, created_at, updated_at, exported_at";
const ID_CHUNK = 400;

export class IssueReportValidationError extends Error {
  readonly code: IssueValidationError;
  constructor(code: IssueValidationError) {
    super(`Invalid issue report: ${code}`);
    this.name = "IssueReportValidationError";
    this.code = code;
  }
}

function parseTypes(json: string): IssueType[] {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? normalizeIssueTypes(v) : [];
  } catch {
    return [];
  }
}

function toReport(r: Row): IssueReport {
  return {
    id: r.id,
    questionId: r.question_id,
    issueTypes: parseTypes(r.issue_types_json),
    details: r.details,
    surface: isReportSurface(r.surface) ? r.surface : "browse",
    snapshot: parseQuestionSnapshot(r.question_snapshot_json),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    exportedAt: r.exported_at === null ? null : Number(r.exported_at)
  };
}

export async function getIssueReport(db: SqlDb, id: string): Promise<IssueReport | null> {
  const r = await db.getFirstAsync<Row>(`SELECT ${COLUMNS} FROM question_issue_reports WHERE id = ?`, [id]);
  return r ? toReport(r) : null;
}

export async function getIssueReportForQuestion(db: SqlDb, questionId: string): Promise<IssueReport | null> {
  const r = await db.getFirstAsync<Row>(`SELECT ${COLUMNS} FROM question_issue_reports WHERE question_id = ?`, [questionId]);
  return r ? toReport(r) : null;
}

export async function listIssueReports(db: SqlDb, limit = 500, offset = 0): Promise<IssueReport[]> {
  const rows = await db.getAllAsync<Row>(`SELECT ${COLUMNS} FROM question_issue_reports ORDER BY updated_at DESC, id LIMIT ? OFFSET ?`, [limit, offset]);
  return rows.map(toReport);
}

export async function countIssueReports(db: SqlDb): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM question_issue_reports");
  return Number(r?.n ?? 0);
}

/** Ids of reported questions (optionally limited to `ids`), used to mark the report action on question cards. */
export async function reportedQuestionIds(db: SqlDb, ids?: readonly string[]): Promise<Set<string>> {
  if (ids && ids.length === 0) return new Set();
  const out = new Set<string>();
  if (!ids) {
    for (const r of await db.getAllAsync<{ question_id: string }>("SELECT question_id FROM question_issue_reports")) out.add(r.question_id);
    return out;
  }
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK);
    const rows = await db.getAllAsync<{ question_id: string }>(
      `SELECT question_id FROM question_issue_reports WHERE question_id IN (${chunk.map(() => "?").join(",")})`, chunk
    );
    for (const r of rows) out.add(r.question_id);
  }
  return out;
}

export interface SaveIssueInput {
  question: QuestionView;
  issueTypes: readonly string[];
  details: string;
  surface: ReportSurface;
  now?: number;
}

/**
 * Creates the report for a question or, if one already exists, updates its categories and note. One statement
 * (INSERT … ON CONFLICT on the UNIQUE question_id), so two quick taps or two surfaces cannot create duplicates.
 * The snapshot, creation time, surface and export marker of an existing report are kept.
 */
export async function saveIssueReport(db: SqlDb, input: SaveIssueInput): Promise<IssueReport> {
  const v = validateIssueReport(input.issueTypes, input.details);
  if (!v.ok) throw new IssueReportValidationError(v.error);
  const now = input.now ?? Date.now();
  await db.runAsync(
    `INSERT INTO question_issue_reports (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(question_id) DO UPDATE SET issue_types_json = excluded.issue_types_json, details = excluded.details, updated_at = excluded.updated_at`,
    [newReportId(now), input.question.id, JSON.stringify(v.types), v.details, input.surface, JSON.stringify(buildQuestionSnapshot(input.question)), now, now]
  );
  const saved = await getIssueReportForQuestion(db, input.question.id);
  if (!saved) throw new Error("The issue report was not persisted.");
  return saved;
}

/** Edits categories/note of an existing report by id. Returns null when the report no longer exists. */
export async function updateIssueReport(db: SqlDb, id: string, issueTypes: readonly string[], details: string, now = Date.now()): Promise<IssueReport | null> {
  const v = validateIssueReport(issueTypes, details);
  if (!v.ok) throw new IssueReportValidationError(v.error);
  const r = await db.runAsync("UPDATE question_issue_reports SET issue_types_json = ?, details = ?, updated_at = ? WHERE id = ?", [JSON.stringify(v.types), v.details, now, id]);
  return r.changes > 0 ? getIssueReport(db, id) : null;
}

export async function deleteIssueReport(db: SqlDb, id: string): Promise<boolean> {
  const r = await db.runAsync("DELETE FROM question_issue_reports WHERE id = ?", [id]);
  return r.changes > 0;
}

/** Records that these reports were handed to the share sheet. Does not imply anyone received them. */
export async function markIssueReportsExported(db: SqlDb, ids: readonly string[], now = Date.now()): Promise<void> {
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK);
    await db.runAsync(`UPDATE question_issue_reports SET exported_at = ? WHERE id IN (${chunk.map(() => "?").join(",")})`, [now, ...chunk]);
  }
}
