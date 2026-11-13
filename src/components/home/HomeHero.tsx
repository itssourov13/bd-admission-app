
import { memo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "@/components/ui";
import { HERO } from "@/settings/palettes";
import { useTheme } from "@/settings";

export interface HomeHeroFeature {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

export interface HomeHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Small context line under the pills (e.g. "13,609 questions ready offline"). Omitted when empty. */
  contextLine?: string;
  /** Short value pills (start mode only). */
  features?: HomeHeroFeature[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** "resume" swaps the icon and uses the gold CTA so an unfinished exam is unmistakable; it shows a single action. */
  mode?: "start" | "resume";
}

const ACTION_HEIGHT = 52;
const overlay = (alpha: number) => `rgba(255,255,255,${alpha})`;

/**
 * Decorative app-style phone frame built from plain Views (no raster asset, no startup cost). It is deliberately
 * abstract: it shows no real screen, question text or university mark, so it cannot misrepresent the app.
 */
function PhoneArt({ resume }: { resume: boolean }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: 78, height: 104 }}>
      <View style={{ position: "absolute", right: 0, bottom: 0, width: 62, height: 94, borderRadius: 14, borderWidth: 2, borderColor: overlay(0.55), backgroundColor: "rgba(6,71,56,0.55)", overflow: "hidden" }}>
        <View style={{ height: 16, backgroundColor: "#16866A" }} />
        <View style={{ padding: 7, gap: 6 }}>
          {[0, 1, 2, 3].map((row) => {
            const on = row === (resume ? 1 : 2);
            return (
              <View key={row} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: on ? HERO.gold : overlay(0.5), backgroundColor: on ? HERO.gold : "transparent" }} />
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: on ? overlay(0.5) : overlay(0.22) }} />
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ position: "absolute", left: 0, top: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(246,198,91,0.18)", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={resume ? "hourglass-outline" : "school"} size={24} color={HERO.gold} />
      </View>
    </View>
  );
}

/**
 * Home hero: navy-to-green admission gradient with gold accents, a graduation-cap/phone motif, optional value pills,
 * and a clear action hierarchy: one filled primary CTA and one outlined secondary CTA (a real button, not a text link).
 * The gradient is dark in both themes, so every foreground uses the theme-independent HERO tokens (contrast is asserted
 * in tests/hero-contrast.test.ts). Art is hidden from assistive technology and on narrow screens / large font scales.
 */
export const HomeHero = memo(function HomeHero({ eyebrow, title, subtitle, contextLine, features, primaryLabel, onPrimary, secondaryLabel, onSecondary, mode = "start" }: HomeHeroProps) {
  const { shadow } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360;
  const showArt = width >= 340 && fontScale <= 1.3;
  const resume = mode === "resume";
  const pills = resume ? [] : features ?? [];
  return (
    <LinearGradient colors={HERO.stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.brand, { borderRadius: 24, padding: compact ? 18 : 22, overflow: "hidden" }]}>
      <View pointerEvents="none" style={{ position: "absolute", right: -50, top: -50, width: 170, height: 170, borderRadius: 85, borderWidth: 24, borderColor: "rgba(246,198,91,0.10)" }} />
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" className="text-[11px] uppercase" style={{ letterSpacing: 1.1, color: HERO.eyebrow }}>{eyebrow}</Txt>
          <Txt font="display" weight="bold" className="mt-3" style={{ color: HERO.title, fontSize: compact ? 22 : 26, lineHeight: compact ? 30 : 36 }}>{title}</Txt>
        </View>
        {showArt ? <PhoneArt resume={resume} /> : null}
      </View>
      <Txt className="text-sm leading-6 mt-3" style={{ color: HERO.body }}>{subtitle}</Txt>
      {pills.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {pills.map((f) => (
            <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: overlay(HERO.pill.alpha) }}>
              <Ionicons name={f.icon} size={14} color={HERO.gold} />
              <Txt weight="medium" className="text-xs" style={{ color: HERO.pill.fg }}>{f.label}</Txt>
            </View>
          ))}
        </View>
      ) : null}
      {contextLine ? (
        <View className="flex-row items-center gap-1.5 mt-3">
          <Ionicons name="cloud-offline-outline" size={15} color={HERO.context} />
          <Txt weight="medium" className="text-xs" style={{ color: HERO.context }}>{contextLine}</Txt>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        onPress={onPrimary}
        style={({ pressed }) => ({ minHeight: ACTION_HEIGHT, marginTop: 20, borderRadius: 999, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: resume ? HERO.resume.bg : HERO.primary.bg, opacity: pressed ? 0.88 : 1 })}
      >
        <Ionicons name={resume ? "play" : "flash"} size={18} color={resume ? HERO.resume.fg : HERO.primary.fg} />
        <Txt weight="bold" className="text-base" style={{ color: resume ? HERO.resume.fg : HERO.primary.fg }}>{primaryLabel}</Txt>
      </Pressable>
      {secondaryLabel && onSecondary ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          onPress={onSecondary}
          style={({ pressed }) => ({ minHeight: ACTION_HEIGHT, marginTop: 10, borderRadius: 999, borderWidth: 1.5, borderColor: HERO.secondary.border, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: overlay(pressed ? 0.24 : HERO.secondary.alpha) })}
        >
          <Ionicons name="clipboard-outline" size={18} color={HERO.secondary.fg} />
          <Txt weight="bold" className="text-base" style={{ color: HERO.secondary.fg }}>{secondaryLabel}</Txt>
        </Pressable>
      ) : null}
    </LinearGradient>
  );
});
