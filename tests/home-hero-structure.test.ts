import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const rootPath = root.pathname;
const read = (p: string) => readFileSync(new URL(p, root), "utf8");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(rootPath, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(rootPath, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.tsx$/.test(name)) out.push(rel);
  }
  return out;
}

/** Width/height of a baseline or progressive JPEG from its SOF marker (no image dependency needed). */
function jpegSize(path: string): { width: number; height: number } {
  const buf = readFileSync(new URL(path, root));
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1]!;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("no SOF marker");
}

test("regression: no Pressable uses a callback-valued style (unsupported by NativeWind 4, it silently drops the whole style)", () => {
  for (const file of [...sourceFiles("app"), ...sourceFiles("src")]) {
    assert.doesNotMatch(read(file), /style=\{\(\s*\{\s*pressed/, `${file} passes a Pressable style callback`);
  }
});

test("Home hero keeps both real, accessible actions and their original destinations", () => {
  const hero = read("src/components/home/HomeHero.tsx");
  assert.equal((hero.match(/<Pressable/g) ?? []).length, 2, "primary + secondary actions are native Pressables");
  assert.equal((hero.match(/accessibilityRole="button"/g) ?? []).length, 2);
  assert.match(hero, /onPress=\{onPrimary\}/);
  assert.match(hero, /onPress=\{onSecondary\}/);
  const home = read("app/(tabs)/index.tsx");
  assert.match(home, /onPrimary=\{\(\) => router\.push\(href\("\/flash\/setup"\)\)\}/);
  assert.match(home, /onSecondary=\{\(\) => router\.push\(href\("\/exam\/setup"\)\)\}/);
  assert.match(home, /router\.push\(href\(`\/exam\/\$\{active\.id\}`\)\)/, "resume still opens the running exam");
});

test("Home hero cover is a 2:1 landscape photo, separate from the university logo registry, and never a tap target", () => {
  assert.ok(existsSync(new URL("assets/home/hero-cover.jpg", root)));
  const { width, height } = jpegSize("assets/home/hero-cover.jpg");
  const ratio = width / height;
  assert.ok(ratio > 1.9 && ratio < 2.15, `cover aspect ${width}x${height} = ${ratio.toFixed(3)}`);
  assert.ok(statSync(new URL("assets/home/hero-cover.jpg", root)).size < 250_000, "cover stays small enough not to affect startup");
  const hero = read("src/components/home/HomeHero.tsx");
  assert.match(hero, /assets\/home\/hero-cover\.jpg/);
  assert.doesNotMatch(hero, /universityLogos|UniversityLogo/);
  assert.match(hero, /pointerEvents="none"[^>]*importantForAccessibility="no-hide-descendants"|importantForAccessibility="no-hide-descendants"[^>]*pointerEvents="none"/);
  assert.match(hero, /minHeight: coverMin/, "cover height is a minimum so large fonts grow the card instead of clipping");
});

test("regression: Profile/Result Stat value has an explicit semantic foreground (Txt drops its default when className is set)", () => {
  assert.match(read("src/components/common/Stat.tsx"), /<Txt[^>]*className="[^"]*\btext-ink-900\b[^"]*"/);
});

test("every <Txt className> either names a colour token or supplies a colour in style", () => {
  const colourClass = /\btext-(ink|brand|gold|sand|white|danger|navy|red|green|emerald|amber|rose|slate)\b|\btext-\[#/;
  const offenders: string[] = [];
  for (const file of [...sourceFiles("app"), ...sourceFiles("src")]) {
    const src = read(file);
    for (const m of src.matchAll(/<Txt\b[^>]*?className=(?:"([^"]*)"|\{`([^`]*)`\})[^>]*?>/gs)) {
      const cls = m[1] ?? m[2] ?? "";
      if (!colourClass.test(cls) && !/color\s*:/.test(m[0]) && !/\$\{/.test(cls)) offenders.push(`${file}: ${cls}`);
    }
  }
  assert.deepEqual(offenders, [], "Txt with className but no colour falls back to the native default (near-black on dark surfaces)");
});
