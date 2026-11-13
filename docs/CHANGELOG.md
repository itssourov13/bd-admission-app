## 2026-11-13 — Android preview candidate v0.1.5

- Set package/brand/app version to 0.1.5 and Android versionCode to 6.
- Preserved application ID, Expo slug, EAS project ID, Node build profile and EAS-managed signing setup.
- Full automated suite and CI-equivalent Android bundle gates passed immediately before the version bump; see docs/QA_CHECKLIST.md.
- Submitted EAS internal Android APK build 41bd1c7e-9376-41a7-abb0-860ab8031273; initial status IN_PROGRESS. See https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/41bd1c7e-9376-41a7-abb0-860ab8031273.

## 2026-11-13 — Full pre-build verification

- Full suite passed: 211/211; TypeScript, full lint, Expo public config and Android no-bytecode Metro export passed.
- Rebuilt the ignored local SQLite seed from the canonical question packs after detecting it was still schema v5; it now matches app schema v8. content:check, SQLite quick check and foreign-key check pass. No source question-pack JSON was modified.
- No app version, Android versionCode, runtime source or EAS build was changed/created.

# Changelog

## 2026-11-13 — Optional Phases 9–10 (partial / deferred)

- Phase 9: added local catalogue manifest validation, install planning, pack integrity verification and verified install/soft-remove/restore on top of the Phase 8 importer. No remote source exists.
- Phase 10: backend/CMS contract documented only.

## 2026-11-13 — Roadmap Phase 8: Publications & books library (implemented — pending owner verification)

- Library: Home entry, publisher list/detail with category sections, book details and chapter/unit practice reusing Flash/Exam/Browse; book/unit labels in history and results.
- Migration v8, versioned library-pack importer/validator (earlier session) retained.
- Shared SVG logo system (react-native-svg 15.15.4 + react-native-svg-transformer, BrandLogo); authentic DU/RU/JU SVG and HSTU PNG logos with recorded sources. Publisher logo slots reserved; none bundled.

## 2026-11-13 — Roadmap Phase 7: Home hero redesign (implemented — pending owner verification)

- New HomeHero: gradient card with admission motifs, offline-ready context line, primary Start CTA, secondary mock-exam link; resume mode replaces the separate resume card.

## 2026-11-13 — Roadmap Phase 6: Settings & dark mode (implemented — pending owner verification)

- Added light/dark/system theme with semantic CSS-variable tokens (src/settings), persistent preference, dark splash variant and themed status bar.
- Added Settings screen: theme, question text size, animations/Reduce Motion, haptics, language, default Flash timer, marking-rule defaults link, content info and version. Language/Flash controls moved from Profile to Settings.
- Added dependency expo-haptics; `src/theme.ts` no longer exports colours (use `useTheme()`).

## 2026-11-13 — Roadmap Phase 5: Standard Exam improvements (implemented — pending owner verification)

- Added question palette with direct navigation and persistent mark-for-review to the Standard Exam.
- Added time-left warnings and timer urgency levels, and a submit dialog with answered/unanswered/flagged counts.
- Result screen: per-subject breakdown, review filters and Practice missed questions; history rows show score and accuracy.
- Added DB migration v7 (session_answers.flagged).

## 2026-11-13 — Roadmap Phase 4: Configurable marking rules (implemented — pending owner verification)

- Added configurable marking profiles with per-value provenance (official / secondary / derived / illustrative / user) and built-in generic, RU, JU, HSTU (partial) and DU profiles.
- Added DB migration v6: practice_sessions.rule_profile_json, user_marking_profiles, marking_preferences.
- Added profile picker to Flash and Standard/Custom setup, a marking-profiles management screen (Profile tab), and profile/pass-mark information on the result screen.
- Automatic defaults no longer score Custom Practice or papers with only partial official rules.

## 2026-11-13 — Roadmap Phase 3: Shared subject selection (implemented — pending owner verification)

- Added a shared subject chooser (All / one / several) for Flash, Custom Practice and the generic Standard Exam.
- Route params now carry validated `subjects`; the single `subject` param is validated too.
- Subject counts come from one grouped query instead of one query per subject.
- Custom Practice question counts follow the selected pool; duration is suggested from the generic exam pace.
- History and result screens list the subjects a session covered. Added labels for General Knowledge, IQ, Mathematics, General Mathematics and Geology.
- No database, migration or dependency changes.

## 2026-11-13 — Roadmap Phase 2: University identity, logos, filters (implemented — pending owner verification)

- Varsity tab now lists parent universities with a filter chip bar; internal bank variants (RU-V, JU-U, HSTU-U) are grouped under their parent.
- Added `UniversityLogo` (monogram fallback; logo registry intentionally empty pending licensed assets), `PoolFilter.institutionIds`, and batched `listPapersByInstitutions`.
- No DB/migration/dependency change. Not device-tested.


