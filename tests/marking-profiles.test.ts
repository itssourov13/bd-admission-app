import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import {
  BUILTIN_PROFILES, cloneAsUserProfile, effectiveRule, GENERIC_PROFILE_ID, isScorable, isValidProfileId, matchScore, parseSnapshot,
  passAssessment, PROFILE_FIELDS, profileStatus, selectProfile, snapshotOf, validateProfile, weakestProvenance, type MarkingProfile
} from "../src/services/markingProfiles.ts";
import { UNCONFIGURED_RULE, type ScoringRule } from "../src/services/scoring.ts";
import { deleteUserProfile, getPreferences, listAllProfiles, listUserProfiles, markingContextForFilter, resolveMarkingChoice, saveUserProfile, setPreference } from "../src/repositories/marking.ts";
import { finalizeStandardExam, loadExam, startStandardExam } from "../src/services/practiceService.ts";
import { FlashController } from "../src/services/flashController.ts";
import { getSession } from "../src/repositories/sessions.ts";
import { translations } from "../src/i18n/translations.ts";

const generic = BUILTIN_PROFILES.find((p) => p.id === GENERIC_PROFILE_ID)!;
const ru = BUILTIN_PROFILES.find((p) => p.id === "ru-2024-2025-mcq")!;
const ju = BUILTIN_PROFILES.find((p) => p.id === "ju-2024-2025-mcq")!;
const hstu = BUILTIN_PROFILES.find((p) => p.id === "hstu-2024-2025-partial")!;
const du = BUILTIN_PROFILES.find((p) => p.id === "du-mcq-2025-2026")!;

function userProfile(id: string, values: Partial<Record<(typeof PROFILE_FIELDS)[number], number>>): MarkingProfile {
  const v: MarkingProfile["values"] = {};
  for (const [k, n] of Object.entries(values)) v[k as (typeof PROFILE_FIELDS)[number]] = { value: n, provenance: "user" };
  return { id, kind: "user", name: { en: id, bn: id }, values: v };
}

test("catalogue: ids unique and valid, every built-in passes validation, nothing but ids/values claim more than the research supports", () => {
  const ids = BUILTIN_PROFILES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of BUILTIN_PROFILES) {
    assert.equal(isValidProfileId(p.id), true, p.id);
    assert.deepEqual(validateProfile(p), [], p.id);
    assert.ok(p.name.en && p.name.bn && p.notes === undefined || (p.notes!.en && p.notes!.bn), p.id);
  }
  // Generic profile is entirely illustrative and never official.
  assert.ok(PROFILE_FIELDS.every((f) => generic.values[f] === undefined || generic.values[f]!.provenance === "illustrative"));
  assert.equal(generic.values.passMarks, undefined, "no pass mark is invented for the generic profile");
  // DU values were not confirmed from the official circular: no field may be labelled official.
  assert.ok(PROFILE_FIELDS.every((f) => du.values[f]?.provenance !== "official"));
  assert.ok(du.source?.label.includes("official DU circular not checked"));
  // RU/JU: format values official, but per-answer marks are derived/assumed so the score is NOT official.
  assert.equal(ru.values.incorrectPenalty?.provenance, "official");
  assert.equal(ru.values.correctMarks?.provenance, "derived");
  assert.equal(profileStatus(ru), "illustrative");
  assert.equal(profileStatus(ju), "illustrative");
  assert.equal(ju.values.passMarks?.value, 26.4);
  assert.equal(ju.values.passMarks?.provenance, "derived");
  // HSTU only has the total: it cannot score and is never auto-selected.
  assert.equal(isScorable(hstu), false);
  assert.equal(profileStatus(hstu), "unconfigured");
  assert.ok(BUILTIN_PROFILES.every((p) => profileStatus(p) !== "verified"), "no built-in profile may be shown as fully verified yet");
});

test("status is the weakest link: verified only when all three scoring values are official", () => {
  const allOfficial: MarkingProfile = { ...ru, values: { ...ru.values, correctMarks: { value: 1.25, provenance: "official" }, unansweredMarks: { value: 0, provenance: "official" } } };
  assert.equal(profileStatus(allOfficial), "verified");
  assert.equal(weakestProvenance(allOfficial), "official");
  assert.equal(weakestProvenance(ru), "illustrative");
  assert.equal(profileStatus({ ...allOfficial, values: { ...allOfficial.values, correctMarks: { value: 1.25, provenance: "secondary" } } }), "illustrative");
  const { unansweredMarks: _drop, ...rest } = allOfficial.values;
  assert.equal(profileStatus({ ...allOfficial, values: rest }), "unconfigured");
});

