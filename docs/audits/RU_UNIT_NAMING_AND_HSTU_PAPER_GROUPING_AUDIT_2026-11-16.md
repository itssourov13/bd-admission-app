# RU unit naming and HSTU paper-grouping audit

**Audit date:** 2026-11-16
**Repository:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch / baseline:** `feat/import-hstu-verified-answers-2026-11-12` / `0e141a7`
**Status:** Read-only audit complete; documentation updated. No source code or question data changed.

## 1. Plan and scope

1. Check Git state and current project/import documentation.
2. Inventory RU verified and candidate pack metadata, question subjects, titles, years, units and source labels.
3. Compare RU unit naming against session-specific public admission notices, prioritising RU's own 2024–25 circular and contemporaneous reporting.
4. Inspect all HSTU pack paper records, group identical logical session/unit/shift titles, compare question IDs, stems and subject/question-number positions, and trace the importer/catalogue behavior.
5. Run a focused content-integrity check, record the safe remediation path, and update project handoff documentation.

Git was clean before this audit. This work remained read-only for app code and question data.

## 2. RU unit-name finding — confirmed metadata mismatch

### 2.1 The 2024–25 RU-V packs currently say A Unit, but the questions are Science

The two verified-source packs are:

- `data/question-packs/ru-vq-2024-2025-a-noset-p001.json`
- `data/question-packs/ru-vq-2024-2025-a-noset-p012.json`

Both currently store `unit: "A Unit"` and titles beginning `RU A Unit — 2024-2025`. Their source sets are labelled মহানন্দা and পদ্মা. Each has 126 questions, with Physics, Chemistry, ICT, Biology and Higher Mathematics. Together they contain 252 questions.

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

All five pairs have the same academic session, unit, shift and exact display title, but separate paper IDs. The second HSTU paper IDs use the `hstu-import-...` prefix.

### 3.3 Question-level checks

The following checks were run across all five pairs:

- No question ID collision between the paired packs.
- No exact normalized question-stem overlap between the paired packs.
- No duplicate `(subject, questionNumber)` position between the two segments of any pair.
- The additional 34 questions are verified/answer-verified and practice-ready in the normal HSTU institution.
- The 5 groups account for 285 questions / 274 practice-ready questions when viewed together.

**Interpretation:** the extra 34 questions are not duplicate question rows that should be deleted. They are separate question IDs that have been attached to a second paper row with the same logical paper identity. The fix should consolidate the **paper appearance references**, preserving every question record, source document, source locator and verification status.

The entire normal HSTU catalogue currently has 22 papers / 950 questions / 939 verified practice-ready questions. Consolidating these five duplicate paper identities would make the catalogue **17 logical papers** while keeping the same 950 question records and 939 practice-ready questions. It would not change the question pool totals.

### 3.4 Keep these separate

- HSTU-U pending questions must remain in the separate HSTU-U institution and must not be promoted or attached to normal HSTU unless their accepted verification evidence allows it.
- Older HSTU papers marked `unassigned` because the source does not print a unit must not be merged into A/C or another unit based only on a matching year.
- Do not merge by title alone. Require institution, academic session, unit, shift/group and a source-backed sitting identity.

## 4. Recommended remediation

### A. RU display metadata

1. Keep the current two 2024–25 RU-V paper IDs stable.
2. Change only the paper metadata `unit` and catalogue title from A to C for the two Science sets.
3. Add a provenance note recording that the supplied PDF prints Unit A, while the official 2024–25 RU circular classifies Science as C.
4. Keep the question-bank designation visible; do not claim the 126-question sets are exact 80-question official exam papers.
5. Leave exam-rule values unconfigured unless a matching official paper/rule is verified.

### B. HSTU canonical-paper consolidation

1. Choose the existing `hstu-<unit>-2024-2025-shift-<n>` paper ID as the canonical ID for each of the five pairs.
2. In each corresponding `hstu-unverified-...json` pack, change only the accepted normal-HSTU question appearances from `hstu-import-...` to the matching canonical paper ID.
3. Remove the now-redundant `hstu-import-...` paper metadata and its duplicate **unconfigured** rule from that pack. Keep the HSTU-U paper and its pending records/rule unchanged. Preserve the existing canonical HSTU rule: it is partially verified and stores the official `totalMarks: 100` fact only.
4. Preserve all 34 question IDs, question/option text, correct-option mappings, source documents, source IDs, page/question locators and verified statuses.
5. Preserve the canonical paper's existing partially verified rule (`verificationStatus: verified`, `totalMarks: 100` only). Do not invent per-question marks, negative marking, unanswered treatment, duration or question count. The larger combined question-bank count does not prove an official sitting count or complete paper.

### C. Prevent recurrence

- Introduce an explicit canonical paper identity/key (institution + session + official unit + shift/group/sitting), or reference a canonical paper ID from every source pack representing that sitting.
- Add a content-validation warning/error for two different paper IDs that share a fully specified logical identity across packs.
- Do not rely on fuzzy title matching or automatically merge similar questions.
- Add regression tests that import the split-pack case and assert one paper card, unchanged unique question IDs, unchanged practice-ready count, preserved source references and unchanged user history.
- Keep “unassigned” as an explicit state when unit identity is not evidenced.

## 5. Verification and integrity

- Node **22.23.1** was selected for repository checks.
- `pnpm content:check` passed: **217 packs / 13,609 questions**, generated SQLite seed **22.68 MiB**, content up to date.
- Read-only JSON analysis covered all RU and HSTU packs relevant to these findings.
- Initial Git state was clean at baseline `0e141a7`.
- No application code, configuration, assets, tests, question-pack JSON, generated manifest or seed was changed during the audit.
- TypeScript/lint/full tests were not run because the audit did not change application code. They are required after the proposed implementation, not for this read-only report.

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

**Audit complete; implementation not performed.** The two concrete fixes are the RU 2024–25 Science-set label correction and consolidation of the five duplicated HSTU logical paper identities. Historical RU 2010–15 labels and unassigned HSTU papers need source-specific care. The next implementation task can be scoped to those data/metadata changes plus focused validator/importer regression coverage; no UI redesign is needed for this issue.
