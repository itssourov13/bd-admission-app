# Implementation log (roadmap phases 1–12)

Statuses: Not Started → In Progress → Implemented → Pending Owner Verification. Nothing here is Verified/Production Ready.

| Phase | Status |
|---|---|
| 1 Loading UI Polish | Implemented — Pending Owner Verification |
| 2 University identity, logos, filters | Implemented — Pending Owner Verification |
| 3 Shared subject selection | Implemented — Pending Owner Verification |
| 4 Configurable marking rules | Implemented — Pending Owner Verification |
| 5 Standard Exam improvements | Implemented — Pending Owner Verification |
| 6 Settings & dark mode | Implemented — Pending Owner Verification |
| 7 Home hero redesign | Implemented — Pending Owner Verification |
| 8 Publications & books library | Foundation implemented; real content delivery/LibraryPack installation incomplete |
| 9 Online + offline content management (optional) | Partially implemented — local contracts only |
| 10 Backend & CMS foundation (optional) | Deferred — contract documented only |
| 12 App-wide multi-select, shared visuals and RU pack externalization | Phase B c5ca075, Phase C fe86f53, Phase D committed locally; implementation, automated checks and documentation committed locally |

## 2026-11-13 — Phase 1
1. Read audit, STARTUP_UI_AUDIT.md, git state (branch feat/import-hstu-verified-answers-2026-11-12, clean tree). Found 15f7602 already covers most of Phase 1.
2. Validated remaining gaps in code; checked Expo SplashScreen docs (fade is iOS-only).
3. Added policy constants/functions + 2 tests; wired escalation timer and Home-ready fallback in `_layout.tsx`.
4. SetupScreen splash-matching first frame; mode-aware hold. Delayed spinner in `LoadingView`.
5. Checks: policy tests 5/5. Details in PHASE_01_LOADING_UI.md.
6. Lightweight checks actually run: `node --test tests/startupUiPolicy.test.ts` 5/5 pass; `tsc --noEmit` no errors; `eslint` on the 5 touched source/test files no findings; `git diff --check` clean. Full suite, builds and device testing NOT run (deferred to owner).

## 2026-11-13 — Phase 2
1. Validated audit §5.3/§5.4 against code and the seed's 7 institution rows; chose derived parent identity (no migration).
2. Added universities.ts, UniversityLogo + empty logo registry, VarsityScreen with filter bar, PoolFilter.institutionIds (repository, routes, setup screens), batched listPapersByInstitutions.
3. Checks run: tests/universities.test.ts 5/5 (incl. repository parity), tsc --noEmit clean, targeted eslint clean. Full suite/device QA deferred.
4. Logos: infrastructure only; authentic artwork needs owner-supplied licensed files.

## 2026-11-13 — Documentation reconciliation (before Phase 3)
1. Verified Phase 1 (0d47ba7) and Phase 2 (e900521) commits exist; working tree was clean.
2. Fixed stale roadmap references with an idempotent one-off script (not the old helper): CURRENT_STATE.md roadmap block now has a status table; TASK_STATE.md obsolete "Next: Phase 2 (not started)" marked superseded and a status summary added; HANDOFF.md obsolete "Next: Phase 2" marked superseded. Historical entries otherwise untouched.
3. Phase 3 marked In Progress.

## 2026-11-13 — Phase 3
1. Inspected the uncommitted working tree (10 modified, 3 new files) against the previous session's report; it matched.
2. Resolved the react-hooks/purity ESLint error in app/exam/setup.tsx: startStandardExam already defaults `now` to Date.now() at call time, so the screen passes undefined. No rule disabled.
3. Reviewed /tmp/phase_docs.py (idempotent, keyed by section header) and used it with a Phase 3 spec; wrote PHASE_03_SHARED_SUBJECT_SELECTION.md.
4. Checks run: tsc --noEmit exit 0; targeted ESLint on 12 touched files exit 0 (no findings); node --test subject-scope + universities + ui-logic 19/19 pass (requires nvm Node v24.21.0; system node lacks TypeScript support). Full suite, builds and device testing NOT run (deferred to owner).
5. Committed locally as feat(practice): phase 3 shared subject selection. Not pushed.

