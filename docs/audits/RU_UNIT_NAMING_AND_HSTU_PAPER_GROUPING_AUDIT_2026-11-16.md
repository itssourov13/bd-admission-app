# RU unit naming and HSTU paper-grouping audit

**Audit date:** 2026-11-16
**Repository:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch / implementation base:** `feat/import-hstu-verified-answers-2026-11-12` / `59acc2b`
**Status:** Implemented and regression-tested on 2026-11-16. RU catalogue metadata and five HSTU paper identities are corrected; existing-install migration v9 and scoped pack replacement preserve user history and canonical questions.

## 1. Plan and scope

1. Check Git state and current project/import documentation.
2. Inventory RU verified and candidate pack metadata, question subjects, titles, years, units and source labels.
3. Compare RU unit naming against session-specific public admission notices, prioritising RU's own 2024–25 circular and contemporaneous reporting.
4. Inspect all HSTU pack paper records, group identical logical session/unit/shift titles, compare question IDs, stems and subject/question-number positions, and trace the importer/catalogue behavior.
5. Run a focused content-integrity check, record the safe remediation path, and update project handoff documentation.

The initial audit was read-only and began from a clean Git tree. The subsequent implementation is recorded in §4–§5.

## 2. RU unit-name finding — confirmed metadata mismatch

### 2.1 The 2024–25 RU-V packs originally said A Unit, but the questions are Science

The two verified-source packs are:

- `data/question-packs/ru-vq-2024-2025-a-noset-p001.json`
- `data/question-packs/ru-vq-2024-2025-a-noset-p012.json`

Before this implementation, both stored `unit: "A Unit"` and titles beginning `RU A Unit — 2024-2025`; both now catalogue as C Unit while preserving the source-document title. Their source sets are labelled মহানন্দা and পদ্মা. Each has 126 questions, with Physics, Chemistry, ICT, Biology and Higher Mathematics. Together they contain 252 questions.

The user-supplied 156-page `RU Question Bank.pdf` itself prints `Unit:A` on its front matter. The imported pack titles followed that printed source label.

However, Rajshahi University's **official 2024–25 admission circular** explicitly identifies:
- Unit A — Humanities
- Unit B — Commerce
- Unit C — Science

The same circular lists the Unit C faculty scope and states that the official admission test is 80 questions / 100 marks. The 2024–25 test schedule places B, A and C on 12, 19 and 26 April 2025 respectively. Independent contemporaneous reporting confirms A=Humanities, B=Commerce and C=Science.

**Conclusion:** the Science question-bank sets must be catalogued as **RU C Unit (Science)**, not RU A Unit. The printed `Unit A` label must remain in source provenance/notes rather than being silently erased. Also, because each imported set has 126 questions while the official 2024–25 sitting had 80 questions, these packs should be presented as **C-Unit question-bank sets/practice**, not represented as an exact official 80-question exam paper. Keep exam-rule configuration unconfigured unless an exact paper and its official pattern are established.

### 2.2 Year-wise RU unit history — do not apply one label blindly to every year

The unit structure changed over time. Evidence reviewed:

| Academic session / period | Publicly supported structure relevant to Science | Cataloguing implication |
|---|---|---|
| 2010–11 | RU used 17 units; Science Faculty was split across two units. The source found in this pass does not establish a safe single generic C label for every science paper. | Do not assume a single C paper. Preserve exact source unit/subunit where it can be established. |
| 2012–13 | RU expanded to 16 units; a new C-2 unit was split out of departments that had previously been under C. | C/C-2 distinction can matter. Do not collapse subunits without source evidence. |
| 2013–14 | Eight-unit structure; C-unit admission was part of the published schedule. | Verify the actual paper/unit against its session source rather than inferring from later years. |
| 2014–15 | An earlier July proposal described a three-unit arrangement with Science=A. The later **revised admission notice dated August 2014** shows the operative eight-unit structure: A=Arts, B=Law, **C=Science**, D=Business, E=Social Science, F=Life & Earth Science, G=Agriculture, H=Engineering. | Use the revised notice, not the superseded July proposal. For this final structure Science is C, not A. |
| 2015–16 | Nine-unit structure is confirmed by the admission schedule. The original official circular's complete faculty/unit mapping was not recovered in this audit. | Keep the source's year-specific label pending direct circular verification; do not infer a change just from the 2014 proposal. |
| 2016–17 | Nine units; C=Science, D=Business, F=Life & Earth, G=Agriculture, H=Engineering. | RU C Science is supported. |
| 2017–18 | Nine units; C=Science. | RU C Science is supported. |
| 2018–19 | Five-unit structure; C included Science **and Engineering**; D covered Life & Earth Science; A Arts/Fine Arts, B Business, E Law/Social Science/IER. | Display the official C label, but note its broader faculty scope for this session. |
| 2019–20 | Three-unit restructuring: A=Humanities, B=Business, C=Science (including the wider science-related faculties in that structure). | C=Science. |
| 2020–21 to 2023–24 | Three-unit scheme continued; sources for 2021–22, 2022–23 and 2023–24 identify C as Science, A as Humanities and B as Commerce. | C=Science. |
| 2024–25 and 2025–26 | Official circular/news sources identify A=Humanities, B=Commerce, C=Science. | Science must be C; the current RU-V A label is inconsistent. |

