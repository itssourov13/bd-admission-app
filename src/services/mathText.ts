/**
 * Presentation-time mathematical / scientific notation for question text. Pure and UI-independent.
 *
 * The canonical question-pack strings are never rewritten: `formatMathText` only produces a display string and
 * `spokenMathText` produces a screen-reader string. Superscripts and subscripts are emitted as Unicode characters so
 * they work inside an ordinary <Text> (selectable, no inline layout tricks) with Bangla and English together.
 *
 * Supported (everything else degrades to the original text, never to a guess):
 *   - powers: `10^23`, `10^-7`, `10^{-8}`, `ms^-1`, `x^(2n)`, `e^-x`, `3^x`, `sin^-1`
 *   - ionic charges: `Cu^2+`, `O^2-`, `Na^+`, `Cl^-`, `NH4^+`, `Fe(CN)6]^-2`, `e^-`
 *   - sub/superscripts on one token: `^nP_r`, `^12C_3`, `^85_37Rb`, `^{64}_{28}`, `H_2`, `x_{n-1}`
 *   - unit-vector hats: `2i^ + 3j^`, `i^+k^`
 *   - a small, explicit LaTeX remnant set: `\( \)`, `\left \right`, `\mathrm{..}`, `\circ`, `\times`, `\cdot`,
 *     `\hat{i}`, simple `\frac{a}{b}`
 * Deliberately NOT transformed: a caret next to Bangla letters (a transcription artefact such as `শ^সন`), an exponent
 * that cannot be written fully with Unicode super/subscripts (`2/3`, `√3`, `π`, `a+b` with spaces), ambiguous
 * exponents (`PV^γ-1`, `3^bx`), decimal exponents, and nested powers.
 */

export type MathSegment =
  | { kind: "text"; source: string; display: string }
  | { kind: "sup"; source: string; display: string; content: string; charge?: boolean; leading?: boolean }
  | { kind: "sub"; source: string; display: string; content: string }
  | { kind: "hat"; source: string; display: string; content: string };

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "–": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ", j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ",
  n: "ⁿ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
  A: "ᴬ", B: "ᴮ", D: "ᴰ", E: "ᴱ", G: "ᴳ", H: "ᴴ", I: "ᴵ", J: "ᴶ", K: "ᴷ", L: "ᴸ", M: "ᴹ", N: "ᴺ", O: "ᴼ",
  P: "ᴾ", R: "ᴿ", T: "ᵀ", U: "ᵁ", V: "ⱽ", W: "ᵂ",
  β: "ᵝ", γ: "ᵞ", δ: "ᵟ", θ: "ᶿ", φ: "ᵠ", χ: "ᵡ"
};
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "−": "₋", "–": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ",
  t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ"
};

function mapAll(text: string, table: Record<string, string>): string | null {
  if (text.length === 0) return null;
  let out = "";
  for (const ch of text) {
    const m = table[ch];
    if (m === undefined) return null;
    out += m;
  }
  return out;
}

const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";
const isLatin = (c: string | undefined) => c !== undefined && /[A-Za-z]/.test(c);
const isAlnum = (c: string | undefined) => c !== undefined && /[A-Za-z0-9]/.test(c);
const isSign = (c: string | undefined) => c === "+" || c === "-" || c === "−" || c === "–";
const isBangla = (c: string | undefined) => c !== undefined && /[\u0980-\u09FF]/.test(c);
const GREEK_EXP = /[βγδθφχ]/;

/** Index of the bracket that closes the one at `open`, honouring nesting; -1 when unbalanced. */
function matching(s: string, open: number, o: string, c: string): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === o) depth++;
    else if (s[i] === c && --depth === 0) return i;
  }
  return -1;
}

/** Explicit LaTeX remnants only. Anything else is left exactly as written. */
function normalizeLatex(input: string): string {
  if (!input.includes("\\")) return input;
  let s = input.replace(/\\\(|\\\)/g, "").replace(/\\left|\\right/g, "");
  s = s.replace(/\\mathrm\{([^{}]*)\}/g, (_m, inner: string) => inner.replace(/~/g, ""));
  s = s.replace(/\\hat\{([A-Za-z])\}/g, (_m, c: string) => (c + "\u0302").normalize("NFC"));
  s = s.replace(/\\times(?![A-Za-z])/g, "×").replace(/\\cdot(?![A-Za-z])/g, "·");
  s = s.replace(/\^\{\\circ\}|\^\\circ(?![A-Za-z])/g, "°").replace(/\\circ(?![A-Za-z])/g, "°");
  for (let guard = 0; guard < 8; guard++) {
    const at = s.indexOf("\\frac{");
    if (at < 0) break;
    const aEnd = matching(s, at + 5, "{", "}");
    if (aEnd < 0 || s[aEnd + 1] !== "{") break;
    const bEnd = matching(s, aEnd + 1, "{", "}");
    if (bEnd < 0) break;
    const a = s.slice(at + 6, aEnd);
    const b = s.slice(aEnd + 2, bEnd);
    const wrap = (x: string) => (/^[A-Za-z0-9.]+(?:\^(?:\{[^{}\s]*\}|[-−+]?[A-Za-z0-9]+))?$/.test(x) ? x : `(${x})`);
    s = s.slice(0, at) + `${wrap(a)}/${wrap(b)}` + s.slice(bEnd + 1);
  }
  return s;
}

