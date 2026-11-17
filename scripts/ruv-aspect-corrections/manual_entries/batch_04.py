# Batch 04 - scan-candidate review of the remaining 84 candidates (2026-11-17). Scrambled integral/limit layouts compared with
# the rendered pages (contact sheets s10-s13); trims of leaked option-D tails derived from the staged text itself (confirmed=False).
S10, S11, S12, S13 = ('ruv-aspect-staging.evidence/s1%d.png' % n for n in range(4))

# --- calculus layouts (visual) -----------------------------------------------------------------------------------------
fix('-02-p107-q001-p109-n0038', 'math_layout_restored', 'Differential dy/dx was lost from the stem and option C lost its exponent.', shot=S10,
    text='y = x^(y) হলে, (1 – y logx) dy/dx = কত?', c='x^((y–1)/2)')
fix('-02-p107-q004-p109-n0041', 'math_layout_restored', 'Limit under "lim" and the nested exponent were scrambled in stem and explanation.', shot=S10,
    text='lim_(x→0) (1 + ax)^((bx+c)/x) = কত?',
    explanation='lim_(x→0) (1 + ax)^((bx+c)/x) = lim_(x→0) (1 + ax)^(b + c/x) = e^(ac)')
fix('-e08-p096-c1-s07-q003-r1', 'math_layout_restored', 'Limit variable was displaced in stem and explanation.', shot=S10,
    text='lim_(x→0) (a^(x) − 1)/x এর মান কত?',
    explanation='Lt_(x→0) (a^(x) – 1)/x = (a^(x) ln a)/1 = ln a')
fix('all-p089-q004-p096-n0105', 'math_layout_restored', 'Nested exponent x²y was scrambled in the stem (printed question asks dx/dy).', shot=S10,
    text='xe^(x²y) = y cos²x হলে (0,0) বিন্দুতে dx/dy এর মান কত?')
fix('all-p089-q005-p096-n0106', 'math_layout_restored', 'Nested exponents e^(e^x) were flattened in stem, options A/B/D and explanation; option D carried a stray letter.', shot=S10,
    text='∫ e^(x+e^(x)) dx = ?', a='e^(e^(x)) + c', b='e^(x+e^(x)) + c', d='e^(x²) + c',
    explanation='∫e^(x + e^(x)) dx = ∫e^(e^(x)) e^(x) dx = e^(e^(x)) + c')
fix('-e06-p072-c0-s03-q073-r1', 'math_layout_restored', 'Square roots were lost in stem and options; the first explanation words leaked into option D.', shot=S11,
    text='∫ e^(√x)/√x dx = কত?', a='2e^(√x) + c', b='e^(√x) + c', c='1/2 e^(√x) + c', d='e^(√x/2) + c')
fix('-e06-p072-c0-s03-q073-r1', 'math_layout_restored', 'Explanation rebuilt from the printed first step (z = √x, dz = dx/(2√x)); the closing steps were derived, not copied.', confirmed=False, shot=S11,
    explanation='ধরি, √x = z ∴ dx/(2√x) = dz ⇒ dx/√x = 2dz; ∴ ∫ e^(√x)/√x dx = 2∫e^(z) dz = 2e^(z) + c = 2e^(√x) + c')
fix('all-p067-q077-p077-n0116', 'math_layout_restored', 'Limit expression was scrambled in the stem and explanation.', shot=S11,
    text='lim_(x→0) (e^(x) − 1)/x এর মান কত?',
    explanation='lim_(x→0) (e^(x) − 1)/x = lim_(x→0) (e^(x) − 0)/1 [L′hospital rule’s] = e⁰ = 1')
fix('-e07-p084-c0-s03-q077-r1', 'math_layout_restored', 'Integral sign and braces were lost from the stem.', shot=S11,
    text='∫ e^(x){1/(1 − x) + 1/((1 − x)²)} dx = কত?')
fix('all-p067-q072-p087-n0233', 'math_layout_restored', 'Nested square roots were scrambled in stem and all four options.', shot=S11,
    text='√(e^(√x)) এর অন্তরজ নিচের কোনটি?',
    a='−1/(2√(e^(√x)))', b='−(e^(√x))/√(x e^(√x))', c='(e^(√x))/(2√(x e^(√x)))', d='(e^(√x))/(4√(x e^(√x)))')
fix('all-p067-q072-p087-n0233', 'math_layout_restored', 'Explanation was unreadable; only its first term d/dx(√(e^√x)) is printed legibly. Steps below were derived so that they reach the printed option D.', confirmed=False, shot=S11,
    explanation='d/dx(√(e^(√x))) = d/dx(e^(√x/2)) = e^(√x/2) × 1/2 × 1/(2√x) = e^(√x/2)/(4√x) = (e^(√x))/(4√(x e^(√x)))')
fix('-e07-p088-c0-s05-q073-r1', 'math_layout_restored', 'Integral sign and numerator layout were lost from the stem.', shot=S11,
    text='∫ xe^(x)/((1 + x)³) dx = কত?')
