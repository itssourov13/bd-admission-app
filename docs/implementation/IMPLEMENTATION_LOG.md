# Implementation log (roadmap phases 1–10)

Statuses: Not Started → In Progress → Implemented → Pending Owner Verification. Nothing here is Verified/Production Ready.

| Phase | Status |
|---|---|
| 1 Loading UI Polish | Implemented — Pending Owner Verification |
| 2 University identity, logos, filters | Implemented — Pending Owner Verification |
| 3 Shared subject selection | Implemented — Pending Owner Verification |
| 4 Configurable marking rules | Implemented — Pending Owner Verification |
| 5 Standard Exam improvements | Implemented — Pending Owner Verification |
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

## 2026-11-13 — Phase 2
1. Validated audit §5.3/§5.4 against code and the seed's 7 institution rows; chose derived parent identity (no migration).
2. Added universities.ts, UniversityLogo + empty logo registry, VarsityScreen with filter bar, PoolFilter.institutionIds (repository, routes, setup screens), batched listPapersByInstitutions.
3. Checks run: tests/universities.test.ts 5/5 (incl. repository parity), tsc --noEmit clean, targeted eslint clean. Full suite/device QA deferred.
4. Logos: infrastructure only; authentic artwork needs owner-supplied licensed files.

## 2026-11-13 — Documentation reconciliation (before Phase 3)
1. Verified Phase 1 (0d47ba7) and Phase 2 (e900521) commits exist; working tree was clean.
2. Fixed stale roadmap references with an idempotent one-off script (not the old helper): CURRENT_STATE.md roadmap block now has a status table; TASK_STATE.md obsolete "Next: Phase 2 (not started)" marked superseded and a status summary added; HANDOFF.md obsolete "Next: Phase 2" marked superseded. Historical entries otherwise untouched.
3. Phase 3 marked In Progress.

## 2026-11-13 — Phase 3
1. Inspected the uncommitted working tree (10 modified, 3 new files) against the previous session's report; it matched.
2. Resolved the react-hooks/purity ESLint error in app/exam/setup.tsx: startStandardExam already defaults `now` to Date.now() at call time, so the screen passes undefined. No rule disabled.
3. Reviewed /tmp/phase_docs.py (idempotent, keyed by section header) and used it with a Phase 3 spec; wrote PHASE_03_SHARED_SUBJECT_SELECTION.md.
4. Checks run: tsc --noEmit exit 0; targeted ESLint on 12 touched files exit 0 (no findings); node --test subject-scope + universities + ui-logic 19/19 pass (requires nvm Node v24.21.0; system node lacks TypeScript support). Full suite, builds and device testing NOT run (deferred to owner).
5. Committed locally as feat(practice): phase 3 shared subject selection. Not pushed.

## 2026-11-13 — Phase 4
1. Inspected the uncommitted tree (12 modified, 6 new files); it matched the previous session's report.
2. Audited every built-in profile value against docs/EXAM_RULE_RESEARCH.md: RU/JU stay 'illustrative' (derived correct mark, assumed unanswered), HSTU partial/unscorable, DU all 'secondary'. JU source label now notes the cross-check with a news report.
3. Found and fixed an integration defect: the automatic generic fallback could score Custom Practice and partial-official papers (HSTU). Added isAutoScoringBlocked, wired it into effectiveRule/startStandardExam/picker, added marking.autoUnscored (EN/BN) and a test.
4. Reviewed migration v6, snapshot persistence, deletion (preferences removed, history unaffected), per-university/global defaults and the management screen; removed two unused-symbol lint warnings in app/marking-profiles.tsx.
5. Checks run (Node 22.23.1): node --test tests/marking-profiles.test.ts 13/13 pass; tsc --noEmit exit 0; targeted ESLint on touched files 0 errors; git diff --check clean. Full suite, builds, device tests NOT run (owner).
6. Wrote PHASE_04_CONFIGURABLE_MARKING_RULES.md and committed locally. Not pushed.

## 2026-11-13 — Phase 5
1. Reviewed the exam/result/history screens and practiceService; Phase 3/4 features were not duplicated.
2. Added migration v7 (session_answers.flagged), persistent mark-for-review, retry scope (PoolFilter.retrySessionId + retry route param), pure examReview.ts and ExamPalette.tsx.
3. Exam screen: palette with jump-to-question, flag button, progress line, timer urgency levels, 10/5/1-minute warnings, submit dialog with answered/unanswered/flagged counts. Result: per-subject breakdown, review filters, practice-missed button, section-order numbering. History: score/accuracy line.
4. Checks run (Node 22.23.1): tsc --noEmit exit 0; targeted ESLint on 11 touched files exit 0; node --test exam-review + marking-profiles + repositories + subject-scope 53/53 pass; git diff --check clean. Device tests, full suite, builds NOT run (owner).
5. Wrote PHASE_05_STANDARD_EXAM_IMPROVEMENTS.md and committed locally. Not pushed.
