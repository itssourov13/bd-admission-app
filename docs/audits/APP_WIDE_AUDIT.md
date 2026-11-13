# BD Admission — App-Wide Audit (read-only)

- **Date:** 2026-11-13 · **Branch:** `feat/import-hstu-verified-answers-2026-11-12` · **HEAD:** `2a458ac`
- **Working tree at audit start:** dirty with the uncommitted Phase 11 changes (17 modified + 3 untracked files). Nothing was reset, reverted, formatted or committed. `data/`, `assets/` and `scripts/` have no changes.
- **Files written by this audit:** this report and an audit-status section in `docs/HANDOFF.md`. No application code, config, dependency or test was touched.
- **Method:** static inspection of source and of the installed `node_modules` native code only. No tests, lint, typecheck, Expo export, dev server, emulator or browser was run.
- **Evidence tags:** **[STATIC]** read directly in source or installed packages · **[INFERRED]** follows from the code but was not run · **[DEVICE]** needs a phone to confirm.
- **Relation to earlier work:** complements `.local/audits/admission-app-full-audit.md` (product/architecture audit, git-ignored). This report is a stabilization audit of the Phase 11 working tree.

## 0. Executive summary

**Overall health: good. The architecture is adequate, with no Critical defects found.** Two things keep the repo from a clean verification state, and both are small:

1. Two tests encode the old behaviour that Phase 11 deliberately removed (F1).
2. One ESLint rule fails on a single dependency-array line (F2).

The Expo Go `copyAsync` failure is an Expo Go file-system scoping mismatch, not evidence of a production bug (F3). The remaining items are performance polish and small UX refinements. Nothing needs an architectural change.

### Previous issues — outcomes

| # | Issue | Verdict |
|---|---|---|
| 1 | 225/227 tests; provisional Custom Practice and RU-V generic 100/60 | **Both failures are stale tests, not product bugs.** The app behaviour is the intended Phase 11 rule (D1). Fix is test-only (F1). |
| 2 | `react-hooks/use-memo` ×2 at `app/exam/setup.tsx:47` | **Root cause confirmed.** Two `.join(",")` calls inside the dependency array. Runtime impact none; lint gate fails (F2). |
| 3 | Expo Go: `copyAsync` destination "not writable" | **Strongly supported as Expo Go-specific.** Do not assume the APK has it (F3). |

## 1. Confirmed bugs and stability risks

### F1 — Two stale tests fail by design after Phase 11 · **High** (test debt, not a product bug)
- **Where:** `tests/repositories.test.ts:170–183` ("explicit provisional mode can run 100 unverified…"), `tests/ru-verified-bank-import.test.ts:154–161`.
- **Evidence [STATIC]:**
  - `planExam` (`src/services/exam.ts`) now returns `unavailable/no_rule` for any institution scope without a resolved pattern. `startStandardExam` refuses it with `rule_unavailable` unless an explicit `custom` config is passed.
  - The first test starts `{ institutionId: "inst-syn" }` on a pack with `examRules = []` and `includeUnverified: true`. It now gets `ok:false` where it expects `ok:true`.
  - The second starts `{ institutionId: "ru-verified-bank" }` and expects 100 questions / 3600 s. All RU-V pack files I sampled have `examRules: 0` (matches Phase 11 doc §4). The refusal is therefore correct per `AGENTS.md`: no rule may be attached to data that does not match an exact paper.
  - `tests/exam-plan.test.ts` was already updated for the new rule. These two were missed.
- **Impact:** a permanently red suite hides real regressions and blocks the "all gates green" claim before the Phase 11 commit. App behaviour is correct.
- **Fix (tests only):**
  - Provisional test: keep the 100-candidate assertion using a generic scope (`{}`; the synthetic pack is `varsity`). Add one assertion that an institution scope is refused without `custom`, and one that it starts with an explicit `custom`.
  - RU-V test: assert institution scope returns `rule_unavailable`; then start with `custom: { questions: 100, seconds: 3600 }` and assert `customPractice === true`, `ruleStatus === "unconfigured"` and 100 verified questions. Do not use a category scope there, because the test also imports the older RU C pack.
