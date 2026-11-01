import type { BUNDLED_PACKS } from "./bundledPacks";

/**
 * Loads the generated bundled-pack index on demand. A static import would evaluate about 21 MiB of question JSON
 * during app start-up, before the first React render and therefore before any setup UI could paint. Metro evaluates
 * the module when `import()` runs, which the startup sequence does after the setup screen is on screen.
 */
export async function loadBundledPacks(): Promise<typeof BUNDLED_PACKS> {
  const module = await import("./bundledPacks");
  return module.BUNDLED_PACKS;
}
