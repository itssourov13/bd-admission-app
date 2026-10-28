import type { FlashSummary } from "./flash.ts";

export type AdviceKey =
  | "advice.noAnswers"
  | "advice.tooFewSamples"
  | "advice.accuracyStrong"
  | "advice.accuracyMid"
  | "advice.accuracyLow"
  | "advice.manyTimeouts"
  | "advice.manySkips"
  | "advice.slowPace"
  | "advice.keepGoing";

/** Deterministic, offline advice. Same input always yields the same ordered keys (max 3). */
export function flashAdvice(s: FlashSummary, perQuestionSeconds: number): AdviceKey[] {
  if (s.seen === 0) return ["advice.noAnswers"];
  if (s.answered === 0) return s.timedOut >= s.skipped ? ["advice.manyTimeouts"] : ["advice.manySkips"];
  const out: AdviceKey[] = [];
  if (s.answered < 10) out.push("advice.tooFewSamples");
  if (s.accuracyPercent >= 80) out.push("advice.accuracyStrong");
  else if (s.accuracyPercent >= 50) out.push("advice.accuracyMid");
  else out.push("advice.accuracyLow");
  if (s.timedOut / s.seen >= 0.2) out.push("advice.manyTimeouts");
  else if (s.skipped / s.seen >= 0.3) out.push("advice.manySkips");
  else if (s.avgAnswerSeconds !== null && s.avgAnswerSeconds > perQuestionSeconds * 0.8) out.push("advice.slowPace");
  if (out.length === 0) out.push("advice.keepGoing");
  return out.slice(0, 3);
}

export function examAdvice(accuracyPercent: number, unanswered: number, graded: number): AdviceKey[] {
  const out: AdviceKey[] = [];
  if (graded > 0 && unanswered / graded >= 0.2) out.push("advice.manySkips");
  if (accuracyPercent >= 80) out.push("advice.accuracyStrong");
  else if (accuracyPercent >= 50) out.push("advice.accuracyMid");
  else out.push("advice.accuracyLow");
  return out.slice(0, 3);
}
