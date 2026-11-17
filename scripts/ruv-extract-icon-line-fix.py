#!/usr/bin/env python3
"""RU-V extraction fix: explanation heading text on the icon line leaked into option D.

Root cause (verified on page 12, Q5): the first explanation line is printed on the same line as the answer-circle /
"ASPECT Explanation" icon. extract.py cut the explanation at `marker.top - 5` by the *top* of each text run. A
taller explanation run whose top is a fraction of a unit above that cutoff (842.6 vs 842.9 here) was assigned to
the question's options, so the explanation's heading became part of option D.

Fix (one rule): runs whose vertical centre lies on the icon line, to the right of the marker, belong to the
explanation. Applied to a SCRATCH COPY of the extraction code; the original ruv-work/raw_questions.json is never
modified. Output: <WORK>/raw_questions.icon-line-fix.json (+ a before/after count on stdout).

  python3 scripts/ruv-extract-icon-line-fix.py
"""
import json, os, shutil, subprocess, tempfile

WORK = '/home/kali/gpt-workspace/bd-admission-app-data/ruv-work'
PY = os.path.join(WORK, 'venv/bin/python')
IND = ' ' * 16
NEEDLE = IND + "events.append((exp_top, 'marker', m))\n"
PATCH = (
    IND + "# RU-V icon-line fix: runs on the icon line, right of the marker, are explanation text\n"
    + IND + "for r in cr:\n"
    + IND + "    if (r['left'] > m['left'] + 4 and not is_marker(r) and not is_exp_header(r)\n"
    + IND + "            and m['top'] - 3 <= r['top'] + r['h'] / 2 <= m['top'] + m['h'] + 6\n"
    + IND + "            and exp_top - 14 <= r['top'] < exp_top):\n"
    + IND + "        exp_top = min(exp_top, r['top'] - 1)\n"
)

tmp = tempfile.mkdtemp(prefix='ruvfix-')
for f in ('extract.py', 'layout.py', 'bijoy.py', 'runs.json', 'draw.json'):
    shutil.copy(os.path.join(WORK, f), tmp)
src = open(os.path.join(tmp, 'extract.py')).read()
assert src.count(NEEDLE) == 1, 'extract.py changed; patch anchor not unique'
open(os.path.join(tmp, 'extract.py'), 'w').write(src.replace(NEEDLE, PATCH + NEEDLE))
subprocess.run([PY, 'extract.py'], cwd=tmp, check=True, stdout=subprocess.DEVNULL)
new = json.load(open(os.path.join(tmp, 'raw_questions.json')))
old = json.load(open(os.path.join(WORK, 'raw_questions.json')))
out = os.path.join(WORK, 'raw_questions.icon-line-fix.json')
json.dump(new, open(out, 'w'), ensure_ascii=False, indent=0)
assert len(new['questions']) == len(old['questions'])
changed = sum(1 for a, b in zip(old['questions'], new['questions']) if (a['options'], a['explanation'], a['stem']) != (b['options'], b['explanation'], b['stem']))
print('questions', len(new['questions']), 'changed', changed, '->', out)
shutil.rmtree(tmp)
