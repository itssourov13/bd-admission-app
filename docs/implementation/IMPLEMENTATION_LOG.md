# Implementation log (roadmap phases 1–10)

Statuses: Not Started → In Progress → Implemented → Pending Owner Verification. Nothing here is Verified/Production Ready.

| Phase | Status |
|---|---|
| 1 Loading UI Polish | Implemented — Pending Owner Verification |
| 2 University identity, logos, filters | Not Started |
| 3 Shared subject selection | Not Started |
| 4 Configurable marking rules | Not Started |
| 5 Standard Exam improvements | Not Started |
| 6 Settings & dark mode | Not Started |
| 7 Home hero redesign | Not Started |
| 8 Publications & books library | Not Started |
| 9 Online + offline content management | Not Started |
| 10 Backend & CMS foundation | Not Started |

## 2026-11-13 — Phase 1
1. Read audit, STARTUP_UI_AUDIT.md, git state (branch feat/import-hstu-verified-answers-2026-11-12, clean tree). Found 15f7602 already covers most of Phase 1.
2. Validated remaining gaps in code; checked Expo SplashScreen docs (fade is iOS-only).
3. Added policy constants/functions + 2 tests; wired escalation timer and Home-ready fallback in `_layout.tsx`.
4. SetupScreen splash-matching first frame; mode-aware hold. Delayed spinner in `LoadingView`.
5. Checks: policy tests 5/5. Details in PHASE_01_LOADING_UI.md.
6. Lightweight checks actually run: `node --test tests/startupUiPolicy.test.ts` 5/5 pass; `tsc --noEmit` no errors; `eslint` on the 5 touched source/test files no findings; `git diff --check` clean. Full suite, builds and device testing NOT run (deferred to owner).
