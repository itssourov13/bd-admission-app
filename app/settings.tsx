import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { BRAND } from "@/brand";
import { Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ChoiceChip } from "@/components/common/Toggle";
import { MathText } from "@/components/common/MathText";
import { SegmentedControl, SettingsRow, SettingsSection, SettingsSwitch } from "@/components/settings/SettingsControls";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { contentTotals, listBatches } from "@/repositories/content";
import { getProfile, updateProfile } from "@/repositories/userData";
import { FLASH_PRESETS } from "@/services/timer";
import { useSettings, useTheme, type MotionPreference, type TextSize, type ThemePreference } from "@/settings";

/** Central Settings screen. Existing preferences (language, Flash default, marking rules) are surfaced here, not duplicated. */
export default function SettingsScreen() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const { colors } = useTheme();
  const { lang, setLang } = useLang();
  const { settings, update } = useSettings();
  const q = useQuery(async (d) => ({ profile: await getProfile(d), totals: await contentTotals(d), batches: await listBatches(d) }));

  const saveFailed = () => Alert.alert(t("error.title"), t("error.saveFailed"));
  const chooseLang = (l: "bn" | "en") => { setLang(l); void updateProfile(db, { language: l }).then(q.reload, saveFailed); };
  const chooseFlash = (s: number) => void updateProfile(db, { flashSeconds: s }).then(q.reload, saveFailed);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "system", label: t("settings.theme.system") }, { value: "light", label: t("settings.theme.light") }, { value: "dark", label: t("settings.theme.dark") }
  ];
  const motionOptions: { value: MotionPreference; label: string }[] = [
    { value: "system", label: t("settings.motion.system") }, { value: "reduced", label: t("settings.motion.reduced") }, { value: "full", label: t("settings.motion.full") }
  ];
  const sizeOptions: { value: TextSize; label: string }[] = [
    { value: "small", label: t("settings.textSize.small") }, { value: "normal", label: t("settings.textSize.normal") }, { value: "large", label: t("settings.textSize.large") }
  ];
  const data = q.data;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("settings.title")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <SettingsSection title={t("settings.appearance")}>
          <SettingsRow first label={t("settings.theme")} hint={t("settings.themeHint")}>
            <SegmentedControl label={t("settings.theme")} value={settings.theme} options={themeOptions} onChange={(theme) => update({ theme })} />
          </SettingsRow>
          <SettingsRow label={t("settings.questionText")}>
            <SegmentedControl label={t("settings.questionText")} value={settings.questionTextSize} options={sizeOptions} onChange={(questionTextSize) => update({ questionTextSize })} />
            <View className="mt-3 rounded-2xl bg-sand-100 p-3.5">
              <MathText weight="semibold" size={17} lineHeight={28} className="text-ink-900">{t("settings.textPreview")}</MathText>
            </View>
          </SettingsRow>
          <SettingsRow label={t("settings.motion")} hint={t("settings.motionHint")}>
            <SegmentedControl label={t("settings.motion")} value={settings.motion} options={motionOptions} onChange={(motion) => update({ motion })} />
          </SettingsRow>
          <SettingsRow label={t("settings.haptics")} hint={t("settings.hapticsHint")} trailing={<SettingsSwitch label={t("settings.haptics")} value={settings.haptics} onValueChange={(haptics) => update({ haptics })} />} />
        </SettingsSection>

        <SettingsSection title={t("settings.practice")}>
          <SettingsRow first label={t("settings.language")}>
            <SegmentedControl<"bn" | "en"> label={t("settings.language")} value={lang} options={[{ value: "bn", label: "বাংলা" }, { value: "en", label: "English" }]} onChange={chooseLang} />
          </SettingsRow>
          <SettingsRow label={t("profile.flashDefault")}>
            <View className="flex-row flex-wrap gap-2">
              {FLASH_PRESETS.map((s) => <ChoiceChip key={s} label={t("flash.seconds", { n: s })} selected={data?.profile.flashSeconds === s} onPress={() => chooseFlash(s)} />)}
            </View>
          </SettingsRow>
          <SettingsRow
            label={t("settings.markingDefault")}
            hint={t("settings.markingHint")}
            onPress={() => router.push(href("/marking-profiles"))}
            trailing={<Ionicons name="chevron-forward" size={19} color={colors.ink400} />}
          />
        </SettingsSection>

        <SettingsSection title={t("settings.content")}>
          <SettingsRow first label={data ? t("settings.contentSummary", { q: data.totals.questions, i: data.totals.institutions, b: data.batches.length }) : t("common.loading")} hint={t("settings.storageNote")} />
        </SettingsSection>

        <SettingsSection title={t("settings.about")}>
          <SettingsRow first label={BRAND.name} hint={`${t("settings.version", { v: String(Constants.expoConfig?.version ?? BRAND.version) })} · ${num(Constants.expoConfig?.android?.versionCode ?? "")}`.replace(/ · $/, "")} />
        </SettingsSection>
        <Txt className="text-ink-500 text-xs leading-5 mt-4">{t("profile.aboutBody")}</Txt>
      </ScrollView>
    </Screen>
  );
}
