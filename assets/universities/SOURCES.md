# University logo assets — source and permission record

The project owner explicitly authorised the use of authentic university and publisher logos in this app (Phase 8,
2026-11-13). Files are bundled **unmodified** (original artwork, colours and proportions); the app only scales them
to fit. Initial assets fetched 2026-11-13; CU was added 2026-11-19.

| Key | File | Format | Source | Source licence label | Owner authorisation |
| --- | --- | --- | --- | --- | --- |
| `cu` | `cu.png` | PNG (official-site bitmap, 429×581 RGBA; unchanged) | University of Chittagong website header: `https://cu.ac.bd/wp-content/uploads/2024/03/university-of-chittagong-seeklogo.com-removebg-preview-removebg-preview-1.png` | University website logo | Yes — explicit owner request to include the original CU mark |
| `du` | `du.svg` | SVG (original vector) | English Wikipedia file `File:Dhaka University logo.svg` (`upload.wikimedia.org/wikipedia/en/c/cb/Dhaka_University_logo.svg`), crest of the University of Dhaka | Non-free logo (Wikipedia "fair use" label) | Yes — explicit owner authorisation |
| `ru` | `ru.svg` | SVG (original vector) | Wikimedia Commons `File:রাজশাহী বিশ্ববিদ্যালয়ের লোগো.svg` (`upload.wikimedia.org/wikipedia/commons/4/4f/…`), logo of the University of Rajshahi | Public domain (per Commons metadata) | Yes |
| `ju` | `ju.svg` | SVG (original vector) | English Wikipedia file `File:Jahangirnagar University Logo.svg` (`upload.wikimedia.org/wikipedia/en/a/a9/Jahangirnagar_University_Logo.svg`) | Non-free logo (Wikipedia "fair use" label) | Yes — explicit owner authorisation |
| `hstu` | `hstu.png` | PNG (official bitmap, 1072×1363 RGBA) | The university's own website: `https://hstu.ac.bd/img/hstu_correct_logo.png` | Institutional logo | Yes — explicit owner authorisation |

Notes
- CU: the university website publishes this original logo as a transparent PNG; that exact file is bundled without redrawing.
- HSTU: no official or community vector (SVG) could be retrieved. The official PNG from the university's own site is
  used until the owner supplies the original SVG. To upgrade: place the SVG at `assets/universities/hstu.svg` and change
  the `hstu` entry in `src/features/catalog/universityLogos.ts` to `{ kind: "svg", Svg: HstuLogo }`.
- DU/JU originate from Wikipedia uploads; if the owner holds the institutions' own master SVGs, replace the files in
  place (same file names) — no code change is needed.
- Registry: `src/features/catalog/universityLogos.ts`. Renderer: `src/components/ui/BrandLogo.tsx` (via `UniversityLogo`).
- A university with no registry entry falls back to its text monogram (genuinely missing asset only).
