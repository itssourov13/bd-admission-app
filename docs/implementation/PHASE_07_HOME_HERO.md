# Phase 7 — Home Hero Redesign

**Status:** Implemented — Pending Owner Verification (2026-11-13). Local commit only; not pushed.

## Objective
Improve the Home hero card (previously: eyebrow, title, subtitle on a flat gradient) while keeping the app identity, adding a clear CTA and context-aware resume information, with light/dark compatibility and no extra assets or startup work.

## Initial state
Commit df87747 (Phase 6). Hero was an inline `LinearGradient` in `app/(tabs)/index.tsx`; unfinished exams appeared as a separate gold-bordered card under it; no primary action in the hero.

## Findings
- The hero gradient (navy → brand green) is dark in both themes, so white text keeps strong contrast without theme branches; only the shadow follows the theme (`useTheme().shadow`).
- Decorative motifs can be built from plain `View`s and an Ionicons glyph: no images, SVG or dependencies, no extra startup work.

## Implementation
- New `src/components/home/HomeHero.tsx` (memoised): gradient card with soft gold ring and green glow, a graduation-cap glyph, a 3×4 grid of OMR answer bubbles (one filled), eyebrow/title/subtitle in the existing type scale, an offline-ready context line, a full-width 48dp primary CTA and a 44dp secondary text action.
- Context-aware: `mode="start"` shows "Start practising" (→ Flash setup), "Or take a mock exam" (→ Standard exam setup) and "N questions ready offline" (from `contentTotals().eligible`, hidden when the bank is empty). `mode="resume"` (an active exam exists) swaps to an hourglass glyph, the "Exam in progress" eyebrow, the existing resume body text and a gold "Resume exam" CTA; the separate resume card was removed to avoid duplicate prompts.
- Responsive: title size drops below 360dp width; decorations hide below 340dp or at font scale > 1.3 so text never collides with art; decorations are `pointerEvents="none"` and hidden from assistive tech.
- Added 3 translation keys (`home.heroStart`, `home.heroExamLink`, `home.heroReady`, BN/EN).

## Decisions
Pure-View graphics rather than image/illustration assets (no licensing, size or load cost). A dedicated component rather than more inline Home code, so Phase 8/9 screens can reuse the pattern.

## Files
Added: `src/components/home/HomeHero.tsx`. Modified: `app/(tabs)/index.tsx`, `src/i18n/translations.ts`.

## Database / dependencies
None.

## Checks run
`tsc --noEmit` exit 0; ESLint on the two touched areas exit 0. No visual/device check (owner).

## Limitations
Not visually inspected on any device or in dark mode; decorative positions are tuned by reasoning only. No resume progress detail (answered count) is shown — only the fact an exam is in progress.

## Deferred owner testing
Look at Home in light/dark, small (≈320dp) and large screens, large system font, Bangla/English, with and without an active exam; confirm CTA targets and that the resume path still opens the exam.

## Next
Phase 8 adds a Publications entry on Home below the hero.


## Runtime audit follow-up — 2026-11-13

The owner-provided Android screenshots exposed visual regressions that were not covered by the original static checks. Both CTA Pressables now use callback-valued `style` functions, which NativeWind does not support; the returned button styles are therefore not applied. The hero also gained more stacked content (three wrapping feature pills, offline context, larger phone art and a 52dp secondary CTA), making it substantially taller than the earlier Phase 7 layout. See `docs/audits/HOME_HERO_RUNTIME_AUDIT.md` for the root-cause and evidence.

Follow-up: use NativeWind static utility classes / `active:` modifiers for CTA surfaces; keep text colours semantic; compact the card around a new wide 1024×500 Home cover; verify both routes on Android in light/dark, BN/EN and large-font layouts. The Profile metric contrast regression is shared via `src/components/common/Stat.tsx` and is documented in the runtime audit. No source implementation was changed by the audit.
