# Startup UI runtime audit

**Audit date:** 2026-11-11
**Scope:** Read-only audit of the startup/setup screen, five-stage progress indicators and setup-to-Home transition.
**Workspace:** /home/kali/gpt-workspace/bd-admission-app
**Branch:** fix/profile-persistence-math-render-exam-rules-2026-11-05
**Audited HEAD:** 4bc3894 (docs: log owner runtime follow-up notes)
**Result:** Findings confirmed from source; no application code was changed. This document and linked project-status notes are documentation-only.

## Executive findings

| Owner observation | Audit result | Confidence |
|---|---|---|
| The branded loading/setup page should appear only on the first successful app setup, not on every later open. | **Confirmed.** The current implementation intentionally mounts it on every cold process launch, including returning users. The returning-user mode only changes the explanatory note and completion hold duration; it does not suppress the screen. | High |
| The five stage ticks do not visibly complete one after another. | **Partially confirmed.** The five stage states are advanced in sequence from real startup work, but the checkmark itself is rendered as a static icon swap. There is no dedicated checkmark transition or minimum visibility time for short stages. | High for source behavior; device perception depends on timing |
| A brief square flash appears while moving from setup UI to Home. | **Plausible code path identified; exact cause unconfirmed.** The root Stack is mounted when the database becomes ready, while the setup overlay exits. Home then starts its own asynchronous initial query and first renders a generic loading state. There is no explicit handoff signal saying Home's first content is ready before the setup overlay disappears. | Medium for the contributing path; low for the exact visual root cause |

## 1. Why the full setup UI appears on returning launches

- DbProvider initializes its state as loading whenever the React app process mounts and starts the startup coordinator from its effect (src/db/provider.tsx:76-85, 163-169).
- AppShell renders SetupScreen whenever app resources are ready and the component has not been dismissed. The visibility condition does not check progress.mode (app/_layout.tsx:38-46, 75-94).
- The mode is detected only after database migration and app-data housekeeping, using whether imported batches already exist (src/services/startup.ts:55-68). The resulting firstRun / returning value is used for the explanatory note and the 700 ms / 120 ms completion hold, not for deciding whether to render the setup UI (app/_layout.tsx:34-36, 83-92).
- The current QA checklist already describes this behavior: the setup interface is shown during startup synchronization on returning launches as well (docs/QA_CHECKLIST.md:100-104).

**Important distinction:** this is a cold-process-launch behavior. Returning from another app while this process remains alive does not normally remount the provider or restart the initial coordinator attempt. A force-stop, process eviction or fresh process launch does run the startup flow again.

### Recommendation

Keep the full branded, five-stage setup UI for a genuine first setup / empty local question library. On returning cold launches, retain the native splash while startup safety work runs, then reveal the app without the full progress card. This must not skip SQLite opening, migrations, stale-session cleanup, overdue-exam finalization or content reconciliation.

There is an important gate to preserve: runStartup awaits waitForSetupScreen() before starting content synchronization (src/services/startup.ts:67-69), and the current setup screen's first layout resolves that promise (app/_layout.tsx:58-61). Simply hiding SetupScreen for returning users without resolving/replacing this gate would leave startup waiting and prevent the seed sync from continuing.

A safe future implementation therefore needs to:
1. Keep the native splash visible until the app has classified the local database as first-run or returning.
2. For first-run, mount the existing branded setup UI, hide the native splash only after its first layout, and preserve the current setup-ready gate.
3. For returning users, resolve the startup UI gate through a separate readiness path and keep the native splash until the database/content startup has completed and the root route is ready to display.
4. Still show a clear retry/error state if opening the database or a migration fails; never leave a failed startup hidden indefinitely behind the native splash.
5. Preserve content synchronization on returning launches when a new app release contains updated packs. Do not expose database-dependent routes before DbProvider is ready: useDb() intentionally throws until then.

The classification currently becomes available only after migration and the first-run database check. The implementation must account for that timing rather than assuming the app knows the install mode at its first React render.

## 2. Five-stage progress and checkmark behavior

The five rows are real startup stages: database, appData, library, finalizing, and ready (src/services/startupProgress.ts:11-15). The stage model assigns the largest portion of the progress bar to the question-library sync (src/services/startupProgress.ts:34-41). runStartup reports the app-data, library and finalizing stage boundaries in order; the provider reports ready after the work returns (src/services/startup.ts:55-69, 74-80, 107-109; src/db/provider.tsx:140-156).

The UI calculates each row from the current stage index. Earlier stages become done, the current stage is active, and later stages remain pending (src/components/startup/SetupScreen.tsx:247-251). However, the row renders a static checkmark-circle when done and an ActivityIndicator when active; there is no dedicated animated transition for the checkmark (src/components/startup/SetupScreen.tsx:164-174).

