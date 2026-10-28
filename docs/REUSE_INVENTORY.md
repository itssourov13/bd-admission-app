# Code reuse and source independence inventory

Source inspected: /home/kali/gpt-workspace/scholar-hub/apps/mobile
Source HEAD at original inspection: d2bc7b0 (main)
Target repository: /home/kali/gpt-workspace/bd-admission-app

This file records provenance for selected foundations copied/adapted when establishing the independent app. It does not make the source checkout a dependency of the target.

## Copied or adapted foundations

| Source | Target | Treatment |
|---|---|---|
| apps/mobile/src/theme.ts | src/theme.ts | Starting point for theme tokens; palette and brand identity were adapted for BD Admission. |
| src/components/ui/Text.tsx | src/components/ui/Text.tsx | Adapted language-aware typography primitive. |
| src/components/ui/Button.tsx | src/components/ui/Button.tsx | Adapted shared button primitive, including explicit React types. |
| src/components/ui/Card.tsx | src/components/ui/Card.tsx | Adapted reusable surface/card component. |
| src/components/ui/Chip.tsx | src/components/ui/Chip.tsx | Adapted compact metadata/status component. |
| src/components/ui/Screen.tsx | src/components/ui/Screen.tsx | Adapted safe-area and page-layout component. |
| apps/mobile/metro.config.js | metro.config.js | Adapted Expo/NativeWind Metro configuration. |
| apps/mobile/babel.config.js | babel.config.js | Adapted NativeWind transform configuration. |
| apps/mobile/eslint.config.js | eslint.config.js | Adapted lint configuration. |
| apps/mobile/pnpm-workspace.yaml | pnpm-workspace.yaml | Retained compatible pnpm settings, including hoisted linking and copied package imports. |
| apps/mobile/nativewind-env.d.ts | nativewind-env.d.ts | Adapted NativeWind/CSS import typing. |
| Source Expo/font dependency set | package.json | Selected compatible Expo SDK 57 / React Native 0.86 dependencies; target package identity and dependency graph are independent. |
| Source i18n approach | src/i18n/ | Pattern adapted; dictionary rewritten, storage key changed to bd_admission_language_v1, Bangla is the default. |
| Source Logo.tsx | src/components/ui/Logo.tsx | Not reused as artwork; replaced with an Admission-specific mark. |

## Not reused as executable features

- ScholarHub authentication, Clerk configuration and auth gates.
- ScholarHub API provider, base URL, server-bound queries or hosted database requirements.
- Scholarship, guide, CV, AI mentor, roadmap and notification business routes.
- @scholarhub/shared, source environment variables, source Firebase configuration or source EAS identity.
- ScholarHub app icon, wordmark and app identity.

## Target implementation now in this repository

The target project owns its implementation of:

- SQLite schema/migrations, SqlDb adapter and startup provider.
- Content, session and user-data repositories.
- Scoring, timer, Flash, Standard Exam, advice, import and bundled-pack sync services.
- Admission-specific route screens, translations, common components, assets and brand.config.json.
- Question-pack schema, validator, tests and pack-index generator.

The package lockfile is generated, dependencies have been installed under Node 22.23.1, and the target's focused checks are recorded in docs/QA_CHECKLIST.md.

## Independence boundary

All code required for the target app is stored in this repository. Runtime source, package configuration and build configuration must not import, symlink to, or resolve packages from /home/kali/gpt-workspace/scholar-hub. The source directory is provenance only and must not be edited for BD Admission work.
