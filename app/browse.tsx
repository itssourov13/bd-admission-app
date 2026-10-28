import { useCallback, useEffect, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { ChoiceChip } from "@/components/common/Toggle";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { QuestionCard } from "@/components/common/QuestionCard";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useNum, useT, type TranslationKey } from "@/i18n";
import { countQuestionsBySubject, listPaperQuestionIds, loadQuestions } from "@/repositories/content";
import { bookmarkedIds, toggleBookmark } from "@/repositories/userData";
import { buildSubjectOptions, SUBJECT_LABEL_KEYS, type SubjectOption } from "@/services/subjects";
import type { QuestionView } from "@/types/domain";

const PAGE = 20;

/** Read-only paper browser, grouped by canonical subject order and filterable without losing pagination. */
export default function BrowseScreen() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const p = useLocalSearchParams<{ paperId?: string }>();
  const paperId = String(p.paperId ?? "");
  const [items, setItems] = useState<QuestionView[]>([]);
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [subject, setSubject] = useState<string | undefined>();
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadPage = useCallback(async (offset: number, selectedSubject = subject) => {
    const ids = await listPaperQuestionIds(db, paperId, PAGE, offset, selectedSubject);
    const qs = await loadQuestions(db, ids);
    const b = await bookmarkedIds(db, ids);
    return { qs, ids, b };
  }, [db, paperId, subject]);

  const first = useCallback(() => (
    countQuestionsBySubject(db, { paperId })
      .then(async (counts) => {
        const { qs, ids, b } = await loadPage(0, subject);
        setSubjectOptions(buildSubjectOptions(counts.bySubject));
        setTotal(counts.total);
        setItems(qs);
        setMarks(b);
        setMore(ids.length === PAGE);
      })
      .then(() => setState("ready"))
      .catch(() => setState("error"))
  ), [db, paperId, loadPage, subject]);

  useEffect(() => { void first(); }, [first]);

  const loadMore = async () => {
    if (busy || !more) return;
    setBusy(true);
    try {
      const { qs, ids, b } = await loadPage(items.length, subject);
      setItems((cur) => [...cur, ...qs]);
      setMarks((cur) => new Set([...cur, ...b]));
      setMore(ids.length === PAGE);
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string) => {
    try {
      const on = await toggleBookmark(db, id);
      setMarks((cur) => { const next = new Set(cur); if (on) next.add(id); else next.delete(id); return next; });
    } catch {
      // Keep the current visual state when the database write fails.
    }
  };

  const changeSubject = (value: string | undefined) => {
    setState("loading");
    setSubject(value);
  };

  const subjectLabel = (value: string) => {
    const key = SUBJECT_LABEL_KEYS[value as keyof typeof SUBJECT_LABEL_KEYS] as TranslationKey | undefined;
    return key ? t(key) : value;
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("browse.title")} />
      {subjectOptions.length > 0 ? (
        <View className="pb-3">
          <Txt weight="semibold" className="text-ink-900 px-5 mb-2">{t("browse.subjectFilter")}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            <ChoiceChip
              label={`${t("browse.allSubjects")} · ${num(total)}`}
              selected={subject === undefined}
              onPress={() => changeSubject(undefined)}
            />
            {subjectOptions.map((option) => (
              <ChoiceChip
                key={option.subject}
                label={`${subjectLabel(option.subject)} · ${num(option.count)}`}
                selected={subject === option.subject}
                onPress={() => changeSubject(option.subject)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {state === "loading" ? <LoadingView /> : state === "error" ? (
        <ErrorView onRetry={() => { setState("loading"); void first(); }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, flexGrow: items.length === 0 ? 1 : undefined }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          ListEmptyComponent={
            subject
              ? <EmptyView title={t("browse.subjectEmpty", { subject: subjectLabel(subject) })} actionLabel={t("browse.showAll")} onAction={() => changeSubject(undefined)} />
              : <EmptyView title={t("browse.empty")} />
          }
          renderItem={({ item }) => (
            <Card className="p-4">
              <QuestionCard question={item} reveal showSources bookmarked={marks.has(item.id)} onToggleBookmark={() => void toggle(item.id)} />
            </Card>
          )}
          ListFooterComponent={more ? (
            <View className="mt-4">
              <Button label={t("browse.more")} variant="outline" loading={busy} onPress={() => void loadMore()} />
            </View>
          ) : null}
        />
      )}
    </Screen>
  );
}
