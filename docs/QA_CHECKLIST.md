## Android preview candidate v0.1.12 — 2026-11-22

| Check | Result | Evidence |
|---|---|---|
| Release metadata | [x] Prepared | App / brand / package 0.1.12; Android versionCode 12; package com.admissionbd.app; Expo slug and EAS project preserved. |
| Feature scope | [x] Included in source | CU Bangla catalogue display, Profile ordering, SQLite v13 question issue reports, Profile list/detail/edit/delete, versioned JSON export and Android Sharesheet. |
| Automated implementation gates | [x] Pass | Node 22.23.1: full tests 318/318; focused tests 54/54; typecheck; lint; Expo dependency check; Expo Doctor 21/21; diff check. |
| Resolved Expo config | [x] Pass | Resolved Expo config confirms version 0.1.12, Android versionCode 12, package com.admissionbd.app, slug bd-admission-app and existing EAS project ID. |
| EAS preview submission | [ ] Not accepted | Two no-wait attempts reached the 36.6 MB archive upload step but last visible progress remained 0 MB; no build ID/acceptance acknowledgement. Both were stopped after short monitoring. Build list still showed only v0.1.11/v0.1.10. Retry required. |
| Cloud build completion | [ ] Not submitted | No EAS job ID was confirmed, so there is no cloud build to monitor. |
| Physical Android install and run | [ ] Pending | Install v0.1.12 APK and test layout, timed report composer, local persistence and JSON attachment sharing. |
| Google Play production release | [ ] Not requested | Internal APK only; no production AAB or Play submission. |
| Git | [x] Pass | Release metadata/docs are committed in 1a81bc8; this submission-status update is committed separately. No push. |

---

## Android preview v0.1.11 — 2026-11-19

| Check | Result | Evidence |
|---|---|---|
| Release metadata | [x] Pass | App / brand / package `0.1.11`; Android `versionCode 11`; `com.admissionbd.app`; existing Expo slug and EAS project retained. |
| CU content source | [x] Pass | 26 CU A Unit packs / 2,558 questions / 11,397 options and original official-site CU PNG are in the active Varsity source and generated manifest/seed. |
| Versioned local gates | [x] Pass | 301/301 tests; typecheck; lint; content check 231 / 16,407; pack validation 230 / 14,579 (0 errors / 5,536 warnings); question assets 65 / 66 refs; resolved Expo config; `git diff --check`. |
| EAS preview submission | [x] Submitted | EAS build `8aa4643c-e312-4a0b-af08-9b3f7779b68c` accepted; [build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c). Android / `preview` / `INTERNAL`. |
| Cloud build completion | [x] Owner-confirmed | Owner confirms EAS build completed and the v0.1.11 APK was available for installation. [EAS build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c). |
| Physical Android install and run | [x] Owner-reported pass | Owner installed the v0.1.11 APK and reports that the app checks performed work normally. Handset model/OS and exhaustive screen/accessibility coverage were not recorded; this is a manual smoke check. |
| Git | [x] Pass | Release metadata and EAS submission evidence are committed locally; release/device QA documentation is being recorded in this follow-up commit. No push. |

---

## CU A Unit Varsity content import — 2026-11-19

| Check | Result | Evidence |
|---|---|---|
| Package integrity / collision preflight | [x] Pass | All package `SHA256SUMS` entries and ZIP sidecar verified; 26 filenames and all incoming batch/paper/question/source IDs clear. No existing pack overwritten. |
| Varsity-only import | [x] Pass | 26 packs / 26 papers / 2,558 questions / 11,397 options / 68 sources copied flat to `data/question-packs/`; no Library/ASPECT content changed. |
| CU verified practice gate | [x] Pass | 2,185 normal eligible questions / 307 review candidates. All 26 papers have non-zero eligible questions; no provisional-only fallback is activated. Unverified answer keys remain hidden in Browse. |
| CU official exam-rule boundary | [x] Pass | Partial 2025–26 100-mark / 60-minute data remains unavailable/incomplete for scored Standard Exam; other 25 rules remain unconfigured. |
| Original university logo | [x] Pass | Official University site PNG copied unchanged as `assets/universities/cu.png` (429×581 RGBA); registered in the existing logo map and source recorded in `assets/universities/SOURCES.md`. |
| Pack validation | [x] Pass | 230 Varsity packs / 14,579 questions; 0 errors / 5,536 warnings. |
| Question-figure asset registry | [x] Pass | 65 assets / 66 refs / 65 unique; no question-image path/index change needed. |
| Generated content build/check | [x] Pass | 231 manifest entries / 16,407 questions / 66,793 options; local ignored seed 28.05 MiB; `content:check` matches. SQLite `quick_check=ok`, foreign-key violations 0; seed schema v12. |
| Regression suite / type / lint | [x] Pass | Full suite 301/301; typecheck and lint pass on Node 22.23.1. Targeted CU/import/migration group 9/9. |
| Android Metro export | [x] Pass | `pnpm exec expo export --platform android --no-bytecode`: 2,044 modules, 147 assets including `assets/universities/cu.png` and the 29 MB SQLite seed; ~4 MB JS. |
| Android APK / device test | [ ] Not run | Existing v0.1.10 APK predates CU. No EAS build or physical-device QA was requested/performed in this import task. |
| Git | [x] Pass | Local commit `feat(content): import CU A Unit question bank`; worktree clean, no push. |

---

## Android preview candidate v0.1.10 — 2026-11-18

| Check | Result | Evidence |
|---|---|---|
| Release metadata | [x] Pass | App / brand / package version `0.1.10`; Android `versionCode 10`; package `com.admissionbd.app`; existing EAS project ID and preview profile retained. |
| RU content in build source | [x] Pass | 46 RU Science packs / 4,249 questions / 45 images are included in the combined tracked content and generated asset index. |
| Local automated gates | [x] Pass | Node 22.23.1: full tests 301/301; typecheck; lint; content check 205 / 13,849; pack validation 204 / 12,021 (0 errors / 5,199 warnings); assets 65 / 66 refs; ASPECT attestation; Expo config and `git diff --check`. |
| EAS preview APK build | [x] Owner-confirmed complete | EAS preview build `64584a92-b1c7-4353-86ef-894152c94550`; [build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/64584a92-b1c7-4353-86ef-894152c94550). Owner confirms APK build completed and was installed. |
| Physical Android install and run | [x] Owner-reported pass | Owner installed v0.1.10 and ran the app; reports that everything checked works normally. Device model/OS and exhaustive per-screen coverage were not supplied. |
| Follow-up issue | [ ] Logged for grouped fix | Some answer explanations show formatting issues. Owner will collect further examples while using the app; fix the confirmed cases together in one focused pass. |
| GitHub pre-release | [ ] Owner action | After owner push/merge and device QA, create a pre-release from the merged default branch and attach the matching APK + SHA-256. |

---

## Android preview v0.1.9 — EAS build and owner manual smoke test — 2026-11-18

| Check | Result | Evidence |
|---|---|---|
| Release metadata | [x] Pass | App version `0.1.9`; Android `versionCode 9`; package `com.admissionbd.app`; existing EAS project retained. |
| EAS internal APK build | [x] Pass | Build `5cdcf931-9b67-46f2-9038-47bb7e144c40` completed FINISHED; [EAS build page / APK download](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/5cdcf931-9b67-46f2-9038-47bb7e144c40). |
| Automated validation | [x] Pass | `pnpm test` 301/301; typecheck; lint; content check (159 entries / 9,600 questions); question-assets check (20/20); ASPECT attestation; pack validation (0 errors / 5,085 warnings); resolved Expo config; `git diff --check`. Node 22.23.1. |
| Physical Android install and run | [x] Owner-reported pass | Owner manually installed and ran this APK on Android and reports everything checked is working normally; no issue currently observed. The owner will note any future issue. Device model/OS and exhaustive screen/accessibility coverage were not recorded. |
| GitHub pre-release | [ ] Pending owner action | After push/merge, create tag `v0.1.9` on the merged default-branch commit, attach the APK from the EAS build page and include a generated SHA-256 checksum. |

