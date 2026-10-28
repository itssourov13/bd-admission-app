import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, Modal, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Screen, Txt } from "@/components/ui";
import { QuestionCard } from "@/components/common/QuestionCard";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useNow } from "@/hooks/useNow";
import { href } from "@/features/navigation/links";
import { useNum, useT } from "@/i18n";
import { colors, feedback } from "@/theme";
import { bookmarkedIds, toggleBookmark } from "@/repositories/userData";
import { finalizeStandardExam, loadExam, persistSelection, type LoadedExam } from "@/services/practiceService";
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
  const [index, setIndex] = useState(0);
  const [grid, setGrid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const finalizing = useRef(false);

  const load = useCallback(() => (
    loadExam(db, id).then((e) => {
      if (!e) { setState("missing"); return; }
      if (e.session.status !== "active") { router.replace(href(`/result/${id}`)); return; }
      setExam(e); setSelected(e.selected); setState("ready");
    }, () => setState("error"))
  ), [db, id, router]);
  useEffect(() => { void load(); }, [load]);

  const deadline = exam?.session.deadlineAt ?? 0;
  const active = state === "ready" && !busy;
  const now = useNow(active, 500);
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));

  // Exactly-once finalization: the ref blocks re-entry here, and the conditional UPDATE blocks it in SQLite.
  const submit = useCallback(async (reason: "submitted" | "time_expired") => {
    if (finalizing.current) return;
    finalizing.current = true;
    setBusy(true);
    setGrid(false);
    try {
      await finalizeStandardExam(db, id, reason, Date.now());
      router.replace(href(`/result/${id}`));
    } catch {
      finalizing.current = false;
      setBusy(false);
      setNotice(t("error.saveFailed"));
    }
  }, [db, id, router, t]);

  useEffect(() => {
    if (state !== "ready" || deadline <= 0 || now < deadline) return undefined;
    const timer = setTimeout(() => void submit("time_expired"), 0);
    return () => clearTimeout(timer);
  }, [state, now, deadline, submit]);

  const q = exam?.questions[index];
  useEffect(() => {
    if (!q) return;
    bookmarkedIds(db, [q.id]).then((b) => setMarks((cur) => new Set([...cur, ...b])), () => undefined);
  }, [db, q]);

  const answeredCount = exam ? exam.questions.filter((x) => (selected[x.id] ?? []).length > 0).length : 0;
  const total = exam?.questions.length ?? 0;

  const choose = async (key: string | null) => {
    if (!q || busy) return;
    const keys = key === null ? [] : [key];
    const ok = await persistSelection(db, id, q.id, keys, Date.now()).catch(() => false);
    if (ok) setSelected((cur) => ({ ...cur, [q.id]: keys }));
    else setNotice(t("exam.saveFailed"));
  };

  const confirmSubmit = useCallback(() => {
    const u = total - answeredCount;
    Alert.alert(t("exam.submitTitle"), u > 0 ? t("exam.submitBody", { u }) : t("exam.submitBodyAll"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("exam.submit"), style: "destructive", onPress: () => void submit("submitted") }
    ]);
  }, [answeredCount, submit, t, total]);

  const confirmLeave = useCallback(() => {
    Alert.alert(t("exam.leaveTitle"), t("exam.leaveBody"), [
      { text: t("exam.stay"), style: "cancel" },
      { text: t("exam.leave"), onPress: () => router.replace("/") }
    ]);
  }, [router, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { if (grid) setGrid(false); else confirmLeave(); return true; });
    return () => sub.remove();
  }, [confirmLeave, grid]);

  if (state === "loading") return <Screen edges={["top", "bottom"]}><LoadingView /></Screen>;
  if (state === "error") return <Screen edges={["top", "bottom"]}><ErrorView onRetry={() => { setState("loading"); void load(); }} /></Screen>;
  if (state === "missing" || !exam || !q) return <Screen edges={["top", "bottom"]}><EmptyView title={t("result.notFound")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;
  if (busy) return <Screen edges={["top", "bottom"]}><LoadingView label={remaining === 0 ? t("exam.timeUp") : t("exam.finalizing")} /></Screen>;

  const low = remaining <= 300;
  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-2 gap-2">
        <Pressable accessibilityRole="button" accessibilityLabel={t("exam.leave")} onPress={confirmLeave} hitSlop={8} className="w-11 h-11 items-center justify-center rounded-full active:bg-sand-100">
          <Ionicons name="close" size={24} color={colors.ink900} />
        </Pressable>
        <View className="flex-1">
          <Txt weight="bold" className="text-ink-900 text-base">{t("exam.questionOf", { n: index + 1, t: total })}</Txt>
          <Txt className="text-ink-500 text-xs">{t("exam.answeredOf", { n: answeredCount, t: total })}</Txt>
        </View>
        <View accessibilityRole="timer" accessibilityLabel={`${t("exam.timeLeft")} ${num(formatClock(remaining))}`} className="rounded-2xl px-3.5 py-1.5" style={{ backgroundColor: low ? feedback.danger100 : colors.brand100 }}>
          <Txt weight="bold" className="text-lg" style={{ color: low ? feedback.danger700 : colors.brand700 }}>{num(formatClock(remaining))}</Txt>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 12 }}>
        {notice ? <Card className="p-3 mb-3"><Txt className="text-ink-700 text-sm">{notice}</Txt></Card> : null}
        <QuestionCard
          question={q}
          selected={selected[q.id] ?? []}
          onSelect={(k) => void choose(k)}
          bookmarked={marks.has(q.id)}
          onToggleBookmark={() => { toggleBookmark(db, q.id).then((on) => setMarks((cur) => { const n = new Set(cur); if (on) n.add(q.id); else n.delete(q.id); return n; }), () => setNotice(t("error.saveFailed"))); }}
        />
        {(selected[q.id] ?? []).length > 0 ? <View className="mt-3"><Button label={t("exam.clear")} variant="ghost" size="md" onPress={() => void choose(null)} /></View> : null}
      </ScrollView>

      <View className="flex-row gap-2 px-4 pt-2 pb-3 border-t border-sand-200 bg-surface">
        <View className="flex-1"><Button label={t("exam.prev")} variant="outline" size="md" disabled={index === 0} onPress={() => setIndex((i) => Math.max(0, i - 1))} /></View>
        <View className="flex-1"><Button label={t("exam.gridOpen")} variant="outline" size="md" onPress={() => setGrid(true)} /></View>
        <View className="flex-1"><Button label={index === total - 1 ? t("exam.submit") : t("exam.next")} size="md" variant={index === total - 1 ? "accent" : "primary"} onPress={() => (index === total - 1 ? confirmSubmit() : setIndex((i) => Math.min(total - 1, i + 1)))} /></View>
      </View>

      <Modal visible={grid} animationType="slide" transparent onRequestClose={() => setGrid(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-body rounded-t-3xl p-5" style={{ maxHeight: "85%" }}>
            <View className="flex-row items-center">
              <Txt font="display" weight="bold" className="flex-1 text-ink-900 text-lg">{t("exam.grid")}</Txt>
              <Pressable accessibilityRole="button" accessibilityLabel={t("common.close")} onPress={() => setGrid(false)} hitSlop={8} className="w-11 h-11 items-center justify-center"><Ionicons name="close" size={24} color={colors.ink900} /></Pressable>
            </View>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1 my-2">
              {[[colors.brand500, "exam.legendCurrent"], [colors.brand100, "exam.legendAnswered"], [colors.surface, "exam.legendUnanswered"]].map(([c, k]) => (
                <View key={k} className="flex-row items-center gap-1.5"><View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c, borderWidth: 1, borderColor: colors.sand300 }} /><Txt className="text-ink-500 text-xs">{t(k as "exam.legendCurrent")}</Txt></View>
              ))}
            </View>
            <ScrollView>
              <View className="flex-row flex-wrap gap-2 pb-4">
                {exam.questions.map((x, i) => {
                  const done = (selected[x.id] ?? []).length > 0;
                  const cur = i === index;
                  return (
                    <Pressable key={x.id} accessibilityRole="button" accessibilityLabel={`${t("flash.questionNo", { n: i + 1 })}${done ? ` · ${t("exam.legendAnswered")}` : ""}`}
                      onPress={() => { setIndex(i); setGrid(false); }}
                      style={{ width: 52, height: 48, borderRadius: 12, borderWidth: cur ? 2 : 1, borderColor: cur ? colors.brand700 : colors.sand300, backgroundColor: cur ? colors.brand500 : done ? colors.brand100 : colors.surface }}
                      className="items-center justify-center">
                      <Txt weight="semibold" className="text-sm" style={{ color: cur ? colors.white : colors.ink900 }}>{num(i + 1)}</Txt>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Button label={t("exam.submit")} variant="accent" onPress={() => { setGrid(false); confirmSubmit(); }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