This means the user's suspicion that older RU years may differ is reasonable, but the evidence does **not** support a blanket rule that all pre-2017 Science papers were A. In particular, the final 2014–15 revised notice says C=Science, while 2010–13 had more complex subunit structures and 2015–16 still needs direct primary-notice confirmation.

### 2.3 RU records that need follow-up

- **Confirmed metadata correction candidate:** the two 2024–25 RU-V A-labelled Science sets listed in §2.1. Change their catalogue-facing `unit` and `title` to C Unit, retain their stable IDs, and add a source note that the supplied PDF prints “Unit A” while RU's official 2024–25 classification places Science under Unit C.
- **Historical validation candidate:** the oldest `ru-c-*` packs (particularly 2010–13) currently use a generic `C Unit — Science` value. Review their exact original paper/session and any C1/C2 distinction before asserting that the generic label is exact.
- **2015–16:** retain its current third-party/source label until the original session circular or an authoritative university archive confirms its faculty mapping.
- **2018–19:** the C label itself is supported, but the unit's scope included Engineering; do not describe the C Unit scope as identical across all historical sessions.

Do not rewrite source question text, answer status, source filenames, question IDs or historical set labels as part of a unit-name correction.

## 3. HSTU paper grouping — confirmed catalogue fragmentation

### 3.1 Root cause

The HSTU verified-question import on 2026-11-12 moved accepted question appearances from HSTU-U into newly created HSTU paper IDs. Five of those new paper IDs describe the **same session, unit, shift and title** as five papers already present in the normal HSTU catalogue.

The importer in `src/services/importer.ts` upserts a paper by its explicit `paper.id`; it does not resolve two IDs to one logical paper based on institution/session/unit/shift. The catalogue's `listPapers()` in `src/repositories/content.ts` returns one card per `exam_papers` row. Therefore both paper rows appear independently in the university list. Sorting by year, unit and ID does not group them into one paper.

This is not a UI sorting defect. It is a **canonical paper identity / import-model issue**.

### 3.2 Exact five duplicate logical-paper pairs

| HSTU session | Unit / shift | Existing HSTU pack | Existing Q / ready | Extra imported HSTU pack | Extra Q / ready | Combined Q / ready |
|---|---|---|---:|---|---:|---:|
| 2024–25 | A / Shift 1 | `hstu-a-2024-2025-shift-1.json` | 44 / 43 | `hstu-unverified-a-2024-2025-shift-1.json` | 12 / 12 | **56 / 55** |
| 2024–25 | A / Shift 2 | `hstu-a-2024-2025-shift-2.json` | 47 / 44 | `hstu-unverified-a-2024-2025-shift-2.json` | 9 / 9 | **56 / 53** |
| 2024–25 | A / Shift 3 | `hstu-a-2024-2025-shift-3.json` | 50 / 48 | `hstu-unverified-a-2024-2025-shift-3.json` | 7 / 7 | **57 / 55** |
| 2024–25 | B / Shift 1 | `hstu-b-2024-2025-shift-1.json` | 52 / 49 | `hstu-unverified-b-2024-2025-shift-1.json` | 4 / 4 | **56 / 53** |
| 2024–25 | B / Shift 2 | `hstu-b-2024-2025-shift-2.json` | 58 / 56 | `hstu-unverified-b-2024-2025-shift-2.json` | 2 / 2 | **60 / 58** |

