import { useCallback, useState, type ReactElement } from "react";
import { Alert } from "react-native";
import { ReportIssueSheet, type ReportDraft } from "@/components/common/ReportIssueSheet";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { useT } from "@/i18n";
import { deleteIssueReport, getIssueReportForQuestion, reportedQuestionIds, saveIssueReport } from "@/repositories/issueReports";
import type { IssueReport, ReportSurface } from "../../services/issueReports";
import type { QuestionView } from "../../types/domain";

const NONE: ReadonlySet<string> = new Set();

export interface QuestionReporting {
  /** Ids of questions that already have a saved report (drives the filled report icon). */
  reported: ReadonlySet<string>;
  /** Opens the composer for a question: a new report, or the existing one for editing (one report per question). */
  open: (question: QuestionView) => void;
  /** Render once at screen level, outside any list, so the sheet is independent of list virtualization. */
  sheet: ReactElement | null;
}

/**
 * Question-issue reporting for a screen that renders QuestionCard. Reports are written straight to SQLite, never touch
 * bookmarks or the exam review flag, and never alter the host screen's state, so an exam or Flash session carries on.
 */
export function useQuestionReporting(surface: ReportSurface, opts: { timerRunning?: boolean } = {}): QuestionReporting {
  const db = useDb();
  const t = useT();
  const ids = useQuery((d) => reportedQuestionIds(d));
  const [target, setTarget] = useState<{ question: QuestionView; existing: IssueReport | null } | null>(null);
  const [visible, setVisible] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const reload = ids.reload;

  const open = useCallback((question: QuestionView) => {
    void (async () => {
      // A failed lookup only means the composer opens empty; saving still upserts on the unique question id.
      const existing = await getIssueReportForQuestion(db, question.id).catch(() => null);
      setTarget({ question, existing });
      setOpenCount((n) => n + 1);
      setVisible(true);
    })();
  }, [db]);

  const close = useCallback(() => { setVisible(false); reload(); }, [reload]);

  const submit = useCallback(async (draft: ReportDraft) => {
    if (!target) return;
    await saveIssueReport(db, { question: target.question, issueTypes: draft.types, details: draft.details, surface });
    reload();
  }, [db, surface, target, reload]);

  const remove = useCallback(async () => {
    const existing = target?.existing;
    if (!existing) return;
    Alert.alert(t("report.deleteTitle"), t("report.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("report.delete"), style: "destructive",
        onPress: () => {
          deleteIssueReport(db, existing.id).then(close, () => Alert.alert(t("error.title"), t("report.deleteFailed")));
        }
      }
    ]);
  }, [db, target, close, t]);

  const sheet = target ? (
    <ReportIssueSheet
      sessionKey={`${target.question.id}:${openCount}`}
      visible={visible}
      questionText={target.question.text}
      initial={target.existing ? { types: target.existing.issueTypes, details: target.existing.details } : null}
      timerRunning={opts.timerRunning}
      onSubmit={submit}
      onDelete={target.existing ? remove : undefined}
      onClose={close}
    />
  ) : null;

  return { reported: ids.data ?? NONE, open, sheet };
}
