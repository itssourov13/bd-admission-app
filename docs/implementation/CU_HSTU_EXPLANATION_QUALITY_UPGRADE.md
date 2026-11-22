# CU + HSTU verified explanation quality upgrade

Date: 2026-11-23  
Status: content authoring, reconciliation, generated-content validation, typecheck and full test suite complete; HSTU content is committed locally in this checkpoint.

## Scope and editing rules

Reviewed active app question packs for Chittagong University (CU) and Hajee Mohammad Danesh Science and Technology University (HSTU). Added clear, reasoned explanations only to records whose answer verification status was already verified.

No question text, options, option order, correct-option IDs, verification states, source identifiers, pack metadata, exam rules or app logic were changed. Unverified records were left untouched. Where a verified stem, key or option set was ambiguous, corrupted or scientifically/grammatically inconsistent, its stored key was preserved and the question was deferred with a reason rather than silently repaired.

## Final explanation coverage

| University | Subject | Verified rows | With explanation |
|---|---|---:|---:|
| CU | Physics | 492 | 486 |
| CU | Chemistry | 477 | 465 |
| CU | Biology | 230 | 224 |
| CU | Higher Mathematics | 408 | 382 |
| CU | Bangla | 227 | 218 |
| CU | English | 333 | 308 |
| CU | ICT | 18 | 17 |
| **CU total** | | **2,185** | **2,100** |
| HSTU | Physics | 244 | 228 |
| HSTU | Chemistry | 234 | 208 |
| HSTU | Biology | 154 | 145 |
| HSTU | Higher Mathematics | 49 | 44 |
| HSTU | Mathematics | 25 | 22 |
| HSTU | English | 232 | 202 |
| HSTU | ICT | 1 | 1 |
| **HSTU total** | | **939** | **850** |
| **Combined** | | **3,124** | **2,950** |

The remaining 174 verified rows are represented by 173 unique deferred groups: CU has 84 groups covering 85 rows (one exact duplicate row), and HSTU has 89 groups covering 89 rows.

## Deferral themes

The deferred set includes non-unique grammar/vocabulary alternatives; missing underlines, diagrams, units or mathematical grouping; OCR-corrupted wording/formulae; missing experimental conditions; multiple scientifically defensible interpretations; and stored answer keys that conflict with the printed options or standard derivation.

Deferral means the original question and key remain unchanged and no new explanation was added. The exact question IDs, evidence and batch provenance are maintained in the external explanation workspace at reports/DEFERRED.jsonl; concise review notes are in reports/REVIEW_FLAGS.md.

## Integrity verification

- CU content commit: f1cd865 (content(cu): complete verified explanation upgrade).
- CU explanation-only verification against its pre-upgrade baseline passed.
- HSTU verification against ledger baseline 2,100 passed: 850 changed unique IDs matched 850 new ledger entries; final explanation text matched the latest ledger entry; all changed records remained verified; non-explanation field changes were zero.
- Deferred reconciliation found no verified question group missing both an explanation and a documented deferral; no stale deferred question IDs remained.
- No app logic, schema, exam marking, question source, answer key or verification status changes were part of this task.
- HSTU pack changes and final generated-content/type/test validation are being completed separately from the already-committed CU checkpoint. No push has been made.

