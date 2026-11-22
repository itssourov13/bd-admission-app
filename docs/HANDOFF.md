## RU explanation upgrade — checkpoint 3 — 2026-11-22

- RU explanation upgrade — checkpoint 3 (2026-11-22): 364 explanations authored in total; coverage 1,608/4,249 (37.8%), verified 1,558/4,144 (37.6%), 2,586 verified still unexplained. Unfinished; see docs/implementation/RU_EXPLANATION_QUALITY_UPGRADE.md. No push, no APK.

## RU explanation upgrade — checkpoint 2 — 2026-11-22

- RU explanation upgrade — checkpoint 2 (2026-11-22): 280 explanations authored in total; RU coverage 1,529/4,249 (36.0%), verified 1,479/4,144 (35.7%), 2,665 verified still unexplained. Work is unfinished; details and resume steps in docs/implementation/RU_EXPLANATION_QUALITY_UPGRADE.md. Tooling/ledger: bd-admission-app-data/ru-quality-upgrade/. No push, no APK.

# Latest handoff — v0.1.12 APK completed, installed and owner-checked — 2026-11-22

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `feat/import-hstu-verified-answers-2026-11-12`
**Release:** app / brand / package `0.1.12`, Android versionCode `12`, application ID `com.admissionbd.app`.
**EAS target:** `preview` / `INTERNAL` Android APK; existing Expo slug, EAS project ID and managed Android signing identity retained.
**Build ID:** `32339eb3-cef2-45fa-b268-2917fecd82be`
**Build status:** `FINISHED` — 2026-11-22 05:52:33 UTC / 11:52:33 Asia/Dhaka.
**APK:** https://expo.dev/artifacts/eas/TMGMPfAQMCOrlZ4hKHmZSx-iDDCLjN57_FwM5zGA66Y.apk
**Build page:** https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/32339eb3-cef2-45fa-b268-2917fecd82be

## Release and device verification

- EAS build `FINISHED`; the artifact is available at the APK link above. This is an internal preview, not a production AAB or Play Store release.
- Owner installed the APK on an Android device and checked the app. Owner specifically confirms that question reporting works correctly. Exact device model/Android version and a detailed exhaustive case matrix were not recorded.
- Source automated gates before build: full test suite 318/318, focused tests 54/54, TypeScript, lint, Expo install check, `git diff --check` and Expo Doctor 21/21 — all passed on Node 22.23.1.
- Source scope includes CU Bangla localization, Profile shortcut ordering, offline question issue reports, SQLite v13, Profile report management and privacy-bounded JSON export through native Android Sharesheet.
- **Open follow-up RUNTIME-001:** a short perceived delay occurs while the chosen share target (observed with WhatsApp) prepares the shared report. The flow still works; no elapsed time or phase-level instrumentation is available. Do not assume this is an app defect or change code before determining whether the time is spent serializing/writing the file, launching Android Sharesheet, or preparing inside WhatsApp. See [RUNTIME_ISSUES.md](RUNTIME_ISSUES.md).

## Repository state / next agent guidance

- This follow-up is documentation-only. Do not alter app logic, package versions, question data, assets, SQLite schema or EAS credentials as part of recording this device result.
- No push or merge has been performed.
- For RUNTIME-001, first reproduce and capture timestamps around export start, JSON serialization, cache-file write completion, `Sharing.shareAsync` invocation/return and WhatsApp's ready state. Compare a small and larger report set and at least one alternate target (for example Files). Only propose a source change once the slow phase is isolated.
- The exact repeatable EAS workflow, pinned toolchain and host-specific pseudo-TTY upload behavior are in [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md).
---

# Historical implementation handoff — CU localization, Profile ordering & issue reporting — 2026-11-22

*Historical snapshot:* the following handoff predates EAS completion and owner device QA. The current release status is in the handoff above.

**Workspace:** /home/kali/gpt-workspace/bd-admission-app
**Branch:** feat/import-hstu-verified-answers-2026-11-12
**App metadata:** 0.1.11 / Android versionCode 11 (not bumped)
**SQLite:** schema v13
**Status:** Local implementation, final automated verification, documentation and commit 1a76488 are complete. No push and no EAS build.

## Delivered
- CU catalogue display name switches between “চট্টগ্রাম বিশ্ববিদ্যালয়” and “University of Chittagong”.
- Profile shortcut order is Bookmarks, Practice history, Marking rules, Settings, followed by Reported questions.
- Users can report an issue from Browse, Bookmarks, Flash, active Exam and Result. The alert-circle action is directly below Bookmark in a fixed 44px action column. Existing question and A/B/C/D option layout remains separate.
- The report composer captures multiple issue categories and up to 1,000 characters of optional detail; during timed Exam/Flash it explicitly states the timer continues.
- Local SQLite v13 stores one report per canonical question, origin surface and a question snapshot. Reports can be listed, opened, edited and deleted from Profile.
- JSON export uses bd-admission-question-issues schema v1 and hands a UTF-8 cache file to the Android Sharesheet. App/version/platform/language/DB schema, report timestamps/types/notes and question snapshots are included; personal identity and exam attempts/answers are excluded.
- The existing Standard Exam flag remains migration-v7 session_answers.flagged, per session/question, with its original palette/progress/result behavior.

## Final automated verification — Node 22.23.1
- TypeScript tsc --noEmit: PASS (exit 0).
- expo lint: PASS (exit 0).
- expo install --check: PASS — dependencies up to date.
- Targeted issue-report/localization/Profile/Exam/repository/UI suites: **54/54 PASS**.
- Full pnpm test: **318/318 PASS**.
- git diff --check: PASS.
- Expo Doctor: **21/21 PASS**, no issues detected.
- Expo SDK patch line: expo 57.0.33, expo-asset 57.0.21, expo-constants 57.0.24, expo-linking 57.0.14, expo-router 57.0.31, expo-splash-screen 57.0.11, expo-sqlite 57.0.5, expo-sharing 57.0.26, direct @expo/metro-runtime 57.0.18; @expo/cli resolves to 57.0.34.

## Release/device work still pending
1. Create a new Android preview build only when the owner asks; current v0.1.11 installed APK does not include this source change.
2. On a physical device verify layout at narrow and wider widths, the Report sheet while Exam/Flash timers run, valid JSON attachment hand-off and file readability in installed WhatsApp, Telegram, Files/Drive or other chosen targets.
3. A share-sheet opening is not evidence that a recipient received the report. Reports remain stored locally.

---

# Historical handoff — Standard Exam flag / question issue reporting separation audit — 2026-11-22

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `feat/import-hstu-verified-answers-2026-11-12`
**Audited app source:** unchanged from `a636fb8`; prior docs audit commit `3451639`.
**Historical status at that checkpoint:** Follow-up audit and documentation only; it predates the implementation handoff at the top of this file.

## Confirmed existing Exam behavior

- Migration v7 (`exam_answer_review_flag`) adds `session_answers.flagged INTEGER NOT NULL DEFAULT 0`.
- The flag is keyed by exam session and question, not globally. It is used in active Exam question markers/palette/progress/submission warning and retained for the completed Result review's Flagged filter.
- The write requires an active, unexpired session. The feature is independent of answer selection and scoring, and post-finalization updates are rejected.
- `tests/exam-review.test.ts` passes 7/7, including state persistence across reload and finalization.

## Required issue-report separation

- Do not repurpose `session_answers.flagged`, its repository methods, translations, gold flag marker, progress counters or result filter.
- The content issue report is a persistent, global question-level record in its own v13 table/repository; it represents an asserted content defect, not a learner's reminder to revisit an unanswered/uncertain exam question.
- Label it **Report question issue / প্রশ্নে সমস্যা জানান** and use a distinct `alert-circle-outline` / bug-style icon, never a flag glyph.
- The initial audit proposed a separate bottom section for reporting. The owner's final placement decision superseded that proposal: the implemented Report icon is directly below Bookmark in the QuestionCard vertical action stack. It remains separate from the Exam “Flag for review” / “Remove flag” control row. During an active exam the timer continues while the report composer is open.

The original CU/Profile/issue-report analysis, proposed schema and JSON export contract remain in `docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md`. The owner's final placement clarification supersedes the original bottom-section proposal: Report is placed directly below Bookmark, while the Exam Flag remains in its own controls below the options.

**Verification:** `tests/exam-review.test.ts` — 7/7; earlier localization + repository suite — 27/27, all under Node 22.23.1. No full suite, typecheck/lint, APK or device UX test was run. No push.

---

# Historical handoff — Profile actions, CU localization & question issue reporting audit — 2026-11-22

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch / audited HEAD:** `feat/import-hstu-verified-answers-2026-11-12` / `a636fb8`
**Historical status at that checkpoint:** Read-only audit complete; the implementation described in the current handoff above was still pending.

## Findings

1. CU's institution key is normalized correctly to `cu`, but `src/features/catalog/universities.ts` does not contain a CU entry in `KNOWN_UNIVERSITIES`. Therefore Bengali mode falls back to the stored English name. Recommended label: `চট্টগ্রাম বিশ্ববিদ্যালয়`. The existing CU PNG registry is already in place.
2. Profile currently renders Bookmarks → Practice history → Settings → Marking rules. Swap the last two blocks only; keep their labels, icons, handlers and routes.
3. At that historical checkpoint, Shared QuestionCard supported bookmarking but no issue-report action existed. The report table, Profile list, JSON export and share flow have since been implemented.

## Recommended implementation sequence

- **Phase 1:** add CU bilingual display metadata and reorder the two Profile buttons. Keep the changes display-only and add localization/order regression coverage.
- **Phase 2 (historical plan, now implemented):** add append-only SQLite migration v13 and a local issue-report repository; add a distinct report action and bilingual issue composer; show a reported-question count/list under Profile with view, edit and delete. Preserve a question/source snapshot and deduplicate by canonical question ID.
- **Phase 3 (historical plan, now implemented; device verification remains pending):** export a versioned JSON bundle and use the SDK 57-compatible Expo Sharing package to open Android's system Sharesheet. The learner chooses WhatsApp, Telegram, email or another compatible target and confirms the recipient/send action. Do not silently send, mark delivery based only on share-sheet launch, or delete local reports. Keep personal profile/attempt data out of the export.

Detailed schema, proposed JSON format, privacy boundary, Android test requirements, sources and checklist: `docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md`.

