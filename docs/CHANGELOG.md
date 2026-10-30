# Changelog

## 2026-10-31 — Add Play Store-inspired README preview showcase

- Added three branded 1080×1920 (9:16) JPEG graphics for the Home, Varsity catalogue and Profile runtime screens under `docs/assets/showcase/`. Generated abstract artwork is used only as the background; the captured app UI remains authentic.
- Replaced the personal profile display name with `Learner`, and added accessible alt text plus README showcase placement. The visible profile counters are sample local profile state, not product-wide usage metrics.
- Documented that these are README presentation assets, not final Play Console listing assets. Google Play highly recommends four high-resolution screenshots for app recommendation surfaces; capture another genuine screen before final store preparation.
- Verification: 62/62 tests passed, TypeScript typecheck and Expo lint passed, all README asset references resolve, all images are 1080×1920 RGB JPEGs, and `git diff --check` is clean.

## 2026-10-31 — Configure GitHub CI and EAS Android release pipeline

- Added `.github/workflows/ci.yml` for main pushes, pull requests and manual CI runs. It installs the frozen pnpm lockfile, runs tests/typecheck/lint, validates Expo config and exports the Android JS bundle without Hermes bytecode. Follow-up hardening installs pnpm before enabling setup-node's pnpm store cache.
- Initialized and linked EAS project `@sk_king13/bd-admission-app` (`16ba69b8-96d7-4856-a197-77acddebe1ec`) in `app.config.js`; verified the resolved Expo config and `eas project:info`.
- Added `eas.json` preview APK and production AAB profiles and documented cloud build, signing, device QA, Google Play and GitHub Releases in `docs/ANDROID_RELEASE.md`.
- No GitHub workflow run is claimed because this branch has not been pushed/opened as a PR. No native APK/AAB or physical-device test is claimed yet.

## 2026-10-30 — Corrected RU verified-source pack structure and answer dispositions

- Completed the 156-page OCR and rebuilt the 15 RU-V packs from the user-confirmed source. The source was not re-verified question-by-question; all imported source question content and explicit answer states are marked verified as instructed.
- Increased the RU-V import from the intermediate 1,799 single-choice-only build to **1,828 verified source records** by preserving 22 explicit `X` markers as `answerDisposition: no_correct_option` and 6 complete multi-letter keys as `multiple_choice`. These are not coerced into the single-choice practice engine. The engine's RU-V single-choice eligible pool remains **1,800**.
- Final RU-V subject distribution: Physics 383, Higher Mathematics 512, Chemistry 365, Biology 502, ICT 54 and English 12. Existing source paper/set IDs and provenance remain. Old question IDs are reused only when source locators are unique.
- Final exclusion ledger: **154** records (36 written-part, 90 incomplete option sets, 26 missing extracted option text and 2 missing answer markers). Thirty included records with repeated extracted option text are in the separate warning audit; no source text or answer was silently rewritten.
- Final bundle: **61 packs / 6,017 questions** (180 DU + 4,009 separate RU C candidates + 1,828 RU-V verified-source questions). The older RU C candidate bank and both DU packs remain unchanged.
- Verified `replaceExistingPaperContent` semantics and active-catalogue filtering: replacement only removes appearances for the 15 target RU-V paper IDs; question rows and FK-backed bookmarks/session history remain. Historical orphan rows no longer leak into active catalogue/practice queries.
- Latest automated tests: **62/62 pass** under Node 22.23.1. The full final verification record is in `docs/QA_CHECKLIST.md`. Physical Android QA and native APK/AAB build remain release gates. No push performed.

## 2026-10-29 — Import separate RU verified-source bank
- Added 15 schema-v1 packs (1,815 MCQs) from the user-supplied 156-page `RU Question Bank.pdf`, preserving source PDF SHA-256, session/unit/set, PDF page and printed question number. The pack source and extraction report remain external to the mobile bundle.
- Per instruction, imported question content as verified without a separate question fact-check. 1,720 question keys were mapped from explicit answer markers; 95 keys remain `unknown` where markers were absent or unreliable. No key or official RU scoring rule was invented. Another 118 incomplete/non-choice blocks are logged externally instead of being forced into the MCQ schema.
- Created a distinct `RU-V — Rajshahi University — Verified Question Bank` institution (`ru-verified-bank`). Prefixed the old RU institution display name with `UNVERIFIED —` while preserving all 4,009 existing questions and their statuses/content.
- Regenerated the bundle index: 61 packs / 6,004 total questions (180 DU, 4,009 legacy RU, 1,815 new RU-V). Added integration coverage for provenance, source statuses, distinct IDs, idempotent import and a 100-question Standard Exam.
- Original question/key review was intentionally not repeated in this task. Android device QA and native release build remain pending; no push was performed.


