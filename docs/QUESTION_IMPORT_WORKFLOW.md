## CU A Unit Science — import-ready staged package — 2026-11-19

External package: `/home/kali/gpt-workspace/bd-admission-app-data/CU/CU_Science_AI_Import_Ready_2026-11-19/` (26 schema-v1 packs / 26 papers / 2,558 questions / 11,397 options / 68 source documents). It is prepared for the **Varsity university catalogue**, institution `cu` / `CU`, category `varsity`; it is not a LibraryPack. Once owner-approved, copy `packs/*.json` flat into `data/question-packs/`. Do not copy it under `data/library-packs/`.

The original supplied ZIP and extracted snapshot are preserved unchanged. The prepared copy includes 22 subject-label corrections, 29 batch-scoped source ID rewrites to satisfy the importer's globally unique source ownership contract, and 10 `verified`→`unverified` downgrades for disputed third-source keys. The 721 clean Tier-A AI-solved candidates received a third-pass review: 708 PASS were promoted under the owner-approved two-AI + owner-manual + third-pass standard and 13 HOLD remain unverified. Final answer statuses: 2,185 verified / 373 unverified; content statuses are now 2,558 verified / 0 unverified following the owner-confirmed prior Muse AI source-content verification; 61 keyless. The promotion verifies answer correctness under this project standard, not CU official answer-key authentication. All explanations are null. Twenty-six questions with duplicate option text remain unchanged and are tracked in the review ledger.

Validation and importer evidence: 26/26 schema-valid, 0 errors / 337 warnings; actual app importer accepted all packs on a fresh in-memory SQLite database. First pass inserted 2,558 questions and 2,558 appearances; second pass skipped all 2,558 with zero inserts/updates; `foreign_key_check` returned zero. Post-correction dry-run app predicates: 2,185 verified-eligible and 307 answer-review candidates. Do not treat review candidates as verified answers.

Official CU 2025–26 primary sources confirm 100 total marks, one hour, English compulsory plus any three of Physics/Chemistry/Mathematics/Biology, with section-dependent item weights and wrong-answer deductions. The current schema cannot encode that conditional selection / non-uniform marking model. The prepared 2025–26 rule therefore contains only `totalMarks=100`, `durationSeconds=3600`, status `verified`; required `totalQuestions`, section config and per-question scoring fields are absent, so app Standard Exam remains unavailable/incomplete. The other 25 paper rules remain unconfigured. See `docs/EXAM_RULE_RESEARCH.md` and package `reports/IMPORT_READINESS_AUDIT.md`.

**Import is not yet done.** No app source packs, manifest, SQLite seed, installed database or APK were changed in this staging task. Before a future owner-approved import, check that CU has not already been imported and back up the app content. Then run the normal validation/build/check/test pipeline below. The generated bundle reads JSON files directly from `data/question-packs/`, not from a nested subdirectory.



### Owner-confirmed Muse AI content verification — 2026-11-19

- The owner clarified that Muse AI had already verified source-question content for all 2,558 questions before this staging pass. The upstream snapshot's 928 `unverified` content flags were stale metadata; they were not introduced by the third-pass answer review.
- Corrected the import-ready copy to 2,558 `contentVerificationStatus: verified` / 0 unverified. This changed only the content-status metadata; no question/option wording, order, correct-option mapping, source references or appearances changed. The original source archive and extracted snapshot remain untouched.
- Answer status remains separately controlled: 2,185 verified / 373 unverified. The 13 third-pass HOLD and other answer-key holds are not affected by content verification.

### CU A Unit third-pass answer-key review — 2026-11-19

- Candidate set: 721 clean Tier-A records (`qa_result=agree`, `qa_tier=A`, empty `qa_note`) drawn from the prepared CU Varsity package.
- Third-pass outcome: 708 PASS and promoted to `answerVerificationStatus: verified`; 13 HOLD remain `unverified` because their current stem/options have ambiguous mathematical notation, multiple defensible answers, or incomplete/corrupted text. See package `reports/THIRD_PASS_AI_KEY_REVIEW.md` and `review/third_pass_review.csv`.
- During the third-pass answer review, no `correctOptionIds`, question text, options, option order, source references, appearances, or content-verification fields were modified; the later owner-confirmed content-status correction is documented above. No answer mapping was changed.
- Final package: 2,185 answer verified / 373 unverified; content 2,558 verified / 0 unverified after the owner-confirmed Muse AI correction. Validator warnings remain 337 (answer-key / duplicate-option warnings). Actual app SQLite dry-run: 26/26 imports, 2,558 questions, 11,397 options, 68 source documents; re-import skipped all 2,558 unchanged; foreign-key check 0. The app predicate pool is now 2,185 verified-eligible and 307 answer-review candidates.
- This is answer verification under the owner-approved review standard, not official CU key authentication or page-by-page transcription verification. Import is still pending owner approval and was not performed into app source data or the device DB.

---

## Curated RU Science varsity import — completed — 2026-11-18

**Owner-approved package:** `/home/kali/gpt-workspace/bd-admission-app-data/ru-science-import-ready/` (package v1.0.0; `SHA256SUMS` verified before the app copy).

The package was integrated into `data/question-packs/` as 46 schema-v1 varsity packs for institution `ru` / `RU`, with 4,249 questions, 16,996 options, 90 source documents and 45 PNGs under `data/question-packs/assets/lokkho/`. All batch, paper and question IDs use `ru-sci-*`, deliberately distinct from the v11 retirement families. The 44 C Unit — Science, one D1 Unit and one F Unit paper labels are preserved. The separate non-science 2018–2019 D1 Group-1 pack (197 questions) remains excluded.

