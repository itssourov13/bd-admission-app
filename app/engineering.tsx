import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useT } from "@/i18n";
import { colors } from "@/theme";

export default function EngineeringScreen() {
  const t = useT();
  const router = useRouter();
  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("engineering.title")} />
      <View className="px-5">
        <Card className="p-6 items-center">
          <View className="w-16 h-16 rounded-full bg-sand-100 items-center justify-center">
            <Ionicons name="construct-outline" size={30} color={colors.ink500} />
          </View>
          <View className="mt-3"><Chip label={t("common.comingSoon")} tone="gold" /></View>
          <Txt className="text-ink-700 text-sm leading-6 text-center mt-4">{t("engineering.body")}</Txt>
          <Txt className="text-ink-500 text-sm leading-6 text-center mt-2">{t("engineering.meanwhile")}</Txt>
        </Card>
        <View className="mt-4"><Button label={t("common.home")} variant="outline" onPress={() => router.replace("/")} /></View>
      </View>
    </Screen>
  );
}
