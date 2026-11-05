import test from "node:test";
import assert from "node:assert/strict";
import { formatMathText as f, hasMathMarkup, parseMathText, spokenMathText } from "../src/services/mathText.ts";

test("positive and negative powers, including units", () => {
  assert.equal(f("10^23"), "10²³");
  assert.equal(f("10^-7"), "10⁻⁷");
  assert.equal(f("30 ms^-1"), "30 ms⁻¹");
  assert.equal(f("gL^-1"), "gL⁻¹");
  assert.equal(f("m^3"), "m³");
  assert.equal(f("MeV/C^2"), "MeV/C²");
  assert.equal(f("ms^−1"), "ms⁻¹", "unicode minus is accepted");
  assert.equal(f("tan^-1(1/2)"), "tan⁻¹(1/2)");
  assert.equal(f("x^2)"), "x²)");
  assert.equal(f("1s^2 2s^2 2p^6"), "1s² 2s² 2p⁶");
  assert.equal(f("sp^3d^2"), "sp³d²");
});

test("braced and parenthesised exponents", () => {
  assert.equal(f("10^{-8}"), "10⁻⁸");
  assert.equal(f("x^{2}+4"), "x²+4");
  assert.equal(f("e^(2x)"), "e²ˣ");
  assert.equal(f("e^(-x)"), "e⁻ˣ");
  assert.equal(f("e^-x)"), "e⁻ˣ)");
  assert.equal(f("3^x হয়"), "3ˣ হয়");
  assert.equal(f("\\mathrm{ms}^{-1}"), "ms⁻¹");
  assert.equal(f("\\(120^\\circ\\)"), "120°");
});

test("chemical ionic charges", () => {
  assert.equal(f("Cu^2+ এ জারিত"), "Cu²⁺ এ জারিত");
  assert.equal(f("O^2-"), "O²⁻");
  assert.equal(f("H^+"), "H⁺");
  assert.equal(f("Cl^-"), "Cl⁻");
  assert.equal(f("NH4^+"), "NH4⁺");
  assert.equal(f("Fe^3+ ও Zn^2+"), "Fe³⁺ ও Zn²⁺");
  assert.equal(f("K2[Fe(CN)6]^-2"), "K2[Fe(CN)6]⁻²");
  assert.equal(f("e^−"), "e⁻");
  const charge = parseMathText("Cu^2+ ").find((x) => x.kind === "sup");
  assert.equal(charge?.kind === "sup" && charge.charge, true);
});

test("scientific notation", () => {
  assert.equal(f("5.85 × 10^23"), "5.85 × 10²³");
  assert.equal(f("1.66×10^-27"), "1.66×10⁻²⁷");
  assert.equal(f("\\(6.02 \\times 10^{23}\\)"), "6.02 × 10²³");
});

test("a following operator is not swallowed into a power or a charge", () => {
  assert.equal(f("x^2+4"), "x²+4");
  assert.equal(f("y^2+y"), "y²+y");
  assert.equal(f("4x^2-9"), "4x²-9");
});

test("vectors: unit-vector hats and LaTeX hats", () => {
  assert.equal(f("2i^ + 3j^ - k^"), "2î + 3ĵ - k\u0302");
  assert.equal(f("i^+k^ এবং"), "î+k\u0302 এবং");
  assert.equal(f("7i^ -6i^ +5k^)"), "7î -6î +5k\u0302)");
  assert.equal(f("\\hat{i} - 3"), "î - 3");
  assert.equal(f("i^2"), "i²", "a digit after i^ is a power, not a hat");
  assert.equal(f("\\vec{P}"), "\\vec{P}", "unsupported vector arrows are left as written");
});

