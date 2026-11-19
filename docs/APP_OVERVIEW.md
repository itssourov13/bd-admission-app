# BD Admission — product and engineering overview

Last updated: 2026-11-19

## Product

BD Admission is an offline-first Android app for Bangladesh university (Varsity) and Medical admission preparation. The interface supports Bangla and English. Question content, bookmarks, profile preferences, practice attempts and history are stored locally in SQLite. Engineering is currently shown as Coming Soon.

## User-facing capabilities

- Institution and paper catalogues for university and medical admission content.
- Question browsing with paper/session context, subject filters, source provenance, bookmarks and local figures.
- Flash Question practice with timed, one-question-at-a-time interaction, feedback and persistent history.
- Standard Exam sessions that use paper-specific rules when a complete usable configuration exists. General practice and selected papers without a supported exam pattern use explicit Custom Practice instead of inheriting an invented official pattern.
- Scrollable exam question lists, answer persistence, review flags, result summaries and configurable marking profiles.
- A separate Publications & Books area for standalone question-bank/library material. Library book practice remains scoped to that book and does not inherit university exam rules.

## Current bundled content

The combined local seed contains **231 entries / 16,407 question rows / 66,793 options**, including **230 Varsity question-pack files / 14,579 university questions** and one separate ASPECT Library publication (1,828 questions / 26 units). The shared question-figure asset index contains 65 local assets; university logos are maintained separately.

### University of Chittagong — A Unit Science

The CU A Unit historical collection is integrated into the Varsity catalogue under institution `cu` / code `CU`: 26 papers, 2,558 questions, 11,397 options and 68 source documents. The source-question content is verified under the owner's prior Muse AI review; answer states remain distinct at 2,185 verified / 373 unverified. The normal practice pool contains 2,185 verified-eligible questions; unverified answers remain Browse-only for CU because every CU paper has a verified pool. The partial 2025–26 rule does not enable an official scored Standard Exam; older paper rules remain unconfigured.

The university's original website PNG logo is bundled in `assets/universities/cu.png` and registered through the existing university logo component.

### Rajshahi University — Science

The curated RU Science addition is in the active Varsity catalogue under institution `ru` / code `RU`: 46 papers, 4,249 questions, 16,996 options, 90 source documents and 45 PNG assets. Source unit labels are preserved (44 C Unit — Science, one D1 Unit and one F Unit). Of the 4,249 questions, **4,144 are verified in both answer and content dimensions**; 105 remain unresolved and browseable but outside the normal verified practice pool. No paper-specific `examRules` were inferred. The existing RU 2024–25 Marking Profile remains separate from exam-pattern configuration.

### Other content and separation rules

- DU, JU and HSTU question banks are maintained in the active Varsity catalogue with their own paper/session/source metadata and answer-verification states.
- JU-U and HSTU-U remain separately identified unverified candidate collections; candidate keys are not described as verified or official.
- The RU-V question bank is represented separately as an ASPECT Library publication (1,828 questions); it is not merged into the active RU varsity question pool.
- The historic RU Lokkho candidate archive remains external and unverified.
- GST content remains deferred.

For exact per-source counts, dispositions, provenance and import history, use [CURRENT_STATE.md](CURRENT_STATE.md), [QUESTION_IMPORT_WORKFLOW.md](QUESTION_IMPORT_WORKFLOW.md), [RUV_ASPECT_IMPORT.md](RUV_ASPECT_IMPORT.md), and the source audit records under `docs/audits/`.

## Exam and verification integrity

Question answer verification, question-content verification, paper exam rules and user-selectable marking profiles are distinct concepts. Unknown or unverified source keys remain explicit. The app does not invent question quotas, durations, subject distributions or official marking values. Paper-specific Standard Exam becomes available only when an adequate stored pattern exists; Custom Practice remains available for other question scopes and is explicitly unscored where no suitable scoring rule applies.

## Technology and architecture

- **App:** React Native, Expo SDK 57, Expo Router and TypeScript.
- **Styling:** NativeWind with shared theme/brand tokens and Bangla/English translations.
- **Data:** SQLite is the local source of truth; canonical question packs are versioned JSON files under `data/question-packs/`.
- **Bundling:** `scripts/build-content.mjs` validates the source packs and generates a compact manifest plus an ignored SQLite seed database. EAS regenerates the seed before native prebuild.
- **Runtime:** transactional, idempotent and recoverable seed synchronization; content sync does not overwrite user-owned profile, bookmark or practice-history tables.

See [ARCHITECTURE.md](ARCHITECTURE.md), [QUESTION_DATA_SCHEMA.md](QUESTION_DATA_SCHEMA.md), and [STARTUP_PERFORMANCE.md](STARTUP_PERFORMANCE.md).

## Development and verification

Use Node.js **22.23.1** and pnpm **11.10.0**. Typical local setup:

```sh
nvm use 22.23.1
pnpm install --frozen-lockfile
pnpm start
```

Focused verification commands:

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm content:check
pnpm packs:validate
pnpm question-assets:check
```

At the November 18, 2026 pre-CU v0.1.10 release checkpoint, source checks passed: 301/301 tests, typecheck, lint, content freshness (205 / 13,849), pack validation (204 / 12,021, zero errors), asset validation (65 assets / 66 references) and ASPECT attestation. The Android EAS preview APK was built and owner-tested on a physical phone. The owner reports normal operation in the checks performed; some answer explanations have formatting issues queued for a grouped follow-up. See [QA_CHECKLIST.md](QA_CHECKLIST.md) and [ANDROID_RELEASE.md](ANDROID_RELEASE.md).

## Key project documents

| Document | Purpose |
|---|---|
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Product and source-content context |
| [CURRENT_STATE.md](CURRENT_STATE.md) | Current implementation and content state |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Runtime, database, routes and services |
| [DECISIONS.md](DECISIONS.md) | Accepted product and technical decisions |
| [TASK_STATE.md](TASK_STATE.md) / [HANDOFF.md](HANDOFF.md) | Task tracking and next actions |
| [QA_CHECKLIST.md](QA_CHECKLIST.md) | Automated and owner/device verification |
| [ANDROID_RELEASE.md](ANDROID_RELEASE.md) | EAS profiles, Android delivery and release process |
| [EXAM_RULE_RESEARCH.md](EXAM_RULE_RESEARCH.md) | Source-backed official exam-pattern facts and gaps |
| [QUESTION_QUALITY_AUDIT.md](QUESTION_QUALITY_AUDIT.md) | Question-quality review and follow-up leads |
| [BRANDING.md](BRANDING.md) | Brand identity and assets |
