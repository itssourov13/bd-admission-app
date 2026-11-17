# RU Question Banks — interim source audit checkpoint

Date: 2026-11-17
Status: INTERIM ONLY — complete source audit is pending
Repository: /home/kali/gpt-workspace/bd-admission-app
Branch / HEAD: feat/import-hstu-verified-answers-2026-11-12 / a5c46ed
Mode: Read-only investigation followed by documentation-only update. No app/data/DB/asset change and no commit.

## 1. Scope and sources

This checkpoint covers the user-supplied RU PDF bank (currently imported as RU-V), the separate RU Lokkho candidate bank, and current question rendering/scoring behavior. The publication target is limited to the 17 RU-V source sets: one book under Publications & Books → ASPECT. Lokkho stays archived outside ASPECT and is audited only for optional future reuse.

Inputs inspected:
- Original PDF: /home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf — 156 pages.
- SHA-256: f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7.
- External extraction workspace: /home/kali/gpt-workspace/bd-admission-app-data/ruv-work/.
- Evidence files: raw_questions.json, runs.json, PACK_RECONCILIATION.csv, EXCLUSION_MANIFEST.csv, subject-audit.json, IDENTICAL_OPTION_TEXT_AUDIT.csv and import summary.
- App packs: data/question-packs/ru-vq-*.json and data/question-packs/ru-c-*.json.
- Quality scanner: scripts/audit-question-quality.mjs.
- Library architecture: docs/implementation/PHASE_08_CONTENT_LIBRARY.md, src/types/library-pack.ts, src/services/libraryImporter.ts and src/services/libraryPackValidator.ts.

## 2. RU-V: 15 JSON batches represent 17 distinct source sets

Current inventory:
- 15 RU-V JSON import batches.
- 15 current logical paper rows.
- 1,828 imported question records.
- 1,828 unique question IDs; no duplicate RU-V question IDs were found.
- One current active paper appearance per question.
- The supplied PDF/extraction ledger describes 17 separate source-set occurrences.

Two current JSON batches combine two printed sets each:
- ru-vq-2021-2022-c-all-p067.json: sets beginning PDF pages 67 and 78.
- ru-vq-2022-2023-c-all-p044.json: sets beginning PDF pages 44 and 55.

### 2.1 Per-set count reconciliation

Counts reconcile against the external raw extraction ledger. “Raw” includes items later excluded from the MCQ packs.

| # | PDF start | Session | Printed unit / source set | Raw | Imported | Excluded |
|---:|---:|---|---|---:|---:|---:|
| 1 | 1 | 2024–25 | A — মহানন্দা | 130 | 126 | 4 |
| 2 | 12 | 2024–25 | A — পদ্মা | 130 | 126 | 4 |
| 3 | 23 | 2023–24 | C — সুরমা | 130 | 118 | 12 |
| 4 | 33 | 2023–24 | C — মেঘনা | 130 | 116 | 14 |
| 5 | 44 | 2022–23 | C — Feldsper-1 | 130 | 125 | 5 |
| 6 | 55 | 2022–23 | C — Quartz-2 | 130 | 127 | 3 |
| 7 | 67 | 2021–22 | C — নেপচুন-২ | 130 | 122 | 8 |
| 8 | 78 | 2021–22 | C — ভেনাস-১ | 130 | 130 | 0 |
| 9 | 89 | 2020–21 | C — সায়নোভ্যাক | 130 | 125 | 5 |
| 10 | 98 | 2019–20 | C — গ্রুপ-০১ | 128 | 87 | 41 |
| 11 | 107 | 2018–19 | C — সেট ০২ | 86 | 76 | 10 |
| 12 | 113 | 2018–19 | D1 — সেট ০১ | 150 | 135 | 15 |
| 13 | 126 | 2017–18 | C — মেঘনা-৩ | 79 | 76 | 3 |
| 14 | 131 | 2017–18 | F — সেট-১ | 112 | 105 | 7 |
| 15 | 139 | 2017–18 | H — সেট-২ | 71 | 64 | 7 |
| 16 | 145 | 2016–17 | C — ODD | 78 | 72 | 6 |
| 17 | 150 | 2016–17 | F — ODD | 108 | 98 | 10 |
| | | Total | 17 independent source sets | 1,982 | 1,828 | 154 |

**Catalogue recommendation:** expose 17 separate logical papers/sets. This does not require 17 JSON import batches. The existing pack format supports multiple paper records in one batch; the lower-risk implementation is likely to retain 15 batch identities, add one additional paper to each of the two combined batches, and reassign appearances by source set/page. If anyone proposes 17 separate JSON batches, first plan batch ownership, seed-sync and installed-database behavior. Preserve question IDs and source locators.

## 3. RU 2024–25 source Unit A correction

The source PDF visibly prints:
- Page 1: Unit A — মহানন্দা.
- Page 12: Unit A — পদ্মা.

The current JSON papers were changed to C Unit during the 2026-11-16 work by applying an official A/B/C admission classification to the source compilation. This conflated official admission-unit classification with the identity printed on this source-bank material.