**Verification:** reproducible CU display fallback confirmed; focused existing tests `tests/universities.test.ts` + `tests/repositories.test.ts` pass 27/27 under Node 22.23.1. Full suite, typecheck/lint, APK build and physical-device QA were not run for this audit. No push.

---

# Latest handoff — Android preview v0.1.11 with CU — built and owner-tested — 2026-11-19

- **Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
- **Branch:** `feat/import-hstu-verified-answers-2026-11-12`
- **Release:** app / brand / package `0.1.11`, Android `versionCode 11`, package `com.admissionbd.app`.
- **EAS target:** `preview` / `INTERNAL` Android APK, existing Expo slug/project ID/signing identity retained.
- **Source content:** includes 26 CU A Unit packs / 2,558 questions / 11,397 options, official-site CU PNG, existing 46 RU Science packs and separate ASPECT Library content. Combined generated seed: 231 entries / 16,407 questions.
- **Build and device status:** The owner confirms EAS build `8aa4643c-e312-4a0b-af08-9b3f7779b68c` completed, installed the APK on Android, and checked the app successfully. [Open the EAS build page / APK](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c). This is an owner-reported manual smoke check; handset model/OS and exhaustive screen/accessibility coverage were not supplied. No push.

Pre-build source gates: 301/301 tests, typecheck, lint, content check 231 / 16,407, pack validation 230 / 14,579 (0 errors), question assets 65 / 66, resolved Expo config. See `docs/ANDROID_RELEASE.md`, `docs/QA_CHECKLIST.md` and the task at the top of `docs/TASK_STATE.md`.

---

# Latest handoff — CU A Unit Science imported and bundled — 2026-11-19

- **App workspace:** `/home/kali/gpt-workspace/bd-admission-app`
- **Branch:** `feat/import-hstu-verified-answers-2026-11-12`
- **CU package:** `/home/kali/gpt-workspace/bd-admission-app-data/CU/CU_Science_AI_Import_Ready_2026-11-19/`
- **Package ZIP SHA-256:** `0a2b398bbdaf2554ec3cc8ecd8dd1098e282534de686ed24c29d5cdecec521ba`
- **Status:** Imported to Varsity source, generated seed rebuilt, and all automated gates pass. Locally committed; no push.

## Imported content

- 26 CU A Unit packs / 26 papers / 2,558 questions / 11,397 options / 68 source documents, institution `cu` / code `CU`, copied flat into `data/question-packs/`. No name/ID collisions; no existing file overwritten; nothing copied to Library/ASPECT.
- Answer states remain 2,185 verified / 373 unverified; all 2,558 content records remain verified by the previously owner-confirmed Muse AI content review. The app's existing predicates return 2,185 normal practice-eligible questions and 307 structurally safe answer-review candidates. All 26 papers have at least one verified-eligible item, so no CU paper triggers the provisional-only fallback. Unverified answers remain Browse-only for this CU dataset.
- CU 2025–26 rule preserves only the sourced 100-mark / 60-minute facts and is incomplete for the official subject-selection/scoring pattern; its Standard Exam plan remains unavailable. Other 25 rules are unconfigured.
- Added the original University of Chittagong website PNG as `assets/universities/cu.png` (429×581 RGBA, SHA-256 `9cc7ef6e5577c21aa8d6a1f6dea1298a35c032b63abf7388c4dc38c5361d8829`) and registered it in `src/features/catalog/universityLogos.ts`. Metro export confirms the logo is bundled.

## Current bundle and verification

- Varsity source: **230 packs / 14,579 questions / 59,481 options / 7 institutions / 240 papers / 385 sources**.
- Generated content: **231 manifest entries / 16,407 question rows / 66,793 options**, including the separate ASPECT Library publication (1,828 questions / 26 units). Seed schema v12; generated SQLite seed 28.05 MiB (gitignored/local).
- `pnpm test`: **301/301 PASS**; `pnpm typecheck`: PASS; `pnpm lint`: PASS.
- `pnpm packs:validate`: 230 / 14,579, 0 errors / 5,536 warnings; `pnpm question-assets:check`: 65 assets / 66 refs / 65 unique; `pnpm content:check`: 231 / 16,407, up to date.
- SQLite: `quick_check=ok`, foreign-key violations 0; CU rows 2,558 with 2,185 answer-verified / 373 unverified / 0 content-unverified, 26 papers and 26 rule records.
- Android no-bytecode Metro export: **2,044 modules / 147 assets / ~4 MB JS**, including `assets/universities/cu.png` and the 29 MB seed asset. This is not a native APK.

## Scope / handoff

Only CU pack files, the original PNG plus one existing logo-registry entry, generated manifest, three affected integration/seed test files (stale expected counts plus CU regression checks), and focused documentation changed. No app logic, importer, scoring/practice implementation, schema, release version, or Library content was changed.

No APK/EAS build or physical-device QA was performed. The already installed v0.1.10 APK predates this CU addition; a new Android preview build is required to test/distribute the content on a phone. **Commit:** `feat(content): import CU A Unit question bank`. Final worktree is clean. No push.

---

# Latest implementation handoff — RU Science import and Android v0.1.10 preview — 2026-11-18

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `feat/import-hstu-verified-answers-2026-11-12`
**Status:** RU Science content is integrated and committed locally. Android preview candidate is now `0.1.10` / versionCode `10`; EAS `preview` / `INTERNAL` APK delivery is the current task. Nothing pushed.

## Integrated content

- Destination: Varsity / Rajshahi University (`ru`, code `RU`). Added 46 packs and 46 papers containing 4,249 questions, 16,996 options and 90 source documents; 45 referenced PNG assets copied into `data/question-packs/assets/lokkho/`.
- Source labels: 44 C Unit — Science papers, one D1 Unit and one F Unit. The separate D1 Group-1 pack with 197 non-science questions remains excluded. The question-pack schema does not have a separate admission-group column; unit metadata is preserved on each paper.
- Verification: 4,144 questions are verified in both dimensions; 105 remain unverified in both. All original/unresolved keys and statuses are retained. The default RU eligible pool has 4,144; the explicit review predicate admits 86 unresolved candidates. All 105 remain browseable.
- All RU package `examRules` remain empty. No Standard Exam pattern or scoring rule was invented; Custom Practice is available. The existing RU 2024–25 Marking Profile remains independent of paper-rule configuration.

## Bundle and compatibility

- Active university question-pack files: 204 / 12,021 questions. Combined seed: 205 entries / 13,849 question rows / 55,396 options; one ASPECT Library publication and its 1,828 questions/26 units remain separate.
- Seed schema v12, 26,165,248 bytes, seed ID `b8c40409b656a9432ed0`; 65 local assets / 66 references / 65 unique references.
- `ru-sci-*` IDs avoid v11 legacy retirement patterns. Fresh install and v10→v12 upgrade tests confirm all 46 new RU papers active and all old `ru-c-*`/`ru-vq-*` records remain retired/history-preserving.
- No schema migration, runtime importer logic, scoring, exam UI, app identity, Library pack or EAS configuration change. The ignored SQLite seed is a local build artifact; tracked `src/content/bundledManifest.ts` is regenerated.

## Verification

- Package SHA-256 manifest verified before import; no source/destination ID or asset path conflicts.
- Question pack validator: 204 / 12,021; zero errors / 5,199 warnings. Question asset check: 65 assets, 66 refs (65 unique), no missing references.
- `pnpm content:build` and `pnpm content:check`: 205 / 13,849, seed 24.95 MiB.
- Targeted JU/HSTU/RU import and retirement group: 9/9. Full app suite: 301/301.
- TypeScript, lint, Android no-bytecode Metro export (2,043 modules / 146 assets / ~4 MB JS), SQLite `quick_check`, zero foreign-key issues, actual generated seed fresh install, and v10 existing-database upgrade+seed sync all pass on Node 22.23.1.

## Remaining owner release QA

No APK/EAS build or physical Android QA was run. The existing v0.1.9 APK does not include RU Science. A new preview build and owner device checks are required before the user can browse/use this new bundled content on their installed app. No push or deployment was performed.

---

