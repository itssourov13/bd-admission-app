import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "@/components/ui";
import { useT } from "@/i18n";
import { colors } from "@/theme";

export function goBack(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function ScreenHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  const router = useRouter();
  const t = useT();
  return (
    <View className="flex-row items-center gap-2 px-3 pt-2 pb-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={onBack ?? (() => goBack(router))}
        hitSlop={8}
        className="w-11 h-11 rounded-full items-center justify-center active:bg-sand-100"
      >
        <Ionicons name="arrow-back" size={24} color={colors.ink900} />
      </Pressable>
      <View className="flex-1">
        <Txt font="display" weight="bold" className="text-ink-900 text-xl leading-7" numberOfLines={2}>{title}</Txt>
        {subtitle ? <Txt className="text-ink-500 text-xs mt-0.5" numberOfLines={2}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}