- **Implementation necessary?** Yes (tests). **Do not** restore generic 100/60 for institutions to turn the tests green.

### F2 — ESLint `react-hooks/use-memo` ×2 · **High** (lint gate), no runtime impact
- **Where:** `app/exam/setup.tsx:44–47` (`universityIds` `useMemo`).
- **Evidence [STATIC]:** line 47 is the dependency array containing `(scope.institutionIds ?? []).join(",")` and `(scope.paperIds ?? []).join(",")`. `eslint-plugin-react-hooks@7.1.1` (installed) requires "an array of simple expressions"; call expressions are rejected, which gives exactly two errors. The existing `eslint-disable-next-line react-hooks/exhaustive-deps` does not cover `use-memo`. The result is only used through `universityIds.join(",")` anyway.
- **Impact:** `pnpm lint` fails. Release flow in `HANDOFF.md` requires lint to pass.
- **Fix:** compute `const institutionKey = (scope.institutionIds ?? []).join(",")` and `paperKey` (plain strings) above the hook, and use those identifiers in the deps. Or drop the memo and derive `universityIds` from the key strings. Remove the disable comment; do not disable `use-memo`.
- **Implementation necessary?** Yes (about 4 lines).

### F3 — Expo Go `ExponentFileSystem.copyAsync` "not writable" · **Medium** (dev workflow only; production risk Low)
- **Evidence chain [STATIC]:**
  1. `src/content/bundledSeed.ts` builds the destination from `expo-sqlite`'s `defaultDatabaseDirectory` and passes it to `expo-file-system/legacy` `copyAsync`.
  2. Installed `expo-sqlite` (Android): `defaultDatabaseDirectory = context.filesDir.canonicalPath + "/SQLite"`.
  3. Installed `expo-file-system` legacy module: `copyAsync` calls `ensurePermission(to, WRITE)`. The message `Location '…' isn't writable.` is at `FileSystemLegacyModule.kt:803` and matches the report. Permission comes from `FilePermissionService.getInternalPathPermissions`, which allows only that module's own `filesDir` and `cacheDir`.
  4. Expo docs (legacy FileSystem page): "Within Expo Go, each project has a separate file system scope". The reported path `/data/data/host.exp.exponent/files/SQLite/` is the app-wide directory, outside the project's scope.
- **Conclusion:** the two modules disagree about which "files dir" is allowed, and only in Expo Go. This is **not** a seed defect and not a Metro/tunnel problem. **Confidence:** high on the mechanism class. I did not inspect Expo Go's host-app source or run Expo Go, so the exact scoping class is **[DEVICE]**-unconfirmed.
- **Is the APK at risk?** Evidence says no. In standalone and dev-client builds both modules use the same app context, so the path passes the permission check. `HANDOFF.md` records the owner verifying v0.1.4 on a physical phone, and Phase 11 §1 records owner feedback on the v0.1.5 preview. `bundledSeed.ts` is unchanged in the working tree.
- **Broader (build-independent) risks, all Low:**
  - A first-run copy failure is fatal (`startup.ts`: `if (firstRun) throw`) while a returning launch degrades to a warning. The only recovery is Retry, and the user sees a raw native error string.
  - No free-space pre-check before copying about 24 MB.
- **Recommendation:**
  - Production code: **no change needed.** The v0.1.4 path is owner-verified; touching it risks reintroducing the v0.1.3 failure class.
  - Docs: add a one-line note to `docs/EXPO_LOCAL_PREVIEW.md` that a fresh install cannot complete first-run import in Expo Go; use the APK or a dev client.
  - Optional hardening (only if Expo Go parity is wanted): write the sidecar under `FileSystem.cacheDirectory`, which both runtimes permit, and ATTACH it by absolute path. This needs one verification in Expo Go and one in the APK before it ships.

