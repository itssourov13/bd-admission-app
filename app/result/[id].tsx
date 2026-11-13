import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Chip, Screen, Txt } from "@/components/ui";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { QuestionCard } from "@/components/common/QuestionCard";
import { RuleNotice } from "@/components/common/RuleNotice";
import { Stat } from "@/components/common/Stat";
import { AccuracyBar, ScoreRing } from "@/components/common/ScoreRing";
import { EmptyView, ErrorView, LoadingView } from "@/components/common/StateViews";
import { useQuery } from "@/hooks/useQuery";
import { href, scopeParams } from "@/features/navigation/links";
import { useNum, useT, type TranslationKey, useLang } from "@/i18n";
import { useTheme } from "@/settings";
import { getSession } from "@/repositories/sessions";
import { getBookScopeLabel } from "@/repositories/library";
import { loadExam, toScorable, type ExamResult, type LoadedExam } from "@/services/practiceService";
import { ChoiceChip } from "@/components/common/Toggle";
import { matchesReviewFilter, reviewStatus, subjectBreakdown, type ReviewFilter } from "@/services/examReview";
import { buildExamSections } from "@/services/subjects";
import type { FlashResult } from "@/services/flashController";
import { formatClock } from "@/services/timer";
import { useSubjectLabel } from "@/components/common/SubjectSelector";
import { selectedSubjectsOf } from "@/services/subjectSelection";
import { passAssessment } from "@/services/markingProfiles";
import type { ScoringRule } from "@/services/scoring";

