## Question visual asset reconstruction — complete (2026-11-23)

- Completed and integrated 43 artworks: 17 RU-V, 21 RU Lokkho replacements, 5 CU placeholders; HSTU had no explicit image placeholder/reference in the available packs.
- Replaced diagram-only references, removed 3 RU-V false-positive image refs, retained 24 clean Lokkho image files and preserved 65 original snapshots externally.
- Updated asset index/content seed and docs. Asset check, pack validation, content check and TypeScript pass; automated suite 318/318 pass.
- Remaining manual step: physical Android QuestionCard visual inspection. Full mapping and source provenance: docs/QUESTION_VISUAL_ASSETS.md.

## CU + HSTU explanation upgrade — content complete (2026-11-23)

- Completed verified explanation review for CU and HSTU packs. CU: 2,100/2,185 verified rows explained; HSTU: 850/939. Combined: 2,950/3,124 verified rows explained. Subject-level coverage and deferred-review handling are documented in docs/implementation/CU_HSTU_EXPLANATION_QUALITY_UPGRADE.md.
- Only explanation fields were added to already-verified records. Question stems, options, keys, verification statuses, metadata and app logic were not changed. All remaining verified rows are accounted for by deferred groups with evidence; CU has 84 deferred groups (85 rows, one duplicate member), HSTU 89 groups.
- CU content commit: f1cd865. HSTU content is committed locally in the current feature branch. Final Node 22.23.1 validation passed: packs:validate (230 packs / 14,579 questions / 0 errors / 5,536 warnings), content:build and content:check (231 packs / 16,407 questions / 29.64 MiB SQLite seed), TypeScript noEmit, and pnpm test (318 passed / 0 failed). No push or app build was performed.

## RU explanation upgrade — checkpoint 29 (Completed) — 2026-11-22

- RU explanation upgrade — checkpoint 29 (2026-11-22): RU content explanation quality work is complete. All five RU subject queues are empty. Since checkpoint 28, 199 unique verified question records were updated (Biology batches bio_16–bio_19 plus the final Physics rewrite batch); every update is explanation-only, remains verified, and matches the latest ledger row. Final verified coverage is 3,929/4,144 (94.8%); overall question explanation coverage is 3,979/4,249 (93.6%). 219 unique question IDs are documented as deferred; five Higher Mathematics heuristic false positives are documented in reviewed_ok.txt. Group-level reconciliation reports zero unresolved items. Ledger 2,962 rows / 2,957 unique IDs. CU/HSTU untouched. Final generated-content validation also passed on Node 22.23.1: packs:validate (230 packs / 14,579 questions, 0 errors; 5,536 warnings), content:build/content:check (231 packs / 16,407 questions; 28.84 MiB seed), TypeScript noEmit, and all 318 tests (0 failures).

## RU explanation upgrade — checkpoint 28 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 28 (2026-11-22): RU Biology batches bio_11–bio_15 applied after checkpoint 27. 272 authored groups produced 274 unique verified record updates (incl. exact-duplicate propagation). Biology explanation coverage 1,199/1,416; overall RU verified coverage 3,819/4,144 (92.2%). All changes limited to explanation fields, every updated record remains verified, and source/key ambiguities are documented as deferred. Ledger 2,763 rows / 2,758 unique IDs; deferred list 202. Remaining eligible queue: 193 Biology groups and 23 Physics rewrites. CU/HSTU not started.

## RU explanation upgrade — checkpoint 27 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 27 (2026-11-22): RU Biology batches bio_06–bio_10 applied after checkpoint 26. 278 authored groups produced 290 unique verified record updates (incl. exact-duplicate propagation). Biology explanation coverage 946/1,416; overall RU verified coverage 3,566/4,144 (86.0%). Only explanation fields changed, all updates remain verified, and answer/source ambiguities were deferred. Ledger 2,489 rows / 2,484 unique IDs; deferred list 175. Remaining queue: 492 Biology groups and 23 Physics rewrites. CU/HSTU not started.

## RU explanation upgrade — checkpoint 26 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 26 (2026-11-22): Five RU Biology batches reviewed and applied (274 unique verified records updated incl. exact-duplicate propagation); Biology explanation coverage 657/1,416, overall RU verified coverage 3,277/4,144 (79.1%). All changes limited to explanation fields, all remain verified, and source/key ambiguities are recorded as deferred. Ledger 2,199 rows / 2,194 unique IDs; deferred list 152. Remaining eligible queue: 792 Biology groups plus 23 Physics garbled-explanation rewrites. CU/HSTU not started.

## RU explanation upgrade — checkpoint 25 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 25 (2026-11-22): Final RU Chemistry reconciliation: ch_12 replaced 4 garbled explanations in the 2018-19 D1 VQ book; ch_13 added 3 authored explanations plus 2 exact duplicate propagations = 5 ledger additions across 5 Varsity packs. Combined checkpoint delta: 9 question updates (4 replacements + 5 additions) across 6 packs. Total explanations 3,055/4,249 (71.9%); verified explained 3,005/4,144 (72.5%). RU Chemistry 905/947; its remaining 42 verified questions are all explicitly documented in deferred.txt (no unreviewed eligible gaps; live q2.py Chemistry queue empty). Other coverage: Physics 819/845, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Five repeated 3.2% Na2CO3 pH copies were added to the existing deferral record. Ledger 1,925 rows / 1,920 unique IDs; deferred.txt = 109 rows. verify_final.py 1916 passed: 9/9 tree changes match the ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build/tests run; generated manifest and seed remain untouched.

## RU explanation upgrade — checkpoint 24 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 24 (2026-11-22): ch_11 applied (59 ledger rows across 6 packs: 48 additions + 11 garbled-text replacements; no duplicate propagation). Coverage 3,050/4,249 (71.8%); verified explained 3,000/4,144 (72.4%); Physics 819/845, Chemistry 900/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. One question deferred (RU 2025-26 ruc Group 2 q054-112166; aqueous CaCl2 cannot plate Ca metal; deferred.txt = 103). Three organic reaction/structure images inspected. Additional OCR, unit, equilibrium and convention notes recorded. Ledger 1,916 rows / 1,911 unique IDs. verify_final.py 1857 passed: 59/59 tree changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 23 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 23 (2026-11-22): ch_10 applied (57 ledger rows across 6 packs: 42 additions + 15 garbled-text replacements; no duplicate propagation). Coverage 3,002/4,249 (70.7%); verified explained 2,952/4,144 (71.2%); Physics 819/845, Chemistry 852/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Three questions deferred (RU 2021-22 ruc Group 1 q056-111202; RU 2021-22 ruc Group 2 q051-110726; RU 2022-23 ruc Group 1 q049-110662; deferred.txt = 102). Three images were inspected: one scheme deferred due to absent reagents/conditions; nitration image confirmed meta-nitroaniline; substituted benzene image confirmed 1-butyl-2,4-dimethylbenzene. Source/OCR/convention notes recorded. Ledger 1,857 rows / 1,852 unique IDs. verify_final.py 1800 passed: 57/57 tree changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 22 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 22 (2026-11-22): ch_09 applied (56 ledger rows across 6 packs: 53 additions + 3 garbled-text replacements; no duplicate propagation). Coverage 2,960/4,249 (69.7%); verified explained 2,910/4,144 (70.2%); Physics 819/845, Chemistry 810/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Three questions deferred (RU 2017-18 ruh q044-109841; RU 2020-21 ruc Group 1 q036-110309; RU 2021-22 ruc Group 1 q043-111225; deferred.txt = 99). Additional source/convention notes recorded. Ledger 1,800 rows / 1,795 unique IDs. verify_final.py 1744 passed: 56/56 tree changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 21 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 21 (2026-11-22): ch_08 applied (60 ledger rows: 59 authored explanations + 1 intentional identical-text duplicate propagation; all 60 additions across 5 packs). Coverage 2,907/4,249 (68.4%); verified explained 2,857/4,144 (69.0%); Physics 819/845, Chemistry 757/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. One question deferred (RU 2017-18 rug q043-110423; deferred.txt = 96). Several source/convention notes recorded without source edits. Ledger 1,744 rows / 1,739 unique IDs. verify_final.py 1684 passed: 60/60 tree changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 20 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 20 (2026-11-22): ch_07 applied (62 ledger rows: 57 authored explanations + 5 intentional identical-text duplicate propagations; 58 additions and 4 replacements across 9 packs). Coverage 2,847/4,249 (67.0%); verified explained 2,797/4,144 (67.5%); Physics 819/845, Chemistry 697/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Three questions deferred (RU 2015-16 rug q044-109904, rug q049-109337, ruh q049-109986; deferred.txt = 95). Historical/context and source-convention notes were added without editing source questions or keys. Ledger 1,684 rows / 1,679 unique IDs. verify_final.py 1622 passed: 62/62 tree changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 19 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 19 (2026-11-22): ch_06 applied (62 ledger rows: 55 authored explanations + 7 intentional identical-text duplicate propagations; all 62 additions across 13 packs). Coverage 2,789/4,249 (65.6%); verified explained 2,739/4,144 (66.1%); Physics 819/845, Chemistry 639/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Five questions deferred (RU 2012-13 ruh q027, q028, q036; RU 2013-14 ruh q046; RU 2014-15 ruf q042; deferred.txt = 92). Additional typo/convention notes recorded without source/key edits. Ledger 1,622 rows / 1,617 unique IDs. verify_final.py 1560 passed: 62/62 tree changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 18 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 18 (2026-11-22): ch_05 applied (61 ledger rows: 58 authored explanations + 3 intentional identical-text duplicate propagations; 61 additions across 6 packs). Coverage 2,727/4,249 (64.2%); verified explained 2,677/4,144 (64.6%); Physics 819/845, Chemistry 577/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Two questions deferred (RU 2014-15 ruh q032-109591, RU 2015-16 ruc q043-109716; deferred.txt = 87). Additional notes record source variability, OCR and conceptual nuances without editing stems or keys. Ledger 1,560 rows / 1,555 unique IDs. verify_final.py 1499 passed: 61/61 changes match ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 17 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 17 (2026-11-22): ch_04 applied (68 ledger rows: 63 authored explanations plus 5 intentional identical-text duplicate propagations; 67 additions and 1 replacement; RU Chemistry 2012-13 rug/ruh through 2013-14 ruc/ruf/rug, 10 packs). Coverage 2,666/4,249 (62.7%); verified explained 2,616/4,144 (63.1%); Physics 819/845, Chemistry 516/947, Biology 385/1,416, Higher Mathematics 799/838, ICT 97/98. Three new questions deferred (ruc 2013-14 q027-108431 and q039-108561; rug q024-108993; deferred.txt = 85); a source spelling issue in rug q031-109123 was noted without changing the question. Ledger 1,499 rows / 1,494 unique IDs. verify_final.py 1431 passed: 68/68 tree changes match the ledger, final text matches, zero non-explanation field changes, all changed questions remain verified. No full build or tests run; manifest and SQLite seed remain untouched.

## RU explanation upgrade — checkpoint 16 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 16 (2026-11-22): ch_03 applied (65 ledger rows: 57 authored + 8 duplicate propagations; 62 additions + 3 replacement of a garbled explanation; RU Chemistry 2011-12 ruh and 2012-13 ruc/ruf/rug, 11 packs). Coverage 2,599/4,249 (61.2%); verified explained 2,549/4,144 (61.5%); Physics 819/845, Chemistry 450/947, Biology 384/1,416, HM 799/838, ICT 97/98. 5 new deferrals documented (ruc 2012-13 q020-108872, q021-108457, q027-108539, q035-108874; ruf 2012-13 q032-108053; deferred.txt = 82), reasons in REVIEW_FLAGS.md. Ledger 1,431 rows / 1,426 unique IDs. verify_final.py 1366 passed (65/65 match, 0 non-explanation changes, all still verified). No build or test run by design.

## RU explanation upgrade — checkpoint 15 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 15 (2026-11-22): ch_02 applied (77 explanation additions: 64 authored + 13 duplicate propagations; RU Chemistry 2010-11 ruh and 2011-12 ruc/ruf/rug/ruh, 15 packs). Coverage 2,537/4,249 (59.7%); verified explained 2,487/4,144 (60.0%); Physics 819/845, Chemistry 388/947, Biology 384/1,416, HM 799/838, ICT 97/98. 6 new deferrals documented (ruh 2010-11 q038; ruf 2011-12 q027, q029, q031; rug 2011-12 q025; ruh 2011-12 q032; deferred.txt = 77), reasons in REVIEW_FLAGS.md. Ledger 1,366 rows / 1,361 unique IDs. verify_final.py 1289 passed (77/77 match, 0 non-explanation changes, all still verified). No build or test run by design.

