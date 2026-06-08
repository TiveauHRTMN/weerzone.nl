/**
 * Rooktest: coordinate (gevaar-handoff + rank). Geen netwerk.
 * Run: npx tsx scripts/check-agents-orchestrator.ts
 */
import assert from "node:assert/strict";
import { coordinate, type CoordinationInput } from "@/lib/agents/orchestrator";
import type { AgentHeadsUp } from "@/lib/agents/types";

const now = new Date();
const iso = now.toISOString();
function h(
  partial: Partial<AgentHeadsUp> & Pick<AgentHeadsUp, "agent" | "category" | "severity">,
): AgentHeadsUp {
  return {
    id: `${partial.agent}:${partial.category}`,
    title: "t",
    message: "m",
    action: "a",
    validFrom: iso,
    createdAt: iso,
    ...partial,
  } as AgentHeadsUp;
}

// Gevaar: Reed urgent → leadAgent reed, Piet best_moment vervalt.
const danger: CoordinationInput = {
  piet: [
    h({ agent: "piet", category: "daily_advice", severity: "info" }),
    h({ agent: "piet", category: "best_moment", severity: "useful" }),
  ],
  reed: [h({ agent: "reed", category: "thunderstorm_risk", severity: "urgent" })],
  koos: [h({ agent: "koos", category: "better_place", severity: "useful" })],
};
const dRes = coordinate(danger, now);
assert.equal(dRes.leadAgent, "reed", "gevaar → reed leidt");
assert(
  !dRes.headsUps.some((x) => x.agent === "piet" && x.category === "best_moment"),
  "Piet best_moment vervalt bij gevaar",
);
assert(
  dRes.headsUps.some((x) => x.agent === "piet" && x.category === "daily_advice"),
  "Piet daily_advice blijft",
);
assert.equal(dRes.headsUps[0].agent, "reed", "ranking: reed urgent eerst");

// Rustig: geen gevaar → piet leidt, alles blijft.
const calm: CoordinationInput = {
  piet: [
    h({ agent: "piet", category: "daily_advice", severity: "info" }),
    h({ agent: "piet", category: "best_moment", severity: "useful" }),
  ],
  reed: [],
  koos: [h({ agent: "koos", category: "better_place", severity: "info" })],
};
const cRes = coordinate(calm, now);
assert.equal(cRes.leadAgent, "piet", "rustig → piet leidt");
assert(
  cRes.headsUps.some((x) => x.agent === "piet" && x.category === "best_moment"),
  "best_moment blijft als het rustig is",
);

// Overal rust → lege lijst.
const eRes = coordinate({ piet: [], reed: [], koos: [] }, now);
assert.equal(eRes.headsUps.length, 0, "alles rustig → geen heads-ups");
console.log("OK: orchestrator coordination");
