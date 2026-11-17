import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, PublisherMark, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { TextField } from "@/components/common/TextField";
import { BookCard } from "@/components/library/BookCard";
import { useQuery } from "@/hooks/useQuery";
import { href } from "@/features/navigation/links";
import { filterBooks, isFilterActive, listCollections, localizedName, type BookFilter } from "@/features/library/model";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import { listAllBooks, listPublishers } from "@/repositories/library";
import type { BookSummary, PublisherSummary } from "@/types/domain";

type Row = { kind: "publisher"; p: PublisherSummary } | { kind: "book"; b: BookSummary };

/** Tappable filter chip (selected state is announced, 44dp-friendly padding). */
function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} hitSlop={6}>
      <Chip label={label} tone={selected ? "brand" : "neutral"} />
    </Pressable>
  );
}

/** Publications library entry point: publishers with real (possibly zero) content counts. */
export default function LibraryScreen() {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const q = useQuery(async (db) => ({ publishers: await listPublishers(db), books: await listAllBooks(db) }));
  const [filter, setFilter] = useState<BookFilter>({});
  const books = q.data?.books;
  const collections = useMemo(() => listCollections(books ?? []), [books]);
  const categories = useMemo(() => [...new Set((books ?? []).map((b) => b.targetCategory))], [books]);
  const filtering = isFilterActive(filter);
  const rows = useMemo<Row[]>(() => filtering
    ? filterBooks(books ?? [], filter).map((b) => ({ kind: "book" as const, b }))
    : (q.data?.publishers ?? []).map((p) => ({ kind: "publisher" as const, p })), [filtering, filter, books, q.data]);
  const set = (patch: Partial<BookFilter>) => setFilter((f) => ({ ...f, ...patch }));
  const showBar = (books?.length ?? 0) > 0;
  const header = (
    <View className="mb-4 gap-3">
      <Txt className="text-ink-500 text-sm leading-6">{t("library.subtitle")}</Txt>
      {showBar ? (
        <>
          <TextField value={filter.text ?? ""} onChangeText={(text) => set({ text })} placeholder={t("library.searchPlaceholder")} accessibilityLabel={t("library.searchLabel")} returnKeyType="search" autoCorrect={false} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <FilterChip label={t("common.all")} selected={!filtering} onPress={() => setFilter({})} />
            {categories.map((c) => <FilterChip key={c} label={t(`library.category.${c}` as const)} selected={filter.category === c} onPress={() => set({ category: filter.category === c ? "all" : c })} />)}
            {collections.map((c) => <FilterChip key={c.name} label={`${c.name} (${num(c.count)})`} selected={filter.collection === c.name} onPress={() => set({ collection: filter.collection === c.name ? "all" : c.name })} />)}
          </ScrollView>
          <Txt weight="bold" className="text-ink-900 text-base">{filtering ? t("library.resultsCount", { n: num(rows.length) }) : t("library.publishersHeading")}</Txt>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("library.title")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (
        <FlatList
          data={rows}
          keyExtractor={(r) => (r.kind === "book" ? `b:${r.b.id}` : `p:${r.p.id}`)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: rows.length === 0 ? 1 : undefined }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={header}
          ListEmptyComponent={filtering
            ? <EmptyView icon="search-outline" title={t("library.noResultsTitle")} body={t("library.noResultsBody")} actionLabel={t("library.clearFilters")} onAction={() => setFilter({})} />
            : <EmptyView icon="library-outline" title={t("library.emptyTitle")} body={t("library.emptyBody")} />}
          renderItem={({ item: row }) => {
            if (row.kind === "book") return <BookCard book={row.b} showPublisher />;
            const p = row.p;
            const name = localizedName(p.name, p.nameBn, lang);
            const secondary = lang === "bn" ? p.name : p.nameBn;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={() => router.push(href(`/library/publisher/${encodeURIComponent(p.id)}`))} className="active:opacity-90">
                <Card className="p-4 flex-row items-center gap-3">
                  <PublisherMark name={p.name} logoKey={p.logoKey} slug={p.slug} />
                  <View className="flex-1">
                    <Txt weight="bold" className="text-ink-900 text-base leading-6">{name}</Txt>
                    {secondary && secondary !== name ? <Txt className="text-ink-500 text-xs leading-5">{secondary}</Txt> : null}
                    <Txt className="text-ink-500 text-xs leading-5 mt-1">
                      {p.availableBooks > 0 ? `${t("library.booksCount", { n: num(p.availableBooks) })} · ${t("library.questionsCount", { n: num(p.questionCount) })}` : t("library.noContentYet")}
                    </Txt>
                    {p.categories.length > 0 || p.installedBooks > 0 || p.unavailableBooks > 0 ? (
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {p.categories.map((c) => <Chip key={c} label={t(`library.category.${c}` as const)} tone="brand" />)}
                        {p.installedBooks > 0 ? <Chip label={t("library.installedCount", { n: num(p.installedBooks) })} /> : null}
                        {p.unavailableBooks > 0 ? <Chip label={t("library.unavailableCount", { n: num(p.unavailableBooks) })} /> : null}
                      </View>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
