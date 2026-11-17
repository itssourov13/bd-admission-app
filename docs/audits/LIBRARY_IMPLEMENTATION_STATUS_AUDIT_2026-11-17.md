# Publications & Books Library — implementation status audit

**Audit date:** 2026-11-17
**Status:** Foundation implemented; end-to-end publishing/content delivery is incomplete.
**Repository:** /home/kali/gpt-workspace/bd-admission-app
**Branch / HEAD:** feat/import-hstu-verified-answers-2026-11-12 / a5c46ed
**Scope:** Read-only code/docs/test audit. No app, question data, DB, seed or asset changes.

## Executive verdict

The Library is **not fully complete**. Phase 8 delivered a real local Library foundation and user-facing browse/practice routes. It is more than a mock screen: the database schema, publisher/book/unit repository, LibraryPack v1 contract, validator, transactional importer, book/unit scope routing and core tests exist.

However, it is not yet a complete end-user publishing and content-delivery feature:

- The five publishers are seeded as metadata-only entries. ASPECT exists as pub-aspect, but currently has **zero books and zero Library questions**.
- No real LibraryPack JSON/published book is present in the repository.
- installLibraryPack() exists, but the app has no Library import/install UI, no app-level call site that invokes it with an actual pack, and no configured ContentSource/catalogue. The optional content-manager service is currently an unconnected service layer.
- No backend/CMS/catalogue host is implemented; Phase 10 is a documented contract only.
- Multiple-answer question interaction is still single-select and the eligibility query excludes multiple_choice.
- The local image resolver works for current Lokkho assets, but its generator indexes only data/question-packs/assets/lokkho; it is not yet a general LibraryPack asset pipeline.
- MathText already handles common powers/charges/subscripts and a small LaTeX subset, but not a general mathematical layout engine or full matrix/diagram needs.
- Phase 8 owner/device visual verification remains outstanding.

**Scope clarification (owner, 2026-11-17):** the multi-select and diagram/visual-content gaps identified here are app-wide platform gaps, not RU-V-only tasks. The shared question components, practice/exam controllers, persistence/scoring and asset/rendering pipeline must support every university/paper pack, active bundled question pack, LibraryPack and future imported source. RU-V is one acceptance dataset only. Content-specific asset extraction remains per source; the renderer and offline asset infrastructure are shared. See ADR-033.

**Bottom line:** The current publisher → books → units → browse/practice foundation is implemented. The real ASPECT book and reliable full content lifecycle are not.

## 1. What is implemented

### 1.1 Navigation and screens

- Home contains a Publications & Books shortcut to /library.
- /library lists publisher metadata and honest book/question counts.
- /library/publisher/[id] shows publisher details and groups actual books into Books / University / Engineering / Medical / Subject / Other sections.
- /library/book/[id] shows book metadata, provenance, availability and question counts.
- Book unit/chapter tree is rendered using parent/depth and descendant question counts.
- Book-level actions: Flash practice, Custom Practice / Standard Exam, and Browse.
- Unit-level actions: Flash practice and Browse. There is no visible per-unit Standard Exam action on the unit row yet.
- History/result scope labels can resolve book/unit names; practice-again routing retains the book scope.
- Bangla/English text, loading/error/not-found and honest empty states exist.

### 1.2 Database and data model

Migration v8 (publications_library) creates:
- publishers
- content_books
- content_units
- content_unit_questions

Library content is kept separate from university paper appearances, while reusing shared question, option, source and practice-session storage. Library membership is recorded through content_unit_questions.

The migration seeds exactly five publisher metadata rows: Udvash, ASPECT, ACS, Pankouri and Joykoli. These are metadata-only. The Library test explicitly checks the five publishers and confirms ASPECT has zero available books after a fresh migration.

### 1.3 Pack schema, validation and import

Existing source files:
- src/types/library-pack.ts
- src/services/libraryPackValidator.ts
- src/services/libraryImporter.ts
- src/repositories/library.ts
- src/features/library/model.ts

The version-1 LibraryPack supports publisher, book, source documents, hierarchical units, question records, question membership and source provenance.

Validator checks structural IDs, unit-parent references/cycles, question/option structure, key references, verification state, unit membership, source-document references and content licence eligibility.

