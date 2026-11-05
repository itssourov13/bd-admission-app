import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateDirectory } from "../validate-question-pack.mjs";

test("directory validation checks all JSON packs and reports aggregate counts without mutating them", async () => {
  const directory = await mkdtemp(join(tmpdir(), "admission-pack-validation-"));
  try {
    const sourcePath = resolve("data/question-packs/du-a-2024-2025.json");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(join(directory, "one.json"), source);
    await writeFile(join(directory, "two.json"), source);
    const result = await validateDirectory(directory);
    assert.equal(result.files, 2);
    assert.equal(result.questions, JSON.parse(source).questions.length * 2);
    assert.equal(result.errors.length, 0);
    assert.deepEqual(result.invalidFiles, []);
    assert.equal(await readFile(join(directory, "one.json"), "utf8"), source, "validation is read-only");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("directory validation reports invalid JSON and schema errors with the source filename", async () => {
  const directory = await mkdtemp(join(tmpdir(), "admission-pack-validation-"));
  try {
    await writeFile(join(directory, "broken.json"), "{not json");
    const source = JSON.parse(await readFile(resolve("data/question-packs/du-a-2024-2025.json"), "utf8"));
    source.schemaVersion = 999;
    await writeFile(join(directory, "schema.json"), JSON.stringify(source));
    const result = await validateDirectory(directory);
    assert.equal(result.files, 2);
    assert.equal(result.invalidFiles.length, 2);
    assert.ok(result.errors.some((item) => item.file === "broken.json" && item.message.includes("invalid JSON")));
    assert.ok(result.errors.some((item) => item.file === "schema.json"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