# Release handoff — Android preview v0.1.9 built and owner-tested — 2026-11-18

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app` · **Branch:** `feat/import-hstu-verified-answers-2026-11-12` · local commits only, nothing pushed.

## Release-prep follow-up — 2026-11-18

- **Release metadata:** Expo app version `0.1.9`, Android `versionCode 9`, package `com.admissionbd.app`; resolved Expo config confirms the existing EAS project link.
- **Full verification:** `pnpm test` 301/301; typecheck; lint; content check (159 / 9,600); question-assets check (20/20); owner-attestation check; pack validation (0 errors / 5,085 warnings); Expo config assertion; `git diff --check` all pass on Node 22.23.1.
- **Test expectation reconciliation:** the full-suite reruns exposed eight stale expected values across three test files. They included two JU questions whose correct option duplicates another option's text; the existing runtime eligibility guard correctly excludes both. Current verified eligible counts are 2,510 university-wide, JU 1,396, HSTU 939. The ASPECT upgrade expectation now correctly checks 2 remaining held/unverified records rather than 1,828. Only test expectations changed; app/runtime query logic did not.
- **PDF page 56 Q12:** original source page reviewed. Option C prints `+2/7 k̂`, while the printed working derives `−2/7 k̂`; keep the key withheld. The two held questions remain unverified/unscored.
- **EAS preview build:** `5cdcf931-9b67-46f2-9038-47bb7e144c40` is **FINISHED**. [EAS build page / APK download](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/5cdcf931-9b67-46f2-9038-47bb7e144c40).
- **Owner device check:** owner manually installed and ran v0.1.9 on Android and reports normal operation/no currently observed issue. Further issues, if any, will be noted by the owner. Exact device/OS and exhaustive screen/accessibility coverage are not documented.
- Follow-up changes in release preparation: test expectations, `brand.config.json`, `app.config.js` and documentation only. No app/runtime code, content pack, seed, asset, dependency or EAS credential changed. EAS build was submitted after the owner's instruction. No Git push or merge has been performed.

---


- **Landing/logo:** ADR-040 presentation-layer attribution (`src/features/library/presentation.ts`): the ASPECT-collection book is shown under the ASPECT publisher card, the empty duplicate Unknown card is dropped, stored `pub-unidentified` provenance is unchanged. ASPECT logo bundled as `assets/publishers/aspect.png` (256×256 PNG, byte-identical to the owner's file; kept raster because tracing would lose the fine lettering) and registered in `publisherLogos.ts`. RU logo reuses `assets/universities/ru.svg` via `UniversityLogo`.
- **Session drawers:** `src/components/library/SessionDrawer.tsx` + `src/features/library/sessions.ts` render 9 expandable session cards holding the 17 source-set cards (Set n — name, unit chip, question count). Every session and set has Flash, Timed practice (existing `/exam/setup` Custom Practice, unscored, not an official RU exam) and Browse, scoped by `bookId`/`unitId` (descendants included once).
- **Verification:** owner attestation of 2026-11-18 applied by `scripts/ruv-aspect-attest.mjs`; content version 2, book `verified`/`licensed`; 1,826 questions verified (1,804 scorable incl. 6 multiple-answer, 22 no-correct-option browse-only), 2 conflicting-key questions held unverified/unscored. `ELIGIBLE_SQL` now also excludes any question whose correct option duplicates another option. See `docs/ASPECT_OWNER_VERIFICATION.md`.
- **Performance:** book/unit-scoped queries are driven from the book's membership rows; Flash uses one single-fallback pool query (`countFlashPool`); landing/book counts come from one conditional aggregate; Browse loads its first page without waiting for subject counts and counts subjects in one grouped pass. Host-side medians (3 runs, node:sqlite on a temp seed copy, not a phone): Flash setup whole book 4,580 → 19.6 ms, Browse entry 4,609 → 7.0 ms, Custom pool 2,223 → 23.3 ms, landing 32.8 → 23.1 ms. No new index: measured times did not justify a schema migration. Raw results in `.local/bench-*.json` (git-excluded); `scripts/bench-library.mjs` reproduces them.
- Verification: `pnpm typecheck`, `pnpm lint`, `pnpm content:check` (159 packs / 9,600 questions), `question-assets:check` (20/20), `node scripts/ruv-aspect-attest.mjs --check`, `git diff --check`, focused library/seed/startup/exam/UI-logic tests (60/60 in the library+seed group incl. fresh install, v1→v2 upgrade, repeat sync, newer-edition protection; 149/150 earlier in the wider group, the one failure was a wrong assertion that was fixed and re-run) and the Android Metro no-bytecode export (passed, one ~4 MB Android bundle). No physical-device, TalkBack, light/dark visual or Bangla/English on-screen QA was performed; no APK was built.

## Remaining work
- Owner may continue using v0.1.9 and record any newly discovered issue; the current manual Android smoke check found no issue.
- Owner to push and merge the verified branch, then create GitHub pre-release `v0.1.9` from the merged default-branch commit and attach the APK from the EAS build page. Procedure and release-note guidance are in `docs/ANDROID_RELEASE.md`.
- The two held questions (page 56 no. 12; page 87 no. 65) remain unverified/unscored; page 56 was checked against the original PDF and is contradictory.
- Older sections below that call the ASPECT book unverified/permission-pending are superseded.

---

# Latest implementation handoff — ASPECT Library UX and runtime follow-up — 2026-11-17

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch at audit:** `feat/import-hstu-verified-answers-2026-11-12`
**Audited HEAD:** `c2727b0ce2c7aebe92c911601d0d4fca2b0a9fb7`
**Audit:** `docs/audits/ASPECT_LIBRARY_UX_RUNTIME_AUDIT_2026-11-17.md`

The owner reports the app's general behavior is working and has personally checked the current visual state. The requested changes are limited to the ASPECT Library/publisher presentation, session grouping and actions, imported question verification state, and Library loading performance. This checkpoint performed an audit only; no app code, source pack, SQLite seed, artwork, configuration or APK was changed.

## Findings to implement

- The 1,828-question book is intentionally assigned to `pub-unidentified` and tagged with `collection: ASPECT` under ADR-038. Present this specific collection as the visible ASPECT card and suppress the empty `pub-aspect` placeholder; preserve generic Unknown publisher data unless the owner explicitly identifies ASPECT as the actual publisher/imprint.
- Add the owner-supplied 256×256, 77 KB ASPECT logo as a raster PNG in the publisher registry. Reuse `assets/universities/ru.svg` through the existing `UniversityLogo` component in the RU Library context; the Varsity catalogue already uses it.
- Render nine session accordion/drawer cards containing the existing seventeen source-set child rows. Preserve current unit IDs, question memberships and descendant counts. Align the card composition with the existing university cards.
- Add a session-scoped timed Custom Practice action using the existing `bookId`/`unitId` path. Do not advertise it as an official RU Standard Exam: current source-set pools do not correspond to exact official papers/rules.
- Record the owner's new permission and question-review attestation in provenance and verification metadata. Reconcile the 22 source no-correct answers, 6 multi-answer records, 3 conflicting keys and 11 duplicate-option cases before final scoring eligibility. Existing app-wide multi-select is already implemented.
- Remove the duplicated provisional pool count in Flash setup and optimize book-scoped eligibility/subject counts so the Library does not scan the whole question catalogue unnecessarily.

## Guardrails and verification

Preserve source keys/option ordering, unit/question identities, bookmarks, attempts, sessions and results. Bump the LibraryPack content version for synced metadata/status changes and test fresh install, existing DB upgrade, repeat sync and protection of a newer installed edition. Run focused checks and physical-device Library QA. Do not redesign unrelated screens, introduce generic 100/60 exam defaults for this book, or push the branch.

---

## Handoff — RU-V ASPECT Library bundled integration — 2026-11-17

**Status:** RU-V is bundled as a separate ASPECT Library publication. Implementation and focused automated verification are complete. Release metadata is v0.1.7 / Android versionCode 8. EAS internal APK build `f1584fb8-0be9-4398-a314-d0fc21507603` is **FINISHED** ([build page / logs](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/f1584fb8-0be9-4398-a314-d0fc21507603)). [Download v0.1.7 APK](https://expo.dev/artifacts/eas/2wSz5i5tBMwbqy5BPwu3CAUXn6cJrXmx6fvZZwp6DYU.apk) (121,037,466 bytes (~115.4 MiB); expires 2026-12-01 17:21 Asia/Dhaka). The download endpoint returned HTTP 200. Physical-device install/visual QA remains pending.

- Repository: `/home/kali/gpt-workspace/bd-admission-app`
- Branch: `feat/import-hstu-verified-answers-2026-11-12`
- Source PDF: `/home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf`
- Immutable RU-V archive: `/home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/`
- Reproducible staging: `/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging/`
- App Library pack: `data/library-packs/ruv-aspect-library-pack.json`

### Integrated content

One ASPECT Library book; 17 printed source sets represented by 26 units; 1,828 questions; 7,312 options; 1,828 source explanations; 20 offline figure assets. The 158 university packs / 7,772 university questions remain separate. The generated seed contains 159 bundled entries and 9,600 question rows overall.

Every RU-V question answer/content status is `unverified`. The 1,797 single-choice records with printed source markers are provisional; 31 explicit answer-review records remain browse-only (22 source `×`, 6 multi-answer, 3 source contradictions with keys withheld). Eleven duplicate-option records are additionally withheld from provisional scoring, leaving 1,786 provisional practice candidates. All 1,828 questions remain available to browse. The 154 raw extraction records not included in this pack remain recorded in the exclusion ledger (38 non-MCQ; 116 MCQs without reliably extracted options).

Rights metadata: collection `ASPECT`; publisher/rights holder unidentified; licence not verified; `permission_pending` is stored as informational/non-blocking metadata. No unsupported publisher or licence attribution was invented.

### Seed delivery and regression protection

`build-content.mjs` validates bundled LibraryPacks and incorporates them into the offline SQLite seed. Startup sync creates the Library publisher/book/unit tree and membership in the local DB. The seed-sync version guard runs before any question/source/option writes; a newer installed edition is preserved and the older bundled signature is checkpointed so it is not retried on each launch.

### Verification

- Consolidated focused Library seed, startup, RU-V dry-run, retirement/migration and Library catalogue tests: 35/35 pass, including real-seed fresh install and schema-v10 upgrade with the new Library book.
- TypeScript, lint, content check (159 entries / 9,600 rows), asset check (20/20), Android Metro no-bytecode export, staging SHA-256 (76/76), RU-V archive (36/36), Lokkho archive (90/90) and `git diff --check`: pass.
- The complete application test suite was not run. No native APK or physical-device visual QA was performed; v0.1.6 predates the new seed.

Detailed source, answer-disposition, exclusion and verification notes: `docs/RUV_ASPECT_IMPORT.md`.

---

# Historical handoff — Phase C + Phase D archive implementation — 2026-11-17

Workspace: /home/kali/gpt-workspace/bd-admission-app
Branch: feat/import-hstu-verified-answers-2026-11-12
Phase C commit: fe86f53
Phase D: implementation, automated verification and documentation committed locally. No push.

## Completed implementation

- Both RU datasets have separate external archives. Lokkho: 44 packs / 4,009 questions / 45 images / 46 refs / 90 SHA-256 entries. RU-V: 15 packs / 1,828 questions / 17 printed sets / 20 figure crops / 36 SHA-256 entries. Both verifiers pass.
- All 59 original RU pack JSON files and 45 Lokkho images were byte-for-byte reconciled against the archives before app removal.
- Active app source contains 158 non-RU packs / 7,772 questions / 31,088 options. RU packs and RU-only question images are absent; assets/universities/ru.svg is retained.
- Schema v11 retires pre-existing RU/RU-V papers and batches without deleting question/source rows, bookmarks, saved answers, active/completed sessions or results. Active catalogue and practice queries exclude retired content.
- Verification on Node 22.23.1: 282/282 tests, typecheck, lint, content build/check, asset index/check, pack validation (0 errors), archive verification/SHA-256 and Android no-bytecode Metro export passed.

## Remaining owner verification

No physical Android/emulator test, TalkBack review, dark-theme/narrow-width MathBlock visual QA, or new APK installation was performed. The v0.1.6 APK predates Phase C/D. A new preview APK and upgrade install are required before on-device migration and visual QA can be considered complete.

## Scope boundaries

Historical scope decision at the Phase C/D archive checkpoint: the owner had deferred the RU-V Library import. That deferral is superseded by the current completed bundled integration in the handoff at the top of this file. Lokkho remains unverified and outside ASPECT. JU/HSTU/DU and other university content remain separate. The original RU PDF, extraction workspace, both external archives and assets/universities/ru.svg are preserved.

Evidence: docs/CURRENT_STATE.md; docs/TASK_STATE.md; docs/QA_CHECKLIST.md; docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md; ADR-035 through ADR-037 in docs/DECISIONS.md.

---

# Historical handoff — Publications & Books Library foundation audit — 2026-11-17

> Historical checkpoint only, before the RU-V ASPECT LibraryPack was bundled. The current integration and seed-sync status is in the active handoff at the top of this document.

Phase 8 is implemented as a foundation (screens, v8 schema, LibraryPack schema/validator/importer, book/unit scopes and synthetic tests), but the end-to-end Library is not publication-ready. pub-aspect currently has metadata only; there are no real books or LibraryPacks. installLibraryPack() is not connected to an app UI/runtime content source. Phase 9 has local contracts only; Phase 10 backend/CMS is deferred.

Focused verification: 25/25 Library/content-manager/brand tests, typecheck and lint passed. No real ASPECT pack install, Metro/Android export or device visual QA was run.

App-wide platform work (shared runtime; applies to all university/paper packs, active bundled content, LibraryPacks and future imports):
- Implement type-aware single/multiple choice controls, multi-answer interaction, Flash confirmation, selection persistence/resume, source-backed scoring and result review.
- Generalize stem/option/explanation visual rendering and offline image/diagram asset indexing/validation for every supported content source.
- Add source-driven MathText/matrix/diagram rendering where required and preserve all existing single-choice behavior.
- Test the shared engine against both university-pack and LibraryPack content, including offline bundle and Android visual QA.

RU-V ASPECT content-delivery work (separate from the global platform capabilities):
- Generate one deterministic RU-V LibraryPack with 17 test units.
- Wire an actual bundled/offline pack install path.
- Audit and attach RU-V's own source-specific diagrams/assets and correct its source-specific math content.
- Finish fresh-install/upgrade and book/unit QA before the RU-V catalogue cutover.

RU Lokkho is external archive-only and must not be added as an ASPECT book. Full report: docs/audits/LIBRARY_IMPLEMENTATION_STATUS_AUDIT_2026-11-17.md.

---
# Historical handoff — initial RU source audit and ASPECT proposal — superseded by ADR-035

**Workspace:** /home/kali/gpt-workspace/bd-admission-app
**Branch / HEAD:** feat/import-hstu-verified-answers-2026-11-12 / a5c46ed
**Historical status:** interim source-audit checkpoint before the current Phase B/C and ADR-035 decisions. Use the active handoff at the top of this file instead.

Historical proposal: RU-V's 17 source sets were identified as the only future ASPECT payload. Current ADR-035 defers the Library import to the owner and instead requires both RU pack families to be separately archived and removed from active app content. The existing Lokkho archive now verifies; its app copies remain until cleanup. See the active handoff and audit report at the top of this file.

Phase 8 LibraryPack is a useful foundation for one RU-V book with 17 test units. The shared multi-select engine, scoring/persistence/review, visual-question renderer and validated offline asset pipeline are app-wide requirements under ADR-033; they must support every university pack and LibraryPack, not only RU-V. RU-V-specific work is deterministic question-pack → LibraryPack conversion, its 17 test units and source-specific asset audit, plus a safe RU-V-only existing-database cutover. RU Lokkho is an independent external archive, not a LibraryPack. Read:
- docs/audits/RU_VERIFIED_QUESTION_BANK_SOURCE_AUDIT_2026-11-17.md
- docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md

No question/code/DB/asset changes, no build, no commit, no push in this documentation checkpoint. Full audit is not complete.

---

# Latest implementation handoff — RU/HSTU catalogue correction — 2026-11-16

**Workspace:** /home/kali/gpt-workspace/bd-admission-app
**Branch:** feat/import-hstu-verified-answers-2026-11-12
**Previous HEAD:** 59acc2b (docs: audit RU unit labels and HSTU paper grouping)
**Release baseline:** BD Admission 0.1.6 / Android versionCode 7; app identity unchanged.

## Implemented scope

- RU: only the two 2024–25 RU-V Science packs were changed from catalogue A to C Unit. Source title/printed label remains A in provenance; no other historical RU pack was relabelled.
- HSTU: the 34 verified questions from five import segments now reference the existing canonical 2024–25 A Shift 1–3 and B Shift 1–2 paper IDs. Catalogue total: 17 papers / 950 questions / 939 ready. HSTU-U's 105 pending questions remain separate.
- Preserved canonical HSTU totalMarks=100 partial verified rules; removed duplicate unconfigured alias rules only.
- Added replaceExistingPaperIds for targeted replacement and SQLite migration v9 for already-installed databases. Migration updates legacy paper appearances and active session filters without changing question rows, bookmarks, answers, result JSON or marking-profile snapshots.
- Tests include all five pairs, user-history migration, pack importer scoping and generated-seed replacement metadata.
- Node 22.23.1: focused tests 15/15 pass; full suite passed; typecheck, lint and content build/check passed. The SQLite seed passed quick_check and foreign_key_check.
- No UI, dependencies, app version or unrelated university packs were changed. No APK was built or installed.

## Source cross-check for owner

Please check the five merged HSTU shifts against the original paper/source PDFs, especially the final question numbers and page/source references in each segment. Question IDs, answer keys and source records remain intact so discrepancies can be traced to the correct source batch.

## Commit / device status

- New Android preview is not built or installed; existing installed devices will receive migration v9 only through a new app build.
- Commit will be created after final diff review. No Git push.

Detailed report: docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md.

---

# Previous release handoff — Android preview v0.1.6 — 2026-11-13

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `feat/import-hstu-verified-answers-2026-11-12`
**Release:** BD Admission `0.1.6`, Android `versionCode 7`, package `com.admissionbd.app`.
**Implementation commit:** `0c9e90f` (`feat(ui): finalize home hero runtime fixes`).
**Documentation finalization:** documentation-only; local commit only, not pushed.

## EAS artifact

- Build: `dcf1b743-ea08-4d27-b01f-82fe26374ffa` — **FINISHED** (2026-11-13 11:50:33 UTC / 17:50:33 Asia/Dhaka).
- Build/install page: https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/dcf1b743-ea08-4d27-b01f-82fe26374ffa
- APK: https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk
- Profile: `preview` / `INTERNAL` APK. EAS project ID and existing signing identity are unchanged.

## Owner device verification

The owner confirms the APK was installed and launched successfully. The previously reported Home Hero CTA visibility, dark-theme Profile metric text and related runtime issues are resolved. The owner reports no currently outstanding app issue. This is an owner-reported verification; exact handset/Android version and exhaustive per-screen coverage were not recorded.

## Repository/documentation integrity

- Immediately before this final documentation pass, the working tree was clean.
- The two most recent pre-existing commits, `2f1176b` (`docs: audit ASPECT master QB import readiness`) and `6b7eeac` (`docs: authorize ASPECT master QB offline import`), were inspected with `git diff-tree`. Both changed only `docs/` paths; neither changed app source, assets, config, dependencies or tests.
- The finalization in this task is documentation-only. No app code, release metadata, assets or question data are changed.
- No push is performed. The owner can push the branch when ready.

---

# Handoff addendum — 2026-11-13 (ASPECT Science Master QB approved intake)

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Source directory:** `/home/kali/gpt-workspace/bd-admission-app-data/master-qb/`
**PDF:** `@AdmissionStuffs_Aspect Varsity Solution Master QB - Science.pdf`
**Pages / size:** 1,027 / 464,316,608 bytes
**SHA-256:** `b88b45ed5863385d98a3a43f8232562d51628208d06c0c7a6898bb7f203c83fa`

## Authorization and instruction

The owner confirms the purchased book has full permission for digitisation, transcription, transformation into structured question data, app storage, offline bundling and distribution in BD Admission App. Treat the source as approved for this project. Do not pause for a copyright/permission check or ask the owner to reconfirm.

Watermark is part of the source scan and is not a workflow blocker. Do not spend time removing it. Extract from rendered page images and verify the OCR/transcription visually against those pages.

## App integration

ASPECT publisher is already seeded as `pub-aspect`. Use the existing Phase 8 LibraryPack, validator and transactional importer. The target deliverable is a useful book section containing the Science subject/topic hierarchy, all MCQs/options, answer markers, worked solutions, formulae, diagrams and printed university/year/unit/set references.

Implement any missing math rendering, local asset indexing, structured reference data or library UI support required by the actual source. These are implementation tasks; do not stop at reporting them as limitations.

Set the library pack's `licenseStatus: "licensed"` and record the owner-confirmed permission in `licenseNote`.

## Execution status

- Intake/source/app architecture audit: complete.
- Full page inventory and question extraction: not started.
- Pack generation and import: not started.
- App enhancements and Android QA: not started.

Work in resumable subject/topic batches, maintain a page/question reconciliation ledger, preserve the original source, and document actual counts. Never infer absent answer keys or source facts. Once extraction is complete: validate pack(s), run fresh SQLite import and idempotency tests, content build/check, full automated tests, and Android visual review.

Detailed plan: `docs/audits/ASPECT_MASTER_QB_IMPORT_AUDIT_2026-11-13.md`.

---

# Historical implementation handoff — 2026-11-13 (v0.1.6 preview preparation; superseded by the verified release handoff above)

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `feat/import-hstu-verified-answers-2026-11-12`
**Previous HEAD before this follow-up:** `2dfd402` (`docs: audit home hero runtime issues`).
**Implementation commit:** `0c9e90f` (`feat(ui): finalize home hero runtime fixes`), local only; not pushed.
**Release candidate:** app/package/brand `0.1.6`, Android `versionCode 7`; package `com.admissionbd.app`; EAS project `16ba69b8-96d7-4856-a197-77acddebe1ec`. The `preview` profile remains INTERNAL APK and the existing EAS-managed signing identity is retained.

## Implemented

- HomeHero uses a decorative 782×382 landscape cover crop from the owner-supplied UI/UX reference, with a navy text scrim. Actual app text and interactive actions render natively below the photo; buttons stay responsive and preserve existing routes/resume behavior.
- Removed callback-valued `Pressable.style` usage that caused NativeWind to drop CTA surfaces.
- Profile Stat values have an explicit semantic foreground in dark mode; no broad `Txt` default change.
- The provisional-only exam setup path reuses one read-only question-pool count instead of issuing the same query twice. No exam selection, eligibility, scoring or session semantics changed.
- Full automated suite: 240/240. TypeScript, lint, content check (217 packs / 13,609 questions), Expo public config, Android no-bytecode Metro export and `git diff --check` passed on Node 22.23.1.

## Release notes / limitations

- The previous v0.1.5 / code 6 EAS preview `35d0f228-a328-4e1c-898d-a853445b00ee` is FINISHED but predates the Home Hero runtime follow-up. APK: https://expo.dev/artifacts/eas/J56SlEhV00jiqA1bmUe6BhQfFLExyGH5UASE5wkprnw.apk.
- EAS preview build `dcf1b743-ea08-4d27-b01f-82fe26374ffa` subsequently completed FINISHED; APK: https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk. See the latest verified handoff at the top of this file.
- The new preview uses version `0.1.6` / Android code `7`; v0.1.5/code 6 must not be reused. EAS account/project and signing identity remain unchanged.
- Current cover is a temporary crop from the owner-provided reference, not a bespoke 1024×500 generated original. English decorative book-spine wording remains; verify quality and rights before a public store distribution.
- Owner subsequently installed and ran v0.1.6 and reported the previously raised issues fixed with no current outstanding issue; exact handset/OS and exhaustive per-screen coverage were not recorded.
- No Git push, production AAB or Play Store submission is included.

## Commands

Use Node 22.23.1 (`.nvmrc`). Preview APK command: `EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 pnpm dlx eas-cli@latest build --platform android --profile preview --non-interactive --no-wait`.

---

## Current handoff — 2026-11-11 (v0.1.4 release baseline; startup UI targeted fix)

**Workspace:** /home/kali/gpt-workspace/bd-admission-app
**Branch:** fix/profile-persistence-math-render-exam-rules-2026-11-05
**Previous seed implementation commit:** 2370513 (local; no push).
**v0.1.4 seed-path fix commit:** 8855821 (local historical commit; no push). The current startup UI changes are committed separately after their verification.
**Current app candidate:** v0.1.4 / Android versionCode 5. EAS preview build 040c75b2-0bbd-47b5-b859-cdb7f179f968 is FINISHED. EAS v0.1.4 preview build 040c75b2-0bbd-47b5-b859-cdb7f179f968 completed successfully (FINISHED) on 2026-11-05 at 14:59:43 UTC / 20:59:43 Asia/Dhaka. Build metrics: queue 23m07.529s, worker build 18m48.733s (Gradle phase 17m19.883s), total 42m00.902s. App version 0.1.4, Android versionCode 5, application ID com.admissionbd.app. APK: https://expo.dev/artifacts/eas/ePmli5F3NH4vc9q1RupboKmJbt2FxkI8YdjbMW54-Jo.apk (~112 MiB; 117,408,124 bytes). APK SHA-256: 980cdfdd216ac588148b8d78a079df6660143a35f793d543b24fc25d8bfab670. The embedded assets/content_seed.db is 23,724,032 bytes; its SHA-256 1f26f2eb1ad59b2d3dee7272908bc1e91476452dc1c1035dfb06a60785fbf32e exactly matches the generated source seed. ZIP integrity passed, SQLite quick_check is ok, user_version=5, and foreign_key_check reports zero violations. Seed catalogue counts: 217 exam papers/packs, 13,609 questions, 54,436 options, 217 question batches. User-owned bookmarks, profiles and practice-session tables are empty in the bundled seed as expected.

The owner tested v0.1.3 / code 4 on a physical Android phone. It opens the setup UI but fails while importing the question library. Earlier verification checked the APK's embedded SQLite payload but did not exercise Expo's runtime copy/attach path on a phone; that was an overstatement of readiness. Source audit found that the raw absolute path returned by expo-sqlite.defaultDatabaseDirectory was passed into Expo File's File constructor, which expects a file:/// URI. The fix now constructs the destination with an explicit file URI, converts it back to a raw path for SQLite ATTACH, and uses expo-file-system/legacy copyAsync for Android resource-aware copying. The error screen now displays the underlying native error.

Automated verification for the v0.1.4 seed fix: 139/139 tests, TypeScript, ESLint, content:check, whole-catalog validation, resolved Expo config, Android prebuild and Android Metro export passed. Expo Doctor passed 20/21 checks; the only failure was a non-blocking SDK patch-alignment advisory across five packages. The owner installed and verified v0.1.4 on a physical phone; the v0.1.3 first-import failure is closed for this candidate. The square-flash follow-up now has a targeted UI-readiness fix in the latest source; see the implementation entry below. The separate Expo SDK patch-alignment advisory remains open.

See docs/STARTUP_PERFORMANCE.md, docs/CURRENT_STATE.md, docs/QA_CHECKLIST.md, docs/ANDROID_RELEASE.md and docs/TASK_STATE.md. Do not push.

## Startup UI targeted implementation — 2026-11-11

Returning cold launches no longer mount the full branded SetupScreen. When the local startup mode is classified as returning, AppShell resolves the existing setup-layout gate directly and retains the native splash while SQLite/content synchronization runs. The splash is hidden after Home's initial query has settled and its data-backed or actionable error view has laid out. First-run setup keeps the current branded visuals and now waits for that same Home-ready signal before beginning its completion hold/fade. Fatal startup errors still expose the branded retry UI; the retry action latches it through the next attempt.

The five real stage states and progress model were not changed. Done checkmarks now use a 65 ms stagger / 180 ms native-driver opacity-scale transition, with Reduce Motion unchanged. No additional animation library, dependency, schema, question data or app/version identity was changed.

Verification: 142/142 tests, TypeScript, full lint, content:check (217 packs / 13,609 questions) and Android no-bytecode Metro export (1,853 modules / 3.5 MB JS / 123 assets) pass. No APK was built and no physical-device screen recording was captured in this pass; confirm the exact square-flash outcome on the same phone before calling it fully resolved. Full implementation/audit notes: docs/STARTUP_UI_AUDIT.md and docs/QA_CHECKLIST.md.

## Previous handoff snapshot — v0.1.3 (superseded by the v0.1.4 fix)

**Workspace:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `fix/profile-persistence-math-render-exam-rules-2026-11-05`
**Implementation commit:** `491ab36` (already pushed by the owner).
**Release-preparation commit:** c93c7f3 (local commit; not pushed).
**Previous app candidate:** v0.1.3 / Android versionCode 4; build finished but the owner reported a first-import failure on the phone. Current candidate v0.1.4 / code 5 is tracked above.

The owner has already pushed the correctness implementation and release-preparation commits; PR #6 remains the integration path. Current local HEAD at the start of this task was `34f7420`. The working tree contains the completed seed-startup implementation, verification fixes and documentation updates. The changes are to be committed locally after the final Git/diff review; do not push.

Historical v0.1.3 summary: the seed implementation replaced startup JSON imports with a generated SQLite asset, set-based SQL and bounded transactions while preserving user-owned records. The APK's embedded seed passed package-integrity checks, but the owner subsequently tested it on Android and reported that first question-library import fails. This packaging-only result is not runtime QA. The v0.1.4 source fix and required owner verification are documented in the current handoff at the top.

The finished v0.1.2 APK (build `af78b85f-7a2b-4fba-b693-532c7d218f8b`) contains the correctness branch but predates the seed implementation; it cannot verify the new .db asset path. The v0.1.3 replacement build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd` is `FINISHED`; [download the APK](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk). The APK asset passed package-integrity checks, but the owner later tested it and reported the first question-library import failure on the phone. Background execution is not guaranteed while Android suspends/kills JS; current behavior is bounded foreground retry and transaction-safe recovery on relaunch, not WorkManager/FGS.

