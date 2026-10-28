import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildIndex } from "../build-pack-index.mjs";

function pack(id) {
  return {
    schemaVersion: 1,
    batch: { id, category: "varsity", sourceDocumentIds: ["s"] },
    sourceDocuments: [{ id: "s", filename: "x.json", sourceType: "structured-data" }],
    institutions: [], papers: [], examRules: [], questions: []
  };
}

test("index lists validated packs and refuses invalid ones", () => {
  const dir = mkdtempSync(join(tmpdir(), "packs-"));
  const out = join(dir, "bundledPacks.ts");
  writeFileSync(join(dir, "b.json"), JSON.stringify(pack("b")));
  writeFileSync(join(dir, "a.json"), JSON.stringify(pack("a")));
  const ok = buildIndex(dir, out);
  assert.equal(ok.ok, true);
  const text = readFileSync(out, "utf8");
  assert.match(text, /import pack0 from "\.\/a\.json";/);
  assert.match(text, /BUNDLED_PACKS: readonly unknown\[\] = \[pack0, pack1\]/);
  writeFileSync(join(dir, "c.json"), JSON.stringify({ schemaVersion: 9 }));
  const bad = buildIndex(dir, join(dir, "other.ts"));
  assert.equal(bad.ok, false);
  assert.ok(bad.problems.some((p) => p.startsWith("c.json:")));
});

test("an empty pack directory produces an empty bundle", () => {
  const dir = mkdtempSync(join(tmpdir(), "packs-"));
  const out = join(dir, "bundledPacks.ts");
  assert.equal(buildIndex(dir, out).ok, true);
  assert.match(readFileSync(out, "utf8"), /BUNDLED_PACKS: readonly unknown\[\] = \[\];/);
});
