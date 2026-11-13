# Startup performance, seed database and lifecycle

Last updated: 2026-11-11. The v0.1.4 APK/seed verification remains the current release baseline. A targeted startup UI refinement reserves the branded setup UI for first-run/failure paths, keeps the native splash over returning startup until Home is ready, animates completed stage ticks with core Animated, and waits for Home readiness before first-run overlay dismissal. Automated checks pass; release-device visual QA is still pending.

## Why startup was redesigned

The earlier implementation generated 217 static/dynamic-imported JSON modules and loaded every pack at first launch. The previous Android export reported a 22 MB JavaScript bundle and 122 assets. The current verified export reports a 3.5 MB JavaScript bundle and 123 assets, including the 24 MB hashed `.db` asset. This is about an 84% reduction in JavaScript bundle size, but it does not mean the app's total packaged data or APK is 84% smaller: the 22.63 MiB question payload has moved out of JS modules into a standalone SQLite asset. The source JSON inputs total approximately 20.81 MiB. The new pipeline converts those packs at build time into a SQLite seed asset and a small committed TypeScript manifest:

- data/question-packs/*.json: source of truth for editable/importable question data.
- scripts/build-content.mjs: validates source packs and builds the manifest + SQLite seed.
- src/content/bundledManifest.ts: generated, committed compact ordered signatures/counts.
- assets/content/content_seed.db: generated, ignored binary asset (currently 22.63 MiB locally; never commit it).
- src/services/seedBuilder.ts: runs the real schema migrations and importer to construct the seed, so it mirrors the application data contract.
- src/content/seedFormat.ts: versioned manifest/seed contract and deterministic seed identifier.
- src/content/bundledSeed.ts: lazy Expo Asset materialization, explicit SQLite-path/file-URI conversion and resource-aware legacy copy to a disposable sidecar.
- src/services/seedSync.ts: set-based SQL copy from attached seed to the user's database.
- src/services/startup.ts and src/db/provider.tsx: startup sequence, progress, AppState integration, completion/warning state and recovery.
- src/services/perf.ts: privacy-safe monotonic marks, spans and counters.

The JSON packs remain canonical. The seed is a generated build artifact; do not edit its database rows or generated manifest by hand.

## Build and integrity contract

Run from the project root under Node 22.23.1:

~~~sh
pnpm packs:validate
pnpm content:build
pnpm content:check
~~~

content:build refuses invalid JSON/pack schemas and duplicate batch IDs. It builds a temporary database using the current migrations and real importer, verifies the computed seed ID, closes/compacts the database, and atomically replaces the ignored seed asset. content:ensure is used before local Expo start/export/native Android commands and by the EAS pre-install hook; it rebuilds only when the seed is absent, stale or invalid. CI runs both build and check, then verifies that the generated manifest has no uncommitted diff.

content:check is read-only. It verifies SQLite quick_check, foreign-key integrity, exact schema/seed-format versions, manifest metadata, every ordered pack checkpoint, each batch's stored signature and question count, expected counts for every content table, and empty user-owned tables. It reports stale/corrupt seed files without changing them. --ensure repairs missing, out-of-date or logically damaged seed assets.

The generated seed is intentionally excluded from Git. Every clean CI/EAS build has to regenerate it from the tracked JSON packs. The EAS eas-build-pre-install hook runs before dependency installation and Expo prebuild, so the native asset config plugin can see the generated file when native resources are prepared. The seed builder uses Node built-ins and repository-local modules only; it does not require installed packages. Node 22.23.1 is pinned in eas.json. Custom/non-EAS native build flows must run pnpm content:ensure before Expo prebuild/bundling.

## Runtime copy and user-data safety

1. Open the normal user database bd-admission.db, enable WAL, run versioned migrations, ensure the profile, close stale Flash sessions and finalize overdue exams.
2. Read every current batch ID/signature from the user's database in one query. Unchanged packs are counted and skipped. If no pack is pending, do not materialize/open the seed asset at all.
3. When updates are pending, resolve the Metro asset with Asset.fromModule(require("../../assets/content/content_seed.db")).downloadAsync(). expo-sqlite.defaultDatabaseDirectory is a raw absolute path, so convert the destination to a file:///... URI before passing it to expo-file-system/legacy copyAsync. Copy the local asset URI with expo-file-system/legacy copyAsync into the SQLite directory as the disposable sidecar bd-content_seed.db; the native Android copier can also resolve packaged raw-resource identifiers. Convert the destination URI back to an absolute filesystem path for SQLite ATTACH. Verify format, seed ID, ordered manifest entries, stored batch signatures and per-pack question counts before copying anything. Detach and delete the sidecar after sync.
4. Upsert shared institution/paper/rule rows, then copy content rows with set-based INSERT ... SELECT statements. Pending packs are grouped in bounded transactions of at most 1,500 questions. Batch signatures and their content rows commit atomically in the same transaction.
5. If a group fails, roll it back and retry each pack individually. A single invalid pack therefore does not block otherwise-valid neighbours. A failed pack keeps no committed signature and is retried later.
6. Restore connection settings, detach and delete the temporary seed sidecar.

The runtime copies content rows into the user's database; it never replaces or file-merges the user's main database with the seed. The runtime does not write to the sidecar. It does not issue writes to user_profile, bookmarks, practice_sessions, session_questions or session_answers. Existing user rows remain tied to stable question IDs and are preserved through content updates. Packs that opt into paper replacement carry a separate seed replacement list; only the matching active appearances are replaced inside the same database transaction. Question rows and history are not deleted.

A grouped transaction is the checkpoint boundary: if Android kills the process before commit, that group rolls back as a whole. Previously committed groups remain. On the next app start the missing batch signatures identify exactly which packs need copying again. This design intentionally prefers safe, idempotent restart over pretending that an interrupted JavaScript task kept running.

## Background and foreground behavior

This implementation is not a promise of uninterrupted background execution.

- The startup coordinator permits only one in-flight startup attempt and feeds it React Native AppState.
- If the current attempt fails while the app is backgrounded/inactive, the coordinator can make a bounded automatic retry after the app returns to active. It avoids creating concurrent database writers and does not auto-loop on an ordinary foreground failure; the UI keeps its explicit retry state.
- If Android suspends the JS runtime or kills the process, no JavaScript timer, Promise or React Native Animated callback can guarantee further progress. The next launch resumes from transactionally committed signatures.
- The startup screen still gates app routes until initialization/sync completes. Backgrounding does not expose partially initialized routes.

### Why there is no WorkManager or foreground service yet

Android WorkManager persists scheduled work across app restarts/reboots, but it is designed around work that may be deferred and requires a native worker capable of opening/updating the same SQLite database independently of the app's React Native JS runtime. It is not a switch that keeps a JS Promise alive. A foreground service is intended for an ongoing, user-noticeable operation; it requires an ongoing notification and is subject to Android version-specific launch, service-type and execution restrictions. The current operation is a local bundled SQLite copy, not a network upload/download or a long-running user-visible media/navigation task.

The design therefore uses bounded foreground database transactions, lifecycle-aware retry and restart recovery first. Do not add a KeepAwake workaround. Reconsider native WorkManager/foreground-service integration only if physical-device timing shows that the optimized import still exceeds acceptable startup time and product requirements explicitly demand progress while the app is backgrounded. Any such worker must use the same per-pack/group transaction semantics and be tested for concurrent access, process death, migrations, notification behavior and OEM power management. A WorkManager job can be deferred; an FGS has real user-visible/system-policy cost.

## First-run-only setup UI and returning-launch handoff

The full branded Bangla/English setup screen is now shown only when the local library is first-run or when startup has failed and the user needs a retry path. While first-run/returning mode is not yet known, the native splash remains visible; the app does not mount the full setup card during classification. Once progress.mode is returning, the root layout resolves the setup-screen readiness gate directly so content synchronization can proceed without mounting the branded screen. The native splash remains over that returning startup until the database is ready and Home reports that its initial query has settled and its data-backed or actionable error view has laid out.

For first-run, the existing branded screen still hides the native splash after its first layout and releases the existing setup gate. When startup completes, the overlay stays in place until Home's first data-backed/error view is ready, then uses the existing completion hold and fade. This avoids revealing Home's separate initial LoadingView underneath the setup transition. A fatal database/migration error still mounts the branded retry UI; tapping Retry latches that recovery UI across the next attempt. DB sync, seed checkpoints, AppState recovery and the route gate are unchanged.

The Home-ready signal is a one-shot promise owned by DbProvider; Home reports it only after its non-loading content/error view has laid out. The returning path therefore needs neither an extra loading library nor a delayed/synthetic progress timer.

## Progress animation and Reanimated decision

The branded setup UI uses React Native's core Animated API. The progress fill animates a translateX transform using useNativeDriver: true, instead of animating the layout width property with JS-driven frames. Halo, shimmer and opacity/entry/exit transitions also use supported native-driver transform/opacity values. Completed stage checkmarks now animate opacity and scale with a 65 ms per-stage stagger and a 180 ms duration, using the same native driver; Reduce Motion displays them immediately. Loops pause on background/inactive lifecycle changes and resynchronize when active. Accessibility progress semantics remain unchanged.

## Benchmark recorded on 2026-11-05

Command: pnpm bench:startup under Node 22.23.1 / pnpm 11.10.0. Dataset: 217 packs / 13,609 questions; raw JSON 20.81 MiB; generated seed 22.63 MiB. This is the latest measured run after the final implementation edits.

| Measurement | Result | Interpretation |
|---|---:|---|
| Parse all legacy JSON pack modules | 414 ms | Host-side Node parse estimate; not a phone measurement |
| Previous returning path, signatures only | 271 ms | JSON stringify + hash of all 217 packs |
| Previous first import, 25-pack sample / 1,249 questions | 740 ms | Measured sample |
| Previous first-import extrapolation to all content | 8,066 ms | Linear projection only; not measured full legacy import |
| New seed first import, all 217 packs | 1,419 ms | Actual complete copy in the Node SQLite benchmark |
| New returning startup content sync | 2 ms | No seed sidecar open/copy |
| New seed attach + shared rows + 10 grouped transactions | 1,419 ms | Includes 21 ms attach/verification, 4 ms shared rows and 1,387 ms grouped SQL work |

The host benchmark estimates roughly 5.7× lower first-import time versus the linear legacy extrapolation (8,066 / 1,419) and roughly 136× lower returning-sync work (271 / 2). These are Node/SQLite host ratios, not Android runtime guarantees. The legacy baseline is extrapolated from a 25-pack sample, and the seed benchmark does not include Expo's Android asset extraction/copy latency or phone flash-storage behavior. The same Android no-bytecode export changed from the previously recorded 22 MB JS bundle / 122 assets to 3.5 MB JS / 123 assets, with a separate 24 MB .db asset; this establishes reduced JS bundle size, not a smaller APK. Use startup logs and a real APK to establish real-device timings before making user-facing performance claims.

## Verification commands and release gate

~~~sh
source "$HOME/.nvm/nvm.sh" && nvm use 22.23.1
pnpm packs:validate
pnpm content:check
pnpm bench:startup
pnpm test
pnpm typecheck
pnpm lint
pnpm exec expo config --type public
pnpm exec expo export --platform android --no-bytecode
~~~

The benchmark is informational and should be repeated after material import changes. Android no-bytecode export verifies Metro bundling/asset registration only. The v0.1.3 APK payload was extracted, hash-matched, CRC-checked and opened successfully with SQLite, but the owner later reproduced a first question-library import failure on the phone. v0.1.4 corrected the seed sidecar URI/copy path; its EAS APK was verified and the owner has since confirmed successful physical-phone operation. The owner did not provide separate timings or a step-by-step runtime matrix, so those details are not inferred from the overall confirmation.

## Android v0.1.3 runtime failure and v0.1.4 correction — 2026-11-05

The owner tested v0.1.3 / Android versionCode 4 and reported that the setup UI stops at **Importing question library**. The APK-embedded database had passed SHA/CRC/SQLite checks, but this proved the packaged bytes only, not the runtime seed-copy path. The prior implementation constructed the sidecar destination from expo-sqlite.defaultDatabaseDirectory as though it were a URI; the Expo File constructor requires a file:/// URI, while expo-sqlite returns a raw absolute filesystem path. v0.1.4 makes that conversion explicit, converts the URI back for SQLite ATTACH, and uses expo-file-system/legacy copyAsync for Android raw-resource-aware copying. The retry screen now surfaces the native error detail.

Source verification passed (139 tests, TypeScript, ESLint, content/pack validation, prebuild and Metro export). The owner has now installed and verified v0.1.4 on a physical phone and reports that everything works as expected; the first-import issue is closed for this candidate. At this historical 2026-11-05 checkpoint, the brief loading-UI-to-Home square flash remained a cosmetic follow-up. A targeted Home-readiness handoff fix was subsequently implemented on 2026-11-11; release-device visual confirmation is pending. The Expo Doctor patch mismatch remains a separate maintenance note.


## v0.1.4 EAS build and packaged seed verification — 2026-11-05

Build 040c75b2-0bbd-47b5-b859-cdb7f179f968 (v0.1.4 / Android versionCode 5) finished on 2026-11-05 at 14:59:43 UTC / 20:59:43 Asia/Dhaka. EAS metrics: queue 23m07.529s, worker build 18m48.733s (Gradle 17m19.883s), end-to-end 42m00.902s. APK (https://expo.dev/artifacts/eas/ePmli5F3NH4vc9q1RupboKmJbt2FxkI8YdjbMW54-Jo.apk) is 117,408,124 bytes (~112 MiB); APK SHA-256 980cdfdd216ac588148b8d78a079df6660143a35f793d543b24fc25d8bfab670. Embedded assets/content_seed.db is 23,724,032 bytes and SHA-256 1f26f2eb1ad59b2d3dee7272908bc1e91476452dc1c1035dfb06a60785fbf32e, an exact match for source. ZIP entry CRC, SQLite quick_check, schema user_version 5 and foreign_key_check (0 violations) pass. Payload contains 217 packs, 13,609 questions and 54,436 options. Expo Doctor: 20/21 checks passed. The sole failed check was SDK patch alignment: expo ~57.0.32 (found 57.0.31), expo-asset ~57.0.21 (57.0.20), expo-constants ~57.0.23 (57.0.22), expo-router ~57.0.30 (57.0.29), expo-splash-screen ~57.0.11 (57.0.10). This advisory did not block prebuild, Gradle or APK upload; EAS finished successfully. Align these five package patches in a separate maintenance pass, not by discarding this APK. Physical-device runtime verification is still outstanding. Install v0.1.4 over v0.1.3 without uninstalling or clearing storage. Confirm the setup passes 'Importing question library' and profile, bookmarks and practice history remain intact; do not call the issue resolved before confirmation.


## Owner-observed transition note — 2026-11-05

During successful v0.1.4 physical-phone verification, the owner noticed a very brief, extremely subtle square-shaped flash as the loading/setup UI transitions to Home. It may be related to the immediate Home render or transition timing, but that cause is not confirmed. This is a cosmetic, non-blocking observation only. For a later grouped polish pass, inspect the loading-to-Home handoff and consider a slightly slower native-supported fade/transition; do not change code solely from this note. The separate Expo Doctor SDK patch-alignment advisory is tracked in docs/QA_CHECKLIST.md.

## Loading UI polish — 2026-11-13

UI-only changes; no startup coordination, DB or sync changes. Thresholds (`startupUiPolicy.ts`): escalate returning startup to the branded UI at 1500 ms, Home-ready fallback 4000 ms, first-run ready hold 520 ms (150 ms with Reduce Motion), spinner delay 150 ms. These are untuned heuristics; no device timings have been captured. Invariant: the native splash must always be hidden by SetupScreen's first layout, Home's first layout, or the Home-ready fallback.
