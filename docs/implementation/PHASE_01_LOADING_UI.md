# Phase 1 — Loading UI Polish

**Status:** Implemented — Pending Owner Verification (2026-11-13)
**Branch:** feat/import-hstu-verified-answers-2026-11-12 (no push)

## Objective
A continuous startup sequence: native splash → loading UI → Home, with no blank frames, colour jumps, spinner flashes or stalled splash; consistent branding; correct first-launch vs returning behaviour; Reduce Motion respected; existing startup coordination and DB initialisation unchanged.

## Initial state (validated against code, not only the audit)
Commit 15f7602 (2026-11-11) had already implemented: branded SetupScreen only for first run/failure; returning launches keep the native splash and release the setup-layout gate directly; one-shot Home-ready gate (`useMarkHomeScreenReady` / `useWaitForHomeScreenReady`); staggered native-driver checkmark animation; pure `startupUiPolicy.ts`. Those are preserved untouched.

## Findings (remaining gaps)
1. **Silent long returning launch.** A returning launch that re-syncs packs (new app release / content import, e.g. the HSTU promotion) holds the native splash with no progress UI for the whole sync.
2. **Unbounded Home-ready gate.** Splash (returning) and overlay (first run) wait on Home reporting ready. If Home is not the initial route (deep link/restored route) or its query stalls, the splash/overlay never leaves.
3. **Splash → setup colour/brand jump.** Native splash is a flat `bgBody` fill + icon. SetupScreen showed the `signin` gradient immediately and its brand mark/content faded in from opacity 0, so the swap showed a colour change and a momentarily empty frame. On Android `SplashScreen.setOptions({ fade })` is iOS-only (Expo docs), so the hide is a hard cut and the first JS frame must match.
4. **Ready hold too long.** 700 ms hold vs ≈440 ms needed by the last checkmark (index 4 × 65 ms stagger + 180 ms); audit target ≤ 400 ms-ish; no hold needed under Reduce Motion.
5. **Spinner micro-flashes** (audit L3): `useQuery` starts `loading: true`, so every screen's first query flashed `LoadingView`'s spinner for tens of ms.

## Implementation approach / decisions
- All thresholds live in the pure module `src/services/startupUiPolicy.ts` (testable, documented): `RETURNING_ESCALATION_MS = 1500`, `HOME_READY_TIMEOUT_MS = 4000`, `FIRST_RUN_READY_HOLD_MS = 520`, `REDUCED_MOTION_READY_HOLD_MS = 150`, `LOADING_INDICATOR_DELAY_MS = 150`, `shouldEscalateReturningStartup`, `readyHoldMs`.
- **Escalation (not a new screen):** after 1.5 s from resources-ready, a still-syncing returning startup sets the existing sticky `setupRequired` flag so the existing SetupScreen mounts with real progress. No fake progress, no new component.
- **Fallback timer** on the Home gate releases splash/overlay after 4 s; it only fires when Home never reports.
- **SetupScreen first frame:** root has flat `colors.bgBody`; gradient is a separate layer fading in with `enter`; brand mark/name/tagline render immediately (no fade); only the progress card and note fade/slide. Exact logo-position match with the native splash is not possible (splash centres a 196 dp icon; setup is a column layout) — documented limitation, but there is no colour jump and no empty frame.
- **Hold:** SetupScreen now derives hold from `readyHoldMs(reduceMotion)`; the `holdMs` prop was removed.
- **LoadingView** renders an empty `flex-1` view for 150 ms before showing the spinner; no call-site changes.
- Rejected: animated splash via Reanimated (extra native work, audit option c); in-Home skeleton progress (couples sync progress to Home; revisit in Phase 9); changing splash assets/dark splash (needs native rebuild; belongs to Phase 6).

## Files
Modified: `app/_layout.tsx`, `src/components/startup/SetupScreen.tsx`, `src/components/common/StateViews.tsx`, `src/services/startupUiPolicy.ts`, `tests/startupUiPolicy.test.ts` (+2 tests). Added: `docs/implementation/*`. No DB/migration, dependency, config or version changes.

## UI/UX changes
Seamless splash→setup colour; brand mark continuous; shorter first-run completion (≈180 ms less); instant completion under Reduce Motion; no spinner flash on fast loads; slow returning updates now show progress; splash can never hang on Home.

## Verification status
- Inspected: audit §5.1, STARTUP_UI_AUDIT.md, `_layout.tsx`, `SetupScreen.tsx`, `provider.tsx`, `useQuery.ts`, Home, `StateViews.tsx`, splash config, Expo SplashScreen docs.
- Lightweight checks run: `node --test tests/startupUiPolicy.test.ts` (5/5 pass); `tsc --noEmit` (no errors), ESLint on the 5 touched files (no findings), `git diff --check` (clean).
- **Deliberately deferred (owner):** full test suite, release build, device checks — first run, returning launch, returning launch with updated content (escalation), DB failure/retry, Reduce Motion, deep-link launch, tab-switch spinner, setup→Home flash via screen recording.

## Known limitations
- Splash icon and setup logo positions differ (see above).
- Escalation/timeouts are heuristics; tune after device timings (`startupMetrics.summary()`).
- Dark mode splash/StatusBar remain Phase 6.

## Next-phase dependencies
Phase 2 is independent. Phase 6 must revisit the flat `bgBody` splash base, `StatusBar`, and `userInterfaceStyle`.
