# QA checklist

Latest automated verification: **2026-11-01**, Node 22.23.1, pnpm 11.10.0; `pnpm test` passes **76/76 tests**, with typecheck and lint passing. The current bundle has **217 packs / 13,609 questions** including separate verified and unverified JU/HSTU banks. The latest Android no-bytecode export passes (2,058 modules / 22 MB JS / 122 assets); the published APK predates the JU/HSTU imports and the new startup UI. New APK/device verification and production AAB/Play Store rollout remain outstanding. Earlier 66-test import checkpoint is retained in the historical table below.

## Startup setup UI verification — 2026-11-01

| Check | Result | Notes |
|---|---|---|
| Startup sequence and failure/retry logic | [x] Pass | Pure `runStartup` tests cover fresh/returning databases, successful/partial/all-failed imports, retry behavior and existing profile/bookmark/content preservation. |
| Progress accuracy and monotonicity | [x] Pass | Stage boundaries are ordered; library progress is weighted by real question counts; the UI labels attempted packs as processed, including failures. |
| Setup screen localization | [x] Pass | Tests confirm each setup stage/detail/chrome key has non-empty Bangla and English translations with expected placeholders. |
| Setup appears before pack module evaluation | [x] Pass | A deferred-gate test proves `loadPacks()` is not invoked until the setup screen layout promise resolves. Root layout includes a splash/setup-gate fallback. |
| React/TypeScript code checks | [x] Pass | `pnpm typecheck` and `pnpm lint` pass after fixing the initial React Hooks refs/effect lint findings. |
| Full automated suite | [x] Pass | `pnpm test`: **76 passed, 0 failed**. |
| Android Metro export | [x] Pass | `pnpm exec expo export --platform android --no-bytecode`: 2,058 modules, 22 MB JS bundle, 122 assets. This is a bundle/export check, not an APK build or on-device check. |
| Physical Android fresh-install UI | [ ] Pending | Build/install a new APK; verify native splash → branded setup → Home, Bangla/English, actual progress, completion transition and airplane-mode behavior. |
| Existing-install update/data preservation | [ ] Pending | Install over the current app without clearing data; check that profile, bookmarks, exam attempts, Flash history and question content remain available. |
| Retry/error and small-screen/accessibility | [ ] Pending | Exercise retry where practical; inspect short-height screens, Reduce Motion, TalkBack labels/focus and touch controls. |

### Device test notes

- The published `v0.1.0-preview.1` APK predates both JU/HSTU import updates and this setup UI. A new EAS preview APK is required.
- Installing over an existing app exercises the returning-install path and should retain its database. To test a true empty-database first install, use a disposable device/profile or deliberately clear/uninstall the app only after accepting that this deletes its local profile, bookmarks, sessions, attempts and history. Do not clear the user's primary installation casually.
- The setup interface is currently shown while the startup synchronization sequence runs, including on returning launches; existing content is not exposed in the background while a new bundle syncs. Background sync remains future work.

## Automated checks

