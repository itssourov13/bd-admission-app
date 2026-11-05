/**
 * Converts an absolute native SQLite filesystem path to the file:// URI expected by Expo File.
 * expo-sqlite exposes defaultDatabaseDirectory as a raw absolute path, not a file URI.
 */
export function sqlitePathToFileUri(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("Expected an absolute SQLite filesystem path.");
  }
  return "file://" + path;
}

/** Converts an Expo file:// URI back to the absolute path required by SQLite ATTACH. */
export function fileUriToSqlitePath(uri: string): string {
  if (!uri.startsWith("file:///")) {
    throw new Error("Expected an absolute file:// URI for the SQLite seed sidecar.");
  }
  return decodeURIComponent(uri.slice("file://".length));
}
