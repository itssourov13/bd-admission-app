#!/usr/bin/env python3
"""RU-V corrections-overlay generator (deterministic).

Inputs (all read-only):
  - overlay-free baseline staging   (node scripts/ruv-aspect-staging.mjs --build --no-corrections, RUV_STAGING_OUT=<baseline>)
  - ruv-work/raw_questions.json                 original extraction ledger
  - ruv-work/raw_questions.icon-line-fix.json   re-extraction with the icon-line fix (scripts/ruv-extract-icon-line-fix.py)
  - scripts/ruv-aspect-corrections/manual.json  hand-authored, visually confirmed corrections and decisions
Output:
  - scripts/ruv-aspect-corrections/corrections.json   the single overlay file consumed by the staging builder
  - scripts/ruv-aspect-corrections/extraction-fix-review.json   bulk records that were NOT auto-applied (need a person)

Bulk rule (extraction-fix): the explanation's first line printed beside the answer-circle icon had been assigned to
option D. A record is auto-corrected only when (a) the baseline option text equals the old extraction, (b) only option D
changed, (c) the new D is a strict leading part of the old D, and (d) the new D is non-empty. Everything else is listed
for manual review instead of being guessed.
"""
import glob, json, os, re, sys, collections

DATA = '/home/kali/gpt-workspace/bd-admission-app-data'
BASE = os.environ.get('RUV_BASELINE', f'{DATA}/ru/ruv-aspect-staging.baseline')
WORK = f'{DATA}/ruv-work'
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, 'ruv-aspect-corrections')
PDF_SHA = 'f1fc25faef0bba80d4495002f3006ac4ca1a7ce9da5c26e6a1f7db45218a49c7'
ws = lambda s: re.sub(r'\s+', ' ', s or '').strip()
nows = lambda s: re.sub(r'\s+', '', s or '')


def load_baseline():
    sets = {s['id']: s['examIndex'] for s in json.load(open(f'{BASE}/source-sets.json'))['sets']}
    q = {}
    for f in sorted(glob.glob(f'{BASE}/questions/*.json')):
        for x in json.load(open(f))['questions']:
            q[(sets[x['setId']], x['provenance']['pdfPage'], x['printedQuestionNumber'])] = x
    expl = {e['questionId']: (e.get('source') or {}).get('text') or '' for e in json.load(open(f'{BASE}/explanations.json'))['explanations']}
    return q, expl


def ref(x, exam):
    return {'pdfSha256': PDF_SHA, 'pdfPage': x['provenance']['pdfPage'], 'printedQuestionNumber': x['printedQuestionNumber'],
            'examIndex': exam, 'renderedPage': f'ruv-work/png/p-{x["provenance"]["pdfPage"]:03d}.png'}


