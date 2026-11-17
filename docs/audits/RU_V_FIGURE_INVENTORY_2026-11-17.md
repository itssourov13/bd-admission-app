# RU-V question-to-figure inventory (2026-11-17)

Source: `/home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf` (sha256 f1fc25fa…18a49c7). Generator: `bd-admission-app-data/ruv-work/crop_figures.py`.
Machine-readable copy with crop boxes and provenance: `bd-admission-app-data/ru/verified-pack-archive/FIGURE_INVENTORY.json`; crops: `.../verified-pack-archive/figures/` (200 dpi, stem + figure + options only; answer key and explanation excluded).

## Method
1. Embedded raster images in the PDF are only exam title banners (`pdfimages -list`), so diagrams are vector drawings, not extractable images.
2. All 1,828 RU-V stems were scanned for figure words (figure/diagram/graph/circuit and Bangla equivalents). 27 matched.
3. Seven matches are text-only mentions (e.g. "উপরের দিকে", "ফটোগ্রাফিক", a tuned-circuit capacitor question, three capacitors in parallel) and were excluded after reading the stem.
4. For the remaining 20 questions the printed question block was located from the pdftohtml run positions (question-number run to last option row) and cropped from the original PDF page. No crop includes the answer marker or explanation.

## Result: 20 figure-dependent questions, all cropped
| # | Question ID | Set / source document | PDF page | Printed no. | Representation | Asset (archive) |
|---|---|---|---|---|---|---|
| 1 | `ru-vq-2018-2019-c-02-p107-q008-p107-n0006` | `ru-vq-2018-2019-c-02-p107-source` | 107 | 8 | electric-circuit | `figures/2018-2019-c-02-p107-q008-p107-n0006.png` |
| 2 | `ru-vq-2020-2021-c-all-p089-q009-p089-n0008` | `ru-vq-2020-2021-c-all-p089-source` | 89 | 9 | logic-circuit | `figures/2020-2021-c-all-p089-q009-p089-n0008.png` |
| 3 | `ru-vq-2020-2021-c-all-p089-q013-p089-n0012` | `ru-vq-2020-2021-c-all-p089-source` | 89 | 13 | electric-circuit | `figures/2020-2021-c-all-p089-q013-p089-n0012.png` |
| 4 | `ru-vq-2020-2021-c-all-p089-q017-p090-n0016` | `ru-vq-2020-2021-c-all-p089-source` | 90 | 17 | diagram | `figures/2020-2021-c-all-p089-q017-p090-n0016.png` |
| 5 | `ru-vq-2021-2022-c-all-p067-q023-p068-n0023` | `ru-vq-2021-2022-c-all-p067-source` | 68 | 23 | logic-circuit | `figures/2021-2022-c-all-p067-q023-p068-n0023.png` |
| 6 | `ru-vq-2021-2022-c-all-p067-q005-p078-n0124` | `ru-vq-2021-2022-c-all-p067-source` | 78 | 5 | diagram | `figures/2021-2022-c-all-p067-q005-p078-n0124.png` |
| 7 | `ru-vq-2021-2022-c-all-p067-e07-p078-c1-s01-q014-r1` | `ru-vq-2021-2022-c-all-p067-source` | 78 | 14 | diagram | `figures/2021-2022-c-all-p067-e07-p078-c1-s01-q014-r1.png` |
| 8 | `ru-vq-2021-2022-c-all-p067-q015-p078-n0132` | `ru-vq-2021-2022-c-all-p067-source` | 78 | 15 | electric-circuit | `figures/2021-2022-c-all-p067-q015-p078-n0132.png` |
| 9 | `ru-vq-2021-2022-c-all-p067-q020-p079-n0137` | `ru-vq-2021-2022-c-all-p067-source` | 79 | 20 | graph | `figures/2021-2022-c-all-p067-q020-p079-n0137.png` |
| 10 | `ru-vq-2021-2022-c-all-p067-q023-p079-n0140` | `ru-vq-2021-2022-c-all-p067-source` | 79 | 23 | electric-circuit | `figures/2021-2022-c-all-p067-q023-p079-n0140.png` |
| 11 | `ru-vq-2022-2023-c-all-p044-q001-p055-n0125` | `ru-vq-2022-2023-c-all-p044-source` | 55 | 1 | logic-circuit | `figures/2022-2023-c-all-p044-q001-p055-n0125.png` |
| 12 | `ru-vq-2022-2023-c-all-p044-q003-p055-n0127` | `ru-vq-2022-2023-c-all-p044-source` | 55 | 3 | graph | `figures/2022-2023-c-all-p044-q003-p055-n0127.png` |
| 13 | `ru-vq-2022-2023-c-all-p044-q021-p057-n0145` | `ru-vq-2022-2023-c-all-p044-source` | 57 | 21 | electric-circuit | `figures/2022-2023-c-all-p044-q021-p057-n0145.png` |
| 14 | `ru-vq-2022-2023-c-all-p044-q055-p060-n0178` | `ru-vq-2022-2023-c-all-p044-source` | 60 | 55 | logic-circuit | `figures/2022-2023-c-all-p044-q055-p060-n0178.png` |
| 15 | `ru-vq-2023-2024-c-noset-p023-e02-p024-c0-s01-q015-r1` | `ru-vq-2023-2024-c-noset-p023-source` | 24 | 15 | electric-circuit | `figures/2023-2024-c-noset-p023-e02-p024-c0-s01-q015-r1.png` |
| 16 | `ru-vq-2023-2024-c-noset-p033-q009-p033-n0009` | `ru-vq-2023-2024-c-noset-p033-source` | 33 | 9 | electric-circuit | `figures/2023-2024-c-noset-p033-q009-p033-n0009.png` |
| 17 | `ru-vq-2023-2024-c-noset-p033-q012-p033-n0012` | `ru-vq-2023-2024-c-noset-p033-source` | 33 | 12 | electric-circuit | `figures/2023-2024-c-noset-p033-q012-p033-n0012.png` |
| 18 | `ru-vq-2024-2025-a-noset-p001-q008-p001-n0008` | `ru-vq-2024-2025-a-noset-p001-source` | 1 | 8 | logic-circuit | `figures/2024-2025-a-noset-p001-q008-p001-n0008.png` |
| 19 | `ru-vq-2024-2025-a-noset-p001-q018-p002-n0018` | `ru-vq-2024-2025-a-noset-p001-source` | 2 | 18 | electric-circuit | `figures/2024-2025-a-noset-p001-q018-p002-n0018.png` |
| 20 | `ru-vq-2024-2025-a-noset-p012-q023-p013-n0023` | `ru-vq-2024-2025-a-noset-p012-source` | 13 | 23 | logic-circuit | `figures/2024-2025-a-noset-p012-q023-p013-n0023.png` |

## Representation decision
These are mixed resistor/logic-gate/diode circuits, vector diagrams and plotted graphs with printed labels. They are carried as **source bitmaps** (provenance-preserving) through the shared asset pipeline instead of redrawn: a redraw would be an unverifiable reinterpretation of verified questions. Matrices/determinants (which occur as text in other packs) are rendered structurally (see Phase C doc).

## Known limits
- Detection is keyword-based on stems; a figure question that never says figure/circuit/graph in its stem would be missed. A page-by-page visual sweep of the 156 PDF pages was not performed.
- The pack JSON was not modified (the packs are archived byte-identical); the inventory is an overlay for the future ASPECT import: attach `assetPath` as `assetPaths` on the listed question IDs.
