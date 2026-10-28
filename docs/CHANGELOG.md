# Changelog

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