---

## Previous Android preview v0.1.7 — build submission


| Check | Result | Evidence |
|---|---|---|
| Release metadata | [x] Pass | App version `0.1.7`; Android `versionCode 8`; package ID and EAS project unchanged. |
| EAS internal APK build | [x] Pass | Build `f1584fb8-0be9-4398-a314-d0fc21507603` is FINISHED; [build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/f1584fb8-0be9-4398-a314-d0fc21507603) · [APK](https://expo.dev/artifacts/eas/2wSz5i5tBMwbqy5BPwu3CAUXn6cJrXmx6fvZZwp6DYU.apk); download endpoint HTTP 200, 121,037,466 bytes (~115.4 MiB). |
| Physical-device install / Library visual QA | [ ] Pending | Install the resulting APK and verify Library discovery, ASPECT book/unit navigation and source/figure rendering. |

---

## RU-V ASPECT Library integration — local seed verification — 2026-11-17 (Node 22.23.1)

| Check | Result | Evidence |
|---|---|---|
| Prepared LibraryPack | [x] Pass | One ASPECT book; 26 units; 1,828 questions; 7,312 options; 1,828 explanations; 20 figures. |
| Answer disposition | [x] Pass | All 1,828 stored `unverified`; 1,797 single-choice source markers retained provisionally; 31 explicit browse-only cases; 3 contradiction keys withheld. Eleven duplicate-option records are also excluded by provisional eligibility. |
| Exclusion ledger | [x] Pass | 154 records remain outside this pack: 38 non-MCQ and 116 MCQs whose options were not reliably extracted. |
| Staging integrity | [x] Pass | `node scripts/ruv-aspect-staging.mjs --verify`: 76/76 files, including generated Library pack and defect scan. |
| Source archives | [x] Pass | RU-V `archive-ruv.mjs --verify`: 36/36 files; Lokkho `archive-lokkho.mjs --verify`: 90/90 files. |
| Library pack / figure hashes | [x] Pass | Pack hash matches `manifest.json`; all 20 figure hashes match. |
| Bundled content build | [x] Pass | `pnpm content:check`: 159 bundled entries (158 university packs + 1 Library pack), 9,600 total question rows; seed 16.83 MiB. |
| SQLite seed integrity | [x] Pass | `user_version=12`; 159 batches; 9,600 questions; 38,400 options; 1 book; 26 units; 1,828 memberships; `quick_check=ok`; zero FK issues. |
| Asset registry | [x] Pass | `pnpm question-assets:check`: 20 assets / 20 references / 20 unique; index current. |
| Fresh-install / repeat sync | [x] Pass | `tests/library-bundled-seed.test.ts`; Library book and all 1,828 memberships sync, second launch is unchanged. |
| Newer installed edition | [x] Pass | Regression test confirms the old bundled seed does not overwrite newer book metadata, unit title, question or option text; old bundle signature is checkpointed before content writes. |
| RU retirement / existing DB | [x] Pass | `tests/ru-retirement-migration.test.ts`: 5/5; real-seed fresh install and schema-v10 upgrade retain historical RU tombstones and also receive the new ASPECT Library book. |
| Focused integration tests | [x] Pass | Combined Library seed, startup, RU-V dry-run, retirement/migration and Library catalogue tests: 35/35. Full suite not run. |
| TypeScript / lint | [x] Pass | `pnpm typecheck`; `pnpm lint`. |
| Android Metro export | [x] Pass | `expo export --platform android --no-bytecode`: 1,994 modules, 100 assets including the 18MB seed and all 20 RU-V figure PNGs; ~4MB Android JS bundle. This is not a native APK. |
| Diff hygiene | [x] Pass | `git diff --check`. |
| Native APK / physical-device Library QA | [ ] NOT RUN | Existing owner-verified v0.1.6 APK predates this content. Build and install a new preview to verify actual device UI/startup sync. |

See `docs/RUV_ASPECT_IMPORT.md` for the question-status definitions, source limitations and import path.

---

## Phase C + Phase D final verification — 2026-11-17 (Node 22.23.1)

| Check | Result | Notes |
|---|---|---|
| Lokkho external archive | [x] Pass | 44 packs / 4,009 questions / 45 assets / 46 refs; verifier passes; all 90 SHA-256 entries pass. |
| RU-V external archive | [x] Pass | 15 packs / 1,828 questions / 17 printed sets / 20 figures; verifier passes; all 36 SHA-256 entries pass. |
| Archive/source reconciliation | [x] Pass | All 59 original pack JSONs and 45 Lokkho images matched their archive copies byte-for-byte before removal. |
| Active source files | [x] Pass | 59 RU pack JSONs and 45 Lokkho image assets removed; non-RU packs retained; assets/universities/ru.svg remains. |
| Content build/check | [x] Pass | pnpm content:build and pnpm content:check: 158 packs / 7,772 questions; generated seed 12.90 MiB. |
| Seed content / SQLite integrity | [x] Pass | 158 batches / 7,772 questions / 31,088 options; zero RU batches/questions and zero question image refs; quick_check=ok; foreign_key_check empty. |
| Asset index/check | [x] Pass | pnpm question-assets:index and pnpm question-assets:check: 0 local assets / 0 references; index current after Lokkho retirement. |
| Pack validation | [x] Pass | pnpm packs:validate: 158 packs / 7,772 questions / 0 errors / 5,085 warnings. Warnings remain review findings, not schema errors. |
| Full automated tests | [x] Pass | pnpm test: 282/282, 0 fail, 0 skipped. Includes synthetic importer regressions and schema-v10-to-v11/history tests. |
| Migration/history preservation | [x] Pass | Realistic v10 fixture, active/completed sessions, bookmarks, multi-key answers, results/rule snapshots, source resolution, seed re-sync, re-delivered RU row, reopen and fresh-install coverage. |
| TypeScript / lint | [x] Pass | pnpm typecheck; pnpm lint. |
| Android Metro export | [x] Pass | pnpm exec expo export --platform android --no-bytecode; ~4 MB Android JS bundle. This is a JS/static export, not a native APK or device test. |
| Archive SHA-256 | [x] Pass | Lokkho 90/90; RU-V 36/36; zero mismatches. |
| Diff hygiene | [x] Pass | git diff --check. |
| Physical Android/emulator QA | [ ] NOT RUN | No final Phase C/D APK was installed in this task. |
| TalkBack / dark theme / narrow MathBlock visual QA | [ ] NOT RUN | Parser/layout tests and Metro export do not replace on-device visual/accessibility checks. |

The latest owner-installed v0.1.6 APK predates Phase C/D. Build a new preview and install it over the existing app to verify schema-v11 upgrade/history and the new 158-pack bundle on a physical device.

## Historical Phase C-only checkpoint — 2026-11-17

This earlier checkpoint preceded Phase C commit fe86f53 and Phase D. Its 217-pack / 13,609-question and 45-asset results are historical, not current.

## v0.1.6 Home Hero runtime follow-up — 2026-11-13

| Check | Result | Notes |
|---|---|---|
| Full repository tests | [x] Pass | 240/240, zero failures/cancellations/skips/todos, Node 22.23.1. |
| TypeScript | [x] Pass | `pnpm typecheck`. |
| Full lint | [x] Pass | `pnpm lint`; the previously reported unused ESLint-disable directive was removed. |
| Content integrity | [x] Pass | `pnpm content:check`: 217 packs / 13,609 questions; current generated SQLite seed. |
| Expo resolved config | [x] Pass | app 0.1.6, Android versionCode 7, package and EAS project ID preserved. |
| Android Metro export | [x] Pass | `pnpm exec expo export --platform android --no-bytecode`; validates JS and static asset bundling, not a native APK. |
| Diff hygiene | [x] Pass | `git diff --check`. |
| Hero runtime structure | [x] Automated | Decorative cover is not a tap target; native CTA controls/routes, responsive behavior and contrast are covered by tests. |
| EAS preview APK | [x] Built | `dcf1b743-ea08-4d27-b01f-82fe26374ffa` FINISHED; https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/dcf1b743-ea08-4d27-b01f-82fe26374ffa; [APK](https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk). |
| Physical-device QA | [x] Owner-reported pass | Owner installed and ran v0.1.6; previously reported Hero/theme/runtime issues are fixed and no current issue is reported. Device model/OS and exhaustive per-screen coverage were not recorded. |

Cover note: `assets/home/hero-cover.jpg` is a 782×382 crop from the owner-supplied UI/UX reference. Check its sharpness and confirm public-distribution rights before using it in a store release.

## Historical full pre-build validation after Phase 8 — 2026-11-13

Environment: Node 22.23.1 (.nvmrc), pnpm 11.10.0, branch feat/import-hstu-verified-answers-2026-11-12.

| Check | Result | Notes |
|---|---|---|
| Full repository test suite | [x] Pass | pnpm test: 211 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo. Includes the 217-pack import/idempotency tests and Phase 8 library / Phase 9 local contract tests. |
| TypeScript | [x] Pass | pnpm typecheck (tsc --noEmit). |
| Full-project lint | [x] Pass | pnpm lint (expo lint). |
| Generated SQLite seed | [x] Rebuilt | Initial pnpm content:check found the ignored local seed at schema v5 while the current app migration is v8. pnpm content:build rebuilt it from canonical data/question-packs/*.json; no question-pack source JSON was edited. |
| Content consistency / SQLite integrity | [x] Pass | pnpm content:check: 217 packs / 13,609 questions, seed 22.68 MiB. Direct SQLite check: user_version=8, quick_check=ok, 0 foreign-key issues; 217 seed packs, 13,609 questions and 54,436 options. |
| Expo public config | [x] Pass | pnpm exec expo config --type public. |
| Android Metro export | [x] Pass | pnpm exec expo export --platform android --no-bytecode: 2,008 modules, 3.9 MB Android JS bundle, 124 assets including the regenerated 24 MB SQLite seed. This is a bundle/export gate, not a native APK or device test. |
| Git / whitespace | [x] Pass | git diff --check; generated seed and dist/ are ignored outputs. |
| Native EAS APK / physical device | [ ] Pending | No version bump, EAS build or new APK installation was performed in this validation task. |

Non-blocking host note: a separate local export with Hermes bytecode generation (without --no-bytecode) previously terminated inside the host hermesc with SIGILL; no SVG transform error was reported. The CI-equivalent no-bytecode Metro export above passes. A cloud EAS build and physical-device verification are still required to validate the native artifact.

Current release metadata remains unchanged: app version 0.1.4, Android versionCode 5. Next internal preview candidate should use a new version and code; do not reuse code 5.

## HSTU verified-question import — 2026-11-12

| Check | Result | Notes |
|---|---|---|
| Accepted ledger reconciliation | [x] Pass | 664 unique HSTU verified IDs; 116 baseline pending IDs remain outside the import. |
| Question/options and answer mapping | [x] Pass | All 664 stems and option ID/text maps match the accepted ledger; all 664 correct-option mappings match exactly. |
| Verified catalogue placement | [x] Pass | 657 IDs moved from HSTU-U appearances to 15 new HSTU papers; 7 existing HSTU IDs updated. All 664 active appearances resolve under HSTU. |
| Verification statuses | [x] Pass | Both existing status fields are verified for all 664 imported IDs. Normal HSTU contains 939 fully verified single-choice questions. |
| Pending preservation | [x] Pass | All 116 baseline pending question objects are unchanged; HSTU-U retains 105 pending questions. Three off-baseline pending-ledger records were not touched. |
| Backup and staged pack copy | [x] Pass | All 18 changed packs have pre-import backups; staged and active app pack SHA-256 hashes match. |
| Content build and check | [x] Pass | Node 22.23.1: content build and content check; 217 packs / 13,609 questions. |
| Full repository tests | [x] Pass | 142/142 passed. |
| TypeScript / ESLint / content check | [x] Pass | All passed. |
| SQLite integrity | [x] Pass | quick_check = ok; foreign_key_check returned zero issues. |
| Other institutions / runtime logic | [x] Unchanged | No JU/RU/DU pack or app-runtime logic changed; exam rules were not changed. |
| Physical-device update | [ ] Not run | No new APK was built or installed as part of this data import. |

## v0.1.4 Android first-launch seed fix — 2026-11-05

| Check | Result | Notes |
|---|---|---|
| Reproduce/report prior issue | [x] Owner-reported | v0.1.3 / code 4 stops at “Importing question library” on the owner's phone. The app displays the retry state; the user reports profile/bookmarks/practice history are preserved. |
| Root-cause source audit | [x] Concrete path defect found | SQLite exports a raw absolute directory path; Expo File requires a file URI. v0.1.3 constructed the sidecar File from the raw path. Runtime device logs are not available, so this is a source-confirmed defect matching the failure stage, not a claim that device execution was reproduced locally. |
| SQLite path ↔ file URI helper | [x] Automated pass | v0.1.4 explicitly converts absolute paths to file:///... for Expo File and back to absolute path for SQLite ATTACH; negative-input tests included. |
| Android resource-aware copy | [x] Source-level fix | Uses expo-file-system/legacy copyAsync, whose Android implementation handles raw resource names and file/content/asset URIs. |
| Error visibility | [x] Implemented | Retry screen shows up to 320 characters of the underlying startup error. |
| App/version | [x] Updated | v0.1.4 / Android versionCode 5; application ID unchanged. |
| Automated suite | [x] Pass | 139/139 tests passed. |
| TypeScript / ESLint | [x] Pass | pnpm typecheck and pnpm lint. |
| Catalogue/seed | [x] Pass | 217 packs / 13,609 questions, zero schema errors; seed integrity check passes. |
| Android prebuild/export | [x] Pass | Native asset prebuild and Android Metro export pass. These are not physical runtime tests. |
| EAS Expo Doctor | [!] 20/21 | One non-blocking check failed: five Expo SDK packages are one patch behind the expected versions. EAS continued through Gradle and produced the APK; package patch alignment is a maintenance follow-up. |
| Replacement EAS APK | [x] Built and verified | EAS build 040c75b2-0bbd-47b5-b859-cdb7f179f968 is FINISHED; APK https://expo.dev/artifacts/eas/ePmli5F3NH4vc9q1RupboKmJbt2FxkI8YdjbMW54-Jo.apk; size 117,408,124 bytes; app 0.1.4 / code 5. Full APK ZIP test passes for all 1,367 entries; APK SHA-256 recorded in release docs. Embedded seed SHA matches source; SQLite quick_check ok, FK violations 0, schema v5, 217 packs / 13,609 questions. |
| Owner physical-device verification | [x] Owner-confirmed pass | Owner installed and checked v0.1.4 on a physical phone and reports that everything works as expected. This is an owner-reported overall verification; individual timing/retention measurements are not separately recorded here. |

## Startup UI targeted implementation — 2026-11-11

| Check | Result | Notes |
|---|---|---|
| Startup UI policy (first-run / returning / failure) | [x] Automated pass | Three focused policy tests verify first-run visibility, returning gate release, failure/retry visibility and Home readiness requirements. |
| Home first-content readiness | [x] Source/typecheck/lint pass | Home signals readiness only from its data-backed or actionable error view after layout; its temporary initial LoadingView does not resolve the gate. |
| Full automated suite | [x] Pass | 142 passed, 0 failed. |
| TypeScript / full ESLint | [x] Pass | pnpm typecheck and pnpm lint. |
| Bundled SQLite seed | [x] Pass | pnpm content:check: 217 packs / 13,609 questions; seed 22.63 MiB and up to date. |
| Android JS export | [x] Pass | No-bytecode Metro export: 1,853 modules, 3.5 MB JS, 123 assets. This is not an APK/native-device test. |
| Physical Android startup visuals | [ ] Pending | Install a new release APK; check first-run, returning cold start, update sync, retry/error, Reduce Motion and square-flash transition on the same phone. |

## Human runtime issues — owner-reported follow-ups

The three startup UI observations now have targeted source fixes. Automated verification is complete; release-device visual verification remains open.

| Item | Priority | Observation / next step | Status |
|---|---|---|---|
| Full setup UI on returning cold launches | Medium / UX | Implemented: returning mode releases the setup gate directly and keeps the native splash over SQLite/content startup. First-run and fatal error/retry paths retain the branded setup screen. | Source/tests pass; verify on a release APK that returning startup never exposes a blank frame or full setup card. |
| Five stage checkmarks | Low / visual | Implemented: completed checkmarks use a short staggered native-driver opacity/scale transition; Reduced Motion remains immediate. Five real stage states/progress values are unchanged. | Source/tests pass; verify perceived sequencing and smoothness on the physical phone. |
| Loading UI → Home transition flash | Low / cosmetic | Implemented: first-run overlay dismissal and returning native-splash dismissal both wait for Home's initial data-backed/error view to lay out. This addresses the identified intermediate Home LoadingView path, but the exact square flash was not recorded/reproduced locally. | Handoff source/export pass; exact visual outcome pending release-build recording on the same phone. |
| Expo Doctor SDK patch alignment | Maintenance | EAS Expo Doctor reported 20/21 checks: five Expo SDK packages were one patch behind (expo, expo-asset, expo-constants, expo-router, expo-splash-screen). The v0.1.4 Gradle build and APK completed successfully despite this advisory. Align the five packages with the SDK-recommended patches in a separate dependency-maintenance pass and rerun pnpm doctor; no rebuild is requested by this note alone. | Open maintenance note; non-blocking |

## Historical v0.1.3 Android preview — built, then failed on owner's phone

| Check | Result | Notes |
|---|---|---|
| App/package version | [x] Updated | Brand config and package metadata are set to 0.1.3. |
| Android version code | [x] Updated | 4; prior v0.1.2 preview used code 3. Application ID remains com.admissionbd.app. |
| EAS account/project | [x] Confirmed | EAS CLI authenticated as sk_king13; linked EAS project ID unchanged. |
| Existing build history | [x] Checked | The previous correctness preview is v0.1.2 / code 3. Seed-based v0.1.3 / code 4 is now built. |
| Resolved Expo config | [x] Pass | Public Expo config resolves version 0.1.3, Android versionCode 4, package com.admissionbd.app, expected slug and EAS project ID. |
| EAS preview APK | [x] Built | `FINISHED`, build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd`; [EAS page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) · [APK](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk). APK-embedded seed was extracted and integrity-checked. |
| Physical Android verification | [ ] Pending | Owner installed/tested v0.1.3 and reported failure during question-library import. v0.1.4 replacement test is tracked in the current section above. |

## Profile, math and exam-rule correctness pass — 2026-11-05 (verification snapshot before seed-startup pass)

| Check | Result | Notes |
|---|---|---|
| Profile name persistence | [x] Automated pass | File-backed SQLite test closes/reopens the same database, runs returning-user startup twice, and checks display name, language, Flash preference and bookmarks. The save service reads its value back and fails on a blocked write. |
| Profile draft handling | [x] Implemented; [ ] device QA | Save on blur/submit and best-effort on screen leave; synchronous ref guard prevents concurrent duplicate saves. Student-facing profile no longer shows internal import batches. |
| Math/scientific display | [x] Automated pass | Parser tests cover powers/subscripts, ions, units, scientific notation, vectors, permutations/nuclides, Bangla mixed text, ambiguous patterns and speech labels. Raw pack strings are not rewritten. Android line-height, visual fidelity and TalkBack still need device review. |
| Partial-rule storage | [x] Automated pass | Schema migration v4 adds exam-rule component totals; v5 snapshots component totals into sessions. Import/re-import tests verify the `total_marks` field. |
| Missing scoring values | [x] Automated pass | Score and max score stay `null` unless correct, incorrect and unanswered values are all supplied. Unknown penalty/unanswered fields are not coerced to zero. |
| Exact-paper rule behavior | [x] Automated pass | Paper count/time are required for exact-paper official-format sessions; exact papers do not use generic 100/60. Explicit Custom Practice is bounded, visibly labelled and unscored. General no-paper practice retains 100/60. |
| Official rule sources | [x] Research recorded | 3 JU and 5 HSTU records receive only partial 2024–2025 facts; RU rules are documented but not attached to mismatching aggregate Lokkho data. See `docs/EXAM_RULE_RESEARCH.md`. |
| Question-quality audit | [x] Read-only scan | 217 packs / 13,609 questions; 148 findings overall, 137 at review or higher. Findings are candidate flags; no question or option was edited without its matching original source. See `docs/QUESTION_QUALITY_AUDIT.md`. |
| Full test suite | [x] Pass | `pnpm test`: 111 passed, 0 failed (Node 22.23.1). A final focused set of 60 tests plus 3 UI/localization tests also passed after the last integrity refinements. |
| TypeScript | [x] Pass | `pnpm typecheck` — Node 22.23.1, exit 0 after the final code refinements. |
| ESLint | [x] Pass | Full-project `pnpm lint` passed; after the final one-line setup UI change, `pnpm exec eslint app/exam/setup.tsx` also passed. |
| All bundled question-pack validation | [x] Pass | One-process pass over all 217 JSON files: 13,609 questions, 0 schema errors, 9,785 warnings, 0 invalid packs. |
| Question-quality audit | [x] Pass | `pnpm audit:questions`: 217 packs / 13,609 questions; 148 findings total, 137 at review or higher. All findings remain source-review candidates. |
| Diff whitespace check | [x] Pass | `git diff --check` — exit 0. |
| Expo Android export | [ ] Optional / pending | No APK build is claimed for this branch. Existing SDK/host Hermes limitation is documented in the release guide. |
| Physical Android UI and migration | [ ] Pending | Validate over an existing installation and fresh disposable DB: profile save/blur/leave/reopen, math line wrapping and speech output, partial notices, Custom Practice and all question navigation. |

## Seed-based startup and asset verification — 2026-11-05

| Check | Result | Notes |
|---|---|---|
| Full automated suite | [x] Pass | `pnpm test`: 137 passed, 0 failed (Node 22.23.1). Includes seed builder, logical corruption/repair, migration compatibility, lifecycle coordinator, user-data preservation and all previous application tests. |
| TypeScript | [x] Pass | `pnpm typecheck` — exit 0. |
| ESLint | [x] Pass | `pnpm lint` — exit 0 after removing the mutable state/ref bridge and closing over stable React setters in the single-flight coordinator. |
| Pack validation | [x] Pass | `pnpm packs:validate`: 217 JSON packs / 13,609 questions / 0 errors / 9,785 warnings. No-argument CLI mode was added; passing a filename still validates one pack. |
| Seed integrity | [x] Pass | `pnpm content:check`: SQLite quick_check, foreign keys, schema v5, seed metadata, all 217 ordered checkpoints, per-pack stored signatures/question counts, content table counts and empty user-owned tables. Seed = 22.63 MiB. |
| Seed builder tests | [x] Pass | `node --test scripts/tests/build-content.test.mjs`: deterministic manifest, ensure/no-op/rebuild, read-only stale check, logical corruption detection/repair, invalid/duplicate pack rejection. |
| Startup benchmark | [x] Pass | `pnpm bench:startup`: 1,419 ms full seed import / 2 ms returning sync on Node host; legacy extrapolation 8,066 ms from 25-pack sample. Not Android timings; see `docs/STARTUP_PERFORMANCE.md`. |
| Expo public config | [x] Pass | Resolved v0.1.3 / Android `versionCode 4` / package `com.admissionbd.app` / slug and EAS project ID match expected values. |
| Android Metro export | [x] Pass | `pnpm exec expo export --platform android --no-bytecode`: 3.5 MB JS bundle, 123 assets including hashed 24 MB `.db` asset. The export `metadata.json` names the asset extension `db`; direct SQLite validation confirms quick_check `ok`, 217 seed packs and 13,609 questions. |
| Android native prebuild asset | [x] Pass | The expo-asset config plugin registers `content_seed.db` at `android/app/src/main/assets/content_seed.db`; final APK/runtime loading is still pending. |
| EAS Expo Doctor | [!] 20/21 | Only the SDK package patch-version check fails: `expo`, `expo-asset`, `expo-constants`, `expo-router` and `expo-splash-screen` are one SDK patch behind the current Expo recommendation. EAS continues into prebuild/Gradle; keep this warning visible and align patches in a follow-up dependency maintenance pass. |
| EAS build from seed branch | [x] Built | `FINISHED`, build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd`, app v0.1.3 / versionCode 4; [EAS page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) · [APK](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk). Artifact seed extraction/integrity passes; runtime test remains pending. |
| APK-embedded seed integrity | [x] Pass | Extracted `assets/content_seed.db` from EAS APK: source SHA-256 matches, ZIP CRC passes, SQLite quick_check `ok`, foreign-key issues 0, schema v5, 217 packs / 13,609 questions. This does not exercise the runtime Asset/File copy. |
| Physical Android fresh/update/background/process-death checks | [ ] Pending | The connected Kali host has no `adb` binary/device in this session. Owner installed v0.1.3 over the previous app; it failed during first question-library import. Test replacement v0.1.4 as tracked in the current section above. |

# QA checklist

Historical v0.1.3 source snapshot: 137/137 tests passed and the APK-embedded seed passed extraction/integrity checks, but the owner later observed the first question-library import failure on-device. v0.1.4 corrected the seed sidecar path, its EAS APK and embedded seed were verified, and the owner has since confirmed physical-phone verification is successful. The two non-blocking follow-up notes are recorded in the Human runtime issues section above.

## Startup setup UI verification — 2026-11-01

| Check | Result | Notes |
|---|---|---|
| Startup sequence and failure/retry logic | [x] Pass | Pure `runStartup` tests cover fresh/returning databases, successful/partial/all-failed imports, retry behavior and existing profile/bookmark/content preservation. |
| Progress accuracy and monotonicity | [x] Pass | Stage boundaries are ordered; library progress is weighted by real question counts; the UI labels attempted packs as processed, including failures. |
| Setup screen localization | [x] Pass | Tests confirm each setup stage/detail/chrome key has non-empty Bangla and English translations with expected placeholders. |
| Setup appears before pack module evaluation | [x] Pass | A deferred-gate test proves `loadPacks()` is not invoked until the setup screen layout promise resolves. Root layout includes a splash/setup-gate fallback. |
| React/TypeScript code checks | [x] Pass | `pnpm typecheck` and `pnpm lint` pass after fixing the initial React Hooks refs/effect lint findings. |
| Full automated suite | [x] Pass | `pnpm test`: **76 passed, 0 failed**. |
| Android Metro export | [x] Pass | `pnpm exec expo export --platform android --no-bytecode`: 2,058 modules, 22 MB JS bundle, 122 assets. This is a bundle/export check, not an APK build or on-device check. |
| EAS internal Android APK | [x] Built | `FINISHED`, build `b4745dc4-0069-4a86-bb5b-234e5f377dfd`, version `0.1.1` / `versionCode 2`; [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) · [APK](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). |
| Physical Android fresh-install UI | [ ] Pending | Install the v0.1.1 APK; verify native splash → branded setup → Home, Bangla/English, actual progress, completion transition and airplane-mode behavior. |
| Existing-install update/data preservation | [ ] Pending | Install over the current app without clearing data; check that profile, bookmarks, exam attempts, Flash history and question content remain available. |
| Retry/error and small-screen/accessibility | [ ] Pending | Exercise retry where practical; inspect short-height screens, Reduce Motion, TalkBack labels/focus and touch controls. |

### Device test notes

- The historical GitHub `v0.1.0-preview.1` APK predates both JU/HSTU import updates and this setup UI. The EAS `v0.1.1` build `b4745dc4-0069-4a86-bb5b-234e5f377dfd` is finished and contains the current source; owner device installation/verification is pending.
- Installing over an existing app exercises the returning-install path and should retain its database. To test a true empty-database first install, use a disposable device/profile or deliberately clear/uninstall the app only after accepting that this deletes its local profile, bookmarks, sessions, attempts and history. Do not clear the user's primary installation casually.
- The setup interface is currently shown while the startup synchronization sequence runs, including on returning launches; existing content is not exposed in the background while a new bundle syncs. Background sync remains future work.

## Automated checks

| Check | Result | Notes |
|---|---|---|
| Dependencies installed / lockfile present | [x] Pass | Existing node_modules and pnpm-lock.yaml; Node and pnpm versions verified. |
| Expo config resolution | [x] Pass | pnpm exec expo config --type public exited successfully. |
| Automated tests | [x] Pass | Latest `pnpm test`: **76 passed, 0 failed** under Node 22.23.1. Includes all question-bank/import coverage plus startup progress, fresh/returning startup, failure/retry, data preservation, localization and setup-layout-before-bundle tests. The earlier 66-test run was the pre-setup baseline. |
| Real pack validation/index | [x] Pass | All **217** bundled JSON packs validate with **0 errors / 9,785 warnings**; generated index contains 13,609 questions. The 99 JU-U/HSTU-U packs account for **0 errors / 5,608 warnings** (5,563 unverified-key warnings and 45 repeated-option-text warnings); all source states were preserved. |
| Real pack import integration | [x] Pass | Existing DU, RU C, RU-V and verified JU/HSTU coverage remains. New JU-U/HSTU-U tests cover 99 packs / 5,773 questions, exact state preservation, globally unique references, 5,502 provisional candidates, all 217 packs imported in fresh SQLite with zero failures, and idempotent re-import. |
| TypeScript | [x] Pass | pnpm typecheck exited successfully. |
| ESLint | [x] Pass | pnpm lint exited successfully. |
| Expo Doctor | [x] Pass | pnpm doctor: **21/21 checks passed**. |
| Android JS bundle without bytecode | [x] Pass | Latest `pnpm exec expo export --platform android --no-bytecode` passed with **2,058 modules, a 22 MB JS bundle and 122 assets** after adding the startup setup UI. The export validates Metro bundling only; it is not an APK/AAB build. |
| Standard Android export with Hermes bytecode | [ ] Blocked on this host | pnpm export:android fails after Metro bundling because hermesc exits with SIGILL. This has not been shown to be an application-code error; a compatible build host/EAS check is still needed. |
| Installable Android preview APK | [x] Pass | EAS build `d5e516cd-eefe-44f4-866d-b440ef188da9`; published as [`BD.Admission.v0.1.0.apk`](https://github.com/itssourov13/bd-admission-app/releases/download/v0.1.0-preview.1/BD.Admission.v0.1.0.apk) under GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1). SHA-256: `da7f928827ae6945eddebedc817dabe2c9b0467240dc0d59ec4a0170d0a14f9d`. |
| Physical Android device smoke QA | [x] Owner-reported pass | The owner installed and checked the APK on a physical Android phone and reported normal operation. First load was about one minute; subsequent opens were about 2–3 seconds. Detailed individual checklist steps were not separately logged. |
| Production AAB / Google Play | [ ] Not run | A production AAB, Play Console listing and production rollout have not been completed. |

The no-bytecode export validates JavaScript bundling only. It does **not**, by itself, prove a native build or on-device behavior; the EAS APK and owner-reported phone verification are recorded separately above.

## JU + HSTU import verification — 2026-11-01

| Check | Result | Notes |
|---|---|---|
| Archive integrity and scope | [x] Pass | ZIP SHA-256 `cd3f0b449ae9cb18a254197dfe557198e2039ab74d4e0ff64e2abf69cd972f1b`; 60 JSON members, 57 target JU/HSTU packs, 3 GST packs excluded. |
| New pack schema validation | [x] Pass | 57/57 pass; 0 errors / 125 warnings. |
| Bundle index | [x] Pass | `pnpm packs:index` generated 118 pack imports. |
| Fresh SQLite import | [x] Pass | 118/118 packs, zero failures; 7,836 questions, 31,344 options, 118 batches, 118 papers, 59 rules, 168 sources, 7,836 appearances and 5 institutions. |
| JU/HSTU practice eligibility | [x] Pass | JU 1,393; HSTU 275; combined 1,668 verified single-choice questions. Answer-state totals are recorded in `docs/QUESTION_IMPORT_WORKFLOW.md`. |
| Re-import/idempotency | [x] Pass | All 57 new packs re-imported: 1,819 question rows and appearances skipped; database totals unchanged. |
| Exam patterns | [x] Intentionally unconfigured at initial import | At the 2026-11-01 import checkpoint all 57 rules were unconfigured. The 2026-11-05 source review later added partial facts to 3 JU and 5 HSTU 2024–2025 records. Five duplicate unconfigured HSTU aliases were removed during the 2026-11-16 consolidation; the current verified-source set has 52 logical rules (8 partial, 44 unconfigured). See docs/EXAM_RULE_RESEARCH.md. HSTU historical coverage remains partial. |


## JU-U + HSTU-U unverified candidate-bank verification — 2026-11-01

| Check | Result | Notes |
|---|---|---|
| Source archive and GST boundary | [x] Pass | ZIP SHA-256 `b1de68b088229d8bbeb8e216e7409f2e6de6f88bd14755e766d00a177a9392a8`; 102 JSON members: 84 JU + 15 HSTU imported, 3 GST_CLUSTER packs / 287 questions excluded. |
| Source-data preservation | [x] Pass | Exact round-trip comparison passed for 99/99 transformed pack files after reversing only institution/ID remaps; question text, options, keys, verification statuses, notes, hashes and provenance matched. |
| New pack validation | [x] Pass | 99/99 schema-valid, 0 errors / 5,608 warnings (5,563 unverified-key warnings, 45 repeated-option-text warnings). The provisional candidate filter excludes 42 one-key repeated-option records; 3 additional repeated-option warnings occur outside that single-choice candidate subset. |
| Bundle index | [x] Pass | `pnpm packs:index` regenerated `src/content/bundledPacks.ts` with 217 pack imports. |
| Fresh SQLite import | [x] Pass | 217/217 packs imported: 13,609 questions, 54,436 options, 217 batches, 217 papers, 158 rules (156 unconfigured), 273 sources, 13,609 appearances and 7 institutions. Answer states: 3,694 verified / 9,691 unverified / 224 unknown; content-unverified: 9,784. |
| Verified/candidate separation | [x] Pass | Verified JU remains 50 papers / 1,526 questions / 1,393 eligible; verified HSTU remains 7 / 293 / 275. JU-U remains 84 / 5,011 / 0 verified eligible / 4,780 provisional; HSTU-U remains 15 / 762 / 0 / 722. |
| Candidate practice boundary | [x] Pass | 5,502 source-key candidates are available only in the explicit provisional path; 42 repeated-option questions and 19 multiple-choice records are not included in provisional single-choice scoring. All 99 new rules remain `unconfigured`. |
| Duplicate/overlap handling | [x] Pass | 12 exact text+ordered-option overlaps and 95 same-stem/different-option overlaps were identified; no records were auto-merged. Reused/colliding source IDs were namespaced and all references updated. |
| Re-import/idempotency | [x] Pass | All 99 new packs re-import with question/appearance rows skipped and no row-count drift. The original verified JU/HSTU import test also passes against the current 217-pack dataset. |
| Android JavaScript bundle | [x] Pass | Expo Android no-bytecode export passed: 2,052 modules, 22 MB JS bundle and 122 assets. This is not an installable APK build. |
| Device verification | [ ] Pending | The published `v0.1.0-preview.1` APK predates both JU/HSTU imports. Build/install a new APK and perform owner device QA before treating these additions as device-verified. |

## Data integrity

These areas have automated coverage in the passing test suite:

- [x] Re-importing an identical pack is idempotent.
- [x] Invalid paper/option references and malformed verified-answer references are rejected by validation.
- [x] A failed/invalid import does not leave partial writes; mid-import errors roll back.
- [x] Multiple paper appearances are preserved, and similar wording is not used alone to merge questions.
- [x] Answer/scoring verification state is retained; questions without verified answer/content stay out of the verified pool. A separate provisional pool is labelled, source-key-based and structurally filtered rather than promoting answers to verified.
- [x] User answers, bookmarks and attempts survive content updates/re-imports.
- [x] Database migrations are idempotent and failure paths retain the prior version.
- [x] Validate and import the real DU, RU C, RU-V, JU and HSTU question packs through the SQLite importer; integration tests check institution/paper/question counts, source relationships, answer states, practice eligibility, catalogue queries and idempotent re-import.
- [x] RU-V source/question content was confirmed as verified by the user; that replacement task intentionally did not repeat a question-by-question fact check. JU/HSTU status was supplied through the Muse archive and likewise was not re-verified question-by-question. Per-question answer flags remain unchanged for both datasets. The RU-V automated structure checks require four non-empty options, a mapped explicit answer disposition, subject metadata, unique IDs, and source page/question provenance. Thirty RU-V source questions with repeated option text are separately listed for reference in `IDENTICAL_OPTION_TEXT_AUDIT.csv`; source text was not silently edited.

## Offline and persistence checks — detailed steps not individually recorded

The owner has reported a successful physical-device preview APK smoke test. The individual checks below are retained as a detailed QA record and are not marked complete because separate step-by-step results were not provided.

- [ ] Launch and navigate in airplane mode after database initialization.
- [ ] Browse locally imported institution, paper and question metadata.
- [ ] Confirm search/filter flows do not require network access.
- [ ] Confirm Flash and Standard sessions persist across force-close and relaunch.
- [ ] Background/resume does not reset deadline-based timers.
- [ ] Results, profile, preferences and bookmarks reload after app relaunch.
- [ ] Missing database and migration failure show a recoverable retry state.

## Exam and scoring behavior

These rules have passing automated service tests; device-level interaction is still unverified:

- [x] General Standard Exam requires 100 questions from the active pool; pool may be verified-only or, only when no verified pool exists, the explicitly warned provisional candidate pool. Selected-paper exams use configured paper count/duration where available.
- [x] Unit-test paper-specific question count, duration and four-of-six subject selection for a 60-question/45-minute DU pattern; confirm in tests that incomplete sections are refused and no partial exam session is created.
- [x] Official DU 2025–2026 pattern cross-checked: notice specifies 60 MCQ marks + 40 written marks, 45 minutes each; publisher MCQ-only pattern is intentionally retained as illustrative question-bank practice.
- [ ] Add and test further 80/100-question patterns when corresponding real paper packs with primary-source rules are added.
- [x] Default Flash timer and Standard Exam deadline logic are covered by focused tests.
- [x] Flash does not repeat questions before exhausting its eligible pool.
- [x] Timeout/answer races and exam finalization are guarded against duplicate recording/finalization.
- [x] Exam selections can be changed or cleared before submission; late selections are refused.
- [x] Configured negative marking, fractional scores, zero-answer accuracy, and ungraded-question behavior are tested.
- [x] Illustrative/unconfigured rules are not represented as verified official rules.
- [ ] Confirm the complete behavior on a real Android device with a real verified question pack and rule set.

## Detailed UI and device checklist — not individually recorded

The broad preview APK installation/smoke verification is owner-confirmed. The individual layout, touch-target and navigation checks below remain unmarked because their separate outcomes were not logged.

- [ ] Long Bangla question text, formulas and multi-line options fit without clipping.
- [ ] Small-screen options and controls have usable touch targets.
- [ ] Tab labels, icons, safe areas and system bars display correctly.
- [ ] Back button, exit confirmation, all-question SectionList scrolling, fixed Submit action and timeout navigation behave correctly.
- [ ] Flash timer refreshes correctly after the app returns from background.
- [ ] Exam timer, answer changes, auto-submit, result review and relaunch recovery work on device.
- [ ] Branding, launcher icon and splash are visually confirmed in a native build.
- [ ] Check accessibility labels and screen-reader focus for key controls.

## Google Play production release gate

The GitHub Android preview has been built, published and owner-verified on a physical device. Do not describe the app as a Google Play production release until a production AAB is built/inspected, the Play Console listing and required privacy/data-safety details are complete, and the account-specific testing/review requirements are satisfied. The source-bank caveats and illustrative exam-rule boundaries elsewhere in this checklist still apply.

## External RU Unit A staging validation — 2026-10-29

- [x] Located source pages and twelve session-specific third-party Google Drive PDF links for 2012-2013 through 2023-2024; all twelve direct download attempts returned permission HTML. Downloaded and visually reviewed the two 7-page 2025-2026 Group 1/2 scans; created a ledger for 2010-2011 through 2026-2027.
- [x] Prepared eight external A-only schema-v1 sample packs containing 21 questions; B/C samples were removed when scope narrowed to Unit A.
- [x] Validated the eight remaining packs with Node 22.23.1; no schema errors, with expected warnings for third-party answer keys explicitly left unverified.
- [x] Confirmed staging is outside `data/question-packs/`; no RU pack index was generated and no RU data was imported or bundled.
- [ ] Inspect 2010-2012 historical A1-A6 sources, obtain/page-audit accessible source papers and independently check answers before claiming year completeness.

## RU C Unit Science staging verification — 2026-10-29

| Check | Result | Notes |
|---|---|---|
| Lokkho source capture | [x] Pass | 44 source variants fully paginated; extracted record count matches source-reported count for 44/44. Total 4,185 source records. |
| External question-pack schema validation | [x] Pass | 44/44 curated schema-v1 pack files pass with zero schema errors. 4,009 core-subject records staged; 158 other-subject labels held for review; 18 records with no usable options excluded/logged. There are 4,023 validator warnings for unverified keys and 14 exact duplicate-option records. |
| Media assets and path references | [x] Packaged; visual QA pending | 45 local PNGs are included in the app asset map; all 46 references resolve. `QuestionCard` renders question-level figures; verify visual sizing/readability on Android. |
| Candidate answer/content review | [ ] Not verified | All 4,009 curated question texts and keys remain unverified; zero answer keys were independently checked against an official RU key. A provisional mode is available against third-party candidate keys, with an explicit warning; it is not verified/official scoring. The 158 held records need historical subject-scope review. |
| App automated tests | [x] Pass | `pnpm test`: 54 passed, 0 failed. |
| TypeScript | [x] Pass | `pnpm typecheck` exited successfully. |
| ESLint | [x] Pass | `pnpm lint` exited successfully. |
| Expo Doctor latest rerun | [ ] Environment/network blocked | The 2026-10-29 run reached Expo Doctor but failed when an Expo API fetch ended with `SocketError: other side closed` / “Could not fetch bundled native modules.” This is a network-dependent check failure, not evidence of an application-code defect. The prior 2026-10-28 21/21 check pass remains unchanged above. |
| App import or pack-index update | [x] Imported; provisional mode implemented | 44 RU C packs (4,009 questions) and 45 local PNGs are bundled. All candidate content/answers remain unverified; verified-eligible count is 0, a separate 3,991-item provisional pool is available, 18 items with duplicate normalized option text are withheld, and no RU exam rules were added. |

The 44 packs are **schema-imported, not content/key verified**. The provisional pool supports practice against third-party keys, but its feedback/results may be wrong and are not official or verified scores. Before promoting any candidate into the verified pool, reconcile each variant with its matching original paper, review duplicate-option cases, independently verify answer keys, and perform Android visual QA for the local images. See `docs/QUESTION_IMPORT_WORKFLOW.md` and external `research/IMPORT_READINESS.md`.


## Pre-import local verification — 2026-10-29

- [x] `pnpm test` — 54 passed, 0 failed.
- [x] `pnpm typecheck` — passed.
- [x] `pnpm lint` — passed.
- [x] `git diff --check` — passed.
- [x] `pnpm packs:validate data/question-packs/du-a-2024-2025.json` — PASS, 0 errors / 0 warnings.
- [x] `pnpm packs:validate data/question-packs/du-a-2025-2026.json` — PASS, 0 errors / 0 warnings.
- [x] At this pre-import checkpoint, `src/content/bundledPacks.ts` indexed only the two DU A packs. This was superseded by the later 46-pack C Unit browse/review import recorded below.
- [ ] Do not interpret these automated checks as device/release QA: physical Android behavior and a native release artifact remain unverified. RU C content/key validation remains outstanding despite schema validation passing.


## RU C Unit year-by-year audit-only pass — 2026-10-29

- [x] Audited metadata and triage signals for all 4,009 candidates across 44 packs and generated per-session coverage/evidence tables.
- [x] Compared same-year candidate text with partial third-party snapshots and available OCR; recorded potential matches and answer-text mismatches for manual follow-up.
- [x] Protected input integrity: 166/166 hashed existing candidate/source/asset/scan inputs remained unchanged.
- [ ] Original-paper question/options verification: still outstanding for all candidates.
- [ ] Independent answer-key verification: still outstanding for all 4,009 candidates.
- [ ] Review 14 exact duplicate-option cases, 35 third-party answer-text mismatch flags, and 26 repeated-stem overlap groups before any import approval.

Audit files are in `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/`. This audit did not edit or import any question data.


## Latest RU C Unit app import — 2026-10-29

- [x] Copied 44 candidate packs / 4,009 questions into app data; the generated bundle index now references 46 packs total including the existing DU packs.
- [x] Copied 45 normalized local PNG figure assets; all 46 asset references resolve.
- [x] Added QuestionCard figure rendering and a static Metro asset index; no runtime dependencies were added.
- [x] Verified every RU candidate remains answer/content `unverified`; no RU exam rules are imported; scored eligibility for these candidates is zero.
- [x] All 46 JSON packs validate with zero errors (4,023 expected warnings); `pnpm test` 55 passed/0 failed; typecheck and lint passed.
- [x] `pnpm exec expo export --platform android --no-bytecode` succeeded in the latest pass: Android JS bundle about 12 MB, 1,896 modules and 122 bundled assets including the 45 legacy RU figures.
- [x] 166/166 protected external source/candidate/asset/PDF files were byte-size and SHA-256 identical after import.
- [ ] Confirm question/option transcription and every candidate answer against matching original papers/answer keys; this import did not verify them.
- [ ] Exercise figures and long Bangla/formula layout on Android; create and test a native release build. No APK/AAB or physical-device result is claimed.

## RU C provisional Flash/Standard mode — 2026-10-29

- [x] Reproduced the issue: all RU C candidates were correctly absent from the verified-only pool, but both setup screens offered no alternative.
- [x] Added a separate provisional candidate pool. Only single-choice records with 2+ options, exactly one source key and no duplicate normalized option text are included. Counts confirmed against all bundled RU packs in an isolated SQLite import: 4,009 total, 3,991 provisional candidates, 18 withheld, 0 verified-eligible.
- [x] Flash test: starts from an unverified-only bank when enabled, displays/records source-key comparison, retains provisional session metadata and does not invent a score without an RU marking rule. Standard test: runs 100 candidate questions, grades the selected answer provisionally and retains unverified key status.
- [x] Latest suite: 57/57 tests passed; Node 22.23.1 `pnpm typecheck` and `pnpm lint` passed; `git diff --check` passed.
- [ ] Real Expo Go device testing of university navigation, both modes, question images, selection/timeout/results and Android offline behavior. The current Metro Android development bundle compiled successfully (HTTP 200, 2,042 modules); the no-bytecode export now passes with 1,896 modules; a native release build is still required on a compatible host.
- [ ] Source-paper transcription and all answer-key verification remain outstanding. No official RU scoring rule or final verified status is claimed; APK/AAB release remains outstanding.


## RU verified-source bank — final rebuild/replacement (2026-10-30; supersedes 2026-10-29 initial import)

- [x] Replaced the initial 15-pack / 1,815-question RU-V import with 15 rebuilt schema-v1 packs / **1,828 verified source records**, preserving source PDF hash, session/unit/set, PDF page and printed question number.
- [x] All 1,828 RU-V records have `contentVerificationStatus: verified` and `answerVerificationStatus: verified`; no RU-V question remains `unknown` or `unverified`. This follows the user's confirmation that source questions are verified; no second question-by-question fact-check was performed.
- [x] Answer markers are preserved by meaning: 1,800 single-choice questions are eligible for the current Flash/Standard pool, 22 `X` markers are represented as verified `no_correct_option`, and 6 multi-letter source keys are represented as verified `multiple_choice`.
- [x] Final index: 61 packs / **6,017 total questions** (180 DU + 4,009 separate RU C candidates + 1,828 RU-V). The older RU C candidate bank and both DU packs remain unchanged.
- [x] Exclusion manifest contains 154 written/incomplete extraction records; 30 source questions with identical option text are separately listed in the external warning audit. Page 137's false white-text-shadow banner was fixed and Q4's printed B marker restored.
- [x] Final automated verification at the 2026-10-30 import checkpoint: `pnpm test` 62/62, `pnpm typecheck`, `pnpm lint`, `git diff --check`, all 61 pack validators (0 schema errors), and Android `expo export --platform android --no-bytecode` (1,896 modules / 12 MB / 122 assets) passed.
- [x] Follow-up Android delivery: EAS preview APK built and published under GitHub pre-release `v0.1.0-preview.1`; the owner confirmed installation and successful physical-device smoke verification (see the release summary at the top of this file).
- [ ] Production AAB and Google Play submission remain outstanding.


## CI and native release pipeline setup — 2026-10-31

| Check | Result | Notes |
|---|---|---|
| GitHub Actions workflow file | [x] Merged and run | PR #2 merged; PR workflow [41109514896](https://github.com/itssourov13/bd-admission-app/actions/runs/41109514896) and `main` push workflow [41109555081](https://github.com/itssourov13/bd-admission-app/actions/runs/41109555081) both succeeded. |
| EAS project link | [x] Pass | Project @sk_king13/bd-admission-app, ID 16ba69b8-96d7-4856-a197-77acddebe1ec; EAS project metadata was checked during setup. |
| Resolved Expo config | [x] Pass | Public config resolves app owner, slug, Android package com.admissionbd.app, version 0.1.0 and EAS project ID. |
| EAS build profiles | [x] Configured | `preview` is internal APK; `production` is AAB with version auto-increment. |
| EAS preview APK build | [x] Completed and published | Build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`; APK is attached to GitHub pre-release `v0.1.0-preview.1`. |
| Android installation/device QA | [x] Owner-reported pass | APK installed and checked on a physical Android device; see owner-reported scope above. |
| Production AAB / Play Store | [ ] Not run | Production AAB, Play Console listing and rollout remain outstanding; see docs/ANDROID_RELEASE.md. |

## Phase 1 loading UI — owner verification (2026-11-13)

- [ ] Fresh install: splash → setup shows no colour jump or empty frame; progress completes; ≈0.5 s hold; fade to Home without a spinner.
- [ ] Returning launch: splash → Home directly; no setup card; no spinner flash.
- [ ] Returning launch after a content-bundle update: setup progress UI appears if sync exceeds ~1.5 s.
- [ ] Launch via a deep link to a non-Home route: splash/overlay is released within ~4 s.
- [ ] Reduce Motion on: immediate checkmarks, ≈0.15 s hold, no loops.
- [ ] Tab switches (Varsity/Medical/Profile): no spinner flash on warm DB.
- [ ] DB failure/retry UI still shows.

## Phase C — shared visual/math rendering (2026-11-17, Node 22.23.1)

| Check | Result | Notes |
|---|---|---|
| `pnpm test` | [x] Pass | 276/276 (267 baseline + 9 `math-layout` tests built from real pack strings). |
| `pnpm typecheck`, `pnpm lint` | [x] Pass | |
| `pnpm content:check`, `pnpm question-assets:check`, `pnpm packs:validate` | [x] Pass | 217 packs / 13,609 questions, 0 errors; 45 assets / 46 refs. |
| `git diff --check` | [x] Pass | |
| Android Metro export (`expo export --platform android --no-bytecode`) | [x] Pass | exported to ignored `.local/export-c`. |
| Parser run against all real packs | [x] Done | 11 stems + 20 options in non-RU packs resolve to matrices/determinants; 0 in RU-V. |
| Device/emulator visual QA, dark theme, narrow widths, TalkBack, restart/offline on device | [ ] NOT RUN | No device in this session. `MathBlock` is untested visually. |
| Question Browse / Flash / Exam / Custom / Result screens with matrices | [ ] NOT RUN | Same limitation; `QuestionCard` uses `MathText` for stem, options and explanation, so all paths share the renderer. |

