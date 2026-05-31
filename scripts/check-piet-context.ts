import assert from "node:assert/strict";
import { buildMarianaContext } from "../src/lib/mariana/piet-context";

// 1. Volledig signaal -> rijke context met dagbeeld + aandachtspunten.
const ctx = buildMarianaContext(
  {
    dominant_short_term_regime: "wisselvallig met buien",
    risk_summary: {
      rain: "kans op buien",
      wind: "matig",
      thunder: "",
      temperature: "fris",
      comfort: "",
      pollen: "",
    },
    mariana_summary: "Onrustig weerbeeld.",
    agent_outputs: {
      piet: { text: "Een grijze dag met buien.", refer_to_reed: false, referral_reason: "" },
      koos: { text: "" },
      reed: { active: false, region_slug: null, region_name: null, tesla: null },
    },
  },
  null,
);
assert.ok(ctx && ctx.includes("Een grijze dag met buien."), "dagbeeld ontbreekt");
assert.ok(ctx.includes("regen: kans op buien"), "regen-risico ontbreekt");
assert.ok(ctx.includes("Regime vandaag: wisselvallig met buien"), "regime ontbreekt");

// 2. Geen signaal, alleen feed -> val terug op regime + Reed-verwijzing.
const ctx2 = buildMarianaContext(null, {
  regionSlug: "x",
  regionName: "X",
  regimeCode: "code",
  regimeLabel: "zonnig en droog",
  confidencePrior: 0.8,
  modelWeights: {},
  hazardFlags: ["heat"],
  convectiveActive: true,
  referralReason: "onweer vanmiddag",
  generatedAt: new Date().toISOString(),
});
assert.ok(ctx2 && ctx2.includes("zonnig en droog"), "feed-regime fallback ontbreekt");
assert.ok(ctx2.includes("heat"), "hazardFlags fallback ontbreekt");
assert.ok(ctx2.includes('Reed: "onweer vanmiddag"'), "Reed-verwijzing of reden ontbreekt");

// 3. Lege input -> null.
assert.equal(buildMarianaContext(null, null), null, "lege input moet null geven");

// 4. Feed zonder regimeLabel -> val terug op regimeCode.
const ctx3 = buildMarianaContext(null, {
  regionSlug: "y",
  regionName: "Y",
  regimeCode: "ZW_FLOW",
  regimeLabel: "",
  confidencePrior: 0.5,
  modelWeights: {},
  hazardFlags: [],
  convectiveActive: false,
  referralReason: "",
  generatedAt: new Date().toISOString(),
});
assert.ok(ctx3 && ctx3.includes("Regime vandaag: ZW_FLOW"), "regimeCode fallback ontbreekt");

console.log("OK - buildMarianaContext gedraagt zich correct");
