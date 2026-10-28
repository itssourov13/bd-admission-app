# Question import workflow

## Current preparation
The version-1 question-pack contract and a standalone validator are present. A runtime SQLite importer is not yet implemented. Real question PDFs will be supplied in later batches, often separately by institution/category.

## Validate a pack
Run from the project root:

    node scripts/validate-question-pack.mjs path/to/question-pack.json

The command reports pass/fail and error/warning totals. Errors return a non-zero exit code. Warning states, such as a non-verified answer or an empty pack, must be reviewed before import.

## Required pipeline for the implementation phase
1. Preserve the original user-supplied PDF outside public app assets and keep an immutable source copy.
2. Extract questions/options and keep a record of source filename, page number, original question number, paper/year/unit and extraction uncertainty.
3. Verify question text, option order, answer key and official exam reference. Do not infer an answer when no reliable key exists.
4. Generate version-1 JSON following QUESTION_DATA_SCHEMA.md; keep uncertain facts unverified.
5. Validate structure, identifiers, relationships, option references, year/page/number values, and answer/scoring state.
6. Review warnings and produce a human-readable import report.
7. Import using a single SQLite transaction with stable IDs/upsert rules. Roll back the whole batch after an unexpected write failure.
8. Preserve past practice attempts and bookmarks when the content pack is updated.
9. Verify per-batch record counts, paper/source appearances, answer state, option ordering and duplicate behavior.
10. Record batch identity, source-file hash when available, validation outcome, import timestamp and resulting row counts.

## Idempotency and duplicate handling
Re-importing the same batch must not create duplicate questions or source appearances. A similar-looking question from a different paper should not be merged automatically. Keep appearance/source provenance separate from question content and require an explicit review to merge or correct content.

## Image/diagram questions
Store referenced assets in local app content packs with stable relative paths. Validate every referenced asset before importing and include it in offline packaging. Do not depend on remote image URLs at question-render time.

## Current status
Validator implementation and targeted validator tests are present. Extracting real PDFs, runtime import transactions, SQLite schema integration, image packaging and post-import verification are still pending.
