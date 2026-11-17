# ASPECT / RU question bank — owner verification attestation

Book: `aspect-ru-question-bank-verified-sets` · pack `data/library-packs/ruv-aspect-library-pack.json` · content version 2.
Attestation date: **2026-11-18**. Applied by `scripts/ruv-aspect-attest.mjs` (idempotent; `--check` exits 1 if the pack is not in the attested state).

## What the owner attested

The owner personally reviewed the imported questions and their source-printed answers and instructed that **the imported source
answers are the source of truth**. The owner also confirmed that the publication, logo and related use permissions are obtained.

This is an owner attestation. It is **not** an independent solving of the keys by the app team and **not** a university-certified
answer key. The pack's coverage note, licence note and rights reference say so.

## Resulting state (1,828 questions)

| Disposition | Count | Answer / content status | Scored? |
| --- | ---: | --- | --- |
| Single printed key (1,797 as imported + 1 restored) | 1,798 | verified / verified | yes |
| Multiple printed keys (5 with two, 1 with three) | 6 | verified / verified | yes, exact-set scoring |
| Source prints no correct option (`no_correct_option`) | 22 | verified (source disposition) | never; browse only |
| Source key conflicts with printed working (`source_conflict`) | 2 | unverified | never; key withheld |

Verified total 1,826; scored pool 1,804 (1,798 + 6). Book `verificationStatus` is `verified`, `licenseStatus` is `licensed`.
Option ids, option order and question text were not changed. No key was invented.

## Conflict and duplicate decisions

The reconciliation originally flagged 3 conflicting keys and 11 duplicate-option questions.

- **RMS-speed question (page 140, no. 7): key `c` restored.** The printed working gives √(3R), which equals option c once a
  square-root glyph lost in extraction is accounted for; the printed marker is `c`.
- **Circle question (page 87, no. 65): held, unscored.** The printed working gives c = 25, which is option b, while the printed
  marker is `c` (√15). The source contradicts itself.
- **Vector question (page 56, no. 12): held, unscored after direct PDF-page review (2026-11-18).** The original page image shows
  option C with `+2/7 k̂`, while the printed working derives `−2/7 k̂`; the printed marker is C. The source therefore contradicts
  itself. The answer remains withheld and the question stays unverified/unscored; do not add it to `RESTORE` unless a corrected
  source edition resolves the contradiction.
- **11 duplicate-option questions: no hold needed.** In 10 the duplicated text is among the wrong options, so the key is
  unambiguous. The 11th only looked duplicated because a lowercase comparison folded `L` and `l`.
- **Durable guard:** `ELIGIBLE_SQL` now excludes any question whose correct option duplicates another option's text. It affects
  none of the current records but protects future imports.

## User-facing effect

Question cards show answer/content status chips from the stored statuses, so the Provisional/Unverified chips disappear for the
1,826 verified questions and remain only for the 2 held questions. Library book chips show "Verified".

## Seed and upgrade handling

The pack's `contentVersion` went from 1 to 2. `pnpm content:build` regenerated `assets/content/content_seed.db` and
`src/content/bundledManifest.ts`. On an existing install the bundled-seed sync reimports the book because the bundled version is
newer than the installed one; the importer updates question statuses and book metadata in place and refuses downgrades
(ADR-039 keeps newer installed editions). Attempts, bookmarks and profile data are untouched.
