# Phase 10 — Backend & CMS Foundation (optional)

**Status:** Deferred — contract documented only. No backend, CMS, storage or credentials were created, provisioned or assumed. Related local commit: the Phase 9/10 documentation commit.

## 1. Objective
Define clean boundaries so a future backend can publish content to the optional Phase 9 client without changing the offline-first core.

## 2. Initial state
Standalone Expo + SQLite app. Workspace contains unrelated projects; none is used.

## 3. Findings
Inspected the workspace root listing only (ScholarHub-related and other projects exist). AGENTS.md forbids any runtime/build dependency on ScholarHub APIs, its cloud DB, Clerk or its infrastructure, so none is reusable.

## 4. Approach
Document the contract; implement nothing server-side; reuse client-side types already added (`CatalogManifest`, `CatalogEntry`, `ContentSource`).

## 5. Decisions
- Backend is optional and static-hostable: a manifest JSON plus pack files on any object store/CDN satisfies the client contract.
- Pack format is the existing `LibraryPack` (schemaVersion 1); catalogue format is `CatalogManifest` (schemaVersion 1). Versions are monotonic integers; clients refuse downgrades.
- Integrity: per-pack SHA-256 + size in the manifest; manifest signing (detached signature, publisher key) is planned and not implemented.
- Publishing rules mirror the validator: content packs require licence status `licensed | public_domain | owner_created`; verification status stays independent of ownership.

## 6. Future service interfaces (not built)
- `GET /catalogue.json` → CatalogManifest. `GET /packs/{bookId}/{version}.json` → LibraryPack (or signed/pre-authorised URL).
- Admin (future CMS): publishers, books, units, question banks, versions, publish/unpublish workflow, audit log, roles (editor / reviewer / publisher-admin), download authorisation for licensed content.

## 7–9. Files / DB / dependencies
Documentation only. No migration, no dependency, no code beyond Phase 9 types.

## 10. Known limitations
Nothing is deployed; no signing; no authorisation model; no admin tooling.

## 11. Checks
None applicable (documentation).

## 12. Deferred owner testing
N/A until infrastructure exists.

## 13. Remaining work
All server work; key management; hosting choice; CMS choice.

## 14. External dependencies / owner actions
Choose and provision hosting/object storage and (optionally) a CMS; decide signing keys and licensing/authorisation policy; supply real content and logos.

## 15. Next
Implement a `ContentSource` adapter against the chosen host, then the content-management screen (Phase 9 remainder).
