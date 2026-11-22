import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useDb } from "@/db/provider";
import { useLang, useT } from "@/i18n";
import { shareIssueReports } from "@/services/issueReportShare";
import type { IssueReport } from "../../services/issueReports";

/** Shares reports through the native share sheet and reports preparing/unavailable/failed states to the person. */
export function useShareReports(onShared: () => void) {
  const db = useDb();
  const t = useT();
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);

  const share = useCallback(async (reports: readonly IssueReport[]) => {
    if (busy || reports.length === 0) return;
    setBusy(true);
    try {
      const result = await shareIssueReports(db, reports, lang, t("reports.shareTitle"));
      if (result.status === "unavailable") Alert.alert(t("error.title"), t("reports.exportUnavailable"));
      else onShared();
    } catch {
      Alert.alert(t("error.title"), t("reports.exportFailed"));
    } finally {
      setBusy(false);
    }
  }, [busy, db, lang, t, onShared]);

  return { share, busy };
}
