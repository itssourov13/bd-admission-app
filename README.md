# BD Admission

A Bangladesh-focused, offline-first Android admission-preparation app for university (Varsity) and Medical admission questions. The app supports Bangla and English, question browsing, Flash Question practice, Standard Exam sessions, bookmarks, a local profile, and practice history. Engineering is visible as Coming Soon.

## Current implementation status

The core app implementation is wired across the Expo Router screens, SQLite database lifecycle, repositories, practice services, question-pack importer, and local user data. Automated checks pass as recorded in docs/QA_CHECKLIST.md.

This is **not yet a release sign-off**. Two DU A Unit packs are now bundled from the supplied scanned question-bank PDFs: 90 questions per session for 2024–2025 and 2025–2026, across six subject sections. The supplied answer-key letters are preserved; three questions without a printed key remain unanswered/unknown rather than guessed. The supplied publisher scan is a question-bank source, not an official DU past-paper notice. The official DU 2025–2026 notice describes 60 marks of MCQ plus 40 marks of written questions, with 45 minutes for each part ([official notice](https://www.du.ac.bd/du_post_details/news/25400)); its complete format differs from the scan’s four-of-six-subject MCQ-only practice pattern. That rule therefore remains **illustrative** and the app labels the selected-paper mode as question-bank practice, not a full official DU exam. Question-level local PNG figures are supported by the runtime; their sizing/readability still need physical-device QA. Two items are content-unverified and excluded from scored practice: one figure-only physics item and one mathematics formula whose scanned expression is unclear.

The app has not yet been validated on a physical Android device or emulator, and a normal Hermes bytecode export crashes on this ARM/NetHunter host. The successful no-bytecode export is a JavaScript bundle check, not an APK/AAB build.

## RU question bank sections — separate by source/status

The Varsity catalogue keeps two separate Rajshahi University entries:

- **`RU-V — Rajshahi University — Verified Question Bank`** is the user-confirmed verified source import from `RU Question Bank.pdf`. The previous 15-pack/1,815-question version was replaced by **15 packs / 1,828 questions** covering sessions 2016–2017 through 2024–2025 (units A, C, D1, F and H as represented in the PDF). Every imported question has `contentVerificationStatus: verified` and `answerVerificationStatus: verified`, with four non-empty options. This includes 1,800 single-choice questions, 22 source `X` records retained as `no_correct_option`, and 6 multi-answer records retained as `multiple_choice`. All have subject metadata for Physics, Chemistry, Biology, Higher Mathematics, ICT or English. No imported RU-V question is tagged `unverified` or `unknown`.
- **`RU — UNVERIFIED — University of Rajshahi`** remains the separate 44-pack, 4,009-question RU C Unit candidate bank imported earlier from third-party source pages. Its question/answer statuses, assets and provisional-practice rules were not altered by the RU-V replacement.

The RU Question Bank PDF has 156 pages and SHA-256 `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`. The user confirmed this source/question content as verified; the replacement task repaired extraction structure and imported the source, without repeating question-by-question fact checking. A total of **154** source records remain in the external exclusion ledger: 36 written-part items, 90 with incomplete option count/labels, 26 with missing extracted option text and 2 without an extracted answer marker. The 22 `X` and 6 complete multiple-answer records are included rather than discarded. A white Sutonny text-shadow on page 137 was filtered as a false banner and the printed B answer for Mathematics Q4 was recovered. No answer or option text was fabricated. Thirty included questions with repeated extracted option text are listed in the separate external warning audit. Pack/source/exclusion/reconciliation artifacts are outside the repo under `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/`.

The bundle contains **61 JSON packs / 6,017 questions**: 180 DU A Unit, 4,009 RU C candidates, and 1,828 RU-V verified-source questions. Within RU-V, 1,800 single-choice questions are eligible for the existing Flash/Standard practice pool; the 22 no-correct-option and 6 multiple-choice records remain verified/browsable but are not fed into the single-choice engine. The previous RU-V JSON files are backed up outside the repo. New pack imports replace only active appearances for their own RU-V paper IDs; old question rows and FK-backed bookmarks/session/answer history remain. No official RU paper-specific scoring/time pattern was inferred; general Standard Exam retains the 100-question/60-minute fallback. Device QA and a native release build are still pending.

## Main features

- **Offline-first data:** SQLite is the local source of truth for question content, paper/source references, exam attempts, answers, bookmarks, profile preferences and activity history.
- **Varsity and Medical catalogues:** institution/paper selection is driven by imported data; the question browser paginates results, filters by subject, shows per-subject counts and bookmarks, and orders subject groups canonically.
- **Flash Question:** subject-filterable practice setup, one question at a time, 30-second default with configurable duration, deadline-based timing, no repeats until a pool cycle is exhausted, skip/exit, answer feedback, summaries and persistent history.
- **Standard Exam:** uses the selected paper’s configured question count, duration and subject-selection rule when available; the general all-catalogue mode defaults to 100 questions/60 minutes. For the imported DU A Unit packs, select exactly four of the six subjects, with 15 questions per selected section (60 questions, 45 minutes). The active exam is a single continuously scrollable list, grouped in canonical subject order, with options under every question and a persistent Submit action. Answers stay keyed to question IDs and a serialized write queue drains before finalization; answer clearing, unanswered confirmation, timeout auto-submit, resume, results and review remain supported. Subjects with a missing source answer key are unavailable for scored section selection. The publisher-scan pattern remains illustrative because it differs from the official DU 2025–2026 notice, which also includes a written section; this is not a full official university exam.
- **Separate verified and provisional pools:** The original RU C Unit candidate entry remains separately labelled and uses a clearly labelled provisional pool of 3,991 structurally safe third-party candidates; 18 records with duplicate option text are withheld from that pool. The separate RU-V entry contains 1,828 user-confirmed verified-source records, all with verified content and answer states. Of these, 1,800 are single-choice and eligible for Flash/Standard practice; 22 preserve a source `X`/no-correct-option marker and 6 preserve multiple-correct source keys as `multiple_choice`, rather than being discarded or converted into single-choice. No RU official paper-specific score/marking rule is claimed.
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

For the repeatable Expo Go preview setup, tunnel/QR connection, continuous-use, reconnect, and stop steps, see [Expo local preview guide](docs/EXPO_LOCAL_PREVIEW.md).

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

**These are unverified candidates, not a verified past-paper bank.** Every RU question's content and answer key remains `unverified`; no RU scoring rules were configured. A separate provisional practice path supports 3,991 structurally safe single-choice items when the selected scope has no verified-eligible questions; feedback is based on third-party candidate keys and may be wrong. Eighteen records with duplicate normalized option text are withheld from provisional scoring (the earlier audit recorded 14 exact duplicate-option records). The 158 source records with non-core subject labels and 18 no-option records remain excluded from the imported pack set and preserved externally for review. The imported data does not establish exact official session/group/set provenance.

See `data/question-packs/README.md`, `docs/CURRENT_STATE.md`, `docs/QUESTION_IMPORT_WORKFLOW.md`, and the audit folder `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/` for the import and verification boundary.
