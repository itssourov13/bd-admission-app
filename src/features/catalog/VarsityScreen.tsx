import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt, UniversityLogo } from "@/components/ui";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { useLang, useNum, useT } from "@/i18n";
import { colors } from "@/theme";
import { countEligible, listInstitutions, listPapersByInstitutions } from "@/repositories/content";
import { groupInstitutions, universityDisplayName, type UniversityGroup } from "./universities";
import type { PaperSummary } from "@/types/domain";

const ALL = "all";

/** Horizontal university filter: "All | DU | RU | JU | HSTU ...". Parent universities only, never internal bank variants. */
function UniversityFilterBar({ groups, selected, onSelect, allLabel, a11yLabel }: { groups: UniversityGroup[]; selected: string; onSelect: (key: string) => void; allLabel: string; a11yLabel: string }) {
  const options = [{ key: ALL, label: allLabel }, ...groups.map((g) => ({ key: g.key, label: g.shortName }))];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={a11yLabel} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {options.map((o) => {
        const active = o.key === selected;
        return (
          <Pressable
            key={o.key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onSelect(o.key)}
            className={`rounded-full px-4 py-2 border ${active ? "bg-brand-600 border-brand-600" : "bg-surface border-sand-200"}`}
          >
            <Txt weight="semibold" className={`text-sm ${active ? "text-white" : "text-ink-700"}`}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Varsity tab: parent-university list with a filter bar; a selected university shows its papers across all banks. */
export function VarsityScreen() {
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState<string>(ALL);

  const base = useQuery(async (db) => ({
    eligible: await countEligible(db, { category: "varsity" }),
    institutions: await listInstitutions(db, "varsity")
  }));
  const groups = useMemo(() => groupInstitutions(base.data?.institutions ?? []), [base.data]);
  const group = groups.find((g) => g.key === selected) ?? null;
  const activeKey = group ? group.key : ALL;
  const idsKey = group ? group.institutionIds.join(",") : "";
  const papersQuery = useQuery<PaperSummary[]>(
    async (db) => (group ? listPapersByInstitutions(db, { institutionIds: group.institutionIds, category: "varsity" }) : []),
    [idsKey]
  );

  const title = t("catalog.varsityTitle");
  const subtitle = t("catalog.varsitySubtitle");
  const practiceScope = group ? { category: "varsity", institutionIds: group.institutionIds.join(",") } : { category: "varsity" };
  const practiceAvailable = group ? group.eligibleCount > 0 || group.reviewCandidateCount > 0 : (base.data?.eligible ?? 0) > 0;

  const header = (
    <View className="pt-6 pb-3">
      <Txt font="display" weight="bold" className="text-ink-900 text-3xl leading-10">{title}</Txt>
      <Txt className="text-ink-500 text-sm leading-6 mt-1">{subtitle}</Txt>
      {groups.length > 1 ? (
        <View className="mt-4">
          <UniversityFilterBar groups={groups} selected={activeKey} onSelect={setSelected} allLabel={t("catalog.filterAll")} a11yLabel={t("catalog.filterLabel")} />
        </View>
      ) : null}
      {practiceAvailable ? (
        <View className="mt-4 gap-2.5">
          <Button label={group ? t("catalog.practiceUniversity") : t("catalog.practiceAll")} icon={<Ionicons name="flash" size={18} color={colors.white} />} onPress={() => router.push(href("/flash/setup", practiceScope))} />
          {!group || group.eligibleCount >= 100 ? <Button label={t("home.examTitle")} variant="outline" onPress={() => router.push(href("/exam/setup", practiceScope))} /> : null}
        </View>
      ) : null}
      {group ? <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-5">{universityDisplayName(group.key, group.fallbackName, lang)}</Txt> : null}
    </View>
  );

  if (base.loading) return <Screen edges={["top"]} className="px-5">{header}<LoadingView /></Screen>;
  if (base.error && !base.data) return <Screen edges={["top"]} className="px-5">{header}<ErrorView onRetry={base.reload} /></Screen>;

  const paperMeta = (p: PaperSummary) => (p.eligibleCount === 0 && p.reviewCandidateCount > 0
    ? t("catalog.provisionalPaperMeta", { questions: p.questionCount, candidates: p.reviewCandidateCount })
    : t("paper.meta", { questions: p.questionCount, eligible: p.eligibleCount }));

  if (group) {
    // Drop rows left over from the previously selected university while the new query is loading.
    const papers = (papersQuery.data ?? []).filter((p) => group.institutionIds.includes(p.institutionId));
    return (
      <Screen edges={["top"]} className="px-5">
        <FlatList
          data={papers}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={header}
          ListEmptyComponent={papersQuery.loading ? <LoadingView /> : <EmptyView icon="document-outline" title={t("catalog.noPapers")} />}
          contentContainerStyle={{ paddingBottom: 28 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item: p }) => (
            <Pressable accessibilityRole="button" onPress={() => router.push(href(`/paper/${encodeURIComponent(p.id)}`))}>
              <Card className="p-4 flex-row items-center gap-3">
                <UniversityLogo universityKey={group.key} shortName={group.shortName} />
                <View className="flex-1">
                  <Txt weight="bold" className="text-ink-900 text-base leading-6">{p.title ?? t("paper.title", { year: p.year })}</Txt>
                  <Txt className="text-ink-500 text-xs leading-5 mt-1">{paperMeta(p)}</Txt>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    <Chip label={String(num(p.year))} />
                    {p.unit ? <Chip label={t("paper.unit", { unit: p.unit })} /> : null}
                    {p.academicSession ? <Chip label={t("paper.session", { session: p.academicSession })} /> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
              </Card>
            </Pressable>
          )}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} className="px-5">
      <FlatList
        data={groups}
        keyExtractor={(g) => g.key}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyView icon="library-outline" title={t("catalog.emptyTitle")} body={t("catalog.emptyBody")} />}
        contentContainerStyle={{ paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item: g }) => {
          const name = universityDisplayName(g.key, g.fallbackName, lang);
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={() => setSelected(g.key)}>
              <Card className="p-4 flex-row items-center gap-3">
                <UniversityLogo universityKey={g.key} shortName={g.shortName} />
                <View className="flex-1">
                  <Txt weight="bold" className="text-ink-900 text-base leading-6">{name}</Txt>
                  <Txt className="text-ink-500 text-xs leading-5 mt-1">{g.eligibleCount === 0 && g.reviewCandidateCount > 0
                    ? t("catalog.provisionalInstitutionMeta", { papers: g.paperCount, questions: g.questionCount, candidates: g.reviewCandidateCount })
                    : t("catalog.universityMeta", { papers: g.paperCount, questions: g.questionCount, eligible: g.eligibleCount })}</Txt>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
