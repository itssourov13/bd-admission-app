import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useNum, useT } from "@/i18n";
import { colors } from "@/theme";
import { countEligible, listInstitutions, listPapers } from "@/repositories/content";
import type { InstitutionSummary, PaperSummary, QuestionCategory } from "@/types/domain";

type Item = { kind: "institution"; data: InstitutionSummary } | { kind: "paper"; data: PaperSummary };

/** Varsity lists institutions (then papers); Medical lists papers directly. Both are built from SQLite content only. */
export function CategoryScreen({ category }: { category: Extract<QuestionCategory, "varsity" | "medical"> }) {
  const t = useT();
  const num = useNum();
  const router = useRouter();
  const q = useQuery(async (db): Promise<{ items: Item[]; eligible: number }> => {
    const eligible = await countEligible(db, { category });
    if (category === "varsity") {
      return { eligible, items: (await listInstitutions(db, category)).map((data) => ({ kind: "institution" as const, data })) };
    }
    return { eligible, items: (await listPapers(db, { category })).map((data) => ({ kind: "paper" as const, data })) };
  }, [category]);

  const title = category === "varsity" ? t("catalog.varsityTitle") : t("catalog.medicalTitle");
  const subtitle = category === "varsity" ? t("catalog.varsitySubtitle") : t("catalog.medicalSubtitle");

  const header = (
    <View className="px-1 pt-6 pb-4">
      <Txt font="display" weight="bold" className="text-ink-900 text-3xl leading-10">{title}</Txt>
      <Txt className="text-ink-500 text-sm leading-6 mt-1">{subtitle}</Txt>
      {q.data && q.data.eligible > 0 ? (
        <View className="mt-4 gap-2.5">
          <Button label={t("catalog.practiceAll")} onPress={() => router.push(href("/flash/setup", { category }))} icon={<Ionicons name="flash" size={18} color={colors.white} />} />
          <Button label={t("home.examTitle")} variant="outline" onPress={() => router.push(href("/exam/setup", { category }))} />
        </View>
      ) : null}
    </View>
  );

  if (q.loading) return <Screen edges={["top"]} className="px-5">{header}<LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]} className="px-5">{header}<ErrorView onRetry={q.reload} /></Screen>;

  return (
    <Screen edges={["top"]} className="px-5">
      <FlatList
        data={q.data!.items}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyView icon="library-outline" title={t("catalog.emptyTitle")} body={t("catalog.emptyBody")} />}
        contentContainerStyle={{ paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          if (item.kind === "institution") {
            const i = item.data;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={i.name} onPress={() => router.push(href(`/institution/${encodeURIComponent(i.id)}`, { category }))}>
                <Card className="p-4 flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-2xl bg-brand-100 items-center justify-center">
                    <Txt weight="bold" className="text-brand-700 text-sm">{i.code}</Txt>
                  </View>
                  <View className="flex-1">
                    <Txt weight="bold" className="text-ink-900 text-base leading-6">{i.name}</Txt>
                    <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("catalog.institutionMeta", { papers: i.paperCount, questions: i.questionCount, eligible: i.eligibleCount })}</Txt>
                  </View>
                  <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
                </Card>
              </Pressable>
            );
          }
          const p = item.data;
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push(href(`/paper/${encodeURIComponent(p.id)}`))}>
              <Card className="p-4 flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-gold-100 items-center justify-center">
                  <Txt weight="bold" className="text-gold-700 text-sm">{p.institutionCode}</Txt>
                </View>
                <View className="flex-1">
                  <Txt weight="bold" className="text-ink-900 text-base leading-6">{p.title ?? `${p.institutionName} ${num(p.year)}`}</Txt>
                  <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("paper.meta", { questions: p.questionCount, eligible: p.eligibleCount })}</Txt>
                  <View className="flex-row mt-2"><Chip label={String(num(p.year))} /></View>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
