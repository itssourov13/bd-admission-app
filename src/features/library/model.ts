import type { BookSummary, BookTargetCategory, InstallState, LicenseStatus, BookVerification, UnitRow } from "../../types/domain.ts";

/** Two-or-three letter fallback mark for a publisher (no real logos are bundled until licensed artwork exists). */
export function publisherMonogram(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";
  const letters = Array.from(clean.replace(/[^\p{L}\p{N}\s]/gu, ""));
  const word = letters.join("");
  if (/^[A-Z0-9]{2,4}$/.test(word)) return word;
  const words = word.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
  const chars = Array.from(words[0] ?? "?");
  return chars.slice(0, 2).join("").toUpperCase();
}

/** Pick the Bangla name when the UI is Bangla and one is known; fall back to the canonical name. */
export function localizedName(name: string, nameBn: string | null | undefined, lang: "bn" | "en"): string {
  return lang === "bn" && nameBn ? nameBn : name;
}

/** A book is usable for browsing/practice only while it is bundled or installed. */
export function isBookAvailable(state: InstallState): boolean {
  return state === "bundled" || state === "installed";
}

export const INSTALL_STATE_KEYS: Record<InstallState, "library.state.catalogue_only" | "library.state.bundled" | "library.state.installed" | "library.state.removed"> = {
  catalogue_only: "library.state.catalogue_only", bundled: "library.state.bundled", installed: "library.state.installed", removed: "library.state.removed"
};
export const LICENSE_KEYS: Record<LicenseStatus, "library.license.licensed" | "library.license.public_domain" | "library.license.owner_created" | "library.license.permission_pending" | "library.license.metadata_only"> = {
  licensed: "library.license.licensed", public_domain: "library.license.public_domain", owner_created: "library.license.owner_created",
  permission_pending: "library.license.permission_pending", metadata_only: "library.license.metadata_only"
};
export const VERIFICATION_KEYS: Record<BookVerification, "library.verification.verified" | "library.verification.unverified" | "library.verification.metadata_only"> = {
  verified: "library.verification.verified", unverified: "library.verification.unverified", metadata_only: "library.verification.metadata_only"
};

/**
 * Licence states that allow question content to be prepared and installed. permission_pending is deliberately included:
 * rights metadata is informational and must not block internal preparation, validation or testing (the owner's explicit
 * import approval is a separate workflow control). Only metadata_only means "catalogue entry without content".
 */
export const CONTENT_LICENSES: readonly LicenseStatus[] = ["licensed", "public_domain", "owner_created", "permission_pending"];

export function licenseAllowsContent(status: LicenseStatus): boolean {
  return CONTENT_LICENSES.includes(status);
}

/** Entire-book practice needs at least one practice-eligible (verified) or provisional candidate question. */
export function bookPracticeState(book: Pick<BookSummary, "installState" | "eligibleCount" | "reviewCandidateCount">): "ready" | "provisional" | "none" {
  if (!isBookAvailable(book.installState)) return "none";
  if (book.eligibleCount > 0) return "ready";
  return book.reviewCandidateCount > 0 ? "provisional" : "none";
}

/**
 * Orders flat unit rows depth-first (siblings by sortOrder, then title) and assigns depth. Rows whose parent is
 * missing are treated as roots so corrupted data can never hide content or loop.
 */
export function orderUnitTree<T extends Omit<UnitRow, "depth" | "questionCount"> & { questionCount?: number }>(rows: T[]): (T & { depth: number })[] {
  const ids = new Set(rows.map((r) => r.id));
  const children = new Map<string | null, T[]>();
  for (const r of rows) {
    const key = r.parentId && ids.has(r.parentId) && r.parentId !== r.id ? r.parentId : null;
    const list = children.get(key) ?? [];
    list.push(r);
    children.set(key, list);
  }
  const out: (T & { depth: number })[] = [];
  const seen = new Set<string>();
  const visit = (parent: string | null, depth: number) => {
    const list = (children.get(parent) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    for (const r of list) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push({ ...r, depth });
      visit(r.id, depth + 1);
    }
  };
  visit(null, 0);
  // Anything unreachable (a parent cycle) is appended as a root rather than dropped.
  for (const r of rows) if (!seen.has(r.id)) { seen.add(r.id); out.push({ ...r, depth: 0 }); }
  return out;
}

