## Current handoff — 2026-11-11 (v0.1.4 release baseline; startup UI targeted fix)

**Workspace:** /home/kali/gpt-workspace/bd-admission-app
**Branch:** fix/profile-persistence-math-render-exam-rules-2026-11-05
**Previous seed implementation commit:** 2370513 (local; no push).
**v0.1.4 seed-path fix commit:** 8855821 (local historical commit; no push). The current startup UI changes are committed separately after their verification.
**Current app candidate:** v0.1.4 / Android versionCode 5. EAS preview build 040c75b2-0bbd-47b5-b859-cdb7f179f968 is FINISHED. EAS v0.1.4 preview build 040c75b2-0bbd-47b5-b859-cdb7f179f968 completed successfully (FINISHED) on 2026-11-05 at 14:59:43 UTC / 20:59:43 Asia/Dhaka. Build metrics: queue 23m07.529s, worker build 18m48.733s (Gradle phase 17m19.883s), total 42m00.902s. App version 0.1.4, Android versionCode 5, application ID com.admissionbd.app. APK: https://expo.dev/artifacts/eas/ePmli5F3NH4vc9q1RupboKmJbt2FxkI8YdjbMW54-Jo.apk (~112 MiB; 117,408,124 bytes). APK SHA-256: 980cdfdd216ac588148b8d78a079df6660143a35f793d543b24fc25d8bfab670. The embedded assets/content_seed.db is 23,724,032 bytes; its SHA-256 1f26f2eb1ad59b2d3dee7272908bc1e91476452dc1c1035dfb06a60785fbf32e exactly matches the generated source seed. ZIP integrity passed, SQLite quick_check is ok, user_version=5, and foreign_key_check reports zero violations. Seed catalogue counts: 217 exam papers/packs, 13,609 questions, 54,436 options, 217 question batches. User-owned bookmarks, profiles and practice-session tables are empty in the bundled seed as expected.

The owner tested v0.1.3 / code 4 on a physical Android phone. It opens the setup UI but fails while importing the question library. Earlier verification checked the APK's embedded SQLite payload but did not exercise Expo's runtime copy/attach path on a phone; that was an overstatement of readiness. Source audit found that the raw absolute path returned by expo-sqlite.defaultDatabaseDirectory was passed into Expo File's File constructor, which expects a file:/// URI. The fix now constructs the destination with an explicit file URI, converts it back to a raw path for SQLite ATTACH, and uses expo-file-system/legacy copyAsync for Android resource-aware copying. The error screen now displays the underlying native error.

Automated verification for the v0.1.4 seed fix: 139/139 tests, TypeScript, ESLint, content:check, whole-catalog validation, resolved Expo config, Android prebuild and Android Metro export passed. Expo Doctor passed 20/21 checks; the only failure was a non-blocking SDK patch-alignment advisory across five packages. The owner installed and verified v0.1.4 on a physical phone; the v0.1.3 first-import failure is closed for this candidate. The square-flash follow-up now has a targeted UI-readiness fix in the latest source; see the implementation entry below. The separate Expo SDK patch-alignment advisory remains open.

See docs/STARTUP_PERFORMANCE.md, docs/CURRENT_STATE.md, docs/QA_CHECKLIST.md, docs/ANDROID_RELEASE.md and docs/TASK_STATE.md. Do not push.

## Startup UI targeted implementation — 2026-11-11

Returning cold launches no longer mount the full branded SetupScreen. When the local startup mode is classified as returning, AppShell resolves the existing setup-layout gate directly and retains the native splash while SQLite/content synchronization runs. The splash is hidden after Home's initial query has settled and its data-backed or actionable error view has laid out. First-run setup keeps the current branded visuals and now waits for that same Home-ready signal before beginning its completion hold/fade. Fatal startup errors still expose the branded retry UI; the retry action latches it through the next attempt.

The five real stage states and progress model were not changed. Done checkmarks now use a 65 ms stagger / 180 ms native-driver opacity-scale transition, with Reduce Motion unchanged. No additional animation library, dependency, schema, question data or app/version identity was changed.

Verification: 142/142 tests, TypeScript, full lint, content:check (217 packs / 13,609 questions) and Android no-bytecode Metro export (1,853 modules / 3.5 MB JS / 123 assets) pass. No APK was built and no physical-device screen recording was captured in this pass; confirm the exact square-flash outcome on the same phone before calling it fully resolved. Full implementation/audit notes: docs/STARTUP_UI_AUDIT.md and docs/QA_CHECKLIST.md.