### F4 — Exam setup flickers and runs duplicate scope queries for university scopes · **Medium**
- **Where:** `app/exam/setup.tsx` (`patternsQuery`, `chosenPattern`, `base` query).
- **Evidence [STATIC]:** `const patterns = patternsQuery.data ?? []` is not gated on loading. Until patterns arrive, `chosenPattern` is null, so the first `base` query runs on the plain institution scope. That yields `plan.kind === "unavailable"`, so the header reads "Custom practice" and the custom card renders. When patterns load, an eligible pattern is auto-selected, `baseKey` changes, and `base` re-runs and the screen flips. `patternsQuery.error` is also ignored.
- **Impact:** visible flicker, doubled pool queries on a screen reached from every institution, and a window where the user could tap Start on Custom Practice (default 30 questions) while expecting the pattern. Observed only by reading; **[DEVICE]** to confirm the visual.
- **Fix:** treat `universityIds.length > 0 && patternsQuery.loading` as loading in the existing loading branch, and key `base` off the resolved pattern. Handle `patternsQuery.error` by falling back to Custom explicitly.
- **Implementation necessary?** Recommended (same file as F2, small).

### F5 — Phase 11 documentation and state drift · **Medium** (process)
- **Evidence [STATIC]:** `docs/implementation/PHASE_11_*.md` still says "In Progress" with an unchecked checklist and "files modified: none yet". The Phase 11 entry in `HANDOFF.md` says "Working tree: dirty (docs only so far)" and "Checks run so far: none". The working tree actually contains the exam-pattern resolver, repository query, setup UI, palettes/HERO tokens, hero redesign and three test files.
- **Impact:** the next session may redo finished work or misreport status.
- **Fix:** after F1/F2 and one verification run, reconcile `PHASE_11`, `CURRENT_STATE`, `TASK_STATE`, `CHANGELOG`, `IMPLEMENTATION_LOG` and `HANDOFF` in the same commit as the code. Status must stay "Implemented — Pending Owner Verification" until the owner checks a device.

### F6 — Expired-exam finalize failure has no automatic retry · **Low**
- **Where:** `app/exam/[id].tsx` (`timeoutTriggered` ref, `submit` catch).
- **Evidence [STATIC]:** the latch is set once and never reset. If `finalizeStandardExam` throws at the deadline, the screen stays at 0:00 with inputs disabled. Only the manual Submit button (which calls `submit("time_expired")` when `remaining <= 0`) recovers, and `finalizeOverdueExam` finalizes it on the next launch.
- **Impact:** only on a rare DB write failure. **Fix (optional):** reset the latch in the catch. Not necessary now.

### F7 — Browse has no stale-response guard · **Low**
- **Where:** `app/browse.tsx` (`first`, `loadMore`, `changeSubject`).
- **Evidence [STATIC]:** unlike `useQuery`, it does not discard out-of-order responses. A subject switch during an in-flight `loadMore` can append a page of the old subject.
- **Fix (optional):** a sequence ref like `useQuery`'s.

### F8 — History and bookmarks silently capped · **Low**
- **Evidence [STATIC]:** `listHistory(db, 100)` in `app/history.tsx`, `listBookmarkIds(d, 200)` in `app/bookmarks.tsx`. Items beyond the cap are unreachable, and bookmarks beyond 200 cannot be removed from the UI.
- **Impact:** only heavy users. **Fix:** `onEndReached` pagination if real usage shows it matters.

### F9 — No route-level `ErrorBoundary` export in `app/` · **Low**
- **Evidence [STATIC]:** no `ErrorBoundary` string anywhere in `app/` or `src/`. I believe expo-router supplies a default boundary, but I did not verify that here. A render-time exception would show a generic, unbranded, non-localized screen. Adequate for now.