test("validation rejects bad numbers and ids; copies can never claim official status", () => {
  assert.deepEqual(validateProfile(userProfile("ok-1", { correctMarks: 1, incorrectPenalty: 0.25, unansweredMarks: 0, totalMarks: 100, passMarks: 40, durationSeconds: 3600, questionCount: 100 })), []);
  assert.ok(validateProfile(userProfile("bad id", { correctMarks: 1 })).includes("id"));
  assert.ok(validateProfile(userProfile("p", { correctMarks: -1 })).includes("correctMarks"));
  assert.ok(validateProfile(userProfile("p", { incorrectPenalty: Number.NaN })).includes("incorrectPenalty"));
  assert.ok(validateProfile(userProfile("p", { totalMarks: 50, passMarks: 60 })).includes("passMarks"));
  assert.ok(validateProfile(userProfile("p", { questionCount: 1.5 })).includes("questionCount"));
  assert.ok(validateProfile(userProfile("p", { durationSeconds: 99999 })).includes("durationSeconds"));
  const copy = cloneAsUserProfile(ru, "my-ru", { en: "My RU", bn: "আমার রাবি" });
  assert.equal(copy.kind, "user");
  assert.equal(copy.basedOn, ru.id);
  assert.ok(PROFILE_FIELDS.every((f) => copy.values[f] === undefined || copy.values[f]!.provenance === "user"));
  assert.equal(profileStatus(copy), "illustrative");
  assert.equal(copy.values.incorrectPenalty?.value, 0.25);
});

test("matching: university + session specificity; unrelated sessions and universities do not match", () => {
  assert.equal(matchScore(generic, {}), 0);
  assert.equal(matchScore(ru, { universityKey: "ru", academicSession: "2024-2025" }), 6);
  assert.equal(matchScore(ru, { universityKey: "ru", year: 2025 }), 6, "year inside the session also matches");
  assert.equal(matchScore(ru, { universityKey: "ru", year: 2023 }), null);
  assert.equal(matchScore(ru, { universityKey: "ju", year: 2024 }), null);
  assert.equal(matchScore(ru, {}), null);
});

test("selection order: explicit > preference (university, then global) > best match > generic; junk ignored", () => {
  const mine = userProfile("mine", { correctMarks: 2, incorrectPenalty: 0.5, unansweredMarks: 0 });
  const all = [...BUILTIN_PROFILES, mine];
  const ctx = { universityKey: "ru", academicSession: "2024-2025" };
  assert.deepEqual([selectProfile(all, {}, ctx)!.profile.id, selectProfile(all, {}, ctx)!.origin], ["ru-2024-2025-mcq", "auto_default"]);
  assert.deepEqual([selectProfile(all, {}, {})!.profile.id, selectProfile(all, {}, { universityKey: "ju", year: 2030 })!.profile.id], [GENERIC_PROFILE_ID, GENERIC_PROFILE_ID]);
  const global = selectProfile(all, { "*": "mine" }, ctx)!;
  assert.deepEqual([global.profile.id, global.origin], ["mine", "preference"]);
  assert.equal(selectProfile(all, { "*": "mine", "u:ru": "ju-2024-2025-mcq" }, ctx)!.profile.id, "ju-2024-2025-mcq");
  assert.equal(selectProfile(all, { "*": "mine" }, ctx, "du-mcq-2025-2026")!.origin, "user_selected");
  // Unknown, unscorable or malformed ids never apply.
  assert.equal(selectProfile(all, { "*": "ghost" }, ctx)!.profile.id, "ru-2024-2025-mcq");
  assert.equal(selectProfile(all, {}, { universityKey: "hstu", year: 2025 })!.profile.id, GENERIC_PROFILE_ID, "partial HSTU profile cannot score");
  assert.equal(selectProfile(all, {}, ctx, hstu.id)!.origin, "auto_default");
  assert.equal(selectProfile(all, {}, ctx, "../../etc")!.origin, "auto_default");
  // A user profile is never chosen automatically.
  assert.equal(selectProfile([mine], {}, {}), null);
});

