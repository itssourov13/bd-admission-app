import type { LogoAsset } from "../branding/logoAsset";

/**
 * Bundled publisher logos/wordmarks, keyed by publishers.logo_key (falling back to the publisher slug). Rendered by
 * PublisherMark -> BrandLogo. Metro needs static require paths, so every asset is listed explicitly.
 *
 * aspect: the owner-supplied ASPECT mark (256x256 PNG, ~77 KB). Kept as a raster on purpose: the artwork has fine
 * lettering that a traced SVG would lose, and 256 px already covers the largest displayed size (56 dp at 3x density).
 * Source and permission record: assets/publishers/README.md.
 *
 * Other publishers without original artwork fall back to a text monogram; nothing is redrawn or imitated. Reserved
 * slugs: udvash, acs, pankouri, joykoli.
 */
export const PUBLISHER_LOGOS: Readonly<Record<string, LogoAsset | undefined>> = {
  aspect: { kind: "raster", source: require("../../../assets/publishers/aspect.png") }
};

export function publisherLogoFor(logoKey?: string | null, slug?: string | null): LogoAsset | undefined {
  return (logoKey ? PUBLISHER_LOGOS[logoKey] : undefined) ?? (slug ? PUBLISHER_LOGOS[slug] : undefined);
}
