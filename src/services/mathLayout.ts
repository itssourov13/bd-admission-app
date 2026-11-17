/**
 * Structured mathematical layout for question text. Pure and UI-independent (no React).
 *
 * `parseMathLayout` turns the *stored* string into a small tree (fractions, roots, matrices/determinants, piecewise
 * `cases`, multi-line aligned blocks). The stored string is never rewritten; this is presentation only. It returns
 * `null` when the text has no structure to lay out, and callers then use the plain `MathText` path unchanged.
 *
 * Recognised, all optional and all falling back to the original text when malformed:
 *   - `\frac{a}{b}` `\dfrac` `\tfrac`, nested; `\sqrt{x}` and `\sqrt[n]{x}`
 *   - `\begin{matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|array|cases|aligned|align|gathered}` ... `\end{..}`
 *     with `&` cell and `\\` row separators; `\left[ ... \right]` style wrappers around an environment
 *   - linearised rows already present in real packs: `|1, a, b + c; 1, b, c + a; 1, c, a + b|` (rows split by `;`,
 *     cells by `,`), also `[..;..]` and `(..;..)` when every row has the same cell count (>= 2 rows, >= 2 columns)
 *   - a small, explicit symbol table for LaTeX words (`\ge`, `\sum`, `\alpha`, ...). Unknown commands stay as written.
 */
import { formatMathText } from "./mathText.ts";

export type MathNode =
  | { kind: "text"; text: string }
  | { kind: "frac"; num: MathNode[]; den: MathNode[] }
  | { kind: "sqrt"; body: MathNode[]; index?: MathNode[] }
  | { kind: "matrix"; rows: MathNode[][][]; open: string; close: string; align: "center" | "left" }
  | { kind: "lines"; lines: MathNode[][] };

const SYMBOLS: Record<string, string> = {
  ge: "≥", geq: "≥", le: "≤", leq: "≤", ne: "≠", neq: "≠", approx: "≈", equiv: "≡", pm: "±", mp: "∓", infty: "∞",
  sum: "∑", prod: "∏", int: "∫", partial: "∂", nabla: "∇", to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒",
  Leftrightarrow: "⇔", in: "∈", cup: "∪", cap: "∩", subset: "⊂", forall: "∀", exists: "∃", therefore: "∴",
  times: "×", cdot: "·", div: "÷", circ: "°", lbrace: "{", rbrace: "}", lt: "<", gt: ">", ldots: "…", cdots: "⋯", dots: "…",
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ", lambda: "λ",
  mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  sin: "sin", cos: "cos", tan: "tan", cot: "cot", sec: "sec", csc: "csc", log: "log", ln: "ln", lim: "lim", exp: "exp",
  max: "max", min: "min", det: "det"
};

const MATRIX_ENVS: Record<string, { open: string; close: string }> = {
  matrix: { open: "", close: "" }, array: { open: "", close: "" }, pmatrix: { open: "(", close: ")" },
  bmatrix: { open: "[", close: "]" }, Bmatrix: { open: "{", close: "}" }, vmatrix: { open: "|", close: "|" }, Vmatrix: { open: "‖", close: "‖" }
};
const LINE_ENVS = new Set(["aligned", "align", "gathered", "split", "eqnarray"]);
const MAX_DEPTH = 8;
const MAX_CELLS = 400;