test("effective rule: automatic default only fills gaps; explicit/preference overrides; snapshot is recorded", () => {
  const stored: ScoringRule = { correctMarks: 1, incorrectPenalty: 0.5, unansweredMarks: 0, status: "verified", totalMarks: 80, totalQuestions: 80, durationSeconds: 3000 };
  const auto = { profile: ru, origin: "auto_default" as const };
  assert.deepEqual(effectiveRule(stored, auto), { rule: stored, snapshot: null }, "a complete stored rule always wins over an automatic default");
  const filled = effectiveRule({ ...UNCONFIGURED_RULE }, auto);
  assert.equal(filled.rule.correctMarks, 1.25);
  assert.equal(filled.rule.incorrectPenalty, 0.25);
  assert.equal(filled.rule.status, "illustrative", "derived/assumed values never produce an official status");
  assert.equal(filled.snapshot?.id, ru.id);
  assert.equal(filled.snapshot?.passMarks, 40);
  const forced = effectiveRule(stored, { profile: ju, origin: "user_selected" });
  assert.equal(forced.rule.incorrectPenalty, 0.2);
  assert.equal(forced.rule.status, "illustrative");
  assert.equal(forced.rule.totalQuestions, 80, "the exam's own question count/duration are not changed by a profile");
  assert.equal(forced.rule.durationSeconds, 3000);
  assert.equal(effectiveRule(stored, { profile: ru, origin: "preference" }).snapshot?.origin, "preference");
  assert.deepEqual(effectiveRule(stored, { profile: hstu, origin: "user_selected" }), { rule: stored, snapshot: null });
  assert.deepEqual(effectiveRule(stored, null), { rule: stored, snapshot: null });
  const snap = snapshotOf(auto);
  assert.deepEqual(parseSnapshot(JSON.stringify(snap)), snap);
  assert.equal(parseSnapshot("{bad"), null);
  assert.equal(parseSnapshot(null), null);
});

test("pass assessment compares only a full-length attempt", () => {
  const snap = snapshotOf({ profile: ru, origin: "auto_default" });
  assert.deepEqual(passAssessment(snap, 45, 80), { state: "passed", passMarks: 40 });
  assert.deepEqual(passAssessment(snap, 39.75, 80), { state: "below", passMarks: 40 });
  assert.deepEqual(passAssessment(snap, 45, 30), { state: "not_comparable", passMarks: 40 });
  assert.deepEqual(passAssessment(snap, null, 80), { state: "not_comparable", passMarks: 40 });
  assert.deepEqual(passAssessment(snapshotOf({ profile: generic, origin: "auto_default" }), 50, 100), { state: "none", passMarks: null });
  assert.deepEqual(passAssessment(null, 50, 100), { state: "none", passMarks: null });
});

test("repository: user profiles and preferences persist, validate and clean up", async () => {
  const db = await freshDb();
  const mine = userProfile("mine", { correctMarks: 1, incorrectPenalty: 0.5, unansweredMarks: 0, totalMarks: 100 });
  assert.deepEqual(await saveUserProfile(db, mine), { ok: true });
  assert.deepEqual((await saveUserProfile(db, { ...mine, id: GENERIC_PROFILE_ID })), { ok: false, errors: ["id"] });
  assert.equal((await saveUserProfile(db, userProfile("neg", { correctMarks: -2 }))).ok, false);
  assert.deepEqual(await saveUserProfile(db, { ...mine, name: { en: "Renamed", bn: "নতুন" } }), { ok: true });
  assert.equal((await listUserProfiles(db)).length, 1);
  assert.equal((await listUserProfiles(db))[0].name.en, "Renamed");
  assert.equal((await listAllProfiles(db)).length, BUILTIN_PROFILES.length + 1);
  assert.equal(await setPreference(db, "*", "mine"), true);
  assert.equal(await setPreference(db, "u:du", "du-mcq-2025-2026"), true);
  assert.equal(await setPreference(db, "bad key", "mine"), false);
  assert.equal(await setPreference(db, "*", "../x"), false);
  assert.deepEqual(await getPreferences(db), { "*": "mine", "u:du": "du-mcq-2025-2026" });
  await deleteUserProfile(db, "mine");
  assert.equal((await listUserProfiles(db)).length, 0);
  assert.deepEqual(await getPreferences(db), { "u:du": "du-mcq-2025-2026" }, "preferences pointing at a deleted profile are removed");
  assert.equal(await setPreference(db, "u:du", null), true);
  assert.deepEqual(await getPreferences(db), {});
  // Corrupt stored rows are ignored, not trusted.
  await db.runAsync("INSERT INTO user_marking_profiles (id, profile_json, created_at, updated_at) VALUES ('junk', '{\"kind\":\"user\",\"id\":\"x y\"}', 1, 1)");
  assert.equal((await listUserProfiles(db)).length, 0);
});

