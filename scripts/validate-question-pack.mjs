import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";

export { validateQuestionPack };

async function main(file) {
  if (!file) {
    console.error("Usage: node scripts/validate-question-pack.mjs <question-pack.json>");
    process.exitCode = 2;
    return;
  }
  let pack;
  try {
    pack = JSON.parse(await readFile(resolve(file), "utf8"));
  } catch (error) {
    console.error("Could not read valid JSON: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 2;
    return;
  }
  const result = validateQuestionPack(pack);
  console.log("Question pack validation: " + (result.valid ? "PASS" : "FAIL"));
  console.log("Errors: " + result.errors.length + " | Warnings: " + result.warnings.length);
  for (const message of result.errors) console.error("ERROR: " + message);
  for (const message of result.warnings) console.warn("WARNING: " + message);
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main(process.argv[2]);
}