### What was checked and found sound [STATIC]
- **Startup:** coordinator is single-flight; per-pack signature checkpoints; transaction-safe resume; first-run vs returning failure policy is coherent (`startup.ts`, `seedSync.ts`, `provider.tsx`). The SQL adapter serializes transactions correctly.
- **Exam rules and data integrity:** institution scopes never fall back to 100/60. Custom Practice is bounded, marked and unscored. Pattern grouping requires one identical complete stored pattern. Rule data is untouched by Phase 11 (no `data/` or seed change). Content integrity was **not re-run** (forbidden); the last recorded gates are 211/211 tests, content:check and SQLite integrity.
- **Exam session:** selection queue drained before scoring, deadline-based timer, finalize is idempotent, Android back is intercepted, swipe-back is disabled, overdue exams are finalized at startup.
- **Flash:** session closes on unmount; stale flash sessions are closed at startup.
- **State coverage:** every data screen has loading and error views via `useQuery` or an equivalent. `app/settings.tsx` has none, but it only displays locally persisted values.
- **Persistence:** settings and language persist via AsyncStorage with swallowed write errors (acceptable); user data lives in SQLite and is never touched by content sync.

## 2. UX improvements genuinely worth implementing

| ID | Item | Where / evidence | Impact | Fix | Necessary? |
|---|---|---|---|---|---|
| U1 | Setup loading gate (F4) | `app/exam/setup.tsx` | flicker, mis-tap risk | see F4 | **Yes (small)** |
| U2 | One-tap "full-length practice" preset for Custom Practice | RU, RU-V, JU-U, HSTU-U now only offer Custom Practice (default 30 questions) after D1; `customCountOptions` offers 100 only by manual pick | the entry is labelled "Mock exam" but lands on a 30-question default | optional preset "100 questions · 60 min — practice, not official" when the pool allows; keep the Custom label and unscored marking | **Product decision.** Not a bug. |
| U3 | "Mock exam" button pops in after an async query | `VarsityScreen.tsx` (`groupPatterns`), `institution/[id].tsx` | minor layout shift | reserve space or gate on the query | Low |
| U4 | Friendly startup-failure text | `SetupScreen` shows the raw native error (a deliberate v0.1.4 debugging choice) | confusing for end users | friendly line plus collapsible details | Low |

All other screens (Home, catalogs, Library, Result, History, Bookmarks, Profile, Settings, themes) showed consistent state handling. Dark mode and hero contrast are covered by `tests/settings-theme.test.ts` and `tests/hero-contrast.test.ts` (not run). Real-device visual checks remain **[DEVICE]** and are owner-pending per the Phase 11 doc.

## 3. Performance and smoothness

| ID | Item | Evidence [STATIC] | Impact | Fix | Necessary? |
|---|---|---|---|---|---|
| P1 | Exam screen re-renders the whole list at 2 Hz | `app/exam/[id].tsx`: `useNow(active, 500)` re-renders the screen. `extraData={{ selected, marks, busy, flagged }}` is a fresh object each render, `renderItem` and `ItemSeparatorComponent` are inline, and `QuestionCard` is not memoized. All windowed rows (`windowSize 7`, with MathText) re-render every tick. | jank on low-end phones during a 100-question exam; battery | move the clock into a small `ExamTimer` component with its own `useNow` (1 s is enough for whole-second display); memoize rows and `renderItem`; stable `extraData` | **Recommended.** Profile once on a device first **[DEVICE]**. |
| P2 | Pattern counts fetch full ID lists | `listExamPatterns` calls `practiceQuestionIds` per pattern just to read `.length`, on Institution, Varsity and Exam-setup screens, on every focus | extra work, no visible issue today | a `COUNT(DISTINCT q.id)` helper with an `includeUnverified` variant | Low |
| P3 | `ELIGIBLE_SQL` uses correlated subqueries on `question_options` | `src/repositories/content.ts` | fine at 13.6k questions; scales with pack growth. Earlier audit flagged this too | measure on device before changing | **No** (adequate; [DEVICE]) |
| P4 | `useQuery` re-runs on every focus | `src/hooks/useQuery.ts` | intentional freshness; previous data stays visible | none | **No** |
| P5 | Single serialized connection | `src/db/adapter.ts` | a long install transaction blocks reads, startup only | none | **No** (adequate) |

