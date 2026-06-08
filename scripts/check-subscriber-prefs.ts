import assert from "node:assert";
import { SUBSCRIBER_PREF_FIELDS, sanitizePrefPatch } from "../src/lib/subscriber-prefs";

assert.deepStrictEqual([...SUBSCRIBER_PREF_FIELDS].sort(), ["active", "koos_on", "koos_pref", "reed_on"]);
assert.deepStrictEqual(sanitizePrefPatch({ reed_on: true, koos_on: false, hacked: 1 }), { reed_on: true, koos_on: false });
assert.deepStrictEqual(sanitizePrefPatch({ koos_pref: "heat_avoider" }), { koos_pref: "heat_avoider" });
assert.deepStrictEqual(sanitizePrefPatch({ koos_pref: "garbage" }), {});
assert.deepStrictEqual(sanitizePrefPatch({ active: false }), { active: false });
console.log("OK: subscriber-prefs sanitize");
