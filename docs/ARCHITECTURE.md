# Architecture

## Current foundation
Standalone Expo SDK 57 / React Native app using TypeScript, Expo Router and NativeWind. It borrows selected UI primitives and design tokens from the separate ScholarHub mobile client, but has its own branding, app identifiers, localization keys and Git history.

## Intended runtime flow

    Expo Router screens
        -> feature components and hooks
        -> repository interfaces
        -> Expo SQLite database
        -> local question, source, attempt, answer, bookmark and profile data

The network is not part of this path. Core browsing and practice must work when the device is offline. A future sync feature, if ever chosen, must remain optional and must not make local practice unavailable.

## Routing
- app/(tabs)/index.tsx: Home
- app/(tabs)/varsity.tsx: Varsity catalogue entry point
- app/(tabs)/medical.tsx: Medical catalogue entry point
- app/(tabs)/profile.tsx: local profile entry point
- app/university/[id]/: specific university and its papers
- app/practice/: Flash and Standard session setup/flows
- app/results/[attemptId]/: saved attempt review

The four tabs are a starter shell. Most deeper routes and feature behavior remain to be implemented.

## Local database plan
Use Expo SQLite, ordered schema migrations and a versioned schema contract. Keep question content separate from exam paper appearances so one concept/record can preserve multiple verified historical references. Keep question packs and import batches auditable. Store user-owned attempt answers and bookmarks with stable IDs and avoid destructive content updates.

Use parameterized SQL, indexes for common browse/filter queries and transactions for multi-row imports and attempt finalization. The import must be idempotent. Never replace the entire user-data database to update question content.

Planned entities include institutions, papers, questions, options, question appearances/source references, exam rules, import batches, profile/preferences, bookmarks, practice sessions, session questions and session answers. The final normalized schema and migrations are implementation work, not yet present.

## Timer and scoring boundaries
Implement timer deadlines and transitions in pure domain services. Persist an absolute deadline or sufficient timing metadata so background/resume does not silently reset time. Make timeout and submit transitions idempotent.

Scoring accepts an explicit exam rule. A rule with unknown or illustrative status must not be presented as an official score. Standard Exam can start only when 100 eligible, sufficiently configured questions are available.

## Question content import
A versioned question pack is validated before import. The contract records category, batch identity, source documents, institutions, papers, question text/options, correct-answer verification, appearances, source-page metadata and optional scoring rules. Database import should occur in a transaction and return counts for inserted, updated, skipped and rejected records.

See QUESTION_DATA_SCHEMA.md and QUESTION_IMPORT_WORKFLOW.md.

## Dependencies and environment
The source mobile project uses Expo SDK 57, React Native 0.86, NativeWind and a pnpm configuration tuned for Android/Termux file behavior. The new app keeps compatible versions and the pnpm configuration; use Node 22 from .nvmrc before installs and checks.

## Branding and source independence

The app name, slug, app scheme, application ID, taglines and palette are centralized in brand.config.json. app.config.js uses that file to define Expo identity, launcher icon, Android adaptive icon and splash image. src/brand.ts, src/theme.ts and tailwind.config.js read the same brand configuration.

The current identity is provisional and can be renamed by editing brand.config.json. Local brand assets live in assets/brand: app-icon.png, adaptive-icon.png, splash-icon.png, logo-mark.png and brand-mark.svg.

All reusable code needed for the prepared foundation is stored inside this repository. Runtime source files, package configuration and build configuration do not require the original source checkout. docs/REUSE_INVENTORY.md is provenance documentation only.
