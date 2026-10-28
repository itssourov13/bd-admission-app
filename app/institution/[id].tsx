import { FlatList, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useNum, useT } from "@/i18n";
import { colors } from "@/theme";
import { countEligible, countReviewCandidates, getInstitution, listPapers } from "@/repositories/content";

export default function InstitutionScreen() {
  const t = useT();
  const num = useNum();
  const router = useRouter();
  const p = useLocalSearchParams<{ id: string; category?: string }>();
  const id = String(p.id ?? "");
  const q = useQuery(async (db) => ({
    inst: await getInstitution(db, id),
    papers: await listPapers(db, { institutionId: id }),
    eligible: await countEligible(db, { institutionId: id }),
    reviewCandidates: await countReviewCandidates(db, { institutionId: id })
  }), [id]);

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title="" /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title="" /><ErrorView onRetry={q.reload} /></Screen>;
  const { inst, papers, eligible, reviewCandidates } = q.data!;
  const availableForPractice = eligible > 0 ? eligible : reviewCandidates;
  if (!inst) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("catalog.notFound")} actionLabel={t("common.back")} onAction={() => router.back()} /></Screen>;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={inst.name} subtitle={inst.code} />
      <FlatList
        data={papers}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="mb-4 gap-2.5">
            {availableForPractice > 0 ? (
              <>
                <Button label={t("catalog.practiceInstitution")} icon={<Ionicons name="flash" size={18} color={colors.white} />} onPress={() => router.push(href("/flash/setup", { institutionId: inst.id }))} />
                {availableForPractice >= 100 ? <Button label={t("home.examTitle")} variant="outline" onPress={() => router.push(href("/exam/setup", { institutionId: inst.id }))} /> : null}
                {eligible === 0 && reviewCandidates > 0 ? <Txt className="text-ink-500 text-xs leading-5">{t("practice.provisionalShort")}</Txt> : null}
              </>
            ) : null}
            <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-3">{t("catalog.papers")}</Txt>
          </View>
        }
        ListEmptyComponent={<EmptyView icon="document-outline" title={t("catalog.noPapers")} />}
        renderItem={({ item: x }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push(href(`/paper/${encodeURIComponent(x.id)}`))}>
            <Card className="p-4 flex-row items-center gap-3">
              <View className="flex-1">
                <Txt weight="bold" className="text-ink-900 text-base leading-6">{x.title ?? t("paper.title", { year: x.year })}</Txt>
                <Txt className="text-ink-500 text-xs leading-5 mt-1">{x.eligibleCount === 0 && x.reviewCandidateCount > 0
                  ? t("catalog.provisionalPaperMeta", { questions: x.questionCount, candidates: x.reviewCandidateCount })
                  : t("paper.meta", { questions: x.questionCount, eligible: x.eligibleCount })}</Txt>
                <View className="flex-row flex-wrap gap-2 mt-2">
                  <Chip label={String(num(x.year))} />
                  {x.unit ? <Chip label={t("paper.unit", { unit: x.unit })} /> : null}
                  {x.academicSession ? <Chip label={t("paper.session", { session: x.academicSession })} /> : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
