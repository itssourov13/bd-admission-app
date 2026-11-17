# ASPECT Library UX and Runtime Audit

**Date:** 2026-11-17
**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch / audited HEAD:** `feat/import-hstu-verified-answers-2026-11-12` / `c2727b0ce2c7aebe92c911601d0d4fca2b0a9fb7`
**Scope:** Read-only audit of the owner-provided runtime screenshots, ASPECT logo, Library UI, question/answer metadata, exam flow and SQLite query paths.
**Status:** Audit complete; implementation intentionally not started.

## 1. Executive summary

The owner's observations are substantially correct. The main findings are:

1. **Library collection presentation mismatch — confirmed.** The book is intentionally stored under `pub-unidentified` with `collection: ASPECT`, while a separate seeded `pub-aspect` publisher placeholder has zero books. The landing page renders both, so the visible collection appears under Unknown beside an empty ASPECT card. Preserve the source attribution in ADR-038; show the ASPECT collection as the user-facing card without silently claiming the PDF identifies its publisher.
2. **Session grouping — confirmed.** The database already stores nine session parents and seventeen source-set children. The detail screen flattens all 26 rows into one indented list instead of rendering expandable session cards.
3. **Session exam action — confirmed with an important distinction.** Session rows currently expose Flash and Browse only. A whole-book Custom Practice action exists, and the exam engine already accepts book/unit scopes. It deliberately does not treat a publisher book as an official university exam. A session-level timed Custom Practice action can be added without claiming an unsupported official pattern.
4. **Provisional labels — confirmed in the data and UI.** All 1,828 imported questions and the book are currently marked unverified. The UI is behaving according to those flags; it is not inventing the tag. The owner's new statement that the imported material and existing source answers have been checked should be recorded as the verification authority and reflected in the data. Three source-key contradictions and eleven duplicate-option cases still need explicit handling rather than blanket flag removal.
5. **Library loading — confirmed code-level performance issue.** Flash setup executes the same provisional pool query twice in succession when no verified pool exists. Browse performs expensive book-scoped subject-count queries before it renders the first page. Read-only SQLite measurements also show full-question-table scans and costly correlated option checks.
6. **Logo usage — confirmed.** The owner-supplied ASPECT artwork is a 256×256, 77 KB RGBA PNG. It is a good raster asset; tracing this detailed artwork into SVG is not recommended. RU's SVG is already present and used on the Varsity university cards, but the Library book/session cards do not currently use it.

**Overall:** this is a focused Library presentation, metadata, verification-state and query-efficiency follow-up. It does not require a broad redesign or changes to the already owner-checked screens outside these Library paths.

## 2. Audit scope and method

Read-only files and paths inspected:

- Owner screenshots: `/home/kali/screenshort/admission-runtime/Screenshot_2026-11-17-19-36-47-843_com.admissionbd.app.jpg` and `Screenshot_2026-11-17-19-44-50-007_com.admissionbd.app.jpg` (both 1220×2712).
- Owner-supplied logo: `/home/kali/screenshort/admission-runtime/aspect-logo.png` (PNG, 256×256, RGBA, approximately 77 KB).
- Library routes/components, publisher and university logo registries, unit-tree model, repository SQL, Flash/Exam/Browse routes, scoring eligibility predicates and the current generated SQLite seed.
- Existing project guidance and records: `AGENTS.md`, `docs/CURRENT_STATE.md`, `docs/TASK_STATE.md`, `docs/HANDOFF.md`, `docs/RUV_ASPECT_IMPORT.md`, the RU-V source audit and `docs/EXAM_RULE_RESEARCH.md`.

The seed DB was opened read-only. No application source, question data, seed database, image/logo, package configuration, release metadata or runtime behavior was modified. No build, app install or physical-device profiler run was performed in this audit.

## 3. Observation validation

