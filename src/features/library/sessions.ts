import type { UnitRow } from "../../types/domain.ts";
import { localizedName } from "./model.ts";

/** A top-level unit (an academic session) with its descendant source sets in display order. */
export interface UnitGroup { root: UnitRow; children: UnitRow[] }

/**
 * Groups a depth-ordered unit list (see orderUnitTree) into one group per root. Sets keep their stored order; a root
 * without children is a group with an empty child list. Membership and counts are never recomputed here: each unit's
 * questionCount already includes its descendants exactly once.
 */
export function groupUnitsByRoot(units: readonly UnitRow[]): UnitGroup[] {
  const groups: UnitGroup[] = [];
  for (const u of units) {
    if (u.depth === 0) groups.push({ root: u, children: [] });
    else if (groups.length > 0) groups[groups.length - 1].children.push(u);
    else groups.push({ root: u, children: [] });
  }
  return groups;
}

/** Drawer layout applies only when the book really has a root -> child hierarchy; flat books keep the plain list. */
export function hasSessionHierarchy(groups: readonly UnitGroup[]): boolean {
  return groups.some((g) => g.children.length > 0);
}

const SEPARATOR = /\s+[—–-]\s+/;
const SET_WORD = /^(set|সেট)(\b|[\s-]|$)/i;

/** "Unit C — মেঘনা" -> { unit: "Unit C", name: "মেঘনা" }; a title without a separator keeps everything as the name. */
export function splitSetTitle(title: string): { unit: string | null; name: string } {
  const i = title.search(SEPARATOR);
  if (i < 0) return { unit: null, name: title.trim() };
  const m = SEPARATOR.exec(title.slice(i))!;
  return { unit: title.slice(0, i).trim() || null, name: title.slice(i + m[0].length).trim() || title.trim() };
}

/**
 * Card heading for a source set: "Set 2 — পদ্মা" (ordinal within its session). When the printed set name already
 * starts with the word "Set"/"সেট" it is used as printed, so the heading never reads "Set 1 — Set 01".
 */
export function setCardTitle(unit: Pick<UnitRow, "title" | "titleBn">, ordinal: number, lang: "bn" | "en", digits: (n: number) => string, setWord: string): { heading: string; unitLabel: string | null } {
  const { unit: unitLabel, name } = splitSetTitle(localizedName(unit.title, unit.titleBn, lang));
  return { heading: SET_WORD.test(name) ? name : `${setWord} ${digits(ordinal)} — ${name}`, unitLabel };
}
