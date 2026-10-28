import { FlatList, View } from "react-native";
import { Card, Screen } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { QuestionCard } from "@/components/common/QuestionCard";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useQuery } from "@/hooks/useQuery";
import { useT } from "@/i18n";
import { loadQuestions } from "@/repositories/content";
import { listBookmarkIds, toggleBookmark } from "@/repositories/userData";

export default function BookmarksScreen() {
  const t = useT();
  const db = useDb();
  const q = useQuery(async (d) => loadQuestions(d, await listBookmarkIds(d, 200)));
  const remove = (id: string) => { toggleBookmark(db, id).then(q.reload, q.reload); };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("bookmarks.title")} />
      {q.loading ? <LoadingView /> : q.error && !q.data ? <ErrorView onRetry={q.reload} /> : (
        <FlatList
          data={q.data!}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          ListEmptyComponent={<EmptyView icon="bookmark-outline" title={t("bookmarks.emptyTitle")} body={t("bookmarks.emptyBody")} />}
          renderItem={({ item }) => <Card className="p-4"><QuestionCard question={item} reveal showSources bookmarked onToggleBookmark={() => remove(item.id)} /></Card>}
        />
      )}
    </Screen>
  );
}
