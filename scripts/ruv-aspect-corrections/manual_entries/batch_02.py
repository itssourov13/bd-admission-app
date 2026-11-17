# Batch 02 - vector / unit-vector questions (compared with rendered pages s07).
S2 = 'ruv-aspect-staging.evidence/s07.png'
i, j, k = H('i'), H('j'), H('k')

fix('p092-c1-s03-q004-r1', 'stray_glyph_removed',
    'Primes on x were lost in the explanation and stray prime glyphs were appended to option D.',
    shot=S2,
    text='(x + y), (x′ + y) বুলিয়ান ফাংশনটির সরল করলে হবে–',
    d='y′',
    explanation='(x + y)(x′ + y) = xx′ + xy + x′y + yy = 0 + xy + x′y + y [xx′ = 0, y.y = y] = y (x + x′ + 1) = y')

fix('q011-p067-n0011', 'vector_notation_restored',
    'Unit-vector hats were lost or misplaced (option a printed with two j-hats) and a stray glyph was appended to option D.',
    shot=S2,
    a='4' + j + ' + 2' + j + ' ms⁻¹', c='2' + i + ' + 4' + j + ' ms⁻¹', d='4' + i + ' + 2' + j + ' ms⁻¹',
    explanation='x-অক্ষ বরাবর একক ভেক্টর → 4' + i + ' y-অক্ষ বরাবর একক ভেক্টর → 2' + j + ' সুতরাং বস্তুর বেগ, v = 4' + i + ' + 2' + j)

fix('q022-p045-n0022', 'vector_notation_restored',
    'Vector arrows and unit-vector hats were lost in stem and explanation; stray glyph runs were appended to option D.',
    shot=S2,
    text='একটি কণার উপর ' + V('F') + ' = (− 2' + i + ' + 3' + j + ' + 4' + k + ') N বল প্রয়োগের ফলে Q (3, − 4, − 2) বিন্দু থেকে P (− 2, 3, 5) বিন্দুর স্থানান্তরিত হয়। বল কর্তৃক সম্পাদিত কাজের পরিমাণ কত?',
    d='60J',
    explanation='সরণ, ' + V('QP') + ' = ' + V('OP') + ' − ' + V('OQ') + ' = (− 2 − 3)' + i + ' + (3 + 4)' + j + ' + (5 + 2)' + k + ' ' + V('QP') + ' = − 5' + i + ' + 7' + j + ' + 7' + k +
                ' ∴ কৃতকাজ, W = ' + V('F') + ' . ' + V('QP') + ' = (− 2' + i + ' + 3' + j + ' + 4' + k + ') . (− 5' + i + ' + 7' + j + ' + 7' + k + ') = 10 + 21 + 28 = 59J')

fix('q002-p055-n0126', 'vector_notation_restored',
    'Vector arrows and unit-vector hats were lost in stem and explanation; stray arrows were appended to option D.',
    shot=S2,
    text='যদি ' + V('A') + ' = 2' + i + ' + α' + j + ' + ' + k + ' এবং ' + V('B') + ' = − 2' + i + ' + ' + j + ' − 2' + k + ' পরস্পর লম্ব হয়, তবে α-এর মান কত?',
    d='−2',
    explanation=V('A') + ' . ' + V('B') + ' = ABcos90° = 0 ⇒ − 4 + α − 2 = 0 ⇒ α − 6 = 0 ⇒ α = 6')

r1, r2, R = V('r') + '₁', V('r') + '₂', V('R')
fix('q012-p056-n0136', 'vector_notation_restored',
    'Vector arrows, unit-vector hats and the square root were lost in stem, options and explanation; stray glyph runs were appended to options b and d.',
    shot=S2,
    text='দুইটি ভেক্টর ' + r1 + ' = 2' + i + ' + 4' + j + ' − 5' + k + ' এবং ' + r2 + ' = ' + i + ' + 2' + j + ' + 3' + k + ', এর লব্ধি ভেক্টর এর সমান্তরাল একক ভেক্টর কোনটি?',
    a='2/7' + i + ' + 4/7' + j + ' + 5/7' + k, b='1/7' + i + ' + 2/7' + j + ' + 3/7' + k, c='3/7' + i + ' + 6/7' + j + ' + 2/7' + k, d='3/5' + i + ' + 6/5' + j + ' + 2/5' + k,
    explanation=r1 + ' ও ' + r2 + ' এর লব্ধি = ' + r1 + ' + ' + r2 + ' = (2' + i + ' + 4' + j + ' − 5' + k + ') + (' + i + ' + 2' + j + ' + 3' + k + ') = 3' + i + ' + 6' + j + ' − 2' + k +
                ' ∴ ' + R + ' এর মান = |' + R + '| = √(3² + 6² + (− 2)²) = √(9 + 36 + 4) = √49 = 7 ∴ ' + R + ' এর সমান্তরাল একক ভেক্টর, ' + H('r') + ' = ' + R + '/R = 3/7' + i + ' + 6/7' + j + ' − 2/7' + k)

decide('q012-p056-n0136', 'unresolved',
       'Printed key is C (3/7 î + 6/7 ĵ + 2/7 k̂, sign confirmed at 2.6x zoom) but the printed explanation computes the resultant 3î + 6ĵ − 2k̂, i.e. −2/7 k̂; no option matches the computed unit vector. Source-internal inconsistency: answer is not changed and the record is held as browse-only.',
       flag='source_inconsistency_unresolved')
