export type QuestionCategory = "varsity" | "medical" | "engineering";
export type VerificationStatus = "verified" | "unverified" | "unknown" | "illustrative" | "unconfigured";

export interface QuestionSourceDocument {
  id: string;
  filename: string;
  title?: string | null;
  sha256?: string | null;
  sourceType: "pdf" | "image" | "structured-data" | "other";
  notes?: string | null;
}

export interface QuestionPackOption {
  id: string;
  text: string;
  order: number;
}

export interface QuestionPackAppearance {
  paperId: string;
  questionNumber?: number | null;
  pageNumber?: number | null;
  sourceDocumentId?: string | null;
}

export interface QuestionPackItem {
  id: string;
  text: string;
  type: "single_choice" | "multiple_choice";
  category: QuestionCategory;
  subject?: string | null;
  topic?: string | null;
  options: QuestionPackOption[];
  correctOptionIds: string[] | null;
  answerVerificationStatus: "verified" | "unverified" | "unknown";
  contentVerificationStatus: "verified" | "unverified";
  appearances: QuestionPackAppearance[];
  source: {
    documentId: string;
    pageNumber?: number | null;
    questionNumber?: number | null;
  };
  explanation?: string | null;
  assetPaths?: string[];
}

export interface QuestionPackPaper {
  id: string;
  institutionId: string;
  category: QuestionCategory;
  year: number;
  academicSession?: string | null;
  unit?: string | null;
  title?: string | null;
}

export interface QuestionPackExamRule {
  id: string;
  paperId: string;
  correctMarks?: number;
  incorrectPenalty?: number;
  unansweredMarks?: number;
  durationSeconds?: number;
  totalQuestions?: number;
  verificationStatus: "verified" | "illustrative" | "unconfigured";
  sourceDocumentIds?: string[];
  sourceNote?: string | null;
}

export interface QuestionPack {
  schemaVersion: 1;
  batch: {
    id: string;
    category: QuestionCategory;
    description?: string | null;
    sourceDocumentIds: string[];
  };
  sourceDocuments: QuestionSourceDocument[];
  institutions: Array<{ id: string; code: string; name: string }>;
  papers: QuestionPackPaper[];
  examRules: QuestionPackExamRule[];
  questions: QuestionPackItem[];
}