installLibraryPack():
- installs in one SQLite transaction;
- refuses downgrades;
- refuses question/source IDs already owned by another import batch;
- replaces the book's unit/membership tree;
- keeps question rows that leave a later pack version, so bookmarks/history can continue resolving;
- refreshes book/unit counts;
- does not modify user-owned bookmark/session/result tables.

Soft removal marks a book removed rather than deleting question/user history; local restore works while content rows still exist.

### 1.4 Reuse of common practice engine

Book/unit scope is carried using bookId and optional unitId in existing pool filters/routes. Repository queries constrain membership to the selected book and selected unit plus descendants. Tests cover book isolation from the normal university pool, browse order, descendant counts, custom unscored book exam, scope labels and history.

## 2. What is not implemented / remaining gaps

### P0 — Real ASPECT content is absent

- pub-aspect exists only as publisher metadata.
- No ASPECT Master QB LibraryPack or other LibraryPack JSON is present in the repository.
- No questions, units, covers or real book counts are installed for ASPECT.
- The ASPECT Science Master QB intake document itself says extraction, transcription, pack generation, import, validation and Android QA are pending.

Therefore, a user can open the publisher page but will see the honest no-books/empty state. A complete end-to-end ASPECT book experience has not yet been delivered.

### P0 — Pack installation is not connected to a user/runtime flow

Repository search shows installLibraryPack() is called by contentManager.ts; that service has no caller in the app UI. There is no Library import screen, install/update/remove manager screen, or actual ContentSource adapter configured. No real pack exists to exercise this path.

There are two viable future delivery choices, to be selected for the RU-V ASPECT book:

1. **Bundled/offline-first:** generate the RU-V LibraryPack at build time and explicitly install/sync it as bundled content on fresh install and app update.
2. **Optional download:** supply a real static catalogue/pack host, a ContentSource adapter, integrity hashing, and a user-facing install/update flow.

The app currently implements neither end-to-end delivery choice for a real book. Do not confuse the transactional importer with an implemented publishing pipeline.

### P1 — App-wide multiple-answer practice is incomplete

Current implementation still has:
- ELIGIBLE_SQL restricted to single_choice;
- Flash calls the controller with a one-key array immediately on tap;
- Standard Exam choose() stores either [] or [key];
- QuestionCard labels multiple_choice but exposes choices with radiogroup/radio accessibility semantics.

The data schema can store multiple correct keys and the scoring helper can compare arrays, but the student-facing interaction cannot choose multiple keys. This must be fixed before enabling the six RU-V multi-answer questions in any scored Flash/Standard pool or ASPECT book.

Required app-wide implementation: type-aware radio/checkbox choice controls; toggleable multi-select choices; explicit Flash submit; Standard Exam and Custom Practice selection; array persistence/resume; source-backed scoring (exact-set comparison by default unless an official rule defines otherwise); selected-vs-expected review; and regression tests across university packs and LibraryPacks. Do not mark partial selections as fully correct without a verified scoring rule. This is one shared engine capability, not a per-pack RU implementation.

### P1 — App-wide visual asset support is not generalised

- QuestionCard already renders local images referenced by assetPaths.
- scripts/build-question-assets.mjs currently scans only data/question-packs/assets/lokkho.
- The generated src/content/questionAssets.ts map therefore only knows those Lokkho paths.
- LibraryPack/importer can carry assetPaths into SQLite, but an arbitrary ASPECT LibraryPack path will not automatically resolve to a static Metro asset.
- LibraryPack validation does not currently guarantee that each referenced path exists in the bundled static asset registry.

Generalise the asset build/index pipeline for every active supported content source, validate every local reference, and test the built offline bundle. This must serve legacy/current university packs and LibraryPacks through the same renderer. Source-specific extraction still happens per bank. Lokkho's existing assets are not thereby intended for ASPECT; they remain archive assets under the owner's separate decision.

### P1 — App-wide math/diagram fidelity

The shared MathText/QuestionCard path already formats common exponents, ionic charges, subscripts, unit-vector hats and a small explicit LaTeX subset (including simple fractions). It intentionally leaves unsupported/ambiguous expressions unchanged. It is not a full TeX/math layout engine and does not reconstruct graphs, matrices, circuits or diagrams.

