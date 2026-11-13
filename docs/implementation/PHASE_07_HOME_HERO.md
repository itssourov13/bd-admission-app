# Phase 7 — Home Hero Redesign and Runtime Follow-up

**Status:** Implemented — Pending Owner Verification (2026-11-13). Local implementation commit `0c9e90f`; EAS preview build `dcf1b743-ea08-4d27-b01f-82fe26374ffa` is IN_PROGRESS; no push.

## Objective
Provide a compact, premium academic Home Hero with a realistic campus cover, readable text, two genuine interactive exam/practice actions, responsive sizing, and reliable light/dark foreground contrast. Preserve navigation and resume behavior.

## Final composition
- `src/components/home/HomeHero.tsx` is a composite card: a decorative landscape photo and navy scrim carry the eyebrow/headline; a separate navy-to-green foreground area carries the subtitle/context and native React Native CTA controls.
- The cover is `assets/home/hero-cover.jpg` (782×382 px; approximately 2.05:1; about 58 KB). It is cropped from the photographic right-hand portion of the owner-supplied `ui-ux-layout-ideas` reference. It is a temporary reference-derived asset, not newly generated artwork; see `assets/home/README.md` for provenance and distribution caveats.
- The photo is decorative (`pointerEvents="none"` and hidden from assistive technology); it has no baked-in application text, logo, or fake controls. Important text and actions are rendered by the app.
- The cover uses a minimum height derived from available width and the image ratio, capped for the default layout but allowed to grow with text; it is not a fixed-height clipping box.
- Buttons remain real 48 dp `Pressable` controls below the photo. They sit side by side when space/font scale permits and stack on narrow screens or larger font scale. Existing route targets and resume flow are preserved.
- The previous callback-valued `Pressable.style` pattern was replaced with supported static style objects and NativeWind active-state utilities.

## Runtime and theme corrections
- `Stat.tsx` now supplies an explicit semantic foreground for metric values where a `className` overrides `Txt` defaults; this fixes near-black Profile values on dark surfaces without a risky global `Txt` change.
- Hero foreground colours are theme-independent because the Hero surface itself remains dark in both app themes. Contrast regression tests cover the photo/scrim worst cases and the action surfaces.
- Home no longer passes the removed feature-pill content into the Hero.
- In `app/exam/setup.tsx`, a provisional-only scope reuses the first `countPoolBySubject(..., true)` result instead of repeating the same read-only query. Question selection, eligibility, scoring and session semantics are unchanged.

## Files and data boundaries
- Changed runtime files: `app/(tabs)/index.tsx`, `app/exam/setup.tsx`, `src/components/common/Stat.tsx`, `src/components/home/HomeHero.tsx`, `src/settings/palettes.ts`.
- Added the cover asset and `tests/home-hero-structure.test.ts`; updated `tests/hero-contrast.test.ts`.
- No SQLite migration, question/answer pack edit, scoring-rule change, dependency addition, or database architecture change.

## Verification
- Full test suite: 240/240 passed on Node 22.23.1.
- TypeScript: `pnpm typecheck` passed.
- Full lint initially reported one unused ESLint-disable directive; the directive was removed and the touched HomeHero file passed targeted ESLint. Full lint is rerun as part of the final release gate.
- `pnpm content:check`: 217 packs / 13,609 questions; generated seed current.
- `pnpm exec expo config --type public`: resolved app version 0.1.6, Android versionCode 7, package `com.admissionbd.app`, and the existing EAS project ID.
- `pnpm exec expo export --platform android --no-bytecode`: passed. This verifies Metro asset bundling, not a native APK or physical-device runtime.

## Known limitations and owner verification
- The cover is a crop of the supplied reference, not a bespoke 1024×500 generated original. The English decorative book-spine wording remains in the photo. Verify it visually before treating the artwork as final; confirm usage rights before public store distribution or replace it with licensed/generated art.
- Physical Android QA is still required: Light/Dark, Bangla/English, small width, large system font, both CTA destinations, active-exam resume, and Profile metric visibility.
- The 782×382 source ratio is retained without upscaling. High-density screen sharpness needs device review.
