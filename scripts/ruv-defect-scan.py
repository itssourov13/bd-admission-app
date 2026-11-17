#!/usr/bin/env python3
"""Heuristic defect scan over the staged RU-V questions (read-only). Candidates only: nothing here is a verdict.

Categories
  leak      explanation/sentence text inside an option (length outlier, explanation-prefix overlap, connective words)
  vector    lost vector/overbar notation (arrow runs, stray bars in the stem, vector words with bare-letter options)
  notation  corrupted math/science notation (private-use glyphs, U+FFFD, caret artefacts, control characters)
  boundary  malformed options (empty, truncated, joined, stem/option bleed)
Writes <staging>/defect-scan.json.
"""
import glob, json, re, statistics, sys, collections

import os
STAGING = os.environ.get("RUV_STAGING", "/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging")
PUA = re.compile('[\ue000-\uf8ff]')
CTRL = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f]')
BN = re.compile('[\u0980-\u09ff]')
CONNECT = re.compile(r'(এটি হলো|অতএব|সুতরাং|ব্যাখ্যা|Explanation|কারণ|অর্থাৎ|যেহেতু|তাই|সমাধান)')
ARROWS = re.compile(r'(→\s*){2,}|(\^\()|(―\s*[−-]\s*[−-])')
VECTORW = re.compile(r'(ভেক্টর|vector|দিক|সদিক|অভিমুখ)', re.I)


def norm(s):
    return re.sub(r'\s+', '', s or '')


def load():
    qs, expl = [], {}
    for e in json.load(open(f'{STAGING}/explanations.json'))['explanations']:
        expl[e['questionId']] = (e.get('source') or {}).get('text') or ''
    for f in sorted(glob.glob(f'{STAGING}/questions/*.json')):
        qs += json.load(open(f))['questions']
    return qs, expl


def scan():
    qs, expl = load()
    out = []
    for q in qs:
        reasons = []
        opts = q['options']
        texts = [o['text'] for o in opts]
        ex = norm(expl.get(q['id'], ''))
        lens = [len(norm(t)) for t in texts]
        for i, o in enumerate(opts):
            t = o['text']; n = norm(t)
            others = [l for j, l in enumerate(lens) if j != i] or [0]
            med = statistics.median(others)
            # leak
            if len(n) >= 12 and ex and n[-12:] in ex and len(n) > 25:
                reasons.append(('leak', o['id'], 'option tail occurs in the explanation'))
            if len(n) >= 14 and ex and ex[:14] in n:
                reasons.append(('leak', o['id'], 'explanation start occurs in the option'))
            if CONNECT.search(t) and len(n) > max(25, 2 * med):
                reasons.append(('leak', o['id'], 'connective word in long option'))
            if len(n) > max(60, 3.5 * med) and BN.search(t) and med < 25:
                reasons.append(('leak', o['id'], f'length outlier {len(n)} vs median {med:.0f}'))
            if re.search(r'[A-Za-z0-9\)\]]\s+[\u0980-\u09ff]{3,}\s+[\u0980-\u09ff]{3,}', t) and med < 12 and len(n) > 14:
                reasons.append(('leak', o['id'], 'formula followed by Bangla words'))
            # notation
            if PUA.search(t): reasons.append(('notation', o['id'], 'private-use glyph'))
            if '\ufffd' in t: reasons.append(('notation', o['id'], 'replacement char'))
            if CTRL.search(t): reasons.append(('notation', o['id'], 'control char'))
            if '\n' in t: reasons.append(('boundary', o['id'], 'newline inside option'))
            if len(n) == 0: reasons.append(('boundary', o['id'], 'empty option'))
        st = q['text']
        if PUA.search(st): reasons.append(('notation', 'stem', 'private-use glyph'))
        if '\ufffd' in st: reasons.append(('notation', 'stem', 'replacement char'))
        if CTRL.search(st): reasons.append(('notation', 'stem', 'control char'))
        if ARROWS.search(st): reasons.append(('vector', 'stem', 'arrow/bar run in stem'))
        if any(ARROWS.search(t) for t in texts): reasons.append(('vector', 'options', 'arrow/bar run in option'))
        if VECTORW.search(st) and all(len(norm(t)) <= 3 for t in texts) and len(set(norm(t) for t in texts)) < 4:
            reasons.append(('vector', 'options', 'vector wording with bare-letter/duplicate options'))
        if reasons:
            cats = sorted({r[0] for r in reasons})
            out.append({'questionId': q['id'], 'legacyQuestionId': q['legacyQuestionId'], 'pdfPage': q['provenance']['pdfPage'],
                        'printedQuestionNumber': q['printedQuestionNumber'], 'categories': cats,
                        'reasons': [{'cat': c, 'where': w, 'why': y} for c, w, y in reasons]})
    return out, len(qs)


if __name__ == '__main__':
    cands, total = scan()
    c = collections.Counter(cat for x in cands for cat in x['categories'])
    json.dump({'scanned': total, 'candidates': len(cands), 'byCategory': dict(c), 'items': cands},
              open(f'{STAGING}/defect-scan.json', 'w'), ensure_ascii=False, indent=1)
    print({'scanned': total, 'candidates': len(cands), 'byCategory': dict(c)})
