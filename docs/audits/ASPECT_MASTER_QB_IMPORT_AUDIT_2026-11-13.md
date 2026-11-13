# ASPECT Master QB — intake and import-readiness audit

**Audit date:** 2026-11-13
**Scope:** Read-only source and app-capability assessment. No question transcription, OCR batch, pack creation, import, app-code change, build or device installation was performed.

## Executive finding

The existing Publications Library can host an ASPECT book as a question-bank/book pack and reuse the current Browse, Flash and Custom Practice flows. It already has an ASPECT publisher identity (`pub-aspect`).

The supplied PDF is **not import-ready as-is**. It is a large, image-only scan; `pdftotext` returned no question text for the sampled opening pages. Its visible watermark overlaps question/solution content, although the pages remain renderable and much of the text and formula work is visually legible. A carefully reviewed, page-referenced transcription is technically feasible, but OCR output cannot be trusted without human correction—especially for formulae, matrices, symbols, diagrams and answer markers.

There is also a separate rights gate: the file's PDF permissions set copying to “no”, and the watermark credits Admission Stuffs. The file does not establish that the owner has permission to redistribute ASPECT's questions, explanations, formulae or references in this app. **Do not import or ship this source until the relevant rights holder has provided explicit written permission for digitisation and in-app distribution.** Keep its pack at `permission_pending` until that is resolved; the existing library validator correctly refuses question-bearing packs with that status.

## 1. Source file facts

| Field | Observed value |
|---|---|
| Path | `/home/kali/gpt-workspace/bd-admission-app-data/master-qb/@AdmissionStuffs_Aspect Varsity Solution Master QB - Science.pdf` |
| SHA-256 | `b88b45ed5863385d98a3a43f8232562d51628208d06c0c7a6898bb7f203c83fa` |
| Size | 464,316,608 bytes (about 443 MiB) |
| Pages | 1,027 PDF pages |
| Page size | A4 |
| PDF version | 1.7 |
| Encryption | AES-256 |
| PDF permissions | Print allowed; copy, modification and annotation disallowed |
| Metadata | Title/Subject “comined”; Author CamScanner |
| Text layer | No usable text was returned by `pdftotext` for PDF pages 1–2; representative pages rendered normally |

The source is an image scan, not a selectable-text PDF. Rendering with Poppler succeeded. A small sample of pages was rendered for visual inspection, including cover/introduction pages and interior science question/solution pages (PDF pages 1–3, 50, 500 and 1,000). This was a representative sample, not a 1,027-page completeness or legibility review. No bulk OCR was run.

### Watermark and readability

The scan contains several repeated overlays: “PDF Credit - Admission Stuffs”, a central translucent Admission Stuffs crest, a red “ADMISSION STUFFS” band, and Telegram/channel text near page edges. On the inspected interior samples:

- Question stems, choices, topic labels, university abbreviations and many worked solutions remain readable.
- The central crest/red text crosses some printed content. Where it overlaps small text, signs, subscripts, matrix entries or answer markers, it can cause OCR character substitutions or missed content.
- Dense two-column layouts, small Bengali type, fractions, vectors, matrices, chemical notation and diagrams need page-level visual proofreading. The watermark is an accuracy risk, not a complete rendering blocker.

Do not remove, erase or crop out the watermark as an extraction shortcut. Preserve source pages and page coordinates in the working evidence so each transcribed item can be checked against its source.

## 2. Edition and provenance caution

The local scan's title/cover describes a topic-based “Varsity Solution / Master Question Bank” and credits Admission Stuffs. The ASPECT Series public shop has a related science question-bank listing described as the June 2026 edition and 952 pages. The local file has 1,027 PDF pages and different visible cover wording; it may be a different compilation, scan, or edition. This audit does **not** establish that the local PDF is an official ASPECT-distributed file or the same edition as the shop listing.