## Previous handoff snapshot — v0.1.3 (superseded by the v0.1.4 fix)

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `fix/profile-persistence-math-render-exam-rules-2026-11-05`
**Implementation commit:** `491ab36` (already pushed by the owner).
**Release-preparation commit:** c93c7f3 (local commit; not pushed).
**Previous app candidate:** v0.1.3 / Android versionCode 4; build finished but the owner reported a first-import failure on the phone. Current candidate v0.1.4 / code 5 is tracked above.

The owner has already pushed the correctness implementation and release-preparation commits; PR #6 remains the integration path. Current local HEAD at the start of this task was `34f7420`. The working tree contains the completed seed-startup implementation, verification fixes and documentation updates. The changes are to be committed locally after the final Git/diff review; do not push.

Historical v0.1.3 summary: the seed implementation replaced startup JSON imports with a generated SQLite asset, set-based SQL and bounded transactions while preserving user-owned records. The APK's embedded seed passed package-integrity checks, but the owner subsequently tested it on Android and reported that first question-library import fails. This packaging-only result is not runtime QA. The v0.1.4 source fix and required owner verification are documented in the current handoff at the top.

The finished v0.1.2 APK (build `af78b85f-7a2b-4fba-b693-532c7d218f8b`) contains the correctness branch but predates the seed implementation; it cannot verify the new .db asset path. The v0.1.3 replacement build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd` is `FINISHED`; [download the APK](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk). The APK asset passed package-integrity checks, but the owner later tested it and reported the first question-library import failure on the phone. Background execution is not guaranteed while Android suspends/kills JS; current behavior is bounded foreground retry and transaction-safe recovery on relaunch, not WorkManager/FGS.

See `docs/STARTUP_PERFORMANCE.md`, `docs/CURRENT_STATE.md`, `docs/EXAM_RULE_RESEARCH.md`, `docs/QUESTION_QUALITY_AUDIT.md`, `docs/ANDROID_RELEASE.md` and `docs/QA_CHECKLIST.md`. Run commands with Node 22.23.1.

# Handoff

## Branded startup/setup UI — 2026-11-01

The active branch `feat/import-ju-hstu-unverified-question-banks-2026-11-01` now contains a branded BN/EN setup screen and testable startup progress. It displays the app brand, five startup stages, a question-pack processed counter (question-count weighted overall progress), an offline reassurance, a completion transition and retry state. Accessibility progress semantics, Reduce Motion and scrollable/small-screen layout are included. The generated pack bundle is loaded only after the setup screen's first layout; the route tree still waits for the existing sequential content sync to finish. This is not background sync or a measured import-performance fix.

Audit follow-up corrected React Hooks lint violations and added a test for the UI-before-bundle gate. App version is now `0.1.1` / Android `versionCode 2` (version commit `8b7e79b`). Latest verification: 76/76 tests, typecheck, lint and Android no-bytecode export (2,058 modules / 22 MB JS / 122 assets) pass. EAS internal APK build `b4745dc4-0069-4a86-bb5b-234e5f377dfd` is **finished** for the current source; [open its Expo build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) or [download the APK](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). **Still pending:** owner installation and physical-device setup/update QA. The public `v0.1.0-preview.1` APK is the historical build and does not include the new UI or JU/HSTU packs. Use `docs/QA_CHECKLIST.md` for fresh/returning install checks. Installing over the existing app should retain local data; clearing the primary app's data deletes its local user records.

## README showcase — 2026-10-31

The README now presents three 1080×1920 portrait graphics in `docs/assets/showcase/` (Home, Varsity catalogue and Profile). Each retains actual runtime UI pixels over generated, brand-matched abstract artwork; profile display-name text is anonymized as `Learner`. Visible profile counters are from the captured local sample profile, not product-wide usage metrics. These are README presentation assets, not final Play Console listing screenshots. Before store submission, capture at least one additional authentic runtime screen and prepare the final store assets against the [Google Play preview-asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151).

## Workspace
## Current data handoff — 2026-11-12

The HSTU verified import is complete. The app remains at 217 packs / 13,609 questions. Normal HSTU is now 22 papers / 950 questions, including 939 verified single-choice questions. All 664 question IDs in Claude's accepted HSTU ledger are answer/content verified under HSTU: 657 appearances moved from HSTU-U and 7 existing HSTU IDs were updated. HSTU-U retains 105 pending questions; all 116 baseline pending IDs were left unchanged. Full test suite passed 142/142; typecheck, lint, content check and SQLite integrity/FK checks passed. No new APK has been built for this data update. See docs/QUESTION_IMPORT_WORKFLOW.md and docs/TASK_STATE.md.

Target: /home/kali/gpt-workspace/bd-admission-app (independent Git repo; current task branch `feat/import-ju-hstu-unverified-question-banks-2026-11-01`, based on the preceding local JU/HSTU verified-import commit; commit locally only, never push from automation).
ScholarHub (/home/kali/gpt-workspace/scholar-hub) is historical provenance only; there is no runtime/build dependency on it and it must not be edited.

## State

The app bundles **217 packs / 13,609 questions**. Current HSTU status: 22 HSTU papers / 950 questions, including 939 verified single-choice questions. The accepted Claude ledger's 664 question IDs are fully verified in the normal HSTU catalogue: 657 moved from HSTU-U appearances to HSTU papers and 7 existing HSTU IDs were updated. HSTU-U retains 105 pending questions; all 116 baseline pending questions remain unchanged. JU-U stays at 84 / 5,011 candidates, and other DU/RU/JU data is unchanged. All original candidate-bank rules and the 15 new HSTU paper rules remain unconfigured. No new APK has been built for this import. See docs/QUESTION_IMPORT_WORKFLOW.md for complete source, backup and validation records.

## Run
    source ~/.nvm/nvm.sh && nvm use      # 22.23.1
    pnpm install
    pnpm test && pnpm typecheck && pnpm lint && pnpm doctor
    pnpm android                          # native local run (requires Android toolchain)
    pnpm dlx eas-cli@latest build --platform android --profile preview  # cloud APK build

## Next steps
1. Install the completed EAS v0.1.4 APK from the [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/040c75b2-0bbd-47b5-b859-cdb7f179f968) and complete the physical-device startup UI checklist in `docs/QA_CHECKLIST.md`. Test a fresh database separately from an existing installation; installing over the current app should preserve local data. Do not clear the primary app's local data without accepting that profile/bookmarks/attempts/history will be deleted.
2. The HSTU 2026-11-12 verified import is complete. Await the user’s direction before starting another university’s pending-question work or any further HSTU review.
3. Keep the publisher-derived DU A Unit pattern illustrative: the official DU 2025–2026 notice includes 40 written marks in addition to 60 MCQ marks. The current pattern is a source-bank practice mode only. General scopes retain the 100/60 fallback; new university/session rules must come from the matching primary source.
4. For the next app version, use the EAS `production` profile to create an Android AAB; inspect the artifact and verify target API/versioning.
5. Complete the Google Play listing, production screenshots, privacy policy/data-safety declarations and any account-specific testing/access requirements before Play Console rollout.
6. Keep the final product display name decision in sync with `brand.config.json` and `docs/BRANDING.md`.

## Boundaries
- Do not invent questions, answers, years, sources or scoring rules.
- By default, verified-content/answer single-choice questions with 2+ options feed the verified Flash/Exam pool. RU C and JU-U remain candidate banks; HSTU-U now contains only the 105 retained pending questions. The accepted 664-question HSTU batch is in the normal HSTU verified catalogue.
- Illustrative/unconfigured rules must never be presented as official.

## RU Unit A research checkpoint

Read `/home/kali/gpt-workspace/bd-admission-app-data/ru/README.md`, `RESEARCH_REPORT.md` and `A_UNIT_YEAR_COVERAGE.csv`. Scope is RU Unit A only. Eight external review-only JSON packs contain 21 questions. The year ledger covers 2010-2011 to 2026-2027, but complete transcription is not finished. Twelve linked PDFs for 2012-2013 to 2023-2024 were located but the direct downloads are restricted; two 2025-2026 Group 1/2 scanned PDFs are archived in `sources/2025-2026/`. 2010-2012 combined sources need historical A1-A6 mapping. The separate historical A-only research sample packs remain external; the user-provided PDF import includes the A Unit 2024–2025 sets present in that source. The original RU C Unit Science candidate bank remains separately labelled unverified and available through the provisional-practice path.

Next: acquire/verify each source paper, preserve group/shift/set variants, transcribe every option and source/page reference, and independently review every answer. Only then copy approved full-year/paper packs into `data/question-packs/`, validate, regenerate the index and run importer tests. Do not claim coverage complete until counts and answer states have been compared against original papers.


## RU C Unit Science Group collection and import staging — 2026-10-29

External root: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/`. Read `README.md`, `import-ready/README.md`, `research/IMPORT_READINESS.md`, `research/LOKKHO_COLLECTION_SUMMARY.json`, `research/LOKKHO_QUESTION_AUDIT.csv`, and `research/SCHEMA_VALIDATION_SUMMARY.csv` first. Full paginated Lokkho source capture covers 44 third-party source variants and 4,185 records; count matching succeeded for 44/44 variants. `source-capture/lokkho/` preserves 4,167 usable-option items. `import-ready/lokkho/` contains 4,009 curated science-core candidates across 44 packs; 158 other-subject-label records are held in `REVIEW/LOKKHO_OFFSCOPE_SUBJECT_AUDIT.csv`, and 18 no-option records are logged in the exclusion ledger.

