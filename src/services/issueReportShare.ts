import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Sharing from "expo-sharing";
import { cacheDirectory, deleteAsync, EncodingType, readDirectoryAsync, writeAsStringAsync } from "expo-file-system/legacy";
import type { SqlDb } from "../db/types";
import { LATEST_VERSION } from "../db/schema";
import { markIssueReportsExported } from "../repositories/issueReports";
import {
  ISSUE_EXPORT_MIME, buildIssueExport, isIssueExportFileName, issueExportFileName, serializeIssueExport, type IssueReport
} from "./issueReports";

export type ShareReportsResult = { status: "opened" } | { status: "unavailable" } | { status: "empty" };

/** Removes earlier export files so the cache never accumulates them. The newest file is written after this runs. */
async function removeStaleExports(dir: string): Promise<void> {
  try {
    for (const name of await readDirectoryAsync(dir)) {
      if (isIssueExportFileName(name)) await deleteAsync(`${dir}${name}`, { idempotent: true });
    }
  } catch {
    // Best-effort housekeeping; a failure must not block sharing.
  }
}

/**
 * Writes the reports to a UTF-8 JSON file in the app cache and opens the OS share sheet (Android Sharesheet), where the
 * person picks WhatsApp, Telegram, email, Files/Drive, etc. Nothing is sent by the app. The file is intentionally not
 * deleted afterwards: the receiving app may read it after the sheet has closed. Throws on write/share failure; the
 * reports are never modified or removed. `exportedAt` is stamped only after the share sheet was opened, and it records
 * a hand-off, not delivery.
 */
export async function shareIssueReports(db: SqlDb, reports: readonly IssueReport[], language: "bn" | "en", dialogTitle: string, now = Date.now()): Promise<ShareReportsResult> {
  if (reports.length === 0) return { status: "empty" };
  if (!(await Sharing.isAvailableAsync()) || !cacheDirectory) return { status: "unavailable" };
  const doc = buildIssueExport(reports, {
    appVersion: String(Constants.expoConfig?.version ?? "unknown"),
    platform: Platform.OS,
    language,
    dbSchemaVersion: LATEST_VERSION
  }, now);
  await removeStaleExports(cacheDirectory);
  const uri = `${cacheDirectory}${issueExportFileName(now)}`;
  await writeAsStringAsync(uri, serializeIssueExport(doc), { encoding: EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: ISSUE_EXPORT_MIME, dialogTitle, UTI: "public.json" });
  await markIssueReportsExported(db, reports.map((r) => r.id), now).catch(() => undefined);
  return { status: "opened" };
}
