#!/usr/bin/env node
// Shared offline asset pipeline. Indexes EVERY image under data/question-packs/assets/** (any namespace folder, png/jpg/webp)
// into src/content/questionAssets.ts, because JSON asset paths are dynamic and cannot be passed to require().
//   node scripts/build-question-assets.mjs           regenerate the index
//   node scripts/build-question-assets.mjs --check   write nothing; fail on a stale index, invalid path or missing referenced file
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRefs, renderIndex, scanAssets } from "./lib/asset-index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outFile = resolve(root, "src/content/questionAssets.ts");
const check = process.argv.includes("--check");

const { keys, problems } = scanAssets(root);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
const body = renderIndex(keys);

if (check) {
  const refs = checkRefs(root);
  const errors = [...refs.errors];
  if (!existsSync(outFile) || readFileSync(outFile, "utf8") !== body) errors.push("src/content/questionAssets.ts is stale; run `pnpm question-assets:index`.");
  for (const w of refs.warnings) console.warn("warning: " + w);
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  console.log(`Asset check ok: ${refs.assetCount} asset(s), ${refs.refCount} reference(s) (${refs.uniqueRefs} unique), index up to date.`);
} else {
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, body, "utf8");
  console.log(`Indexed ${keys.length} local question asset(s) into src/content/questionAssets.ts`);
}
