# Handoff

## Workspace
Target: /home/kali/gpt-workspace/bd-admission-app (independent Git repo, branch main; never push from automation).
ScholarHub (/home/kali/gpt-workspace/scholar-hub) is historical provenance only; there is no runtime/build dependency on it and it must not be edited.

## State
The app foundation and two source-derived DU A Unit question-bank packs are bundled (90 questions each for 2024–2025 and 2025–2026). They validate and load through startup sync. Three questions whose printed answer key is blank remain unknown; two additional content-unverified items (one figure-only physics item, one unclear mathematics formula) are excluded from scored practice pending source clarification/diagram support. The scanned four-of-six MCQ practice pattern is known to differ from the official DU 2025–2026 format ([official notice](https://www.du.ac.bd/du_post_details/news/25400)), so keep the rule illustrative and do not describe it as full official-exam simulation. Android physical-device QA is still outstanding. Read CURRENT_STATE.md, QUESTION_IMPORT_WORKFLOW.md, ARCHITECTURE.md, DECISIONS.md and QA_CHECKLIST.md first.

## Run
    source ~/.nvm/nvm.sh && nvm use      # 22.23.1
    pnpm install
    pnpm test && pnpm typecheck && pnpm lint && pnpm doctor
    pnpm android                          # on-device run (not yet done)

## Next steps
1. Add future institution/session packs following docs/QUESTION_IMPORT_WORKFLOW.md; the initial DU A Unit 2024–2025 and 2025–2026 packs are already included.
2. Keep the publisher-derived DU A Unit pattern illustrative: the official DU 2025–2026 notice includes 40 written marks in addition to 60 MCQ marks. The current pattern is a source-bank practice mode only. General scopes retain the 100/60 fallback; new university/session rules must come from the matching primary source.
3. Resolve the Expo Go mismatch before device QA: this repo is Expo SDK 57 / RN 0.86.3, and Expo Go builds are SDK-specific. Install the matching SDK 57 Android Go build from https://expo.dev/go (or use a dedicated development build), then run the "UI/device checks" in docs/QA_CHECKLIST.md and verify the subject filters, long Bangla text, virtualized all-question exam list, sticky Submit control, timeout and answer persistence.
4. Android release export: hermesc crashes with SIGILL on this ARM/NetHunter host; build on another machine or via EAS.
5. Confirm the final app name (docs/BRANDING.md).

## Boundaries
- Do not invent questions, answers, years, sources or scoring rules.
- Only verified-answer, single-choice questions with 2+ options feed Flash/Exam.
- Illustrative/unconfigured rules must never be presented as official.

## RU Unit A research checkpoint

Read `/home/kali/gpt-workspace/bd-admission-app-data/ru/README.md`, `RESEARCH_REPORT.md` and `A_UNIT_YEAR_COVERAGE.csv`. Scope is RU Unit A only. Eight external review-only JSON packs contain 21 questions. The year ledger covers 2010-2011 to 2026-2027, but complete transcription is not finished. Twelve linked PDFs for 2012-2013 to 2023-2024 were located but the direct downloads are restricted; two 2025-2026 Group 1/2 scanned PDFs are archived in `sources/2025-2026/`. 2010-2012 combined sources need historical A1-A6 mapping. No RU questions are bundled in the app.

Next: acquire/verify each source paper, preserve group/shift/set variants, transcribe every option and source/page reference, and independently review every answer. Only then copy approved full-year/paper packs into `data/question-packs/`, validate, regenerate the index and run importer tests. Do not claim coverage complete until counts and answer states have been compared against original papers.