References:
- [ASPECT Series — science question-bank listing](https://books.aspectseries.bd/book/Varsity-Solution-Year-Science)
- Source-file identity and SHA-256 above.

Before assigning a canonical book title, edition, publication year, publisher metadata or verification state, confirm the exact edition and provenance with ASPECT. Do not infer those fields from the watermark or uploader label.

## 3. Existing Admission App support

The app already seeds the ASPECT publisher row:

- Publisher ID: `pub-aspect`
- Slug: `aspect`
- Name: `ASPECT`
- Bangla label currently seeded as `অ্যাসপেক্ট`

Phase 8 Publications Library is implemented, but the publisher records are metadata-only and no real ASPECT book content is currently installed.

The current `LibraryPack` contract can represent:

- Book identity, edition, publication year, language, category, content type, subject and version.
- A hierarchy of chapters, topics, sections and tests.
- MCQ stem and option text, single- or multiple-choice type, subject/topic, source-document ID, source PDF page and printed question number.
- Optional explanation/solution text, answer-key status, content-verification status and local image asset paths.
- Book/unit membership and the printed order of questions.

A valid pack is installed transactionally through `installLibraryPack`; the current app has no in-app file picker/import screen. Pack data must be prepared in the app's content pipeline. Questions are kept separate from university paper appearances and can be browsed/practised in the selected book scope. A book import does not automatically create official university paper/year records.

### What the current UI can display

- Question stem and choices.
- Explanations/solutions in the existing question-card reveal surface.
- Superscript/subscript/charge notation and a limited set of simple LaTeX-like expressions through `MathText`.
- Local PNG figures/diagrams referenced through the generated static asset map.
- Book/chapter/topic structure and book-scoped Browse/Flash/Custom Practice.

### Current limitations

1. **Not a full digital textbook reader.** The library has no prose-page, formula-index, reference-table, glossary or PDF-viewer content model. The current book screen shows metadata, actions and units; it does not render arbitrary textbook pages.
2. **Math rendering is intentionally partial.** Simple forms such as `H_2`, `10^23`, `Cu^2+`, `x_{n-1}` and simple fractions can be formatted. Complex/nested LaTeX, multi-line derivations, matrices, dense tables and unusual symbols are not a general TeX renderer. Those need a carefully transcribed supported text form or a local image asset.
3. **Image indexing is currently narrow.** Question images are local/static and the existing generator is hard-coded to `data/question-packs/assets/lokkho` and PNG. An ASPECT asset directory needs an explicit, maintainable extension to the asset indexer; do not add dynamic runtime file paths.
4. **Publisher/source references are not fully surfaced.** The library pack stores a source PDF page and question number, but the current `QuestionCard` source footer is driven by university paper appearances. Library-only questions have no such appearances, so the book page reference is retained in data but is not currently displayed as a structured per-question citation.
5. **University-year mapping is not modelled by the library pack.** The book can retain printed reference text in `topic`/`explanation`/source notes, but it does not create structured DU/JU/RU/etc. appearances. If the product requirement is filter/search by university, session, unit or year, the library schema and UI need an explicit reference model first. Do not invent official paper identities from shorthand printed in the book.

## 4. Licensing and import gate

The library validator allows question-bearing packs only when `licenseStatus` is `licensed`, `public_domain` or `owner_created`. `permission_pending` and `metadata_only` are metadata-only states and cannot install question content. This is the correct state for this source until permission is evidenced.

The Bangladesh Copyright Act, 2023 protects literary and other listed works and treats reproduction of the whole or a substantial part as a copyright-controlled act, subject to statutory exceptions and their prescribed conditions. Do not assume that an educational purpose or a watermark-bearing PDF automatically grants a right to reproduce and distribute the material inside a public app. Obtain written permission covering, at minimum:

- Digitising/transcribing the questions and answer explanations.
- Reproducing formulae, tables, diagrams and figures.
- Storing the resulting data/assets in the app repository and bundled APK.
- Distribution to app users, including offline use and future updates.
- Any publisher answer keys, reference annotations or worked solutions.

Primary reference: [Bangladesh Copyright Act, 2023 — official law text](https://bdlaws.minlaw.gov.bd/act-1452/act-chapter-print-2413.html). This is an engineering intake note, not a legal opinion.

## 5. Recommended path after rights clearance

1. Confirm the exact title/edition and obtain written permission from the rights holder. Record the permission scope and evidence in the source register; then use `licenseStatus: "licensed"` with a precise `licenseNote`. Do not mark third-party content as `owner_created`.
2. Run a small pilot across 10–20 representative pages: ordinary MCQs, a calculation/formula-heavy topic, a matrix/table page, a diagram/figure page and a page with dense watermark overlap.
3. For each item, preserve exact Bengali/English text, option order, subject/topic, printed question number, PDF page number and source identity. Keep extracted answer keys and worked explanations separate and traceable.
4. Use OCR only as a draft aid where permitted; manually compare every stem, option, symbol, exponent, sign, unit, figure and answer marker against the rendered page. Do not automatically set content or answer status to verified. Unknown/unclear content remains unverified; missing/uncertain answers remain unknown.
5. Use text for expressions supported by `MathText`; retain complex diagrams/matrices/equations as cropped local PNG assets where reproduction rights allow. Extend the asset indexer to include a dedicated ASPECT folder and test all generated paths.
6. Decide whether university/year references are just explanatory labels or a filterable feature. If filterable, design a structured cross-reference extension before importing thousands of rows.
7. Validate the pilot with the library-pack validator; run library/importer tests and a fresh SQLite dry-run; reconcile source vs pack counts and render representative questions on Android before preparing a full release.

## 6. Decision

**Current decision: HOLD — not import-ready.**

- Technical feasibility: **Yes, with a transcription + validation pipeline and a small amount of feature work.**
- Watermark effect: **Does not block page rendering, but does reduce confidence in automated extraction and requires manual proofreading.**
- Current direct extraction: **No; the scanned PDF has no usable text layer in the tested pages.**
- Existing book-question import: **Supported** through the existing library pack/importer.
- Full textbook-style formulas/references: **Not supported as standalone content types today**; would require a content-model/UI extension or image-backed reference pages.
- Rights: **Unconfirmed and a hard gate**; the PDF copy permission is disabled and no app-distribution licence was supplied.
- Import performed: **No.** No JSON pack was generated, no question status was changed, no PDF was modified and no APK/build was created for this audit.