**Source-faithful catalogue identity is A Unit for both sets.** A separate official classification note may be retained as context, but it must not overwrite the source's unit label. The current pack JSON still says C; no data change has been made.

The RU portion of RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md is superseded by this finding. The HSTU paper consolidation and migration evidence in that report remain current.

## 4. Extraction and exclusion ledger

- Raw extraction records: 1,982.
- Imported RU-V questions: 1,828.
- Excluded records: 154.

| Exclusion reason | Count |
|---|---:|
| option_count_incomplete | 90 |
| written_part | 36 |
| option_text_missing | 26 |
| answer_marker_missing | 2 |
| Total | 154 |

The 22 explicit X/no-correct-option items and six multi-answer items are included among the 1,828; they are not part of the 154 exclusions.

Earlier automated reconciliation compared imported JSON with extracted raw data. That confirms transfer consistency only; it does not establish that the extraction faithfully preserves every source glyph, formula, diagram, option, answer marker or explanation. Full page-level visual verification remains outstanding.

## 5. Quality scan and source-checked examples

The read-only scanner was run on all 15 RU-V packs.

| Finding | Count | Interpretation |
|---|---:|---|
| OPT_DUPLICATE pair findings | 35 | Across 30 questions. 22 pair findings include at least one keyed option, across 20 questions. Review flags, not all confirmed errors. |
| BANGLA_CARET_ARTEFACT | 15 | Likely Bangla text/encoding corruption candidates. |
| OPT_REPLACEMENT_CHAR | 2 | Replacement character � in extracted explanations; PDF pages 134 and 57. |
| Q_OPTIONS_IN_TEXT | 1 | 2018–19 C, p107 Q11; likely legitimate mathematical variable labels. |

The duplicate scanner normalizes whitespace and case. It can create false positives where the PDF distinguishes uppercase/lowercase variables, superscripts/subscripts, vectors, Greek symbols or flattened matrix/circuit notation. Every flagged case needs original-page inspection before editing.

### 5.1 Confirmed option/explanation boundary defects from targeted source-page review

- 2024–25, p1 Q4: option D has the choice “50%” followed by an explanation sentence; app explanation is null.
- 2022–23, p45 Q15: option D contains “আইসোমার” plus an explanation sentence; app explanation is null.
- 2023–24, p33 Q6: option D includes the source choice followed by the explanation about using a low-resistance shunt; app explanation is null.
- 2017–18 F, p133 Q40: option D contains text from the explanation, while the explanation field contains only “হয়।”; source answer has multiple keys.
- 2024–25 A — পদ্মা, p17 Q66: option D includes “গ্লুকোকরটিকয়েড” followed by an explanation/table heading; the rest of the explanation is in the explanation field.

The first three records have no separate explanation value. The last two have additional mixed option/explanation boundaries. Exact correction boundaries should be read from full-resolution source pages before editing.

## 6. Answer-key states and required multiple-select implementation

### 6.1 No correct option

There are 22 records with answerDisposition "no_correct_option" and an empty correctOptionIds array. Do not force A/B/C/D. Some explanations show a computed result not present among choices (examples: 2024–25 p1 Q1, p3 Q43, p7 Q79, p10 Q64; 2022–23 p46 Q31). Retain the source disposition unless page/key review demonstrates otherwise.

### 6.2 Six multiple-answer records

| Session / source set | PDF page | Q | Source keys |
|---|---:|---:|---|
| 2017–18 F | 133 | 40 | B, C |
| 2017–18 F | 137 | 1 | A, D |
| 2019–20 C | 102 | 7 | B, D |
| 2021–22 C | 75 | 75 | A, C |
| 2023–24 C — মেঘনা | 38 | 67 | A, B, C |
| 2024–25 A — পদ্মা | 17 | 66 | A, D |

**Existing support and gap:**
- Schema, stored correct-option arrays and exact-set scoring can represent multiple correct keys.
- Shared scored-eligibility SQL currently restricts the practice pool to single_choice.
- Flash submits a single tapped key immediately.
- Standard Exam's visible selection/handler currently stores one selected key per question.
- QuestionCard displays a multiple-answer label but choices are exposed with radio-group semantics.

**Implementation required before enabling multi-answer practice:**
1. Update Flash and Standard Exam option controls to select-many; preserve single-choice behavior.
2. Provide an explicit confirm/submit action in Flash for multi-select questions; do not grade on first tap.
3. Persist arrays of selected keys through the existing answer queue and session resume path.
4. Score only when selected key set exactly equals the source correct-key set. Partial selections are not fully correct unless an exact paper rule explicitly states otherwise.
5. Change pool eligibility only after UI, persistence, scoring and result review all support multi-answer.
6. Add tests for all six source cases plus synthetic two-/three-key, partial, extra-key, clear, resume, timeout and result-review behavior.
7. Keep the 22 no-correct-option items out of scored pools unless a separate unscored source-review mode is designed.

Book/library practice has no official university exam rule by default. Adding questions to ASPECT Library must not attach an unrelated RU paper marking rule or imply official scoring.

## 7. Diagram, image and mathematical rendering implementation

