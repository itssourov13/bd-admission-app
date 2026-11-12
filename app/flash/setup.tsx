import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { RuleNotice } from "@/components/common/RuleNotice";
import { TextField } from "@/components/common/TextField";
import { ChoiceChip } from "@/components/common/Toggle";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { universityLabel } from "@/features/catalog/universityLabel";
import { href, scopeFromParams, scopeParams } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { colors, feedback } from "@/theme";
import { countPoolBySubject, getInstitution, listPapers, scopeRule } from "@/repositories/content";
import { getProfile, updateProfile } from "@/repositories/userData";
import { buildSubjectOptions } from "@/services/subjects";
import { combinedCount, pruneUnavailable, selectedSubjectsOf, withSubjectSelection } from "@/services/subjectSelection";
import { SubjectSelector } from "@/components/common/SubjectSelector";
import { clampFlashSeconds, FLASH_DEFAULT_SECONDS, FLASH_MAX_SECONDS, FLASH_MIN_SECONDS, FLASH_PRESETS } from "@/services/timer";
import type { QuestionCategory } from "@/types/domain";

export default function FlashSetup() {
  const t = useT();
  const { lang } = useLang();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scope = scopeFromParams(params);
  const scopeLocked = Boolean(scope.institutionId || scope.institutionIds?.length || scope.paperId);
  const [category, setCategory] = useState<QuestionCategory | undefined>(scope.category);
  const [selected, setSelected] = useState<string[]>(() => selectedSubjectsOf(scope));
  const baseScope = { ...scope, category: scopeLocked ? scope.category : category, subject: undefined, subjects: undefined };
  const baseKey = JSON.stringify(baseScope);
  const [picked, setSeconds] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  // Scope-level data: independent of the subject selection, so toggling chips never re-runs these queries.
  const base = useQuery(async (d) => {
    const label = baseScope.paperId
      ? (await listPapers(d, { paperId: baseScope.paperId }))[0]?.title ?? null
      : baseScope.institutionIds?.length ? await universityLabel(d, baseScope.institutionIds[0], lang)
      : baseScope.institutionId ? (await getInstitution(d, baseScope.institutionId))?.name ?? null : null;
    const verified = await countPoolBySubject(d, baseScope, false);
    const reviewMode = verified.total === 0 && (await countPoolBySubject(d, baseScope, true)).total > 0;
    const pool = reviewMode ? await countPoolBySubject(d, baseScope, true) : verified;
    return {
      label, reviewMode, total: pool.total, bySubject: pool.bySubject,
      profile: await getProfile(d),
      subjectOptions: buildSubjectOptions(pool.bySubject)
    };
  }, [baseKey]);

  const available = base.data ? pruneUnavailable(selected, base.data.bySubject) : selected;
  const effective = withSubjectSelection(baseScope, available);
  const selectedKey = available.join("|");
  const reviewMode = base.data?.reviewMode ?? false;
  const ruleQuery = useQuery(async (d) => (base.data ? scopeRule(d, effective, reviewMode) : null), [baseKey, selectedKey, reviewMode, base.data !== null]);
  const n = base.data ? combinedCount(available, base.data.bySubject, base.data.total) : 0;
  const q = base;

  const seconds = picked ?? q.data?.profile.flashSeconds ?? FLASH_DEFAULT_SECONDS;
  const start = async () => {
    const s = clampFlashSeconds(custom ? Number(custom) : seconds);
    try { await updateProfile(db, { flashSeconds: s }); } catch { /* Preference only; don't block practice. */ }
    router.replace(href("/flash/play", { ...scopeParams(effective), seconds: s, reviewUnverified: q.data?.reviewMode ? 1 : undefined }));
  };
  const customInvalid = custom !== "" && (!Number.isFinite(Number(custom)) || Number(custom) < FLASH_MIN_SECONDS || Number(custom) > FLASH_MAX_SECONDS);
  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("flash.setupTitle")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <Txt className="text-ink-500 text-sm leading-6">{t("flash.setupBody")}</Txt>
          {q.data!.reviewMode ? <Card className="p-3.5 mt-3"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
          <Txt weight="semibold" className="text-ink-900 mt-5 mb-2">{t("flash.scope")}</Txt>
          {scopeLocked ? (
            <Card className="p-3.5"><Txt className="text-ink-900 text-sm">{t("flash.scopeSelected", { name: q.data!.label ?? "" })}</Txt></Card>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              <ChoiceChip label={t("flash.scopeAll")} selected={!category} onPress={() => setCategory(undefined)} />
              <ChoiceChip label={t("tab.varsity")} selected={category === "varsity"} onPress={() => setCategory("varsity")} />
              <ChoiceChip label={t("tab.medical")} selected={category === "medical"} onPress={() => setCategory("medical")} />
            </View>
          )}

          <SubjectSelector title={t("flash.subjectFilter")} options={q.data!.subjectOptions} total={q.data!.total} selected={available} onChange={setSelected} />
          <Txt className="text-ink-500 text-xs mt-3">{t("flash.available", { n })}</Txt>

          {n === 0 ? (
            <EmptyView icon="albums-outline" title={available.length ? t("subject.unavailableCombined") : t("flash.emptyTitle")} body={t("flash.emptyBody")} actionLabel={available.length ? t("subject.clear") : undefined} onAction={available.length ? () => setSelected([]) : undefined} />
          ) : (
            <>
              <Txt weight="semibold" className="text-ink-900 mt-6 mb-2">{t("flash.timer")}</Txt>
              <View className="flex-row flex-wrap gap-2">
                {FLASH_PRESETS.map((p) => (
                  <ChoiceChip key={p} label={t("flash.seconds", { n: p })} selected={!custom && seconds === p} onPress={() => { setCustom(""); setSeconds(p); }} />
                ))}
              </View>
              <Txt className="text-ink-500 text-xs mt-4 mb-1.5">{t("flash.custom")}</Txt>
              <TextField keyboardType="number-pad" value={custom} maxLength={3} onChangeText={(v) => setCustom(v.replace(/[^0-9]/g, ""))} accessibilityLabel={t("flash.custom")} placeholder={String(num(seconds))} />
              {customInvalid ? <Txt className="text-xs mt-1" style={{ color: feedback.danger700 }}>{t("flash.custom")}</Txt> : null}
              {ruleQuery.data ? <View className="mt-5"><RuleNotice rule={ruleQuery.data} /></View> : null}
              <View className="mt-6">
                <Button label={t("flash.start")} disabled={customInvalid} icon={<Ionicons name="flash" size={18} color={colors.white} />} onPress={() => void start()} />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