Stage changes are force-published, and the provider yields briefly to the UI on a phase change. Normal progress updates are throttled to 100 ms (src/db/provider.tsx:24-27, 99-112). This preserves real progress, but it does not guarantee that every short stage remains visible for a full animation interval. Returning synchronization can be extremely short; the recorded 2 ms returning-sync figure is a **Node host benchmark**, not a phone measurement (docs/STARTUP_PERFORMANCE.md).

### Recommendation

- Keep all five stages and their current real-work mapping; do not invent progress or add artificial per-stage delays.
- Add only a small native-driver opacity/scale transition to the active-to-done checkmark (roughly 150–200 ms is a reasonable starting point), using React Native's existing Animated API.
- Keep the current progress-bar fill, shimmer, logo halo, entry/exit treatment and Reduce Motion behavior unless physical-device profiling demonstrates a specific problem.
- Do not add Reanimated, another animation package or a new native dependency for this polish.

The existing progress fill already uses translateX with useNativeDriver: true, and its shimmer, logo halo, entry and exit animations also use native-driver-supported transforms/opacity (src/components/startup/SetupScreen.tsx:122-160, 210-225). React Native's native driver is designed to run supported transforms and opacity on the native UI thread without requiring JS updates on every frame ([React Native Animated guide](https://reactnative.dev/docs/animations)). The current animation foundation is therefore appropriate; the gap is specifically the static stage-icon swap, not a need to replace the animation system.

## 3. Setup-to-Home flash

The source shows this sequence:

1. AppShell mounts the root Stack when state.status === "ready", while the SetupScreen is still rendered above it (app/_layout.tsx:75-94).
2. SetupScreen waits for its configured completion hold (120 ms for returning mode, 700 ms for first-run mode), then fades its root opacity to zero over 320 ms before unmounting (app/_layout.tsx:34-36; src/components/startup/SetupScreen.tsx:217-225, 253-256).
3. When Home mounts, useQuery starts with loading: true and asynchronously reads content totals, the active exam and profile (src/hooks/useQuery.ts:18-20, 26-38; app/(tabs)/index.tsx:17-30). Home first renders its own LoadingView until that query resolves.

This creates a plausible intermediate surface under the fading setup card. The root Stack has no explicit callback confirming that Home's first data-backed view is ready before the setup overlay is dismissed. That is a concrete handoff gap worth investigating, but it does **not** prove that it creates the owner's exact square-shaped flash. A release-build screen recording from the same phone is required to identify the visual frame and distinguish a route mount, Home's loading fallback, layout/background mismatch or another native rendering artifact.

### Recommendation

Treat this as a handoff synchronization issue first, not as a reason to globally slow every animation. In a future targeted fix:
- Keep the setup overlay until the underlying Home screen has completed its initial layout and, preferably, its first required query.
- Avoid exposing a second generic spinner between the branded setup screen and the real Home content.
- Use a single, short native-driver opacity handoff and keep the root, Stack and Home backgrounds consistent.
- Preserve the current animation design and re-check the exact same Android phone with a screen recording before adjusting durations.

Expo documents that the native splash can be held with preventAutoHideAsync() and should be hidden only when content is ready; hiding it too early can expose a blank frame ([Expo SplashScreen documentation](https://docs.expo.dev/versions/latest/sdk/splash-screen/)). This supports using the native splash as the returning-launch cover, but the final hide point still needs to be coordinated with this app's actual route readiness.

## 4. Proposed verification after implementation

| Scenario | Expected result |
|---|---|
| Fresh install / empty local DB | Existing branded setup UI appears; actual stages/progress are visible; retry remains available on a fatal first-run error. |
| Subsequent cold launch with populated DB | No full five-stage setup card; native splash covers required initialization and the app appears only when its data dependencies are ready. |
| Returning launch with a new content bundle | Content reconciliation still runs; the app does not expose partially synchronized data. |
| Returning launch with DB/migration failure | A visible retry/error state appears; no indefinite splash or silent failure. |
| Background and foreground without process death | No unnecessary full setup sequence is replayed. |
| Reduced Motion enabled | Existing accessibility behavior remains respected; the new checkmark transition is disabled or immediate. |
| Setup-to-Home on the physical Android device | No square flash or second spinner; verify with a release-build recording. |
| Existing user data | Profile, bookmarks, practice sessions, attempts and history remain unchanged. |

## Audit boundary

This was a source/documentation audit. No APK was run or screen recording captured during this pass, and no new runtime timing claim is made. The existing host benchmark and prior owner-reported v0.1.4 verification are not substitutes for visual verification of these three observations on the physical phone. No application source code, dependency or build configuration was changed.
