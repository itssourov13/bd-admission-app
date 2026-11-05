/**
 * Shared contract between the build-time seed generator (scripts/build-content.mjs) and the runtime sync
 * (src/services/seedSync.ts). No React Native imports.
 *
 * The seed database is a SQLite file produced by running the real migrations and the real importer over all bundled
 * question packs, plus three small metadata tables. It is shipped as an app asset and materialized as a disposable
 * sidecar; runtime SQL reads from it and copies content rows into the user's database. It is never copied over or merged
 * file-wise into the user's primary database, and runtime code never writes to the seed sidecar.
 */

export const SEED_FORMAT = 1;

/** Metadata tables added to the seed database. User-owned tables exist in the seed (same schema) but stay empty and are never read. */
export const SEED_META_DDL = `
CREATE TABLE seed_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE seed_packs (
  batch_id TEXT PRIMARY KEY NOT NULL,
  ordinal INTEGER NOT NULL,
  pack_signature TEXT NOT NULL,
  question_count INTEGER NOT NULL
);
CREATE TABLE seed_replace_papers (
  batch_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  PRIMARY KEY (batch_id, paper_id)
);
`;

export interface BundledPackEntry {
  batchId: string;
  /** `packSignature()` of the pack file; identical to what the importer stores in `question_batches.pack_signature`. */
  signature: string;
  questions: number;
}

/** Small, JS-bundled description of the seed. Lets startup decide what is pending without touching the seed file. */
export interface ContentManifest {
  seedFormat: number;
  /** Fingerprint of the format + ordered pack signatures. Stored inside the seed so a mismatched asset is detected. */
  seedId: string;
  packs: readonly BundledPackEntry[];
}

/** Stable, dependency-free fingerprint (FNV-1a style, two lanes) of the seed's logical content. */
export function computeSeedId(packs: readonly BundledPackEntry[], format: number = SEED_FORMAT): string {
  const payload = `${format}\n` + packs.map((p) => `${p.batchId}|${p.signature}|${p.questions}`).join("\n");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2246822519) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0") + payload.length.toString(16);
}