The package preserves 4,144 questions with both answer/content state `verified` and 105 with both states `unverified`; no key or verification state changed during import. All 105 remain browseable; the app's default eligible practice pool includes 4,144 and the explicit structural review predicate admits 86 unresolved candidates. All 46 `examRules` arrays are empty. Do not infer official question count, duration, subject quota or marking from the independent RU 2024–25 Marking Profile; paper-specific Standard Exam remains unavailable until exact source-backed rules are added. Custom Practice remains available.

The app source now contains 204 varsity pack files / 12,021 questions. The combined SQLite seed contains 205 bundled entries / 13,849 total question rows / 55,396 options, including the separate 1,828-question ASPECT Library content. Seed schema remains v12. The external raw Lokkho and RU-V archives are unchanged and remain separate; the new `ru-sci-*` varsity set does not revive legacy `ru-c-*` or `ru-vq-*` rows.

**Checks:** 46 package file hashes; no destination asset/ID conflicts; pack validator 204 / 12,021, 0 errors; question asset index 65 assets / 66 refs / 65 unique; content build/check 205 / 13,849; targeted import/migration tests 9/9; full test suite 301/301; typecheck and lint; Android no-bytecode Metro export (2,043 modules / 146 assets / ~4 MB JS); generated seed SQLite `quick_check=ok`, foreign-key check 0; fresh-install and existing v10→v12 seed sync both pass. All checks used Node 22.23.1. Validation reports 5,199 warnings, of which 5,085 predate RU and 114 are the documented RU unresolved/duplicate-option warnings.

No DB schema or runtime importer logic changed. The installed v0.1.9 APK predates this content import; no APK build, physical-device QA, push or deployment was performed in this task.

---

## Historical RU pack archive and retirement checkpoint — 2026-11-17 (superseded narrowly by ADR-041)

Both RU question-pack datasets are archived separately and removed from active app source/bundle:

- RU Lokkho: 44 pack files / 4,009 answer-unverified questions / 45 unique images / 46 references. Archive: /home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/; verifier passes and all 90 SHA-256 entries match.
- RU-V: 15 pack files / 1,828 verified questions representing 17 printed test sets / 20 source-figure crops. Archive: /home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/; verifier passes and all 36 SHA-256 entries match.

All 59 pack files and 45 Lokkho images matched their archive copies byte-for-byte before removal. The generated active bundle now contains 158 non-RU packs / 7,772 questions. Schema v11 retires RU/RU-V content on existing installations without deleting historical/source or user-owned data. The original PDF and ruv-work workspace remain external.

The owner will perform a later Library import. Only RU-V's 17 sets are a future ASPECT target; do not import Lokkho, merge the sources, or migrate JU/HSTU/DU or other university packs into ASPECT. Evidence: docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md.

## Catalogue identity correction — RU session labels and HSTU paper grouping — 2026-11-16

**Status: Implemented.** Detailed source research, per-shift reconciliation, migration and verification: docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md.

> Historical snapshot: the RU C-Unit relabel described in this 2026-11-16 entry is superseded by the 2026-11-17 source audit. The PDF pages 1 and 12 print Unit A; source-facing metadata should be A and is awaiting a data update. The HSTU consolidation below remains current. See docs/audits/RU_VERIFIED_QUESTION_BANK_SOURCE_AUDIT_2026-11-17.md.

- RU: the two 2024–25 RU-V Science question-bank sets now use catalogue C Unit and titles RU C Unit — 2024-2025 — Set মহানন্দা / পদ্মা. The original source-document title that prints RU A Unit is retained; provenance notes explain RU's official A=Humanities, B=Commerce and C=Science mapping. Both remain 126-question practice banks, not official 80-question sittings; no exam scoring rule was configured.
- No broad historical RU rewrite was made. The 2010–13 split Science subunits, revised 2014–15 C=Science structure, unresolved 2015–16 evidence gap and wider 2018–19 C scope remain as recorded in the research report.
- HSTU: the extra 34 unique verified questions now reference the five existing canonical 2024–25 papers (A shifts 1–3, B shifts 1–2). Normal HSTU is 17 papers / 950 questions / 939 ready instead of 22 duplicate rows. The canonical partial verified totalMarks=100 rule remains; only duplicate unconfigured alias rules were removed.
- HSTU-U's 105 pending records, historical HSTU unassigned papers, question IDs, sources and answers remain intact.
- SQLite migration v9 merges the five legacy alias IDs on existing installs and updates only active practice_sessions.filter_json paper references. Result snapshots, profile snapshots, bookmarks, session answers and question rows are preserved.
- The five source packs use replaceExistingPaperIds to restrict replaceExistingPaperContent to their own HSTU-U pending paper. Without this subset, a shared canonical HSTU paper could be wiped during re-import. The validator, importer, seed builder and scripts/build-content.mjs all honor the subset; older packs omitting it retain the original full-pack replacement behavior.

---

## Official marking-rule research and integrity controls — 2026-11-05