export function hasStructuredMath(input: string): boolean {
  return /\\(?:d|t)?frac\s*\{|\\sqrt\s*[\[{]|\\begin\s*\{/.test(input) || findLinearMatrices(input).length > 0;
}

/** Index of the brace closing the one at `open`; -1 when unbalanced. */
function closeBrace(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "\\") { i++; continue; }
    if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/** Matching `\end{name}` (nesting-aware) for a `\begin{name}` whose body starts at `from`. */
function findEnd(s: string, from: number, name: string): { start: number; end: number } | null {
  const begin = `\\begin{${name}}`;
  const end = `\\end{${name}}`;
  let depth = 1;
  let i = from;
  while (i < s.length) {
    const b = s.indexOf(begin, i);
    const e = s.indexOf(end, i);
    if (e < 0) return null;
    if (b >= 0 && b < e) { depth++; i = b + begin.length; continue; }
    if (--depth === 0) return { start: e, end: e + end.length };
    i = e + end.length;
  }
  return null;
}

function splitTop(s: string, sep: "&" | "\\\\"): string[] {
  const out: string[] = [];
  let depthBrace = 0;
  let depthEnv = 0;
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\") {
      if (s.startsWith("\\begin{", i)) depthEnv++;
      else if (s.startsWith("\\end{", i)) depthEnv--;
      else if (sep === "\\\\" && s[i + 1] === "\\" && depthBrace === 0 && depthEnv === 0) { out.push(s.slice(last, i)); i++; last = i + 1; continue; }
      i++;
      continue;
    }
    if (s[i] === "{") depthBrace++;
    else if (s[i] === "}") depthBrace--;
    else if (sep === "&" && s[i] === "&" && depthBrace === 0 && depthEnv === 0) { out.push(s.slice(last, i)); last = i + 1; }
  }
  out.push(s.slice(last));
  return out;
}

/** Cells and lines are laid out edge to edge, so surrounding source whitespace is dropped (display only). */
function trimNodes(nodes: MathNode[]): MathNode[] {
  const first = nodes[0];
  if (first && first.kind === "text") first.text = first.text.trimStart();
  const last = nodes[nodes.length - 1];
  if (last && last.kind === "text") last.text = last.text.trimEnd();
  return nodes.filter((n) => n.kind !== "text" || n.text !== "");
}

function pushText(out: MathNode[], raw: string): void {
  if (raw === "") return;
  const last = out[out.length - 1];
  if (last && last.kind === "text") last.text += raw;
  else out.push({ kind: "text", text: raw });
}

function delimiter(token: string): string {
  const t = token.trim();
  if (t === "." || t === "") return "";
  if (t === "\\lbrace" || t === "\\{") return "{";
  if (t === "\\rbrace" || t === "\\}") return "}";
  if (t === "\\|" || t === "\\Vert") return "‖";
  if (t === "\\langle") return "⟨";
  if (t === "\\rangle") return "⟩";
  return t;
}

/** Reads one delimiter token after `\left` / `\right`. */
function readDelim(s: string, at: number): { delim: string; next: number } {
  let i = at;
  while (s[i] === " ") i++;
  if (s[i] === "\\") {
    const m = /^\\([A-Za-z]+|.)/.exec(s.slice(i));
    if (m) return { delim: delimiter(m[0]), next: i + m[0].length };
  }
  return { delim: delimiter(s[i] ?? ""), next: i + 1 };
}

function parseEnv(name: string, body: string, depth: number, open: string, close: string): MathNode | null {
  const working = name === "array" ? body.replace(/^\s*\{[^{}]*\}/, "") : body;
  const rows = splitTop(working, "\\\\");
  while (rows.length && rows[rows.length - 1]!.trim() === "") rows.pop();
  if (rows.length === 0) return null;
  const cells = rows.reduce((n, r) => n + splitTop(r, "&").length, 0);
  if (cells > MAX_CELLS) return null;
  if (LINE_ENVS.has(name)) return { kind: "lines", lines: rows.map((r) => trimNodes(parseSeq(splitTop(r, "&").join(" "), depth + 1))) };
  const grid = rows.map((r) => splitTop(r, "&").map((c) => trimNodes(parseSeq(c, depth + 1))));
  if (name === "cases") return { kind: "matrix", rows: grid, open: "{", close: "", align: "left" };
  const spec = MATRIX_ENVS[name];
  if (!spec) return null;
  return { kind: "matrix", rows: grid, open: open || spec.open, close: close || spec.close, align: "center" };
}

interface LinearMatch { start: number; end: number; open: string; close: string; rows: string[][] }

/** Linearised matrices/determinants as printed in real packs. Conservative: `;` rows, `,` cells, equal cell counts. */
export function findLinearMatrices(input: string): LinearMatch[] {
  const found: LinearMatch[] = [];
  const re = /\|([^|\n]{3,300})\||\[([^\[\]\n]{3,300})\]|\(([^()\n]{3,300})\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    const inner = m[1] ?? m[2] ?? m[3] ?? "";
    if (!inner.includes(";")) continue;
    const rows = inner.split(";").map((r) => r.split(",").map((c) => c.trim()));
    if (rows.length < 2 || rows[0]!.length < 2 || rows.some((r) => r.length !== rows[0]!.length || r.some((c) => c === "" || c.length > 28 || c.includes(":")))) continue;
    const open = m[1] !== undefined ? "|" : m[2] !== undefined ? "[" : "(";
    const close = open === "|" ? "|" : open === "[" ? "]" : ")";
    found.push({ start: m.index, end: m.index + m[0].length, open, close, rows });
  }
  return found;
}

function textWithSymbols(raw: string): string {
  const replaced = raw
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!/g, "")
    .replace(/\\q?quad/g, " ")
    .replace(/\\mathrm\{([^{}]*)\}|\\text\{([^{}]*)\}|\\mathbf\{([^{}]*)\}/g, (_m, a?: string, b?: string, c?: string) => (a ?? b ?? c ?? "").replace(/~/g, ""))
    .replace(/\\([A-Za-z]+)/g, (m, name: string) => (SYMBOLS[name] !== undefined ? SYMBOLS[name]! : m))
    .replace(/\\([{}|])/g, "$1");
  return formatMathText(replaced);
}

export function parseSeq(s: string, depth = 0): MathNode[] {
  const out: MathNode[] = [];
  if (depth > MAX_DEPTH) { pushText(out, textWithSymbols(s)); return out; }
  let buf = "";
  const flush = () => { if (buf) { pushText(out, textWithSymbols(buf)); buf = ""; } };
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\\") {
      const rest = s.slice(i);
      const frac = /^\\(?:d|t)?frac\s*\{/.exec(rest);
      if (frac) {
        const aOpen = i + frac[0].length - 1;
        const aEnd = closeBrace(s, aOpen);
        if (aEnd > 0 && s[aEnd + 1] === "{") {
          const bEnd = closeBrace(s, aEnd + 1);
          if (bEnd > 0) {
            flush();
            out.push({ kind: "frac", num: parseSeq(s.slice(aOpen + 1, aEnd), depth + 1), den: parseSeq(s.slice(aEnd + 2, bEnd), depth + 1) });
            i = bEnd + 1;
            continue;
          }
        }
      }
      const sq = /^\\sqrt\s*(\[([^\[\]]*)\])?\s*\{/.exec(rest);
      if (sq) {
        const open = i + sq[0].length - 1;
        const end = closeBrace(s, open);
        if (end > 0) {
          flush();
          out.push({ kind: "sqrt", body: parseSeq(s.slice(open + 1, end), depth + 1), index: sq[2] !== undefined ? parseSeq(sq[2], depth + 1) : undefined });
          i = end + 1;
          continue;
        }
      }
      let open = "";
      let wrapped = false;
      let at = i;
      if (rest.startsWith("\\left") && !/[A-Za-z]/.test(s[i + 5] ?? "")) {
        const d = readDelim(s, i + 5);
        let j = d.next;
        while (s[j] === " ") j++;
        if (s.startsWith("\\begin{", j)) { open = d.delim; wrapped = true; at = j; }
      }
      const env = /^\\begin\{([A-Za-z*]+)\}/.exec(s.slice(at));
      if (env) {
        const stop = findEnd(s, at + env[0].length, env[1]!);
        if (stop) {
          let close = "";
          let next = stop.end;
          if (wrapped) {
            let k = stop.end;
            while (s[k] === " ") k++;
            if (s.startsWith("\\right", k)) { const d = readDelim(s, k + 6); close = d.delim; next = d.next; }
          }
          const node = parseEnv(env[1]!.replace("*", ""), s.slice(at + env[0].length, stop.start), depth, open, close);
          if (node) {
            flush();
            out.push(node);
            i = next;
            continue;
          }
        }
      }
    }
    buf += s[i];
    i++;
  }
  flush();
  return out;
}

function parseWithLinear(input: string): MathNode[] {
  const spans = findLinearMatrices(input);
  if (spans.length === 0) return parseSeq(input);
  const out: MathNode[] = [];
  let last = 0;
  for (const sp of spans) {
    if (sp.start < last) continue;
    out.push(...parseSeq(input.slice(last, sp.start)));
    out.push({ kind: "matrix", open: sp.open, close: sp.close, align: "center", rows: sp.rows.map((r) => r.map((c) => trimNodes(parseSeq(c)))) });
    last = sp.end;
  }
  out.push(...parseSeq(input.slice(last)));
  return out;
}

/** Null when there is nothing structural to lay out (caller falls back to plain MathText). */
export function parseMathLayout(input: string): MathNode[] | null {
  if (!hasStructuredMath(input)) return null;
  const nodes = parseWithLinear(input);
  return nodes.some((n) => n.kind !== "text") ? nodes : null;
}

const plain = (nodes: readonly MathNode[]): string => nodes.map(spokenNode).join("");

function spokenNode(n: MathNode): string {
  switch (n.kind) {
    case "text": return n.text;
    case "frac": return ` (${plain(n.num)}) over (${plain(n.den)}) `;
    case "sqrt": return n.index ? ` root ${plain(n.index)} of (${plain(n.body)}) ` : ` square root of (${plain(n.body)}) `;
    case "lines": return n.lines.map(plain).join("; ");
    case "matrix": {
      const kind = n.open === "|" ? "determinant" : n.open === "{" && n.align === "left" ? "cases" : "matrix";
      return ` ${kind} with ${n.rows.length} rows: ` + n.rows.map((r, i) => `row ${i + 1}: ` + r.map(plain).join(", ")).join("; ") + ". ";
    }
  }
}

/** Screen-reader text for a laid-out expression (English structure words; operands keep their own text). */
export function spokenMathLayout(nodes: readonly MathNode[]): string {
  return plain(nodes).replace(/\s+/g, " ").trim();
}
