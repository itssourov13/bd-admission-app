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


## RU C Unit Science Group source collection (2026-10-29)
- [x] Created an isolated source workspace at `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/` with source/year ledger, scan hashes, source audit and import-readiness documentation.
- [x] Captured 44 paginated third-party Lokkho C Unit Science source variants for sessions 2010-2011 through 2025-2026; 4,185 records extracted and source-reported counts matched for 44/44 variants.
- [x] Created 44 full source-capture packs with 4,167 usable-option records; curated 44 Science-core schema-v1 candidates with 4,009 Physics/Chemistry/ICT/Biology/Higher Mathematics records in external `import-ready/lokkho/`. Held 158 other-subject-label records for historical review and logged 18 no-option records as excluded. No option or answer was fabricated.
- [x] Downloaded 45 image/SVG assets (2,356,641 bytes), recorded source/local SHA-256 metadata, and verified all 46 asset references resolve.
- [x] Ran the app pack validator against every external pack: 44/44 pass, 0 schema errors. Warnings correctly remain for unverified answers and 14 exact duplicate-option records.
- [x] Completed full-page and left/right-column machine OCR for all 84 indexed question/key pages in the separate third-party scan; OCR is preserved as unverified research aid only.
- [ ] Independently compare each question and every option with a matching original paper/reliable transcription; resolve 14 duplicate-option flags and question/source authenticity.
- [ ] Independently verify all 4,009 curated candidate answer keys from a reliable or official matching-session key; until then, every retained answer remains `unverified` and none can be used for scored practice.
- [ ] Add local image/diagram support to the app renderer and visually verify image-dependent questions before marking them content verified.
- [ ] Obtain/review missing or restricted original paper sources, classify pages 205-265 of the compilation, and reconcile scan variants with the web-bank variants without merging distinct group/shift/set variants.
- [ ] Only after content/key review, copy approved packs and assets into `data/question-packs/`, run `pnpm packs:index`, and verify transactional import. No RU C Unit data is currently in the app bundle.


## Fresh progress audit — 2026-10-29
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
