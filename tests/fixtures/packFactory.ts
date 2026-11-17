import type { QuestionPack } from "../../src/types/question-pack.ts";

/**
 * SYNTHETIC fixture builders (Phase D). They mimic the SHAPE of the retired RU / RU-V packs and of active packs without
 * depending on any production question file or external archive. Never mixed into genuine question packs.
 */
export interface FixtureOptions {
  batchId: string;
  institution: { id: string; code: string; name: string };
  paperId: string;
  year?: number;
  unit?: string;
  academicSession?: string;
  count?: number;
  /** verified = verified key + content; otherwise third-party style (unverified key + content). */
  verified: boolean;
  /** Make question #1 a multiple_choice question (correct b and c). */
  multiChoice?: boolean;
  /** Make the last question carry duplicate option text (excluded from provisional pools). */
  duplicateOptionLast?: boolean;
  sourceNotes?: string;
  sourceTitle?: string;
  /** Attach a verified stored rule for the paper. */
  withRule?: boolean;
  replaceExisting?: boolean;
}

export function fixturePack(o: FixtureOptions): QuestionPack {
  const count = o.count ?? 4;
  const srcId = `${o.batchId}-src`;
  const questions = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const multi = Boolean(o.multiChoice) && n === 1;
    const dup = Boolean(o.duplicateOptionLast) && n === count;
    return {
      id: `${o.batchId}-q${n}`,
      text: `Fixture ${o.batchId} question ${n}`,
      type: multi ? ("multiple_choice" as const) : ("single_choice" as const),
      category: "varsity" as const,
      subject: n % 2 ? "Physics" : "Chemistry",
      options: [
        { id: "a", text: `A${n}`, order: 1 },
        { id: "b", text: `B${n}`, order: 2 },
        { id: "c", text: dup ? `B${n}` : `C${n}`, order: 3 },
        { id: "d", text: `D${n}`, order: 4 }
      ],
      correctOptionIds: multi ? ["b", "c"] : ["b"],
      answerVerificationStatus: o.verified ? ("verified" as const) : ("unverified" as const),
      contentVerificationStatus: o.verified ? ("verified" as const) : ("unverified" as const),
      appearances: [{ paperId: o.paperId, questionNumber: n, pageNumber: n, sourceDocumentId: srcId }],
      source: { documentId: srcId, pageNumber: n, questionNumber: n }
    };
  });
  return {
    schemaVersion: 1,
    batch: { id: o.batchId, category: "varsity", description: `fixture ${o.batchId}`, sourceDocumentIds: [srcId] },
    sourceDocuments: [{
      id: srcId,
      filename: o.verified ? "fixture-verified-bank.pdf" : "fixture-listing.json",
      title: o.sourceTitle ?? `Fixture source ${o.batchId}`,
      sha256: o.verified ? "f".repeat(64) : null,
      sourceType: o.verified ? "pdf" : "structured-data",
      notes: o.sourceNotes ?? (o.verified ? "pages 1-4" : "third-party listing")
    }],
    institutions: [o.institution],
    papers: [{
      id: o.paperId, institutionId: o.institution.id, category: "varsity", year: o.year ?? 2025, unit: o.unit ?? "A Unit",
      academicSession: o.academicSession ?? "2024-2025", title: `${o.institution.code} ${o.paperId}`
    }],
    examRules: o.withRule
      ? [{
        id: `${o.paperId}-rule`, paperId: o.paperId, correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0,
        durationSeconds: 1200, totalQuestions: count, totalMarks: count, verificationStatus: "verified"
      }]
      : [],
    ...(o.replaceExisting ? { replaceExistingPaperContent: true } : {}),
    questions
  } as QuestionPack;
}

export const RU_INST = { id: "ru", code: "RU", name: "UNVERIFIED — University of Rajshahi" };
export const RUV_INST = { id: "ru-verified-bank", code: "RU-V", name: "Rajshahi University — Verified Question Bank" };
export const JU_INST = { id: "ju", code: "JU", name: "Jahangirnagar University" };
export const DU_INST = { id: "du", code: "DU", name: "University of Dhaka" };

export const RU_PAPER = "ru-c-2020-2021-fixture";
export const RUV_PAPER = "ru-vq-2024-2025-fixture";
export const JU_PAPER = "ju-a-2024-2025-fixture";
export const DU_PAPER = "du-a-2025-2026-fixture";

/** RU-like (retired shape) packs. */
export const ruPack = (): QuestionPack => fixturePack({
  batchId: RU_PAPER, institution: RU_INST, paperId: RU_PAPER, unit: "C Unit — Science", academicSession: "2020-2021",
  year: 2020, verified: false, duplicateOptionLast: true, sourceTitle: "RU A Unit printed header (fixture)",
  sourceNotes: "third-party listing; original PDF header prints Unit A though the paper is the C Unit"
});
export const ruvPack = (): QuestionPack => fixturePack({
  batchId: RUV_PAPER, institution: RUV_INST, paperId: RUV_PAPER, unit: "C Unit", year: 2024, verified: true, multiChoice: true, withRule: true
});
/** Active non-RU packs. */
export const juPack = (): QuestionPack => fixturePack({
  batchId: JU_PAPER, institution: JU_INST, paperId: JU_PAPER, unit: "A Unit", year: 2024, verified: true, multiChoice: true, withRule: true
});
export const duPack = (): QuestionPack => fixturePack({
  batchId: DU_PAPER, institution: DU_INST, paperId: DU_PAPER, year: 2025, verified: true, withRule: true
});
