const categories = new Set(["varsity", "medical", "engineering"]);
const answerStatuses = new Set(["verified", "unverified", "unknown"]);
const contentStatuses = new Set(["verified", "unverified"]);
const ruleStatuses = new Set(["verified", "illustrative", "unconfigured"]);
const sourceTypes = new Set(["pdf", "image", "structured-data", "other"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}
function addUniqueIds(items, path, errors, getId = (item) => item?.id) {
  const seen = new Set();
  if (!Array.isArray(items)) {
    errors.push(path + " must be an array.");
    return;
  }
  items.forEach((item, index) => {
    const id = getId(item);
    if (!nonEmpty(id)) {
      errors.push(path + "[" + index + "] needs a non-empty id.");
    } else if (seen.has(id)) {
      errors.push(path + " contains duplicate id: " + id + ".");
    } else {
      seen.add(id);
    }
  });
}

export function validateQuestionPack(pack) {
  const errors = [];
  const warnings = [];
  if (!isObject(pack)) return { valid: false, errors: ["The root must be a JSON object."], warnings };

  if (pack.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (!isObject(pack.batch)) errors.push("batch must be an object.");
  else {
    if (!nonEmpty(pack.batch.id)) errors.push("batch.id is required.");
    if (!categories.has(pack.batch.category)) errors.push("batch.category must be varsity, medical, or engineering.");
    if (!Array.isArray(pack.batch.sourceDocumentIds)) errors.push("batch.sourceDocumentIds must be an array.");
  }

  const collections = ["sourceDocuments", "institutions", "papers", "examRules", "questions"];
  for (const key of collections) {
    if (!Array.isArray(pack[key])) errors.push(key + " must be an array.");
  }
  if (errors.length) return { valid: false, errors, warnings };

  for (const key of collections) addUniqueIds(pack[key], key, errors);

  const sourceIds = new Set(pack.sourceDocuments.map((item) => item?.id).filter(nonEmpty));
  const institutionIds = new Set(pack.institutions.map((item) => item?.id).filter(nonEmpty));
  const paperIds = new Set(pack.papers.map((item) => item?.id).filter(nonEmpty));

  for (const [index, source] of pack.sourceDocuments.entries()) {
    const at = "sourceDocuments[" + index + "]";
    if (!nonEmpty(source?.filename)) errors.push(at + ".filename is required.");
    if (!sourceTypes.has(source?.sourceType)) errors.push(at + ".sourceType is invalid.");
    if (source?.sha256 != null && !/^[a-f0-9]{64}$/i.test(source.sha256)) errors.push(at + ".sha256 must be a 64-character hexadecimal hash when supplied.");
  }

  for (const id of pack.batch.sourceDocumentIds ?? []) {
    if (!sourceIds.has(id)) errors.push("batch references unknown source document: " + id + ".");
  }
  if ((pack.batch.sourceDocumentIds ?? []).length === 0) warnings.push("Batch has no source document references.");

  for (const [index, institution] of pack.institutions.entries()) {
    const at = "institutions[" + index + "]";
    if (!nonEmpty(institution?.code)) errors.push(at + ".code is required.");
    if (!nonEmpty(institution?.name)) errors.push(at + ".name is required.");
  }

  for (const [index, paper] of pack.papers.entries()) {
    const at = "papers[" + index + "]";
    if (!institutionIds.has(paper?.institutionId)) errors.push(at + ".institutionId references an unknown institution.");
    if (!categories.has(paper?.category)) errors.push(at + ".category is invalid.");
    if (!Number.isInteger(paper?.year) || paper.year < 1900 || paper.year > 2100) errors.push(at + ".year must be an integer between 1900 and 2100.");
  }

  for (const [index, rule] of pack.examRules.entries()) {
    const at = "examRules[" + index + "]";
    if (!paperIds.has(rule?.paperId)) errors.push(at + ".paperId references an unknown paper.");
    if (!ruleStatuses.has(rule?.verificationStatus)) errors.push(at + ".verificationStatus is invalid.");
    for (const field of ["correctMarks", "incorrectPenalty", "unansweredMarks"]) {
      if (rule?.[field] != null && (typeof rule[field] !== "number" || !Number.isFinite(rule[field]) || rule[field] < 0)) {
        errors.push(at + "." + field + " must be a finite non-negative number.");
      }
    }
    for (const field of ["durationSeconds", "totalQuestions"]) {
      if (rule?.[field] != null && !positiveInteger(rule[field])) errors.push(at + "." + field + " must be a positive integer.");
    }
    if (rule?.verificationStatus === "verified" &&
        (typeof rule.correctMarks !== "number" || typeof rule.incorrectPenalty !== "number" || typeof rule.unansweredMarks !== "number")) {
      errors.push(at + " is marked verified but does not define all scoring values.");
    }
    for (const sourceId of rule?.sourceDocumentIds ?? []) {
      if (!sourceIds.has(sourceId)) errors.push(at + " references an unknown source document: " + sourceId + ".");
    }
  }

  for (const [index, question] of pack.questions.entries()) {
    const at = "questions[" + index + "]";
    if (!nonEmpty(question?.text)) errors.push(at + ".text is required.");
    if (!categories.has(question?.category)) errors.push(at + ".category is invalid.");
    if (!["single_choice", "multiple_choice"].includes(question?.type)) errors.push(at + ".type must be single_choice or multiple_choice.");
    if (!answerStatuses.has(question?.answerVerificationStatus)) errors.push(at + ".answerVerificationStatus is invalid.");
    if (!contentStatuses.has(question?.contentVerificationStatus)) errors.push(at + ".contentVerificationStatus is invalid.");
    if (!Array.isArray(question?.options) || question.options.length < 2) {
      errors.push(at + " must have at least two options.");
      continue;
    }
    const optionIds = new Set();
    const optionOrders = new Set();
    for (const [optionIndex, option] of question.options.entries()) {
      if (!nonEmpty(option?.id)) errors.push(at + ".options[" + optionIndex + "].id is required.");
      else if (optionIds.has(option.id)) errors.push(at + " has duplicate option id " + option.id + ".");
      else optionIds.add(option.id);
      if (!nonEmpty(option?.text)) errors.push(at + ".options[" + optionIndex + "].text is required.");
      if (!positiveInteger(option?.order)) errors.push(at + ".options[" + optionIndex + "].order must be a positive integer.");
      else if (optionOrders.has(option.order)) errors.push(at + " has duplicate option order " + option.order + ".");
      else optionOrders.add(option.order);
    }
    if (!Array.isArray(question.appearances) || question.appearances.length === 0) {
      errors.push(at + " must preserve at least one paper appearance.");
    } else {
      for (const [appearanceIndex, appearance] of question.appearances.entries()) {
        const aAt = at + ".appearances[" + appearanceIndex + "]";
        if (!paperIds.has(appearance?.paperId)) errors.push(aAt + ".paperId references an unknown paper.");
        if (appearance?.questionNumber != null && !positiveInteger(appearance.questionNumber)) errors.push(aAt + ".questionNumber must be positive when supplied.");
        if (appearance?.pageNumber != null && !positiveInteger(appearance.pageNumber)) errors.push(aAt + ".pageNumber must be positive when supplied.");
        if (appearance?.sourceDocumentId != null && !sourceIds.has(appearance.sourceDocumentId)) errors.push(aAt + " references an unknown source document.");
      }
    }
    if (!isObject(question.source) || !sourceIds.has(question.source.documentId)) {
      errors.push(at + ".source.documentId must reference a known source document.");
    } else {
      if (question.source.pageNumber != null && !positiveInteger(question.source.pageNumber)) errors.push(at + ".source.pageNumber must be positive when supplied.");
      if (question.source.questionNumber != null && !positiveInteger(question.source.questionNumber)) errors.push(at + ".source.questionNumber must be positive when supplied.");
    }
    if (question.correctOptionIds != null && !Array.isArray(question.correctOptionIds)) {
      errors.push(at + ".correctOptionIds must be an array or null.");
    } else if (Array.isArray(question.correctOptionIds)) {
      for (const id of question.correctOptionIds) {
        if (!optionIds.has(id)) errors.push(at + " references unknown correct option " + id + ".");
      }
      if (new Set(question.correctOptionIds).size !== question.correctOptionIds.length) errors.push(at + " contains duplicate correct option IDs.");
    }
    if (question.answerVerificationStatus === "verified" &&
        (!Array.isArray(question.correctOptionIds) || question.correctOptionIds.length === 0)) {
      errors.push(at + " cannot have a verified answer without at least one correct option.");
    }
    if (question.type === "single_choice" && Array.isArray(question.correctOptionIds) && question.correctOptionIds.length > 1) {
      errors.push(at + " is single_choice but lists multiple correct options.");
    }
    if (question.answerVerificationStatus !== "verified" && Array.isArray(question.correctOptionIds) && question.correctOptionIds.length > 0) {
      warnings.push(at + " has answer options but its answer is not marked verified.");
    }
    for (const appearance of question.appearances ?? []) {
      const relatedPaper = pack.papers.find((paper) => paper?.id === appearance?.paperId);
      if (relatedPaper && question.category !== relatedPaper.category) warnings.push(at + " category differs from paper " + relatedPaper.id + ".");
    }
  }

  if (pack.questions.length === 0) warnings.push("This pack contains no questions; no historical content will be imported.");
  return { valid: errors.length === 0, errors, warnings };
}
