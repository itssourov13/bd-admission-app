# Project context

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
The app presents a branded Bangla/English setup screen while local SQLite initialization and bundled question-pack synchronization run. It reports stage changes and real processed-pack/question progress, supports reduced motion and a recoverable retry state, and explains the offline library setup. This is a progress/feedback improvement, not a background-sync architecture: the initial route tree remains gated until the startup sequence completes. Existing local profile, bookmarks, exam attempts and practice history must remain intact.

## Current bundled university question banks — 2026-11-01

The Varsity catalogue now has four separate JU/HSTU entries: verified `JU` (50 packs / 1,526 questions) and `HSTU` (7 / 293), plus candidate-only `JU-U` (84 / 5,011) and `HSTU-U` (15 / 762). The verified banks and their practice eligibility remain unchanged by the follow-up import. All 5,773 newly added candidates keep `contentVerificationStatus: unverified`; answer states remain 5,563 unverified and 210 unknown. The explicit provisional pools contain 4,780 JU-U and 722 HSTU-U candidates after repeated-option filtering. All 99 rules stay unconfigured. The 3 separate GST_CLUSTER packs / 287 questions were excluded for a later import. Do not infer exam rules from source notes.

## RU question-data research/staging

The separate historical RU Unit A research snapshot remains external at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`: eight research-only sample packs (21 questions), a coverage ledger and restricted/untranscribed source leads. Separately, the user-supplied `RU Question Bank.pdf` has been imported into a distinct `RU-V` institution, with 15 packs / 1,828 questions, as documented in `docs/QUESTION_IMPORT_WORKFLOW.md`. The previous RU C Science candidate entry remains separate and visibly prefixed `UNVERIFIED —`; the rebuilt RU-V bank contains 1,828 verified records across 15 packs.
