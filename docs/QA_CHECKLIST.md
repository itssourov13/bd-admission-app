# QA checklist

Latest automated verification: **2026-10-29**, Node 22.23.1, pnpm 11.10.0, workspace /home/kali/gpt-workspace/bd-admission-app. RU C Unit candidate import, asset map, and current pack index are included; Android device/release checks remain outstanding.

## Automated checks

| Check | Result | Notes |
|---|---|---|
| Dependencies installed / lockfile present | [x] Pass | Existing node_modules and pnpm-lock.yaml; Node and pnpm versions verified. |
| Expo config resolution | [x] Pass | pnpm exec expo config --type public exited successfully. |
| Automated tests | [x] Pass | `pnpm test`: **55 passed, 0 failed**; includes a new RU C import integration test for all 4,009 candidates, unverified statuses, asset references, zero scoring eligibility and idempotent re-import. |
| Real pack validation/index | [x] Pass | All 46 bundled JSON packs validate with 0 errors; `pnpm packs:index` indexes 46 packs (4,189 total questions). 4,023 RU candidate warnings remain for unverified keys and duplicate-option cases. |
| Real pack import integration | [x] Pass | DU test: 180 questions, 720 options, two papers/rules/sources and 175 eligible. RU C test: 4,009 questions across 44 papers/source documents, no exam rules, all unverified and 0 eligible; re-import is idempotent. |
| TypeScript | [x] Pass | pnpm typecheck exited successfully. |
| ESLint | [x] Pass | pnpm lint exited successfully. |
| Expo Doctor | [x] Pass | pnpm doctor: **21/21 checks passed**. |
| Android JS bundle without bytecode | [x] Pass | `pnpm exec expo export --platform android --no-bytecode` passed with 1,881 modules, a 8.6 MB JS bundle and 122 assets, including all 45 local RU question figures. This is not an APK/AAB build. |
| Standard Android export with Hermes bytecode | [ ] Blocked on this host | pnpm export:android fails after Metro bundling because hermesc exits with SIGILL. This has not been shown to be an application-code error; a compatible build host/EAS check is still needed. |
| Installable APK/AAB and native launcher/splash | [ ] Not run | No successful release artifact verified in this pass. |
| Physical device or emulator QA | [ ] Not run | No device run has been performed. First resolve the observed Expo Go SDK mismatch by installing the matching SDK 57 Android Go build from [expo.dev/go](https://expo.dev/go), or use a dedicated development build. |

The no-bytecode export validates JavaScript bundling only. It does **not** prove a native build, APK/AAB installation, or on-device behavior.

## Data integrity

These areas have automated coverage in the passing test suite:

- [x] Re-importing an identical pack is idempotent.
- [x] Invalid paper/option references and malformed verified-answer references are rejected by validation.
- [x] A failed/invalid import does not leave partial writes; mid-import errors roll back.
- [x] Multiple paper appearances are preserved, and similar wording is not used alone to merge questions.
- [x] Answer/scoring verification state is retained; questions without verified answers are excluded from eligible practice pools.
- [x] User answers, bookmarks and attempts survive content updates/re-imports.
- [x] Database migrations are idempotent and failure paths retain the prior version.
- [x] Validate and import the two supplied real-source packs through the SQLite importer; check total counts, subject counts, Bangla Unicode, source/page/question-number field ranges, answer-key status and idempotent re-import in automated tests.
- [ ] Perform a human line-by-line transcription check of every question and option against the scan before release; diagram-based items currently use text descriptions/labels.

## Offline and persistence checks — manual device work still required

- [ ] Launch and navigate in airplane mode after database initialization.
- [ ] Browse locally imported institution, paper and question metadata.
- [ ] Confirm search/filter flows do not require network access.
- [ ] Confirm Flash and Standard sessions persist across force-close and relaunch.
- [ ] Background/resume does not reset deadline-based timers.
- [ ] Results, profile, preferences and bookmarks reload after app relaunch.
- [ ] Missing database and migration failure show a recoverable retry state.

## Exam and scoring behavior

These rules have passing automated service tests; device-level interaction is still unverified:

- [x] General all-catalogue Standard Exam refuses to start below 100 eligible questions and uses exactly 100 when available; selected-paper exams use the configured paper count/duration where available.
- [x] Unit-test paper-specific question count, duration and four-of-six subject selection for a 60-question/45-minute DU pattern; confirm in tests that incomplete sections are refused and no partial exam session is created.
- [x] Official DU 2025–2026 pattern cross-checked: notice specifies 60 MCQ marks + 40 written marks, 45 minutes each; publisher MCQ-only pattern is intentionally retained as illustrative question-bank practice.
- [ ] Add and test further 80/100-question patterns when corresponding real paper packs with primary-source rules are added.
- [x] Default Flash timer and Standard Exam deadline logic are covered by focused tests.
- [x] Flash does not repeat questions before exhausting its eligible pool.
- [x] Timeout/answer races and exam finalization are guarded against duplicate recording/finalization.
- [x] Exam selections can be changed or cleared before submission; late selections are refused.
- [x] Configured negative marking, fractional scores, zero-answer accuracy, and ungraded-question behavior are tested.
- [x] Illustrative/unconfigured rules are not represented as verified official rules.
- [ ] Confirm the complete behavior on a real Android device with a real verified question pack and rule set.

## UI and device checklist — outstanding

- [ ] Long Bangla question text, formulas and multi-line options fit without clipping.
- [ ] Small-screen options and controls have usable touch targets.
- [ ] Tab labels, icons, safe areas and system bars display correctly.
- [ ] Back button, exit confirmation, all-question SectionList scrolling, fixed Submit action and timeout navigation behave correctly.
- [ ] Flash timer refreshes correctly after the app returns from background.
- [ ] Exam timer, answer changes, auto-submit, result review and relaunch recovery work on device.
- [ ] Branding, launcher icon and splash are visually confirmed in a native build.
- [ ] Check accessibility labels and screen-reader focus for key controls.

## Release gate

Do not describe the app as release-ready until a compatible Android build is installed and exercised, actual question packs are reviewed/imported, verified marking rules are configured where applicable, and the outstanding device checks above are recorded.

## External RU Unit A staging validation — 2026-10-29

- [x] Located source pages and twelve session-specific third-party Google Drive PDF links for 2012-2013 through 2023-2024; all twelve direct download attempts returned permission HTML. Downloaded and visually reviewed the two 7-page 2025-2026 Group 1/2 scans; created a ledger for 2010-2011 through 2026-2027.
- [x] Prepared eight external A-only schema-v1 sample packs containing 21 questions; B/C samples were removed when scope narrowed to Unit A.
- [x] Validated the eight remaining packs with Node 22.23.1; no schema errors, with expected warnings for third-party answer keys explicitly left unverified.
- [x] Confirmed staging is outside `data/question-packs/`; no RU pack index was generated and no RU data was imported or bundled.
- [ ] Inspect 2010-2012 historical A1-A6 sources, obtain/page-audit accessible source papers and independently check answers before claiming year completeness.

## RU C Unit Science staging verification — 2026-10-29

| Check | Result | Notes |
|---|---|---|
| Lokkho source capture | [x] Pass | 44 source variants fully paginated; extracted record count matches source-reported count for 44/44. Total 4,185 source records. |
| External question-pack schema validation | [x] Pass | 44/44 curated schema-v1 pack files pass with zero schema errors. 4,009 core-subject records staged; 158 other-subject labels held for review; 18 records with no usable options excluded/logged. There are 4,023 validator warnings for unverified keys and 14 exact duplicate-option records. |
| Media assets and path references | [x] Packaged; visual QA pending | 45 local PNGs are included in the app asset map; all 46 references resolve. `QuestionCard` renders question-level figures; verify visual sizing/readability on Android. |
| Candidate answer/content review | [ ] Not verified | All 4,009 curated questions and keys remain unverified; zero answer keys were independently checked against an official RU key. The 158 held records need historical subject-scope review. These packs must not be used for scored practice. |
| App automated tests | [x] Pass | `pnpm test`: 54 passed, 0 failed. |
| TypeScript | [x] Pass | `pnpm typecheck` exited successfully. |
| ESLint | [x] Pass | `pnpm lint` exited successfully. |
| Expo Doctor latest rerun | [ ] Environment/network blocked | The 2026-10-29 run reached Expo Doctor but failed when an Expo API fetch ended with `SocketError: other side closed` / “Could not fetch bundled native modules.” This is a network-dependent check failure, not evidence of an application-code defect. The prior 2026-10-28 21/21 check pass remains unchanged above. |
| App import or pack-index update | [x] Imported for browse/review | 44 RU C Unit candidate packs (4,009 questions) and 45 local PNGs are bundled. All candidate content/answers remain unverified; 0 are practice-eligible and no RU exam rules were added. |

The 44 packs are **schema-imported, not content/key verified**. Before allowing scored practice, reconcile each variant with its matching original paper, review the 14 duplicate-option cases, independently verify answer keys, and perform Android visual QA for the local images. See `docs/QUESTION_IMPORT_WORKFLOW.md` and external `research/IMPORT_READINESS.md`.


## Pre-import local verification — 2026-10-29

- [x] `pnpm test` — 54 passed, 0 failed.
- [x] `pnpm typecheck` — passed.
- [x] `pnpm lint` — passed.
- [x] `git diff --check` — passed.
- [x] `pnpm packs:validate data/question-packs/du-a-2024-2025.json` — PASS, 0 errors / 0 warnings.
- [x] `pnpm packs:validate data/question-packs/du-a-2025-2026.json` — PASS, 0 errors / 0 warnings.
- [x] At this pre-import checkpoint, `src/content/bundledPacks.ts` indexed only the two DU A packs. This was superseded by the later 46-pack C Unit browse/review import recorded below.
- [ ] Do not interpret these automated checks as device/release QA: physical Android behavior and a native release artifact remain unverified. RU C content/key validation remains outstanding despite schema validation passing.


## RU C Unit year-by-year audit-only pass — 2026-10-29

- [x] Audited metadata and triage signals for all 4,009 candidates across 44 packs and generated per-session coverage/evidence tables.
- [x] Compared same-year candidate text with partial third-party snapshots and available OCR; recorded potential matches and answer-text mismatches for manual follow-up.
- [x] Protected input integrity: 166/166 hashed existing candidate/source/asset/scan inputs remained unchanged.
- [ ] Original-paper question/options verification: still outstanding for all candidates.
- [ ] Independent answer-key verification: still outstanding for all 4,009 candidates.
- [ ] Review 14 exact duplicate-option cases, 35 third-party answer-text mismatch flags, and 26 repeated-stem overlap groups before any import approval.

Audit files are in `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/`. This audit did not edit or import any question data.


## Latest RU C Unit app import — 2026-10-29

- [x] Copied 44 candidate packs / 4,009 questions into app data; the generated bundle index now references 46 packs total including the existing DU packs.
- [x] Copied 45 normalized local PNG figure assets; all 46 asset references resolve.
- [x] Added QuestionCard figure rendering and a static Metro asset index; no runtime dependencies were added.
- [x] Verified every RU candidate remains answer/content `unverified`; no RU exam rules are imported; scored eligibility for these candidates is zero.
- [x] All 46 JSON packs validate with zero errors (4,023 expected warnings); `pnpm test` 55 passed/0 failed; typecheck and lint passed.
- [x] `pnpm exec expo export --platform android --no-bytecode` succeeded: Android JS bundle about 8.6 MB and 122 bundled assets including the 45 RU figures.
- [x] 166/166 protected external source/candidate/asset/PDF files were byte-size and SHA-256 identical after import.
- [ ] Confirm question/option transcription and every candidate answer against matching original papers/answer keys; this import did not verify them.
- [ ] Exercise figures and long Bangla/formula layout on Android; create and test a native release build. No APK/AAB or physical-device result is claimed.
