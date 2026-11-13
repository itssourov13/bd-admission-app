import { memo, useCallback } from "react";
import { View } from "react-native";
import { Txt } from "@/components/ui";
import { ChoiceChip } from "@/components/common/Toggle";
import { useNum, useT, type TranslationKey } from "@/i18n";
import { combinedCount, selectionMode, toggleSubject } from "@/services/subjectSelection";
import { subjectLabelKey, type SubjectOption } from "@/services/subjects";

/** Localised subject name; subjects without a translation show their stored name. */
export function useSubjectLabel() {
  const t = useT();
  return useCallback((subject: string) => {
    const key = subjectLabelKey(subject) as TranslationKey | undefined;
    return key ? t(key) : subject;
  }, [t]);
}

interface Props {
  /** Subjects of the current scope with their practice-pool counts (see buildSubjectOptions / countPoolBySubject). */
  options: readonly SubjectOption[];
  /** Questions in the scope across all subjects (includes questions without a subject). */
  total: number;
  /** Selected stored subject IDs; empty = all subjects. */
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Heading shown above the chips. */
  title: string;
}

/**
 * Shared All / Single / Multiple subject chooser (Flash, Custom Practice, generic Standard Exam).
 * One control, no modes to learn: "All" clears the selection, tapping one subject makes a single selection and tapping
 * more combines them. The summary line always shows the combined question count for the current selection.
 */
function SubjectSelectorImpl({ options, total, selected, onChange, title }: Props) {
  const t = useT();
  const num = useNum();
  const label = useSubjectLabel();
  const counts: Record<string, number> = {};
  for (const o of options) counts[o.subject] = o.count;
  const mode = selectionMode(selected);
  const count = combinedCount(selected, counts, total);
  const summary = mode === "all"
    ? t("subject.summaryAll", { count: num(count) })
    : mode === "single"
      ? t("subject.summarySingle", { subject: label(selected[0]), count: num(count) })
      : t("subject.summaryMultiple", { n: num(selected.length), count: num(count) });

  return (
    <View>
      <Txt weight="semibold" className="text-ink-900 mt-5 mb-1">{title}</Txt>
      <Txt className="text-ink-500 text-xs leading-5 mb-2">{t("subject.selectorHint")}</Txt>
      <View className="flex-row flex-wrap gap-2">
        <ChoiceChip label={`${t("flash.allSubjects")} · ${num(total)}`} selected={mode === "all"} onPress={() => onChange([])} />
        {options.map((o) => (
          <ChoiceChip
            key={o.subject}
            multi
            label={`${label(o.subject)} · ${num(o.count)}`}
            selected={selected.includes(o.subject)}
            disabled={o.count === 0 && !selected.includes(o.subject)}
            onPress={() => onChange(toggleSubject(selected, o.subject))}
          />
        ))}
      </View>
      <Txt className="text-ink-700 text-xs mt-3" accessibilityLiveRegion="polite">{summary}</Txt>
    </View>
  );
}

export const SubjectSelector = memo(SubjectSelectorImpl);
