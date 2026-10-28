import type { QuestionView } from "../types/domain.ts";

/** Canonical Science-group subject order. Strings match IDs stored in questions.subject and bundled packs. */
export const SCIENCE_SUBJECT_ORDER = ["Physics", "Chemistry", "Biology", "Higher Mathematics", "Bangla", "English", "ICT"] as const;

export const SUBJECT_LABEL_KEYS = {
  Physics: "subject.physics",
  Chemistry: "subject.chemistry",
  Biology: "subject.biology",
  "Higher Mathematics": "subject.higherMath",
  Bangla: "subject.bangla",
  English: "subject.english",
  ICT: "subject.ict"
} as const;

export type CanonicalSubject = keyof typeof SUBJECT_LABEL_KEYS;
const RANK = new Map<string, number>(SCIENCE_SUBJECT_ORDER.map((s, i) => [s, i] as const));

export function isCanonicalSubject(subject: string): subject is CanonicalSubject {
  return RANK.has(subject);
}

/** Canonical subjects first in canonical order, then unknown subjects alphabetically. Never mutates input. */
export function compareSubjects(a: string, b: string): number {
  const ra = RANK.get(a);
  const rb = RANK.get(b);
  if (ra !== undefined && rb !== undefined) return ra - rb;
  if (ra !== undefined) return -1;
  if (rb !== undefined) return 1;
  return a.localeCompare(b);
}

export function orderSubjects(subjects: readonly string[]): string[] {
  return Array.from(new Set(subjects)).sort(compareSubjects);
}

export interface SubjectOption {
  subject: string;
  count: number;
}

/** Lists every canonical subject in order (including zero counts), then any other subject actually present. */
export function buildSubjectOptions(counts: ReadonlyMap<string, number> | Record<string, number>): SubjectOption[] {
  const map = counts instanceof Map ? counts : new Map(Object.entries(counts));
  const present = Array.from(map.keys()).filter((s) => !isCanonicalSubject(s) && (map.get(s) ?? 0) > 0);
  return [...SCIENCE_SUBJECT_ORDER, ...orderSubjects(present)].map((subject) => ({ subject, count: map.get(subject) ?? 0 }));
}

export interface ExamListItem {
  question: QuestionView;
  /** 1-based number across the entire exam as displayed to the student. */
  number: number;
}

export interface ExamSection {
  /** Stored subject ID, or null for questions without a subject. */
  subject: string | null;
  key: string;
  data: ExamListItem[];
}

const cmp = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);

/** Choose the appearance from this paper when possible; otherwise use the newest source appearance. */
function sourceKey(q: QuestionView, paperId?: string): [number, string, number] {
  const a = (paperId ? q.appearances.find((x) => x.paperId === paperId) : undefined) ?? q.appearances[0];
  if (!a) return [Number.POSITIVE_INFINITY, "", Number.POSITIVE_INFINITY];
  return [-a.year, a.paperId, a.questionNumber ?? Number.POSITIVE_INFINITY];
}

/**
 * Groups questions by canonical subject order, then preserves each question's source order within a subject.
 * The original exam order breaks ties, so the presentation is deterministic. This never changes stored exam
 * positions or question IDs; answers and scoring remain keyed by question ID.
 */
export function buildExamSections(questions: readonly QuestionView[], paperId?: string): ExamSection[] {
  const bySubject = new Map<string | null, { q: QuestionView; pos: number }[]>();
  questions.forEach((q, pos) => {
    const bucket = bySubject.get(q.subject);
    if (bucket) bucket.push({ q, pos });
    else bySubject.set(q.subject, [{ q, pos }]);
  });

  const subjects = orderSubjects(Array.from(bySubject.keys()).filter((s): s is string => s !== null));
  const keys: (string | null)[] = bySubject.has(null) ? [...subjects, null] : subjects;
  let number = 0;
  return keys.map((subject) => {
    const items = (bySubject.get(subject) ?? []).map((x) => ({ ...x, k: sourceKey(x.q, paperId) }));
    items.sort((a, b) => cmp(a.k[0], b.k[0]) || a.k[1].localeCompare(b.k[1]) || cmp(a.k[2], b.k[2]) || a.pos - b.pos);
    return {
      subject,
      key: subject ?? "__none__",
      data: items.map((x) => ({ question: x.q, number: ++number }))
    };
  });
}
