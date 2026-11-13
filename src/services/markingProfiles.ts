import { hasCompleteScoringRule, type RuleStatus, type ScoringRule } from "./scoring.ts";

/**
 * Configurable marking profiles (roadmap Phase 4). Pure: no React, SQLite or i18n imports.
 *
 * A profile is a named bundle of scoring and format values. EVERY value carries its own provenance so the app never
 * presents an inferred or unverified rule as official:
 *   official     – stated in the university's own circular/announcement
 *   secondary    – reported by third-party sources; the official document was not checked
 *   derived      – computed from other values (e.g. total marks ÷ question count); not stated anywhere
 *   illustrative – an assumption/default chosen by this app
 *   user         – typed in by the user
 * A profile's scoring status is the weakest link: only a profile whose three scoring values are ALL official is
 * "verified"; any other complete profile is "illustrative"; a profile missing a scoring value is not scorable.
 */

export type Provenance = "official" | "secondary" | "derived" | "illustrative" | "user";

export const PROFILE_FIELDS = [
  "correctMarks", "incorrectPenalty", "unansweredMarks", "totalMarks", "passMarks", "durationSeconds", "questionCount"
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];
const SCORING_FIELDS: readonly ProfileField[] = ["correctMarks", "incorrectPenalty", "unansweredMarks"];

export interface ProfileValue { value: number; provenance: Provenance; note?: string }

export interface ProfileSource { label: string; url?: string; checkedOn: string }

export interface MarkingProfile {
  id: string;
  kind: "builtin" | "user";
  name: { en: string; bn: string };
  /** Parent university key (see universityKeyOf). Omitted = not tied to a university. */
  universityKey?: string;
  /** Academic sessions the profile applies to, e.g. "2024-2025". Omitted = any. */
  academicSessions?: string[];
  /** Admission units the profile applies to (case-insensitive). Omitted = any. */
  units?: string[];
  values: Partial<Record<ProfileField, ProfileValue>>;
  source?: ProfileSource;
  /** Built-in profile this user profile was copied from. */
  basedOn?: string;
  notes?: { en: string; bn: string };
}

export const GENERIC_PROFILE_ID = "generic-100-60";
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function isValidProfileId(id: unknown): id is string {
  return typeof id === "string" && ID_PATTERN.test(id);
}

const RESEARCH = "2026-11-05";
const RESEARCHED_AT = "2026-11-13";