See `docs/EXAM_RULE_RESEARCH.md` for the source-by-source findings. The 2024–2025 follow-up added only eight partial verified facts to the existing verified-source banks (three JU rules and five HSTU rules). The separate 99 JU-U/HSTU-U candidate rules remain unconfigured. RU's official 2024–2025 80-question/100-mark pattern is confirmed, but the current C-unit Lokkho captures are 127/128-question aggregate variants, not exact official papers; the rule is documented but not attached to them. Never infer a full per-question score from a component total or treat an aggregate candidate bank as an official sitting.

Rule completeness is independent of source fact verification. `totalMarks` can be stored where official component total is known, while scoring values remain null. Numeric score calculation requires explicit `correctMarks`, `incorrectPenalty` and `unansweredMarks`. Exact-paper timed practice additionally requires that paper's own `totalQuestions` and `durationSeconds`; only global practice uses the generic 100/60 defaults. An explicitly selected Custom Practice option is unscored and must carry its custom marker.

The new read-only scan is available through `pnpm audit:questions`. It reports likely extraction artifacts, repeated option text and other triage candidates across all bundled question packs. Audit flags do **not** prove content is wrong: inspect the exact original page/PDF and answer key before editing or changing verification states. Findings and scope are written to `docs/QUESTION_QUALITY_AUDIT.md`.

# Question import workflow

## Historical RU source audit and future owner-led ASPECT import — superseded for current execution by ADR-035

The historical source-audit outcome remains: the 15 RU-V JSON batches / 1,828 questions represent 17 printed source sets. The owner may later import only those 17 sets as one RU Question Bank under ASPECT. This import is deferred to the owner; do not generate or install a LibraryPack in the current task. Lokkho is a separate unverified dataset and must never be merged with RU-V or added to ASPECT. See current ADR-035.

- The external Lokkho archive now exists and verifies (44 packs / 4,009 questions / 45 assets; 90/90 SHA-256 entries pass). The original app copies still remain and are scheduled for removal together with the RU-V packs under ADR-035. Keep Lokkho out of ASPECT; the existing schema-v10 app installations need a scoped retirement migration that preserves history.
- Preserve original source question IDs, Unit A labels for 2024–25 মহানন্দা/পদ্মা, source hashes, printed question numbers and page references.
- The 15 RU-V batches represent 17 sets; create 17 logical test units, not necessarily 17 JSON batches.
- Multiple-answer interaction/persistence/scoring and image/diagram/math rendering are app-wide shared-engine requirements under ADR-033; they must work across all university/paper packs, active bundled content, LibraryPacks and future imports. RU-V contributes six multiple-choice records and its own source diagrams, but is not the only target.
- Existing ASPECT Master QB permission does not automatically cover separate RU sources; record source-specific licence and attribution evidence.

Source audit: `docs/audits/RU_VERIFIED_QUESTION_BANK_SOURCE_AUDIT_2026-11-17.md`. Historical integration proposal: `docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md` (superseded for current execution by ADR-035). Current archive/removal instructions: `docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md`.

---


## Catalogue identity correction — RU and HSTU — 2026-11-16

**Status: Implemented.** See docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md for session research, five-pair reconciliation and migration tests.

> RU note superseded on 2026-11-17: the source PDF prints Unit A on both 2024–25 sets. Do not treat the C catalogue label below as the current desired state; restoring source-facing A is pending. HSTU implementation remains current.

- RU: the two 2024–25 RU-V Science question-bank sets now use catalogue C Unit and titles RU C Unit — 2024-2025 — Set মহানন্দা / পদ্মা. The original source-document title that prints RU A Unit is retained; provenance notes explain RU's official A=Humanities, B=Commerce and C=Science mapping. Both remain 126-question practice banks, not official 80-question sittings; no exam scoring rule was configured.
- No broad historical RU rewrite was made. The 2010–13 split Science subunits, revised 2014–15 C=Science structure, unresolved 2015–16 evidence gap and wider 2018–19 C scope remain as recorded in the research report.
- HSTU: the extra 34 unique verified questions now reference the five existing canonical 2024–25 papers (A shifts 1–3, B shifts 1–2). Normal HSTU is 17 papers / 950 questions / 939 ready instead of 22 duplicate rows. The canonical partial verified totalMarks=100 rule remains; only duplicate unconfigured alias rules were removed.
- HSTU-U's 105 pending records, historical HSTU unassigned papers, question IDs, sources and answers remain intact.
- SQLite migration v9 merges the five legacy alias IDs on existing installs and updates only active practice_sessions.filter_json paper references. Result snapshots, profile snapshots, bookmarks, session answers and question rows are preserved.
- The five source packs use replaceExistingPaperIds to restrict replaceExistingPaperContent to their own HSTU-U pending paper. Without this subset, a shared canonical HSTU paper could be wiped during re-import. The validator, importer, seed builder and scripts/build-content.mjs all honor the subset; older packs omitting it retain the original full-pack replacement behavior.

## HSTU verified-question import — 2026-11-12

### Source of truth and scope

- Source of truth: /home/kali/gpt-workspace/bd-admission-app-data/answer-verification-2026-11-12/verified/verified-answer-ledger.jsonl (SHA-256: 46725d59532e431e3abde6ba05901baaba0b26aa7fcfeff056379d0444b358fd).
- Imported all **664** unique HSTU question IDs in the accepted Claude ledger. The user explicitly designated Claude's completed verification result as authoritative; this import did not add a separate content-review gate.
- **657** appearances moved from HSTU-U to 15 new papers under the existing HSTU institution. **7** IDs already attached to HSTU received the accepted answer mappings/status update.
- Applied every accepted correct-option mapping and set both existing question status fields to verified. One accepted single-answer correction was normalized from multiple-choice to single-choice because the accepted answer set contains one option.
- Stable question and batch IDs were retained. Question stems, option IDs/text/order and source metadata were matched to the accepted ledger and preserved. No new verification category or runtime logic was introduced.

