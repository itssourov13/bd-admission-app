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

## RU question-data research/staging

The RU research snapshot is documented outside the app repository at `/home/kali/gpt-workspace/bd-admission-app-data/ru/` and is now **Unit A only**. It contains a session coverage ledger from 2010-2011 through 2026-2027, A-only source register, answer audit and eight schema-v1 sample packs (21 questions). The 12 linked 2012-2013 to 2023-2024 PDFs have not been downloaded; two 2025-2026 Group 1/2 scans are archived but remain untranscribed in full, so historical collection remains incomplete. Unverified answers remain explicit; no RU data has been bundled or imported. Read `docs/QUESTION_IMPORT_WORKFLOW.md` before moving an external draft into `data/question-packs/`.