All 1,828 RU-V records currently have empty assetPaths. This does not mean every question needs an image, but the source contains graph, circuit, vector, matrix and other visual/math-dependent items.

Targeted examples:
- 2020–21 C, p90 Q17 — source velocity/time graph; no question asset attached.
- 2021–22 C, p78 Q14 — circuit/math notation flattened.
- 2022–23 C, p55 Q73 — matrix-like choices flattened into text.
- 2016–17 F, p152 Q40 — distinct helium isotope/nuclide notation collapsed into repeated He text, triggering duplicate-option findings.

**Implementation work after source review:**
- Maintain a per-question visualRequired/mathComplexity ledger so text-only questions do not receive unnecessary images.
- Crop source diagrams/formula blocks from the original PDF, store stable local asset paths and preserve page/question provenance.
- Extend scripts/build-question-assets.mjs and the generated static Metro registry beyond its current Lokkho-only asset directory; LibraryPacks must resolve images in an offline bundle.
- Ensure QuestionCard and LibraryPack importer pass assetPaths through unchanged and render figures with suitable fit/accessibility behavior.
- Review existing MathText first. Add structured matrix/fraction/vector notation or an offline renderer only where verified content cannot be represented safely with current rendering.
- Add tests for assets in bundled LibraryPacks, missing-asset detection, Metro static inclusion, math regressions and screen-reader labels.
- Validate Android rendering: long formulas, image aspect ratio, scrolling, accessibility and light/dark themes.

Do not recreate a diagram by guessing from flattened text. Use the original source page.

## 8. RU Lokkho candidate bank inventory

| Measure | Result |
|---|---:|
| Candidate JSON packs | 44 |
| Candidate questions | 4,009 |
| JSON footprint | approximately 5.48 MiB |
| Asset reference occurrences | 46 |
| Unique referenced PNGs | 45 |
| Unique asset footprint | 2,416,024 bytes / 2.304 MiB |
| Missing referenced assets | 0 |
| Duplicate question IDs within this bank | 0 |
| Candidate question IDs shared with other bundled packs | 0 |

This bank is separate from RU-V and remains unverified. It is **not** intended for the ASPECT Library. The 44 packs and their source assets must be moved to an external archive outside the active app bundle. That archive move has not yet been performed: the current app repository still contains the 44 JSON pack files and their assets. Preserve/hash them first, then handle bundle/database retirement as a separate scoped task. Audit them so that selected records can be reused only if needed. Reuse is optional; the owner has already asked Muse to prepare a new pack, so Lokkho may remain archived and unused. Compare Muse's output with the audited Lokkho archive only after the new pack is available. Preserve the archive and its source provenance regardless of the reuse decision. Do not delete the archive or add it as a second ASPECT book.

## 9. Audit completion boundary

| Area | Status |
|---|---|
| PDF identity, hash and 156-page count | Checked |
| 15 batch / 17 source-set mapping | Reconciled |
| Per-set raw/import/exclusion counts | Reconciled to extraction ledger |
| Question ID uniqueness | Checked |
| Selected option/explanation merge examples | Visually confirmed |
| Automated quality scan | Run |
| All 1,828 questions visually verified | Not done |
| All 154 exclusions checked against source | Not done |
| All duplicate/math/encoding flags resolved | Not done |
| All 22 no-correct and 6 multi-answer keys independently verified | Not done |
| Full diagram/math inventory and asset creation | Not done |
| RU Lokkho full audit | Not done |
| ASPECT LibraryPack conversion/build/install | Not done |

## 10. Claude handoff — remaining source audit

Claude should read this report, RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md, QUESTION_DATA_SCHEMA.md, QUESTION_IMPORT_WORKFLOW.md, PHASE_08_CONTENT_LIBRARY.md, the scanner source and external RU workspace evidence.

Required:
1. Visually audit all 1,828 imported RU-V questions and all 154 excluded raw records against the PDF. Maintain a row-level ledger with separate question, options, printed key, explanation, math/diagram and verdict.
2. Audit all 4,009 Lokkho questions and all 44 source packs for possible reuse; document records that cannot be verified. Keep the pack in an external archive, not ASPECT. Check duplicates within Lokkho and against RU-V without auto-merging source-distinct questions.
3. Re-review all 35 duplicate pair findings, 15 caret findings, 2 replacement-character findings, mixed explanations, 22 no-correct records and six multiple-answer records. Never guess.
4. Preserve original Unit A for 2024–25 মহানন্দা/পদ্মা.
5. Confirm 17 logical RU-V source tests while preserving IDs, batch ownership and provenance.
6. Produce exactly one ASPECT LibraryPack for the 17 RU-V source sets only. Keep Lokkho outside ASPECT in an external archive; compare it with Muse's new pack when available and reuse selected records only if the owner later decides they are needed.
7. Record residual uncertainty; unresolved questions remain unverified and out of scored practice.

No implementation is authorized by this interim report.

## 11. Git/change boundary

At checkpoint: branch feat/import-hstu-verified-answers-2026-11-12, HEAD a5c46ed, clean tree before documentation update. This checkpoint changes documentation only. No commit and no push.
