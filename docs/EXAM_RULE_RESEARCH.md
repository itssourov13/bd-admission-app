# Official exam-rule research — 2026-11-05

This note records the source-backed admission-test details that were checked for the exact 2024–2025 session. A fact being verified does **not** mean every field required by the app's scoring engine is known. The data pack may store a partial verified rule, while numeric scoring remains disabled until every scoring component is sourced.

## Rajshahi University (RU), 2024–2025

**Official source:** [RU's own 2024–2025 admission announcement](https://www.ru.ac.bd/blog/রাবিতে-ভর্তির-আবেদন-শুরু/), published by the university's Public Relations Office.

The circular states 100 marks, 80 MCQs in each unit, 1 hour, a deduction of 1 mark for every four incorrect answers (equivalent to −0.25 each), and a minimum admission-test pass mark of 40. The accessible circular does not explicitly state the exact positive mark for each correct response or the treatment of an unanswered question; neither is invented here.

**Why no rule is attached to the current RU C packs:** `ru-c-2024-2025-ruc-group1-mcq.json` and `ru-c-2024-2025-ruc-group2-mcq.json` are third-party Lokkho API/page captures containing 127 and 128 retained questions respectively. They are not a transcription of one matching, official 80-question C-unit paper/set. The source record count, subject mix and paper identity do not establish which 80 questions belonged to the official sitting. Attaching the 80-question rule and randomly drawing from these aggregate captures would create a false official paper. Both packs therefore remain unconfigured and candidate content remains unverified. Obtain the exact original paper/set and reconcile every question before linking this rule to an app paper.

## Jahangirnagar University (JU), 2024–2025

**Sources:** [JU official revised admission notice listing](https://www.juniv.edu/public/discussion/16245) and [contemporaneous report quoting the revised circular](https://www.prothomalo.com/education/admission/53gqu59ill). The signed circular copy used for the source note is also linked in each affected pack.

The revised circular's reported rules specify an 80-mark MCQ test, 55 minutes for answering plus an additional 5 minutes for OMR filling, a 0.20-mark deduction per incorrect answer, and a 33% pass threshold. The corresponding 2024–2025 source-compilation headers for the three selected unit/set papers identify 80 questions. The circular/source evidence does not establish the correct-answer mark and unanswered-answer mark as separate scoring fields.

**Pack treatment:** only these exact matching papers carry partial verified rule metadata:

- `ju-a-2024-2025-set02.json`
- `ju-d-2024-2025-set12.json`
- `ju-d-2024-2025-set13.json`

The app stores `totalMarks=80`, `totalQuestions=80`, `durationSeconds=3300` (55-minute answering window), and `incorrectPenalty=0.20`. The additional OMR period is documented as a separate administrative allowance, not included in the in-app answering timer. `correctMarks` and `unansweredMarks` remain absent. Consequently, no numeric score or negative-marking calculation is produced. Current imported packs do not contain 80 eligible questions per exact paper, so the official-format practice session remains unavailable until source-complete questions are supplied; the app must not pad or merge records to meet the quota.

## HSTU, 2024–2025

**Sources:** [official HSTU 2024–2025 admission circular](https://hstu.ac.bd/uploads/admission_2025/details_admission-circular_2025.pdf), [official admission FAQ](https://admission.hstu.ac.bd/home/faq_2025), and [official final admission schedule](https://hstu.ac.bd/uploads/admission_2025/admission-schedule_2025_30_04_25.pdf).

The circular confirms a 100-mark MCQ admission-test component. The official FAQ confirms the cycle was administered by HSTU independently rather than through GST; the final schedule identifies the A- and B-unit sitting dates. The accessible official documents reviewed do not establish an exact MCQ count, solving duration, positive mark per correct response, negative-marking penalty or unanswered-answer value.

**Pack treatment:** `totalMarks=100` is stored as a partial verified fact on the five matching 2024–2025 HSTU A/B shift packs. No per-question scoring fields, question count or duration are filled in. Therefore the exact-paper Standard Exam is not started using a guessed 100-question/60-minute default and no numeric score is fabricated.

## Runtime and data-integrity contract

- A partial verified rule is displayed as **Official exam detail — partially verified** and shows only facts supported by the source.
- A numeric exam/Flash score is calculated only when correct marks, incorrect penalty and unanswered marks are all present, finite and non-negative. Missing values are not silently converted to zero.
- A paper-specific timed session requires that exact paper's own positive `totalQuestions` and `durationSeconds`; no other paper's rule and no global 100/60 fallback is substituted.
- When the exact paper lacks a usable count/duration, the setup offers an explicitly labelled, user-configured, unscored **Custom Practice** option. It is never represented as an official exam.
- The general no-paper/all-catalogue practice path retains the product's generic 100-question/60-minute default.
- Source-backed rule metadata is not a verification of the question text or answer keys. Question-content and answer-key statuses remain independent.

## Current data status

The original JU/HSTU verified-source group contains 57 rules: 3 JU and 5 HSTU 2024–2025 records now contain partial verified facts; the remaining 49 rules remain unconfigured. The separate 99 JU-U/HSTU-U candidate papers are still all unconfigured. Both RU candidate C-unit variants remain unconfigured. Do not generalize these facts to other years, units, or sets.
