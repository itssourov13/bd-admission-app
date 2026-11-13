import { Pressable, SectionList, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, PublisherMark, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { BookChips } from "@/components/library/BookMeta";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { bookPracticeState, groupBooksIntoSections, localizedName } from "@/features/library/model";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { getPublisher, listBooks } from "@/repositories/library";

/**
 * Publisher → its books grouped into Books / University / Engineering / Medical / Subject-based / Other sections.
 * Sections appear only when real books exist; a publisher with metadata but no books gets an explicit empty state.
 */
export default function PublisherScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const id = String(useLocalSearchParams<{ id: string }>().id ?? "");
  const q = useQuery(async (db) => ({ publisher: await getPublisher(db, id), books: await listBooks(db, id) }), [id]);

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title="" /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title="" /><ErrorView onRetry={q.reload} /></Screen>;
  const { publisher, books } = q.data!;
  if (!publisher) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("library.notFound")} actionLabel={t("common.back")} onAction={() => router.back()} /></Screen>;
  const name = localizedName(publisher.name, publisher.nameBn, lang);
  const sections = groupBooksIntoSections(books).map((s) => ({ ...s, title: t(`library.section.${s.key}` as const) }));

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={name} subtitle={lang === "bn" ? publisher.name : publisher.nameBn ?? undefined} />
      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: books.length === 0 ? 1 : undefined }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="mb-4 flex-row items-center gap-3">
            <PublisherMark name={publisher.name} logoKey={publisher.logoKey} slug={publisher.slug} size={56} />
            <View className="flex-1">
              {publisher.description ? <Txt className="text-ink-700 text-sm leading-5">{publisher.description}</Txt> : null}
              <Txt className="text-ink-500 text-xs leading-5 mt-1">{publisher.availableBooks > 0 ? `${t("library.booksCount", { n: num(publisher.availableBooks) })} · ${t("library.questionsCount", { n: num(publisher.questionCount) })}` : t("library.noContentYet")}</Txt>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyView icon="book-outline" title={t("library.noBooksTitle")} body={t("library.noBooksBody")} />}
        renderSectionHeader={({ section }) => (
          <Txt font="display" weight="bold" className="text-ink-900 text-base mt-3 mb-2">{`${section.title} (${num(section.data.length)})`}</Txt>
        )}
        renderItem={({ item: b }) => {
          const practice = bookPracticeState(b);
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={localizedName(b.title, b.titleBn, lang)} onPress={() => router.push(href(`/library/book/${encodeURIComponent(b.id)}`))} className="active:opacity-90">
              <Card className="p-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <View className="flex-1"><Txt weight="bold" className="text-ink-900 text-base leading-6">{localizedName(b.title, b.titleBn, lang)}</Txt></View>
                  <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
                </View>
                <Txt className="text-ink-500 text-xs leading-5">{practice === "provisional"
                  ? t("library.provisionalStats", { total: num(b.questionCount), candidates: num(b.reviewCandidateCount) })
                  : t("library.questionStats", { total: num(b.questionCount), eligible: num(b.eligibleCount) })}</Txt>
                <BookChips book={b} />
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
