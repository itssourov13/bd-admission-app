# Phase C finalization + Phase D RU externalization — execution plan (2026-11-17)

Status: COMPLETED — implementation and automated verification reconciled on 2026-11-17. The baseline below is historical; final results are recorded first.

## Final outcome — 2026-11-17

- Phase C committed as fe86f53: generic offline asset pipeline + CI gate, structured math parser/View renderer and 20-question RU-V source-figure inventory.
- Lokkho archive verified: 44 packs / 4,009 questions / 45 images / 46 refs; 90/90 hashes. RU-V archive verified: 15 packs / 1,828 questions / 17 printed sets / 20 crops; 36/36 hashes. Original app packs and images matched archive copies byte-for-byte before removal.
- Phase D removed 59 RU pack JSON files and 45 Lokkho images from active source. Manifest/seed/asset registry regenerated: 158 packs / 7,772 questions / 31,088 options, 2,512 eligible; no RU pack/question or Lokkho asset refs. assets/universities/ru.svg retained.
- Schema v11 tombstones RU/RU-V papers and batches, and active-content queries exclude them while historical question/source/user-history data remain available.
- Automated verification on Node 22.23.1: 282/282 tests; typecheck; lint; content build/check; asset index/check; pack validation (0 errors); both archive verifiers/SHA-256 manifests; Android no-bytecode Metro export (~4 MB JS); git diff --check — passed.
- Physical Android/emulator visual QA, TalkBack, dark/narrow math rendering QA and a new APK install were not performed.

See docs/CURRENT_STATE.md, docs/QA_CHECKLIST.md, ADR-037 and the completed RU archive/removal audit for detailed evidence.

## Historical verified baseline (actual repo state)
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
