import { View } from "react-native";
import { Chip, Txt } from "@/components/ui";
import { useT } from "@/i18n";
import type { RuleStatus, ScoringRule } from "../../services/scoring";

/** Always tells the user how a score is produced and whether the rule is official. Never hides unverified rules. */
export function RuleNotice({ rule, status }: { rule?: ScoringRule | null; status?: RuleStatus }) {
  const t = useT();
  const s: RuleStatus = status ?? rule?.status ?? "unconfigured";
  const tone = s === "verified" ? "brand" : s === "illustrative" ? "gold" : "neutral";
  const label = s === "verified" ? t("rule.verified") : s === "illustrative" ? t("rule.illustrative") : t("rule.unconfigured");
  const note = s === "verified" ? t("rule.noteVerified") : s === "illustrative" ? t("rule.noteIllustrative") : t("rule.noteUnconfigured");
  return (
    <View className="rounded-2xl border border-sand-200 bg-surface p-4" accessibilityRole="summary">
      <View className="flex-row"><Chip label={label} tone={tone} /></View>
      {rule && s !== "unconfigured" ? (
        <Txt weight="semibold" className="text-ink-900 text-sm mt-3">
          {t("rule.detail", { c: rule.correctMarks, p: rule.incorrectPenalty, u: rule.unansweredMarks })}
        </Txt>
      ) : null}
      <Txt className="text-ink-500 text-xs leading-5 mt-2">{note}</Txt>
    </View>
  );
}
