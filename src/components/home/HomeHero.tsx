import { memo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "@/components/ui";
import { useTheme } from "@/settings";

export interface HomeHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Small context line under the subtitle (e.g. "13,609 questions ready offline"). Omitted when empty. */
  contextLine?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** "resume" swaps the eyebrow icon and uses the gold accent CTA so an unfinished exam is unmistakable. */
  mode?: "start" | "resume";
}

/** Decorative OMR-style answer bubbles (pure Views: no assets, no extra startup work). One bubble is "filled". */
function OmrBubbles({ filled }: { filled: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: 7 }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: "row", gap: 7 }}>
          {[0, 1, 2, 3].map((col) => {
            const on = (row + col) % 4 === filled;
            return (
              <View
                key={col}
                style={{
                  width: 14, height: 14, borderRadius: 7, borderWidth: 1.5,
                  borderColor: on ? "#F6C65B" : "rgba(255,255,255,0.35)",
                  backgroundColor: on ? "#F6C65B" : "transparent"
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Home hero: brand gradient with decorative admission motifs (graduation cap, OMR bubbles, soft glow rings), a clear
 * primary CTA and an optional secondary action. The gradient is dark in both themes, so white text keeps contrast
 * (>= 12:1 on navy) without theme branches; only the shadow follows the active theme. Decorations are hidden from
 * assistive technology and on narrow screens.
 */
export const HomeHero = memo(function HomeHero({ eyebrow, title, subtitle, contextLine, primaryLabel, onPrimary, secondaryLabel, onSecondary, mode = "start" }: HomeHeroProps) {
  const { gradients, shadow } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360;
  const showArt = width >= 340 && fontScale <= 1.3;
  const resume = mode === "resume";
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.brand, { borderRadius: 24, padding: compact ? 18 : 22, overflow: "hidden" }]}>
      {showArt ? (
        <>
          <View pointerEvents="none" style={{ position: "absolute", right: -46, top: -46, width: 170, height: 170, borderRadius: 85, borderWidth: 26, borderColor: "rgba(246,198,91,0.14)" }} />
          <View pointerEvents="none" style={{ position: "absolute", right: 38, bottom: -58, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(22,134,106,0.30)" }} />
          <View pointerEvents="none" style={{ position: "absolute", right: 20, top: 22 }}>
            <Ionicons name={resume ? "hourglass-outline" : "school"} size={34} color="rgba(246,198,91,0.9)" />
          </View>
          <View pointerEvents="none" style={{ position: "absolute", right: 18, bottom: 78 }}>
            <OmrBubbles filled={resume ? 1 : 2} />
          </View>
        </>
      ) : null}
      <View style={{ paddingRight: showArt ? 64 : 0 }}>
        <Txt weight="bold" className="text-brand-200 text-[11px] uppercase" style={{ letterSpacing: 1.1 }}>{eyebrow}</Txt>
        <Txt font="display" weight="bold" className="text-white leading-[36px] mt-3" style={{ fontSize: compact ? 22 : 26, lineHeight: compact ? 30 : 36 }}>{title}</Txt>
      </View>
      <Txt className="text-white/90 text-sm leading-6 mt-3">{subtitle}</Txt>
      {contextLine ? (
        <View className="flex-row items-center gap-1.5 mt-3">
          <Ionicons name="cloud-offline-outline" size={15} color="#A9DDCC" />
          <Txt weight="medium" className="text-brand-200 text-xs">{contextLine}</Txt>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        onPress={onPrimary}
        style={{ minHeight: 48 }}
        className={`mt-5 rounded-full flex-row items-center justify-center gap-2 px-6 py-3 active:opacity-90 ${resume ? "bg-gold-400" : "bg-white"}`}
      >
        <Ionicons name={resume ? "play" : "flash"} size={18} color="#14243A" />
        <Txt weight="bold" className="text-navy-900 text-base">{primaryLabel}</Txt>
      </Pressable>
      {secondaryLabel && onSecondary ? (
        <Pressable accessibilityRole="button" accessibilityLabel={secondaryLabel} onPress={onSecondary} hitSlop={6} style={{ minHeight: 44 }} className="items-center justify-center mt-1 active:opacity-80">
          <Txt weight="semibold" className="text-white text-sm underline">{secondaryLabel}</Txt>
        </Pressable>
      ) : null}
    </LinearGradient>
  );
});
