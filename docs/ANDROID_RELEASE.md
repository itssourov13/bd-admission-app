# Android build and release guide

## Current incident and candidate

- v0.1.3 / Android versionCode 4 was built and its embedded SQLite seed was integrity-checked, but the owner-reported phone test fails at **Importing question library**. Treat that APK as a failed runtime candidate, not as release-ready.
- The source fix is v0.1.4 / Android versionCode 5. It corrects the SQLite sidecar destination from raw filesystem path to an Expo file:/// URI, uses Expo FileSystem legacy native copy for Android resource-aware copying and displays the underlying error on the retry screen.
- Automated verification is complete. Replacement EAS preview build 040c75b2-0bbd-47b5-b859-cdb7f179f968 was submitted for v0.1.4 / code 5 and is currently IN_QUEUE; APK artifact inspection and physical-device confirmation remain pending.
- Keep the existing app installed when updating. Do not uninstall or clear app storage; the package ID and EAS-managed signing identity are unchanged.

Last updated: 2026-11-05

## Current release setup

- App: **BD Admission**
- Android application ID: `com.admissionbd.app`
- Expo slug: `bd-admission-app`
- Expo account/project: `@sk_king13/bd-admission-app`
- EAS project ID: `16ba69b8-96d7-4856-a197-77acddebe1ec`
- Previous seed-based preview APK: 0.1.3 / Android versionCode 4; owner reports first-run failure at question-library import. Current source candidate: 0.1.4 / versionCode 5; replacement APK and phone confirmation pending.
- Build profiles: `preview` (installable APK) and `production` (Play Store AAB).
- GitHub Actions CI workflow: `.github/workflows/ci.yml`.

The EAS project is initialized and linked to the app config. The v0.1.3 / code 4 seed-based APK was built and its database payload passed package-integrity checks, but the owner reports that it fails on a physical phone during question-library import. v0.1.4 / code 5 contains the source fix; build it through EAS and require owner confirmation before treating startup as fixed. Production AAB and Google Play rollout are not complete.

## Prerequisites

Use Node 22.23.1 and pnpm 11.10.0 from the repository's `.nvmrc` and package configuration:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use 22.23.1
pnpm install --frozen-lockfile
```

Use the latest EAS CLI through pnpm so an old globally installed `eas` binary does not block current project configuration:

```sh
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest project:info
```

The project must remain linked to the EAS account above. Do not commit EAS auth tokens, Android keystores, service-account JSON, or other credentials.

## Preview APK — build/install procedure (v0.1.0-preview.1 published)

Start the cloud build from the project root:

```sh
pnpm dlx eas-cli@latest build --platform android --profile preview
```

The first build may ask EAS to create or configure Android signing credentials. Prefer EAS-managed Android credentials and retain them in the EAS account. Do not replace/reset the keystore between builds.

The `preview` profile uses internal distribution and `android.buildType: apk`. Before EAS installs packages or runs Expo prebuild, the `eas-build-pre-install` hook runs `node scripts/build-content.mjs --ensure` to regenerate the ignored SQLite seed from tracked source packs. This timing is required because the expo-asset config plugin copies the .db file during native prebuild. The builder uses only Node built-ins and repository-local modules, so it does not depend on installed packages. Node 22.23.1 is pinned in `eas.json`. Custom/non-EAS build flows must run `pnpm content:ensure` before Expo prebuild/Metro/Gradle bundling. The first preview build completed with EAS build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`. On this ARM/NetHunter host, the build upload required the no-VCS/fingerprint workaround documented below.

```sh
EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 pnpm dlx eas-cli@latest build --platform android --profile preview
```

`EAS_NO_VCS=1` uses the project folder rather than EAS's temporary Git shallow clone; `EAS_SKIP_AUTO_FINGERPRINT=1` skips the fingerprint computation that stalled after the successful upload on this host. Use this workaround only where needed. The successful build is visible in the [EAS Builds dashboard](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds). The generated APK was uploaded to the GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1) and installed/checked on a physical Android phone by the owner. The release is a preview, not a Play Store production release.

## Previous seed-based preview — v0.1.3 (EAS build finished; owner-reported runtime failure)

