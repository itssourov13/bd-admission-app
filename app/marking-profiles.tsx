import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { TextField } from "@/components/common/TextField";
import { ErrorView, LoadingView } from "@/components/common/StateViews";
import { fieldLabelKey, ProfileStatusLine, ProfileValues, useProfileName } from "@/components/common/MarkingProfileCard";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { useT } from "@/i18n";
import { deleteUserProfile, getPreferences, listAllProfiles, saveUserProfile, setPreference } from "@/repositories/marking";
import {
  cloneAsUserProfile, isScorable, parseNumberInput, PROFILE_DISPLAY_FIELDS, profileValue, validateProfile,
  type MarkingProfile, type ProfileField
} from "@/services/markingProfiles";

interface Draft { id: string; name: string; fields: Partial<Record<ProfileField, string>>; base: MarkingProfile | null }

function newId(): string {
  return `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function draftFrom(profile: MarkingProfile | null, id: string, name: string): Draft {
  const fields: Draft["fields"] = {};
  for (const f of PROFILE_DISPLAY_FIELDS) {
    const v = profile ? profileValue(profile, f) : null;
    if (v !== null) fields[f] = String(f === "durationSeconds" ? v / 60 : v);
  }
  return { id, name, fields, base: profile };
}

/** Returns the profile built from the draft, or null when any typed value is invalid. */
function profileFromDraft(d: Draft): MarkingProfile | null {
  const values: MarkingProfile["values"] = {};
  for (const f of PROFILE_DISPLAY_FIELDS) {
    const parsed = parseNumberInput(d.fields[f] ?? "");
    if (parsed === "invalid") return null;
    if (parsed !== null) values[f] = { value: f === "durationSeconds" ? Math.round(parsed * 60) : parsed, provenance: "user" };
  }
  const name = d.name.trim();
  const base = d.base;
  return {
    id: d.id, kind: "user", name: { en: name, bn: name }, values,
    universityKey: base?.universityKey, academicSessions: base?.academicSessions, units: base?.units,
    basedOn: base ? (base.kind === "builtin" ? base.id : base.basedOn) : undefined
  };
}

export default function MarkingProfilesScreen() {
  const t = useT();
  const db = useDb();
  const name = useProfileName();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [invalid, setInvalid] = useState(false);
  const q = useQuery(async (d) => ({ all: await listAllProfiles(d), prefs: await getPreferences(d) }), []);

  const scopeOf = (p: MarkingProfile) => (p.universityKey ? `u:${p.universityKey}` : "*");
  const fail = () => Alert.alert(t("error.title"), t("error.saveFailed"));

  const toggleDefault = (p: MarkingProfile) => {
    const isDefault = q.data?.prefs[scopeOf(p)] === p.id;
    setPreference(db, scopeOf(p), isDefault ? null : p.id).then(q.reload, fail);
  };

  const save = () => {
    if (!draft) return;
    const profile = profileFromDraft(draft);
    if (!profile || validateProfile(profile).length > 0) { setInvalid(true); return; }
    saveUserProfile(db, profile).then((r) => {
      if (!r.ok) { setInvalid(true); return; }
      setInvalid(false); setDraft(null); q.reload();
    }, fail);
  };

  const remove = (p: MarkingProfile) => Alert.alert(t("marking.deleteTitle"), t("marking.deleteBody"), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("marking.delete"), style: "destructive", onPress: () => { deleteUserProfile(db, p.id).then(q.reload, fail); } }
  ]);

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title={t("marking.title")} /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title={t("marking.title")} /><ErrorView onRetry={q.reload} /></Screen>;
  const { all, prefs } = q.data!;
  const builtin = all.filter((p) => p.kind === "builtin");
  const mine = all.filter((p) => p.kind === "user");

  const card = (p: MarkingProfile) => {
    const isDefault = prefs[scopeOf(p)] === p.id;
    return (
      <Card key={p.id} className="p-4 mb-3">
        <Txt weight="semibold" className="text-ink-900">{name(p)}</Txt>
        <View className="mt-2"><ProfileStatusLine profile={p} /></View>
        <ProfileValues profile={p} />
        {p.source ? (
          <Txt className="text-ink-500 text-xs leading-5 mt-2">
            {t("marking.source")}: {p.source.label} · {t("marking.checkedOn", { date: p.source.checkedOn })}
          </Txt>
        ) : null}
        {p.notes ? <Txt className="text-ink-700 text-sm leading-5 mt-2">{name({ name: p.notes })}</Txt> : null}
        {!isScorable(p) ? <Txt className="text-ink-500 text-xs leading-5 mt-2">{t("marking.notScorable")}</Txt> : null}
        {isDefault ? <View className="flex-row mt-2"><Chip label={t("marking.isDefault")} tone="brand" /></View> : null}
        <View className="flex-row flex-wrap gap-2 mt-3">
          {isScorable(p) ? <Button label={isDefault ? t("marking.clearDefault") : t("marking.makeDefault")} variant="outline" onPress={() => toggleDefault(p)} /> : null}
          <Button label={t("marking.copy")} variant="outline" onPress={() => { setInvalid(false); setDraft(draftFrom(cloneAsUserProfile(p, newId(), p.name), newId(), t("marking.copyName", { name: name(p) }))); }} />
          {p.kind === "user" ? <Button label={t("marking.edit")} variant="outline" onPress={() => { setInvalid(false); setDraft(draftFrom(p, p.id, name(p))); }} /> : null}
          {p.kind === "user" ? <Button label={t("marking.delete")} variant="ghost" onPress={() => remove(p)} /> : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("marking.title")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        <Txt className="text-ink-500 text-sm leading-5 mb-4">{t("marking.intro")}</Txt>
        {draft ? (
          <Card className="p-4 mb-4">
            <Txt weight="semibold" className="text-ink-900 mb-2">{t("marking.name")}</Txt>
            <TextField value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} maxLength={60} />
            {PROFILE_DISPLAY_FIELDS.map((f) => (
              <View key={f} className="mt-3">
                <Txt className="text-ink-700 text-sm mb-1">{t(fieldLabelKey(f))}</Txt>
                <TextField
                  value={draft.fields[f] ?? ""} keyboardType="decimal-pad" maxLength={8}
                  onChangeText={(v) => setDraft({ ...draft, fields: { ...draft.fields, [f]: v } })}
                  accessibilityLabel={t(fieldLabelKey(f))}
                />
              </View>
            ))}
            {invalid ? <Txt className="text-ink-900 text-sm leading-5 mt-3">{t("marking.invalid")}</Txt> : null}
            <View className="flex-row gap-2 mt-4">
              <Button label={t("marking.save")} onPress={save} />
              <Button label={t("marking.cancel")} variant="ghost" onPress={() => { setDraft(null); setInvalid(false); }} />
            </View>
          </Card>
        ) : (
          <Button label={t("marking.newProfile")} variant="outline" onPress={() => { setInvalid(false); setDraft(draftFrom(null, newId(), "")); }} />
        )}
        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-5 mb-2">{t("marking.mine")}</Txt>
        {mine.length ? mine.map(card) : <Txt className="text-ink-500 text-sm">{t("marking.noneYet")}</Txt>}
        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-5 mb-2">{t("marking.builtin")}</Txt>
        {builtin.map(card)}
      </ScrollView>
    </Screen>
  );
}