See `docs/STARTUP_PERFORMANCE.md`, `docs/CURRENT_STATE.md`, `docs/EXAM_RULE_RESEARCH.md`, `docs/QUESTION_QUALITY_AUDIT.md`, `docs/ANDROID_RELEASE.md` and `docs/QA_CHECKLIST.md`. Run commands with Node 22.23.1.

# Handoff

## Branded startup/setup UI — 2026-11-01

The active branch `feat/import-ju-hstu-unverified-question-banks-2026-11-01` now contains a branded BN/EN setup screen and testable startup progress. It displays the app brand, five startup stages, a question-pack processed counter (question-count weighted overall progress), an offline reassurance, a completion transition and retry state. Accessibility progress semantics, Reduce Motion and scrollable/small-screen layout are included. The generated pack bundle is loaded only after the setup screen's first layout; the route tree still waits for the existing sequential content sync to finish. This is not background sync or a measured import-performance fix.

Audit follow-up corrected React Hooks lint violations and added a test for the UI-before-bundle gate. App version is now `0.1.1` / Android `versionCode 2` (version commit `8b7e79b`). Latest verification: 76/76 tests, typecheck, lint and Android no-bytecode export (2,058 modules / 22 MB JS / 122 assets) pass. EAS internal APK build `b4745dc4-0069-4a86-bb5b-234e5f377dfd` is **finished** for the current source; [open its Expo build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) or [download the APK](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). **Still pending:** owner installation and physical-device setup/update QA. The public `v0.1.0-preview.1` APK is the historical build and does not include the new UI or JU/HSTU packs. Use `docs/QA_CHECKLIST.md` for fresh/returning install checks. Installing over the existing app should retain local data; clearing the primary app's data deletes its local user records.