fix('-e04-p050-c0-s03-q073-r1', 'math_layout_restored', 'Limit was scrambled. The square on tan is clipped in the page crop; tan²x is taken from the printed explanation (tan²x/x² × (e^x−1)/x) and is required for the printed answer 1.', confirmed=False, shot=S12,
    text='lim_(x→0) ((e^(x) − 1) tan²x)/x³ = কত?')
fix('-e04-p054-c0-s05-q064-r1', 'math_layout_restored', 'Integral layout was scrambled; arctan inverse signs were lost in options A/C/D and the next heading leaked into option B.', shot=S12,
    text='∫ dx/(1 + 3cos²x) = কত?',
    a='1/2 tan⁻¹(tan x/2) + c', b='tan⁻¹(e^(x)) + c', c='2 tan⁻¹(tan x/2) + c', d='1/3 tan⁻¹(tan x/2) + c')
fix('-e05-p061-c1-s03-q070-r1', 'math_layout_restored', 'Square roots and limit variable were scrambled in the stem.', shot=S12,
    text='lim_(x→0) (√(1 + 2x) − √(1 − 3x))/x = কত?')
fix('set-p023-q059-p031-n0102', 'math_layout_restored', 'Nested exponent e^(2x) was flattened in stem and options A/C/D; option D carried a stray fragment.', shot=S12,
    text='∫ e^(2x + e^(2x)) dx এর মান কোনটি?', a='2e^(e^(2x)) + c', c='1/2 e^(2x) + c', d='1/2 e^(e^(2x)) + c')
fix('-e01-p021-c1-s05-q068-r1', 'math_layout_restored', 'Integral sign was lost from the stem.', shot=S13,
    text='∫ dx/(e^(x) + e^(–x)) = ?')
fix('all-p067-q003-p067-n0003', 'math_layout_restored', 'Stray backtick in option C exponent; explanation carried stray fragments.', shot=S13,
    c='2.78 × 10³ ms⁻²',
    explanation='a = ω²r = (2π/T)² × r = (2π/(27×24×3600))² × 3.84 × 10⁸ = 2.78 × 10⁻² ms⁻²')
fix('odd-p145-q014-p147-n0033', 'reaction_arrow_restored', 'Reaction arrow reagent H₂O₂ was split into stray superscripts in stem and explanation.', shot=S13,
    text='CH₃CH=CH₂ + HBr ―H₂O₂→',
    explanation=base('odd-p145-q014-p147-n0033', 'explanation').replace('―^(H)― →^(2O)―²', '―H₂O₂→'))

# --- figure fragments in stems (figure crop exists in figure-manifest) --------------------------------------------------
fix('-e02-p024-c0-s01-q015-r1', 'figure_fragments_removed', 'Circuit labels (Rp, R2, R3, 5V, Fig-1, Fig-2) leaked into the stem; the circuit is in the existing figure crop.', confirmed=False,
    text='চিত্রে প্রদর্শিত বর্তনীতে R₃ এর দুই প্রান্তের বিভব পার্থক্য-')
fix('set-p033-q009-p033-n0009', 'figure_fragments_removed', 'Resistor labels leaked into the stem; the circuit is in the existing figure crop.', confirmed=False,
    text='চিত্রের বর্তনীর P ও Q বিন্দুর মধ্যে তুল্যরোধ-')
fix('set-p023-q030-p025-n0028', 'structure_restored', 'Structural-formula branches (| | OH CHO) leaked into the stem; rewritten as a condensed formula in the printed order (OH on the first CH, CHO on the second).', confirmed=False,
    text='CH₃−CH(OH)−CH(CHO)−CH₃ যৌগটির IUPAC নাম কোনটি?')

# --- leaked tails in option D: trims derived from the staged text (the tail is explanation/heading text) ---------------------
TRIM = 'The tail of option D is leaked explanation/heading text from the printed answer line; only the first token is the option.'
fix('noset-p001-q040-p003-n0040', 'option_boundary_trim', TRIM, confirmed=False, d='উইলিয়ামসনের সংশ্লেষণ')
fix('noset-p033-q019-p034-n0019', 'option_boundary_trim', TRIM, confirmed=False, d='63Y')
fix('noset-p033-q070-p043-n0113', 'option_boundary_trim', TRIM, confirmed=False, d='0')
fix('c-all-p044-q040-p046-n0039', 'option_boundary_trim', TRIM, confirmed=False, d='কোনটিই নয়')
fix('c-all-p044-q043-p047-n0042', 'option_boundary_trim', TRIM, confirmed=False, d='C₂Cl₄')
fix('c-all-p044-q045-p047-n0044', 'option_boundary_trim', TRIM, confirmed=False, d='5s')
fix('c-all-p044-q037-p058-n0161', 'option_boundary_trim', TRIM, confirmed=False, d='8')
