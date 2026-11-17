import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, PublisherMark, Screen, Txt, UniversityLogo } from "@/components/ui";
import { SessionDrawer } from "@/components/library/SessionDrawer";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { BookChips, BookProvenance } from "@/components/library/BookMeta";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href, scopeParams } from "@/features/navigation/links";
import { bookPracticeState, isBookAvailable, localizedName, rightsNeedsAttention } from "@/features/library/model";
import { universityKeyForBook } from "@/features/library/presentation";
import { publisherLogoFor } from "@/features/library/publisherLogos";
import { groupUnitsByRoot, hasSessionHierarchy, type UnitGroup } from "@/features/library/sessions";
import { KNOWN_UNIVERSITIES } from "@/features/catalog/universities";
import type { UnitRow } from "@/types/domain";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { getBook, listUnits } from "@/repositories/library";
import { CUSTOM_PRACTICE_LIMITS } from "@/services/exam";

/** Book details → chapter/unit tree → practice (Flash / custom) or browse, reusing the shared practice scope (bookId/unitId). */
export default function BookScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const id = String(useLocalSearchParams<{ id: string }>().id ?? "");
  const q = useQuery(async (db) => ({ book: await getBook(db, id), units: await listUnits(db, id) }), [id]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title="" /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title="" /><ErrorView onRetry={q.reload} /></Screen>;
  const { book, units } = q.data!;
  if (!book) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("library.notFound")} actionLabel={t("common.back")} onAction={() => router.back()} /></Screen>;

  const available = isBookAvailable(book.installState);
  const practice = bookPracticeState(book);
  const poolSize = book.eligibleCount > 0 ? book.eligibleCount : book.reviewCandidateCount;
  const canCustom = practice !== "none" && poolSize >= CUSTOM_PRACTICE_LIMITS.minQuestions;
  const bookScope = scopeParams({ bookId: book.id });
  const groups = groupUnitsByRoot(units);
  const drawers = hasSessionHierarchy(groups);
  const uniKey = universityKeyForBook(book.examRelevance, KNOWN_UNIVERSITIES);
  const uni = uniKey ? KNOWN_UNIVERSITIES.find((u) => u.key === uniKey) ?? null : null;
  const logo = uni ? { key: uni.key, shortName: uni.shortName } : null;
  const brand = book.collection && publisherLogoFor(null, book.collection.trim().toLowerCase()) ? book.collection : null;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={localizedName(book.title, book.titleBn, lang)} subtitle={localizedName(book.publisherName, book.publisherNameBn, lang)} />
      <FlatList<UnitGroup | UnitRow>
        data={available ? (drawers ? groups : units) : []}
        keyExtractor={(u) => ("root" in u ? u.root.id : u.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListHeaderComponent={
          <View className="gap-3 mb-4">
            <Card className="p-4 gap-3">
              {logo || brand ? (
                <View className="flex-row items-center gap-3">
                  {logo ? <UniversityLogo universityKey={logo.key} shortName={logo.shortName} size={56} /> : null}
                  {brand ? <PublisherMark name={brand} slug={brand.trim().toLowerCase()} size={56} /> : null}
                </View>
              ) : null}
              <BookChips book={book} />
              {book.description ? <Txt className="text-ink-700 text-sm leading-6">{book.description}</Txt> : null}
              {rightsNeedsAttention(book) ? <Txt className="text-ink-500 text-xs leading-5">{t("library.rightsAttention")}</Txt> : null}
              <Txt className="text-ink-700 text-sm leading-5">{practice === "provisional"
                ? t("library.provisionalStats", { total: num(book.questionCount), candidates: num(book.reviewCandidateCount) })
                : t("library.questionStats", { total: num(book.questionCount), eligible: num(book.eligibleCount) })}</Txt>
              <BookProvenance book={book} />
            </Card>
            {!available ? (
              <EmptyView icon="cloud-offline-outline" title={t("library.bookUnavailableTitle")} body={t("library.bookUnavailableBody")} />
            ) : (
              <>
                {practice === "provisional" ? <Card className="p-3.5"><Txt className="text-ink-700 text-sm leading-5">{t("library.provisionalNote")}</Txt></Card> : null}
                {practice === "none" ? <Card className="p-3.5"><Txt className="text-ink-700 text-sm leading-5">{t("library.noPracticeNote")}</Txt></Card> : null}
                <View className="gap-2.5">
                  <Button label={t("library.practiceBook")} disabled={practice === "none"} icon={<Ionicons name="flash" size={18} color={colors.white} />} onPress={() => router.push(href("/flash/setup", bookScope))} />
                  <Button label={t("library.examBook")} variant="outline" disabled={!canCustom} onPress={() => router.push(href("/exam/setup", bookScope))} />
                  <Button label={t("library.browseBook")} variant="ghost" disabled={book.questionCount === 0} onPress={() => router.push(href("/browse", bookScope))} />
                  <Txt className="text-ink-500 text-xs leading-5">{t("library.customNote")}</Txt>
                </View>
                <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-3">{t(drawers ? "library.sessionsTitle" : "library.unitsTitle")}</Txt>
              </>
            )}
          </View>
        }
        ListEmptyComponent={available ? <EmptyView icon="list-outline" title={t("library.noUnits")} /> : null}
        renderItem={({ item }) => {
          if ("root" in item) {
            return <SessionDrawer bookId={book.id} group={item} logo={logo} expanded={Boolean(open[item.root.id])} onToggle={() => setOpen((o) => ({ ...o, [item.root.id]: !o[item.root.id] }))} />;
          }
          const u = item;
          const unitScope = scopeParams({ bookId: book.id, unitId: u.id });
          return (
            <Card className="p-3.5" style={{ marginLeft: Math.min(u.depth, 3) * 14 }}>
              <Txt weight="semibold" className="text-ink-900 text-sm leading-5">{localizedName(u.title, u.titleBn, lang)}</Txt>
              <Txt className="text-ink-500 text-xs mt-0.5">{t("library.unitQuestions", { n: num(u.questionCount) })}</Txt>
              {u.questionCount > 0 ? (
                <View className="flex-row gap-2 mt-2.5">
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t("library.unitPractice")} ${u.title}`} onPress={() => router.push(href("/flash/setup", unitScope))} className="flex-row items-center gap-1 rounded-full bg-brand-100 px-3 py-1.5">
                    <Ionicons name="flash" size={14} color={colors.brand700} /><Txt weight="semibold" className="text-brand-700 text-xs">{t("library.unitPractice")}</Txt>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t("library.unitBrowse")} ${u.title}`} onPress={() => router.push(href("/browse", unitScope))} className="flex-row items-center gap-1 rounded-full bg-sand-100 px-3 py-1.5">
                    <Ionicons name="reader-outline" size={14} color={colors.ink700} /><Txt weight="semibold" className="text-ink-700 text-xs">{t("library.unitBrowse")}</Txt>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </Screen>
  );
}
