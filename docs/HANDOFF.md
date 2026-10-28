# Handoff

## Workspace
Target: /home/kali/gpt-workspace/bd-admission-app (independent Git repo, branch main; never push from automation).
ScholarHub (/home/kali/gpt-workspace/scholar-hub) is historical provenance only; there is no runtime/build dependency on it and it must not be edited.

## State
The app is functionally complete for the scope in docs/CURRENT_STATE.md, but contains **no real question content** and has **not been run on a device**. Read CURRENT_STATE.md, ARCHITECTURE.md, DECISIONS.md and QA_CHECKLIST.md first.

## Run
    source ~/.nvm/nvm.sh && nvm use      # 22.23.1
    pnpm install
    pnpm test && pnpm typecheck && pnpm lint && pnpm doctor
    pnpm android                          # on-device run (not yet done)

## Next steps
1. Before importing each PDF batch, verify and record that exact exam's question count, duration, subject/section pattern and marking rule from the official source. Patterns differ by institution and paper (e.g., some may use 100 questions, others 80 or 60); never copy the RU example as a universal default.
2. When PDFs arrive, build packs per docs/QUESTION_IMPORT_WORKFLOW.md, `pnpm packs:validate <file>`, put them in data/question-packs/, run `pnpm packs:index`, rebuild.
3. Implement per-paper exam-pattern configuration end to end before release; current Standard Exam still fixes 100 questions/60 minutes. Include tests for at least different configured question counts and durations, plus section rules if official source formats require them.
4. Run the "UI/device checks" in docs/QA_CHECKLIST.md on a real Android device and fix layout issues (especially long Bangla text and the exam grid).
5. Android release export: hermesc crashes with SIGILL on this ARM/NetHunter host; build on another machine or via EAS.
6. Confirm the final app name (docs/BRANDING.md).

## Boundaries
- Do not invent questions, answers, years, sources or scoring rules.
- Only verified-answer, single-choice questions with 2+ options feed Flash/Exam.
- Illustrative/unconfigured rules must never be presented as official.
