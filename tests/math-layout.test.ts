import test from "node:test";
import assert from "node:assert/strict";
import { hasStructuredMath, parseMathLayout, spokenMathLayout, type MathNode } from "../src/services/mathLayout.ts";

const kinds = (n: MathNode[] | null) => (n ?? []).map((x) => x.kind);
const textOf = (n: MathNode[]): string => n.map((x) => (x.kind === "text" ? x.text : `<${x.kind}>`)).join("");

test("plain text and unicode-only math have no structure (legacy MathText path stays in charge)", () => {
  for (const s of ["x^2 + 3x", "∫₀⁵ f(x)dx = 8 হলে", "|x| < 3", "(a, b) এবং (c, d)", "[Cu(NH3)4]^2+"]) {
    assert.equal(parseMathLayout(s), null, s);
  }
});

test("real RU Lokkho fractions, sums and nesting", () => {
  const n = parseMathLayout("x 3 - px 2 + qx - r = 0 এই সমীকরণের মূলগুলি a, b, c হলে \\( \\sum \\frac{1}{a^{2}} \\) =কত?")!;
  assert.deepEqual(kinds(n), ["text", "frac", "text"]);
  const frac = n[1] as Extract<MathNode, { kind: "frac" }>;
  assert.equal(textOf(frac.num), "1");
  assert.equal(textOf(frac.den), "a²");
  assert.ok(textOf(n).startsWith("x 3 - px 2"), "stored words are left alone");
  const nested = parseMathLayout("\\log{\\left ( \\frac{x - 3}{x - 2} \\right )} + \\frac{1}{\\frac{a}{b}}")!;
  assert.ok(nested.some((x) => x.kind === "frac"));
  const outer = nested.find((x) => x.kind === "frac" && x.den.some((d) => d.kind === "frac"));
  assert.ok(outer, "fraction inside a fraction is kept");
});

test("square roots with and without an index; malformed input degrades to text", () => {
  const a = parseMathLayout("\\sqrt{x+1} + \\sqrt[3]{8}")!;
  assert.deepEqual(kinds(a), ["sqrt", "text", "sqrt"]);
  assert.equal(textOf((a[2] as Extract<MathNode, { kind: "sqrt" }>).index!), "3");
  assert.equal(parseMathLayout("\\frac{1}{"), null);
  assert.equal(parseMathLayout("\\sqrt{x"), null);
});

test("matrix environments, brackets and \\left/\\right wrappers from real RU packs", () => {
  const m = parseMathLayout("যদি \\( A = \\left [ \\begin{matrix} 1 & 1 \\\\ 0 & 1 \\end{matrix} \\right ] \\) হয়, তবে A 5 = ?")!;
  const mat = m.find((x) => x.kind === "matrix") as Extract<MathNode, { kind: "matrix" }>;
  assert.equal(mat.open, "[");
  assert.equal(mat.close, "]");
  assert.equal(mat.rows.length, 2);
  assert.equal(mat.rows[0]!.length, 2);
  assert.equal(textOf(mat.rows[1]![0]!), "0");
  assert.ok(textOf(m).includes("তবে A 5"), "Bangla text around the matrix is untouched");
});

test("determinant (array + |..|), piecewise cases, and several matrices in one string", () => {
  const d = parseMathLayout("\\( \\left|\\begin{array}{ccc}26 & 6 & 11 \\\\ 36 & 5 & 26 \\\\ 63 & 13 & 37\\end{array}\\right| \\)")!;
  const det = d.find((x) => x.kind === "matrix") as Extract<MathNode, { kind: "matrix" }>;
  assert.equal(det.open, "|");
  assert.equal(det.rows.length, 3);
  assert.equal(det.rows[2]!.length, 3);
  assert.match(spokenMathLayout(d), /determinant with 3 rows/);
  const c = parseMathLayout("f(x)= \\( \\left \\lbrace \\begin{matrix} x^{2} - 3 x & w h e n & x \\ge 2 \\\\ x + 2 & w h e n & x < 2 \\end{matrix} \\right . \\)")!;
  const cases = c.find((x) => x.kind === "matrix") as Extract<MathNode, { kind: "matrix" }>;
  assert.equal(cases.open, "{");
  assert.equal(cases.close, "");
  assert.equal(textOf(cases.rows[0]![2]!), "x ≥ 2");
  const two = parseMathLayout("\\( \\mathrm{A}=\\left[\\begin{array}{l}1 \\\\ 6\\end{array}\\right], \\mathrm{B}=\\left[\\begin{array}{ll}2 & 3\\end{array}\\right] \\)")!;
  assert.equal(two.filter((x) => x.kind === "matrix").length, 2);
});

test("aligned multi-line blocks", () => {
  const n = parseMathLayout("\\begin{aligned} x + y &= 5 \\\\ x - y &= 1 \\end{aligned}")!;
  assert.equal(n[0]!.kind, "lines");
  assert.equal((n[0] as Extract<MathNode, { kind: "lines" }>).lines.length, 2);
});

test("linearised determinants and matrices exactly as printed in JU/DU packs", () => {
  const ju = parseMathLayout("নির্ণায়ক |1, a, b + c; 1, b, c + a; 1, c, a + b| এর মান কোনটি?")!;
  const mat = ju.find((x) => x.kind === "matrix") as Extract<MathNode, { kind: "matrix" }>;
  assert.equal(mat.open, "|");
  assert.equal(mat.rows.length, 3);
  assert.equal(textOf(mat.rows[0]![2]!), "b + c");
  assert.ok(textOf(ju).startsWith("নির্ণায়ক "));
  assert.ok(textOf(ju).endsWith(" এর মান কোনটি?"));
  assert.equal(hasStructuredMath("A = [1, 2; 3, 4]"), true);
  assert.equal(hasStructuredMath("(x, y; z)"), false, "ragged rows are not a matrix");
  assert.equal(hasStructuredMath("সেট (1, 2) ; (3, 4)"), false, "semicolon outside brackets is prose");
});

test("a runaway or hostile string stays bounded", () => {
  const deep = "\\frac{1}{".repeat(50) + "x" + "}".repeat(50);
  assert.ok(parseMathLayout(deep) !== null);
  const wide = "\\begin{matrix}" + Array.from({ length: 500 }, () => "1 & 2").join(" \\\\ ") + "\\end{matrix}";
  assert.equal(parseMathLayout(wide), null);
});

test("labelled note-style groups are prose, not matrices; real JU matrix questions are", () => {
  assert.equal(parseMathLayout("প্রশ্নবোধক স্থানের সংখ্যাটি কত? (ছক: 12, 28, 16; 22, 46, 24; 10, ?, 8)"), null);
  const ju = parseMathLayout("যদি |β − 2, 1; −5, β + 4| = 0 হলে, β এর মান কোনটি?")!;
  assert.equal(ju.filter((x) => x.kind === "matrix").length, 1);
  const prod = parseMathLayout("P = [2, 1] এবং Q = [1, -2, 0; 4, 5, -3] হলে PQ এর মান কত?")!;
  assert.equal(prod.filter((x) => x.kind === "matrix").length, 1, "a one-row [2, 1] stays plain text; only the 2x3 is a grid");
  assert.equal(parseMathLayout("[-19, -6; 23, -3]")!.length, 1, "option text that is only a matrix");
});
