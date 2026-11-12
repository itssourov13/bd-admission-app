import type { SqlDb } from "../db/types.ts";
import type { InstallState } from "../types/domain.ts";

export interface InstalledBook {
  id: string; publisherId: string; title: string; contentVersion: number; installState: InstallState; questionCount: number;
}

/** Books that carry local content (bundled, installed or soft-removed) for the content-management view. */
export async function listInstalledBooks(db: SqlDb): Promise<InstalledBook[]> {
  const rows = await db.getAllAsync<{ id: string; publisher_id: string; title: string; content_version: number; install_state: InstallState; n: number }>(
    `SELECT b.id, b.publisher_id, b.title, b.content_version, b.install_state,
       (SELECT COUNT(DISTINCT question_id) FROM content_unit_questions WHERE book_id = b.id) AS n
     FROM content_books b WHERE b.install_state IN ('bundled','installed','removed') ORDER BY b.title, b.id`
  );
  return rows.map((r) => ({ id: r.id, publisherId: r.publisher_id, title: r.title, contentVersion: Number(r.content_version), installState: r.install_state, questionCount: Number(r.n) }));
}
