import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, Txt, UniversityLogo } from "@/components/ui";
import { href, scopeParams } from "@/features/navigation/links";
import { localizedName } from "@/features/library/model";
import { setCardTitle, type UnitGroup } from "@/features/library/sessions";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { CUSTOM_PRACTICE_LIMITS } from "@/services/exam";
import type { UnitRow } from "@/types/domain";

interface Logo { key: string; shortName: string }

/** Flash / Timed practice / Browse pills for one scope (a session root or a source set); same routes as the book screen. */
function ScopeActions({ bookId, unit, labelName }: { bookId: string; unit: UnitRow; labelName: string }) {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const scope = scopeParams({ bookId, unitId: unit.id });
  const none = unit.questionCount === 0;
  const timed = unit.questionCount < CUSTOM_PRACTICE_LIMITS.minQuestions;
  const pill = (label: string, icon: "flash" | "timer-outline" | "reader-outline", path: string, disabled: boolean, tone: "brand" | "gold" | "sand") => {
    const bg = tone === "brand" ? "bg-brand-100" : tone === "gold" ? "bg-gold-100" : "bg-sand-100";
    const fg = tone === "brand" ? colors.brand700 : tone === "gold" ? colors.gold700 : colors.ink700;
    const text = tone === "brand" ? "text-brand-700" : tone === "gold" ? "text-gold-700" : "text-ink-700";
    return (
      <Pressable key={path} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} accessibilityLabel={`${label} — ${labelName}`}
        onPress={() => router.push(href(path, scope))} hitSlop={4}
        className={`flex-row items-center gap-1 rounded-full px-3 py-2 ${bg} ${disabled ? "opacity-40" : ""}`}>
        <Ionicons name={icon} size={14} color={fg} /><Txt weight="semibold" className={`${text} text-xs`}>{label}</Txt>
      </Pressable>
    );
  };
  return (
    <View className="flex-row flex-wrap gap-2">
      {pill(t("library.sessionFlash"), "flash", "/flash/setup", none, "brand")}
      {pill(t("library.sessionExam"), "timer-outline", "/exam/setup", timed, "gold")}
      {pill(t("library.sessionBrowse"), "reader-outline", "/browse", none, "sand")}
    </View>
  );
}

/** One source-set card; same composition as the University Question Bank cards (logo, title, meta, chips). */
function SetCard({ bookId, unit, ordinal, logo }: { bookId: string; unit: UnitRow; ordinal: number; logo: Logo | null }) {
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const { heading, unitLabel } = setCardTitle(unit, ordinal, lang, num, t("library.setWord"));
  return (
    <Card className="p-3.5 gap-3">
      <View className="flex-row items-center gap-3">
        {logo ? <UniversityLogo universityKey={logo.key} shortName={logo.shortName} size={40} /> : null}
        <View className="flex-1">
          <Txt weight="bold" className="text-ink-900 text-sm leading-5">{heading}</Txt>
          <Txt className="text-ink-500 text-xs leading-5">{t("library.unitQuestions", { n: num(unit.questionCount) })}</Txt>
        </View>
        {unitLabel ? <Chip label={unitLabel} tone="brand" /> : null}
      </View>
      <ScopeActions bookId={bookId} unit={unit} labelName={heading} />
    </Card>
  );
}

/** Expandable session card: collapsed shows name, question/set counts; expanded shows whole-session actions plus its set cards. */
export function SessionDrawer({ bookId, group, expanded, onToggle, logo }: { bookId: string; group: UnitGroup; expanded: boolean; onToggle: () => void; logo: Logo | null }) {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const { root, children } = group;
  const name = localizedName(root.title, root.titleBn, lang);
  return (
    <Card className="overflow-hidden">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={t(expanded ? "library.sessionCollapse" : "library.sessionExpand", { name })}
        onPress={onToggle} className="p-4 flex-row items-center gap-3 active:opacity-90">
        {logo ? <UniversityLogo universityKey={logo.key} shortName={logo.shortName} /> : null}
        <View className="flex-1">
          <Txt weight="bold" className="text-ink-900 text-base leading-6">{name}</Txt>
          <Txt className="text-ink-500 text-xs leading-5 mt-0.5">
            {`${t("library.unitQuestions", { n: num(root.questionCount) })}${children.length > 0 ? ` · ${t("library.setsCount", { n: num(children.length) })}` : ""}`}
          </Txt>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.ink400} />
      </Pressable>
      {expanded ? (
        <View className="px-3.5 pb-3.5 gap-3 border-t border-sand-200 pt-3.5">
          <View className="gap-2">
            <Txt weight="semibold" className="text-ink-700 text-xs">{t("library.sessionAll")}</Txt>
            <ScopeActions bookId={bookId} unit={root} labelName={name} />
            <Txt className="text-ink-500 text-xs leading-5">{t("library.sessionExamNote")}</Txt>
          </View>
          {children.map((c, i) => <SetCard key={c.id} bookId={bookId} unit={c} ordinal={i + 1} logo={logo} />)}
        </View>
      ) : null}
    </Card>
  );
}
