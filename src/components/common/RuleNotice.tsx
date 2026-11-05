import { View } from "react-native";
import { Chip, Txt } from "@/components/ui";
import { useT } from "@/i18n";
import { hasCompleteScoringRule, type RuleStatus, type ScoringRule } from "../../services/scoring";

/** Always tells the user how a score is produced and whether the rule is official. Never hides unverified rules. */
export function RuleNotice({ rule, status }: { rule?: ScoringRule | null; status?: RuleStatus }) {
  const t = useT();
  const s: RuleStatus = status ?? rule?.status ?? "unconfigured";
  const tone = s === "verified" ? "brand" : s === "illustrative" ? "gold" : "neutral";
  const complete = Boolean(rule && hasCompleteScoringRule(rule));
  const label = s === "verified" ? complete ? t("rule.verified") : t("rule.partialVerified") : s === "illustrative" ? t("rule.illustrative") : t("rule.unconfigured");
  const note = complete
    ? s === "verified" ? t("rule.noteVerified") : t("rule.noteIllustrative")
    : s !== "unconfigured" ? t("rule.notePartial") : t("rule.noteUnconfigured");
  return (
    <View className="rounded-2xl border border-sand-200 bg-surface p-4" accessibilityRole="summary">
      <View className="flex-row"><Chip label={label} tone={tone} /></View>
      {rule?.totalMarks != null ? (
        <Txt weight="semibold" className="text-ink-900 text-sm mt-3">
          {t("rule.totalMarks", { m: rule.totalMarks })}
        </Txt>
      ) : null}
      {rule?.incorrectPenalty != null && !complete ? (
        <Txt weight="semibold" className="text-ink-900 text-sm mt-2">
          {t("rule.partialPenalty", { p: rule.incorrectPenalty })}
        </Txt>
      ) : null}
      {rule && complete ? (
        <Txt weight="semibold" className="text-ink-900 text-sm mt-3">
          {t("rule.detail", { c: rule.correctMarks!, p: rule.incorrectPenalty!, u: rule.unansweredMarks! })}
        </Txt>
      ) : null}
      <Txt className="text-ink-500 text-xs leading-5 mt-2">{note}</Txt>
    </View>
  );
}
