# Handoff

## README showcase — 2026-10-31

The README now presents three 1080×1920 portrait graphics in `docs/assets/showcase/` (Home, Varsity catalogue and Profile). Each retains actual runtime UI pixels over generated, brand-matched abstract artwork; profile display-name text is anonymized as `Learner`. Visible profile counters are from the captured local sample profile, not product-wide usage metrics. These are README presentation assets, not final Play Console listing screenshots. Before store submission, capture at least one additional authentic runtime screen and prepare the final store assets against the [Google Play preview-asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151).

## Workspace
Target: /home/kali/gpt-workspace/bd-admission-app (independent Git repo; current task branch `docs/release-status-docs-2026-10-31`, based on the live `origin/main` after PR #2 merge; docs-only changes; never push from automation).
ScholarHub (/home/kali/gpt-workspace/scholar-hub) is historical provenance only; there is no runtime/build dependency on it and it must not be edited.

## State
The app bundles **61 packs / 6,017 questions**: 180 DU A Unit, 4,009 questions in the separate original RU C Unit candidate bank, and **1,828 questions** in the rebuilt `RU-V — Rajshahi University — Verified Question Bank`. Every imported RU-V record has content and answer status `verified`, four non-empty options, subject metadata, and source page/question provenance. It includes 1,800 single-choice keys, 22 source `X`/no-correct-option records represented by `answerDisposition`, and 6 multi-letter-key records represented as `multiple_choice`. No RU-V record is tagged `unverified` or `unknown`. The existing single-choice Flash/Standard practice pool has 1,800 RU-V questions; the 28 other verified records remain browsable but are not forced into single-choice practice. The 154 structurally incomplete/written/missing-key source records are in the external exclusion manifest. Source hash and build/reconciliation artifacts are documented in `docs/QUESTION_IMPORT_WORKFLOW.md` and `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/`. The original RU C candidate bank and both DU packs remain unchanged. The 15 RU-V pack replacements preserve question rows and FK-backed bookmarks/session history; active catalogue/practice queries require current paper appearances. No RU-specific duration/marking rules were inferred. The DU four-of-six MCQ-only source pattern remains illustrative because it differs from the official DU 2025–2026 format ([official notice](https://www.du.ac.bd/du_post_details/news/25400)). The Android preview is now published as [GitHub pre-release `v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1) with APK `BD.Admission.v0.1.0.apk` (SHA-256 `da7f928827ae6945eddebedc817dabe2c9b0467240dc0d59ec4a0170d0a14f9d`). EAS preview build ID: `d5e516cd-eefe-44f4-866d-b440ef188da9`. The owner installed and verified the APK on a physical Android device; the owner observed about one minute for the first load and 2–3 seconds on subsequent opens. PR #2 is merged at `3aa125d4e12cdca1702f976f20c1f60a765923d1`; both PR CI and `main` push CI succeeded. This is a GitHub Android preview, not a Google Play production release. The production AAB, Play Console listing, store-specific assets and privacy declarations are still outstanding. EAS project: `@sk_king13/bd-admission-app` (`16ba69b8-96d7-4856-a197-77acddebe1ec`). Read CURRENT_STATE.md, QUESTION_IMPORT_WORKFLOW.md, ARCHITECTURE.md, DECISIONS.md, QA_CHECKLIST.md and ANDROID_RELEASE.md first.

## Run
    source ~/.nvm/nvm.sh && nvm use      # 22.23.1
    pnpm install
    pnpm test && pnpm typecheck && pnpm lint && pnpm doctor
    pnpm android                          # native local run (requires Android toolchain)
    pnpm dlx eas-cli@latest build --platform android --profile preview  # cloud APK build

## Next steps
1. Add future institution/session packs following docs/QUESTION_IMPORT_WORKFLOW.md; the initial DU A Unit 2024–2025 and 2025–2026 packs are already included.
2. Keep the publisher-derived DU A Unit pattern illustrative: the official DU 2025–2026 notice includes 40 written marks in addition to 60 MCQ marks. The current pattern is a source-bank practice mode only. General scopes retain the 100/60 fallback; new university/session rules must come from the matching primary source.
3. The older Expo Go SDK mismatch affected the development-client preview, not the released standalone APK. The owner has already installed and smoke-verified the preview APK on a physical Android phone. Detailed per-control checks that were not separately recorded remain listed in `docs/QA_CHECKLIST.md`.
4. For the next app version, use the EAS `production` profile to create an Android AAB; inspect the artifact and verify target API/versioning.
5. Complete the Google Play listing, production screenshots, privacy policy/data-safety declarations and any account-specific testing/access requirements before Play Console rollout.
6. Keep the final product display name decision in sync with `brand.config.json` and `docs/BRANDING.md`.

## Boundaries
- Do not invent questions, answers, years, sources or scoring rules.
- By default, only verified-content/answer, single-choice questions with 2+ options feed the verified Flash/Exam pool. RU C has a separate provisional path: it is available with a prominent warning only when no verified pool is available in the selected scope, and it scores against a third-party candidate key. Never call those keys or results verified/official.
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
