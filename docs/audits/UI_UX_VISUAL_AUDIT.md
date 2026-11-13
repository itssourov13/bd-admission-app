# UI / UX / Visual Audit — BD Admission App

Date: 2026-11-13 · Base: HEAD `2a458ac` + uncommitted Phase 11 · Scope: read-only (no app code changed)
Method: static review of `app/`, `src/components`, `src/features`, `src/settings/palettes.ts` + computed WCAG contrast ratios (both themes) + guideline cross-check (WCAG 2.2 AA: text 4.5:1, non-text 3:1; touch targets iOS 44pt / Android 48dp / WCAG 24px floor).
Evidence tags: [CODE] read in source · [CALC] computed · [UNVERIFIED] needs a real device (no emulator or device was run).

## 0. Verdict
Visual foundation is **good and consistent** (token palette, light/dark, Bangla fonts, hero contrast tests, solid a11y roles). No Critical problems. The gaps are about **feel and information design**, not correctness: no press feedback on most tappable cards, a text-only Result screen, no question search in Browse, and a few low-contrast control boundaries.

## 1. Findings (ordered by value / risk)
### V1 — Tappable cards give no press feedback · Medium [CODE]
`PressableCard` (with `active:opacity-90`) exists but has **0 uses**. 14 `Pressable`+`Card` rows (Home tiles/Engineering, History, Library, Publisher, Varsity, Category, Institution, exam pattern options) have no pressed state, so taps feel dead/laggy even when fast. Fix: use `PressableCard` (or add `active:opacity-90`) everywhere. Tiny change, no perf cost, big perceived-speed gain.

### V2 — Result screen is text-only · Medium [CODE]
Score, accuracy, per-subject results are plain text/cards. Add a score ring and per-subject accuracy bars built from `View`s (no new dependency, no animation required). Highest visual payoff for the smallest code.

### V3 — Browse has no question search; "Load more" button instead of scrolling · Medium (feature gap) [CODE]
13,609 questions but `app/browse.tsx` only filters by subject chip. Add a search box (debounced SQLite `LIKE` on question text first; FTS later only if too slow) and `onEndReached` paging. Keep the query off the UI thread path and cap results, per the smooth/fast requirement.

### V4 — Control boundaries and some icons/placeholders are below 3:1 · Medium-Low [CALC]
| Pair | Light | Dark | Used for |
|---|---|---|---|
| `sand300` border on `surface` | 1.41 | 1.74 | unselected `ChoiceChip`, answer-option borders, outline button |
| `ink400` on `surface` | 2.82 | 4.98 | chevrons (10 places), `TextField` placeholder |
| `ink300` on `surface` | 1.82 | 3.03 | pending-step icon in setup |
Guideline: UI component boundaries/icons 3:1, placeholder text 4.5:1. Fix: (a) darken light `ink400` to `#8190A4` (3.25 on surface, 3.03 on body; it is already the dark value); (b) placeholder → `ink500` (4.98 / 6.86); (c) add one `outline` token for interactive control borders (light `#8190A4`, dark `#5E6C80`→`#6B7B91` = 3.76) and use it for unselected chips and option rows. Extend `tests/settings-theme.test.ts` with these pairs.

### V5 — Primary fill is exactly at the AA limit · Low [CALC]
White on `brand500` = 4.51:1 (limit 4.5) for primary buttons and selected chips; pressed `opacity-90` and `opacity-60` disabled drop below. `brand600` gives 5.80. Consider `brand600` for fills that carry white text.

### V6 — Touch targets are 44, Android recommends 48 · Low [CODE]
`ChoiceChip` (`minHeight: 44`), back/bookmark/close buttons (44 + hitSlop 6–8), palette cells (44×44). All meet iOS and the WCAG floor; raise chips to 48 for Android comfort. Option rows (52) and buttons are fine.

### V7 — Flag / Clear ghost buttons stack full-width · Low [CODE][UNVERIFIED]
`Button` defaults `fullWidth` (`w-full`); in `app/exam/[id].tsx` two ghost buttons sit in a `flex-row flex-wrap`, so they wrap onto separate full-width rows under every question. Likely meant to be inline (`fullWidth={false}`) or icon+label chips. Check on device.

### V8 — Tab bar has a hard-coded height · Low [CODE][UNVERIFIED]
`app/(tabs)/_layout.tsx` sets `height: 64` and `paddingBottom: 7` and ignores the bottom safe-area inset. On gesture/3-button Android with edge-to-edge it may sit tight against the system bar. Verify on both nav modes; if cramped use `useSafeAreaInsets().bottom`.

### V9 — Home hierarchy and personal progress · Low (design) [CODE]
Home shows Hero, then stacked cards and two Flash/Mock tiles. Accuracy/progress exists only on Profile. Optional: one compact "Your progress" strip (accuracy, questions practised) from the data Profile already loads. Do not add more cards; Phase 11 already deduplicated actions.

### V10 — Font scaling coverage · Low [CODE][UNVERIFIED]
Only `HomeHero` reacts to `fontScale`. Tab labels are fixed 11px; `text-[11px]` appears in Home/Hero. Test every screen at Android largest font size and 200% before release.

## 2. What is already good [CODE]
- A11y: all 31 `Pressable`s declare roles (checked multi-line props), 36 labels, `radiogroup`/`radio`/`checkbox` states, `timer` role, live-region warnings, decorative art hidden from TalkBack.
- Not colour-only: correct/wrong options use icon + colour; flagged uses a flag glyph.
- Theme: one token set for light/dark, hero uses theme-independent colours with contrast tests, delayed spinner avoids flash, Bangla uses Hind Siliguri throughout.
- Performance: 11 virtualized lists; exam `SectionList` tuned (`initialNumToRender 5`, `windowSize 7`); hero is `memo` and asset-free.
- Intentional hardcoded colours only: decorative `#16866A` in `PhoneArt`, white logo plate in `BrandLogo`.

