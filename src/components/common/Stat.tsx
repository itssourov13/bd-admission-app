import { View } from "react-native";
import { Txt } from "@/components/ui";

export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View className="flex-1 min-w-[28%] rounded-2xl bg-surface border border-sand-200 p-3 items-center">
      <Txt weight="bold" className="text-xl" style={tone ? { color: tone } : undefined}>{value}</Txt>
      <Txt className="text-ink-500 text-xs text-center mt-0.5">{label}</Txt>
    </View>
  );
}
