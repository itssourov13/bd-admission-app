# Phase 2 — University Identity, Logos & Varsity Filters

**Status:** Implemented — Pending Owner Verification (2026-11-13). Logos: infrastructure only (no artwork bundled — owner action).

## Objective
Show 4 parent universities (not 7 internal bank rows), add a reusable logo component, and add an "All | DU | RU | JU | HSTU" filter bar that works with existing packs, practice scopes and navigation.

## Initial state
Varsity tab listed the 7 `institutions` rows (DU, HSTU, HSTU-U, JU, JU-U, RU "UNVERIFIED — …", RU-V "… Verified Question Bank"). Cards showed `code` text tiles; no filter; no logos; no SVG runtime (no react-native-svg / expo-image). Seed institutions (from `assets/content/content_seed.db`): du, hstu, hstu-unverified-bank, ju, ju-unverified-bank, ru, ru-verified-bank.

## Findings / decisions
- **No migration.** Content tables are importer-owned and re-synced from the seed; adding columns would be overwritten. Parent identity is derived at read time (`universityKeyOf`: strip `-U`/`-V` suffix, lower-case). Rejected: new `parent_code` column (importer/seed/schema churn).
- **Display names:** known parents have curated EN/BN names; unknown ones use the stored name with "UNVERIFIED — " / "— Verified Question Bank" decorations removed. Content-quality state is still shown through the existing "provisional" meta text, never as a separate university.
- **`PoolFilter.institutionIds`** (new, optional, backward compatible with stored session filters): lets Flash/Exam scope cover every variant of a university. Handled in `filterClauses` and `resolveRuleForQuestions`; routed via `scopeParams`/`scopeFromParams` (comma-separated, ≤12 ids, `[A-Za-z0-9._:-]{1,80}` only, dedup; invalid entries dropped). `institutionIds` key is only present when non-empty so existing route/scope behaviour is unchanged.
- **Batched paper listing** `listPapersByInstitutions`: one query for papers + two grouped count queries (eligible / review-candidate) instead of 2 queries per paper (JU alone has 134 papers). Existing `listPapers` untouched; a test asserts exact parity. This is a new function, not a rewrite of the excluded original-Phase-1 optimisation work.
- **Logos:** raster-first (PNG/WebP via static `require`), no new native dependency, no startup cost. SVG would need react-native-svg + rebuild; defer unless Phase 7 needs vector art. `UniversityLogo` renders a registered asset on a white tile or a monogram fallback. Registry `universityLogos.ts` is intentionally empty: official emblems are trademarks, no authentic/licensed artwork could be sourced or verified here, and redraws of unknown provenance are worse than a monogram. **Owner action:** supply licensed files to `assets/universities/<key>.png` and register them (instructions in the file header), recording source + permission here.
- Selecting a university on the "All" list sets the filter (same state as the chip bar); filtered view lists that university's papers across all its banks, newest first, with "Practice all of this university" (Flash) and Standard Exam (when ≥100 eligible).
- Existing `/institution/[id]` route kept for deep links; no longer linked from the Varsity tab. Medical tab unchanged (`CategoryScreen`).

## Files
Added: `src/features/catalog/{universities,universityLogos,universityLabel,VarsityScreen}.ts(x)`, `src/components/ui/UniversityLogo.tsx`, `tests/universities.test.ts`. Modified: `src/types/domain.ts`, `src/repositories/content.ts`, `src/features/navigation/links.ts`, `src/components/ui/index.ts`, `src/i18n/translations.ts` (+4 keys), `app/(tabs)/varsity.tsx`, `app/flash/setup.tsx`, `app/exam/setup.tsx` (scope lock + university label). No DB/migration/dependency changes.

## UI/UX
Filter chip bar (All + parents), parent-university cards, merged paper list, logo tile with monogram, university-level practice buttons.

## Verification
Lightweight: `node --test tests/universities.test.ts` (5 tests incl. repository parity on an in-memory DB) pass; `tsc --noEmit` clean; targeted ESLint (see IMPLEMENTATION_LOG). Deferred: full suite, on-device filter/navigation/scroll behaviour, Bangla rendering of names, real-seed performance of `listPapersByInstitutions` (JU ≈134 papers).

## Known limitations / pending
- No authentic logos bundled (owner decision/licence). Unknown universities get monogram from the code.
- Per-parent `questionCount` is a sum across banks (a question present in two banks is counted twice) — display only.
- Flash/Exam setup pass `institutionIds` through scope but their own scope-label query shows the first institution's parent name.
- Filter selection is local state (not persisted across app restarts or in route).

## Next-phase dependencies
Phase 3 will extend `scopeParams`/`scopeFromParams` with validated `subjects` in the same way as `institutionIds`.
