import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const profile = readFileSync(new URL("../app/(tabs)/profile.tsx", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../src/components/common/QuestionCard.tsx", import.meta.url), "utf8");

test("Profile shortcuts are ordered Bookmarks, History, Marking rules, Settings, with their original destinations", () => {
  const routes = [...profile.matchAll(/router\.push\(href\("(\/[a-z-]+)"\)\)/g)].map((m) => m[1]);
  assert.deepEqual(routes.slice(0, 4), ["/bookmarks", "/history", "/marking-profiles", "/settings"]);
});

test("Reported questions is a separate entry after the four shortcuts", () => {
  const routes = [...profile.matchAll(/router\.push\(href\("(\/[a-z-]+)"\)\)/g)].map((m) => m[1]);
  assert.equal(routes[4], "/reports");
  assert.match(profile, /alert-circle-outline/);
});

/** The action stack: the fixed-width column inside the question-text row, located by its structure rather than by string position. */
function actionStack(source: string): { row: string; stack: string; afterRow: string } {
  const rowStart = source.indexOf('<View className="flex-row items-start gap-2">');
  assert.ok(rowStart >= 0, "question row not found");
  const stackStart = source.indexOf('<View className="items-center" style={{ width: 44 }}>', rowStart);
  assert.ok(stackStart > rowStart, "fixed-width action stack not found inside the question row");
  const rowEnd = source.indexOf("\n      </View>\n", stackStart);
  assert.ok(rowEnd > stackStart, "end of question row not found");
  const stackEnd = source.lastIndexOf("</View>", rowEnd - 1);
  return { row: source.slice(rowStart, rowEnd), stack: source.slice(stackStart, stackEnd), afterRow: source.slice(rowEnd) };
}

test("QuestionCard action stack renders Bookmark first and Report directly below it as the only two siblings", () => {
  const { stack } = actionStack(cardSource);
  const pressables = [...stack.matchAll(/<Pressable\b/g)];
  assert.equal(pressables.length, 2, "exactly Bookmark and Report");
  const bookmarkAt = stack.indexOf('t("question.unbookmark") : t("question.bookmark")');
  const reportAt = stack.indexOf('t("report.edit") : t("report.action")');
  assert.ok(bookmarkAt >= 0 && reportAt >= 0);
  assert.ok(pressables[0].index! < bookmarkAt && bookmarkAt < pressables[1].index!, "Bookmark is the first Pressable");
  assert.ok(pressables[1].index! < reportAt, "Report is the second Pressable");
  assert.ok(stack.indexOf("onToggleBookmark ? (") < stack.indexOf("onReport ? ("), "Bookmark's guard precedes Report's guard");
  // A plain column (no flex-row) so the two controls stack vertically, each with the same 44px touch target.
  assert.doesNotMatch(stack.slice(0, stack.indexOf("<Pressable")), /flex-row/);
  assert.equal([...stack.matchAll(/w-11 h-11/g)].length, 2);
});

test("Report uses a distinct alert-circle icon that is not the exam flag glyph", () => {
  const { stack } = actionStack(cardSource);
  const icons = [...stack.matchAll(/<Ionicons name=\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(icons.length, 2);
  assert.match(icons[0], /bookmark/);
  assert.match(icons[1], /alert-circle/);
  assert.doesNotMatch(stack, /flag/i);
  // The exam marker is the ⚑ glyph plus translation key exam.flagged; the report control must not reuse either.
  assert.doesNotMatch(stack, /exam\.flag|⚑/);
});

test("The action stack keeps question and option widths unchanged", () => {
  const { row, stack, afterRow } = actionStack(cardSource);
  // Question text takes the remaining width (flex-1) beside a stack exactly as wide as the old lone bookmark button (w-11 = 44px).
  assert.match(row, /<MathText[^>]*className="flex-1[^"]*"/);
  assert.ok(row.indexOf("<MathText") < row.indexOf('style={{ width: 44 }}'));
  assert.ok(stack.startsWith('<View className="items-center" style={{ width: 44 }}>'));
  // Options render after (outside) the row, so the stack can never change option columns.
  assert.ok(!stack.includes("question.options"));
  assert.ok(afterRow.includes("question.options.map"));
  assert.ok(!row.includes("question.options.map"));
  // With neither action supplied the column is not rendered at all.
  assert.match(row, /onToggleBookmark \|\| onReport \? \(/);
});

test("Every screen that rendered a Bookmark before still passes it, alongside Report where Report is offered", () => {
  const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  for (const p of ["app/flash/play.tsx", "app/browse.tsx", "app/bookmarks.tsx", "app/exam/[id].tsx"]) {
    const src = read(p);
    assert.match(src, /onToggleBookmark=/, `${p} keeps Bookmark`);
    assert.match(src, /onReport=/, `${p} offers Report`);
    assert.ok(src.indexOf("onToggleBookmark=") < src.indexOf("onReport="), `${p}: Bookmark before Report`);
  }
});
