# Batch 01 - the two named cases, the logic-circuit family and the first vector group.
# Every entry below was compared against the rendered source page (ruv-work/png) in this review session.
S1 = 'ruv-aspect-staging.evidence/s05.png / s06.png'

# --- EM-wave direction question (set 2024-25 A, p.12 Q5): printed marker C = E x B ---------------------------------------
fix('q005-p012-n0005', 'vector_notation_restored',
    'Vector arrows over E and B were lost in extraction (stray arrow runs in the stem, bare letters in the options) and the first explanation line leaked into option D.',
    shot=S1,
    text='তড়িৎচুম্বকীয় তরঙ্গ নিচের কোন দিকে বরাবর অগ্রসর হয়?',
    a=V('E'), b=V('B'), c=V('E') + ' × ' + V('B'), d=V('E') + '.' + V('B'),
    explanation='তড়িৎ চুম্বকীয় তরঙ্গের বৈশিষ্ট্য: তড়িৎ চুম্বকীয় তরঙ্গ তড়িৎ ক্ষেত্র ' + V('E') + ' ও চৌম্বক ক্ষেত্র ' + V('B') +
                ' এর পর্যাবৃত্ত পরিবর্তনের ফলে উৎপন্ন হয়। তরঙ্গ সঞ্চালনের অভিমুখ ' + V('E') + ' ও ' + V('B') +
                ' উভয়ের উপর লম্ব। তাই তড়িৎ চুম্বকীয় তরঙ্গ আড় তরঙ্গ। শূন্য মাধ্যমে তরঙ্গের বেগ 3 × 10⁸ ms⁻¹')
decide('q005-p012-n0005', 'corrected', 'Printed marker is C (E⃗ × B⃗); the stored answer c is correct. Previous key b was a result of the lost notation.')

# --- logic circuits (the figure holds A and B; stems must not carry figure fragments) -----------------------------------
fix('q001-p055-n0125', 'overbar_notation_restored',
    'Overbars were lost in extraction so options a/c and b/d were identical pairs. Stem carried figure fragments.',
    shot=S1,
    text='চিত্রে প্রদর্শিত বর্তনীর আউটপুট কোনটি হবে?',
    c=O('AB'), d=O('A') + ' + ' + O('B'),
    explanation='এটি হলো AND Gate: F₁ = A . B। এটি হলো NOT gate: ∴ A = ' + O('F') + '₁ = ' + O('AB') + ' বিকল্প: AND + NOT = NAND ∴ F = ' + O('AB'))
decide('q001-p055-n0125', 'corrected',
       'Figure (AND followed by NOT = NAND) confirms printed key C = AB̅. Option D (A̅ + B̅) is logically equivalent by De Morgan; the source prints C as correct and the printed key is kept as is.')

fix('q009-p089-n0008', 'overbar_notation_restored',
    'Overbars were lost in extraction (options b/a identical, d/c nearly identical); stem carried figure fragments.',
    shot=S1,
    text='লজিক বর্তনীতে আউটপুট?',
    b=O('AB'), d=O('A + B'),
    explanation=O('AB') + ' + ' + O('AB') + ' = ' + O('AB'))
decide('q009-p089-n0008', 'corrected', 'Printed marker B (AB̅) matches the stored key.')

fix('q055-p060-n0178', 'overbar_notation_restored',
    'Overbars were lost in extraction (options a/d identical); stem carried figure fragments; explanation was garbled with truth-table fragments.',
    shot=S1,
    text='ডানে প্রদর্শিত বর্তনীটির আউটপুট কত?',
    a=O('A ⊕ B'), b=O('A') + 'B + A' + O('B'), c=O('A') + 'B ⊕ A' + O('B'), d='A ⊕ B',
    explanation='XNOR gate: X = ' + O('A ⊕ B') + ' সত্যক সারণি: (A, B) = (0, 0) → 1; (0, 1) → 0; (1, 0) → 0; (1, 1) → 1')
decide('q055-p060-n0178', 'corrected', 'Figure is an XNOR gate; printed marker A (A⊕B with overbar) matches the stored key.')

fix('q023-p068-n0023', 'overbar_notation_restored',
    'Overbars were lost in extraction (options a/b/c/d identical in appearance); stem and explanation carried figure fragments.',
    shot=S1,
    text='লজিক বর্তনীটির আউটপুট x-এর জন্য কোনটি সঠিক?',
    a='(AB)' + O('A'), b='(' + O('AB') + ')' + O('B'),
    explanation='x = ((AB)′ + A′)′ = ((AB)′)′ · (A′)′ [ডি-মরগান সূত্র অনুসারে] = AB . A = AB (′ চিহ্ন complement বোঝায়)')