def main():
    qs, expl = load_baseline()
    old = json.load(open(f'{WORK}/raw_questions.json'))['questions']
    new = json.load(open(f'{WORK}/raw_questions.icon-line-fix.json'))['questions']
    bulk, review, stats = [], [], collections.Counter()
    for a, b in zip(old, new):
        if a['options'] == b['options'] and a['explanation'] == b['explanation']:
            continue
        key = (a['exam'], a['page'], a['number'])
        x = qs.get(key)
        if not x:
            stats['not_in_baseline_(excluded_record)'] += 1
            continue
        changed = [o['label'].lower() for o, p in zip(a['options'], b['options']) if o['text'] != p['text']]
        base = {o['id']: o['text'] for o in x['options']}
        why = None
        if len(a['options']) != len(b['options']):
            why = 'option_count_changed'
        elif changed not in (['d'], []):
            why = f'options_changed_{"".join(changed)}'
        elif any(ws(o['text']) != base[o['label'].lower()] for o in a['options']):
            why = 'baseline_differs_from_old_extraction'
        elif changed == ['d']:
            od, nd = ws(a['options'][3]['text']), ws(b['options'][3]['text'])
            if not nd:
                why = 'new_d_empty'
            elif not nows(od).startswith(nows(nd)):
                why = 'new_d_not_a_leading_part_of_old_d'
        if why is None and a['explanation'] != expl.get(x['id'], ''):
            why = 'baseline_explanation_differs_from_old_extraction'
        if why:
            review.append({'legacyQuestionId': x['legacyQuestionId'], 'examIndex': a['exam'], 'pdfPage': a['page'], 'printedQuestionNumber': a['number'],
                           'why': why, 'changedOptions': changed,
                           'oldD': ws(a['options'][-1]['text'])[:120], 'newD': ws(b['options'][-1]['text'])[:120]})
            stats['review_' + why] += 1
            continue
        code = 'explanation_heading_leaked_into_option' if changed else 'explanation_math_recovered'
        if changed:
            bulk.append({'legacyQuestionId': x['legacyQuestionId'], 'field': 'options.d.text', 'original': base['d'], 'corrected': ws(b['options'][3]['text']),
                         'reasonCode': code, 'reason': 'The first line of the printed explanation sits on the answer-circle line and had been assigned to option D; it is moved back to the explanation.',
                         'method': 'icon_line_extraction_fix', 'sourceRef': ref(x, a['exam']), 'visuallyConfirmed': False})
        if a['explanation'] != b['explanation']:
            bulk.append({'legacyQuestionId': x['legacyQuestionId'], 'field': 'explanation', 'original': expl.get(x['id'], ''), 'corrected': b['explanation'],
                         'reasonCode': code, 'reason': 'Explanation text restored from the re-extraction: the leaked first line is back at the start and glyphs lost in the first extraction (mu, x, =>) are recovered.' if changed else 'Explanation glyphs lost in the first extraction are recovered by the re-extraction.',
                         'method': 'icon_line_extraction_fix', 'sourceRef': ref(x, a['exam']), 'visuallyConfirmed': False})
        stats['auto_options' if changed else 'auto_explanation_only'] += 1

    # Bulk rule 2: the printed question number is stored separately; a leading ". " in the stem is a numbering artefact.
    for key, x in sorted(qs.items()):
        if re.match(r'^[.\u0964]\s+\S', x['text']):
            bulk.append({'legacyQuestionId': x['legacyQuestionId'], 'field': 'text', 'original': x['text'], 'corrected': re.sub(r'^[.\u0964]\s+', '', x['text']),
                         'reasonCode': 'stem_leading_period_removed', 'reason': 'Numbering artefact: the printed question number is stored separately; the stem began with a stray full stop.',
                         'method': 'numbering_artefact_rule', 'sourceRef': ref(x, key[0]), 'visuallyConfirmed': False})
            stats['stem_leading_period'] += 1

    manual = json.load(open(f'{OUTDIR}/manual.json')) if os.path.exists(f'{OUTDIR}/manual.json') else {'corrections': [], 'decisions': []}
    man_keys = {(c['legacyQuestionId'], c['field']) for c in manual['corrections']}
    kept = [c for c in bulk if (c['legacyQuestionId'], c['field']) not in man_keys]
    overridden = len(bulk) - len(kept)
    allc = kept + manual['corrections']
    # deterministic order
    allc.sort(key=lambda c: (c['legacyQuestionId'], c['field']))
    doc = {'version': 1, 'generatedBy': 'scripts/ruv-build-corrections.py', 'pdfSha256': PDF_SHA,
           'note': 'Every entry carries the baseline value (original) so the staging builder can refuse to apply it to different content.',
           'counts': {'corrections': len(allc), 'bulkExtractionFix': len(kept), 'manualVisual': len(manual['corrections']), 'bulkOverriddenByManual': overridden},
           'decisions': manual['decisions'], 'corrections': allc}
    os.makedirs(OUTDIR, exist_ok=True)
    json.dump(doc, open(f'{OUTDIR}/corrections.json', 'w'), ensure_ascii=False, indent=1)
    review.sort(key=lambda r: (r['examIndex'], r['pdfPage'], r['printedQuestionNumber']))
    json.dump({'note': 'Records the icon-line re-extraction changed but that were NOT auto-applied.', 'count': len(review), 'items': review},
              open(f'{OUTDIR}/extraction-fix-review.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({'stats': dict(stats), 'overlay': doc['counts']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
