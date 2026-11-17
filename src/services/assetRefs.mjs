// Shared, dependency-free rules for offline question assets (images/diagrams). Used by the pack validators, the
// Library pack validator, the asset-index generator and the content build, so every content origin obeys the same rules.
// An asset reference is a POSIX path relative to data/question-packs/, always under "assets/<namespace>/".

export const ASSET_PREFIX = "assets/";
export const ASSET_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
export const MAX_ASSETS_PER_ITEM = 8;
const MAX_PATH_LENGTH = 200;
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Returns an error message for an invalid asset path, or null when it is acceptable. */
export function assetPathProblem(path) {
  if (typeof path !== "string" || path === "") return "must be a non-empty string";
  if (path.length > MAX_PATH_LENGTH) return "is too long";
  if (path.includes("\\")) return "must use forward slashes";
  if (!path.startsWith(ASSET_PREFIX)) return `must start with "${ASSET_PREFIX}"`;
  const segments = path.split("/");
  // assets/<namespace>/<file>: at least a namespace folder and a file, no empty/dot segments.
  if (segments.length < 3) return `must be "${ASSET_PREFIX}<namespace>/<file>"`;
  for (const segment of segments) {
    if (segment === "." || segment === ".." || !SEGMENT.test(segment)) return "has an unsafe or empty path segment";
  }
  const ext = segments[segments.length - 1].split(".").pop().toLowerCase();
  if (!ASSET_EXTENSIONS.includes(ext)) return `must end in ${ASSET_EXTENSIONS.join("/")}`;
  return null;
}

/** Validates one optional list of asset paths. `at` names the owner for messages (e.g. "Question q1 option a"). */
export function validateAssetList(list, at) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) return [`${at} assetPaths must be an array.`];
  const errors = [];
  if (list.length > MAX_ASSETS_PER_ITEM) errors.push(`${at} has more than ${MAX_ASSETS_PER_ITEM} assets.`);
  const seen = new Set();
  for (const path of list) {
    const problem = assetPathProblem(path);
    if (problem) errors.push(`${at} asset "${String(path)}" ${problem}.`);
    else if (seen.has(path)) errors.push(`${at} repeats asset "${path}".`);
    else seen.add(path);
  }
  return errors;
}

/** Every asset reference carried by one question item (stem, options, explanation). */
export function collectQuestionAssetRefs(question) {
  const refs = [];
  const push = (kind, list, optionId) => {
    if (Array.isArray(list)) for (const path of list) if (typeof path === "string") refs.push({ kind, optionId, path });
  };
  push("question", question?.assetPaths);
  for (const option of Array.isArray(question?.options) ? question.options : []) push("option", option?.assetPaths, option?.id);
  push("explanation", question?.explanationAssetPaths);
  return refs;
}

/** All asset-list validation errors for one question item. */
export function validateQuestionAssets(question, label) {
  const errors = validateAssetList(question?.assetPaths, `${label} question`);
  for (const option of Array.isArray(question?.options) ? question.options : []) {
    errors.push(...validateAssetList(option?.assetPaths, `${label} option ${String(option?.id)}`));
  }
  errors.push(...validateAssetList(question?.explanationAssetPaths, `${label} explanation`));
  return errors;
}
