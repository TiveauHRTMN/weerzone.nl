import assert from "node:assert/strict";
import { koosWeekendDayIndex, shouldSendKoosNudge } from "@/lib/agents/koos-nudge";

assert.equal(koosWeekendDayIndex(new Date("2026-06-11T07:00:00Z")), 2, "Thursday targets Saturday");
assert.equal(koosWeekendDayIndex(new Date("2026-06-12T07:00:00Z")), null, "Friday does not resend");
assert.equal(shouldSendKoosNudge(null), true);
assert.equal(shouldSendKoosNudge("2026-06-08T06:00:00Z", new Date("2026-06-11T07:00:00Z")), true);
assert.equal(shouldSendKoosNudge("2026-06-10T06:00:00Z", new Date("2026-06-11T07:00:00Z")), false);

console.log("OK: Koos nudge cadence and weekend window");