## README showcase — 2026-10-31

The README now presents three 1080×1920 portrait graphics in `docs/assets/showcase/` (Home, Varsity catalogue and Profile). Each retains actual runtime UI pixels over generated, brand-matched abstract artwork; profile display-name text is anonymized as `Learner`. Visible profile counters are from the captured local sample profile, not product-wide usage metrics. These are README presentation assets, not final Play Console listing screenshots. Before store submission, capture at least one additional authentic runtime screen and prepare the final store assets against the [Google Play preview-asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151).

## Workspace
## Current data handoff — 2026-11-12

At the HSTU verified-import checkpoint on 2026-11-12, the app had 217 packs / 13,609 questions and normal HSTU had 22 paper rows / 950 questions, including 939 verified single-choice questions. The 2026-11-16 follow-up consolidated the five duplicate logical-paper IDs; current normal HSTU has 17 papers with the same question and ready counts. All 664 question IDs in Claude's accepted HSTU ledger are answer/content verified under HSTU: 657 appearances moved from HSTU-U and 7 existing HSTU IDs were updated. HSTU-U retains 105 pending questions; all 116 baseline pending IDs were left unchanged. Full test suite passed 142/142; typecheck, lint, content check and SQLite integrity/FK checks passed. No new APK has been built for this data update. See docs/QUESTION_IMPORT_WORKFLOW.md and docs/TASK_STATE.md.

