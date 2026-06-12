/**
 * Rooktest voor Mariana Regions/Local adapters.
 * Run: npx tsx scripts/check-mariana-agent-context.ts
 */
import assert from "node:assert/strict";
import { isFreshMarianaAgentData, marianaKoosText } from "../src/lib/mariana/agent-context";

const fresh = new Date().toISOString();
const stale = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

const data = {
  runAt: fresh,
  signal: {
    agent_outputs: {
      koos: { text: "Blijf liever lokaal: verderop is het niet overtuigend beter." },
    },
  },
  feed: null,
} as any;

assert.equal(isFreshMarianaAgentData(data), true, "verse run wordt geaccepteerd");
assert.equal(
  marianaKoosText(data),
  "Blijf liever lokaal: verderop is het niet overtuigend beter.",
  "Koos-tekst komt uit agent_outputs.koos.text",
);

assert.equal(marianaKoosText({ ...data, runAt: stale }), null, "oude run wordt genegeerd");
assert.equal(marianaKoosText({ ...data, signal: null }), null, "lege signal geeft null");

console.log("OK - Mariana agent-context gedraagt zich correct");
