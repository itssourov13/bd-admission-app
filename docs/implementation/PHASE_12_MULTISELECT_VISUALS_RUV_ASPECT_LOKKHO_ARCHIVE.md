# Phase 12 — App-wide multi-select, shared visuals and RU pack externalization

**Current owner direction (ADR-035, 2026-11-17):** Phase 12's immediate content task is to move all RU pack datasets out of the app in two separate external archives, not to create/import an ASPECT LibraryPack. The owner will do the later Library import; only RU-V's 17 verified sets are intended for one future ASPECT RU Question Bank. Lokkho remains unverified and separate. Other university packs stay in the app. See `docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md`.



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

## Current execution status — supersedes the earlier phase map

| # | Work | Current status |
|---|---|---|
| A | Lokkho external archive | External archive verified (44 packs / 4,009 questions / 45 assets; 90/90 hashes). App copy removal still pending. |
| B | App-wide multi-select | Implemented and committed as `c5ca075`; 253/253 tests, typecheck and lint passed. |
| C | Shared asset pipeline + bitmap figure rendering | Implementation is in the working tree and automated checks passed (267/267 tests, typecheck, lint, content/asset checks, Metro export). Documentation/commit pending; structured math/diagram work and device QA are not complete. |
| D | Separate RU-V verified external archive | Not created; destination `ru/verified-pack-archive/` is absent. |
| E | Remove both RU pack families from active app + schema-v10 retirement | Pending; all 59 pack files and 5,837 questions remain in the app seed/manifest/database. |
| F | Full checks, documentation and local commits | Pending after Phase C finalization and RU archival/removal. |

**Deferred by owner:** no RU LibraryPack generation/import or ASPECT UI work now. The owner will later import only the 17 RU-V sets into ASPECT. Lokkho remains separate/unverified. Other university packs stay in the app.

## Phase A — Lokkho archive (done)
- Tool: `scripts/archive-lokkho.mjs` (`--create` refuses to overwrite and never deletes; `--verify` re-checks sizes, SHA-256, unlisted files and asset-reference resolution).
- Destination: `/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/` (`question-packs/` mirrors `data/question-packs/` so `assets/lokkho/*.png` references resolve unchanged; `MANIFEST.json`, `SHA256SUMS`, `README.md`).
- Result: 44 packs, 4,009 questions, 46 refs / 45 unique assets, 93 files total. `node scripts/archive-lokkho.mjs --verify` ok; `sha256sum -c SHA256SUMS` zero failures.
- App copies are **not yet removed**. Under ADR-035, removal of both RU Lokkho and RU-V packs is now the active task after Phase C finalization. A schema-v10 retirement migration and asset-registry regeneration are required; preserve rows needed for history.

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

1. Finalize/document/commit the existing Phase C work (including the CI asset-check gate and the remaining math/diagram status).
2. Create and verify the separate external RU-V pack archive; re-verify the Lokkho archive.
3. Remove all 59 RU pack files and the 45 RU-only images from active app content, regenerate the seed/manifest/asset registry, and implement the schema-v10 history-preserving retirement migration.
4. Run fresh-install and schema-v10 upgrade checks, full tests/typecheck/lint/content/asset/Metro checks, update docs and commit locally.

Do not start the LibraryPack/ASPECT import. The owner will handle a later import of only RU-V's 17 source sets.
