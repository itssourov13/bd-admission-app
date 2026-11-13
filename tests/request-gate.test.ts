import test from "node:test";
import assert from "node:assert/strict";
import { createRequestGate } from "../src/services/requestGate.ts";

test("request gate: only the newest request is current; older ones stay stale on success and failure", async () => {
  const gate = createRequestGate();
  const state: { value: string } = { value: "ready" };
  // Mirrors Browse: a loadMore captured gate.current(), then a new search begins before it fails.
  const staleId = gate.current();
  const failing = new Promise<void>((_, reject) => setTimeout(() => reject(new Error("db")), 5));
  const newest = gate.begin();
  await failing.catch(() => { if (gate.isCurrent(staleId)) state.value = "error"; });
  assert.equal(state.value, "ready", "stale failure must not set error");
  assert.equal(gate.isCurrent(newest), true);
  assert.equal(gate.isCurrent(staleId), false);
  gate.begin();
  assert.equal(gate.isCurrent(newest), false);
});

test("request gate: a failure of the current request is still reported", () => {
  const gate = createRequestGate();
  const id = gate.begin();
  assert.equal(gate.isCurrent(id), true);
  assert.equal(gate.isCurrent(gate.current()), true);
});
