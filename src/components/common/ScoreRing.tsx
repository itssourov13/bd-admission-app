import { memo, type ReactNode } from "react";
import { View } from "react-native";

/** Clamp to 0..100; null/undefined/NaN/Infinity become 0 so missing data renders an empty track. */
export function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

interface RingProps {
  percent: number | null | undefined;
  color: string;
  trackColor: string;
  size?: number;
  thickness?: number;
  /** Spoken description; the ring itself is one accessible element and children are not read separately. */
  accessibilityLabel: string;
  children?: ReactNode;
}

/**
 * Static progress ring built from plain Views (no SVG, no animation, no dependency).
 * Two clipped half-discs each carry a half-border; rotating a half-border sweeps the arc.
 * An arc of `a` degrees (clockwise from 12 o'clock) is a half-border rotated by `a - 135deg`.
 */
function ScoreRingBase({ percent, color, trackColor, size = 132, thickness = 12, accessibilityLabel, children }: RingProps) {
  const p = clampPercent(percent);
  const angle = (p / 100) * 360;
  const half = size / 2;
  const disc = { width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: "transparent", borderTopColor: color, borderRightColor: color } as const;
  const rightAngle = Math.min(angle, 180);
  const leftAngle = Math.max(angle - 180, 0);
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ position: "absolute", width: size, height: size }}>
        <View style={{ position: "absolute", width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: trackColor }} />
        {angle > 0 ? (
          <View style={{ position: "absolute", left: half, width: half, height: size, overflow: "hidden" }}>
            <View style={{ position: "absolute", left: -half, ...disc, transform: [{ rotate: `${rightAngle - 135}deg` }] }} />
          </View>
        ) : null}
        {angle > 180 ? (
          <View style={{ position: "absolute", left: 0, width: half, height: size, overflow: "hidden" }}>
            <View style={{ position: "absolute", left: 0, ...disc, transform: [{ rotate: `${leftAngle + 45}deg` }] }} />
          </View>
        ) : null}
      </View>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: thickness + 4 }}>{children}</View>
    </View>
  );
}
export const ScoreRing = memo(ScoreRingBase);

/** Thin horizontal accuracy bar; decorative (the adjacent text already states the value). */
function AccuracyBarBase({ percent, color, trackColor, height = 8 }: { percent: number | null | undefined; color: string; trackColor: string; height?: number }) {
  const p = clampPercent(percent);
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: "hidden" }}>
      {p > 0 ? <View style={{ width: `${p}%`, height, borderRadius: height / 2, backgroundColor: color }} /> : null}
    </View>
  );
}
export const AccuracyBar = memo(AccuracyBarBase);
