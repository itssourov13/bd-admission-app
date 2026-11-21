## 2026-11-22 — Existing Exam review flag and new question-issue report must stay separate

The Standard Exam already has a complete **Flag for review** workflow. SQLite migration v7 adds `session_answers.flagged`, scoped to `(session_id, question_id)`. It appears in the active Exam question marker/palette/progress/submission summary and is preserved for the completed Result's Flagged filter. It is a learner's per-attempt revision reminder, independent of answer selection/scoring; finalization prevents further flag writes. Follow-up audit and 7/7 regression result are saved in `docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md`.

Any new content issue report is a separate global question-level record. It must have its own repository/table, explicit “Report question issue / প্রশ্নে সমস্যা জানান” label, non-flag issue icon and separate visual placement—not beside the exam review flag and never stored in `session_answers.flagged`. While reporting during an active exam, the UI must state that the exam timer continues. No app code has changed.

---

## 2026-11-22 — Profile / CU localization / question issue reporting audit

A read-only audit is recorded at `docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md`. The current CU display-name resolver correctly maps `CU` to `cu`, but the bilingual known-university list lacks the `cu` entry, so the catalogue falls back to the stored English title in Bangla mode. Profile's last two shortcuts are currently Settings then Marking rules; requested order is Marking rules then Settings. The app has local bookmarks but no issue-report flow yet.

Recommended future direction (not implemented/accepted as a schema decision): issue reports should be offline-first and separate from bookmarks, stored with a question/source snapshot, shown in Profile, and exported as a versioned JSON file via the Android system Sharesheet. Proposed additive schema migration: v13. Existing source state is unchanged; focused baseline tests pass 27/27.

---

## CU A Unit Science — integrated Varsity catalogue — 2026-11-19

The owner-approved package is imported as 26 schema-v1 Varsity packs / 26 papers / 2,558 questions / 11,397 options / 68 sources for institution `cu` / `CU`, under `data/question-packs/`. No incoming filenames or batch/paper/question/source IDs collided with existing data. The original external archive and extracted source snapshot remain unchanged. None of this content was placed in the Library/ASPECT tree.

Answer verification remains 2,185 verified / 373 unverified; all 2,558 content records retain the owner-confirmed Muse AI content verification. Existing app predicates return 2,185 normal practice-eligible and 307 structurally safe review candidates. All 26 papers have an eligible question; the provisional-only fallback is not invoked. CU's 2025–26 partial rule remains unavailable for official scored Standard Exam; the other 25 rules are unconfigured.

The original official-site CU PNG is bundled at `assets/universities/cu.png` and registered in `src/features/catalog/universityLogos.ts`; the file is unchanged (429×581 RGBA, SHA-256 `9cc7ef6e5577c21aa8d6a1f6dea1298a35c032b63abf7388c4dc38c5361d8829`). The university website publishes this mark as PNG.

Current source catalogue: **230 Varsity packs / 14,579 questions / 59,481 options / 7 institutions / 240 papers / 385 source documents**. Generated manifest/seed: **231 entries / 16,407 question rows / 66,793 options**, including one separate ASPECT Library publication with 1,828 questions / 26 units. Schema v12; seed 28.05 MiB. The app's generated manifest is tracked; SQLite seed is ignored/local.

No importer/scoring/practice/runtime/database schema logic changed. Only CU pack data, the single university logo registry entry and logo asset, generated manifest, three stale expected-count/CU regression test updates, and focused docs changed. No APK was built or device tested; existing installed APKs need a new build to contain CU. No push.

---

# RU Science question-pack integration — current state — 2026-11-18

The owner-approved curated RU Science package is now included in the active Varsity question-pack source. It contains 46 schema-v1 packs / 46 papers / 4,249 questions / 16,996 options / 90 sources / 45 local PNGs under institution `ru` / code `RU`, using the non-retired `ru-sci-*` ID namespace. The units remain source-labelled: 44 C Unit — Science, one D1 Unit and one F Unit. The separate 197-question non-science D1 Group-1 pack is excluded.

4,144 questions have both answer and content status `verified`; 105 remain unverified in both fields and browseable only by default. The app's eligible practice pool contains 4,144 RU questions; the explicit review predicate admits 86 unresolved candidates. All imported packs keep `examRules: []`; paper-specific RU Standard Exam patterns remain unavailable until exact paper/session evidence supports them. The built-in RU 2024–25 Marking Profile is not treated as a substitute exam pattern.

