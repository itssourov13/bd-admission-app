# Question import workflow

## Current status
Validator, transactional idempotent importer, startup sync and pack index generator are implemented. The bundle includes two DU A Unit packs (90 questions per session), the original 4,009-question unverified RU candidate bank, and the new separate RU-V source bank described below. The app auto-imports generated packs at startup.


## RU Question Bank.pdf — verified-source rebuild and replacement (2026-10-30)

- Source: `/home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf`, 156 pages, SHA-256 `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`. The user confirmed the source and question content are verified; this task is extraction/structure repair and import, not question-by-question re-verification.
- Rebuilt **15 packs / 1,828 MCQ questions** from sessions 2016–2017 through 2024–2025 across the A, C, D1, F and H papers/sets in the PDF. Every imported record has `contentVerificationStatus: verified` and `answerVerificationStatus: verified`; all source answer markers are represented without inference. This includes 1,800 single-choice records with one correct option, 22 `X` records represented as `answerDisposition: no_correct_option` with an explicit empty correct-option array, and 6 multi-letter-key records represented as verified `multiple_choice` items with each printed correct letter mapped to an option. No imported question carries `unknown` or `unverified` status.
- Subject metadata is populated for all imported questions: Physics 383, Higher Mathematics 512, Chemistry 365, Biology 502, ICT 54, English 12. The source-page/printed-question provenance is retained. 1,666 old question IDs were reused where the source locator was unique; 162 received deterministic IDs for new records or ambiguous same-page/number collisions.
- **154 source records are explicitly excluded** from the MCQ packs and retained in external `EXCLUSION_MANIFEST.csv`: 36 written-part items; 90 with incomplete option count/labels; 26 with one or more option labels but missing extracted option text; and 2 records without an extracted answer marker. The 22 `X` records and 6 complete multiple-answer records are imported with their source meaning intact, not excluded. No option text or answer was fabricated. A false white text-shadow on page 137 was fixed so Q4's printed B marker is captured; section identity remains the preceding Mathematics section. A separate `IDENTICAL_OPTION_TEXT_AUDIT.csv` logs 30 included questions whose extracted choices contain repeated text; their source text/status is not silently edited.
- The 15 previous RU-V JSON packs were backed up under `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/backups/old-app-packs-2026-10-30/` and replaced in-place with the rebuilt data. `replaceExistingPaperContent: true` instructs the importer to clear only active appearances for each of these 15 RU-V paper IDs before re-adding the new set. Old question rows and their bookmarks, session questions, answers and result history remain for historical references; removed items no longer appear in the active paper catalogue or practice pool.
- The current RU-V verified bank has **1,800 single-choice questions** in the existing Flash/Standard eligible pool. The 22 verified no-correct-option records and 6 verified multiple-choice records remain available as source records but are not forced into the single-choice practice engine.
- The original `ru` / 4,009-question RU C Unit Science candidate bank is a separate dataset and is retained unchanged. The two DU packs also remain unchanged. The new bundle total is **61 packs / 6,017 questions**: 180 DU + 4,009 RU C candidates + 1,828 RU-V verified-source questions.
- No RU-specific duration, marking scheme, question count or section rule was inferred. General Standard Exam continues to use the existing 100-question/60-minute fallback.
- External build/reconciliation artifacts: `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/IMPORT_BUILD_SUMMARY.json`, `PACK_RECONCILIATION.csv`, `EXCLUSION_MANIFEST.csv`, `IDENTICAL_OPTION_TEXT_AUDIT.csv`, `subject-audit.json`, and the extraction source/workspace.

## Initial real-data batch: DU A Unit

| Session | Pack | Questions | Printed answer key missing | Source SHA-256 |
|---|---|---:|---|---|
| 2024–2025 | `data/question-packs/du-a-2024-2025.json` | 90 | Physics Q15 | `93d5111f4bdb643ed1b22e02688bea44bb34010635d3c56422dd295ab78991da` |
| 2025–2026 | `data/question-packs/du-a-2025-2026.json` | 90 | Physics Q4; English Q4 | `74d7b7deed19b134f0966f69935141aae4dae11095349ddfc7d4e7c325487d2b` |

