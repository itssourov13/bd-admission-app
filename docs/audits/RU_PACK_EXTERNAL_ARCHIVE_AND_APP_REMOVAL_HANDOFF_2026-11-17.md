# RU Question-Pack External Archive & App Removal — Current-State Audit and Handoff

**Audit date:** 2026-11-17
**Repository:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch:** `feat/import-hstu-verified-answers-2026-11-12`
**HEAD at audit:** `c5ca075` — app-wide multi-select implementation
**Scope:** inspect and document only. No question-pack relocation, source-code edit or database migration was performed during this audit.

## 1. Owner decision (current and authoritative)

Move **all RU question-pack content** out of the BD Admission App repository and active application bundle into the external data workspace. Keep the two RU datasets completely separate:

1. **RU Lokkho candidate pack** — unverified third-party candidate content. Keep in its existing external archive.
2. **RU-V verified pack** — verified content from the owner-supplied RU Question Bank PDF. Create a separate external archive for it.

The owner will perform any later Library import. Do not generate, install or import a LibraryPack as part of this archival task.

Future Library intention: only the 17 RU-V source test sets may later be imported by the owner under **Publications & Books → ASPECT**. Lokkho must never be merged with RU-V or imported as verified content. Do not move JU, HSTU, DU or any other university's packs; their current app content stays unchanged.

This decision supersedes the earlier execution direction in ADR-032 and the previous RU-to-ASPECT implementation plan as to **when and who performs the import**. The long-term destination restriction remains RU-V only.

## 2. Verified repository inventory

The current `data/question-packs/` tree contains exactly two RU pack families:

| Dataset | File pattern | Pack files | Questions | Answer state | Other content |
|---|---|---:|---:|---|---|
| RU Lokkho | `ru-c-*.json` | 44 | 4,009 | All 4,009 unverified | 46 image references / 45 unique PNG assets |
| RU-V verified | `ru-vq-*.json` | 15 | 1,828 | All 1,828 verified | No image asset references |
| **Total** | | **59** | **5,837** | Separate statuses | 45 unique RU-only question assets |

Further verified details:

- RU Lokkho: all 4,009 records are `single_choice`, institution code `RU`, and answer status `unverified`. Pack JSON size total: 5,743,215 bytes.
- RU-V: 1,822 records are `single_choice` and 6 are `multiple_choice`; 22 of the single-choice records have the explicit `no_correct_option` disposition. Thus 1,800 are ordinary verified single-answer records, 6 are multi-answer records and 22 are non-scored no-correct-option records. Pack JSON size total: 3,188,697 bytes.
- RU-V's 15 JSON batches / current 15 paper rows represent **17 distinct printed source sets**. Two input batches each contain two separate source sets. Preserve that distinction in the archive and its README/manifest.
- The source PDF is already outside the app at `/home/kali/gpt-workspace/bd-admission-app-data/ru/RU Question Bank.pdf`. SHA-256: `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`.
- Related RU-V extraction/review work is already outside the repo in `/home/kali/gpt-workspace/bd-admission-app-data/ruv-work/`, including raw extraction, reconciliation and exclusion ledgers. Preserve it.

The only RU-related question assets in the app data tree are the 45 files under `data/question-packs/assets/lokkho/`. The `ru.svg` under `assets/universities/` is a university branding asset, not a question pack; do not remove it just because it contains “ru” in its name.

## 3. Current archive state

### Lokkho — archive already exists and verifies

Canonical external path:

`/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/`

The archive verification was run during this audit:

- `node scripts/archive-lokkho.mjs --verify` → `ok: true`
- 44 packs, 4,009 questions, 45 assets, 46 references / 45 unique assets.
- `SHA256SUMS` contains 90 entries; all 90/90 checks passed.
- The archive retains the Lokkho-specific status: unverified candidate material, not RU-V, not ASPECT.

**Important:** archive verification does not mean app cleanup is complete. All 44 `ru-c-*.json` files and all 45 Lokkho image files are still in the app repository and active generated content.

### RU-V — external pack archive does not yet exist

The proposed destination is:

`/home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/`

This path was checked and does not exist yet. The 15 `ru-vq-*.json` files still exist only in the app repository's question-pack tree. Create a separate archive with its own README, manifest, file sizes and SHA-256 list. Do not put them in the Lokkho archive.

Do not duplicate or move the original PDF/extraction workspace unnecessarily: they are already external. The verified archive should point to the source PDF hash and existing `ruv-work/` provenance/reconciliation material.

## 4. What is still inside the app

The current ignored generated SQLite seed is:

`assets/content/content_seed.db`

It was checked directly:

- SQLite `user_version = 10`.
- `PRAGMA quick_check` = `ok`.
- `PRAGMA foreign_key_check` = zero rows.
- 217 bundled packs / 13,609 questions in total.
- The seed contains all 44 RU Lokkho batches / 4,009 questions and all 15 RU-V batches / 1,828 questions.
- The generated `src/content/bundledManifest.ts` still lists the RU batch IDs.
- Current static Metro question-asset index contains the 45 Lokkho images.

Both datasets are still represented in the normal catalogue:
- Lokkho institution ID: `ru` / code `RU`.
- Verified RU-V institution ID: `ru-verified-bank` / code `RU-V`.
- Seed question appearances: 4,009 RU and 1,828 RU-V.

No migration has retired either dataset. No RU pack JSON or Lokkho image has been removed from the app.

