import type { LogoAsset } from "../branding/logoAsset";
import DuLogo from "../../../assets/universities/du.svg";
import RuLogo from "../../../assets/universities/ru.svg";
import JuLogo from "../../../assets/universities/ju.svg";

/**
 * Bundled university logos, keyed by parent-university key (see universities.ts). Rendered by BrandLogo.
 *
 * The project owner explicitly authorised use of authentic university and publisher logos in this app (Phase 8).
 * Original artwork is bundled unmodified; source and permission records live in assets/universities/SOURCES.md.
 * Metro needs static import paths, so every asset is imported explicitly here.
 *   du, ru, ju: original SVG.   hstu: the university's own official PNG (no vector is published on its website).
 * A university without an entry here (genuinely missing asset) falls back to its monogram.
 */
export const UNIVERSITY_LOGOS: Readonly<Record<string, LogoAsset | undefined>> = {
  du: { kind: "svg", Svg: DuLogo },
  ru: { kind: "svg", Svg: RuLogo },
  ju: { kind: "svg", Svg: JuLogo },
  hstu: { kind: "raster", source: require("../../../assets/universities/hstu.png") }
};