### Pending boundary and resulting catalogue

- All **116 baseline pending questions** remain unchanged. HSTU-U retains **105 pending questions** across its 15 papers (102 answer-unverified, 3 answer-unknown; content-unverified).
- The 3 off-baseline pending-ledger records were not modified. They are outside the 780-question baseline and are not included in the 116 baseline pending count.
- At the 2026-11-12 ledger-import checkpoint, normal HSTU contained **22 paper rows / 950 questions**. The five logical duplicates were consolidated on 2026-11-16; current normal HSTU contains **17 papers / 950 questions**. **939** retain both verified status fields and are eligible single-choice records. Eleven older baseline questions remain pending answer status in HSTU (10 unknown, 1 unverified).
- At that initial import checkpoint, all 15 added HSTU paper rules were unconfigured. The five duplicate 2024–25 unconfigured aliases were removed in the 2026-11-16 consolidation; all remaining unconfigured rules stay unconfigured. No exam count, duration, selection or marking rule was inferred. JU, RU and DU content was not changed.

### Backup and verification

- Pre-import copies of all 18 changed HSTU pack files are at /home/kali/gpt-workspace/bd-admission-app-data/answer-verification-2026-11-12/staging/pre-hstu-verified-import-2026-11-12/data-question-packs/.
- The import summary and per-question reconciliation CSV are at /home/kali/gpt-workspace/bd-admission-app-data/answer-verification-2026-11-12/import-ready/HSTU_VERIFIED_2026-11-12/.
- Node 22.23.1: content build passed and rebuilt **217 packs / 13,609 questions**; content check passed.
- Full repository test suite: **142/142 passed**. TypeScript typecheck, ESLint and content check all passed. SQLite quick_check returned ok; foreign-key check returned zero issues.
- All 664 ledger IDs exist in the seed with verified answer/content status and exact accepted correct-option IDs; all 664 have active appearances under HSTU. No pending question object changed relative to its pre-import backup. Staged pack files and active app pack files have matching SHA-256 hashes.
- A new APK was not built or installed for this content change. A new app build is required for the updated bundled seed to reach an installed device.

## Initial catalogue status (HSTU figures superseded by the 2026-11-12 import below)
Validator and transactional idempotent importer are implemented. At the initial 2026-11-01 candidate-bank import checkpoint, the catalogue: **217 schema-v1 JSON packs / 13,609 questions** — 2 DU (180), 44 RU C candidates (4,009), 15 RU-V (1,828), 50 verified JU (1,526), 7 verified HSTU (293), 84 JU-U candidates (5,011) and 15 HSTU-U candidates (762). The build pipeline compiles these canonical JSON packs into a generated SQLite seed plus a small manifest; startup synchronizes changed packs from that seed. See docs/STARTUP_PERFORMANCE.md. The newest candidate-bank import is recorded first below.


## JU + HSTU unverified candidate-bank import — 2026-11-01

### Source, scope and explicit GST exclusion

- Archive: `/home/kali/gpt-workspace/museai/admission-app-research/unverified-import-ready/Admission_Import_Format_Unverified_Questions.zip`
- SHA-256: `b1de68b088229d8bbeb8e216e7409f2e6de6f88bd14755e766d00a177a9392a8`; ZIP CRC integrity check passed.
- The archive contained 102 JSON files: 84 JU packs, 15 HSTU packs and 3 separate `GST_CLUSTER` packs. **Only the 99 JU/HSTU packs were imported.** The GST cluster files contain 287 questions (85 + 108 + 94) and were all excluded for a separate future import task.
- Added **99 packs / 5,773 questions**: JU 84 packs / 5,011 questions and HSTU 15 packs / 762 questions. No pre-existing pack JSON was overwritten. The three GST pack files were not copied into the app, indexed, tested as additions or imported.
- JU's represented sessions run from 2010–2011 through 2024–2025. HSTU's represented sessions are 2014–2015, 2015–2016, 2016–2017, 2017–2018, 2018–2019, 2019–2020 and 2024–2025. These are source-archive coverage spans, not claims that every year/unit is complete.

### Verification-state preservation and provisional eligibility

All **5,773** records preserve `contentVerificationStatus: unverified`. Answer states were not changed: 5,563 remain `unverified`, and 210 remain `unknown`.

| Candidate institution | Packs | Questions | Answer unverified | Answer unknown | Multiple-choice | Provisional candidates | Repeated-option records held out |
|---|---:|---:|---:|---:|---:|---:|---:|
| JU-U | 84 | 5,011 | 4,820 | 191 | 12 | 4,780 | 28 |
| HSTU-U | 15 | 762 | 743 | 19 | 7 | 722 | 14 |
| **Total** | **99** | **5,773** | **5,563** | **210** | **19** | **5,502** | **42** |

The app's existing provisional filter is unchanged: single-choice type, at least two options, exactly one source key and no duplicate normalized option text. The 5,502 eligible candidates can be used only via the existing explicitly provisional path when the selected institution/paper scope has no verified-eligible questions. The 42 repeated-option records and 19 multiple-choice records remain in the source packs/catalogue but do not enter single-choice provisional scoring. Candidate answer feedback may be wrong. None of these data is promoted to verified, and the normal verified-only pool gains **zero** questions from this import.

