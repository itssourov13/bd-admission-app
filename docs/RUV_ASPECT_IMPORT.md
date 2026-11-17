# RU-V → ASPECT Library integration

> **2026-11-18 update:** the verification statements below describe the original import. The owner's attestation has since promoted 1,826 questions to verified (content version 2, book `verified`/`licensed`); see `docs/ASPECT_OWNER_VERIFICATION.md`. Re-running `scripts/ruv-aspect-build-pack.mjs --publish` regenerates the pack as unverified, so run `node scripts/ruv-aspect-attest.mjs` afterwards.

**Checkpoint:** 2026-11-17. The prepared RU-V publication is included in the repository's offline content seed and is synchronized into the local SQLite Library on app startup. This is a bundled content integration, not a new APK release or a claim that an already-installed device has received the update.

## Destination and source

- Library section/collection: **ASPECT**.
- Library book: `aspect-ru-question-bank-verified-sets` — *Rajshahi University Question Bank — Source Sets*.
- Publisher: `Unknown / not identified`; the inspected source PDF does not identify a publisher.
- Rights holder: unidentified. Licence: not verified. Permission status: `permission_pending` (informational metadata; it does not block internal preparation or bundled integration).
- Original source: `RU Question Bank.pdf`, SHA-256 `f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7`.
- External archive remains at `/home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/` (15 archived pack files representing 17 printed sets). The separate Lokkho archive remains outside ASPECT.

ASPECT is a Library collection, not the publisher. No unknown publisher or licence attribution has been invented.

## Integrated content

| Item | Count | Meaning |
|---|---:|---|
| Library books | 1 | One RU-V source publication under ASPECT |
| Printed source sets | 17 | The source's set identities |
| Library units | 26 | Existing book/unit hierarchy used to represent the 17 sets and their groupings |
| Questions | 1,828 | All prepared and mapped to source set/unit |
| Options | 7,312 | Four ordered options per question |
| Explanations | 1,828 | Source-derived explanations; no independent subject-expert review is claimed |
| Figure assets | 20 | Offline PNG crops, question-associated and hash checked |
| Provenance | 1,828/1,828 | Original PDF page and printed question number retained |

### Answer and practice semantics

All 1,828 questions are stored with `answerVerificationStatus=unverified` and `contentVerificationStatus=unverified`. The printed answer marker in the compiled PDF is retained as a provisional source key; it is not described as independently solved or university-certified.

- **1,797 single-choice source-marked records:** provisional source-key practice candidates before structural filtering.
- **31 explicit browse-only records:** 22 source `×` / no correct option; 6 multiple-answer questions; 3 source contradictions whose printed keys are withheld (PDF p87 Q65, p140 Q7 and p56 Q12).
- **11 further duplicate-option records:** retained for browsing but excluded by the provisional candidate query because identical normalized option text makes automatic scoring ambiguous.
- **Current provisional single-choice practice pool:** 1,786. This pool is explicitly provisional, not a verified/official practice pool. All 1,828 questions remain browsable in the Library.

### Excluded source records

The extraction ledger contains 1,982 raw records; 1,828 are in this LibraryPack and 154 remain outside it in the exclusion ledger:

- 38 are legitimate non-MCQ / written or other non-pack records.
- 116 are MCQs whose options were not reliably extracted and were therefore not reconstructed speculatively.

These excluded records are preserved in staging (`excluded-records.json` and `exclusion-review.json`) for any future targeted recovery. The current import scope is the 1,828 prepared MCQs, not a claim that every raw PDF record has been recovered.

### Explanation and visual-content status

All 1,828 question records have a source-derived explanation value after the extraction corrections (including the three previously short/missing source one-liners recovered from the extraction). This does not mean every explanation has been independently reviewed or rewritten. The existing explanation text was reused; corrections were applied through the reproducible overlay where recorded. All 20 figure assets are copied into the shared offline asset pipeline and their hashes match.

