import type { QuestionCategory } from "./question-pack.ts";
import type { RuleStatus } from "../services/scoring.ts";
import type { ProfileSnapshot } from "../services/markingProfiles.ts";

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
  /** All stored institutions of one parent university (e.g. RU and RU-V). Combined with institutionId by intersection. */
  institutionIds?: string[];
  paperId?: string;
  /** A resolved university exam pattern: only the questions of these papers (all share one complete stored pattern). Never combined with paperId. */
  paperIds?: string[];
  subject?: string;
  /** Optional multiple section selection for paper-specific exams. */
  subjects?: string[];
  /** True only for explicitly provisional practice; scores use the third-party source key. */
  reviewUnverified?: boolean;
  /** True only for an explicit user-chosen count/duration on a paper without a verified pattern; never scored as official. */
  customPractice?: boolean;
  /** Practice only the questions a finished session got wrong or left unanswered (Phase 5). */
  retrySessionId?: string;
  /** Practice only an available publisher book (Phase 8). Replaces the paper-appearance requirement; never combined with papers. */
  bookId?: string;
  /** Restrict a book scope to one unit and all its sub-units. */
  unitId?: string;
}

export interface InstitutionSummary {
  id: string;
  code: string;
  name: string;
  paperCount: number;
  questionCount: number;
  eligibleCount: number;
  /** Structurally safe but unverified questions available only in provisional practice. */
  reviewCandidateCount: number;
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
  /** Structurally safe but not independently verified; only used in explicit provisional practice. */
  reviewCandidateCount: number;
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
  ruleTotalMarks: number | null;
  ruleStatus: RuleStatus | null;
  resultJson: string | null;
  /** Marking profile used for scoring (immutable snapshot), or null for sessions without one. */
  ruleProfile: ProfileSnapshot | null;
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

// ---- Publications library (Phase 8) -------------------------------------------------------------------------------

export type PublisherKind = "publisher" | "coaching" | "institution" | "community";
export type BookLanguage = "bn" | "en" | "mixed";
export type BookTargetCategory = QuestionCategory | "general";
export type BookContentType = "book" | "question_bank" | "model_test" | "mixed";
export type BookVerification = "verified" | "unverified" | "metadata_only";
export type LicenseStatus = "licensed" | "public_domain" | "owner_created" | "permission_pending" | "metadata_only";
/** Availability, never existence: removed/catalogue-only books keep their rows so user data still resolves. */
export type InstallState = "catalogue_only" | "bundled" | "installed" | "removed";
export type UnitKind = "chapter" | "unit" | "section" | "test";

export interface PublisherSummary {
  id: string;
  slug: string;
  name: string;
  nameBn: string | null;
  kind: PublisherKind;
  description: string | null;
  website: string | null;
  /** Key into the (currently empty) licensed publisher-logo registry; null means monogram fallback. */
  logoKey: string | null;
  /** Books whose content is usable now (bundled or installed). */
  availableBooks: number;
  /** Of those, books installed from a downloaded package. */
  installedBooks: number;
  /** Known to the catalogue but not usable right now (catalogue-only or removed). */
  unavailableBooks: number;
  /** Distinct questions in available books. */
  questionCount: number;
  categories: BookTargetCategory[];
}

export interface BookSummary {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherNameBn: string | null;
  title: string;
  titleBn: string | null;
  edition: string | null;
  publicationYear: number | null;
  subject: string | null;
  language: BookLanguage;
  targetCategory: BookTargetCategory;
  contentType: BookContentType;
  verificationStatus: BookVerification;
  contentVersion: number;
  versionLabel: string | null;
  sourceNote: string | null;
  licenseStatus: LicenseStatus;
  licenseNote: string | null;
  installState: InstallState;
  /** Counted from content_unit_questions, never from the stored cache column. */
  questionCount: number;
  eligibleCount: number;
  reviewCandidateCount: number;
}

export interface UnitRow {
  id: string;
  bookId: string;
  parentId: string | null;
  kind: UnitKind;
  title: string;
  titleBn: string | null;
  sortOrder: number;
  /** Distinct questions in this unit and all of its descendants. */
  questionCount: number;
  depth: number;
}
