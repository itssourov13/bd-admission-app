# Branding guide

## Current provisional identity
- Display name: BD Admission (provisional until the owner chooses the final product name).
- Slug: bd-admission-app.
- Android application ID and iOS bundle identifier: com.admissionbd.app.
- Deep-link scheme: bdadmission.
- Bangla tagline: ভর্তি প্রস্তুতি, আত্মবিশ্বাসের সাথে.
- English tagline: Prepare smarter. Move forward..

## Visual direction
A fresh academic identity distinct from the original teal/coral look: deep navy for trust and focus, emerald green for learning/progress, and restrained gold accents for achievement. The custom open-book mark has a rising path and progress star. No ScholarHub logo artwork or wordmark is used.

## Single source of truth
The file brand.config.json owns the name, slug, scheme, application ID, taglines and colors. app.config.js, src/brand.ts, src/theme.ts and tailwind.config.js read from that configuration. Change the central JSON rather than scattering branding values across screens.

## Local assets
- assets/brand/app-icon.png: 1024x1024 full-bleed launcher/store icon.
- assets/brand/adaptive-icon.png: transparent Android adaptive foreground.
- assets/brand/splash-icon.png: transparent splash mark.
- assets/brand/logo-mark.png: bundled in-app mark.
- assets/brand/brand-mark.svg: editable vector master.

All branding assets are local; rendering does not require network images or downloads.

## Choosing a final name
The current display name is provisional. Once the final name is chosen, update brand.config.json. The icon mark contains no embedded text, so it can remain unless the brand direction changes. If applicationId changes after a native build, generate a new native binary because that identifier is part of app identity.

## Verification status
Assets and config are generated locally. Expo config/doctor and Android export must be run after installing dependencies under Node 22.23.1. Splash/launcher rendering still requires native build/device verification.
