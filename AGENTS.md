# BD Admission agent instructions

## Product goal
Build a polished, fully usable offline-first Bangladesh admission preparation app using Expo/React Native and local SQLite. The initial content areas are Varsity Questions, specific universities, Medical and Engineering Coming Soon. Flash Question has a 30-second default timer with custom duration and unlimited cycles. Standard Exam requires 100 eligible questions and defaults to 60 minutes. Scoring rules must be data-driven and carry verification status.

## Workspace boundaries
- Work only in /home/kali/gpt-workspace/bd-admission-app for this product.
- All selected reusable code is already copied/adapted into this repository. Implementation, install and build must work entirely here; do not require opening the original source checkout. Do not add source-path imports, symlinks, workspace links or runtime/build dependencies on it. The source is historical provenance only in docs/REUSE_INVENTORY.md.
- This is a standalone repository. Do not add @scholarhub/shared, Clerk, ScholarHub API calls, cloud database requirements or ScholarHub EAS/app identity.
- Reuse the adapted components already present in src/components/ui and the local design system. Check each component's imports and behavior before adding similar dependencies.

## Workflow
1. Inspect Git status and current documentation before substantial changes.
2. Read PROJECT_CONTEXT.md, CURRENT_STATE.md, ARCHITECTURE.md, DECISIONS.md, TASK_STATE.md and HANDOFF.md.
3. Implement in focused, coherent checkpoints and update documentation while working.
4. Run focused lint/typecheck/build and tests applicable to the changed code. Do not run Chromium or large browser E2E suites; prefer small targeted verification.
5. Never claim unrun checks passed. Record environment limitations and unresolved issues.
6. Review the full Git diff before committing verified changes. Commit when verification gates pass; do not push or deploy.

## Architecture
- Expo Router route files belong under app/. Reusable non-route code belongs under src/.
- SQLite is intended to be the offline source of truth. Avoid network dependencies on core journeys.
- Keep SQL in repositories/database modules, not route components. Use parameterized SQL and ordered migrations.
- Keep timer, exam state transitions, scoring and question-pack validation testable independently of React UI.
- Keep official source provenance and answer/scoring verification status.
- Do not merge visually similar question records automatically.
- Do not mix synthetic demo fixtures into genuine question packs.
- Preserve attempts, bookmarks and profile data when importing content updates.

## Question correctness
- Preserve original question text and option ordering when importing.
- Retain institution, year, paper/unit, question number and source page whenever known.
- Unknown correct answers remain unknown; do not guess.
- Never present illustrative negative marking as an official rule.
- A real Standard Exam cannot start unless 100 eligible questions are available.

## Dependencies and device environment
- Use the Node version in .nvmrc and SDK-compatible dependencies.
- Preserve the verified Android/Termux-oriented pnpm settings nodeLinker=hoisted and packageImportMethod=copy unless testing provides a reason to change them.
- Avoid broad dependency upgrades and unnecessary libraries.