async function packDb(total = 60) {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack({}, total))).ok, true);
  return db;
}

test("scope context and choice come from the paper (university/session/unit)", async () => {
  const db = await packDb();
  const ctx = await markingContextForFilter(db, { paperId: "paper-syn-2025" });
  assert.deepEqual(ctx, { universityKey: "syn", year: 2025, academicSession: null, unit: "A" });
  assert.deepEqual(await markingContextForFilter(db, { institutionIds: ["inst-syn"] }), { universityKey: "syn" });
  assert.deepEqual(await markingContextForFilter(db, {}), {});
  assert.equal((await resolveMarkingChoice(db, { paperId: "paper-syn-2025" }))!.profile.id, GENERIC_PROFILE_ID);
  assert.equal((await resolveMarkingChoice(db, {}, "ju-2024-2025-mcq"))!.origin, "user_selected");
  await setPreference(db, "u:syn", "du-mcq-2025-2026");
  assert.equal((await resolveMarkingChoice(db, { paperId: "paper-syn-2025" }))!.origin, "preference");
});

test("Custom Practice and Flash score through the same profile and store an immutable snapshot", async () => {
  const db = await packDb(60);
  const mine = userProfile("snap-me", { correctMarks: 2, incorrectPenalty: 0.5, unansweredMarks: 0, totalMarks: 20, passMarks: 10, questionCount: 10 });
  await saveUserProfile(db, mine);
  const choice = await resolveMarkingChoice(db, { paperId: "paper-syn-2025" }, "snap-me");
  assert.equal(choice!.origin, "user_selected");
  const started = await startStandardExam(db, { paperId: "paper-syn-2025" }, Date.now(), undefined, { custom: { questions: 10, seconds: 600 }, markingChoice: choice });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const session = (await getSession(db, started.sessionId))!;
  assert.deepEqual([session.ruleCorrect, session.rulePenalty, session.ruleUnanswered, session.ruleTotalMarks, session.ruleStatus], [2, 0.5, 0, 20, "illustrative"]);
  assert.equal(session.ruleProfile?.id, "snap-me");
  assert.equal(session.ruleProfile?.passMarks, 10);
  assert.equal(session.ruleProfile?.origin, "user_selected");
  // Editing or deleting the profile afterwards must not change what was recorded.
  await saveUserProfile(db, userProfile("snap-me", { correctMarks: 9, incorrectPenalty: 9, unansweredMarks: 9 }));
  await deleteUserProfile(db, "snap-me");
  const result = await finalizeStandardExam(db, started.sessionId, "submitted");
  assert.ok(result);
  assert.equal(result!.hasScoringRule, true);
  assert.equal(result!.isOfficialRule, false);
  assert.equal(result!.ruleStatus, "illustrative");
  assert.equal(result!.maxScore, 20);
  const after = (await getSession(db, started.sessionId))!;
  assert.equal(after.ruleCorrect, 2);
  assert.equal(after.ruleProfile?.name.en, "snap-me");
  assert.ok(await loadExam(db, started.sessionId));

  // Without any choice nothing changes for existing callers.
  const db2 = await packDb(60);
  const plain = await startStandardExam(db2, { paperId: "paper-syn-2025" }, Date.now(), undefined, { custom: { questions: 10, seconds: 600 } });
  assert.equal(plain.ok, true);
  if (!plain.ok) return;
  const ps = (await getSession(db2, plain.sessionId))!;
  assert.deepEqual([ps.ruleCorrect, ps.ruleStatus, ps.ruleProfile], [null, "unconfigured", null]);

  // Flash uses the same resolution. The synthetic paper already has a complete stored rule, so an automatic default
  // must not override it (and records no snapshot); an explicit choice does override and is recorded.
  const db3 = await packDb(60);
  const autoChoice = await resolveMarkingChoice(db3, { institutionId: "inst-syn" });
  assert.equal(autoChoice!.origin, "auto_default");
  const autoFlash = await FlashController.start(db3, { institutionId: "inst-syn" }, 30, { markingChoice: autoChoice });
  assert.ok(autoFlash);
  const autoSession = (await getSession(db3, autoFlash!.sessionId))!;
  assert.equal(autoSession.ruleProfile, null);
  assert.deepEqual([autoSession.ruleCorrect, autoSession.rulePenalty, autoSession.ruleStatus], [1, 0.25, "illustrative"]);

  const db4 = await packDb(60);
  const explicit = await resolveMarkingChoice(db4, { institutionId: "inst-syn" }, "ju-2024-2025-mcq");
  const flash = await FlashController.start(db4, { institutionId: "inst-syn" }, 30, { markingChoice: explicit });
  assert.ok(flash);
  const fs = (await getSession(db4, flash!.sessionId))!;
  assert.equal(fs.ruleProfile?.id, "ju-2024-2025-mcq");
  assert.equal(fs.ruleProfile?.origin, "user_selected");
  assert.deepEqual([fs.ruleCorrect, fs.rulePenalty, fs.ruleTotalMarks, fs.ruleStatus], [1, 0.2, 80, "illustrative"]);
});

