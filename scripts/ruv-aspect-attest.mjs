#!/usr/bin/env node
// Records the owner's verification attestation (2026-11-18) in data/library-packs/ruv-aspect-library-pack.json.
//   node scripts/ruv-aspect-attest.mjs           apply (idempotent) and write the pack
//   node scripts/ruv-aspect-attest.mjs --check   write nothing; exit 1 when the pack is not in the attested state
//
// The owner reviewed the imported questions and their source-printed answers and instructed that the imported
// source answers are the source of truth. This script applies exactly that, and nothing more:
//   - option ids, option order and question text are never changed;
//   - no key is solved or invented (one printed marker is restored, see RESTORE);
//   - items whose printed key is contradicted by the printed working stay unverified and unscored.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACK = join(repo, "data", "library-packs", "ruv-aspect-library-pack.json");
const ATTESTED_ON = "2026-11-18";
const CONTENT_VERSION = 2;

// Printed-marker conflicts (see docs/ASPECT_OWNER_VERIFICATION.md). Decisions are evidence-based:
//  - RESTORE: the printed working agrees with the printed marker once an extraction-lost glyph (a square-root sign) is
//    accounted for: sqrt(3*R*32/32) = sqrt(3R); option c = sqrt(3R); printed marker c.
//  - HOLD: the printed working contradicts the printed marker (c = 25 is option b, marker is c = sqrt(15)), or resolving it
//    needs the original page image (vector problem, sign of the k component). The key stays withheld.
const RESTORE = new Map([["aspect-ru-vq-2017-2018-h-all-p139-e14-p140-c0-s00-q007-r1", ["c"]]]);
const HOLD = new Set([
  "aspect-ru-vq-2022-2023-c-all-p044-q012-p056-n0136",
  "aspect-ru-vq-2021-2022-c-all-p067-q065-p087-n0226"
]);

const SESSION_BN = {
  "2024-2025": "সেশন ২০২৪-২০২৫", "2023-2024": "সেশন ২০২৩-২০২৪", "2022-2023": "সেশন ২০২২-২০২৩", "2021-2022": "সেশন ২০২১-২০২২",
  "2020-2021": "সেশন ২০২০-২০২১", "2019-2020": "সেশন ২০১৯-২০২০", "2018-2019": "সেশন ২০১৮-২০১৯", "2017-2018": "সেশন ২০১৭-২০১৮",
  "2016-2017": "সেশন ২০১৬-২০১৭"
};

export function attest(pack) {
  const out = structuredClone(pack);
  const counts = { verified: 0, noCorrectOption: 0, restored: 0, held: 0, multiple: 0 };
  for (const q of out.questions) {
    if (RESTORE.has(q.id)) { q.correctOptionIds = [...RESTORE.get(q.id)]; counts.restored++; }
    if (HOLD.has(q.id)) {
      q.correctOptionIds = [];
      q.answerDisposition = "source_conflict";
      q.answerVerificationStatus = "unverified";
      q.contentVerificationStatus = "unverified";
      counts.held++;
      continue;
    }
    if (q.answerDisposition === "no_correct_option") counts.noCorrectOption++;
    else if (q.correctOptionIds.length === 0) throw new Error("Unexpected keyless question " + q.id);
    if (q.type === "multiple_choice") counts.multiple++;
    q.answerVerificationStatus = "verified";
    q.contentVerificationStatus = "verified";
    counts.verified++;
  }
  for (const u of out.units) {
    if (u.kind === "section" && !u.titleBn) {
      const m = /^Session (\d{4}-\d{4})$/.exec(u.title);
      if (m && SESSION_BN[m[1]]) u.titleBn = SESSION_BN[m[1]];
    }
  }
  const b = out.book;
  b.contentVersion = CONTENT_VERSION;
  b.verificationStatus = "verified";
  b.licenseStatus = "licensed";
  b.licenseNote = "Owner confirmed on " + ATTESTED_ON + " that the publication, logo and related use permissions have been obtained.";
  b.rightsReference = "Owner attestation recorded " + ATTESTED_ON + ". No written permission document is stored in the repository; the rights holder is not identified in the inspected source PDF.";
  b.rightsReviewedOn = ATTESTED_ON;
  b.sourceNote = "Source: RU Question Bank.pdf (ASPECT collection). The publisher/imprint is not identified in the inspected source PDF, so the book keeps the not-identified publisher attribution and is presented under its ASPECT collection.";
  b.coverageNote = "17 printed Rajshahi University admission-test source sets (2016-17 to 2024-25) transcribed from RU Question Bank.pdf. Owner attestation (" + ATTESTED_ON + "): the owner reviewed the imported questions and their source-printed answers and designated the imported source answers as the source of truth; this is not an independent solving of the keys or a university-certified key. " + counts.noCorrectOption + " questions print no correct option (verified source disposition, never scored), " + counts.multiple + " are multiple-answer (exact-set scoring) and " + counts.held + " questions whose printed key conflicts with the printed working are held unverified and unscored. 154 extracted records remain excluded from this book.";
  out.sourceDocuments[0].notes = "Publisher and rights holder not identified in the source. Owner attestation " + ATTESTED_ON + ": imported questions and source-printed answers reviewed by the owner and accepted as the source of truth; permissions confirmed by the owner.";
  return { pack: out, counts };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const text = readFileSync(PACK, "utf8");
  const { pack, counts } = attest(JSON.parse(text));
  const next = JSON.stringify(pack, null, 1);
  const same = text === next;
  if (process.argv.includes("--check")) {
    if (!same) { console.error("Pack is not in the attested state; run node scripts/ruv-aspect-attest.mjs"); process.exit(1); }
    console.log(JSON.stringify({ attested: true, ...counts }));
  } else {
    if (!same) writeFileSync(PACK, next);
    console.log(JSON.stringify({ written: !same, ...counts }));
  }
}
