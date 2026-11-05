import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateQuestionPack } from "../src/services/questionPackValidator.mjs";

const DEFAULT_PACK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../data/question-packs");

export { validateQuestionPack };

/** Validates all .json files in a pack directory without modifying the source data. */
export async function validateDirectory(directory = DEFAULT_PACK_DIR) {
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const invalidFiles = [];
  const errors = [];
  let questions = 0;
  let warnings = 0;

  for (const file of files) {
    let pack;
    try {
      pack = JSON.parse(await readFile(join(directory, file), "utf8"));
    } catch (error) {
      invalidFiles.push(file);
      errors.push({ file, message: "invalid JSON: " + (error instanceof Error ? error.message : String(error)) });
      continue;
    }

    const result = validateQuestionPack(pack);
    questions += Array.isArray(pack.questions) ? pack.questions.length : 0;
    warnings += result.warnings.length;
    if (!result.valid) {
      invalidFiles.push(file);
      for (const message of result.errors) errors.push({ file, message });
    }
  }

  return { files: files.length, questions, warnings, errors, invalidFiles };
}

async function validateOne(file) {
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

async function main(file) {
  if (file) return validateOne(file);

  const result = await validateDirectory();
  console.log("Bundled question-pack validation: " + (result.errors.length === 0 ? "PASS" : "FAIL"));
  console.log("Packs: " + result.files + " | Questions: " + result.questions + " | Errors: " + result.errors.length + " | Warnings: " + result.warnings);
  for (const problem of result.errors) console.error("ERROR [" + problem.file + "]: " + problem.message);
  if (result.invalidFiles.length) {
    console.error("Invalid packs: " + result.invalidFiles.join(", "));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main(process.argv[2]);
}
