import type { ReactNode } from "react";
import { Image, View } from "react-native";
import type { LogoAsset } from "@/features/branding/logoAsset";

/**
 * Shared, reusable renderer for institutional/publisher brand artwork. Draws the authentic bundled asset unchanged
 * (original colours/proportions, scaled with "contain") on a neutral white tile so any logo stays legible in light and
 * dark themes. When no asset is registered it renders `fallback` (a text monogram) with the same tile footprint.
 */
export function BrandLogo({ asset, size = 48, label, fallback }: { asset?: LogoAsset; size?: number; label: string; fallback: ReactNode }) {
  const radius = Math.round(size * 0.3);
  if (!asset) return <>{fallback}</>;
  const inner = Math.round(size * 0.8);
  return (
    <View
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
      accessible accessibilityRole="image" accessibilityLabel={label}
    >
      {asset.kind === "svg"
        ? <asset.Svg width={inner} height={inner} preserveAspectRatio="xMidYMid meet" />
        : <Image source={asset.source} style={{ width: inner, height: inner }} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />}
    </View>
  );
}
