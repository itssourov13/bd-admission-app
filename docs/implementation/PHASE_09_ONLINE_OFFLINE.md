# Phase 9 — Online + Offline Content Management (optional)

**Status:** Partially implemented — local contracts and logic only. No remote catalogue exists, none is configured, nothing is deployed. Pending owner verification. Related local commit: "feat(content): phase 9 optional catalogue and install contracts".

## 1. Objective
Provide optional, additive foundations for browsing/downloading/updating/removing book content, without making any network service a dependency of the app.

## 2. Initial state
Phase 8 provides `installLibraryPack` (transactional, version-checked, soft removal via `setBookAvailable`). No catalogue, manifest or integrity concepts existed.

## 3. Findings
- The app has no SHA-256 implementation and no crypto dependency; adding one is unnecessary for an optional phase.
- User data is never touched by installs/removals (verified by existing library tests); soft removal keeps rows resolvable.
- No backend exists (see Phase 10), so a real downloader would be fiction.

## 4. Approach
Pure, testable contracts plus a thin service on top of the existing installer. All I/O is injected (`ContentSource`, `Sha256Hex`).

## 5. Decisions
- Network is an injected adapter; with no adapter the feature simply has nothing to offer. Failures return typed results (`fetch | integrity | format | install`) and leave local content untouched.
- Integrity: size + SHA-256 of the exact pack text, hash function injected (the platform can supply `expo-crypto` later — an owner/dependency decision).
- Manifest `signature` is reserved but **not verified**; signed manifests are future work.
- Removal = soft uninstall only (existing `setBookAvailable`); question rows referenced by bookmarks/sessions are never deleted.
- No UI, no resumable downloads, no storage screen yet (they need a real source to be meaningful).

## 6. Files
Created: `src/types/content-catalog.ts`, `src/services/contentManager.ts`, `src/repositories/installedContent.ts`, `tests/contentManager.test.ts`, this document.

## 7. Database
No migration. Uses `content_books`, `content_unit_questions` from migration v8.

## 8. Dependencies
None added.

## 9. Implemented functionality
Manifest validation; plan (install / update / reinstall / up-to-date / installed-newer); integrity verification; verified install via the existing transaction with identity/version match against the catalogue entry; soft remove / restore; installed-content listing with question counts.

## 10. Known limitations
No download manager, progress, resume, storage-usage UI, signature verification, or content-management screen. No ContentSource implementation. Restore only works while local rows still exist.

## 11. Checks run
`tsc --noEmit`; `node --test tests/contentManager.test.ts tests/library.test.ts tests/brandAssets.test.ts` (results in IMPLEMENTATION_LOG). Full suite/device/network tests not run.

## 12. Deferred owner testing
Only after a source exists: real download, interrupted download, tampered pack, update/downgrade, airplane-mode behaviour.

## 13. Remaining work
Source adapter, hashing implementation, content-management screen, download progress/resume, signature verification, storage accounting.

## 14. External dependencies
A catalogue/pack host chosen and provisioned by the owner; a signing key policy.

## 15. Next
Phase 10 defines the server-side contract these client pieces would talk to.
