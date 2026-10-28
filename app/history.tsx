import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { colors } from "@/theme";
import { listHistory } from "@/repositories/sessions";

export default function HistoryScreen() {
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const q = useQuery((db) => listHistory(db, 100));
  const fmt = (ms: number) => num(new Date(ms).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" }));

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("history.title")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (
        <FlatList
          data={q.data!}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={<EmptyView icon="time-outline" title={t("history.emptyTitle")} body={t("history.emptyBody")} />}
          renderItem={({ item: h }) => {
            const openable = h.status === "completed" && h.resultJson !== null;
            return (
              <Pressable accessibilityRole={openable ? "button" : "summary"} disabled={!openable} onPress={() => router.push(href(`/result/${h.id}`))}>
                <Card className="p-4 flex-row items-center gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Txt weight="bold" className="text-ink-900 text-base">{h.mode === "exam" ? t("history.exam") : t("history.flash")}</Txt>
                      {h.status === "abandoned" ? <Chip label={t("history.abandoned")} tone="gold" /> : null}
                    </View>
                    <Txt className="text-ink-500 text-xs mt-1">{fmt(h.startedAt)}</Txt>
                    <Txt className="text-ink-700 text-sm mt-1.5">{t("history.summary", { c: h.correct, i: h.incorrect, t: h.total })}</Txt>
                  </View>
                  {openable ? <Ionicons name="chevron-forward" size={19} color={colors.ink400} /> : null}
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