At the pre-CU checkpoint on 2026-11-18, the source held 204 Varsity packs / 12,021 university questions; its combined seed held 205 entries / 13,849 rows and 55,396 options. The newer current totals are recorded in the CU integration section above. Schema v12 is unchanged. Legacy `ru-c-*`/`ru-vq-*` papers and batches remain retired; the new `ru-sci-*` IDs are active without changing the retirement migration.

The original Lokkho and RU-V archives remain preserved outside the repository. This new Varsity package is a separate curated import and does not merge or relocate the RU-V ASPECT Library publication. At the 2026-11-18 RU checkpoint, automated verification included a 2,043-module / 146-asset Android no-bytecode Metro export. The v0.1.10 EAS preview APK (build `64584a92-b1c7-4353-86ef-894152c94550`) includes RU content but predates CU; the owner installed and ran it on Android and reports normal operation in the checks performed. Some answer explanations have formatting issues to collect and fix together in a later focused pass.

---

# ASPECT Library — owner-verified, session-organised — 2026-11-18

The RU-V ASPECT Library book is now owner-verified: the owner reviewed the imported questions and their source-printed answers and designated them the source of truth (not an independent solve, not a university-certified key). 1,826 of 1,828 questions are verified; 2 questions whose printed key contradicts the printed working stay unverified and unscored. The book is shown under the ASPECT card (stored publisher remains the unidentified row, ADR-038/040) with the owner-supplied ASPECT logo, and its 17 source sets are organised into 9 session drawers with Flash / Timed practice / Browse. Details: `docs/ASPECT_OWNER_VERIFICATION.md`. The paragraphs below that call RU-V unverified are historical.

---

# Current RU-V ASPECT Library integration — 2026-11-17

The RU-V material is now bundled as one separate offline Library publication in the ASPECT collection; it is not reintroduced as a RU university question-pack batch. The app seed contains 158 university packs / 7,772 university questions plus one Library publication with 26 units, 1,828 questions, 7,312 options, 1,828 source explanations and 20 figure assets (159 bundled manifest entries / 9,600 question rows overall).

All RU-V question answer/content statuses are stored as `unverified`. The 1,797 single-choice records with source-printed keys are provisional candidates, not independently solved or university-certified answers. The 31 source-disposition records (22 no-correct-option, 6 multiple-answer and 3 unresolved source contradictions) remain browse-only. Eleven additional duplicate-option records are excluded by the existing provisional-practice query, leaving 1,786 structurally safe provisional practice candidates. All 1,828 questions remain browsable.

The LibraryPack is built from the external staging workspace and bundled through `data/library-packs/`, the generated content manifest and SQLite seed. Startup sync copies its publisher/book/unit/membership data into the user's SQLite database. The seed-sync path now checks an already-installed Library `content_version` before writing shared question/source/option rows; a newer installed edition is preserved and the older bundled entry is checkpointed as unchanged. Rights metadata remains lightweight and informational: ASPECT is the collection, publisher/rights holder unidentified, licence not verified, `permission_pending` non-blocking.

The current seed is schema v12, 159 bundled entries, 9,600 question rows and 38,400 option rows. Metro Android export and focused fresh-install/existing-v10-upgrade sync tests pass. No new native APK has been built or installed and no physical-device UI QA has been performed. Exact scope, caveats and verification evidence: `docs/RUV_ASPECT_IMPORT.md`.

---

## Correctness and exam-rule boundaries — 2026-11-05

The profile display name is stored locally and read back after writes; a pending text draft is saved on blur/submit and when leaving the profile screen. Internal import-batch diagnostics are not student-facing profile content. The question renderer formats only recognized mathematical/scientific notation at presentation time; the underlying JSON text is never rewritten and ambiguous notation remains unchanged.

Exam-rule facts are exact paper/session-specific. The 2024–2025 verified-source JU/HSTU collection retains 8 partial verified records (3 JU, 5 HSTU) and 44 rules still unconfigured after removal of five duplicate unconfigured HSTU alias rules. Partial facts do not enable numeric score calculation. RU's official 2024–2025 rules have been researched but not attached to the current third-party aggregate C-unit captures because those data do not represent an exact official 80-question paper. The complete evidence boundary is recorded in `docs/EXAM_RULE_RESEARCH.md`.

# Project context

## Historical RU pack archive and retirement checkpoint — 2026-11-17 (superseded narrowly by the curated RU Science import)

The ADR-035 decision is implemented. Both RU datasets are retained as separate external archives and removed from active app source and bundle:

- Lokkho: 44 packs / 4,009 answer-unverified questions / 45 PNG assets / 46 references at /home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/.
- RU-V: 15 packs / 1,828 verified questions / 17 printed source sets / 20 source-figure crops at /home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/.

