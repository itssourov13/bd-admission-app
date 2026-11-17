import { Image, View } from "react-native";
import { Txt } from "@/components/ui";
import { useNum, useT } from "@/i18n";
import { resolveQuestionAssets } from "../../content/questionAssets";
import { figureAspectRatio } from "../../features/questions/figureLayout";

export type FigureRole = "question" | "option" | "explanation";

/**
 * Offline figures for one part of a question (stem, option or explanation). One component for every content origin
 * (university packs and LibraryPacks): a referenced file that is not bundled is shown as a visible placeholder and is
 * never silently dropped, because a diagram-dependent question without its diagram would otherwise look answerable.
 */
export function QuestionFigures({ paths, role, optionLabel, idPrefix }: { paths: readonly string[]; role: FigureRole; optionLabel?: string; idPrefix: string }) {
  const t = useT();
  const num = useNum();
  if (paths.length === 0) return null;
  const compact = role === "option";
  const items = resolveQuestionAssets(paths);
  return (
    <View className={compact ? "mt-2 gap-2" : "mt-3 gap-3"}>
      {items.map((item, index) => {
        const n = num(index + 1);
        const label = role === "option" ? t("question.optionFigure", { option: optionLabel ?? "", n })
          : role === "explanation" ? t("question.explanationFigure", { n }) : t("question.figure", { n });
        if (!item.source) {
          return (
            <View key={`${idPrefix}-${index}`} accessible accessibilityLabel={`${label}. ${t("question.figureMissing")}`} className="rounded-xl border border-sand-200 bg-sand-100 p-3">
              <Txt className="text-ink-700 text-sm">{t("question.figureMissing")}</Txt>
            </View>
          );
        }
        const resolved = Image.resolveAssetSource(item.source as never) as { width?: number; height?: number } | null;
        return (
          <View key={`${idPrefix}-${index}`} className="rounded-xl border border-sand-200 bg-white p-2">
            <Image
              source={item.source}
              resizeMode="contain"
              accessible
              accessibilityRole="image"
              accessibilityLabel={label}
              style={{ width: "100%", aspectRatio: figureAspectRatio(resolved?.width, resolved?.height), maxHeight: compact ? 160 : 360 }}
            />
          </View>
        );
      })}
    </View>
  );
}
