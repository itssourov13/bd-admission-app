# Android build and release guide

Last updated: 2026-10-31

## Current release setup

- App: **BD Admission**
- Android application ID: `com.admissionbd.app`
- Expo slug: `bd-admission-app`
- Expo account/project: `@sk_king13/bd-admission-app`
- EAS project ID: `16ba69b8-96d7-4856-a197-77acddebe1ec`
- App version: `0.1.0`; Android version code starts at `1`.
- Build profiles: `preview` (installable APK) and `production` (Play Store AAB).
- GitHub Actions CI workflow: `.github/workflows/ci.yml`.

The EAS project is initialized and the Expo app config is linked. The EAS CLI authenticated on the local workstation as `sk_king13`. The project config and EAS project metadata were checked successfully. This setup does not claim that a native build or device test has completed.

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

## Preview APK — install on a physical Android phone

Start the cloud build from the project root:

```sh
pnpm dlx eas-cli@latest build --platform android --profile preview
```

The first build may ask EAS to create or configure Android signing credentials. Prefer EAS-managed Android credentials and retain them in the EAS account. Do not replace/reset the keystore between builds.

The `preview` profile uses internal distribution and `android.buildType: apk`. When the build completes, open the project's EAS Builds page:

https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds

Open the successful Android preview build and use its Install/Download link to download the APK. Transfer/open the APK on the Android phone and accept Android's install prompt for the browser or file manager when required. This is an installable test build, not a Play Store release.

## Production AAB — Google Play

After preview APK installation and physical-device QA are complete:

```sh
pnpm dlx eas-cli@latest build --platform android --profile production
```

The `production` profile produces an Android App Bundle (AAB), suitable for Google Play upload. It is not directly installable like an APK. Check the generated artifact and resolved target SDK against the Play Console requirements in effect at the actual submission date.

Play Store submission also requires a configured Play Console app, listing assets, privacy/data-safety declarations, a privacy policy, signing setup and any account-specific testing/access requirements. Configure and review those separately before using EAS Submit.

## GitHub Releases

Use **GitHub Releases**, not GitHub Packages, for downloadable app binaries.

For a public release, create a Git tag such as `v0.1.0`, write release notes, and attach the generated APK (and optionally the AAB) under clear names such as:

- `BD-Admission-v0.1.0.apk`
- `BD-Admission-v0.1.0.aab`

Include a SHA-256 checksum for distributed artifacts. Never attach signing keystores, credentials, environment files or service-account keys.

## GitHub Actions CI

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests targeting `main`, and manual `workflow_dispatch`. It performs:

1. Frozen pnpm dependency install.
2. Automated tests, TypeScript and ESLint.
3. Public Expo config validation.
4. Android JavaScript bundle export with `--no-bytecode`.

The CI workflow does not build an APK/AAB and does not need an Expo token. It cannot run on GitHub until this branch is pushed and opened as a pull request (or merged/pushed to `main`). The CI job omits `expo doctor` because that check can fail on transient Expo API/network fetches; run it separately when needed.

## Release gates still open

- Complete a successful EAS preview APK build.
- Install it on a physical Android device and check first launch, SQLite initialization, offline browsing/practice, Flash/Standard exam, figures, timers, app background/resume and persisted history.
- Confirm app name/branding and prepare store icon, screenshots, descriptions and privacy policy.
- Confirm Google Play target API and account-specific testing requirements at submission time.
- Build and inspect the production AAB before any public store rollout.

A successful Expo JavaScript export or GitHub CI run does not replace native APK installation or physical-device QA.
