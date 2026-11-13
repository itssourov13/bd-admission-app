import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), "utf8");

/** Every asset referenced by the logo registries must exist, and bundled SVGs must be plain, self-contained vector files. */
function referencedAssets(registrySource: string): string[] {
  const found = new Set<string>();
  for (const m of registrySource.matchAll(/["']((?:\.\.\/)+assets\/[^"']+\.(?:svg|png))["']/g)) found.add(m[1].replace(/^(?:\.\.\/)+/, ""));
  return [...found];
}

for (const [name, file] of [["university", "src/features/catalog/universityLogos.ts"], ["publisher", "src/features/library/publisherLogos.ts"]] as const) {
  test(`${name} logo registry only references existing, safe assets`, () => {
    const assets = referencedAssets(read(file).split("\n").filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//")).join("\n"));
    for (const a of assets) {
      assert.ok(existsSync(new URL(a, root)), `missing asset ${a}`);
      if (a.endsWith(".svg")) {
        const svg = read(a);
        assert.match(svg, /<svg[\s>]/);
        assert.match(svg.trimEnd(), /<\/svg>$/);
        assert.doesNotMatch(svg, /<script|foreignObject|javascript:/i, `${a} must not contain active content`);
        assert.match(svg, /viewBox=/, `${a} needs a viewBox to scale`);
      }
    }
  });
}

test("university logos are documented with source and permission", () => {
  const sources = read("assets/universities/SOURCES.md");
  for (const key of ["du", "ru", "ju", "hstu"]) assert.ok(sources.includes(`| \`${key}\` |`), `SOURCES.md must record ${key}`);
});
