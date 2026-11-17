## Correctness and exam-rule boundaries — 2026-11-05

The profile display name is stored locally and read back after writes; a pending text draft is saved on blur/submit and when leaving the profile screen. Internal import-batch diagnostics are not student-facing profile content. The question renderer formats only recognized mathematical/scientific notation at presentation time; the underlying JSON text is never rewritten and ambiguous notation remains unchanged.

Exam-rule facts are exact paper/session-specific. The 2024–2025 verified-source JU/HSTU collection retains 8 partial verified records (3 JU, 5 HSTU) and 44 rules still unconfigured after removal of five duplicate unconfigured HSTU alias rules. Partial facts do not enable numeric score calculation. RU's official 2024–2025 rules have been researched but not attached to the current third-party aggregate C-unit captures because those data do not represent an exact official 80-question paper. The complete evidence boundary is recorded in `docs/EXAM_RULE_RESEARCH.md`.

# Project context

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

## RU question-data research/staging

The separate historical RU Unit A research snapshot remains external at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`: eight research-only sample packs (21 questions), a coverage ledger and restricted/untranscribed source leads. Separately, the user-supplied `RU Question Bank.pdf` has been imported into a distinct `RU-V` institution, with 15 packs / 1,828 questions, as documented in `docs/QUESTION_IMPORT_WORKFLOW.md`. The previous RU C Science candidate entry remains separate and visibly prefixed `UNVERIFIED —`; the rebuilt RU-V bank contains 1,828 verified records across 15 packs.

## Shared question interaction and visual content — owner clarification — 2026-11-17

Multiple-select interaction and diagram/visual-question support are app-wide requirements, not RU-specific features. The shared QuestionCard, Flash/Standard Exam/Custom Practice controllers, answer persistence, scoring and result-review paths must behave according to the question type for every university/paper pack, bundled content source, LibraryPack and future import. Multiple-choice questions need toggleable checkbox semantics, explicit submission where appropriate, persisted answer arrays/resume and source-backed scoring; exact-set comparison is the default unless a verified marking profile specifies another method.

Question diagrams/images and structured mathematics must use a shared renderer and a validated, offline-capable asset pipeline. Source extraction remains bank-specific, but the rendering, Metro indexing, missing-reference checks and UI behavior are reusable across all content origins. Preserve existing single-choice behavior. See ADR-033 in docs/DECISIONS.md.

## RU bank audit and ASPECT Library destination — 2026-11-17

- RU-V currently has 15 JSON batches / 15 paper rows / 1,828 questions representing 17 printed source sets. The target is 17 separate test units while preserving import-batch/question identities where possible.
- The 2024–25 মহানন্দা and পদ্মা sets both print Unit A on PDF pages 1 and 12. The previous C catalogue correction is superseded; source-facing metadata should be A. No pack change has yet been made.
- Owner direction: only the 17 audited RU-V source sets are to become one book under Publications & Books → ASPECT. RU Lokkho's 44 packs / 4,009 candidates must be moved into an external archive, not ASPECT; that archive move is still pending and the files remain in the app repository. Audit only for possible reuse. Muse has separately been tasked with a new pack, so Lokkho may remain unused. Preserve the archive and assets.
- App-wide platform work (ADR-033): implement multi-select interaction/persistence/scoring/review and the shared offline visual/diagram asset + math renderer for every source (university packs, active bundled question packs, LibraryPacks and future imports). RU-V's six multi-answer records are one initial acceptance dataset, not the sole target. RU-V-specific work: audit its source images/diagrams, convert the 17 source sets into one LibraryPack, and safely cut over existing installs while preserving user history.
- Interim evidence and implementation plan: docs/audits/RU_VERIFIED_QUESTION_BANK_SOURCE_AUDIT_2026-11-17.md and docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md. The HSTU consolidation in the 2026-11-16 report remains current.