| Owner observation | Audit result | Evidence / conclusion |
| --- | --- | --- |
| ASPECT book appears under Unknown while an ASPECT card also exists | **Confirmed** | Pack publisher is `pub-unidentified`; its collection is `ASPECT`. A separate `pub-aspect` row is seeded with no book. Library landing maps every publisher row into a card. |
| Use the ASPECT logo and make it smaller | **Confirmed** | Supplied file is already a compact 256×256, 77 KB PNG. Use the existing raster logo pipeline and scale it through `BrandLogo`; SVG tracing is unnecessary. |
| RU logo should appear on the university/question-bank card | **Partially confirmed** | RU's original SVG is already registered and displayed in `VarsityScreen`. The missing placement is the Library ASPECT book/detail/session context. Reuse the existing university-logo component; do not add a second copy of the SVG. |
| 17 source sets should be grouped inside session drawers/cards | **Confirmed** | Data is already parent/child structured (9 session parents, 17 set children, 26 total units); the screen renders the flat ordered list with indentation only. |
| Current set cards should visually match the main university cards | **Confirmed** | University cards use a horizontal logo + title/meta + chips + chevron composition. Library set rows are small vertically stacked cards with only two compact actions. |
| Session-wise cards need Standard Exam as well as Flash/Browse | **Confirmed with qualification** | Session rows have no Exam action. Book-level Custom Practice exists. Publisher-book scopes are intentionally unconfigured for official scoring, so add session-level **timed Custom Practice**, not a falsely labelled official RU Standard Exam. |
| Imported questions should not say Provisional after the owner's review | **Confirmed** | Current pack and generated seed mark all 1,828 answers and all 1,828 content records unverified. QuestionCard and book-level state render warning labels directly from those flags. The owner's current verification statement is new and has not yet been recorded in the pack/seed. |
| Library Flash, Custom and Browse take too long to open | **Confirmed at code/query level; device duration not measured** | Flash repeats the same provisional count query; Exam runs one fallback candidate count; Browse performs heavy subject counts before loading its first 20 questions. SQLite plans show full scans and correlated subqueries. |

## 4. Detailed findings

### F-01 — ASPECT collection appears under Unknown beside an empty ASPECT card

**Severity:** Medium — misleading Library grouping and duplicate-looking discovery card.

Current source data:

- Pack: `data/library-packs/ruv-aspect-library-pack.json`
- Book ID: `aspect-ru-question-bank-verified-sets`
- Publisher ID/slug: `pub-unidentified` / `unidentified`
- Collection: `ASPECT`
- Existing metadata publisher row: `pub-aspect`, currently with zero books.
- Current book count: one; question count: 1,828.

The screenshot shows the Unknown card with 1 book / 1,828 questions and the separate ASPECT card with 0 books. This is not two copies of the question bank. It is one book assigned to the unidentified publisher and a separate empty ASPECT publisher metadata row.

**Recommended implementation direction:** follow ADR-038 and keep the internal publisher attribution as `pub-unidentified`; the inspected source does not identify a publisher, while `ASPECT` is the book's collection/brand. At the Library landing presentation layer, display this specific collection row as **ASPECT** (using its collection metadata and logo), and suppress the separate zero-book `pub-aspect` placeholder so the student sees one ASPECT card. Do not globally rename the generic Unknown publisher or move the book to `pub-aspect` unless the owner separately confirms that ASPECT is the actual publisher/imprint. This achieves the owner's requested simple visual correction without rewriting source provenance.

The user has explicitly confirmed in this task that the publication, logo and related use permissions are obtained. The current pack's `permission_pending`, `Not verified` and rights-reference wording are therefore stale against the owner's latest statement. Record the owner confirmation in the rights metadata and use the project's existing `licensed` status where appropriate; this permission confirmation does not, by itself, change the source publisher identity or identify a named rights holder.

Relevant implementation:
- `app/library/index.tsx:36-44,78-99` — fetches and renders publisher rows.
- `data/library-packs/ruv-aspect-library-pack.json:4-30` — current publisher, licence and verification metadata.
- `src/repositories/library.ts:119-130` — publisher/book lookup.
- `assets/publishers/README.md` and `src/features/library/publisherLogos.ts:1-20` — currently document an empty publisher-logo registry.

### F-02 — ASPECT logo format and size

**Severity:** Medium — brand identity/visual polish.

The supplied image is a detailed circular mark with small lettering and multiple fine visual elements. At 256×256 RGBA and approximately 77 KB it is already small enough for an offline app bundle.

