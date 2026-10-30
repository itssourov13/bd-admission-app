# Architecture

## Current implementation
Standalone Expo SDK 57 / React Native app using TypeScript, Expo Router and NativeWind. It borrows selected UI primitives and design tokens from the separate ScholarHub mobile client, but has its own branding, app identifiers, localization keys and Git history.

## RU source-bank separation (2026-10-29)

The catalogue distinguishes source collections using separate database institution IDs, not a shared RU display alias. `ru` (`RU`) is the original 4,009-question candidate bank and its visible name begins `UNVERIFIED —`; `ru-verified-bank` (`RU-V`) is the separate 1,828-question bank rebuilt from the user-designated verified PDF. Imported packs carry source-document SHA-256 and source page/question-number provenance. Every RU-V item is marked verified: 1,800 single-choice questions are eligible for the existing practice engine, 22 source `X` records are represented as `no_correct_option`, and 6 complete multi-letter keys are represented as `multiple_choice`. No RU-specific exam pattern is inferred. All packs still sync through the same transactional, idempotent importer.

## Runtime flow

    Expo Router screens (app/)
        -> hooks (useQuery, useNow) and common components
        -> services (practiceService, flashController, importer, contentSync; pure: scoring, timer, flash, exam, advice, subjects, examSelectionQueue)
        -> repositories (content, sessions, userData)
        -> SqlDb adapter (src/db/adapter.ts) -> expo-sqlite

The network is not part of this path. `DbProvider` gates the whole app: fonts + language + database must be ready before routes render.

## Routing (implemented)
- app/(tabs): index (Home), varsity, medical, profile
- app/institution/[id], app/paper/[id], app/browse
- app/flash/setup, app/flash/play
- app/exam/setup, app/exam/[id] (play)
- app/result/[id] (Flash and Exam results, also opened from History)
- app/history, app/bookmarks, app/engineering (Coming Soon)
Scope (category / institution / paper) travels in query params and is parsed defensively by `scopeFromParams`.

## Local database
Schema and migrations live in src/db/schema.ts (versioned via PRAGMA user_version; a failed migration rolls back and a newer-than-app database is refused). The SqlDb adapter serializes transactions because expo-sqlite shares one connection: statements outside a transaction wait for it, nested transactions are rejected. Questions are separate from paper appearances so one question keeps several verified references. User data (profile, bookmarks, sessions, answers) is keyed by question id and never touched by content re-imports.

Eligible practice pool = answer_status verified, single choice, at least 2 options, at least one correct option.

## Subject ordering and active exam selections

The `subjects` service defines the shared canonical Science-first order (Physics, Chemistry, Biology, Higher Mathematics, Bangla, English, ICT), puts any additional data-backed subject names after those entries, and groups active exam questions by subject for presentation only. A question's ID and stored position remain unchanged, so scoring and persisted answers are independent of display grouping. The read-only browser counts all source questions per subject and queries in canonical-subject then printed-question order. Flash/Standard normally use the verified pool; a distinct provisional pool can be chosen by setup only when the current scope has no verified-eligible questions. That pool excludes duplicate-option and structurally unsupported candidates and persists a `reviewUnverified` marker in the session for warnings/review.

The active Standard Exam uses a virtualized `SectionList` as one continuous scrollable page and renders each question's options in place. `examSelectionQueue` serializes answer writes in tap order, tracks failed latest selections, rolls back refused/failed UI changes to the last known persisted value, and requires a successful drain before finalization. The absolute session deadline and SQLite's exactly-once finalization remain authoritative.

## Timer and scoring boundaries
Implement timer deadlines and transitions in pure domain services. Persist an absolute deadline or sufficient timing metadata so background/resume does not silently reset time. Make timeout and submit transitions idempotent.

