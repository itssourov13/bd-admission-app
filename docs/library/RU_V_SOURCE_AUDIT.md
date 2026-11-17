# RU-V source audit — status 2026-11-17 (Phase 1, in progress)

Staging: `/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging/` (outside the repo; STAGED, NOT IMPORTED). Built by `scripts/ruv-aspect-staging.mjs --build`; rebuilt twice with identical `SHA256SUMS`; `--verify` OK (52 files); `scripts/archive-ruv.mjs --verify` OK (17 sets, 36 files, 20 figures).

## Done
- 17 printed sets reconciled against the extraction ledger: 1,982 raw = 1,828 prepared + 154 excluded; membership comes from the ledger, not page ranges.
- Exclusion review (`exclusion-review.json/.md`): 38 legitimate non-MCQ exclusions (36 written parts, 2 writing instructions); 116 real MCQs with unrecoverable options (90 incomplete option sets, 26 missing option text) kept excluded pending manual recovery. Decisions are ledger-based; PDF-page confirmation is pending.
- Import mapping now places the book in collection `ASPECT` with an unidentified publisher and `permission_pending` rights metadata.

## Not done (unresolved)
- Visual page-by-page verification of the 1,828 questions: 0 done. (Requires viewing page images; text/OCR comparison alone cannot support `visually_verified`.)
- Answers: 1,775 source-printed keys, 0 independently verified, 53 `needs_review` (22 no-correct-option, 6 multi-answer, 5 boundary defects, others).
- Explanations: 1,825 source-verbatim and unreviewed, 3 missing, 0 authored.
- Figures: 20 crops hashed; association/legibility not visually verified.
- Unit label: archive says C for two 2024–25 sets; the PDF prints A (staging uses A).

## Phase 2 — count reconciliation, Library pack, isolated dry-run (2026-11-17)

### Historical count discrepancies (record level; `scripts/ruv-count-reconciliation.py`)
Output: `<staging>/count-reconciliation.json`. Compares the earlier import (git `005c157`) with the later archive (git `2b7cb52^`).
- **1,815 → 1,828 is not "+13 questions".** 1,666 ids are unchanged; 149 old ids were replaced and 162 new ids added (net +13). The rebuild (commit `628f16e`) fixed broken Bangla and shattered math in the old import, so ids derived from page-number positions shifted. Only 21 of the 148 dropped texts reappear under a new id; the other 128 were not matched by a normalized-text check and are not individually explained (see limitations).
- **1,720 vs 1,775 are different definitions.** Old: 1,720 answered markers + 95 unknown (of 1,815). Staging: 1,775 = 1,828 − 53 `needs_review`; every staged question has a printed marker, so 0 are unknown. Of the 50 kept ids that were previously unknown, 24 are now unflagged printed keys and 26 are `needs_review`.
- **2 kept ids have a different answer than the old import** (listed in `count-reconciliation.json`: `...2022-2023-c-all-p044-q001-p055-n0125`, `...2024-2025-a-noset-p012-q005-p012-n0005`). They are not auto-resolved; they need a look at the PDF page.
- Archive hash verification proves file integrity only; it says nothing about question correctness.

### The 53 `needs_review` records
- The 22 "no correct option" records are **not an extraction miss**: the PDF prints a Symbol-font marker that the ledger stores as answer `X` (22 raw records). They are kept unscored (`answerDisposition: no_correct_option`). None has a source explanation.
- Other categories (overlapping): 6 multi-answer, 5 option/explanation boundary defects, 2 replacement characters, 20 figure-dependent, 30 with duplicate option text, 14 Bangla caret artefacts (informational).
- No answer was changed or invented. Resolving them needs PDF page inspection; none was done.

### Library pack and dry-run
- `node scripts/ruv-aspect-build-pack.mjs` → `<staging>/library-pack/{ruv-aspect-library-pack.json, manifest.json, assets/ruv-aspect/*.png}`. Deterministic; verifies the 20 figure hashes. Read-only on staging inputs; does not touch the app repo or DB.
- Contents: 1 book (collection ASPECT, publisher "Unknown / not identified", `permission_pending`), 26 units (9 sessions → 17 source sets), 1,828 questions (1,775 scored candidates, 53 browse-only/unverified), 1,825 source explanations, 20 questions with figure assets.
- `tests/ruv-aspect-dry-run.test.ts` validates the pack with `validateLibraryPack` (0 errors; `permission_pending` is a warning) and installs it into an **in-memory** database via `installLibraryPack`: 1,828 inserted, per-set unit membership matches, no `ru-vq-%` ids, idempotent re-install. It skips when the external staging workspace is absent. Requires Node 22 (`.nvmrc`).

### Phase 3 import proposal (NOT executed; needs explicit approval)
1. Copy `library-pack/assets/ruv-aspect/*.png` (20 files) to `data/question-packs/assets/ruv-aspect/` and run `npm run question-assets:index`.
2. Add the pack to the Library content path (bundled or imported via `installLibraryPack`); regenerate content with `npm run content:build`.
3. Effect: 1 publisher row (`pub-unidentified`), 1 book, 26 units, 1,828 questions in batch `lib-aspect-ru-question-bank-verified-sets`, 20 assets. No `ru-vq-*` pack or retired record is restored.

### Limitations (unchanged by this phase)
No visual page-by-page verification (0/1,828); no independent answer solving; no reviewed/authored Bangla explanations (source text preserved verbatim, 3 missing); figure association and legibility not visually verified; 116 real MCQs remain excluded; no device/emulator QA of the Library UI.

### The two answer-changed ids (checked against old vs archived text, not the PDF)
- `…2024-2025-a-noset-p012-q005-p012-n0005` (EM wave direction): old key `b` (B) was wrong; archived key `c` (E × B) is the physically correct direction. Archived text still has lost vector arrows and option d contains leaked explanation text ("E.B তড়িৎ চুম্বকীয় তরঙ্…").
- `…2022-2023-c-all-p044-q001-p055-n0125` (logic-circuit output): archived key `c` (overbarred AB) matches the printed marker; correctness depends on the figure and was not checked. Overbars are lost in the text and option d has leaked text ("এটি হলো").
- Neither is among the 53 flagged records, so **unflagged option-boundary and notation defects exist**. The 53-record flag list is not a complete defect list; a PDF page pass is still needed.