- App/brand/package version: `0.1.3`; Android `versionCode 4`; application ID: `com.admissionbd.app`.
- EAS profile: `preview`, internal distribution, Android APK. EAS account `sk_king13`; project ID: `16ba69b8-96d7-4856-a197-77acddebe1ec`.
- Includes the SQLite seed startup, compact manifest, public Expo Asset/File sidecar copy, integrity validation and lifecycle-aware resume alongside the profile/math/exam-rule correctness changes.
- EAS build ID: `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd`; status: **`FINISHED`**, completed **2026-11-05 13:32:51 UTC / 19:32:51 Asia/Dhaka**. [Open the EAS build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) or [download the APK](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk) (~112 MiB).
- Artifact inspection: APK contains `assets/content_seed.db` (23,724,032 bytes). The asset was extracted and its SHA-256 matched the generated source seed; ZIP CRC passed; SQLite `quick_check` is `ok`, foreign-key issues `0`, schema v5, 217 packs / 13,609 questions. This validates packaging/integrity, not the on-device `Asset.downloadAsync` + `File.copy` runtime path.
- EAS Expo Doctor reported 20/21 checks because five Expo SDK patch packages (`expo`, `expo-asset`, `expo-constants`, `expo-router`, `expo-splash-screen`) were one patch behind the recommended versions. The build continued through prebuild/Gradle and reached `FINISHED`; align these patch versions in a follow-up maintenance pass.
- The owner later installed v0.1.3 and reported failure at first question-library import. The replacement v0.1.4 must be tested on the phone; this build host has no ADB or connected Android device.

## Previous correctness preview — v0.1.2 (pre-seed; historical)

