import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { freshDb } from "./helpers.ts";
import { installCatalogEntry, planCatalog, removeInstalledBook, restoreInstalledBook, validateManifest, verifyPackIntegrity, listInstalledBooks } from "../src/services/contentManager.ts";
import { getBook } from "../src/repositories/library.ts";
import type { CatalogEntry, ContentSource } from "../src/types/content-catalog.ts";

const sha = async (t: string) => createHash("sha256").update(t).digest("hex");

/** SYNTHETIC fixture only (test- ids). */
function packText(version = 1): string {
  return JSON.stringify({
    schemaVersion: 1, kind: "library",
    publisher: { id: "pub-udvash", slug: "udvash", name: "Udvash" },
    book: { id: "test-cat-book", title: "Synthetic Catalogue Book", language: "en", targetCategory: "varsity", contentType: "question_bank", verificationStatus: "verified", contentVersion: version, licenseStatus: "owner_created" },
    sourceDocuments: [{ id: "test-cat-doc", filename: "x.json", sourceType: "structured-data" }],
    units: [{ id: "test-cat-u1", kind: "chapter", title: "Ch 1", sortOrder: 1 }],
    questions: [{ id: "test-cat-q1", text: "Synthetic?", type: "single_choice", category: "varsity", options: [{ id: "a", text: "A", order: 1 }, { id: "b", text: "B", order: 2 }], correctOptionIds: ["a"], answerVerificationStatus: "verified", contentVerificationStatus: "verified", unitIds: ["test-cat-u1"], source: { documentId: "test-cat-doc", pageNumber: 1, questionNumber: 1 } }]
  });
}
async function entryFor(text: string, version = 1): Promise<CatalogEntry> {
  return { bookId: "test-cat-book", publisherId: "pub-udvash", title: "Synthetic Catalogue Book", contentVersion: version, packRef: "ref", sha256: await sha(text), sizeBytes: new TextEncoder().encode(text).length, licenseStatus: "owner_created" };
}
const sourceOf = (text: string | Error): ContentSource => ({ id: "fake", fetchManifest: async () => { throw new Error("unused"); }, fetchPack: async () => { if (text instanceof Error) throw text; return text; } });

test("manifest validation accepts a well-formed catalogue and rejects bad hashes/duplicates", async () => {
  const e = await entryFor(packText());
  assert.equal(validateManifest({ schemaVersion: 1, kind: "catalogue", generatedAt: "2026-11-13", entries: [e] }).valid, true);
  const bad = validateManifest({ schemaVersion: 1, kind: "catalogue", generatedAt: "x", entries: [{ ...e, sha256: "zz" }, e, e] });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.some((m) => m.includes("sha256")) && bad.errors.some((m) => m.includes("duplicated")));
});

test("plan: install, update, reinstall, up-to-date and installed-newer", async () => {
  const e = await entryFor(packText(2), 2);
  assert.equal(planCatalog([e], [])[0].action, "install");
  assert.equal(planCatalog([e], [{ id: e.bookId, contentVersion: 1, installState: "installed" }])[0].action, "update");
  assert.equal(planCatalog([e], [{ id: e.bookId, contentVersion: 2, installState: "removed" }])[0].action, "reinstall");
  assert.equal(planCatalog([e], [{ id: e.bookId, contentVersion: 2, installState: "installed" }])[0].action, "up_to_date");
  assert.equal(planCatalog([e], [{ id: e.bookId, contentVersion: 3, installState: "installed" }])[0].action, "installed_newer");
});

test("integrity check detects tampering and size mismatch", async () => {
  const text = packText(); const e = await entryFor(text);
  assert.deepEqual(await verifyPackIntegrity(text, e, sha), { ok: true });
  assert.equal((await verifyPackIntegrity(text + " ", e, sha)).ok, false);
  assert.equal((await verifyPackIntegrity(text.replace("Synthetic?", "Synthetic!"), e, sha)).reason, "hash");
});

test("catalogue install is verified, offline failures change nothing, removal is soft and restorable", async () => {
  const db = await freshDb();
  const text = packText(); const e = await entryFor(text);

  const offline = await installCatalogEntry(db, sourceOf(new Error("network down")), e, sha);
  assert.equal(offline.ok, false); assert.equal(offline.ok === false && offline.stage, "fetch");
  assert.equal(await getBook(db, e.bookId), null);

  const tampered = await installCatalogEntry(db, sourceOf(text.replace("Synthetic?", "Tampered!")), e, sha);
  assert.equal(tampered.ok === false && tampered.stage, "integrity");
  assert.equal(await getBook(db, e.bookId), null);

  const mismatch = await installCatalogEntry(db, sourceOf(text), { ...e, contentVersion: 2 }, sha);
  assert.equal(mismatch.ok === false && mismatch.stage, "format");

  const ok = await installCatalogEntry(db, sourceOf(text), e, sha);
  assert.equal(ok.ok, true);
  assert.equal((await getBook(db, e.bookId))?.installState, "installed");
  assert.equal((await listInstalledBooks(db))[0].questionCount, 1);

  assert.equal(await removeInstalledBook(db, e.bookId), true);
  assert.equal((await getBook(db, e.bookId))?.installState, "removed");
  assert.equal(await restoreInstalledBook(db, e.bookId), true);
  assert.equal((await getBook(db, e.bookId))?.installState, "installed");
  const row = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM questions WHERE id = 'test-cat-q1'");
  assert.equal(Number(row?.n), 1);
});