At the time of the audit, all five pairs had the same academic session, unit, shift and exact display title, but separate paper IDs. The additional records used the `hstu-import-...` prefix; the implementation now repoints these appearances to the existing canonical IDs.

### 3.3 Question-level checks

The following checks were run across all five pairs:

- No question ID collision between the paired packs.
- No exact normalized question-stem overlap between the paired packs.
- No duplicate `(subject, questionNumber)` position between the two segments of any pair.
- The additional 34 questions are verified/answer-verified and practice-ready in the normal HSTU institution.
- The 5 groups account for 285 questions / 274 practice-ready questions when viewed together.

**Interpretation:** the extra 34 questions are not duplicate question rows that should be deleted. They are separate question IDs that have been attached to a second paper row with the same logical paper identity. The fix should consolidate the **paper appearance references**, preserving every question record, source document, source locator and verification status.

Before consolidation, the normal HSTU catalogue had 22 paper rows / 950 questions / 939 verified practice-ready questions. It now has **17 logical papers** while keeping the same 950 question records and 939 practice-ready questions. The question-pool totals are unchanged.

### 3.4 Keep these separate

- HSTU-U pending questions must remain in the separate HSTU-U institution and must not be promoted or attached to normal HSTU unless their accepted verification evidence allows it.
- Older HSTU papers marked `unassigned` because the source does not print a unit must not be merged into A/C or another unit based only on a matching year.
- Do not merge by title alone. Require institution, academic session, unit, shift/group and a source-backed sitting identity.

## 4. Implemented outcome

### A. RU display metadata

- Updated only the two verified-source 2024–25 RU-V Science packs listed in §2.1.
- Kept their stable source pack IDs and question IDs; changed catalogue paper unit from A Unit to C Unit and titles to RU C Unit — 2024-2025 — Set মহানন্দা / পদ্মা.
- Kept each source document's original title (including RU A Unit) and appended a provenance note explaining the printed source label, official RU A/B/C mapping, and 126-question question-bank versus 80-question official-paper distinction.
- No question text, options, correct answers, verification status or exam rules changed. No historic RU year was relabelled without session-specific evidence.

### B. HSTU canonical-paper consolidation

- Reused the existing hstu-a/b-2024-2025-shift IDs in all five extra verified source packs. Repeated paper metadata is identical to the canonical base-pack metadata.
- Repointed only the 34 verified normal-HSTU appearance records from hstu-import IDs to their matching canonical paper IDs. The five additions contain 12, 9, 7, 4 and 2 unique questions.
- Kept all HSTU-U pending appearances, paper IDs and unconfigured rules separate. Kept the canonical HSTU rule (verified, totalMarks 100 only) and removed only the five duplicate unconfigured alias rules.
- Added replaceExistingPaperIds so each shared source pack replaces only its own HSTU-U pending paper. It does not delete the existing questions on the shared canonical HSTU paper.
- Added SQLite migration v9. On existing installs it moves appearances from the five legacy hstu-import IDs to canonical HSTU IDs, rewrites only active practice-session filter_json paper references, removes duplicate unconfigured alias rules and deletes the now-unreferenced alias paper rows. Immutable result_json, marking-profile snapshots, question rows, bookmarks, answers and practice-session records are not rewritten or deleted.
- Normal HSTU catalogue result: 17 papers / 950 questions / 939 verified practice-ready questions. The five groups contain 285 questions / 274 ready; all 34 unique additions remain present.
- The 105 HSTU-U pending questions remain in HSTU-U; historical HSTU unassigned papers are untouched.

### C. Recurrence protection

- Question-pack schema accepts an optional replaceExistingPaperIds subset. The validator requires unique non-empty IDs declared in the same pack and requires replaceExistingPaperContent to be enabled.
- Importer, seed builder and scripts/build-content.mjs all use the same replacement subset. Legacy packs without the optional field retain the previous replace-all-pack-papers behavior.
- Regression tests cover RU provenance, all five canonical HSTU pairs, unchanged counts/rule facts, migration history preservation, and scoped replacement in both importer and generated-seed metadata.

## 5. Verification and integrity

