import type { PoolFilter } from "../types/domain.ts";
import { orderSubjects } from "./subjects.ts";

/**
 * Shared subject-selection model (roadmap Phase 3) used by Flash, Custom Practice and the generic Standard Exam.
 *
 * Representation: the selection is an ordered, de-duplicated list of stored subject IDs.
 *   [] → "all" (no subject restriction)   [x] → "single"   [x, y, …] → "multiple"
 * On a PoolFilter a single subject uses the long-standing `subject` field (existing stored sessions keep working) and
 * several subjects use `subjects` (already honoured by the SQL layer). Both are never set together by this module.
 *
 * Pure: no React, SQLite or i18n imports so the rules are unit-tested with `node --test`.
 */

export const SUBJECT_SELECTION_MAX = 12;

/** Letter/digit first, then letters, combining marks (Bangla vowel signs), digits, spaces and . & ( ) -; never a comma (the list separator) or a quote. */
const SUBJECT_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .&()-]{0,58}$/u;

export type SubjectSelectionMode = "all" | "single" | "multiple";

export function isValidSubjectName(value: unknown): value is string {
  return typeof value === "string" && SUBJECT_PATTERN.test(value);
}

/** Drops invalid/duplicate values, orders canonical subjects first, and caps the list. Never mutates the input. */
export function sanitizeSubjects(values: readonly unknown[] | null | undefined): string[] {
  if (!values) return [];
  const valid = values.map((v) => (typeof v === "string" ? v.trim() : v)).filter(isValidSubjectName);
  return orderSubjects(valid).slice(0, SUBJECT_SELECTION_MAX);
}

/** Parses a route param (comma-separated). Malformed entries are ignored, never trusted. */
export function parseSubjectsParam(value: string | null | undefined): string[] {
  return value ? sanitizeSubjects(value.split(",")) : [];
}

/** Inverse of parseSubjectsParam; undefined when empty so the key is omitted from the route. */
export function formatSubjectsParam(subjects: readonly string[] | undefined): string | undefined {
  const clean = sanitizeSubjects(subjects);
  return clean.length ? clean.join(",") : undefined;
}

export function selectionMode(selected: readonly string[]): SubjectSelectionMode {
  return selected.length === 0 ? "all" : selected.length === 1 ? "single" : "multiple";
}

/** Adds the subject if absent, removes it if present. Selecting everything is the same as "all" and is not collapsed here. */
export function toggleSubject(selected: readonly string[], subject: string, max = SUBJECT_SELECTION_MAX): string[] {
  if (!isValidSubjectName(subject)) return [...selected];
  if (selected.includes(subject)) return selected.filter((s) => s !== subject);
  if (selected.length >= max) return [...selected];
  return orderSubjects([...selected, subject]);
}

/** Subjects a filter restricts to, from either field (union, canonical order). Empty means all subjects. */
export function selectedSubjectsOf(filter: Pick<PoolFilter, "subject" | "subjects">): string[] {
  return sanitizeSubjects([...(filter.subject ? [filter.subject] : []), ...(filter.subjects ?? [])]);
}

/** Returns a copy of `filter` whose subject restriction is exactly `selected`. */
export function withSubjectSelection(filter: PoolFilter, selected: readonly string[]): PoolFilter {
  const { subject: _subject, subjects: _subjects, ...rest } = filter;
  const clean = sanitizeSubjects(selected);
  if (clean.length === 0) return rest;
  if (clean.length === 1) return { ...rest, subject: clean[0] };
  return { ...rest, subjects: clean };
}

/** Keeps only subjects that still have questions in the current scope (e.g. after the category/scope changed). */
export function pruneUnavailable(selected: readonly string[], counts: Readonly<Record<string, number>>): string[] {
  return selected.filter((s) => (counts[s] ?? 0) > 0);
}

/**
 * Combined pool size for the selection. Every question has exactly one subject, so the combined count is the exact
 * sum of the per-subject counts of the same scope (no extra query). Empty selection = all subjects, which also
 * includes questions without a subject, so the scope `total` is used.
 */
export function combinedCount(selected: readonly string[], counts: Readonly<Record<string, number>>, total: number): number {
  if (selected.length === 0) return total;
  return selected.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
}
