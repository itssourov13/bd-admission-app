# Task state

## README Play Store-style showcase — 2026-10-31

- [x] Created three 1080×1920 (9:16) portrait JPEG graphics from the supplied runtime captures: Home, Varsity catalogue and Profile.
- [x] Added generated brand-themed background artwork and restrained Bangla headlines while keeping the app UI as the original captured pixels.
- [x] Replaced personal display-name text with a generic `Learner` label and integrated the assets into the root README.
- [x] Documented file paths, screen descriptions, sample-profile caveat and Play Console follow-up in `docs/BRANDING.md`.
- [x] Verified all three README paths and 1080×1920 RGB JPEG dimensions; 62/62 tests, TypeScript typecheck and Expo lint pass.
- [ ] Capture one more genuine runtime screen before assembling a complete high-resolution Google Play screenshot set; the current three assets are README showcase graphics only.

## Android build and CI setup — 2026-10-31
- [x] Added a GitHub Actions CI workflow for `main` pushes, PRs targeting `main`, and manual dispatch. CI runs frozen install, tests, typecheck, lint, Expo config validation and Android no-bytecode bundle export.
- [x] Authenticated EAS CLI session verified as `sk_king13`; created/linked EAS project `@sk_king13/bd-admission-app` with ID `16ba69b8-96d7-4856-a197-77acddebe1ec`.
- [x] Added `owner` and `extra.eas.projectId` to the dynamic Expo config; resolved Expo config and EAS project metadata checked successfully.
- [x] Added `eas.json` with internal preview APK and production AAB profiles; documented the repeatable release flow in `docs/ANDROID_RELEASE.md` and README.
- [ ] Push/open PR to run GitHub Actions CI; no workflow run is claimed before that.
- [ ] Complete the first EAS preview APK cloud build, install it on a physical Android phone and record device QA.
- [ ] After device QA and store assets/privacy requirements, create and inspect a production AAB; Google Play and GitHub release publication remain pending.

## Done
- [x] Independent project, branding, i18n, tab shell (earlier passes).
- [x] Node 22.23.1, pnpm install, lockfile, expo config.
- [x] SQLite schema + migrations + serialized adapter; provider with loading/error states.
- [x] Repositories (content, sessions, userData) and services (scoring, timer, flash, flashController, exam, practiceService, advice, importer, contentSync).
- [x] All essential screens and navigation (see CURRENT_STATE.md).
- [x] Flash Question and Standard Exam end to end with persistence and exactly-once scoring/finalization.
- [x] Import pipeline: validator, transactional importer, startup sync, pack index generator.
- [x] Tests: scoring, timers, Flash, exam, importer, migrations, repositories, validator, pack index, UI logic/translations.
- [x] TypeScript, ESLint (react-hooks compiler rules) and expo-doctor clean.
- [x] Science-first subject order/filtering in Browse and Flash setup, including honest zero-count/empty states; paper questions load by canonical subject order and printed order.
- [x] Standard Exam now presents all session questions in one virtualized scrollable list, grouped by canonical subject, with in-place answers, clear controls, persistent Submit, and a serialized answer-write queue drained before finalization.
- [x] Focused subject-order, source-order, subject-count and serialized-selection-queue tests; current checks: 54 tests, typecheck, lint and diff-check pass (see QA_CHECKLIST.md).

## Remaining (release follow-through)
- [x] Initial two real DU A Unit packs imported from the supplied 2024–2025 and 2025–2026 PDF scans; 90 questions per session, six subject banks per session, printed answer-key states retained. See docs/QUESTION_IMPORT_WORKFLOW.md.
- [x] Paper-specific exam-pattern runtime implemented: selected paper rules control question count, duration and optional subject selection. DU A Unit source-bank practice uses four complete 15-question sections; its pattern remains illustrative because the official 2025–2026 notice describes an MCQ + written test, not the scan’s MCQ-only mock.
- [x] Add database migration and pack schema support for optional section-selection configuration; preserve a 100-question/60-minute fallback for scopes without a selected paper pattern.
- [ ] Android on-device QA (docs/QA_CHECKLIST.md "UI/device checks").
- [ ] Release Android build (the local hermesc binary crashes with SIGILL on this machine, see QA_CHECKLIST.md).
- [ ] Final app name, store assets, optional Engineering content.

