# Question pack input directory

Bundled source packs:

- `du-a-2024-2025.json` — University of Dhaka A Unit, 90 questions.
- `du-a-2025-2026.json` — University of Dhaka A Unit, 90 questions.

Each pack preserves source PDF name/hash, session, section/subject, source page and printed answer-key status. Three items without a printed answer letter remain unknown; do not guess. Keep synthetic fixtures in `data/dev-fixtures/`. Validate any new/changed pack with `pnpm packs:validate`, then regenerate `src/content/bundledPacks.ts` with `pnpm packs:index`. The original scans are stored outside this repository at `/home/kali/gpt-workspace/bd-admission-app-data/` and are not copied into the app bundle.
