#!/usr/bin/env python3
"""RU-V manual-correction authoring helper (deterministic, read-only on all sources).

Reads hand-authored, visually reviewed entries from scripts/ruv-aspect-corrections/manual_entries/batch_*.py and expands them
into scripts/ruv-aspect-corrections/manual.json (consumed by scripts/ruv-build-corrections.py). Each entry only states the
corrected values; the original value and the source reference are filled in from the overlay-free baseline staging, so a
correction can never be recorded against content it was not authored for.

Entry modules get these globals:
  V(s)  attach a combining right-arrow (U+20D7) to every letter of s   (vector, e.g. V("AB") -> A⃗B⃗)
  O(s)  attach a combining overline (U+0305) to every character of s  (logical complement / bar)
  H(s)  attach a combining circumflex (U+0302), NFC-normalised          (unit vector, e.g. H("i") -> î)
  fix(sid, code, reason, confirmed=True, **fields)   fields: text, a, b, c, d, explanation
  base(sid, field)  baseline text of a field (for programmatic patches)
  decide(sid, disposition, note, confirmed=True)    disposition: false_positive | no_defect | corrected | unresolved
`sid` is a unique suffix of the legacy question id (asserted unique in the baseline).
"""
import glob, json, os, runpy, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = '/home/kali/gpt-workspace/bd-admission-app-data'
BASE = os.environ.get('RUV_BASELINE', f'{DATA}/ru/ruv-aspect-staging.baseline')
OUTDIR = os.path.join(HERE, 'ruv-aspect-corrections')
PDF_SHA = 'f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7'

sets = {s['id']: s['examIndex'] for s in json.load(open(f'{BASE}/source-sets.json'))['sets']}
Q = {}
for f in sorted(glob.glob(f'{BASE}/questions/*.json')):
    for x in json.load(open(f))['questions']:
        Q[x['legacyQuestionId']] = (x, sets[x['setId']])
EXPL = {e['questionId']: (e.get('source') or {}).get('text') or '' for e in json.load(open(f'{BASE}/explanations.json'))['explanations']}

V = lambda s: ''.join(c + '\u20d7' if c.isalpha() else c for c in s)
O = lambda s: ''.join(c + '\u0305' for c in s)
H = lambda s: unicodedata.normalize('NFC', ''.join(c + '\u0302' for c in s))

corrections, decisions = [], []
FIELD = {'text': 'text', 'a': 'options.a.text', 'b': 'options.b.text', 'c': 'options.c.text', 'd': 'options.d.text', 'explanation': 'explanation'}


def resolve(sid):
    hits = [k for k in Q if k.endswith(sid)]
    assert len(hits) == 1, f'{sid}: {len(hits)} matches'
    return hits[0]


def current(x, field):
    if field == 'text': return x['text']
    if field == 'explanation': return EXPL.get(x['id'], '')
    return next(o['text'] for o in x['options'] if o['id'] == field[8])


def ref(x, exam, shot):
    return {'pdfSha256': PDF_SHA, 'pdfPage': x['provenance']['pdfPage'], 'printedQuestionNumber': x['printedQuestionNumber'], 'examIndex': exam,
            'renderedPage': f'ruv-work/png/p-{x["provenance"]["pdfPage"]:03d}.png', 'evidence': shot}


def fix(sid, code, reason, confirmed=True, shot=None, **fields):
    lid = resolve(sid); x, exam = Q[lid]
    for k, v in fields.items():
        f = FIELD[k]; orig = current(x, f)
        if v == orig: continue
        corrections.append({'legacyQuestionId': lid, 'field': f, 'original': orig, 'corrected': v, 'reasonCode': code, 'reason': reason,
                            'method': 'manual_visual_review' if confirmed else 'manual_text_review', 'sourceRef': ref(x, exam, shot), 'visuallyConfirmed': confirmed})


def decide(sid, disposition, note, confirmed=True, flag=None):
    lid = resolve(sid); x, exam = Q[lid]
    decisions.append({'legacyQuestionId': lid, 'examIndex': exam, 'pdfPage': x['provenance']['pdfPage'], 'printedQuestionNumber': x['printedQuestionNumber'],
                      'disposition': disposition, 'note': note, 'visuallyConfirmed': confirmed, **({'flagCode': flag} if flag else {})})


def base(sid, field):
    return current(Q[resolve(sid)][0], FIELD[field])


def main():
    g = {'V': V, 'O': O, 'H': H, 'fix': fix, 'decide': decide, 'base': base}
    for f in sorted(glob.glob(f'{OUTDIR}/manual_entries/batch_*.py')):
        runpy.run_path(f, init_globals=g)
    seen = set()
    for c in corrections:
        k = (c['legacyQuestionId'], c['field'])
        assert k not in seen, f'duplicate manual correction {k}'; seen.add(k)
    corrections.sort(key=lambda c: (c['legacyQuestionId'], c['field']))
    decisions.sort(key=lambda d: (d['examIndex'], d['pdfPage'], d['printedQuestionNumber'], d['legacyQuestionId']))
    json.dump({'corrections': corrections, 'decisions': decisions}, open(f'{OUTDIR}/manual.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({'manualCorrections': len(corrections), 'decisions': len(decisions)}))


if __name__ == '__main__':
    main()
