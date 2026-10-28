import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { QuestionCard } from "@/components/common/QuestionCard";
import { RuleNotice } from "@/components/common/RuleNotice";
import { Stat } from "@/components/common/Stat";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href, scopeParams } from "@/features/navigation/links";
import { useNum, useT, type TranslationKey } from "@/i18n";
import { colors, feedback } from "@/theme";
import { getSession } from "@/repositories/sessions";
import { loadExam, type ExamResult, type LoadedExam } from "@/services/practiceService";
import type { FlashResult } from "@/services/flashController";
import { formatClock } from "@/services/timer";
import type { ScoringRule } from "@/services/scoring";

export default function ResultScreen() {
  const t = useT();
  const num = useNum();
  const router = useRouter();
  const id = String(useLocalSearchParams<{ id: string }>().id ?? "");
  const [review, setReview] = useState(false);
  const q = useQuery(async (db) => {
    const session = await getSession(db, id);
    const exam: LoadedExam | null = session?.mode === "exam" && session.status !== "active" ? await loadExam(db, id) : null;
    return { session, exam };
  }, [id]);

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title="" /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title="" /><ErrorView onRetry={q.reload} /></Screen>;
  const { session, exam } = q.data!;
  if (!session) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("result.notFound")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;
  if (session.status === "active") return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("result.notFinished")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;

  let parsed: unknown = null;
  try { parsed = session.resultJson ? JSON.parse(session.resultJson) : null; } catch { parsed = null; }
  if (!parsed) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("result.notFound")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;

  const isExam = session.mode === "exam";
  const rule: ScoringRule | null = session.ruleStatus && session.ruleStatus !== "unconfigured" && session.ruleCorrect !== null
    ? { correctMarks: session.ruleCorrect, incorrectPenalty: session.rulePenalty ?? 0, unansweredMarks: session.ruleUnanswered ?? 0, status: session.ruleStatus } : null;

  let scoreLabel: string; let counts: { label: string; value: string; tone?: string }[]; let accuracy: number; let accuracyText: string; let advice: TranslationKey[]; let timeLine: string | null = null; let reason: string | null = null;
  if (isExam) {
    const r = parsed as ExamResult;
    scoreLabel = session.ruleStatus === "unconfigured" || !session.ruleStatus ? t("result.noScore") : t("result.scoreOutOf", { score: num(r.score), max: num(r.maxScore) });
    counts = [
      { label: t("result.correct"), value: num(r.correct), tone: colors.brand700 },
      { label: t("result.incorrect"), value: num(r.incorrect), tone: feedback.danger700 },
      { label: t("result.unanswered"), value: num(r.unanswered) },
      ...(r.ungradedQuestions > 0 ? [{ label: t("result.ungraded"), value: num(r.ungradedQuestions) }] : [])
    ];
    accuracy = r.accuracyPercent;
    accuracyText = r.answered === 0 ? t("result.notAvailable") : `${num(accuracy)}%`;
    advice = r.advice as TranslationKey[];
    timeLine = num(formatClock(r.elapsedSeconds));
    reason = r.reason === "time_expired" ? t("result.reasonExpired") : t("result.reasonSubmitted");
  } else {
    const r = parsed as FlashResult;
    scoreLabel = r.score === null ? t("result.noScore") : num(r.score);
    counts = [
      { label: t("result.correct"), value: num(r.summary.correct), tone: colors.brand700 },
      { label: t("result.incorrect"), value: num(r.summary.incorrect), tone: feedback.danger700 },
      { label: t("result.skipped"), value: num(r.summary.skipped) },
      { label: t("result.timedOut"), value: num(r.summary.timedOut) },
      { label: t("result.answered"), value: num(r.summary.answered) },
      { label: t("result.rounds"), value: num(r.summary.cyclesCompleted) }
    ];
    accuracy = r.summary.accuracyPercent;
    accuracyText = r.provisional && r.summary.answered === 0 ? t("result.notAvailable") : `${num(accuracy)}%`;
    advice = r.advice as TranslationKey[];
    timeLine = num(formatClock(r.summary.totalSeconds));
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={isExam ? t("result.examTitle") : t("result.flashTitle")} onBack={() => router.replace("/")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <Card className="p-5 items-center">
          <Txt className="text-ink-500 text-xs">{t("result.score")}</Txt>
          <Txt font="display" weight="bold" className="text-ink-900 text-4xl mt-1">{scoreLabel}</Txt>
          {reason ? <View className="mt-2"><Chip label={reason} /></View> : null}
          <Txt className="text-ink-700 text-sm mt-3">{t("result.accuracy")}: {accuracyText}</Txt>
          {timeLine ? <Txt className="text-ink-500 text-xs mt-1">{t("result.time")}: {timeLine}</Txt> : null}
        </Card>
        {session.filter.reviewUnverified ? <Card className="p-3.5 mt-3"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
        <View className="flex-row flex-wrap gap-2.5 mt-3">{counts.map((c) => <Stat key={c.label} {...c} />)}</View>
        <Txt className="text-ink-400 text-xs leading-5 mt-3">{t("result.accuracyNote")}</Txt>
        <View className="mt-4"><RuleNotice rule={rule} status={session.ruleStatus ?? "unconfigured"} /></View>
        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-5 mb-2">{t("result.adviceTitle")}</Txt>
        {advice.map((k) => <Txt key={k} className="text-ink-700 text-sm leading-6 mb-1.5">• {t(k)}</Txt>)}

        <View className="mt-5 gap-2.5">
          <Button label={t("result.practiceAgain")} onPress={() => router.replace(href(isExam ? "/exam/setup" : "/flash/setup", scopeParams(session.filter)))} />
          {isExam && exam ? <Button label={review ? t("result.reviewHide") : t("result.review")} variant="outline" onPress={() => setReview((v) => !v)} /> : null}
          <Button label={t("common.home")} variant="ghost" onPress={() => router.replace("/")} />
        </View>

        {review && exam ? (
          <View className="mt-5 gap-4">
            {exam.questions.map((qv, i) => (
              <Card key={qv.id} className="p-4">
                <Txt className="text-ink-500 text-xs mb-1">{t("flash.questionNo", { n: i + 1 })}</Txt>
                <QuestionCard question={qv} selected={exam.selected[qv.id] ?? []} reveal disabled showSources provisionalScoring={session.filter.reviewUnverified === true} />
                {(exam.selected[qv.id] ?? []).length === 0 ? <Txt className="text-ink-500 text-xs mt-2">{t("result.noSelection")}</Txt> : null}
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
