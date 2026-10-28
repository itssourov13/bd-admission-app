# Handoff

## Workspace
Target: /home/kali/gpt-workspace/bd-admission-app
Read-only source reference: /home/kali/gpt-workspace/scholar-hub
Initial source reference HEAD when inspected: d2bc7b0 on main, clean.

## Current foundation
The target has an independent app identity and Git repo. Selected mobile UI components and source config are present, along with a fresh bilingual dictionary/provider, light theme, root layout and four tabs. A Node-based question-pack validator and three focused tests are ready. Read README.md and the architecture/reuse/import documents first.

## Immediate next tasks
1. Activate Node 22.23.1 using .nvmrc, confirm node -v and pnpm -v.
2. Install packages with pnpm and generate pnpm-lock.yaml.
3. Run Expo config/doctor, TypeScript and lint; fix issues from actual output.
4. Inspect the scaffold and complete the UI.
5. Implement SQLite migrations and repositories before wiring screens to real data.
6. Implement timer/scoring services and test them independently.
7. Complete the runtime transactional import path and validate a synthetic pack.
8. Implement and test offline persistence, then verify Android export.
9. Update CURRENT_STATE, TASK_STATE, CHANGELOG, QA_CHECKLIST and HANDOFF with actual results.
10. Review all changes, commit if gates pass, and do not push.

## Important boundaries
- Do not edit ScholarHub.
- No production question PDFs have been supplied yet. Do not fabricate historical questions.
- The current tab screens are scaffolds, not completed feature screens.
- No full SQLite runtime schema, practice engine, or complete import-to-database flow is implemented yet.
- Do not claim install, typecheck, lint, Android export or physical-device verification passed until each is run and inspected.
