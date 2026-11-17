# RU Verified Source Sets → ASPECT Publications & Books — integration plan

Decision recorded: 2026-11-17
Status: Approved direction / planning only. Full audit and implementation pending.
Target UI: Publications & Books → ASPECT

## 1. Owner's actual product decision

There are three separate workstreams:

1. **RU verified-source bank:** the current 15 JSON batches / 1,828 questions represent 17 printed source sets. After full audit, these **17 source sets only** are to be added to Publications & Books → ASPECT as one RU question-bank book with 17 test/set units.
2. **RU Lokkho candidate packs:** 44 packs / 4,009 unverified questions. These must be moved to and preserved in an external archive, not added to ASPECT Library. Audit them to determine whether any records are reliable/reusable if needed. They may never be used.
3. **Muse-generated pack:** the owner has already asked Muse to create a new pack. Its result is a separate workstream and may become the preferred source for new content. Once available, compare it with the audited Lokkho archive where useful; do not assume Lokkho data must be imported or merged.

Do not represent RU Lokkho as an ASPECT Library book. Do not merge it into the 17 verified source sets. Once created, do not delete the external archive after checking it. Keep the audit and reuse decision separate from the RU-V publication decision.

## 2. Proposed ASPECT Library organization — RU-V only

Use the existing ASPECT publisher ID `pub-aspect` and create **one book**:

**Book: Rajshahi University Question Bank — Verified Source Sets**

- Organize by academic session/year, then 17 separate test/set units.
- Each set has its own printed unit, title/set name, PDF start page, question sequence and source-page/question-number provenance.
- 2024–25 মহানন্দা (PDF p1) and পদ্মা (p12) remain source Unit A.
- Initial inventory: 1,828 imported questions across those 17 sets. The final published count may change only through documented, source-backed audit decisions.
- Keep answer/content verification status separate from catalogue/book identity.

**Not included in this book:** the 44 RU Lokkho packs and their 4,009 candidate questions. They stay in an archive outside the app bundle. No second Lokkho book is planned.

The 15 existing RU-V JSON import batches can still be used as staging inputs. The goal is 17 logical test units, not necessarily 17 JSON batches. Prefer stable batch/question identities and deterministic conversion rather than gratuitous file splitting.

## 3. RU Lokkho archive and optional reuse decision

Current app-side candidate inventory:

- 44 JSON packs / 4,009 questions.
- 45 unique referenced PNG files; 46 references.
- 2.304 MiB referenced asset footprint; no missing assets at the checkpoint.
- Candidate data is unverified and may contain third-party transcriptions/answer keys.

Required handling:

1. Preserve all 44 source packs, associated assets and source/evidence manifests in an archive outside `bd-admission-app/data/question-packs`. Suggested archive area: `/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/` (or retain the canonical existing external `ru/science-unit-c/` tree with a manifest and immutable hashes).
2. Do not add the archive to `pub-aspect`, create an ASPECT Lokkho book, or use its current app bundle state as evidence that the content is verified.
3. Audit the records against available original/source material and mark each as reusable, duplicate/variant, incorrect, incomplete or unresolved.
4. Keep the final action optional: reuse only selected source-backed records when genuinely needed; otherwise leave the whole collection archived and unused.
5. Compare the archived records with the new Muse-generated pack only after Muse supplies it. Preserve distinct source provenance and do not auto-merge on similar wording.
6. The archive move has **not** been performed yet: the 44 candidate JSON packs are still in the app repository/bundle at this checkpoint. Moving them into the external archive and removing them from the active app bundle must be a separately planned cleanup. The 45 candidate-only assets and static Metro asset registry must be considered. Existing SQLite installs also need a scoped retirement strategy if the 44 packs are removed from the app; preserve bookmarks, answers, attempts and history. Do not delete historical rows blindly.

## 4. Existing Library architecture fit

Phase 8 already provides:

- Publisher → books → hierarchical units → question browsing/practice.
- LibraryPack schema, validator and transactional importer.
- Shared question/option storage and QuestionCard rendering.
- Book/unit-scoped Browse, Flash and Standard Exam setup/history.
- Library questions use membership via `content_unit_questions`, not university paper appearances.
- Book practice resolves to an unconfigured scoring rule rather than borrowing an unrelated official university-paper rule.

The schema can represent the 17 test sets as `test` units under year/session parents. Each question belongs to one or more units through `unitIds`. Question ordering and source page locators must be deterministic.

A deterministic conversion/build step is required to map audited RU-V question-pack records (`papers`, `appearances`, `source`) to LibraryPack (`publisher`, `book`, `units`, `unitIds`, `source`). Generate from a reviewed manifest; do not hand-edit 1,828 questions.

## 5. Implementation requirements for the RU-V ASPECT book

### 5.1 Library migration and catalogue isolation

- Build one independently versioned RU-V LibraryPack under `pub-aspect`.
- Represent all 17 printed sets as separate test units.
- Preserve stable question IDs, original PDF page and printed question number, answer keys, explanations, subjects and local media.
- The Library importer refuses an ID already owned by another batch. Therefore, plan a safe ownership transition; do not duplicate the same question ID into a new batch while the source batch still owns it.
- Cutover from university paper appearances to library-book membership must be atomic and preserve bookmarks, saved answers, completed attempts, results and provenance.
- After cutover, the 17 sets should appear under ASPECT Books, not as a separate RU-V university-paper catalogue entry. Confirm that historical user data still resolves.
- Test fresh installation and upgrade of an existing database separately. Existing seed sync does not delete removed question rows; removing JSON packs alone does not retire installed appearances/batches.
- RU Lokkho is not part of this LibraryPack and must not be migrated with it.

