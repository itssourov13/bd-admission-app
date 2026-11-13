import { View } from "react-native";
import { Txt } from "./Text";
import { BrandLogo } from "./BrandLogo";
import { UNIVERSITY_LOGOS } from "@/features/catalog/universityLogos";

/** Fixed-size university mark: authentic bundled logo when registered, otherwise a monogram for genuinely missing assets. */
export function UniversityLogo({ universityKey, shortName, size = 48, label }: { universityKey: string; shortName: string; size?: number; label?: string }) {
  const radius = Math.round(size * 0.3);
  const name = label ?? shortName;
  return (
    <BrandLogo
      asset={UNIVERSITY_LOGOS[universityKey]} size={size} label={name}
      fallback={
        <View className="bg-brand-100 items-center justify-center" style={{ width: size, height: size, borderRadius: radius }} accessible accessibilityRole="image" accessibilityLabel={name}>
          <Txt weight="bold" className="text-brand-700" style={{ fontSize: shortName.length > 3 ? Math.round(size * 0.24) : Math.round(size * 0.3) }}>{shortName}</Txt>
        </View>
      }
    />
  );
}
