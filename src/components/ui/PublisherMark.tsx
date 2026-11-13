import { View } from "react-native";
import { Txt } from "./Text";
import { BrandLogo } from "./BrandLogo";
import { publisherLogoFor } from "@/features/library/publisherLogos";
import { publisherMonogram } from "@/features/library/model";

/** Fixed-size publisher mark: authentic bundled logo/wordmark when registered, otherwise a text monogram (never an invented logo). */
export function PublisherMark({ name, logoKey, slug, size = 48 }: { name: string; logoKey?: string | null; slug?: string | null; size?: number }) {
  const radius = Math.round(size * 0.3);
  const mark = publisherMonogram(name);
  return (
    <BrandLogo
      asset={publisherLogoFor(logoKey, slug)} size={size} label={name}
      fallback={
        <View className="bg-gold-100 items-center justify-center" style={{ width: size, height: size, borderRadius: radius }} accessible accessibilityRole="image" accessibilityLabel={name}>
          <Txt weight="bold" className="text-gold-700" style={{ fontSize: mark.length > 3 ? Math.round(size * 0.22) : Math.round(size * 0.3) }}>{mark}</Txt>
        </View>
      }
    />
  );
}