## 2026-10-29 — Make RU C candidates usable with provisional practice
- Fixed the gap where all unverified RU candidates were imported but could not start Flash or Standard Exam because both modes only queried the verified pool. Verified-only eligibility remains strict; setup selects a distinct provisional pool when the scope has no verified-eligible questions and displays a warning.
- Added structural candidate filter (single choice, 2+ options, exactly one source-key option, no duplicate normalized option text): 3,991 of the 4,009 RU candidates available provisionally; 18 records with duplicate normalized option text withheld from provisional scoring. All statuses stay `unverified`; no RU marking rules were invented.
- Added provisional warnings in BN/EN, source-key feedback and review rendering, catalogue counts, and result banners; added tests for Flash/Standard provisional sessions and status preservation.
- Verification under Node 22.23.1: 57 tests passed; typecheck, lint and diff-check passed. Native device QA, current-code export, original-paper/answer-key verification, and APK/AAB build remain pending. No push performed.


## 2026-10-29 — RU C Unit Science source collection checkpoint
- Added a dedicated external research workspace for RU C Unit Science Group, including a SHA-256-tracked 265-page third-party scan and page ranges for 14 distinct paper/set variants (2017-2018 through 2024-2025).
- Collected 20 partial public-page snapshots (300 questions) and validated their JSON structure; none is a complete paper and no answer key was independently verified.
- Completed full-page machine OCR over 84 indexed question/key pages and added source/coverage manifests, answer audit trackers, restricted-download leads, and an explicit import readiness report. OCR remains unverified and is not bundled.
- Documented the initial scan/source-discovery checkpoint, missing/restricted years, optional Biology/Mathematics paths and the no-app-import gate. The separate scanned-PDF OCR and partial SattAcademy samples remain review-only; later in this changelog, the external `import-ready/lokkho/` folder is populated with the full paginated third-party source capture. No RU C Unit Science content was copied into the app packs or bundled.


## 2026-10-29 — RU Unit A source census and review samples
- Narrowed RU research scope to Unit A only and removed B/C sample packs from external staging.
- Created a year-by-year ledger for 2010-2011 through 2026-2027 and located twelve third-party session-specific PDF links for 2012-2013 through 2023-2024 plus recent group/shift sources.
- Expanded A-only external staging to eight sample packs with 21 questions and a per-question answer audit; kept unverified/unknown states explicit and did not claim a complete transcription.
- Downloaded and visually reviewed both 7-page 2025-2026 Group 1/2 image-only scans, and validated external sample packs; none was copied into app `data/question-packs/`, no index was regenerated and no RU data was imported or bundled.
- Recorded old 2010-2012 A1-A6 mapping and page-level source review as remaining work.

## 2026-10-28 — Science-first subject filters and scrollable Standard Exam
- Added the shared canonical subject order (Physics, Chemistry, Biology, Higher Mathematics, Bangla, English, ICT), bilingual subject labels, accurate per-subject counts and explicit unavailable/empty states.
- Question Browser now filters by subject while preserving bookmarks, sources, pagination and canonical subject/printed-question ordering. Flash setup supports subject-specific eligible-question pools without inventing content.
- Replaced one-question-at-a-time Standard Exam navigation and numbered question grid with one virtualized, continuously scrollable question list grouped by subject and source order. Options are selectable in place; timer and answer progress remain visible, and Submit is kept at the bottom.
- Added a serialized answer-write queue for rapid select/change/clear actions. Submission drains queued saves before finalization; timeout still finalizes using answers actually persisted by the deadline. Existing SQLite scoring, exactly-once finalization, session deadline and resume behavior are retained.
- Added focused tests for canonical ordering, zero-count subject options, repository question ordering/counts and answer queue ordering/failure recovery.
- Automated verification: 54 tests pass; typecheck and lint pass under Node 22.23.1. Physical Android/device QA remains outstanding.

## 2026-10-28 — Institution-specific exam-pattern requirement
- Documented that question count, duration, section constraints and marking rules vary by institution and paper/session.
- Clarified that the current fixed 100-question/60-minute Standard Exam is an MVP limitation, not a universal rule.
- Added the required pre-release task to wire source-verified paper-specific configuration through the whole exam flow.

