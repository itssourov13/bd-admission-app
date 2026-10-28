# BD Admission

A Bangladesh-focused, offline-first Android admission-preparation app for university (Varsity) and Medical admission questions. The app supports Bangla and English, question browsing, Flash Question practice, Standard Exam sessions, bookmarks, a local profile, and practice history. Engineering is visible as Coming Soon.

## Current implementation status

The core app implementation is wired across the Expo Router screens, SQLite database lifecycle, repositories, practice services, question-pack importer, and local user data. Automated checks pass as recorded in docs/QA_CHECKLIST.md.

This is **not yet a release sign-off**. No real historical question PDFs have been supplied, so the installed app currently has no genuine question catalogue and correctly shows empty-content states. The app has not yet been validated on a physical Android device or emulator, and a normal Hermes bytecode export crashes on this ARM/NetHunter host. The no-bytecode export is a JavaScript bundle check, not an APK/AAB build.

## Main features

- **Offline-first data:** SQLite is the local source of truth for question content, paper/source references, exam attempts, answers, bookmarks, profile preferences and activity history.
- **Varsity and Medical catalogues:** institution/paper selection is driven by imported data; the question browser paginates results and supports bookmarks.
- **Flash Question:** one question at a time, 30-second default with configurable duration, deadline-based timing, no repeats until a pool cycle is exhausted, skip/exit, answer feedback, summaries and persistent history.
- **Standard Exam:** starts only when 100 eligible questions are available; 60-minute deadline; question grid, answer revision/clearing, manual submission confirmation, timeout auto-submit, results and answer review.
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

No real historical question records are bundled yet. The user will provide source PDFs in institution/category batches. Do not create fictional content and label it as historical.

Read:

- docs/QUESTION_DATA_SCHEMA.md for the version-1 pack contract.
- docs/QUESTION_IMPORT_WORKFLOW.md for extraction, verification, validation and import steps.

Create a version-1 JSON pack, then validate and index it:

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
- Unknown answers and unverified marking rules must stay unknown.
- Validate and import content transactionally without damaging attempts or bookmarks.
- Do not automatically merge questions based only on similar wording.
- Keep synthetic test fixtures separate from genuine historical question packs.
