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
