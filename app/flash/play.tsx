import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { QuestionCard } from "@/components/common/QuestionCard";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useDb } from "@/db/provider";
import { useNow } from "@/hooks/useNow";
import { href, scopeFromParams } from "@/features/navigation/links";
import { useNum, useT } from "@/i18n";
import { colors, feedback } from "@/theme";
import { toggleBookmark, bookmarkedIds } from "@/repositories/userData";
import { FlashController } from "@/services/flashController";
import { clampFlashSeconds, formatClock } from "@/services/timer";

type Boot = "boot" | "empty" | "error" | "run";

export default function FlashPlay() {
  const t = useT();
  const num = useNum();
  const db = useDb();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scope = scopeFromParams(params);
  const reviewUnverified = (Array.isArray(params.reviewUnverified) ? params.reviewUnverified[0] : params.reviewUnverified) === "1";
  const perQuestion = clampFlashSeconds(Number(Array.isArray(params.seconds) ? params.seconds[0] : params.seconds));

  const ctl = useRef<FlashController | null>(null);
  const started = useRef(false);
  const leaving = useRef(false);
  const [boot, setBoot] = useState<Boot>("boot");
  const [c, setC] = useState<FlashController | null>(null);
  const [, setRev] = useState(0);
  const bump = useCallback(() => setRev((n) => n + 1), []);
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const begin = useCallback(() => {
    FlashController.start(db, scope, perQuestion, { includeReviewCandidates: reviewUnverified }).then(
      (started) => { if (!started) { setBoot("empty"); return; } ctl.current = started; setC(started); setBoot("run"); },
      () => setBoot("error")
    );
    // scope/perQuestion are fixed for this screen instance from its route params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    begin();
  }, [begin]);

  // Leaving by any route closes the session so history stays consistent (finish is idempotent).
  useEffect(() => () => { void ctl.current?.finish().catch(() => undefined); }, []);

  const running = boot === "run" && c !== null && c.phase === "asking";
  const now = useNow(running, 250);

  // Deadline-based timeout: runs on every tick and on return from background; the controller rejects duplicates.
  useEffect(() => {
    if (!c || c.phase !== "asking") return;
    if (c.remainingSeconds(now) === 0) void c.timeout(c.state.position, now).then((r) => { if (r.applied) bump(); });
  }, [now, c, bump]);

  const qid = c?.question?.id ?? c?.feedback?.question.id;
  useEffect(() => {
    if (!qid) return;
    bookmarkedIds(db, [qid]).then((b) => setMarks((cur) => new Set([...cur, ...b])), () => undefined);
  }, [db, qid]);

  const finishAndShow = useCallback(async () => {
    const cc = ctl.current;
    if (!cc || leaving.current) return;
    leaving.current = true;
    try {
      await cc.finish();
      router.replace(href(`/result/${cc.sessionId}`));
    } catch {
      leaving.current = false;
      setNotice(t("error.saveFailed"));
    }
  }, [router, t]);

  const confirmExit = useCallback(() => {
    Alert.alert(t("flash.exitTitle"), t("flash.exitBody"), [
      { text: t("flash.keepGoing"), style: "cancel" },
      { text: t("flash.exit"), style: "destructive", onPress: () => void finishAndShow() }
    ]);
  }, [finishAndShow, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { if (boot === "run") confirmExit(); else router.back(); return true; });
    return () => sub.remove();
  }, [boot, confirmExit, router]);

  const run = (p: Promise<unknown>) => p.then(bump, () => { setNotice(t("error.load")); bump(); });
  const toggle = async (id: string) => {
    try {
      const on = await toggleBookmark(db, id);
      setMarks((cur) => { const n = new Set(cur); if (on) n.add(id); else n.delete(id); return n; });
    } catch { setNotice(t("error.saveFailed")); }
  };

  if (boot === "boot") return <Screen edges={["top", "bottom"]}><LoadingView /></Screen>;
  if (boot === "error") return <Screen edges={["top", "bottom"]}><ErrorView onRetry={() => { setBoot("boot"); begin(); }} /></Screen>;
  if (boot === "empty" || !c) {
    return (
      <Screen edges={["top", "bottom"]} className="justify-center px-5">
        <EmptyView icon="albums-outline" title={t("flash.emptyTitle")} body={t("flash.emptyBody")} actionLabel={t("common.back")} onAction={() => router.back()} />
      </Screen>
    );
  }

  const records = c.state.records;
  const correct = records.filter((r) => r.outcome === "correct").length;
  const wrong = records.filter((r) => r.outcome === "incorrect").length;
  const remaining = c.remainingSeconds(now);
  const low = c.phase === "asking" && remaining <= 5;
  const fb = c.feedback;
  const q = fb ? fb.question : c.question;

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-2 gap-2">
        <View className="flex-1">
          <Txt weight="bold" className="text-ink-900 text-base">{t("flash.questionNo", { n: c.state.position })}</Txt>
          <Txt className="text-ink-500 text-xs">{t("flash.runningScore", { c: correct, i: wrong })}{c.state.cycle > 1 ? ` · ${t("flash.cycle", { n: c.state.cycle })}` : ""}</Txt>
        </View>
        {c.phase === "asking" ? (
          <View accessibilityRole="timer" accessibilityLabel={`${t("flash.timeLeft")} ${num(remaining)}`} className="items-center rounded-2xl px-4 py-1.5" style={{ backgroundColor: low ? feedback.danger100 : colors.brand100 }}>
            <Txt weight="bold" className="text-xl" style={{ color: low ? feedback.danger700 : colors.brand700 }}>{num(formatClock(remaining))}</Txt>
          </View>
        ) : null}
        <Button label={t("flash.exit")} variant="outline" size="md" fullWidth={false} onPress={confirmExit} />
      </View>
      {c.phase === "asking" ? (
        <View className="h-1.5 mx-4 rounded-full bg-sand-200 overflow-hidden">
          <View style={{ width: `${Math.min(100, (remaining / perQuestion) * 100)}%`, backgroundColor: low ? feedback.danger500 : colors.brand500, height: 6 }} />
        </View>
      ) : null}

      {c.phase === "loading" || !q ? <LoadingView /> : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }}>
          {c.reviewUnverified ? <Card className="p-3.5 mb-3"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
          {notice ? <Card className="p-3 mb-3"><Txt className="text-ink-700 text-sm">{notice}</Txt></Card> : null}
          {c.persistFailures > 0 ? <Card className="p-3 mb-3"><Txt className="text-ink-700 text-sm">{t("flash.persistWarn")}</Txt></Card> : null}
          {fb ? (
            <View className="mb-3 flex-row">
              <Chip
                tone={c.reviewUnverified ? "gold" : fb.record.outcome === "correct" ? "brand" : "gold"}
                label={c.reviewUnverified
                  ? fb.record.outcome === "timed_out" ? t("flash.timedOut")
                    : fb.record.outcome === "correct" ? t("flash.provisionalMatch") : t("flash.provisionalMismatch")
                  : fb.record.outcome === "correct" ? t("flash.correct") : fb.record.outcome === "timed_out" ? t("flash.timedOut") : t("flash.incorrect")}
              />
            </View>
          ) : null}
          <QuestionCard
            question={q}
            selected={fb ? fb.record.selectedKeys : []}
            reveal={Boolean(fb)}
            disabled={Boolean(fb)}
            onSelect={fb ? undefined : (key) => run(c.answer(c.state.position, [key]))}
            bookmarked={marks.has(q.id)}
            onToggleBookmark={() => void toggle(q.id)}
            showSources={Boolean(fb)}
            provisionalScoring={c.reviewUnverified}
          />
          {fb ? (
            <View className="mt-5 gap-2.5">
              {fb.correctKeys.length > 0 && !c.reviewUnverified ? <Txt className="text-ink-700 text-sm">{t("flash.correctAnswer", { key: fb.correctKeys.join(", ").toUpperCase() })}</Txt> : null}
              <Button label={t("flash.next")} icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />} onPress={() => run(c.next())} />
            </View>
          ) : (
            <View className="mt-5"><Button label={t("flash.skip")} variant="outline" onPress={() => run(c.skip(c.state.position))} /></View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
