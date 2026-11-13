import type { SqlDb } from "../db/types.ts";
import type { PoolFilter } from "../types/domain.ts";
import { universityKeyOf } from "../features/catalog/universities.ts";
import {
  BUILTIN_PROFILES, isValidProfileId, parseStoredProfile, selectProfile, validateProfile,
  type MarkingContext, type MarkingProfile, type ProfileChoice
} from "../services/markingProfiles.ts";

/** User-owned marking data (user_marking_profiles, marking_preferences). Never touches importer-owned content tables. */

export async function listUserProfiles(db: SqlDb): Promise<MarkingProfile[]> {
  const rows = await db.getAllAsync<{ profile_json: string }>("SELECT profile_json FROM user_marking_profiles ORDER BY created_at, id");
  return rows.map((r) => parseStoredProfile(r.profile_json)).filter((p): p is MarkingProfile => p !== null);
}

/** Built-in profiles first, then the user's own. */
export async function listAllProfiles(db: SqlDb): Promise<MarkingProfile[]> {
  return [...BUILTIN_PROFILES, ...(await listUserProfiles(db))];
}

export type SaveProfileResult = { ok: true } | { ok: false; errors: string[] };

/** Saves (insert or update) a user profile. Built-in ids are reserved; invalid profiles are rejected, never stored. */
export async function saveUserProfile(db: SqlDb, profile: MarkingProfile, now = Date.now()): Promise<SaveProfileResult> {
  if (profile.kind !== "user") return { ok: false, errors: ["kind"] };
  if (BUILTIN_PROFILES.some((b) => b.id === profile.id)) return { ok: false, errors: ["id"] };
  const errors = validateProfile(profile);
  if (errors.length) return { ok: false, errors };
  await db.runAsync(
    `INSERT INTO user_marking_profiles (id, profile_json, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET profile_json = excluded.profile_json, updated_at = excluded.updated_at`,
    [profile.id, JSON.stringify(profile), now, now]
  );
  return { ok: true };
}

/** Deletes a user profile and any preference pointing at it. Past sessions keep their own snapshot and are unaffected. */
export async function deleteUserProfile(db: SqlDb, id: string): Promise<void> {
  await db.withTransactionAsync(async (tx) => {
    await tx.runAsync("DELETE FROM marking_preferences WHERE profile_id = ?", [id]);
    await tx.runAsync("DELETE FROM user_marking_profiles WHERE id = ?", [id]);
  });
}

export async function getPreferences(db: SqlDb): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ scope_key: string; profile_id: string }>("SELECT scope_key, profile_id FROM marking_preferences");
  return Object.fromEntries(rows.map((r) => [r.scope_key, r.profile_id]));
}

const SCOPE_KEY = /^(\*|u:[a-z0-9._-]{1,40})$/;

/** profileId null clears the preference. Returns false for an invalid scope key or id. */
export async function setPreference(db: SqlDb, scopeKey: string, profileId: string | null, now = Date.now()): Promise<boolean> {
  if (!SCOPE_KEY.test(scopeKey)) return false;
  if (profileId === null) {
    await db.runAsync("DELETE FROM marking_preferences WHERE scope_key = ?", [scopeKey]);
    return true;
  }
  if (!isValidProfileId(profileId)) return false;
  await db.runAsync(
    `INSERT INTO marking_preferences (scope_key, profile_id, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(scope_key) DO UPDATE SET profile_id = excluded.profile_id, updated_at = excluded.updated_at`,
    [scopeKey, profileId, now]
  );
  return true;
}

/** University/session/unit context of a practice scope, used to pick a default profile. */
export async function markingContextForFilter(db: SqlDb, filter: PoolFilter): Promise<MarkingContext> {
  if (filter.paperId) {
    const row = await db.getFirstAsync<{ institution_id: string; year: number; academic_session: string | null; unit: string | null; code: string }>(
      `SELECT p.institution_id, p.year, p.academic_session, p.unit, i.code FROM exam_papers p JOIN institutions i ON i.id = p.institution_id WHERE p.id = ?`,
      [filter.paperId]
    );
    if (row) return { universityKey: universityKeyOf(row.code), year: row.year, academicSession: row.academic_session, unit: row.unit };
  }
  const instIds = filter.institutionIds?.length ? filter.institutionIds : filter.institutionId ? [filter.institutionId] : [];
  if (instIds.length) {
    const row = await db.getFirstAsync<{ code: string }>("SELECT code FROM institutions WHERE id = ?", [instIds[0]]);
    if (row) return { universityKey: universityKeyOf(row.code) };
  }
  return {};
}

/** The profile that applies to a scope (explicit id > preference > best catalogue match > generic default). */
export async function resolveMarkingChoice(db: SqlDb, filter: PoolFilter, explicitId?: string | null): Promise<ProfileChoice | null> {
  const [all, prefs, ctx] = await Promise.all([listAllProfiles(db), getPreferences(db), markingContextForFilter(db, filter)]);
  return selectProfile(all, prefs, ctx, explicitId);
}