export default function ResultScreen() {
  const { colors, feedback } = useTheme();
  const t = useT();
  const num = useNum();
  const router = useRouter();
  const subjectLabel = useSubjectLabel();
  const { lang } = useLang();
  const id = String(useLocalSearchParams<{ id: string }>().id ?? "");
  const [review, setReview] = useState(false);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const q = useQuery(async (db) => {
    const session = await getSession(db, id);
    const exam: LoadedExam | null = session?.mode === "exam" && session.status !== "active" ? await loadExam(db, id) : null;
    const bookLabel = session?.filter.bookId ? await getBookScopeLabel(db, { bookId: session.filter.bookId, unitId: session.filter.unitId }, lang) : null;
    return { session, exam, bookLabel };
  }, [id, lang]);

  if (q.loading) return <Screen edges={["top"]}><ScreenHeader title="" /><LoadingView /></Screen>;
  if (q.error && !q.data) return <Screen edges={["top"]}><ScreenHeader title="" /><ErrorView onRetry={q.reload} /></Screen>;
  const { session, exam, bookLabel } = q.data!;
  if (!session) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("result.notFound")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;
  if (session.status === "active") return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("result.notFinished")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;

  let parsed: unknown = null;
  try { parsed = session.resultJson ? JSON.parse(session.resultJson) : null; } catch { parsed = null; }
  if (!parsed) return <Screen edges={["top"]}><ScreenHeader title="" /><EmptyView title={t("result.notFound")} actionLabel={t("common.home")} onAction={() => router.replace("/")} /></Screen>;

  const isExam = session.mode === "exam";
  const rule: ScoringRule | null = session.ruleStatus && session.ruleStatus !== "unconfigured"
    ? {
        correctMarks: session.ruleCorrect, incorrectPenalty: session.rulePenalty, unansweredMarks: session.ruleUnanswered,
        totalMarks: session.ruleTotalMarks, status: session.ruleStatus
      } : null;

  let scoreLabel: string; let counts: { label: string; value: string; tone?: string }[]; let accuracy: number; let accuracyText: string; let advice: TranslationKey[]; let timeLine: string | null = null; let reason: string | null = null;
  let passNote: string | null = null;
  if (isExam) {
    const r = parsed as ExamResult;
    const pass = passAssessment(session.ruleProfile, r.score, r.totalQuestions);
    if (pass.state === "passed") passNote = t("marking.passed", { m: num(pass.passMarks!) });
    else if (pass.state === "below") passNote = t("marking.below", { m: num(pass.passMarks!) });
    else if (pass.state === "not_comparable") passNote = t("marking.notComparable", { m: num(pass.passMarks!), q: num(session.ruleProfile?.questionCount ?? 0) });
    scoreLabel = session.ruleStatus === "unconfigured" || !session.ruleStatus || r.score === null || r.maxScore === null
      ? t("result.noScore") : t("result.scoreOutOf", { score: num(r.score), max: num(r.maxScore) });
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

  const accuracyKnown = accuracyText !== t("result.notAvailable");

  // Exam-only extras: numbering matches the exam screen (section order), plus per-subject breakdown and the review filter.
  const provisional = session.filter.reviewUnverified === true;
  const examItems = exam ? buildExamSections(exam.questions, session.filter.paperId).flatMap((s) => s.data) : [];
  const flaggedSet = new Set(exam?.flagged ?? []);
  const breakdown = exam ? subjectBreakdown(exam.questions.map((qv) => ({ id: qv.id, subject: qv.subject, scorable: toScorable(qv, provisional) })), exam.selected) : [];
  const statusOf = (qv: LoadedExam["questions"][number]) => reviewStatus(toScorable(qv, provisional), exam?.selected[qv.id] ?? []);
  const reviewItems = examItems.filter((it) => matchesReviewFilter(statusOf(it.question), flaggedSet.has(it.question.id), filter));
  const missed = isExam
    ? (parsed as ExamResult).incorrect + (parsed as ExamResult).unanswered
    : (parsed as FlashResult).summary.incorrect + (parsed as FlashResult).summary.skipped + (parsed as FlashResult).summary.timedOut;
  const filters: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: t("result.filterAll") }, { key: "incorrect", label: t("result.filterIncorrect") },
    { key: "unanswered", label: t("result.filterUnanswered") }, ...(flaggedSet.size > 0 ? [{ key: "flagged" as const, label: `${t("result.filterFlagged")} (${num(flaggedSet.size)})` }] : [])
  ];

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={isExam ? t("result.examTitle") : t("result.flashTitle")} onBack={() => router.replace("/")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <Card className="p-5 items-center">
          <Txt className="text-ink-500 text-xs">{t("result.score")}</Txt>
          <Txt font="display" weight="bold" className="text-ink-900 text-4xl mt-1">{scoreLabel}</Txt>
          {reason ? <View className="mt-2"><Chip label={reason} /></View> : null}
          {bookLabel ? <Txt className="text-ink-500 text-xs mt-2">{t("history.book", { name: bookLabel })}</Txt> : null}
          {selectedSubjectsOf(session.filter).length ? <Txt className="text-ink-500 text-xs mt-2">{t("history.subjects", { subjects: selectedSubjectsOf(session.filter).map(subjectLabel).join(", ") })}</Txt> : null}
          <View className="mt-4">
            <ScoreRing percent={accuracyKnown ? accuracy : 0} color={colors.brand700} trackColor={colors.sand200} accessibilityLabel={`${t("result.accuracy")}: ${accuracyText}`}>
              <Txt font="display" weight="bold" className="text-ink-900 text-2xl">{accuracyText}</Txt>
              <Txt className="text-ink-500 text-xs">{t("result.accuracy")}</Txt>
            </ScoreRing>
          </View>
          {timeLine ? <Txt className="text-ink-500 text-xs mt-1">{t("result.time")}: {timeLine}</Txt> : null}
        </Card>
        {session.filter.reviewUnverified ? <Card className="p-3.5 mt-3"><Txt className="text-ink-700 text-sm leading-5">{t("practice.provisionalBanner")}</Txt></Card> : null}
        <View className="flex-row flex-wrap gap-2.5 mt-3">{counts.map((c) => <Stat key={c.label} {...c} />)}</View>
        <Txt className="text-ink-500 text-xs leading-5 mt-3">{t("result.accuracyNote")}</Txt>
        <View className="mt-4"><RuleNotice rule={rule} status={session.ruleStatus ?? "unconfigured"} /></View>
        {session.ruleProfile ? <Txt className="text-ink-500 text-xs mt-2">{t("marking.usedProfile", { name: lang === "bn" ? session.ruleProfile.name.bn || session.ruleProfile.name.en : session.ruleProfile.name.en || session.ruleProfile.name.bn })}</Txt> : null}
        {passNote ? <Txt className="text-ink-700 text-sm leading-5 mt-1">{passNote}</Txt> : null}
        {breakdown.length > 1 ? (
          <View className="mt-5">
            <Txt font="display" weight="bold" className="text-ink-900 text-lg mb-2">{t("result.bySubject")}</Txt>
            {breakdown.map((row) => (
              <Card key={row.subject ?? "__none__"} className="p-3.5 mb-2">
                <View className="flex-row items-center justify-between">
                  <Txt weight="semibold" className="text-ink-900 text-sm flex-1">{row.subject === null ? t("exam.sectionOther") : subjectLabel(row.subject)}</Txt>
                  <Txt className="text-ink-500 text-xs">{row.accuracyPercent === null ? t("result.notAvailable") : t("result.subjectAccuracy", { a: num(row.accuracyPercent) })}</Txt>
                </View>
                <View className="mt-2"><AccuracyBar percent={row.accuracyPercent} color={colors.brand700} trackColor={colors.sand200} /></View>
                <Txt className="text-ink-700 text-xs mt-2">{t("result.subjectRow", { c: num(row.correct), i: num(row.incorrect), u: num(row.unanswered) })}</Txt>
              </Card>
            ))}
          </View>
        ) : null}
        <Txt font="display" weight="bold" className="text-ink-900 text-lg mt-5 mb-2">{t("result.adviceTitle")}</Txt>
        {advice.map((k) => <Txt key={k} className="text-ink-700 text-sm leading-6 mb-1.5">• {t(k)}</Txt>)}

        <View className="mt-5 gap-2.5">
          {missed > 0 ? <Button label={t("result.practiceMissed")} variant="accent" onPress={() => router.push(href("/flash/setup", scopeParams({ retrySessionId: session.id })))} /> : null}
          <Button label={t("result.practiceAgain")} onPress={() => router.replace(href(isExam ? "/exam/setup" : "/flash/setup", scopeParams(session.filter)))} />
          {isExam && exam ? <Button label={review ? t("result.reviewHide") : t("result.review")} variant="outline" onPress={() => setReview((v) => !v)} /> : null}
          <Button label={t("common.home")} variant="ghost" onPress={() => router.replace("/")} />
        </View>

        {review && exam ? (
          <View className="mt-5 gap-4">
            <View className="flex-row flex-wrap gap-2">
              {filters.map((f) => <ChoiceChip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />)}
            </View>
            {reviewItems.length === 0 ? <Txt className="text-ink-500 text-sm">{t("result.noMatch")}</Txt> : null}
            {reviewItems.map((it) => (
              <Card key={it.question.id} className="p-4">
                <View className="flex-row items-center justify-between mb-1">
                  <Txt className="text-ink-500 text-xs">{t("flash.questionNo", { n: it.number })}</Txt>
                  {flaggedSet.has(it.question.id) ? <Txt weight="semibold" className="text-xs" style={{ color: colors.gold700 }}>⚑ {t("exam.flagged")}</Txt> : null}
                </View>
                <QuestionCard question={it.question} selected={exam.selected[it.question.id] ?? []} reveal disabled showSources provisionalScoring={provisional} />
                {(exam.selected[it.question.id] ?? []).length === 0 ? <Txt className="text-ink-500 text-xs mt-2">{t("result.noSelection")}</Txt> : null}
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
