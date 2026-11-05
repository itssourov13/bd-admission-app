# Task state

## Android v0.1.3 first-launch failure follow-up — v0.1.4 fix (2026-11-05)

**Status:** v0.1.4 source fix committed, EAS APK and embedded seed verified, and owner physical-phone verification confirmed successful. Two non-blocking follow-up notes are retained in docs/QA_CHECKLIST.md; no implementation is requested now.

- [x] Recorded owner-reported v0.1.3 / code 4 failure at the question-library import step. Previous embedded-DB checksum validation did not validate runtime materialization/copy and was not enough to call the APK ready.
- [x] Fixed invalid Expo File destination construction: convert expo-sqlite.defaultDatabaseDirectory raw absolute path to a file:/// URI before creating File; convert the URI back to an absolute SQLite path for ATTACH.
- [x] Use expo-file-system/legacy copyAsync for Android raw-resource-aware copying into the disposable SQLite sidecar.
- [x] Add path conversion tests and visible underlying error detail on the setup retry screen.
- [x] Bump app/brand/package to 0.1.4, Android versionCode 5; preserve package ID and signing identity.
- [x] Run 139 tests, typecheck, lint, seed/content check, whole-catalog validation, Expo config, Android prebuild and Android Metro export.
- [x] Committed the source fix and incident documentation locally as 8855821 (fix(android): correct bundled seed sidecar path); no push.
- [x] EAS v0.1.4 / code 5 build 040c75b2-0bbd-47b5-b859-cdb7f179f968 completed FINISHED; downloaded and verified the 117,408,124-byte APK and its embedded seed SHA/SQLite integrity.
- [x] Verify embedded seed payload hash matches source; ZIP integrity, SQLite quick_check, schema v5 and foreign-key check pass; catalogue has 217 packs / 13,609 questions.
- [!] Expo Doctor 20/21: single failed SDK patch alignment check for five packages; Gradle/APK build still passed. Align patch versions in a separate dependency maintenance task.
- [x] Owner reports that v0.1.4 was installed and verified successfully on the physical phone; overall app behavior is confirmed as expected.
- [x] Reviewed and committed the source fix locally as 8855821; subsequent EAS result and artifact verification were committed in follow-up documentation commits. This task adds only owner runtime notes and confirmation; no push.

## Historical seed startup release — v0.1.3 / Android versionCode 4 (owner-reported runtime failure)