**Recommendation:** keep it as PNG, add an optimized/static copy at `assets/publishers/aspect.png`, and register it as `{ kind: "raster", source: require(...) }` in the existing publisher registry. Do not trace it into SVG: a hand-traced/vectorised version is likely to lose the small typography and detail. `BrandLogo` already scales with `contain` inside a white tile, so display sizing should be set by the component rather than by enlarging the source file. A 128 px derivative is optional if it remains crisp at the actual display size; the 256 px original is already only 77 KB.

Use the user's provided file as the source artwork and update the publisher asset README with its supplied-source/owner-permission record during implementation.

### F-03 — Session hierarchy exists, but the screen renders a flat list

**Severity:** High — navigation and information architecture.

The pack contains 26 units: nine root rows of kind `section` (sessions) and seventeen child rows of kind `test` (source sets). The data tree is already correct; `orderUnitTree` returns it depth-first and `listUnits` calculates descendant counts.

The current Library book screen feeds all 26 rows to one `FlatList`, then uses `marginLeft` from depth to imitate nesting. This explains why sessions and individual sets appear as a long, visually uneven sequence.

**Recommended implementation direction:** render nine session cards/accordion drawers, and place each session's child source-set cards inside its expanded body. Keep the existing unit IDs, parent relationships, ordering and question memberships. Session counts must include descendants exactly once.

Expected hierarchy from the current seed:

| Session | Source sets inside | Session question count |
| --- | --- | ---: |
| 2024–25 | Unit A — মহানন্দা; Unit A — পদ্মা | 252 |
| 2023–24 | Unit C — সুরমা; Unit C — মেঘনা | 234 |
| 2022–23 | Unit C — Feldsper-1; Unit C — Quartz-2 | 252 |
| 2021–22 | Unit C — নেপচুন-২; Unit C — ভেনাস-১ | 252 |
| 2020–21 | Unit C — সায়নোভ্যাক | 125 |
| 2019–20 | Unit C — গ্রুপ-০১ | 87 |
| 2018–19 | Unit C — সেট ০২; Unit D1 — সেট ০১ | 211 |
| 2017–18 | Unit C — মেঘনা-৩; Unit F — সেট-১; Unit H — সেট-২ | 245 |
| 2016–17 | Unit C — ODD; Unit F — ODD | 170 |

The source-set cards should sit inside the correct session drawer. Use accessible expand/collapse state and preserve the existing language/theme behavior.

Relevant implementation:
- `app/library/book/[id].tsx:24,40-45,68-92` — loads the unit tree and renders each unit as a separate flat-list item.
- `src/repositories/library.ts:142-159` — builds descendant-aware unit counts.
- `src/features/library/model.ts:55-83` — already orders the hierarchy depth-first.

### F-04 — Library card visuals and RU logo placement

**Severity:** Medium — visual consistency.

The existing Varsity cards already provide the visual pattern the owner refers to: RU logo, university/paper title, compact metadata/chips and chevron. The ASPECT book detail screen has no RU logo in its header, and the unit rows have no institutional mark or matching horizontal information layout.

RU's asset does not need to be recreated:
- Existing source: `assets/universities/ru.svg`.
- Registry: `src/features/catalog/universityLogos.ts:2-19`.
- Existing usage: `src/features/catalog/VarsityScreen.tsx:108-123,139-153`.

Reuse `UniversityLogo` for the ASPECT book/RU context and align the book/session/set cards with the established university-card composition. Do not add the RU logo to generic Home shortcuts that represent every university.

### F-05 — Session cards have no Exam action; an official-pattern claim would be unsafe

**Severity:** High — incomplete practice journey, with scoring integrity constraints.

The current unit rows provide Flash and Browse actions only. The book header separately provides:
- Flash practice for the whole book.
- `Custom practice — whole book` through `/exam/setup`.
- Browse for the whole book.

The exam engine already accepts a `bookId` and optional `unitId`, and repository unit filtering includes descendants. So session-scoped practice can be reached without inventing a new question-pool model. What is missing is a session-level action/card entry point.

However, `planExam` intentionally treats all publisher-book scopes as Custom Practice when no exact paper rule exists. That is correct: the 2024–25 official RU notice describes 80 MCQs per unit and a one-hour test, while each 2024–25 ASPECT source set in this pack contains 126 questions. These source compilations do not prove which 80 questions formed an exact official sitting. The circular also does not establish all scoring fields required for a fully scored session. The other historical source sets do not have verified matching rules.