### Separate catalogue identities and source-ID compatibility

- JU candidates use institution `ju-unverified-bank`, code `JU-U`, display name `UNVERIFIED — Jahangirnagar University`. HSTU candidates use `hstu-unverified-bank`, code `HSTU-U`, display name `UNVERIFIED — Hajee Mohammad Danesh Science and Technology University`.
- The existing verified `ju` / `JU` and `hstu` / `HSTU` institutions and their 57 packs are unchanged. The separate IDs allow the current catalogue and provisional-practice fallback to work without mixing verified and candidate counts.
- Batch, paper, rule and question IDs were namespaced under the new JU-U/HSTU-U identities. Source-document IDs repeated across incoming packs or colliding with existing app content were namespaced with their stable batch ID. `batch.sourceDocumentIds`, `examRules[].sourceDocumentIds`, `questions[].source.documentId` and `appearances[].sourceDocumentId` were updated together.
- An exact round-trip comparison of all 99 transformed packs against their archive entries passed after reversing only the documented ID/institution remaps. Question text, option text/order, candidate keys, verification states, source metadata, hashes, notes, extraction notes, paper numbering and remaining JSON fields matched exactly.
- A comparison against existing app question records found 12 exact text-plus-ordered-options overlaps and 95 further same-normalized-stem records with differing options/order. No similar/exact records were auto-merged: each source/paper identity and appearance remains distinct, consistent with ADR-004.
- HSTU-specific papers remain within HSTU even where one source compilation's title mentions a GST question-bank publication. The separate `GST_CLUSTER` folder of 3 cluster-institution packs was excluded completely and will be handled independently.

### Rules and app behavior

- All **99** incoming paper rules remain `unconfigured`. Source notes may describe printed headers, times or marks, but those notes do not configure official scoring or paper rules.
- New banks have zero verified-eligible questions and expose provisional counts through the existing catalogue query/UI. No practice UI or query behavior required modification; the separate institutions activate the already-tested RU-style provisional path. Verified JU/HSTU catalogue entries retain their original verified eligibility counts.
- The currently published 2026-10-31 preview APK predates both JU/HSTU imports; a new APK build/install is necessary before these banks appear on a physical device.

### Verification performed

- Source archive: ZIP integrity passed; the 99 target packs were parsed; the 3 GST cluster packs / 287 questions were explicitly excluded.
- Source preservation: **99/99** output packs round-trip match their archive source after reversing only identity remaps.
- New-pack audit: 99 unique batch IDs, 99 paper IDs, 99 rule IDs, 5,773 question IDs and 105 source-document IDs; all rules remain unconfigured and all content statuses remain unverified.
- Fresh SQLite integration test imports the complete 217-pack bundle, checks verified/candidate catalogue separation and all row/reference totals, proves normal verified eligibility is unchanged, and proves idempotent re-import for all 99 new packs.


## Jahangirnagar University + HSTU — Muse AI import (2026-11-01)

### Source and scope

- Archive: `/home/kali/gpt-workspace/museai/admission-app-research/import-ready/Admission_Import_Ready_Questions_Only.zip`
- SHA-256: `cd3f0b449ae9cb18a254197dfe557198e2039ab74d4e0ff64e2abf69cd972f1b`; ZIP integrity test passed. It contained 60 JSON packs: 50 JU, 7 HSTU and 3 GST Cluster packs. GST was intentionally excluded because this import task targeted only JU and HSTU.
- Imported: **57 packs / 1,819 questions** — JU 50 packs / 1,526 questions; HSTU 7 packs / 293 questions. No existing question-pack JSON was overwritten.
- JU academic-session span: 2010–2011 through 2024–2025, with 31 represented session/unit combinations. HSTU sessions present: 2016–2017, 2017–2018 and 2024–2025 only. The HSTU collection is partial and does not meet the 15–20-year target yet.
- Across the 107 declared source-document records, 104 include SHA-256 and 3 do not. The three absent hashes remain absent; no synthetic hashes were added.

### Verification-state preservation

Muse AI reported the archive as verified. Per user instruction, question correctness was not re-verified as part of this import. All 1,819 records have `contentVerificationStatus: verified`; the individual answer states remain unchanged:

| Institution | Questions | Answer verified | Answer unverified | Answer unknown | Verified single-choice eligible |
|---|---:|---:|---:|---:|---:|
| JU | 1,526 | 1,414 | 111 | 1 | 1,393 |
| HSTU | 293 | 275 | 8 | 10 | 275 |
| **Total** | **1,819** | **1,689** | **119** | **11** | **1,668** |

JU also contains 6 `multiple_choice` records and 16 explicit `no_correct_option` records. Across JU/HSTU, 6 questions contain repeated option text. The validator emitted **125 warnings** (119 non-verified answer-key warnings plus 6 repeated-option-text warnings) and **zero errors**. These states/warnings were preserved; no answer was guessed, promoted, rewritten or removed.

### Compatibility repair

