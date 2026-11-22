# RU Science — explanation & quality upgrade (in progress)

Workspace: `/home/kali/gpt-workspace/bd-admission-app-data/ru-quality-upgrade/` (tools, staging, `reports/EXPLANATION_LEDGER.jsonl`, `reports/REVIEW_FLAGS.md`). Scope: active `ru-sci-*` packs only (46 packs, 4,249 q); Library and other universities untouched.

## Baseline (verified, 2026-11-22)
- Active `ru-sci-*` packs are byte-identical to `ru-science-import-ready/question-packs` (import already done in e30829c); nothing to re-integrate.
- 1,255 explanations; 4,144 verified questions, 2,939 of them without explanation (2,786 distinct text+options groups); 50 unverified have explanations; 105 unresolved stay unexplained (key unverified).
- 278 existing explanations are OCR-garbled, too short or over-long (heuristic) — queued for rewrite.
- Existing renderer (`mathText.ts`/`mathLayout.ts`, MathText in QuestionCard) already handles `\frac`, `\sqrt`, matrices, `^`/`_`; explanations are authored in that notation. No shared-renderer change was needed so far. Per AGENTS.md, stored text is never reformatted for display; source-text corrections need source evidence and are only listed in `REVIEW_FLAGS.md` for now.

## Method
Distinct text+options groups of verified questions are explained once and propagated to identical duplicates. Each explanation is authored against the verified key and independently recomputed (answers disagreeing with the key were NOT explained; see REVIEW_FLAGS). `tools/apply.py` validates length/characters, applies, and appends old/new values to the ledger.

## Checkpoint 1
ICT (text-only items) and Higher Mathematics 2010-11 … 2011-12 batches: 132 ledger entries (128 added, 4 replaced). Pack validation PASS (230 packs, 0 errors); `content:build` + `content:check` OK; seed SQLite contains 1,383 RU explanations of 4,249; sample explanation row verified.

## Checkpoint 2 (2026-11-22)
Higher Mathematics batches hm_03–hm_07 (2012-13 … 2017-18) plus one fix batch: 148 more ledger entries (280 total). Re-verified before commit: only `explanation` fields changed (147 questions, 18 packs), all on `verified` questions, every change matches the ledger; 8/8 randomly sampled explanations independently recomputed correctly; round-trip 0 mismatches; `packs:validate` PASS (230 packs, 0 errors); `content:build` + `content:check` exit 0. RU coverage now 1,529/4,249 questions (36.0%); verified 1,479/4,144 (35.7%); 2,665 verified still without explanation; 253 existing explanations still heuristically flagged. Not run: full test suite, typecheck, device test.

## Remaining
Rest of Mathematics, Physics, Chemistry, Biology, ICT figure questions (need images), ~253 flagged rewrites, source-backed text corrections (REVIEW_FLAGS.md, needs original PDF page), then CU / HSTU. Resume with "continue RU". Do not treat RU as finished.