interface Exponent { content: string; display: string; length: number; charge?: boolean }

const ION_BASE = /(?:[A-Z][a-z]?\d*|\)|\]|\b[e])$/;

function parseExponent(s: string, p: number, before: string, leading: boolean): Exponent | null {
  const c = s[p];
  if (c === undefined) return null;
  if (c === "{") {
    const end = matching(s, p, "{", "}");
    if (end < 0) return null;
    const content = s.slice(p + 1, end).trim();
    if (content.includes("^") || /\s/.test(content)) return null;
    const display = mapAll(content, SUP);
    return display ? { content, display, length: end - p + 1 } : null;
  }
  if (c === "(") {
    const end = matching(s, p, "(", ")");
    if (end < 0 || end - p > 17) return null;
    const content = s.slice(p + 1, end);
    if (content.includes("^") || /\s/.test(content)) return null;
    const display = mapAll(content, SUP);
    return display ? { content, display, length: end - p + 1 } : null;
  }
  if (isSign(c)) {
    const n = s[p + 1];
    if (isDigit(n)) {
      let q = p + 1;
      while (isDigit(s[q])) q++;
      if (s[q] === "." && isDigit(s[q + 1])) return null; // decimal exponents are not representable
      const content = s.slice(p, q);
      return { content, display: mapAll(content, SUP)!, length: q - p };
    }
    if ((isLatin(n) || (n !== undefined && GREEK_EXP.test(n))) && !isAlnum(s[p + 2]) && !isSign(s[p + 2])) {
      const content = c + n;
      const display = mapAll(content, SUP);
      return display ? { content, display, length: 2 } : null;
    }
    // A bare sign is a charge when it closes an ion-looking base and is not the start of an operand.
    if (n === undefined || !(isAlnum(n) || n === "(")) {
      if (ION_BASE.test(before)) return { content: c, display: SUP[c]!, length: 1, charge: true };
    }
    return null;
  }
  if (isDigit(c)) {
    let q = p;
    while (isDigit(s[q])) q++;
    const digits = s.slice(p, q);
    const sign = s[q];
    if (isSign(sign) && !isAlnum(s[q + 1]) && s[q + 1] !== "(" && ION_BASE.test(before)) {
      const content = digits + sign;
      return { content, display: mapAll(content, SUP)!, length: q + 1 - p, charge: true };
    }
    return { content: digits, display: mapAll(digits, SUP)!, length: q - p };
  }
  if (isLatin(c) || GREEK_EXP.test(c)) {
    const n = s[p + 1];
    const display = mapAll(c, SUP);
    if (!display) return null;
    // Leading single letter as in ^nP_r / ^nC_r.
    if (leading && /[PC]/.test(n ?? "") && s[p + 2] === "_") return { content: c, display, length: 1 };
    // `3^x`, `e^x)`: only when the letter is the whole exponent and no sign follows directly (`PV^γ-1` is ambiguous).
    if (n !== undefined && (isAlnum(n) || isBangla(n) || isSign(n) || n === "(" || n === "^" || n === "_")) return null;
    return { content: c, display, length: 1 };
  }
  return null;
}

function parseSubscript(s: string, p: number): Exponent | null {
  const c = s[p];
  if (c === undefined) return null;
  if (c === "{") {
    const end = matching(s, p, "{", "}");
    if (end < 0) return null;
    const content = s.slice(p + 1, end).trim();
    if (/[\s^_]/.test(content)) return null;
    const display = mapAll(content, SUB);
    return display ? { content, display, length: end - p + 1 } : null;
  }
  if (isDigit(c)) {
    let q = p;
    while (isDigit(s[q])) q++;
    const content = s.slice(p, q);
    return { content, display: mapAll(content, SUB)!, length: q - p };
  }
  if (isLatin(c)) {
    const n = s[p + 1];
    const display = mapAll(c, SUB);
    if (!display || (n !== undefined && (isAlnum(n) || n === "_" || isBangla(n)))) return null;
    return { content: c, display, length: 1 };
  }
  return null;
}