## RU Unit A question intake (research-only checkpoint, 2026-10-29)
- [x] Researched A Unit sources and created a year-by-year ledger for 2010-2011 through 2026-2027.
- [x] Located twelve third-party session-specific A Unit PDF links for 2012-2013 through 2023-2024; a direct download probe was blocked by Drive-owner permissions. Two 2025-2026 Group 1/2 scans are archived locally.
- [x] Created eight A-only schema-v1 sample packs with 21 questions and per-question answer audit under `/home/kali/gpt-workspace/bd-admission-app-data/ru/`.
- [x] Removed B/C sample packs when scope narrowed to Unit A; validated the eight remaining packs and preserved unverified/unknown answers.
- [ ] Inspect 2010-2011/2011-2012 combined archive and map historical A1-A6 labels to the requested scope.
- [ ] Transcribe every question/option and source page for each accessible A Unit year; independently review answers and compare counts with the original paper.
- [ ] After review, copy an approved RU Unit A pack to `data/question-packs/`, regenerate the index and run import checks. No RU Unit A pack is bundled yet; the separate C Unit Science candidate batch is bundled for browse/review only.


## RU C Unit Science Group source collection (2026-10-29)
- [x] Created an isolated source workspace at `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/` with source/year ledger, scan hashes, source audit and import-readiness documentation.
- [x] Captured 44 paginated third-party Lokkho C Unit Science source variants for sessions 2010-2011 through 2025-2026; 4,185 records extracted and source-reported counts matched for 44/44 variants.
- [x] Created 44 full source-capture packs with 4,167 usable-option records; curated 44 Science-core schema-v1 candidates with 4,009 Physics/Chemistry/ICT/Biology/Higher Mathematics records in external `import-ready/lokkho/`. Held 158 other-subject-label records for historical review and logged 18 no-option records as excluded. No option or answer was fabricated.
- [x] Downloaded 45 image/SVG assets (2,356,641 bytes), recorded source/local SHA-256 metadata, and verified all 46 asset references resolve.
- [x] Ran the app pack validator against every external pack: 44/44 pass, 0 schema errors. Warnings correctly remain for unverified answers and 14 exact duplicate-option records.
- [x] Completed full-page and left/right-column machine OCR for all 84 indexed question/key pages in the separate third-party scan; OCR is preserved as unverified research aid only.
- [ ] Independently compare each question and every option with a matching original paper/reliable transcription; resolve 14 duplicate-option flags and question/source authenticity.
- [ ] Independently verify all 4,009 curated candidate answer keys from a reliable/official matching-session key; until then, every retained answer remains `unverified`. The provisional mode is only for practice against a possibly incorrect third-party key, not verified scoring.
- [x] Add local image/diagram support to the app renderer through a static PNG asset map; [ ] visually verify image-dependent questions on Android before marking them content verified.
- [ ] Obtain/review missing or restricted original paper sources, classify pages 205-265 of the compilation, and reconcile scan variants with the web-bank variants without merging distinct group/shift/set variants.
- [x] Import 44 RU C Unit Science candidate packs into `data/question-packs/`; all records retain unverified statuses and are excluded from the verified-only pool. The later provisional practice mode permits clearly warned source-key feedback for a safe subset. See the latest usability checkpoint below.
- [ ] Complete original-paper and answer-key review before promoting any candidates to scored practice.


## Pre-import progress audit — 2026-10-29
- [x] Rechecked repository status: `main` working tree clean; three local commits ahead of `origin/main`; no push performed.
- [x] Re-ran `pnpm test` (54 pass / 0 fail), `pnpm typecheck`, `pnpm lint`, `git diff --check`, and validators for both bundled DU packs (0 errors / 0 warnings each).
- [x] Reconciled the actual bundle against staged research: only the two DU A Unit packs are indexed. RU Unit A and RU C Unit remain external research/staging only.
- [ ] Highest-priority content gate: verify the RU C candidate questions/options against matching source papers, resolve 14 duplicate-option cases and 158 held subject labels, and independently verify answer keys before scored use.
- [ ] Implement and visually verify local question-image rendering before using image-dependent RU content.
- [ ] Complete real-device QA, use a compatible SDK 57 Expo Go/development build, and produce a native release build on a host where the local `hermesc` SIGILL does not block the build.


## RU C Unit Science year-by-year audit — 2026-10-29
- [x] Read-only audit index generated in isolated external folder, covering all 44 candidate packs / 4,009 candidate questions, per-session counts and source evidence.
- [x] Compared candidates against 300 questions across 20 partial SattAcademy snapshots and the existing OCR for 14 third-party scan variants; recorded 117 high-confidence same-year text matches, 35 answer-text mismatch review flags and 278 high-OCR-similarity leads.
- [x] SHA-256 comparison confirmed all 166 protected candidate/source/asset/PDF input files unchanged; no existing question file was changed, removed, moved or imported.
- [ ] Still unverified: every candidate question's original-paper provenance and all 4,009 answer keys. Similarity results are triage only, not approval.
- [ ] Review answer-text mismatch rows, 14 duplicate-option records, and 26 cross-variant repeated-stem groups against matching original papers/keys. Reconcile the 12 legacy year-register discrepancies separately without altering staged question files during the audit-only phase.


