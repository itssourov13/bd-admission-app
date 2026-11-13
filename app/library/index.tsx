import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, PublisherMark, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { localizedName } from "@/features/library/model";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { listPublishers } from "@/repositories/library";

/** Publications library entry point: publishers with real (possibly zero) content counts. */
export default function LibraryScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const q = useQuery((db) => listPublishers(db));

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("library.title")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (
        <FlatList
          data={q.data!}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: q.data!.length === 0 ? 1 : undefined }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={<Txt className="text-ink-500 text-sm leading-6 mb-4">{t("library.subtitle")}</Txt>}
          ListEmptyComponent={<EmptyView icon="library-outline" title={t("library.emptyTitle")} body={t("library.emptyBody")} />}
          renderItem={({ item: p }) => {
            const name = localizedName(p.name, p.nameBn, lang);
            const secondary = lang === "bn" ? p.name : p.nameBn;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={() => router.push(href(`/library/publisher/${encodeURIComponent(p.id)}`))} className="active:opacity-90">
                <Card className="p-4 flex-row items-center gap-3">
                  <PublisherMark name={p.name} logoKey={p.logoKey} slug={p.slug} />
                  <View className="flex-1">
                    <Txt weight="bold" className="text-ink-900 text-base leading-6">{name}</Txt>
                    {secondary && secondary !== name ? <Txt className="text-ink-500 text-xs leading-5">{secondary}</Txt> : null}
                    <Txt className="text-ink-500 text-xs leading-5 mt-1">
                      {p.availableBooks > 0 ? `${t("library.booksCount", { n: num(p.availableBooks) })} · ${t("library.questionsCount", { n: num(p.questionCount) })}` : t("library.noContentYet")}
                    </Txt>
                    {p.categories.length > 0 || p.installedBooks > 0 || p.unavailableBooks > 0 ? (
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {p.categories.map((c) => <Chip key={c} label={t(`library.category.${c}` as const)} tone="brand" />)}
                        {p.installedBooks > 0 ? <Chip label={t("library.installedCount", { n: num(p.installedBooks) })} /> : null}
                        {p.unavailableBooks > 0 ? <Chip label={t("library.unavailableCount", { n: num(p.unavailableBooks) })} /> : null}
                      </View>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
