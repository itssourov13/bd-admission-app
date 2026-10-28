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
import { href, scopeFromParams, scopeParams } from "@/features/navigation/links";
import { useNum, useT, type TranslationKey } from "@/i18n";
import { colors, feedback } from "@/theme";
import { countEligible, countReviewCandidates, getInstitution, listPapers, scopeRule } from "@/repositories/content";
import { getProfile, updateProfile } from "@/repositories/userData";
import { buildSubjectOptions, isCanonicalSubject, SUBJECT_LABEL_KEYS, SCIENCE_SUBJECT_ORDER } from "@/services/subjects";
import { clampFlashSeconds, FLASH_DEFAULT_SECONDS, FLASH_MAX_SECONDS, FLASH_MIN_SECONDS, FLASH_PRESETS } from "@/services/timer";
import type { QuestionCategory } from "@/types/domain";

export default function FlashSetup() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scope = scopeFromParams(params);
  const scopeLocked = Boolean(scope.institutionId || scope.paperId);
  const [category, setCategory] = useState<QuestionCategory | undefined>(scope.category);
  const [subject, setSubject] = useState<string | undefined>(
    scope.subject && isCanonicalSubject(scope.subject) ? scope.subject : undefined
  );
  const baseScope = { ...scope, category: scopeLocked ? scope.category : category, subject: undefined };
  const effective = { ...baseScope, subject };
  const [picked, setSeconds] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const key = JSON.stringify(effective);

  const q = useQuery(async (d) => {
    const label = effective.paperId
      ? (await listPapers(d, { paperId: effective.paperId }))[0]?.title ?? null
      : effective.institutionId ? (await getInstitution(d, effective.institutionId))?.name ?? null : null;
    const verifiedCount = await countEligible(d, baseScope);
    const reviewCount = await countReviewCandidates(d, baseScope);
    const reviewMode = verifiedCount === 0 && reviewCount > 0;
    const countQuestions = reviewMode ? countReviewCandidates : countEligible;
    const subjectCounts = await Promise.all(SCIENCE_SUBJECT_ORDER.map(async (name) => ({
      subject: name,
      count: await countQuestions(d, { ...baseScope, subject: name })
    })));
    return {
      n: await countQuestions(d, effective),
      reviewMode,
      rule: await scopeRule(d, effective, reviewMode),
      label,
      profile: await getProfile(d),
      subjectOptions: buildSubjectOptions(Object.fromEntries(subjectCounts.map((item) => [item.subject, item.count] as const)))
    };
  }, [key]);

  const seconds = picked ?? q.data?.profile.flashSeconds ?? FLASH_DEFAULT_SECONDS;
  const start = async () => {
    const s = clampFlashSeconds(custom ? Number(custom) : seconds);
    try { await updateProfile(db, { flashSeconds: s }); } catch { /* Preference only; don't block practice. */ }
    router.replace(href("/flash/play", { ...scopeParams(effective), seconds: s, reviewUnverified: q.data?.reviewMode ? 1 : undefined }));
  };
  const customInvalid = custom !== "" && (!Number.isFinite(Number(custom)) || Number(custom) < FLASH_MIN_SECONDS || Number(custom) > FLASH_MAX_SECONDS);
  const subjectLabel = (name: string) => {
    const labelKey = SUBJECT_LABEL_KEYS[name as keyof typeof SUBJECT_LABEL_KEYS] as TranslationKey | undefined;
    return labelKey ? t(labelKey) : name;
  };

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

          <Txt weight="semibold" className="text-ink-900 mt-5 mb-2">{t("flash.subjectFilter")}</Txt>
          <View className="flex-row flex-wrap gap-2">
            <ChoiceChip label={t("flash.allSubjects")} selected={!subject} onPress={() => setSubject(undefined)} />
            {q.data!.subjectOptions.map((option) => (
              <ChoiceChip
                key={option.subject}
                label={`${subjectLabel(option.subject)} · ${num(option.count)}`}
                selected={subject === option.subject}
                disabled={option.count === 0}
                onPress={() => setSubject(option.subject)}
              />
            ))}
          </View>
          <Txt className="text-ink-500 text-xs mt-3">{t("flash.available", { n: q.data!.n })}</Txt>

          {q.data!.n === 0 ? (
            <EmptyView icon="albums-outline" title={subject ? t("flash.subjectUnavailable", { subject: subjectLabel(subject) }) : t("flash.emptyTitle")} body={t("flash.emptyBody")} actionLabel={subject ? t("flash.allSubjects") : undefined} onAction={subject ? () => setSubject(undefined) : undefined} />
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
              <View className="mt-5"><RuleNotice rule={q.data!.rule} /></View>
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
