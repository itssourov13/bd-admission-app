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

## RU question-data intake (research-only checkpoint, 2026-10-29)
- [x] Deep web research pass: official 2025-2026 RU guide/notice, source discovery, selected-answer cross-checks, and tentative 2026-2027 schedule status recorded externally.
- [x] Created three schema-v1 review-only RU staging packs with 9 questions, source register and per-answer audit CSV under `/home/kali/gpt-workspace/bd-admission-app-data/ru/`.
- [x] Validated each staged pack successfully; the three intentionally unverified A Unit candidate keys produce expected warnings.
- [ ] Obtain/compare official RU paper scans and do human transcription/answer review before approving any pack.
- [ ] Confirm official 2026-2027 admission notice and exact paper-pattern details before adding any new exam rule.
- [ ] After explicit approval only, copy a selected complete pack into `data/question-packs/`, regenerate the index and run the import verification steps. No RU question is in the app bundle yet.
