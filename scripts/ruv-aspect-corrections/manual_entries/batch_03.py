# Batch 03 - vector / limit / integral layouts (compared with rendered pages s09).
S3 = 'ruv-aspect-staging.evidence/s09.png'
i, j, k = H('i'), H('j'), H('k')
NAB = '∇\u20d7'

fix('q001-p023-n0001', 'vector_notation_restored', 'Vector arrows over F and nabla were lost; stray arrow runs were appended to the stem.', shot=S3,
    text='একটি ভেক্টর ' + V('F') + ' অঘূর্ণনশীল হয়, যদি–',
    a=NAB + ' × ' + V('F') + ' ≠ 0', b=NAB + ' . ' + V('F') + ' ≠ 0', c=NAB + ' × ' + V('F') + ' = 0', d=NAB + ' . ' + V('F') + ' = 0',
    explanation='ভেক্টর রাশির কার্ল শূন্য হলে, সেটি অঘূর্ণনশীল ও সংরক্ষণশীল। অর্থাৎ, ' + NAB + ' × ' + V('F') + ' = 0 হলে ভেক্টরটি অঘূর্ণনশীল।')

fix('p024-c1-s01-q023-r1', 'vector_notation_restored', 'Vector arrows and the magnitude bars were scrambled in stem and explanation.', shot=S3,
    text=V('P') + ' ও ' + V('Q') + ' এর মধ্যবর্তী কোণ β হলে (' + V('P') + ' . ' + V('Q') + ')/|' + V('P') + ' × ' + V('Q') + '| এর মান কত?',
    explanation='(' + V('P') + ' . ' + V('Q') + ')/|' + V('P') + ' × ' + V('Q') + '| = (PQ cosβ)/(PQ sinβ) = (cos β)/(sin β) = cot β')

fix('q015-p001-n0015', 'vector_notation_restored', 'Vector arrows and unit-vector hats were lost; stray arrows were appended to the stem and option D.', shot=S3,
    text='একটি কণার উপর ' + V('F') + ' = (6' + i + ' – 3' + j + ' + 3' + k + ') নিউটন বল প্রয়োগের ফলে কণাটির ' + V('r') + ' = (2' + i + ' – 2' + j + ' + ' + k + ') মিটার সরণ হয়। প্রযুক্ত বল কর্তৃক সম্পাদিত কাজের পরিমাণ কত?',
    d='21 J', explanation='W = ' + V('F') + '.' + V('r') + ' = 12 + 6 + 3 = 21J')

fix('q005-p078-n0124', 'figure_fragments_removed', 'Figure labels (A, B) leaked into the stem and the figure-only explanation was reduced to stray letters. The diode drawing is in the existing figure crop.', shot=S3,
    text='চিত্রে ডায়োডটির A- প্রান্তটি হবে−',
    explanation='ডায়োড প্রতীক: বাম প্রান্ত P (p-টাইপ), ডান প্রান্ত n (n-টাইপ)')

fix('q007-p148-n0045', 'math_layout_restored', 'Integral limits and the nested exponent were scrambled in the stem.', shot=S3,
    text='∫₁² x²e^(x³) dx = কত?')
fix('q007-p148-n0045', 'math_layout_restored', 'Explanation rebuilt from the printed first line and the scrambled fragments (substitution table); only the first line was read directly from the page.', confirmed=False,
    explanation='∫₁² x²e^(x³) dx = ? ধরি, x³ = z বা, 3x²dx = dz বা, x²dx = 1/3 dz; x = 1 হলে z = 1 এবং x = 2 হলে z = 8; ∴ I = 1/3 ∫₁⁸ e^(z) dz = 1/3 [e^(z)]₁⁸ = 1/3 (e⁸ − e)')

fix('q006-p128-n0042', 'math_layout_restored', 'Limit expression was scrambled (limit variable and exponent displaced) and a stray bracket was appended to option D.', shot=S3,
    text='lim_(y→0) (1 + xy)^(1/y) = কত?', d='ln x',
    explanation='lim_(y→0) (1 + xy)^(1/y) [xy × 1/y = x] = e^(x)')
