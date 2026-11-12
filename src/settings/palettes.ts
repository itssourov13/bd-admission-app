/**
 * Semantic colour palettes. The light palette is the original brand palette, unchanged. The dark palette keeps the
 * same token names so every `bg-*`/`text-*` class and every `colors.*` style value resolves per theme.
 * Fills that carry white text (brand500/600/800, gold500, danger500) stay constant; tints and foreground tokens flip.
 */

/**
 * Literal copy of brand.config.json `colors` (the source of truth for app.config.js / splash). Kept literal so this
 * module stays importable by the plain-Node unit tests; tests/settings-theme.test.ts asserts it matches the JSON.
 */
const p = {
  navy900: "#14243A", navy800: "#1C3451",
  brand100: "#DDF3EA", brand200: "#A9DDCC", brand500: "#16866A", brand600: "#0E735A", brand700: "#0A5B48", brand800: "#064738",
  gold100: "#FFF1CC", gold400: "#F6C65B", gold500: "#E8AB35", gold700: "#84580B",
  ink900: "#14243A", ink800: "#263A51", ink700: "#405168", ink500: "#68778B", ink400: "#8E9BAC", ink300: "#B8C1CD",
  sand50: "#FBFCFE", sand100: "#F5F7FA", sand200: "#E5EAF1", sand300: "#D3DAE5",
  body: "#F5F7FA", surface: "#FFFFFF", border: "#E5EAF1", white: "#FFFFFF"
} as const;
export const BRAND_LIGHT_COLORS = p;

export type ThemeScheme = "light" | "dark";

export const lightColors = {
  navy900: p.navy900, navy800: p.navy800,
  ink900: p.ink900, ink800: p.ink800, ink700: p.ink700, ink500: p.ink500, ink400: p.ink400, ink300: p.ink300,
  sand50: p.sand50, sand100: p.sand100, sand200: p.sand200, sand300: p.sand300,
  brand100: p.brand100, brand200: p.brand200, brand500: p.brand500, brand600: p.brand600, brand700: p.brand700, brand800: p.brand800,
  gold100: p.gold100, gold400: p.gold400, gold500: p.gold500, gold700: p.gold700,
  bgBody: p.body, surface: p.surface, border: p.border, white: p.white
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  navy900: p.navy900, navy800: p.navy800,
  // Ink inverts: ink900 is the primary text colour on dark surfaces (contrast >= 4.5:1 for ink500 and up on surface).
  ink900: "#EEF2F7", ink800: "#DCE3EC", ink700: "#C3CDDA", ink500: "#9CAABC", ink400: "#8190A4", ink300: "#5E6C80",
  sand50: "#121C29", sand100: "#1C2939", sand200: "#273649", sand300: "#364860",
  brand100: "#12372E", brand200: "#1F5E4D", brand500: p.brand500, brand600: p.brand600, brand700: "#6FD3B5", brand800: p.brand800,
  gold100: "#3A2F12", gold400: p.gold400, gold500: p.gold500, gold700: "#F2C461",
  bgBody: "#0E1722", surface: "#162131", border: "#273649", white: p.white
};

export type ThemeFeedback = { danger500: string; danger100: string; danger700: string };
export const lightFeedback: ThemeFeedback = { danger500: "#B3362A", danger100: "#FCE9E6", danger700: "#8A241B" };
export const darkFeedback: ThemeFeedback = { danger500: "#D9493D", danger100: "#3B1D1B", danger700: "#FF9F95" };

export type ThemeGradients = {
  hero: readonly [string, string, string];
  heroSoft: readonly [string, string];
  guides: readonly [string, string];
  profile: readonly [string, string];
  avatar: readonly [string, string];
  fab: readonly [string, string];
  signin: readonly [string, string, string];
};

export function buildGradients(c: ThemeColors): ThemeGradients {
  return {
    hero: [p.navy900, p.navy800, p.brand800],
    heroSoft: [p.brand600, p.brand800],
    guides: [p.navy800, p.brand800],
    profile: [p.navy900, p.brand700],
    avatar: [p.gold400, p.gold500],
    fab: [p.brand500, p.brand800],
    signin: [c.brand100, c.bgBody, c.gold100]
  };
}

export type ThemeShadow = {
  sm: object; md: object; brand: object;
};

export function buildShadow(scheme: ThemeScheme): ThemeShadow {
  const dark = scheme === "dark";
  const base = dark ? "#000000" : p.navy900;
  return {
    sm: { shadowColor: base, shadowOffset: { width: 0, height: 2 }, shadowOpacity: dark ? 0.28 : 0.06, shadowRadius: 8, elevation: dark ? 0 : 2 },
    md: { shadowColor: base, shadowOffset: { width: 0, height: 8 }, shadowOpacity: dark ? 0.4 : 0.10, shadowRadius: 20, elevation: dark ? 0 : 5 },
    brand: { shadowColor: dark ? "#000000" : p.brand700, shadowOffset: { width: 0, height: 7 }, shadowOpacity: dark ? 0.4 : 0.20, shadowRadius: 16, elevation: dark ? 0 : 5 }
  };
}

export type ThemeTokens = {
  scheme: ThemeScheme;
  isDark: boolean;
  colors: ThemeColors;
  feedback: ThemeFeedback;
  gradients: ThemeGradients;
  shadow: ThemeShadow;
  /** NativeWind CSS-variable map (space-separated RGB channels) consumed by tailwind.config.js. */
  cssVars: Record<string, string>;
};

/** Token name -> CSS variable. Kept in sync with tailwind.config.js (which references the same `--c-*` names). */
const VAR_TOKENS = [
  "navy900", "navy800", "ink900", "ink800", "ink700", "ink500", "ink400", "ink300",
  "sand50", "sand100", "sand200", "sand300",
  "brand100", "brand200", "brand500", "brand600", "brand700", "brand800",
  "gold100", "gold400", "gold500", "gold700"
] as const;

const kebab = (s: string) => s.replace(/([a-z])(\d)/g, "$1-$2");

export function hexToChannels(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function buildCssVars(c: ThemeColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of VAR_TOKENS) out[`--c-${kebab(k)}`] = hexToChannels(c[k]);
  out["--c-body"] = hexToChannels(c.bgBody);
  out["--c-surface"] = hexToChannels(c.surface);
  out["--c-border"] = hexToChannels(c.border);
  return out;
}

function make(scheme: ThemeScheme): ThemeTokens {
  const colors = scheme === "dark" ? darkColors : (lightColors as ThemeColors);
  return {
    scheme,
    isDark: scheme === "dark",
    colors,
    feedback: scheme === "dark" ? darkFeedback : lightFeedback,
    gradients: buildGradients(colors),
    shadow: buildShadow(scheme),
    cssVars: buildCssVars(colors)
  };
}

export const LIGHT_THEME: ThemeTokens = make("light");
export const DARK_THEME: ThemeTokens = make("dark");
export const themeFor = (scheme: ThemeScheme): ThemeTokens => (scheme === "dark" ? DARK_THEME : LIGHT_THEME);

/** WCAG relative-luminance contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToChannels(hex).split(" ").map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
