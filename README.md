# BD Admission

A Bangladesh-focused, offline-first admission preparation app for historical university and Medical admission questions, with Flash Question and Standard Exam practice.

## Current status

This repository is the prepared project foundation for the next implementation phase. It contains a standalone Expo/React Native scaffold, adapted reusable UI components from the author's ScholarHub mobile app, Bangla/English localization foundation, initial navigation shell, project documentation, a versioned question-pack contract and a working question-pack validator.

The full question catalogue, production SQLite schema/repositories, complete practice flows, scoring engine and final UI are not yet complete. No real historical question PDFs or verified question records have been imported. Placeholder screens are intentionally identified as scaffolding.

## Technology

- Expo SDK 57, React Native 0.86, TypeScript
- Expo Router, NativeWind and a reused design-token/component system
- Expo SQLite is the planned on-device source of truth; it is configured as a dependency but the full runtime schema is still to be implemented
- Bangla and English localization with locally persisted language preference
- Node's built-in test runner for the question-pack validator

## Setup

Use the Node version in .nvmrc (22.23.1) before installing dependencies. The current machine's initially observed Node version was v24.19.0, which is outside this project's declared Node 22 engine range.

Install dependencies with pnpm in this directory, then use the scripts declared in package.json for development, typechecking, linting, import-validator tests and Android export. Dependency installation and Expo bundling were intentionally not claimed in the foundation preparation.

## Question data

No historical questions are included yet. Review docs/QUESTION_DATA_SCHEMA.md and docs/QUESTION_IMPORT_WORKFLOW.md before creating a question batch. Validate JSON with:

    node scripts/validate-question-pack.mjs path/to/question-pack.json

Run focused validator tests with:

    pnpm test:import

## Documentation

Read docs/PROJECT_CONTEXT.md, docs/ARCHITECTURE.md, docs/REUSE_INVENTORY.md, docs/BRANDING.md and docs/HANDOFF.md before continuing implementation.

## Product principles

- Core question browsing and practice must work offline from local data.
- University, exam year, paper and source provenance must remain traceable.
- Unknown answers and unverified scoring rules must remain explicitly unverified.
- New question packs must be validated and imported idempotently without damaging attempts or bookmarks.
- The app must not present demo content as historical examination content.

## Branding

The provisional name, app identity, taglines and palette are centralized in brand.config.json. See docs/BRANDING.md for icon, adaptive icon, splash and logo asset details.
