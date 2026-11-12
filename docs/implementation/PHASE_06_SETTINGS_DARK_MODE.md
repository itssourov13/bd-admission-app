# Phase 6 — Settings & Dark Mode

**Status:** Implemented — Pending Owner Verification (2026-11-13). Local commit only; not pushed.

## Objective
A dedicated Settings screen and a maintainable light/dark/system theme system that is correct from the first rendered frame.

## Initial state
Commit 26b704a. Colours were static: `src/theme.ts` exported `colors/feedback/gradients/shadow`, `tailwind.config.js` built colour classes from `brand.config.json`, `app.config.js` forced `userInterfaceStyle: "light"`, `StatusBar` was fixed to `dark`. Language lived in AsyncStorage + `user_profile`; Flash default and target in `user_profile`; the Profile tab held language/Flash controls; Reduce Motion was a private hook in `SetupScreen`.

## Technical findings
- All className colours come from ~25 tokens (`ink/sand/surface/body/brand/gold/navy`); ~21 files used `colors.*` in style props.
- NativeWind v4 supports CSS variables through `vars()`; Tailwind colours can be `rgb(var(--x) / <alpha-value>)`, so className colours re-theme with no per-component code.
- `expo-system-ui` was already installed; `expo-haptics` was not.

## Approach
1. `src/settings/palettes.ts`: light palette (literal copy of brand.config.json colours, asserted equal by a test), dark palette with the same token names, dark feedback colours, gradients/shadows built per scheme, and `cssVars` (space-separated RGB channels). Fills carrying white text (brand500/600/800, gold500, danger500) are constant; tints and foreground tokens flip (brand100/200/700, gold100/700, ink*, sand*, body, surface).
2. `src/settings/model.ts` (pure): `AppSettings` {theme, motion, haptics, questionTextSize}, tolerant parser, `resolveScheme`, `resolveReducedMotion`, `TEXT_SCALE`.
3. `src/settings/SettingsProvider.tsx` (`AppearanceProvider`): loads settings (AsyncStorage `bd_admission_settings_v1`), resolves scheme, calls `Appearance.setColorScheme` so native dialogs/system UI follow, sets root background via `expo-system-ui`, and renders the single root `View` carrying the `vars()` map. `useTheme()` returns a per-scheme-stable object, so memoised children re-render only on a theme change.
4. Root layout waits for settings (`resourcesReady`) before dismissing the native splash, so the stored theme is applied before first content; `StatusBar` follows the scheme.
5. `app.config.js`: `userInterfaceStyle: "automatic"`; splash `dark` variant (background #0E1722, same icon).
6. Components migrated to `useTheme()`; static colour exports removed from `src/theme.ts` (fonts, radius, tints remain) so stale light-only values cannot be reintroduced. `ExamPalette` computes its tone map once per theme (no per-cell subscriptions).
7. Settings screen `app/settings.tsx` + reusable `SettingsSection/SettingsRow/SegmentedControl/SettingsSwitch`. Existing preferences are surfaced, not duplicated: language and Flash default moved from Profile to Settings (same repositories/`useLang`); marking defaults link to the existing marking-profiles screen. Profile keeps name and target category and gains a Settings button.
8. Motion: shared `useReducedMotion()` (system / reduced / full) now drives SetupScreen. Haptics: `useHaptics()` (no-op when off) wired into answer selection and bookmarking. Question text size scales question, option and explanation text via `MathText size/lineHeight`.

## Decisions
- CSS variables over `dark:` variants: one source of truth, no conditionals scattered through components, large lists need no theme subscriptions.
- Settings in AsyncStorage JSON (not SQLite): needed before the DB is ready, to get the right first frame; same pattern as language.
- Light palette literal + equality test instead of importing JSON, so the module stays loadable by plain-Node tests.
- Native splash cannot know an in-app override: with an explicit "Light" preference on a dark-mode device the splash is dark (documented limitation).

## Files
Added: `src/settings/{palettes,model,SettingsProvider,haptics,index}.ts(x)`, `src/components/settings/SettingsControls.tsx`, `app/settings.tsx`, `tests/settings-theme.test.ts`.
Modified: `app.config.js`, `tailwind.config.js`, `package.json`, `pnpm-lock.yaml`, `src/theme.ts`, `src/i18n/translations.ts` (~40 keys), `app/_layout.tsx`, `app/(tabs)/{_layout,index,profile}.tsx`, `app/{engineering,history}.tsx`, `app/exam/[id].tsx`, `app/flash/{play,setup}.tsx`, `app/{institution,paper,result}/[id].tsx`, `src/components/common/{ExamPalette,MathText,QuestionCard,ScreenHeader,StateViews,TextField}.tsx`, `src/components/ui/{Button,Card}.tsx`, `src/components/startup/SetupScreen.tsx`, `src/features/catalog/{Category,Varsity}Screen.tsx`.

## Database / migrations
None.

## Dependencies
Added `expo-haptics ~57.0.3` (needs a new native build).

## Known limitations
- Haptics only on answer selection/bookmark; exam flag/submit/timer warnings not yet wired.
- Palette/warning colours in exam/result still use inline tones; contrast verified by unit test for token pairs only, not visually.
- Gradients for hero/guides/profile are the same in dark mode (dark-compatible navy/green).
- `StatusBar` is not rendered during the pre-ready blank frame.
- Storage section shows content counts only (no file sizes) — Phase 9 adds storage usage.

## Checks run
`node --test tests/settings-theme.test.ts` 6/6 pass; `tsc --noEmit` exit 0; ESLint over `src` and `app` 0 errors (5 unused-name warnings in SetupScreen fixed afterwards). Not run: full test suite, builds, device/emulator.

## Deferred owner testing
Rebuild native app (expo-haptics, splash/userInterfaceStyle change). Check: light/dark/system switching incl. live system change; first-launch colour (no light flash in dark); every screen in dark (cards, chips, palette, result, setup screen); status bar icons; tab bar; native Alert dialogs; question text size; Reduce Motion; haptics on/off; language switch from Settings persists across restart; Flash default persists.

## Remaining / next-phase dependencies
Phase 7 hero must use `useTheme()` gradients/colours. Phases 8–9 reuse `SettingsRow` and tokens.

## Commit
Phase 6 local commit (see git log: "feat(settings): phase 6 ...").
