#!/usr/bin/env python3
"""Record-level reconciliation of RU-V historical datasets (read-only).

old  = git 005c157 packs (earlier import: 1,815 q / 1,720 answered / 95 unknown)
new  = git 2b7cb52^ packs (= verified-pack-archive: 1,828 q)
stage = ruv-aspect-staging/answer-verification.json (53 needs_review)

Run from the app repo. Writes <staging>/count-reconciliation.json only.
"""
import json, os, re, subprocess, collections

STAGING = '/home/kali/gpt-workspace/bd-admission-app-data/ru/ruv-aspect-staging'
OLD_REV, NEW_REV = '005c157', '2b7cb52^'


def packs_at(rev):
    names = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', rev, 'data/question-packs/'], text=True).split()
    out = {}
    for n in names:
        if os.path.basename(n).startswith('ru-vq'):
            for q in json.loads(subprocess.check_output(['git', 'show', f'{rev}:{n}']))['questions']:
                out[q['id']] = q
    return out


def norm(s):
    return re.sub(r'\W+', '', s or '')[:80]


old, new = packs_at(OLD_REV), packs_at(NEW_REV)
oi, ni = set(old), set(new)
av = {a['legacyQuestionId']: a for a in json.load(open(f'{STAGING}/answer-verification.json'))['answers']}
kept = oi & ni
dropped, added = sorted(oi - ni), sorted(ni - oi)
new_text = {norm(new[i]['text']): i for i in added}
dropped_text_match = [i for i in dropped if norm(old[i]['text']) in new_text]

old_known = {i for i in oi if old[i].get('correctOptionIds')}
old_unknown = oi - old_known
changed = sorted(i for i in kept & old_known if old[i]['correctOptionIds'] != (new[i].get('correctOptionIds') or []))
unk_now = collections.Counter(av[i]['status'] for i in kept & old_unknown if i in av)

report = {
    'oldRev': OLD_REV, 'newRev': NEW_REV,
    'oldQuestions': len(old), 'newQuestions': len(new),
    'idsKept': len(kept), 'idsDroppedFromOld': len(dropped), 'idsAddedInNew': len(added),
    'netDifference': len(new) - len(old),
    'droppedWhoseTextReappearsUnderNewId': len(dropped_text_match),
    'droppedWithNoTextMatch': len(dropped) - len(dropped_text_match),
    'oldAnswered': len(old_known), 'oldUnknown': len(old_unknown),
    'keptOldAnswerDiffersFromNew': {'count': len(changed), 'ids': changed},
    'keptOldUnknownNowStatus': dict(unk_now),
    'newStagingStatus': dict(collections.Counter(a['status'] for a in av.values())),
    'explanation': (
        '1,815->1,828 is not a simple +13: 149 old IDs were replaced and 162 new IDs added by a rebuild that fixed '
        'broken Bangla and shattered math. 1,720 vs 1,775: the old figure counted answered markers in an older '
        'dataset; 1,775 = 1,828 - 53 needs_review (unflagged printed markers). Different datasets and definitions.'),
    'droppedIds': dropped, 'addedIds': added,
}
json.dump(report, open(f'{STAGING}/count-reconciliation.json', 'w'), ensure_ascii=False, indent=1)
print({k: v for k, v in report.items() if k not in ('droppedIds', 'addedIds', 'explanation')})