## 2026-11-13 — Roadmap Phase 1: loading UI polish (implemented, pending owner verification)

- Slow returning launches (still syncing after 1.5 s, e.g. a content-update release) now escalate to the existing branded progress UI instead of a silent native splash.
- Added a 4 s fallback to the Home-ready gate so the splash/overlay cannot hang when Home is not the initial route or its query stalls.
- SetupScreen first frame now matches the native splash (flat body colour; gradient fades in; brand mark visible immediately). First-run completion hold reduced 700 → 520 ms; 150 ms under Reduce Motion.
- `LoadingView` shows its spinner only after 150 ms to remove spinner flashes on fast local loads.
- Policy constants/functions in `startupUiPolicy.ts` (+2 tests). No DB, dependency, config or version change. Not device-tested.


## 2026-11-12 — Import Claude-verified HSTU questions

- Imported the 664 HSTU question IDs in the accepted Claude verification ledger into the normal HSTU catalogue. Promoted 657 appearances from HSTU-U to 15 HSTU paper records and updated the 7 already attached to HSTU.
- Applied the accepted correct-option mappings and set both existing question status fields to verified. Preserved stable question IDs, stems, option text/order and source references.
- Left all 116 baseline pending questions unchanged; HSTU-U retains 105 pending questions. Three off-baseline pending-ledger records were also left untouched.
- Rebuilt the 217-pack / 13,609-question SQLite seed. Full tests passed 142/142; typecheck, lint, content check, SQLite quick check and foreign-key checks passed. No application logic, other universities or exam rules changed.

## 2026-11-11 — Refine first-run startup UI and Home handoff

- Restrict the full branded five-stage setup screen to first-run library setup and startup failure/retry. Returning cold launches resolve the setup-layout gate directly and keep the native splash visible through SQLite/content reconciliation.
- Add a one-shot Home-ready signal. Home resolves it only after its initial query settles and the data-backed or actionable error view has laid out; returning splash dismissal and first-run overlay fade now wait for that signal.
- Add a lightweight 65 ms stagger / 180 ms native-driver opacity-scale transition to completed stage checkmarks. Preserve the five actual progress states, Reduce Motion, existing progress fill, shimmer, logo and visual styling.
- Add focused policy tests and preserve retry behavior for database/migration errors. No data/schema, app identity/version, native config or dependency changes.
- Verification: 142/142 tests, TypeScript, full ESLint, pnpm content:check (217 packs / 13,609 questions) and Android no-bytecode Metro export (1,853 modules / 3.5 MB JS / 123 assets) passed. Physical release-device visual QA remains pending.

## 2026-11-05 — Fix Android v0.1.3 first-launch seed materialization

