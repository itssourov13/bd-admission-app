## CU localization, Profile ordering & question issue reporting — implemented and automated checks passed — 2026-11-22

**Local source status:** Implemented and committed locally on feat/import-hstu-verified-answers-2026-11-12 as 8f36b13; automated verification passed on Node 22.23.1. No push or EAS build has been performed. App release metadata remains **0.1.11 / Android versionCode 11** until a separately approved release update.

- CU's bilingual catalogue metadata now resolves to **চট্টগ্রাম বিশ্ববিদ্যালয়** in Bangla and **University of Chittagong** in English. The existing CU logo and question-pack data are unchanged.
- Profile shortcuts are ordered Bookmarks → Practice history → Marking rules → Settings. Reported questions is an additional, separate Profile entry.
- Question issue reporting is available from Browse, Bookmarks, Flash, active Exam and Result question cards. The alert-circle action is directly below Bookmark in a fixed-width vertical action stack next to the question stem; the A/B/C/D options remain in their existing full-width section. The existing Exam **Flag for review** remains a separate per-session feature below the options.
- SQLite migration **v13** adds question_issue_reports and an updated_at DESC index. Reports are offline/local, unique per canonical question, retain the first-reported question snapshot and record the originating surface. They do not reuse bookmarks or session_answers.flagged.
- Profile → Reported questions supports list/count, detail, edit, delete and JSON share. The versioned JSON envelope is bd-admission-question-issues schema v1; sharing uses SDK-57-compatible expo-sharing ~57.0.26 and expo-file-system/legacy through Android's native Sharesheet. A share-sheet hand-off is not proof of recipient delivery.
- SDK 57 package alignment now includes Expo 57.0.33 and direct @expo/metro-runtime ~57.0.18; @expo/cli resolves to 57.0.34. All package compatibility checks and Expo Doctor pass.

**Final automated verification (Node 22.23.1):** TypeScript typecheck PASS; Expo lint PASS; expo install --check PASS; targeted suites **54/54**; full pnpm test **318/318**; git diff --check PASS; Expo Doctor **21/21**. Console reports normal Node experimental SQLite and module-type performance warnings; no test failures.

**Still required:** physical Android preview QA for responsive QuestionCard layout, modal/timer behavior and file attachment sharing through available targets (especially WhatsApp, Telegram and Files). The currently published/installed v0.1.11 APK does not include these local changes; build a new preview only after this local commit is reviewed and the owner requests it.

---

## Standard Exam review flag and question-issue reporting — follow-up audit — 2026-11-22

A follow-up code audit confirmed the existing Standard Exam **Flag for review** feature is already implemented and must remain separate from any global content-issue report. Migration v7 adds `session_answers.flagged`, stored per `(session_id, question_id)`. It feeds the active Exam marker/palette, progress and submission counts, then the completed Result's Flagged filter. It does not change answer selection or score and cannot be changed after finalization. `tests/exam-review.test.ts` passed 7/7. The issue report must have its own table/repository, a distinct “Report question issue / প্রশ্নে সমস্যা জানান” action and a non-flag icon; never reuse the exam flag or put both actions side by side.

Detailed separation requirements and revised UX recommendation are recorded in [the audit report](audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md). No app source/runtime change; no push.

---

## Historical pre-implementation audit baseline — Profile, CU localization & issue reporting — 2026-11-22

**Historical status at the time of this entry:** Read-only baseline audit only; its pending implementation statement is superseded by the completed implementation entry at the top of this file. The detailed findings, UX/data model, JSON export contract, SDK 57 sharing approach, acceptance checks and source links are in [the audit report](audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md).

Focused baseline verification at that earlier checkpoint under Node 22.23.1: tests/universities.test.ts + tests/repositories.test.ts, 27/27 passed. Implementation was pending at that time; it is now complete in the current local source. The Android preview remains v0.1.11 until a new build is requested. No push.

---

## Android preview v0.1.11 — CU A Unit build and owner device check — 2026-11-19

Release metadata is **0.1.11 / Android `versionCode 11`**. Application ID remains `com.admissionbd.app`, Expo slug and existing EAS project identity are preserved. The EAS `preview` / `INTERNAL` APK contains all 26 CU A Unit packs and the original CU logo. The source contains 230 Varsity packs / 14,579 university questions; the combined seed has 231 entries / 16,407 question rows including the separate ASPECT Library.

EAS build `8aa4643c-e312-4a0b-af08-9b3f7779b68c` was completed according to the owner, who installed the APK on Android and reports that the checks performed work normally. [Open the EAS build page / APK](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c). This is owner-reported manual smoke QA; handset model/OS and exhaustive screen/accessibility coverage were not recorded. This internal preview is not a production AAB or Play Store submission. No push.

---

## CU A Unit Science — imported into Varsity catalogue — 2026-11-19

The owner-approved CU package is now integrated into the active app source under `data/question-packs/` (flat Varsity pack layout): **26 packs / 26 papers / 2,558 questions / 11,397 options / 68 source documents**, institution `cu` / `CU`. The original external archive and extracted source snapshot remain unchanged. The 26 incoming filenames and batch, paper, question and source IDs were checked for collisions before copying; no existing pack was overwritten.

Answer/content states remain intact: **2,185 answer-verified / 373 answer-unverified**, with all 2,558 content records verified under the owner-confirmed prior Muse AI content review. Existing eligibility predicates return **2,185 CU practice-eligible** questions and **307 structurally safe answer-review candidates**. All 26 papers have at least one verified-eligible question, so none triggers the provisional-only fallback; unverified CU answers remain Browse-only in this dataset. The partial 2025–26 official rule does not enable scored Standard Exam planning; other 25 rules remain unconfigured.

Added the original University of Chittagong website PNG at `assets/universities/cu.png` (429×581 RGBA; SHA-256 `9cc7ef6e5577c21aa8d6a1f6dea1298a35c032b63abf7388c4dc38c5361d8829`) and registered it in `src/features/catalog/universityLogos.ts`. The original logo file is unchanged; the website source is recorded in `assets/universities/SOURCES.md`.

**Current catalogue / bundle:** 230 Varsity JSON packs / 14,579 university questions / 59,481 options / 7 institutions / 240 papers / 385 source documents. Combined generated manifest/seed: 231 entries (230 Varsity packs plus the separate ASPECT Library pack), **16,407 question rows / 66,793 options**, schema v12; Library remains separate with 1,828 questions / 26 units. Current seed is 28.05 MiB.

**Validation (Node 22.23.1):** full suite 301/301; typecheck and lint pass; 230 packs / 14,579 questions / 0 errors / 5,536 warnings; question assets 65 files / 66 refs / 65 unique; content build/check 231 entries / 16,407 rows; SQLite `quick_check=ok` / zero FK violations; Android no-bytecode Metro export 2,044 modules / 147 assets / ~4 MB JS (includes `cu.png` and the 29 MB seed). The generated SQLite seed is local/ignored; the app source, manifest and static logo registry are tracked. No app logic/schema change, APK/EAS build, physical-device test, push or deployment was performed. Existing installed APKs do not contain CU; a new preview build is required to distribute it.

---

## RU Science varsity import — integrated and automated checks complete — 2026-11-18

- **Destination:** Varsity question packs, institution `ru` / `RU`, with source unit labels retained. Added 46 packs / 46 papers / 4,249 questions / 16,996 options / 90 source documents / 45 PNG assets. All pack, paper and question IDs use `ru-sci-*`; the separate non-science 197-question D1 Group-1 pack remains excluded.
- **Question state:** 4,144 verified in both dimensions and eligible for default verified practice. 105 stay unverified in both answer/content fields and remain browseable. The explicit structural review predicate admits 86 unresolved candidates; these were not promoted to verified.
- **Exam boundary:** every RU pack has `examRules: []`. No paper-specific Standard Exam pattern, question quota, timer or marking rule was inferred. Custom Practice remains available. Existing RU 2024–25 Marking Profile remains separate and does not establish an exam pattern.
- **Pre-CU integration checkpoint totals (2026-11-18): 204 Varsity packs / 12,021 university questions; combined seed 205 entries / 13,849 rows / 55,396 options, including one separate ASPECT Library book (1,828 questions, 26 units). Seed schema v12; DB size 26,165,248 bytes; seed ID `b8c40409b656a9432ed0`.
- **Regression coverage:** updated JU/HSTU pack expectations and RU retirement/seed tests. Fresh install checks 46 active RU Science papers with no rule rows; v10→v12 sync checks legacy `ru-c-*`/`ru-vq-*` rows remain retired while the 46 new `ru-sci-*` papers become active. Existing JU/HSTU and ASPECT totals/flows remain covered.
- **Pre-CU verification at the 2026-11-18 RU checkpoint (historical):** full suite 301/301; targeted import/migration tests 9/9; typecheck; lint; packs validation 204 / 12,021, 0 errors / 5,199 warnings; question-assets 65 / 66; content build/check 205 / 13,849; Android no-bytecode export 2,043 modules / 146 assets / ~4 MB JS; SQLite quick_check `ok`; foreign_key_check 0. The later CU integration checks are recorded above.
- **Scope:** no schema migration, DB/runtime logic, scoring implementation, UI or app identity change. Only the RU source packs/assets, generated `bundledManifest.ts`, generated question asset index, three regression test files and project docs changed. The ignored SQLite seed was regenerated locally for builds; it is not committed.
- **Not done:** no APK/EAS build, no physical-device UI test, no push. The released v0.1.9 APK does not contain these RU packs; a new Android build is needed to distribute them.

---

## Android preview v0.1.9 — built and owner-tested — 2026-11-18

