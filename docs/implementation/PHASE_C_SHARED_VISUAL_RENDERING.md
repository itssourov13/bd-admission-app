# Phase C — shared asset pipeline, structured math and figure rendering (2026-11-17)

Status: Implemented and committed locally as fe86f53 on 2026-11-17. Governing decisions: ADR-033 (app-wide capability), ADR-036 (this phase's technical choices). Phase D subsequently externalized the 20 RU-V crops with their inventory overlay and retired RU from active app content; see the Phase D audit report.

## C1 — shared asset pipeline (finalized)
Existing uncommitted work reviewed and kept: `scripts/build-question-assets.mjs`, `scripts/lib/asset-index.mjs`, `src/services/assetRefs.mjs`, `QuestionFigures`, `figureLayout`, migration v10 (`questions.explanation_asset_paths`, `question_options.asset_paths`), importer/LibraryPack/seed-sync/validator wiring, tests (`tests/asset-pipeline.test.ts`, `scripts/tests/asset-index.test.mjs`).
Added: `pnpm question-assets:check` step in `.github/workflows/ci.yml`. The index indexes every namespace folder under `data/question-packs/assets/**` and is deterministic; invalid paths, missing files and stale index fail the check.

## C2/C3 — structured math (new)
- `src/services/mathLayout.ts` (pure): stored text -> `MathNode` tree (fraction, nested fractions, root/nth root, matrix, determinant, piecewise cases, aligned lines) or `null` when nothing structural exists. Source strings are never rewritten.
- Recognised input: LaTeX remnants (`\frac`, `\sqrt`, `\begin{matrix|pmatrix|bmatrix|vmatrix|array|cases|aligned}`, `\left..\right`) found in RU Lokkho, **and** linearised matrices/determinants printed in real JU/DU packs (`|1, a, b + c; 1, b, c + a; ...|`, `[2, 1; 0, 3]`).
- `src/components/common/MathBlock.tsx`: View/Text renderer (no WebView, no fonts, offline). Fractions, root bar, bracket/determinant/brace delimiters, wide matrices scroll inside their own horizontal ScrollView, text size via the existing question-text-size setting, theme colour via NativeWind classes, one accessibility label for the whole block.
- `MathText` delegates to `MathBlock` only when a layout exists; everything else keeps the previous Unicode path (no regression for existing content).
- Real-content check: the parser finds 11 stems and 20 option texts in non-RU packs (all matrices/determinants; one labelled-grid false positive was removed with a rule), and 0 in RU-V.

## C3 — graphs and circuits: decision
No hand-built graph/circuit DSL was added. The real content needing them (20 RU-V questions: resistor/logic/diode circuits, vector triangles, v-t and h-t graphs) is only available as vector drawings in the PDF, and redrawing would reinterpret verified questions. They are carried as provenance-preserving source crops through the C1 pipeline. If a future source supplies machine-readable graph/circuit data, add a node kind to `MathNode`/a figure spec then.

## C4 — source figures
See `docs/audits/RU_V_FIGURE_INVENTORY_2026-11-17.md` (20 questions, 20 crops, archive overlay, packs untouched).

## C5 — verification (what was actually run)
See QA_CHECKLIST "Phase C" section. Not run: physical-device or emulator visual QA, TalkBack, dark-theme and narrow-width screenshots of `MathBlock` (no device attached to this session). `MathBlock` layout is therefore unit-tested at the parser level and type/lint/bundle checked only.


## Final implementation and verification status

Phase C checks at its commit checkpoint: 276/276 tests, typecheck, lint, content/asset/pack validation and Android no-bytecode Metro export passed on Node 22.23.1. Phase D later removed the only active question-pack image set (the 45 Lokkho assets); the generic asset index now correctly validates an empty active question-asset tree (0 files / 0 refs). The 20 RU-V figure crops remain in the external verified archive as a provenance overlay, not in the app bundle.

Physical-device/emulator visual QA, TalkBack, dark theme and narrow-width visual checks of MathBlock remain unperformed. No device-level visual claim is made.