## 2026-11-13 — Phase 4
1. Inspected the uncommitted tree (12 modified, 6 new files); it matched the previous session's report.
2. Audited every built-in profile value against docs/EXAM_RULE_RESEARCH.md: RU/JU stay 'illustrative' (derived correct mark, assumed unanswered), HSTU partial/unscorable, DU all 'secondary'. JU source label now notes the cross-check with a news report.
3. Found and fixed an integration defect: the automatic generic fallback could score Custom Practice and partial-official papers (HSTU). Added isAutoScoringBlocked, wired it into effectiveRule/startStandardExam/picker, added marking.autoUnscored (EN/BN) and a test.
4. Reviewed migration v6, snapshot persistence, deletion (preferences removed, history unaffected), per-university/global defaults and the management screen; removed two unused-symbol lint warnings in app/marking-profiles.tsx.
5. Checks run (Node 22.23.1): node --test tests/marking-profiles.test.ts 13/13 pass; tsc --noEmit exit 0; targeted ESLint on touched files 0 errors; git diff --check clean. Full suite, builds, device tests NOT run (owner).
6. Wrote PHASE_04_CONFIGURABLE_MARKING_RULES.md and committed locally. Not pushed.

## 2026-11-13 — Phase 5
1. Reviewed the exam/result/history screens and practiceService; Phase 3/4 features were not duplicated.
2. Added migration v7 (session_answers.flagged), persistent mark-for-review, retry scope (PoolFilter.retrySessionId + retry route param), pure examReview.ts and ExamPalette.tsx.
3. Exam screen: palette with jump-to-question, flag button, progress line, timer urgency levels, 10/5/1-minute warnings, submit dialog with answered/unanswered/flagged counts. Result: per-subject breakdown, review filters, practice-missed button, section-order numbering. History: score/accuracy line.
4. Checks run (Node 22.23.1): tsc --noEmit exit 0; targeted ESLint on 11 touched files exit 0; node --test exam-review + marking-profiles + repositories + subject-scope 53/53 pass; git diff --check clean. Device tests, full suite, builds NOT run (owner).
5. Wrote PHASE_05_STANDARD_EXAM_IMPROVEMENTS.md and committed locally. Not pushed.

## 2026-11-13 — Phase 6
1. Reconciled Phase 6 status across IMPLEMENTATION_LOG, CURRENT_STATE, TASK_STATE, HANDOFF.
2. Added the theme system (src/settings: palettes, pure model, AppearanceProvider with NativeWind vars), semantic CSS-variable Tailwind colours, dark splash and automatic UI style, and migrated ~20 components to useTheme().
3. Added Settings screen with reusable controls (theme, question text size, motion, haptics, language, Flash default, marking link, content info, version); moved language/Flash controls out of Profile; added expo-haptics.
4. Checks run: settings-theme test 6/6, tsc exit 0, ESLint src+app 0 errors (warnings fixed). Full suite, builds, device tests NOT run (owner).
5. Wrote PHASE_06_SETTINGS_DARK_MODE.md and committed locally. Not pushed.

## 2026-11-13 — Phase 7
1. Added HomeHero (gradient, OMR-bubble and cap motifs built from Views, context line, primary/secondary CTA, resume mode) and replaced the inline hero + separate resume card on Home.
2. Checks run: tsc exit 0; ESLint on touched files exit 0. Device/visual checks NOT run (owner).
3. Wrote PHASE_07_HOME_HERO.md and committed locally. Not pushed.