## Latest RU C Unit import checkpoint — 2026-10-29
- [x] Imported 44 RU C Unit Science candidate JSON packs, 4,009 questions, and 45 local PNG figures into the app; a later follow-up adds separately labelled provisional Flash/Standard practice without changing verification states.
- [x] Regenerated `src/content/bundledPacks.ts` with all 46 packs (44 RU C + 2 DU A) and added `question-assets:index` for Metro-compatible local asset mapping.
- [x] Rendered local question-level figures from QuestionCard without adding a runtime package.
- [x] Added integration coverage for pack counts, idempotent import, local asset integrity, preserved unverified states and no RU scoring rules; follow-up tests cover provisional Flash and 100-question Standard Exam paths and ensure duplicate-option items are withheld.
- [x] Verified all 46 JSON pack files (0 schema errors), `pnpm test` (55 passed), typecheck, lint, and Android no-bytecode bundle export.
- [ ] Review candidate question text/options and independently verify answer keys against matching original papers before promoting anything to verified/official scored practice.
- [ ] Android device QA for figure sizing and long Bangla/formula layout; native APK/AAB build remains outstanding.

## RU C provisional-practice usability checkpoint — 2026-10-29
- [x] Fixed the verified-only-only entry gap with an independent provisional pool; normal verified eligibility remains unchanged.
- [x] Provisional candidates require single-choice type, 2+ options, exactly one source key and no duplicate normalized option text. Actual RU pool: 3,991 available, 18 duplicate-option items withheld, zero verified-eligible.
- [x] Added BN/EN warnings and labels in setup, Flash feedback, Standard Exam, results/review, and institution/paper catalogue counts. All 4,009 question/content/key statuses remain unverified; RU rules remain unconfigured.
- [x] Added Flash and Standard integration tests proving provisional sessions can start, record source-key comparisons, retain the session marker and not invent RU scoring rules.
- [x] Latest checks under Node 22.23.1: `pnpm test` 57/57, `pnpm typecheck`, `pnpm lint`, `git diff --check` pass.
- [ ] On-device Expo Go smoke test for both modes, candidate figures/long-text layout, and result flow; rerun bundle/export on compatible Node before native build.
- [ ] Independently verify source-paper transcription and every answer key; build/test a release APK/AAB on a host compatible with Hermes. No release artifact or push is claimed.


## RU verified-source bank import — 2026-10-29
- [x] Imported the user-supplied `RU Question Bank.pdf` into a completely separate Varsity institution (`ru-verified-bank`, code `RU-V`), with 15 paper/set packs and 1,815 MCQ records from source pages covering 2016–2017 through 2024–2025.
- [x] Preserved source PDF SHA-256 and per-question source page/question-number provenance. The original PDF and import artifacts are outside the app repo under `/home/kali/gpt-workspace/bd-admission-app-data/ru-verified-question/`.
- [x] Set new question content status to `verified` per the user's instruction. 1,720 explicit source answer markers map to options; 95 absent/unreadable answer markers remain `unknown`, with no guessed key. 118 incomplete/non-choice extraction blocks are recorded in the external exclusion CSV.
- [x] Prefixed the original RU institution label with `UNVERIFIED —`; retained all 44 old RU packs and their 4,009 question records without changing question/option/answer content. Earlier questions are not deleted.
- [x] Regenerated the index with 61 packs / 6,004 question records. Added integration coverage for pack validation, source hashes/provenance, distinct RU IDs, counts, answer states, idempotent import and a 100-question Standard Exam from the new institution.
- [ ] Physical Android QA and native release build remain outstanding. Do not infer official RU-specific time, marking or unit question-count rules from the PDF; general Standard Exam uses the existing fallback.


## RU Question Bank verified-source rebuild and replacement — 2026-10-30

