import { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Card, Screen } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { QuestionCard } from "@/components/common/QuestionCard";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useT } from "@/i18n";
import { listPaperQuestionIds, loadQuestions } from "@/repositories/content";
import { bookmarkedIds, toggleBookmark } from "@/repositories/userData";
import type { QuestionView } from "@/types/domain";

const PAGE = 20;

/** Read-only question browser for one paper: shows verified answers, explanations, sources and bookmark toggles. */
export default function BrowseScreen() {
  const t = useT();
  const db = useDb();
  const p = useLocalSearchParams<{ paperId?: string }>();
  const paperId = String(p.paperId ?? "");
  const [items, setItems] = useState<QuestionView[]>([]);
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadPage = useCallback(async (offset: number) => {
    const ids = await listPaperQuestionIds(db, paperId, PAGE, offset);
    const qs = await loadQuestions(db, ids);
    const b = await bookmarkedIds(db, ids);
    return { qs, ids, b };
  }, [db, paperId]);

  const first = useCallback(() => (
    loadPage(0).then(({ qs, ids, b }) => { setItems(qs); setMarks(b); setMore(ids.length === PAGE); setState("ready"); }, () => setState("error"))
  ), [loadPage]);
  useEffect(() => { void first(); }, [first]);

  const loadMore = async () => {
    setBusy(true);
    try {
      const { qs, ids, b } = await loadPage(items.length);
      setItems((cur) => [...cur, ...qs]);
      setMarks((cur) => new Set([...cur, ...b]));
      setMore(ids.length === PAGE);
    } catch { setState("error"); } finally { setBusy(false); }
  };

  const toggle = async (id: string) => {
    try {
      const on = await toggleBookmark(db, id);
      setMarks((cur) => { const n = new Set(cur); if (on) n.add(id); else n.delete(id); return n; });
    } catch { /* leave the star unchanged; nothing was saved */ }
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("browse.title")} />
      {state === "loading" ? <LoadingView /> : state === "error" ? <ErrorView onRetry={() => { setState("loading"); void first(); }} /> : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          ListEmptyComponent={<EmptyView title={t("browse.empty")} />}
          renderItem={({ item }) => (
            <Card className="p-4"><QuestionCard question={item} reveal showSources bookmarked={marks.has(item.id)} onToggleBookmark={() => void toggle(item.id)} /></Card>
          )}
          ListFooterComponent={more ? <View className="mt-4"><Button label={t("browse.more")} variant="outline" loading={busy} onPress={() => void loadMore()} /></View> : null}
        />
      )}
    </Screen>
  );
}