- [x] Bumped package/brand/app version to `0.1.3` and Android versionCode to `4`, preserving package ID, Expo slug, project ID and EAS-managed signing credentials.
- [x] Replaced the hyphenated seed asset name with Android-compatible `content_seed.db`; Expo prebuild copies it into `android/app/src/main/assets/content_seed.db` with matching SHA-256 and valid SQLite integrity.
- [x] Replaced the hidden SQLite asset-import helper with public Expo Asset/File materialization and disposable sidecar handling.
- [x] Confirmed the exact `eas-build-pre-install` hook succeeds under Node 22.23.1 before package installation; generated native project directories are ignored so EAS runs managed prebuild from app config.
- [x] Final source checks: frozen install; 137/137 tests; typecheck; lint; 217 packs / 13,609 questions / 0 validation errors; content:check; benchmark; public Expo config; Android prebuild; Metro export and exported seed SQLite integrity.
- [x] Built the EAS internal APK successfully: build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd`, status `FINISHED`, completed 2026-11-05 13:32:51 UTC. [EAS build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) · [APK download](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk), ~112 MiB.
- [x] Owner installed/tested v0.1.3 over the previous app; first question-library import failed on the physical phone. The replacement v0.1.4 verification is tracked in the current task at the top of this file.
- [x] Final local Git review and commit; never push.

## v0.1.2 Android correctness preview preparation — 2026-11-05

- [x] Confirmed the connected workspace, clean correctness branch and remote branch synchronization.
- [x] Verified EAS CLI authentication as sk_king13 and inspected Android build history; only v0.1.1/code 2 and v0.1.0/code 1 builds existed at the start of this task.
- [x] Bumped brand/app package version from 0.1.1 to 0.1.2 and Android versionCode from 2 to 3; retained com.admissionbd.app, Expo slug, EAS project ID and existing EAS-managed keystore.
- [x] Updated current-state, release, QA, handoff, README and changelog references to distinguish the historical v0.1.1 APK from this correctness branch.
- [x] Resolved Expo public config confirms version 0.1.2, Android versionCode 3, package ID, slug and EAS project ID; git diff --check passes.
- [x] Committed version/documentation preparation as c93c7f3; no push performed.
- [x] Built the v0.1.2 EAS preview APK: `af78b85f-7a2b-4fba-b693-532c7d218f8b` (FINISHED); its artifact and build details are recorded in `docs/ANDROID_RELEASE.md`. This APK predates the seed implementation.
- [ ] Owner installs APK and verifies profile persistence, math layout/accessibility, official/partial exam rules, custom practice and update-data preservation. Only then merge the implementation branch to main.

## Profile, math display and official-rule integrity — 2026-11-05

**Status:** Implementation and automated checks are complete; physical-device and source-content follow-up remains.

- [x] Profile-name save/read-back confirmation, blur/submit persistence, screen-leave draft fallback, duplicate-save guard and error path.
- [x] Remove internal question-pack import logs from the student profile.
- [x] Add display-only scientific notation rendering for questions/options and spoken accessibility labels; keep ambiguous expressions and canonical source text unchanged.
- [x] Extend the pack/database/session rule model for partial official component totals; prevent unknown scoring values from becoming zero.
- [x] Prevent exact paper sessions from inheriting global 100-question/60-minute defaults; add clearly labelled, explicitly user-configured, unscored Custom Practice when the exact pattern is unavailable.
- [x] Add official-source research for JU, RU and HSTU 2024–2025; add only partial facts to the matching JU/HSTU papers. RU facts are documented but not attached to non-matching aggregate third-party captures.
- [x] Add a read-only 217-pack content-quality audit report. Flags remain review candidates; no question/option text was modified without its original matching source.
- [ ] Physical Android UI QA for profile save/leave, math layout and screen reader rendering, partial-rule notices, custom mode and migration from a previously installed DB.
- [ ] Acquire exact source paper(s) to complete JU/HSTU paper coverage; match the official RU C-unit source to an exact original 80-question sitting before adding the official rule to app data.

## Seed-based startup and runtime resilience — 2026-11-05

**Historical status:** v0.1.3 was built and its embedded seed passed package integrity; the owner later reported first question-library import failure on the phone. See the current v0.1.4 follow-up at the top.

- [x] Replace runtime-loaded JSON pack modules with a generated SQLite seed plus committed manifest; keep canonical question JSON unchanged.
- [x] Build the seed from current migrations/importer; add deterministic manifest generation, Node 22 build hooks and GitHub CI content-build step.
- [x] Add read-only seed integrity checks for SQLite quick_check, foreign keys, schema/format, pack metadata/signatures/counts, source-derived table totals and empty user-owned tables. Add corruption/repair test.
- [x] Copy pending content via set-based SQL and bounded grouped transactions; commit batch signatures atomically, isolate a failed group per pack, preserve user-owned tables and resume uncommitted work on next launch.
- [x] Add single-flight AppState-aware retry coordinator, carry libraryComplete to provider state and retain retry-visible import warnings.
- [x] Replace JS-driven progress width animation with native-driver translateX; keep Reduce Motion and accessibility support. Reanimated APIs/plugin are not required for this transform.
- [x] Preserve app/font startup marks while resetting attempt-specific performance spans/counters.
- [x] Add and run build-script integrity tests and focused startup/repository tests; host benchmark recorded in docs/STARTUP_PERFORMANCE.md.
- [x] Update architecture, context, decision, QA, handoff, release/workflow and question-data documentation.
- [x] Run final full suite (**137/137**), typecheck, lint, whole-catalog validation (217 packs / 13,609 questions / 0 errors), read-only seed integrity check, host benchmark, resolved Expo config and Android no-bytecode export. Exported 3.5 MB JS bundle plus a hashed 24 MB SQLite asset; asset itself passes SQLite quick_check / FK / counts.
- [x] Superseded by the seed-based v0.1.3 / versionCode 4 EAS preview APK built successfully in the section above; v0.1.2 predates this asset path.
- [x] Owner installed/tested v0.1.3 over the previous app and reported that the first question-library import failed; replacement v0.1.4 phone verification remains open.

## Historical branded first-launch/startup setup UI — 2026-11-01 (JSON loader replaced 2026-11-05)

- [x] Audited startup lifecycle, bundle loading, provider gating, design tokens, localization and existing test conventions before implementation review.
- [x] Added the branded Bangla/English setup screen, five stages, real processed-pack progress, completion transition, retry state, accessibility progress semantics, responsive scrolling and Reduce Motion support.
- [x] Extracted the startup sequence/progress model into testable modules and added a deferred bundle loader. The loader is not called until the setup screen's first layout has completed.
- [x] Kept the database schema, question-pack payloads, importer transaction contract, practice/scoring logic and user-owned data model unchanged.
- [x] Fixed audit findings: replaced render-time Animated refs with state-held values; removed effect-time synchronous progress set; added a setup-layout gate fallback; clarified processed-vs-successful progress wording.
- [x] Added focused tests for startup progress, first/returning launch, failure/retry policy, saved-data preservation, localization and UI-before-bundle ordering.
- [x] Verified: `pnpm test` 76/76, `pnpm typecheck`, `pnpm lint`, and `pnpm exec expo export --platform android --no-bytecode` (2,058 modules / 22 MB JS / 122 assets).
- [x] Bumped app version to `0.1.1` and Android `versionCode` to `2`; validated resolved Expo config and retained package ID/signing credentials. Local commit: `8b7e79b`.
- [x] Built EAS internal preview APK `0.1.1 (versionCode 2)`; build ID `b4745dc4-0069-4a86-bb5b-234e5f377dfd`, status `FINISHED`. [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) · [APK artifact](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk).
- [ ] Install the completed APK and verify fresh-install and existing-install startup behavior on a physical Android device. The historical `v0.1.0-preview.1` APK predates this implementation.
- [ ] After the device review, continue with the separately deferred measured startup-performance work (import batching/signature optimization/background sync/seed DB only if justified).

## JU-U + HSTU-U unverified candidate-bank import — 2026-11-01

- [x] Audited the ZIP (102 JSON files); imported only 84 JU + 15 HSTU packs. Explicitly excluded the 3 `GST_CLUSTER` packs / 287 questions for a separate later task.
- [x] Added 99 packs / 5,773 questions as independent `JU-U` (84 / 5,011) and `HSTU-U` (15 / 762) catalogue identities. Existing verified JU/HSTU institutions and all 57 verified packs remain unchanged.
- [x] Preserved all 5,773 content statuses as `unverified`; answer states remain 5,563 `unverified` and 210 `unknown`. All 99 paper rules stay `unconfigured`.
- [x] Added namespaced batch/paper/rule/question/source IDs and updated all source/paper references. Round-trip comparison confirms all 99 packs retain exact source question/option/key/status/provenance data after reversing only identity remaps.
- [x] Added 5,502 provisional candidates (JU-U 4,780; HSTU-U 722); withheld 42 repeated-option records and all 19 multiple-choice items from provisional single-choice scoring.
- [x] Audited cross-bank overlap (12 exact text+ordered-option matches; 95 same stems with option differences); retained all source variants without auto-merging.
- [x] Added integration coverage for pack/status/reference integrity, 217-pack fresh SQLite import, verified/candidate catalogue separation, practice eligibility and idempotent re-import.
- [x] Completed EAS APK build `b4745dc4-0069-4a86-bb5b-234e5f377dfd` containing the JU/HSTU candidate banks and branded startup UI; [Expo install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd).
- [ ] Owner device installation and smoke verification remain pending. Production AAB/Google Play remains outstanding.


## JU + HSTU question-bank import — 2026-11-01

- [x] Audited the Muse archive, ZIP integrity, all JSON packs, app schema, importer, data indexer and existing data IDs. Did not repeat question/answer factual verification.
- [x] Imported 50 JU packs / 1,526 questions and 7 HSTU packs / 293 questions; excluded the 3 unrelated GST packs.
- [x] Resolved the shared JU source-document ID across 24 batches by deterministic batch namespacing; updated every affected source reference while preserving question/option/answer data and all individual verification fields.
- [x] Regenerated `src/content/bundledPacks.ts`: **118 packs / 7,836 questions**.
- [x] Added integration tests for 57 new packs, answer/content states, source/reference uniqueness, warning preservation, all-pack SQLite import and re-import idempotency.
- [x] Fresh SQLite import: 118/118 packs imported, zero failures; 7,836 questions / 31,344 options / 118 batches / 118 papers / 59 rules / 168 sources / 7,836 appearances / 5 institutions. New verified single-choice pool: 1,668.
- [x] Documented the HSTU historical coverage gap and, at the initial import checkpoint, kept all 57 JU/HSTU rules unconfigured. The 2026-11-05 source review now adds only partial facts to 3 JU and 5 HSTU records; no unsupported timed/scoring fields were invented.
- [ ] Owner device check after installing a newly built APK is still separate. Production AAB/Google Play remains outstanding.

## Android preview release and documentation sync — 2026-10-31

- [x] Merged GitHub PR #2; merge commit `3aa125d4e12cdca1702f976f20c1f60a765923d1`.
- [x] Confirmed GitHub Actions CI success for PR run [41109514896](https://github.com/itssourov13/bd-admission-app/actions/runs/41109514896) and `main` push run [41109555081](https://github.com/itssourov13/bd-admission-app/actions/runs/41109555081).
- [x] Built the EAS preview APK (build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`) and published public GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1) with `BD.Admission.v0.1.0.apk`.
- [x] Owner-confirmed physical Android installation and device verification. Initial first load was about one minute; subsequent opens were about 2–3 seconds.
- [x] Audited and aligned README, current state, release guide, QA checklist, task state, handoff, branding and changelog with the live repository/release.
- [ ] Build and inspect the production AAB; prepare Play Console listing, required assets, privacy/data-safety declarations and production rollout.

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
- [x] Merged the CI/EAS configuration PR and confirmed the PR and `main` GitHub Actions runs succeeded.
- [x] Completed the EAS preview APK build and published the APK as the GitHub pre-release `v0.1.0-preview.1`.
- [x] Completed owner-reported physical-device installation and verification of the preview APK.
- [ ] Create and inspect a production AAB; Google Play listing, assets/privacy requirements and production rollout remain pending.

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
- [x] Added database migration and pack schema support for optional section-selection configuration; preserved a 100-question/60-minute fallback for scopes without a selected paper pattern.
- [x] Android preview APK built, published and owner-verified on a physical device; the local hermesc SIGILL is only a limitation of the local host build path, not the EAS cloud release.
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
- [ ] This 2026-10-30 question-bank rebuild checkpoint still had detailed figure/long-text device review open; the 2026-10-31 Android preview build and owner smoke test were completed later (see the release summary at the top of this file). The local Hermes SIGILL remains a host-specific limitation of the local bytecode-export path.
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
- [ ] Detailed RU C figure, long-Bangla/formula and individual practice-flow checks remain separate follow-up QA items; the standalone preview APK build and owner-reported device smoke test were completed on 2026-10-31.


## Android preview release — completion record
- [x] EAS preview cloud build completed; build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`.
- [x] APK uploaded to GitHub pre-release `v0.1.0-preview.1` as `BD.Admission.v0.1.0.apk`; asset checksum and size are recorded in `docs/ANDROID_RELEASE.md`.
- [x] Owner installed and verified the APK on a physical Android device; first load about one minute, subsequent opens about 2–3 seconds.
- [x] PR #2 merged and both PR CI and `main` push CI runs succeeded.
- [ ] Build/inspect the production AAB and complete the Google Play listing, privacy/testing requirements and rollout.