- [x] Resumed the complete 156-page OCR workspace and verified ocr/DONE; extraction workspace now has 156/156 OCR text pages.
- [x] Audited 1,982 extracted records across 17 exam blocks. Flagged 36 [WRITTEN Part] items separately and assigned a source-subject mapping to every structurally complete import candidate.
- [x] Rebuilt the 15 RU-V packs from the user-confirmed PDF/source data. **1,799 questions** are included with four non-empty A/B/C/D options, exactly one mapped key, contentVerificationStatus: verified, and answerVerificationStatus: verified. No imported RU-V question is tagged unverified/unknown.
- [x] Preserved 1,666 old question IDs where the page/printed-number locator was unique; assigned 162 deterministic IDs where entries were new or the source locator was ambiguous. Source page, printed question number, paper/set and subject are retained.
- [x] Excluded 183 incomplete/non-MCQ records with reasons in external EXCLUSION_MANIFEST.csv: 36 written-part, 90 incomplete option count, 25 blank extracted option text, 22 X/no-correct-option, 7 multi-letter answer markers, 3 missing answer markers. No text or answer was fabricated.
- [x] Replaced the previous 15 RU-V JSON packs, preserving the older RU C candidate dataset and both DU packs. The previous RU-V pack files and old bundle index are backed up outside the repo. New packs set replaceExistingPaperContent: true; transactional import removes only old active appearances for those 15 RU-V paper IDs and preserves question rows/bookmarks/session answer history.
- [x] Added pack schema/type/validator support for the optional replacement flag and added importer replacement logic plus tests for preserving historical bookmarks and session answers.
- [x] Rebuilt src/content/bundledPacks.ts: 61 packs / 5,988 questions total (180 DU + 4,009 RU C candidates + 1,799 RU-V verified-source questions).
- [x] Verification under Node 22.23.1: pnpm test 60/60, pnpm typecheck passed, pnpm lint passed, pnpm packs:index bundled 61 packs, all 61 packs validate with 0 errors / 4,052 warnings.
- [x] Added external build/reconciliation/exclusion/warning reports and updated schema, import workflow, README and QA documentation.
- [ ] Physical Android/Expo Go QA and a native APK/AAB release build remain open; the known Hermes SIGILL on this ARM/NetHunter host remains a build-host blocker.
- Push is intentionally not performed. Local commit is pending final verification.


## RU verified-source import — final corrected structure (2026-10-30)

This entry supersedes the earlier same-day 1,799-question and 1,827-question intermediate build checkpoints above.

- [x] Rebuilt the 15 RU-V packs with **1,828 verified source records**. This preserves all answer-marker semantics that the schema can represent: 1,800 single-choice keys, 22 `X`/no-correct-option records (`answerDisposition: no_correct_option`, empty correct-option list), and 6 complete multi-letter keys as verified multiple-choice records.
- [x] Every imported RU-V question is `contentVerificationStatus: verified` and `answerVerificationStatus: verified`; zero RU-V questions are unknown/unverified. All have four non-empty A/B/C/D options and mapped subjects/source page provenance.
- [x] The existing single-choice Flash/Standard eligible set is **1,800**; 22 no-correct-option and 6 multiple-choice items remain verified/browsable but are not coerced into that single-choice practice pool.
- [x] Exclusion manifest corrected to **154 records**: 36 written-part items, 90 incomplete option sets, 26 records with missing extracted option text, and 2 missing answer markers. Thirty source records with repeated option text are reported separately, not silently edited.
- [x] Final bundle: 61 packs / **6,017 questions** (180 DU + 4,009 original RU C candidates + 1,828 RU-V). The original RU C candidate bank and DU packs remain unchanged.
- [x] Final full test suite: **62/62 passed** under Node 22.23.1, including no-correct-option/multiple-choice validator tests, the recovered page-137 Q4/B regression, and replacement/history preservation tests.
- [x] Re-ran typecheck, lint, diff-check and validation across all 61 packs after the final code changes; Android no-bytecode JS export also passed (1,896 modules / 12 MB / 122 assets). Full suite: 62/62. Final diff review and local commit completed separately; do not push.
- [ ] Physical Android QA and an APK/AAB build on a compatible host remain separate release gates.


## Android release follow-through — open gates
- [x] Triggered EAS preview cloud build; build ID `d5e516cd-eefe-44f4-866d-b440ef188da9` is `IN_PROGRESS`. The APK artifact/download link is not available yet.
- [ ] Download/install the APK from the Expo Builds dashboard and complete the real-device checklist in docs/QA_CHECKLIST.md.
- [ ] Push/open a PR from chore/ci-eas-android-build-2026-10-31 so GitHub Actions runs; fix any CI-specific failures and record the run URL/result.
- [ ] Only after device QA, create the production AAB, inspect it and prepare the Google Play listing/privacy/testing requirements. Public store and GitHub binary releases remain pending.