/** `i^`, `j^`, `k^` as unit-vector hats: a lone letter (optionally after a coefficient) not followed by an operand. */
function isUnitVectorHat(s: string, caret: number): boolean {
  const letter = s[caret - 1];
  if (!letter || !/[ijk]/.test(letter)) return false;
  const before = s[caret - 2];
  if (isLatin(before) || isBangla(before)) return false;
  const n = s[caret + 1];
  if (n === undefined) return true;
  if (isSign(n)) {
    const after = s[caret + 2];
    return (after !== undefined && /[ijk]/.test(after) && s[caret + 3] === "^") || after === undefined || /\s/.test(after);
  }
  return !(isAlnum(n) || isBangla(n) || n === "{" || n === "(");
}

export function hasMathMarkup(input: string): boolean {
  return input.includes("^") || input.includes("\\") || input.includes("_");
}

export function parseMathText(input: string): MathSegment[] {
  if (!hasMathMarkup(input)) return [{ kind: "text", source: input, display: input }];
  const s = normalizeLatex(input);
  const out: MathSegment[] = [];
  let buf = "";
  const flush = () => { if (buf) { out.push({ kind: "text", source: buf, display: buf }); buf = ""; } };
  const before = () => out.map((x) => x.source).join("") + buf;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === "^") {
      const prev = s[i - 1];
      const leading = prev === undefined || /[\s(\[=,:;"'“‘>]/.test(prev);
      if (isBangla(prev)) { buf += ch; continue; }
      // Unit-vector hat: i^, j^, k^ standing alone as a symbol.
      if (isUnitVectorHat(s, i)) {
        buf = buf.slice(0, -1);
        flush();
        const letter = s[i - 1]!;
        out.push({ kind: "hat", source: letter + "^", display: (letter + "\u0302").normalize("NFC"), content: letter });
        continue;
      }
      const e = parseExponent(s, i + 1, before(), leading);
      if (e) {
        flush();
        out.push({ kind: "sup", source: s.slice(i, i + 1 + e.length), display: e.display, content: e.content, charge: e.charge, leading: leading && !isAlnum(prev) });
        i += e.length;
        continue;
      }
      buf += ch;
      continue;
    }
    if (ch === "_") {
      const prev = s[i - 1];
      const baseOk = prev !== undefined && (isAlnum(prev) || /[}\])∫∑∏Σ]/.test(prev));
      const e = baseOk || /\^/.test(s[i - 1] ?? "") ? parseSubscript(s, i + 1) : null;
      if (e) {
        flush();
        out.push({ kind: "sub", source: s.slice(i, i + 1 + e.length), display: e.display, content: e.content });
        i += e.length;
        continue;
      }
    }
    buf += ch;
  }
  flush();
  return out;
}

/** Display string with Unicode super/subscripts. Returns the input unchanged when nothing is recognised. */
export function formatMathText(input: string): string {
  if (!hasMathMarkup(input)) return input;
  return parseMathText(input).map((x) => x.display).join("");
}

type Lang = "bn" | "en";
const WORDS: Record<Lang, { power: string; sup: string; sub: string; hat: string; charge: string; plus: string; minus: string }> = {
  en: { power: "to the power of", sup: "superscript", sub: "subscript", hat: "hat", charge: "with charge", plus: "plus", minus: "minus" },
  bn: { power: "ঘাত", sup: "ঊর্ধ্বলিখ", sub: "নিম্নলিখ", hat: "হ্যাট", charge: "চার্জ", plus: "প্লাস", minus: "মাইনাস" }
};
const spokenSigns = (text: string, w: (typeof WORDS)[Lang]) =>
  text.replace(/[-−–]/g, ` ${w.minus} `).replace(/\+/g, ` ${w.plus} `).replace(/\s+/g, " ").trim();

/** Screen-reader text: powers, charges and subscripts are spelled out; plain text is unchanged. */
export function spokenMathText(input: string, lang: Lang = "en"): string {
  if (!hasMathMarkup(input)) return input;
  const w = WORDS[lang];
  const parts = parseMathText(input).map((seg) => {
    switch (seg.kind) {
      case "text": return seg.display;
      case "hat": return ` ${seg.content} ${w.hat} `;
      case "sub": return ` ${w.sub} ${seg.content} `;
      case "sup":
        if (seg.charge) return ` ${w.charge} ${spokenSigns(seg.content, w)} `;
        return seg.leading ? ` ${w.sup} ${spokenSigns(seg.content, w)} ` : ` ${w.power} ${spokenSigns(seg.content, w)} `;
    }
  });
  return parts.join("").replace(/\s+/g, " ").trim();
}
