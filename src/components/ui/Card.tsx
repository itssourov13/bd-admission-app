import { View, Pressable, type ViewProps, type PressableProps } from "react-native";
import { useTheme } from "@/settings";

/** White surface card with soft elevation and 16px radius (web --radius-lg). */
export function Card({ className, style, ...props }: ViewProps) {
  const { shadow } = useTheme();
  return (
    <View
      style={[shadow.sm, style as object]}
      className={`bg-surface rounded-2xl border border-sand-200 ${className ?? ""}`}
      {...props}
    />
  );
}

/** Tappable variant of Card (e.g. list rows). */
export function PressableCard({ className, style, ...props }: PressableProps) {
  const { shadow } = useTheme();
  return (
    <Pressable
      style={[shadow.sm, style as object]}
      className={`bg-surface rounded-2xl border border-sand-200 active:opacity-90 ${
        typeof className === "string" ? className : ""
      }`}
      {...props}
    />
  );
}
