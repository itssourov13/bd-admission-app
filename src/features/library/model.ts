import type { BookSummary, InstallState, LicenseStatus, BookVerification, UnitRow } from "../../types/domain.ts";

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

/** Licence states under which question content may be installed. Anything else is catalogue metadata only. */
export const CONTENT_LICENSES: readonly LicenseStatus[] = ["licensed", "public_domain", "owner_created"];

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
