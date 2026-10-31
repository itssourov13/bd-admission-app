# Bundled question packs

## Jahangirnagar University — Muse AI import (2026-11-01)

- `ju-*.json` — 50 packs / 1,526 questions across academic sessions 2010–2011 to 2024–2025 (31 represented session/unit combinations).
- Per-question content status is `verified`; answer status is preserved exactly: 1,414 `verified`, 111 `unverified`, 1 `unknown`.
- 1,393 questions meet the current verified single-choice practice filter. Six records retain multiple-choice type and 16 preserve the source `no_correct_option` state; they remain browsable but are not scored by the single-choice engine.
- Six questions contain identical option text. These are import warnings, not a reason to rewrite source text or infer a correction.
- No paper-specific exam rules are configured. Do not infer a question count, duration, subject quota or marking scheme.

## HSTU — Muse AI import (2026-11-01)

- `hstu-*.json` — 7 packs / 293 questions across sessions 2016–2017, 2017–2018 and 2024–2025 (A/B and available shifts).
- Per-question content status is `verified`; answer status is preserved exactly: 275 `verified`, 8 `unverified`, 10 `unknown`.
- 275 questions meet the current verified single-choice practice filter.
- One question has identical option text in at least two choices; it is retained unchanged.
- This is partial historical coverage; additional HSTU sessions are still needed to meet the 15–20-year research target. All 7 paper rules remain `unconfigured`.

**Muse verification boundary:** the user reported that Muse AI marked the archive verified. This import did not repeat question-by-question factual verification and did not upgrade individual answer statuses. `answerVerificationStatus` remains the per-question gate for scored practice.

**Source ID normalization:** the shared source ID `udvash-ju-abswer-combined` appeared in 24 separate JU batches. It is now suffixed with the corresponding stable batch ID in those 24 packs; `batch.sourceDocumentIds`, question source references, appearance source references and rule source references were updated together. This fixes the importer’s global source-ID collision without changing source filenames, hashes, notes, question content or answer data.

## DU A Unit — scanned question-bank practice

- `du-a-2024-2025.json` — 90 questions.
- `du-a-2025-2026.json` — 90 questions.

The supplied publisher scans and printed answer-key states are preserved. Three questions without a printed answer letter remain unknown; two additional content-unverified questions are not scored. The publisher-scan exam pattern remains illustrative because it differs from the official DU 2025–2026 notice.

## RU C Unit Science — third-party candidates for browse/review

- `ru-c-*.json` — 44 packs, 4,009 candidate questions from academic sessions 2010–2011 through 2025–2026.
- `assets/lokkho/*.png` — 45 normalized local images referenced by 46 question asset paths.
- Candidate subjects: Physics, Chemistry, ICT, Biology and Higher Mathematics.

**Verification boundary:** all 4,009 RU candidate question contents and answer keys remain `unverified`. The data originates from a third-party question bank and does not prove each item maps to the exact official paper/session/set. The 158 source records with other subject labels and 18 records without usable options are not part of these 44 packs; they remain preserved in the external review ledgers. Fourteen questions have exact duplicate option text and require review.

The verified-only pool requires verified content and answer keys, so this batch contributes **zero verified-eligible questions**. A separate provisional mode enables practice from **3,991 structurally safe candidate questions** where no verified pool is available; 18 items with duplicate normalized option text are withheld from provisional scoring. Feedback is based on the third-party source key, may be wrong, and is never described as verified/official. All 4,009 records keep their `unverified` statuses. No historical exam count, duration, subject-selection rule or marking rule has been inferred; RU exam rules are not configured.

Use the validator and generated indexes after changing packs:

    pnpm packs:validate data/question-packs/<file>.json
    pnpm question-assets:index
    pnpm packs:index

Image assets must be local PNG files under `assets/lokkho/` and referenced with that relative path. `question-assets:index` generates the static Metro asset map used by `QuestionCard`; dynamic `require()` paths are not supported by Metro. Re-imports are transactional/idempotent and preserve user attempts/bookmarks. Keep the external source captures immutable and never promote unverified answers just because they are present in the third-party HTML.
