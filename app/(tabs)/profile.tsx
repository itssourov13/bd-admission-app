import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
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
import { colors, feedback } from "@/theme";
import { activitySummary, getProfile, saveDisplayName, updateProfile } from "@/repositories/userData";
import { FLASH_PRESETS } from "@/services/timer";
import type { QuestionCategory } from "@/types/domain";

export default function ProfileScreen() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const q = useQuery(async (d) => ({ profile: await getProfile(d), activity: await activitySummary(d) }));
  const [typedName, setName] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<"idle" | "saved" | "error">("idle");
  const [savingName, setSavingName] = useState(false);
  // Latest unsaved draft, so a name typed but not yet saved is persisted when the person leaves this screen.
  const pendingName = useRef<string | null>(null);
  const savingNameRef = useRef(false);

  const save = (patch: Parameters<typeof updateProfile>[1]) => updateProfile(db, patch).then(q.reload, () => Alert.alert(t("error.title"), t("error.saveFailed")));
  const persistName = async (value: string) => {
    if (savingNameRef.current) return;
    savingNameRef.current = true;
    // Clear the blur/unmount fallback before starting a write, avoiding duplicate concurrent saves.
    pendingName.current = null;
    setSavingName(true);
    try {
      const persisted = await saveDisplayName(db, value);
      setName(persisted);
      setNameStatus("saved");
      q.reload();
    } catch {
      pendingName.current = value;
      setNameStatus("error");
      Alert.alert(t("error.title"), t("error.saveFailed"));
    } finally {
      savingNameRef.current = false;
      setSavingName(false);
    }
  };
  useFocusEffect(useCallback(() => () => {
    const draft = pendingName.current;
    if (draft !== null) void saveDisplayName(db, draft).then(() => { pendingName.current = null; }, () => undefined);
  }, [db]));
  useEffect(() => { if (nameStatus === "saved") { const id = setTimeout(() => setNameStatus("idle"), 3000); return () => clearTimeout(id); } return undefined; }, [nameStatus]);
  const chooseLang = (l: "bn" | "en") => { setLang(l); void save({ language: l }); };

  if (q.loading) return <Screen edges={["top"]}><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ErrorView onRetry={q.reload} /></Screen>;
  const { profile, activity } = q.data!;
  const target = profile.targetCategory;
  const name = typedName ?? profile.displayName;
  const dirty = name.trim().slice(0, 60) !== profile.displayName;

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="pt-6 pb-4">
          <Txt font="display" weight="bold" className="text-ink-900 text-3xl">{t("profile.title")}</Txt>
          <Txt className="text-ink-500 text-sm leading-6 mt-2">{t("profile.localOnly")}</Txt>
        </View>

        <Card className="p-5">
          <Txt weight="semibold" className="text-ink-900 mb-2">{t("profile.name")}</Txt>
          <TextField
            value={name}
            editable={!savingName}
            onChangeText={(v) => {
              setName(v);
              pendingName.current = v.trim().slice(0, 60) !== profile.displayName ? v : null;
              setNameStatus("idle");
            }}
            onBlur={() => { if (dirty && !savingNameRef.current) void persistName(name); }}
            onSubmitEditing={() => { if (dirty && !savingNameRef.current) void persistName(name); }}
            returnKeyType="done"
            maxLength={60}
            placeholder={t("profile.namePlaceholder")}
            accessibilityLabel={t("profile.name")}
          />
          <Txt accessibilityLiveRegion="polite" className="text-ink-500 text-xs mt-2" style={nameStatus === "error" ? { color: feedback.danger700 } : undefined}>
            {nameStatus === "error" ? t("error.saveFailed") : dirty ? t("profile.nameUnsaved") : nameStatus === "saved" ? t("profile.nameSaved") : ""}
          </Txt>
          <View className="mt-3"><Button label={t("profile.saveName")} variant="outline" size="md" loading={savingName} disabled={!dirty || savingName} onPress={() => void persistName(name)} /></View>
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

        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-6 mb-2">{t("profile.about")}</Txt>
        <Txt className="text-ink-500 text-sm leading-6">{BRAND.name} · {t("profile.version", { v: String(Constants.expoConfig?.version ?? "0.1.0") })}</Txt>
        <Txt className="text-ink-500 text-sm leading-6 mt-1">{t("profile.aboutBody")}</Txt>
      </ScrollView>
    </Screen>
  );
}