## RU explanation upgrade — checkpoint 14 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 14 (2026-11-22): ch_01 applied (61 explanation additions: 55 authored + 6 duplicate propagations; RU Chemistry 2010-11 plus later-year duplicates, 8 packs). Coverage 2,460/4,249 (57.9%); verified explained 2,410/4,144 (58.2%); Physics 819/845, Chemistry 311/947, Biology 384/1,416, HM 799/838, ICT 97/98. 5 new deferrals documented (stored key conflicts with the chemistry; deferred.txt = 71). Ledger 1,289 rows / 1,284 unique IDs. verify_final.py 1228 passed (61/61 match, 0 non-explanation changes, all still verified). No build or test run by design.

## RU explanation upgrade — checkpoint 13 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 13 (2026-11-22): ph_16 applied (61 ledger rows, all additions; 1,228 rows total / 1,223 unique). RU explanations 2,399/4,249; verified explained 2,349/4,144; Physics 819/845 (26 remaining, all documented deferrals); Chemistry 250/947; Biology 384/1,416; HM 799/838; ICT 97/98. Four new Physics deferrals (ruc g1 2025-26 q009-111184, q019-111788; ruc g2 2025-26 q010-111594, q011-111600), reasons in REVIEW_FLAGS.md; deferred.txt = 66 entries. verify_final.py 1167: 61/61 changes match the ledger, 0 non-explanation changes, all still verified. Source images inspected for two circuit questions. No build run; manifest and seed untouched. RU Physics done. Next: RU Chemistry (ch_01).

## RU explanation upgrade — checkpoint 12 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 12 (2026-11-22): ph_15 applied (37 ledger rows: 29 additions + 8 replacements; 1,167 rows total / 1,162 unique). RU explanations 2,338/4,249; verified explained 2,288/4,144; Physics 758/845 (87 remaining, of which 22 are documented deferrals, so 65 eligible); Chemistry 250/947; Biology 384/1,416; HM 799/838; ICT 97/98. Three new Physics deferrals (ruc 2021-22 g2 q028-111318, ruc 2022-23 g2 q016-111370, q032-111389), each with a reason in REVIEW_FLAGS.md; deferred.txt = 62 entries. verify_final.py 1130: 37/37 changes match the ledger, 0 non-explanation changes, all still verified. Targeted re-check of uncertain items (force triangle, node-voltage circuit, pump HP, escape velocity, unit ordering) passed. No build run; manifest and seed untouched. Next: ph_16.

## RU explanation upgrade — checkpoint 11 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 11 (2026-11-22): ph_13-ph_14 applied (74 ledger rows: 39 + 35; 1,130 rows total / 1,125 unique). RU explanations 2,309/4,249; verified explained 2,259/4,144; Physics 729/845 (116 remaining incl. ~20 documented deferrals); Chemistry 250/947; Biology 384/1,416; HM 799/838; ICT 97/98. Six new Physics deferrals (ph_13: ruc 2020-21 g1 q021-110413; ph_14: ruc 2020-21 g1 q030-110428, g2 q024-110996, 2021-22 g1 q008-110536, q009-110537, q022-110531), each with a reason in REVIEW_FLAGS.md; deferred.txt = 59 entries. verify_final.py 860: 74/74 changes vs HEAD match the ledger, 0 non-explanation changes, all still verified. Six source images inspected. No build run; manifest and seed untouched. Next: ph_15.

## RU explanation upgrade — checkpoint 10 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 10 (2026-11-22): ph_08-ph_12 applied (196 ledger rows: 40/39/40/39/38; 1,056 rows total / 1,051 unique; one intentional duplicate propagation, ru-sci-c-2015-2016-ruh-mcq-q017-109954-ch, in ph_09). RU explanations 2,246/4,249; verified explained 2,196/4,144; Physics 666/845 (179 remaining incl. deferrals); Chemistry 250/947 (697 remaining); Biology 384/1,416 (1,032 remaining); HM 799/838 (39 documented deferrals); ICT 97/98. Five new Physics deferrals (ph_09: rug q012-109344, rug q020-109900; ph_11: ruh q031-110341; ph_12: ruc q016-109755, rug q025-110801), each with a reason in REVIEW_FLAGS.md; deferred.txt now 53 entries. verify_final.py 860: 196/196 changed ids match the ledger, 0 non-explanation changes, all still verified. No build run; manifest and seed untouched (last full cycle: checkpoint 5). Next: ph_13.

## RU explanation upgrade — checkpoint 9 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 9 (2026-11-22): ph_07 applied (42 ledger rows, 860 total / 855 unique): Physics 476/845 (369 remaining); Chemistry 250/947; Biology 384/1,416; HM 799/838; ICT 97/98. RU verified explained 2,006/4,144; 2,056/4,249 total. No deferrals in ph_07. Full build/validation intentionally deferred to the end of all RU/CU/HSTU content work (last full cycle: checkpoint 5).

## RU explanation upgrade — checkpoint 8 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 8 (2026-11-22): ph_02-ph_06 + fix_03 (ICT gate image verified) applied: 168 ledger rows (818 total / 813 unique). 2,014/4,249 explanations; verified explained 1,964/4,144; Physics 434/845 (411 remaining incl. deferrals), Chemistry 250/947, Biology 384/1,416, HM 799/838, ICT 97/98. Six more Physics deferrals recorded. No build run; manifest and seed untouched. Next: ph_07.

## RU explanation upgrade — checkpoint 7 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 7 (2026-11-22): ph_01 applied (22 authored + 1 duplicate-propagated = 23 ledger rows; 650 rows / 646 unique IDs total) and mathematically reviewed (0 errors, 0 key disagreements). 1,847/4,249 explanations; verified explained 1,797/4,144; Physics 267/845 (578 remaining), Chemistry 250/947 (697), Biology 384/1,416 (1,032), HM 799/838 (39 deferred), ICT 97/98. Three Physics deferrals recorded (q004-108134, q006-108142, q015-108171). Full build/validation deferred to the final cycle; manifest and seed untouched. Next: ph_02.

## RU explanation upgrade — checkpoint 6 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 6 (2026-11-22): Higher Mathematics batches hm_16–hm_19 and ICT batch ict_03 close out the Higher Mathematics and ICT queues: 106 ledger entries (hm_16: 23, hm_17: 29, hm_18: 28, hm_19: 16 rewrites of OCR-garbled vq explanations, ict_03: 9 logic-circuit items written after viewing the circuit images + 1 C-programming rewrite), 627 ledger rows total. Every answer was recomputed independently (sympy/numeric); 6 more questions with keys or stems that do not check out were deferred, not explained (see REVIEW_FLAGS.md). Totals: 1,824 / 4,249 explanations; verified questions explained 1,774 / 4,144 (Higher Mathematics 799 / 838, the 39 left are deferred; ICT 97 / 98). Remaining RU work: Physics, Chemistry, Biology. Content build/check/typecheck/tests intentionally NOT rerun (deferred to the final cycle); bundledManifest.ts is unchanged since checkpoint 5 and is stale relative to the packs until that final build.

## RU explanation upgrade — checkpoint 5 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 5 (2026-11-22): 521 ledger rows / 517 unique question IDs (82 explanations in hm_15: 62 add, 20 replace); coverage 1,740/4,249 (41.0%), verified 1,690/4,144 (40.8%), 2,454 verified still unexplained; Higher Mathematics 724/838 verified explained (114 remaining). All 82 explanations independently re-derived with sympy, 0 key disagreements. Pack validation PASS (0 errors), content:check OK, typecheck clean, 318/318 tests pass. Unfinished; see docs/implementation/RU_EXPLANATION_QUALITY_UPGRADE.md. No push, no APK.

## RU explanation upgrade — checkpoint 4 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 4 (2026-11-22): 439 ledger rows / 435 unique question IDs (73 explanations authored in hm_12-hm_14 plus 2 precision refinements); coverage 1,678/4,249 (39.5%), verified 1,628/4,144 (39.3%), 2,516 verified still unexplained; Higher Mathematics 662/838 verified explained. Pack validation PASS (0 errors), content:check OK, typecheck clean, 318/318 tests pass. Unfinished; see docs/implementation/RU_EXPLANATION_QUALITY_UPGRADE.md. No push, no APK.

## RU explanation upgrade — checkpoint 3 (In Progress) — 2026-11-22

- RU explanation upgrade — checkpoint 3 (2026-11-22): 364 explanations authored in total; coverage 1,608/4,249 (37.8%), verified 1,558/4,144 (37.6%), 2,586 verified still unexplained. Unfinished; see docs/implementation/RU_EXPLANATION_QUALITY_UPGRADE.md. No push, no APK.

## RU explanation upgrade — In Progress — 2026-11-22

- RU explanation upgrade — checkpoint 2 (2026-11-22): 280 explanations authored in total; RU coverage 1,529/4,249 (36.0%), verified 1,479/4,144 (35.7%), 2,665 verified still unexplained. Work is unfinished; details and resume steps in docs/implementation/RU_EXPLANATION_QUALITY_UPGRADE.md. Tooling/ledger: bd-admission-app-data/ru-quality-upgrade/. No push, no APK.

## Android preview v0.1.12 — build and owner device QA complete — 2026-11-22

**Status:** EAS Android `preview` / `INTERNAL` APK is `FINISHED`; the owner installed it and performed device checks. The owner confirms the question-report feature works as expected. The build is not a production AAB or Google Play submission. Current open follow-up is RUNTIME-001, a small perceived delay while WhatsApp prepares a report shared through Android Sharesheet; timing and the responsible stage are not yet measured. No push or merge.

- [x] Confirmed release identity: app / brand / package 0.1.12, Android versionCode 12, `com.admissionbd.app`; existing Expo slug, EAS project and managed signing identity preserved.
- [x] Completed source checks on Node 22.23.1: TypeScript, lint, Expo install check, focused tests 54/54, full suite 318/318, `git diff --check` and Expo Doctor 21/21.
- [x] Submitted EAS build `32339eb3-cef2-45fa-b268-2917fecd82be` using Node 22.23.1, pnpm 11.10.0 and EAS CLI 27.11.0.
- [x] Verified cloud build `FINISHED` at 2026-11-22 05:52:33 UTC / 11:52:33 Asia/Dhaka.
- [x] APK artifact available: https://expo.dev/artifacts/eas/TMGMPfAQMCOrlZ4hKHmZSx-iDDCLjN57_FwM5zGA66Y.apk
- [x] Owner installed v0.1.12 and reports on-device checks complete; question-report feature works as expected.
- [x] Updated release, handoff, current-state, QA, changelog, README and build-guide documentation to record actual completion and manual QA.
- [x] Added [RUNTIME_ISSUES.md](RUNTIME_ISSUES.md) and QA follow-up RUNTIME-001 for the perceived WhatsApp target-preparation delay.
- [ ] RUNTIME-001 timing breakdown and reproduction: pending; no code fix approved or made.
- [ ] Git push / merge: owner-managed; not performed.

---

## Historical implementation checkpoint — CU localization, Profile ordering & question issue reporting — 2026-11-22

*Historical snapshot:* this source-implementation checklist predates the completed v0.1.12 cloud build and owner device QA recorded above.

**Status:** Implementation, automated verification, documentation and local commit 1a76488 are complete on the current feature branch. No EAS build or push.

- [x] Add CU bilingual catalogue metadata; verify Bangla/English display with regression coverage.
- [x] Reorder Profile shortcuts to Bookmarks → Practice history → Marking rules → Settings; add a separate Reported questions entry.
- [x] Add the offline issue-report flow to Browse, Bookmarks, Flash, Exam and Result. Report appears immediately below Bookmark in the QuestionCard's fixed-width vertical action stack; option layout is unchanged.
- [x] Preserve the existing Exam Flag for review separately. Migration v7 and session_answers.flagged remain the only source of session-scoped exam flags.
- [x] Add additive SQLite migration v13, repository/service, category validation, per-question de-duplication, immutable first-report snapshot, edit/delete/list management and share/export state.
- [x] Add privacy-bounded JSON schema v1 export and native Android Sharesheet hand-off using SDK 57-compatible Expo packages.
- [x] Resolve SDK 57 package alignment, including @expo/cli 57.0.34 and direct @expo/metro-runtime ~57.0.18.
- [x] Final checks on Node 22.23.1: typecheck, lint, Expo install check, targeted tests 54/54, full test suite 318/318, diff check and Expo Doctor 21/21.
- [ ] Manual Android preview QA: narrow/wide layouts, active exam/flash timer while report sheet is open, JSON attachment hand-off to installed share targets and post-share file readability.

