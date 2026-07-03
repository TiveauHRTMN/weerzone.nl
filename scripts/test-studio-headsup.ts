import { decideHeadsUp, type TeslaHeadsUpRow } from "@/lib/mariana/studio/headsup";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

const nu = Date.now();
const morgen0800 = new Date(nu + 86400000); morgen0800.setHours(8, 0, 0, 0);
const morgen2200 = new Date(nu + 86400000); morgen2200.setHours(22, 0, 0, 0);
const vandaag0600 = new Date(nu); vandaag0600.setHours(6, 0, 0, 0);
const vandaag2300 = new Date(nu); vandaag2300.setHours(23, 0, 0, 0);

function row(over: Partial<TeslaHeadsUpRow>): TeslaHeadsUpRow {
  return {
    region_slug: "limburg-zuid",
    region_name: "Zuid-Limburg",
    run_at: new Date(nu - 3600_000).toISOString(),
    valid_from: morgen0800.toISOString(),
    valid_until: morgen2200.toISOString(),
    tesla_signal: 2,
    reed_action: "OBSERVE",
    ...over,
  };
}

async function main() {
  // Geen Tesla-runs → geen slide.
  assert((await decideHeadsUp({ teslaRows: [] })) === null, "geen runs → null");

  // Signal 1 + ABORT met venster vandaag (het 3-juli-scenario) → geen slide.
  const nonEvent = row({ tesla_signal: 1, reed_action: "ABORT", valid_from: vandaag0600.toISOString(), valid_until: vandaag2300.toISOString() });
  assert((await decideHeadsUp({ teslaRows: [nonEvent] })) === null, "signal 1 + ABORT vandaag → null (non-event, geen slide)");

  // Signal 1 + OBSERVE, venster wél morgen → nog steeds geen slide (marginaal).
  assert((await decideHeadsUp({ teslaRows: [row({ tesla_signal: 1, reed_action: "OBSERVE" })] })) === null, "signal 1 + OBSERVE morgen → null");

  // Signal 2 met venster morgen → slide, regio in 'waar'.
  const s2 = await decideHeadsUp({ teslaRows: [row({})] });
  assert(s2?.type === "onweer", "signal 2 morgen → onweer-slide");
  assert(Boolean(s2?.rijen.waar.includes("Zuid-Limburg")), "regio-naam in 'waar'");
  assert(Boolean(s2?.rijen.wanneer.startsWith("Morgen")), "'wanneer' = morgen");

  // Signal 3 maar venster alleen vandaag → geen slide (heads-up gaat over morgen).
  assert((await decideHeadsUp({ teslaRows: [row({ tesla_signal: 3, valid_from: vandaag0600.toISOString(), valid_until: vandaag2300.toISOString() })] })) === null, "signal 3 venster vandaag → null");

  // Signal 3 maar verouderde run (>36u) → geen slide.
  assert((await decideHeadsUp({ teslaRows: [row({ tesla_signal: 3, run_at: new Date(nu - 40 * 3600_000).toISOString() })] })) === null, "stale run (>36u) → null");

  // Signal 1 + COMMIT (laag maar zeker) met venster morgen → wél slide.
  const commit = await decideHeadsUp({ teslaRows: [row({ tesla_signal: 1, reed_action: "COMMIT" })] });
  assert(commit?.type === "onweer", "signal 1 + COMMIT morgen → onweer-slide");

  // >3 regio's → generieke 'waar'.
  const veel = await decideHeadsUp({
    teslaRows: ["a", "b", "c", "d"].map((s, i) => row({ region_slug: s, region_name: `Regio ${i + 1}` })),
  });
  assert(veel?.rijen.waar === "Groot deel van het land", ">3 regio's → 'Groot deel van het land'");

  console.log("ALL PASS");
}
main().catch((e) => { console.error(e); process.exit(1); });