## 5. Database and historical-data implications

Current content selection in `src/repositories/content.ts` treats a question as part of the active university catalogue when it has an active `question_appearances` row. University-filtered queries also join `question_appearances` to `exam_papers`. The current content-sync path copies packs from the bundled seed; it does not automatically delete old batch/question rows just because a batch disappears from the next seed.

Therefore, deleting JSON files and rebuilding the seed alone is **not** a complete existing-install migration.

The implementation must:
- Stop both RU families from appearing in new Varsity browse/practice/catalogue pools.
- Preserve question/source records needed by bookmarks, saved answers, existing sessions and historical result screens.
- Preserve enough provenance to render historical question/source information after active catalogue entries are retired.
- Handle existing sessions whose filters reference RU/RU-V paper or institution IDs.
- Avoid destructive question-row deletion or blind foreign-key cascades.
- Test both fresh installation and upgrade from a pre-retirement schema-v10 database.

Inspect actual foreign keys and all repository/UI queries before choosing the retirement representation. A retirement/tombstone or another scoped migration strategy may be preferable to deleting question rows. Preserve the RU university branding SVG and unrelated university code.

## 6. Phase C status at this audit

Phase B is committed at `c5ca075`. Phase C changes are present in the working tree but **uncommitted**.

The current uncommitted Phase C footprint is 21 files: 14 modified and 7 new. It includes:
- Generalized asset scanning/indexing (`scripts/lib/asset-index.mjs`, `scripts/build-question-assets.mjs`).
- Shared path/reference validation (`src/services/assetRefs.mjs` and declaration).
- SQLite migration v10 for option and explanation image paths.
- Importer, LibraryPack importer/validator, seed-sync and repository propagation for stem/option/explanation asset paths.
- Shared `QuestionFigures` renderer and figure aspect-ratio helper.
- Asset-index and asset-pipeline tests.
- `question-assets:check` script in `package.json`.

Recorded local verification on Node 22.23.1:
- `pnpm content:build`: passed; 217 packs / 13,609 questions; seed 22.75 MiB.
- `pnpm content:check`: passed.
- `pnpm question-assets:check`: passed; 45 assets / 46 references (45 unique).
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: 267/267 passed.
- `git diff --check`: passed.
- Android no-bytecode Metro export: passed; approximately 4 MB Android JS bundle and local image assets exported.
- Physical Android/device testing was not performed.

Phase C is not fully complete as an educational visual/math capability:
- The current implementation renders bitmap assets in question stems, options and explanations, and validates their offline references.
- Existing `MathText` was not changed in this Phase C diff.
- Structured matrix/graph/circuit rendering and source-driven RU diagram/figure extraction are not complete.
- The generated asset registry still includes Lokkho's 45 images until the RU content cleanup is done.
- Asset-check script exists, but the current `.github/workflows/ci.yml` does not yet run `pnpm question-assets:check`.
- LibraryPack asset support is tested using synthetic fixtures only; there is no real `data/library-packs/` content directory or installed ASPECT pack.
- Phase C documentation has not yet been reconciled with these changes, and no Phase C commit exists.

Finish/review the existing Phase C work, update its docs and commit it only after the relevant checks pass. Do not claim complete structured math/diagram support if it remains unfinished.

## 7. Required next task — archival and app removal

The next Claude session should:

1. Preserve the existing Phase C working tree and verify it before changing anything.
2. Finish Phase C documentation/verification and commit Phase C separately.
3. Verify the existing Lokkho archive again.
4. Create and verify the separate RU-V archive at `ru/verified-pack-archive/`.
5. Reconcile both archives against all 59 current RU pack source files and all 5,837 question records; record file counts, sizes, hashes and content counts.
6. Only after both archives pass, remove the 44 Lokkho and 15 RU-V JSON packs and the 45 Lokkho-only question images from active app content.
7. Rebuild the generated asset index, bundled manifest and SQLite seed so neither RU dataset is present as active bundled content.
8. Implement a safe migration from existing schema v10 installations so RU content is no longer selectable, while historical records/bookmarks/sessions/results and source provenance remain usable.
9. Verify that all non-RU content (the other 158 pack files, their questions and their assets) remains intact and behaves as before.
10. Verify fresh install, schema-v10 upgrade, content checks, all tests, typecheck, lint, asset checks and Android Metro export.
11. Update project documentation and commit the archival/removal/migration work locally.

## 8. Explicitly deferred — do not implement now

- Do not create or import a RU-V LibraryPack.
- Do not create the ASPECT Question Bank UI/card or restructure the Library.
- Do not import Lokkho or create a Lokkho Library book.
- Do not migrate JU, HSTU, DU or any other verified university content into ASPECT.
- Do not remove non-RU question packs.
- Do not begin unrelated feature work or continue the broader Library/CMS roadmap.

The owner will handle the later Library import. The future content target is only the RU-V verified dataset: one RU Question Bank under ASPECT, containing 17 separate test units. Lokkho stays external and unverified. Keep these archives separate and ready for owner-led import/review.

## 9. Git checkpoint

At audit time:
- Branch: `feat/import-hstu-verified-answers-2026-11-12`.
- HEAD: `c5ca075`.
- Phase C source changes are uncommitted in the working tree.
- No question-pack data has yet been moved or removed.
- This audit/doc update is a documentation checkpoint; do not discard or overwrite the existing source changes.
- Do not push to remote.
