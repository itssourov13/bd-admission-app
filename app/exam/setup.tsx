import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { RuleNotice } from "@/components/common/RuleNotice";
import { MarkingProfilePicker } from "@/components/common/MarkingProfilePicker";
import { ChoiceChip } from "@/components/common/Toggle";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { universityLabel } from "@/features/catalog/universityLabel";
import { href, scopeFromParams } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { countPoolBySubject, getInstitution, getPaperRule, listPapers, scopeRule } from "@/repositories/content";
import { resolveMarkingChoice } from "@/repositories/marking";
import { abandonSession, getActiveExam } from "@/repositories/sessions";
import { checkExamEligibility, clampCustomQuestions, customCountOptions, customMinuteOptions, planExam, suggestCustomMinutes } from "@/services/exam";
import { startStandardExam } from "@/services/practiceService";
import type { QuestionCategory } from "@/types/domain";
import { buildSubjectOptions, orderSubjects } from "@/services/subjects";
import { combinedCount, pruneUnavailable, selectedSubjectsOf, withSubjectSelection } from "@/services/subjectSelection";
import { SubjectSelector } from "@/components/common/SubjectSelector";

export default function ExamSetup() {
  const t = useT();
  const { lang } = useLang();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const scope = scopeFromParams(useLocalSearchParams());
  const [category, setCategory] = useState<QuestionCategory | undefined>(scope.category);
  // Section selection for "choose N of M subjects" papers (paper-specific pattern); unchanged behaviour.
  const [subjectSelection, setSubjectSelection] = useState<{ scopeKey: string; subjects: string[] }>({ scopeKey: "", subjects: [] });
  // Shared All/Single/Multiple subject selection for the generic exam and Custom Practice.
  const [selected, setSelected] = useState<string[]>(() => selectedSubjectsOf(scope));
  const [busy, setBusy] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState<number | null>(null);
  const locked = Boolean(scope.institutionId || scope.institutionIds?.length || scope.paperId);
  const scopeBase = { ...scope, category: locked ? scope.category : category, subject: undefined, subjects: undefined };
  const baseKey = JSON.stringify(scopeBase);
  const selectedSections = subjectSelection.scopeKey === baseKey ? subjectSelection.subjects : [];

  // Scope-level data only: subject toggles never re-run these queries (counts come from one grouped query).
  const base = useQuery(async (d) => {
    const paperPattern = scopeBase.paperId ? await getPaperRule(d, scopeBase.paperId) : null;
    const verified = await countPoolBySubject(d, scopeBase, false);
    const reviewMode = verified.total === 0 && (await countPoolBySubject(d, scopeBase, true)).total > 0;
    const pool = reviewMode ? await countPoolBySubject(d, scopeBase, true) : verified;
    const selectionConfig = paperPattern?.selectionConfig ?? null;
    return {
      reviewMode,
      total: pool.total,
      bySubject: pool.bySubject,
      subjectOptions: buildSubjectOptions(pool.bySubject),
      paperPattern,
      plan: planExam(scopeBase.paperId, paperPattern),
      selectionConfig,
      subjectCounts: selectionConfig
        ? orderSubjects(selectionConfig.subjects).map((subject) => ({ subject, count: pool.bySubject[subject] ?? 0 }))
        : [],
      active: await getActiveExam(d),
      label: scopeBase.paperId ? (await listPapers(d, { paperId: scopeBase.paperId }))[0]?.title ?? null
        : scopeBase.institutionIds?.length ? await universityLabel(d, scopeBase.institutionIds[0], lang)
        : scopeBase.institutionId ? (await getInstitution(d, scopeBase.institutionId))?.name ?? null : null
    };
  }, [baseKey]);

  const baseData = base.data;
  const config = baseData?.selectionConfig ?? null;
  const available = baseData && !config ? pruneUnavailable(selected, baseData.bySubject) : selected;
  const sectionCount = baseData && config
    ? selectedSections.reduce((sum, subject) => sum + (baseData.bySubject[subject] ?? 0), 0)
    : 0;
  const n = !baseData ? 0 : config
    ? (selectedSections.length === config.subjectCount ? sectionCount : 0)
    : combinedCount(available, baseData.bySubject, baseData.total);
  const ruleFilter = config ? { ...scopeBase, subjects: selectedSections } : withSubjectSelection(scopeBase, available);
  const ruleKey = JSON.stringify(ruleFilter);
  const ruleQuery = useQuery(
    async (d) => (baseData ? baseData.paperPattern ?? await scopeRule(d, ruleFilter, baseData.reviewMode) : null),
    [ruleKey, baseData !== null, baseData?.reviewMode]
  );
  const q = base;

  const start = async () => {
    setBusy(true);
    try {
      const examFilter = q.data?.selectionConfig ? { ...scopeBase, subjects: selectedSections } : withSubjectSelection(scopeBase, available);
      const chosenCount = clampCustomQuestions(customQuestions, n);
      const custom = q.data?.plan.kind === "unavailable" && chosenCount !== null
        ? { questions: chosenCount, seconds: (customMinutes ?? suggestCustomMinutes(chosenCount)) * 60 } : undefined;
      const markingChoice = await resolveMarkingChoice(db, examFilter, profileId);
      const result = await startStandardExam(db, examFilter, undefined, undefined, { includeUnverified: q.data?.reviewMode === true, custom, markingChoice });
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

  const rule = ruleQuery.data;
  const isIllustrative = rule?.status === "illustrative" && Boolean(scopeBase.paperId);
  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={q.data?.plan.kind === "unavailable" ? t("exam.customTitle") : isIllustrative ? t("exam.sourcePracticeTitle") : t("exam.setupTitle")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (() => {
        const d = q.data!;
        // Exact papers never inherit the generic 100/60 defaults: they use their own stored pattern or an explicit custom choice.
        const isCustom = d.plan.kind === "unavailable";
        const countOptions = isCustom ? customCountOptions(n) : [];
        const customN = isCustom ? clampCustomQuestions(customQuestions, n) : null;
        const customMins = customN === null ? null : customMinutes ?? suggestCustomMinutes(customN);
        const required = d.plan.kind === "unavailable" ? customN ?? 0 : d.plan.required;
        const duration = d.plan.kind === "unavailable" ? (customMins ?? 0) * 60 : d.plan.durationSeconds;
        const eligibility = checkExamEligibility(n, required);
        const sectionConfig = d.selectionConfig;
        const subjectReady = !sectionConfig || selectedSections.length === sectionConfig.subjectCount;
        const customReady = !isCustom || customN !== null;
        const canStart = subjectReady && customReady && eligibility.ok;
        const toggleSection = (subject: string) => {
          const current = selectedSections;
          const next = current.includes(subject)
            ? current.filter((item) => item !== subject)
            : sectionConfig && current.length >= sectionConfig.subjectCount ? current : [...current, subject];
          setSubjectSelection({ scopeKey: baseKey, subjects: next });
        };

        return (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
            {customReady ? <Txt className="text-ink-500 text-sm leading-6">{t("exam.setupMeta", { questions: num(required), minutes: num(Math.ceil(duration / 60)) })}</Txt> : null}
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

                {sectionConfig ? (
                  <View className="mt-4">
                    <Txt weight="semibold" className="text-ink-900 mb-1">{t("exam.chooseSections", {
                      count: num(sectionConfig.subjectCount), available: num(sectionConfig.subjects.length),
                      per: num(sectionConfig.questionsPerSubject ?? 0)
                    })}</Txt>
                    <Txt className="text-ink-500 text-xs leading-5 mb-3">{t("exam.sourcePatternNote")}</Txt>
                    <View className="flex-row flex-wrap gap-2">
                      {d.subjectCounts.map(({ subject, count }) => {
                        const perSubject = sectionConfig.questionsPerSubject ?? 1;
                        const eligible = count >= perSubject;
                        if (!eligible) {
                          return <Card key={subject} className="p-2.5"><Txt className="text-ink-500 text-sm">{subject} ({num(count)}/{num(perSubject)})</Txt><Txt className="text-ink-500 text-xs">{t("exam.incompleteSectionShort")}</Txt></Card>;
                        }
                        return <ChoiceChip key={subject} multi label={`${subject} (${num(count)}/${num(perSubject)})`} selected={selectedSections.includes(subject)} onPress={() => toggleSection(subject)} />;
                      })}
                    </View>
                    <Txt className="text-ink-500 text-xs mt-3">{t("exam.sectionsSelected", { count: num(selectedSections.length), required: num(sectionConfig.subjectCount) })}</Txt>
                  </View>
                ) : (
                  <SubjectSelector title={t("flash.subjectFilter")} options={d.subjectOptions} total={d.total} selected={available} onChange={setSelected} />
                )}

                <Txt className="text-ink-500 text-xs mt-3">{t("exam.eligible", { a: num(eligibility.available), r: num(required) })}</Txt>
                {isCustom ? (
                  <Card className="p-4 mt-4">
                    <Txt weight="bold" className="text-ink-900">{t("exam.customTitle")}</Txt>
                    <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("exam.customBody")}</Txt>
                    {customN === null ? (
                      <Txt className="text-ink-700 text-sm leading-5 mt-3">{t("exam.customTooFew")}</Txt>
                    ) : (
                      <>
                        <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("exam.customCountHint", { max: num(countOptions[countOptions.length - 1] ?? 0) })}</Txt>
                        <Txt weight="semibold" className="text-ink-900 text-sm mt-3 mb-2">{t("exam.customQuestions")}</Txt>
                        <View className="flex-row flex-wrap gap-2">{countOptions.map((c) => <ChoiceChip key={c} label={num(c)} selected={customN === c} onPress={() => setCustomQuestions(c)} />)}</View>
                        <Txt weight="semibold" className="text-ink-900 text-sm mt-3 mb-2">{t("exam.customMinutes")}</Txt>
                        <View className="flex-row flex-wrap gap-2">{customMinuteOptions(customN).map((m) => <ChoiceChip key={m} label={num(m)} selected={customMins === m} onPress={() => setCustomMinutes(m)} />)}</View>
                      </>
                    )}
                  </Card>
                ) : null}
                {rule ? <View className="mt-4"><RuleNotice rule={rule} /></View> : null}
                <MarkingProfilePicker filter={ruleFilter} value={profileId} onChange={setProfileId} baseRule={isCustom ? null : rule} customPractice={isCustom} />
                {canStart ? (
                  <View className="mt-6"><Button label={busy ? t("exam.starting") : t("exam.start")} loading={busy} onPress={() => void start()} /></View>
                ) : sectionConfig && !subjectReady ? (
                  <Card className="p-3.5 mt-4"><Txt className="text-ink-500 text-sm leading-5">{t("exam.chooseSections", {
                    count: num(sectionConfig.subjectCount), available: num(sectionConfig.subjects.length), per: num(sectionConfig.questionsPerSubject ?? 0)
                  })}</Txt></Card>
                ) : isCustom && !customReady ? null : (
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
