# BD Admission

A Bangladesh-focused, offline-first Android admission-preparation app for university (Varsity) and Medical admission questions. The app supports Bangla and English, question browsing, Flash Question practice, Standard Exam sessions, bookmarks, a local profile, and practice history. Engineering is visible as Coming Soon.

## Current implementation status

The core app implementation is wired across the Expo Router screens, SQLite database lifecycle, repositories, practice services, question-pack importer, and local user data. Automated checks pass as recorded in docs/QA_CHECKLIST.md.

This is **not yet a release sign-off**. Two DU A Unit packs are now bundled from the supplied scanned question-bank PDFs: 90 questions per session for 2024–2025 and 2025–2026, across six subject sections. The supplied answer-key letters are preserved; three questions without a printed key remain unanswered/unknown rather than guessed. The supplied publisher scan is a question-bank source, not an official DU past-paper notice. The official DU 2025–2026 notice describes 60 marks of MCQ plus 40 marks of written questions, with 45 minutes for each part ([official notice](https://www.du.ac.bd/du_post_details/news/25400)); its complete format differs from the scan’s four-of-six-subject MCQ-only practice pattern. That rule therefore remains **illustrative** and the app labels the selected-paper mode as question-bank practice, not a full official DU exam. Some diagram-based options are represented by text labels because the runtime does not yet render question figures as local assets. Two items are content-unverified and excluded from scored practice: one figure-only physics item and one mathematics formula whose scanned expression is unclear.

The app has not yet been validated on a physical Android device or emulator, and a normal Hermes bytecode export crashes on this ARM/NetHunter host. The successful no-bytecode export is a JavaScript bundle check, not an APK/AAB build.

## Main features

- **Offline-first data:** SQLite is the local source of truth for question content, paper/source references, exam attempts, answers, bookmarks, profile preferences and activity history.
- **Varsity and Medical catalogues:** institution/paper selection is driven by imported data; the question browser paginates results, filters by subject, shows per-subject counts and bookmarks, and orders subject groups canonically.
- **Flash Question:** subject-filterable practice setup, one question at a time, 30-second default with configurable duration, deadline-based timing, no repeats until a pool cycle is exhausted, skip/exit, answer feedback, summaries and persistent history.
- **Standard Exam:** uses the selected paper’s configured question count, duration and subject-selection rule when available; the general all-catalogue mode defaults to 100 questions/60 minutes. For the imported DU A Unit packs, select exactly four of the six subjects, with 15 questions per selected section (60 questions, 45 minutes). The active exam is a single continuously scrollable list, grouped in canonical subject order, with options under every question and a persistent Submit action. Answers stay keyed to question IDs and a serialized write queue drains before finalization; answer clearing, unanswered confirmation, timeout auto-submit, resume, results and review remain supported. Subjects with a missing source answer key are unavailable for scored section selection. The publisher-scan pattern remains illustrative because it differs from the official DU 2025–2026 notice, which also includes a written section; this is not a full official university exam.
- **Scoring integrity:** answer keys and marking rules carry verification status. The app does not present illustrative/unconfigured rules as official and does not score questions without a verified correct answer.
- **Local profile and activity:** Bangla/English preference, preferred Flash duration, progress summary, bookmarks and history persist locally.
- **Engineering:** intentionally presented as Coming Soon.

## Technology

- Expo SDK version ~57.0.31, React Native 0.86.3, TypeScript and Expo Router.
- Expo SQLite with versioned migrations and a serialized SqlDb adapter.
- NativeWind and local shared UI components/theme.
- Bangla and English translations; Bangla is the default language.
- Node's built-in test runner, with SQLite behavior tested via node:sqlite behind the shared database contract.

The project is independent of the original ScholarHub checkout. Reused UI/configuration foundations are copied/adapted into this repository; the app does not require ScholarHub at runtime or build time.

## Setup and development

Use the project's Node version (Node 22.23.1) before running commands:

    source "$HOME/.nvm/nvm.sh"
    nvm use 22.23.1
    pnpm install

Start Expo:

    pnpm start

**Expo Go SDK match:** this project uses Expo SDK 57. Every Expo Go build supports its own SDK version, so if Expo Go reports “Project is incompatible with this version of Expo Go”, install the matching **SDK 57 Android** build from [expo.dev/go](https://expo.dev/go), then restart Metro. Do not upgrade package versions just to silence the mismatch; an SDK upgrade should be a separate, tested migration. A dedicated development build is the release-oriented alternative.

Run the native Android development flow on a machine with the required Android toolchain and a connected device/emulator:

    pnpm android

## Verification commands

Run the focused automated checks from the project root:

    pnpm test
    pnpm typecheck
    pnpm lint
    pnpm exec expo config --type public
    pnpm doctor

Validate the JavaScript bundle without Hermes bytecode generation:

    pnpm exec expo export --platform android --no-bytecode

The checks last verified for the application pass are recorded in docs/QA_CHECKLIST.md. The standard pnpm export:android command currently fails when hermesc raises SIGILL on this ARM/NetHunter host. The no-bytecode export succeeds and validates Metro bundling, but it does not generate or verify an installable Android release artifact. Release build and physical-device checks remain outstanding.

## Question data and import

The initial genuine-content packs are:

- `data/question-packs/du-a-2024-2025.json` — 90 DU A Unit questions.
- `data/question-packs/du-a-2025-2026.json` — 90 DU A Unit questions.

Each pack stores the source PDF name/SHA-256, session, six subject sections, source page/question numbers and answer-key verification state. Three questions have no printed correct-answer letter and are intentionally excluded from scored practice. The original PDF scans remain outside the app repository at `/home/kali/gpt-workspace/bd-admission-app-data/`; they are not included in the mobile bundle.

Read:

- docs/QUESTION_DATA_SCHEMA.md for the version-1 pack contract.
- docs/QUESTION_IMPORT_WORKFLOW.md for extraction, verification, validation and import steps.

For a new/updated version-1 JSON pack, validate and regenerate the bundle index:

    pnpm packs:validate data/question-packs/your-pack-file.json
    pnpm packs:index

After rebuilding, startup sync imports changed bundled packs transactionally. Re-imports are idempotent and preserve attempts/bookmarks. Keep answer and marking-rule verification explicit, and keep the original source/page/question-number references.

## Architecture and project documents

- docs/PROJECT_CONTEXT.md — product scope and principles.
- docs/CURRENT_STATE.md — implementation state and limitations.
- docs/ARCHITECTURE.md — runtime, database, route and service design.
- docs/DECISIONS.md — accepted product/technical decisions.
- docs/TASK_STATE.md and docs/HANDOFF.md — completed work and next steps.
- docs/QA_CHECKLIST.md — automated results and checks still requiring a device or real content.
- docs/BRANDING.md — provisional product identity and local assets.
- docs/REUSE_INVENTORY.md — copied/adapted foundations and independence boundaries.

## Product principles

- Core catalog, practice, scoring, history and preferences must work offline.
- Preserve institution, paper/year/unit, source document, page and question-number provenance when supplied.
- Never assume question count, duration, subject distribution or scoring is the same across universities; verify the exact exam pattern from an official source and configure the matching paper/session. Do not fabricate, pad or truncate questions to meet a global count.
- Unknown answers and unverified marking rules must stay unknown.
- Validate and import content transactionally without damaging attempts or bookmarks.
- Do not automatically merge questions based only on similar wording.
- Keep synthetic test fixtures separate from genuine historical question packs.

## RU Unit A research (staged only)

The research folder `/home/kali/gpt-workspace/bd-admission-app-data/ru/` is now scoped to **RU Unit A only**. It contains a source/coverage register for 2010-2011 through the latest completed 2025-2026 session and eight review-only sample packs (21 questions). This is not a complete 15/16-year transcription: the the 2012-2013 to 2023-2024 Drive PDFs remain download-restricted/unreviewed; two 2025-2026 Group 1/2 scans are archived, but not fully transcribed. Read `A_UNIT_YEAR_COVERAGE.csv`, `RESEARCH_REPORT.md`, `SOURCE_REGISTER_A_ONLY.csv` and `REVIEW/ANSWER_AUDIT_A_ONLY.csv`. Nothing is bundled; do not run `pnpm packs:index` until a complete pack has been reviewed and deliberately copied into `data/question-packs/`.


## RU C Unit Science Group — imported for browse/review (2026-10-29)

The external source workspace remains at `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/`. The app now bundles 44 RU C Unit Science candidate packs containing **4,009 questions** from sessions 2010–2011 through 2025–2026, alongside the two existing DU A packs. There are 45 local PNG assets resolving all 46 question asset references; `QuestionCard` renders these local figures without adding a dependency.

**These are unverified candidates, not a verified past-paper bank.** Every RU question's content and answer key remains `unverified`; no RU scoring rules were configured, and the batch contributes zero scored-practice-eligible questions until content and keys are reviewed. The 158 source records with non-core subject labels and 18 no-option records remain excluded from the imported pack set and preserved externally for review. Fourteen questions still have duplicate option text. The imported data is third-party content and does not establish exact official session/group/set provenance.

See `data/question-packs/README.md`, `docs/CURRENT_STATE.md`, `docs/QUESTION_IMPORT_WORKFLOW.md`, and the audit folder `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/` for the import and verification boundary.