decide('q023-p068-n0023', 'corrected', 'Printed marker C (AB) matches the stored key. Explanation re-typed with prime notation for the nested complements (printed with stacked overbars).')

# --- vector group ------------------------------------------------------------------------------------------------------
fix('q011-p145-n0011', 'vector_notation_restored',
    'Vector arrows were lost; stray arrow glyphs were appended to option D.',
    shot=S1,
    text=V('A') + ' ও ' + V('B') + ' দু’টি ভেক্টর হলে, (' + V('A') + ' × ' + V('B') + ') + (' + V('B') + ' × ' + V('A') + ') = ?',
    d='2AB',
    explanation='(' + V('A') + ' × ' + V('B') + ') + (' + V('B') + ' × ' + V('A') + ') = AB sinθ – AB sinθ = 0')

fix('q015-p132-n0015', 'vector_notation_restored',
    'Vector arrows and unit-vector hats were lost; stray glyph runs were appended to option D.',
    shot=S1,
    text='যদি ' + V('A') + ' = 6' + H('i') + ' − 3' + H('j') + ' + 2' + H('k') + ' এবং ' + V('B') + ' = 2' + H('i') + ' + 2' + H('j') + ' + ' + H('k') + ' হয় তবে ' + V('A') + '.' + V('B') + ' কত?',
    d='8',
    explanation=V('A') + '.' + V('B') + ' = (6' + H('i') + ' – 3' + H('j') + ' + 2' + H('k') + ').(2' + H('i') + ' + 2' + H('j') + ' + ' + H('k') + ') = 12 – 6 + 2 = 8')

DB = 'dB' + '\u20d7'
fix('q014-p098-n0014', 'vector_notation_restored',
    'Vector arrows were lost; the vector-cross-product notation had decayed into a spurious minus sign in options a and b and stray arrows in the stem and option b.',
    shot=S1,
    text='বায়োট-স্যার্ভার্ট সূত্রটি নিচের কোন সমীকরণ দ্বারা প্রকাশ করা হয়?',
    a=DB + ' = μ₀/4π (I d' + V('l') + ' × ' + V('r') + ')/r³',
    b=DB + ' = μ₀/4π (I d' + V('l') + ' × ' + V('r') + ' sinθ)/r³',
    c=DB + ' = μ₀/4π (I d' + V('l') + ' × ' + V('r') + ')/r²',
    d=DB + ' = μ₀/4π (I d' + V('l') + ')/r²',
    explanation=DB + ' = μ₀/4π (I d' + V('l') + ' × ' + V('r') + ')/r³ = μ₀/4π (I d' + V('l') + ' × ' + H('r') + ')/r²')

VR = V('V') + '_(R)'
fix('q002-p067-n0002', 'vector_notation_restored',
    'Vector arrows over V were lost and stray arrow runs were appended to the stem and options.',
    shot=S1,
    text='B এর সাপেক্ষে A কণার আপেক্ষিক বেগের সঠিক সূত্র কোনটি?',
    a=VR + ' = ' + V('V') + '_(A) − ' + V('V') + '_(B)', b=VR + ' = ' + V('V') + '_(A) + ' + V('V') + '_(B)',
    c=VR + ' = ' + V('V') + '_(A) × ' + V('V') + '_(B)', d=VR + ' = ' + V('V') + '_(B) − ' + V('V') + '_(A)',
    explanation=V('B') + ' এর সাপেক্ষে ' + V('A') + ' এর আপেক্ষিক বেগ: ' + V('V') + '_(AB) = ' + V('V') + '_(A) − ' + V('V') + '_(B)')

fix('c1-s01-q014-r1', 'vector_notation_restored',
    'Figure-based options a-c (three vector diagrams) were stored as arrow fragments; vector arrows lost in stem and explanation. The diagrams are in the existing figure crop.',
    shot=S1,
    text=V('A') + ' + ' + V('B') + ' + ' + V('C') + ' = 0 ভেক্টরত্রয়ের সম্পর্কটিকে কোন চিত্রটি প্রকাশ করে?',
    a='চিত্র A', b='চিত্র B', c='চিত্র C', d='কোনটিই নয়',
    explanation='ভেক্টর দিক যদি একই দিকে হয় তখন তাদের যোগফল শূন্য, ' + V('A') + ' + ' + V('B') + ' + ' + V('C') + ' = 0।')

decide('q006-p089-n0005', 'false_positive', 'Options clean; "PV^(γ)" is the app power notation and the explanation naturally restates option a.')
