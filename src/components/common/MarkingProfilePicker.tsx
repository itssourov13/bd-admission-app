import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Txt } from "@/components/ui";
import { ChoiceChip } from "@/components/common/Toggle";
import { ProfileStatusLine, ProfileValues, useProfileName } from "@/components/common/MarkingProfileCard";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useT, type TranslationKey } from "@/i18n";
import { getPreferences, listAllProfiles, markingContextForFilter } from "@/repositories/marking";
import { hasCompleteScoringRule, type ScoringRule } from "@/services/scoring";
import { isAutoScoringBlocked, isScorable, selectProfile } from "@/services/markingProfiles";
import type { PoolFilter } from "@/types/domain";

interface Props {
  filter: PoolFilter;
  /** Explicit profile id chosen on this screen; null = automatic. */
  value: string | null;
  onChange: (profileId: string | null) => void;
  /** The rule the exam would use without a profile; a complete one wins over an automatic default. */
  baseRule?: ScoringRule | null;
  /** Custom Practice is unscored unless the user explicitly picks a profile. */
  customPractice?: boolean;
}

/** Shows which marking profile will score this practice, why, and lets the user pick another or go manage profiles. */
export function MarkingProfilePicker({ filter, value, onChange, baseRule, customPractice }: Props) {
  const t = useT();
  const router = useRouter();
  const name = useProfileName();
  const [open, setOpen] = useState(false);
  const q = useQuery(async (db) => {
    const [all, prefs, ctx] = await Promise.all([listAllProfiles(db), getPreferences(db), markingContextForFilter(db, filter)]);
    return { all, choice: selectProfile(all, prefs, ctx, value) };
  }, [JSON.stringify(filter), value]);

  const data = q.data;
  if (!data?.choice) return null;
  const { choice } = data;
  const storedWins = choice.origin === "auto_default" && Boolean(baseRule && hasCompleteScoringRule(baseRule));
  const autoBlocked = !storedWins && isAutoScoringBlocked(baseRule ?? { status: "unconfigured" }, choice, customPractice === true);
  return (
    <Card className="p-4 mt-4">
      <View className="flex-row items-center justify-between">
        <Txt weight="semibold" className="text-ink-900 text-sm">{t("marking.current")}</Txt>
        <Button label={open ? t("marking.cancel") : t("marking.change")} variant="ghost" onPress={() => setOpen((v) => !v)} />
      </View>
      <Txt weight="semibold" className="text-ink-900 mt-1">{name(choice.profile)}</Txt>
      <Txt className="text-ink-500 text-xs mt-0.5">{t(`marking.origin.${choice.origin}` as TranslationKey)}</Txt>
      {storedWins ? (
        <Txt className="text-ink-700 text-sm leading-5 mt-2">{t("marking.storedRuleWins")}</Txt>
      ) : autoBlocked ? (
        <Txt className="text-ink-700 text-sm leading-5 mt-2">{t("marking.autoUnscored")}</Txt>
      ) : (
        <>
          <View className="mt-2"><ProfileStatusLine profile={choice.profile} /></View>
          <ProfileValues profile={choice.profile} />
        </>
      )}
      {open ? (
        <View className="mt-3">
          <View className="flex-row flex-wrap gap-2">
            <ChoiceChip label={t("marking.auto")} selected={value === null} onPress={() => { onChange(null); setOpen(false); }} />
            {data.all.filter(isScorable).map((p) => (
              <ChoiceChip key={p.id} label={name(p)} selected={value === p.id} onPress={() => { onChange(p.id); setOpen(false); }} />
            ))}
          </View>
        </View>
      ) : null}
      <View className="mt-2"><Button label={t("marking.manage")} variant="ghost" onPress={() => router.push(href("/marking-profiles"))} /></View>
    </Card>
  );
}
