import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { BRAND } from "@/brand";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { TextField } from "@/components/common/TextField";
import { ChoiceChip } from "@/components/common/Toggle";
import { Stat } from "@/components/common/Stat";
import { ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { colors } from "@/theme";
import { listBatches } from "@/repositories/content";
import { activitySummary, getProfile, updateProfile } from "@/repositories/userData";
import { FLASH_PRESETS } from "@/services/timer";
import type { QuestionCategory } from "@/types/domain";

export default function ProfileScreen() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const q = useQuery(async (d) => ({ profile: await getProfile(d), activity: await activitySummary(d), batches: await listBatches(d) }));
  const [typedName, setName] = useState<string | null>(null);

  const save = (patch: Parameters<typeof updateProfile>[1]) => updateProfile(db, patch).then(q.reload, () => Alert.alert(t("error.title"), t("error.saveFailed")));
  const chooseLang = (l: "bn" | "en") => { setLang(l); void save({ language: l }); };

  if (q.loading) return <Screen edges={["top"]}><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ErrorView onRetry={q.reload} /></Screen>;
  const { profile, activity, batches } = q.data!;
  const target = profile.targetCategory;
  const name = typedName ?? profile.displayName;

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="pt-6 pb-4">
          <Txt font="display" weight="bold" className="text-ink-900 text-3xl">{t("profile.title")}</Txt>
          <Txt className="text-ink-500 text-sm leading-6 mt-2">{t("profile.localOnly")}</Txt>
        </View>

        <Card className="p-5">
          <Txt weight="semibold" className="text-ink-900 mb-2">{t("profile.name")}</Txt>
          <TextField value={name} onChangeText={setName} maxLength={60} placeholder={t("profile.namePlaceholder")} accessibilityLabel={t("profile.name")} />
          <View className="mt-3"><Button label={t("profile.saveName")} variant="outline" size="md" disabled={name.trim() === profile.displayName} onPress={() => void save({ displayName: name })} /></View>
        </Card>

        <Card className="p-5 mt-4">
          <Txt weight="semibold" className="text-ink-900">{t("profile.language")}</Txt>
          <View className="flex-row gap-2 mt-3">
            <View className="flex-1"><Button label="বাংলা" variant={lang === "bn" ? "primary" : "outline"} onPress={() => chooseLang("bn")} accessibilityState={{ selected: lang === "bn" }} /></View>
            <View className="flex-1"><Button label="English" variant={lang === "en" ? "primary" : "outline"} onPress={() => chooseLang("en")} accessibilityState={{ selected: lang === "en" }} /></View>
          </View>
          <Txt weight="semibold" className="text-ink-900 mt-5">{t("profile.flashDefault")}</Txt>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {FLASH_PRESETS.map((s) => <ChoiceChip key={s} label={t("flash.seconds", { n: s })} selected={profile.flashSeconds === s} onPress={() => void save({ flashSeconds: s })} />)}
          </View>
          <Txt weight="semibold" className="text-ink-900 mt-5">{t("profile.target")}</Txt>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {([["varsity", "tab.varsity"], ["medical", "tab.medical"]] as [QuestionCategory, "tab.varsity" | "tab.medical"][]).map(([c, k]) => (
              <ChoiceChip key={c} label={t(k)} selected={target === c} onPress={() => void save({ targetCategory: target === c ? null : c })} />
            ))}
          </View>
        </Card>

        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-6 mb-3">{t("profile.progress")}</Txt>
        {activity.sessions === 0 && activity.bookmarks === 0 ? (
          <Card className="p-4"><Txt className="text-ink-500 text-sm leading-6">{t("profile.noActivity")}</Txt></Card>
        ) : (
          <View className="flex-row gap-2.5">
            <Stat label={t("profile.sessions")} value={num(activity.sessions)} />
            <Stat label={t("profile.answeredTotal")} value={num(activity.answered)} />
            <Stat label={t("result.accuracy")} value={`${num(activity.accuracyPercent)}%`} />
          </View>
        )}
        <View className="mt-3 gap-2.5">
          <Button label={`${t("profile.openBookmarks")} (${num(activity.bookmarks)})`} variant="outline" icon={<Ionicons name="bookmark-outline" size={18} color={colors.brand700} />} onPress={() => router.push(href("/bookmarks"))} />
          <Button label={t("profile.openHistory")} variant="outline" icon={<Ionicons name="time-outline" size={18} color={colors.brand700} />} onPress={() => router.push(href("/history"))} />
        </View>

        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-6 mb-3">{t("profile.content")}</Txt>
        <Card className="p-4">
          {batches.length === 0 ? <Txt className="text-ink-500 text-sm leading-6">{t("profile.contentEmpty")}</Txt> : batches.map((b) => (
            <View key={b.id} className="py-1.5"><Txt weight="semibold" className="text-ink-900 text-sm">{b.description ?? b.id}</Txt><Txt className="text-ink-500 text-xs">{b.category} · {t("common.questionsCount", { n: b.questionCount })}</Txt></View>
          ))}
        </Card>

        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-6 mb-2">{t("profile.about")}</Txt>
        <Txt className="text-ink-500 text-sm leading-6">{BRAND.name} · {t("profile.version", { v: String(Constants.expoConfig?.version ?? "0.1.0") })}</Txt>
        <Txt className="text-ink-500 text-sm leading-6 mt-1">{t("profile.aboutBody")}</Txt>
      </ScrollView>
    </Screen>
  );
}