## 4. Unnecessary changes to avoid

- **Do not restore generic 100/60 for institution scopes** to make the two stale tests pass. That would silently re-attach a rule no source supports (RU's own circular reads 80 MCQs/unit, and it is not attached to any exact paper).
- **Do not alter the production seed-copy path to "fix" Expo Go.** It is owner-verified on a phone. Any change must be a separately verified, isolated change.
- **Do not suppress `react-hooks/use-memo`** or add global lint overrides. Compute plain key strings instead.
- **Do not add libraries:** no FlashList, state manager, ORM or error-boundary package. FlatList/SectionList virtualization and the current state approach are adequate.
- **Do not paginate History/Bookmarks, add a global ErrorBoundary, or refactor the startup coordinator** now. No evidence of a problem.
- **Do not bump the version, build with EAS or push** until F1/F2 are fixed, verification is green, Phase 11 is committed and the owner has checked a device.
- **Do not add RU or any other university rule** without the exact matching official paper (`AGENTS.md`).

## 5. Recommended implementation priorities

| Priority | Item | Scope |
|---|---|---|
| **Critical** | None found | — |
| **High** | F1 update the two stale tests | tests only |
| **High** | F2 fix the `use-memo` deps (and U1/F4 loading gate in the same file) | `app/exam/setup.tsx`, about 10 lines |
| **High** | F5 reconcile Phase 11 docs, commit after one verification pass | docs plus commit (local only) |
| **Medium** | P1 isolate the exam timer and memoize rows | `app/exam/[id].tsx`, `QuestionCard` usage |
| **Medium** | F3 docs note for Expo Go; optional cache-dir hardening only if parity is wanted | docs, optional code |
| **Medium** | U2 decide on a full-length practice preset | product decision |
| **Low** | P2, F6, F7, F8, F9, U3, U4 | opportunistic |

## 6. Overall health assessment

**Healthy and stable: Good.** Startup reliability, exam integrity, rule honesty and offline behaviour are well designed and consistent with `AGENTS.md`. The current architecture is adequate; no structural rework is justified. The repo is "not yet green" only because of test and lint debt created by Phase 11 itself. Phase 11 is still unverified on a device, and Home hero, dark-mode contrast and the university exam-pattern flow remain owner-pending.

## 7. Smallest practical next-step plan

1. Update the two stale tests (F1). Tests only.
2. Fix `app/exam/setup.tsx`: plain key strings for the memo deps (F2) and a loading gate on `patternsQuery` (F4).
3. Run once: `pnpm test && pnpm typecheck && pnpm lint && pnpm content:check`. Expect all green. This is the first check after the fixes, and it was deliberately not run in this audit.
4. Reconcile the Phase 11 docs (F5) and commit locally. No push, no version bump, no EAS build.
5. Add the Expo Go note to `docs/EXPO_LOCAL_PREVIEW.md` (F3).
6. Owner device check of Phase 11 (hero in both themes, university mock-exam options, Custom Practice fallback), then decide U2 and, if jank is observed, do P1.

## 8. Limits of this audit

Nothing was executed, so test results, lint output and the earlier "225/227" count were taken from the task description and not re-measured. The Expo Go mechanism is supported by installed native source and Expo documentation but not reproduced. Visual, performance and device-level claims are **[DEVICE]** and unconfirmed. Screens were assessed through source for state handling, lists and lifecycle; no screen was rendered.

## 9. Resolution log (2026-11-13)
F1 fixed (tests updated, app untouched). F2 fixed (plain key strings in `app/exam/setup.tsx`). F4 fixed (`patternsPending` loading gate). F3 skipped by owner decision. F5 resolved by the Phase 11 doc and HANDOFF update. F6–F9 and the timer re-render item remain open. Verified with Node 22.23.1: test 227/227, typecheck, lint, content:check, diff --check clean.
