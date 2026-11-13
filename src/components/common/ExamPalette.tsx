import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Txt } from "@/components/ui";
import { useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { paletteState, type PaletteState } from "@/services/examReview";

export interface PaletteItem { id: string; number: number }

interface Props {
  items: readonly PaletteItem[];
  selected: Readonly<Record<string, readonly string[]>>;
  flagged: ReadonlySet<string>;
  onGo: (item: PaletteItem) => void;
}

type Cell = { bg: string; border: string; fg: string };
function paletteCells(colors: ReturnType<typeof useTheme>["colors"]): Record<PaletteState, Cell> {
  return {
    unanswered: { bg: colors.surface, border: colors.outline, fg: colors.ink700 },
    answered: { bg: colors.brand100, border: colors.brand500, fg: colors.brand700 },
    flagged: { bg: colors.gold100, border: colors.gold500, fg: colors.gold700 },
    flaggedAnswered: { bg: colors.brand100, border: colors.gold500, fg: colors.brand700 }
  };
}

/** Numbered question grid: colour + a flag icon (never colour alone) show answered / unanswered / flagged. Tapping jumps to the question. */
export function ExamPalette({ items, selected, flagged, onGo }: Props) {
  const { colors } = useTheme();
  const CELL = useMemo(() => paletteCells(colors), [colors]);
  const t = useT();
  const num = useNum();
  const legend = (state: PaletteState, label: string) => (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 14, height: 14, borderRadius: 4, borderWidth: 1.5, backgroundColor: CELL[state].bg, borderColor: CELL[state].border }} />
      <Txt className="text-ink-500 text-xs">{label}</Txt>
    </View>
  );
  return (
    <Card className="mx-4 mt-3 p-3">
      <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-2">
        {legend("answered", t("exam.legendAnswered"))}
        {legend("unanswered", t("exam.legendUnanswered"))}
        {legend("flagged", t("exam.legendFlagged"))}
      </View>
      <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
        <View className="flex-row flex-wrap gap-2">
          {items.map((item) => {
            const isFlagged = flagged.has(item.id);
            const state = paletteState((selected[item.id]?.length ?? 0) > 0, isFlagged);
            const c = CELL[state];
            const status = state === "unanswered" ? t("exam.legendUnanswered") : state === "answered" ? t("exam.legendAnswered") : state === "flagged" ? `${t("exam.legendFlagged")}, ${t("exam.legendUnanswered")}` : `${t("exam.legendFlagged")}, ${t("exam.legendAnswered")}`;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${t("exam.paletteGo", { n: num(item.number) })}, ${status}`}
                onPress={() => onGo(item)}
                style={{ width: 44, height: 44, borderRadius: 10, borderWidth: isFlagged ? 2 : 1.5, backgroundColor: c.bg, borderColor: c.border, alignItems: "center", justifyContent: "center" }}
              >
                <Txt weight="semibold" className="text-sm" style={{ color: c.fg }}>{num(item.number)}</Txt>
                {isFlagged ? <View style={{ position: "absolute", top: 1, right: 2 }}><Ionicons name="flag" size={11} color={colors.gold700} /></View> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Card>
  );
}