- Release metadata: Expo app version `0.1.9`, Android `versionCode 9`, package `com.admissionbd.app`; resolved Expo config retains the existing EAS project ID.
- EAS preview build `5cdcf931-9b67-46f2-9038-47bb7e144c40` completed successfully (**FINISHED**). [EAS build page / APK download](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/5cdcf931-9b67-46f2-9038-47bb7e144c40).
- Owner manually installed and ran the APK on Android and reports that everything checked is working normally; no issue is currently reported. Any subsequently discovered issue will be recorded by the owner. This is an owner-reported manual smoke check; handset/OS and exhaustive screen/accessibility coverage were not recorded.
- Automated checks on Node 22.23.1: 301/301 tests; typecheck; lint; content check (159 packs / 9,600 questions); question-assets check (20/20); ASPECT attestation; pack validation (0 errors / 5,085 warnings); resolved Expo config and diff hygiene all passed.
- The test changes only reconcile stale expected counts with the existing duplicate-correct-option eligibility guard. No app/runtime eligibility code changed during release preparation. Source PDF page 56 Q12 remains held/unverified/unscored because the printed option and working contradict one another.
- GitHub pre-release publication remains an owner action after pushing and merging this branch: tag `v0.1.9`, target the merged default branch, attach the APK downloaded from the EAS page, and include a generated SHA-256 checksum. No push or merge has been performed here.

---

## ASPECT Library UX, verification and performance — implemented 2026-11-18

Supersedes the 2026-11-17 audit and RU-V integration sections below wherever they say the ASPECT book is unverified, permission-pending, shown under Unknown, or rendered as a flat unit list.

