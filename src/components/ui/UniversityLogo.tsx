import { Image, View } from "react-native";
import { Txt } from "./Text";
import { UNIVERSITY_LOGOS } from "@/features/catalog/universityLogos";

/** Fixed-size university mark: bundled logo when registered, otherwise a monogram. Neutral tile keeps logos legible. */
export function UniversityLogo({ universityKey, shortName, size = 48, label }: { universityKey: string; shortName: string; size?: number; label?: string }) {
  const source = UNIVERSITY_LOGOS[universityKey];
  const radius = Math.round(size * 0.3);
  if (source) {
    return (
      <View
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
        accessible accessibilityRole="image" accessibilityLabel={label ?? shortName}
      >
        <Image source={source} style={{ width: size * 0.8, height: size * 0.8 }} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View
      className="bg-brand-100 items-center justify-center"
      style={{ width: size, height: size, borderRadius: radius }}
      accessible accessibilityRole="image" accessibilityLabel={label ?? shortName}
    >
      <Txt weight="bold" className="text-brand-700" style={{ fontSize: shortName.length > 3 ? Math.round(size * 0.24) : Math.round(size * 0.3) }}>{shortName}</Txt>
    </View>
  );
}
