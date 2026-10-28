import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { RuleNotice } from "@/components/common/RuleNotice";
import { ChoiceChip } from "@/components/common/Toggle";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { href, scopeFromParams } from "@/features/navigation/links";
import { useT } from "@/i18n";
import { countEligible, getInstitution, listPapers, scopeRule } from "@/repositories/content";
import { abandonSession, getActiveExam } from "@/repositories/sessions";
import { checkExamEligibility, STANDARD_EXAM_QUESTIONS } from "@/services/exam";
import { startStandardExam } from "@/services/practiceService";
import type { QuestionCategory } from "@/types/domain";

export default function ExamSetup() {
  const t = useT();
  const db = useDb();
  const router = useRouter();
  const scope = scopeFromParams(useLocalSearchParams());
  const [category, setCategory] = useState<QuestionCategory | undefined>(scope.category);
  const [busy, setBusy] = useState(false);
  const locked = Boolean(scope.institutionId || scope.paperId);
  const effective = { ...scope, category: locked ? scope.category : category };
  const key = JSON.stringify(effective);

  const q = useQuery(async (d) => ({
    n: await countEligible(d, effective),
    rule: await scopeRule(d, effective),
    active: await getActiveExam(d),
    label: effective.paperId ? (await listPapers(d, { paperId: effective.paperId }))[0]?.title ?? null
      : effective.institutionId ? (await getInstitution(d, effective.institutionId))?.name ?? null : null
  }), [key]);

  const start = async () => {
    setBusy(true);
    try {
      const r = await startStandardExam(db, effective);
      if (r.ok) router.replace(href(`/exam/${r.sessionId}`));
      else q.reload();
    } catch { Alert.alert(t("error.title"), t("error.saveFailed")); } finally { setBusy(false); }
  };

  const discard = (id: string) => Alert.alert(t("exam.discardTitle"), t("exam.discardBody"), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("exam.discard"), style: "destructive", onPress: () => { abandonSession(db, id, Date.now()).then(q.reload, () => Alert.alert(t("error.title"), t("error.saveFailed"))); } }
  ]);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("exam.setupTitle")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (() => {
        const d = q.data!;
        const el = checkExamEligibility(d.n);
        return (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
            <Txt className="text-ink-500 text-sm leading-6">{t("exam.setupBody")}</Txt>
            {d.active ? (
              <Card className="p-4 mt-4">
                <Txt weight="bold" className="text-ink-900">{t("exam.resumeTitle")}</Txt>
                <Txt className="text-ink-500 text-sm leading-5 mt-1">{t("exam.resumeBody")}</Txt>
                <View className="mt-3 gap-2"><Button label={t("exam.resume")} variant="accent" onPress={() => router.replace(href(`/exam/${d.active!.id}`))} /><Button label={t("exam.discard")} variant="outline" onPress={() => discard(d.active!.id)} /></View>
              </Card>
            ) : (
              <>
                <Txt weight="semibold" className="text-ink-900 mt-5 mb-2">{t("exam.scope")}</Txt>
                {locked ? <Card className="p-3.5"><Txt className="text-ink-900 text-sm">{t("flash.scopeSelected", { name: d.label ?? "" })}</Txt></Card> : (
                  <View className="flex-row flex-wrap gap-2">
                    <ChoiceChip label={t("flash.scopeAll")} selected={!category} onPress={() => setCategory(undefined)} />
                    <ChoiceChip label={t("tab.varsity")} selected={category === "varsity"} onPress={() => setCategory("varsity")} />
                    <ChoiceChip label={t("tab.medical")} selected={category === "medical"} onPress={() => setCategory("medical")} />
                  </View>
                )}
                <Txt className="text-ink-500 text-xs mt-2">{t("exam.eligible", { a: el.available, r: STANDARD_EXAM_QUESTIONS })}</Txt>
                <View className="mt-4"><RuleNotice rule={d.rule} /></View>
                {el.ok ? (
                  <View className="mt-6"><Button label={busy ? t("exam.starting") : t("exam.start")} loading={busy} onPress={() => void start()} /></View>
                ) : (
                  <EmptyView icon="lock-closed-outline" title={t("exam.cannotStartTitle")} body={t("exam.cannotStartBody", { n: el.shortfall })} />
                )}
              </>
            )}
          </ScrollView>
        );
      })()}
    </Screen>
  );
}
