# Handoff

## Branded startup/setup UI — 2026-11-01

The active branch `feat/import-ju-hstu-unverified-question-banks-2026-11-01` now contains a branded BN/EN setup screen and testable startup progress. It displays the app brand, five startup stages, a question-pack processed counter (question-count weighted overall progress), an offline reassurance, a completion transition and retry state. Accessibility progress semantics, Reduce Motion and scrollable/small-screen layout are included. The generated pack bundle is loaded only after the setup screen's first layout; the route tree still waits for the existing sequential content sync to finish. This is not background sync or a measured import-performance fix.

Audit follow-up corrected React Hooks lint violations and added a test for the UI-before-bundle gate. App version is now `0.1.1` / Android `versionCode 2` (version commit `8b7e79b`). Latest verification: 76/76 tests, typecheck, lint and Android no-bytecode export (2,058 modules / 22 MB JS / 122 assets) pass. EAS internal APK build `b4745dc4-0069-4a86-bb5b-234e5f377dfd` is **finished** for the current source; [open its Expo build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) or [download the APK](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk). **Still pending:** owner installation and physical-device setup/update QA. The public `v0.1.0-preview.1` APK is the historical build and does not include the new UI or JU/HSTU packs. Use `docs/QA_CHECKLIST.md` for fresh/returning install checks. Installing over the existing app should retain local data; clearing the primary app's data deletes its local user records.

## README showcase — 2026-10-31

The README now presents three 1080×1920 portrait graphics in `docs/assets/showcase/` (Home, Varsity catalogue and Profile). Each retains actual runtime UI pixels over generated, brand-matched abstract artwork; profile display-name text is anonymized as `Learner`. Visible profile counters are from the captured local sample profile, not product-wide usage metrics. These are README presentation assets, not final Play Console listing screenshots. Before store submission, capture at least one additional authentic runtime screen and prepare the final store assets against the [Google Play preview-asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151).

## Workspace
Target: /home/kali/gpt-workspace/bd-admission-app (independent Git repo; current task branch `feat/import-ju-hstu-unverified-question-banks-2026-11-01`, based on the preceding local JU/HSTU verified-import commit; commit locally only, never push from automation).
ScholarHub (/home/kali/gpt-workspace/scholar-hub) is historical provenance only; there is no runtime/build dependency on it and it must not be edited.

## State
The app bundles **217 packs / 13,609 questions**: 180 DU A Unit, 4,009 RU C candidates, 1,828 RU-V verified-source questions, 1,526 verified JU questions, 293 verified HSTU questions, 5,011 JU-U candidates and 762 HSTU-U candidates. The original 57 verified JU/HSTU packs remain unchanged. The 99 newly added unverified packs preserve all 5,773 content statuses as unverified and answer statuses as 5,563 unverified / 210 unknown. Their provisional single-choice pools contain 4,780 JU-U and 722 HSTU-U questions; 42 repeated-option items and 19 multiple-choice items are excluded from provisional single-choice scoring. All 99 paper rules remain unconfigured. Full source archive checksum, round-trip preservation, overlap findings and import checks are in `docs/QUESTION_IMPORT_WORKFLOW.md`. The three dedicated GST_CLUSTER packs / 287 questions were excluded for a separate task. The historical Android preview APK (`v0.1.0-preview.1`) predates the JU/HSTU imports. The finished EAS `v0.1.1` internal build (`b4745dc4-0069-4a86-bb5b-234e5f377dfd`) includes these candidate banks; install it from the [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd). Production AAB and Google Play rollout remain outstanding. EAS project: `@sk_king13/bd-admission-app` (`16ba69b8-96d7-4856-a197-77acddebe1ec`). Read CURRENT_STATE.md, QUESTION_IMPORT_WORKFLOW.md, ARCHITECTURE.md, DECISIONS.md, QA_CHECKLIST.md and ANDROID_RELEASE.md first.

## Run
    source ~/.nvm/nvm.sh && nvm use      # 22.23.1
    pnpm install
    pnpm test && pnpm typecheck && pnpm lint && pnpm doctor
    pnpm android                          # native local run (requires Android toolchain)
    pnpm dlx eas-cli@latest build --platform android --profile preview  # cloud APK build

## Next steps
1. Install the completed EAS v0.1.1 APK from the [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) and complete the physical-device startup UI checklist in `docs/QA_CHECKLIST.md`. Test a fresh database separately from an existing installation; installing over the current app should preserve local data. Do not clear the primary app's local data without accepting that profile/bookmarks/attempts/history will be deleted.
2. Independently verify JU-U/HSTU-U candidate question text, options and source keys against matching original papers/keys; investigate the 42 repeated-option records and cross-bank overlap findings before promoting any item. Keep the HSTU verified-bank historical coverage gap visible and add future source-backed sessions without silently merging candidate records.
3. Keep the publisher-derived DU A Unit pattern illustrative: the official DU 2025–2026 notice includes 40 written marks in addition to 60 MCQ marks. The current pattern is a source-bank practice mode only. General scopes retain the 100/60 fallback; new university/session rules must come from the matching primary source.
4. For the next app version, use the EAS `production` profile to create an Android AAB; inspect the artifact and verify target API/versioning.
5. Complete the Google Play listing, production screenshots, privacy policy/data-safety declarations and any account-specific testing/access requirements before Play Console rollout.
6. Keep the final product display name decision in sync with `brand.config.json` and `docs/BRANDING.md`.

## Boundaries
- Do not invent questions, answers, years, sources or scoring rules.
- By default, only verified-content/answer, single-choice questions with 2+ options feed the verified Flash/Exam pool. RU C, JU-U and HSTU-U have separate candidate banks; provisional practice is available with a prominent warning only when the selected scope has no verified pool, and it uses unverified source keys. Never call those keys/results verified or official.
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
