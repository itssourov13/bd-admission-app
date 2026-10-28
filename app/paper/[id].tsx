import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { RuleNotice } from "@/components/common/RuleNotice";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useNum, useT } from "@/i18n";
import { colors } from "@/theme";
import { countReviewCandidates, getPaperRule, listPapers } from "@/repositories/content";
import { STANDARD_EXAM_QUESTIONS } from "@/services/exam";

export default function PaperScreen() {
  const t = useT();
  const num = useNum();
  const router = useRouter();
  const p = useLocalSearchParams<{ id: string }>();
  const id = String(p.id ?? "");
  const q = useQuery(async (db) => ({
    paper: (await listPapers(db, { paperId: id }))[0] ?? null,
    rule: await getPaperRule(db, id),
    reviewCandidates: await countReviewCandidates(db, { paperId: id })
  }), [id]);

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title="" /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title="" /><ErrorView onRetry={q.reload} /></Screen>;
  const { paper, rule, reviewCandidates } = q.data!;
  if (!paper) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("catalog.notFound")} actionLabel={t("common.back")} onAction={() => router.back()} /></Screen>;

  const reviewMode = paper.eligibleCount === 0 && reviewCandidates > 0;
  const availableForPractice = reviewMode ? reviewCandidates : paper.eligibleCount;
  const canPractice = availableForPractice > 0;
  const requiredQuestions = rule?.totalQuestions && rule.totalQuestions > 0 ? rule.totalQuestions : STANDARD_EXAM_QUESTIONS;
  const canExam = availableForPractice >= requiredQuestions;
  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={paper.title ?? `${paper.institutionName} ${num(paper.year)}`} subtitle={paper.institutionName} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <View className="flex-row flex-wrap gap-2 mb-4">
          <Chip label={String(num(paper.year))} tone="brand" />
          {paper.unit ? <Chip label={t("paper.unit", { unit: paper.unit })} /> : null}
          {paper.academicSession ? <Chip label={t("paper.session", { session: paper.academicSession })} /> : null}
        </View>
        <Card className="p-4">
          <Txt className="text-ink-700 text-sm leading-6">{t("paper.meta", { questions: paper.questionCount, eligible: availableForPractice })}</Txt>
        </Card>
        <View className="mt-4"><RuleNotice rule={rule} status={paper.ruleStatus ?? undefined} /></View>
        {reviewMode ? <Card className="p-3.5 mt-4"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
        <View className="mt-5 gap-2.5">
          <Button label={t("paper.flash")} disabled={!canPractice} icon={<Ionicons name="flash" size={18} color={colors.white} />} onPress={() => router.push(href("/flash/setup", { paperId: paper.id }))} />
          <Button label={paper.ruleStatus === "illustrative" ? t("paper.practicePattern") : t("paper.exam")} variant="outline" disabled={!canExam} onPress={() => router.push(href("/exam/setup", { paperId: paper.id }))} />
          {!canExam ? <Txt className="text-ink-500 text-xs leading-5">{t("paper.examNeeds")}</Txt> : null}
          <Button label={t("paper.browse")} variant="ghost" disabled={paper.questionCount === 0} onPress={() => router.push(href("/browse", { paperId: paper.id }))} />
        </View>
      </ScrollView>
    </Screen>
  );
}