- One source-document ID, `udvash-ju-abswer-combined`, was reused by 24 independent JU batches. The app importer requires globally unique source IDs, so each of those 24 IDs was namespaced as `udvash-ju-abswer-combined--<batch-id>`.
- Updated references in `batch.sourceDocumentIds`, `questions[].source.documentId`, `questions[].appearances[].sourceDocumentId` and `examRules[].sourceDocumentIds` whenever present. All 107 source IDs are now unique across the target dataset.
- No questions, options, question IDs, answers, per-question verification fields, source filenames, source hashes or notes were changed. The original ZIP remains outside the app repo and was not modified.
- The nested archive files were flattened into the app's existing `data/question-packs/` directory because `scripts/build-pack-index.mjs` reads JSON files directly from that directory (not recursively). The 57 imported basenames were unique.

### Runtime and exam-rule boundary

- At the initial 2026-11-01 import checkpoint, all 57 rules remained `unconfigured`. The 2026-11-05 official-source research below supersedes the status for 8 exact 2024–2025 records with partial metadata; 49 remained unconfigured at that 2026-11-05 checkpoint; five duplicate HSTU aliases were subsequently removed on 2026-11-16, leaving 44 current unconfigured rules in the verified-source group.
- **At the 2026-11-01 import checkpoint**, a general/institution-scoped Standard Exam still used the then-global 100-question / 60-minute fallback. This historical behavior has since been narrowed: only the no-exact-paper all-catalogue path keeps that default; exact-paper sessions need their own source-backed count/duration or explicitly chosen unscored Custom Practice.
- HSTU needs more historical sessions to meet the original coverage target. This is a follow-up research gap, not a blocker to importing the verified records already supplied.

### Verification performed

- All 57 JU/HSTU packs: schema validation **57/57, zero errors, 125 warnings**.
- Temporary flat-directory index-generation check: 57 packs accepted. In-repository `pnpm packs:index`: **118 packs** indexed.
- Fresh in-memory SQLite dry-run: all 118 bundled packs imported successfully — 7,836 questions, 31,344 options, 118 batches, 118 papers, 59 exam-rule rows, 168 source documents, 7,836 appearances and 5 institutions. Verified pool total: 3,643; JU: 1,393; HSTU: 275.
- Re-imported all 57 new packs in the same dry-run: all question rows skipped as unchanged and all 1,819 appearances skipped; total rows remained unchanged.
- Added automated tests for archive-derived pack counts, globally unique references, preserved verification states, warnings, full 118-pack import, practice eligibility and idempotent re-import.

## RU Question Bank.pdf — verified-source rebuild and replacement (2026-10-30)

- Source: `/home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf`, 156 pages, SHA-256 `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`. The user confirmed the source and question content are verified; this task is extraction/structure repair and import, not question-by-question re-verification.
- Rebuilt **15 packs / 1,828 MCQ questions** from sessions 2016–2017 through 2024–2025 across the A, C, D1, F and H papers/sets in the PDF. Every imported record has `contentVerificationStatus: verified` and `answerVerificationStatus: verified`; all source answer markers are represented without inference. This includes 1,800 single-choice records with one correct option, 22 `X` records represented as `answerDisposition: no_correct_option` with an explicit empty correct-option array, and 6 multi-letter-key records represented as verified `multiple_choice` items with each printed correct letter mapped to an option. No imported question carries `unknown` or `unverified` status.
- Subject metadata is populated for all imported questions: Physics 383, Higher Mathematics 512, Chemistry 365, Biology 502, ICT 54, English 12. The source-page/printed-question provenance is retained. 1,666 old question IDs were reused where the source locator was unique; 162 received deterministic IDs for new records or ambiguous same-page/number collisions.
- **154 source records are explicitly excluded** from the MCQ packs and retained in external `EXCLUSION_MANIFEST.csv`: 36 written-part items; 90 with incomplete option count/labels; 26 with one or more option labels but missing extracted option text; and 2 records without an extracted answer marker. The 22 `X` records and 6 complete multiple-answer records are imported with their source meaning intact, not excluded. No option text or answer was fabricated. A false white text-shadow on page 137 was fixed so Q4's printed B marker is captured; section identity remains the preceding Mathematics section. A separate `IDENTICAL_OPTION_TEXT_AUDIT.csv` logs 30 included questions whose extracted choices contain repeated text; their source text/status is not silently edited.
- The 15 previous RU-V JSON packs were backed up under `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/backups/old-app-packs-2026-10-30/` and replaced in-place with the rebuilt data. `replaceExistingPaperContent: true` instructs the importer to clear only active appearances for each of these 15 RU-V paper IDs before re-adding the new set. Old question rows and their bookmarks, session questions, answers and result history remain for historical references; removed items no longer appear in the active paper catalogue or practice pool.
- The current RU-V verified bank has **1,800 single-choice questions** in the existing Flash/Standard eligible pool. The 22 verified no-correct-option records and 6 verified multiple-choice records remain available as source records but are not forced into the single-choice practice engine.
- The original `ru` / 4,009-question RU C Unit Science candidate bank is a separate dataset and is retained unchanged. The two DU packs also remain unchanged. The new bundle total is **61 packs / 6,017 questions**: 180 DU + 4,009 RU C candidates + 1,828 RU-V verified-source questions.
- At the 2026-10-29 checkpoint, no RU-specific duration, marking scheme, question count or section rule was inferred and the then-current general Standard Exam used the 100-question/60-minute fallback. The current exact-paper path no longer applies those defaults to a selected paper.
- External build/reconciliation artifacts: `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/IMPORT_BUILD_SUMMARY.json`, `PACK_RECONCILIATION.csv`, `EXCLUSION_MANIFEST.csv`, `IDENTICAL_OPTION_TEXT_AUDIT.csv`, `subject-audit.json`, and the extraction source/workspace.

