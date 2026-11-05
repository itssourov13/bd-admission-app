import test from "node:test";
import assert from "node:assert/strict";
import { fileUriToSqlitePath, sqlitePathToFileUri } from "../src/content/seedFileUris.ts";

test("SQLite filesystem paths are converted to Expo file URIs and back for ATTACH", () => {
  const sqlitePath = "/data/user/0/com.admissionbd.app/files/SQLite/bd-content_seed.db";
  const uri = sqlitePathToFileUri(sqlitePath);

  assert.equal(uri, "file:///data/user/0/com.admissionbd.app/files/SQLite/bd-content_seed.db");
  assert.equal(fileUriToSqlitePath(uri), sqlitePath);
});

test("SQLite seed path conversion rejects non-absolute inputs", () => {
  assert.throws(() => sqlitePathToFileUri("data/SQLite/seed.db"), /absolute SQLite filesystem path/);
  assert.throws(() => fileUriToSqlitePath("/data/SQLite/seed.db"), /absolute file:\/\/ URI/);
});