/** Built-in catalogue. Values come from docs/EXAM_RULE_RESEARCH.md (official) or the 2026-11-13 DU search (secondary). */
export const BUILTIN_PROFILES: readonly MarkingProfile[] = [
  {
    id: GENERIC_PROFILE_ID, kind: "builtin",
    name: { en: "Generic practice (100 questions)", bn: "সাধারণ অনুশীলন (১০০টি প্রশ্ন)" },
    values: {
      correctMarks: { value: 1, provenance: "illustrative" }, incorrectPenalty: { value: 0.25, provenance: "illustrative" },
      unansweredMarks: { value: 0, provenance: "illustrative" }, totalMarks: { value: 100, provenance: "illustrative" },
      durationSeconds: { value: 3600, provenance: "illustrative" }, questionCount: { value: 100, provenance: "illustrative" }
    },
    notes: {
      en: "Practice default chosen by this app. It is not the official rule of any university.",
      bn: "এই অ্যাপের নির্ধারিত অনুশীলন-ডিফল্ট। এটি কোনো বিশ্ববিদ্যালয়ের অফিসিয়াল নিয়ম নয়।"
    }
  },
  {
    id: "ru-2024-2025-mcq", kind: "builtin",
    name: { en: "Rajshahi University 2024–25 (MCQ unit test)", bn: "রাজশাহী বিশ্ববিদ্যালয় ২০২৪–২৫ (এমসিকিউ ইউনিট পরীক্ষা)" },
    universityKey: "ru", academicSessions: ["2024-2025"],
    values: {
      totalMarks: { value: 100, provenance: "official" }, questionCount: { value: 80, provenance: "official" },
      durationSeconds: { value: 3600, provenance: "official" }, incorrectPenalty: { value: 0.25, provenance: "official", note: "1 mark for every 4 wrong answers" },
      passMarks: { value: 40, provenance: "official" },
      correctMarks: { value: 1.25, provenance: "derived", note: "100 marks ÷ 80 questions; the circular does not state it" },
      unansweredMarks: { value: 0, provenance: "illustrative", note: "not stated in the circular" }
    },
    source: { label: "RU 2024–2025 admission announcement (Public Relations Office)", url: "https://www.ru.ac.bd/blog/রাবিতে-ভর্তির-আবেদন-শুরু/", checkedOn: RESEARCH },
    notes: {
      en: "Format values are official; the per-correct-answer mark is derived and the unanswered value is an assumption, so scores are shown as illustrative.",
      bn: "ফরম্যাটের মান অফিসিয়াল; প্রতিটি সঠিক উত্তরের নম্বর হিসাব করে নেওয়া এবং উত্তরহীনের মান অনুমান, তাই স্কোর ‘উদাহরণমূলক’ হিসেবে দেখানো হয়।"
    }
  },
  {
    id: "ju-2024-2025-mcq", kind: "builtin",
    name: { en: "Jahangirnagar University 2024–25 (MCQ test)", bn: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ২০২৪–২৫ (এমসিকিউ পরীক্ষা)" },
    universityKey: "ju", academicSessions: ["2024-2025"],
    values: {
      totalMarks: { value: 80, provenance: "official" }, durationSeconds: { value: 3300, provenance: "official", note: "55 minutes; 5 extra minutes for OMR filling are not counted" },
      incorrectPenalty: { value: 0.2, provenance: "official" },
      passMarks: { value: 26.4, provenance: "derived", note: "33% of 80 marks" },
      questionCount: { value: 80, provenance: "derived", note: "80-mark test; source compilations show 80 questions" },
      correctMarks: { value: 1, provenance: "derived", note: "80 marks ÷ 80 questions; not stated separately" },
      unansweredMarks: { value: 0, provenance: "illustrative", note: "not stated in the circular" }
    },
    source: { label: "JU revised 2024–2025 admission notice listing (values cross-checked against a Prothom Alo report of the circular)", url: "https://www.juniv.edu/public/discussion/16245", checkedOn: RESEARCH },
    notes: {
      en: "Total marks, duration and negative marking are official; the rest is derived or assumed, so scores are shown as illustrative.",
      bn: "মোট নম্বর, সময় ও নেগেটিভ মার্কিং অফিসিয়াল; বাকি মান হিসাব করা বা অনুমান, তাই স্কোর ‘উদাহরণমূলক’ হিসেবে দেখানো হয়।"
    }
  },
  {
    id: "hstu-2024-2025-partial", kind: "builtin",
    name: { en: "HSTU 2024–25 (partial official details)", bn: "হাবিপ্রবি ২০২৪–২৫ (আংশিক অফিসিয়াল তথ্য)" },
    universityKey: "hstu", academicSessions: ["2024-2025"],
    values: { totalMarks: { value: 100, provenance: "official" } },
    source: { label: "HSTU 2024–2025 admission circular", url: "https://hstu.ac.bd/uploads/admission_2025/details_admission-circular_2025.pdf", checkedOn: RESEARCH },
    notes: {
      en: "Only the 100-mark total is confirmed. Question count, duration and marking are not in the sources reviewed, so this profile cannot score. Copy it to your own profile to add values.",
      bn: "শুধু মোট ১০০ নম্বর নিশ্চিত। প্রশ্নসংখ্যা, সময় ও মার্কিং পর্যালোচিত সূত্রে নেই, তাই এই প্রোফাইল দিয়ে স্কোর হয় না। মান যোগ করতে নিজের প্রোফাইলে কপি করুন।"
    }
  },
  {
    id: "du-mcq-2025-2026", kind: "builtin",
    name: { en: "Dhaka University MCQ section 2025–26 / 2026–27", bn: "ঢাকা বিশ্ববিদ্যালয় এমসিকিউ অংশ ২০২৫–২৬ / ২০২৬–২৭" },
    universityKey: "du", academicSessions: ["2025-2026", "2026-2027"],
    values: {
      totalMarks: { value: 60, provenance: "secondary", note: "MCQ section of a 100-mark test" }, durationSeconds: { value: 2700, provenance: "secondary" },
      correctMarks: { value: 1, provenance: "secondary" }, incorrectPenalty: { value: 0.25, provenance: "secondary" },
      passMarks: { value: 24, provenance: "secondary", note: "minimum in the MCQ section" },
      questionCount: { value: 60, provenance: "derived", note: "60 marks at 1 mark per question" },
      unansweredMarks: { value: 0, provenance: "illustrative", note: "not stated in the sources" }
    },
    source: { label: "Third-party admission summaries (official DU circular not checked)", url: "https://duadmission.com/", checkedOn: RESEARCHED_AT },
    notes: {
      en: "Reported by several third-party sites; the official DU circular was not retrieved. Fine Arts and IBA use different formats. Verify before relying on it.",
      bn: "একাধিক তৃতীয়-পক্ষ সাইটের তথ্য; ঢাবির অফিসিয়াল বিজ্ঞপ্তি যাচাই করা হয়নি। চারুকলা ও আইবিএ-র ফরম্যাট আলাদা। নির্ভর করার আগে যাচাই করুন।"
    }
  }
];

export function builtinProfile(id: string): MarkingProfile | undefined {
  return BUILTIN_PROFILES.find((p) => p.id === id);
}

export function profileValue(p: MarkingProfile, field: ProfileField): number | null {
  const v = p.values[field]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** True when correct, incorrect and unanswered marks are all present, so a numeric score can be produced. */
export function isScorable(p: MarkingProfile): boolean {
  return SCORING_FIELDS.every((f) => profileValue(p, f) !== null);
}

/** Weakest-link scoring status: verified only when every scoring value is official. */
export function profileStatus(p: MarkingProfile): RuleStatus {
  if (!isScorable(p)) return "unconfigured";
  return SCORING_FIELDS.every((f) => p.values[f]?.provenance === "official") ? "verified" : "illustrative";
}

/** The least authoritative provenance among the given fields (default: scoring fields). */
export function weakestProvenance(p: MarkingProfile, fields: readonly ProfileField[] = SCORING_FIELDS): Provenance | null {
  const order: Provenance[] = ["illustrative", "user", "derived", "secondary", "official"];
  let weakest = -1;
  for (const f of fields) {
    const prov = p.values[f]?.provenance;
    if (!prov) return null;
    const rank = order.indexOf(prov);
    if (weakest === -1 || rank < weakest) weakest = rank;
  }
  return weakest === -1 ? null : order[weakest];
}

/** Returns error codes (empty = valid). Used for user-entered profiles. */
export function validateProfile(p: MarkingProfile): string[] {
  const errors: string[] = [];
  if (!isValidProfileId(p.id)) errors.push("id");
  if (!p.name?.en?.trim() && !p.name?.bn?.trim()) errors.push("name");
  for (const f of PROFILE_FIELDS) {
    const v = p.values[f]?.value;
    if (v === undefined) continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) { errors.push(f); continue; }
    if ((f === "durationSeconds" || f === "questionCount") && (!Number.isInteger(v) || v <= 0)) errors.push(f);
  }
  const total = profileValue(p, "totalMarks");
  const pass = profileValue(p, "passMarks");
  if (total !== null && pass !== null && pass > total) errors.push("passMarks");
  const duration = profileValue(p, "durationSeconds");
  if (duration !== null && duration > 4 * 60 * 60) errors.push("durationSeconds");
  const count = profileValue(p, "questionCount");
  if (count !== null && count > 500) errors.push("questionCount");
  return Array.from(new Set(errors));
}

/** A user-owned copy: same numbers, every provenance becomes "user" so a copy can never claim official status. */
export function cloneAsUserProfile(source: MarkingProfile, id: string, name: { en: string; bn: string }): MarkingProfile {
  const values: MarkingProfile["values"] = {};
  for (const f of PROFILE_FIELDS) {
    const v = source.values[f];
    if (v) values[f] = { value: v.value, provenance: "user" };
  }
  return { id, kind: "user", name, universityKey: source.universityKey, academicSessions: source.academicSessions, units: source.units, values, basedOn: source.kind === "builtin" ? source.id : source.basedOn };
}

/** Parses stored JSON defensively; anything malformed or invalid is dropped. */
export function parseStoredProfile(json: string): MarkingProfile | null {
  try {
    const raw = JSON.parse(json) as MarkingProfile;
    if (!raw || typeof raw !== "object" || raw.kind !== "user") return null;
    const values: MarkingProfile["values"] = {};
    for (const f of PROFILE_FIELDS) {
      const v = raw.values?.[f];
      if (v && typeof v.value === "number") values[f] = { value: v.value, provenance: "user" };
    }
    const profile: MarkingProfile = { ...raw, kind: "user", values };
    return validateProfile(profile).length === 0 ? profile : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------------------------------------------

export type ProfileOrigin = "user_selected" | "preference" | "auto_default";
export interface ProfileChoice { profile: MarkingProfile; origin: ProfileOrigin }

export interface MarkingContext {
  universityKey?: string;
  year?: number | null;
  academicSession?: string | null;
  unit?: string | null;
}

/** Scope key for a stored preference: "*" for all practice, "u:<universityKey>" for one university. */
export function preferenceKeys(ctx: MarkingContext): string[] {
  return [...(ctx.universityKey ? [`u:${ctx.universityKey}`] : []), "*"];
}

function sessionYears(session: string): number[] {
  return (session.match(/\d{4}/g) ?? []).map(Number);
}

/** Specificity score of a catalogue profile for a context; null = not applicable. */
export function matchScore(p: MarkingProfile, ctx: MarkingContext): number | null {
  let score = 0;
  if (p.universityKey) {
    if (!ctx.universityKey || ctx.universityKey !== p.universityKey) return null;
    score += 4;
  }
  if (p.academicSessions?.length) {
    const sessionMatch = ctx.academicSession ? p.academicSessions.includes(ctx.academicSession) : false;
    const yearMatch = ctx.year != null && p.academicSessions.some((s) => sessionYears(s).includes(ctx.year!));
    if (!sessionMatch && !yearMatch) return null;
    score += 2;
  }
  if (p.units?.length) {
    if (!ctx.unit || !p.units.some((u) => u.toLowerCase() === ctx.unit!.toLowerCase())) return null;
    score += 1;
  }
  return score;
}

/**
 * Chooses the profile for a practice scope. Order: explicit choice > stored preference (university, then global) >
 * best-matching scorable catalogue/user profile (university/session/unit specificity) > generic illustrative profile.
 * Unscorable profiles are never auto-selected. Unknown or invalid ids are ignored, never trusted.
 */
export function selectProfile(
  all: readonly MarkingProfile[], preferences: Readonly<Record<string, string>>, ctx: MarkingContext, explicitId?: string | null
): ProfileChoice | null {
  const byId = new Map(all.map((p) => [p.id, p] as const));
  const usable = (id: string | null | undefined): MarkingProfile | null => {
    const p = id ? byId.get(id) : undefined;
    return p && isScorable(p) ? p : null;
  };
  const explicit = usable(explicitId);
  if (explicit) return { profile: explicit, origin: "user_selected" };
  for (const key of preferenceKeys(ctx)) {
    const preferred = usable(preferences[key]);
    if (preferred) return { profile: preferred, origin: "preference" };
  }
  let best: { p: MarkingProfile; score: number } | null = null;
  for (const p of all) {
    if (p.kind !== "builtin" || !isScorable(p)) continue;
    const s = matchScore(p, ctx);
    if (s !== null && (best === null || s > best.score)) best = { p, score: s };
  }
  const fallback = best?.p ?? usable(GENERIC_PROFILE_ID);
  return fallback ? { profile: fallback, origin: "auto_default" } : null;
}

// ---------------------------------------------------------------------------------------------------------------
// Snapshot + effective rule
// ---------------------------------------------------------------------------------------------------------------

/** Immutable record stored with a session so history never changes when profiles are edited or removed. */
export interface ProfileSnapshot {
  v: 1;
  id: string;
  kind: "builtin" | "user";
  name: { en: string; bn: string };
  origin: ProfileOrigin;
  status: RuleStatus;
  passMarks: number | null;
  questionCount: number | null;
  provenance: Partial<Record<ProfileField, Provenance>>;
  source?: ProfileSource;
}

export function snapshotOf(choice: ProfileChoice): ProfileSnapshot {
  const provenance: ProfileSnapshot["provenance"] = {};
  for (const f of PROFILE_FIELDS) {
    const v = choice.profile.values[f];
    if (v) provenance[f] = v.provenance;
  }
  return {
    v: 1, id: choice.profile.id, kind: choice.profile.kind, name: choice.profile.name, origin: choice.origin,
    status: profileStatus(choice.profile), passMarks: profileValue(choice.profile, "passMarks"),
    questionCount: profileValue(choice.profile, "questionCount"), provenance, source: choice.profile.source
  };
}

export function parseSnapshot(json: string | null | undefined): ProfileSnapshot | null {
  if (!json) return null;
  try {
    const s = JSON.parse(json) as ProfileSnapshot;
    return s && s.v === 1 && typeof s.id === "string" && s.name ? s : null;
  } catch {
    return null;
  }
}

/**
 * An AUTOMATIC default must not put a score on a session whose own rule says "no numeric score" (docs/EXAM_RULE_RESEARCH.md):
 *  - Custom Practice is an unscored, user-configured session, so no automatic profile applies to it;
 *  - the generic fallback never scores a paper whose official rule is only partly known (e.g. HSTU: total marks only).
 * An explicit choice or a saved preference is the user's own decision and is never blocked here.
 */
export function isAutoScoringBlocked(base: ScoringRule, choice: ProfileChoice | null, customPractice = false): boolean {
  if (!choice || choice.origin !== "auto_default") return false;
  if (customPractice) return true;
  const partial = base.status === "unconfigured" &&
    [base.totalMarks, base.totalQuestions, base.durationSeconds].some((v) => typeof v === "number" && Number.isFinite(v));
  return !choice.profile.universityKey && partial;
}

/**
 * The scoring rule a session will use. The same function serves Flash, Standard and Custom exams so scoring is
 * consistent. An automatically chosen profile only fills gaps: a complete stored (e.g. official paper) rule always wins.
 * An explicit user choice or saved preference overrides the scoring values. Question count/duration of the exam are
 * never changed here (a paper keeps its own pattern).
 */
export function effectiveRule(
  base: ScoringRule, choice: ProfileChoice | null, opts: { customPractice?: boolean } = {}
): { rule: ScoringRule; snapshot: ProfileSnapshot | null } {
  if (!choice || !isScorable(choice.profile)) return { rule: base, snapshot: null };
  if (choice.origin === "auto_default" && hasCompleteScoringRule(base)) return { rule: base, snapshot: null };
  if (isAutoScoringBlocked(base, choice, opts.customPractice === true)) return { rule: base, snapshot: null };
  const p = choice.profile;
  return {
    rule: {
      ...base,
      correctMarks: profileValue(p, "correctMarks"), incorrectPenalty: profileValue(p, "incorrectPenalty"),
      unansweredMarks: profileValue(p, "unansweredMarks"), totalMarks: profileValue(p, "totalMarks") ?? base.totalMarks ?? null,
      status: profileStatus(p)
    },
    snapshot: snapshotOf(choice)
  };
}

export type PassState = "passed" | "below" | "not_comparable" | "none";

/**
 * Compares a score with the profile's pass mark. The pass mark applies to the full paper, so when the profile has a
 * question count it is only compared for an attempt of exactly that length; otherwise the result is "not_comparable".
 */
export function passAssessment(snapshot: ProfileSnapshot | null, score: number | null, totalQuestions: number): { state: PassState; passMarks: number | null } {
  if (!snapshot || snapshot.passMarks === null) return { state: "none", passMarks: null };
  if (score === null) return { state: "not_comparable", passMarks: snapshot.passMarks };
  // A profile without a question count (e.g. a user profile) compares the score directly.
  if (snapshot.questionCount !== null && snapshot.questionCount !== totalQuestions) {
    return { state: "not_comparable", passMarks: snapshot.passMarks };
  }
  return { state: score >= snapshot.passMarks ? "passed" : "below", passMarks: snapshot.passMarks };
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * Parses a number typed in an editor (accepts Bangla digits and a decimal comma).
 * Returns null for empty input, "invalid" for anything that is not a finite non-negative number.
 */
export function parseNumberInput(text: string): number | null | "invalid" {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const ascii = trimmed.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(",", ".");
  if (!/^\d+(\.\d{1,4})?$/.test(ascii)) return "invalid";
  const n = Number(ascii);
  return Number.isFinite(n) ? n : "invalid";
}

/** Order the fields are shown in. */
export const PROFILE_DISPLAY_FIELDS: readonly ProfileField[] = [
  "correctMarks", "incorrectPenalty", "unansweredMarks", "totalMarks", "passMarks", "questionCount", "durationSeconds"
];
