import test from "node:test";
import assert from "node:assert/strict";
import {
  canDismissSetupScreen,
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