**Recommended implementation direction:** add a session-scoped **Timed Custom Practice** action (same setup/selection/timer flow, scoped to the session root and all its child sets). Keep the label and notice explicit that it is user-configured practice, not an official RU Standard Exam, and do not silently apply 100/60 or the 2024–25 80/60 rule. If exact official papers/rules are sourced and reconciled later, those can be configured separately.

Evidence:
- `app/library/book/[id].tsx:62-66,74-89` — book actions versus unit actions.
- `src/services/exam.ts:159-172` — publisher-book scopes are deliberately unconfigured.
- `app/exam/setup.tsx:74-89,157-179,254-272` — book scope uses Custom Practice when no exact pattern exists.
- `docs/EXAM_RULE_RESEARCH.md:5-11,35-42` — existing official-rule research and exact-paper integrity contract.
- Primary source cross-check: [Rajshahi University official 2024–25 undergraduate admission circular (issued 1 January 2025)](https://admission.ru.ac.bd/public/ht1NcohAKUrVC6t6Rf0OYgHL92EnKMhHqPdz3LfY.pdf), page 1, section III. It states 100 marks, 80 questions per unit, a one-hour duration, −1 for every four incorrect answers and pass mark 40. The circular does not explicitly state the separate per-correct and unanswered scoring values required by the app's full numeric scoring contract. The PDF page was visually checked against the extracted text.

### F-06 — Provisional state is data-driven; record the owner's new verification instruction

**Severity:** High — answer trust and scored-practice eligibility.

The current pack and generated seed contain 1,828 questions, with every question's `answer_status` and `content_status` set to `unverified`. The book-level `verification_status` is also `unverified`. `QuestionCard` shows answer/content chips from those fields; `bookPracticeState` derives the book's provisional state from verified and review-candidate counts.

The owner has now explicitly said the imported questions have been checked and that the existing source answers should be treated as the source of truth. This is a new owner verification instruction and should be recorded as provenance/verification evidence, not handled by simply hiding a badge in the UI. It also does not mean the keys were independently solved by the app team or certified by Rajshahi University.

Current imported-record shape in the pack:
- 1,797 single-choice questions with one printed source answer marker.
- 6 multiple-choice questions with multiple correct markers (five have two correct options; one has three).
- 22 questions with no correct option printed in the source.
- 3 questions whose source keys conflict; their answer keys were withheld.
- 11 additional duplicate-option questions are excluded by the current provisional candidate predicate.
- 154 raw extraction records were excluded from this import (38 non-MCQ records and 116 MCQs whose options could not be extracted reliably); these are outside the current 1,828-question book and should not be silently counted as imported/verified.

Important implementation detail: app-wide multiple-choice selection is already implemented in the current branch. `QuestionCard` renders checkbox semantics, Flash has an explicit submit action for multi-select, and Standard Exam persists arrays of selected keys and scores exact-set matches. Do not treat multi-select support as a missing shared-engine feature or reimplement it for ASPECT only.

**Recommended verification handling for Claude:**

1. Record the owner's review/attestation in the pack's source/coverage/verification notes, with the audit date and clear scope: owner-checked imported questions and source-printed answer keys are accepted as the answer source of truth.
2. Promote the answer/content status for records the owner has verified, keeping question text/content status and answer-key status distinct. Set the book-level verification status accordingly so the correct verified state is reflected throughout Library.
3. Treat the 22 printed no-correct-option marks as a verified source disposition (not as a correct option). Keep them out of scored pools.
4. The six multiple-answer records can use the existing multi-select runtime after their source key arrays are preserved and verified.
5. Keep the three conflicting-key records unscored with an unresolved/unknown answer state until the conflict is resolved; do not invent a missing key.
6. Reconcile the eleven duplicate-option records explicitly. The current `REVIEW_CANDIDATE_SQL` excludes duplicate option text, but `ELIGIBLE_SQL` does not. If those records are marked verified, they can enter the scored pool unless the duplicate hold is resolved or a durable eligibility guard is retained. Compare them with the source/owner review, preserve faithful source text, and make their scored/browse-only disposition explicit.
7. Do not change correct-option IDs, option order or question text just to remove a badge. Regenerate the SQLite seed and test the installed-database sync/version path after any data change.

Relevant implementation:
- `data/library-packs/ruv-aspect-library-pack.json:23-30` — current licence, book and verification wording.
- `src/repositories/content.ts:10-29` — verified eligibility and provisional candidate SQL.
- `src/components/common/QuestionCard.tsx:40-80` — question-level status chips.
- `src/features/library/model.ts:48-53` — ready/provisional/none state.
- `src/types/domain.ts` and current Flash/Exam selection paths — source answer status and multi-answer behavior.

### F-07 — ASPECT Library loading: specific avoidable work identified

**Severity:** High — perceived delay in key journeys.

Confirmed code paths:

- **Flash setup:** `app/flash/setup.tsx:52-59` first runs the verified `countPoolBySubject`. If the result is empty, it runs the provisional-inclusive query once to test whether candidates exist, then runs the exact same provisional-inclusive query again to obtain the pool. For the current ASPECT book, verified count is zero and the provisional candidate count is non-zero, so this duplicates an expensive query.
- **Custom/Exam setup:** `app/exam/setup.tsx:74-80` already runs one provisional fallback and reuses that result. Do not add a second copy while changing labels or card actions.
- **Browse:** `app/browse.tsx:60-72` waits for `countQuestionsBySubject` (a grouped query plus a separate total query) before loading the first 20 questions. The first page itself is paginated; the subject-count path is the likely bottleneck.
- **Book detail:** `getBook` calls the shared book query, which separately calculates total, eligible and review-candidate counts; `listUnits` then fetches unit rows and recursive descendant counts.

Read-only query baseline against the 17 MB generated seed DB (9,600 questions overall; 1,828 ASPECT memberships), measured on the audit host, **not on an Android handset**:

| Equivalent SQLite query | One-pass elapsed time |
| --- | ---: |
| Verified eligibility count predicate | 1,024.78 ms |
| Provisional candidate predicate | 2,539.77 ms |
| Book-scoped browse subject grouping | 3,559.31 ms |
| First-page question-ID selection query | 3.95 ms |

These are single-run diagnostic timings, not statistically reliable device benchmarks or an end-to-end screen measurement. The query plans show `SCAN q` for eligibility/candidate predicates; the candidate path also performs correlated option counts and duplicate-text matching. The book-scoped subject grouping scans the question subject index and checks book membership per row.

**Recommended implementation direction:** first remove the duplicate Flash candidate query and reuse the one computed result. Then profile/rewrite book-scoped counts to start from the small `content_unit_questions` membership set (1,828 rows) rather than scanning the full question catalogue; combine compatible aggregates where practical; preserve exact eligibility and duplicate guards. Keep Browse pagination at 20 and avoid loading all question bodies at entry. Compare the same queries before/after and capture actual physical-device entry timings when the updated APK is available.

## 5. Implementation priorities for Claude

This is the recommended sequence, not a request for this audit pass to implement code:

| Priority | Work | Expected result |
| --- | --- | --- |
| P1 | Publisher mapping + rights/verification metadata + content-version/seed propagation | One correct ASPECT publisher card; owner authorization represented; verified state shown from real data |
| P1 | Source-answer eligibility reconciliation | No unresolved/ambiguous item accidentally becomes scored; verified multi-answer items use existing shared runtime |
| P1 | Remove repeated Flash query and optimize Library book-scoped counts | Lower entry wait for Flash, Custom and Browse |
| P2 | Session accordion/drawer and consistent card design | Nine clear session cards containing seventeen set cards |
| P2 | Per-session timed Custom Practice action | Session-level exam-like practice without falsely labelling it an official RU exam |
| P2 | ASPECT PNG + existing RU SVG in Library cards | Brand/institution identity appears at compact, consistent sizes |

## 6. Acceptance checklist

### Publisher, logo and rights
- [ ] Exactly one ASPECT collection card displays the 1,828-question book; no competing empty ASPECT placeholder or Unknown-labelled duplicate is shown for this ASPECT collection.
- [ ] Preserve `pub-unidentified` as the source-level publisher attribution under ADR-038; generic `Unknown / not identified` remains available for genuinely anonymous future content. Do not relabel unknown publishers as ASPECT globally.
- [ ] ASPECT uses the provided PNG through the existing raster logo registry; it is crisp, proportionate and compact in light and dark themes.
- [ ] RU Library card reuses `assets/universities/ru.svg` through `UniversityLogo`; no duplicate logo asset is added.
- [ ] Owner-confirmed permissions are recorded in book and asset provenance; obsolete `permission_pending` wording is reconciled.

### Session navigation and exam
- [ ] Nine session drawers render in descending session order; all seventeen source sets appear under the right parent.
- [ ] 2024–25 expands to exactly মহানন্দা and পদ্মা, each with the existing 126 questions; parent count remains 252.
- [ ] Session and set actions preserve their exact `bookId` + `unitId` scope for Flash, Custom Practice and Browse.
- [ ] Session exam action is clearly labelled timed Custom Practice / non-official until an exact source-backed paper rule exists.
- [ ] Accordion state is accessible (expanded state announced), tap targets are usable, and Bangla/English + light/dark layouts remain correct.

### Verification and data integrity
- [ ] Owner review authority and scope are recorded; book/question flags, Library chips, question chips, answer display and practice counts agree.
- [ ] Existing source answer keys and option order remain unchanged unless an explicit source-backed correction is documented.
- [ ] 22 no-correct-option records remain unscored as verified source dispositions; the three contradictory keys remain unresolved/unscored.
- [ ] Six multi-answer records are exercised through Flash and Standard Exam, including persisted selection and exact-set result behavior.
- [ ] Eleven duplicate-option records are source-reconciled or continue to be excluded by an explicit verified-question eligibility guard.
- [ ] 154 excluded source records remain outside the book count and are not silently reintroduced.
- [ ] Bump the LibraryPack content version when changing synced metadata/status so existing installs receive the update; verify fresh install, existing database upgrade, repeat sync and newer-installed-edition protection.

### Performance and regression
- [ ] Flash setup performs only one provisional-inclusive count for its fallback pool.
- [ ] Browse first-page rendering does not wait on a full-catalogue scan for book-scoped counts.
- [ ] Book/Flash/Custom/Browse counts remain numerically consistent with the session/set membership.
- [ ] Query plans and before/after timings are captured; actual Android entry times are checked on the owner's device.
- [ ] Focused tests, TypeScript, lint, content/asset checks and Android Metro export pass; no unnecessary browser E2E run.
- [ ] Final diff contains only the intended Library implementation, tests, data/seed outputs and documentation.

## 7. Claude handoff

Claude should re-check the current branch and the source files before implementation, then own the detailed implementation plan and focused execution. Use this audit as the issue/evidence map; do not reproduce the stale historical statements in earlier interim audits as current facts. In particular, the app-wide multiple-choice runtime is already present.

Keep the change targeted to the ASPECT Library and shared Library query paths. Preserve the question source, existing answer keys, unit IDs, question memberships, attempt/bookmark/history data and the seed-sync newer-edition protection. Do not redesign unrelated Home/University screens or alter other publishers. The user has authorised use of the supplied publication/logo and confirms the imported questions/answers have been checked; record that owner attestation instead of reopening a permissions gate. Do not claim that a custom session practice is an official university exam.

## 8. Audit limitations and final integrity check

- The owner supplied the two screenshots and the ASPECT logo; visual observations were checked against the current source implementation.
- SQLite query timings are host-side, one-pass diagnostics. No physical Android timing/profiling was available.
- No app source, question pack, SQLite seed, image/logo, dependency, app configuration, release version or APK was changed by this audit.
- No application tests/build were run because the application was not modified. The audit verified current source paths and read-only generated-seed facts; implementation checks remain for Claude's change.
- Project working tree was clean at the start of this audit; the audited HEAD was `c2727b0`.

**Audit verdict:** owner's main observations are valid. The key correction is that the desired session action should be presented as non-official Timed Custom Practice unless exact original RU papers and full scoring rules are separately verified. The highest-risk implementation detail is not to make the provisional badge disappear without reconciling the 11 duplicate-option and three conflicting-key records and propagating the real verification state into the seed.