Both archive verifiers pass; all 90 Lokkho and 36 RU-V SHA-256 entries match. The app no longer bundles RU packs or Lokkho question images. Schema v11 retires those rows on existing installations without deleting historical questions, sources, bookmarks, answers, sessions or results. Current generated content contains 158 non-RU packs / 7,772 questions. The assets/universities/ru.svg university branding asset remains.

Lokkho remains unverified and is not part of ASPECT. RU-V is now present as a separate LibraryPack under the ASPECT collection; the original RU-V question-pack archives remain preserved outside the repository. JU/HSTU/DU university packs and other non-RU content remain in the university catalogue. See ADR-035, ADR-037, ADR-039 and `docs/RUV_ASPECT_IMPORT.md`.

## Current university-bank state — 2026-11-16

The normal HSTU catalogue contains 17 logical papers / 950 questions / 939 verified practice-ready questions after the 2026-11-16 merge of five duplicate paper IDs. Claude's accepted HSTU ledger supplied 664 verified IDs: 657 were moved from HSTU-U appearances into 15 HSTU papers, and 7 existing HSTU questions had their accepted answer mappings/status updated. All 664 now have both verification fields set to verified; HSTU has 939 verified single-choice questions in its practice pool. HSTU-U retains 105 pending records (102 answer-unverified, 3 answer-unknown; content-unverified); the 116 baseline pending questions were left untouched. JU and JU-U remain unchanged. The candidate-bank paper rules remain unconfigured. Of the 15 HSTU paper records added by the verified ledger import, ten older-session rules remain unconfigured; the five 2024–25 duplicate aliases were removed and their existing canonical papers retain the partial verified totalMarks=100 fact. Full details and verification evidence are in docs/QUESTION_IMPORT_WORKFLOW.md.

## Product
BD Admission is a Bangladesh-focused preparation app for university and Medical admission questions. Students will practice historical multiple-choice questions with the institution, year, unit/paper and source reference retained. Engineering is visible in the initial product as Coming Soon; Engineering question content is a later batch.

## Primary users
Bangladeshi admission candidates using Android phones, potentially with unreliable or unavailable internet. Bangla is the default interface language; English is supported.

## Core modes
- Flash Question: one question at a time; 30-second default with configurable time; continuously cycles through the eligible pool without repeats until a cycle is exhausted; skip and exit; local performance summary.
- Standard Exam: an exact selected paper uses its configured question count, duration and supported subject-selection rule; general all-catalogue practice retains a 100-question/60-minute fallback. This is not a universal Bangladesh admission-exam pattern. RU patterns differ by unit, B commerce/non-commerce, C stream/subject choice and year; configure each exact paper only from its matching official source.
- Result review: local answers, correct/incorrect/unanswered counts, accuracy and scoring provenance.

## Product boundaries
The initial release is single-device and local-first. A sign-in service, hosted backend and cloud sync are not prerequisites. Historical question data will be supplied in PDF batches after the application foundation is built. Never assume a common question count, duration, subject distribution or marking scheme across institutions; store and apply the verified pattern for the relevant paper/session. Do not invent or prefill factual historical content. Synthetic fixtures belong only in development/test locations and must be labelled.

## Success criteria
Fast, readable, offline question practice; accurate source/year metadata; reliable local persistence; deterministic timer/scoring; repeatable and safe question imports; UI components reused from the author's ScholarHub app where appropriate.

## Startup experience
The branded Bangla/English five-stage setup UI is reserved for a first-run local question-library setup or an actionable startup failure. Returning cold launches keep the native splash visible while SQLite initialization, migrations and bundled-content reconciliation run; the splash is hidden only after Home's first data-backed (or actionable error) view has laid out. The first-run overlay also waits for Home readiness before fading out, avoiding a second Home loading surface underneath the transition. Five completed stage ticks use a short staggered core Animated opacity/scale transition with the native driver and Reduce Motion support. The production content path uses a generated SQLite seed, a compact committed manifest and bounded set-based copy transactions; unchanged packs are skipped and interrupted work resumes from committed checkpoints. The single-flight coordinator observes AppState but does not promise uninterrupted execution while Android backgrounds or kills the process. Database-dependent routes remain gated until startup completes. Existing profile, bookmarks, exam attempts and practice history must remain intact. See docs/STARTUP_PERFORMANCE.md for the runtime contract and verification boundary.

## Current bundled university question banks — 2026-11-01

