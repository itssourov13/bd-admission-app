import test from "node:test";
import assert from "node:assert/strict";
import { freshDb, syntheticPack } from "./helpers.ts";
import { importQuestionPack } from "../src/services/importer.ts";
import {
  cleanInstitutionName, groupInstitutions, universityDisplayName, universityKeyOf, universityShortName
} from "../src/features/catalog/universities.ts";
import { scopeFromParams, scopeParams } from "../src/features/navigation/links.ts";
import { countEligible, listInstitutions, listPapers, listPapersByInstitutions } from "../src/repositories/content.ts";

const inst = (id: string, code: string, name: string, papers = 1, eligible = 0) =>
  ({ id, code, name, paperCount: papers, questionCount: papers * 10, eligibleCount: eligible, reviewCandidateCount: 0 });

test("variant institution codes collapse to one parent university", () => {
  assert.equal(universityKeyOf("RU-V"), "ru");
  assert.equal(universityKeyOf("JU-U"), "ju");
  assert.equal(universityKeyOf("HSTU-U"), "hstu");
  assert.equal(universityKeyOf("DU"), "du");
  assert.equal(universityKeyOf("CU"), "cu");
  assert.equal(universityShortName("RU-V"), "RU");
  assert.equal(universityShortName("ku-u"), "KU");
});

test("grouping merges variants, sums counts and orders known universities first", () => {
  const groups = groupInstitutions([
    inst("hstu-unverified-bank", "HSTU-U", "UNVERIFIED — Hajee Mohammad Danesh Science and Technology University", 15, 0),
    inst("ju", "JU", "Jahangirnagar University", 50, 1393),
    inst("zz", "ZZ", "Zeta University"),
    inst("ru-verified-bank", "RU-V", "Rajshahi University — Verified Question Bank", 15, 1800),
    inst("du", "DU", "University of Dhaka", 2, 175),
    inst("ru", "RU", "UNVERIFIED — University of Rajshahi", 44, 0),
    inst("hstu", "HSTU", "Hajee Mohammad Danesh Science and Technology University", 22, 939),
    inst("ju-unverified-bank", "JU-U", "UNVERIFIED — Jahangirnagar University", 84, 0)
  ]);
  assert.deepEqual(groups.map((g) => g.key), ["du", "ru", "ju", "hstu", "zz"]);
  const ru = groups.find((g) => g.key === "ru")!;
  assert.deepEqual([...ru.institutionIds].sort(), ["ru", "ru-verified-bank"]);
  assert.equal(ru.paperCount, 59);
  assert.equal(ru.eligibleCount, 1800);
  assert.equal(groups.find((g) => g.key === "ju")!.paperCount, 134);
});

test("internal quality labels never leak into university names", () => {
  assert.equal(cleanInstitutionName("UNVERIFIED — University of Rajshahi"), "University of Rajshahi");
  assert.equal(cleanInstitutionName("Rajshahi University — Verified Question Bank"), "University of Rajshahi");
  assert.equal(universityDisplayName("RU-V", "Rajshahi University — Verified Question Bank", "en"), "University of Rajshahi");
  assert.equal(universityDisplayName("JU-U", "UNVERIFIED — Jahangirnagar University", "bn"), "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়");
  assert.equal(universityDisplayName("ZZ-U", "UNVERIFIED — Zeta University", "en"), "Zeta University");
});

test("institutionIds survive the route round-trip and malformed input is dropped", () => {
  const scope = { category: "varsity" as const, institutionIds: ["ru", "ru-verified-bank"] };
  const params = scopeParams(scope) as Record<string, string>;
  assert.equal(params.institutionIds, "ru,ru-verified-bank");
  assert.deepEqual(scopeFromParams(params).institutionIds, ["ru", "ru-verified-bank"]);
  assert.deepEqual(scopeFromParams({ institutionIds: "ok,bad id,'; DROP,ok" }).institutionIds, ["ok"]);
  assert.equal("institutionIds" in scopeFromParams({ institutionIds: "" }), false);
  assert.equal("institutionIds" in scopeParams({ category: "medical" }), false);
});

test("batched paper listing matches the per-paper listing and institutionIds scope matches institutionId", async () => {
  const db = await freshDb();
  assert.equal((await importQuestionPack(db, syntheticPack({}, 4))).ok, true);
  const institutions = await listInstitutions(db, "varsity");
  assert.ok(institutions.length > 0);
  const ids = institutions.map((i) => i.id);
  const slow = await listPapers(db, { institutionId: ids[0], category: "varsity" });
  const fast = await listPapersByInstitutions(db, { institutionIds: [ids[0]], category: "varsity" });
  assert.deepEqual(fast, slow);
  assert.equal(await countEligible(db, { institutionIds: ids }), await countEligible(db, { institutionId: ids[0] }));
  assert.equal(await countEligible(db, { institutionIds: ["missing"] }), 0);
  assert.deepEqual(await listPapersByInstitutions(db, { institutionIds: [] }), []);
});
