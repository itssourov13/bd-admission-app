# Question import workflow

## Current status
Validator, transactional idempotent importer, startup sync and pack index generator are implemented. Two initial DU A Unit packs are bundled from the supplied scanned PDFs: 90 questions for 2024–2025 and 90 for 2025–2026 (15 questions per section for Physics, Chemistry, Higher Mathematics, Biology, Bangla and English). The app auto-imports the generated bundle at startup.

## Initial real-data batch: DU A Unit

| Session | Pack | Questions | Printed answer key missing | Source SHA-256 |
|---|---|---:|---|---|
| 2024–2025 | `data/question-packs/du-a-2024-2025.json` | 90 | Physics Q15 | `93d5111f4bdb643ed1b22e02688bea44bb34010635d3c56422dd295ab78991da` |
| 2025–2026 | `data/question-packs/du-a-2025-2026.json` | 90 | Physics Q4; English Q4 | `74d7b7deed19b134f0966f69935141aae4dae11095349ddfc7d4e7c325487d2b` |

The source prints 15 questions for each of six subject sections and says candidates answer any four sections, for 60 MCQs in 45 minutes, +1 for correct and −0.25 for wrong. The Standard Exam runtime now supports this configured count, duration and four-of-six section selection for the selected paper. The [official DU 2025–2026 admission notice](https://www.du.ac.bd/du_post_details/news/25400), published 13 October 2025, states 60 marks of MCQ and 40 marks of written questions, with 45 minutes for each. The supplied publisher scan instead shows a 60-question MCQ-only mock and an any-four-of-six subject-section scheme. This is a known mismatch, so do not upgrade the publisher-derived rule to `verified`; the app must label this as question-bank practice, not full official DU simulation. The user-provided PDFs are retained unchanged outside the application repository; their hashes above tie each pack to its source. Per task scope, the question facts were not externally re-verified. Source items with figure-based choices are represented by text descriptions where reasonable; a figure-only physics item and an unclear mathematics formula have `contentVerificationStatus: unverified`; both are excluded from scored practice until the missing diagram/clear source transcription is resolved.

## Creating and shipping a pack
1. Write a version-1 JSON file following docs/QUESTION_DATA_SCHEMA.md (institutions, papers, rules, source documents, questions with options and appearances). Keep year, source filename, page and question number exactly as in the PDF. Mark answers `verified` only when an official key was checked.
2. Validate: `pnpm packs:validate data/question-packs/<file>.json`. Errors name the offending record; fix them before continuing.
3. Run `pnpm packs:index` to regenerate src/content/bundledPacks.ts (invalid packs are refused with the same messages).
4. Rebuild the app. On next launch `syncBundledPacks` imports new/changed packs in one transaction each; unchanged packs are skipped by signature; a failed pack rolls back completely and shows a warning on Home while the rest keep working.
5. Bookmarks, sessions and answers are keyed by question id and survive re-imports.

## Validate a pack
Run from the project root:

    node scripts/validate-question-pack.mjs path/to/question-pack.json

The command reports pass/fail and error/warning totals. Errors return a non-zero exit code. Warning states, such as a non-verified answer or an empty pack, must be reviewed before import.

## Required pipeline for the implementation phase
1. Preserve the original user-supplied PDF outside public app assets and keep an immutable source copy.
2. Extract questions/options and keep a record of source filename, page number, original question number, paper/year/unit and extraction uncertainty.
3. Verify question text, option order, answer key and official exam reference. Do not infer an answer when no reliable key exists.
4. Generate version-1 JSON following QUESTION_DATA_SCHEMA.md; keep uncertain facts unverified.
5. Validate structure, identifiers, relationships, option references, year/page/number values, and answer/scoring state.
6. Review warnings and produce a human-readable import report.
7. Import using a single SQLite transaction with stable IDs/upsert rules. Roll back the whole batch after an unexpected write failure.
8. Preserve past practice attempts and bookmarks when the content pack is updated.
9. Verify per-batch record counts, paper/source appearances, answer state, option ordering and duplicate behavior.
10. Record batch identity, source-file hash when available, validation outcome, import timestamp and resulting row counts.

## Idempotency and duplicate handling
Re-importing the same batch must not create duplicate questions or source appearances. A similar-looking question from a different paper should not be merged automatically. Keep appearance/source provenance separate from question content and require an explicit review to merge or correct content.

## Image/diagram questions
Store referenced assets in local app content packs with stable relative paths. Validate every referenced asset before importing and include it in offline packaging. Do not depend on remote image URLs at question-render time.

## Still pending
- Keep the publisher-derived DU A Unit rule `illustrative`: it is known to differ from the official 2025–2026 admission notice (MCQ + written sections). Only replace/verify it with a matching primary source for the exact paper/session.
- Proper diagram/image option asset support in the question renderer; initial diagram-based choices are described in text where practical.
- Additional human line-by-line review of the question transcription/display and Android device QA.

## RU research intake checkpoint — 2026-10-29

The initial RU online research and a small review-only sample are stored externally at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`:

- `RESEARCH_REPORT.md` — official 2025-2026 pattern evidence, tentative 2026-2027 schedule status, source-quality assessment and app integration plan.
- `SOURCE_REGISTER.csv` / `.json` — source URLs, confidence notes and limitations.
- `REVIEW/ANSWER_AUDIT.csv` — per-question answer state, calculation/source and review note.
- `staging/ru-a-2024-2025-group-2-review.json` — 3 A Unit candidate keys, all unverified.
- `staging/ru-b-2023-2024-bangla-review.json` — 2 B Unit Bangla questions with independently cross-checked answers; original paper provenance is still provisional.
- `staging/ru-c-2024-2025-higher-math-1-review.json` — 4 C Unit Higher Mathematics questions with independently calculated answers; original paper provenance is still provisional.

All 3 packs passed schema-v1 validation on initial draft review; expected warnings appear only for the three deliberately unverified A Unit answer keys. They remain external review material. Nothing was copied into `data/question-packs/`, `pnpm packs:index` was not run for them, and no RU content is bundled in the app as a result of this work.

The official guide found during research describes 2025-2026 as an 80-question/100-mark, one-hour MCQ pattern, with unit-specific subject splits: A uses Bangla/English/GK; B has commerce and non-commerce layouts; C has science subject-choice and non-science variants. Do not assume this exact pattern remains official for 2026-2027. See the external research report for the official PDF URLs and the reported *tentative* dates.

Next intake gate: acquire the official question scan where available, compare every transcription/option/answer and paper identity, then get a human review of `ANSWER_AUDIT.csv`. Only after approval copy a pack into `data/question-packs/`, run `pnpm packs:validate`, `pnpm packs:index`, and focused import tests. Do not use external staged drafts as a release-ready complete paper.