test("permutation, combination and nuclide notation", () => {
  assert.equal(f("^nP_r"), "ⁿPᵣ");
  assert.equal(f("সূত্র ^nC_r এর"), "সূত্র ⁿCᵣ এর");
  assert.equal(f("^12C_3"), "¹²C₃");
  assert.equal(f("^{2n}C_m"), "²ⁿCₘ");
  assert.equal(f("^85_37Rb"), "⁸⁵₃₇Rb");
  assert.equal(f("^{64}_{28}Ni"), "⁶⁴₂₈Ni");
  assert.equal(f("^15N"), "¹⁵N");
  assert.equal(f("H_2O"), "H₂O");
  assert.equal(f("∑_{r=1}^{n}"), "∑ᵣ₌₁ⁿ");
});

test("Bangla text containing mathematical notation", () => {
  assert.equal(f("তাপমাত্রা 10^-7 mol/L হলে pH কত?"), "তাপমাত্রা 10⁻⁷ mol/L হলে pH কত?");
  assert.equal(f("বেগ 30 ms^-1 হলে"), "বেগ 30 ms⁻¹ হলে");
  assert.equal(f("x^2এর মান"), "x²এর মান");
});

test("a caret inside a Bangla word is a transcription artefact and is preserved", () => {
  assert.equal(f("অবাত শ^সন"), "অবাত শ^সন");
  assert.equal(f("শে^ত রক্তকণিকা"), "শে^ত রক্তকণিকা");
});

test("ambiguous or unsupported patterns degrade to the original text", () => {
  assert.equal(f("PV^γ-1 = ধ্রুব"), "PV^γ-1 = ধ্রুব");
  assert.equal(f("∫ 3^bx dx"), "∫ 3^bx dx");
  assert.equal(f("P^ka=4.8"), "P^ka=4.8");
  assert.equal(f("(x)^{2/3}"), "(x)^{2/3}");
  assert.equal(f("∫_0^√3 dx"), "∫₀^√3 dx");
  assert.equal(f("x^2.5"), "x²" + ".5", "digits only: the decimal point is ordinary text");
  assert.equal(f("e^(x^2)"), "e^(x²)", "a nested power is not flattened into one exponent; the outer caret stays visible");
  assert.equal(f("a ^ b"), "a ^ b");
  assert.equal(f("x^{unclosed"), "x^{unclosed");
  assert.equal(f("2^"), "2^");
});

test("ordinary text and punctuation are untouched", () => {
  const plain = "Which is correct? (a) 2 + 2 = 4; snake_case_name & ‘quoted’ — “text”.";
  assert.equal(f(plain), plain);
  assert.equal(f("file_name_final"), "file_name_final");
  assert.equal(f("log_axdx"), "log_axdx");
  assert.equal(hasMathMarkup("plain text"), false);
  assert.equal(f("সাধারণ বাংলা প্রশ্ন"), "সাধারণ বাংলা প্রশ্ন");
});

test("simple LaTeX fractions become readable text", () => {
  assert.equal(f("\\frac{224}{3^{8}}"), "224/3⁸");
  assert.equal(f("\\frac{y^2}{25}"), "y²/25");
});

test("screen-reader text spells out powers, charges, subscripts and hats", () => {
  assert.equal(spokenMathText("10^-7", "en"), "10 to the power of minus 7");
  assert.equal(spokenMathText("Cu^2+ ion", "en"), "Cu with charge 2 plus ion");
  assert.equal(spokenMathText("^nP_r", "en"), "superscript n P subscript r");
  assert.equal(spokenMathText("2i^ + 3j^", "en"), "2 i hat + 3 j hat");
  assert.equal(spokenMathText("m^3", "bn"), "m ঘাত 3");
  assert.equal(spokenMathText("No math here", "en"), "No math here");
  assert.equal(spokenMathText("PV^γ-1", "en"), "PV^γ-1", "unsupported patterns are read as written");
});

test("display text never loses information: segments reassemble to the normalised source", () => {
  for (const sample of ["Cu^2+ ও 10^-7", "^nP_r", "x^2+4", "শ^সন", "∫_0^4 x^2 dx"]) {
    const rejoined = parseMathText(sample).map((x) => x.source).join("");
    assert.equal(rejoined, sample);
  }
});
