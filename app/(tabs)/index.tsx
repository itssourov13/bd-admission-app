import { BRAND } from "@/brand";
import { ScrollView, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, Txt, Card, Button, Logo, Chip } from "@/components/ui";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDbState } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { colors, gradients, shadow } from "@/theme";
import { contentTotals } from "@/repositories/content";
import { getActiveExam } from "@/repositories/sessions";
import { getProfile } from "@/repositories/userData";

export default function HomeScreen() {
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const { state } = useDbState();
  const q = useQuery(async (db) => ({
    totals: await contentTotals(db),
    active: await getActiveExam(db),
    profile: await getProfile(db)
  }));

  if (q.loading) return <Screen edges={["top"]}><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ErrorView onRetry={q.reload} /></Screen>;
  const { totals, active, profile } = q.data!;
  const empty = totals.questions === 0;

  const shortcut = (icon: keyof typeof Ionicons.glyphMap, tint: string, bgClass: string, title: string, subtitle: string, to: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(href(to))} className="mb-3">
      <Card className="p-4 flex-row items-center gap-3">
        <View className={`w-12 h-12 rounded-2xl ${bgClass} items-center justify-center`}>
          <Ionicons name={icon} size={25} color={tint} />
        </View>
        <View className="flex-1">
          <Txt weight="bold" className="text-ink-900 text-base">{title}</Txt>
          <Txt className="text-ink-500 text-sm mt-1">{subtitle}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
      </Card>
    </Pressable>
  );

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-3 mb-5">
          <Logo size={46} />
          <View className="flex-1">
            <Txt weight="bold" className="text-ink-900 text-lg">{profile.displayName || BRAND.name}</Txt>
            <Txt className="text-ink-500 text-xs">{BRAND.tagline[lang]}</Txt>
          </View>
          <Chip label={t("common.offline")} tone="brand" />
        </View>

        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.brand, { borderRadius: 24, padding: 22, overflow: "hidden" }]}>
          <Txt weight="bold" className="text-brand-200 text-[11px] uppercase" style={{ letterSpacing: 1.1 }}>{t("home.eyebrow")}</Txt>
          <Txt font="display" weight="bold" className="text-white text-[26px] leading-[36px] mt-3">{t("home.title")}</Txt>
          <Txt className="text-white/90 text-sm leading-6 mt-3">{t("home.subtitle")}</Txt>
        </LinearGradient>

        {state.importIssues.length > 0 ? (
          <Card className="p-4 mt-4"><Txt className="text-ink-700 text-sm leading-5">{t("error.importWarning")}</Txt></Card>
        ) : null}

        {active ? (
          <Card className="p-4 mt-4 border-gold-400">
            <Txt weight="bold" className="text-ink-900 text-base">{t("home.resumeTitle")}</Txt>
            <Txt className="text-ink-500 text-sm leading-5 mt-1">{t("home.resumeBody")}</Txt>
            <View className="mt-3"><Button label={t("home.resume")} variant="accent" onPress={() => router.push(href(`/exam/${active.id}`))} /></View>
          </Card>
        ) : null}

        <View className="mt-6 mb-3">
          <Txt font="display" weight="bold" className="text-ink-900 text-xl">{t("home.sectionTitle")}</Txt>
          <Txt className="text-ink-500 text-sm mt-1">{t("home.sectionSubtitle")}</Txt>
        </View>

        {empty ? (
          <Card className="mb-3"><EmptyView title={t("home.emptyTitle")} body={t("home.emptySubtitle")} icon="library-outline" /></Card>
        ) : (
          <Txt className="text-ink-500 text-xs mb-3">{t("home.stats", { eligible: totals.eligible, total: totals.questions })}</Txt>
        )}

        {shortcut("school-outline", colors.brand700, "bg-brand-100", t("home.varsityTitle"), t("home.varsitySubtitle"), "/(tabs)/varsity")}
        {shortcut("medkit-outline", colors.gold700, "bg-gold-100", t("home.medicalTitle"), t("home.medicalSubtitle"), "/(tabs)/medical")}

        <View className="flex-row gap-3 mt-1">
          <Pressable accessibilityRole="button" accessibilityLabel={t("home.flashTitle")} className="flex-1" onPress={() => router.push(href("/flash/setup"))}>
            <Card className="p-4 min-h-[128px]">
              <Ionicons name="flash-outline" size={23} color={colors.brand700} />
              <Txt weight="bold" className="text-ink-900 mt-2">{t("home.flashTitle")}</Txt>
              <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("home.flashSubtitle")}</Txt>
            </Card>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("home.examTitle")} className="flex-1" onPress={() => router.push(href("/exam/setup"))}>
            <Card className="p-4 min-h-[128px]">
              <Ionicons name="clipboard-outline" size={23} color={colors.gold700} />
              <Txt weight="bold" className="text-ink-900 mt-2">{t("home.examTitle")}</Txt>
              <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("home.examSubtitle")}</Txt>
            </Card>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={t("home.engineeringTitle")} onPress={() => router.push(href("/engineering"))} className="mt-3">
          <Card className="p-4 flex-row items-center gap-2">
            <Ionicons name="construct-outline" size={20} color={colors.ink500} />
            <View className="flex-1">
              <Txt weight="semibold" className="text-ink-900">{t("home.engineeringTitle")}</Txt>
              <Txt className="text-ink-500 text-xs mt-0.5">{t("home.engineeringSubtitle")}</Txt>
            </View>
            <Chip label={t("common.comingSoon")} />
          </Card>
        </Pressable>
        <Txt className="text-ink-400 text-[11px] mt-5 text-center">{num(totals.institutions) !== "" ? t("profile.localOnly") : ""}</Txt>
      </ScrollView>
    </Screen>
  );
}
