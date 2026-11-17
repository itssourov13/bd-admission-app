# Publication rights metadata (lightweight)

Status: implemented (schema v12, uncommitted until verified commit). Informational only — **it never blocks anything**.

## What it is
A small set of optional fields on `content_books`, carried by the LibraryPack `book` object and shown on the book detail screen:

| Field | Column | Notes |
|---|---|---|
| Status | `license_status` (existing) | `licensed`, `public_domain`, `owner_created`, `permission_pending`, `metadata_only` |
| Licence note | `license_note` (existing) | free text, e.g. "Not verified" |
| Source / attribution | `source_note` (existing) | short provenance note |
| Rights holder | `rights_holder` (new, nullable) | NULL = not identified |
| Evidence / reviewer note | `rights_reference` (new, nullable) | free text |
| Last reviewed | `rights_reviewed_on` (new, nullable) | ISO date `YYYY-MM-DD` |

The publisher stays a separate record (`publishers`); a book may use an "Unknown / not identified" publisher. Nothing requires an author, ISBN, year, licence or publisher name beyond the existing pack requirements.

## What it deliberately is not
No policy engine, per-action permissions, approval workflow, extra tables, automated legal decision or publisher inference. `permission_pending` is a **warning** from the validator and a quiet informational line on the book screen; it does not stop PDF inspection, extraction, correction, explanation writing, staging, validation, tests, Library UI work or pack installation. Only `metadata_only` keeps its older meaning ("catalogue entry, no question content").

Import/publication of RU-V content is a separate owner decision (Phase 3 approval) and is not decided by these fields. These fields never grant rights.

## Editing
- Pack path: re-installing a pack with a higher `contentVersion` upserts all rights fields.
- In-app/data path: `updateBookRights(db, bookId, patch)` in `src/repositories/library.ts` updates only the supplied keys (blank → NULL), rejects unknown statuses/malformed dates, and touches nothing else. **No UI editor has been built yet** (the function is tested; a small editor form is future work). A later pack reinstall overwrites manual edits.

## RU-V metadata (staged, not imported)
Collection `ASPECT`; publisher "Unknown / not identified" (`pub-unidentified`, not created in any database); rights holder not identified; source `RU Question Bank.pdf`; licence "Not verified"; status `permission_pending`; attribution note: "Source: RU Question Bank.pdf. Publisher and rights holder are not identified in the inspected source. Licence and reuse permission have not been verified." An earlier session recorded an unevidenced owner statement of holding the licence; it is kept only as a reviewer note.

## Verification
`tests/library.test.ts` (permission_pending validates with warning and installs) and `tests/library-catalogue.test.ts` (nullable columns, round trip, update/clear/reject, v11→v12).
