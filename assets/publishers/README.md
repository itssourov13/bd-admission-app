# Publisher logo assets — reserved location

The project owner authorised authentic publisher logos/wordmarks in this app (Phase 8). **Only the ASPECT mark is bundled
(owner-supplied, 2026-11-18)**; no original SVG could be retrieved for the other publishers. Nothing has been redrawn or
imitated — publishers without a file render a text monogram until the original is supplied.

Reserved slots (file name = publisher slug): `udvash.svg`, `acs.svg`, `pankouri.svg`, `joykoli.svg`.

To add one (owner action):
1. Place the original, unmodified SVG here as `<slug>.svg`.
2. Add `import UdvashLogo from "../../../assets/publishers/udvash.svg";` and `udvash: { kind: "svg", Svg: UdvashLogo },`
   in `src/features/library/publisherLogos.ts` (Metro needs static imports).
3. Record the file, its source and the permission in the table below.

| Slug | File | Source | Permission | Status |
| --- | --- | --- | --- | --- |
| udvash | — | — | Owner-authorised | Awaiting owner-provided SVG |
| aspect | `aspect.png` (256x256 RGBA PNG, byte-identical to the owner's file) | Supplied by the owner (`aspect-logo.png`), 2026-11-18; kept as PNG because tracing to SVG would lose the fine lettering | Owner confirmed 2026-11-18 that publication, logo and related use permissions are obtained | Bundled; registered as a raster in `publisherLogos.ts` |
| acs | — | — | Owner-authorised | Awaiting owner-provided SVG |
| pankouri | — | — | Owner-authorised | Awaiting owner-provided SVG |
| joykoli | — | — | Owner-authorised | Awaiting owner-provided SVG |

Raster format note: `{ kind: "raster", source: require(...) }` is rendered by `BrandLogo` with `contain` on a white tile, so display size
is set by the component (48–56 dp), not by enlarging the file.
