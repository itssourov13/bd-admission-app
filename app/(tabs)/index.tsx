import { BRAND } from "@/brand";
import { ScrollView, View, Pressable } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Txt, Card, Logo, Chip } from "@/components/ui";
import { HomeHero } from "@/components/home/HomeHero";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDbState, useMarkHomeScreenReady } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { contentTotals } from "@/repositories/content";
import { getActiveExam } from "@/repositories/sessions";
import { getProfile } from "@/repositories/userData";

export default function HomeScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const { state } = useDbState();
  const markHomeScreenReady = useMarkHomeScreenReady();
  const [contentViewLaidOut, setContentViewLaidOut] = useState(false);
  const q = useQuery(async (db) => ({
    totals: await contentTotals(db),
    active: await getActiveExam(db),
    profile: await getProfile(db)
  }));

  const handleContentLayout = useCallback(() => setContentViewLaidOut(true), []);
  useEffect(() => {
    if (!q.loading && contentViewLaidOut) markHomeScreenReady();
  }, [q.loading, contentViewLaidOut, markHomeScreenReady]);

  if (q.loading) return <Screen edges={["top"]}><LoadingView /></Screen>;
  if (q.error && !q.data) {
    return (
      <Screen edges={["top"]}>
        <View className="flex-1" onLayout={handleContentLayout}>
          <ErrorView onRetry={q.reload} />
        </View>
      </Screen>
    );
  }
  const { totals, active, profile } = q.data!;
  const empty = totals.questions === 0;

  const shortcut = (icon: keyof typeof Ionicons.glyphMap, tint: string, bgClass: string, title: string, subtitle: string, to: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(href(to))} className="mb-3 active:opacity-90">
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
      <ScrollView onLayout={handleContentLayout} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3 mb-5">
            <Logo size={46} />
            <View className="flex-1">
              <Txt weight="bold" className="text-ink-900 text-lg">{profile.displayName || BRAND.name}</Txt>
              <Txt className="text-ink-500 text-xs">{BRAND.tagline[lang]}</Txt>
            </View>
            <Chip label={t("common.offline")} tone="brand" />
          </View>

          {active ? (
            <HomeHero
              mode="resume"
              eyebrow={t("home.resumeTitle")}
              title={t("home.title")}
              subtitle={t("home.resumeBody")}
              primaryLabel={t("home.resume")}
              onPrimary={() => router.push(href(`/exam/${active.id}`))}
            />
          ) : (
            <HomeHero
              eyebrow={t("home.eyebrow")}
              title={t("home.title")}
              subtitle={t("home.subtitle")}
              contextLine={empty ? undefined : t("home.heroReady", { n: totals.eligible })}
              features={[
                { icon: "flash-outline", label: t("home.featPractice") },
                { icon: "shield-checkmark-outline", label: t("home.featVerified") },
                { icon: "cloud-offline-outline", label: t("home.featOffline") }
              ]}
              primaryLabel={t("home.heroStart")}
              onPrimary={() => router.push(href("/flash/setup"))}
              secondaryLabel={t("home.heroExamLink")}
              onSecondary={() => router.push(href("/exam/setup"))}
            />
          )}

          {state.status !== "ready" || !state.libraryComplete || state.importIssues.length > 0 ? (
            <Card className="p-4 mt-4"><Txt className="text-ink-700 text-sm leading-5">{t("error.importWarning")}</Txt></Card>
          ) : null}


          <View className="mt-6 mb-3">
            <Txt font="display" weight="bold" className="text-ink-900 text-xl">{t("home.browseTitle")}</Txt>
            <Txt className="text-ink-500 text-sm mt-1">{t("home.sectionSubtitle")}</Txt>
          </View>

          {empty ? (
            <Card className="mb-3"><EmptyView title={t("home.emptyTitle")} body={t("home.emptySubtitle")} icon="library-outline" /></Card>
          ) : (
            <Txt className="text-ink-500 text-xs mb-3">{t("home.stats", { eligible: totals.eligible, total: totals.questions })}</Txt>
          )}

          {shortcut("school-outline", colors.brand700, "bg-brand-100", t("home.varsityTitle"), t("home.varsitySubtitle"), "/(tabs)/varsity")}
          {shortcut("medkit-outline", colors.gold700, "bg-gold-100", t("home.medicalTitle"), t("home.medicalSubtitle"), "/(tabs)/medical")}
          {shortcut("library-outline", colors.brand700, "bg-brand-100", t("home.libraryTitle"), t("home.librarySubtitle"), "/library")}

          {active ? (
            <>
              <Txt font="display" weight="bold" className="text-ink-900 text-xl mt-4 mb-3">{t("home.quickTitle")}</Txt>
          <View className="flex-row gap-3">
            <Pressable accessibilityRole="button" accessibilityLabel={t("home.flashTitle")} className="flex-1 active:opacity-90" onPress={() => router.push(href("/flash/setup"))}>
              <Card className="p-4 min-h-[128px]">
                <Ionicons name="flash-outline" size={23} color={colors.brand700} />
                <Txt weight="bold" className="text-ink-900 mt-2">{t("home.flashTitle")}</Txt>
                <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("home.flashSubtitle")}</Txt>
              </Card>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t("home.examTitle")} className="flex-1 active:opacity-90" onPress={() => router.push(href("/exam/setup"))}>
              <Card className="p-4 min-h-[128px]">
                <Ionicons name="clipboard-outline" size={23} color={colors.gold700} />
                <Txt weight="bold" className="text-ink-900 mt-2">{t("home.examTitle")}</Txt>
                <Txt className="text-ink-500 text-xs leading-5 mt-1">{t("home.examSubtitle")}</Txt>
              </Card>
            </Pressable>
          </View>

            </>
          ) : null}

          <Pressable accessibilityRole="button" accessibilityLabel={t("home.engineeringTitle")} onPress={() => router.push(href("/engineering"))} className="mt-3 active:opacity-90">
            <Card className="p-4 flex-row items-center gap-2">
              <Ionicons name="construct-outline" size={20} color={colors.ink500} />
              <View className="flex-1">
                <Txt weight="semibold" className="text-ink-900">{t("home.engineeringTitle")}</Txt>
                <Txt className="text-ink-500 text-xs mt-0.5">{t("home.engineeringSubtitle")}</Txt>
              </View>
              <Chip label={t("common.comingSoon")} />
            </Card>
          </Pressable>
          <Txt className="text-ink-500 text-[11px] mt-5 text-center">{num(totals.institutions) !== "" ? t("profile.localOnly") : ""}</Txt>
      </ScrollView>
    </Screen>
  );
}
