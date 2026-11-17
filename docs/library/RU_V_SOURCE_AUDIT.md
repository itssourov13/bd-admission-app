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
