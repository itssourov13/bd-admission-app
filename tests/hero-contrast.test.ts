import test from "node:test";
import assert from "node:assert/strict";
import { blendOver, contrastRatio, darkColors, DARK_THEME, HERO, LIGHT_THEME, lightColors, type ThemeTokens } from "../src/settings/palettes.ts";

const AA = 4.5;
const fmt = (a: string, b: string) => `${a} on ${b} = ${contrastRatio(a, b).toFixed(2)}`;

test("Hero text passes AA on every gradient stop it can overlap (theme-independent)", () => {
  for (const stop of HERO.stops) {
    for (const [name, fg] of Object.entries({ eyebrow: HERO.eyebrow, title: HERO.title, body: HERO.body, context: HERO.context, gold: HERO.gold })) {
      assert.ok(contrastRatio(fg, stop) >= AA, `${name}: ${fmt(fg, stop)}`);
    }
    const pillBg = blendOver(HERO.pill.overlay, HERO.pill.alpha, stop);
    assert.ok(contrastRatio(HERO.pill.fg, pillBg) >= AA, `pill: ${fmt(HERO.pill.fg, pillBg)}`);
    assert.ok(contrastRatio(HERO.gold, pillBg) >= 3, `pill icon: ${fmt(HERO.gold, pillBg)}`);
    // Secondary CTA is white text on a translucent white overlay (the pressed state is the strongest overlay used: 0.24).
    for (const alpha of [HERO.secondary.alpha, 0.24]) {
      const bg = blendOver(HERO.secondary.overlay, alpha, stop);
      assert.ok(contrastRatio(HERO.secondary.fg, bg) >= AA, `secondary (${alpha}): ${fmt(HERO.secondary.fg, bg)}`);
    }
  }
});

test("Hero CTA fills keep AA label contrast", () => {
  assert.ok(contrastRatio(HERO.primary.fg, HERO.primary.bg) >= 7, fmt(HERO.primary.fg, HERO.primary.bg));
  assert.ok(contrastRatio(HERO.resume.fg, HERO.resume.bg) >= 7, fmt(HERO.resume.fg, HERO.resume.bg));
});

test("regression: the dark brand200 tint (the reported unreadable Hero text) is not usable on the Hero gradient", () => {
  for (const stop of HERO.stops) assert.ok(contrastRatio(darkColors.brand200, stop) < 3, "dark brand200 must never be used as Hero text");
  for (const fg of [HERO.eyebrow, HERO.context]) assert.notEqual(fg.toLowerCase(), darkColors.brand200.toLowerCase());
});

function semanticPairs(theme: ThemeTokens): [string, string, string, number][] {
  const c = theme.colors;
  return [
    // Buttons (src/components/ui/Button.tsx): primary white on brand500, accent navy900 on gold500, outline/ghost brand700.
    ["button primary", c.white, c.brand500, AA],
    ["button accent", c.navy900, c.gold500, AA],
    ["button outline", c.brand700, c.surface, AA],
    ["button ghost", c.brand700, c.bgBody, AA],
    // Chips (src/components/ui/Chip.tsx) and choice/selected controls (Toggle.tsx, VarsityScreen filter, QuestionCard).
    ["chip neutral", c.ink700, c.sand100, AA],
    ["chip brand", c.brand700, c.brand100, AA],
    ["chip gold", c.gold700, c.gold100, AA],
    ["choice selected", c.white, c.brand500, AA],
    ["filter selected", c.white, c.brand600, AA],
    ["choice unselected", c.ink700, c.surface, AA],
    // Text on the main surfaces: headings, body, secondary, tinted cards.
    ["heading on body", c.ink900, c.bgBody, AA],
    ["heading on surface", c.ink900, c.surface, AA],
    ["secondary on body", c.ink500, c.bgBody, AA],
    ["secondary on surface", c.ink500, c.surface, AA],
    ["secondary on sand100", c.ink500, c.sand100, AA],
    ["feedback", theme.feedback.danger700, theme.feedback.danger100, AA],
    ["white on danger fill", c.white, theme.feedback.danger500, AA]
  ];
}

for (const theme of [LIGHT_THEME, DARK_THEME]) {
  test(`${theme.scheme}: semantic text/surface pairs meet WCAG AA`, () => {
    for (const [name, fg, bg, min] of semanticPairs(theme)) {
      assert.ok(contrastRatio(fg, bg) >= min, `${theme.scheme} ${name}: ${fmt(fg, bg)} (< ${min})`);
    }
  });
}

test("light brand palette is unchanged by Phase 11; only secondary ink was darkened for AA on the page background", () => {
  assert.equal(lightColors.brand200, "#A9DDCC");
  assert.equal(lightColors.brand500, "#16866A");
  assert.equal(lightColors.gold500, "#E8AB35");
  // ink500 was #68778B (4.25:1 on #F5F7FA, below AA); #627185 is 4.64:1 and keeps the same hue.
  assert.equal(lightColors.ink500, "#627185");
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tsxFiles(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : []));
}

test("static guard: tint tokens that flip to dark fills are never used as text colour; faint ink400 text is allow-listed", () => {
  const files = [...tsxFiles("app"), ...tsxFiles("src")];
  const offenders: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (/\btext-(brand-(100|200)|gold-100)\b/.test(text)) offenders.push(`${file}: tint token used as text colour`);
    // ink400 is 2.6:1 on the light page background; only the transient setup "pending" step may use it.
    if (/\btext-ink-400\b/.test(text) && !file.endsWith("SetupScreen.tsx")) offenders.push(`${file}: text-ink-400`);
  }
  assert.deepEqual(offenders, []);
});