test("every new marking translation key has English and Bangla text", () => {
  const keys = Object.keys(translations).filter((k) => k.startsWith("marking."));
  assert.ok(keys.length >= 20);
  for (const k of keys) {
    const entry = (translations as Record<string, { bn: string; en: string }>)[k];
    assert.ok(entry.bn.trim() && entry.en.trim(), k);
    assert.equal(entry.bn.includes("\ufffd"), false, k);
  }
});

test("pass assessment without a question count compares the score directly; number input parsing is strict", async () => {
  const mine = userProfile("direct", { correctMarks: 1, incorrectPenalty: 0, unansweredMarks: 0, passMarks: 12 });
  const snap = snapshotOf({ profile: mine, origin: "user_selected" });
  assert.deepEqual(passAssessment(snap, 12, 25), { state: "passed", passMarks: 12 });
  assert.deepEqual(passAssessment(snap, 11.75, 25), { state: "below", passMarks: 12 });
  const { parseNumberInput } = await import("../src/services/markingProfiles.ts");
  assert.equal(parseNumberInput(""), null);
  assert.equal(parseNumberInput(" 0,25 "), 0.25);
  assert.equal(parseNumberInput("১২.৫"), 12.5);
  for (const bad of ["-1", "1e3", "abc", "1.23456", "NaN", "1 2"]) assert.equal(parseNumberInput(bad), "invalid", bad);
});

test("automatic defaults never score custom practice or a partly-known official paper; explicit/preference choices still do", () => {
  const partial: ScoringRule = { ...UNCONFIGURED_RULE, totalMarks: 100 }; // e.g. HSTU: only the 100-mark total is official
  const auto = { profile: generic, origin: "auto_default" as const };
  assert.equal(effectiveRule(partial, auto).snapshot, null, "generic fallback must not score a partial official rule");
  assert.equal(effectiveRule(partial, auto).rule.status, "unconfigured");
  // Custom practice is unscored even when a university profile matches automatically.
  const ruAuto = { profile: ru, origin: "auto_default" as const };
  assert.equal(effectiveRule(UNCONFIGURED_RULE, ruAuto, { customPractice: true }).snapshot, null);
  // The user's own decision is honoured in both cases.
  assert.equal(effectiveRule(partial, { profile: generic, origin: "user_selected" }).snapshot?.id, GENERIC_PROFILE_ID);
  assert.equal(effectiveRule(UNCONFIGURED_RULE, { profile: ru, origin: "preference" }, { customPractice: true }).snapshot?.id, ru.id);
  // A scope with no rule data at all still gets the generic illustrative default (unchanged behaviour).
  assert.equal(effectiveRule(UNCONFIGURED_RULE, auto).snapshot?.id, GENERIC_PROFILE_ID);
});
