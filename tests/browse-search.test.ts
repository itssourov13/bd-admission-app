import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import { listPaperQuestionIds } from "../src/repositories/content.ts";
import { likePattern, normalizeSearch, SEARCH_MAX_CHARS } from "../src/repositories/search.ts";

test("browse search: term normalisation is bounded and wildcard-safe", () => {
  assert.equal(normalizeSearch(undefined), null);
  assert.equal(normalizeSearch(" a "), null);
  assert.equal(normalizeSearch("  ab   cd "), "ab cd");
  assert.equal(normalizeSearch("x".repeat(500))!.length, SEARCH_MAX_CHARS);
  assert.equal(likePattern("50%_off\\"), "%50\\%\\_off\\\\%");
  assert.equal(likePattern("তড়িৎ"), "%তড়িৎ%");
});

test("browse search: filters paper questions by text, composes with subject, and treats wildcards literally", async () => {
  const db = await freshDb();
  const pack = syntheticPack({}, 4);
  pack.questions[0].text = "Newton law of motion";
  pack.questions[0].subject = "Physics";
  pack.questions[1].text = "Ohm law of current";
  pack.questions[1].subject = "Physics";
  pack.questions[2].text = "Rate is 50% of base";
  pack.questions[2].subject = "Chemistry";
  pack.questions[3].text = "বলবিদ্যা ও গতি";
  pack.questions[3].subject = "Physics";
  assert.equal((await importQuestionPack(db, pack)).ok, true);
  const p = "paper-syn-2025";
  assert.equal((await listPaperQuestionIds(db, p, 20, 0)).length, 4);
  assert.deepEqual((await listPaperQuestionIds(db, p, 20, 0, undefined, "LAW")).sort(), [pack.questions[0].id, pack.questions[1].id].sort());
  assert.deepEqual(await listPaperQuestionIds(db, p, 20, 0, "Chemistry", "law"), []);
  assert.deepEqual(await listPaperQuestionIds(db, p, 20, 0, undefined, "50%"), [pack.questions[2].id]);
  assert.deepEqual(await listPaperQuestionIds(db, p, 20, 0, undefined, "গতি"), [pack.questions[3].id]);
  assert.equal((await listPaperQuestionIds(db, p, 20, 0, undefined, "%%")).length, 0);
  assert.equal((await listPaperQuestionIds(db, p, 20, 0, undefined, "a")).length, 4, "too-short term is ignored");
  assert.equal((await listPaperQuestionIds(db, p, 1, 1, undefined, "law")).length, 1, "limit/offset still apply");
});
