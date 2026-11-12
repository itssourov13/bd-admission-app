import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, parseSettings, resolveReducedMotion, resolveScheme, serializeSettings } from "../src/settings/model.ts";
import { readFileSync } from "node:fs";
import { BRAND_LIGHT_COLORS, DARK_THEME, LIGHT_THEME, contrastRatio, hexToChannels } from "../src/settings/palettes.ts";

test("parseSettings falls back per field and never throws", () => {
  assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings("not json"), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings("[1]"), DEFAULT_SETTINGS);
  const s = parseSettings(JSON.stringify({ theme: "dark", motion: "bogus", haptics: "yes", questionTextSize: "large" }));
  assert.equal(s.theme, "dark");
  assert.equal(s.motion, "system");
  assert.equal(s.haptics, true);
  assert.equal(s.questionTextSize, "large");
  assert.deepEqual(parseSettings(serializeSettings(s)), s);
});

test("resolveScheme: explicit preference wins, system follows the device", () => {
  assert.equal(resolveScheme("light", "dark"), "light");
  assert.equal(resolveScheme("dark", "light"), "dark");
  assert.equal(resolveScheme("system", "dark"), "dark");
  assert.equal(resolveScheme("system", null), "light");
});

test("resolveReducedMotion combines preference and system flag", () => {
  assert.equal(resolveReducedMotion("reduced", false), true);
  assert.equal(resolveReducedMotion("full", true), false);
  assert.equal(resolveReducedMotion("system", true), true);
  assert.equal(resolveReducedMotion("system", false), false);
});

test("css variable maps cover the same tokens in both themes", () => {
  assert.deepEqual(Object.keys(LIGHT_THEME.cssVars).sort(), Object.keys(DARK_THEME.cssVars).sort());
  assert.equal(hexToChannels("#FFFFFF"), "255 255 255");
  assert.ok("--c-sand-100" in LIGHT_THEME.cssVars && "--c-body" in DARK_THEME.cssVars);
});

test("dark palette keeps accessible contrast for text on surfaces", () => {
  const { colors, feedback } = DARK_THEME;
  for (const bg of [colors.bgBody, colors.surface, colors.sand100]) {
    for (const fg of [colors.ink900, colors.ink700, colors.ink500, colors.brand700, colors.gold700]) {
      assert.ok(contrastRatio(fg, bg) >= 4.5, `${fg} on ${bg} = ${contrastRatio(fg, bg).toFixed(2)}`);
    }
  }
  assert.ok(contrastRatio(feedback.danger700, feedback.danger100) >= 4.5);
  assert.ok(contrastRatio(colors.brand700, colors.brand100) >= 4.5);
  assert.ok(contrastRatio(colors.gold700, colors.gold100) >= 4.5);
  assert.ok(contrastRatio(LIGHT_THEME.colors.ink500, LIGHT_THEME.colors.surface) >= 4.5);
});

test("light palette literals match brand.config.json", () => {
  const brand = JSON.parse(readFileSync(new URL("../brand.config.json", import.meta.url), "utf8")) as { colors: Record<string, string> };
  assert.deepEqual({ ...BRAND_LIGHT_COLORS }, brand.colors);
});
