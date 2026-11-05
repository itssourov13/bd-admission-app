import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { defaultDatabaseDirectory, deleteDatabaseAsync } from "expo-sqlite";
import type { SeedHandle } from "../services/seedSync";

/** Name of the temporary seed sidecar. Runtime code never writes it and it is never the user's main database. */
export const SEED_COPY_NAME = "bd-content_seed.db";

function toSqlitePath(uri: string): string {
  // SQLite ATTACH expects a filesystem path, not a file:// URI.
  return decodeURIComponent(uri.replace(/^file:\/\//, ""));
}

async function discardSeedCopy(): Promise<void> {
  await deleteDatabaseAsync(SEED_COPY_NAME).catch(() => undefined);
}

/**
 * Materializes the bundled seed as a disposable sidecar so it can be ATTACHed to the user's SQLite connection.
 *
 * The asset is resolved lazily: returning launches with no pending content never download/copy/open the seed.
 * This uses the public Expo Asset and File APIs instead of expo-sqlite's @hidden testing helper. The downloaded
 * asset cache may be purged by Android; that is safe because it is re-materialized on demand from the app bundle.
 */
export async function openBundledSeed(): Promise<SeedHandle> {
  if (!defaultDatabaseDirectory) {
    throw new Error("Expo SQLite did not provide a database directory for the bundled content seed.");
  }

  const destination = new File(defaultDatabaseDirectory, SEED_COPY_NAME);
  await discardSeedCopy();

  try {
    const asset = await Asset.fromModule(require("../../assets/content/content_seed.db") as number).downloadAsync();
    if (!asset.localUri) {
      throw new Error("Expo Asset did not materialize the bundled SQLite seed to a local file.");
    }

    await new File(asset.localUri).copy(destination);
    return {
      path: toSqlitePath(destination.uri),
      release: discardSeedCopy
    };
  } catch (error) {
    // A killed/failed copy may leave a partial sidecar. Remove it so the next attempt starts cleanly.
    await discardSeedCopy();
    throw error;
  }
}
