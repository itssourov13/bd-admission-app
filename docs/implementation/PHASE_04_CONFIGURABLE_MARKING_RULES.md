# Phase 4 — Configurable Marking Rules

**Status:** Implemented — Pending Owner Verification (2026-11-13).

## Objective
Let marking (correct / wrong / unanswered marks, total, pass mark) come from named, source-tracked **marking profiles** instead of one hard-wired illustrative rule, with per-university and global defaults, user-created profiles, and per-session snapshots, without ever presenting an inferred value as official.

## Initial state
- Scoring was data-driven (`ScoringRule` + `RuleStatus` verified / illustrative / unconfigured) but the only inputs were a paper's stored rule or nothing. Flash and Standard Exam resolved a rule through `resolveRuleForQuestions`.
- `docs/EXAM_RULE_RESEARCH.md` documents partial official rules (RU, JU, HSTU 2024–25); `AGENTS.md` forbids numeric scores for partial rules and requires Custom Practice to be unscored.
- Sessions stored only the resolved numeric rule, not where it came from.

## Findings (code review of the previous session's uncommitted work, then fixes)
1. Resolver, migration v6, repositories, picker, management screen, result screen and translations matched the previous report. `markingProfiles.ts` is pure (no React/SQLite/i18n).
2. **Provenance audit against `EXAM_RULE_RESEARCH.md`** — every value kept its own provenance; no profile can reach "verified":
   - RU 2024–25: total 100, 80 questions, 1 h, −0.25 (1 mark per 4 wrong), pass 40 = official. Correct-answer mark 1.25 = **derived** (100 ÷ 80; not in the circular). Unanswered 0 = **illustrative**. Status: illustrative.
   - JU 2024–25: total 80, 55 min answering, −0.20 = official (JU notice listing, cross-checked with a Prothom Alo report of the circular; the signed circular PDF was not re-read in this session). Pass 26.4 (33% of 80), question count 80 (source-compilation headers), correct mark 1 = **derived**. Unanswered 0 = **illustrative**. Status: illustrative.
   - HSTU 2024–25: only total 100 = official. Not scorable; never auto-selected.
   - DU MCQ 2025–26 / 2026–27: every number is **secondary** (third-party sites; official DU circular not checked); count derived; unanswered illustrative. Labelled "verify before relying on it".
   - Generic 100-question profile: all values illustrative; no pass mark invented.
   - Medical and engineering rules were not researched and no profile exists for them.
3. **Integration defect fixed:** the setup screens always resolve an automatic profile, so the generic fallback would have put an illustrative numeric score on (a) Custom Practice, which `AGENTS.md` requires to be unscored, and (b) papers whose official rule is only partly known (HSTU: total marks only), contradicting the "no numeric score is fabricated" contract. See Decisions.
4. Per-university vs global defaults, deletion (also removes preferences pointing at the profile), copy-to-user (all provenance → "user"), defensive parsing of stored JSON (provenance forced to "user", invalid profiles dropped) and snapshot independence were reviewed and are consistent.
5. A paper's own question count and duration are never overridden by a profile; profile count/duration are informational and only used for the pass-mark comparison.

## Implementation
- `src/services/markingProfiles.ts` (new, pure): `MarkingProfile` with per-field provenance (official / secondary / derived / illustrative / user), built-in catalogue, `profileStatus` (weakest link: verified only if all three scoring values are official), validation, `cloneAsUserProfile`, `selectProfile` (explicit > per-university preference > global preference > best-matching built-in > generic), `effectiveRule`, `snapshotOf`/`parseSnapshot`, `passAssessment`, `parseNumberInput` (Bangla digits, decimal comma), `isAutoScoringBlocked` (new in this session).
- `src/repositories/marking.ts` (new): user profiles, preferences (`*` or `u:<universityKey>`), `markingContextForFilter`, `resolveMarkingChoice`. Only user-owned tables are touched.
- `src/db/schema.ts` migration v6.
- `src/repositories/sessions.ts`, `src/types/domain.ts`: `rule_profile_json` ↔ `SessionRow.ruleProfile`.
- `src/services/practiceService.ts` (`startStandardExam`) and `src/services/flashController.ts`: accept `markingChoice`, apply `effectiveRule`, store snapshot. Custom Practice passes `customPractice`.
- UI: `MarkingProfileCard`, `MarkingProfilePicker` (Flash + Standard/Custom setup), `app/marking-profiles.tsx` (list, create, edit, copy, delete, set/clear default), Profile tab entry, result screen (profile name + pass-mark line). Flash passes the chosen profile id to `/flash/play` as a validated `profile` route param.
- i18n: ~45 `marking.*` keys in English and Bangla (+ `marking.autoUnscored` this session). Bangla not native-reviewed.

## Database and migration changes
Migration **v6 `marking_profiles`** (user-owned data only; importer tables untouched, built-in profiles live in code):
- `ALTER TABLE practice_sessions ADD COLUMN rule_profile_json TEXT` (immutable snapshot: id, name, origin, status, pass mark, question count, per-field provenance, source).
- `user_marking_profiles(id PK, profile_json, created_at, updated_at)`.
- `marking_preferences(scope_key PK, profile_id, updated_at)`.

## Decisions (also ADR-028)
- **Stored complete rule wins over an automatic default.** An explicit choice or saved preference overrides scoring values; question count/duration of the exam stay the paper's own.
- **Automatic defaults never score Custom Practice, and the generic fallback never scores a paper with a partial official rule.** Explicit/preference choices are the user's decision and still apply. A university-specific built-in that matches (RU, JU, DU) may still apply automatically and is labelled illustrative/secondary.
- Snapshot at session start keeps history stable under later profile edits/deletion.

## Checks actually run (this session, Node 22.23.1 via nvm)
- `node --test tests/marking-profiles.test.ts`: 13/13 pass (12 previous + 1 new covering the auto-scoring guard).
- `tsc --noEmit`: exit 0 after the final changes.
- Targeted ESLint on the touched files and `git diff --check`: see IMPLEMENTATION_LOG.md entry.
- Full suite, builds, emulator/device runs were **not** run (deferred to owner). Earlier core tests do not verify later UI wiring.

## Known limitations
- Picker/management UI, Bangla wording, and the chip list for many profiles are untested on a device.
- DU values are third-party; the official circular still needs to be retrieved. JU values rely on the official notice listing plus a news report; re-read the signed circular before calling them confirmed.
- No medical/engineering profiles. User profiles cannot yet carry their own provenance notes or sources.
- Auto-selection uses only the first institution when several are scoped; the year/session match needs paper metadata.
- Unscored auto behaviour means universities without a researched profile (e.g. via partial papers) show no score unless the user selects a profile or sets a global default.

## Deferred testing (owner)
Create/edit/copy/delete profiles; set and clear defaults per university and globally; start Flash, Standard and Custom exams with automatic, preferred and explicit profiles; confirm RU/JU show "illustrative", HSTU and Custom show no score by default; verify historical results after editing/deleting a profile; Bangla rendering; migration v6 on an existing install.

## Remaining work / next phase
None required here beyond owner verification. Phase 5 (Standard Exam improvements) can read `session.ruleProfile` for the result page and per-subject breakdown.

## Related commit
`feat(exams): phase 4 configurable marking profiles (implemented; owner verification pending)`.