Implementation detail and limitations: docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md. Existing v0.1.11 APK is unchanged and does not include this implementation.

---

## Historical audit checkpoint — Standard Exam review-flag separation — 2026-11-22

**Status:** Follow-up audit completed; app code unchanged.

- [x] Confirmed existing Standard Exam Flag for review is stored in `session_answers.flagged`, migration v7, scoped per session/question.
- [x] Traced the active Exam marker, question palette, progress/submission counts, completed Result marker/filter and finalization guard.
- [x] Confirmed the exam flag is independent of selected answers and scoring; it is personal per-attempt review state, not a content defect report.
- [x] Re-ran `tests/exam-review.test.ts`: 7/7 passed, including reload persistence and post-finalization immutability.
- [x] Updated the audit recommendation: distinct “Report question issue / প্রশ্নে সমস্যা জানান” action, non-flag icon, separate placement and a separate global issue-report table. Existing exam flag behavior must not change.

Detailed report: `docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md`. No app source changes, APK, physical-device test or push.

---

## Historical pre-implementation audit checkpoint — Profile, CU localization & question reports — 2026-11-22

**Status:** Read-only audit and implementation recommendation saved. No app behavior changed.

- [x] Reproduced the CU localization fallback: code `CU` resolves to key `cu`, but `KNOWN_UNIVERSITIES` has no Bengali display entry.
- [x] Confirmed Profile order is Bookmarks → Practice history → Settings → Marking rules; requested order only requires swapping the final two existing buttons.
- [x] Confirmed QuestionCard has bookmark support but no issue-report action; no local issue-report table, screen or export/share flow exists.
- [x] Audited local SQLite, QuestionView/QuestionCard call sites, Expo SDK 57 dependencies and migration history. Recommended offline-first reports, one report per canonical question, snapshot-based JSON export and Android Sharesheet delivery.
- [x] Saved detailed report: `docs/audits/PROFILE_CU_LOCALIZATION_AND_QUESTION_ISSUE_REPORTING_AUDIT_2026-11-22.md`.
- [x] Existing focused tests pass: 27/27 under Node 22.23.1.
- [x] At this historical checkpoint, record implementation as pending. The implementation was subsequently completed; see the current task entry at the top of this file.

No app source or content changed; no APK/build, physical-device UX test, push or deployment performed for this audit.

---

## Android preview v0.1.11 — CU A Unit build, install and owner QA — 2026-11-19

**Status:** EAS `preview` / `INTERNAL` APK for app `0.1.11` / Android `versionCode 11` is complete according to the owner. The owner installed it on Android and reports that the checks performed work normally. Release/device documentation is updated and committed locally; no push.

- [x] Confirmed previous release identity v0.1.10 / code 10, current CU source commit and clean worktree; EAS account `sk_king13` and existing EAS project authenticated.
- [x] Updated `brand.config.json`, `package.json` and `app.config.js` to `0.1.11` / `versionCode: 11`; package ID `com.admissionbd.app`, slug, EAS project ID and preview configuration remain unchanged.
- [x] Versioned gates: full suite 301/301; `pnpm typecheck`; `pnpm lint`; `pnpm content:check` (231 / 16,407); `pnpm packs:validate` (230 / 14,579; 0 errors / 5,536 warnings); `pnpm question-assets:check` (65 assets / 66 refs).
- [x] Resolved Expo public config: version `0.1.11`, package `com.admissionbd.app`, Android `versionCode 11`, slug `bd-admission-app`, EAS project ID unchanged. EAS CLI 27.10.0 `project:info` confirms `@sk_king13/bd-admission-app` / `16ba69b8-96d7-4856-a197-77acddebe1ec`.
- [x] Submitted EAS Android `preview` / `INTERNAL` APK, build `8aa4643c-e312-4a0b-af08-9b3f7779b68c`. [Open EAS build / APK page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c).
- [x] Owner confirms the build completed, installed the APK and checked the app successfully. This is a manual smoke check; handset model/OS and exhaustive screen/accessibility coverage were not supplied.
- [x] Committed version metadata locally as `60a01d0`, initial submission docs as `84299e1`, and this release/device QA documentation update locally. No push.

## CU A Unit Science — Varsity import complete — 2026-11-19

**Status:** Imported into `data/question-packs/`, generated manifest and SQLite seed rebuilt, regression expectations reconciled, and CU-specific eligibility/Standard Exam boundaries verified. App logic and schema unchanged. No APK/EAS build or push.

- [x] Verified original input archive and final import-ready package hashes; original ZIP and extracted source snapshot preserved unchanged.
- [x] Confirmed no existing CU filenames or batch/paper/question/source ID collisions. Copied 26 pack JSON files flat into the Varsity `data/question-packs/` directory; no Library/ASPECT file or data path modified.
- [x] Imported 26 CU A Unit packs / 26 papers / 2,558 questions / 11,397 options / 68 source documents for institution `cu` / `CU`.
- [x] Preserved 2,185 answer-verified / 373 answer-unverified states and 2,558 owner-confirmed content-verified states. CU practice predicates return 2,185 eligible / 307 structurally safe review candidates; every paper has a non-zero verified pool, so no paper enters the provisional-only fallback.
- [x] Confirmed CU's 2025–26 partial 100-mark / 60-minute rule remains unavailable for official scored Standard Exam planning; other 25 rules remain unconfigured.
- [x] Added the original University of Chittagong website logo PNG, byte-identical to the fetched official-site image: `assets/universities/cu.png` (429×581; SHA-256 `9cc7ef6e5577c21aa8d6a1f6dea1298a35c032b63abf7388c4dc38c5361d8829`), and registered it in the existing university logo map.
- [x] Regenerated `src/content/bundledManifest.ts` and local ignored `assets/content/content_seed.db`. Current bundle: 231 entries / 16,407 question rows; Varsity catalogue: 230 packs / 14,579 questions / 59,481 options; ASPECT remains a separate Library publication.
- [x] Validator: 230 packs / 14,579 questions / 0 errors / 5,536 warnings. Question asset index: 65 assets / 66 refs / 65 unique. `content:build` and `content:check` pass.
- [x] Updated only affected existing count expectations in three integration/seed regression tests; added CU-specific assertions for institution counts, verified pool, paper-level no-fallback behavior and incomplete Standard Exam availability.
- [x] Final verification: full suite 301/301; typecheck; lint; content freshness 231 / 16,407; pack validation 230 / 14,579 (0 errors / 5,536 warnings); question assets 65 / 66 refs; SQLite quick_check `ok` / zero FK violations; Android no-bytecode Metro export 2,044 modules / 147 assets / ~4 MB JS with `cu.png` included.
- [x] Updated the current inventory, workflow, architecture, asset source, QA and handoff documentation. Final `git diff --check` passed before commit.
- [x] Committed all 44 scoped files locally (`feat(content): import CU A Unit question bank`); final worktree clean. Nothing pushed.

Package: `/home/kali/gpt-workspace/bd-admission-app-data/CU/CU_Science_AI_Import_Ready_2026-11-19/`; ZIP SHA-256: `0a2b398bbdaf2554ec3cc8ecd8dd1098e282534de686ed24c29d5cdecec521ba`. No push.

---

## RU Science varsity question-bank import — complete locally — 2026-11-18

**Status:** The owner-approved 46-pack curated RU Science package is integrated and committed locally on the current branch. No app database was imported directly; the normal combined offline seed was rebuilt and verified for fresh install and existing-install sync. No push.

- [x] Verified the package `SHA256SUMS` (112 deliverable files) and checked all destination paths/IDs before copying; no collisions.
- [x] Imported 46 JSON packs / 4,249 questions / 16,996 options / 90 source documents plus 45 local PNGs. All new records use institution `ru` and `ru-sci-*` IDs. Excluded the separate 197-question non-science D1 Group-1 pack.
- [x] Preserved 4,144 answer+content verified questions and all 105 unresolved statuses/keys; no answer or verification promotion. No exam rules added.
- [x] Updated generated asset index and manifest; combined seed is schema v12, 205 entries / 13,849 questions / 55,396 options / 65 image assets.
- [x] Updated test expectations: current RU integration, existing JU/HSTU catalogue import, legacy RU retirement, real-seed fresh install and v10→v12 existing-install upgrade. Legacy `ru-c-*`/`ru-vq-*` records stay retired; new `ru-sci-*` papers are active.
- [x] Full suite 301/301; focused import/migration group 9/9; typecheck, lint, `packs:validate` (0 errors / 5,199 warnings), `question-assets:check` (65 assets, 66 refs), `content:check`, Android no-bytecode Metro export (2,043 modules / 146 assets / ~4 MB JS), and SQLite quick_check/FK check pass on Node 22.23.1.
- [x] Updated README, project context, current state, changelog, decisions, question import workflow and handoff.
- [x] Prepared the next Android preview identity: app `0.1.10` / Android `versionCode 10`, EAS preview APK; local final gates and EAS submission tracked in the current release checklist.
- [x] Owner installed and ran the v0.1.10 APK on a physical Android device and reports normal operation in the checks performed.
- [ ] Track answer-explanation formatting defects found during use; collect further examples and fix the confirmed cases together in a focused pass.
- [x] Reviewed the scoped Git diff and committed all 104 intended files locally; working tree clean. No push.

The existing RU 2024–25 Marking Profile was not modified. With no source-backed `examRules`, RU papers do not gain a paper-specific Standard Exam pattern; Custom Practice remains the available timed path. See `docs/QUESTION_IMPORT_WORKFLOW.md`, `docs/CURRENT_STATE.md`, and ADR-041.

---

## ASPECT Library UX / verification / performance + v0.1.9 Android preview — complete and owner-tested — 2026-11-18

**Status:** Implementation and release preparation are committed locally. The v0.1.9 / Android versionCode 9 EAS preview APK built successfully and the owner manually installed and ran it on Android, reporting normal operation and no currently observed issue. The owner will record any issue found during continued use. No Git push or merge has been performed.

