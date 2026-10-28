# Changelog

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
