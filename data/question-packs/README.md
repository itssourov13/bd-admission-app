# Question pack input directory

Place reviewed, versioned question-pack JSON files in this directory when the import workflow is ready to consume them.

The repository currently contains no real historical admission question content. Do not add unverified answers or represent synthetic development fixtures as official questions.

Before importing a pack, validate it with the validator documented in docs/QUESTION_IMPORT_WORKFLOW.md. The app's SQLite runtime importer and transaction strategy will be implemented in the next application implementation phase.
