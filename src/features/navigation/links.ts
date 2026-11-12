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
  const params: Params = { category: filter.category, institutionId: filter.institutionId, paperId: filter.paperId, subject: filter.subject };
  if (filter.institutionIds?.length) params.institutionIds = filter.institutionIds.join(",");
  return params;
}

const ID_LIST_MAX = 12;
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,80}$/;

/** Parses a comma-separated id list from a route param; malformed or excess entries are dropped, never trusted. */
function parseIdList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const ids = [...new Set(value.split(",").filter((id) => ID_PATTERN.test(id)))].slice(0, ID_LIST_MAX);
  return ids.length ? ids : undefined;
}

const CATEGORIES: readonly string[] = ["varsity", "medical", "engineering"];

/** Reads a scope from route params; unknown values are ignored instead of trusted. */
export function scopeFromParams(p: Record<string, string | string[] | undefined>): PoolFilter {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const category = one(p.category);
  const scope: PoolFilter = {
    category: category && CATEGORIES.includes(category) ? (category as QuestionCategory) : undefined,
    institutionId: one(p.institutionId),
    paperId: one(p.paperId),
    subject: one(p.subject)
  };
  const institutionIds = parseIdList(one(p.institutionIds));
  if (institutionIds) scope.institutionIds = institutionIds;
  return scope;
}
