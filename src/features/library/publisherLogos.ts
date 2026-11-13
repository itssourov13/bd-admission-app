import type { LogoAsset } from "../branding/logoAsset";

/**
 * Bundled publisher logos/wordmarks, keyed by publishers.logo_key (falling back to the publisher slug). Rendered by
 * PublisherMark -> BrandLogo.
 *
 * The owner authorised authentic publisher logos, but no original publisher artwork could be retrieved from an
 * official source in Phase 8 (the publishers' sites expose only bitmaps/none), and no owner-provided files exist yet.
 * Slots are reserved: drop the original file at assets/publishers/<slug>.svg, add a static import + entry below, and
 * record source/permission in assets/publishers/README.md. Until then PublisherMark shows a text monogram; nothing is
 * redrawn or imitated.  Reserved slugs: udvash, aspect, acs, pankouri, joykoli.
 *
 *   import UdvashLogo from "../../../assets/publishers/udvash.svg";
 *   udvash: { kind: "svg", Svg: UdvashLogo },
 */
export const PUBLISHER_LOGOS: Readonly<Record<string, LogoAsset | undefined>> = {};

export function publisherLogoFor(logoKey?: string | null, slug?: string | null): LogoAsset | undefined {
  return (logoKey ? PUBLISHER_LOGOS[logoKey] : undefined) ?? (slug ? PUBLISHER_LOGOS[slug] : undefined);
}
