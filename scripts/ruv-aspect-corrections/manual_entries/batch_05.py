# Batch 05 - duplicate-option / replacement-character records among the flagged set (compared with contact sheets s14-s17).
# Most duplicates are lost radical signs (sqrt). Printed answer markers are NEVER changed here; contradictions stay unresolved.
S14, S15, S16, S17 = ('ruv-aspect-staging.evidence/s1%d.png' % n for n in range(4, 8))
RAD = 'Radical signs/exponents were lost in extraction so distinct options became identical text.'

fix('p150-q040-p152-n0040', 'isotope_notation_restored', 'Mass/atomic numbers of He were lost, so all four options read "He".', shot=S14,
    text='আলফা (α) কণা হলো –', a='³₂He', b='⁴₂He', c='³₁He', d='²₁He')
fix('p156-c0-s05-q020-r1', 'radical_restored', RAD, shot=S14,
    text='1 + 1/4 + (1.3)/(4.8) + (1.3.5)/(4.8.12) + ....... ∞ ধারাটির যোগফল কত?', a='2/√3', b='√3/2', c='√2', d='2√2')
fix('p126-q004-p130-n0063', 'radical_restored', RAD, shot=S14, c='log √2 + 1', d='log √2 − 1')
fix('p126-q004-p130-n0063', 'math_layout_restored', 'Integral limits and fraction were scrambled in the stem. The numerator top is clipped in the crop; 1 + x + x² is the only numerator that gives the printed answer (log√2 + 1).', confirmed=False, shot=S14,
    text='∫₀¹ (1 + x + x²)/(1 + x²) dx = কত?')
fix('p140-c0-s00-q007-r1', 'radical_restored', RAD + ' The radical in option D covers only the 3 in print.', shot=S14, a='√R', b='√(6R)', c='√(3R)', d='√3 R')
decide('p140-c0-s00-q007-r1', 'unresolved', 'Printed marker is D (√3 R, radical over the 3 only) but the printed working gives RMS = √(3R × 32/32) = √(3R), which is option C. The printed key is kept; the item is held as browse-only until the source is checked.', flag='source_inconsistency_unresolved')
fix('p103-c0-s08-q002-r1', 'radical_restored', RAD, shot=S14, text='lim_(x→0) (1 − cosx)/x² এর মান হবে–', b='1/√2')
fix('p089-q007-p089-n0006', 'radical_restored', RAD, shot=S15, a='√2 T', d='1/√2 T')
fix('p089-q007-p093-n0061', 'matrix_notation_restored', 'Matrices were flattened into loose numbers, so options were identical or contained leaked digits. Matrices are written row by row.', shot=S15,
    text='A = [[2, 1], [4, 3]] হলে A⁻¹ = ?',
    a='1/2 [[3, 1], [−4, 2]]', b='1/2 [[2, −1], [−4, 3]]', c='1/2 [[3, −1], [−4, 2]]', d='[[3, −1], [−4, 2]]')
fix('p067-q076-p072-n0072', 'radical_restored', RAD, shot=S15, d='± √19')
fix('p067-q007-p078-n0126', 'radical_restored', RAD, shot=S15, b='√8', d='√2')
fix('p067-q065-p087-n0226', 'radical_restored', RAD, shot=S15, c='√15')
decide('p067-q065-p087-n0226', 'unresolved', 'Printed marker is C (√15) but the printed working gives c = 25, which is option B. The printed key is kept; the item is held as browse-only until the source is checked.', flag='source_inconsistency_unresolved')
fix('p044-q071-p049-n0070', 'radical_restored', RAD, shot=S16, a='√3/2', b='√(3/2)', c='√(2/3)')
fix('p044-q073-p055-n0118', 'matrix_notation_restored', 'Matrices were flattened into loose numbers; options were identical. Matrices are written row by row.', shot=S16,
    text='A = [[2, 3], [1, 3]] এর বিপরীত ম্যাট্রিক্স কোনটি?',
    a='1/3 [[3, −3], [−1, 2]]', b='1/3 [[3, −1], [−3, 2]]', c='1/3 [[−3, 3], [1, −2]]', d='1/3 [[3, −1], [3, −2]]')
fix('p065-c1-s05-q067-r1', 'radical_restored', 'Exponents in the stem and radicals in options B/C were lost.', shot=S16,
    text='x²/a² + y²/b² = 1 উপবৃত্তের উপকেন্দ্রিক লম্ব উপবৃত্তটির বৃহৎ অক্ষের অর্ধেক এবং a > b হলে, তার উৎকেন্দ্রিকতা কত?', b='1/√3', c='1/√2')
fix('p043-c1-s05-q074-r1', 'radical_restored', 'Exponent in the stem and radicals in the options were lost.', shot=S16,
    text='y²/2 − x² = 1 অধিবৃত্তের উৎকেন্দ্রিকতা কোনটি?', a='√(3/2)', b='3/√2', c='√3/2', d='± √3')
decide('p012-q011-p012-n0011', 'flag_not_applicable', 'Options B and C differ only by case (printed L = wire length vs l = extension); the duplicate-option flag compared lower-cased text.', flag='duplicate_option_text')
fix('p012-q071-p017-n0071', 'radical_restored', RAD, shot=S17, c='√24', d='√34')
fix('p131-q006-p134-n0054', 'replacement_char_replaced', 'U+FFFD stood in for the printed bullet glyph in the explanation; bullets are restored as •.', confirmed=False, shot=S17,
    explanation=base('p131-q006-p134-n0054', 'explanation').replace('\ufffd', '•'))
fix('p044-q030-p057-n0154', 'radical_dot_restored', 'The radical dot (•) after each carbon was lost in the options, and U+FFFD stood in for bullets in the explanation.', shot=S17,
    a='R₃C• > R₂HC• > RH₂C• > H₃C•', b='H₃C• > RH₂C• > R₂HC• > R₃C•', c='R₃C• > H₃C• > RH₂C• > R₂HC•', d='H₃C• > R₃C• > R₂HC• > RH₂C•')
fix('p044-q030-p057-n0154', 'replacement_char_replaced', 'U+FFFD in the explanation replaced by the bullet glyph •.', confirmed=False, shot=S17,
    explanation=base('p044-q030-p057-n0154', 'explanation').replace('\ufffd', '•'))
