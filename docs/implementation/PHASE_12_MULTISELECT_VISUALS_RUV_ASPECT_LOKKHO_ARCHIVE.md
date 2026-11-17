# Phase 12 — App-wide multi-select, shared visuals, RU-V → ASPECT, Lokkho archival

Branch: feat/import-hstu-verified-answers-2026-11-12 (start HEAD 50966c7). Governing ADR: ADR-033. Detailed prior plan: docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md.

## Verified baselines (2026-11-17, from actual files)
| Item | Audit figure | Verified |
|---|---|---|
| RU-V import batches (`ru-vq-*.json`) | 15 | 15 |
| RU-V questions | ~1,828 | 1,828 (1,822 `single_choice` incl. the 22 no-correct-option records, 6 `multiple_choice`) |
| Lokkho packs (`ru-c-*.json`) | 44 | 44 |
| Lokkho questions | ~4,009 | 4,009, all answer-unverified |
| Lokkho asset refs / unique | 46 / 45 | 46 / 45, all resolve |
| Source PDF SHA-256 (`bd-admission-app-data/ru/RU Question Bank.pdf`) | — | f1fc25fa…18a49c7 |

## Phase order and status
| # | Phase | Status |
|---|---|---|
| A | Lokkho external archive: inventory, copy, manifest, SHA-256 verify | Done (this checkpoint) |
| B | Shared answer-state + multi-select engine (UI, persistence, scoring, eligibility, review) | Not started |
| C | Shared asset pipeline + visual/math rendering | Not started |
| D | Library delivery path (bundled LibraryPack install on fresh + upgrade) | Not started |
| E | RU-V → one ASPECT book, 17 units (conversion script, validation) | Not started |
| F | RU-V Varsity retirement + DB migration with history aliasing | Not started |
| G | Lokkho active-content removal + DB retirement migration + asset registry regen | Not started (gated on A, done) |
| H | Reconciliation, full verification, docs, final report | Not started |

## Phase A — Lokkho archive (done)
- Tool: `scripts/archive-lokkho.mjs` (`--create` refuses to overwrite and never deletes; `--verify` re-checks sizes, SHA-256, unlisted files and asset-reference resolution).
- Destination: `/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/` (`question-packs/` mirrors `data/question-packs/` so `assets/lokkho/*.png` references resolve unchanged; `MANIFEST.json`, `SHA256SUMS`, `README.md`).
- Result: 44 packs, 4,009 questions, 46 refs / 45 unique assets, 93 files total. `node scripts/archive-lokkho.mjs --verify` ok; `sha256sum -c SHA256SUMS` zero failures.
- App copies are **not yet removed**. Removal is Phase G because it needs the DB retirement migration (installed rows must stay for history) and asset-registry regeneration.

## Next step
Phase B: inspect `ELIGIBLE_SQL`, flash/exam controllers, `QuestionCard`, session/answer persistence and `scoring.ts`, then implement the shared multi-select model with tests.
