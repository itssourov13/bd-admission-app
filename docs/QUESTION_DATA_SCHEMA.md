# Question-pack data schema — version 1

This document describes the implemented JSON contract used to import historical admission question batches. A pack is data input, not application code. **No real historical pack is bundled yet.** The current repository has a validator, transactional importer, startup sync and pack-index generator.

## Top-level shape

A QuestionPack has schemaVersion: 1 and these fields:

| Field | Meaning |
|---|---|
| schemaVersion | Required integer. The current supported version is 1. |
| batch | Required stable batch ID, category, optional description and source-document ID list. |
| sourceDocuments | Required array of source metadata records. |
| institutions | Required array of institution IDs, codes and display names. |
| papers | Required array of institution-linked paper/year/session/unit metadata. |
| examRules | Required array; it may be empty. Rules can carry scoring/duration metadata and verification state. |
| questions | Required array; it may be empty for a structurally valid pack. |

The validator checks the schema version, identifiers, relationships, options, correct-answer references, appearances and rule status before an import can proceed. Invalid packs must be corrected before being indexed.

## Source documents

Each source document requires:

- id: stable ID used by references in the same pack.
- filename: source filename.
- sourceType: pdf, image, structured-data or other.

Optional metadata includes title, sha256 and notes. Preserve the original supplied PDF and its filename. A hash is useful for identifying the immutable source copy, but must represent the actual file.

## Institutions and papers

Each institution has id, code and name. Use a stable institution ID and a unique institution code.

Each paper has id, institutionId, category, and numeric year. category is varsity, medical or engineering. Optional fields are academicSession, unit and title.

institutionId must reference a declared institution. Keep each paper/year/unit/session identity and official naming traceable to the supplied source rather than guessing missing metadata.

## Exam rules and score provenance

Each rule requires id, paperId and verificationStatus. The status is verified, illustrative or unconfigured. Optional values include correctMarks, incorrectPenalty, unansweredMarks, durationSeconds, totalQuestions, sourceDocumentIds and sourceNote.

- A verified scoring rule must contain the complete scoring values required by the validator.
- Keep supporting source-document references or a note so the rule can be audited.
- Unknown or unverified rules must not be promoted to official rules.
- An illustrative rule is never to be presented as an official institution marking scheme.

## Question records

Each question requires id, text, type, category, options, correctOptionIds, answerVerificationStatus, contentVerificationStatus, appearances and source.

- type: single_choice or multiple_choice.
- category: varsity, medical or engineering.
- subject and topic are optional.
- Each option has id, text and a numeric order. Preserve the original option order; do not assume every paper uses exactly four options.
- correctOptionIds is an array of option IDs or null. Verified single-choice questions must point to exactly one existing option.
- answerVerificationStatus: verified, unverified or unknown.
- contentVerificationStatus: verified or unverified.
- appearances records each paper where the question appeared. Each appearance requires paperId and may include questionNumber, pageNumber and sourceDocumentId.
- source requires documentId and may include pageNumber and questionNumber.
- explanation and local assetPaths are optional.

Question, option, appearance, paper and source IDs must be stable within the batch and all references must resolve. Preserve multiple verified appearances of a question. Similar wording alone is not grounds to deduplicate or merge question records.

## Which questions are eligible for practice?

The current Flash/Standard practice pool is restricted to questions that have a **verified answer**, use the **single-choice** format, have at least two options, and identify at least one valid correct option. The schema can describe multiple-choice questions, but that does not mean the current practice engine supports them as eligible questions.

A missing or uncertain answer must remain missing/uncertain. Never infer an official answer from memory or from an unverified key.

## Synthetic structure example

The example below shows shape only; it is not a historical admission question:

    {
      "schemaVersion": 1,
      "batch": {
        "id": "batch-example-not-historical",
        "category": "varsity",
        "sourceDocumentIds": ["source-example"]
      },
      "sourceDocuments": [
        {
          "id": "source-example",
          "filename": "example.pdf",
          "sourceType": "pdf"
        }
      ],
      "institutions": [
        {
          "id": "fictional-institution",
          "code": "TEST",
          "name": "Fictional Test Institution"
        }
      ],
      "papers": [
        {
          "id": "fictional-paper",
          "institutionId": "fictional-institution",
          "category": "varsity",
          "year": 2025
        }
      ],
      "examRules": [],
      "questions": []
    }

This is a synthetic structural example with an intentionally empty question list. Do not ship it as historical content.

## Import and update semantics

1. Validate the pack before import; validation errors must block the import.
2. Import content and source relationships transactionally.
3. Report meaningful inserted/updated/skipped/rejected counts and keep validation warnings visible for review.
4. Re-importing the same pack must be idempotent and must not duplicate questions or source appearances.
5. Preserve attempts, answers, bookmarks and profile data when a pack updates.
6. A write failure must roll back the batch instead of leaving partial content.

See QUESTION_IMPORT_WORKFLOW.md for the operational process, pack-index command and required human review steps.
