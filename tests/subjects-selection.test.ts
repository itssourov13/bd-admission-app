import test from "node:test";
import assert from "node:assert/strict";
import type { QuestionView } from "../src/types/domain.ts";
import { buildExamSections, buildSubjectOptions, SCIENCE_SUBJECT_ORDER } from "../src/services/subjects.ts";
import { createSelectionQueue } from "../src/services/examSelectionQueue.ts";

function question(id: string, subject: string | null, number: number, paperId = "paper-2026"): QuestionView {
  return {
    id,
    text: id,
    type: "single_choice",
    category: "varsity",
    subject,
    topic: null,
    answerStatus: "verified",
    contentStatus: "verified",
    explanation: null,
    assetPaths: [],
    options: [],
    appearances: subject === null ? [] : [{
      paperId,
      institutionCode: "DU",
      institutionName: "University",
      year: 2026,
      unit: "A",
      session: "2025-2026",
      questionNumber: number,
      pageNumber: 1,
      sourceFilename: "source.pdf"
    }]
  };
}

test("subject options follow canonical order and expose zero-count subjects honestly", () => {
  const options = buildSubjectOptions({ English: 2, Physics: 4, Biology: 0, "Extra Subject": 3 });
  assert.deepEqual(options.slice(0, SCIENCE_SUBJECT_ORDER.length).map((x) => x.subject), SCIENCE_SUBJECT_ORDER);
  assert.equal(options.find((x) => x.subject === "Biology")?.count, 0);
  assert.deepEqual(options.slice(-1).map((x) => x.subject), ["Extra Subject"]);
});

test("exam sections group subjects canonically and preserve source order within a subject", () => {
  const questions = [
    question("english-4", "English", 4),
    question("physics-9", "Physics", 9),
    question("math-3", "Higher Mathematics", 3),
    question("physics-1", "Physics", 1),
    question("biology-2", "Biology", 2),
    question("unclassified", null, 0)
  ];
  const sections = buildExamSections(questions, "paper-2026");
  assert.deepEqual(sections.map((s) => s.subject), ["Physics", "Biology", "Higher Mathematics", "English", null]);
  assert.deepEqual(sections[0].data.map((x) => x.question.id), ["physics-1", "physics-9"]);
  assert.deepEqual(sections.flatMap((s) => s.data.map((x) => x.number)), [1, 2, 3, 4, 5, 6]);
});

test("selection queue serializes rapid changes and clears in the original tap order", async () => {
  const writes: string[] = [];
  const queue = createSelectionQueue({
    now: () => 100,
    write: async (_id, keys) => { writes.push(keys[0] ?? "cleared"); return true; },
    onRejected: () => assert.fail("no write should be rejected")
  });
  queue.enqueue("q1", ["A"]);
  queue.enqueue("q1", ["B"]);
  queue.enqueue("q1", []);
  assert.equal(await queue.drain(1000), true);
  assert.deepEqual(writes, ["A", "B", "cleared"]);
});

test("a failed latest selection blocks submit and rolls back; a successful retry unblocks it", async () => {
  const rejected: string[][] = [];
  const queue = createSelectionQueue({
    initial: { q1: ["A"] },
    now: () => 100,
    write: async (_id, keys) => keys[0] !== "B",
    onRejected: (_id, persisted) => rejected.push(persisted)
  });
  queue.enqueue("q1", ["B"]);
  assert.equal(await queue.drain(1000), false);
  assert.deepEqual(rejected, [["A"]]);
  queue.enqueue("q1", ["C"]);
  assert.equal(await queue.drain(1000), true);
});
