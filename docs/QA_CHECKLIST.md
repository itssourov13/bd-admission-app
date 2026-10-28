# QA checklist

Last verification pass: **2026-10-28**, Node 22.23.1, pnpm 11.10.0, workspace /home/kali/gpt-workspace/bd-admission-app.

## Automated checks

| Check | Result | Notes |
|---|---|---|
| Dependencies installed / lockfile present | [x] Pass | Existing node_modules and pnpm-lock.yaml; Node and pnpm versions verified. |
| Expo config resolution | [x] Pass | pnpm exec expo config --type public exited successfully. |
| Automated tests | [x] Pass | pnpm test: **46 passed, 0 failed**. |
| TypeScript | [x] Pass | pnpm typecheck exited successfully. |
| ESLint | [x] Pass | pnpm lint exited successfully. |
| Expo Doctor | [x] Pass | pnpm doctor: **21/21 checks passed**. |
| Android JS bundle without bytecode | [x] Pass | expo export --platform android --no-bytecode exported /tmp/bd-export; Android JS bundle about 3.4 MB. |
| Standard Android export with Hermes bytecode | [ ] Blocked on this host | pnpm export:android fails after Metro bundling because hermesc exits with SIGILL. This has not been shown to be an application-code error; a compatible build host/EAS check is still needed. |
| Installable APK/AAB and native launcher/splash | [ ] Not run | No successful release artifact verified in this pass. |
| Physical device or emulator QA | [ ] Not run | No device run has been performed. |

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
- [ ] Verify a real user-provided pack end to end, including source/page/question numbers, option ordering and Bangla Unicode, when PDFs are available.
- [ ] Review imported record counts and every source/appearance against the original PDF before release.

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

- [x] Current MVP Standard Exam refuses to start below 100 eligible questions and uses exactly 100 when available.
- [ ] Before release, verify that Standard Exam question count, duration and relevant section rules are selected from the official pattern for the selected institution/paper/year/session; test different patterns (e.g., 100, 80 and 60 questions) rather than assuming one universal format.
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
- [ ] Back button, exit confirmation, exam grid and timeout navigation behave correctly.
- [ ] Flash timer refreshes correctly after the app returns from background.
- [ ] Exam timer, answer changes, auto-submit, result review and relaunch recovery work on device.
- [ ] Branding, launcher icon and splash are visually confirmed in a native build.
- [ ] Check accessibility labels and screen-reader focus for key controls.

## Release gate

Do not describe the app as release-ready until a compatible Android build is installed and exercised, actual question packs are reviewed/imported, verified marking rules are configured where applicable, and the outstanding device checks above are recorded.
