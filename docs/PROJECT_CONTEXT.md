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

## Current RU pack ownership and archive status — 2026-11-17

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