Scoring accepts an explicit exam rule. A rule with unknown or illustrative status must not be presented as an official score. Likewise, unverified candidate answer keys must not be promoted to verified: the provisional mode may compare a response to the source key for feedback/accuracy, but the UI must state that the key may be wrong and must not imply an official score. The general all-catalogue Standard Exam uses a 100-question/60-minute fallback. When an exact paper is selected, setup/session creation consumes the paper rule for question count, duration and optional subject-section selection; those values drive eligibility, question selection, section counts, deadline and UI copy. A rule may drive the practice mechanics while remaining `illustrative`; this is how the DU question-bank example is handled because its scan differs from the official DU 2025–2026 MCQ + written format.

Exam pattern data should preserve, where officially available: total question count, duration, subject/section allocation, marks for correct answers, penalty for incorrect answers and marks for unanswered questions. Do not combine papers with incompatible patterns into one Standard Exam merely to reach a fixed question threshold. Optional section selection is represented by a versioned selection-config field in the exam rule; preserve any pattern that the schema cannot represent and do not silently flatten it.

## Question content import
A versioned question pack is validated before import. The contract records category, batch identity, source documents, institutions, papers, question text/options, correct-answer verification, appearances, source-page metadata and optional scoring/exam rules. Each exam pattern must be tied to the appropriate paper identity and verified against its source; do not copy RU's question count, duration or marking scheme to another institution. Database import should occur in a transaction and return counts for inserted, updated, skipped and rejected records.

See QUESTION_DATA_SCHEMA.md and QUESTION_IMPORT_WORKFLOW.md.

Initial real content now includes two University of Dhaka A Unit packs (2024–2025 and 2025–2026), 90 questions each across six 15-question sections. The packs retain source PDF hashes and page/question provenance. Three questions with no printed answer letter are stored with unknown answer status. The source scan's 60-question/45-minute/+1/−0.25/four-of-six-section rule metadata remains illustrative because the official DU 2025–2026 notice describes 60 MCQ marks plus 40 written marks, 45 minutes each. The runtime supports the scan's four-of-six MCQ practice pattern but does not claim it reproduces the complete official exam. General scopes keep the 100-question/60-minute fallback.

## Dependencies and environment
The source mobile project uses Expo SDK 57, React Native 0.86, NativeWind and a pnpm configuration tuned for Android/Termux file behavior. The new app keeps compatible versions and the pnpm configuration; use Node 22 from .nvmrc before installs and checks.

## Branding and source independence

The app name, slug, app scheme, application ID, taglines and palette are centralized in brand.config.json. app.config.js uses that file to define Expo identity, launcher icon, Android adaptive icon and splash image. src/brand.ts, src/theme.ts and tailwind.config.js read the same brand configuration.

The current identity is provisional and can be renamed by editing brand.config.json. Local brand assets live in assets/brand: app-icon.png, adaptive-icon.png, splash-icon.png, logo-mark.png and brand-mark.svg.

All reusable code needed for the prepared foundation is stored inside this repository. Runtime source files, package configuration and build configuration do not require the original source checkout. docs/REUSE_INVENTORY.md is provenance documentation only.

## External RU Unit A intake (not bundled)

RU Unit A research and sample packs are staged outside this repository at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`. The external directory contains a year ledger for 2010-2011 through the latest completed 2025-2026 session, eight review-only A-only packs (21 questions), source URLs and an answer audit. Twelve third-party year-specific PDFs are located for 2012-2013 to 2023-2024 but remain download-restricted/unreviewed; 2010-2012 combined archives need historical A1-A6 mapping. Two seven-page 2025-2026 Group 1/2 scans are archived at `ru/sources/2025-2026/`; they are image-only and not fully transcribed.

This is intentionally separate from `data/question-packs/`: app startup only syncs packs referenced by the generated in-repository `src/content/bundledPacks.ts`. External validation does not import anything. Preserve exact session, group/shift/set, source page and question number. Keep uncertain answers unverified/unknown and do not configure exam rules from a secondary question-bank page. Only a complete, reviewed and approved pack should be copied into `data/question-packs/`, then validated and bundled explicitly.
