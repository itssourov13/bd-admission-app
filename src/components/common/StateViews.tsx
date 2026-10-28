import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Txt } from "@/components/ui";
import { useT } from "@/i18n";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export function LoadingView({ label }: { label?: string }) {
  const t = useT();
  return (
    <View className="flex-1 items-center justify-center p-8" accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.brand600} size="large" />
      <Txt className="text-ink-500 text-sm mt-3">{label ?? t("common.loading")}</Txt>
    </View>
  );
}

export function EmptyView({ icon = "albums-outline", title, body, actionLabel, onAction }: { icon?: IconName; title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="items-center px-6 py-10">
      <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center">
        <Ionicons name={icon} size={30} color={colors.brand700} />
      </View>
      <Txt font="display" weight="bold" className="text-ink-900 text-lg text-center mt-4">{title}</Txt>
      {body ? <Txt className="text-ink-500 text-sm leading-6 text-center mt-2">{body}</Txt> : null}
      {actionLabel && onAction ? <View className="mt-5 w-full"><Button label={actionLabel} onPress={onAction} variant="outline" /></View> : null}
    </View>
  );
}

export function ErrorView({ title, body, onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <View className="items-center px-6 py-10" accessibilityRole="alert">
      <View className="w-16 h-16 rounded-full bg-gold-100 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={32} color={colors.gold700} />
      </View>
      <Txt font="display" weight="bold" className="text-ink-900 text-lg text-center mt-4">{title ?? t("error.title")}</Txt>
      <Txt className="text-ink-500 text-sm leading-6 text-center mt-2">{body ?? t("error.load")}</Txt>
      {onRetry ? <View className="mt-5 w-full"><Button label={t("common.retry")} onPress={onRetry} /></View> : null}
    </View>
  );
}
