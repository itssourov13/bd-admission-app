# Question Visual Assets — Reconstruction and Integration

Date: 2026-11-23
Status: Generated and integrated; static validation and automated tests passed. Physical Android device screenshot QA remains a final visual check.

## Outcome

A source-reviewed diagram-only artwork set was generated and integrated into the offline question bank.

| Source group | Artwork | Mapping result |
|---|---:|---|
| RU-V / ASPECT Library | 17 | 17 genuine figures attached; 3 text-only false-positive crops no longer have image references |
| RU Lokkho question packs | 21 | 21 selected weak, low-resolution, handwritten, or prompt-mixed visuals replaced |
| CU question packs | 5 | All 5 explicit image-description placeholders now have app-supported PNG artwork |
| HSTU question packs | 0 | No explicit image placeholders or existing image references were present; wording-only candidates were not turned into speculative diagrams |
| Total | 43 | 43 question-linked PNG assets plus 43 editable SVG masters |

The 24 other Lokkho assets classified as already clean digital diagrams/formula artwork were retained. The 65 pre-existing source files were first snapshotted externally; the 41 replaced whole-question/weak source crops were removed from the app asset tree only after all references were changed and checked. Original bytes remain preserved in the external workspace.

## Asset design and mobile constraints

- Each new image is figure-only. Question stems and answer options remain structured text/options.
- PNG exports are generally 900–1,150 px wide; every generated PNG is under 100 KB (largest: 99,767 bytes). Combined PNG size is approximately 1.47 MB.
- Aspect ratios are preserved. Exports were additionally rendered into 960 px-wide / 1,080 px-high contain previews to approximate the existing 320 dp × 3 density QuestionFigures viewport and 360 dp max-height.
- SVG is the editable source master under the external data workspace; only PNG files are copied into the app because the current offline asset pipeline indexes raster image files, not SVG.
- No QuestionCard, QuestionFigures renderer, database schema, scoring, navigation, or app runtime logic was changed.

## Content-safety checks

A semantic comparison against HEAD confirmed that the 26 changed question records changed only assetPaths and, for seven image-mixed/placeholder records, text to move prompt information out of the image. No options, answer keys, explanations, source metadata, subject/topic values, or verification statuses changed. The seven text adjustments comprise five CU placeholder removals and two Lokkho prompt/diagram separations.

The RU-V Library pack's 20 old image-bearing records changed only assetPaths: 17 receive a diagram-only replacement; 3 lose an incorrect image reference because the source crop did not contain a separate figure.

## Reproducibility and source evidence

- External source snapshots and original SHA-256 records: visual-asset-workspace/snapshots/source-assets/ and manifest/assets.csv.
- Per-artwork source/geometry notes, app question IDs, hashes, dimensions and file sizes: manifest/final-question-asset-map.csv.
- Machine-readable generation and app integration results: manifest/full-artwork-generation.json and manifest/app-integration.json.
- SVG masters, PNG exports and mobile previews: external workspace production/svg/, production/png/, production/mobile-previews/, production/review/.
- RU-V source PDF: 156-page RU Question Bank.pdf, SHA-256 f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7. Each RU-V asset note names its PDF page/question. The three excluded source crops are p55/Q3, p89/Q13 and p79/Q20.
- CU wave art was cross-checked against a publicly indexed source image; the other CU diagrams were reconstructed from the explicit question descriptions and mathematically determined geometry (line equations, square areas, and nitrobenzene structure). An unverified answer remains unverified.
- HSTU keyword matches are not treated as proof of a required figure. A graph-recognition question with graph-form options was not assigned an answer-revealing graph.

## Verification results

- Question asset index: 67 local images / 68 references / 67 unique references; no missing files.
- Pack validation: 230 packs / 14,579 questions / 0 errors (5,536 existing warnings).
- Content build/check: 231 packs / 16,407 questions / 29.64 MiB SQLite seed, reproducible check up to date.
- TypeScript tsc --noEmit: PASS.
- Automated tests: 318 passed / 0 failed.
- Original source snapshots: 65/65 SHA-256 matched.
- Physical Android QuestionCard screenshot verification was not available in this run; simulated 320 dp previews are included in the external workspace.

## Remaining manual QA

Install the next APK/device build and visually inspect representative examples from each type (logic gates, resistor/capacitor networks, graphs, electrostatics and organic structures) at normal phone width. This is a display QA step; it does not block the completed static integration or existing automated checks.
