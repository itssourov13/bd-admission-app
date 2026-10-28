# Bundled question packs

## DU A Unit — scanned question-bank practice

- `du-a-2024-2025.json` — 90 questions.
- `du-a-2025-2026.json` — 90 questions.

The supplied publisher scans and printed answer-key states are preserved. Three questions without a printed answer letter remain unknown; two additional content-unverified questions are not scored. The publisher-scan exam pattern remains illustrative because it differs from the official DU 2025–2026 notice.

## RU C Unit Science — third-party candidates for browse/review

- `ru-c-*.json` — 44 packs, 4,009 candidate questions from academic sessions 2010–2011 through 2025–2026.
- `assets/lokkho/*.png` — 45 normalized local images referenced by 46 question asset paths.
- Candidate subjects: Physics, Chemistry, ICT, Biology and Higher Mathematics.

**Verification boundary:** all 4,009 RU candidate question contents and answer keys remain `unverified`. The data originates from a third-party question bank and does not prove each item maps to the exact official paper/session/set. The 158 source records with other subject labels and 18 records without usable options are not part of these 44 packs; they remain preserved in the external review ledgers. Fourteen questions have exact duplicate option text and require review.

The RU packs are included for transparent browsing/review only. The app's scoring eligibility query requires both verified content and a verified answer key, so this batch currently contributes **zero practice-eligible questions**. No historical exam count, duration, subject-selection rule or marking rule has been inferred; RU exam rules are not configured.

Use the validator and generated indexes after changing packs:

    pnpm packs:validate data/question-packs/<file>.json
    pnpm question-assets:index
    pnpm packs:index

Image assets must be local PNG files under `assets/lokkho/` and referenced with that relative path. `question-assets:index` generates the static Metro asset map used by `QuestionCard`; dynamic `require()` paths are not supported by Metro. Re-imports are transactional/idempotent and preserve user attempts/bookmarks. Keep the external source captures immutable and never promote unverified answers just because they are present in the third-party HTML.
