import type { BookSummary, PublisherSummary } from "../../types/domain.ts";
import { isBookAvailable } from "./model.ts";

/**
 * Presentation-layer attribution (ADR-038 stays intact: nothing here touches stored provenance).
 *
 * A book whose stored publisher is the generic "unidentified" row, but whose collection/brand names another catalogue
 * publisher (e.g. collection "ASPECT" and the ASPECT publisher row) is DISPLAYED under that brand. The stored
 * publisher_id is unchanged, so source provenance, the Provenance block and history are untouched. Data-driven: no
 * brand name is hard-coded.
 */
export const UNIDENTIFIED_PUBLISHER_SLUG = "unidentified";

type PublisherLike = Pick<PublisherSummary, "id" | "slug" | "name">;
type BookLike = Pick<BookSummary, "publisherId" | "collection">;

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();

/** Publisher under which the book is shown: its collection brand when the stored publisher is unidentified. */
export function effectivePublisherId(book: BookLike, publishers: readonly PublisherLike[]): string {
  const col = book.collection ? norm(book.collection) : "";
  if (!col) return book.publisherId;
  const own = publishers.find((p) => p.id === book.publisherId);
  if (!own || own.slug !== UNIDENTIFIED_PUBLISHER_SLUG) return book.publisherId;
  const brand = publishers.find((p) => p.id !== own.id && (norm(p.slug) === col || norm(p.name) === col));
  return brand ? brand.id : book.publisherId;
}

export function booksForPublisher<T extends BookLike>(books: readonly T[], publishers: readonly PublisherLike[], publisherId: string): T[] {
  return books.filter((b) => effectivePublisherId(b, publishers) === publisherId);
}

/**
 * Publisher landing rows with brand attribution applied: counts, categories and installed/unavailable totals are
 * recomputed for the publishers a book moved between; an unidentified row emptied by the move is dropped so the
 * Library shows one ASPECT card and no empty duplicate. Unaffected publishers are returned unchanged.
 */
export function presentPublishers(publishers: readonly PublisherSummary[], books: readonly BookSummary[]): PublisherSummary[] {
  const affected = new Set<string>();
  const moved = books.filter((b) => {
    const eff = effectivePublisherId(b, publishers);
    if (eff === b.publisherId) return false;
    affected.add(b.publisherId); affected.add(eff);
    return true;
  });
  if (moved.length === 0) return publishers.slice();
  const out: PublisherSummary[] = [];
  for (const p of publishers) {
    if (!affected.has(p.id)) { out.push(p); continue; }
    const mine = books.filter((b) => effectivePublisherId(b, publishers) === p.id);
    if (p.slug === UNIDENTIFIED_PUBLISHER_SLUG && mine.length === 0) continue;
    const available = mine.filter((b) => isBookAvailable(b.installState));
    out.push({
      ...p,
      availableBooks: available.length,
      installedBooks: mine.filter((b) => b.installState === "installed").length,
      unavailableBooks: mine.filter((b) => b.installState === "catalogue_only" || b.installState === "removed").length,
      questionCount: available.reduce((n, b) => n + b.questionCount, 0),
      categories: [...new Set(available.map((b) => b.targetCategory))].sort()
    });
  }
  return out;
}

interface UniversityLike { key: string; name: { en: string } }
const GENERIC_WORDS = new Set(["university", "of", "the", "and", "science", "technology", "institute", "national", "college"]);

/**
 * Parent-university key a book's exam relevance points to ("Rajshahi University" -> "ru"), matched against the known
 * university registry by distinctive name word. Null when nothing matches; never guesses.
 */
export function universityKeyForBook(examRelevance: readonly string[], known: readonly UniversityLike[]): string | null {
  const hay = examRelevance.map(norm);
  for (const u of known) {
    const words = norm(u.name.en).split(/[^a-z]+/).filter((w) => w.length > 3 && !GENERIC_WORDS.has(w));
    if (words.length > 0 && hay.some((h) => words.some((w) => h.includes(w)))) return u.key;
  }
  return null;
}