- **Landing/logo:** ADR-040 presentation-layer attribution (`src/features/library/presentation.ts`): the ASPECT-collection book is shown under the ASPECT publisher card, the empty duplicate Unknown card is dropped, stored `pub-unidentified` provenance is unchanged. ASPECT logo bundled as `assets/publishers/aspect.png` (256×256 PNG, byte-identical to the owner's file; kept raster because tracing would lose the fine lettering) and registered in `publisherLogos.ts`. RU logo reuses `assets/universities/ru.svg` via `UniversityLogo`.
- **Session drawers:** `src/components/library/SessionDrawer.tsx` + `src/features/library/sessions.ts` render 9 expandable session cards holding the 17 source-set cards (Set n — name, unit chip, question count). Every session and set has Flash, Timed practice (existing `/exam/setup` Custom Practice, unscored, not an official RU exam) and Browse, scoped by `bookId`/`unitId` (descendants included once).
- **Verification:** owner attestation of 2026-11-18 applied by `scripts/ruv-aspect-attest.mjs`; content version 2, book `verified`/`licensed`; 1,826 questions verified (1,804 scorable incl. 6 multiple-answer, 22 no-correct-option browse-only), 2 conflicting-key questions held unverified/unscored. `ELIGIBLE_SQL` now also excludes any question whose correct option duplicates another option. See `docs/ASPECT_OWNER_VERIFICATION.md`.
- **Performance:** book/unit-scoped queries are driven from the book's membership rows; Flash uses one single-fallback pool query (`countFlashPool`); landing/book counts come from one conditional aggregate; Browse loads its first page without waiting for subject counts and counts subjects in one grouped pass. Host-side medians (3 runs, node:sqlite on a temp seed copy, not a phone): Flash setup whole book 4,580 → 19.6 ms, Browse entry 4,609 → 7.0 ms, Custom pool 2,223 → 23.3 ms, landing 32.8 → 23.1 ms. No new index: measured times did not justify a schema migration. Raw results in `.local/bench-*.json` (git-excluded); `scripts/bench-library.mjs` reproduces them.
- Verification: `pnpm typecheck`, `pnpm lint`, `pnpm content:check` (159 packs / 9,600 questions), `question-assets:check` (20/20), `node scripts/ruv-aspect-attest.mjs --check`, `git diff --check`, focused library/seed/startup/exam/UI-logic tests (60/60 in the library+seed group incl. fresh install, v1→v2 upgrade, repeat sync, newer-edition protection; 149/150 earlier in the wider group, the one failure was a wrong assertion that was fixed and re-run) and the Android Metro no-bytecode export (passed, one ~4 MB Android bundle). No physical-device, TalkBack, light/dark visual or Bangla/English on-screen QA was performed; no APK was built.

---

## Owner-requested ASPECT Library UX/runtime audit — completed 2026-11-17 (audit only)

- Read-only audit report: `docs/audits/ASPECT_LIBRARY_UX_RUNTIME_AUDIT_2026-11-17.md`. The two owner screenshots, supplied ASPECT PNG, Library UI/data tree, RU logo registry, exam scope and SQLite query paths were cross-checked.
- Confirmed: the ASPECT book is assigned to `pub-unidentified` with `collection: ASPECT` (the publisher identity is intentionally unknown under ADR-038), while the seeded `pub-aspect` placeholder is empty; the Library should present one ASPECT collection card without rewriting source attribution. 9 session parents / 17 source-set children are rendered as a flat list; per-session Exam action is absent; all 1,828 imported question answer/content flags and the book status remain unverified in the current pack/seed.
- Owner's latest instruction confirms the publication/logo permissions and that the imported question material/existing source answers have been checked. This owner attestation is not yet propagated to the pack/seed; do not treat the current build as already updated. Preserve the three unresolved answer conflicts and explicitly reconcile the eleven duplicate-option cases before scored eligibility changes.
- App-wide multi-select is already implemented in the current branch. Session-level practice should use the existing book/unit scope and be labelled timed Custom Practice, not an official RU Standard Exam until an exact source-matched paper/rule exists.
- Host-side, read-only SQLite measurements identified expensive full-scan book-count queries and a duplicated provisional count in Flash setup; device timing remains unmeasured.
- No app source, question data, asset, seed, config, APK or runtime behavior was changed in this audit. Implementation handoff is pending Claude.

---

## Android preview v0.1.7 — EAS build finished — 2026-11-17

- App version `0.1.7`, Android `versionCode 8`; package `com.admissionbd.app`, EAS project and signing identity unchanged.
- Target: EAS `preview` / internal Android APK for the current RU-V ASPECT Library seed and seed-sync version-protection fix.
- EAS preview build `f1584fb8-0be9-4398-a314-d0fc21507603` is **FINISHED** (completed 2026-11-17 17:41:42 Asia/Dhaka); [build page / logs](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/f1584fb8-0be9-4398-a314-d0fc21507603). [Download v0.1.7 APK](https://expo.dev/artifacts/eas/2wSz5i5tBMwbqy5BPwu3CAUXn6cJrXmx6fvZZwp6DYU.apk) (121,037,466 bytes (~115.4 MiB); expires 2026-12-01 17:21 Asia/Dhaka). APK endpoint was checked and returned HTTP 200. No physical-device installation or Library visual QA is claimed.

---

## RU-V ASPECT Library integration — completed local implementation — 2026-11-17

- RU-V is bundled as one separate ASPECT Library publication, not as an active RU university question-pack batch. The original 15 archived JSON packs / 17 printed source sets and the Lokkho archive remain untouched and independently verifiable.
- Prepared Library publication: 1 book, collection `ASPECT`, 26 units, 1,828 questions, 7,312 options, 1,828 source explanations, 20 figure assets and original PDF page/question provenance on all 1,828 records.
- Source-key semantics are preserved honestly: all 1,828 question answer/content states are stored `unverified`; 1,797 are single-choice records with a marker printed in the compiled PDF (provisional only); 31 are browse-only (22 PDF `×`/no correct option, 6 multiple-answer, 3 source contradictions with keys withheld). Eleven additional duplicate-option questions are excluded from the provisional single-choice pool, leaving 1,786 provisional practice candidates. All 1,828 remain browsable.
- The 154 raw extraction records outside the prepared set remain excluded: 38 are non-MCQ records and 116 MCQs did not have reliably extracted options. They are retained in the exclusion ledger rather than silently omitted from the audit trail.
- Offline delivery: `data/library-packs/ruv-aspect-library-pack.json` plus 20 files under `data/question-packs/assets/ruv-aspect/` feed the generated content manifest and SQLite seed. The seed has 159 bundled entries (158 university question packs plus 1 Library pack), 9,600 question rows, 38,400 option rows and schema v12. Library storage has one book, 26 units and 1,828 unit-question memberships.
- Startup sync supports Library publisher/book/unit/membership records. A focused regression now ensures an older bundled edition cannot overwrite an already-installed newer Library edition; the old bundled signature is checkpointed before content rows are touched.
- Verification: focused Library/seed/startup tests 24/24; RU retirement/migration tests 5/5; Library catalogue tests 6/6; typecheck, lint, `content:check`, `question-assets:check`, `git diff --check`, Android Metro no-bytecode export, staging SHA-256 76/76, RU-V archive 36/36 and Lokkho archive 90/90 all pass. See `docs/RUV_ASPECT_IMPORT.md` for commands and scope.
- Not performed: native APK build, physical Android installation, Library visual QA or TalkBack. The latest owner-verified v0.1.6 APK predates this change; a new preview build is needed before the device sees the new seed. These are release/device follow-ups, not failures of the local seed build/sync checks.

---

# Current state

## Historical implementation checkpoint — Phase C and Phase D archive/removal — 2026-11-17 (before RU-V Library integration)

- Repository: /home/kali/gpt-workspace/bd-admission-app.
- Branch: feat/import-hstu-verified-answers-2026-11-12.
- Phase C is committed locally as fe86f53: shared offline asset pipeline + CI check, structured MathBlock rendering for fractions, roots, matrices, determinants, piecewise/aligned forms, and the 20-question RU-V source-figure inventory.
- Phase D is committed locally: the 59 RU packs and 45 Lokkho question images are removed from active app source; schema v11 retires already-imported RU/RU-V records without deleting history; active catalogue and practice queries exclude retired papers/batches.
- External archives are independently verified:
  - Lokkho: 44 packs / 4,009 questions / 45 assets / 46 references; 90/90 SHA-256 entries pass.
  - RU-V: 15 packs / 1,828 questions / 17 printed source sets / 20 figure crops; 36/36 SHA-256 entries pass.
- Generated active content: 158 non-RU packs / 7,772 questions / 31,088 options; 2,512 verified eligible questions; 5 active institutions / 168 papers. The regenerated seed has no RU batches, questions or Lokkho asset references. assets/universities/ru.svg remains.
- Verification on Node 22.23.1: 282/282 tests; TypeScript, lint, content build/check, asset check, pack validation (0 errors; 5,085 warnings), Android no-bytecode Metro export (~4 MB JS bundle), and git diff --check passed. Both archive verifiers and both SHA-256 manifests passed.
- Migration tests cover realistic schema-v10 upgrade, history/user-data preservation, repeated sync, re-delivered RU seed rows, database reopen, a fresh synthetic install and fresh install with the real 158-pack seed.
- Not performed: physical Android device/emulator QA, dark-theme/narrow-width visual review of MathBlock, TalkBack testing or installation of an APK containing this Phase C/D state. The latest owner-verified APK remains v0.1.6 and predates these changes; a new preview build/install is required for device verification.
- Final implementation, documentation and diff review are committed locally. No push was performed.

Detailed evidence:
- Phase C: docs/implementation/PHASE_C_SHARED_VISUAL_RENDERING.md.
- Phase D and migration: docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md.
- Source figures: docs/audits/RU_V_FIGURE_INVENTORY_2026-11-17.md.
- Decisions: ADR-035, ADR-036 and ADR-037 in docs/DECISIONS.md.

## Latest implementation and release candidate — 2026-11-13

- Home Hero is now a compact composite card: a decorative campus-photo cover with navy text scrim, separate native practice/mock-exam CTA controls, responsive stacking and resume behavior. Current asset: `assets/home/hero-cover.jpg` (782×382 crop from the supplied UI/UX reference); it is a temporary reference-derived image, not final bespoke artwork. Rights confirmation is required before public distribution. See `docs/implementation/PHASE_07_HOME_HERO.md` and `assets/home/README.md`.
- Fixed the Hero CTA styling issue by removing unsupported callback-valued Pressable styles. Fixed dark Profile Stat values with an explicit semantic foreground; no global `Txt` change.
- Exam setup received only a minimal duplicate-query reuse: the provisional-only subject-pool count is read once. The large-catalogue selection work is otherwise intentionally unchanged.
- Automated validation on Node 22.23.1: full suite 240/240, TypeScript, lint, `pnpm content:check` (217 packs / 13,609 questions), Expo public config and Android no-bytecode Metro export passed before the EAS build. The owner subsequently installed and ran the v0.1.6 APK and confirmed the previously reported runtime issues are fixed; no current app issue was reported.
- Release metadata: app/package version 0.1.6, Android versionCode 7, application ID `com.admissionbd.app`; EAS project ID and signing identity unchanged. EAS preview build `dcf1b743-ea08-4d27-b01f-82fe26374ffa` is **FINISHED** (completed 2026-11-13 11:50:33 UTC / 17:50:33 Asia/Dhaka): https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/dcf1b743-ea08-4d27-b01f-82fe26374ffa. [Download the v0.1.6 APK](https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk).
- Previous v0.1.5 / code 6 build `35d0f228-a328-4e1c-898d-a853445b00ee` is FINISHED but predates the current Home Hero runtime fixes. APK: https://expo.dev/artifacts/eas/J56SlEhV00jiqA1bmUe6BhQfFLExyGH5UASE5wkprnw.apk.
- Owner verification: v0.1.6 installed and launched successfully; owner reports the previously raised Hero/theme/runtime issues are fixed and there are no known outstanding app issues. Exact handset/OS and a per-screen test matrix were not recorded. Keep additional device checks optional unless a new issue appears.

## Historical Publications & Books Library audit — 2026-11-17 (before current owner archive decision)

- Verdict: Phase 8 foundation exists, but the end-to-end Library publishing/content workflow is **not complete**. The five seeded publisher rows are metadata-only; pub-aspect currently has no book/questions and no actual LibraryPack is present.
- Implemented: Home shortcut; publisher/book/unit screens; migration v8; LibraryPack v1 type/validator/transactional importer; book/unit Browse/Flash/book-level Custom Practice scopes; history/result labels; soft remove/restore contracts.
- Missing: actual RU-V LibraryPack conversion/build and installation path; runtime/UI caller for installLibraryPack; real catalogue/content source; install/update UI; Phase 9 source/hash/download UI wiring; Phase 10 backend/CMS.
- App-wide gap (not RU-specific): multiple-answer questions remain single-select in the shared QuestionCard/Flash/Standard Exam paths and are excluded from ELIGIBLE_SQL. Existing question-image rendering is tied to the Lokkho-only static asset index. MathText supports common notation but is not a full TeX/matrix/diagram renderer. These shared runtime, scoring, persistence and visual-asset capabilities must serve all university packs and Library content.
- Focused checks: Library/content-manager/brand tests 25/25 pass; typecheck pass; lint pass. No real ASPECT pack, Metro/Android export or device visual QA was exercised.
- Next target: one RU-V ASPECT book with 17 test units only. RU Lokkho must be archived outside the app/ASPECT and remains a separate optional reuse audit.
- Detailed report: docs/audits/LIBRARY_IMPLEMENTATION_STATUS_AUDIT_2026-11-17.md.

## Historical RU source audit and initial ASPECT proposal — superseded by ADR-035

- RU-V is currently 15 JSON batches / 15 paper rows / 1,828 questions, but represents 17 source sets. The two combined batches cover 2021–22 PDF pages 67/78 and 2022–23 pages 44/55. The target is 17 logical test entries, not necessarily 17 JSON batches.
- The PDF prints Unit A on both 2024–25 sets: মহানন্দা (p1) and পদ্মা (p12). The earlier C catalogue correction is superseded; restore source-facing A in a future authorized data change. No pack JSON was edited.
- Scanner findings: 35 duplicate-option pairs across 30 questions; 15 Bangla caret candidates; 2 replacement characters; 3 null separate-explanation fields plus additional option/explanation boundary defects. Selected examples were source-checked, but the full visual audit is not complete.
- RU-V includes 22 no-correct-option and 6 multiple-answer records. Current eligibility remains 1,800 single-choice questions. Multiple-select needs Flash/Standard controls, persistence and exact-set scoring before multi-answer records enter scored pools.
- All 1,828 RU-V records currently have empty assetPaths. RU-V needs its own source-driven visual inventory/crops, but the multi-select engine, diagram renderer and validated offline asset pipeline are app-wide capabilities shared with every supported question source.
- Owner decision: only the 17 audited RU-V source sets will be added under one ASPECT Library book. The 44 RU Lokkho packs / 4,009 candidates must be moved to an external archive and kept out of ASPECT; audit them for optional reuse only. Muse has separately been asked to create a new pack, so Lokkho may remain unused. The archive move has not happened yet: the candidate packs/assets are still in the app repository.
- Documentation-only checkpoint. App-wide multi-select/visual-content implementation, RU-V source visual audit, LibraryPack conversion and RU-V cutover remain pending; no commit/push.

Reports: docs/audits/RU_VERIFIED_QUESTION_BANK_SOURCE_AUDIT_2026-11-17.md and docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md.

## RU/HSTU catalogue identity correction — 2026-11-16

- Historical implementation snapshot only: the two RU-V 2024–25 sets were changed to C Unit. The 2026-11-17 source audit found both source headers print Unit A; current source-facing metadata should be A. This correction is pending and not implemented.
- The five duplicated normal-HSTU 2024–25 A/B shift papers now use the existing canonical IDs. Normal HSTU is 17 papers / 950 questions / 939 verified practice-ready; all 34 added verified IDs remain. HSTU-U retains 105 pending questions.
- Migration v9 merges old alias appearances and active session filter references while preserving question rows, bookmarks, answers, immutable result snapshots and marking-profile snapshots. replaceExistingPaperIds keeps shared canonical questions safe during pack replacement/re-import.
- Full implementation and verification: docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md.

## Roadmap status — see table (reconciled 2026-11-13)

| Phase | Status |
|---|---|
| 1 Loading UI Polish | Implemented — Pending Owner Verification |
| 2 University identity, logos, filters | Implemented — Pending Owner Verification |
| 3 Shared subject selection | Implemented — Pending Owner Verification |
| 4 Configurable marking rules | Implemented — Pending Owner Verification |
| 5 Standard Exam improvements | Implemented — Pending Owner Verification |
| 6 Settings & dark mode | Implemented — Pending Owner Verification |
| 7 Home hero redesign | Implemented — Owner-reported runtime verification pass |
| 8 Publications & books library | Implemented — Pending Owner Verification |
| 9 Online + offline content management (optional) | Partially implemented — local contracts only; no remote source |
| 10 Backend & CMS foundation (optional) | Deferred — contract documented; nothing deployed |

Authoritative table and chronological log: docs/implementation/IMPLEMENTATION_LOG.md (this table must always match it).

- Phase 1 (docs/implementation/PHASE_01_LOADING_UI.md): Phase 1 added: returning-launch escalation to the progress UI after 1.5 s, a 4 s Home-ready fallback, splash-matching setup first frame, shorter/Reduce-Motion-aware ready hold, and a 150 ms delayed `LoadingView` spinner. Lightweight checks only (policy test 5/5, targeted tsc/eslint); full suite, builds and device QA are deferred to the owner. See docs/implementation/PHASE_01_LOADING_UI.md.
- Phase 2 (docs/implementation/PHASE_02_UNIVERSITY_EXPERIENCE.md): Varsity tab shows parent universities with an All|DU|RU|JU|HSTU filter bar; logos use a monogram fallback until licensed assets are supplied.
- Phase 3 (docs/implementation/PHASE_03_SHARED_SUBJECT_SELECTION.md): shared All/Single/Multiple subject selection for Flash, Custom Practice and generic Standard Exam; validated route params; grouped pool counts; implemented, pending owner verification (device testing deferred).
- Phase 4 (docs/implementation/PHASE_04_CONFIGURABLE_MARKING_RULES.md): configurable marking profiles with per-value provenance, migration v6, per-university/global defaults, user profiles, session snapshots; implemented, pending owner verification.
- Phase 5 (docs/implementation/PHASE_05_STANDARD_EXAM_IMPROVEMENTS.md): question palette, mark-for-review (migration v7), time warnings, submit summary, per-subject results, review filters, practice-missed; implemented, pending owner verification.
- Phase 6 (docs/implementation/PHASE_06_SETTINGS_DARK_MODE.md): Settings screen and light/dark/system theme (CSS-variable tokens via src/settings), persistent preferences (theme, motion, haptics, question text size), dark splash; implemented, pending owner verification (needs native rebuild for expo-haptics).
- Phase 7 (docs/implementation/PHASE_07_HOME_HERO.md): compact cover-based Hero with separate native CTAs and resume mode; implemented and owner-reported runtime verification pass.

## HSTU verified-question import — 2026-11-12

- Claude's accepted HSTU verification ledger was the source of truth: **664 unique question IDs** are now in the normal HSTU catalogue with both answer and content status set to verified.
- **657** questions moved from HSTU-U appearances to 15 new HSTU papers; **7** questions already attached to HSTU received their accepted answer mappings/status update.
- At the 2026-11-12 import checkpoint, normal HSTU contained **22 paper rows / 950 questions**; after the 2026-11-16 consolidation it contains **17 logical papers / 950 questions**. **939** have verified answers and content and are eligible single-choice records. Eleven older baseline questions remain pending answer status in HSTU (10 unknown, 1 unverified).
- HSTU-U retains **105 pending questions** across 15 papers (102 answer-unverified, 3 answer-unknown; content remains unverified). The **116 baseline pending** questions were not promoted or modified. Three off-baseline pending-ledger records were also left unchanged.
- Question IDs, stems, option order/text and source references were preserved. No JU, RU or DU content, runtime logic, or exam rules changed.
- Verification: 18 pack files and the generated manifest updated; 217 packs / 13,609 questions rebuilt. Full test suite passed 142/142; typecheck, lint and content check passed; SQLite quick_check passed and foreign-key check returned zero issues. All 664 ledger IDs and keys reconcile, pending objects match the pre-import backup, and staged/app pack hashes match.
- No new APK was built or installed for the 2026-11-12 import or 2026-11-16 catalogue consolidation; migration v9 and the updated seed reach an installed device through a new app build.

## Startup UI targeted implementation — 2026-11-11

- The branded five-stage setup UI is now reserved for first-run library setup and actionable startup failures/retries. Returning cold launches keep the native splash visible while SQLite startup/content reconciliation runs; the setup sync gate is released when progress.mode becomes returning.
- The returning splash is hidden only after Home's initial query has settled and its data-backed or actionable error view has laid out. First-run setup also remains on screen until this Home-ready signal, preventing the old Home LoadingView from showing beneath the exit fade.
- The five real stage states and progress math are unchanged. Completed checkmarks now use a 65 ms stagger / 180 ms native-driver opacity-scale animation; Reduce Motion is respected. Existing brand mark, gradient, shimmer, progress fill and overall layout are retained.
- Fatal DB/migration errors still show the branded retry UI. The retry action keeps that recovery screen mounted through the next attempt. SQLite sync, seed transactions, content and user records are unchanged.
- Verification: 142/142 tests, pnpm typecheck, full pnpm lint, pnpm content:check (217 packs / 13,609 questions) and Android no-bytecode Metro export (1,853 modules / 3.5 MB JS / 123 assets) passed. No dependency, app version or native identity changed.
- No APK build or physical-device recording was done in this pass. The previous square flash is mitigated by the new readiness handoff in source, but its actual disappearance still needs release-device visual QA. Full evidence: docs/STARTUP_UI_AUDIT.md; checklist: docs/QA_CHECKLIST.md.

## Incident follow-up — v0.1.3 first-launch failure and v0.1.4 fix (2026-11-05)

- Owner-reported device result: v0.1.3 / Android versionCode 4 opens the branded setup screen but fails at **Importing question library**. The on-screen retry state says the primary profile/bookmark/practice data is preserved; do not uninstall or clear app storage while updating.
- The previous build was verified only at the packaging layer: its embedded content_seed.db hash/CRC and SQLite integrity were checked. That was not a physical-device runtime test, and the app must not have been represented as device-ready.
- Source-level defect found: expo-sqlite.defaultDatabaseDirectory returns an absolute filesystem path (for example /data/user/0/.../SQLite), while Expo File's File constructor expects a file:/// URI. v0.1.3 passed the raw path directly when creating the disposable sidecar destination. This invalid URI/path-type handoff is a concrete startup failure candidate at the exact seed-materialization stage.
- v0.1.4 now converts the SQLite path to a proper file:// URI before constructing File, converts the URI back to an absolute path for SQLite ATTACH, and uses expo-file-system/legacy copyAsync so Android raw-resource identifiers are handled by the native resource copier as well as ordinary file URIs. The retry screen also displays the native error message (truncated) to make any remaining device-only issue diagnosable.
- App version is now **0.1.4**, Android **versionCode 5**; package ID com.admissionbd.app, EAS project and signing identity are unchanged.
- Verification after the fix: **139 tests**, TypeScript, ESLint, seed/content integrity, all 217 pack validation, Expo config, Android prebuild and Android Metro export pass. EAS v0.1.4 preview build 040c75b2-0bbd-47b5-b859-cdb7f179f968 completed successfully (FINISHED) on 2026-11-05 at 14:59:43 UTC / 20:59:43 Asia/Dhaka. Build metrics: queue 23m07.529s, worker build 18m48.733s (Gradle phase 17m19.883s), total 42m00.902s. App version 0.1.4, Android versionCode 5, application ID com.admissionbd.app. APK: https://expo.dev/artifacts/eas/ePmli5F3NH4vc9q1RupboKmJbt2FxkI8YdjbMW54-Jo.apk (~112 MiB; 117,408,124 bytes). APK SHA-256: 980cdfdd216ac588148b8d78a079df6660143a35f793d543b24fc25d8bfab670. The embedded assets/content_seed.db is 23,724,032 bytes; its SHA-256 1f26f2eb1ad59b2d3dee7272908bc1e91476452dc1c1035dfb06a60785fbf32e exactly matches the generated source seed. Full APK ZIP integrity passed across all 1,367 entries, SQLite quick_check is ok, user_version=5, and foreign_key_check reports zero violations. Seed catalogue counts: 217 exam papers/packs, 13,609 questions, 54,436 options, 217 question batches. User-owned bookmarks, profiles and practice-session tables are empty in the bundled seed as expected.
- Expo Doctor: **20/21 checks passed**; the sole failure was an Expo SDK patch-version mismatch across five packages. It did not block prebuild, Gradle or APK creation. Record patch alignment and a Doctor rerun for a separate dependency-maintenance pass; no rebuild is needed solely for this advisory.
- Owner has installed and verified v0.1.4 on a physical phone; the v0.1.3 first-import failure is closed for that candidate. The later square-flash observation received a targeted Home-readiness handoff fix on 2026-11-11; actual disappearance still awaits release-device visual QA. The separate Expo Doctor patch-alignment advisory remains a maintenance follow-up.


## Previous seed-based Android preview — v0.1.3 (built; owner-reported first-launch failure)

- Release version: **0.1.3**, Android **versionCode 4**, package `com.admissionbd.app`; EAS project `16ba69b8-96d7-4856-a197-77acddebe1ec`, owner `sk_king13`. The previous v0.1.2 / code 3 APK predates the SQLite seed runtime.
- EAS internal Android APK build **FINISHED** on 2026-11-05 at 13:32:51 UTC (19:32:51 Asia/Dhaka): `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd`. [Open the EAS build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) or [download the v0.1.3 APK](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk). APK size: 117,428,288 bytes (~112 MiB).
- The generated seed filename is `content_seed.db` (Android resource names do not allow hyphens). The `expo-asset` config plugin copies it to `android/app/src/main/assets/content_seed.db` during native prebuild. Source and native copies have identical SHA-256 `1f26f2eb1ad59b2d3dee7272908bc1e91476452dc1c1035dfb06a60785fbf32e`. The finished EAS APK's `assets/content_seed.db` entry was extracted from the packaged APK and checked: SHA-256 matches the source, ZIP CRC passes, SQLite `quick_check=ok`, foreign-key issues `0`, schema v5, 217 packs / 13,609 questions, seed ID `c8f23baab9c12b7c2f24`.
- The exact EAS `eas-build-pre-install` package script ran successfully under Node 22.23.1 without installed project dependencies; it regenerates the ignored DB before Expo prebuild. Generated `android/` and `ios/` native projects are ignored so managed EAS prebuild runs from app config.
- Latest automated verification before EAS build: **139/139 tests**, TypeScript, ESLint, frozen-lockfile install, EAS pre-install hook, 217-pack validation (13,609 questions / 0 errors / 9,785 warnings), SQLite integrity, benchmark, resolved Expo config, Android native prebuild, Metro export and EAS APK build pass. Native, exported and APK-embedded DB copies pass quick_check, FK, schema v5, 217-pack and 13,609-question checks. EAS Expo Doctor returned 20/21 because five Expo SDK dependencies are one patch behind its current recommendation; Gradle continued and the build finished successfully.
- Latest Node host benchmark: seed import **1,419 ms**, returning sync **2 ms**; legacy JSON parse **414 ms**, legacy returning signatures **271 ms**, legacy sample 25 packs / 1,249 questions **740 ms**, projected legacy full import **8,066 ms** (linear extrapolation only). These are not Android-device timings.
- Android Metro export: 1,864 modules, 3.5 MB JS bundle and 123 assets including a 23.72 MB SQLite seed. This does not imply the total APK shrank by the same proportion.
- Owner installed/tested v0.1.3 over the previous app and reported failure at the first question-library import. That historical issue was addressed in v0.1.4, which the owner has since installed and verified successfully on a physical phone.

## Seed-based startup implementation — 2026-11-05

- Replaced 217 JSON runtime imports with a generated SQLite seed asset (22.63 MiB locally, gitignored) plus a small generated/committed manifest. The source-of-truth JSON packs remain unchanged: 217 packs / 13,609 questions.
- Added build-time validation and seed generation through the real migrations/importer; the builder checks SQLite integrity, foreign keys, schema/format, ordered pack signatures, question counts, content-table totals and empty user-owned seed tables. CI builds the seed and runs a read-only integrity check before tests.
- Runtime imports the seed lazily only when signatures are pending, checks seed metadata before copying, uses set-based SQL and grouped transactions capped at 1,500 questions. A group commit and its batch signatures are atomic. Failed groups are isolated pack-by-pack; a killed process resumes from missing signatures on the next launch.
- Provider state now preserves the libraryComplete result and exposes incomplete sync as a warning. Startup metrics use per-attempt elapsed windows while retaining process-relative app/font marks across retries.
- Progress fill uses native-driver translateX instead of JS-driven width animation. Existing Reduce Motion/accessibility support remains. Reanimated APIs are not used; no extra plugin/configuration was added.
- Latest host benchmark (Node 22.23.1): legacy 25-pack sample 740 ms, extrapolated full first import 8,066 ms; new full 217-pack seed copy 1,419 ms; new returning content sync 2 ms. Android no-bytecode export confirms the JS bundle is now 3.5 MB and contains a separate 23.72 MB SQLite asset. These are host/export measurements, not APK-size or Android-device startup results; see `docs/STARTUP_PERFORMANCE.md`.
- Background behavior remains lifecycle-aware retry and transaction-safe next-launch recovery, not guaranteed continuous background execution. No WorkManager/foreground service is included; rationale and reassessment criteria are documented in `docs/STARTUP_PERFORMANCE.md`.
- The v0.1.2 APK predates the seed changes and does not validate the seed asset path. It is superseded by v0.1.3, which built successfully but later failed on the owner's phone during the first question-library import; see the incident record above.

## Android correctness preview preparation — 2026-11-05 (pre-seed APK checkpoint)

- Release candidate source version: **0.1.2**, Android **versionCode 3**, package **com.admissionbd.app**; the Expo slug, EAS project ID and signing identity are unchanged.
- EAS CLI authentication was checked against account **sk_king13**. The EAS build history contained only the earlier v0.1.1 (code 2) and v0.1.0 (code 1) completed preview jobs; no v0.1.2 job existed at this checkpoint.
- The v0.1.2 preview profile was built successfully as EAS internal APK `af78b85f-7a2b-4fba-b693-532c7d218f8b` after this initial preparation checkpoint. It contains the correctness changes but predates the seed-based asset path; v0.1.3 is the previous seed-based build; its physical first-import failure is recorded at the top of this document.
- Resolved Expo public config confirms version 0.1.2, Android versionCode 3, package ID, slug and EAS project ID. The version/documentation update is committed locally as c93c7f3; device-level verification remains owner-pending after the APK is installed.

## Profile, math notation and exam-rule integrity — 2026-11-05

- Profile display-name writes now use `saveDisplayName`: write → read back → compare normalized value → report success only after persistence is confirmed. Drafts are saved on blur/submit and best-effort when leaving the profile screen; a synchronous ref guard prevents duplicate concurrent writes. The raw question-pack batch list has been removed from the student profile.
- `MathText` renders a conservative set of scientific notation at the UI layer (question and option text), including powers/subscripts, ionic charges, common units/scientific notation, vector hats, permutations and nuclides. Source strings in pack JSON and SQLite are not transformed. Ambiguous/unsupported patterns remain verbatim; the new component supplies spoken math labels for accessibility.
- Exam rules now distinguish `totalMarks` for an MCQ component from the three values required to calculate a score. DB migrations v4/v5 persist component total and snapshot it to a practice session. No unknown penalty or unanswered value is defaulted to zero. Partial rule notices show only the sourced fields and suppress numeric scores.
- Exact-paper sessions require their own complete count and duration. Generic 100 questions/60 minutes applies only to general all-catalogue practice. Exact papers with missing/unusable formats offer an explicitly user-configured, unscored Custom Practice choice.
- Official 2024–2025 source research: partial rule facts applied to 3 JU and 5 HSTU verified-source packs; the remaining 49 of 57 original JU/HSTU rules stay unconfigured. All 99 JU-U/HSTU-U candidate-bank rules remain unconfigured. RU official rules are documented but not attached to the current 127/128-item third-party C-unit variants because neither is an exact official 80-question paper. See `docs/EXAM_RULE_RESEARCH.md`.
- Read-only quality audit scans all **217 packs / 13,609 questions**: **148 findings** overall, **137** at review or higher (117 duplicate-option candidates, 15 Bangla caret artefacts, 3 likely option-label remnants, 2 likely replacement-character candidates; 9 informational findings are excluded from the review threshold). These are triage flags, not confirmed errors. No source question/option was edited by this audit.
- Automated implementation work is recorded in `docs/QA_CHECKLIST.md`; device-level QA and a new APK build remain pending. The published v0.1.1 EAS APK predates this branch.

## Historical implementation snapshots

### Historical branded startup/setup UI implementation — 2026-11-01 (runtime JSON loader superseded on 2026-11-05)

- Added a branded Bangla/English setup screen with the app logo/name, responsive layout, animated progress, five startup stages, a processed question-pack counter, offline reassurance, retry state, accessibility progress semantics and Reduce Motion support.
- Progress is emitted from the actual pack-sync loop. The library bar is weighted by each pack's question count; `done/total` means processed pack attempts (including failures), not that all imported records are valid or successful. Database/app-data/finalizing stages are stage-level indicators, not exact percentages for every SQL operation.
- At that historical checkpoint, the setup screen deferred evaluation of the runtime `bundledPacks` JSON modules until first layout. That loader was removed on 2026-11-05 and replaced by the generated SQLite seed architecture described at the top of this file and in `docs/STARTUP_PERFORMANCE.md`.
- At that 2026-11-01 checkpoint, no SQLite schema or question-pack content changed and the UI covered startup while the legacy sequential importer ran. The later 2026-11-05 seed implementation is documented separately above; background execution still is not guaranteed.
- Automated verification: **76/76 tests**, `pnpm typecheck`, `pnpm lint`, and Android `expo export --platform android --no-bytecode` passed (2,058 modules, 22 MB JS bundle, 122 assets). This export is not an installable APK and does not prove on-device UI behavior.
- **Current EAS preview:** version `0.1.1`, Android `versionCode 2`, build ID `b4745dc4-0069-4a86-bb5b-234e5f377dfd`, profile `preview` / internal APK, package `com.admissionbd.app`. [Open the Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd). The build finished from the current branch using the existing EAS-managed Android keystore; [download the APK](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). EAS reports `FINISHED` (completed **2026-11-01 12:19:53 +06:00**); its device install/update QA remains pending.
- **Pending:** check fresh-install and returning-install flows on a physical Android device, including Bangla/English, progress, retry, small-screen layout, reduced motion and data preservation. The historical `v0.1.0-preview.1` APK does not contain this interface or the latest JU/HSTU packs.


## Current Android preview build — v0.1.1 (2026-11-01)

- EAS build ID: `b4745dc4-0069-4a86-bb5b-234e5f377dfd`; [build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd).
- App version `0.1.1`, Android `versionCode 2`, package `com.admissionbd.app`, EAS profile `preview`, distribution `INTERNAL` (APK), Expo SDK `57.0.0`.
- Includes the branded startup/setup UI and the current 217-pack / 13,609-question catalogue. The previous EAS-managed Android keystore is reused so the APK can update the previous installation without changing the application ID/signing identity.
- Build status: **`FINISHED`** at **2026-11-01 12:19:53 +06:00**. [Download the installable APK](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk) or use the [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd). The build page says it expires on **2026-11-15 12:05 +06:00**. No GitHub release was created for this internal preview. Physical-device verification remains owner-pending.

## Android preview release — 2026-10-31 (Asia/Dhaka)

- GitHub repository: [itssourov13/bd-admission-app](https://github.com/itssourov13/bd-admission-app); default branch `main` is at merge commit `3aa125d4e12cdca1702f976f20c1f60a765923d1` (PR #2 merged).
- Public GitHub pre-release: [BD Admission v0.1.0 Preview 1](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1), tag `v0.1.0-preview.1`, published **2026-10-31 04:16:28 +06:00**. The release is explicitly a pre-release, not a Google Play production release.
- APK asset: [`BD.Admission.v0.1.0.apk`](https://github.com/itssourov13/bd-admission-app/releases/download/v0.1.0-preview.1/BD.Admission.v0.1.0.apk); size **112,443,213 bytes (107.2 MiB)**; SHA-256 `da7f928827ae6945eddebedc817dabe2c9b0467240dc0d59ec4a0170d0a14f9d`.
- EAS preview build ID: `d5e516cd-eefe-44f4-866d-b440ef188da9`. Its APK was uploaded to the GitHub Release and installed/checked by the owner on a physical Android device; the owner reported the device verification as successful. Owner-observed startup: about one minute on the initial first load, then about 2–3 seconds on subsequent opens.
- CI: PR #2 merged successfully. The [PR workflow run](https://github.com/itssourov13/bd-admission-app/actions/runs/41109514896) and [main push workflow run](https://github.com/itssourov13/bd-admission-app/actions/runs/41109555081) both completed successfully.
- Still open: production EAS AAB, Play Console listing/assets/privacy declarations and production rollout. The README artwork is a three-screen showcase, not the final Play Console asset pack.

## JU-U + HSTU-U unverified candidate-bank import — 2026-11-01

- Added 99 packs / **5,773 candidate questions** from `/home/kali/gpt-workspace/museai/admission-app-research/unverified-import-ready/Admission_Import_Format_Unverified_Questions.zip` (SHA-256 `b1de68b088229d8bbeb8e216e7409f2e6de6f88bd14755e766d00a177a9392a8`). JU-U: 84 packs / 5,011; HSTU-U: 15 packs / 762.
- Separate institution identities: `ju-unverified-bank` / `JU-U` and `hstu-unverified-bank` / `HSTU-U`. Existing verified `ju` / `JU` and `hstu` / `HSTU` entries were preserved unchanged.
- Every question content status remains `unverified`. Answer statuses: JU-U 4,820 unverified / 191 unknown; HSTU-U 743 unverified / 19 unknown (combined 5,563 unverified / 210 unknown). There are 19 multiple-choice records.
- The provisional single-choice pool contains **5,502** candidates (JU-U 4,780; HSTU-U 722). Forty-two one-key questions with repeated normalized option text remain browseable but are withheld from provisional scoring. Normal verified eligibility remains zero for both candidate banks.
- All 99 exam rules remain `unconfigured`; no official timing, question count, section rule or marking scheme was inferred. Provisional source-key feedback may be wrong.
- All 99 transformed packs passed exact round-trip comparison after reversing only identity remaps. Source ID collisions were namespaced; all references were updated. Question/option/key/status/provenance fields were preserved.
- Exact overlap audit found 12 text+ordered-option matches and 95 additional same-stem/different-option-order/text matches against current packs. No question records were merged automatically.
- The separate `GST_CLUSTER` folder (3 packs / 287 questions) was excluded completely and is reserved for a separate import task. Some HSTU paper records cite a compilation whose title mentions GST but remain institutionally HSTU-specific.
- The bundle now contains **217 packs / 13,609 questions** across 7 institutions. The published preview APK predates this import; a new build/install is required to deliver these banks to devices.

## README showcase — 2026-10-31

- Added three 1080×1920 portrait JPEG composites in `docs/assets/showcase/`: Home, Varsity catalogue and Profile. The layouts use generated abstract brand artwork behind the supplied runtime UI captures; the app interface itself was not redrawn.
- Personal display-name text is replaced with `Learner`. The visible profile counters remain values from the captured local sample profile and are not product-wide usage metrics.
- These assets are for the repository README showcase, not a final Play Console listing package. Google Play highly recommends at least four high-resolution screenshots for app recommendation surfaces; one more authentic runtime screen is needed before preparing that set.

## Verified JU + HSTU question-bank import — 2026-11-01 (separate from JU-U/HSTU-U candidate banks)

- The generated bundle index now contains **118 schema-valid JSON packs / 7,836 questions**: DU 2/180, RU C 44/4,009, RU-V 15/1,828, JU 50/1,526 and HSTU 7/293.
- The latest import added **57 packs / 1,819 questions**. JU spans academic sessions 2010–2011 through 2024–2025 (31 represented session/unit combinations). HSTU includes 2016–2017, 2017–2018 and 2024–2025 only; its 15–20-year collection target remains incomplete.
- All new questions have `contentVerificationStatus: verified`. Answer states were preserved: JU 1,414 verified / 111 unverified / 1 unknown; HSTU 275 verified / 8 unverified / 10 unknown. The combined verified single-choice practice addition is **1,668** (JU 1,393; HSTU 275). Six JU multiple-choice items, 16 JU no-correct-option items and six repeated-option-text warnings were not normalized into different questions or answers.
- Source archive SHA-256: `cd3f0b449ae9cb18a254197dfe557198e2039ab74d4e0ff64e2abf69cd972f1b`. One source ID reused across 24 JU packs was batch-namespaced, with all references updated. The original archive remains unchanged outside the app repo.
- **At the 2026-11-01 checkpoint only**, all 57 JU/HSTU rules remained `unconfigured` and no official pattern had been inferred. This historical snapshot is superseded by the 2026-11-05 source-backed metadata update above. Current exact-paper behavior must use only the corresponding paper's own count and duration; global defaults do not apply to exact papers.
- Validation: 57/57 new packs pass with 0 errors / 125 warnings. The pack index has 118 imports. Full fresh SQLite dry-run imported all 118 packs with zero failures: 7,836 questions, 31,344 options, 168 source documents, 7,836 appearances and 5 institutions. All 57 new packs re-imported idempotently.
- The Muse archive was reported verified by the user; question-by-question re-verification was intentionally not repeated. Per-question answer verification fields remain the practice-eligibility source of truth. The published 2026-10-31 preview APK predates this content import; a new Android build/install is needed for the JU/HSTU packs to appear on a device.

## Previous question-bank snapshot — 2026-10-30 (superseded by the JU/HSTU import above)

This snapshot supersedes the prior RU-V count and import-status checkpoints further down this file.

- Bundle index: **61 schema-valid JSON packs / 6,017 questions** — 2 DU packs / 180 questions; original RU C candidate bank / 44 packs / 4,009 questions; rebuilt RU-V verified-source bank / 15 packs / 1,828 questions.
- The original RU C candidate bank keeps its separate `ru` institution and 4,009 source-key candidates. Its prior status/asset data is unchanged by this replacement. The new RU-V source-bank operation touched only the 15 `ru-vq-*.json` pack files and their 15 matching paper IDs.
- RU-V institution ID remains `ru-verified-bank`, code `RU-V`, and display name `Rajshahi University — Verified Question Bank`. It contains the 15 source paper/set packs represented in the user-supplied PDF, covering sessions 2016–2017 through 2024–2025 and units A/C/D1/F/H.
- All **1,828 imported questions** have `contentVerificationStatus: verified` and `answerVerificationStatus: verified`. Of these, 1,800 are single-choice with exactly one printed A/B/C/D key; 22 preserve the source `X` marker as `answerDisposition: no_correct_option` with no correct option; and 6 preserve complete multi-letter source keys as verified `multiple_choice` records. Every imported record has four non-empty options, a subject, and source page/question-number provenance. The user confirmed the source/question content as verified; this import did not perform a second question-by-question fact check. No RU-V record carries `unknown` or `unverified` status.
- The existing single-choice Flash/Standard practice pool contains **1,800 RU-V questions**. The 22 no-correct-option records and 6 multiple-choice records stay in the verified source bank and browse catalogue but are not forced into a single-choice practice mode.
- **154 records are held outside the app packs** in `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/EXCLUSION_MANIFEST.csv`: 36 written-part items, 90 incomplete-option records, 26 with missing extracted option text, and 2 without an extracted answer marker. No missing option or answer was fabricated. Thirty included questions with repeated extracted option text are logged in the external `IDENTICAL_OPTION_TEXT_AUDIT.csv` as extraction/display warnings, not re-labelled unverified.
- A white Sutonny text-shadow on page 137 was incorrectly treated as a section banner in the intermediate extraction. The parser now filters paired shadow copies; page 137 Q4 remains under the Mathematics section and its printed B answer marker is captured. A regression assertion covers this record.
- The previous 15 RU-V packs were backed up outside the repository before replacement. Each new RU-V pack uses `replaceExistingPaperContent: true`: only active question appearances for its own paper are replaced in the import transaction. Old question rows and FK-backed bookmarks/session/answer history are retained; questions removed from the active source bank are no longer discoverable from that paper catalogue or the active practice pool.
- The app still adds no RU-specific time, marking or section-count rule. General Standard Exam remains 100 questions / 60 minutes. Total bundle remains 61 JSON packs.

## What exists and is wired end to end
- **Database/startup**: `DbProvider` (src/db/provider.tsx) opens SQLite, enables WAL, and delegates migrations, profile/session housekeeping and pack synchronization to `src/services/startup.ts`. `app/_layout.tsx` renders the branded Bangla/English setup UI after fonts/language are ready, hides the native splash after the setup screen's first layout, and keeps routes gated until startup completes. Progress uses a separate context. The bundle index is evaluated on demand after the UI has laid out. First-run total import failure has a retry state; returning sync failure is a warning and keeps existing content available. No user-owned database records are cleared.
- **Repositories** (src/repositories): content (catalogue, eligibility, question loading, rule resolution), sessions (Flash/exam persistence, exactly-once exam finalization, history), userData (profile, bookmarks, activity summary).
- **Screens** (app/): Home, Varsity (institutions), Institution detail (papers), Paper detail (rule notice, Flash/Exam/Browse), Medical (papers), subject-filterable Question browser, subject-filterable Flash setup/play, Standard Exam setup/play with one continuously scrollable question list, Result (Flash and Exam, with exam answer review), Profile (name, language, default timer, target category, real progress, imported packs), Bookmarks, History, Engineering (clearly marked Coming Soon).
- **Flash Question**: one question at a time, 30 s default and configurable (5-600 s) timer, wall-clock deadlines refreshed on app foreground, no repeats until the pool is exhausted then reshuffle, answer/feedback/next/skip/finish, tap-vs-timeout race guarded, unlimited continuation, results with counts/accuracy/score/advice, persisted history.
- **Standard Exam**: exact-paper runs use the paper's configured question count, duration and optional subject-selection rule; general all-catalogue runs retain a 100-question/60-minute fallback. Questions render in one virtualized, continuously scrollable list grouped by canonical subject order (Physics, Chemistry, Biology, Higher Mathematics, Bangla, English, ICT), with source order preserved inside each subject. Options are selectable in place; a serialized write queue preserves rapid answer changes and is drained before finalization. A persistent Submit action, answer clearing, unanswered confirmation, timeout auto-submit, exactly-once finalization, resume and results use the original session question IDs/deadline. DU question-bank practice currently uses four complete 15-question sections (60 MCQs, 45 minutes); the source rule is `illustrative`, because the official DU 2025–2026 notice also requires a 40-mark written section, 45 minutes. This is not the complete official DU exam simulation.
- **Scoring and candidate practice**: the default verified pool requires verified content and answer key, single-choice type, 2+ options and one correct option. A separate, explicit provisional path is available only when the selected scope has no verified-eligible items; it admits structurally safe unverified single-choice candidates, clearly labels feedback/results, preserves `unverified`/`unknown` states, and does not invent official rules. Candidate-key feedback/accuracy may be wrong. The RU C, JU-U and HSTU-U banks contribute 3,991, 4,780 and 722 structurally safe candidates respectively; 18 RU C and 42 JU/HSTU candidate records with repeated normalized option text are withheld from provisional scoring but remain browsable.
- **Import**: validator + transactional idempotent importer + startup sync of bundled packs (`src/content/bundledPacks.ts` is generated by `pnpm packs:index`). The current index has **217 packs / 13,609 questions**. It includes the 57 verified JU/HSTU packs (1,819 questions) and the separate JU-U/HSTU-U candidate import (99 packs / 5,773 questions). The verified JU/HSTU answer states and eligibility are unchanged. All candidate content remains unverified, with 5,563 unverified and 210 unknown answer states; 5,502 safe candidates enter only the existing provisional path. The 42 repeated-option candidate records and 19 multiple-choice questions are browse-only for this single-choice engine. All 99 new rules remain unconfigured. Source IDs were namespaced where needed; all references were updated. The three separate GST_CLUSTER packs / 287 questions are reserved for a later import.
- **Paper-specific Standard Exam patterns**: the runtime reads `totalQuestions`, `durationSeconds`, marking values and optional `selectionConfig` from the selected paper rule. DU A Unit question-bank practice uses 60 questions in 45 minutes and requires four of six 15-question subjects; each section must have 15 eligible questions. General all-catalogue practice retains the 100-question/60-minute fallback. The publisher scan is not an official past-paper notice: the [official DU 2025–2026 notice](https://www.du.ac.bd/du_post_details/news/25400) states 60 marks of MCQ plus 40 marks of written questions, with 45 minutes for each part. Because this differs from the scan’s MCQ-only four-of-six pattern, that pattern and its −0.25 penalty remain `illustrative`; the implemented mode is question-bank practice, not the complete official DU admission exam.
- **Localization**: Bangla/English dictionary (all keys have both languages and matching placeholders, enforced by a test); language persisted in AsyncStorage and mirrored in the profile table; Bangla digits for numbers.

## Verification results (Node 22.23.1, pnpm 11.10.0)
See the "Verification" section of docs/QA_CHECKLIST.md for the exact commands and outcomes.

## Not done / not verifiable here
- The supplied PDFs are scanned publisher question-bank pages; question/options and printed answer-key letters were transcribed and programmatically cross-checked against each printed key. This batch was not externally fact-checked question-by-question. Some diagram-based choices are represented with text labels where practical. Two items are content-unverified: a figure-only physics question because its diagram is not represented as an asset, and a mathematics formula whose scan is too unclear to guarantee the exact expression.
- **Official DU format mismatch is known**: the scanned publisher MCQ-only practice set differs from the official DU 2025–2026 notice (60 MCQ marks plus 40 written marks, 45 minutes each). The runtime supports the publisher bank’s four-of-six MCQ practice pattern but must not be described as full official DU exam simulation; its rule remains illustrative.
- **Physical Android verification:** the owner reports that the published preview APK installed and worked normally on a physical Android phone. The initial first load took about one minute and subsequent opens took about 2–3 seconds. This is owner-reported device QA, not an emulator/lab run or a separately captured step-by-step test log. The earlier Expo Go SDK mismatch was a development-client issue; the released standalone APK was installed for device verification.
- SQLite runs through expo-sqlite on device; tests use node:sqlite behind the same SqlDb contract.
- The final app name remains provisional (see docs/BRANDING.md).

## RU research and staged data (2026-10-29)

Initial deep web research for **RU Unit A only** is staged outside the app repo at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`. The source ledger covers 2010-2011 through the latest completed 2025-2026 session and records a future 2026-2027 placeholder. Eight review-only sample packs contain 21 questions across sessions 2012-2013, 2013-2014, publisher-labelled 2018, 2019-2020, 2022-2023, 2023-2024, 2024-2025 and 2025-2026. A Unit 2023-2024 and 2024-2025 candidate keys remain unverified; one 2025-2026 answer is unknown. Twelve linked year-specific PDFs (2012-2013 to 2023-2024) were discovered but not downloaded because the Google Drive links are restricted; 2010-2012 archive papers need historical A1-A6 mapping. Two 2025-2026 Group 1/2 scanned PDFs have been archived and visually checked across all seven pages, but neither full paper is transcribed. This is not yet a complete question bank. Details are in the external `RESEARCH_REPORT.md`, `A_UNIT_YEAR_COVERAGE.csv`, `SOURCE_REGISTER_A_ONLY.csv` and `REVIEW/ANSWER_AUDIT_A_ONLY.csv`.

**The separate A-only research sample packs are still not bundled.** The new RU-V PDF import does include the A Unit 2024–2025 sets appearing in that source, but it does not complete the separate historical Unit A ledger. The legacy RU C Science candidates remain the distinct unverified source bank. Preserve set/session variants and do not infer official exam rules.

## RU C Unit Science Group source collection and import staging (2026-10-29)

External workspace: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/`. The public Lokkho index yielded 44 C Unit Science-labelled source variants across sessions 2010-2011 through 2025-2026. Paginated retrieval matched source-reported counts for 44/44 variants: 4,185 source records total. After excluding 18 source rows without usable options, `source-capture/lokkho/` preserves 4,167 usable-option records with all source subject labels.

The curated `import-ready/lokkho/` folder contains 44 schema-v1 candidate packs with 4,009 records labelled Physics, Chemistry, ICT, Biology or Higher Mathematics. Another 158 records with other subject labels (English, Bangla, General Knowledge, civics, statistics, IQ, psychology and finance) remain preserved in `REVIEW/LOKKHO_OFFSCOPE_SUBJECT_AUDIT.csv` pending source-specific historical scope review; no such record was silently discarded. The 18 no-option records are in `REVIEW/LOKKHO_EXCLUDED_INCOMPLETE_ITEMS.csv`. Forty-five image/SVG assets (2,356,641 bytes) are present and all 46 asset references in curated packs resolve.

Validation from `scripts/validate-question-pack.mjs`: 44/44 curated packs pass with 0 schema errors. The validator reported 4,023 warnings: all 4,009 answer keys are unverified, and 14 records have exact duplicate option text. All 4,009 retained question texts and keys remain `unverified`; zero candidate answers were independently checked against an official RU key. The five-subject filter matches the recent C Unit Science structure, but that does not prove identical subject scope for every historical session. The site is third-party, not an official RU paper archive, and source suffixes are preserved rather than inferred to be official group/set names.

The separate 265-page third-party scan indexes 14 variants from 2017-2018 to 2024-2025; full-page and column OCR cover 84 indexed question/key pages, but remain unverified and unmerged. Pages 205-265 are not classified and some historical PDF links are inaccessible. At the initial staging checkpoint, `QuestionCard` did not display `assetPaths`; the subsequent app import added a static local-PNG asset map and question-figure rendering. Android visual verification remains outstanding.

**At the initial staging checkpoint, no RU C Unit Science pack had been copied into app `data/question-packs/` or bundled in `src/content/bundledPacks.ts`.** This historical checkpoint was superseded by the explicit browse/review import recorded later in this document. Do not score or advertise these candidates as verified practice content. Read external `import-ready/README.md`, `research/IMPORT_READINESS.md`, `research/LOKKHO_QUESTION_AUDIT.csv` and this repo's `docs/QUESTION_IMPORT_WORKFLOW.md` for provenance and limits.


## Pre-import repository/status audit — 2026-10-29

- App repository is on `main` with a clean working tree and is **3 local commits ahead of `origin/main`** (`7c928da`, `b1be405`, `de9e409`). Nothing was pushed during this audit.
- Fresh local checks passed: `pnpm test` (54/54), `pnpm typecheck`, `pnpm lint`, `git diff --check`, and validation of both bundled DU A Unit packs (each 0 errors / 0 warnings). The generated bundle index references those two DU packs only.
- Current bundled content remains DU A Unit 2024–2025 and 2025–2026, 90 questions each. **No RU Unit A or RU C Unit content is bundled.**
- RU C Unit Science external staging remains 44 schema-valid candidate packs / 4,009 questions. All question text and answer keys remain unverified; 158 non-core subject-label records require historical/session review; 18 no-option records are separately logged; 14 duplicate-option cases need review. The app renderer still does not display the staged `assetPaths`.
- Release gates remain: source-by-source question and option review, answer-key verification, C Unit scope/duplicate/media review, approved-pack import only after those checks, real Android device QA, and a proper native release build. Expo Doctor was not re-run in this audit; the previously recorded latest attempt was blocked by an Expo API network fetch error.


## RU C Unit Science year-by-year audit-only checkpoint — 2026-10-29

An isolated audit report has been generated outside the app bundle at `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/` (ZIP beside the folder). It indexes all 4,009 candidate questions over 44 packs, 17 academic-session rows (2010-2011 through 2026-2027), 20 partial SattAcademy snapshots, and 14 variants in the third-party scan index. Cross-source/OCR similarity is triage evidence only: 117 high-confidence text matches were found against partial Satt snapshots, 35 answer-text mismatch flags require review, and 278 stems have high text similarity to scan OCR. These are not official question/key verification. **Zero question contents or answer keys were independently verified** in this audit. Exact duplicate option text remains flagged in 14 records. SHA-256 checks show 166 protected source/candidate/asset files unchanged. No existing question file was edited or imported. Details and per-question IDs/scores are in the isolated audit output.


## Latest RU C Unit Science app import — 2026-10-29

- Imported **44 RU C Unit Science candidate packs / 4,009 questions** for browse/review, covering 2010–2011 through 2025–2026. The two existing DU A Unit packs remain, so the generated bundle index has 46 JSON packs and 4,189 total questions.
- Added 45 local PNG figure assets and a generated static Metro asset map; all 46 candidate asset references resolve. QuestionCard now renders local question figures. Image layout still needs Android/device visual QA.
- All 4,009 RU questions retain `answerVerificationStatus: unverified` and `contentVerificationStatus: unverified`. No RU exam rules were inferred or added. The verified-only pool remains zero; the separate provisional pool returns 3,991 structurally safe items after excluding duplicate-option questions.
- The source pack and asset files outside the app were not changed: all 166 protected external files matched pre-import SHA-256 and size checks.
- Verification after import: all 46 JSON packs validate (0 errors, 4,023 expected warnings); this was followed by provisional Flash/Standard integration coverage. Latest automated checks: `pnpm test` 57/57, `pnpm typecheck`, `pnpm lint` and `git diff --check` pass under Node 22.23.1; the current Expo Metro Android development bundle also returned HTTP 200 after compiling 2,042 modules. This is not a native release export. No APK/AAB or physical-device test has been produced.

## Provisional RU C practice recovery — 2026-10-29

At the 2026-10-29 checkpoint, the initial import had a usability gap: Flash and Standard setup only queried the verified pool, so the 4,009 unverified RU C candidates were not usable in either mode. The provisional path was added without promoting any records to verified. At that historical checkpoint, a scope with candidates and no verified-eligible questions could start a general 100-question/60-minute Standard Exam against third-party source keys; the current 2026-11-05 runtime hardening now limits that default to no-exact-paper all-catalogue practice and requires explicit unscored Custom Practice for an exact paper with no usable rule. Institution/paper catalogue entries show candidate counts. Verified-first scopes continue using the strict verified pool; the RU provisional route is not represented as official scoring.

Repository filtering now restricts provisional candidates to single-choice questions with at least two options, exactly one source-key option and no duplicate normalized option text. Current RU C counts: 4,009 imported, 3,991 in the provisional pool, 18 withheld for duplicate option text, zero in the verified-only pool. The answer and content statuses of all 4,009 remain `unverified`, and no RU question count/duration/marking rule is inferred. Flash feedback and result/review screens explicitly call out that the candidate key is unverified; because no RU scoring rule is configured, a normative exam score is not displayed.

Automated verification at this **2026-10-29 provisional-practice checkpoint**: 57 tests passed, typecheck passed, lint passed and diff-check passed under Node 22.23.1. Its release-status sentence predates the 2026-10-31 preview APK release and is superseded by the Android preview summary at the top of this document. The separate RU C figure/content visual-review work remains open.


## Android CI and EAS release setup — 2026-10-31

- Added .github/workflows/ci.yml: triggers on pushes to main, pull requests targeting main, and manual dispatch. It runs frozen pnpm install, tests, typecheck, lint, public Expo config validation and Android expo export --no-bytecode.
- Initialized EAS project @sk_king13/bd-admission-app with ID 16ba69b8-96d7-4856-a197-77acddebe1ec; app.config.js now declares its owner and project ID. eas project:info and resolved Expo config both succeeded.
- Added eas.json: preview creates an internal-distribution APK for phone installation; production creates an Android App Bundle (AAB) and enables version-code auto-increment.
- Added docs/ANDROID_RELEASE.md with the cloud build command, Expo dashboard URL, signing-credential handling, device QA, Play Store and GitHub Releases guidance.
- This was the setup checkpoint before release. It is superseded by the Android preview release record at the top of this document: PR #2 is merged, both CI runs succeeded, the EAS preview APK is published as `v0.1.0-preview.1`, and the owner-confirmed physical-device check is complete.

## Phase 8 content availability (2026-11-13)
Library UI, importer, validator and SVG logo system are implemented. **No book or question content exists**: all five publishers (Udvash, ASPECT, ACS, Pankouri, Joykoli) are metadata-only. Logos: DU/RU/JU SVG and HSTU PNG bundled (sources in assets/universities/SOURCES.md); no publisher logos yet (owner-provided SVGs awaited, slots in assets/publishers/). CI-equivalent Android export with --no-bytecode passed and compiled the Metro/SVG path; a normal bytecode export hit a host Hermes SIGILL. New native dependency react-native-svg still requires a dev-client rebuild and device verification. Details: docs/implementation/PHASE_08_CONTENT_LIBRARY.md.


## Home hero / dark-theme runtime audit — 2026-11-13

- Owner screenshots from `/home/kali/screenshort/admission-runtime/` show two confirmed UI regressions: the Home hero Start practising / Take a mock exam controls have lost their intended button surfaces; Profile progress values (3, 13, 46.2%) render near-black against dark cards.
- Root causes: `HomeHero.tsx` uses callback-valued `Pressable.style` under NativeWind 4.2.7 (unsupported; callback style object is not applied); `Stat.tsx` sends only `text-xl`, replacing `Txt`'s default semantic foreground.
- Hero grew vertically after adding a 78×104dp phone motif, three wrapping feature pills, offline count and a full 52dp secondary CTA. The earlier Phase 7 implementation was more compact. Recommended target: ~190–220dp mobile card, tuned in device QA.
- Existing university assets are compact logos (DU/RU/JU SVG, HSTU 1072×1363 PNG); no landscape cover registry or prior 1024×500 asset was found. A 1024×500 Home cover is the proposed new asset contract, not a verified historic university-cover spec.
- Audit report: `docs/audits/HOME_HERO_RUNTIME_AUDIT.md`. App source/config/release metadata untouched. Verification: `pnpm test` 234/234 under Node 22.23.1. CTA/Stat fixes and device QA remain follow-up implementation work.

## RU unit naming and HSTU paper grouping audit — 2026-11-16

- **Audit only; no app/data changes.** RU-V has two 2024–25 Science question-bank packs incorrectly catalogued as A Unit because the supplied PDF prints Unit A. RU's official 2024–25 circular says A=Humanities, B=Commerce, C=Science; the catalogue-facing label should therefore be C, with the source's printed A preserved in provenance. Each set has 126 bank questions, versus 80 questions in the official exam format, so keep them identified as question-bank sets rather than exact exam sittings.
- Historical RU labels are not globally interchangeable: 2010–13 has split science subunits; the final revised 2014–15 notice says C=Science; 2016–17/2017–18 C=Science; 2018–19 C included Science and Engineering; 2019–25 C=Science. The oldest candidate packs and 2015–16 require source-specific review before relabelling.
- The five duplicated 2024–25 HSTU logical-paper entries (A shifts 1–3 and B shifts 1–2) have been consolidated under the existing canonical IDs. Their 34 additional unique verified questions remain; normal HSTU now has 17 logical papers / 950 questions / 939 verified practice-ready questions. The 105 HSTU-U pending questions and historical unassigned HSTU papers remain separate.
- Across all five HSTU pairs there are no question-ID collisions, no exact normalized stem overlaps and no duplicate subject/question-number positions. The issue is paper identity fragmentation in the importer/catalogue, not duplicate question records. HSTU-U pending records and historical `unassigned` papers must remain separate.
- Node 22.23.1 `pnpm content:check` passed: 217 packs / 13,609 questions, seed 22.68 MiB. Audit report and source links: `docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md`. No code, assets, tests or question packs changed.


## Android preview candidate v0.1.10 — 2026-11-18

- Release identity: app / brand / package version `0.1.10`, Android `versionCode 10`, package `com.admissionbd.app`; existing EAS project, Expo slug and signing identity retained.
- Target: EAS `preview` / `INTERNAL` Android APK, including the approved RU Science content. Production AAB / Play Store submission is out of scope.
- Release status: v0.1.10 / Android versionCode 10 was built through EAS preview (build `64584a92-b1c7-4353-86ef-894152c94550`) and installed/run by the owner on Android. The owner reports normal operation in the checks performed. A few answer explanations have formatting issues; further examples will be collected and fixed together. Automated source gates remain 301/301 tests plus typecheck, lint, content/pack/assets validation, ASPECT attestation and Expo config checks.

## CU A Unit Science — third-pass answer-key review — 2026-11-19

- External package: `/home/kali/gpt-workspace/bd-admission-app-data/CU/CU_Science_AI_Import_Ready_2026-11-19/`; Varsity university catalogue, institution `cu` / `CU`, category `varsity` only. It is not an ASPECT/Library pack.
- Third-pass review covered 721 clean Tier-A candidates with prior AI agreement and owner manual checking. 708 passed and are now `answerVerificationStatus: verified` under the owner-approved standard; 13 remain `unverified` due to a specific ambiguity/transcription defect recorded in the package review. No key mapping or question/option text was changed.
- Final external package status: 26 packs / 2,558 questions / 11,397 options / 68 source docs; answers 2,185 verified / 373 unverified; content 2,558 verified / 0 unverified (owner-confirmed prior Muse AI source review). Validator: 26/26, zero errors, 337 warnings.
- Actual app importer dry-run into fresh in-memory SQLite: all 26 packs accepted; 2,558 questions / 11,397 options / 68 source docs; foreign-key check zero; second import inserted/updated zero and skipped all 2,558. Practice predicates in the dry-run: 2,185 verified-eligible; 307 answer-review candidates.
- CU 2025–26 official exam rule remains incomplete in the app schema; other 25 rules remain unconfigured. No exact CU exam Standard Exam is enabled by this package.
- **Not imported into active app source/seed/device DB.** The owner must approve the flat copy to `data/question-packs/`; no APK, push or deployment occurred. Final third-pass evidence: package `reports/THIRD_PASS_AI_KEY_REVIEW.md` and `review/third_pass_review.csv`. Promotion means answer-key correctness under the owner-approved review standard, not university official-key authentication or full page-by-page transcription verification.
