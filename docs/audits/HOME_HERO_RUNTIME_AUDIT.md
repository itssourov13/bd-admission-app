# Home Hero Runtime Audit — 2026-11-13

**Status:** Audit complete; implementation not changed.
**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch / base:** `feat/import-hstu-verified-answers-2026-11-12` / `3c2346e`
**Evidence:** Owner-provided Android screenshots in `/home/kali/screenshort/admission-runtime/` (all 1220×2712 JPEGs).

## Scope and method

- Visually reviewed the supplied Home, Profile and Practice Results screenshots.
- Traced Home hero props and pressable styling to `app/(tabs)/index.tsx` and `src/components/home/HomeHero.tsx`.
- Traced Profile metric typography through `src/components/common/Stat.tsx` and `src/components/ui/Text.tsx`.
- Checked installed NativeWind / React Native versions, hero history, university image registration, asset dimensions and existing contrast tests.
- Ran the complete automated suite under the repository's Node 22.23.1 runtime.
- No application source, dependency, native configuration, release metadata or question data was modified.

## Findings

### H1 — Both Home hero CTAs lose their button styling

**Observed:** In the Home screenshot, “Start practising” is rendered as dark text over the dark green gradient and “Take a mock exam” appears as a small white label/icon. Neither has its intended filled/outlined button surface.

**Root cause:** Both `Pressable` controls in `HomeHero.tsx` pass a function to the React Native `style` prop:

- Primary CTA: `style={({ pressed }) => ({ ... })}`
- Secondary CTA: `style={({ pressed }) => ({ ... })}`

The app uses NativeWind 4.2.7 through the NativeWind JSX runtime. NativeWind's maintainer explicitly documents that it does not support `Pressable` style callback functions; the function is not called, so the returned style object is not applied. This matches the screenshot exactly: background fills, secondary border, flex alignment, min-height, padding and spacing are all defined in the returned objects and disappear together.

This is not a missing translation or missing navigation handler: `app/(tabs)/index.tsx` still supplies both CTA labels and routes (`/flash/setup` and `/exam/setup`). The controls are present in the tree; their visual button treatment is missing. The same implementation regression was introduced in commit `0b235f2` compared with the earlier static-class implementation in `d7c9534`.

**Recommended repair:** Use static NativeWind `className` utilities and `active:` modifiers for both Pressables; represent resume/start/pressed states through conditional class names. Do not use callback-valued `style` with NativeWind-interoped Pressable. If a callback is essential, explicitly opt that component/file out of NativeWind interop and verify the rendered result on device.

References:
- NativeWind issue #1105: https://github.com/nativewind/nativewind/issues/1105
- NativeWind issue #1781 (additional style-prop regression report): https://github.com/nativewind/nativewind/issues/1781

### H1 — Profile progress values have no foreground colour in dark mode

**Observed:** In the Profile screenshot, the values `3`, `13` and `46.2%` in the progress cards are nearly black and blend into the navy card surface. The labels and surrounding text are readable.

**Root cause:** `src/components/common/Stat.tsx` renders the value as `<Txt className="text-xl" ...>` when no optional `tone` is provided. `Txt` only supplies its default `text-ink-900` class when `className` is omitted; passing `text-xl` replaces that default rather than merging with it. The Profile call sites do not pass `tone`, so the native Text default colour is exposed instead of the theme's semantic foreground.

**Recommended repair:** Give the Stat value an explicit semantic foreground (`text-ink-900`) while retaining the optional `tone` override, or change the Txt API to merge its default foreground safely. Inspect both Profile and Result Stat call sites after the change. Existing theme contrast tests validate token pairs but do not assert that every rendered text node actually receives a foreground token.

### H2 — Hero content is materially taller than the earlier design

**Observed:** The Home hero occupies a large portion of the first viewport. The issue is not just the banner's outer dimensions: the current composition stacks a two-line heading, subtitle, three feature pills (wrapping onto multiple rows), offline-ready context line, and two separate 52dp actions. It also reserves a 78×104dp phone illustration.

**History comparison:** The earlier Phase 7 implementation (`d7c9534`) had a smaller decorative OMR/cap motif, no three-pills block, and a compact 44dp secondary text action. Commit `0b235f2` added the feature pills and phone illustration, and upgraded the secondary link to a full-height outlined action. The current implementation therefore increases the number and height of stacked rows. The Phase 7 description in `docs/implementation/PHASE_07_HOME_HERO.md` no longer fully describes the current version.

**Recommended direction:** Use a wide cover-led hero and make the content compact: preserve the title/subtitle, cap the value pills at one row (or replace them with a short supporting line), keep the offline count concise, and place the two CTAs side-by-side when the available width permits, with a compact stacked fallback for narrow screens. Aim for an overall mobile card in the approximate 190–220dp range, then tune from real device screenshots and text scaling rather than treating that range as a hard requirement.

### H2 — There is no existing wide university-cover asset system in this repository

The current university media implementation is a **logo** registry, not a cover/banner registry:

- DU, RU and JU are registered as SVG marks.
- HSTU is a 1072×1363 portrait PNG.
- The shared `UniversityLogo` component renders compact square marks/monogram fallbacks.
- No 1024×500 (or similar landscape) university cover asset or cover-image registry was found in the repository.

The remembered/repository evidence does **not** establish that the old university cover image was exactly 1024×500. That dimension is your current guidance and is a sensible target: a 2.048:1 landscape banner. The asset being created for this task is a **Home hero cover**, not a replacement for the university logo files.

**Recommended asset contract:** 1024×500 source image; render into a wide, clipped hero surface with `resizeMode="cover"`; keep the left text area visually quiet and dark enough for foreground text; place the illustration on the right so mobile cropping does not cut through the title or CTA. Keep the university logos separate from cover art.

## Verification

- `pnpm test` — **234/234 passed**, 0 failures, 0 skipped, under Node 22.23.1.
- The test suite includes palette contrast checks, but does not detect unsupported NativeWind Pressable callback styles or the missing Stat foreground class.
- No code was changed, so TypeScript / lint / Metro export were not rerun in this audit-only pass.
- The supplied screenshots are owner-provided runtime evidence; no fresh APK or device session was produced during this audit.

## Proposed implementation order

1. Restore both CTA surfaces using NativeWind-supported static classes and pressed modifiers.
2. Fix Stat's missing semantic foreground and add a regression test for the rendered class contract.
3. Add the new 1024×500 Home cover asset with a static asset registration.
4. Reduce stacked hero content and implement a narrow-screen layout that keeps both actions visible.
5. Recheck Android screenshots in light/dark, Bangla/English, narrow width and enlarged system font; verify CTA hit targets and both navigation routes.

**No application fix is included in this audit commit.** Release version, Android versionCode, EAS project, signing identity and existing submitted builds remain untouched.