Target: /home/kali/gpt-workspace/bd-admission-app (independent Git repo; current task branch `feat/import-ju-hstu-unverified-question-banks-2026-11-01`, based on the preceding local JU/HSTU verified-import commit; commit locally only, never push from automation).
ScholarHub (/home/kali/gpt-workspace/scholar-hub) is historical provenance only; there is no runtime/build dependency on it and it must not be edited.

## State

At the 2026-11-12 import checkpoint, the app bundled **217 packs / 13,609 questions** and normal HSTU had 22 paper rows / 950 questions, including 939 verified single-choice questions. After the 2026-11-16 consolidation, normal HSTU has 17 logical papers with unchanged question/ready totals. The accepted Claude ledger's 664 question IDs are fully verified in the normal HSTU catalogue: 657 moved from HSTU-U appearances to HSTU papers and 7 existing HSTU IDs were updated. HSTU-U retains 105 pending questions; all 116 baseline pending questions remain unchanged. JU-U stays at 84 / 5,011 candidates, and other DU/RU/JU data is unchanged. All original candidate-bank rules and the 15 new HSTU paper rules remain unconfigured. No new APK has been built for this import. See docs/QUESTION_IMPORT_WORKFLOW.md for complete source, backup and validation records.

## Run
    source ~/.nvm/nvm.sh && nvm use      # 22.23.1
    pnpm install
    pnpm test && pnpm typecheck && pnpm lint && pnpm doctor
    pnpm android                          # native local run (requires Android toolchain)
    pnpm dlx eas-cli@latest build --platform android --profile preview  # cloud APK build

## Next steps
1. Install the completed EAS v0.1.4 APK from the [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/040c75b2-0bbd-47b5-b859-cdb7f179f968) and complete the physical-device startup UI checklist in `docs/QA_CHECKLIST.md`. Test a fresh database separately from an existing installation; installing over the current app should preserve local data. Do not clear the primary app's local data without accepting that profile/bookmarks/attempts/history will be deleted.
2. The HSTU 2026-11-12 verified import is complete. Await the user’s direction before starting another university’s pending-question work or any further HSTU review.
3. Keep the publisher-derived DU A Unit pattern illustrative: the official DU 2025–2026 notice includes 40 written marks in addition to 60 MCQ marks. The current pattern is a source-bank practice mode only. General scopes retain the 100/60 fallback; new university/session rules must come from the matching primary source.
4. For the next app version, use the EAS `production` profile to create an Android AAB; inspect the artifact and verify target API/versioning.
5. Complete the Google Play listing, production screenshots, privacy policy/data-safety declarations and any account-specific testing/access requirements before Play Console rollout.
6. Keep the final product display name decision in sync with `brand.config.json` and `docs/BRANDING.md`.

## Boundaries
- Do not invent questions, answers, years, sources or scoring rules.
- By default, verified-content/answer single-choice questions with 2+ options feed the verified Flash/Exam pool. RU C and JU-U remain candidate banks; HSTU-U now contains only the 105 retained pending questions. The accepted 664-question HSTU batch is in the normal HSTU verified catalogue.
- Illustrative/unconfigured rules must never be presented as official.

## RU Unit A research checkpoint

Read `/home/kali/gpt-workspace/bd-admission-app-data/ru/README.md`, `RESEARCH_REPORT.md` and `A_UNIT_YEAR_COVERAGE.csv`. Scope is RU Unit A only. Eight external review-only JSON packs contain 21 questions. The year ledger covers 2010-2011 to 2026-2027, but complete transcription is not finished. Twelve linked PDFs for 2012-2013 to 2023-2024 were located but the direct downloads are restricted; two 2025-2026 Group 1/2 scanned PDFs are archived in `sources/2025-2026/`. 2010-2012 combined sources need historical A1-A6 mapping. The separate historical A-only research sample packs remain external; the user-provided PDF import includes the A Unit 2024–2025 sets present in that source. The original RU C Unit Science candidate bank remains separately labelled unverified and available through the provisional-practice path.

Next: acquire/verify each source paper, preserve group/shift/set variants, transcribe every option and source/page reference, and independently review every answer. Only then copy approved full-year/paper packs into `data/question-packs/`, validate, regenerate the index and run importer tests. Do not claim coverage complete until counts and answer states have been compared against original papers.


## RU C Unit Science Group collection and import staging — 2026-10-29