## 2026-10-28 — Initial workspace foundation
- Created the independent BD Admission workspace and Git repository.
- Reused/adapted selected UI primitives, theme tokens and mobile configuration from ScholarHub.
- Included the source SDK's Expo Router runtime companion packages and language-aware tab label font selection.
- Created an Admission-specific logo, Bangla/English translation foundation and tab shell.
- Added the versioned question-pack contract, first-pass validator and validator tests.
- Added the project architecture, reuse inventory, data schema, import workflow and QA guidance.
- Replaced the inherited visual direction with navy, emerald and gold; added a custom book/progress mark, launcher icon, adaptive foreground, splash image and editable SVG.
- Centralized brand name, app identifiers, taglines and palette in brand.config.json; app.config.js reads that single source.
- Removed unrelated Clerk configuration from the standalone pnpm setup.
- No real historical question data was imported; no dependency install or Expo build is claimed.

## 2026-10-28 — Domain, database and import checkpoint
- Installed dependencies under Node 22.23.1 (pnpm 11.10.0); pnpm-lock.yaml generated.
- Added versioned SQLite schema (migration 1) in src/db/schema.ts and a SqlDb contract in src/db/types.ts.
- Added pure services: scoring, deadline timer, Flash engine, Standard Exam state, deterministic advice.
- Moved the validator to src/services/questionPackValidator.mjs (CLI wrapper kept at scripts/validate-question-pack.mjs).
- Added transactional, idempotent importer src/services/importer.ts.
- Added node:test suites in tests/ run against a real SQLite engine (node:sqlite).
- Fixed three type errors in the starter screens.

## 2026-10-28 — Application pass (resumed session)
- Committed the previous session's uncommitted catalogue/i18n/pack-index work.
- Added useNow (wall-clock ticker that refreshes on foreground), TextField, Stat.
- Added routes: Institution, Paper, Browse, Flash setup/play, Exam setup/play, Result, History, Bookmarks, Engineering; rebuilt Profile with persisted preferences and real progress.
- Fixed React-compiler lint violations (setState in effects, refs during render) in hooks and screens.
- Added tests/ui-logic.test.ts (translation parity, navigation param handling).
- Recorded verification results in docs/QA_CHECKLIST.md.

## 2026-10-28 — Documentation and verification alignment
- Rewrote README status/setup/verification guidance to reflect the implemented app and its actual release limitations.
- Updated QA checklist with the 46 passing automated tests, typecheck, lint, Expo config, Expo Doctor and no-bytecode Android bundle result; kept device/release checks explicitly outstanding.
- Updated branding, question-pack schema and source-reuse inventory to match the current implementation and independence boundary.
- Corrected architecture state wording and normalized trailing whitespace in DECISIONS.md.

## 2026-10-28 — Initial DU A Unit question import
- Added the 2024–2025 and 2025–2026 scanned-source packs (90 questions each, six 15-question subject sections).
- Preserved source filenames and SHA-256 hashes, paper/session/page/question provenance, and the answer-key state. Three items without a printed answer remain unknown.
- Recorded the printed 60-question/45-minute/+1/−0.25/four-of-six-subject pattern; end-to-end runtime enforcement remains pending.
- Added an integration test for record counts, eligibility, shared institution upsert behavior and idempotent re-import.

## 2026-10-28 — Paper-specific exam pattern support
- Added an optional section-selection configuration to the pack and SQLite rule schema with a versioned migration.
- Standard Exam now uses selected-paper question counts/durations and can require a chosen set of complete subject sections; general scopes retain the 100-question/60-minute fallback.
- DU A Unit now supports selecting four of six 15-question subject sections for a 60-question/45-minute source-pattern practice attempt. Sections missing a verified answer are not selectable.
- Updated setup UI/translation copy to show dynamic count/time and label the publisher-scan pattern as illustrative because it differs from the official DU 2025–2026 notice.
- Added integration coverage for all printed answer keys, migration/import/idempotence, 60-item section distribution, duration and rejection of incomplete sections.

## 2026-10-28 — Document device QA blocker
- Recorded the observed Expo Go SDK mismatch and the exact recovery path: install the SDK 57 Android Expo Go build from https://expo.dev/go or use a dedicated development build.
- Device QA remains open; a successful no-bytecode JavaScript export is not an APK/AAB or proof of on-device behavior.

