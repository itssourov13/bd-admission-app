# QA checklist

Last verification pass: **2026-10-28**, Node 22.23.1, pnpm 11.10.0, workspace /home/kali/gpt-workspace/bd-admission-app. Subject-filter and scrollable-exam changes verified in this pass.

## Automated checks

| Check | Result | Notes |
|---|---|---|
| Dependencies installed / lockfile present | [x] Pass | Existing node_modules and pnpm-lock.yaml; Node and pnpm versions verified. |
| Expo config resolution | [x] Pass | pnpm exec expo config --type public exited successfully. |
| Automated tests | [x] Pass | pnpm test: **54 passed, 0 failed**; includes all existing source/import/scoring/session tests plus focused canonical subject ordering, source ordering, subject counts, and serialized answer-selection queue tests. |
| Real pack validation/index | [x] Pass | Both DU A Unit packs validate with 0 errors/0 warnings; `pnpm packs:index` bundles two packs. |
| Real pack import integration | [x] Pass | 180 questions, 720 options, 180 source appearances, 2 papers/rules/sources, 1 DU institution; 175 eligible questions, 3 unknown-answer questions and 2 content-unverified questions (one figure-only physics item and one unclear mathematics formula); re-import is idempotent. |
| TypeScript | [x] Pass | pnpm typecheck exited successfully. |
| ESLint | [x] Pass | pnpm lint exited successfully. |
| Expo Doctor | [x] Pass | pnpm doctor: **21/21 checks passed**. |
| Android JS bundle without bytecode | [x] Pass | expo export --platform android --no-bytecode exported `/tmp/bd-admission-final-export`; Android JS bundle is approximately 3.5 MB with both question packs bundled. |
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
| Media assets and path references | [x] Pass | 45 assets (2,356,641 bytes); all 46 asset references exist and local file hashes are recorded. Current app renderer does not display `assetPaths`, so visual/use readiness is still blocked. |
| Candidate answer/content review | [ ] Not verified | All 4,009 curated questions and keys remain unverified; zero answer keys were independently checked against an official RU key. The 158 held records need historical subject-scope review. These packs must not be used for scored practice. |
| App automated tests | [x] Pass | `pnpm test`: 54 passed, 0 failed. |
| TypeScript | [x] Pass | `pnpm typecheck` exited successfully. |
| ESLint | [x] Pass | `pnpm lint` exited successfully. |
| Expo Doctor latest rerun | [ ] Environment/network blocked | The 2026-10-29 run reached Expo Doctor but failed when an Expo API fetch ended with `SocketError: other side closed` / “Could not fetch bundled native modules.” This is a network-dependent check failure, not evidence of an application-code defect. The prior 2026-10-28 21/21 check pass remains unchanged above. |
| App import or pack-index update | [ ] Not performed | RU C data remains in the external staging directory. `src/content/bundledPacks.ts` and app `data/question-packs/` were not changed by this research task. |

The 44 packs are **schema-staged, not content/key verified**. Before app import, reconcile each variant with its matching original paper, review the 14 duplicate-option cases, verify answer keys, add/test image rendering, and check counts/exclusions. See `docs/QUESTION_IMPORT_WORKFLOW.md` and external `research/IMPORT_READINESS.md`.
