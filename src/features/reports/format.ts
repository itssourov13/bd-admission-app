import { exportStateOf, type IssueReport } from "../../services/issueReports";
import type { TranslationKey } from "@/i18n";

/** Locale date for a report timestamp. */
export function formatReportDate(ms: number, lang: "bn" | "en"): string {
  return new Date(ms).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** Translation key (and optional date) describing whether a report was handed to the share sheet and is still current. */
export function shareStateLabel(r: Pick<IssueReport, "updatedAt" | "exportedAt">): { key: TranslationKey; date: number | null } {
  const state = exportStateOf(r);
  if (state === "never") return { key: "reports.state.never", date: null };
  return { key: state === "current" ? "reports.state.current" : "reports.state.edited", date: r.exportedAt };
}
