import assert from "node:assert/strict";
import {
  ALL_AGENT_PREFERENCES,
  activeAgentKeys,
  hasActiveAgents,
  preferencesFromProfile,
} from "@/lib/agents/preferences";

assert.deepEqual(activeAgentKeys(ALL_AGENT_PREFERENCES), ["piet", "reed", "koos"]);
assert.deepEqual(preferencesFromProfile(null), { piet: true, reed: false, koos: false });
assert.deepEqual(
  preferencesFromProfile({ piet_on: false, reed_on: true, koos_on: false }),
  { piet: false, reed: true, koos: false },
);
assert.deepEqual(
  preferencesFromProfile(null, { piet: false, reed: true, koos: true }),
  { piet: false, reed: true, koos: true },
);
assert.deepEqual(
  preferencesFromProfile(
    { piet_on: false, reed_on: false, koos_on: true },
    { piet: true, reed: true },
  ),
  { piet: true, reed: true, koos: true },
  "account metadata overrides the profile mirror, while missing values fall back to the profile",
);
assert.equal(hasActiveAgents({ piet: false, reed: false, koos: false }), false);

console.log("OK: agent preferences");
