import assert from "node:assert/strict";
import { nlCopyGuard, nlCopyGuardValue } from "../src/lib/nl-copy-guard";

assert.equal(nlCopyGuard("Explore Piet voor een diepe duik."), "Bekijk Piet voor een uitgebreide uitleg.");
assert.equal(nlCopyGuard("Maak een beslissing op dit moment in tijd."), "Neem een beslissing nu.");
assert.match(nlCopyGuard("Code rood voor zware regen. Alles onder controle."), /Code rood voor zware regen/);

const guarded = nlCopyGuardValue({ title: "AI-powered Assistant", items: ["Discover Koos"] });
assert.equal(guarded.title, "Slim samengesteld hulp");
assert.equal(guarded.items[0], "Ontdek Koos");

console.log("nlCopyGuard checks passed");
