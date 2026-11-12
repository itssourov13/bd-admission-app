/**
 * Parent-university identity. The content model stores one `institutions` row per source bank, so a single university
 * can appear as several rows (RU / RU-V, JU / JU-U, HSTU / HSTU-U). Suffixes such as -U (unverified bank) and -V
 * (verified bank) are internal content-quality labels, not universities, and must never reach the UI as separate
 * entries. Grouping is derived at read time; no database change is involved. Pure module (no React Native imports).
 */

export interface UniversityMeta {
  key: string;
  shortName: string;
  name: { en: string; bn: string };
}

/** Display order of known universities; unknown parents follow alphabetically. */
export const KNOWN_UNIVERSITIES: readonly UniversityMeta[] = [
  { key: "du", shortName: "DU", name: { en: "University of Dhaka", bn: "ঢাকা বিশ্ববিদ্যালয়" } },
  { key: "ru", shortName: "RU", name: { en: "University of Rajshahi", bn: "রাজশাহী বিশ্ববিদ্যালয়" } },
  { key: "ju", shortName: "JU", name: { en: "Jahangirnagar University", bn: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়" } },
  {
    key: "hstu", shortName: "HSTU",
    name: { en: "Hajee Mohammad Danesh Science and Technology University", bn: "হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়" }
  }
];

const VARIANT_SUFFIX = /^(.+)-(?:U|V)$/i;

/** Parent key for an institution code: "RU-V" -> "ru", "JU-U" -> "ju", "DU" -> "du". */
export function universityKeyOf(code: string): string {
  const trimmed = code.trim();
  const match = VARIANT_SUFFIX.exec(trimmed);
  return (match ? match[1] : trimmed).toLowerCase();
}

export function universityShortName(code: string): string {
  const key = universityKeyOf(code);
  return KNOWN_UNIVERSITIES.find((u) => u.key === key)?.shortName ?? key.toUpperCase();
}

/** Removes internal content-quality decorations from a stored institution name. */
export function cleanInstitutionName(name: string): string {
  return name
    .replace(/^\s*UNVERIFIED\s*[—–-]\s*/i, "")
    .replace(/\s*[—–-]\s*Verified Question Bank\s*$/i, "")
    .replace(/^\s*Rajshahi University\s*$/i, "University of Rajshahi")
    .trim();
}

export function universityDisplayName(code: string, storedName: string, lang: "en" | "bn"): string {
  const key = universityKeyOf(code);
  const known = KNOWN_UNIVERSITIES.find((u) => u.key === key);
  return known ? known.name[lang] : cleanInstitutionName(storedName);
}

export interface InstitutionLike {
  id: string;
  code: string;
  name: string;
  paperCount: number;
  questionCount: number;
  eligibleCount: number;
  reviewCandidateCount: number;
}

export interface UniversityGroup {
  key: string;
  shortName: string;
  /** Stored institution ids belonging to this university (all variants). */
  institutionIds: string[];
  paperCount: number;
  questionCount: number;
  eligibleCount: number;
  reviewCandidateCount: number;
  /** Cleaned fallback name for universities that are not in KNOWN_UNIVERSITIES. */
  fallbackName: string;
}

function orderOf(key: string): number {
  const i = KNOWN_UNIVERSITIES.findIndex((u) => u.key === key);
  return i === -1 ? KNOWN_UNIVERSITIES.length : i;
}

export function groupInstitutions(items: readonly InstitutionLike[]): UniversityGroup[] {
  const groups = new Map<string, UniversityGroup>();
  for (const item of items) {
    const key = universityKeyOf(item.code);
    let g = groups.get(key);
    if (!g) {
      g = {
        key, shortName: universityShortName(item.code), institutionIds: [], paperCount: 0, questionCount: 0,
        eligibleCount: 0, reviewCandidateCount: 0, fallbackName: cleanInstitutionName(item.name)
      };
      groups.set(key, g);
    }
    g.institutionIds.push(item.id);
    g.paperCount += item.paperCount;
    // A question may appear under several variants; summing is an upper bound and is only used as a display total.
    g.questionCount += item.questionCount;
    g.eligibleCount += item.eligibleCount;
    g.reviewCandidateCount += item.reviewCandidateCount;
  }
  return [...groups.values()].sort((a, b) => orderOf(a.key) - orderOf(b.key) || a.key.localeCompare(b.key));
}
