import { Alert, FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { formatReportDate, shareStateLabel } from "@/features/reports/format";
import { useShareReports } from "@/features/reports/useShareReports";
import { useLang, useNum, useT } from "@/i18n";
import { deleteIssueReport, listIssueReports } from "@/repositories/issueReports";
import { useTheme } from "@/settings";
import { questionPreview } from "@/services/issueReports";

export default function ReportsScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const { lang } = useLang();
  const q = useQuery((d) => listIssueReports(d));
  const { share, busy } = useShareReports(q.reload);
  const reports = q.data ?? [];

  const confirmDelete = (id: string) => {
    Alert.alert(t("report.deleteTitle"), t("report.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("report.delete"), style: "destructive",
        onPress: () => { deleteIssueReport(db, id).then(q.reload, () => Alert.alert(t("error.title"), t("report.deleteFailed"))); }
      }
    ]);
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("reports.title")} subtitle={q.data ? t("reports.count", { n: num(reports.length) }) : undefined} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={reports.length > 0 ? (
            <View className="mb-4">
              <Button
                label={busy ? t("reports.preparing") : t("reports.exportAll")}
                loading={busy}
                icon={<Ionicons name="share-outline" size={18} color={colors.white} />}
                onPress={() => void share(reports)}
              />
              <Txt className="text-ink-500 text-xs leading-5 mt-2">{t("reports.exportNote")}</Txt>
            </View>
          ) : null}
          ListEmptyComponent={<EmptyView icon="alert-circle-outline" title={t("reports.emptyTitle")} body={t("reports.emptyBody")} />}
          renderItem={({ item: r }) => {
            const preview = questionPreview(r.snapshot?.text ?? r.questionId);
            const state = shareStateLabel(r);
            return (
              <Card className="p-4">
                <Pressable accessibilityRole="button" accessibilityLabel={preview} onPress={() => router.push(href(`/reports/${r.id}`))} className="active:opacity-80">
                  <Txt weight="semibold" className="text-ink-900 text-base leading-6" numberOfLines={3}>{preview}</Txt>
                  <View className="flex-row flex-wrap gap-1.5 mt-2.5">
                    {r.issueTypes.map((type) => <Chip key={type} label={t(`report.type.${type}`)} tone="neutral" />)}
                  </View>
                  <Txt className="text-ink-500 text-xs mt-2.5">{t("reports.updated", { date: num(formatReportDate(r.updatedAt, lang)) })}</Txt>
                  <Txt className="text-ink-500 text-xs mt-0.5">{t(state.key, { date: state.date ? num(formatReportDate(state.date, lang)) : "" })}</Txt>
                </Pressable>
                <View className="flex-row justify-end gap-1 mt-2">
                  <Pressable accessibilityRole="button" accessibilityLabel={t("reports.deleteListLabel", { q: preview })} onPress={() => confirmDelete(r.id)} hitSlop={6} className="w-11 h-11 rounded-full items-center justify-center active:bg-sand-100">
                    <Ionicons name="trash-outline" size={22} color={colors.ink500} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("reports.exportOne")} disabled={busy} onPress={() => void share([r])} hitSlop={6} className="w-11 h-11 rounded-full items-center justify-center active:bg-sand-100">
                    <Ionicons name="share-outline" size={22} color={colors.ink500} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("reports.detailTitle")} onPress={() => router.push(href(`/reports/${r.id}`))} hitSlop={6} className="w-11 h-11 rounded-full items-center justify-center active:bg-sand-100">
                    <Ionicons name="chevron-forward" size={22} color={colors.ink500} />
                  </Pressable>
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