At the initial staging checkpoint, all 44 curated packs passed schema validation with zero errors and 4,023 warnings. All 4,009 content and answer states were unverified; none of the keys had been independently verified against an official RU key. Fourteen records had exact duplicate option text. This pre-import checkpoint was superseded by the browse/review import documented below; answer/key verification and device-level visual QA remain outstanding.

The separate 265-page third-party scan's 14 indexed variants and 84 pages of machine OCR remain unverified and unmerged; pages 205-265 and restricted historical PDF links remain gaps. At the original staging checkpoint, no RU C Unit pack was in the app bundle; that was superseded by the import checkpoint below.


## Latest status audit — 2026-10-29

At the pre-import audit checkpoint, local `main` was three commits ahead of `origin/main`, with only the two DU A packs bundled. That state has since been superseded by the browse/review import recorded below; no push was performed.

**Next content priority:** review original papers and answer keys for the 4,009 already-imported RU C candidates before allowing scored practice; resolve 14 duplicate-option records and assess the 158 held subject labels by historical session. Local image rendering has been added, but its Android visual QA remains outstanding. Keep native release build/device QA open, and confirm the official 2026–2027 circular before configuring rules for that session.


## Latest RU C Unit audit-only handoff — 2026-10-29

Audit output folder: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/`; ZIP: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification.zip`. Read AUDIT_REPORT.md first, then YEAR_BY_YEAR_AUDIT.csv and QUESTION_LEVEL_AUDIT.csv. The pass generated per-year source/count evidence plus 4,009 row-level triage records, 14 duplicate-option records, 35 third-party answer-text mismatch review flags, and 26 exact normalized same-stem overlaps across variant packs. It has not independently verified any question content or answer key. Similarity against third-party snapshots/OCR is not source approval. All 166 protected candidate/source/asset/PDF inputs were SHA-256 identical before and after the audit. No staged question data or app bundle was changed.


