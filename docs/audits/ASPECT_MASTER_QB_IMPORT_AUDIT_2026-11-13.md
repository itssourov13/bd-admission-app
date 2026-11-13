# ASPECT Master QB — approved source intake and implementation plan

**Updated:** 2026-11-13
**Project:** BD Admission App
**Source:** `/home/kali/gpt-workspace/bd-admission-app-data/master-qb/@AdmissionStuffs_Aspect Varsity Solution Master QB - Science.pdf`

## 1. Decision

<badge>READY FOR EXTRACTION AND IMPORT</badge>

The owner confirms the book was purchased and full permission is available to digitise, transcribe, structure, store, bundle and distribute its content for offline use inside BD Admission App. Treat this owner confirmation as the project authorization. Do not pause the implementation for a separate rights review or ask the owner to repeat this confirmation.

Proceed with the complete source-to-app workflow: extract the question bank, preserve worked solutions and references, prepare book/topic navigation, validate the library pack, import it into the content seed and verify it in the app.

The watermark is part of the supplied scan and does not prevent page rendering or content extraction. Do not spend time treating it as a blocker or attempting to remove it. Use the clearest rendered source view for transcription and compare OCR output against the original page.

## 2. Source file inventory

| Field | Observed value |
|---|---|
| File | `@AdmissionStuffs_Aspect Varsity Solution Master QB - Science.pdf` |
| SHA-256 | `b88b45ed5863385d98a3a43f8232562d51628208d06c0c7a6898bb7f203c83fa` |
| Size | 464,316,608 bytes (about 443 MiB) |
| PDF pages | 1,027 |
| Page size | A4 |
| PDF version | 1.7 |
| Encryption | AES-256 |
| Metadata title/subject | “comined” |
| Metadata author | CamScanner |

The file is an image-based scan. The tested opening pages do not expose a usable selectable-text layer through `pdftotext`; Poppler page rendering succeeds. Rendered samples from pages 1–3, 50, 500 and 1,000 show the cover, book overview, topic-based two-column MCQs, university/source labels, worked solutions, formulae and diagram/table content.

The visible Admission Stuffs watermark remains on the source page. It does not stop the workflow. OCR is a transcription aid; use page images as the source of truth and visually reconcile question stems, option order, Bengali/English characters, arithmetic signs, units, exponents, subscripts, matrices, diagrams and answer markers.

The current local Tesseract installation exposes English and orientation-detection data only. For Bengali pages, configure a Bengali-capable OCR engine/model or use another suitable page-reading workflow. Keep the original page images available for visual review. Do not silently normalize or rewrite unusual source notation.

## 3. Publisher and book placement in the app

The app already seeds the ASPECT publisher:

- Publisher ID: `pub-aspect`
- Slug: `aspect`
- Display name: `ASPECT`
- Existing Bangla label: `অ্যাসপেক্ট`

Use this publisher identity rather than creating a duplicate publisher. Add the source as a new ASPECT Science book / varsity question bank under Publications Library. Confirm the exact book title, edition label and publication metadata from the PDF itself; keep unknown metadata null rather than guessing.

Suggested logical structure (derive the final hierarchy from the actual book index/pages):

- Book: ASPECT Varsity Solution & Master Question Bank — Science
- Subject groups: Physics, Chemistry, Biology, Higher Mathematics, ICT, English/Bangla or any other sections actually present.
- Topic/chapter units: preserve the source topic numbers, names and ordering.
- Question records: keep each printed MCQ with its ordered options, available correct answer, worked explanation and source locator.
- Reference information: preserve every university/year/unit/set label printed with a question.

The exact book title and units must follow the source content, not these illustrative labels.

## 4. Existing app integration points

Phase 8 Publications Library is present and already provides:

- ASPECT publisher identity and publisher → book navigation.
- Versioned `LibraryPack` schema, structural validator and transactional `installLibraryPack` importer.
- Book metadata, nested chapter/unit/section/test tree and ordered question memberships.
- Shared question, option, bookmark, Browse, Flash and Custom Practice integration.
- Question explanation and existing `MathText` display for supported inline math notation.
- Local image-asset rendering for diagrams and figures.
- Source document metadata plus question-level PDF page and printed question-number fields.

