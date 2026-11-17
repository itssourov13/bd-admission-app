# Phase C finalization + Phase D RU externalization — execution plan (2026-11-17)

Status: PLAN + BASELINE only. No source/data changes made yet in this checkpoint.

## Verified baseline (actual repo state)
- Branch `feat/import-hstu-verified-answers-2026-11-12`, HEAD `20037a7`; 14 modified + 7 untracked Phase C files uncommitted (asset pipeline, QuestionFigures, figureLayout, assetRefs, asset tests).
- Node 22.23.1 (nvm) is required; the default shell node is v24.19.0 and must not be used for checks.
- `pnpm test`: 267/267 pass. `build-question-assets.mjs --check`: 45 assets, 46 refs (45 unique), index current.
- CI (`.github/workflows/ci.yml`) has no asset-check step yet.
- `MathText` = Unicode sup/sub/hat + tiny LaTeX remnant set (`\frac` flattened to a/b, no matrices, roots, nesting).

## Content survey (all packs, field-level regex counts; RU-c = Lokkho, RU-v = verified)
- LaTeX/`\begin{matrix|array}` markup: RU-c only (117 `\begin`, 69 matrix, 971 `\frac`). Zero in RU-v and almost zero (4 `\`) in non-RU packs.
- Non-RU packs: determinants/matrices are linearised text rows (e.g. `|1, a, b + c; 1, b, c + a; ...|`), integrals/sums/roots already Unicode.
- Consequence: a full TeX engine is not justified by surviving content. After RU-c is retired the structured needs are: linearised matrix/determinant rows, nested powers/fractions, roots, and figure assets from the RU-V PDF.

## Design decisions
1. C1: keep the bitmap pipeline; add `question-assets:check` to CI; verify determinism + invalid/missing detection tests.
2. C2: extend `mathText.ts` into a pure parser to an AST (text/sup/sub/frac/sqrt/matrix/hat) with a plain-text fallback and `MathBlock` renderer (View/`react-native-svg`, already a dependency, offline). Stored strings never rewritten. Spoken labels generated from the AST.
3. C3: structured `figure` specs (matrix, graph, circuit) as JSON drawn with react-native-svg; bitmap fallback when a source figure is complex.
4. C4: figure inventory CSV from the RU PDF + `ruv-work` (question id, set, PDF page, printed no., representation, asset path, provenance).
5. C5: fixtures from real patterns; Metro export `--no-bytecode`; device checks recorded honestly (no device attached = not claimed).
6. Order: finalize+commit C1 (checked-in tree is green) -> C2/C3/C4/C5 -> commit Phase C -> archive RU-V + re-verify Lokkho -> schema v11 retirement migration (soft-retire flag, no cascading deletes) -> remove 59 packs/45 assets -> regenerate manifest/seed/registry -> fresh + v10 upgrade tests -> docs -> commit.

## Risks
- v10 installs: seed sync is additive; retirement needs a migration marking RU universities/papers/questions inactive and every active-pool query must filter them while history joins keep resolving.
- Removing ru-c assets changes the generated asset index; keep the pipeline generic when the folder `assets/lokkho` disappears.
