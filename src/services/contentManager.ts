import type { SqlDb } from "../db/types.ts";
import type { CatalogEntry, CatalogManifest, ContentSource, Sha256Hex } from "../types/content-catalog.ts";
import type { InstallState } from "../types/domain.ts";
import { installLibraryPack, type LibraryInstallReport } from "./libraryImporter.ts";
import { setBookAvailable } from "../repositories/library.ts";
import { listInstalledBooks } from "../repositories/installedContent.ts";

/**
 * Optional content management (Phase 9). Additive only: it calls the existing installLibraryPack transaction and the
 * soft availability switch, so bookmarks, sessions and answers are never touched. Every function returns a result
 * instead of throwing on network/format problems, and no core journey depends on any of it.
 */

const SHA = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,80}$/;
const LICENSES = ["licensed", "public_domain", "owner_created", "permission_pending", "metadata_only"];

export function validateManifest(m: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const o = m as Partial<CatalogManifest> | null;
  if (!o || typeof o !== "object") return { valid: false, errors: ["Manifest must be an object."] };
  if (o.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (o.kind !== "catalogue") errors.push('kind must be "catalogue".');
  if (!Array.isArray(o.entries)) return { valid: false, errors: [...errors, "entries must be an array."] };
  const seen = new Set<string>();
  o.entries.forEach((e, i) => {
    const at = `entries[${i}]`;
    if (!e || typeof e !== "object") { errors.push(`${at} must be an object.`); return; }
    if (typeof e.bookId !== "string" || !ID.test(e.bookId)) errors.push(`${at}.bookId is invalid.`);
    else if (seen.has(e.bookId)) errors.push(`${at}.bookId is duplicated.`);
    else seen.add(e.bookId);
    if (typeof e.publisherId !== "string" || !ID.test(e.publisherId)) errors.push(`${at}.publisherId is invalid.`);
    if (!Number.isInteger(e.contentVersion) || e.contentVersion < 1) errors.push(`${at}.contentVersion must be a positive integer.`);
    if (typeof e.packRef !== "string" || e.packRef === "") errors.push(`${at}.packRef is required.`);
    if (typeof e.sha256 !== "string" || !SHA.test(e.sha256)) errors.push(`${at}.sha256 must be 64 lower-case hex characters.`);
    if (!Number.isInteger(e.sizeBytes) || e.sizeBytes < 0) errors.push(`${at}.sizeBytes must be a non-negative integer.`);
    if (typeof e.licenseStatus !== "string" || !LICENSES.includes(e.licenseStatus)) errors.push(`${at}.licenseStatus is invalid.`);
  });
  return { valid: errors.length === 0, errors };
}

export type CatalogAction = "install" | "update" | "reinstall" | "up_to_date" | "installed_newer";
export interface CatalogPlanItem { entry: CatalogEntry; action: CatalogAction; installedVersion: number | null }

/** Compares a catalogue with local state. Pure; never implies a download happened. */
export function planCatalog(entries: CatalogEntry[], local: { id: string; contentVersion: number; installState: InstallState }[]): CatalogPlanItem[] {
  const byId = new Map(local.map((l) => [l.id, l]));
  return entries.map((entry) => {
    const l = byId.get(entry.bookId);
    if (!l || l.installState === "catalogue_only") return { entry, action: "install", installedVersion: l ? l.contentVersion : null };
    if (entry.contentVersion > l.contentVersion) return { entry, action: "update", installedVersion: l.contentVersion };
    if (entry.contentVersion < l.contentVersion) return { entry, action: "installed_newer", installedVersion: l.contentVersion };
    return { entry, action: l.installState === "removed" ? "reinstall" : "up_to_date", installedVersion: l.contentVersion };
  });
}

export async function verifyPackIntegrity(text: string, entry: Pick<CatalogEntry, "sha256" | "sizeBytes">, sha256: Sha256Hex): Promise<{ ok: boolean; reason?: "size" | "hash" }> {
  if (entry.sizeBytes > 0 && new TextEncoder().encode(text).length !== entry.sizeBytes) return { ok: false, reason: "size" };
  return (await sha256(text)) === entry.sha256 ? { ok: true } : { ok: false, reason: "hash" };
}

export type CatalogInstallResult =
  | { ok: true; report: LibraryInstallReport }
  | { ok: false; stage: "fetch" | "integrity" | "format" | "install"; errors: string[] };

/**
 * Downloads (via the injected source), verifies, and installs one catalogue entry in the existing install transaction.
 * A failure at any stage leaves local content exactly as it was.
 */
export async function installCatalogEntry(db: SqlDb, source: ContentSource, entry: CatalogEntry, sha256: Sha256Hex): Promise<CatalogInstallResult> {
  let text: string;
  try { text = await source.fetchPack(entry); }
  catch (e) { return { ok: false, stage: "fetch", errors: [e instanceof Error ? e.message : String(e)] }; }
  const integrity = await verifyPackIntegrity(text, entry, sha256);
  if (!integrity.ok) return { ok: false, stage: "integrity", errors: [`Pack failed ${integrity.reason} verification.`] };
  let pack: unknown;
  try { pack = JSON.parse(text); } catch { return { ok: false, stage: "format", errors: ["Pack is not valid JSON."] }; }
  const book = (pack as { book?: { id?: unknown; contentVersion?: unknown } } | null)?.book;
  if (book?.id !== entry.bookId || book?.contentVersion !== entry.contentVersion) {
    return { ok: false, stage: "format", errors: ["Pack identity or version does not match its catalogue entry."] };
  }
  const report = await installLibraryPack(db, pack, { installState: "installed" });
  return report.ok ? { ok: true, report } : { ok: false, stage: "install", errors: report.errors };
}

/** Soft uninstall: content leaves practice, all user-owned records keep resolving. */
export const removeInstalledBook = (db: SqlDb, bookId: string) => setBookAvailable(db, bookId, false);
/** Restores a soft-removed book from local rows; false when nothing local remains (a pack must be reinstalled). */
export const restoreInstalledBook = (db: SqlDb, bookId: string) => setBookAvailable(db, bookId, true);
export { listInstalledBooks };