## 3. Implementation recommendations (priority order)
| # | Change | Files | Effort | Risk to speed |
|---|---|---|---|---|
| 1 | Press feedback on all tappable cards (V1) | `ui/Card.tsx` + 14 call sites | S | none |
| 2 | Result score ring + subject accuracy bars (V2) | `app/result/[id].tsx`, new small `ScoreRing`/`Bar` component | S–M | none (static Views) |
| 3 | Contrast tokens: `ink400`, placeholder, `outline`, brand600 fills (V4, V5) + tests | `palettes.ts`, `TextField`, `ChoiceChip`, `QuestionCard`, `Button` | S | none |
| 4 | Browse text search + `onEndReached` paging (V3) | `app/browse.tsx`, `repositories/content.ts` | M | keep debounced and capped |
| 5 | Inline Flag/Clear controls, 48dp chips, tab-bar inset (V6–V8) after a device look | `exam/[id].tsx`, `Toggle.tsx`, `(tabs)/_layout.tsx` | S | none |
| 6 | Optional: Home progress strip (V9) | `(tabs)/index.tsx` | S | one cheap query |
Carried over from the app-wide audit (not visual): exam timer isolation, "100 q / 60 min, not official" preset (U2), Low items F6–F9.
Not recommended: more animation/Reanimated work, heavy chart libraries, extra Home cards. They add startup cost without fixing a real problem.

## 4. Limits
Static review only. Nothing was run, rendered or screenshotted, so spacing, truncation, large-font layout and Android nav-bar behaviour are [UNVERIFIED]. Contrast numbers were computed from the palette tokens, not measured on screen.

## 5. Implementation status (2026-11-13, static + focused tests only; NOT verified on a device)
| Finding | Status | Notes |
|---|---|---|
| V1 press feedback | **Resolved (code)** | `active:opacity-90` on all 14 tappable-card locations: Home (4: Hero-adjacent card helper, Flash tile, Mock tile, Engineering), exam setup pattern options (2), History, Institution papers, Library publishers, Publisher books, Category (2), Varsity (2). Filter/choice chips and other controls were left unchanged. `PressableCard` remains unused (same class, no behaviour gain from migrating). |
| V2 Result ring + bars | **Resolved (code)** | New `src/components/common/ScoreRing.tsx` (`ScoreRing`, `AccuracyBar`, `clampPercent`): plain Views, no SVG/animation/dependency, memoised. Ring shows accuracy (empty ring when unavailable); per-subject bars sit above the existing count text. Existing calculations untouched; null/NaN/out-of-range clamp to 0-100. Ring is one `progressbar` a11y element; bars are decorative (value is in text). Half-border arc technique relies on per-side border colours with `borderRadius` on Android: **[UNVERIFIED] check on device**, light/dark, Bangla/English. |
| V3 Browse search/paging | **Resolved (code), search scope limited** | Search box on `app/browse.tsx` (paper and book/unit scopes): 300 ms debounce, min 2 / max 64 chars, `LIKE ... ESCAPE` on `questions.text` only, wildcards escaped, still `LIMIT 20 OFFSET`, scoped to one paper/book so rows scanned are bounded, stale-response guard via request id, composes with subject filter. `onEndReached` added; "Show more" button kept as accessible fallback. Option text, explanation and cross-paper search are **deferred**; add FTS5 only if a real-device test shows slowness. Subject chip counts still show unfiltered totals by design. |
| V4/V5 contrast | Resolved (earlier) | tokens + tests, 8/8 focused. |
| V6 48dp chips, V7 Flag/Clear layout, V8 tab-bar inset | **Deferred** | need a device look first (unchanged). |
| V9 Home progress strip, V10 font-scale sweep | **Deferred** | optional / device-only. |
Tests: `tests/browse-search.test.ts` (new). Focused run (Node 22.23.1): browse-search, library, repositories, settings-theme, hero-contrast = 57/57.

## 6. Re-investigation of two reported issues (2026-11-13; code review + focused tests, no device)
| Report | Independent finding | Action |
|---|---|---|
| `TextField` border and `ExamPalette` unanswered cell still use `sand300` | **Confirmed.** `TextField.tsx` used `borderColor: colors.sand300` and `ExamPalette.tsx` `unanswered.border: colors.sand300`; both are interactive-control boundaries (1.41 light / 1.74 dark on surface), the exact V4 defect, missed in the earlier token pass. `ChoiceChip`, option rows and outline `Button` were already on `outline`. | Both switched to `colors.outline` (>=3:1, already test-covered). Palette legend swatch shares the cell colours so it follows. Source-guard test added to `tests/settings-theme.test.ts`. |
| Stale `loadMore()` failure can set Browse to `error` | **Confirmed, narrow race.** Success path was guarded by the request id, but the `catch` called `setState("error")` unconditionally; a slow `loadMore` that fails after a newer search/filter began would replace the fresh list with the error view. (`first()` was already guarded in its catch.) | Introduced tiny `src/services/requestGate.ts` (`begin/current/isCurrent`) used by `first()` and `loadMore()`; the `loadMore` catch now sets error only if still current. `finally { setBusy(false) }` left as is (it only gates paging). Tests: `tests/request-gate.test.ts`. |
Intentionally unchanged: `SettingsControls` selected-segment `border-sand-300` (selected state sits on a track, not a standalone control boundary; revisit with device view) and the native `Switch` off-track `sand300`. A hook-level Browse test is not possible in this node-only test setup; the race is covered at gate level plus code review.
Device checks still needed: TextField/palette border visibility in light/dark, Browse typing + paging + failed-load behaviour.
