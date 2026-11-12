# Phase 5 — Standard Exam Improvements

**Status:** Implemented — Pending Owner Verification (2026-11-13).

## Objective
Improve the Standard Exam: direct navigation, mark-for-review, time-warning UX, an informative submission dialog, per-subject results, filterable review, practice from missed questions and richer history rows — without touching answer persistence, serialized selection writes, absolute deadlines, crash recovery or idempotent finalization.

## Initial state
Exam screen was one SectionList with a header counter, a red timer at ≤5 min and a submit dialog showing only unanswered count. Result screen showed totals and an all-questions review (numbered by internal position, not by the on-screen section order). History rows showed only correct/wrong/total.

## Findings
- Shared subject selection (Phase 3) and marking profiles/scoring consistency (Phase 4) already feed `startStandardExam`; nothing to duplicate.
- The review numbering on the result screen differed from the exam screen's section numbering; fixed by reusing `buildExamSections`.
- Time warnings can be derived purely from remaining time, so no timer state or effect is needed (also correct after app resume).

## Implementation
- **Migration v7** `exam_answer_review_flag`: `session_answers.flagged INTEGER NOT NULL DEFAULT 0`. User-owned data only.
- `repositories/sessions.ts`: `setExamFlag` (same active + before-deadline guard as selections; never touches answer/outcome), `SessionAnswerRow.flagged`. `practiceService`: `persistFlag`, `LoadedExam.flagged`.
- **Retry scope:** `PoolFilter.retrySessionId` + `retry` route param (validated). SQL (`filterClauses`) selects questions with outcome incorrect/skipped/timed_out or unanswered-with-no-selection from that session. Reuses Flash setup/play; locked scope in both setup screens.
- `services/examReview.ts` (pure): `paletteState`, `examProgress`, `timeLevel`, `activeWarning`, `subjectBreakdown`, `reviewStatus`, `matchesReviewFilter`, `resultHeadline`.
- `components/common/ExamPalette.tsx`: numbered grid (colour + flag icon + accessibility label per state), tap to jump.
- Exam screen: palette toggle in header, per-question flag/unflag (optimistic, reverted on refused write), progress line "unanswered · flagged", timer urgency levels (low = last 5 min or 15% of a short exam, final = last minute), warning banner at 10/5/1 min (thresholds > half the exam skipped), submit dialog with answered/unanswered/flagged counts.
- Result screen: per-subject breakdown (when >1 subject), review filter chips (All / Wrong / Unanswered / Flagged), flag marker, "Practice missed questions" button (exam and Flash).
- History: score and accuracy line parsed defensively from stored result JSON.
- ~25 EN/BN translation keys (Bangla not native-reviewed).

## Preserved invariants
Selection queue, `saveExamSelection` guard, `deadline_at`, `finalizeStandardExam` single-finalization guard and recovery of overdue exams are unchanged; flag writes are a separate statement and are refused after finalization.

## Checks actually run (Node 22.23.1)
`tsc --noEmit` exit 0; `node --test tests/exam-review.test.ts` 7/7 pass; targeted ESLint on the 11 touched files exit 0; `node --test` exam-review + marking-profiles + repositories + subject-scope 53/53 pass (includes migrations through v7). Device/emulator, full suite and builds not run.

## Known limitations
- `scrollToLocation` in the sectioned list uses an `onScrollToIndexFailed` retry; behaviour with 100 questions is unverified on a device.
- Flags are shown on the result screen but not stored in history lists. Flagging is exam-only.
- Practice-missed uses the verified pool only; missed provisional questions are not retried unless provisional mode is chosen in setup.
- Per-subject accuracy ignores ungraded answers.

## Deferred testing (owner)
Palette jump on a 100-question exam, flag persistence after killing the app, warning banners at 10/5/1 minutes, submit dialog counts, result filters, practice-missed flow from exam and Flash results, history rows in Bangla, migration v7 on an existing install.

## Next phase
Phase 6 (settings & dark mode): palette and warning colours use `colors`/`feedback` tokens directly and will need semantic theme tokens.

## Related commit
`feat(exams): phase 5 standard exam improvements (implemented; owner verification pending)`.
