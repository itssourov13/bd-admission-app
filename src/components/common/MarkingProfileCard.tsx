import { View } from "react-native";
import { Chip, Txt } from "@/components/ui";
import { useLang, useNum, useT, type TranslationKey } from "@/i18n";
import {
  PROFILE_DISPLAY_FIELDS, profileStatus, profileValue, weakestProvenance,
  type MarkingProfile, type ProfileField, type Provenance
} from "@/services/markingProfiles";

type Tone = "neutral" | "brand" | "gold";
const PROV_TONE: Record<Provenance, Tone> = { official: "brand", secondary: "gold", derived: "gold", illustrative: "neutral", user: "neutral" };

export function provenanceLabelKey(p: Provenance): TranslationKey {
  return `marking.prov.${p}` as TranslationKey;
}

export function ProvenanceChip({ provenance }: { provenance: Provenance }) {
  const t = useT();
  return <Chip label={t(provenanceLabelKey(provenance))} tone={PROV_TONE[provenance]} />;
}

export function useProfileName() {
  const { lang } = useLang();
  return (p: { name: { en: string; bn: string } }) => (lang === "bn" ? p.name.bn || p.name.en : p.name.en || p.name.bn);
}

export function fieldLabelKey(f: ProfileField): TranslationKey {
  return (f === "durationSeconds" ? "marking.field.durationMinutes" : `marking.field.${f}`) as TranslationKey;
}

/** Status line: tells the user whether scores from this profile are official, illustrative or impossible. */
export function ProfileStatusLine({ profile }: { profile: MarkingProfile }) {
  const t = useT();
  const status = profileStatus(profile);
  const weakest = weakestProvenance(profile);
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Chip label={t(`marking.status.${status}` as TranslationKey)} tone={status === "verified" ? "brand" : status === "illustrative" ? "gold" : "neutral"} />
      {weakest && status !== "unconfigured" ? <ProvenanceChip provenance={weakest} /> : null}
    </View>
  );
}

/** Every value with its own provenance chip, so nothing inferred can look official. */
export function ProfileValues({ profile }: { profile: MarkingProfile }) {
  const t = useT();
  const num = useNum();
  return (
    <View className="mt-2">
      {PROFILE_DISPLAY_FIELDS.map((f) => {
        const raw = profileValue(profile, f);
        if (raw === null) return null;
        const shown = f === "durationSeconds" ? Math.round((raw / 60) * 10) / 10 : raw;
        return (
          <View key={f} className="flex-row items-center justify-between py-1">
            <Txt className="text-ink-700 text-sm flex-1 pr-2">{t(fieldLabelKey(f))}: <Txt weight="semibold" className="text-ink-900 text-sm">{num(shown)}</Txt></Txt>
            <ProvenanceChip provenance={profile.values[f]!.provenance} />
          </View>
        );
      })}
    </View>
  );
}