The Varsity catalogue now has four separate JU/HSTU entries: verified `JU` (50 packs / 1,526 questions) and `HSTU` (7 / 293), plus candidate-only `JU-U` (84 / 5,011) and `HSTU-U` (15 / 762). The verified banks and their practice eligibility remain unchanged by the follow-up import. All 5,773 newly added candidates keep `contentVerificationStatus: unverified`; answer states remain 5,563 unverified and 210 unknown. The explicit provisional pools contain 4,780 JU-U and 722 HSTU-U candidates after repeated-option filtering. All 99 JU-U/HSTU-U rules stay unconfigured. The verified-source JU/HSTU rule set now has 52 logical rules: 8 partial verified 2024–2025 rules and 44 unconfigured rules after the five duplicate HSTU aliases were removed (see docs/EXAM_RULE_RESEARCH.md). The 3 separate GST_CLUSTER packs / 287 questions were excluded for a later import. Do not infer exam rules from source notes.

## RU question-data research and provenance

The separate historical RU Unit A research snapshot remains external at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`: eight research-only sample packs (21 questions), a coverage ledger and restricted/untranscribed source leads. The user-supplied `RU Question Bank.pdf` was historically reconstructed as 15 RU-V source packs / 1,828 records representing 17 printed sets and is preserved in the external RU-V archive. The current ASPECT Library conversion deliberately stores all 1,828 answer/content statuses as `unverified`; printed answer markers remain provisional source keys, not independently solved or university-certified answers. The older RU C Science/Lokkho candidate bank remains a separate unverified archive and is not part of ASPECT. See `docs/RUV_ASPECT_IMPORT.md` for the current Library representation and exclusions.

## Shared question interaction and visual content — owner clarification — 2026-11-17

Multiple-select interaction and diagram/visual-question support are app-wide requirements, not RU-specific features. The shared QuestionCard, Flash/Standard Exam/Custom Practice controllers, answer persistence, scoring and result-review paths must behave according to the question type for every university/paper pack, bundled content source, LibraryPack and future import. Multiple-choice questions need toggleable checkbox semantics, explicit submission where appropriate, persisted answer arrays/resume and source-backed scoring; exact-set comparison is the default unless a verified marking profile specifies another method.

Question diagrams/images and structured mathematics must use a shared renderer and a validated, offline-capable asset pipeline. Source extraction remains bank-specific, but the rendering, Metro indexing, missing-reference checks and UI behavior are reusable across all content origins. Preserve existing single-choice behavior. See ADR-033 in docs/DECISIONS.md.

## Historical RU source audit and initial ASPECT proposal — superseded by ADR-035

The original 2026-11-17 source audit reconciled 15 RU-V JSON batches / 1,828 questions to 17 printed source sets, identified 22 no-correct-option and six multiple-answer records, and found the source PDF prints Unit A on the 2024–25 মহানন্দা and পদ্মা pages. The audit remains useful as source evidence.

Historical checkpoint only: at the time of this initial audit, the owner had deferred the RU-V Library import while ADR-035 removed both RU university question-pack families. That later decision has since been superseded by the current RU-V ASPECT Library integration at the top of this file: RU-V is now bundled as one separate LibraryPack; the legacy RU/Lokkho university packs remain retired, and Lokkho never enters ASPECT. The original source audit remains provenance. See ADR-035, ADR-037, ADR-039 and `docs/RUV_ASPECT_IMPORT.md`.


## Current Android delivery — v0.1.10 — 2026-11-18

The v0.1.10 / Android `versionCode 10` EAS `preview` APK includes the RU Science bank, completed its cloud build, and was installed/run by the owner on a physical Android device. The owner reports normal operation in the checks performed. Answer-explanation formatting defects are the current known follow-up; no further source change is requested until the owner has collected examples. Build details and device-test scope are recorded in [ANDROID_RELEASE.md](ANDROID_RELEASE.md) and [QA_CHECKLIST.md](QA_CHECKLIST.md).

## CU A Unit Science — external staging / third-pass checkpoint (pre-import) — 2026-11-19

Historical pre-import checkpoint: at the time this staging note was written, the package remained external-only and active app source was unchanged. The subsequent Varsity import is complete and documented in the current CU integration section at the top of this file. The staging package recorded 708/721 third-pass Tier-A candidates as PASS and 13 HOLD; final answer state is 2,185 verified / 373 unverified, with 2,558 content-verified under the owner-confirmed prior Muse AI review. See `docs/QUESTION_IMPORT_WORKFLOW.md` and package `reports/THIRD_PASS_AI_KEY_REVIEW.md`.
