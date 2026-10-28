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

## Remaining (needs external input)
- [ ] Real question packs from the user's PDFs (see docs/QUESTION_IMPORT_WORKFLOW.md).
- [ ] Verified exam pattern and marking rules per institution/paper/year/session/unit (question count, duration, subject/section distribution where applicable, and scoring values; supplied with packs, otherwise unconfigured).
- [ ] Replace the current fixed 100-question/60-minute Standard Exam with source-verified, paper-specific configuration end to end; add schema support for section constraints only where real official patterns require it.
- [ ] Android on-device QA (docs/QA_CHECKLIST.md "UI/device checks").
- [ ] Release Android build (the local hermesc binary crashes with SIGILL on this machine, see QA_CHECKLIST.md).
- [ ] Final app name, store assets, optional Engineering content.