## Previous RU C Unit import checkpoint — before separate RU-V source import (2026-10-29)

The app now bundles 44 RU C Unit Science candidate packs containing **4,009 questions** from sessions 2010–2011 through 2025–2026, plus the two DU A packs. There are 45 local PNG figures and 46 resolved asset references. The app index contains 46 JSON packs and 4,189 total questions. Local figures are rendered by QuestionCard via the generated static map in `src/content/questionAssets.ts`; regenerate it with `pnpm question-assets:index` after changing image files, then run `pnpm packs:index` after changing JSON packs.

**Verification boundary:** every imported RU question still has unverified answer and content status; no RU exam rules were added. The verified-only pool remains zero. The app now has a distinct provisional mode for 3,991 structurally safe candidates; the 18 records with duplicate normalized option text are withheld from provisional scoring. Answer feedback and accuracy use the third-party source key, may be wrong, and must not be presented as verified or official scoring. Review original-paper provenance, options/formulae/figures, duplicate options and answer keys before promoting any content to verified status.

At this earlier checkpoint, 46 pack JSON files and the provisional RU mode were verified. That count is superseded by the later separate RU-V PDF import described below. Physical Android QA and the host's known Hermes `SIGILL` release-build issue remain open; no push was performed.

## Latest practice usability fix — 2026-10-29

