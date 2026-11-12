import { licenseAllowsContent } from "../features/library/model.ts";

export interface LibraryValidation { valid: boolean; errors: string[]; warnings: string[] }

const ID = /^[A-Za-z0-9._:-]{1,80}$/;
const OPTION_ID = /^[A-Za-z0-9._-]{1,16}$/;
const LANGS = ["bn", "en", "mixed"];
const TARGETS = ["varsity", "medical", "engineering", "general"];
const CATEGORIES = ["varsity", "medical", "engineering"];
const CONTENT_TYPES = ["book", "question_bank", "model_test", "mixed"];
const VERIFICATION = ["verified", "unverified", "metadata_only"];
const LICENSES = ["licensed", "public_domain", "owner_created", "permission_pending", "metadata_only"];
const UNIT_KINDS = ["chapter", "unit", "section", "test"];
const PUBLISHER_KINDS = ["publisher", "coaching", "institution", "community"];
const MAX_ERRORS = 50;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/**
 * Structural + legal validation of a library pack. Pure (no database). Errors block installation; warnings do not.
 * The licence gate is deliberate: content may only be installed when its licence status says it may be shipped.
 */
export function validateLibraryPack(pack: unknown): LibraryValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => { if (errors.length < MAX_ERRORS) errors.push(m); };
  if (!isObj(pack)) return { valid: false, errors: ["Pack must be an object."], warnings };
  if (pack.schemaVersion !== 1) err("schemaVersion must be 1.");
  if (pack.kind !== "library") err('kind must be "library".');

  const pub = pack.publisher;
  if (!isObj(pub)) err("publisher is required.");
  else {
    if (typeof pub.id !== "string" || !ID.test(pub.id)) err("publisher.id is invalid.");
    if (typeof pub.slug !== "string" || !/^[a-z0-9-]{1,60}$/.test(pub.slug)) err("publisher.slug must be lowercase letters, digits and hyphens.");
    if (!nonEmpty(pub.name)) err("publisher.name is required.");
    if (pub.kind !== undefined && !PUBLISHER_KINDS.includes(String(pub.kind))) err("publisher.kind is invalid.");
  }

  const book = pack.book;
  let bookOk = false;
  if (!isObj(book)) err("book is required.");
  else {
    bookOk = true;
    if (typeof book.id !== "string" || !ID.test(book.id)) err("book.id is invalid.");
    if (!nonEmpty(book.title)) err("book.title is required.");
    if (!LANGS.includes(String(book.language))) err("book.language is invalid.");
    if (!TARGETS.includes(String(book.targetCategory))) err("book.targetCategory is invalid.");
    if (!CONTENT_TYPES.includes(String(book.contentType))) err("book.contentType is invalid.");
    if (!VERIFICATION.includes(String(book.verificationStatus))) err("book.verificationStatus is invalid.");
    if (!LICENSES.includes(String(book.licenseStatus))) err("book.licenseStatus is invalid.");
    if (!Number.isInteger(book.contentVersion) || (book.contentVersion as number) < 1) err("book.contentVersion must be an integer >= 1.");
    if (book.publicationYear != null && (!Number.isInteger(book.publicationYear) || (book.publicationYear as number) < 1900 || (book.publicationYear as number) > 2100)) err("book.publicationYear is out of range.");
  }

  const docs = Array.isArray(pack.sourceDocuments) ? pack.sourceDocuments : (err("sourceDocuments must be an array."), []);
  const docIds = new Set<string>();
  for (const d of docs as unknown[]) {
    if (!isObj(d) || typeof d.id !== "string" || !ID.test(d.id) || !nonEmpty(d.filename)) { err("A source document is missing a valid id or filename."); continue; }
    if (docIds.has(d.id)) err(`Duplicate source document id ${d.id}.`);
    docIds.add(d.id);
  }

  const units = Array.isArray(pack.units) ? pack.units : (err("units must be an array."), []);
  const unitIds = new Set<string>();
  const parents = new Map<string, string | null>();
  for (const u of units as unknown[]) {
    if (!isObj(u) || typeof u.id !== "string" || !ID.test(u.id)) { err("A unit has no valid id."); continue; }
    if (unitIds.has(u.id)) err(`Duplicate unit id ${u.id}.`);
    unitIds.add(u.id);
    if (!nonEmpty(u.title)) err(`Unit ${u.id} has no title.`);
    if (!UNIT_KINDS.includes(String(u.kind))) err(`Unit ${u.id} has an invalid kind.`);
    if (!Number.isInteger(u.sortOrder)) err(`Unit ${u.id} needs an integer sortOrder.`);
    parents.set(u.id, typeof u.parentId === "string" ? u.parentId : null);
  }
  for (const [id, parent] of parents) {
    if (parent !== null && !unitIds.has(parent)) err(`Unit ${id} references missing parent ${parent}.`);
    // Cycle check: walking up must terminate.
    let cursor: string | null = id; let steps = 0;
    while (cursor !== null && steps++ <= parents.size) cursor = parents.get(cursor) ?? null;
    if (cursor !== null) { err(`Unit ${id} is part of a parent cycle.`); break; }
  }

  const questions = Array.isArray(pack.questions) ? pack.questions : (err("questions must be an array."), []);
  if (bookOk) {
    const b = book as Record<string, unknown>;
    const hasQuestions = (questions as unknown[]).length > 0;
    if (hasQuestions && !licenseAllowsContent(b.licenseStatus as never)) {
      err("Question content may only be installed when licenseStatus is licensed, public_domain or owner_created.");
    }
    if (hasQuestions && b.verificationStatus === "metadata_only") err("A pack with questions cannot have verificationStatus metadata_only.");
    if (!hasQuestions && b.verificationStatus !== "metadata_only") warnings.push("Pack has no questions; it will be recorded as catalogue metadata only.");
    if (hasQuestions && (units as unknown[]).length === 0) err("A pack with questions needs at least one unit.");
  }

  const qIds = new Set<string>();
  let unverified = 0;
  for (const q of questions as unknown[]) {
    if (!isObj(q) || typeof q.id !== "string" || !ID.test(q.id)) { err("A question has no valid id."); continue; }
    if (qIds.has(q.id)) err(`Duplicate question id ${q.id}.`);
    qIds.add(q.id);
    if (!nonEmpty(q.text)) err(`Question ${q.id} has no text.`);
    if (q.type !== "single_choice" && q.type !== "multiple_choice") err(`Question ${q.id} has an invalid type.`);
    if (!CATEGORIES.includes(String(q.category))) err(`Question ${q.id} has an invalid category.`);
    const opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length < 2) err(`Question ${q.id} needs at least two options.`);
    const optIds = new Set<string>(); const orders = new Set<number>(); const texts = new Set<string>();
    for (const o of opts as unknown[]) {
      if (!isObj(o) || typeof o.id !== "string" || !OPTION_ID.test(o.id) || !nonEmpty(o.text) || !Number.isInteger(o.order)) { err(`Question ${q.id} has an invalid option.`); continue; }
      if (optIds.has(o.id)) err(`Question ${q.id} repeats option id ${o.id}.`);
      if (orders.has(o.order as number)) err(`Question ${q.id} repeats an option order.`);
      optIds.add(o.id); orders.add(o.order as number);
      const norm = o.text.trim().toLowerCase();
      if (texts.has(norm)) warnings.push(`Question ${q.id} has duplicate option text.`);
      texts.add(norm);
    }
    const correct = q.correctOptionIds;
    if (correct !== null && correct !== undefined) {
      if (!Array.isArray(correct) || correct.some((c) => typeof c !== "string" || !optIds.has(c))) err(`Question ${q.id} lists a correct option that does not exist.`);
      else if (q.type === "single_choice" && correct.length > 1) err(`Question ${q.id} is single_choice but lists several correct options.`);
    }
    if (q.answerVerificationStatus === "verified") {
      const none = q.answerDisposition === "no_correct_option";
      if (!none && (!Array.isArray(correct) || correct.length === 0)) err(`Question ${q.id} is answer-verified but has no correct option.`);
    } else if (q.answerVerificationStatus === "unverified" || q.answerVerificationStatus === "unknown") unverified++;
    else err(`Question ${q.id} has an invalid answerVerificationStatus.`);
    if (q.contentVerificationStatus !== "verified" && q.contentVerificationStatus !== "unverified") err(`Question ${q.id} has an invalid contentVerificationStatus.`);
    const qUnits = Array.isArray(q.unitIds) ? q.unitIds : [];
    if (qUnits.length === 0) err(`Question ${q.id} must belong to at least one unit.`);
    for (const uid of qUnits) if (typeof uid !== "string" || !unitIds.has(uid)) err(`Question ${q.id} references missing unit ${String(uid)}.`);
    if (!isObj(q.source) || typeof q.source.documentId !== "string" || !docIds.has(q.source.documentId)) err(`Question ${q.id} references a missing source document.`);
  }
  if (unverified > 0) warnings.push(`${unverified} question(s) have unverified or unknown answers; they are practised only as provisional candidates.`);
  return { valid: errors.length === 0, errors, warnings };
}
