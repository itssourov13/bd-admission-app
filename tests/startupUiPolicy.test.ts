import test from "node:test";
import assert from "node:assert/strict";
import {
  canDismissSetupScreen,
  FIRST_RUN_READY_HOLD_MS,
  HOME_READY_TIMEOUT_MS,
  readyHoldMs,
  REDUCED_MOTION_READY_HOLD_MS,
  RETURNING_ESCALATION_MS,
  shouldEscalateReturningStartup,
  shouldReleaseSetupGateWithoutScreen,
  shouldShowSetupScreen
} from "../src/services/startupUiPolicy.ts";

test("branded startup UI is reserved for first-run and actionable recovery", () => {
  assert.equal(shouldShowSetupScreen("unknown", false, false), false, "classification stays behind native splash");
  assert.equal(shouldShowSetupScreen("returning", false, false), false, "returning users skip the full setup UI");
  assert.equal(shouldShowSetupScreen("firstRun", false, false), true, "fresh users see the full setup UI");
  assert.equal(shouldShowSetupScreen("unknown", true, false), true, "early database failures still show retry UI");
  assert.equal(shouldShowSetupScreen("returning", true, false), true, "returning startup failures stay actionable");
  assert.equal(shouldShowSetupScreen("unknown", false, true), true, "the recovery UI remains visible during retry");
});

test("returning startup releases the setup layout gate without mounting SetupScreen", () => {
  assert.equal(shouldReleaseSetupGateWithoutScreen("returning"), true);
  assert.equal(shouldReleaseSetupGateWithoutScreen("firstRun"), false);
  assert.equal(shouldReleaseSetupGateWithoutScreen("unknown"), false);
});

test("setup overlay waits for both database and initial Home readiness", () => {
  assert.equal(canDismissSetupScreen(false, false), false);
  assert.equal(canDismissSetupScreen(true, false), false, "database ready alone is insufficient");
  assert.equal(canDismissSetupScreen(false, true), false, "Home layout alone is insufficient");
  assert.equal(canDismissSetupScreen(true, true), true);
});

test("slow returning startup escalates to the branded progress UI", () => {
  assert.equal(shouldEscalateReturningStartup("returning", false, false, RETURNING_ESCALATION_MS - 1), false);
  assert.equal(shouldEscalateReturningStartup("returning", false, false, RETURNING_ESCALATION_MS), true);
  assert.equal(shouldEscalateReturningStartup("returning", true, false, 10_000), false, "ready database never escalates");
  assert.equal(shouldEscalateReturningStartup("returning", false, true, 10_000), false, "failures already show the retry UI");
  assert.equal(shouldEscalateReturningStartup("firstRun", false, false, 10_000), false, "first run already shows setup");
  assert.equal(shouldEscalateReturningStartup("unknown", false, false, 10_000), false, "unclassified startup stays behind splash");
});

test("ready hold is shortened under Reduce Motion and Home timeout outlasts escalation", () => {
  assert.equal(readyHoldMs(false), FIRST_RUN_READY_HOLD_MS);
  assert.equal(readyHoldMs(true), REDUCED_MOTION_READY_HOLD_MS);
  assert.ok(REDUCED_MOTION_READY_HOLD_MS < FIRST_RUN_READY_HOLD_MS);
  assert.ok(HOME_READY_TIMEOUT_MS > RETURNING_ESCALATION_MS);
});