The question correction overlay has 1,563 entries across 752 questions (1,134 extraction fixes, 237 numbering rules, 192 manual corrections; 10 decisions). It is preserved under `scripts/ruv-aspect-corrections/`. The correction overlay, original PDF, extraction ledger and external source archive remain the reproducible inputs. No generated output was manually patched as the source of truth.

## Offline delivery architecture

1. The normalized staging output is built outside the repository at `/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging/` by `scripts/ruv-aspect-staging.mjs`.
2. `scripts/ruv-aspect-build-pack.mjs --publish` converts that staging output into `data/library-packs/ruv-aspect-library-pack.json` and copies the 20 PNGs into `data/question-packs/assets/ruv-aspect/`.
3. `src/content/questionAssets.ts` indexes the images for Metro/offline bundling.
4. `scripts/build-content.mjs` validates the LibraryPack, includes it as `lib-aspect-ru-question-bank-verified-sets` in the bundled manifest, and builds the SQLite content seed using `buildSeedDatabase` / `installLibraryPack`.
5. At startup, `syncFromSeed` copies the publication's publisher/book/unit tree and memberships alongside its question/source/option rows. The existing user SQLite database remains the runtime source of truth.

The seed-sync edition guard now checks the installed and bundled `content_version` before any shared question/source/option writes. If a user-installed Library edition is newer than the bundled copy, it is preserved; the older bundled signature is checkpointed as unchanged so that the skipped pack is not retried on each launch. A focused test covers changed book title, unit title, question text and option text for a synthetic newer edition.

The generated seed has schema `user_version=12` and currently contains:

| Seed item | Count |
|---|---:|
| Bundled manifest entries | 159 (158 university packs + 1 Library pack) |
| Question rows | 9,600 (7,772 university + 1,828 Library) |
| Option rows | 38,400 (31,088 university + 7,312 Library) |
| Library books | 1 |
| Library units | 26 |
| Library book-question memberships | 1,828 |

`contentTotals()` intentionally reports the university/paper catalogue separately (7,772 questions / 2,512 verified eligible / five institutions); Library counts are read through the book/unit repositories.

## Verification performed

All commands used Node 22.23.1.

| Verification | Result |
|---|---|
| `node --test tests/library-bundled-seed.test.ts tests/ruv-aspect-dry-run.test.ts tests/seed-startup.test.ts tests/ru-retirement-migration.test.ts tests/library-catalogue.test.ts` | 35/35 passed; includes fresh install, repeat sync, newer-edition preservation, real-seed schema-v10 upgrade, RU retirement and catalogue filtering |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm content:check` | Passed; 159 entries / 9,600 question rows |
| `pnpm question-assets:check` | Passed; 20 assets / 20 references |
| `node scripts/ruv-aspect-staging.mjs --verify` | Passed; 76/76 files |
| `node scripts/archive-ruv.mjs --verify` | Passed; 36/36 archive files |
| `node scripts/archive-lokkho.mjs --verify` | Passed; 90/90 archive manifest entries |
| Library pack JSON + figure SHA-256 | Pack hash and all 20 figure hashes passed |
| `pnpm exec expo export --platform android --no-bytecode --output-dir .local/ruv-aspect-export-check` | Passed; 1,994 modules, 100 assets including the 18MB seed and all 20 RU-V figures; ~4MB Android JS bundle |
| `git diff --check` | Passed |

The complete application test suite was not run; focused tests were selected for the changed Library seed/sync/retirement behavior. Metro export verifies JavaScript and bundled assets, not a native Android APK.

## Not performed / owner device follow-up

- No native APK/EAS build was produced in this task.
- No physical Android device or emulator installed the new seed; `adb` is not available on the current host, and the owner-verified v0.1.6 APK predates this RU-V Library integration.
- No device visual QA of Library discovery, ASPECT book detail, question/explanation layout, figure display, dark theme or TalkBack was performed.
- No claim is made that all 1,828 questions underwent individual visual PDF comparison or independent answer solving. The archive/source and staging verification records describe the evidence that exists.

A new Android preview build and upgrade installation are needed before the owner can confirm the on-device Library experience. No push was performed.
