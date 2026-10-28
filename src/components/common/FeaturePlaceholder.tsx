import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Txt, Chip } from "@/components/ui";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export function FeaturePlaceholder({
  title,
  description,
  icon,
  eyebrow = "FOUNDATION READY"
}: {
  title: string;
  description: string;
  icon: IconName;
  eyebrow?: string;
}) {
  return (
    <Screen className="px-5">
      <View className="pt-7 pb-5">
        <Chip label={eyebrow} tone="brand" />
        <Txt font="display" weight="bold" className="text-ink-900 text-3xl mt-4">{title}</Txt>
        <Txt className="text-ink-500 text-base leading-6 mt-3">{description}</Txt>
      </View>
      <Card className="p-5">
        <View className="w-12 h-12 rounded-2xl bg-brand-100 items-center justify-center">
          <Ionicons name={icon} size={26} color={colors.brand700} />
        </View>
        <Txt weight="semibold" className="text-ink-900 text-base mt-4">Implementation handoff</Txt>
        <Txt className="text-ink-500 text-sm leading-5 mt-2">
          This is an intentional scaffold screen. The full feature UI, local data connection, and interactions are the next implementation phase.
        </Txt>
      </Card>
    </Screen>
  );
}