## 2026-11-13 — Phase 8 (resumed session): reconciliation
1. Inspected the actual working tree on feat/import-hstu-verified-answers-2026-11-12: 5 modified files, 108 insertions / 2 deletions, matching the handoff. Phase 7 (d7c9534) is HEAD.
2. Pre-existing uncommitted Phase 8 work (preserved, not rewritten): migration v8 `publications_library` in src/db/schema.ts (tables publishers, content_books, content_units, content_unit_questions; 5 metadata-only publisher rows: Udvash, ASPECT, ACS, Pankouri, Joykoli; no books, no questions); `PoolFilter.bookId/unitId` in src/types/domain.ts; `bookId`/`unitId` in scopeParams/scopeFromParams (src/features/navigation/links.ts); book-membership + recursive unit filter in filterClauses (src/repositories/content.ts) with the university paper-appearance requirement kept only for non-book scopes; book scope lock in app/flash/setup.tsx.
3. Not yet present at that point: any repository API for publishers/books/units, any UI or routes, any translations, any tests, any pack format to add book content, and book awareness in exam setup / rule resolution / scope labels.
4. Status changed Not Started → In Progress in this log, CURRENT_STATE.md, TASK_STATE.md and HANDOFF.md.

## 2026-11-13 — Phase 8 (completion)
1. Confirmed importer keeps the book-before-units FK ordering; migration v8 and existing library architecture preserved.
2. Added SVG pipeline (react-native-svg 15.15.4, svg transformer, Metro/SVGR config, BrandLogo), fetched DU/RU/JU SVG and HSTU official PNG with source records; publisher slots reserved (no retrievable originals).
3. Added Home entry, publisher category sections, book/unit labels in history/result (batched query), tests.
4. Checks run in implementation session (Node 22.23.1): tsc --noEmit exit 0; ESLint on touched dirs 0 errors; node --test library + brandAssets pass; git diff --check clean. Follow-up verification (Node 24.19.0): CI-equivalent pnpm exec expo export --platform android --no-bytecode PASS and generated the Android JS bundle (3.9 MB), validating Metro + SVG transformer compilation. The default bytecode export separately failed in the host Hermes compiler with SIGILL; no SVG-specific transform error was reported. Full suite, EAS and device QA remain deferred to owner.
5. Wrote PHASE_08_CONTENT_LIBRARY.md. Status: Implemented — Pending Owner Verification.

## 2026-11-13 — Phases 9–10 (optional)
1. Phase 9: partially implemented locally (types, service, repository, 4 tests). Checks: tsc exit 0; node --test contentManager + library + brandAssets 25/25 pass. No remote source, UI, downloader or signature verification.
2. Phase 10: deferred; contract documented in PHASE_10_BACKEND_CMS.md. No backend created or assumed; ScholarHub infrastructure not used.


## 2026-11-13 — Full pre-build verification

1. Used Node 22.23.1 from .nvmrc and pnpm 11.10.0.
2. pnpm test: 211/211 pass; zero failures, cancellations, skips or todos.
3. pnpm typecheck, pnpm lint, and pnpm exec expo config --type public pass.
4. Initial pnpm content:check correctly caught the ignored local seed still at schema v5 while the app was at schema v8. Rebuilt via pnpm content:build from canonical JSON packs; no source question-pack JSON was changed. Subsequent content check passes.
5. SQLite seed: schema v8, quick_check=ok, foreign_key_check=0; 217 pack checkpoints, 13,609 questions and 54,436 options.
6. pnpm exec expo export --platform android --no-bytecode passes: 2,008 modules, 3.9 MB JS, 124 assets including the regenerated seed.
7. No app version/versionCode bump, EAS cloud build, or physical-device QA performed. Current local release remains 0.1.4 / code 5; next preview target is 0.1.5 / code 6.


## 2026-11-13 — EAS preview build submission