- App/brand/package version: `0.1.2`; Android `versionCode 3`; application ID: `com.admissionbd.app`.
- EAS profile: `preview`, internal distribution, Android APK. EAS account `sk_king13`; project ID: `16ba69b8-96d7-4856-a197-77acddebe1ec`.
- Includes the 2026-11-05 correctness implementation: profile display-name persistence, accessible display-only math rendering, exact-paper exam-rule/scoring safeguards, partial official rule facts and the read-only question-quality audit. It predates the seed-based startup changes now on the working branch and does not verify the generated SQLite asset import.
- EAS build ID: `af78b85f-7a2b-4fba-b693-532c7d218f8b`; status: **FINISHED**; started **2026-11-05 12:44:49 +06:00** and finished **2026-11-05 13:00:01 +06:00**.
- [Open the Expo EAS build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/af78b85f-7a2b-4fba-b693-532c7d218f8b) or [download the v0.1.2 APK](https://expo.dev/artifacts/eas/CaI6tX3jbyvV5ghfjc0gxU_D4-U1oSlfWHD9M_4DaVY.apk).
- **Physical-device QA remains pending.** Install over the prior app without clearing its data to exercise the update/migration path; use a disposable profile/device for destructive fresh-install checks.

## Previous preview APK — v0.1.1 (historical; superseded by v0.1.2 source)

The previous internal preview build was **`0.1.1` / Android `versionCode 2`**. It includes the branded startup/setup UI and the current JU/HSTU verified and unverified question banks. EAS build ID: `b4745dc4-0069-4a86-bb5b-234e5f377dfd`. EAS status is **`FINISHED`** (completed **2026-11-01 12:19:53 +06:00**). Open the [Expo EAS build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) with the owner account and tap **Install**, or [download the APK directly](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). The preview profile is internal distribution and created an installable APK. The old `v0.1.0-preview.1` GitHub asset is historical and does not include this newer UI/content.

The `0.1.1` build reuses the existing EAS-managed Android keystore and retains application ID `com.admissionbd.app`; Android `versionCode` was incremented from `1` to `2` for upgrade installation. No GitHub release was created for this internal build. The Expo build page indicates expiry on **2026-11-15 12:05 +06:00**. Physical-device install/update QA is still required.

To reproduce the cloud build from the same source branch:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use 22.23.1
pnpm install --frozen-lockfile
EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 pnpm dlx eas-cli@latest build --platform android --profile preview
```

Install the generated APK on the Android device. Installing over the existing app exercises the returning-install path and should retain the local database. The current EAS build link is scheduled to expire on **2026-11-15 12:05 +06:00**; install it from the Expo build page before expiry. For a genuine empty-database first-install check, use a disposable device/profile. Uninstalling the app or clearing its storage deletes the local profile, bookmarks, practice sessions, answers and history; do not clear the primary installation without accepting that loss.

Device checks: native splash transitions to the setup UI without a blank frame; Bangla and English copy render; stage/progress updates as packs are processed; completion opens Home; initial setup works in airplane mode; retry appears after an initialization/import failure; an update on an existing installation preserves local data; short screens, Reduce Motion and accessibility labels remain usable. Record device/OS and observed timings separately. The no-bytecode export in `docs/QA_CHECKLIST.md` is not an APK build or a substitute for this device check.

## Production AAB — Google Play

After preview APK installation and physical-device QA are complete:

```sh
pnpm dlx eas-cli@latest build --platform android --profile production
```

The `production` profile produces an Android App Bundle (AAB), suitable for Google Play upload. It is not directly installable like an APK. Check the generated artifact and resolved target SDK against the Play Console requirements in effect at the actual submission date.

Play Store submission also requires a configured Play Console app, listing assets, privacy/data-safety declarations, a privacy policy, signing setup and any account-specific testing/access requirements. Configure and review those separately before using EAS Submit.

## GitHub Releases

Use **GitHub Releases**, not GitHub Packages, for downloadable app binaries.

The first Android preview has already been published:

- Release: [BD Admission v0.1.0 Preview 1](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1)
- Tag: `v0.1.0-preview.1` (GitHub `prerelease: true`)
- Published: 2026-10-31 04:16:28 +06:00
- APK: [BD.Admission.v0.1.0.apk](https://github.com/itssourov13/bd-admission-app/releases/download/v0.1.0-preview.1/BD.Admission.v0.1.0.apk)
- Size: 112,443,213 bytes (107.2 MiB)
- SHA-256: `da7f928827ae6945eddebedc817dabe2c9b0467240dc0d59ec4a0170d0a14f9d`

For future releases, create a new version tag, write release notes and attach the matching APK (and AAB only when appropriate). Include a SHA-256 checksum for distributed artifacts. Never attach signing keystores, credentials, environment files or service-account keys.

## GitHub Actions CI

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests targeting `main`, and manual `workflow_dispatch`. It performs:

1. Frozen pnpm dependency install.
2. Build the bundled SQLite seed, run the read-only content/seed integrity check and ensure the generated manifest is clean.
3. Automated tests, TypeScript and ESLint.
4. Public Expo config validation.
5. Android JavaScript bundle export with `--no-bytecode`.

The CI workflow does not build an APK/AAB and does not need an Expo token. PR #2 (`chore/ci-eas-android-build-2026-10-31`) was merged into `main` at `3aa125d4e12cdca1702f976f20c1f60a765923d1`. The [pull-request CI run](https://github.com/itssourov13/bd-admission-app/actions/runs/41109514896) and [main push CI run](https://github.com/itssourov13/bd-admission-app/actions/runs/41109555081) both completed successfully. The CI job omits `expo doctor` because that check can fail on transient Expo API/network fetches; run it separately when needed.

## Production release gates still open

- [x] EAS preview APK build completed and published as GitHub pre-release `v0.1.0-preview.1`.
- [x] Owner-confirmed installation and physical Android smoke verification of the preview APK. The owner reported normal operation; the first load took about one minute and subsequent opens about 2–3 seconds. Detailed step-by-step results are recorded as owner-reported, not instrumented QA evidence.
- [ ] Build and inspect the production AAB using the `production` profile.
- [ ] Confirm the final production display name and Play Console app identity.
- [ ] Prepare the Play Console listing, final store screenshots/graphics, privacy policy and data-safety declarations.
- [ ] Verify target API and account-specific testing/access requirements at the actual submission date.
- [ ] Complete Play Console submission/review and production rollout.

The GitHub preview release is not a Play Store production release. A no-bytecode JavaScript export or CI run alone does not replace native APK installation and physical-device QA; those preview steps have now separately been completed.