## 2026-10-29 — RU C Unit Science full source-bank capture and staging
- Captured all currently listed paginated Lokkho C Unit Science source variants: 44 variants, 4,185 source records with source-count reconciliation across all variants.
- Preserved 4,167 usable-option records in external source capture; curated 44 schema-v1 Science-core candidate packs with 4,009 records, held 158 other-subject labels for session review, and logged 18 no-option rows. Downloaded 45 local images/SVGs and verified all 46 curated asset references.
- Validated every pack: 44/44 pass, zero schema errors. All retained content and third-party candidate answer keys remain explicitly unverified; 14 records have exact duplicate option text and remain flagged.
- Updated RU C coverage/import readiness docs and review ledgers. No RU C Unit records were copied into app packs or `src/content/bundledPacks.ts`; answer verification, original-paper comparison and local asset rendering remain release blockers.


## 2026-10-29 — Status audit and fresh automated checks
- Rechecked current Git state: clean `main` working tree, three commits ahead of `origin/main`; no push performed.
- Re-ran 54 automated tests, typecheck, lint, diff check, and validators for both bundled DU A packs; all passed, with zero pack-validator errors/warnings.
- Confirmed the bundle still includes only the two DU A Unit packs; RU Unit A and RU C Unit data remain external and unbundled.
- Updated the current-state, task-state, handoff and QA documents with remaining content-verification, image-rendering, Android-device and release-build gates.


## 2026-10-29 — RU C Unit year-by-year audit-only pass
- Added an isolated year-by-year evidence audit of 4,009 staged RU C Unit Science candidates across 44 packs, with per-question source similarity triage and per-session coverage results.
- Compared against 20 partial SattAcademy snapshots (300 questions) and existing OCR for 14 third-party scan variants; produced 117 high-confidence text matches, 35 answer-text mismatch review flags and 278 high-OCR-similarity leads. These are not official verification.
- Identified 14 duplicate-option question records, 26 exact normalized stem repeats across variants, and 12 discrepancies in legacy year-coverage counters.
- Confirmed 166/166 protected source/candidate/asset/PDF files unchanged. No question files were edited or imported; 0 questions/answer keys were promoted to verified.


## 2026-10-29 — Import RU C Unit Science candidates for browse/review
- Imported 44 schema-v1 RU C Unit Science candidate packs (4,009 questions across 2010–2011 through 2025–2026) while preserving every answer/content status as `unverified`.
- Added 45 local PNG figures, converted source WebP/SVG assets only in the app copy, generated a static Metro asset index, and added QuestionCard local figure rendering without new runtime dependencies.
- Regenerated the pack index to 46 packs total (44 RU C + 2 DU A); added an integration test proving idempotent import, asset paths, preserved verification states and zero RU scoring eligibility.
- Verification: 55 tests passed, typecheck and lint passed, all 46 JSON pack files validate with 0 errors (4,023 expected warnings), Android no-bytecode export passed; 166/166 protected external source/candidate/asset/PDF inputs remained hash-identical.
- Content/answer verification, Android visual QA, and native APK/AAB build remain outstanding. No push performed.


## 2026-10-30 — Rebuild and replace RU verified-source question bank

- Completed OCR for all 156 source PDF pages and rebuilt the RU-V extraction into 15 packs covering the same source paper/set identities.
- Replaced the prior 15-pack / 1,815-question RU-V app import with **1,799 MCQs**. Every included question is marked `contentVerificationStatus: verified` and `answerVerificationStatus: verified`, with four extracted non-empty options and one explicit source A/B/C/D answer marker. Subjects are assigned across Physics, Higher Mathematics, Chemistry, Biology, ICT and English.
- Kept the independent RU C Unit candidate bank (4,009 questions) and both DU packs unchanged. Bundle index remains 61 pack files and now contains **5,988 question records**.
- Added explicit exclusion reporting for 183 source records that cannot be represented as complete single-choice questions from the extraction: written-part, incomplete/missing option text, X, multiple-letter and missing-answer cases. Thirty imported questions with repeated extracted option text are called out in a separate review audit; their source data/status is not silently rewritten.
- Added transactional `replaceExistingPaperContent` support. It clears only current appearances for the target RU-V papers, preserving old question rows and FK-backed bookmarks/session history. Active browsing and practice queries now require a current paper appearance, so preserved historical orphan records cannot leak back into global practice pools.
- Added integration coverage for replacement, stale-question pool exclusion, bookmark/session/answer preservation and verified import status. Verification: 60 tests, typecheck, lint and 61-pack schema validation passed under Node 22.23.1 (0 errors; 4,052 warnings, primarily existing candidate-pack warnings plus repeated source option-text warnings).
- Updated schema, import workflow, README, current-state, task-state and QA documentation. Physical Android QA and a native APK/AAB release build remain outstanding. No push performed.