1. Prepared release metadata v0.1.5 / Android versionCode 6; validated resolved Expo config retains package com.admissionbd.app and EAS project 16ba69b8-96d7-4856-a197-77acddebe1ec.
2. Committed release metadata as 7798ef1; source tree was clean before submission.
3. Default VCS archive failed at local temporary shallow-clone cleanup with EPERM before an EAS build record existed. Retried with EAS_NO_VCS=1 and EAS_SKIP_AUTO_FINGERPRINT=1; EAS accepted the archive.
4. Submitted internal Android APK preview build 41bd1c7e-9376-41a7-abb0-860ab8031273; status checked once as IN_PROGRESS. Build page: https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/41bd1c7e-9376-41a7-abb0-860ab8031273.
5. No long monitoring, EAS completion claim, APK artifact claim, Git push or device QA was performed.


## 2026-11-13 — Home Hero runtime follow-up and v0.1.6 preview preparation

1. Replaced the missing Hero CTA surfaces with supported static Pressable styling and preserved Start Practising, Mock Exam and Resume routes. Added a compact composite cover/text/action layout using `assets/home/hero-cover.jpg`; the photo is decorative and buttons remain native controls.
2. Fixed Profile Stat foreground in dark theme with an explicit semantic token; no global `Txt` behavior change.
3. Removed one duplicate read-only provisional-only subject-pool count in exam setup; selection/scoring/session logic left unchanged.
4. Removed the unused ESLint-disable directive; updated app/package/brand version to 0.1.6 and Android versionCode 7 for an installable preview update. App ID/EAS project/signing remain unchanged.
5. Verification on Node 22.23.1: 240/240 tests, typecheck, lint, content:check (217 packs / 13,609 questions), Expo public config, Android no-bytecode export and diff whitespace check passed.
6. Updated phase/state/release/QA/handoff documentation and recorded the cover's reference-derived provenance and distribution-rights caveat. Device QA remains owner-pending.
7. No question data, DB schema, marking rules, dependencies or application identity changed; no push.
8. Committed locally as `0c9e90f`; submitted EAS internal Android APK preview build `dcf1b743-ea08-4d27-b01f-82fe26374ffa` (`IN_PROGRESS` at the one-time status check): https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/dcf1b743-ea08-4d27-b01f-82fe26374ffa. No artifact/device QA or long monitoring is claimed.


## 2026-11-13 — v0.1.6 Android preview completion and owner verification

1. EAS Android preview `dcf1b743-ea08-4d27-b01f-82fe26374ffa` completed **FINISHED** at 2026-11-13 11:50:33 UTC / 17:50:33 Asia/Dhaka. Build page: https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/dcf1b743-ea08-4d27-b01f-82fe26374ffa. APK: https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk.
2. Owner installed and ran the APK and reported the previously raised Home Hero/theme/runtime issues fixed, with no currently outstanding app issue. This is owner-reported device QA; handset/OS and exhaustive per-screen matrix were not recorded.
3. Verified pre-existing commits `2f1176b` and `6b7eeac` via `git diff-tree`: both touched documentation paths only; no app source, assets, configuration, dependencies, tests or question data changed. Working tree was clean before this final documentation update.
4. Updated current state, task state, changelog, handoff, Android release guide, QA checklist and the Phase 7/11 implementation records. This finalization contains documentation changes only.
5. Minimal check: `git diff --check` and staged-path scope verification; no source tests were rerun because no application code changed.
6. No push; the owner will push manually.


## 2026-11-17 — Phase 12 handoff: current RU archive decision and Phase C checkpoint

1. Audited the repo, generated seed, pack files, asset paths and external workspaces. The app currently has 44 RU Lokkho packs / 4,009 unverified questions and 15 RU-V verified packs / 1,828 questions (17 source sets); the two families must be archived separately and removed from active app content.
2. Re-verified external Lokkho archive: 44 packs / 4,009 questions / 45 assets / 46 refs; all 90 SHA-256 entries pass. The RU-V external pack archive does not exist yet. Source PDF and RU-V extraction/review workspace are already outside the repo.
3. Phase B is committed as c5ca075. Phase C implementation remains uncommitted; content build/check, asset check, typecheck, lint, 267/267 tests, diff hygiene and Android no-bytecode export passed on Node 22.23.1.
4. Added ADR-035: owner will handle future RU-V-only ASPECT import; no LibraryPack/Library UI work now; Lokkho stays unverified and external; JU/HSTU/DU/other university content remains in the app.
5. Detailed source inventory, schema-v10 migration implications and execution sequence: docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md. Documentation checkpoint only; no packs/assets were moved/deleted and no app code was changed here.

