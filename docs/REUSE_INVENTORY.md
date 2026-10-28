# ScholarHub code reuse inventory

Source inspected: /home/kali/gpt-workspace/scholar-hub/apps/mobile
Source HEAD: d2bc7b0 (main, clean at inspection time)
New target: /home/kali/gpt-workspace/bd-admission-app

## Reused by copying or adapting
| Source | Target | Treatment |
|---|---|---|
| apps/mobile/src/theme.ts | src/theme.ts | Copied, comments adapted. Color, font, gradient and shadow tokens retained as a starting design system. |
| src/components/ui/Text.tsx | src/components/ui/Text.tsx | Copied. Retains the language-aware Manrope/Hind Siliguri typography primitive. |
| src/components/ui/Button.tsx | src/components/ui/Button.tsx | Copied. Added explicit ReactNode type import; behavior/styles retained as a starting point. |
| src/components/ui/Card.tsx | src/components/ui/Card.tsx | Copied for reusable surfaces and pressable cards. |
| src/components/ui/Chip.tsx | src/components/ui/Chip.tsx | Copied for compact metadata/status pills. |
| src/components/ui/Screen.tsx | src/components/ui/Screen.tsx | Copied for safe-area and page layout. |
| apps/mobile/metro.config.js | metro.config.js | Copied; retains Expo's SDK 57 default Metro config plus NativeWind transform. |
| apps/mobile/babel.config.js | babel.config.js | Copied for the existing NativeWind transform setup. |
| apps/mobile/eslint.config.js | eslint.config.js | Copied if present in the source mobile project. |
| apps/mobile/pnpm-workspace.yaml | pnpm-workspace.yaml | Copied to preserve the source's tested pnpm/Termux configuration, including hoisted links and copied package imports. |
| apps/mobile/nativewind-env.d.ts | nativewind-env.d.ts | Copied for NativeWind and CSS import typing. |
| Source Expo/font dependencies | package.json | Compatible SDK 57 packages selected; package identity and dependency list are independent. |
| Source i18n approach | src/i18n | Pattern adapted, dictionary rewritten, storage key changed to bd_admission_language_v1, Bangla defaulted for the intended audience. |
| Source Logo.tsx | src/components/ui/Logo.tsx | Not copied; replaced with a lightweight Admission-specific icon treatment. |

## Intentionally not reused as executable features
- ScholarHub Clerk authentication and auth gate.
- API provider, ScholarHub API base, remote query setup and server-bound data fetches.
- Scholarship, guide, CV, AI mentor, roadmap and notification routes/business logic.
- Shared package @scholarhub/shared.
- ScholarHub app icon/logo artwork, owner, EAS project ID, scheme and application ID.
- Source environment variables and Firebase configuration.

## Dependency decisions
The target keeps the compatible Expo SDK 57 / React Native 0.86 baseline and relevant existing dependencies. expo-sqlite is added as the planned local database library; full migrations and repositories remain to be implemented. The package lockfile has not yet been generated because dependencies were not installed during this foundation pass.

## Final source integrity
The source repository status must remain clean. This inventory records preparation of the new target and does not imply that the original repository was modified.
