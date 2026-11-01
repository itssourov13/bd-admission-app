# Android build and release guide

Last updated: 2026-11-01

## Current release setup

- App: **BD Admission**
- Android application ID: `com.admissionbd.app`
- Expo slug: `bd-admission-app`
- Expo account/project: `@sk_king13/bd-admission-app`
- EAS project ID: `16ba69b8-96d7-4856-a197-77acddebe1ec`
- App version: `0.1.0`; Android version code starts at `1`.
- Build profiles: `preview` (installable APK) and `production` (Play Store AAB).
- GitHub Actions CI workflow: `.github/workflows/ci.yml`.

The EAS project is initialized and linked to the app config. The preview profile has now produced an installable Android APK, which was published in the public GitHub pre-release below. The owner installed and checked that APK on a physical Android phone and reported normal operation. The production AAB and Google Play rollout have not yet been completed.

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

The `preview` profile uses internal distribution and `android.buildType: apk`. The first preview build completed with EAS build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`. On this ARM/NetHunter host, the build upload required the no-VCS/fingerprint workaround documented below.

```sh
EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 pnpm dlx eas-cli@latest build --platform android --profile preview
```

`EAS_NO_VCS=1` uses the project folder rather than EAS's temporary Git shallow clone; `EAS_SKIP_AUTO_FINGERPRINT=1` skips the fingerprint computation that stalled after the successful upload on this host. Use this workaround only where needed. The successful build is visible in the [EAS Builds dashboard](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds). The generated APK was uploaded to the GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1) and installed/checked on a physical Android phone by the owner. The release is a preview, not a Play Store production release.

## New preview APK — startup setup UI and JU/HSTU banks

The published `v0.1.0-preview.1` APK predates the JU/HSTU imports and the branded startup/setup UI. Build a new preview APK from the current branch before physical-device testing:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use 22.23.1
pnpm install --frozen-lockfile
EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 pnpm dlx eas-cli@latest build --platform android --profile preview
```

Install the generated APK on a test device. Installing over the existing app exercises the returning-install path and should retain the local database. For a genuine empty-database first-install check, use a disposable device/profile. Uninstalling the app or clearing its storage deletes the local profile, bookmarks, practice sessions, answers and history; do not clear the primary installation without accepting that loss.

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
2. Automated tests, TypeScript and ESLint.
3. Public Expo config validation.
4. Android JavaScript bundle export with `--no-bytecode`.

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
