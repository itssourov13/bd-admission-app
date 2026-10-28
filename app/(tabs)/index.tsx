import { ScrollView, View, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, Txt, Card, Button, Logo, Chip } from "@/components/ui";
import { useT } from "@/i18n";
import { colors, gradients, shadow } from "@/theme";

export default function HomeScreen() {
  const t = useT();
  const router = useRouter();

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-3 mb-5">
          <Logo size={46} />
          <View className="flex-1">
            <Txt weight="bold" className="text-ink-900 text-lg">{t("app.name")}</Txt>
            <Txt className="text-ink-500 text-xs">ভর্তি প্রস্তুতির সঙ্গী</Txt>
          </View>
          <Chip label="OFFLINE FIRST" tone="teal" />
        </View>

        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[shadow.teal, { borderRadius: 24, padding: 22, overflow: "hidden" }]}
        >
          <Txt weight="bold" className="text-teal-200 text-[11px] uppercase" style={{ letterSpacing: 1.1 }}>
            {t("home.eyebrow")}
          </Txt>
          <Txt font="display" weight="bold" className="text-white text-[26px] leading-[33px] mt-3">
            {t("home.title")}
          </Txt>
          <Txt className="text-white/90 text-sm leading-5 mt-3">{t("home.subtitle")}</Txt>
        </LinearGradient>

        <View className="mt-6 mb-3">
          <Txt font="display" weight="bold" className="text-ink-900 text-xl">আপনার প্রস্তুতি</Txt>
          <Txt className="text-ink-500 text-sm mt-1">প্রথমে আপনার প্রশ্নের বিভাগ বেছে নিন।</Txt>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/varsity" as Href)} className="mb-3">
          <Card className="p-4 flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-2xl bg-teal-100 items-center justify-center">
              <Ionicons name="school-outline" size={25} color={colors.teal700} />
            </View>
            <View className="flex-1">
              <Txt weight="bold" className="text-ink-900 text-base">{t("home.varsityTitle")}</Txt>
              <Txt className="text-ink-500 text-sm mt-1">{t("home.varsitySubtitle")}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/medical" as Href)} className="mb-3">
          <Card className="p-4 flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-2xl bg-coral-100 items-center justify-center">
              <Ionicons name="medkit-outline" size={25} color={colors.coral700} />
            </View>
            <View className="flex-1">
              <Txt weight="bold" className="text-ink-900 text-base">{t("home.medicalTitle")}</Txt>
              <Txt className="text-ink-500 text-sm mt-1">{t("home.medicalSubtitle")}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
          </Card>
        </Pressable>

        <View className="flex-row gap-3 mt-1">
          <Card className="flex-1 p-4">
            <Ionicons name="flash-outline" size={23} color={colors.teal700} />
            <Txt weight="bold" className="text-ink-900 mt-2">{t("home.flashTitle")}</Txt>
            <Txt className="text-ink-500 text-xs leading-4 mt-1">{t("home.flashSubtitle")}</Txt>
          </Card>
          <Card className="flex-1 p-4">
            <Ionicons name="clipboard-outline" size={23} color={colors.coral700} />
            <Txt weight="bold" className="text-ink-900 mt-2">{t("home.examTitle")}</Txt>
            <Txt className="text-ink-500 text-xs leading-4 mt-1">{t("home.examSubtitle")}</Txt>
          </Card>
        </View>

        <Card className="p-4 mt-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="construct-outline" size={20} color={colors.ink500} />
            <Txt weight="semibold" className="text-ink-900">{t("home.engineeringTitle")}</Txt>
            <View className="ml-auto"><Chip label={t("common.comingSoon")} /></View>
          </View>
        </Card>

        <View className="mt-5">
          <Button
            label="পরবর্তী ধাপ: প্রশ্ন অনুশীলন"
            variant="outline"
            onPress={() => router.push("/(tabs)/varsity" as Href)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
