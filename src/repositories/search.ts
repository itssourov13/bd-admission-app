/** Browse search helpers: keep user input bounded and safe for a SQLite LIKE ... ESCAPE '\' clause. */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_CHARS = 64;

/** Trimmed, whitespace-collapsed, length-capped term; null when too short to be worth querying. */
export function normalizeSearch(raw: string | null | undefined): string | null {
  const term = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_CHARS).trim();
  return [...term].length >= SEARCH_MIN_CHARS ? term : null;
}

/** `%term%` with LIKE wildcards (and the escape character) neutralised. Returns null for unusable input. */
export function likePattern(raw: string | null | undefined): string | null {
  const term = normalizeSearch(raw);
  return term === null ? null : `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
