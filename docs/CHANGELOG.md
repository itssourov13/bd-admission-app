# Changelog

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
