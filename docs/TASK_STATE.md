# Task state

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
- [ ] After approval only, copy a complete reviewed year/paper pack to `data/question-packs/`, regenerate the index and run import checks. No RU pack is bundled yet.