| Check | Result | Notes |
|---|---|---|
| Dependencies installed / lockfile present | [x] Pass | Existing node_modules and pnpm-lock.yaml; Node and pnpm versions verified. |
| Expo config resolution | [x] Pass | pnpm exec expo config --type public exited successfully. |
| Automated tests | [x] Pass | Latest `pnpm test`: **76 passed, 0 failed** under Node 22.23.1. Includes all question-bank/import coverage plus startup progress, fresh/returning startup, failure/retry, data preservation, localization and setup-layout-before-bundle tests. The earlier 66-test run was the pre-setup baseline. |
| Real pack validation/index | [x] Pass | All **217** bundled JSON packs validate with **0 errors / 9,785 warnings**; generated index contains 13,609 questions. The 99 JU-U/HSTU-U packs account for **0 errors / 5,608 warnings** (5,563 unverified-key warnings and 45 repeated-option-text warnings); all source states were preserved. |
| Real pack import integration | [x] Pass | Existing DU, RU C, RU-V and verified JU/HSTU coverage remains. New JU-U/HSTU-U tests cover 99 packs / 5,773 questions, exact state preservation, globally unique references, 5,502 provisional candidates, all 217 packs imported in fresh SQLite with zero failures, and idempotent re-import. |
| TypeScript | [x] Pass | pnpm typecheck exited successfully. |
| ESLint | [x] Pass | pnpm lint exited successfully. |
| Expo Doctor | [x] Pass | pnpm doctor: **21/21 checks passed**. |
| Android JS bundle without bytecode | [x] Pass | Latest `pnpm exec expo export --platform android --no-bytecode` passed with **2,058 modules, a 22 MB JS bundle and 122 assets** after adding the startup setup UI. The export validates Metro bundling only; it is not an APK/AAB build. |
| Standard Android export with Hermes bytecode | [ ] Blocked on this host | pnpm export:android fails after Metro bundling because hermesc exits with SIGILL. This has not been shown to be an application-code error; a compatible build host/EAS check is still needed. |
| Installable Android preview APK | [x] Pass | EAS build `d5e516cd-eefe-44f4-866d-b440ef188da9`; published as [`BD.Admission.v0.1.0.apk`](https://github.com/itssourov13/bd-admission-app/releases/download/v0.1.0-preview.1/BD.Admission.v0.1.0.apk) under GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1). SHA-256: `da7f928827ae6945eddebedc817dabe2c9b0467240dc0d59ec4a0170d0a14f9d`. |
| Physical Android device smoke QA | [x] Owner-reported pass | The owner installed and checked the APK on a physical Android phone and reported normal operation. First load was about one minute; subsequent opens were about 2–3 seconds. Detailed individual checklist steps were not separately logged. |
| Production AAB / Google Play | [ ] Not run | A production AAB, Play Console listing and production rollout have not been completed. |

The no-bytecode export validates JavaScript bundling only. It does **not**, by itself, prove a native build or on-device behavior; the EAS APK and owner-reported phone verification are recorded separately above.

## JU + HSTU import verification — 2026-11-01

| Check | Result | Notes |
|---|---|---|
| Archive integrity and scope | [x] Pass | ZIP SHA-256 `cd3f0b449ae9cb18a254197dfe557198e2039ab74d4e0ff64e2abf69cd972f1b`; 60 JSON members, 57 target JU/HSTU packs, 3 GST packs excluded. |
| New pack schema validation | [x] Pass | 57/57 pass; 0 errors / 125 warnings. |
| Bundle index | [x] Pass | `pnpm packs:index` generated 118 pack imports. |
| Fresh SQLite import | [x] Pass | 118/118 packs, zero failures; 7,836 questions, 31,344 options, 118 batches, 118 papers, 59 rules, 168 sources, 7,836 appearances and 5 institutions. |
| JU/HSTU practice eligibility | [x] Pass | JU 1,393; HSTU 275; combined 1,668 verified single-choice questions. Answer-state totals are recorded in `docs/QUESTION_IMPORT_WORKFLOW.md`. |
| Re-import/idempotency | [x] Pass | All 57 new packs re-imported: 1,819 question rows and appearances skipped; database totals unchanged. |
| Exam patterns | [x] Intentionally unconfigured | All 57 new rules remain `unconfigured`; the app must not label source notes as official exam rules. HSTU historical coverage remains partial. |


## JU-U + HSTU-U unverified candidate-bank verification — 2026-11-01

| Check | Result | Notes |
|---|---|---|
| Source archive and GST boundary | [x] Pass | ZIP SHA-256 `b1de68b088229d8bbeb8e216e7409f2e6de6f88bd14755e766d00a177a9392a8`; 102 JSON members: 84 JU + 15 HSTU imported, 3 GST_CLUSTER packs / 287 questions excluded. |
| Source-data preservation | [x] Pass | Exact round-trip comparison passed for 99/99 transformed pack files after reversing only institution/ID remaps; question text, options, keys, verification statuses, notes, hashes and provenance matched. |
| New pack validation | [x] Pass | 99/99 schema-valid, 0 errors / 5,608 warnings (5,563 unverified-key warnings, 45 repeated-option-text warnings). The provisional candidate filter excludes 42 one-key repeated-option records; 3 additional repeated-option warnings occur outside that single-choice candidate subset. |
| Bundle index | [x] Pass | `pnpm packs:index` regenerated `src/content/bundledPacks.ts` with 217 pack imports. |
| Fresh SQLite import | [x] Pass | 217/217 packs imported: 13,609 questions, 54,436 options, 217 batches, 217 papers, 158 rules (156 unconfigured), 273 sources, 13,609 appearances and 7 institutions. Answer states: 3,694 verified / 9,691 unverified / 224 unknown; content-unverified: 9,784. |
| Verified/candidate separation | [x] Pass | Verified JU remains 50 papers / 1,526 questions / 1,393 eligible; verified HSTU remains 7 / 293 / 275. JU-U remains 84 / 5,011 / 0 verified eligible / 4,780 provisional; HSTU-U remains 15 / 762 / 0 / 722. |
| Candidate practice boundary | [x] Pass | 5,502 source-key candidates are available only in the explicit provisional path; 42 repeated-option questions and 19 multiple-choice records are not included in provisional single-choice scoring. All 99 new rules remain `unconfigured`. |
| Duplicate/overlap handling | [x] Pass | 12 exact text+ordered-option overlaps and 95 same-stem/different-option overlaps were identified; no records were auto-merged. Reused/colliding source IDs were namespaced and all references updated. |
| Re-import/idempotency | [x] Pass | All 99 new packs re-import with question/appearance rows skipped and no row-count drift. The original verified JU/HSTU import test also passes against the current 217-pack dataset. |
| Android JavaScript bundle | [x] Pass | Expo Android no-bytecode export passed: 2,052 modules, 22 MB JS bundle and 122 assets. This is not an installable APK build. |
| Device verification | [ ] Pending | The published `v0.1.0-preview.1` APK predates both JU/HSTU imports. Build/install a new APK and perform owner device QA before treating these additions as device-verified. |

## Data integrity

These areas have automated coverage in the passing test suite:

- [x] Re-importing an identical pack is idempotent.
- [x] Invalid paper/option references and malformed verified-answer references are rejected by validation.
- [x] A failed/invalid import does not leave partial writes; mid-import errors roll back.
- [x] Multiple paper appearances are preserved, and similar wording is not used alone to merge questions.
- [x] Answer/scoring verification state is retained; questions without verified answer/content stay out of the verified pool. A separate provisional pool is labelled, source-key-based and structurally filtered rather than promoting answers to verified.
- [x] User answers, bookmarks and attempts survive content updates/re-imports.
- [x] Database migrations are idempotent and failure paths retain the prior version.
- [x] Validate and import the real DU, RU C, RU-V, JU and HSTU question packs through the SQLite importer; integration tests check institution/paper/question counts, source relationships, answer states, practice eligibility, catalogue queries and idempotent re-import.
- [x] RU-V source/question content was confirmed as verified by the user; that replacement task intentionally did not repeat a question-by-question fact check. JU/HSTU status was supplied through the Muse archive and likewise was not re-verified question-by-question. Per-question answer flags remain unchanged for both datasets. The RU-V automated structure checks require four non-empty options, a mapped explicit answer disposition, subject metadata, unique IDs, and source page/question provenance. Thirty RU-V source questions with repeated option text are separately listed for reference in `IDENTICAL_OPTION_TEXT_AUDIT.csv`; source text was not silently edited.

## Offline and persistence checks — detailed steps not individually recorded

The owner has reported a successful physical-device preview APK smoke test. The individual checks below are retained as a detailed QA record and are not marked complete because separate step-by-step results were not provided.

- [ ] Launch and navigate in airplane mode after database initialization.
- [ ] Browse locally imported institution, paper and question metadata.
- [ ] Confirm search/filter flows do not require network access.
- [ ] Confirm Flash and Standard sessions persist across force-close and relaunch.
- [ ] Background/resume does not reset deadline-based timers.
- [ ] Results, profile, preferences and bookmarks reload after app relaunch.
- [ ] Missing database and migration failure show a recoverable retry state.

## Exam and scoring behavior

These rules have passing automated service tests; device-level interaction is still unverified:

- [x] General Standard Exam requires 100 questions from the active pool; pool may be verified-only or, only when no verified pool exists, the explicitly warned provisional candidate pool. Selected-paper exams use configured paper count/duration where available.
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

## Detailed UI and device checklist — not individually recorded

The broad preview APK installation/smoke verification is owner-confirmed. The individual layout, touch-target and navigation checks below remain unmarked because their separate outcomes were not logged.

- [ ] Long Bangla question text, formulas and multi-line options fit without clipping.
- [ ] Small-screen options and controls have usable touch targets.
- [ ] Tab labels, icons, safe areas and system bars display correctly.
- [ ] Back button, exit confirmation, all-question SectionList scrolling, fixed Submit action and timeout navigation behave correctly.
- [ ] Flash timer refreshes correctly after the app returns from background.
- [ ] Exam timer, answer changes, auto-submit, result review and relaunch recovery work on device.
- [ ] Branding, launcher icon and splash are visually confirmed in a native build.
- [ ] Check accessibility labels and screen-reader focus for key controls.

## Google Play production release gate

The GitHub Android preview has been built, published and owner-verified on a physical device. Do not describe the app as a Google Play production release until a production AAB is built/inspected, the Play Console listing and required privacy/data-safety details are complete, and the account-specific testing/review requirements are satisfied. The source-bank caveats and illustrative exam-rule boundaries elsewhere in this checklist still apply.

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
| Candidate answer/content review | [ ] Not verified | All 4,009 curated question texts and keys remain unverified; zero answer keys were independently checked against an official RU key. A provisional mode is available against third-party candidate keys, with an explicit warning; it is not verified/official scoring. The 158 held records need historical subject-scope review. |
| App automated tests | [x] Pass | `pnpm test`: 54 passed, 0 failed. |
| TypeScript | [x] Pass | `pnpm typecheck` exited successfully. |
| ESLint | [x] Pass | `pnpm lint` exited successfully. |
| Expo Doctor latest rerun | [ ] Environment/network blocked | The 2026-10-29 run reached Expo Doctor but failed when an Expo API fetch ended with `SocketError: other side closed` / “Could not fetch bundled native modules.” This is a network-dependent check failure, not evidence of an application-code defect. The prior 2026-10-28 21/21 check pass remains unchanged above. |
| App import or pack-index update | [x] Imported; provisional mode implemented | 44 RU C packs (4,009 questions) and 45 local PNGs are bundled. All candidate content/answers remain unverified; verified-eligible count is 0, a separate 3,991-item provisional pool is available, 18 items with duplicate normalized option text are withheld, and no RU exam rules were added. |

The 44 packs are **schema-imported, not content/key verified**. The provisional pool supports practice against third-party keys, but its feedback/results may be wrong and are not official or verified scores. Before promoting any candidate into the verified pool, reconcile each variant with its matching original paper, review duplicate-option cases, independently verify answer keys, and perform Android visual QA for the local images. See `docs/QUESTION_IMPORT_WORKFLOW.md` and external `research/IMPORT_READINESS.md`.


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
- [x] `pnpm exec expo export --platform android --no-bytecode` succeeded in the latest pass: Android JS bundle about 12 MB, 1,896 modules and 122 bundled assets including the 45 legacy RU figures.
- [x] 166/166 protected external source/candidate/asset/PDF files were byte-size and SHA-256 identical after import.
- [ ] Confirm question/option transcription and every candidate answer against matching original papers/answer keys; this import did not verify them.
- [ ] Exercise figures and long Bangla/formula layout on Android; create and test a native release build. No APK/AAB or physical-device result is claimed.

## RU C provisional Flash/Standard mode — 2026-10-29

- [x] Reproduced the issue: all RU C candidates were correctly absent from the verified-only pool, but both setup screens offered no alternative.
- [x] Added a separate provisional candidate pool. Only single-choice records with 2+ options, exactly one source key and no duplicate normalized option text are included. Counts confirmed against all bundled RU packs in an isolated SQLite import: 4,009 total, 3,991 provisional candidates, 18 withheld, 0 verified-eligible.
- [x] Flash test: starts from an unverified-only bank when enabled, displays/records source-key comparison, retains provisional session metadata and does not invent a score without an RU marking rule. Standard test: runs 100 candidate questions, grades the selected answer provisionally and retains unverified key status.
- [x] Latest suite: 57/57 tests passed; Node 22.23.1 `pnpm typecheck` and `pnpm lint` passed; `git diff --check` passed.
- [ ] Real Expo Go device testing of university navigation, both modes, question images, selection/timeout/results and Android offline behavior. The current Metro Android development bundle compiled successfully (HTTP 200, 2,042 modules); the no-bytecode export now passes with 1,896 modules; a native release build is still required on a compatible host.
- [ ] Source-paper transcription and all answer-key verification remain outstanding. No official RU scoring rule or final verified status is claimed; APK/AAB release remains outstanding.


## RU verified-source bank — final rebuild/replacement (2026-10-30; supersedes 2026-10-29 initial import)

- [x] Replaced the initial 15-pack / 1,815-question RU-V import with 15 rebuilt schema-v1 packs / **1,828 verified source records**, preserving source PDF hash, session/unit/set, PDF page and printed question number.
- [x] All 1,828 RU-V records have `contentVerificationStatus: verified` and `answerVerificationStatus: verified`; no RU-V question remains `unknown` or `unverified`. This follows the user's confirmation that source questions are verified; no second question-by-question fact-check was performed.
- [x] Answer markers are preserved by meaning: 1,800 single-choice questions are eligible for the current Flash/Standard pool, 22 `X` markers are represented as verified `no_correct_option`, and 6 multi-letter source keys are represented as verified `multiple_choice`.
- [x] Final index: 61 packs / **6,017 total questions** (180 DU + 4,009 separate RU C candidates + 1,828 RU-V). The older RU C candidate bank and both DU packs remain unchanged.
- [x] Exclusion manifest contains 154 written/incomplete extraction records; 30 source questions with identical option text are separately listed in the external warning audit. Page 137's false white-text-shadow banner was fixed and Q4's printed B marker restored.
- [x] Final automated verification at the 2026-10-30 import checkpoint: `pnpm test` 62/62, `pnpm typecheck`, `pnpm lint`, `git diff --check`, all 61 pack validators (0 schema errors), and Android `expo export --platform android --no-bytecode` (1,896 modules / 12 MB / 122 assets) passed.
- [x] Follow-up Android delivery: EAS preview APK built and published under GitHub pre-release `v0.1.0-preview.1`; the owner confirmed installation and successful physical-device smoke verification (see the release summary at the top of this file).
- [ ] Production AAB and Google Play submission remain outstanding.


## CI and native release pipeline setup — 2026-10-31

| Check | Result | Notes |
|---|---|---|
| GitHub Actions workflow file | [x] Merged and run | PR #2 merged; PR workflow [41109514896](https://github.com/itssourov13/bd-admission-app/actions/runs/41109514896) and `main` push workflow [41109555081](https://github.com/itssourov13/bd-admission-app/actions/runs/41109555081) both succeeded. |
| EAS project link | [x] Pass | Project @sk_king13/bd-admission-app, ID 16ba69b8-96d7-4856-a197-77acddebe1ec; EAS project metadata was checked during setup. |
| Resolved Expo config | [x] Pass | Public config resolves app owner, slug, Android package com.admissionbd.app, version 0.1.0 and EAS project ID. |
| EAS build profiles | [x] Configured | `preview` is internal APK; `production` is AAB with version auto-increment. |
| EAS preview APK build | [x] Completed and published | Build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`; APK is attached to GitHub pre-release `v0.1.0-preview.1`. |
| Android installation/device QA | [x] Owner-reported pass | APK installed and checked on a physical Android device; see owner-reported scope above. |
| Production AAB / Play Store | [ ] Not run | Production AAB, Play Console listing and rollout remain outstanding; see docs/ANDROID_RELEASE.md. |