## 2026-11-17 — Library implementation status re-audit

1. Re-inspected Home/Library routes, migration v8, publisher/book/unit repository, LibraryPack schema/validator/importer, Phase 9 contentManager and Phase 10 contract.
2. Confirmed Phase 8 UI/schema/import foundation exists, but there is no real ASPECT book/LibraryPack and no app UI/runtime caller to install a real LibraryPack. All five seeded publishers are metadata-only.
3. Confirmed multiple-answer selection is still single-select, generated image indexing is Lokkho-directory-specific, MathText is intentionally limited to common notation, Phase 9 has no configured source/UI/download manager and Phase 10 is documentation only.
4. Focused tests: 25/25 passed; typecheck and lint passed. No real pack installation, Metro/Android export or physical-device QA was run.
5. Detailed findings and completion sequence: docs/audits/LIBRARY_IMPLEMENTATION_STATUS_AUDIT_2026-11-17.md. This is a documentation-only audit; no code/content/data changed.

## Phase C — shared visual rendering — 2026-11-17

1. Reviewed the uncommitted asset-pipeline work; kept it; added CI asset check.
2. Added `src/services/mathLayout.ts`, `src/components/common/MathBlock.tsx`, `tests/math-layout.test.ts`; integrated in `MathText`.
3. Built the RU-V figure inventory (`docs/audits/RU_V_FIGURE_INVENTORY_2026-11-17.md`) and 20 PDF crops.
4. Checks: see QA_CHECKLIST Phase C. Device QA not run. Details: `docs/implementation/PHASE_C_SHARED_VISUAL_RENDERING.md`.



## 2026-11-17 — Phase D: RU external archive, active-content retirement and migration verification

1. Re-verified both external archives and source reconciliation before removal: Lokkho 44 packs / 4,009 questions / 45 assets / 46 refs / 90 hashes; RU-V 15 packs / 1,828 questions / 17 printed sets / 20 figures / 36 hashes. All original pack/image copies matched byte-for-byte.
2. Removed 44 ru-c-*.json, 15 ru-vq-*.json and 45 Lokkho-only PNGs from active app source. Kept RU branding SVG, all non-RU packs, external PDF, ruv-work and both archives.
3. Regenerated manifest, SQLite seed and asset registry: 158 packs / 7,772 questions / 31,088 options; 2,512 eligible questions; 5 active institutions / 168 papers; no RU batch/question or Lokkho asset references.
4. Added schema v11 tombstone migration for RU/RU-V papers and batches; active catalogue/practice filters exclude retired rows while existing questions, sources, appearances, bookmarks, saved answers, active/completed sessions and results remain readable. Repeated seed-sync/re-delivery tests verify retirement stamps remain set.
5. Added synthetic importer regression coverage to replace reusable behavior from retired-source tests, plus migration/fresh-install tests. Mutation testing confirmed the retired-paper guards are exercised by the new tests.
6. Verification on Node 22.23.1: 282/282 tests; typecheck; lint; content build/check; asset index/check; pack validation (0 errors, 5,085 warnings); archive verifiers and SHA-256 checks; Android no-bytecode Metro export (~4 MB JS); diff check — passed.
7. Physical device/emulator, TalkBack, dark-theme and narrow-width visual QA were not performed. No APK was built/installed for this content/schema change.
8. Current evidence and follow-up: docs/CURRENT_STATE.md, docs/QA_CHECKLIST.md, ADR-037, and docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md.

