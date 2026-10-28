import { View, type ViewProps } from "react-native";
import { Txt } from "./Text";

type Tone = "neutral" | "brand" | "gold";

const toneBg: Record<Tone, string> = {
  neutral: "bg-sand-100",
  brand: "bg-brand-100",
  gold: "bg-gold-100",
};
const toneFg: Record<Tone, string> = {
  neutral: "text-ink-700",
  brand: "text-brand-700",
  gold: "text-gold-700",
};

/** Small pill for meta/tags (country, funding, deadline …). */
export function Chip({
  label,
  tone = "neutral",
  className,
  ...props
}: { label: string; tone?: Tone } & ViewProps) {
  return (
    <View className={`rounded-full px-3 py-1 ${toneBg[tone]} ${className ?? ""}`} {...props}>
      <Txt weight="medium" className={`text-xs ${toneFg[tone]}`}>
        {label}
      </Txt>
    </View>
  );
}
