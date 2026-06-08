/**
 * Rooktest: koosHeadsUps zet KoosPicks om in getaway heads-ups. Geen netwerk.
 * Run: npx tsx scripts/check-koos-agent.ts
 */
import assert from "node:assert/strict";
import { koosHeadsUps } from "@/lib/agents/koos-agent";
import { getDayContext } from "@/lib/agents/day-context";
import type { KoosPick } from "@/lib/koos-getaway";

const now = new Date();
const pick: KoosPick = {
  opportunity: {
    originLocationId: "origin",
    targetLocationId: "zeeland/domburg",
    targetName: "Domburg",
    score: 28,
    reason: "Aan zee bij Domburg houden ze het droog — 22° en zo'n 8 uur zon.",
    distanceKm: 120,
  },
  kind: "domestic",
  tempMax: 22,
  sunshineHours: 8,
  precipProbMax: 10,
  weatherCode: 1,
};

const heads = koosHeadsUps([pick], getDayContext(now), "Testdorp", now);
assert(heads.length >= 1, "een sterke pick moet een heads-up geven");
assert.equal(heads[0].agent, "koos", "heads-up hoort bij koos");
assert.equal(heads[0].category, "better_place", "domestic pick → better_place");
assert.equal(heads[0].targetLocationId, "zeeland/domburg", "draagt de doel-locatie");
assert(heads[0].action.trim().length > 0, "heeft een concrete actie");

// Geen picks → stilte.
assert.equal(koosHeadsUps([], getDayContext(now), "Testdorp", now).length, 0, "geen picks → geen heads-up");
console.log("OK: koos agent heads-ups");
