import type { SqlDb } from "../../db/types.ts";
import { getInstitution } from "../../repositories/content.ts";
import { universityDisplayName } from "./universities.ts";

/** Parent-university display name for a scope built from one of its institution ids. */
export async function universityLabel(db: SqlDb, institutionId: string, lang: "en" | "bn"): Promise<string | null> {
  const inst = await getInstitution(db, institutionId);
  return inst ? universityDisplayName(inst.code, inst.name, lang) : null;
}
