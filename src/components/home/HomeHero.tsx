import { memo } from "react";
import { Image, Pressable, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "@/components/ui";
import { HERO } from "@/settings/palettes";
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
  /** "resume" swaps the icon and uses the gold CTA so an unfinished exam is unmistakable; it shows a single action. */
  mode?: "start" | "resume";
}

const COVER = require("../../../assets/home/hero-cover.jpg") as number;
const ACTION_HEIGHT = 48;
/** Home screen horizontal padding (app/(tabs)/index.tsx); used only to estimate the card width before layout. */
const SCREEN_PADDING = 18;
const overlay = (alpha: number) => `rgba(255,255,255,${alpha})`;

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const SCRIM_COLORS = HERO.cover.scrim.map(([, a]) => rgba(HERO.cover.scrimColor, a)) as unknown as readonly [string, string, ...string[]];
const SCRIM_LOCATIONS = HERO.cover.scrim.map(([o]) => o) as unknown as readonly [number, number, ...number[]];

/**
 * Home hero: a compact composite card. The top "cover" is a decorative campus photo with a navy scrim carrying the
 * eyebrow and headline; underneath, on the navy-to-green admission gradient, sit the subtitle and the two REAL
 * React Native actions. The photo contains no buttons, logo or app text, so nothing in it can look tappable.
 *
 * Layout rules:
 * - The cover has a `minHeight` (never a fixed height), so large system fonts / long Bangla headlines grow the card
 *   instead of clipping.
 * - Actions sit side by side when there is room and stack (full width) on narrow screens or at large font scales.
 * - Pressables use plain `style` objects plus NativeWind `active:` classes. NativeWind 4 does not support
 *   callback-valued `Pressable.style`, which is what made the previous CTA surfaces disappear.
 * - All foregrounds are theme-independent HERO tokens (contrast asserted in tests/hero-contrast.test.ts).
 */
export const HomeHero = memo(function HomeHero({ eyebrow, title, subtitle, contextLine, primaryLabel, onPrimary, secondaryLabel, onSecondary, mode = "start" }: HomeHeroProps) {
  const { shadow } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360;
  const resume = mode === "resume";
  const hasSecondary = !resume && !!secondaryLabel && !!onSecondary;
  const sideBySide = hasSecondary && !compact && fontScale <= 1.15;
  const pad = compact ? 16 : 20;
  const coverMin = Math.round(Math.min(Math.max((width - SCREEN_PADDING * 2) / HERO.cover.aspect, 140), 210));

  return (
    <LinearGradient colors={HERO.stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.brand, { borderRadius: 24, overflow: "hidden" }]}>
      <View style={{ minHeight: coverMin, justifyContent: "center", overflow: "hidden" }}>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
          <Image source={COVER} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
          <LinearGradient
            colors={SCRIM_COLORS}
            locations={SCRIM_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
        </View>
        <View style={{ maxWidth: `${HERO.cover.textMaxWidth * 100}%`, paddingHorizontal: pad, paddingVertical: 16 }}>
          <Txt weight="bold" className="text-[11px] uppercase" style={{ letterSpacing: 1.1, color: HERO.eyebrow }}>{eyebrow}</Txt>
          <Txt font="display" weight="bold" className="mt-1.5" style={{ color: HERO.title, fontSize: compact ? 19 : 22, lineHeight: compact ? 26 : 30 }}>{title}</Txt>
        </View>
      </View>
      <View style={{ paddingHorizontal: pad, paddingTop: 14, paddingBottom: pad }}>
        <Txt className="text-sm leading-6" style={{ color: HERO.body }}>{subtitle}</Txt>
        {contextLine ? (
          <View className="flex-row items-center gap-1.5 mt-2">
            <Ionicons name="cloud-offline-outline" size={15} color={HERO.context} />
            <Txt weight="medium" className="text-xs flex-1" style={{ color: HERO.context }}>{contextLine}</Txt>
          </View>
        ) : null}
        <View style={{ flexDirection: sideBySide ? "row" : "column", gap: 10, marginTop: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            onPress={onPrimary}
            className="active:opacity-80"
            style={{ flex: sideBySide ? 1 : undefined, minHeight: ACTION_HEIGHT, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: resume ? HERO.resume.bg : HERO.primary.bg }}
          >
            <Ionicons name={resume ? "play" : "flash"} size={17} color={resume ? HERO.resume.fg : HERO.primary.fg} />
            <Txt weight="bold" className="text-sm" style={{ color: resume ? HERO.resume.fg : HERO.primary.fg, flexShrink: 1, textAlign: "center" }}>{primaryLabel}</Txt>
          </Pressable>
          {hasSecondary ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
              onPress={onSecondary}
              className="active:opacity-80"
              style={{ flex: sideBySide ? 1 : undefined, minHeight: ACTION_HEIGHT, borderRadius: 999, borderWidth: 1.5, borderColor: HERO.secondary.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: overlay(HERO.secondary.alpha) }}
            >
              <Ionicons name="clipboard-outline" size={17} color={HERO.secondary.fg} />
              <Txt weight="bold" className="text-sm" style={{ color: HERO.secondary.fg, flexShrink: 1, textAlign: "center" }}>{secondaryLabel}</Txt>
            </Pressable>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
});
