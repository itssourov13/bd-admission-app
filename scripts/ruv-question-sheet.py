#!/usr/bin/env python3
"""RU-V visual evidence helper (read-only on all inputs).

Crops each requested question (stem + options + the printed answer-marker/icon line) out of the rendered PDF page
PNGs and stacks them into one labelled contact sheet, so a reviewer can compare staged text with the printed page.

  python3 scripts/ruv-question-sheet.py OUT.png EXAM:PAGE:NUMBER[:COL] [EXAM:PAGE:NUMBER[:COL] ...]   (COL 0/1 disambiguates a page that has the same number in both columns)

Geometry comes from the extraction evidence (ruv-work/runs.json; 1 pt = 1.2 PNG px). No source file is modified.
"""
import json, os, re, sys
from PIL import Image, ImageDraw

WORK = '/home/kali/gpt-workspace/bd-admission-app-data/ruv-work'
COLSPLIT = 459.0
SCALE = 1.2  # PNG px per PDF point (1105 px wide page render)
QRE = re.compile(r'^\s*(\d{1,3})\s*(?:\.|\))?(\s|$)')


def colno(r):
    return 0 if r['left'] < COLSPLIT else 1


def is_qnum(r):
    if not (r['font'].startswith('Times New Roman') and r['size'] >= 14 and 'Bold' in r['font']):
        return False
    return (50 <= r['left'] <= 66 or 460 <= r['left'] <= 474) and bool(QRE.match(r['text']))


def region(runs, number, col):
    qn = sorted((r for r in runs if is_qnum(r) and colno(r) == col), key=lambda r: r['top'])
    me = [r for r in qn if int(QRE.match(r['text']).group(1)) == number]
    if not me:
        return None
    top = me[0]['top']
    icons = sorted(r['top'] for r in runs if r['font'] == 'Arial Black' and r['text'].strip() == 'ASPECT'
                   and colno(r) == col and r['top'] > top)
    nxt = [r['top'] for r in qn if r['top'] > top + 1]
    bottom = (icons[0] + 24) if icons else (nxt[0] - 2 if nxt else top + 200)
    if os.environ.get('SHEET_EXPL'):
        bottom = (nxt[0] - 1) if nxt else top + 260  # include the whole printed explanation
    elif nxt:
        bottom = min(bottom, nxt[0] - 1)
    return top - 4, bottom


def main():
    out, specs = sys.argv[1], sys.argv[2:]
    pages = {p['page']: p['runs'] for p in json.load(open(f'{WORK}/runs.json'))}
    raw = json.load(open(f'{WORK}/raw_questions.json'))['questions']
    colof = {(q['exam'], q['page'], q['number']): q['col'] for q in raw}
    tiles = []
    for spec in specs:
        parts = [int(x) for x in spec.split(':')]
        exam, page, number = parts[:3]
        col = parts[3] if len(parts) > 3 else colof.get((exam, page, number), 0)
        reg = region(pages[page], number, col)
        if reg is None:
            tiles.append((spec + ' (region not found)', Image.new('RGB', (600, 20), 'white')))
            continue
        im = Image.open(f'{WORK}/png/p-{page:03d}.png')
        x0, x1 = (50, 458) if col == 0 else (459, 921)
        crop = im.crop((int(x0 * SCALE), max(0, int(reg[0] * SCALE)), int(x1 * SCALE), int(reg[1] * SCALE)))
        z = float(os.environ.get('SHEET_ZOOM', '1'))
        if z != 1:
            crop = crop.resize((int(crop.width * z), int(crop.height * z)), Image.LANCZOS)
        tiles.append((f'{spec}  (exam {exam}, page {page}, Q{number})', crop))
    w = max(t.width for _, t in tiles)
    h = sum(t.height + 18 for _, t in tiles)
    sheet = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(sheet)
    y = 0
    for label, t in tiles:
        d.rectangle((0, y, w, y + 16), fill=(225, 235, 255))
        d.text((4, y + 2), label, fill='black')
        sheet.paste(t, (0, y + 18))
        y += t.height + 18
    sheet.save(out)
    print(out, sheet.size)


if __name__ == '__main__':
    main()