External root: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/`. Read `README.md`, `import-ready/README.md`, `research/IMPORT_READINESS.md`, `research/LOKKHO_COLLECTION_SUMMARY.json`, `research/LOKKHO_QUESTION_AUDIT.csv`, and `research/SCHEMA_VALIDATION_SUMMARY.csv` first. Full paginated Lokkho source capture covers 44 third-party source variants and 4,185 records; count matching succeeded for 44/44 variants. `source-capture/lokkho/` preserves 4,167 usable-option items. `import-ready/lokkho/` contains 4,009 curated science-core candidates across 44 packs; 158 other-subject-label records are held in `REVIEW/LOKKHO_OFFSCOPE_SUBJECT_AUDIT.csv`, and 18 no-option records are logged in the exclusion ledger.

At the initial staging checkpoint, all 44 curated packs passed schema validation with zero errors and 4,023 warnings. All 4,009 content and answer states were unverified; none of the keys had been independently verified against an official RU key. Fourteen records had exact duplicate option text. This pre-import checkpoint was superseded by the browse/review import documented below; answer/key verification and device-level visual QA remain outstanding.

The separate 265-page third-party scan's 14 indexed variants and 84 pages of machine OCR remain unverified and unmerged; pages 205-265 and restricted historical PDF links remain gaps. At the original staging checkpoint, no RU C Unit pack was in the app bundle; that was superseded by the import checkpoint below.


## Latest status audit — 2026-10-29

At the pre-import audit checkpoint, local `main` was three commits ahead of `origin/main`, with only the two DU A packs bundled. That state has since been superseded by the browse/review import recorded below; no push was performed.

**Next content priority:** review original papers and answer keys for the 4,009 already-imported RU C candidates before allowing scored practice; resolve 14 duplicate-option records and assess the 158 held subject labels by historical session. Local image rendering has been added, but its Android visual QA remains outstanding. Keep native release build/device QA open, and confirm the official 2026–2027 circular before configuring rules for that session.


## Latest RU C Unit audit-only handoff — 2026-10-29

Audit output folder: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification/`; ZIP: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/audit-only/2026-10-29-year-by-year-verification.zip`. Read AUDIT_REPORT.md first, then YEAR_BY_YEAR_AUDIT.csv and QUESTION_LEVEL_AUDIT.csv. The pass generated per-year source/count evidence plus 4,009 row-level triage records, 14 duplicate-option records, 35 third-party answer-text mismatch review flags, and 26 exact normalized same-stem overlaps across variant packs. It has not independently verified any question content or answer key. Similarity against third-party snapshots/OCR is not source approval. All 166 protected candidate/source/asset/PDF inputs were SHA-256 identical before and after the audit. No staged question data or app bundle was changed.


## Previous RU C Unit import checkpoint — before separate RU-V source import (2026-10-29)

The app now bundles 44 RU C Unit Science candidate packs containing **4,009 questions** from sessions 2010–2011 through 2025–2026, plus the two DU A packs. There are 45 local PNG figures and 46 resolved asset references. The app index contains 46 JSON packs and 4,189 total questions. Local figures are rendered by QuestionCard via the generated static map in `src/content/questionAssets.ts`; regenerate it with `pnpm question-assets:index` after changing image files, then run `pnpm packs:index` after changing JSON packs.

**Verification boundary:** every imported RU question still has unverified answer and content status; no RU exam rules were added. The verified-only pool remains zero. The app now has a distinct provisional mode for 3,991 structurally safe candidates; the 18 records with duplicate normalized option text are withheld from provisional scoring. Answer feedback and accuracy use the third-party source key, may be wrong, and must not be presented as verified or official scoring. Review original-paper provenance, options/formulae/figures, duplicate options and answer keys before promoting any content to verified status.

At this earlier checkpoint, 46 pack JSON files and the provisional RU mode were verified. That count is superseded by the later separate RU-V PDF import described below. Physical Android QA and the host's known Hermes `SIGILL` release-build issue remain open; no push was performed.

## Latest practice usability fix — 2026-10-29

The previously imported RU C candidates were hidden from both practice modes by the verified-only eligibility query. That gate remains unchanged for normal practice; a separate provisional candidate pool and prominent UI warnings now enable practice where no verified pool exists. Candidate criteria: single-choice, at least two options, exactly one source-key key, no duplicate normalized option text. Current RU pool: 3,991 provisional, 18 withheld, 0 verified. All 4,009 keep their `unverified` states; the app does not configure an official RU scoring rule. Result feedback is explicitly provisional.

Latest tests: 57/57, TypeScript and ESLint pass under Node 22.23.1. Still required: verify original-paper/transcription/answer keys, exercise the actual Android app (including figures and Flash/Standard flows), run a compatible bundle/native release build, and only then release the APK/AAB. Do not push from automation.


## Latest verified-source import handoff — 2026-10-29

The rebuilt RU-V source artifacts are in `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/`. Read `IMPORT_BUILD_SUMMARY.json`, `PACK_RECONCILIATION.csv`, `EXCLUSION_MANIFEST.csv`, `IDENTICAL_OPTION_TEXT_AUDIT.csv`, `extract.py` and `build_verified_packs.py`. The 156-page PDF hash is `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`. The current bundle has 61 pack files / 6,017 question records. RU-V: 15 packs / 1,828 verified source records; 1,800 single-choice questions are practice eligible, 22 explicit no-correct-option records and 6 multiple-choice records are kept verified but out of the single-choice engine. 154 source records are held for written/incomplete extraction reasons. The older RU C candidate bank and DU packs are unchanged.

Focused import tests cover the old/new section separation, import idempotency, provenance and Standard Exam startup. This is the 2026-10-29 RU verified-source handoff checkpoint; its device/release status was superseded on 2026-10-31 by the published Android preview and owner-reported physical-device smoke test recorded at the top of this handoff.

## Roadmap handoff — 2026-11-13

Roadmap work follows the brief in the owner's "Implementation Roadmap & Development Handoff": phases 1–10, no push, testing deferred to the owner. Status table and chronological log: docs/implementation/IMPLEMENTATION_LOG.md. **Phase 1 is Implemented — Pending Owner Verification** (docs/implementation/PHASE_01_LOADING_UI.md). Current branch: feat/import-hstu-verified-answers-2026-11-12. (Superseded: Phase 2 was implemented later the same day; see the Phase 2 note below.) Startup invariants to keep: native splash is held until SetupScreen's first layout (first run/failure/escalation) or Home's first layout (returning, with 4 s fallback); `waitForSetupScreen()` gate must always be released (SetupScreen layout, or directly in returning mode).

Phase 2 (University identity, logos, filters) Implemented — Pending Owner Verification — see docs/implementation/PHASE_02_*.md. Next: Phase 3 (shared subject selection) extends the same scope-param pattern.

## Roadmap handoff — Phase 3: Shared subject selection — 2026-11-13

Phase 3 is implemented and committed locally (not pushed); see docs/implementation/PHASE_03_SHARED_SUBJECT_SELECTION.md for scope, decisions and deferred owner tests. Tests need nvm Node v24.21.0 (system node lacks TypeScript support). **Next: Phase 4 (configurable marking rules).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.

## Roadmap handoff — Phase 4: Configurable marking rules — 2026-11-13

Marking profiles live in src/services/markingProfiles.ts (pure) and src/repositories/marking.ts; sessions snapshot the profile in practice_sessions.rule_profile_json. No built-in profile can be 'verified' because no source states every scoring value. Do not relabel DU (third-party) or derived values as official; re-read the signed JU circular and fetch the official DU circular before upgrading provenance. Automatic profiles never score Custom Practice or partial-official papers. See docs/implementation/PHASE_04_CONFIGURABLE_MARKING_RULES.md. **Next: Phase 5 (Standard Exam improvements).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.

## Roadmap handoff — Phase 5: Standard Exam improvements — 2026-11-13

Phase 5 logic lives in src/services/examReview.ts (pure) and src/components/common/ExamPalette.tsx; flags persist in session_answers.flagged via setExamFlag (guarded like selections). Practice-missed uses PoolFilter.retrySessionId (route param retry). Selection queue, deadlines and finalization were not changed. Palette/warning colours use brand tokens directly and need semantic tokens in Phase 6. **Next: Phase 6 (Settings & dark mode).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.


## Roadmap handoff — Phase 6: Settings & dark mode — 2026-11-13

Status reconciled across IMPLEMENTATION_LOG, CURRENT_STATE, TASK_STATE and HANDOFF: Phases 1–5 Implemented — Pending Owner Verification; Phase 6 In Progress; Phases 7–10 Not Started. Phase 6 work begins from commit 26b704a. Next action: inspect NativeWind/Tailwind/theme.ts/app.config.js/root layout and design the theme system.

Phase 6 is implemented and committed locally (see docs/implementation/PHASE_06_SETTINGS_DARK_MODE.md). Use `useTheme()` from "@/settings" for any colour in style props; never import static colours. Needs a native rebuild (expo-haptics, splash/userInterfaceStyle). Tests/tsc need `nvm use 24`. **Next: Phase 7 (Home hero redesign).** Status table: docs/implementation/IMPLEMENTATION_LOG.md.

Phase 7 implemented and committed locally (docs/implementation/PHASE_07_HOME_HERO.md): src/components/home/HomeHero.tsx. **Next: Phase 8 (Publications & books library).**

## Roadmap handoff — Phase 8 (earlier-session note, superseded below) — 2026-11-13

Phase 8 (Publications & books library) is **In Progress**. Migration v8, PoolFilter.bookId/unitId, route params and the book membership filter were already in the working tree (uncommitted) and are preserved. Remaining work is tracked in docs/implementation/IMPLEMENTATION_LOG.md and, once created, docs/implementation/PHASE_08_CONTENT_LIBRARY.md. Do not push.

## Roadmap handoff — Phase 8 implemented — 2026-11-13

Phase 8 is **Implemented — Pending Owner Verification** and committed locally (not pushed). Remaining owner items: content packs, publisher logo SVGs, device verification, dev-client rebuild (react-native-svg). Phases 9–10 are optional and documented in their own phase files.

## Handoff — optional Phases 9–10 — 2026-11-13

Phase 9 local contracts exist (src/services/contentManager.ts, src/types/content-catalog.ts, src/repositories/installedContent.ts). Next concrete action if continued: owner chooses hosting, then implement a ContentSource adapter, a SHA-256 hasher (expo-crypto is a dependency decision) and a content-management screen. Phase 10 is documentation only.


## Phase 8/9/10 status reconciliation and Metro verification — 2026-11-13

- Required roadmap phases 1–8 are implemented and committed locally; each remains **Pending Owner Verification**. Current branch: feat/import-hstu-verified-answers-2026-11-12; Phase 8 commit ae0e0f5, optional Phase 9/10 commit 543088b; no push.
- Optional Phase 9 is partial local-only contract/service work. It has no concrete SHA-256 provider, remote source, downloader, or UI. Optional Phase 10 is documentation only; no backend/CMS was created or deployed.
- Follow-up check: pnpm exec expo export --platform android --no-bytecode passed on Node 24.19.0 and emitted a 3.9 MB Android JS bundle, validating Metro/SVG transformer compilation. The separate default bytecode export failed in the host Hermes compiler with SIGILL; this is not evidence of an SVG transform defect.
- Still owner-pending: rebuild the dev client for react-native-svg, inspect actual university logo rendering on Android (light/dark), supply content packs and authentic publisher logo files, confirm Bangla publisher names, and perform the planned app/device QA.


## Full pre-build verification handoff — 2026-11-13

- Current branch: feat/import-hstu-verified-answers-2026-11-12. Full pnpm test on Node 22.23.1: 211/211 pass, 0 failures/skips/cancellations/todos. pnpm typecheck, pnpm lint, pnpm exec expo config --type public, pnpm content:check, and Android no-bytecode Metro export also pass.
- A pre-existing ignored assets/content/content_seed.db was schema v5 while LATEST_VERSION is v8. Rebuilt it using pnpm content:build from canonical JSON packs; content check and SQLite integrity now pass. Counts: 217 pack checkpoints, 13,609 questions, 54,436 options; no source question-pack JSON changed. Seed is gitignored and EAS pre-install regenerates it.
- Android no-bytecode export bundled 2,008 modules, 3.9 MB JS and 124 assets including the 24 MB SQLite seed. A prior ordinary local Hermes bytecode export hit host SIGILL; cloud native build remains the definitive build check.
- No code/version changes or EAS build in this task. Current metadata: v0.1.4 / versionCode 5. Next internal preview candidate should be v0.1.5 / versionCode 6. Keep package ID, EAS project ID and signing identity unchanged. Run eas build --platform android --profile preview only after the version change is reviewed; install over the existing app for update/migration QA.


## Android preview candidate v0.1.5 — 2026-11-13

- Release metadata updated: package/brand/Expo app version 0.1.5; Android versionCode 6.
- Previous installable baseline remains v0.1.4 / code 5 until the new EAS preview APK finishes and is inspected.
- Build profile: preview (internal distribution, APK). Preserve application ID com.admissionbd.app, Expo/EAS project ID and EAS-managed signing identity.
- Full source/test gates before this version-only change: 211/211 tests, typecheck, lint, content:check, SQLite integrity, Expo public config and Android no-bytecode export all passed.
- EAS submission result: pending.


## EAS preview v0.1.5 submitted — 2026-11-13

- EAS build ID: 41bd1c7e-9376-41a7-abb0-860ab8031273
- Build page: https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/41bd1c7e-9376-41a7-abb0-860ab8031273
- Status checked once after submission: IN_PROGRESS.
- Target: Android, preview profile, INTERNAL distribution, APK; app version 0.1.5, versionCode 6, application ID com.admissionbd.app.
- Resolved project ID is unchanged: 16ba69b8-96d7-4856-a197-77acddebe1ec. EAS reused the configured remote Android keystore.
- The default VCS archive path failed before build creation while cleaning a temporary shallow Git clone (EPERM unlink in .git/objects/pack). Retry used the documented EAS_NO_VCS=1 project-directory archive path and EAS_SKIP_AUTO_FINGERPRINT=1; EAS accepted the source upload and created the build.
- Release metadata commit: 7798ef1. Build source was submitted from the clean local working tree. This task did not push the new version commit to GitHub.
- Do not start a duplicate build. Wait for this build's result, then inspect the APK and perform update installation/device QA. No APK URL is available yet.


## Phase 11 — Home UX, contrast, university-aware exam (2026-11-13) — IMPLEMENTED, PENDING OWNER VERIFICATION
- Branch `feat/import-hstu-verified-answers-2026-11-12`, base HEAD `2a458ac`. Working tree dirty (Phase 11 code + docs), not yet committed.
- Done: exam-pattern resolver (`src/services/exam.ts`, `PoolFilter.paperIds`, content repository pattern query, `app/exam/setup.tsx`), `>= 100` gates removed, hero/CTA/contrast work with tests. Detail: `docs/implementation/PHASE_11_HOME_UX_AND_EXAM_PATTERN.md`.
- Post-audit fixes: two stale tests updated (university scope now refused without Custom Practice), `use-memo` lint error fixed, `setup.tsx` loading gate added (no Custom-practice flash, no duplicate queries).
- Checks (Node 22.23.1): test 227/227, typecheck, lint, content:check, diff --check all clean. Metro export not run.
- Skipped on purpose: Expo Go `copyAsync` failure (dev-only; use APK/dev client).
- Next: commit locally (no push, no version bump, no EAS build); real-device check of hero (light/dark, Bangla/English), JU/DU/RU/HSTU exam options, setup-screen loading; decide U2 preset and exam-timer re-render fix.

## App-wide audit (read-only) — 2026-11-13 — COMPLETE
- Report: `docs/audits/APP_WIDE_AUDIT.md`. Audit only: no app code, config, dependency or test changed; no tests/lint/typecheck/export/dev server run; Phase 11 working tree preserved (HEAD `2a458ac`, uncommitted).
- Health: **good; no Critical findings; architecture adequate.** Repo is not yet "green" only because of Phase 11 test/lint debt.
- Previous issues: (1) the two failing tests (`tests/repositories.test.ts:170–183`, `tests/ru-verified-bank-import.test.ts:154`) are **stale expectations**; the Phase 11 rule (institution scope never uses generic 100/60; RU/RU-V have no stored exam rule) is correct, so update the tests, do not revert the app. (2) `use-memo` ×2 at `app/exam/setup.tsx:47`: two `.join(",")` calls in the dependency array; use plain key strings. (3) Expo Go `copyAsync` "not writable": Expo Go per-project file-system scope vs `expo-sqlite`'s app-wide `defaultDatabaseDirectory`; the APK path is owner-verified and needs no change.
- Next smallest steps: fix the two tests; fix setup.tsx deps and add a `patternsQuery` loading gate; run `pnpm test && pnpm typecheck && pnpm lint && pnpm content:check` once; reconcile the Phase 11 docs (they still say "In Progress / none yet", which is stale) and commit locally. No push, no version bump, no EAS build.
- Optional later: isolate the exam timer and memoize rows (smoothness), a full-length-practice preset (product decision), an Expo Go note in `docs/EXPO_LOCAL_PREVIEW.md`.

## UI/UX/visual audit (read-only) — 2026-11-13 — COMPLETE
- Report: `docs/audits/UI_UX_VISUAL_AUDIT.md`. No app code changed.
- Verdict: visual foundation good; no Critical findings. Top items: V1 no press feedback on 14 tappable cards (`PressableCard` unused), V2 text-only Result screen, V3 Browse has no search, V4 control borders/chevrons/placeholder below 3:1, V5 white-on-brand500 only 4.51:1.
- Next (priority order): V1 press feedback, V2 result ring/bars, V4/V5 contrast tokens + tests, V3 Browse search, then device checks for V6–V8/V10. Phase 11 commit still pending.

## UI/UX implementation pass — 2026-11-13 — IMPLEMENTED (static/focused checks only), PENDING DEVICE VERIFICATION
- Status table: `docs/audits/UI_UX_VISUAL_AUDIT.md` section 5. Nothing committed/pushed; no version, EAS or signing change; Phase 11 changes preserved.
- Done: V4/V5 contrast tokens; V1 press feedback on all 14 card locations; V2 Result `ScoreRing` + `AccuracyBar` (`src/components/common/ScoreRing.tsx`, Views only); V3 Browse search (debounced, bounded `LIKE` on question text via `src/repositories/search.ts`, optional trailing `search` arg on `listPaperQuestionIds`/`listBookQuestionIds`) + `onEndReached` paging; 4 new i18n keys (`browse.search*`, `browse.clearSearch`); `tests/browse-search.test.ts`.
- Deferred: V6-V10 (device look first); search over option/explanation text or FTS5; Home progress strip.
- Next: device check (light/dark, Bangla/English, large font) of Result ring on Android, Browse search typing/scroll smoothness, press feedback; then commit locally.

## Re-investigation follow-up — 2026-11-13 — FIXED (static/focused checks only)
- Confirmed and fixed: (1) `TextField` border and `ExamPalette` unanswered-cell border now use `colors.outline` instead of `sand300`; (2) Browse stale `loadMore()` failure no longer sets `error` after a newer search/filter (new `src/services/requestGate.ts`, used in `app/browse.tsx`).
- Tests added: `tests/request-gate.test.ts`, source-guard test in `tests/settings-theme.test.ts`. Details: `docs/audits/UI_UX_VISUAL_AUDIT.md` section 6.
- Left unchanged on purpose: `SettingsControls` selected-segment border, native Switch off-track colour.
- Still needs a device: border visibility (light/dark), Browse typing/paging/error behaviour. Nothing committed or pushed; no version/EAS/signing change.

## Preview candidate verification — 2026-11-13

- Final source state verified on Node 22.23.1 / pnpm 11.10.0: full suite **231/231 pass** (0 fail/skip/cancel); `pnpm typecheck`, full `pnpm lint`, `pnpm content:check`, `git diff --check`, and `pnpm exec expo export --platform android --no-bytecode` all pass.
- Content integrity: 217 packs / 13,609 questions; generated SQLite seed 22.68 MiB is current. Android Metro export bundled 2,010 modules into an approximately 4 MB JS bundle. This is a bundling check, not a native APK or device runtime test.
- The two follow-up issues in UI_UX_VISUAL_AUDIT.md section 6 were independently confirmed and fixed: TextField/ExamPalette borders now use `colors.outline`; Browse stale `loadMore` failures are guarded by the request gate. Focused tests passed 13/13 before this full-suite run.
- Previous EAS preview build `41bd1c7e-9376-41a7-abb0-860ab8031273` is now confirmed FINISHED (v0.1.5 / Android versionCode 6), artifact: https://expo.dev/artifacts/eas/YWujsXpdg9loC_JWWtF8aj4hVhaLt_vJ-VuIM3Bz1Kg.apk. This is the earlier pre-UI-implementation build, not the new candidate.
- Device QA remains pending: Result ring rendering, Browse typing/pagination/error recovery, light/dark contrast, Bangla/English and large font layouts. Expo Go tunnel/server is stopped.
- Changes remain local only; no push. Release metadata (`0.1.5`, Android versionCode `6`, app ID `com.admissionbd.app`, EAS project ID) is unchanged.

## New EAS Android preview submitted — 2026-11-13

- Build ID: `35d0f228-a328-4e1c-898d-a853445b00ee`
- Build page: https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/35d0f228-a328-4e1c-898d-a853445b00ee
- Submission accepted by EAS; status at submit response: `NEW` (build not yet completed; no APK artifact URL yet). The command used `--no-wait`; no long-running monitor was started.
- Target: Android `preview` profile, `INTERNAL` distribution, APK; app `0.1.5`, Android versionCode `6`, application ID `com.admissionbd.app`.
- Build message: "App-wide UX polish, browse search and stability fixes". EAS reused the configured remote Android keystore and project ID `16ba69b8-96d7-4856-a197-77acddebe1ec`.
- Source commit: `0b235f2` (`feat(ui): polish admission app experience`). Source upload completed successfully; fingerprint was skipped using `EAS_SKIP_AUTO_FINGERPRINT=1` and project-directory upload was used because the earlier VCS archive path had an EPERM cleanup issue.
- No push. Check this exact build ID for completion; do not start a duplicate build while it is running.


## Home hero runtime audit — 2026-11-13

Audit report: `docs/audits/HOME_HERO_RUNTIME_AUDIT.md`. Current Home screenshot confirms both hero CTA visual surfaces are missing because the Pressables use NativeWind-unsupported callback styles; Profile Stat values lack a semantic foreground when no tone is passed. Hero content is also taller than the previous Phase 7 layout. The university catalogue currently bundles logos, not landscape covers; 1024×500 is a proposed Home hero cover dimension, not a recovered historical source spec. Full suite: 234/234 pass on Node 22.23.1. No app code or release configuration changed. Next implementation order: CTA classes, Stat foreground + regression test, add Home cover, compact responsive hero, then Android device checks (light/dark, BN/EN, large font, both CTA routes). No push.

## Handoff addendum — RU unit and HSTU paper catalogue correction (2026-11-16)

**Implementation report:** docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md

- Historical snapshot only: RU-V's two 2024–25 sets were previously changed to C. The 2026-11-17 source audit found both original PDF headers print Unit A; source-facing catalogue metadata should be A. This is pending correction and not implemented.
- Historical RU structures remain session-specific: 2010–13 split Science subunits; final revised 2014–15 says C=Science; C=Science in 2016–17/2017–18; 2018–19 C includes Science + Engineering; 2019–25 C=Science. Oldest candidate packs/2015–16 still need source-specific confirmation.
- The 34 additional HSTU verified questions now reference the five existing canonical 2024–25 A/B shift papers. Normal HSTU is 17 papers / 950 questions / 939 ready. The five duplicate unconfigured aliases were removed; each canonical partial totalMarks=100 fact remains.
- HSTU-U's 105 pending questions and historical unassigned papers remain separate. No question IDs, stems, options, answer mappings or source locators were rewritten.
- Migration v9 consolidates existing installed databases. Scoped replacement is shared by the pack validator, importer, seed builder and content-build checker to prevent later imports from clearing canonical-paper appearances.
- Node 22.23.1 verification: full suite 244/244, typecheck, lint, content build/check, seed quick_check and foreign_key_check all passed. A new APK was not built; source-PDF cross-check by the owner and on-device migration check remain follow-up steps.


## Android preview delivery — v0.1.10

- Version metadata: `brand.config.json` / `package.json` `0.1.10`; `app.config.js` Android `versionCode: 10`. Package remains `com.admissionbd.app`; EAS project ID and signing identity remain unchanged.
- EAS target: `preview` profile, internal distribution, Android APK. Do not use the production AAB profile for this request.
- Contents: the committed 46-pack RU Science bank is part of the normal combined seed generation. EAS `eas-build-pre-install` hook runs `node scripts/build-content.mjs --ensure`.
- EAS preview build `64584a92-b1c7-4353-86ef-894152c94550` ([build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/64584a92-b1c7-4353-86ef-894152c94550)) is complete; the owner installed and ran v0.1.10 on Android and reports normal operation in the checks performed. A few answer explanations have formatting defects; capture additional examples during use and fix them together in a focused follow-up. No push or merge.


## README and showcase — 2026-11-18

The repository README is now a compact landing page using `docs/assets/brand/readme-banner.png` and four owner-captured Android screens under `docs/assets/showcase/`. The longer product/engineering overview is in `docs/APP_OVERVIEW.md`; source capture mapping and visual-asset notes are in `docs/README_VISUALS.md`. This was documentation/artwork only; no application source or question content changed.

## CU A Unit third-pass handoff — 2026-11-19

- Final package report: `/home/kali/gpt-workspace/bd-admission-app-data/CU/CU_Science_AI_Import_Ready_2026-11-19/reports/THIRD_PASS_AI_KEY_REVIEW.md`; decision ledger: `review/third_pass_review.csv`.
- 721 candidates reviewed; 708 answer status `verified`, 13 held `unverified`. The 13 hold reasons are explicit and should be resolved from clearer source pages/notation before any promotion. Content verification was not changed during that third-pass answer review; it was subsequently set to verified for all 2,558 questions based on the owner-confirmed prior Muse AI review.
- Final package statuses: answers 2,185 verified / 373 unverified; content 2,558 verified / 0 unverified (owner-confirmed prior Muse AI content verification). Validation 26 packs / 0 errors / 337 warnings. Actual importer fresh-DB dry-run passed and is idempotent; foreign-key check zero.
- Dry-run app eligibility: 2,185 normal verified/content-verified eligible; 307 answer-review candidates.
- Owner step remains: review package and approve import. Copy JSON files flat into `data/question-packs/` for Varsity. Do not place in Library. No import/build of active content, no APK, no push/deploy was done.
