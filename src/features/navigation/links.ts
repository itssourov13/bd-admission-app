import type { Href } from "expo-router";
import type { PoolFilter, QuestionCategory } from "../../types/domain";

type Params = Record<string, string | number | undefined | null>;

/** Builds a typed-route-compatible href with encoded query parameters. */
export function href(path: string, params?: Params): Href {
  const query = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return (query ? `${path}?${query}` : path) as Href;
}

export function scopeParams(filter: PoolFilter): Params {
  return { category: filter.category, institutionId: filter.institutionId, paperId: filter.paperId, subject: filter.subject };
}

const CATEGORIES: readonly string[] = ["varsity", "medical", "engineering"];

/** Reads a scope from route params; unknown values are ignored instead of trusted. */
export function scopeFromParams(p: Record<string, string | string[] | undefined>): PoolFilter {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const category = one(p.category);
  return {
    category: category && CATEGORIES.includes(category) ? (category as QuestionCategory) : undefined,
    institutionId: one(p.institutionId),
    paperId: one(p.paperId),
    subject: one(p.subject)
  };
}
