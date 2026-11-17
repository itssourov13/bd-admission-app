import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkRefs, collectPackRefs, renderIndex, scanAssets } from "../lib/asset-index.mjs";

function fixture(setup) {
  const root = mkdtempSync(join(tmpdir(), "asset-index-"));
  mkdirSync(join(root, "data/question-packs/assets/ns-a"), { recursive: true });
  mkdirSync(join(root, "data/library-packs"), { recursive: true });
  setup(root);
  return root;
}
const png = (root, rel) => writeFileSync(join(root, "data/question-packs", rel), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
const q = (id, extra = {}) => ({ id, options: [{ id: "a", text: "A" }, { id: "b", text: "B" }], ...extra });

test("scan indexes every namespace folder and every supported extension", () => {
  const root = fixture((r) => { mkdirSync(join(r, "data/question-packs/assets/ns-b"), { recursive: true }); png(r, "assets/ns-a/one.png"); png(r, "assets/ns-b/two.jpg"); png(r, "assets/ns-b/three.webp"); });
  try {
    const { keys, problems } = scanAssets(root);
    assert.deepEqual(keys, ["assets/ns-a/one.png", "assets/ns-b/three.webp", "assets/ns-b/two.jpg"]);
    assert.deepEqual(problems, []);
    const text = renderIndex(keys);
    assert.match(text, /require\("\.\.\/\.\.\/data\/question-packs\/assets\/ns-a\/one\.png"\)/);
    assert.match(text, /QUESTION_ASSET_COUNT = 3/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("unsupported file types are reported, not silently skipped", () => {
  const root = fixture((r) => { writeFileSync(join(r, "data/question-packs/assets/ns-a/vector.svg"), "<svg/>"); });
  try { assert.equal(scanAssets(root).problems.length, 1); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("references from university packs AND library packs resolve against one asset tree, including option and explanation assets", () => {
  const root = fixture((r) => {
    png(r, "assets/ns-a/stem.png"); png(r, "assets/ns-a/opt.png"); png(r, "assets/ns-a/expl.png"); png(r, "assets/ns-a/orphan.png");
    writeFileSync(join(r, "data/question-packs/uni.json"), JSON.stringify({ questions: [q("u1", { assetPaths: ["assets/ns-a/stem.png"] })] }));
    writeFileSync(join(r, "data/library-packs/lib.json"), JSON.stringify({ questions: [q("l1", { explanationAssetPaths: ["assets/ns-a/expl.png"], options: [{ id: "a", text: "", assetPaths: ["assets/ns-a/opt.png"] }, { id: "b", text: "B" }] })] }));
  });
  try {
    const refs = collectPackRefs(root);
    assert.deepEqual(refs.map((x) => [x.origin, x.kind]).sort(), [["library-pack", "explanation"], ["library-pack", "option"], ["question-pack", "question"]]);
    const result = checkRefs(root);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, ['Asset "assets/ns-a/orphan.png" is not referenced by any pack.']);
    assert.equal(result.refCount, 3);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a reference to a missing file or an invalid path is an error", () => {
  const root = fixture((r) => {
    writeFileSync(join(r, "data/library-packs/lib.json"), JSON.stringify({ questions: [q("l1", { assetPaths: ["assets/ns-a/missing.png", "../escape.png"] })] }));
  });
  try {
    const { errors } = checkRefs(root);
    assert.equal(errors.length, 2);
    assert.equal(errors.some((e) => e.includes("does not exist")), true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
