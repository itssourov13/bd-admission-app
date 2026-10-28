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
import { useNum, useT } from "@/i18n";
import { countEligible, countReviewCandidates, getInstitution, getPaperRule, listPapers, scopeRule } from "@/repositories/content";
import { abandonSession, getActiveExam } from "@/repositories/sessions";
import { checkExamEligibility, STANDARD_EXAM_QUESTIONS, STANDARD_EXAM_SECONDS } from "@/services/exam";
import { startStandardExam } from "@/services/practiceService";
import type { QuestionCategory } from "@/types/domain";
import { orderSubjects } from "@/services/subjects";

export default function ExamSetup() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const scope = scopeFromParams(useLocalSearchParams());
  const [category, setCategory] = useState<QuestionCategory | undefined>(scope.category);
  const [subjectSelection, setSubjectSelection] = useState<{ scopeKey: string; subjects: string[] }>({ scopeKey: "", subjects: [] });
  const [busy, setBusy] = useState(false);
  const locked = Boolean(scope.institutionId || scope.paperId);
  const effective = { ...scope, category: locked ? scope.category : category };
  const baseKey = JSON.stringify(effective);
  const selectedSubjects = subjectSelection.scopeKey === baseKey ? subjectSelection.subjects : [];
  const selectedKey = selectedSubjects.join("|");

  const q = useQuery(async (d) => {
    const paperPattern = effective.paperId ? await getPaperRule(d, effective.paperId) : null;
    const verifiedCount = await countEligible(d, effective);
    const reviewCount = await countReviewCandidates(d, effective);
    const reviewMode = verifiedCount === 0 && reviewCount > 0;
    const countQuestions = reviewMode ? countReviewCandidates : countEligible;
    const rule = paperPattern ?? await scopeRule(d, effective, reviewMode);
    const selectionConfig = paperPattern?.selectionConfig ?? null;
    const subjectCounts = selectionConfig
      ? await Promise.all(orderSubjects(selectionConfig.subjects).map(async (subject) => ({
          subject,
          count: await countQuestions(d, { ...effective, subject })
        })))
      : [];
    const selectedReady = !selectionConfig || selectedSubjects.length === selectionConfig.subjectCount;
    const n = selectionConfig
      ? selectedReady ? await countQuestions(d, { ...effective, subjects: selectedSubjects }) : 0
      : reviewMode ? reviewCount : verifiedCount;
    return {
      n,
      reviewMode,
      rule,
      selectionConfig,
      subjectCounts,
      active: await getActiveExam(d),
      label: effective.paperId ? (await listPapers(d, { paperId: effective.paperId }))[0]?.title ?? null
        : effective.institutionId ? (await getInstitution(d, effective.institutionId))?.name ?? null : null
    };
  }, [baseKey, selectedKey]);

  const start = async () => {
    setBusy(true);
    try {
      const examFilter = q.data?.selectionConfig ? { ...effective, subjects: selectedSubjects } : effective;
      const result = await startStandardExam(db, examFilter, Date.now(), undefined, { includeUnverified: q.data?.reviewMode === true });
      if (result.ok) {
        router.replace(href(`/exam/${result.sessionId}`));
      } else {
        q.reload();
        if (result.reason === "subject_selection") {
          Alert.alert(t("exam.setupTitle"), t("exam.chooseSections", {
            count: num(q.data?.selectionConfig?.subjectCount ?? 0),
            available: num(q.data?.selectionConfig?.subjects.length ?? 0),
            per: num(q.data?.selectionConfig?.questionsPerSubject ?? 0)
          }));
        } else if (result.reason === "incomplete_section") {
          Alert.alert(t("exam.setupTitle"), t("exam.incompleteSection"));
        }
      }
    } catch {
      Alert.alert(t("error.title"), t("error.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const discard = (id: string) => Alert.alert(t("exam.discardTitle"), t("exam.discardBody"), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("exam.discard"), style: "destructive", onPress: () => { abandonSession(db, id, Date.now()).then(q.reload, () => Alert.alert(t("error.title"), t("error.saveFailed"))); } }
  ]);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={q.data?.rule.status === "illustrative" && effective.paperId ? t("exam.sourcePracticeTitle") : t("exam.setupTitle")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (() => {
        const d = q.data!;
        const required = effective.paperId ? d.rule.totalQuestions ?? STANDARD_EXAM_QUESTIONS : STANDARD_EXAM_QUESTIONS;
        const duration = effective.paperId ? d.rule.durationSeconds ?? STANDARD_EXAM_SECONDS : STANDARD_EXAM_SECONDS;
        const eligibility = checkExamEligibility(d.n, required);
        const config = d.selectionConfig;
        const subjectReady = !config || selectedSubjects.length === config.subjectCount;
        const canStart = subjectReady && eligibility.ok;
        const toggleSubject = (subject: string) => {
          const current = subjectSelection.scopeKey === baseKey ? subjectSelection.subjects : [];
          const next = current.includes(subject)
            ? current.filter((item) => item !== subject)
            : config && current.length >= config.subjectCount ? current : [...current, subject];
          setSubjectSelection({ scopeKey: baseKey, subjects: next });
        };

        return (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
            <Txt className="text-ink-500 text-sm leading-6">{t("exam.setupMeta", { questions: num(required), minutes: num(Math.ceil(duration / 60)) })}</Txt>
            {d.reviewMode ? <Card className="p-3.5 mt-3"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
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

                {config ? (
                  <View className="mt-4">
                    <Txt weight="semibold" className="text-ink-900 mb-1">{t("exam.chooseSections", {
                      count: num(config.subjectCount), available: num(config.subjects.length),
                      per: num(config.questionsPerSubject ?? 0)
                    })}</Txt>
                    <Txt className="text-ink-500 text-xs leading-5 mb-3">{t("exam.sourcePatternNote")}</Txt>
                    <View className="flex-row flex-wrap gap-2">
                      {d.subjectCounts.map(({ subject, count }) => {
                        const perSubject = config.questionsPerSubject ?? 1;
                        const eligible = count >= perSubject;
                        if (!eligible) {
                          return <Card key={subject} className="p-2.5"><Txt className="text-ink-500 text-sm">{subject} ({num(count)}/{num(perSubject)})</Txt><Txt className="text-ink-500 text-xs">{t("exam.incompleteSectionShort")}</Txt></Card>;
                        }
                        return <ChoiceChip key={subject} label={`${subject} (${num(count)}/${num(perSubject)})`} selected={selectedSubjects.includes(subject)} onPress={() => toggleSubject(subject)} />;
                      })}
                    </View>
                    <Txt className="text-ink-500 text-xs mt-3">{t("exam.sectionsSelected", { count: num(selectedSubjects.length), required: num(config.subjectCount) })}</Txt>
                  </View>
                ) : null}

                <Txt className="text-ink-500 text-xs mt-3">{t("exam.eligible", { a: num(eligibility.available), r: num(required) })}</Txt>
                <View className="mt-4"><RuleNotice rule={d.rule} /></View>
                {canStart ? (
                  <View className="mt-6"><Button label={busy ? t("exam.starting") : t("exam.start")} loading={busy} onPress={() => void start()} /></View>
                ) : config && !subjectReady ? (
                  <Card className="p-3.5 mt-4"><Txt className="text-ink-500 text-sm leading-5">{t("exam.chooseSections", {
                    count: num(config.subjectCount), available: num(config.subjects.length), per: num(config.questionsPerSubject ?? 0)
                  })}</Txt></Card>
                ) : (
                  <EmptyView icon="lock-closed-outline" title={t("exam.cannotStartTitle")} body={t("exam.cannotStartBody", { n: num(eligibility.shortfall) })} />
                )}
              </>
            )}
          </ScrollView>
        );
      })()}
    </Screen>
  );
}
