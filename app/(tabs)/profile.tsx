import { BRAND } from "@/brand";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Txt, Card, Button, Chip } from "@/components/ui";
import { useLang, useT } from "@/i18n";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <Screen className="px-5">
      <View className="pt-7 pb-5">
        <Txt font="display" weight="bold" className="text-ink-900 text-3xl">{t("profile.title")}</Txt>
        <Txt className="text-ink-500 text-sm mt-2">{t("profile.localOnly")}</Txt>
      </View>
      <Card className="p-5">
        <View className="w-12 h-12 rounded-full bg-brand-100 items-center justify-center">
          <Ionicons name="person-outline" size={25} color={colors.brand700} />
        </View>
        <Txt weight="semibold" className="text-ink-900 text-base mt-3">{t("profile.name")}</Txt>
        <Txt className="text-ink-500 text-sm mt-1">{BRAND.name}</Txt>
        <View className="mt-5">
          <Txt weight="semibold" className="text-ink-900">{t("profile.language")}</Txt>
          <View className="flex-row gap-2 mt-3">
            <View className="flex-1">
              <Button label="বাংলা" variant={lang === "bn" ? "primary" : "outline"} onPress={() => setLang("bn")} />
            </View>
            <View className="flex-1">
              <Button label="English" variant={lang === "en" ? "primary" : "outline"} onPress={() => setLang("en")} />
            </View>
          </View>
        </View>
      </Card>
      <View className="mt-4">
        <Chip label="LOCAL PROFILE FOUNDATION" tone="brand" />
      </View>
    </Screen>
  );
}
