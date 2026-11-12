import type { LicenseStatus } from "./domain.ts";

/**
 * Optional online catalogue contract (Phase 9). Nothing in the app requires it: SQLite stays the source of truth and
 * every core journey works with no network and no configured source. A source is an additive adapter only.
 */
export interface CatalogEntry {
  bookId: string;
  publisherId: string;
  title: string;
  /** Monotonic integer matching LibraryPack.book.contentVersion. */
  contentVersion: number;
  versionLabel?: string | null;
  /** Opaque location understood by the ContentSource adapter (not necessarily a URL). */
  packRef: string;
  /** Lower-case hex SHA-256 of the exact pack text delivered by the source. */
  sha256: string;
  sizeBytes: number;
  licenseStatus: LicenseStatus;
}

export interface CatalogManifest {
  schemaVersion: 1;
  kind: "catalogue";
  generatedAt: string;
  entries: CatalogEntry[];
  /** Reserved for a detached manifest signature. Not verified yet; see PHASE_09/10 docs. */
  signature?: string | null;
}

/** Adapter to a remote or local catalogue. No implementation ships: none is configured until the owner provides one. */
export interface ContentSource {
  id: string;
  fetchManifest(): Promise<CatalogManifest>;
  fetchPack(entry: CatalogEntry): Promise<string>;
}

/** Platform-supplied SHA-256 (hex). Injected so the pure service needs no crypto dependency. */
export type Sha256Hex = (text: string) => Promise<string>;
