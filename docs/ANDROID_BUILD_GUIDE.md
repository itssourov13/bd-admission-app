# Android Build Guide — BD Admission

This is the canonical, repeatable procedure for preparing and submitting Android builds from this repository. It captures the host-specific EAS upload issue found on 2026-11-22 and the pseudo-terminal workflow that resolved it.

## Current submitted build

- App version: `0.1.12`
- Android versionCode: `12`
- Application ID: `com.admissionbd.app`
- Expo slug: `bd-admission-app`
- EAS project: `16ba69b8-96d7-4856-a197-77acddebe1ec` (`@sk_king13/bd-admission-app`)
- Profile / distribution / artifact: `preview` / `INTERNAL` / APK
- EAS CLI used: `27.11.0`; Node: `22.23.1`; pnpm: `11.10.0`
- Build ID: `32339eb3-cef2-45fa-b268-2917fecd82be`
- Build page: [v0.1.12 Android preview](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/32339eb3-cef2-45fa-b268-2917fecd82be)
- Final EAS status: **FINISHED**, completed 2026-11-22 at 05:52:33 UTC / 11:52:33 Asia/Dhaka.
- APK artifact: [Download v0.1.12 APK](https://expo.dev/artifacts/eas/TMGMPfAQMCOrlZ4hKHmZSx-iDDCLjN57_FwM5zGA66Y.apk) (internal preview; artifact expiry 2026-12-06 at approximately 11:37 Asia/Dhaka).
- Owner installed the APK and completed on-device checks, confirming the question-report feature works as expected. See [QA_CHECKLIST.md](QA_CHECKLIST.md).
- The uploaded project archive was 36.6 MB. EAS reported `Uploaded to EAS 1m 4s`.

For the complete release history and owner QA evidence, see [ANDROID_RELEASE.md](ANDROID_RELEASE.md), [HANDOFF.md](HANDOFF.md) and [QA_CHECKLIST.md](QA_CHECKLIST.md).

## Project invariants — do not change casually

The following identifiers and settings are already linked to the owner's EAS project and Android installation:

- Android application ID: `com.admissionbd.app`
- Expo slug: `bd-admission-app`
- EAS project ID: `16ba69b8-96d7-4856-a197-77acddebe1ec`
- EAS-managed Android signing identity / Keystore: retain the existing credentials.
- `eas.json` pins the EAS cloud build Node runtime to `22.23.1`.
- `preview` uses internal distribution and `android.buildType: apk`.
- `production` uses `android.buildType: app-bundle` and is for a separate Google Play AAB workflow.

Before a release, ensure these three local version values agree:

1. `package.json` → `version`
2. `brand.config.json` → `version`
3. `app.config.js` → Expo `version` and `android.versionCode`

Increment Android `versionCode` for each new Android release. Do not reuse a versionCode already submitted. Do not create a new Expo project, change the application ID, reset/delete the existing Keystore, or rotate signing credentials as part of a normal preview build.

## Host toolchain — use the pinned, known-good combination

Run from the repository root on the connected Kali/NetHunter workspace:

```sh
cd /home/kali/gpt-workspace/bd-admission-app
source "$HOME/.nvm/nvm.sh"
nvm use 22.23.1
pnpm install --frozen-lockfile

node --version
pnpm --version
pnpm dlx eas-cli@27.11.0 --version
```

Expected versions on the validated host:

- Node.js: `v22.23.1`
- pnpm: `11.10.0`
- EAS CLI: `eas-cli/27.11.0`

**Do not call a bare global `eas` command on this host.** The host had multiple stale global installations: `/usr/local/bin/eas` resolved to EAS CLI 21.0.1 under system Node 24.19.0, while the NVM Node 22 installation exposed EAS CLI 25.3.0. The successful v0.1.12 submission used `pnpm dlx eas-cli@27.11.0` under Node 22.23.1. Use that explicit CLI version for reproducibility; do not silently switch back to a global binary or an unverified CLI version.

## Preflight before every build

1. Confirm the intended branch and review the complete source diff. Do not build from an unknown or unexpectedly dirty worktree.
2. Confirm version, package ID, slug, EAS project ID and preview profile.
3. Confirm no versionCode has already been submitted for a different artifact.
4. Run the relevant local checks for the source being released. For the v0.1.12 implementation, the recorded results were 318/318 full tests, 54/54 focused tests, TypeScript, lint, Expo install check, `git diff --check` and Expo Doctor 21/21 — all passed on Node 22.23.1.
5. Check that the existing EAS-managed Android credentials are selected when the build starts. If EAS unexpectedly asks to create/replace/reset signing credentials, stop and investigate rather than changing them.

Useful preflight commands:

```sh
git status --short --branch
git diff --check

node - <<'NODE'
const pkg = require('./package.json');
const brand = require('./brand.config.json');
const app = require('./app.config.js');
console.log({
  packageVersion: pkg.version,
  brandVersion: brand.version,
  appVersion: app.version,
  androidVersionCode: app.android?.versionCode,
  applicationId: app.android?.package,
  expoSlug: app.slug,
  easProjectId: app.extra?.eas?.projectId,
});
NODE
```

The `eas-build-pre-install` hook in `package.json` runs `node scripts/build-content.mjs --ensure` before the cloud native build, so the ignored SQLite seed is regenerated from tracked canonical question packs before prebuild. Do not remove or bypass this hook. For a custom, non-EAS build path, run `pnpm content:ensure` before Expo prebuild/Metro/Gradle bundling. The current repository has no `.easignore` file; do not add one or exclude the generated seed without auditing the archive inputs and verifying the resulting APK.

## Submit an internal Android preview APK

Use a pseudo-terminal. This is important on the connected Desktop Commander host.

```sh
cd /home/kali/gpt-workspace/bd-admission-app
source "$HOME/.nvm/nvm.sh"
nvm use 22.23.1

mkdir -p /tmp/bd-admission-eas
LOG="/tmp/bd-admission-eas/v0.1.12-$(date +%Y%m%d-%H%M%S).log"

script -q -f -e -c 'EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 pnpm dlx eas-cli@27.11.0 build --platform android --profile preview --non-interactive --no-wait --message "BD Admission vX.Y.Z Android preview"' "$LOG"
```

Replace the message with the actual release version and short scope before running a future build. Keep the command on the `preview` profile for an installable APK. Do not add `--wait`; this workflow stops after EAS accepts/queues the build, not after cloud build completion.

The flags used by the successful v0.1.12 submission:

- `EAS_NO_VCS=1`: build from the checked-out project directory rather than the EAS temporary Git shallow-copy path. EAS prints a “without version control system” warning; this is expected for this invocation and is not, by itself, a build error.
- `EAS_SKIP_AUTO_FINGERPRINT=1`: skip the host fingerprint step used in this workspace's known workaround. It was used on the successful submission.
- `--non-interactive`: prevents interactive prompts during submission.
- `--no-wait`: return after submission rather than waiting for the cloud build to finish.
- `script -q -f -e -c ... "$LOG"`: supplies a pseudo-TTY and flushes the terminal output to a log file while preserving the command's exit status.

### Critical Desktop Commander / non-TTY lesson

EAS uses an `ora` spinner for archive upload progress. When EAS runs without a TTY (`process.stdin.isTTY === false`), the spinner is disabled and Desktop Commander may capture only the initial line:

`Uploading to EAS Build (0 / 36.6 MB)`

That line alone does **not** prove that the upload is stuck. Earlier v0.1.12 attempts were stopped based on this misleading non-TTY output. With the pseudo-terminal wrapper above, the same upload showed the actual progress and completed:

`0 → 2.1 → 8.2 → 14.9 → 21.6 → 26.1 → 32.8 → 35.0 → 36.6 MB / 36.6 MB`

The archive compressed in 17 seconds and uploaded in 1 minute 4 seconds. Do not stop a live upload just because a non-TTY log remains at 0 MB. Prefer the pseudo-terminal log and inspect the newest progress value before deciding that an upload has stalled.

## Verify EAS accepted the build — then stop monitoring

A successful submit prints a build URL/ID, for example:

`https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/<BUILD_ID>`

Verify that exact ID:

```sh
pnpm dlx eas-cli@27.11.0 build:view <BUILD_ID> --json
```

Check all of the following in the response:

- `id` matches the submitted build ID.
- `status` is `QUEUED` or `IN_PROGRESS`.
- `platform` is `ANDROID`.
- `buildProfile` is `preview`.
- `distribution` is `INTERNAL`.
- `appIdentifier` is `com.admissionbd.app`.
- `appVersion` and `appBuildVersion` match the release metadata.

A matching build record in `QUEUED` or `IN_PROGRESS` confirms that EAS accepted the job. **Stop monitoring at that point** unless the owner explicitly asks to wait for the APK/build completion. A submitted build is not the same as a finished build or a device-tested release.

If the CLI reports upload completion but does not show a build ID, do not immediately submit a duplicate. First inspect the command log and run:

```sh
pnpm dlx eas-cli@27.11.0 build:list --platform android --limit 5 --json
```

Find the new build by app, version, message and creation time, then verify it with `build:view`.

## Troubleshooting and recovery

| Symptom | Correct response |
|---|---|
| Upload appears to stay at `0 / N MB` in a Desktop Commander log | Check whether the command has a TTY. Re-run/observe with the `script` pseudo-terminal wrapper. Do not infer a network failure from a non-TTY spinner line. |
| EAS CLI version differs from 27.11.0 | Activate Node 22.23.1 and invoke `pnpm dlx eas-cli@27.11.0`; do not use a bare global `eas`. |
| “Using EAS CLI without version control system” warning | Expected with `EAS_NO_VCS=1`. Ensure the intended workspace/branch is correct and that no unintended local files enter the build archive. |
| Existing Android credentials/Keystore are not selected | Stop before changing credentials. Check account/project linkage and request owner review if the existing signing identity cannot be resolved. |
| Archive compression takes time on the ARM/NetHunter host | Inspect the process and spinner. The v0.1.12 archive took about 17 seconds to compress; this alone is not a hang. |
| Upload progress is genuinely not advancing in a pseudo-TTY | Preserve the complete log, check process state and network/GCS reachability, and capture the exact error/exit status. Do not start a second concurrent build while the first submission process may still be active. |
| Upload finished but build ID/acceptance is unclear | Check the submit log and EAS build list before retrying, to avoid duplicate builds. |

Do not place Expo session secrets, access tokens, signed upload URLs, Keystore files/passwords or service-account credentials in documentation or logs shared outside the authorized workspace. Redact secrets before attaching diagnostic logs.

## After the cloud build

1. Wait for EAS completion only when the owner requests it. Once complete, obtain the APK from the EAS build page.
2. Install/update over the existing app to exercise the migration path. Keep `com.admissionbd.app` and the existing signing identity.
3. Do not uninstall or clear the primary installation for a fresh-install test: local profile, bookmarks, history, practice sessions, answers and reports are stored on-device. Use a disposable device/profile for destructive first-install testing.
4. For v0.1.12 specifically, test CU Bangla/English catalogue display, Profile shortcut order, reporting from Browse/Bookmarks/Flash/Exam/Result, report persistence and edit/delete, the composer while timed sessions continue, JSON content/privacy, and Sharesheet hand-off/readability in installed targets.
5. A Sharesheet opening does not prove that a recipient received the file. Record only what was observed.
6. Update [ANDROID_RELEASE.md](ANDROID_RELEASE.md), [HANDOFF.md](HANDOFF.md), [CURRENT_STATE.md](CURRENT_STATE.md), [TASK_STATE.md](TASK_STATE.md), [QA_CHECKLIST.md](QA_CHECKLIST.md) and [CHANGELOG.md](CHANGELOG.md) with the actual build status and owner QA. Do not claim device QA until the owner/device evidence exists.

## Production AAB is a separate release

The `production` profile creates an Android App Bundle (AAB), not an installable preview APK. It is intended for the separate Google Play release workflow. Do not use it as a substitute for the `preview` APK, and do not submit to Play Console unless that release is explicitly requested and its current store requirements are checked.