Required app-wide baseline, with source-specific inventories performed independently for each bank:
- use one renderer for visual content in question stems, options and explanations regardless of whether the record came from a university pack or LibraryPack;
- inventory which questions genuinely require a visual and attach the appropriate source-page crops/assets;
- correct structured matrix/vector/fraction notation where plain text is inadequate;
- validate every offline asset reference and test long formula wrapping, mixed Bangla/Latin notation, mobile scaling and accessibility across representative content sources.

### P1 — Phase 9 content lifecycle is only partial

Phase 9 provides pure manifest validation/planning, injected source/hash interfaces, integrity checks, calls to the importer, installed-book listing and soft remove/restore contracts.

It does not provide:
- a real ContentSource implementation;
- a catalogue endpoint/host;
- a hash implementation wired to the app;
- install/download/update/remove UI;
- download progress/resume;
- storage accounting;
- manifest signature verification.

Phase 10 backend/CMS is deferred and documented only. No server, admin portal, content host, credentials, signing keys or publishing workflow exists.

### P2 — UI/owner QA and polish

Not verified in this audit:
- real ASPECT publisher/book content visual design;
- on-device navigation and layout in Bangla/English;
- logo/cover behaviour with real content;
- full Light/Dark and Android device QA;
- long book/unit hierarchy and large question-bank list performance;
- accessibility pass on all Library controls;
- per-unit Custom Practice action (current unit rows offer Flash and Browse only);
- Library search/filter/sort needs for a large catalogue.

## 3. Tests and verification run in this status audit

Environment: Node v22.23.1.

| Check | Result |
|---|---|
| node --test tests/library.test.ts tests/contentManager.test.ts tests/brandAssets.test.ts | **25/25 passed** |
| pnpm typecheck | **Passed** |
| pnpm lint | **Passed** |
| Git diff whitespace check | Passed as part of documentation update |
| Metro/Android export in this audit | Not run |
| Physical Android visual QA in this audit | Not run |
| Real ASPECT LibraryPack install | Not possible; no pack/caller/source exists |

The 25 tests are valuable service/repository/model tests using synthetic LibraryPacks. They do not prove that a real ASPECT book has been bundled, installed or visually exercised.

## 4. Phase status

| Phase | Audited status |
|---|---|
| Phase 8 — Library UI/schema/importer foundation | Implemented; pending owner/device verification and real content |
| Phase 9 — Online/offline content lifecycle | Partially implemented; local contracts only; no UI/source/hash wiring |
| Phase 10 — Backend/CMS | Deferred; contract documentation only |

## 5. Recommended completion sequence for the RU-V ASPECT book

1. Finish the RU-V source audit and lock the 17-set manifest (only RU-V goes to ASPECT).
2. Create a deterministic conversion/build script from existing RU-V question-pack batches to one LibraryPack with one book and 17 test units. Preserve question IDs, source pages, printed question numbers, options, keys, explanations and verification states.
3. Choose and implement the real delivery path (for this offline app, bundled pack/seed integration is likely the simplest; verify startup/build impact first).
4. Build the app-wide offline visual-asset registry/validation pipeline for all active question packs and LibraryPacks; keep per-bank source inventories separate.
5. Implement multi-select interaction, persistence, scoring and review once in the shared engine, then test it against multiple content origins before enabling any multi-answer pool.
6. Complete shared MathText/diagram rendering from representative source inventories across the app; use faithful source images where they are better than reconstructing a diagram.
7. Verify book/unit browsing, Flash, Custom Practice, result/history labels, offline use and all source counts.
8. Test fresh install and upgrade from a database with existing bookmarks/attempts/results. Cut RU-V out of the university-paper catalogue only after ASPECT Library content passes both paths.
9. Run full tests/typecheck/lint/Metro export and Android device visual/accessibility QA.

RU Lokkho stays outside ASPECT in the external archive. It is not a second book and must not enter this RU-V LibraryPack.

## 6. Change boundary

This was a read-only implementation audit plus documentation update. No code, pack JSON, question record, SQLite database, seed, publisher data, assets or Git history was changed. No commit or push.