Use the existing question ID, source-document and book/unit identity conventions. Book-only content must stay scoped to the ASPECT book and must not accidentally enter university-paper catalogues or global verified exam pools.

## 5. Required implementation deliverables

The implementation agent should complete all work needed to make the book useful inside the app. Existing gaps are work items to implement, not reasons to stop or request a new decision.

### A. Complete source extraction

- Process all 1,027 pages; classify front matter, subject/topic divisions, question pages, solution pages, answer/reference tables and appendices.
- Build a page/section inventory and extraction coverage ledger.
- Extract each MCQ stem and every option in exact printed order.
- Capture the answer marker and the full printed explanation/solution where present.
- Preserve Bengali and English as printed; retain original scientific symbols, units and notation.
- Record source PDF page, printed page, printed question number, subject, topic and printed university/session/unit/set references.
- Keep uncertain or unreadable source details explicitly flagged in the working review ledger. Never invent missing text or an answer.

### B. Formulae, figures and reference material

- Preserve formulae in editable text/math notation where practical and render them correctly in the question and explanation UI.
- Extend the app's math rendering for the notation actually used in this source: fractions, roots, vectors, matrices, Greek symbols, limits, summations, chemical notation, multi-line derivations and other recurring structures.
- Preserve complex formula layouts, tables and diagrams as local image assets when editable rendering would reduce fidelity.
- Add ASPECT assets to the static local asset pipeline; keep asset paths deterministic and bundle-safe.
- Add a structured reference display for the university/year/unit/set labels appearing beside the source questions. Preserve the original printed reference; do not misrepresent a publisher compilation as an official university paper.
- Add a browsable Formula / Reference section if the source contains standalone formula sheets, reference tables or glossary material. Keep the source order and topic association.

### C. Library UI and question presentation

- Organize book pages by subject and topic using the extracted source hierarchy.
- Make question stem, options, answer reveal, worked solution, formula/figure assets and source locator readable in Bangla and English.
- Show source PDF page and printed question number on each applicable question.
- Provide book-level and topic-level Browse and practice actions.
- Keep standard university question-bank functionality and global catalogues unchanged.

### D. Verification and content states

- Compare the extracted content with the page image, not OCR output alone.
- Check every stem, option, answer marker, formula, diagram reference and explanation.
- Keep answer verification and text/content verification as separate fields.
- Mark facts verified only after reconciliation with the actual printed source and a completed review; retain unknown/unverified status for unresolved items.
- Keep an extraction ledger with page, question, review status and any correction history.

### E. Import and release validation

- Generate one or more schema-v1 library packs for the ASPECT book.
- Use the existing ASPECT publisher ID `pub-aspect`; assign stable book, source, unit and question IDs.
- Use the library pack's `licenseStatus: "licensed"` and document the owner's project permission in `licenseNote`.
- Run the library validator and resolve all structural errors.
- Run library/importer tests, fresh SQLite import and idempotent re-import checks.
- Verify question/unit/source counts against the extraction ledger.
- Run TypeScript, lint, full tests, content build and content check.
- Check rendered questions, formulas, solutions, references and diagrams in the Android app before preparing the updated APK.

## 6. Key source facts to preserve

- Original file path and SHA-256 recorded above.
- PDF page number and printed page number are separate fields; do not conflate them.
- The book is a publisher compilation that includes labels for multiple universities. Those printed labels are source references and are not automatically verified official-paper metadata.
- Keep the original question/option wording and ordering; record transcription corrections in the audit ledger rather than silently editing the source.
- Keep question text, formulae, solution, diagrams and references connected to the same source page and topic.

## 7. Current progress and next action

**Source audit and app capability review:** complete.
**Publisher integration point:** already exists (`pub-aspect`).
**Question extraction:** not started.
**Library pack generation/import:** not started.
**App UI extensions for full formula/reference support:** to be implemented as part of the content integration work.

Next action: begin full PDF page inventory and staged question/solution extraction. Work in resumable subject/topic batches so the 1,027-page source can be processed without losing progress. Do not stop at a feasibility report; continue through validated import and document the actual counts and verification results.

## 8. Integrity

This report records the owner-provided project authorization and the technical source findings. It does not claim that the 1,027-page transcription, import, tests or device verification have already been completed. Those are the implementation tasks listed above.