The source prints 15 questions for each of six subject sections and says candidates answer any four sections, for 60 MCQs in 45 minutes, +1 for correct and −0.25 for wrong. The Standard Exam runtime now supports this configured count, duration and four-of-six section selection for the selected paper. The [official DU 2025–2026 admission notice](https://www.du.ac.bd/du_post_details/news/25400), published 13 October 2025, states 60 marks of MCQ and 40 marks of written questions, with 45 minutes for each. The supplied publisher scan instead shows a 60-question MCQ-only mock and an any-four-of-six subject-section scheme. This is a known mismatch, so do not upgrade the publisher-derived rule to `verified`; the app must label this as question-bank practice, not full official DU simulation. The user-provided PDFs are retained unchanged outside the application repository; their hashes above tie each pack to its source. Per task scope, the question facts were not externally re-verified. Source items with figure-based choices are represented by text descriptions where reasonable; a figure-only physics item and an unclear mathematics formula have `contentVerificationStatus: unverified`; both are excluded from scored practice until the missing diagram/clear source transcription is resolved.

## Creating and shipping a pack
1. Write a version-1 JSON file following docs/QUESTION_DATA_SCHEMA.md (institutions, papers, rules, source documents, questions with options and appearances). Keep year, source filename, page and question number exactly as in the PDF. For a user-confirmed verified source, preserve its approved status when the source key is unambiguous. If the source key is missing or extraction cannot map it reliably, retain `unknown` rather than guessing. For secondary/unreviewed sources, do not promote answers to verified without the required review.
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
- Android device-level visual review of local question figures remains outstanding; the app now has a generated static local-PNG asset map and QuestionCard rendering.
- Additional human line-by-line review of the question transcription/display and Android device QA.

## RU Unit A intake checkpoint — 2026-10-29

The current A-only research bundle lives outside the app at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`:

- `RESEARCH_REPORT.md` — findings, source quality, collection gaps and app integration plan.
- `A_UNIT_YEAR_COVERAGE.csv` / `.json` — session coverage from 2010-2011 through 2026-2027.
- `SOURCE_REGISTER_A_ONLY.csv` / `.json` — official portal, historical pages and twelve third-party PDF links for 2012-2013 through 2023-2024.
- `REVIEW/ANSWER_AUDIT_A_ONLY.csv` — per-question candidate answer, status and evidence notes.
- Eight external sample JSON files in `staging/`, with 21 questions across sessions 2012-2013, 2013-2014, publisher-labelled 2018 (academic session unconfirmed), 2019-2020, 2022-2023, 2023-2024, 2024-2025 and 2025-2026.

The 2012-2013 to 2023-2024 linked historical PDFs were found but the Drive downloads are restricted, so source discovery is not full collection. The 2025-2026 Group 1/2 seven-page image scans have been archived locally but require full transcription and key review. The 2010-2012 combined archive requires old A1-A6 mapping. No pack has been copied into `data/question-packs/`, no index was regenerated, and no RU data is bundled.

Next gate: acquire source papers, compare all questions/options/answers against original pages, preserve group/shift/set variants, then human-review a complete pack. Validate external drafts with `pnpm packs:validate /absolute/path/to/pack.json`. After approval, copy the pack into the app repo, regenerate the index and run importer tests. Do not add scoring/count/time rules without the exact session/paper's official source.


## RU C Unit Science Group collection — external import staging (2026-10-29)

External staging root: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/`. The Lokkho public index exposed 44 C Unit Science-labelled variants. The paginated capture extracted 4,185 source records and matched counts for 44/44 variants. `source-capture/lokkho/` preserves 4,167 records with usable options. The curated `import-ready/lokkho/` folder contains 4,009 candidates across 44 schema-v1 packs, limited to Physics, Chemistry, ICT, Biology and Higher Mathematics.

A further 158 records with other source subject labels are retained in `REVIEW/LOKKHO_OFFSCOPE_SUBJECT_AUDIT.csv` for matching-session review, not silently discarded. Another 18 records lacking usable options are listed in `REVIEW/LOKKHO_EXCLUDED_INCOMPLETE_ITEMS.csv`. The five-subject curation aligns with the recently published C Unit Science structure but does not prove identical scope in every older session; source suffixes remain as third-party labels, not official group/set identities. Full counts and source references are in the external `research/IMPORT_READINESS.md` and `research/LOKKHO_PACK_COLLECTION_SUMMARY.csv`.

Each curated pack validates successfully: 44/44, zero schema errors. There are 4,023 warnings: all 4,009 candidate answer keys remain unverified and 14 records have exact duplicate option text. No answer key was independently verified against an official RU key, and all retained content status fields remain `unverified`. A schema pass does not establish official-paper authenticity, transcription correctness, subject attribution, or answer accuracy.

Forty-five local image/SVG assets are stored under external `import-ready/assets/lokkho/`; all 46 references in curated packs resolve. The later app import normalized the 41 PNGs plus the WebP/SVG assets to 45 local PNGs in the app copy, kept the external originals unchanged, and added a generated static asset map plus `QuestionCard` rendering. Android visual verification of those figures remains outstanding.

A separate 265-page third-party scan indexes 14 additional variants from 2017-2018 through 2024-2025. Full-page and column OCR cover 84 indexed question/key pages, but the text is unverified, pages 205-265 remain unclassified, and this material has not been merged. Some historical year links are Drive-restricted. The 20 SattAcademy first-page sample packs (300 records) remain partial and separate.

**Historical staging checkpoint:** before the explicit import request, this batch was not bundled. The current import decision is recorded in the dated checkpoint below; imported candidate data remains unverified and is not approved for scored practice.


## RU C Unit Science browse/review import — 2026-10-29

Per explicit request, the 44 curated candidate packs were copied into `data/question-packs/ru-c-*.json` and the 45 local app-copy PNG figures into `data/question-packs/assets/lokkho/`. This imports **4,009 questions for browse/review only**; the original external source captures, curated JSON packs and original assets remain unchanged. One WebP and three SVG source assets were converted to PNG in the app copy only, with corresponding `assetPaths` adjusted; all non-asset question fields are unchanged.

`pnpm question-assets:index` generates `src/content/questionAssets.ts` with static literal `require()` calls for Metro/offline packaging. `QuestionCard` renders the local figures. After changing the packs, run `pnpm question-assets:index` if assets change and `pnpm packs:index` if pack JSON files change.

All 4,009 imported candidate answer and content states remain `unverified`. No RU exam count, duration, section-selection rule, or scoring rule was inferred. Normal verified practice still excludes these candidates. A separate provisional path now enables Flash and the general 100-question/60-minute Standard Exam in a scope with no verified-eligible pool, using a third-party source key with explicit warnings. It requires single-choice type, 2+ options, exactly one source-key option and no duplicate normalized option text; 3,991 RU items currently qualify, while 18 items with duplicate normalized option text are withheld from provisional scoring. The 158 other-subject-label records and 18 no-option records remain external in the review/exclusion ledgers; ambiguous questions remain unresolved.

At this **2026-10-29 RU C Unit browse/review import checkpoint**, validation covered 46 JSON packs / 4,189 total questions with 0 schema errors and 4,023 expected warnings. The provisional-practice fix passed 57 tests, TypeScript and ESLint on Node 22.23.1. This historical checkpoint predates the 2026-10-31 Android preview release; current release/device status is recorded in `docs/CURRENT_STATE.md` and `docs/QA_CHECKLIST.md`. Original question provenance and answer-key verification, plus detailed Android visual checks for the RU C figures/Flash/Standard flows, remain open.
