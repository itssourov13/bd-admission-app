import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader, goBack } from "@/components/common/ScreenHeader";
import { QuestionCard } from "@/components/common/QuestionCard";
import { ReportIssueSheet, type ReportDraft } from "@/components/common/ReportIssueSheet";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { formatReportDate, shareStateLabel } from "@/features/reports/format";
import { useShareReports } from "@/features/reports/useShareReports";
import { useLang, useNum, useT } from "@/i18n";
import { deleteIssueReport, getIssueReport, updateIssueReport } from "@/repositories/issueReports";
import { useTheme } from "@/settings";

export default function ReportDetailScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const db = useDb();
  const router = useRouter();
  const id = String(useLocalSearchParams<{ id: string }>().id ?? "");
  const q = useQuery((d) => getIssueReport(d, id), [id]);
  const { share, busy } = useShareReports(q.reload);
  const [editing, setEditing] = useState(false);
  const [editCount, setEditCount] = useState(0);

  if (q.loading) return <Screen edges={["top", "bottom"]}><ScreenHeader title={t("reports.detailTitle")} /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top", "bottom"]}><ScreenHeader title={t("reports.detailTitle")} /><ErrorView onRetry={q.reload} /></Screen>;
  const report = q.data;
  if (!report) {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader title={t("reports.detailTitle")} />
        <EmptyView icon="alert-circle-outline" title={t("reports.notFound")} actionLabel={t("common.back")} onAction={() => goBack(router)} />
      </Screen>
    );
  }

  const state = shareStateLabel(report);
  const date = (ms: number) => num(formatReportDate(ms, lang));

  const submit = async (draft: ReportDraft) => {
    const saved = await updateIssueReport(db, report.id, draft.types, draft.details);
    if (!saved) throw new Error("The report no longer exists.");
    q.reload();
  };
  const remove = async () => {
    Alert.alert(t("report.deleteTitle"), t("report.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("report.delete"), style: "destructive",
        onPress: () => {
          deleteIssueReport(db, report.id).then(() => { setEditing(false); goBack(router); }, () => Alert.alert(t("error.title"), t("report.deleteFailed")));
        }
      }
    ]);
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("reports.detailTitle")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Card className="p-4">
          <Txt weight="semibold" className="text-ink-500 text-xs uppercase" style={{ letterSpacing: 0.6 }}>{t("reports.issues")}</Txt>
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {report.issueTypes.map((type) => <Chip key={type} label={t(`report.type.${type}`)} tone="gold" />)}
          </View>
          <Txt weight="semibold" className="text-ink-500 text-xs uppercase mt-4" style={{ letterSpacing: 0.6 }}>{t("reports.note")}</Txt>
          <Txt className={`${report.details ? "text-ink-900" : "text-ink-500"} text-sm leading-6 mt-1`}>{report.details || t("reports.noNote")}</Txt>
          <View className="mt-4 gap-0.5">
            <Txt className="text-ink-500 text-xs">{t("reports.reportedFrom", { where: t(`report.surface.${report.surface}`) })}</Txt>
            <Txt className="text-ink-500 text-xs">{t("reports.created", { date: date(report.createdAt) })}</Txt>
            <Txt className="text-ink-500 text-xs">{t("reports.updated", { date: date(report.updatedAt) })}</Txt>
            <Txt className="text-ink-500 text-xs">{t(state.key, { date: state.date ? date(state.date) : "" })}</Txt>
          </View>
          <View className="mt-4 gap-2.5">
            <Button label={t("reports.edit")} variant="outline" icon={<Ionicons name="create-outline" size={18} color={colors.brand700} />} onPress={() => { setEditCount((n) => n + 1); setEditing(true); }} />
            <Button label={busy ? t("reports.preparing") : t("reports.exportOne")} variant="outline" loading={busy} icon={<Ionicons name="share-outline" size={18} color={colors.brand700} />} onPress={() => void share([report])} />
          </View>
        </Card>

        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-6">{t("reports.snapshotTitle")}</Txt>
        <Txt className="text-ink-500 text-xs leading-5 mt-1 mb-3">{t("reports.snapshotNote")}</Txt>
        {report.snapshot ? (
          <Card className="p-4"><QuestionCard question={report.snapshot} reveal disabled showSources /></Card>
        ) : (
          <Card className="p-4"><Txt className="text-ink-700 text-sm">{t("reports.snapshotMissing", { id: report.questionId })}</Txt></Card>
        )}
      </ScrollView>
      <ReportIssueSheet
        sessionKey={`${report.id}:${editCount}`}
        visible={editing}
        questionText={report.snapshot?.text ?? report.questionId}
        initial={{ types: report.issueTypes, details: report.details }}
        onSubmit={submit}
        onDelete={remove}
        onClose={() => setEditing(false)}
      />
    </Screen>
  );
}
