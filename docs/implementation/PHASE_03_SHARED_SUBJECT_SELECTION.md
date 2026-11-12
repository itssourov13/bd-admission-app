# Phase 3 — Shared Subject Selection (All / Single / Multiple)

**Status:** Implemented — Pending Owner Verification (2026-11-13).

## Objective
One reusable subject chooser (All, one subject, or several combined) for Flash, Custom Practice and the generic Standard Exam, with correct combined counts, validated route params, sensible Custom Practice sizing, and the selected subjects shown in history and results. Existing university-paper section selection must keep working.

## Initial state
- Flash allowed only one canonical science subject (`subject?: string`), with one count query per subject (`Promise.all` over the science list).
- `PoolFilter.subjects` already existed and was honoured by the SQL layer, but nothing in the UI or route params produced it.
- Exam setup had its own paper-section logic (`selectionConfig`) for university papers; generic exams had no subject choice.
- History/result screens did not show what subjects a session covered.
- The `subject` route param was passed through unvalidated.

## Findings
- Each question has exactly one subject, so the combined pool size for a selection is the exact sum of per-subject counts of the same scope. No extra query is needed.
- Session filters are persisted as JSON. A single subject therefore keeps using the long-standing `subject` field and only 2+ subjects use `subjects`; sessions stored before this phase keep working unchanged.
- Content includes non-science subjects (General Knowledge, IQ, Mathematics, General Mathematics, Geology) that had no translation labels.

## Implementation approach
1. **`src/services/subjectSelection.ts` (new, pure, no React/SQLite/i18n):** selection model (`[]` = all, `[x]` = single, `[x,y,…]` = multiple, max 12), `isValidSubjectName`, `sanitizeSubjects`, `parseSubjectsParam`/`formatSubjectsParam`, `toggleSubject`, `selectedSubjectsOf`, `withSubjectSelection`, `pruneUnavailable`, `combinedCount`.
2. **Route params:** `scopeParams` writes a comma-separated `subjects` key only when non-empty. `scopeFromParams` parses it through the validator; the single `subject` param is now validated too. Invalid or oversized values are dropped, never passed to SQL or UI.
3. **`countPoolBySubject` (`repositories/content.ts`):** one grouped query returns total and per-subject practice-pool counts (verified, or verified + review candidates when `includeUnverified`). It deliberately ignores any `subject`/`subjects` on the filter, because the counts describe the scope the selection is made from.
4. **`SubjectSelector` + `useSubjectLabel` (`components/common`):** one chip control. "All" clears; tapping subjects builds a single or multiple selection; a summary line shows the combined count. `ChoiceChip` gained a `multi` prop (checkbox accessibility role/state instead of radio).
5. **Flash setup:** replaced the single-subject chips and per-subject queries with `countPoolBySubject` plus `SubjectSelector`. Scope-level data is queried once per scope, so toggling chips does not re-run those queries. The rule notice is a separate query keyed by the selection.
6. **Exam setup:** generic and custom flows use `SubjectSelector`. University paper section selection (`selectionConfig`, `selectedSections`) is preserved. Custom Practice options come from the pool (below).
7. **Custom Practice sizing (`services/exam.ts`):** `customCountOptions`, `defaultCustomQuestions`, `clampCustomQuestions`, `suggestCustomMinutes`, `customMinuteOptions`. Counts are presets that fit the pool, plus "all of it" when it fits the limits. Duration defaults to the generic exam pace (0.6 min/question, rounded up to 5 minutes) and stays adjustable.
8. **History and result screens:** show the selected subjects (localised) from the stored session filter.
9. **`startStandardExam` call (`app/exam/setup.tsx`):** passes `undefined` for `now` so the service default (`Date.now()` at call time) applies. This resolved the `react-hooks/purity` ESLint error without suppressing any rule.

## Technical decisions and reasoning
- **No new persistence shape.** Single subject stays on `subject`, multiple on `subjects`; both are never set together by this module (`withSubjectSelection`). Rejected: always using `subjects` (would change stored-filter shape for existing sessions and routes).
- **Pure module.** Selection rules live outside React so `node --test` covers them cheaply.
- **Subject validator.** Letters/digits first, then letters, combining marks (Bangla vowel signs), digits, spaces and `. & ( ) -`, up to 59 characters. Commas and quotes are excluded because comma is the list separator. This is defence in depth: SQL is already parameterised.
- **Count from grouped query, not per-subject queries.** Faster and exact because each question has one subject. Empty selection uses the scope `total` (which includes questions without a subject).
- **Lint fix.** `Date.now()` is legitimately called inside an event handler; the purity rule still flagged it because the handler is created during render. Delegating to the service default removes the call from the component and keeps the timestamp in the service, with no rule disabled.
- **Labels.** Added EN/BN labels for the five extra subjects; unknown subjects display their stored name.

## Files
Added: `src/services/subjectSelection.ts`, `src/components/common/SubjectSelector.tsx`, `tests/subject-scope.test.ts`.
Modified: `app/exam/setup.tsx`, `app/flash/setup.tsx`, `app/history.tsx`, `app/result/[id].tsx`, `src/components/common/Toggle.tsx`, `src/features/navigation/links.ts`, `src/i18n/translations.ts` (+14 keys), `src/repositories/content.ts`, `src/services/exam.ts`, `src/services/subjects.ts`.

## Database and migration changes
None. No schema, seed or migration changes. `countPoolBySubject` is a read-only query.

## Dependencies
None added.

## Actual implementation progress
All items above are implemented in the working tree and committed locally. Checks actually run (low cost): `tsc --noEmit` exit 0; targeted ESLint on the 12 touched source/test files exit 0 with no findings (the previous `react-hooks/purity` error is resolved); `node --test tests/subject-scope.test.ts tests/universities.test.ts tests/ui-logic.test.ts` 19/19 pass. Note: tests need an nvm Node (v24.21.0). The system `/usr/bin/node` here is built without TypeScript support and cannot load `.ts` tests.

## Known limitations
- Selecting every listed subject is not collapsed into "All". "All" also includes questions with no subject, so the two counts can differ.
- Subject selection is local screen state, not persisted across app restarts.
- Subjects without a translation show their stored (English) name.
- `subject.summaryMultiple` and the other new Bangla strings have not been reviewed by a native speaker.
- The 12-subject cap and 59-character name limit are enforced silently (extra values are dropped).

## Deferred testing (owner)
On-device behaviour of the chip selector (touch targets, wrapping, screen-reader announcements as checkboxes), Flash and Custom Practice flows with 1 and several subjects, university paper section selection regression, Bangla text rendering, history/result subject lines, real-seed performance of `countPoolBySubject`, deep-link/route round trips with `subjects`. Full test suite, builds and device runs were not executed.

## Remaining work
None required for this phase beyond owner verification.

## Next-phase dependencies
Phase 4 (marking rules) builds on `PoolFilter`/session filters and the `custom` exam config. Custom Practice duration/count choices from this phase should later be able to take a marking profile as input.

## Related commit
`feat(practice): phase 3 shared subject selection (implemented; owner verification pending)` (hash recorded in IMPLEMENTATION_LOG.md after commit).