### 5.2 App-wide multiple-select implementation — required before enabling the six RU-V records

Current schema/key arrays support multiple correct options, but runtime practice is still single-select:

- `ELIGIBLE_SQL` only admits `single_choice`.
- Flash submits a tapped key immediately.
- Standard Exam stores one selected key per question.
- QuestionCard has radio-group semantics while only labelling multiple-answer items.

Implement:
1. Multi-select toggle controls with checkbox accessibility semantics.
2. Flash confirmation/submission for multi-answer questions; preserve immediate behavior for single-choice.
3. Array-valued selections through answer queue, persistence, restore/resume and finalization.
4. Exact-set scoring: selected keys must equal all source correct keys; partial selections are not fully correct unless a verified rule explicitly says otherwise.
5. Result/review displays all correct keys and the student's selected set.
6. Update eligibility only after UI, persistence, scoring and review support the complete flow.
7. Shared-engine tests across university-pack and LibraryPack origins, including the six RU-V source cases, 2-/3-key cases, wrong extras, partial selection, clear, skip, timeout, resume, history and library practice.

The 22 no-correct-option records must not be made ordinary scored MCQs.

### 5.3 App-wide image, diagram and mathematical rendering; RU-V source audit

All current RU-V questions have empty `assetPaths`. The source includes visual/math-dependent items.

- Inventory visuals per question from the source PDF.
- Crop required source diagrams/graphs/circuits/matrices as local, provenance-linked assets.
- Generalize `scripts/build-question-assets.mjs` and static Metro indexing as one shared, offline-capable asset pipeline for all supported question packs and LibraryPacks, including (but not limited to) the RU-V ASPECT book.
- Verify LibraryPack `assetPaths` pass through each content origin/installer → SQLite → shared QuestionView → QuestionCard, for both existing university packs and LibraryPacks.
- Use existing `MathText` where it is sufficient; add structured matrix/fraction/vector notation or an offline renderer only where source-verified material needs it.
- Do not redraw or infer a missing diagram from flattened text.
- Add missing-asset, pack-build, math-rendering and screen-reader regression tests across university-pack and LibraryPack content.
- Verify Android image scaling, formula readability, scrolling, small screens and light/dark themes.

Lokkho's 45 existing PNGs are archive assets, not part of the RU-V ASPECT book. Keep them out of the RU-V LibraryPack and its new asset map unless a separately audited, source-backed reason authorizes reuse.

### 5.4 Provenance, verification and licensing

- Preserve the RU PDF filename/hash, page number and printed question number.
- Keep question content verification, answer-key verification and book-level verification distinct.
- Do not infer official exam marking rules for a Library book.
- Record source-specific licence/attribution evidence for the RU PDF. The existing ASPECT Master QB permission note does not automatically cover RU source material.
- The printed source unit/year/set labels must not be overwritten by inferred official admission-unit classifications.

## 6. Staged execution

| Stage | Work | Exit criteria |
|---|---|---|
| 0 | Freeze RU-V PDF, packs and extraction ledgers | Hash manifest and protected backup |
| 1 | Full RU-V source audit | All included questions and 154 exclusions checked or explicitly held |
| 2 | RU Lokkho archive audit | 44 packs / 4,009 records triaged; archive immutable; reuse remains optional |
| 3 | Review Muse-generated pack | Compare scope, quality, provenance and overlap only after delivery |
| 4 | RU-V 17-set Library manifest | 17 test units, source names/counts/order and stable ID map |
| 5 | Deterministic RU-V LibraryPack conversion | Field parity report and LibraryPack validator pass |
| 6 | RU-V Library features | Multi-select, media and math work as needed; tests/device QA pass |
| 7 | RU-V fresh-install/upgrade tests | ASPECT book counts correct; user history preserved |
| 8 | RU-V-only cutover | 17 sets available under ASPECT; RU-V university catalogue retired safely |
| 9 | Final verification | Tests/typecheck/lint/build/seed/assets and documentation pass |

RU Lokkho archive handling is independent of the RU-V ASPECT cutover. Do not block publication of the 17 audited sets on a decision to reuse Lokkho content.

## 7. Verification checklist

- [ ] All 1,828 RU-V questions source-checked.
- [ ] All 154 RU-V exclusion decisions source-checked.
- [ ] Exactly 17 RU-V test units represented under one ASPECT book.
- [ ] Original source Unit A retained for 2024–25 মহানন্দা/পদ্মা.
- [ ] Question IDs, answer keys, explanations and page/question provenance retained.
- [ ] Multiple-answer choices selectable, persisted, scored and reviewed.
- [ ] No-correct-option records remain unscored/source-labelled.
- [ ] Required image assets load in the offline ASPECT book.
- [ ] Math/matrix rendering is readable and accessible.
- [ ] Fresh-install and upgrade preserve bookmarks, sessions, answers and results.
- [ ] RU-V no longer appears in the university-paper catalogue after cutover; it appears under ASPECT Books.
- [ ] RU Lokkho remains outside ASPECT and is preserved in the external archive.
- [ ] Lokkho reuse decision recorded only after its audit and comparison with Muse's new pack.
- [ ] JU, HSTU, DU and unrelated content unchanged.
- [ ] RU source attribution/licence evidence is recorded.
- [ ] Documentation, tests, seed and generated assets are in sync.

## 8. Implementation boundary

Planning only. No code, pack JSON, asset, DB, seed, publisher metadata or catalogue change has been made. Implementation awaits the source audit and an explicit start instruction.
