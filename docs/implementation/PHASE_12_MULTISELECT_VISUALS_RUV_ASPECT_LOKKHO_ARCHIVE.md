# Phase 12 — App-wide multi-select, shared visuals, RU-V → ASPECT, Lokkho archival

Branch: feat/import-hstu-verified-answers-2026-11-12 (start HEAD 50966c7). Governing ADR: ADR-033. Detailed prior plan: docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md.

## Verified baselines (2026-11-17, from actual files)
| Item | Audit figure | Verified |
|---|---|---|
| RU-V import batches (`ru-vq-*.json`) | 15 | 15 |
| RU-V questions | ~1,828 | 1,828 (1,822 `single_choice` incl. the 22 no-correct-option records, 6 `multiple_choice`) |
| Lokkho packs (`ru-c-*.json`) | 44 | 44 |
| Lokkho questions | ~4,009 | 4,009, all answer-unverified |
| Lokkho asset refs / unique | 46 / 45 | 46 / 45, all resolve |
| Source PDF SHA-256 (`bd-admission-app-data/ru/RU Question Bank.pdf`) | — | f1fc25fa…18a49c7 |

## Phase order and status
| # | Phase | Status |
|---|---|---|
| A | Lokkho external archive: inventory, copy, manifest, SHA-256 verify | Done (this checkpoint) |
| B | Shared answer-state + multi-select engine (UI, persistence, scoring, eligibility, review) | Implemented and committed; typecheck, lint, 253/253 tests pass; Android device QA pending |
| C | Shared asset pipeline + visual/math rendering | Not started |
| D | Library delivery path (bundled LibraryPack install on fresh + upgrade) | Not started |
| E | RU-V → one ASPECT book, 17 units (conversion script, validation) | Not started |
| F | RU-V Varsity retirement + DB migration with history aliasing | Not started |
| G | Lokkho active-content removal + DB retirement migration + asset registry regen | Not started (gated on A, done) |
| H | Reconciliation, full verification, docs, final report | Not started |

## Phase A — Lokkho archive (done)
- Tool: `scripts/archive-lokkho.mjs` (`--create` refuses to overwrite and never deletes; `--verify` re-checks sizes, SHA-256, unlisted files and asset-reference resolution).
- Destination: `/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/` (`question-packs/` mirrors `data/question-packs/` so `assets/lokkho/*.png` references resolve unchanged; `MANIFEST.json`, `SHA256SUMS`, `README.md`).
- Result: 44 packs, 4,009 questions, 46 refs / 45 unique assets, 93 files total. `node scripts/archive-lokkho.mjs --verify` ok; `sha256sum -c SHA256SUMS` zero failures.
- App copies are **not yet removed**. Removal is Phase G because it needs the DB retirement migration (installed rows must stay for history) and asset-registry regeneration.

## Phase B — App-wide multi-select (implemented)
Inspection findings (verified in source): `session_answers.selected_keys` is already a JSON array; `isAnswerCorrect`/`scoreAttempt` already compare exact sets; `selectOption(…, multiple)` existed in exam.ts. No schema migration was needed. The gaps were:
1. `ELIGIBLE_SQL` admitted only `single_choice`.
2. `QuestionCard` always exposed radio semantics.
3. Flash submitted a tapped key immediately; Exam `choose()` always stored `[key]`.
4. Flash answered with unvalidated keys.

Changes:
- `src/services/answerSelection.ts` (new, pure): `selectionModeOf`, `toggleSelection` (single replaces, multiple toggles, stored in option order), `normalizeSubmission` (rejects empty/unknown/duplicate keys and multi-key single answers), `reviewSelection` (matched / missing / extra).
- `src/repositories/content.ts`: `ELIGIBLE_SQL` now requires the correct-option count to match the type (single = 1, multiple ≥ 2). Verified no-correct-option records (0 correct options) stay out of scored pools (they were already excluded; unchanged). Review-candidate (provisional) pools remain single-choice only.
- `src/services/flashController.ts`: answers go through `normalizeSubmission`.
- `src/components/common/QuestionCard.tsx`: `checkbox` role + `checked` state and a rounded-square marker for multiple choice; radio group unchanged for single choice; on reveal with a selection, per-option "correct, selected / correct, not selected / incorrect extra selection" labels (also in the accessibility label) and a correct / your / missing / extra summary.
- `app/flash/play.tsx`: multi-answer questions keep a pending selection and an explicit **Submit answer** button (disabled until something is selected); single-choice Flash still answers on tap.
- `app/exam/[id].tsx`: `choose()` toggles via the shared module, so Standard Exam and Custom Practice (same screen) support multi-select, deselect and clear; the existing selection queue/persistence/restore path stores arrays unchanged. Result review reuses `QuestionCard` and therefore shows the sets.
- `src/i18n/translations.ts`: Bangla/English strings for the new labels.
- No RU-specific code: behavior is driven by `question.type` only, so it applies to every university pack and LibraryPack.

Count effects (from the actual packs): +11 eligible questions app-wide (JU verified multi-answer: 5, RU-V: 6; the sixth JU record has an unverified answer and stays out). Total eligible 4,307 → 4,318; JU eligible 1,393 → 1,398; RU-V eligible 1,800 → 1,806 (1,800 single + 6 multiple; the 22 no-correct-option records remain excluded).

Tests: `tests/answer-selection.test.ts` (toggle, validation, review sets, exact-set scoring incl. 3-key, partial, extra, empty, no-correct-option); `tests/multi-select-flow.test.ts` (eligibility rules, Flash validation + exact-set outcomes + array persistence, Exam persist/restore/clear/finalize). Updated hardcoded eligible counts in three existing tests with the reasons above.

### Phase B verification (2026-11-17, Node 22.23.1)
- Resumed from the actual working tree (HEAD f705abf); Phase A archive re-verified first (`archive-lokkho.mjs --verify` ok, `sha256sum -c` 90/90 OK, 93 files, 44 packs / 4,009 questions).
- Browse fix confirmed in `QuestionCard`: per-option attempt labels render only when `selected.length > 0`; Browse shows only the correct set.
- Lint error fixed: `app/flash/play.tsx` reset pending selection via setState-in-effect (`react-hooks/set-state-in-effect`). Replaced with derived state: the pending selection is tagged with its position and ignored once the position advances. Behavior is unchanged.
- Results: `tsc --noEmit` exit 0; `expo lint` exit 0; `npm test` 253 tests, 253 pass, 0 fail; `git diff --check` clean.

Not verified yet: on-device Android interaction (checkbox focus/TalkBack, layout of the Submit button), Browse/Library/Custom screens visually.

## Next step
Phase C: shared offline asset pipeline (generalize `scripts/build-question-assets.mjs`, LibraryPack asset references, validation) and visual/math rendering.