/** Book route/scope label: "Book" or "Book — Unit". */
export function bookScopeLabel(bookTitle: string, unitTitle?: string | null): string {
  return unitTitle ? `${bookTitle} — ${unitTitle}` : bookTitle;
}

/** Stable lookup key for a book/unit scope (history and result labels). */
export function scopeKey(scope: { bookId: string; unitId?: string | null }): string {
  return `${scope.bookId}|${scope.unitId ?? ""}`;
}

export type BookSectionKey = "books" | "varsity" | "engineering" | "medical" | "subject" | "other";
export const BOOK_SECTION_ORDER: readonly BookSectionKey[] = ["books", "varsity", "engineering", "medical", "subject", "other"];

/** Publisher-page grouping. Pure and derived only from stored metadata; no section is shown without real books. */
export function bookSectionOf(b: Pick<BookSummary, "contentType" | "targetCategory" | "subject">): BookSectionKey {
  if (b.contentType === "book") return "books";
  if (b.targetCategory === "varsity") return "varsity";
  if (b.targetCategory === "engineering") return "engineering";
  if (b.targetCategory === "medical") return "medical";
  return b.subject ? "subject" : "other";
}

export function groupBooksIntoSections<T extends Pick<BookSummary, "contentType" | "targetCategory" | "subject">>(books: T[]): { key: BookSectionKey; data: T[] }[] {
  const buckets = new Map<BookSectionKey, T[]>();
  for (const b of books) { const k = bookSectionOf(b); const list = buckets.get(k) ?? []; list.push(b); buckets.set(k, list); }
  return BOOK_SECTION_ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, data: buckets.get(k)! }));
}

/** True when a book's rights information should be flagged to the owner (non-blocking display hint only). */
export function rightsNeedsAttention(b: Pick<BookSummary, "licenseStatus" | "rightsHolder">): boolean {
  return b.licenseStatus === "permission_pending" || !b.rightsHolder;
}

export interface BookFilter {
  /** Case-insensitive match over title, subject, collection, authors, publisher and identifiers. */
  text?: string;
  category?: BookTargetCategory | "all";
  contentType?: BookSummary["contentType"] | "all";
  /** Exact (case-insensitive) collection/series name, e.g. a Library section; "all" or empty = any. */
  collection?: string | "all";
}

export function isFilterActive(f: BookFilter): boolean {
  return Boolean((f.text ?? "").trim()) || (!!f.category && f.category !== "all") || (!!f.contentType && f.contentType !== "all") || (!!f.collection && f.collection !== "all");
}

/** Distinct collection names present in the catalogue (data-driven discovery; no publisher-specific entries). */
export function listCollections(books: Pick<BookSummary, "collection">[]): { name: string; count: number }[] {
  const m = new Map<string, { name: string; count: number }>();
  for (const b of books) {
    const name = b.collection?.trim();
    if (!name) continue;
    const k = name.normalize("NFC").toLowerCase();
    const e = m.get(k); if (e) e.count++; else m.set(k, { name, count: 1 });
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Pure, data-driven catalogue filter shared by every publisher's books (no publisher-specific branches). An empty
 * filter returns the input order unchanged.
 */
export function filterBooks<T extends Pick<BookSummary, "title" | "titleBn" | "subject" | "collection" | "authors" | "publisherName" | "publisherNameBn" | "identifiers" | "targetCategory" | "contentType">>(books: T[], f: BookFilter): T[] {
  const needle = (f.text ?? "").normalize("NFC").trim().toLowerCase();
  return books.filter((b) => {
    if (f.category && f.category !== "all" && b.targetCategory !== f.category) return false;
    if (f.contentType && f.contentType !== "all" && b.contentType !== f.contentType) return false;
    if (f.collection && f.collection !== "all" && (b.collection ?? "").normalize("NFC").trim().toLowerCase() !== f.collection.normalize("NFC").trim().toLowerCase()) return false;
    if (!needle) return true;
    const hay = [b.title, b.titleBn, b.subject, b.collection, b.authors, b.publisherName, b.publisherNameBn, ...Object.values(b.identifiers)]
      .filter((x): x is string => Boolean(x)).join(" ").normalize("NFC").toLowerCase();
    return hay.includes(needle);
  });
}
