import { Asset } from "expo-asset";
import { copyAsync } from "expo-file-system/legacy";
import { defaultDatabaseDirectory, deleteDatabaseAsync } from "expo-sqlite";
import type { SeedHandle } from "../services/seedSync";
import { fileUriToSqlitePath, sqlitePathToFileUri } from "./seedFileUris";

/** Name of the temporary seed sidecar. Runtime code never writes it and it is never the user's main database. */
export const SEED_COPY_NAME = "bd-content_seed.db";

async function discardSeedCopy(): Promise<void> {
  await deleteDatabaseAsync(SEED_COPY_NAME).catch(() => undefined);
}

/**
 * Materializes the bundled seed as a disposable sidecar so it can be ATTACHed to the user's SQLite connection.
 *
 * The asset is resolved lazily: returning launches with no pending content never download/copy/open the seed.
 * This uses Expo Asset and the public expo-file-system legacy copy API instead of expo-sqlite's @hidden testing helper. The downloaded
 * asset cache may be purged by Android; that is safe because it is re-materialized on demand from the app bundle.
 */
export async function openBundledSeed(): Promise<SeedHandle> {
  if (!defaultDatabaseDirectory) {
    throw new Error("Expo SQLite did not provide a database directory for the bundled content seed.");
  }

  // expo-sqlite exposes a raw absolute path; Expo File requires an absolute file:// URI.
  const destinationPath = defaultDatabaseDirectory.replace(/\/+$/, "") + "/" + SEED_COPY_NAME;
  const destinationUri = sqlitePathToFileUri(destinationPath);
  await discardSeedCopy();

  try {
    const asset = await Asset.fromModule(require("../../assets/content/content_seed.db") as number).downloadAsync();
    if (!asset.localUri) {
      throw new Error("Expo Asset did not materialize the bundled SQLite seed to a local file.");
    }

    // Android release builds can expose a bundled raw-resource name (without a URI scheme) as localUri.
    // The modern File.copy API treats that value as a filesystem path; the legacy native copier resolves
    // raw Android resources through Resources.openRawResource and copies them into the database directory.
    await copyAsync({ from: asset.localUri, to: destinationUri });
    return {
      path: fileUriToSqlitePath(destinationUri),
      release: discardSeedCopy
    };
  } catch (error) {
    // A killed/failed copy may leave a partial sidecar. Remove it so the next attempt starts cleanly.
    await discardSeedCopy();
    throw error;
  }
}