The previously imported RU C candidates were hidden from both practice modes by the verified-only eligibility query. That gate remains unchanged for normal practice; a separate provisional candidate pool and prominent UI warnings now enable practice where no verified pool exists. Candidate criteria: single-choice, at least two options, exactly one source-key key, no duplicate normalized option text. Current RU pool: 3,991 provisional, 18 withheld, 0 verified. All 4,009 keep their `unverified` states; the app does not configure an official RU scoring rule. Result feedback is explicitly provisional.

Latest tests: 57/57, TypeScript and ESLint pass under Node 22.23.1. Still required: verify original-paper/transcription/answer keys, exercise the actual Android app (including figures and Flash/Standard flows), run a compatible bundle/native release build, and only then release the APK/AAB. Do not push from automation.


## Latest verified-source import handoff — 2026-10-29

The rebuilt RU-V source artifacts are in `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/`. Read `IMPORT_BUILD_SUMMARY.json`, `PACK_RECONCILIATION.csv`, `EXCLUSION_MANIFEST.csv`, `IDENTICAL_OPTION_TEXT_AUDIT.csv`, `extract.py` and `build_verified_packs.py`. The 156-page PDF hash is `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`. The current bundle has 61 pack files / 6,017 question records. RU-V: 15 packs / 1,828 verified source records; 1,800 single-choice questions are practice eligible, 22 explicit no-correct-option records and 6 multiple-choice records are kept verified but out of the single-choice engine. 154 source records are held for written/incomplete extraction reasons. The older RU C candidate bank and DU packs are unchanged.

Focused import tests cover the old/new section separation, import idempotency, provenance and Standard Exam startup. This is the 2026-10-29 RU verified-source handoff checkpoint; its device/release status was superseded on 2026-10-31 by the published Android preview and owner-reported physical-device smoke test recorded at the top of this handoff.

## Roadmap handoff — 2026-11-13

Roadmap work follows the brief in the owner's "Implementation Roadmap & Development Handoff": phases 1–10, no push, testing deferred to the owner. Status table and chronological log: docs/implementation/IMPLEMENTATION_LOG.md. **Phase 1 is Implemented — Pending Owner Verification** (docs/implementation/PHASE_01_LOADING_UI.md). Current branch: feat/import-hstu-verified-answers-2026-11-12. (Superseded: Phase 2 was implemented later the same day; see the Phase 2 note below.) Startup invariants to keep: native splash is held until SetupScreen's first layout (first run/failure/escalation) or Home's first layout (returning, with 4 s fallback); `waitForSetupScreen()` gate must always be released (SetupScreen layout, or directly in returning mode).

Phase 2 (University identity, logos, filters) Implemented — Pending Owner Verification — see docs/implementation/PHASE_02_*.md. Next: Phase 3 (shared subject selection) extends the same scope-param pattern.

## Roadmap handoff — Phase 3: Shared subject selection — 2026-11-13

Phase 3 is implemented and committed locally (not pushed); see docs/implementation/PHASE_03_SHARED_SUBJECT_SELECTION.md for scope, decisions and deferred owner tests. Tests need nvm Node v24.21.0 (system node lacks TypeScript support). **Next: Phase 4 (configurable marking rules).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.

## Roadmap handoff — Phase 4: Configurable marking rules — 2026-11-13

Marking profiles live in src/services/markingProfiles.ts (pure) and src/repositories/marking.ts; sessions snapshot the profile in practice_sessions.rule_profile_json. No built-in profile can be 'verified' because no source states every scoring value. Do not relabel DU (third-party) or derived values as official; re-read the signed JU circular and fetch the official DU circular before upgrading provenance. Automatic profiles never score Custom Practice or partial-official papers. See docs/implementation/PHASE_04_CONFIGURABLE_MARKING_RULES.md. **Next: Phase 5 (Standard Exam improvements).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.

## Roadmap handoff — Phase 5: Standard Exam improvements — 2026-11-13

Phase 5 logic lives in src/services/examReview.ts (pure) and src/components/common/ExamPalette.tsx; flags persist in session_answers.flagged via setExamFlag (guarded like selections). Practice-missed uses PoolFilter.retrySessionId (route param retry). Selection queue, deadlines and finalization were not changed. Palette/warning colours use brand tokens directly and need semantic tokens in Phase 6. **Next: Phase 6 (Settings & dark mode).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.
