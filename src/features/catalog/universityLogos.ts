import type { ImageSourcePropType } from "react-native";

/**
 * Bundled university logos, keyed by parent-university key (see universities.ts).
 *
 * Intentionally empty: official emblems are trademarks and no licensed/official artwork is bundled yet, so every
 * university renders the monogram fallback. To add one, place a raster file (PNG/WebP, ~256 px, transparent or white
 * background) at assets/universities/<key>.png and register it with a static require, e.g.
 *   du: require("../../../assets/universities/du.png"),
 * Metro needs static require paths, so assets cannot be resolved dynamically. Record the source URL and permission
 * in docs/implementation/PHASE_02_UNIVERSITY_EXPERIENCE.md before adding any file.
 */
export const UNIVERSITY_LOGOS: Readonly<Record<string, ImageSourcePropType | undefined>> = {};
