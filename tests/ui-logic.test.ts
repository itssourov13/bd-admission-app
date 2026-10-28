import test from "node:test";
import assert from "node:assert/strict";
import { translations } from "../src/i18n/translations.ts";
import { href, scopeFromParams, scopeParams } from "../src/features/navigation/links.ts";

const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");

test("translations: every key has non-empty Bangla and English text with matching placeholders", () => {
  for (const [key, value] of Object.entries(translations)) {
    assert.ok(value.bn.trim().length > 0, `${key} is missing Bangla`);
    assert.ok(value.en.trim().length > 0, `${key} is missing English`);
    assert.equal(placeholders(value.bn), placeholders(value.en), `${key} placeholders differ between languages`);
  }
});

test("translations: every advice key produced by the services exists", () => {
  for (const key of ["noAnswers", "tooFewSamples", "accuracyStrong", "accuracyMid", "accuracyLow", "manyTimeouts", "manySkips", "slowPace", "keepGoing"]) {
    assert.ok(`advice.${key}` in translations, `advice.${key}`);
  }
});

test("navigation: hrefs encode params and drop empty ones; unknown categories are ignored", () => {
  assert.equal(String(href("/flash/setup", { institutionId: "du a/b", paperId: undefined, seconds: 45 })), "/flash/setup?institutionId=du%20a%2Fb&seconds=45");
  assert.equal(String(href("/history")), "/history");
  const scope = scopeFromParams({ category: "astrology", institutionId: ["x", "y"], paperId: "" });
  assert.deepEqual(scope, { category: undefined, institutionId: "x", paperId: undefined, subject: undefined });
  assert.deepEqual(scopeParams({ category: "medical", paperId: "p1" }), { category: "medical", institutionId: undefined, paperId: "p1", subject: undefined });
  assert.equal(scopeFromParams({ category: "medical" }).category, "medical");
});
