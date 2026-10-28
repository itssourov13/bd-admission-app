# Branding guide

## Current provisional identity

The product identity is centralized in brand.config.json:

- Display name: **BD Admission** (provisional; final name awaits owner decision).
- Slug: bd-admission-app.
- Android application ID / iOS bundle identifier: com.admissionbd.app.
- Deep-link scheme: bdadmission.
- Version: 0.1.0.
- Bangla tagline: ভর্তি প্রস্তুতি, আত্মবিশ্বাসের সাথে
- English tagline: Prepare smarter. Move forward.

## Visual direction

The visual identity is academic and admission-focused: deep navy for trust/focus, emerald green for progress and restrained gold accents for achievement. The custom mark combines an open book, a rising progress path and a star. It is intentionally distinct from the original ScholarHub wordmark and artwork.

## Single source of truth

brand.config.json owns the app name, slug, scheme, application ID, taglines and palette. app.config.js uses it for Expo identity and asset references; src/brand.ts, src/theme.ts and tailwind.config.js read the same configuration. Change the central JSON rather than scattering branding values across screens.

Palette anchors:

- Navy: #14243A
- Emerald / primary brand: #16866A
- Gold accent: #E8AB35
- Body background: #F5F7FA
- Surface: #FFFFFF

## Local assets

| Asset | Purpose |
|---|---|
| assets/brand/app-icon.png | 1024×1024 launcher/store icon |
| assets/brand/adaptive-icon.png | Transparent Android adaptive foreground |
| assets/brand/splash-icon.png | Transparent splash mark |
| assets/brand/logo-mark.png | Bundled in-app logo mark |
| assets/brand/brand-mark.svg | Editable vector master |

Assets are stored locally and do not require remote images during rendering.

## Naming and future changes

The name remains provisional. When the owner chooses the final name, update brand.config.json, then re-check the Expo config, app label, documentation and store assets. The icon mark contains no embedded text, so it can remain unless the visual direction changes.

Changing applicationId after a native build changes the app identity; generate and install a new native binary after any such decision.

## Verification status

- [x] Central brand config resolves through expo config.
- [x] Expo Doctor passed 21/21 checks during the 2026-10-28 verification pass.
- [x] The Android JavaScript bundle exported successfully with --no-bytecode.
- [ ] Launcher icon and splash rendering have not yet been visually checked in an installed native build.
- [ ] Physical-device appearance, status-bar contrast, safe areas and long Bangla text remain unverified.
- [ ] Product display name remains provisional.
- [ ] Production store assets/screenshots have not been finalized.
