import type { SqlDb } from "../db/types.ts";
import type { ProfileRow, QuestionCategory } from "../types/domain.ts";
import { clampFlashSeconds, FLASH_DEFAULT_SECONDS } from "../services/timer.ts";
import { accuracyPercent } from "../services/scoring.ts";

export async function ensureProfile(db: SqlDb, now = Date.now()): Promise<void> {
  await db.runAsync("INSERT OR IGNORE INTO user_profile (id, display_name, language, flash_seconds, created_at, updated_at) VALUES (1, '', 'bn', ?, ?, ?)", [FLASH_DEFAULT_SECONDS, now, now]);
}

export async function getProfile(db: SqlDb): Promise<ProfileRow> {
  await ensureProfile(db);
  const r = await db.getFirstAsync<{ display_name: string; language: "bn" | "en"; target_category: QuestionCategory | null; flash_seconds: number }>(
    "SELECT display_name, language, target_category, flash_seconds FROM user_profile WHERE id = 1"
  );
  return { displayName: r?.display_name ?? "", language: r?.language ?? "bn", targetCategory: r?.target_category ?? null, flashSeconds: r?.flash_seconds ?? FLASH_DEFAULT_SECONDS };
}

export async function updateProfile(db: SqlDb, patch: Partial<Pick<ProfileRow, "displayName" | "language" | "targetCategory" | "flashSeconds">>, now = Date.now()): Promise<void> {
  await ensureProfile(db, now);
  if (patch.displayName !== undefined) await db.runAsync("UPDATE user_profile SET display_name = ?, updated_at = ? WHERE id = 1", [patch.displayName.trim().slice(0, 60), now]);
  if (patch.language !== undefined) await db.runAsync("UPDATE user_profile SET language = ?, updated_at = ? WHERE id = 1", [patch.language, now]);
  if (patch.targetCategory !== undefined) await db.runAsync("UPDATE user_profile SET target_category = ?, updated_at = ? WHERE id = 1", [patch.targetCategory, now]);
  if (patch.flashSeconds !== undefined) await db.runAsync("UPDATE user_profile SET flash_seconds = ?, updated_at = ? WHERE id = 1", [clampFlashSeconds(patch.flashSeconds), now]);
}

export async function toggleBookmark(db: SqlDb, questionId: string, now = Date.now()): Promise<boolean> {
  const r = await db.runAsync("DELETE FROM bookmarks WHERE question_id = ?", [questionId]);
  if (r.changes > 0) return false;
  await db.runAsync("INSERT INTO bookmarks (question_id, created_at) VALUES (?, ?)", [questionId, now]);
  return true;
}

export async function bookmarkedIds(db: SqlDb, ids?: string[]): Promise<Set<string>> {
  if (ids && ids.length === 0) return new Set();
  const rows = ids
    ? await db.getAllAsync<{ question_id: string }>(`SELECT question_id FROM bookmarks WHERE question_id IN (${ids.map(() => "?").join(",")})`, ids)
    : await db.getAllAsync<{ question_id: string }>("SELECT question_id FROM bookmarks");
  return new Set(rows.map((r) => r.question_id));
}

export async function listBookmarkIds(db: SqlDb, limit = 200, offset = 0): Promise<string[]> {
  const rows = await db.getAllAsync<{ question_id: string }>("SELECT question_id FROM bookmarks ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
  return rows.map((r) => r.question_id);
}

export interface ActivitySummary {
  sessions: number;
  answered: number;
  correct: number;
  accuracyPercent: number;
  bookmarks: number;
}

/** Real aggregates only: nothing is fabricated when there is no activity. */
export async function activitySummary(db: SqlDb): Promise<ActivitySummary> {
  const s = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM practice_sessions WHERE status = 'completed'");
  const a = await db.getFirstAsync<{ c: number; i: number }>(
    `SELECT SUM(CASE WHEN outcome='correct' THEN 1 ELSE 0 END) AS c, SUM(CASE WHEN outcome='incorrect' THEN 1 ELSE 0 END) AS i
     FROM session_answers a JOIN practice_sessions p ON p.id = a.session_id WHERE p.status = 'completed'`
  );
  const b = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM bookmarks");
  const c = Number(a?.c ?? 0);
  const i = Number(a?.i ?? 0);
  return { sessions: Number(s?.n ?? 0), answered: c + i, correct: c, accuracyPercent: accuracyPercent(c, c + i), bookmarks: Number(b?.n ?? 0) };
}