- [x] Full suite on Node 22.23.1: `pnpm test` — 301/301 passed. Stale assertions now reflect the existing eligibility guard: 2,510 verified-eligible university questions total (JU 1,396; HSTU 939), and 2 unverified ASPECT questions after v1→v2 sync.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm content:check` (159 packs / 9,600 questions), `pnpm question-assets:check` (20/20), `node scripts/ruv-aspect-attest.mjs --check`, `pnpm packs:validate` (0 errors / 5,085 warnings), Expo resolved config and `git diff --check`.
- [x] Resolved Expo config: app version `0.1.9`, Android `versionCode 9`, package `com.admissionbd.app`, existing EAS project ID unchanged.
- [x] Reviewed source PDF page 56, question 12: option C has `+2/7 k̂`, printed working derives `−2/7 k̂`; the source is contradictory, so the item remains held/unverified/unscored. See `docs/ASPECT_OWNER_VERIFICATION.md`.
- [x] EAS preview APK build completed successfully: `5cdcf931-9b67-46f2-9038-47bb7e144c40` (**FINISHED**); [EAS build page / APK download](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/5cdcf931-9b67-46f2-9038-47bb7e144c40).
- [x] Owner manually installed and ran v0.1.9 on Android and reports that all checked behavior is normal; no issue currently observed. Device model/OS and exhaustive screen/accessibility coverage were not recorded.
- [ ] Owner to push/merge the branch, then publish GitHub pre-release `v0.1.9` from the merged default branch with the EAS APK and generated SHA-256 checksum. See `docs/ANDROID_RELEASE.md`.

- [x] Presentation-layer ASPECT attribution + logo; RU logo reuse (ADR-040).
- [x] Session drawers with set cards; Flash / Timed practice / Browse per session and set.
- [x] Owner verification attestation applied to pack, seed and manifest (content version 2); docs/ASPECT_OWNER_VERIFICATION.md.
- [x] Library query optimisation and benchmark script.
- [x] Regression tests: tests/aspect-library-ux.test.ts, updated tests/library-bundled-seed.test.ts (fresh install + v1→v2 upgrade + repeat sync).
- [~] Owner manual Android smoke check passed with no issue reported. Detailed drawer/logo, light/dark, Bangla/English and TalkBack coverage was not explicitly recorded and remains unconfirmed.
- [x] Owner/source cross-check of PDF page 56 completed 2026-11-18; the printed option and working contradict one another, so the key remains withheld and no `RESTORE` entry or content-version bump is appropriate.
- [ ] If `scripts/ruv-aspect-build-pack.mjs --publish` is ever re-run it regenerates the pack as unverified: re-run `node scripts/ruv-aspect-attest.mjs` afterwards.

---

## Owner-requested ASPECT Library UX/runtime audit — complete; implementation pending — 2026-11-17

**Status:** Audit complete; implementation delivered 2026-11-18 (see the section above this one). Retained for history.

- [x] Inspected the two owner screenshots and `/home/kali/screenshort/admission-runtime/aspect-logo.png`.
- [x] Audited publisher/book metadata, the existing ASPECT and RU logo registries, session/unit tree, book/set actions, Flash/Exam/Browse scope handling, question statuses and scoring eligibility.
- [x] Read the generated SQLite seed read-only and measured representative eligibility, candidate and browse-count SQL paths. Timings are host-side diagnostics, not Android device timings.
- [x] Saved the evidence, severity, root causes, safe verification treatment, recommendations and Claude acceptance checklist in `docs/audits/ASPECT_LIBRARY_UX_RUNTIME_AUDIT_2026-11-17.md`.
- [ ] Claude: implement the targeted publisher mapping/logo, session accordion/card actions, owner-attested question status/answer reconciliation and Library query optimization.
- [ ] Verify fresh-install and existing-database seed propagation (including content-version bump/newer-edition protection), focused tests, TypeScript/lint, content/assets checks, Metro export and physical-device Library timing/visual QA.

**Important:** current checked-in question/book verification flags remain `unverified` until the owner-authorized implementation is applied and the seed is regenerated. Do not merely hide Provisional labels. The 22 no-correct-option records, 3 conflicting-key records and 11 duplicate-option questions require the separate dispositions in the audit report. Existing app-wide multi-select support must be reused.

---

## Completed local task — RU-V ASPECT Library integration and offline seed delivery — 2026-11-17

**Status:** Implemented and locally verified. Release metadata is v0.1.7 / Android versionCode 8; EAS internal APK build `f1584fb8-0be9-4398-a314-d0fc21507603` is FINISHED; the APK artifact is available. Physical-device installation and Library visual QA remain pending.

- [x] Preserved the existing 17-set / 1,828-question RU-V staging and correction overlay; staging SHA-256 verification covers 76/76 files.
- [x] Built one ASPECT Library publication with 26 units, 1,828 questions, 7,312 options, 1,828 source explanations, 20 figure assets and source-page provenance for every question.
- [x] Kept every RU-V question answer/content state `unverified`; source-printed keys are provisional only. 1,797 single-choice records have a printed marker; 31 explicit answer-review cases remain browse-only (22 `×`/no correct option, 6 multiple-answer, 3 unresolved source contradictions with keys withheld). Eleven additional duplicate-option records are withheld by the provisional scoring query; 1,786 candidates currently enter provisional single-choice practice. All 1,828 remain browsable.
- [x] Preserved archive exclusions: 154 raw records outside the prepared set (38 non-MCQ and 116 MCQs whose options could not be reliably extracted) remain in the exclusion ledger.
- [x] Added the LibraryPack to `data/library-packs/`, copied its 20 figures into the shared offline asset tree and regenerated the asset index and bundled manifest.
- [x] Extended build-time seed generation and startup sync to copy Library publisher/book/unit/membership rows into the user's SQLite database.
- [x] Fixed seed-sync edition precedence: the installed Library `content_version` is checked before any shared question/source/option writes. A newer installed edition is preserved and the older bundled signature is checkpointed as unchanged.
- [x] Verified fresh-install and schema-v10-existing-database paths, idempotent sync, newer-installed-edition preservation and RU tombstone preservation.
- [x] Verified `content:check` (159 bundled entries / 9,600 total question rows), 20/20 assets, staging hash 76/76, RU-V archive 36/36, Lokkho archive 90/90, typecheck, lint, focused tests and Android Metro no-bytecode export.
- [x] Updated the active handoff, architecture, current state, rights decision and QA documentation.
- [x] Prepare v0.1.7 / Android versionCode 8 and complete EAS internal APK build `f1584fb8-0be9-4398-a314-d0fc21507603` ([build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/f1584fb8-0be9-4398-a314-d0fc21507603)); [APK download](https://expo.dev/artifacts/eas/2wSz5i5tBMwbqy5BPwu3CAUXn6cJrXmx6fvZZwp6DYU.apk), 121,037,466 bytes (~115.4 MiB).
- [ ] Install the new APK and visually check Library discovery, ASPECT book detail, unit navigation, question/source/explanation/figure rendering on a physical device.

Key details and caveats: `docs/RUV_ASPECT_IMPORT.md`. The current source-key / explanation status is deliberately not described as independently or university verified.

---

## Completed owner task — Phase C finalization and RU externalization/removal — 2026-11-17

Result: Phase C and Phase D implementation, automated verification and documentation are complete. Phase D is committed locally. No push.

- [x] Phase A: Lokkho archive verified (44 packs / 4,009 questions / 45 assets / 46 refs; 90/90 SHA-256 entries).
- [x] Phase B: app-wide multi-select committed as c5ca075; 253/253 tests at its commit checkpoint.
- [x] Phase C: committed locally as fe86f53; shared asset pipeline + CI check, structured math and RU-V figure inventory; 276/276 tests at its checkpoint. Device QA not performed.
- [x] Phase D archive: separate RU-V archive created and verified (15 packs / 1,828 questions / 17 printed sets / 20 figure crops; 36/36 SHA-256 entries).
- [x] Both external archives reconciled against all 59 original app pack files and 45 images byte-for-byte before removal.
- [x] Removed all 44 ru-c-*.json and 15 ru-vq-*.json packs plus 45 Lokkho-only question images from active app source.
- [x] Regenerated bundled manifest, SQLite seed and static asset index: 158 non-RU packs / 7,772 questions; zero RU content or Lokkho references; assets/universities/ru.svg retained.
- [x] Added schema v11 soft-retirement migration and active-content query filtering. Historical questions, sources, bookmarks, answers, sessions and results remain resolvable.
- [x] Added importer regression fixtures and realistic v10-to-v11/fresh-install tests, including seed re-sync and database reopen.
- [x] Verified Node 22.23.1 full suite 282/282, TypeScript, lint, content build/check, asset check, pack validation (0 errors), Android no-bytecode export, archive verifiers/SHA-256 and git diff --check.
- [ ] Physical Android device/emulator QA of the final Phase C/D APK remains for the owner after a new preview build is produced.

Separate archives (preserve independently):
- Lokkho: /home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/
- RU-V: /home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/

Historical boundary at the Phase C/D archive checkpoint: the owner had deferred a later Library import of RU-V's 17 sets. That deferral is superseded by the completed integration recorded at the top of this file. Lokkho remains unverified and outside ASPECT; JU/HSTU/DU and other non-RU content remain in the university catalogue.

Detailed evidence: docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md. Governing decisions: ADR-035 through ADR-037.

---

## App-wide multi-select and visual-question capability — owner clarification — 2026-11-17

**Scope decision:** these are shared app-engine capabilities, not an RU/RU-V-only feature. They must work consistently across all university/paper question packs, active bundled content, Publications & Books LibraryPacks and future imported sources. RU-V is only one content set that can exercise the feature.

- [x] Recorded the app-wide scope in ADR-033; the earlier RU-only interpretation is superseded.
- [x] Implement type-aware shared choice controls: radio for single-choice, checkbox/toggle for multiple-choice, with accessible labels and selection states (Phase B, commit `c5ca075`).
- [x] Support multi-answer selection, explicit Flash submission, Standard Exam/Custom Practice selection, array persistence and resume (Phase B, commit `c5ca075`).
- [x] Apply exact-set comparison by default and show selected/matched/missing/extra answers in review (Phase B, commit `c5ca075`; future official partial-marking rules remain source-dependent).
- [ ] Generalize question visual content across stems/options/explanations and all content sources; include static image/diagram assets and any structured math/diagram rendering the source inventory requires.
- [ ] Replace source-folder-specific asset indexing with a validated, offline-capable shared registry/build pipeline; reject missing or unbundled references.
- [x] Add shared multi-select regression/integration tests for question selection, scoring, persistence/resume and review (Phase B; 253/253 suite at commit).
- [x] Verify TypeScript, lint and Android Metro export for the current Phase C visual/asset changes (267/267 suite and Metro export passed; physical-device QA remains pending).
- [ ] Add real LibraryPack visual-content integration tests after a real LibraryPack is created in a later owner-led task.

Architecture decision: docs/DECISIONS.md — ADR-033. This work is independent of the RU-V one-book conversion and must not be scoped or tested only against RU data.

---

## Historical Publications & Books Library completion audit — 2026-11-17 (the current RU Library import is deferred)

**Status:** Phase 8 foundation is implemented; end-to-end Library feature is not complete.

- [x] Inspected Library routes, Home navigation, migration v8, LibraryPack schema/validator/importer and repository.
- [x] Confirmed current publishers are metadata-only; ASPECT has no books/questions and no actual LibraryPack is present.
- [x] Confirmed installLibraryPack() has no app UI/runtime caller; no configured ContentSource, catalogue host or CMS exists.
- [x] Verified 25 focused Library/content-manager/logo tests, typecheck and lint pass.
- [ ] Build exactly one RU-V LibraryPack with 17 test units and wire the chosen bundled/offline installation path.
- [ ] Implement app-wide multiple-select choices, Flash submit, answer-array persistence/resume and source-backed exact-set scoring.
- [ ] Generalize static Metro asset indexing/validation for all supported question-pack and LibraryPack figures; validate the complete offline asset bundle.
- [ ] Complete shared math/diagram rendering work, driven by the actual visual requirements of each content source.
- [ ] Complete Phase 8 owner/device visual QA.
- [ ] Decide/implement only the needed Phase 9 install/update/remove UX; Phase 10 backend/CMS remains optional/deferred.
- [ ] Fresh-install and existing-database upgrade QA before RU-V is moved from Varsity catalogue to ASPECT.

Detailed status: docs/audits/LIBRARY_IMPLEMENTATION_STATUS_AUDIT_2026-11-17.md.

---

## Historical RU-V → ASPECT source audit and proposal — implemented under ADR-039

**Historical status:** this records the initial source-audit and pre-implementation proposal checkpoint. The ASPECT Library integration is now implemented under ADR-039; current content and verification evidence are summarized at the top of this file and in `docs/RUV_ASPECT_IMPORT.md`.

- [x] Confirmed PDF identity/hash and 17 source-set occurrences represented by 15 RU-V JSON batches.
- [x] Reconciled per-set imported/excluded counts: 1,828 included + 154 excluded = 1,982 raw records.
- [x] Confirmed both 2024–25 source sets print Unit A; the active ASPECT staging uses Unit A. The old archived pack label remains part of immutable historical input and is not used for the Library hierarchy.
- [x] Recorded scan findings, selected source-checked extraction defects, 22 no-correct-option and six multiple-answer records.
- [x] Documented the owner clarification that multi-select, image/diagram rendering, offline Metro indexing and math rendering are app-wide capabilities, not RU-only requirements.
- [x] Historical owner direction identified RU-V's 17 sets as the only ASPECT content. The later execution is completed under ADR-039: one RU-V LibraryPack is now bundled separately under the ASPECT collection; old RU/Lokkho university packs remain archived/retired.
- [ ] Future source-quality task (deferred): visually verify RU-V included questions and 154 exclusions against the original PDF; this is not part of the current archive/removal task.
- [x] Existing external Lokkho archive was re-verified (44 packs / 4,009 questions / 45 assets; 90/90 SHA-256 entries pass). The later Phase D task removed the original app copies. No optional reuse audit or Muse comparison was required.
- [x] Preserve the 17-set source mapping and provenance in the separate RU-V archive/staging and the imported LibraryPack.
- [x] At this original audit checkpoint, RU-V LibraryPack creation/import was deferred. This deferral is historical and has since been completed under ADR-039.
- [x] Phase B app-wide multi-select implementation is committed; Phase C shared bitmap asset support has current automated checks recorded in the active handoff.
- [x] Test fresh-install and existing schema-v10 upgrade with both legacy RU pack families retired and RU-V delivered only through the ASPECT Library; preserve user history and keep both archives separate (tests/ru-retirement-migration.test.ts, 5/5).

Reports: docs/audits/RU_VERIFIED_QUESTION_BANK_SOURCE_AUDIT_2026-11-17.md and docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md.

---


## Android preview v0.1.6 — built, installed and owner-verified — 2026-11-13

**Status:** Complete for the current preview candidate. Owner reports the app installed and ran successfully; all previously reported Hero/theme/runtime issues are fixed and there are no outstanding app issues at this time.

- [x] EAS Android preview build `dcf1b743-ea08-4d27-b01f-82fe26374ffa` reached **FINISHED** (completed 2026-11-13 11:50:33 UTC / 17:50:33 Asia/Dhaka): https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/dcf1b743-ea08-4d27-b01f-82fe26374ffa.
- [x] APK artifact: https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk.
- [x] Owner installed and ran v0.1.6 / Android versionCode 7 and confirmed the earlier reported issues are resolved.
- [x] Final docs record the build result and owner verification; this finalization contains documentation changes only.
- Release identity remains `com.admissionbd.app`; EAS project/signing identity unchanged. No push was performed.
- The last two commits before this finalization (`2f1176b`, `6b7eeac`) contain documentation files only; their changed-path lists were checked and no application code/config/assets/tests changed.
- Cover remains a reference-derived 782×382 crop; its internal preview was owner-tested. Its provenance/rights note remains relevant before any public-store redistribution.

## ASPECT Science Master QB — extraction/import authorized — 2026-11-13

**Status:** READY FOR EXTRACTION AND IMPORT. Full owner permission is confirmed for digitisation, transcription, app storage, offline bundling and distribution in BD Admission App. Treat the book as approved project content; do not reopen a rights-review gate or stop for permission confirmation.

- [x] Confirmed existing ASPECT publisher ID `pub-aspect` and reviewed Phase 8 LibraryPack schema, validator, importer and app routes.
- [x] Inspected source metadata and rendered sample pages. Source is a 1,027-page image-based scan; Poppler rendering succeeds. OCR/text extraction must use rendered page images and page-by-page review.
- [x] Documented source SHA-256, source hierarchy plan, extraction ledger requirements, formula/figure/reference support work and import validation plan.
- [ ] Build full page/subject/topic inventory and extract all MCQs, answer markers, worked solutions, formulae, diagrams and printed references in resumable batches.
- [ ] Extend math, asset and reference UI as needed; create ASPECT LibraryPack(s), validate, import and run fresh SQLite/idempotency checks.
- [ ] Verify book browsing and question rendering on Android; update counts, QA and handoff after actual import.
- No questions have been transcribed or imported yet; no app code or APK was changed by the intake audit.

Detailed execution plan: `docs/audits/ASPECT_MASTER_QB_IMPORT_AUDIT_2026-11-13.md`.


## Home Hero runtime follow-up and Android preview v0.1.6 — implementation record (2026-11-13)

**Status:** Implementation and automated checks complete; EAS build and owner device verification are recorded in the completion section at the top. No push or Play Store submission.

- [x] Home Hero cover and native CTA composition implemented; previous button destinations and resume route preserved.
- [x] Profile Stat dark-theme foreground fixed without a global `Txt` change.
- [x] Provisional-only setup duplicate count query removed by reusing the read-only result; no question selection or scoring behavior changed.
- [x] Full tests: 240/240; TypeScript, lint, content check (217 packs / 13,609 questions), Expo public config, Android no-bytecode export and diff hygiene passed on Node 22.23.1.
- [x] Removed the unused ESLint-disable directive that produced the prior single lint warning; the touched file passes targeted ESLint.
- [x] Release metadata prepared and locally committed (`0c9e90f`): app/package/brand version 0.1.6, Android versionCode 7. App ID `com.admissionbd.app`, EAS project ID `16ba69b8-96d7-4856-a197-77acddebe1ec`, preview APK profile and EAS-managed signing remain unchanged.
- [x] EAS Android preview build `dcf1b743-ea08-4d27-b01f-82fe26374ffa` FINISHED and APK artifact published: https://expo.dev/artifacts/eas/YQKciJKyuDUM1AJVS8fRe3xqjnNz-k0xvT0MjSe7bD8.apk.
- [x] Owner installed and ran the preview; previous reported Hero/theme/runtime issues are fixed and no new issue is currently reported. Device model/OS and exhaustive per-screen coverage were not supplied.
- Cover remains a 782×382 crop from the owner-supplied reference; check its visual sharpness and confirm image usage rights before public distribution. See `assets/home/README.md`.


# Task state

## Optional Phases 9–10 — 2026-11-13

Phase 9: partially implemented (manifest validation, install/update planning, integrity contract using an injected SHA-256 hasher, pack installation, soft remove/restore; no concrete hasher, remote source, UI or downloader). Phase 10: deferred, contract documented only. Neither is deployed; the app stays fully offline. Details: docs/implementation/PHASE_09_ONLINE_OFFLINE.md, PHASE_10_BACKEND_CMS.md.

## Historical roadmap Phase 8 — Library foundation before RU-V bundled integration — 2026-11-13

**Historical status at that checkpoint:** publisher/book/unit screens and local LibraryPack contracts existed, but there was no real ASPECT book or bundled seed path yet. This gap is now closed for the RU-V source publication; physical-device verification and optional remote CMS/download management remain separate follow-ups.

- Done: library screens (Home entry, publisher sections, book/unit pages), importer/validator, book scope through Flash/Exam/Browse/history/result, SVG logo pipeline (react-native-svg), DU/RU/JU SVG + HSTU PNG logos.
- Owner: rebuild dev client; verify logos on device (light/dark); supply content packs and publisher SVGs; verify Bangla publisher names.

## Roadmap status (reconciled)

Phase 1–7: Implemented — Pending Owner Verification · Phase 8: Library foundation and RU-V ASPECT offline content delivery implemented; physical-device QA pending · Phase 9: Partially implemented — optional local contracts only; no remote source/UI/downloader · Phase 10: Deferred — contract documentation only; no backend/CMS deployed. Authoritative history: docs/implementation/IMPLEMENTATION_LOG.md; current Library audit: docs/audits/LIBRARY_IMPLEMENTATION_STATUS_AUDIT_2026-11-17.md.

## Roadmap Phase 7 — Home hero redesign — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Phase detail: docs/implementation/PHASE_07_HOME_HERO.md.

- Owner: visually check Home (light/dark, small screens, large fonts, with/without active exam).

## Roadmap Phase 6 — Settings & dark mode — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Phase detail: docs/implementation/PHASE_06_SETTINGS_DARK_MODE.md.

- Done: theme system, Settings screen, haptics/motion/text-size preferences, dark splash config.
- Owner: rebuild native app, test light/dark/system on device, review all screens in dark mode.

## Roadmap Phase 5 — Standard Exam improvements — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Phase detail: docs/implementation/PHASE_05_STANDARD_EXAM_IMPROVEMENTS.md.

- Migration v7 flagged column; flag writes guarded like selections and refused after finalization.
- Palette, flags, warnings, submit summary, per-subject breakdown, review filters, practice-missed, history headline.
- Owner verification pending: palette scroll on a 100-question exam, flag persistence after app kill, warnings, retry flow, Bangla text, migration v7.

## Roadmap Phase 4 — Configurable marking rules — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Phase detail: docs/implementation/PHASE_04_CONFIGURABLE_MARKING_RULES.md.

- Migration v6 (rule_profile_json, user_marking_profiles, marking_preferences) in src/db/schema.ts.
- Pure resolver/service src/services/markingProfiles.ts; repository src/repositories/marking.ts; picker, card and management screen; result-screen profile and pass-mark line.
- Automatic defaults never score Custom Practice or partial-official papers (ADR-028).
- Owner verification pending: device QA of profile CRUD, defaults, Flash/Standard/Custom flows, Bangla text, migration on an existing install.

## Roadmap Phase 3 — Shared subject selection — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Phase detail: docs/implementation/PHASE_03_SHARED_SUBJECT_SELECTION.md.

- Shared All / Single / Multiple subject selection implemented (subjectSelection.ts, SubjectSelector) and used by Flash, Custom Practice and generic Standard Exam; university paper section selection preserved.
- Validated `subjects` and `subject` route params; combined counts via one grouped query (countPoolBySubject); Custom Practice count/duration options derived from the selected pool.
- Selected subjects shown in history and result screens; 14 new translation keys.
- ESLint purity error fixed. Checks run: tsc, targeted ESLint, 19 focused tests. Deferred to owner: device testing of selector, Flash/Custom flows, Bangla rendering, full suite.

## Roadmap Phase 2 — University identity, logos, filters — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Phase detail: docs/implementation/PHASE_02_*.md.

- [x] Parent-university grouping (RU/RU-V, JU/JU-U, HSTU/HSTU-U) derived at read time; internal labels hidden.
- [x] UniversityLogo component (raster registry + monogram fallback); SVG vs raster evaluated, raster chosen.
- [x] Horizontal All|DU|RU|JU|HSTU filter bar on Varsity; merged paper list; university-level Flash/Exam scope via institutionIds.
- [ ] Owner: supply licensed logos; device QA of filter/navigation/Bangla names.


## Roadmap Phase 1 — Loading UI polish — 2026-11-13

**Status:** Implemented — Pending Owner Verification. Roadmap table: docs/implementation/IMPLEMENTATION_LOG.md; phase detail: docs/implementation/PHASE_01_LOADING_UI.md.

- [x] Validated audit §5.1 against code; kept commit 15f7602 behaviour.
- [x] Returning-launch escalation (1.5 s), Home-ready fallback (4 s), splash-matching setup first frame, ready hold 520/150 ms, delayed spinner (150 ms).
- [x] Policy tests extended (5/5 pass); targeted tsc/eslint run.
- [ ] Owner: device QA (first run, returning, content-update escalation, failure/retry, Reduce Motion, deep link, setup→Home recording), full test suite.
- Next (superseded 2026-11-13): Phase 2 was implemented afterwards — see the Phase 2 section above.

## HSTU verified-question promotion — 2026-11-12

**Status:** Imported into the normal HSTU catalogue; bundled seed and data integrity checks passed. No runtime logic changes and no push.

- [x] Used Claude's accepted HSTU verification ledger as the source of truth: 664 unique verified question IDs.
- [x] Promoted 657 questions from HSTU-U appearances into 15 papers under the existing HSTU institution; updated the 7 already attached to HSTU.
- [x] Applied all accepted answer mappings and set both existing question status fields to verified. One accepted single-answer correction was normalized to single-choice.
- [x] Preserved question IDs, stems, option IDs/text/order and source provenance. Left all 116 baseline pending questions unchanged; 3 off-baseline pending-ledger records were also untouched.
- [x] Backed up all 18 changed HSTU pack files before replacement.
- [x] Rebuilt the 217-pack / 13,609-question SQLite seed. Full test suite passed 142/142; typecheck, lint and content check passed.
- [x] SQLite quick_check passed; foreign-key check returned zero issues. All 664 ledger IDs and correct-option mappings reconcile; no pending question object changed.
- [x] Updated import, state, handoff, architecture, decision, QA and changelog documentation.
- [ ] Build/install a new APK and complete physical-device QA for this content update; not included in this import task.

## Startup UI targeted implementation — 2026-11-11

**Status:** Targeted code changes implemented and locally verified. No data/schema/dependency/app identity changes. Physical release-device visual QA remains pending.

- [x] First-run and error/retry paths retain the branded setup UI; returning cold launches skip it and keep the native splash during DB startup/content synchronization.
- [x] Returning classification releases the existing setup-layout gate directly, avoiding a deadlock when SetupScreen is not mounted.
- [x] Added a separate one-shot Home-ready gate; Home reports readiness only after its initial data-backed/error view has laid out.
- [x] First-run setup overlay waits for DB and Home readiness before the existing completion hold/fade, avoiding the second Home loading surface beneath the transition.
- [x] Added sequential native-driver checkmark opacity/scale animation (65 ms stagger / 180 ms duration) and preserved Reduce Motion. Existing loading visuals/progress math remain unchanged.
- [x] Added pure startup UI policy tests (3 new) and ran the full suite: 142/142 pass.
- [x] TypeScript, full lint, content:check and Android no-bytecode Metro export passed (1,853 modules, 3.5 MB JS, 123 assets).
- [x] Updated startup audit, architecture, decisions, QA, current-state, changelog and handoff documentation.
- [ ] Install a new release APK and verify fresh first-run, returning-launch, content-update launch, DB failure/retry, Reduced Motion, and setup-to-Home flash on the physical phone.

## Android v0.1.3 first-launch failure follow-up — v0.1.4 fix (2026-11-05)

**Status:** v0.1.4 source fix committed, EAS APK and embedded seed verified, and owner physical-phone verification confirmed successful. Two non-blocking follow-up notes are retained in docs/QA_CHECKLIST.md; no implementation is requested now.

- [x] Recorded owner-reported v0.1.3 / code 4 failure at the question-library import step. Previous embedded-DB checksum validation did not validate runtime materialization/copy and was not enough to call the APK ready.
- [x] Fixed invalid Expo File destination construction: convert expo-sqlite.defaultDatabaseDirectory raw absolute path to a file:/// URI before creating File; convert the URI back to an absolute SQLite path for ATTACH.
- [x] Use expo-file-system/legacy copyAsync for Android raw-resource-aware copying into the disposable SQLite sidecar.
- [x] Add path conversion tests and visible underlying error detail on the setup retry screen.
- [x] Bump app/brand/package to 0.1.4, Android versionCode 5; preserve package ID and signing identity.
- [x] Run 139 tests, typecheck, lint, seed/content check, whole-catalog validation, Expo config, Android prebuild and Android Metro export.
- [x] Committed the source fix and incident documentation locally as 8855821 (fix(android): correct bundled seed sidecar path); no push.
- [x] EAS v0.1.4 / code 5 build 040c75b2-0bbd-47b5-b859-cdb7f179f968 completed FINISHED; downloaded and verified the 117,408,124-byte APK and its embedded seed SHA/SQLite integrity.
- [x] Verify embedded seed payload hash matches source; ZIP integrity, SQLite quick_check, schema v5 and foreign-key check pass; catalogue has 217 packs / 13,609 questions.
- [!] Expo Doctor 20/21: single failed SDK patch alignment check for five packages; Gradle/APK build still passed. Align patch versions in a separate dependency maintenance task.
- [x] Owner reports that v0.1.4 was installed and verified successfully on the physical phone; overall app behavior is confirmed as expected.
- [x] Reviewed and committed the source fix locally as 8855821; subsequent EAS result and artifact verification were committed in follow-up documentation commits. This task adds only owner runtime notes and confirmation; no push.

## Historical seed startup release — v0.1.3 / Android versionCode 4 (owner-reported runtime failure)

- [x] Bumped package/brand/app version to `0.1.3` and Android versionCode to `4`, preserving package ID, Expo slug, project ID and EAS-managed signing credentials.
- [x] Replaced the hyphenated seed asset name with Android-compatible `content_seed.db`; Expo prebuild copies it into `android/app/src/main/assets/content_seed.db` with matching SHA-256 and valid SQLite integrity.
- [x] Replaced the hidden SQLite asset-import helper with public Expo Asset/File materialization and disposable sidecar handling.
- [x] Confirmed the exact `eas-build-pre-install` hook succeeds under Node 22.23.1 before package installation; generated native project directories are ignored so EAS runs managed prebuild from app config.
- [x] Final source checks: frozen install; 137/137 tests; typecheck; lint; 217 packs / 13,609 questions / 0 validation errors; content:check; benchmark; public Expo config; Android prebuild; Metro export and exported seed SQLite integrity.
- [x] Built the EAS internal APK successfully: build `37cb93c4-74d3-4cca-a708-8b6ee3e01bfd`, status `FINISHED`, completed 2026-11-05 13:32:51 UTC. [EAS build/install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/37cb93c4-74d3-4cca-a708-8b6ee3e01bfd) · [APK download](https://expo.dev/artifacts/eas/GbpVc5weeTUfrjGYtI-rQmizgW6eGG52y1xPM2kDdr8.apk), ~112 MiB.
- [x] Owner installed/tested v0.1.3 over the previous app; first question-library import failed on the physical phone. The replacement v0.1.4 verification is tracked in the current task at the top of this file.
- [x] Final local Git review and commit; never push.

## v0.1.2 Android correctness preview preparation — 2026-11-05

- [x] Confirmed the connected workspace, clean correctness branch and remote branch synchronization.
- [x] Verified EAS CLI authentication as sk_king13 and inspected Android build history; only v0.1.1/code 2 and v0.1.0/code 1 builds existed at the start of this task.
- [x] Bumped brand/app package version from 0.1.1 to 0.1.2 and Android versionCode from 2 to 3; retained com.admissionbd.app, Expo slug, EAS project ID and existing EAS-managed keystore.
- [x] Updated current-state, release, QA, handoff, README and changelog references to distinguish the historical v0.1.1 APK from this correctness branch.
- [x] Resolved Expo public config confirms version 0.1.2, Android versionCode 3, package ID, slug and EAS project ID; git diff --check passes.
- [x] Committed version/documentation preparation as c93c7f3; no push performed.
- [x] Built the v0.1.2 EAS preview APK: `af78b85f-7a2b-4fba-b693-532c7d218f8b` (FINISHED); its artifact and build details are recorded in `docs/ANDROID_RELEASE.md`. This APK predates the seed implementation.
- [ ] Owner installs APK and verifies profile persistence, math layout/accessibility, official/partial exam rules, custom practice and update-data preservation. Only then merge the implementation branch to main.

## Profile, math display and official-rule integrity — 2026-11-05

**Status:** Implementation and automated checks are complete; physical-device and source-content follow-up remains.

- [x] Profile-name save/read-back confirmation, blur/submit persistence, screen-leave draft fallback, duplicate-save guard and error path.
- [x] Remove internal question-pack import logs from the student profile.
- [x] Add display-only scientific notation rendering for questions/options and spoken accessibility labels; keep ambiguous expressions and canonical source text unchanged.
- [x] Extend the pack/database/session rule model for partial official component totals; prevent unknown scoring values from becoming zero.
- [x] Prevent exact paper sessions from inheriting global 100-question/60-minute defaults; add clearly labelled, explicitly user-configured, unscored Custom Practice when the exact pattern is unavailable.
- [x] Add official-source research for JU, RU and HSTU 2024–2025; add only partial facts to the matching JU/HSTU papers. RU facts are documented but not attached to non-matching aggregate third-party captures.
- [x] Add a read-only 217-pack content-quality audit report. Flags remain review candidates; no question/option text was modified without its original matching source.
- [ ] Physical Android UI QA for profile save/leave, math layout and screen reader rendering, partial-rule notices, custom mode and migration from a previously installed DB.
- [ ] Acquire exact source paper(s) to complete JU/HSTU paper coverage; match the official RU C-unit source to an exact original 80-question sitting before adding the official rule to app data.

## Seed-based startup and runtime resilience — 2026-11-05

**Historical status:** v0.1.3 was built and its embedded seed passed package integrity; the owner later reported first question-library import failure on the phone. See the current v0.1.4 follow-up at the top.

- [x] Replace runtime-loaded JSON pack modules with a generated SQLite seed plus committed manifest; keep canonical question JSON unchanged.
- [x] Build the seed from current migrations/importer; add deterministic manifest generation, Node 22 build hooks and GitHub CI content-build step.
- [x] Add read-only seed integrity checks for SQLite quick_check, foreign keys, schema/format, pack metadata/signatures/counts, source-derived table totals and empty user-owned tables. Add corruption/repair test.
- [x] Copy pending content via set-based SQL and bounded grouped transactions; commit batch signatures atomically, isolate a failed group per pack, preserve user-owned tables and resume uncommitted work on next launch.
- [x] Add single-flight AppState-aware retry coordinator, carry libraryComplete to provider state and retain retry-visible import warnings.
- [x] Replace JS-driven progress width animation with native-driver translateX; keep Reduce Motion and accessibility support. Reanimated APIs/plugin are not required for this transform.
- [x] Preserve app/font startup marks while resetting attempt-specific performance spans/counters.
- [x] Add and run build-script integrity tests and focused startup/repository tests; host benchmark recorded in docs/STARTUP_PERFORMANCE.md.
- [x] Update architecture, context, decision, QA, handoff, release/workflow and question-data documentation.
- [x] Run final full suite (**137/137**), typecheck, lint, whole-catalog validation (217 packs / 13,609 questions / 0 errors), read-only seed integrity check, host benchmark, resolved Expo config and Android no-bytecode export. Exported 3.5 MB JS bundle plus a hashed 24 MB SQLite asset; asset itself passes SQLite quick_check / FK / counts.
- [x] Superseded by the seed-based v0.1.3 / versionCode 4 EAS preview APK built successfully in the section above; v0.1.2 predates this asset path.
- [x] Owner installed/tested v0.1.3 over the previous app and reported that the first question-library import failed; replacement v0.1.4 phone verification remains open.

## Historical branded first-launch/startup setup UI — 2026-11-01 (JSON loader replaced 2026-11-05)

- [x] Audited startup lifecycle, bundle loading, provider gating, design tokens, localization and existing test conventions before implementation review.
- [x] Added the branded Bangla/English setup screen, five stages, real processed-pack progress, completion transition, retry state, accessibility progress semantics, responsive scrolling and Reduce Motion support.
- [x] Extracted the startup sequence/progress model into testable modules and added a deferred bundle loader. The loader is not called until the setup screen's first layout has completed.
- [x] Kept the database schema, question-pack payloads, importer transaction contract, practice/scoring logic and user-owned data model unchanged.
- [x] Fixed audit findings: replaced render-time Animated refs with state-held values; removed effect-time synchronous progress set; added a setup-layout gate fallback; clarified processed-vs-successful progress wording.
- [x] Added focused tests for startup progress, first/returning launch, failure/retry policy, saved-data preservation, localization and UI-before-bundle ordering.
- [x] Verified: `pnpm test` 76/76, `pnpm typecheck`, `pnpm lint`, and `pnpm exec expo export --platform android --no-bytecode` (2,058 modules / 22 MB JS / 122 assets).
- [x] Bumped app version to `0.1.1` and Android `versionCode` to `2`; validated resolved Expo config and retained package ID/signing credentials. Local commit: `8b7e79b`.
- [x] Built EAS internal preview APK `0.1.1 (versionCode 2)`; build ID `b4745dc4-0069-4a86-bb5b-234e5f377dfd`, status `FINISHED`. [Expo build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd) · [APK artifact](https://expo.dev/artifacts/eas/D9pljPNWvlCv1Z9QPKhyeDs0OKW8T5Bo-CmM53iFC30.apk).
- [ ] Install the completed APK and verify fresh-install and existing-install startup behavior on a physical Android device. The historical `v0.1.0-preview.1` APK predates this implementation.
- [ ] After the device review, continue with the separately deferred measured startup-performance work (import batching/signature optimization/background sync/seed DB only if justified).

## JU-U + HSTU-U unverified candidate-bank import — 2026-11-01

- [x] Audited the ZIP (102 JSON files); imported only 84 JU + 15 HSTU packs. Explicitly excluded the 3 `GST_CLUSTER` packs / 287 questions for a separate later task.
- [x] Added 99 packs / 5,773 questions as independent `JU-U` (84 / 5,011) and `HSTU-U` (15 / 762) catalogue identities. Existing verified JU/HSTU institutions and all 57 verified packs remain unchanged.
- [x] Preserved all 5,773 content statuses as `unverified`; answer states remain 5,563 `unverified` and 210 `unknown`. All 99 paper rules stay `unconfigured`.
- [x] Added namespaced batch/paper/rule/question/source IDs and updated all source/paper references. Round-trip comparison confirms all 99 packs retain exact source question/option/key/status/provenance data after reversing only identity remaps.
- [x] Added 5,502 provisional candidates (JU-U 4,780; HSTU-U 722); withheld 42 repeated-option records and all 19 multiple-choice items from provisional single-choice scoring.
- [x] Audited cross-bank overlap (12 exact text+ordered-option matches; 95 same stems with option differences); retained all source variants without auto-merging.
- [x] Added integration coverage for pack/status/reference integrity, 217-pack fresh SQLite import, verified/candidate catalogue separation, practice eligibility and idempotent re-import.
- [x] Completed EAS APK build `b4745dc4-0069-4a86-bb5b-234e5f377dfd` containing the JU/HSTU candidate banks and branded startup UI; [Expo install page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/b4745dc4-0069-4a86-bb5b-234e5f377dfd).
- [ ] Owner device installation and smoke verification remain pending. Production AAB/Google Play remains outstanding.


## JU + HSTU question-bank import — 2026-11-01

- [x] Audited the Muse archive, ZIP integrity, all JSON packs, app schema, importer, data indexer and existing data IDs. Did not repeat question/answer factual verification.
- [x] Imported 50 JU packs / 1,526 questions and 7 HSTU packs / 293 questions; excluded the 3 unrelated GST packs.
- [x] Resolved the shared JU source-document ID across 24 batches by deterministic batch namespacing; updated every affected source reference while preserving question/option/answer data and all individual verification fields.
- [x] Regenerated `src/content/bundledPacks.ts`: **118 packs / 7,836 questions**.
- [x] Added integration tests for 57 new packs, answer/content states, source/reference uniqueness, warning preservation, all-pack SQLite import and re-import idempotency.
- [x] Fresh SQLite import: 118/118 packs imported, zero failures; 7,836 questions / 31,344 options / 118 batches / 118 papers / 59 rules / 168 sources / 7,836 appearances / 5 institutions. New verified single-choice pool: 1,668.
- [x] Documented the HSTU historical coverage gap and, at the initial import checkpoint, kept all 57 JU/HSTU rules unconfigured. The 2026-11-05 source review now adds only partial facts to 3 JU and 5 HSTU records; no unsupported timed/scoring fields were invented.
- [ ] Owner device check after installing a newly built APK is still separate. Production AAB/Google Play remains outstanding.

## Android preview release and documentation sync — 2026-10-31

- [x] Merged GitHub PR #2; merge commit `3aa125d4e12cdca1702f976f20c1f60a765923d1`.
- [x] Confirmed GitHub Actions CI success for PR run [41109514896](https://github.com/itssourov13/bd-admission-app/actions/runs/41109514896) and `main` push run [41109555081](https://github.com/itssourov13/bd-admission-app/actions/runs/41109555081).
- [x] Built the EAS preview APK (build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`) and published public GitHub pre-release [`v0.1.0-preview.1`](https://github.com/itssourov13/bd-admission-app/releases/tag/v0.1.0-preview.1) with `BD.Admission.v0.1.0.apk`.
- [x] Owner-confirmed physical Android installation and device verification. Initial first load was about one minute; subsequent opens were about 2–3 seconds.
- [x] Audited and aligned README, current state, release guide, QA checklist, task state, handoff, branding and changelog with the live repository/release.
- [ ] Build and inspect the production AAB; prepare Play Console listing, required assets, privacy/data-safety declarations and production rollout.

## README Play Store-style showcase — 2026-10-31

- [x] Created three 1080×1920 (9:16) portrait JPEG graphics from the supplied runtime captures: Home, Varsity catalogue and Profile.
- [x] Added generated brand-themed background artwork and restrained Bangla headlines while keeping the app UI as the original captured pixels.
- [x] Replaced personal display-name text with a generic `Learner` label and integrated the assets into the root README.
- [x] Documented file paths, screen descriptions, sample-profile caveat and Play Console follow-up in `docs/BRANDING.md`.
- [x] Verified all three README paths and 1080×1920 RGB JPEG dimensions; 62/62 tests, TypeScript typecheck and Expo lint pass.
- [ ] Capture one more genuine runtime screen before assembling a complete high-resolution Google Play screenshot set; the current three assets are README showcase graphics only.

## Android build and CI setup — 2026-10-31
- [x] Added a GitHub Actions CI workflow for `main` pushes, PRs targeting `main`, and manual dispatch. CI runs frozen install, tests, typecheck, lint, Expo config validation and Android no-bytecode bundle export.
- [x] Authenticated EAS CLI session verified as `sk_king13`; created/linked EAS project `@sk_king13/bd-admission-app` with ID `16ba69b8-96d7-4856-a197-77acddebe1ec`.
- [x] Added `owner` and `extra.eas.projectId` to the dynamic Expo config; resolved Expo config and EAS project metadata checked successfully.
- [x] Added `eas.json` with internal preview APK and production AAB profiles; documented the repeatable release flow in `docs/ANDROID_RELEASE.md` and README.
- [x] Merged the CI/EAS configuration PR and confirmed the PR and `main` GitHub Actions runs succeeded.
- [x] Completed the EAS preview APK build and published the APK as the GitHub pre-release `v0.1.0-preview.1`.
- [x] Completed owner-reported physical-device installation and verification of the preview APK.
- [ ] Create and inspect a production AAB; Google Play listing, assets/privacy requirements and production rollout remain pending.

## Done
- [x] Independent project, branding, i18n, tab shell (earlier passes).
- [x] Node 22.23.1, pnpm install, lockfile, expo config.
- [x] SQLite schema + migrations + serialized adapter; provider with loading/error states.
- [x] Repositories (content, sessions, userData) and services (scoring, timer, flash, flashController, exam, practiceService, advice, importer, contentSync).
- [x] All essential screens and navigation (see CURRENT_STATE.md).
- [x] Flash Question and Standard Exam end to end with persistence and exactly-once scoring/finalization.
- [x] Import pipeline: validator, transactional importer, startup sync, pack index generator.
- [x] Tests: scoring, timers, Flash, exam, importer, migrations, repositories, validator, pack index, UI logic/translations.
- [x] TypeScript, ESLint (react-hooks compiler rules) and expo-doctor clean.
- [x] Science-first subject order/filtering in Browse and Flash setup, including honest zero-count/empty states; paper questions load by canonical subject order and printed order.
- [x] Standard Exam now presents all session questions in one virtualized scrollable list, grouped by canonical subject, with in-place answers, clear controls, persistent Submit, and a serialized answer-write queue drained before finalization.
- [x] Focused subject-order, source-order, subject-count and serialized-selection-queue tests; current checks: 54 tests, typecheck, lint and diff-check pass (see QA_CHECKLIST.md).

## Remaining (release follow-through)
- [x] Initial two real DU A Unit packs imported from the supplied 2024–2025 and 2025–2026 PDF scans; 90 questions per session, six subject banks per session, printed answer-key states retained. See docs/QUESTION_IMPORT_WORKFLOW.md.
- [x] Paper-specific exam-pattern runtime implemented: selected paper rules control question count, duration and optional subject selection. DU A Unit source-bank practice uses four complete 15-question sections; its pattern remains illustrative because the official 2025–2026 notice describes an MCQ + written test, not the scan’s MCQ-only mock.
- [x] Added database migration and pack schema support for optional section-selection configuration; preserved a 100-question/60-minute fallback for scopes without a selected paper pattern.
- [x] Android preview APK built, published and owner-verified on a physical device; the local hermesc SIGILL is only a limitation of the local host build path, not the EAS cloud release.
- [ ] Final app name, store assets, optional Engineering content.

## RU Unit A question intake (research-only checkpoint, 2026-10-29)
- [x] Researched A Unit sources and created a year-by-year ledger for 2010-2011 through 2026-2027.
- [x] Located twelve third-party session-specific A Unit PDF links for 2012-2013 through 2023-2024; a direct download probe was blocked by Drive-owner permissions. Two 2025-2026 Group 1/2 scans are archived locally.
- [x] Created eight A-only schema-v1 sample packs with 21 questions and per-question answer audit under `/home/kali/gpt-workspace/bd-admission-app-data/ru/`.
- [x] Removed B/C sample packs when scope narrowed to Unit A; validated the eight remaining packs and preserved unverified/unknown answers.
- [ ] Inspect 2010-2011/2011-2012 combined archive and map historical A1-A6 labels to the requested scope.
- [ ] Transcribe every question/option and source page for each accessible A Unit year; independently review answers and compare counts with the original paper.
- [ ] After review, copy an approved RU Unit A pack to `data/question-packs/`, regenerate the index and run import checks. No RU Unit A pack is bundled yet; the separate C Unit Science candidate batch is bundled for browse/review only.


## RU C Unit Science Group source collection (2026-10-29)
- [x] Created an isolated source workspace at `/home/kali/gpt-workspace/bd-admission-app-data/ru/science-unit-c/` with source/year ledger, scan hashes, source audit and import-readiness documentation.
- [x] Captured 44 paginated third-party Lokkho C Unit Science source variants for sessions 2010-2011 through 2025-2026; 4,185 records extracted and source-reported counts matched for 44/44 variants.
- [x] Created 44 full source-capture packs with 4,167 usable-option records; curated 44 Science-core schema-v1 candidates with 4,009 Physics/Chemistry/ICT/Biology/Higher Mathematics records in external `import-ready/lokkho/`. Held 158 other-subject-label records for historical review and logged 18 no-option records as excluded. No option or answer was fabricated.
- [x] Downloaded 45 image/SVG assets (2,356,641 bytes), recorded source/local SHA-256 metadata, and verified all 46 asset references resolve.
- [x] Ran the app pack validator against every external pack: 44/44 pass, 0 schema errors. Warnings correctly remain for unverified answers and 14 exact duplicate-option records.
- [x] Completed full-page and left/right-column machine OCR for all 84 indexed question/key pages in the separate third-party scan; OCR is preserved as unverified research aid only.
- [ ] Independently compare each question and every option with a matching original paper/reliable transcription; resolve 14 duplicate-option flags and question/source authenticity.
- [ ] Independently verify all 4,009 curated candidate answer keys from a reliable/official matching-session key; until then, every retained answer remains `unverified`. The provisional mode is only for practice against a possibly incorrect third-party key, not verified scoring.
- [x] Add local image/diagram support to the app renderer through a static PNG asset map; [ ] visually verify image-dependent questions on Android before marking them content verified.
- [ ] Obtain/review missing or restricted original paper sources, classify pages 205-265 of the compilation, and reconcile scan variants with the web-bank variants without merging distinct group/shift/set variants.
- [x] Import 44 RU C Unit Science candidate packs into `data/question-packs/`; all records retain unverified statuses and are excluded from the verified-only pool. The later provisional practice mode permits clearly warned source-key feedback for a safe subset. See the latest usability checkpoint below.
- [ ] Complete original-paper and answer-key review before promoting any candidates to scored practice.


## Pre-import progress audit — 2026-10-29
- [x] Rechecked repository status: `main` working tree clean; three local commits ahead of `origin/main`; no push performed.
- [x] Re-ran `pnpm test` (54 pass / 0 fail), `pnpm typecheck`, `pnpm lint`, `git diff --check`, and validators for both bundled DU packs (0 errors / 0 warnings each).
- [x] Reconciled the actual bundle against staged research: only the two DU A Unit packs are indexed. RU Unit A and RU C Unit remain external research/staging only.
- [ ] Highest-priority content gate: verify the RU C candidate questions/options against matching source papers, resolve 14 duplicate-option cases and 158 held subject labels, and independently verify answer keys before scored use.
- [ ] Implement and visually verify local question-image rendering before using image-dependent RU content.
- [ ] Complete real-device QA, use a compatible SDK 57 Expo Go/development build, and produce a native release build on a host where the local `hermesc` SIGILL does not block the build.


## RU C Unit Science year-by-year audit — 2026-10-29
- [x] Read-only audit index generated in isolated external folder, covering all 44 candidate packs / 4,009 candidate questions, per-session counts and source evidence.
- [x] Compared candidates against 300 questions across 20 partial SattAcademy snapshots and the existing OCR for 14 third-party scan variants; recorded 117 high-confidence same-year text matches, 35 answer-text mismatch review flags and 278 high-OCR-similarity leads.
- [x] SHA-256 comparison confirmed all 166 protected candidate/source/asset/PDF input files unchanged; no existing question file was changed, removed, moved or imported.
- [ ] Still unverified: every candidate question's original-paper provenance and all 4,009 answer keys. Similarity results are triage only, not approval.
- [ ] Review answer-text mismatch rows, 14 duplicate-option records, and 26 cross-variant repeated-stem groups against matching original papers/keys. Reconcile the 12 legacy year-register discrepancies separately without altering staged question files during the audit-only phase.


## Latest RU C Unit import checkpoint — 2026-10-29
- [x] Imported 44 RU C Unit Science candidate JSON packs, 4,009 questions, and 45 local PNG figures into the app; a later follow-up adds separately labelled provisional Flash/Standard practice without changing verification states.
- [x] Regenerated `src/content/bundledPacks.ts` with all 46 packs (44 RU C + 2 DU A) and added `question-assets:index` for Metro-compatible local asset mapping.
- [x] Rendered local question-level figures from QuestionCard without adding a runtime package.
- [x] Added integration coverage for pack counts, idempotent import, local asset integrity, preserved unverified states and no RU scoring rules; follow-up tests cover provisional Flash and 100-question Standard Exam paths and ensure duplicate-option items are withheld.
- [x] Verified all 46 JSON pack files (0 schema errors), `pnpm test` (55 passed), typecheck, lint, and Android no-bytecode bundle export.
- [ ] Review candidate question text/options and independently verify answer keys against matching original papers before promoting anything to verified/official scored practice.
- [ ] Android device QA for figure sizing and long Bangla/formula layout; native APK/AAB build remains outstanding.

## RU C provisional-practice usability checkpoint — 2026-10-29
- [x] Fixed the verified-only-only entry gap with an independent provisional pool; normal verified eligibility remains unchanged.
- [x] Provisional candidates require single-choice type, 2+ options, exactly one source key and no duplicate normalized option text. Actual RU pool: 3,991 available, 18 duplicate-option items withheld, zero verified-eligible.
- [x] Added BN/EN warnings and labels in setup, Flash feedback, Standard Exam, results/review, and institution/paper catalogue counts. All 4,009 question/content/key statuses remain unverified; RU rules remain unconfigured.
- [x] Added Flash and Standard integration tests proving provisional sessions can start, record source-key comparisons, retain the session marker and not invent RU scoring rules.
- [x] Latest checks under Node 22.23.1: `pnpm test` 57/57, `pnpm typecheck`, `pnpm lint`, `git diff --check` pass.
- [ ] On-device Expo Go smoke test for both modes, candidate figures/long-text layout, and result flow; rerun bundle/export on compatible Node before native build.
- [ ] Independently verify source-paper transcription and every answer key; build/test a release APK/AAB on a host compatible with Hermes. No release artifact or push is claimed.


## RU verified-source bank import — 2026-10-29
- [x] Imported the user-supplied `RU Question Bank.pdf` into a completely separate Varsity institution (`ru-verified-bank`, code `RU-V`), with 15 paper/set packs and 1,815 MCQ records from source pages covering 2016–2017 through 2024–2025.
- [x] Preserved source PDF SHA-256 and per-question source page/question-number provenance. The original PDF and import artifacts are outside the app repo under `/home/kali/gpt-workspace/bd-admission-app-data/ru-verified-question/`.
- [x] Set new question content status to `verified` per the user's instruction. 1,720 explicit source answer markers map to options; 95 absent/unreadable answer markers remain `unknown`, with no guessed key. 118 incomplete/non-choice extraction blocks are recorded in the external exclusion CSV.
- [x] Prefixed the original RU institution label with `UNVERIFIED —`; retained all 44 old RU packs and their 4,009 question records without changing question/option/answer content. Earlier questions are not deleted.
- [x] Regenerated the index with 61 packs / 6,004 question records. Added integration coverage for pack validation, source hashes/provenance, distinct RU IDs, counts, answer states, idempotent import and a 100-question Standard Exam from the new institution.
- [ ] Physical Android QA and native release build remain outstanding. Do not infer official RU-specific time, marking or unit question-count rules from the PDF; general Standard Exam uses the existing fallback.


## RU Question Bank verified-source rebuild and replacement — 2026-10-30

- [x] Resumed the complete 156-page OCR workspace and verified ocr/DONE; extraction workspace now has 156/156 OCR text pages.
- [x] Audited 1,982 extracted records across 17 exam blocks. Flagged 36 [WRITTEN Part] items separately and assigned a source-subject mapping to every structurally complete import candidate.
- [x] Rebuilt the 15 RU-V packs from the user-confirmed PDF/source data. **1,799 questions** are included with four non-empty A/B/C/D options, exactly one mapped key, contentVerificationStatus: verified, and answerVerificationStatus: verified. No imported RU-V question is tagged unverified/unknown.
- [x] Preserved 1,666 old question IDs where the page/printed-number locator was unique; assigned 162 deterministic IDs where entries were new or the source locator was ambiguous. Source page, printed question number, paper/set and subject are retained.
- [x] Excluded 183 incomplete/non-MCQ records with reasons in external EXCLUSION_MANIFEST.csv: 36 written-part, 90 incomplete option count, 25 blank extracted option text, 22 X/no-correct-option, 7 multi-letter answer markers, 3 missing answer markers. No text or answer was fabricated.
- [x] Replaced the previous 15 RU-V JSON packs, preserving the older RU C candidate dataset and both DU packs. The previous RU-V pack files and old bundle index are backed up outside the repo. New packs set replaceExistingPaperContent: true; transactional import removes only old active appearances for those 15 RU-V paper IDs and preserves question rows/bookmarks/session answer history.
- [x] Added pack schema/type/validator support for the optional replacement flag and added importer replacement logic plus tests for preserving historical bookmarks and session answers.
- [x] Rebuilt src/content/bundledPacks.ts: 61 packs / 5,988 questions total (180 DU + 4,009 RU C candidates + 1,799 RU-V verified-source questions).
- [x] Verification under Node 22.23.1: pnpm test 60/60, pnpm typecheck passed, pnpm lint passed, pnpm packs:index bundled 61 packs, all 61 packs validate with 0 errors / 4,052 warnings.
- [x] Added external build/reconciliation/exclusion/warning reports and updated schema, import workflow, README and QA documentation.
- [ ] This 2026-10-30 question-bank rebuild checkpoint still had detailed figure/long-text device review open; the 2026-10-31 Android preview build and owner smoke test were completed later (see the release summary at the top of this file). The local Hermes SIGILL remains a host-specific limitation of the local bytecode-export path.
- Push is intentionally not performed. Local commit is pending final verification.


## RU verified-source import — final corrected structure (2026-10-30)

This entry supersedes the earlier same-day 1,799-question and 1,827-question intermediate build checkpoints above.

- [x] Rebuilt the 15 RU-V packs with **1,828 verified source records**. This preserves all answer-marker semantics that the schema can represent: 1,800 single-choice keys, 22 `X`/no-correct-option records (`answerDisposition: no_correct_option`, empty correct-option list), and 6 complete multi-letter keys as verified multiple-choice records.
- [x] Every imported RU-V question is `contentVerificationStatus: verified` and `answerVerificationStatus: verified`; zero RU-V questions are unknown/unverified. All have four non-empty A/B/C/D options and mapped subjects/source page provenance.
- [x] The existing single-choice Flash/Standard eligible set is **1,800**; 22 no-correct-option and 6 multiple-choice items remain verified/browsable but are not coerced into that single-choice practice pool.
- [x] Exclusion manifest corrected to **154 records**: 36 written-part items, 90 incomplete option sets, 26 records with missing extracted option text, and 2 missing answer markers. Thirty source records with repeated option text are reported separately, not silently edited.
- [x] Final bundle: 61 packs / **6,017 questions** (180 DU + 4,009 original RU C candidates + 1,828 RU-V). The original RU C candidate bank and DU packs remain unchanged.
- [x] Final full test suite: **62/62 passed** under Node 22.23.1, including no-correct-option/multiple-choice validator tests, the recovered page-137 Q4/B regression, and replacement/history preservation tests.
- [x] Re-ran typecheck, lint, diff-check and validation across all 61 packs after the final code changes; Android no-bytecode JS export also passed (1,896 modules / 12 MB / 122 assets). Full suite: 62/62. Final diff review and local commit completed separately; do not push.
- [ ] Detailed RU C figure, long-Bangla/formula and individual practice-flow checks remain separate follow-up QA items; the standalone preview APK build and owner-reported device smoke test were completed on 2026-10-31.


## Android preview release — completion record
- [x] EAS preview cloud build completed; build ID `d5e516cd-eefe-44f4-866d-b440ef188da9`.
- [x] APK uploaded to GitHub pre-release `v0.1.0-preview.1` as `BD.Admission.v0.1.0.apk`; asset checksum and size are recorded in `docs/ANDROID_RELEASE.md`.
- [x] Owner installed and verified the APK on a physical Android device; first load about one minute, subsequent opens about 2–3 seconds.
- [x] PR #2 merged and both PR CI and `main` push CI runs succeeded.
- [ ] Build/inspect the production AAB and complete the Google Play listing, privacy/testing requirements and rollout.


## Home hero runtime audit — 2026-11-13

**Status:** Audit complete; implementation still pending. See `docs/audits/HOME_HERO_RUNTIME_AUDIT.md`.

- [x] Reviewed all three supplied Android screenshots and traced the Profile Stat foreground and Home CTA styling defects.
- [x] Confirmed NativeWind 4.2.7 + callback-valued Pressable styles are the reason CTA style objects are not applied; confirmed the original routes and labels remain wired.
- [x] Compared HomeHero with the earlier Phase 7 commit and measured the current university mark assets; no existing landscape cover asset/registry found.
- [x] Full suite: 234/234 pass under Node 22.23.1.
- [ ] Follow-up implementation: static NativeWind CTA classes, explicit Stat foreground + regression coverage, new 1024×500 Home cover, compact responsive hero and real-device verification.
- Audit only: no app source/config/build changes; no push.

## RU unit naming and HSTU logical-paper consolidation — 2026-11-16

**Status:** Implemented; full test suite, typecheck, lint and generated-seed integrity checks pass. Detailed results: docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md.

- [x] Changed only the two RU-V 2024–25 Science catalogue labels/titles to C Unit. Retained the printed A source title and provenance note; left exam rules unconfigured and all other RU sessions unchanged.
- [x] Consolidated all five HSTU 2024–25 normal-paper pairs under existing canonical A/B shift IDs; retained all 34 unique verified questions and source/answer records.
- [x] Preserved the canonical partial verified totalMarks=100 rule; removed only duplicate unconfigured HSTU alias rules; kept HSTU-U pending records and HSTU unassigned papers separate.
- [x] Added scoped replaceExistingPaperIds support to validation, importer, seed builder and content build checks so a pack referencing a shared canonical paper only replaces IDs it owns.
- [x] Added SQLite migration v9 for existing installs; tests confirm old appearances and active session filters are rehomed while question records, bookmarks, session answers, result snapshots and rule-profile snapshots remain intact.
- [x] Focused catalogue tests and full test suite pass; content check validates 217 packs / 13,609 questions and the generated v9 seed has clean SQLite/FK integrity.
- [ ] Owner: cross-check the five consolidated HSTU question ranges against the original source PDFs.
- [ ] Build and install a new Android preview when ready so migration v9 reaches the device; no APK was built in this task.

Report: docs/audits/RU_UNIT_NAMING_AND_HSTU_PAPER_GROUPING_AUDIT_2026-11-16.md.

## Historical Phase 12 checkpoint — pre-Phase C/D implementation — 2026-11-17

This final section records an earlier state before Phase C commit fe86f53 and Phase D. It is historical only. The completed implementation, archive locations, schema-v11 behavior and QA are recorded in the completed owner task at the top of this file and in docs/CURRENT_STATE.md.


## Android v0.1.10 preview delivery — 2026-11-18

- [x] Bumped brand / package version `0.1.9` → `0.1.10` and Android `versionCode 9` → `10`; preserved package ID and EAS project identity.
- [x] Selected EAS `preview` / `INTERNAL` APK, not production AAB.
- [x] Local release gates passed; EAS accepted preview upload and created build `64584a92-b1c7-4353-86ef-894152c94550` ([build page](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/64584a92-b1c7-4353-86ef-894152c94550)). Monitoring stopped at submission confirmation as requested; cloud completion is not claimed.
- [ ] Owner physical-device install/update and RU content smoke test remain pending.


## README and Android showcase refresh — 2026-11-18

- [x] Replaced the long README with a concise, branded product overview and four-screen showcase.
- [x] Added the 1600×560 README banner and four 1080×1920 Android screenshot graphics from the owner-provided captures.
- [x] Moved the extended product/engineering details into `docs/APP_OVERVIEW.md` and visual asset provenance into `docs/README_VISUALS.md`.
- [x] Verified local README/doc links, image dimensions, image files, whitespace and scoped Git diff. No app source, question packs, runtime, dependencies or release metadata changed.

## CU A Unit staging and third-pass review — pre-import checkpoint — 2026-11-19

- [x] Reviewed all 721 clean Tier-A prior-pass AI candidates across Physics, Higher Mathematics, Chemistry, English, Bangla, Biology and ICT.
- [x] Promoted 708 clean third-pass results to `answerVerificationStatus: verified` under the owner-approved two-AI + owner manual + third-pass standard; retained 13 ambiguity/notation/corruption cases as `unverified`. No answer mappings or question/option text were changed.
- [x] At third-pass completion, content fields remained at their inherited 1,630 verified / 928 unverified snapshot values. After the owner confirmed Muse AI had already verified all source question content, the final package was corrected to 2,558 content verified / 0 unverified; answer statuses remain 2,185 verified / 373 unverified.
- [x] Revalidated all 26 packs: zero errors / 337 warnings. Fresh SQLite dry-run accepted all 26; 2,558 questions / 11,397 options / 68 sources; foreign-key check zero; idempotent second import skipped 2,558. Post-correction dry-run predicates: 2,185 verified-eligible / 307 answer-review candidates.
- [x] Updated external package README, third-pass decision ledger, final report, import-readiness report, transformation summary and checksum/ZIP artifacts.
- [x] Updated current-state, workflow, task, changelog and handoff documentation; ran full test/typecheck/lint and diff checks.
- Historical checkpoint: app-source import was pending at the time this staging report was written. The subsequent Varsity import, regenerated seed and final checks are recorded in the completed CU task at the top of this file. The phone database and APK were not directly edited by the source-import step.

Final report: `/home/kali/gpt-workspace/bd-admission-app-data/CU/CU_Science_AI_Import_Ready_2026-11-19/reports/THIRD_PASS_AI_KEY_REVIEW.md`.
