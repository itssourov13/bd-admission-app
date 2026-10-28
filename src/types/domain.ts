import type { QuestionCategory } from "./question-pack.ts";
import type { RuleStatus } from "../services/scoring.ts";

export type { QuestionCategory, RuleStatus };

export interface OptionView {
  key: string;
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface AppearanceView {
  paperId: string;
  institutionCode: string;
  institutionName: string;
  year: number;
  unit: string | null;
  session: string | null;
  questionNumber: number | null;
  pageNumber: number | null;
  sourceFilename: string | null;
}

export interface QuestionView {
  id: string;
  text: string;
  type: "single_choice" | "multiple_choice";
  category: QuestionCategory;
  subject: string | null;
  topic: string | null;
  answerStatus: "verified" | "unverified" | "unknown";
  contentStatus: "verified" | "unverified";
  explanation: string | null;
  assetPaths: string[];
  options: OptionView[];
  appearances: AppearanceView[];
}

export interface PoolFilter {
  category?: QuestionCategory;
  institutionId?: string;
  paperId?: string;
  subject?: string;
  /** Optional multiple section selection for paper-specific exams. */
  subjects?: string[];
}

export interface InstitutionSummary {
  id: string;
  code: string;
  name: string;
  paperCount: number;
  questionCount: number;
  eligibleCount: number;
}

export interface PaperSummary {
  id: string;
  institutionId: string;
  institutionCode: string;
  institutionName: string;
  category: QuestionCategory;
  year: number;
  academicSession: string | null;
  unit: string | null;
  title: string | null;
  questionCount: number;
  eligibleCount: number;
  ruleStatus: RuleStatus | null;
}

export type SessionMode = "flash" | "exam";
export type SessionStatus = "active" | "completed" | "abandoned";

export interface SessionRow {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  filter: PoolFilter;
  startedAt: number;
  endedAt: number | null;
  deadlineAt: number | null;
  durationSeconds: number | null;
  perQuestionSeconds: number | null;
  finishReason: "submitted" | "time_expired" | "exited" | null;
  ruleCorrect: number | null;
  rulePenalty: number | null;
  ruleUnanswered: number | null;
  ruleStatus: RuleStatus | null;
  resultJson: string | null;
}

export interface HistoryItem extends SessionRow {
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timedOut: number;
}

export interface ProfileRow {
  displayName: string;
  language: "bn" | "en";
  targetCategory: QuestionCategory | null;
  flashSeconds: number;
}