- Runtime checks used Node **22.23.1**.
- Focused regression suite: **15/15 passed**, covering RU provenance, all five HSTU canonical pairs, scoped replacement and migration v9 history preservation.
- Full repository suite: **244/244 passed**.
- pnpm typecheck: passed. pnpm lint: passed.
- pnpm content:build and pnpm content:check: passed; **217 packs / 13,609 questions**, generated SQLite seed **22.68 MiB**, content up to date.
- Generated seed: SQLite quick_check=ok, foreign_key_check returned zero rows, user_version=9; 217 batches, 227 unique paper records, 168 rules, 13,609 questions, 54,436 options, 13,609 appearances and 286 source documents.
- Seed replacement metadata has 40 rows; each of the five affected HSTU source batches replaces only its HSTU-U pending paper.
- All five former HSTU import aliases are absent from question appearances. The 34 extra question IDs remain attached to the five canonical HSTU papers; HSTU-U retains 105 pending questions.
- git diff --check: passed. Scope review shows only the two RU packs, five HSTU packs, scoped-replacement/import/seed logic, migration, regression tests, generated manifest and related project documentation changed. No UI, dependency, release-version or unrelated question content was changed.
- No APK was built or installed. The owner should cross-check the five merged question ranges against the original HSTU source PDFs and install a later preview to exercise migration v9 on-device.

## 6. Research sources

### Rajshahi University — primary and contemporaneous sources

- [RU official 2024–25 admission circular](https://admission.ru.ac.bd/public/ht1NcohAKUrVC6t6Rf0OYgHL92EnKMhHqPdz3LfY.pdf) — schedule and explicit A (Humanities), B (Commerce), C (Science) definitions; official MCQ structure.
- [RU 2024–25 official Unit-C subject/marks notice](https://admission.ru.ac.bd/public/vrH6WX2PuN6U5gzGEfG17h5wtOOS2SoSLsWOY0Hg.pdf) — confirms Unit C and its science-related subject scope.
- [2014–15 revised admission notice](https://bangladeshresult.wordpress.com/wp-content/uploads/2014/09/rajshahi-university-admission-revised-notice-2014-15.pdf) — final revised eight-unit structure and Unit C=Science. This supersedes an earlier July proposal that was reported as a three-unit plan.
- [RU 2024–25 entry-test unit schedule and faculties](https://www.thedailystar.net/news/bangladesh/education/news/ru-entry-tests-april-12-26-3753396) — A=Humanities, B=Commerce, C=Science.
- [RU 2023–24 admission test](https://www.bssnews.net/news/176795) — C=Science, A=Humanities, B=Commerce.
- [RU 2022–23 admissions](https://www.bssnews.net/news/127628) — three-unit structure; C=Science.
- [RU 2021–22 admissions](https://www.bssnews.net/news/74009) — C=Science in the three-unit structure.
- [RU 2019–20 new unit structure](https://www.dhakatribune.com/bangladesh/education/186290/online-registration-for-ru-admission-test-begins) — A=Humanities, B=Business, C=Science.
- [RU 2018–19 unit structure](https://en.prothomalo.com/youth/RU-admission-form-sale-begins) — C=Science and Engineering; D=Life and Earth Science.
- [RU 2017–18 unit mapping](https://dailynewnation.com/news/206013) — C=Science.
- [RU 2016–17 unit mapping](https://www.newagebd.net/article/211/38-to-compete-for-a-seat-in-rajshahi-univ) — C=Science.
- [RU 2012–13 C-2 formation](https://today.thefinancialexpress.com.bd/print/ru-adds-2-units-in-admission-test) — C-2 was newly split from departments previously included under C.
- [RU 2010–11 unit count](https://www.thedailystar.net/news-detail-158257) — 17 units, with the Science Faculty split across two units.

### Local implementation evidence

- `src/services/importer.ts` — paper rows are inserted/updated by `paper.id`; appearances use the supplied `paperId`.
- `src/repositories/content.ts` — `listPapers()` returns each `exam_papers` row independently.
- `docs/QUESTION_IMPORT_WORKFLOW.md` — accepted HSTU ledger import and pending-data preservation boundary.
- `docs/PROJECT_CONTEXT.md` — current university-bank counts and verification status.

## 7. Handoff

**Implementation complete.** The two 2024–25 RU-V Science sets now catalogue as C Unit with their printed A label preserved in provenance, and all 34 extra HSTU verified records now share the five canonical A/B shift papers. Migration v9 supports installed databases. Historical RU labels outside those exact captures and HSTU unassigned papers remain unchanged. Owner can cross-check the five consolidated question ranges against the original HSTU PDFs.
