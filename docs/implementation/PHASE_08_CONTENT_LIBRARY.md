# Phase 8 — Publications & Books Library

**Status:** Implemented — Pending Owner Verification (2026-11-13). Related local commit: see `git log` entry "feat(library): phase 8 publications and books library".

## 1. Objective
Turn the Phase 8 foundation into a working feature: publisher library, publisher and book detail pages, chapter/unit browsing, book/unit practice reusing Flash/Exam/Browse, a versioned importer/validator, and authentic university/publisher logo rendering through a shared SVG system.

## 2. Initial state
Phases 1–7 committed (HEAD d7c9534). Uncommitted from the earlier Phase 8 session: migration v8, `PoolFilter.bookId/unitId`, route params, book scope in setup screens, `src/repositories/library.ts`, importer, validator, library pack type, `app/library/*` screens, `BookMeta`, `PublisherMark` (monogram only), `tests/library.test.ts`. The importer already upserts the book before its units (FK ordering fix) — confirmed retained.

## 3. Relevant findings
- Home had translation keys for the library but no navigation entry.
- No SVG pipeline existed; `react-native-svg` was not installed. Expo SDK 57 pins `react-native-svg` 15.15.4.
- Sessions persist `filter_json` (includes bookId/unitId) so history/result can resolve book identity without schema change.
- Publisher official sites expose no vector logos; DU/JU/RU vectors exist on Wikipedia/Commons; HSTU publishes only a PNG.

## 4. Implementation approach
Preserve existing architecture; add only what was missing: logo system, Home entry, publisher category sections, book identity in history/result, tests, docs.

## 5. Technical decisions
- **SVG:** `react-native-svg@15.15.4` (SDK-pinned) + `react-native-svg-transformer` in `metro.config.js`, set as `babelTransformerPath` before `withNativeWind` wraps the config (NativeWind delegates non-CSS files). `.svgrrc.js` keeps `viewBox` and drops fixed width/height so artwork scales without distortion. `svg-env.d.ts` types `*.svg`.
- **Shared renderer** `BrandLogo` takes a `LogoAsset` (`svg` component or `raster` source) and draws it unchanged (contain) on a white tile; monogram fallback only when no asset is registered. `UniversityLogo` and `PublisherMark` delegate to it.
- **Registries** use static imports (Metro requirement): `universityLogos.ts`, `publisherLogos.ts` (`publisherLogoFor(logoKey, slug)`).
- **Publisher sections** are derived purely from stored metadata (`groupBooksIntoSections`), never shown when empty.
- **History labels** use one batched query (`getScopeLabels`) instead of per-session lookups.

## 6. Files
Created: `src/components/ui/BrandLogo.tsx`, `src/features/branding/logoAsset.ts`, `svg-env.d.ts`, `.svgrrc.js`, `assets/universities/{du,ru,ju}.svg`, `assets/universities/hstu.png`, `assets/universities/SOURCES.md`, `assets/publishers/README.md`, `tests/brandAssets.test.ts`, this document (plus the earlier-session files listed in the log).
Modified: `metro.config.js`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `UniversityLogo.tsx`, `PublisherMark.tsx`, `universityLogos.ts`, `publisherLogos.ts`, `app/(tabs)/index.tsx`, `app/library/index.tsx`, `app/library/publisher/[id].tsx`, `app/history.tsx`, `app/result/[id].tsx`, `src/features/library/model.ts`, `src/repositories/library.ts`, `src/i18n/translations.ts`, `tests/library.test.ts`, plus the earlier-session modified files.

## 7. Database / migration
Migration v8 `publications_library` (earlier session, unchanged): `publishers`, `content_books`, `content_units`, `content_unit_questions`; five metadata-only publishers. No new migration this session.

## 8. Dependencies
Added `react-native-svg@15.15.4` (SDK 57 bundled version; native module included in Expo Go/dev-client builds of SDK 57, so a native rebuild is needed for the owner's dev client) and dev dependency `react-native-svg-transformer@^1.5.3`.

## 9. Implemented functionality
- Home → Publications → Publisher → Books (grouped sections) → Book details → Chapters/Units → Flash / Custom Practice / Browse for the whole book or a unit.
- Honest empty states: all five publishers are metadata-only; no books or counts are fabricated.
- Verified/provisional eligibility rules and university-pool isolation retained (covered by existing tests).
- Importer: versioned pack, grouped multi-row SQL in one transaction, downgrade refusal, duplicate-id refusal across batches, soft removal/reinstall, user data untouched.
- Book/unit identity shown on setup, history and result screens; "Practice again" keeps the scope.
- Logos: DU, RU, JU (original SVG) and HSTU (official PNG) render through `BrandLogo`; sources in `assets/universities/SOURCES.md`.

## 10. Known limitations
- No real book content exists; the library is empty until a pack is supplied.
- No publisher logos bundled (none retrievable); monogram shown. HSTU is raster.
- DU/JU/RU files come from Wikipedia/Commons, not institutional master files.
- SVG rendering not yet run in Metro or on a device; RU SVG is large (~130 KB source).
- No in-app pack import UI (packs install through the service/seed path).

## 11. Checks actually run (Node 22.23.1)
`tsc --noEmit` exit 0; `node --test tests/library.test.ts tests/brandAssets.test.ts` exit 0; SVGR transform of du/ru/ju verified viewBox retained; `git diff --check` clean. Lint result recorded in IMPLEMENTATION_LOG. Follow-up CI-equivalent export passed: pnpm exec expo export --platform android --no-bytecode (Node 24.19.0) generated the 3.9 MB Android JS bundle, validating Metro + SVG transformer compilation. A separate default bytecode export failed at the host Hermes compiler with SIGILL; no SVG-specific transform error was reported. Full suite, EAS, device and visual QA remain unrun.

## 12. Deferred owner testing
Rebuild the dev client (new native dependency); confirm logos render and scale on device in light/dark; open Library from Home; check empty states; install a real pack and exercise Flash/Custom/Browse by book and unit; history/result labels; Bangla text.

## 13. Remaining work
Owner-provided content packs; publisher SVGs; institutional master SVGs for DU/JU/HSTU; Bangla publisher name verification.

## 14. External dependencies
Owner: content packs and licence records, logo files.

## 15. Next phase
Phase 9 (optional) builds local install/removal/version contracts on this importer; see PHASE_09_ONLINE_OFFLINE.md.


## ASPECT Science Master QB — approved content intake (2026-11-13)

The owner confirms full permission to digitise and transcribe the purchased ASPECT book, store its structured content in the project, bundle it for offline use and distribute it inside BD Admission App. Use `licenseStatus: "licensed"` and record the owner-confirmed authorization in `licenseNote`. Do not pause work for a separate permission review.

Source: `/home/kali/gpt-workspace/bd-admission-app-data/master-qb/@AdmissionStuffs_Aspect Varsity Solution Master QB - Science.pdf` — 1,027 pages; SHA-256 `b88b45ed5863385d98a3a43f8232562d51628208d06c0c7a6898bb7f203c83fa`.

ASPECT publisher ID `pub-aspect` already exists. Use the existing LibraryPack schema/importer. Extract the full question bank, ordered options, answer markers, explanations, formulae, diagrams and printed university/year/unit/set references. Add any needed MathText, static asset, structured-reference and library UI support as implementation work. The source is image-based: render pages, use Bengali-capable OCR where helpful, and visually reconcile each extracted record. The watermark does not block the workflow.

**Execution is pending:** page inventory, transcription, pack generation, import, automated validation and Android QA must be performed and documented. See `docs/audits/ASPECT_MASTER_QB_IMPORT_AUDIT_2026-11-13.md`.
