import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, Pressable, SectionList, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { QuestionCard } from "@/components/common/QuestionCard";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useNow } from "@/hooks/useNow";
import { href } from "@/features/navigation/links";
import { useNum, useT, type TranslationKey } from "@/i18n";
import { colors, feedback } from "@/theme";
import { bookmarkedIds, toggleBookmark } from "@/repositories/userData";
import { finalizeStandardExam, loadExam, persistSelection, type LoadedExam } from "@/services/practiceService";
import { createSelectionQueue, type SelectionQueue } from "@/services/examSelectionQueue";
import { buildExamSections, SUBJECT_LABEL_KEYS } from "@/services/subjects";
import { formatClock } from "@/services/timer";

export default function ExamScreen() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const id = String(useLocalSearchParams<{ id: string }>().id ?? "");
  const [state, setState] = useState<"loading" | "missing" | "error" | "ready">("loading");
  const [exam, setExam] = useState<LoadedExam | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<TranslationKey | null>(null);
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const finalizing = useRef(false);
  const timeoutTriggered = useRef(false);
  const selectionQueue = useRef<SelectionQueue | null>(null);

  const load = useCallback(() => (
    loadExam(db, id).then((loaded) => {
      if (!loaded) { setState("missing"); return; }
      if (loaded.session.status !== "active") { router.replace(href(`/result/${id}`)); return; }
      selectionQueue.current = createSelectionQueue({
        initial: loaded.selected,
        write: (questionId, keys, at) => persistSelection(db, id, questionId, keys, at),
        onRejected: (questionId, persisted) => {
          setSelected((current) => {
            const next = { ...current };
            if (persisted.length) next[questionId] = persisted;
            else delete next[questionId];
            return next;
          });
          setNotice("exam.saveFailed");
        }
      });
      setExam(loaded);
      setSelected(loaded.selected);
      setMarks(new Set());
      setState("ready");
      void bookmarkedIds(db, loaded.questions.map((q) => q.id)).then(setMarks, () => undefined);
    }, () => setState("error"))
  ), [db, id, router]);
  useEffect(() => { void load(); }, [load]);

  const deadline = exam?.session.deadlineAt ?? 0;
  const active = state === "ready" && !busy;
  const now = useNow(active, 500);
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const sections = useMemo(
    () => exam ? buildExamSections(exam.questions, exam.session.filter.paperId) : [],
    [exam]
  );

  const answeredCount = exam ? exam.questions.filter((q) => (selected[q.id] ?? []).length > 0).length : 0;
  const total = exam?.questions.length ?? 0;
  const allAnswered = total > 0 && answeredCount === total;

  // Drain the serialized selection queue before scoring, so a rapid last tap cannot be lost on submit/timeout.
  const submit = useCallback(async (reason: "submitted" | "time_expired") => {
    if (finalizing.current) return;
    finalizing.current = true;
    setBusy(true);
    try {
      const drained = await selectionQueue.current?.drain(15000);
      const deadlineReached = reason === "time_expired" || Date.now() >= deadline;
      if (drained === false && !deadlineReached) {
        finalizing.current = false;
        setBusy(false);
        setNotice("exam.saveFailed");
        return;
      }
      // The timeout must still finalize using the last answers persisted before the deadline.
      const finalReason = deadlineReached ? "time_expired" : "submitted";
      await finalizeStandardExam(db, id, finalReason, Date.now());
      router.replace(href(`/result/${id}`));
    } catch {
      finalizing.current = false;
      setBusy(false);
      setNotice("error.saveFailed");
    }
  }, [db, deadline, id, router]);

  useEffect(() => {
    if (state !== "ready" || deadline <= 0 || now < deadline || timeoutTriggered.current) return undefined;
    timeoutTriggered.current = true;
    const timer = setTimeout(() => void submit("time_expired"), 0);
    return () => clearTimeout(timer);
  }, [state, now, deadline, submit]);

  const choose = (questionId: string, key: string | null) => {
    if (busy || finalizing.current || remaining <= 0) return;
    const keys = key === null ? [] : [key];
    const queue = selectionQueue.current;
    if (!queue) {
      setNotice("exam.saveFailed");
      return;
    }
    queue.enqueue(questionId, keys);
    setSelected((current) => {
      const next = { ...current };
      if (keys.length) next[questionId] = keys;
      else delete next[questionId];
      return next;
    });
    setNotice(null);
  };

  const confirmSubmit = useCallback(() => {
    if (remaining <= 0) {
      void submit("time_expired");
      return;
    }
    const unanswered = total - answeredCount;
    Alert.alert(
      t("exam.submitTitle"),
      unanswered > 0 ? t("exam.submitBody", { u: unanswered }) : t("exam.submitBodyAll"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("exam.submit"), style: "destructive", onPress: () => void submit("submitted") }
      ]
    );
  }, [answeredCount, remaining, submit, t, total]);

  const confirmLeave = useCallback(() => {
    if (busy || finalizing.current) return;
    Alert.alert(t("exam.leaveTitle"), t("exam.leaveBody"), [
      { text: t("exam.stay"), style: "cancel" },
      { text: t("exam.leave"), onPress: () => router.replace("/") }
    ]);
  }, [busy, router, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { confirmLeave(); return true; });
    return () => sub.remove();
  }, [confirmLeave]);

  if (state === "loading") return <Screen edges={["top", "bottom"]}><LoadingView /></Screen>;
  if (state === "error") return <Screen edges={["top", "bottom"]}><ErrorView onRetry={() => { setState("loading"); void load(); }} /></Screen>;
  if (state === "missing" || !exam) {
    return <Screen edges={["top", "bottom"]}><EmptyView title={t("result.notFound")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;
  }
  if (busy) return <Screen edges={["top", "bottom"]}><LoadingView label={remaining === 0 ? t("exam.timeUp") : t("exam.finalizing")} /></Screen>;

  const low = remaining <= 300;
  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-2 gap-2 border-b border-sand-200">
        <Pressable accessibilityRole="button" accessibilityLabel={t("exam.leave")} onPress={confirmLeave} hitSlop={8} className="w-11 h-11 items-center justify-center rounded-full active:bg-sand-100">
          <Ionicons name="close" size={24} color={colors.ink900} />
        </Pressable>
        <View className="flex-1">
          <Txt weight="bold" className="text-ink-900 text-base">{t("exam.answeredOf", { n: answeredCount, t: total })}</Txt>
          <Txt className="text-ink-500 text-xs">{allAnswered ? t("exam.allAnswered") : t("exam.unansweredLeft", { u: total - answeredCount })}</Txt>
        </View>
        <View accessibilityRole="timer" accessibilityLabel={`${t("exam.timeLeft")} ${num(formatClock(remaining))}`} className="rounded-2xl px-3.5 py-1.5" style={{ backgroundColor: low ? feedback.danger100 : colors.brand100 }}>
          <Txt weight="bold" className="text-lg" style={{ color: low ? feedback.danger700 : colors.brand700 }}>{num(formatClock(remaining))}</Txt>
        </View>
      </View>

      {exam.session.filter.reviewUnverified ? <Card className="mx-4 mt-3 p-3.5"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
      {notice ? <Card className="mx-4 mt-3 p-3"><Txt className="text-ink-700 text-sm">{t(notice)}</Txt></Card> : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.question.id}
        extraData={{ selected, marks, busy }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, flexGrow: sections.length === 0 ? 1 : undefined }}
        stickySectionHeadersEnabled={false}
        initialNumToRender={5}
        windowSize={7}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        renderSectionHeader={({ section }) => {
          const subject = section.subject;
          const key = subject ? SUBJECT_LABEL_KEYS[subject as keyof typeof SUBJECT_LABEL_KEYS] as TranslationKey | undefined : undefined;
          const title = subject === null ? t("exam.sectionOther") : key ? t(key) : subject;
          return (
            <View className="flex-row items-center justify-between bg-body py-2.5">
              <Txt font="display" weight="bold" className="text-ink-900 text-base">{title}</Txt>
              <Txt className="text-ink-500 text-xs">{t("exam.sectionCount", { n: section.data.length })}</Txt>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          const question = item.question;
          const chosen = selected[question.id] ?? [];
          return (
            <Card className="p-4">
              <Txt weight="semibold" className="text-ink-500 text-xs mb-2">{t("flash.questionNo", { n: item.number })}</Txt>
              <QuestionCard
                question={question}
                selected={chosen}
                provisionalScoring={exam.session.filter.reviewUnverified === true}
                onSelect={(key) => choose(question.id, key)}
                disabled={remaining <= 0 || busy}
                bookmarked={marks.has(question.id)}
                onToggleBookmark={() => {
                  void toggleBookmark(db, question.id).then(
                    (on) => setMarks((current) => { const next = new Set(current); if (on) next.add(question.id); else next.delete(question.id); return next; }),
                    () => setNotice("error.saveFailed")
                  );
                }}
              />
              {chosen.length > 0 ? (
                <View className="mt-2">
                  <Button label={t("exam.clear")} variant="ghost" size="md" onPress={() => choose(question.id, null)} />
                </View>
              ) : null}
            </Card>
          );
        }}
        ListEmptyComponent={<EmptyView title={t("result.notFound")} />}
        ListFooterComponent={<View className="h-3" />}
      />

      <View className="px-4 pt-2 pb-3 border-t border-sand-200 bg-surface">
        <Button
          label={t("exam.submit")}
          variant="accent"
          onPress={confirmSubmit}
          disabled={busy}
        />
      </View>
    </Screen>
  );
}
