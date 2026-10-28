# Question-pack data schema (version 1)

This is the contract for question batches extracted from user-provided historical question PDFs. A pack is data input, not application code. No real historical pack is bundled in this foundation.

## Top-level object
- schemaVersion: integer, currently 1.
- batch: stable batch id, category, optional description and an array of sourceDocumentIds.
- sourceDocuments: original file metadata, stable ID, filename, source type and optional SHA-256 hash.
- institutions: stable institution ID, code and official display name.
- papers: paper ID, institution ID, category, year, and optional academic session/unit/title.
- examRules: optional paper-specific marking and duration settings with verification status and source references.
- questions: stable question ID, text/type/category, ordered options, correct-answer state, paper appearances, primary source/page/number, optional explanation and optional local asset paths.

## Question content
Question type is single_choice or multiple_choice. Options have stable IDs and explicit 1-based order. Never assume every source has exactly four options. Preserve Unicode/Bangla text and original option order. A verified single-choice answer must identify exactly one existing option. An unknown or unverified answer may be null and must not be guessed.

Each question's appearances array references every supported paper where that question is verified to have appeared. An appearance includes paperId and, when known, questionNumber, pageNumber and sourceDocumentId. The primary source object references a sourceDocuments entry. Similar wording alone does not authorize deduplication.

## Verification states
- answerVerificationStatus: verified, unverified or unknown.
- contentVerificationStatus: verified or unverified.
- examRules.verificationStatus: verified, illustrative or unconfigured.

Unknown values stay unknown. An illustrative rule can support a clearly labelled local preview but must not be represented as an official university marking scheme.

## Example shape (synthetic structure only)

    {
      "schemaVersion": 1,
      "batch": {
        "id": "batch-example-not-historical",
        "category": "varsity",
        "sourceDocumentIds": ["source-example"]
      },
      "sourceDocuments": [{
        "id": "source-example",
        "filename": "example.pdf",
        "sourceType": "pdf"
      }],
      "institutions": [{
        "id": "fictional-institution",
        "code": "TEST",
        "name": "Fictional Test Institution"
      }],
      "papers": [{
        "id": "fictional-paper",
        "institutionId": "fictional-institution",
        "category": "varsity",
        "year": 2025
      }],
      "examRules": [],
      "questions": []
    }

This sample illustrates data structure only, contains no historical questions and has an intentionally empty question list.

## Import expectations
Use stable source IDs and external identities for idempotency. Validate every relationship before writing. Import source records and content in one transaction; report inserted, updated, skipped and rejected records. Preserve previous source appearances, attempts, answers, bookmarks and profile records. See QUESTION_IMPORT_WORKFLOW.md.