## Initial real-data batch: DU A Unit

| Session | Pack | Questions | Printed answer key missing | Source SHA-256 |
|---|---|---:|---|---|
| 2024–2025 | `data/question-packs/du-a-2024-2025.json` | 90 | Physics Q15 | `93d5111f4bdb643ed1b22e02688bea44bb34010635d3c56422dd295ab78991da` |
| 2025–2026 | `data/question-packs/du-a-2025-2026.json` | 90 | Physics Q4; English Q4 | `74d7b7deed19b134f0966f69935141aae4dae11095349ddfc7d4e7c325487d2b` |

The source prints 15 questions for each of six subject sections and says candidates answer any four sections, for 60 MCQs in 45 minutes, +1 for correct and −0.25 for wrong. The Standard Exam runtime now supports this configured count, duration and four-of-six section selection for the selected paper. The [official DU 2025–2026 admission notice](https://www.du.ac.bd/du_post_details/news/25400), published 13 October 2025, states 60 marks of MCQ and 40 marks of written questions, with 45 minutes for each. The supplied publisher scan instead shows a 60-question MCQ-only mock and an any-four-of-six subject-section scheme. This is a known mismatch, so do not upgrade the publisher-derived rule to `verified`; the app must label this as question-bank practice, not full official DU simulation. The user-provided PDFs are retained unchanged outside the application repository; their hashes above tie each pack to its source. Per task scope, the question facts were not externally re-verified. Source items with figure-based choices are represented by text descriptions where reasonable; a figure-only physics item and an unclear mathematics formula have `contentVerificationStatus: unverified`; both are excluded from scored practice until the missing diagram/clear source transcription is resolved.

## Creating and shipping a pack
1. Write a version-1 JSON file following docs/QUESTION_DATA_SCHEMA.md (institutions, papers, rules, source documents, questions with options and appearances). Keep year, source filename, page and question number exactly as in the PDF. For a user-confirmed verified source, preserve its approved status when the source key is unambiguous. If the source key is missing or extraction cannot map it reliably, retain `unknown` rather than guessing. For secondary/unreviewed sources, do not promote answers to verified without the required review.
2. Validate: `pnpm packs:validate data/question-packs/<file>.json`. Errors name the offending record; fix them before continuing.
3. Run `pnpm content:build` to regenerate src/content/bundledManifest.ts and assets/content/content_seed.db; then run `pnpm content:check` to verify SQLite integrity and source/seed row counts. Invalid packs are refused before the seed is replaced.
4. Rebuild the app. On next launch `syncFromSeed` copies new/changed packs from the attached seed in bounded, recoverable transactions; unchanged packs are skipped by signature. A failed pack rolls back and is reported while other packs can continue.
5. Bookmarks, sessions and answers are keyed by question id and survive re-imports.

## Validate a pack
Run from the project root:

    node scripts/validate-question-pack.mjs path/to/question-pack.json

The command reports pass/fail and error/warning totals. Errors return a non-zero exit code. Warning states, such as a non-verified answer or an empty pack, must be reviewed before import.

## Required pipeline for the implementation phase
1. Preserve the original user-supplied PDF outside public app assets and keep an immutable source copy.
2. Extract questions/options and keep a record of source filename, page number, original question number, paper/year/unit and extraction uncertainty.
3. Verify question text, option order, answer key and official exam reference. Do not infer an answer when no reliable key exists.
4. Generate version-1 JSON following QUESTION_DATA_SCHEMA.md; keep uncertain facts unverified.
5. Validate structure, identifiers, relationships, option references, year/page/number values, and answer/scoring state.
6. Review warnings and produce a human-readable import report.
7. Import using a single SQLite transaction with stable IDs/upsert rules. Roll back the whole batch after an unexpected write failure.
8. Preserve past practice attempts and bookmarks when the content pack is updated.
9. Verify per-batch record counts, paper/source appearances, answer state, option ordering and duplicate behavior.
10. Record batch identity, source-file hash when available, validation outcome, import timestamp and resulting row counts.

## Idempotency and duplicate handling
Re-importing the same batch must not create duplicate questions or source appearances. A similar-looking question from a different paper should not be merged automatically. Keep appearance/source provenance separate from question content and require an explicit review to merge or correct content.

## Image/diagram questions
Store referenced assets in local app content packs with stable relative paths. Validate every referenced asset before importing and include it in offline packaging. Do not depend on remote image URLs at question-render time.

## Still pending
- Keep the publisher-derived DU A Unit rule `illustrative`: it is known to differ from the official 2025–2026 admission notice (MCQ + written sections). Only replace/verify it with a matching primary source for the exact paper/session.
- Android device-level visual review of local question figures remains outstanding; the app now has a generated static local-PNG asset map and QuestionCard rendering.
- Additional human line-by-line review of the question transcription/display and Android device QA.

## RU Unit A intake checkpoint — 2026-10-29

The current A-only research bundle lives outside the app at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`:

- `RESEARCH_REPORT.md` — findings, source quality, collection gaps and app integration plan.
- `A_UNIT_YEAR_COVERAGE.csv` / `.json` — session coverage from 2010-2011 through 2026-2027.
- `SOURCE_REGISTER_A_ONLY.csv` / `.json` — official portal, historical pages and twelve third-party PDF links for 2012-2013 through 2023-2024.
- `REVIEW/ANSWER_AUDIT_A_ONLY.csv` — per-question candidate answer, status and evidence notes.
- Eight external sample JSON files in `staging/`, with 21 questions across sessions 2012-2013, 2013-2014, publisher-labelled 2018 (academic session unconfirmed), 2019-2020, 2022-2023, 2023-2024, 2024-2025 and 2025-2026.

The 2012-2013 to 2023-2024 linked historical PDFs were found but the Drive downloads are restricted, so source discovery is not full collection. The 2025-2026 Group 1/2 seven-page image scans have been archived locally but require full transcription and key review. The 2010-2012 combined archive requires old A1-A6 mapping. No pack has been copied into `data/question-packs/`, no index was regenerated, and no RU data is bundled.

Next gate: acquire source papers, compare all questions/options/answers against original pages, preserve group/shift/set variants, then human-review a complete pack. Validate external drafts with `pnpm packs:validate /absolute/path/to/pack.json`. After approval, copy the pack into the app repo, run `pnpm content:build` and `pnpm content:check`, then run importer tests. Do not add scoring/count/time rules without the exact session/paper's official source.


## RU C Unit Science Group collection — external import staging (2026-10-29)

External staging root: `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/`. The Lokkho public index exposed 44 C Unit Science-labelled variants. The paginated capture extracted 4,185 source records and matched counts for 44/44 variants. `source-capture/lokkho/` preserves 4,167 records with usable options. The curated `import-ready/lokkho/` folder contains 4,009 candidates across 44 schema-v1 packs, limited to Physics, Chemistry, ICT, Biology and Higher Mathematics.

A further 158 records with other source subject labels are retained in `REVIEW/LOKKHO_OFFSCOPE_SUBJECT_AUDIT.csv` for matching-session review, not silently discarded. Another 18 records lacking usable options are listed in `REVIEW/LOKKHO_EXCLUDED_INCOMPLETE_ITEMS.csv`. The five-subject curation aligns with the recently published C Unit Science structure but does not prove identical scope in every older session; source suffixes remain as third-party labels, not official group/set identities. Full counts and source references are in the external `research/IMPORT_READINESS.md` and `research/LOKKHO_PACK_COLLECTION_SUMMARY.csv`.

Each curated pack validates successfully: 44/44, zero schema errors. There are 4,023 warnings: all 4,009 candidate answer keys remain unverified and 14 records have exact duplicate option text. No answer key was independently verified against an official RU key, and all retained content status fields remain `unverified`. A schema pass does not establish official-paper authenticity, transcription correctness, subject attribution, or answer accuracy.

Forty-five local image/SVG assets are stored under external `import-ready/assets/lokkho/`; all 46 references in curated packs resolve. The later app import normalized the 41 PNGs plus the WebP/SVG assets to 45 local PNGs in the app copy, kept the external originals unchanged, and added a generated static asset map plus `QuestionCard` rendering. Android visual verification of those figures remains outstanding.

A separate 265-page third-party scan indexes 14 additional variants from 2017-2018 through 2024-2025. Full-page and column OCR cover 84 indexed question/key pages, but the text is unverified, pages 205-265 remain unclassified, and this material has not been merged. Some historical year links are Drive-restricted. The 20 SattAcademy first-page sample packs (300 records) remain partial and separate.

**Historical staging checkpoint:** before the explicit import request, this batch was not bundled. The current import decision is recorded in the dated checkpoint below; imported candidate data remains unverified and is not approved for scored practice.


## RU C Unit Science browse/review import — 2026-10-29

Per explicit request, the 44 curated candidate packs were copied into `data/question-packs/ru-c-*.json` and the 45 local app-copy PNG figures into `data/question-packs/assets/lokkho/`. This imports **4,009 questions for browse/review only**; the original external source captures, curated JSON packs and original assets remain unchanged. One WebP and three SVG source assets were converted to PNG in the app copy only, with corresponding `assetPaths` adjusted; all non-asset question fields are unchanged.

`pnpm question-assets:index` generates `src/content/questionAssets.ts` with static literal `require()` calls for Metro/offline packaging. `QuestionCard` renders the local figures. After changing the packs, run `pnpm question-assets:index` if assets change and `pnpm content:build` plus `pnpm content:check` if pack JSON files change.

All 4,009 imported candidate answer and content states remain `unverified`. No RU exam count, duration, section-selection rule, or scoring rule was inferred. Normal verified practice still excludes these candidates. A separate provisional path now enables Flash and the general 100-question/60-minute Standard Exam in a scope with no verified-eligible pool, using a third-party source key with explicit warnings. It requires single-choice type, 2+ options, exactly one source-key option and no duplicate normalized option text; 3,991 RU items currently qualify, while 18 items with duplicate normalized option text are withheld from provisional scoring. The 158 other-subject-label records and 18 no-option records remain external in the review/exclusion ledgers; ambiguous questions remain unresolved.

At this **2026-10-29 RU C Unit browse/review import checkpoint**, validation covered 46 JSON packs / 4,189 total questions with 0 schema errors and 4,023 expected warnings. The provisional-practice fix passed 57 tests, TypeScript and ESLint on Node 22.23.1. This historical checkpoint predates the 2026-10-31 Android preview release; current release/device status is recorded in `docs/CURRENT_STATE.md` and `docs/QA_CHECKLIST.md`. Original question provenance and answer-key verification, plus detailed Android visual checks for the RU C figures/Flash/Standard flows, remain open.
