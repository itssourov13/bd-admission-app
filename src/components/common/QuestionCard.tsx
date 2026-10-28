import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chip, Txt } from "@/components/ui";
import { useT, useNum } from "@/i18n";
import { colors, feedback } from "@/theme";
import type { OptionView, QuestionView } from "../../types/domain";
import { getQuestionAssetSources } from "../../content/questionAssets";

export function optionLabel(o: OptionView): string {
  return o.key.length <= 3 ? o.key.toUpperCase() : String(o.order);
}

interface Props {
  question: QuestionView;
  selected?: string[];
  onSelect?: (key: string) => void;
  /** Color the verified correct option and a wrong selection (feedback, review and browse). */
  reveal?: boolean;
  disabled?: boolean;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  showSources?: boolean;
}

export function QuestionCard({ question, selected = [], onSelect, reveal = false, disabled = false, bookmarked, onToggleBookmark, showSources = false }: Props) {
  const t = useT();
  const num = useNum();
  const verified = question.answerStatus === "verified";
  const showKey = reveal && verified;
  const sources = question.appearances.slice(0, 3);
  const questionAssets = getQuestionAssetSources(question.assetPaths);

  return (
    <View>
      <View className="flex-row items-start gap-2">
        <Txt weight="semibold" className="flex-1 text-ink-900 text-[17px] leading-7">{question.text}</Txt>
        {onToggleBookmark ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? t("question.unbookmark") : t("question.bookmark")}
            accessibilityState={{ selected: Boolean(bookmarked) }}
            onPress={onToggleBookmark}
            hitSlop={6}
            className="w-11 h-11 items-center justify-center rounded-full active:bg-sand-100"
          >
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color={bookmarked ? colors.gold500 : colors.ink500} />
          </Pressable>
        ) : null}
      </View>

      {questionAssets.length > 0 ? (
        <View className="mt-3 gap-3">
          {questionAssets.map((source, index) => (
            <View key={`${question.id}-asset-${index}`} className="rounded-xl border border-sand-200 bg-white p-2">
              <Image
                source={source}
                resizeMode="contain"
                accessible
                accessibilityLabel={t("question.figure", { n: num(index + 1) })}
                style={{ width: "100%", height: 180 }}
              />
            </View>
          ))}
        </View>
      ) : null}

      {!verified ? (
        <View className="flex-row mt-2"><Chip label={t("question.answerUnverified")} tone="gold" /></View>
      ) : null}
      {question.contentStatus !== "verified" ? (
        <View className="flex-row mt-2"><Chip label={t("question.contentUnverified")} tone="neutral" /></View>
      ) : null}
      {question.type === "multiple_choice" ? <Txt className="text-ink-500 text-xs mt-2">{t("question.multiple")}</Txt> : null}

      <View className="mt-4 gap-2.5" accessibilityRole="radiogroup">
        {question.options.map((o) => {
          const isSelected = selected.includes(o.key);
          const isCorrect = showKey && o.isCorrect;
          const isWrong = showKey && isSelected && !o.isCorrect;
          const border = isCorrect ? colors.brand500 : isWrong ? feedback.danger500 : isSelected ? colors.brand500 : colors.sand300;
          const bg = isCorrect ? colors.brand100 : isWrong ? feedback.danger100 : isSelected ? colors.brand100 : colors.surface;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="radio"
              accessibilityLabel={`${optionLabel(o)}. ${o.text}`}
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled || !onSelect}
              onPress={() => onSelect?.(o.key)}
              style={{ borderColor: border, backgroundColor: bg, borderWidth: isSelected || isCorrect || isWrong ? 2 : 1, minHeight: 52 }}
              className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3 active:opacity-80"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: isCorrect ? colors.brand500 : isWrong ? feedback.danger500 : isSelected ? colors.brand500 : colors.sand100 }}
              >
                {isCorrect ? <Ionicons name="checkmark" size={18} color={colors.white} />
                  : isWrong ? <Ionicons name="close" size={18} color={colors.white} />
                  : <Txt weight="bold" className={`text-sm ${isSelected ? "text-white" : "text-ink-700"}`}>{optionLabel(o)}</Txt>}
              </View>
              <Txt className="flex-1 text-ink-900 text-base leading-6">{o.text}</Txt>
            </Pressable>
          );
        })}
      </View>

      {reveal && question.explanation ? (
        <View className="mt-4 rounded-2xl bg-sand-100 p-3.5">
          <Txt weight="semibold" className="text-ink-900 text-sm">{t("question.explanation")}</Txt>
          <Txt className="text-ink-700 text-sm leading-6 mt-1">{question.explanation}</Txt>
        </View>
      ) : null}

      {showSources && sources.length > 0 ? (
        <View className="mt-4">
          <Txt weight="semibold" className="text-ink-500 text-xs uppercase" style={{ letterSpacing: 0.6 }}>{t("question.sources")}</Txt>
          {sources.map((a, i) => (
            <Txt key={`${a.paperId}-${i}`} className="text-ink-500 text-xs leading-5 mt-1">
              {[
                a.institutionCode,
                num(a.year),
                a.unit ? t("paper.unit", { unit: a.unit }) : null,
                a.session ? t("paper.session", { session: a.session }) : null,
                a.questionNumber ? t("question.number", { n: a.questionNumber }) : null,
                a.pageNumber ? t("question.page", { n: a.pageNumber }) : null,
                a.sourceFilename
              ].filter(Boolean).join(" · ")}
            </Txt>
          ))}
          {question.appearances.length > sources.length ? (
            <Txt className="text-ink-400 text-xs mt-1">+{num(question.appearances.length - sources.length)}</Txt>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