- Recorded the owner's physical-device failure in v0.1.3: setup reached **Importing question library** and then showed the retry state. The earlier v0.1.3 APK check established embedded DB payload integrity only; it did not establish that Expo File could materialize the sidecar on Android.
- Fixed the SQLite sidecar destination URI. expo-sqlite.defaultDatabaseDirectory is a raw absolute filesystem path, but Expo File requires a file:/// URI. The app now converts that path explicitly and converts the file URI back to an absolute SQLite path for ATTACH.
- Changed the asset-to-sidecar copy to expo-file-system/legacy copyAsync; its Android native implementation handles packaged raw-resource names as well as file/content/asset URIs.
- Added unit tests for absolute SQLite path ↔ Expo file URI conversion, including rejection of invalid inputs.
- Added the native error detail to the setup retry screen so a remaining release-only failure is visible instead of hidden behind a generic message.
- Bumped app/brand/package version to 0.1.4 and Android versionCode to 5; application ID, EAS project and signing identity remain unchanged.
- Verification: 139/139 tests, TypeScript, ESLint, content:check, 217-pack validation, resolved Expo config, Android prebuild and Metro export pass. Build 040c75b2-0bbd-47b5-b859-cdb7f179f968 (v0.1.4 / Android versionCode 5) finished on 2026-11-05 at 14:59:43 UTC / 20:59:43 Asia/Dhaka. EAS metrics: queue 23m07.529s, worker build 18m48.733s (Gradle 17m19.883s), end-to-end 42m00.902s. APK (https://expo.dev/artifacts/eas/ePmli5F3NH4vc9q1RupboKmJbt2FxkI8YdjbMW54-Jo.apk) is 117,408,124 bytes (~112 MiB); APK SHA-256 980cdfdd216ac588148b8d78a079df6660143a35f793d543b24fc25d8bfab670. Embedded assets/content_seed.db is 23,724,032 bytes and SHA-256 1f26f2eb1ad59b2d3dee7272908bc1e91476452dc1c1035dfb06a60785fbf32e, an exact match for source. ZIP entry CRC, SQLite quick_check, schema user_version 5 and foreign_key_check (0 violations) pass. Payload contains 217 packs, 13,609 questions and 54,436 options. Expo Doctor: 20/21 checks passed. The sole failed check was SDK patch alignment: expo ~57.0.32 (found 57.0.31), expo-asset ~57.0.21 (57.0.20), expo-constants ~57.0.23 (57.0.22), expo-router ~57.0.30 (57.0.29), expo-splash-screen ~57.0.11 (57.0.10). This advisory did not block prebuild, Gradle or APK upload; EAS finished successfully. Align these five package patches in a separate maintenance pass, not by discarding this APK. The owner subsequently installed and verified v0.1.4 on a physical phone and reports that everything works as expected; the v0.1.3 first-import failure is closed for this candidate. Two non-blocking notes are retained for a later grouped pass: a subtle square flash during loading-UI-to-Home transition (possible immediate-render timing; consider a slightly slower fade), and Expo Doctor's 20/21 SDK patch-alignment advisory. See docs/QA_CHECKLIST.md.

## 2026-11-05 — Build v0.1.3 seed-based Android preview

- Bumped app/brand/package version to `0.1.3` and Android `versionCode` to `4` so the seed-based preview can update v0.1.2.
- Renamed the generated seed to `content_seed.db` because Expo Android resource names do not allow hyphens. The `expo-asset` config plugin registers it in native app assets during prebuild.
- Replaced the hidden/testing-oriented SQLite asset-import helper with public Expo Asset + File APIs: download the bundled asset, copy it into a disposable SQLite sidecar, attach for set-based content sync, then detach/delete it.
- Moved seed regeneration to the EAS `eas-build-pre-install` hook. The exact hook was executed locally with Node 22.23.1 before dependency installation and confirmed the 217-pack / 13,609-question seed is current.
- Re-ran frozen install, full test suite (**137/137**), TypeScript, ESLint, whole-catalog validation (217 packs / 13,609 questions / 0 errors), SQLite integrity, host benchmark, resolved Expo config, native prebuild asset-copy check and Android Metro export. The native/exported DB passes SQLite integrity and row-count checks.
- Latest Node host benchmark: **1,419 ms** first seed import / **2 ms** returning sync. These are not Android-device timings.
- EAS internal Android APK build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd` completed successfully (`FINISHED`) at 2026-11-05 13:32:51 UTC. [Build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) · [APK download](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk) (~112 MiB). The APK-embedded seed was extracted and validated against source SHA-256, SQLite quick_check, foreign keys, schema v5 and 217/13,609 row counts. The owner subsequently installed v0.1.3 on the phone and reported failure at question-library import; v0.1.4 follow-up is recorded above.

## 2026-11-05 — Prepare v0.1.2 correctness preview release

- Incremented the app/brand/package version from `0.1.1` to `0.1.2` and Android `versionCode` from `2` to `3`; retained the application ID, Expo slug, EAS project ID and signing identity.
- Prepared the EAS `preview` profile for an installable internal Android APK containing the 2026-11-05 correctness branch: profile persistence, math rendering/accessibility, exact-paper rules/scoring safeguards and question-quality audit.
- Updated README, current state, task state, handoff, QA checklist and Android release documentation to identify v0.1.1 as historical and v0.1.2 as the current source candidate.
- Resolved Expo config verification passed for version 0.1.2 / versionCode 3. Release-preparation commit: c93c7f3. The v0.1.2 preview was later built successfully as EAS build `af78b85f-7a2b-4fba-b693-532c7d218f8b`; its APK predates the SQLite seed work and is retained as a historical artifact.

## 2026-11-05 — Persist profile data, format math and enforce paper-specific exam rules

- Added read-back verification for profile display-name saves, blur/submit handling and a screen-leave draft fallback; removed internal pack-import logs from the student profile.
- Added a pure math/scientific-notation formatter and accessible rendering in question/option UI. Formatting is display-only; unsupported/ambiguous source text is unchanged.
- Added `totalMarks` to the question-pack/database/session rule model and schema migrations 4/5. Partial verified facts are not treated as complete scoring rules; missing scoring values are never silently zeroed.
- Exact paper practice now requires its own question count and duration. The generic 100-question/60-minute rule is limited to global practice. Unconfigured exact papers offer explicit unscored Custom Practice.
- Researched official 2024–2025 JU/RU/HSTU exam rules. Added partial, source-backed facts only to the 3 matching JU and 5 HSTU packs; kept RU unconfigured because current third-party aggregate captures do not match a complete official 80-question paper.
- Added a read-only quality audit across 217 packs / 13,609 questions. Findings are review candidates, not automatic corrections.
- Added focused tests for profile persistence across a database close/reopen, notation parsing, custom/exact exam plans, partial scoring and audit output. Device verification and new APK build remain pending.

## 2026-11-05 — Replace JSON startup import with a generated SQLite seed (working branch; APK not yet rebuilt)

- Replaced the 217-pack runtime JSON module loading path with a compact generated manifest and a SQLite seed asset built from the canonical JSON packs through the real migrations/importer. The generated database is ignored by Git and regenerated in CI/EAS.
- Added integrity verification for the seed file, schema, foreign keys, pack checkpoints, table counts and empty user-owned tables. The runtime validates seed pack metadata before copying, copies content using set-based SQL, and commits bounded groups atomically with their signatures.
- Added single-flight AppState-aware startup recovery, truthful library-completion state and per-attempt startup metrics. Interruption recovery resumes uncommitted groups on the next launch; continuous Android background execution is not claimed.
- Changed the progress fill from JS-driven layout width to a native-driver translateX transform; retained accessibility and Reduce Motion behavior. Reanimated is not used for this implementation.
- Latest Node 22.23.1 host benchmark: legacy sampled first import 713 ms / projected 7,767 ms; seed full import 1,547 ms; seed returning sync 2 ms. These are host measurements, not Android device timings.
- Verified Expo no-bytecode export: 3.5 MB JS bundle plus a 24 MB hashed SQLite seed asset. The exported asset passes SQLite quick_check, foreign-key check, schema v5, 217-pack and 13,609-question checks. A new EAS APK and physical-device startup tests remain required before release.

## 2026-11-01 — Prepare v0.1.1 internal Android preview

- Bumped the app/brand/package version to `0.1.1` and Android `versionCode` from `1` to `2`; retained application ID `com.admissionbd.app`, EAS project and existing EAS-managed signing credentials.
- Completed an internal-distribution Android APK build from the active JU/HSTU + startup UI branch: EAS build `b4745dc4-0069-4a86-bb5b-234e5f377dfd`, profile `preview`, app version `0.1.1` / Android build version `2`. [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) · [APK artifact](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). EAS status `FINISHED` at 2026-11-01 12:19:53 +06:00.
- Checks before build: frozen install; 76/76 tests; TypeScript; ESLint; Expo public config (name, package, version, versionCode and EAS project ID); `git diff --check`.
- The generated APK includes the branded startup screen and the current 217-pack / 13,609-question catalogue. No GitHub release was created. Owner installation and physical-device update/fresh-install QA remain pending.

## 2026-11-01 — Add branded startup setup experience

- Added a responsive, branded Bangla/English startup screen with staged status, question-pack processing progress, a completion transition, accessible progress semantics, reduced-motion support and retry UI.
- Added testable startup orchestration and progress helpers; the generated pack bundle is dynamically loaded only after the setup screen's first layout.
- Preserved the existing SQLite schema, transactional importer, pack data and user-owned local records. This remains a startup gate, not background sync or a claim that Android's single JS bundle is smaller.
- Audit follow-up fixed React Hooks lint violations, added a test for the UI-before-bundle gate, and clarified that progress counts processed attempts rather than successful imports.
- Verification: 76/76 tests, TypeScript, ESLint and Android no-bytecode Expo export passed. Physical-device fresh-install/returning-install verification and a new APK build remain pending.

## 2026-11-01 — Add separate JU/HSTU unverified candidate banks

- Imported 84 JU-U packs / 5,011 questions and 15 HSTU-U packs / 762 questions from the unverified archive; all 5,773 content statuses and 5,563 unverified / 210 unknown answer states remain as supplied.
- Kept candidate banks separate from the existing verified JU/HSTU institutions, using dedicated institution, batch, paper, rule and question IDs. All 99 paper rules remain unconfigured.
- Added 5,502 safe provisional candidates (JU-U 4,780; HSTU-U 722); held 42 repeated-option records and 19 multiple-choice questions out of provisional single-choice scoring.
- Namespaced reused/colliding source IDs and updated all references. Round-trip comparison passed for all 99 packs; 12 exact and 95 same-stem/different-option overlaps were retained without auto-merging.
- Excluded the separate GST_CLUSTER set entirely (3 packs / 287 questions) for a dedicated future import. Bundle now has 217 packs / 13,609 questions; added full SQLite/idempotency coverage and updated project documentation.


## 2026-11-01 — Import Jahangirnagar University and HSTU question banks

- Added 57 Muse AI schema-v1 packs: 50 JU / 1,526 questions and 7 HSTU / 293 questions. The 3 unrelated GST packs in the archive were excluded.
- Preserved question/option/answer content and individual verification states; question-by-question factual verification was not repeated. The addition supplies 1,668 verified single-choice practice-eligible questions.
- Namespaced the shared JU source-document ID for its 24 batch occurrences and updated all linked references; no question or answer data was changed.
- Regenerated the bundle to 118 packs / 7,836 questions and added integration tests for fresh-SQLite import, status preservation, ID integrity and idempotent re-import.
- Validation: all 57 new packs valid with 0 errors / 125 warnings; all 118 packs imported in a fresh database with zero failures. At this initial import checkpoint all JU/HSTU exam rules were unconfigured; the 2026-11-05 research follow-up later added partial verified facts to 3 JU and 5 HSTU records. HSTU historical coverage remains partial.

## 2026-10-31 — Publish Android preview and reconcile release documentation

- Merged PR #2 (`3aa125d4e12cdca1702f976f20c1f60a765923d1`) to `main`; both the PR CI run and merge push CI run completed successfully.
- Published GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1) with `BD.Admission.v0.1.0.apk` (112,443,213 bytes; SHA-256 `da7f928827ae6945eddebedc817dabe2c9b0467240dc0d59ec4a0170d0a14f9d`). EAS preview build ID: `d5e516cd-eefe-44f4-866d-b440ef188da9`.
- Recorded owner-confirmed physical Android installation/verification and observed startup timing. Corrected release status in README, CURRENT_STATE, TASK_STATE, HANDOFF, ANDROID_RELEASE, QA_CHECKLIST and BRANDING.
- The GitHub pre-release is not a Google Play production release. Production AAB, listing/assets, privacy declarations and production rollout remain open.

## 2026-10-31 — Add Play Store-inspired README preview showcase

- Added three branded 1080×1920 (9:16) JPEG graphics for the Home, Varsity catalogue and Profile runtime screens under `docs/assets/showcase/`. Generated abstract artwork is used only as the background; the captured app UI remains authentic.
- Replaced the personal profile display name with `Learner`, and added accessible alt text plus README showcase placement. The visible profile counters are sample local profile state, not product-wide usage metrics.
- Documented that these are README presentation assets, not final Play Console listing assets. Google Play highly recommends four high-resolution screenshots for app recommendation surfaces; capture another genuine screen before final store preparation.
- Verification: 62/62 tests passed, TypeScript typecheck and Expo lint passed, all README asset references resolve, all images are 1080×1920 RGB JPEGs, and `git diff --check` is clean.

## 2026-10-31 — Configure GitHub CI and EAS Android release pipeline

- Added `.github/workflows/ci.yml` for main pushes, pull requests and manual CI runs. It installs the frozen pnpm lockfile, runs tests/typecheck/lint, validates Expo config and exports the Android JS bundle without Hermes bytecode. Follow-up hardening installs pnpm before enabling setup-node's pnpm store cache.
- Initialized and linked EAS project `@sk_king13/bd-admission-app` (`16ba69b8-96d7-4856-a197-77acddebe1ec`) in `app.config.js`; verified the resolved Expo config and `eas project:info`.
- Added `eas.json` preview APK and production AAB profiles and documented cloud build, signing, device QA, Google Play and GitHub Releases in `docs/ANDROID_RELEASE.md`.
- At this initial local-setup checkpoint (before PR #2 was merged), no GitHub workflow run, native APK or physical-device test had yet been completed; the later same-day release entry above records the merged PR, successful CI runs and published preview APK.

## 2026-10-30 — Corrected RU verified-source pack structure and answer dispositions

- Completed the 156-page OCR and rebuilt the 15 RU-V packs from the user-confirmed source. The source was not re-verified question-by-question; all imported source question content and explicit answer states are marked verified as instructed.
- Increased the RU-V import from the intermediate 1,799 single-choice-only build to **1,828 verified source records** by preserving 22 explicit `X` markers as `answerDisposition: no_correct_option` and 6 complete multi-letter keys as `multiple_choice`. These are not coerced into the single-choice practice engine. The engine's RU-V single-choice eligible pool remains **1,800**.
- Final RU-V subject distribution: Physics 383, Higher Mathematics 512, Chemistry 365, Biology 502, ICT 54 and English 12. Existing source paper/set IDs and provenance remain. Old question IDs are reused only when source locators are unique.
- Final exclusion ledger: **154** records (36 written-part, 90 incomplete option sets, 26 missing extracted option text and 2 missing answer markers). Thirty included records with repeated extracted option text are in the separate warning audit; no source text or answer was silently rewritten.
- Final bundle: **61 packs / 6,017 questions** (180 DU + 4,009 separate RU C candidates + 1,828 RU-V verified-source questions). The older RU C candidate bank and both DU packs remain unchanged.
- Verified `replaceExistingPaperContent` semantics and active-catalogue filtering: replacement only removes appearances for the 15 target RU-V paper IDs; question rows and FK-backed bookmarks/session history remain. Historical orphan rows no longer leak into active catalogue/practice queries.
- Latest automated tests: **62/62 pass** under Node 22.23.1. The full final verification record is in `docs/QA_CHECKLIST.md`. Physical Android QA and native APK/AAB build remain release gates. No push performed.

## 2026-10-29 — Import separate RU verified-source bank
- Added 15 schema-v1 packs (1,815 MCQs) from the user-supplied 156-page `RU Question Bank.pdf`, preserving source PDF SHA-256, session/unit/set, PDF page and printed question number. The pack source and extraction report remain external to the mobile bundle.
- Per instruction, imported question content as verified without a separate question fact-check. 1,720 question keys were mapped from explicit answer markers; 95 keys remain `unknown` where markers were absent or unreliable. No key or official RU scoring rule was invented. Another 118 incomplete/non-choice blocks are logged externally instead of being forced into the MCQ schema.
- Created a distinct `RU-V — Rajshahi University — Verified Question Bank` institution (`ru-verified-bank`). Prefixed the old RU institution display name with `UNVERIFIED —` while preserving all 4,009 existing questions and their statuses/content.
- Regenerated the bundle index: 61 packs / 6,004 total questions (180 DU, 4,009 legacy RU, 1,815 new RU-V). Added integration coverage for provenance, source statuses, distinct IDs, idempotent import and a 100-question Standard Exam.
- Original question/key review was intentionally not repeated in this task. Android device QA and native release build remain pending; no push was performed.


## 2026-10-29 — Make RU C candidates usable with provisional practice
- Fixed the gap where all unverified RU candidates were imported but could not start Flash or Standard Exam because both modes only queried the verified pool. Verified-only eligibility remains strict; setup selects a distinct provisional pool when the scope has no verified-eligible questions and displays a warning.
- Added structural candidate filter (single choice, 2+ options, exactly one source-key option, no duplicate normalized option text): 3,991 of the 4,009 RU candidates available provisionally; 18 records with duplicate normalized option text withheld from provisional scoring. All statuses stay `unverified`; no RU marking rules were invented.
- Added provisional warnings in BN/EN, source-key feedback and review rendering, catalogue counts, and result banners; added tests for Flash/Standard provisional sessions and status preservation.
- Verification under Node 22.23.1: 57 tests passed; typecheck, lint and diff-check passed. Native device QA, current-code export, original-paper/answer-key verification, and APK/AAB build remain pending. No push performed.


## 2026-10-29 — RU C Unit Science source collection checkpoint
- Added a dedicated external research workspace for RU C Unit Science Group, including a SHA-256-tracked 265-page third-party scan and page ranges for 14 distinct paper/set variants (2017-2018 through 2024-2025).
- Collected 20 partial public-page snapshots (300 questions) and validated their JSON structure; none is a complete paper and no answer key was independently verified.
- Completed full-page machine OCR over 84 indexed question/key pages and added source/coverage manifests, answer audit trackers, restricted-download leads, and an explicit import readiness report. OCR remains unverified and is not bundled.
- Documented the initial scan/source-discovery checkpoint, missing/restricted years, optional Biology/Mathematics paths and the no-app-import gate. The separate scanned-PDF OCR and partial SattAcademy samples remain review-only; later in this changelog, the external `import-ready/lokkho/` folder is populated with the full paginated third-party source capture. No RU C Unit Science content was copied into the app packs or bundled.


## 2026-10-29 — RU Unit A source census and review samples
- Narrowed RU research scope to Unit A only and removed B/C sample packs from external staging.
- Created a year-by-year ledger for 2010-2011 through 2026-2027 and located twelve third-party session-specific PDF links for 2012-2013 through 2023-2024 plus recent group/shift sources.
- Expanded A-only external staging to eight sample packs with 21 questions and a per-question answer audit; kept unverified/unknown states explicit and did not claim a complete transcription.
- Downloaded and visually reviewed both 7-page 2025-2026 Group 1/2 image-only scans, and validated external sample packs; none was copied into app `data/question-packs/`, no index was regenerated and no RU data was imported or bundled.
- Recorded old 2010-2012 A1-A6 mapping and page-level source review as remaining work.

## 2026-10-28 — Science-first subject filters and scrollable Standard Exam
- Added the shared canonical subject order (Physics, Chemistry, Biology, Higher Mathematics, Bangla, English, ICT), bilingual subject labels, accurate per-subject counts and explicit unavailable/empty states.
- Question Browser now filters by subject while preserving bookmarks, sources, pagination and canonical subject/printed-question ordering. Flash setup supports subject-specific eligible-question pools without inventing content.
- Replaced one-question-at-a-time Standard Exam navigation and numbered question grid with one virtualized, continuously scrollable question list grouped by subject and source order. Options are selectable in place; timer and answer progress remain visible, and Submit is kept at the bottom.
- Added a serialized answer-write queue for rapid select/change/clear actions. Submission drains queued saves before finalization; timeout still finalizes using answers actually persisted by the deadline. Existing SQLite scoring, exactly-once finalization, session deadline and resume behavior are retained.
- Added focused tests for canonical ordering, zero-count subject options, repository question ordering/counts and answer queue ordering/failure recovery.
- Automated verification: 54 tests pass; typecheck and lint pass under Node 22.23.1. Physical Android/device QA remains outstanding.

## 2026-10-28 — Institution-specific exam-pattern requirement
- Documented that question count, duration, section constraints and marking rules vary by institution and paper/session.
- Clarified that the current fixed 100-question/60-minute Standard Exam is an MVP limitation, not a universal rule.
- Added the required pre-release task to wire source-verified paper-specific configuration through the whole exam flow.

## 2026-10-28 — Initial workspace foundation
- Created the independent BD Admission workspace and Git repository.
- Reused/adapted selected UI primitives, theme tokens and mobile configuration from ScholarHub.
- Included the source SDK's Expo Router runtime companion packages and language-aware tab label font selection.
- Created an Admission-specific logo, Bangla/English translation foundation and tab shell.
- Added the versioned question-pack contract, first-pass validator and validator tests.
- Added the project architecture, reuse inventory, data schema, import workflow and QA guidance.
- Replaced the inherited visual direction with navy, emerald and gold; added a custom book/progress mark, launcher icon, adaptive foreground, splash image and editable SVG.
- Centralized brand name, app identifiers, taglines and palette in brand.config.json; app.config.js reads that single source.
- Removed unrelated Clerk configuration from the standalone pnpm setup.
- No real historical question data was imported; no dependency install or Expo build is claimed.

## 2026-10-28 — Domain, database and import checkpoint
- Installed dependencies under Node 22.23.1 (pnpm 11.10.0); pnpm-lock.yaml generated.
- Added versioned SQLite schema (migration 1) in src/db/schema.ts and a SqlDb contract in src/db/types.ts.
- Added pure services: scoring, deadline timer, Flash engine, Standard Exam state, deterministic advice.
- Moved the validator to src/services/questionPackValidator.mjs (CLI wrapper kept at scripts/validate-question-pack.mjs).
- Added transactional, idempotent importer src/services/importer.ts.
- Added node:test suites in tests/ run against a real SQLite engine (node:sqlite).
- Fixed three type errors in the starter screens.

## 2026-10-28 — Application pass (resumed session)
- Committed the previous session's uncommitted catalogue/i18n/pack-index work.
- Added useNow (wall-clock ticker that refreshes on foreground), TextField, Stat.
- Added routes: Institution, Paper, Browse, Flash setup/play, Exam setup/play, Result, History, Bookmarks, Engineering; rebuilt Profile with persisted preferences and real progress.
- Fixed React-compiler lint violations (setState in effects, refs during render) in hooks and screens.
- Added tests/ui-logic.test.ts (translation parity, navigation param handling).
- Recorded verification results in docs/QA_CHECKLIST.md.

## 2026-10-28 — Documentation and verification alignment
- Rewrote README status/setup/verification guidance to reflect the implemented app and its actual release limitations.
- Updated QA checklist with the 46 passing automated tests, typecheck, lint, Expo config, Expo Doctor and no-bytecode Android bundle result; kept device/release checks explicitly outstanding.
- Updated branding, question-pack schema and source-reuse inventory to match the current implementation and independence boundary.
- Corrected architecture state wording and normalized trailing whitespace in DECISIONS.md.

## 2026-10-28 — Initial DU A Unit question import
- Added the 2024–2025 and 2025–2026 scanned-source packs (90 questions each, six 15-question subject sections).
- Preserved source filenames and SHA-256 hashes, paper/session/page/question provenance, and the answer-key state. Three items without a printed answer remain unknown.
- Recorded the printed 60-question/45-minute/+1/−0.25/four-of-six-subject pattern; end-to-end runtime enforcement remains pending.
- Added an integration test for record counts, eligibility, shared institution upsert behavior and idempotent re-import.

## 2026-10-28 — Paper-specific exam pattern support
- Added an optional section-selection configuration to the pack and SQLite rule schema with a versioned migration.
- Standard Exam now uses selected-paper question counts/durations and can require a chosen set of complete subject sections; general scopes retain the 100-question/60-minute fallback.
- DU A Unit now supports selecting four of six 15-question subject sections for a 60-question/45-minute source-pattern practice attempt. Sections missing a verified answer are not selectable.
- Updated setup UI/translation copy to show dynamic count/time and label the publisher-scan pattern as illustrative because it differs from the official DU 2025–2026 notice.
- Added integration coverage for all printed answer keys, migration/import/idempotence, 60-item section distribution, duration and rejection of incomplete sections.

## 2026-10-28 — Document device QA blocker
- Recorded the observed Expo Go SDK mismatch and the exact recovery path: install the SDK 57 Android Expo Go build from https://expo.dev/go or use a dedicated development build.
- Device QA remains open; a successful no-bytecode JavaScript export is not an APK/AAB or proof of on-device behavior.

## 2026-10-29 — RU C Unit Science full source-bank capture and staging
- Captured all currently listed paginated Lokkho C Unit Science source variants: 44 variants, 4,185 source records with source-count reconciliation across all variants.
- Preserved 4,167 usable-option records in external source capture; curated 44 schema-v1 Science-core candidate packs with 4,009 records, held 158 other-subject labels for session review, and logged 18 no-option rows. Downloaded 45 local images/SVGs and verified all 46 curated asset references.
- Validated every pack: 44/44 pass, zero schema errors. All retained content and third-party candidate answer keys remain explicitly unverified; 14 records have exact duplicate option text and remain flagged.
- Updated RU C coverage/import readiness docs and review ledgers. No RU C Unit records were copied into app packs or `src/content/bundledPacks.ts`; answer verification, original-paper comparison and local asset rendering remain release blockers.


## 2026-10-29 — Status audit and fresh automated checks
- Rechecked current Git state: clean `main` working tree, three commits ahead of `origin/main`; no push performed.
- Re-ran 54 automated tests, typecheck, lint, diff check, and validators for both bundled DU A packs; all passed, with zero pack-validator errors/warnings.
- Confirmed the bundle still includes only the two DU A Unit packs; RU Unit A and RU C Unit data remain external and unbundled.
- Updated the current-state, task-state, handoff and QA documents with remaining content-verification, image-rendering, Android-device and release-build gates.


## 2026-10-29 — RU C Unit year-by-year audit-only pass
- Added an isolated year-by-year evidence audit of 4,009 staged RU C Unit Science candidates across 44 packs, with per-question source similarity triage and per-session coverage results.
- Compared against 20 partial SattAcademy snapshots (300 questions) and existing OCR for 14 third-party scan variants; produced 117 high-confidence text matches, 35 answer-text mismatch review flags and 278 high-OCR-similarity leads. These are not official verification.
- Identified 14 duplicate-option question records, 26 exact normalized stem repeats across variants, and 12 discrepancies in legacy year-coverage counters.
- Confirmed 166/166 protected source/candidate/asset/PDF files unchanged. No question files were edited or imported; 0 questions/answer keys were promoted to verified.


## 2026-10-29 — Import RU C Unit Science candidates for browse/review
- Imported 44 schema-v1 RU C Unit Science candidate packs (4,009 questions across 2010–2011 through 2025–2026) while preserving every answer/content status as `unverified`.
- Added 45 local PNG figures, converted source WebP/SVG assets only in the app copy, generated a static Metro asset index, and added QuestionCard local figure rendering without new runtime dependencies.
- Regenerated the pack index to 46 packs total (44 RU C + 2 DU A); added an integration test proving idempotent import, asset paths, preserved verification states and zero RU scoring eligibility.
- Verification: 55 tests passed, typecheck and lint passed, all 46 JSON pack files validate with 0 errors (4,023 expected warnings), Android no-bytecode export passed; 166/166 protected external source/candidate/asset/PDF inputs remained hash-identical.
- Content/answer verification, Android visual QA, and native APK/AAB build remain outstanding. No push performed.


## 2026-10-30 — Rebuild and replace RU verified-source question bank

- Completed OCR for all 156 source PDF pages and rebuilt the RU-V extraction into 15 packs covering the same source paper/set identities.
- Replaced the prior 15-pack / 1,815-question RU-V app import with **1,799 MCQs**. Every included question is marked `contentVerificationStatus: verified` and `answerVerificationStatus: verified`, with four extracted non-empty options and one explicit source A/B/C/D answer marker. Subjects are assigned across Physics, Higher Mathematics, Chemistry, Biology, ICT and English.
- Kept the independent RU C Unit candidate bank (4,009 questions) and both DU packs unchanged. Bundle index remains 61 pack files and now contains **5,988 question records**.
- Added explicit exclusion reporting for 183 source records that cannot be represented as complete single-choice questions from the extraction: written-part, incomplete/missing option text, X, multiple-letter and missing-answer cases. Thirty imported questions with repeated extracted option text are called out in a separate review audit; their source data/status is not silently rewritten.
- Added transactional `replaceExistingPaperContent` support. It clears only current appearances for the target RU-V papers, preserving old question rows and FK-backed bookmarks/session history. Active browsing and practice queries now require a current paper appearance, so preserved historical orphan records cannot leak back into global practice pools.
- Added integration coverage for replacement, stale-question pool exclusion, bookmark/session/answer preservation and verified import status. Verification: 60 tests, typecheck, lint and 61-pack schema validation passed under Node 22.23.1 (0 errors; 4,052 warnings, primarily existing candidate-pack warnings plus repeated source option-text warnings).
- Updated schema, import workflow, README, current-state, task-state and QA documentation. Physical Android QA and a native APK/AAB release build remain outstanding. No push performed.


## 2026-11-13 — Home hero runtime audit (audit only)

- Reviewed supplied Android Home/Profile/Practice Results screenshots and traced the hero CTA and Stat text regressions to NativeWind Pressable callback styling and a missing semantic text foreground.
- Recorded the hero-height growth and the absence of a prior landscape university-cover system; specified a proposed 1024×500 Home cover asset contract.
- Added `docs/audits/HOME_HERO_RUNTIME_AUDIT.md`; full suite passes 234/234 on Node 22.23.1. No app source, assets, dependencies, app identity or EAS/release metadata changed in this audit pass.
