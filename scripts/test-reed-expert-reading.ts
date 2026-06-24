import { reedExpertReading } from "../src/lib/reed-expert-reading";
import type { HourlyForecast } from "../src/lib/types";
import type { TeslaSignal } from "../src/lib/mariana/tesla/types";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) { console.log(`  ok  ${name}`); }
  else { console.error(`FAIL  ${name}`); failures++; }
}

// Bouw 24 uur vanaf middernacht met instelbare velden.
function makeHours(spec: Partial<Record<"cape" | "cin" | "liftedIndex" | "windShear" | "dewPoint" | "windSpeed" | "precipitation", number[]>>): HourlyForecast[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `2026-06-24T${String(h).padStart(2, "0")}:00`,
    temperature: 18,
    weatherCode: 0,
    precipitation: spec.precipitation?.[h] ?? 0,
    windSpeed: spec.windSpeed?.[h] ?? 5,
    cape: spec.cape?.[h] ?? 0,
    cin: spec.cin?.[h],
    dewPoint: spec.dewPoint?.[h],
    liftedIndex: spec.liftedIndex?.[h],
    windShear: spec.windShear?.[h],
  })) as unknown as HourlyForecast[];
}

function teslaLevel(level: 1 | 2 | 3): TeslaSignal {
  return {
    module: "mariana_tesla", model: "opus_4_8", tesla_signal: level,
    convective_regime: "", synoptic_setup: "", model_consensus: "",
    model_conflict: { level: "low", type: [], summary: "" },
    cape_assessment: "", cin_status: "", effective_cin_assessment: "",
    trigger_alignment: "", timing_window: "15-19u", initiation_zone: "",
    upstream_hijack_risk: false, seed_cell_watch: false, peak_corridor: "",
    expected_mode: "", inflow_outflow_expectation: "", dutch_mesoscale_factors: [],
    founder_input_assessment: "",
    confidence: { initiation: 0.5, thunder: 0.5, severe: 0.5, upscale: 0.3, timing: 0.5, location: 0.5, model_agreement: 0.5, founder_signal_weight: 0 },
    failure_modes: [], reed_action: "OBSERVE", mariana_summary: "", reasoning_chain: [],
  };
}

// 1. Rustige dag → verdict "rustig", geen momenten.
{
  const r = reedExpertReading(makeHours({ cape: Array(24).fill(50) }), "vandaag");
  assert("rustig: verdict rustig", r.verdict === "rustig");
  assert("rustig: geen momenten", r.moments.length === 0);
  assert("rustig: headline gevuld", r.headline.length > 0);
  assert("rustig: 6 lagen", r.layers.length === 6);
}

// 2. Echte storm: hoge CAPE + sterk negatieve LI + LAGE CIN + neerslag-trigger
//    → onweerskans hoog → onweerspiek-moment + verdict onrustig/code.
{
  const cape = Array(24).fill(200); for (let h = 16; h <= 19; h++) cape[h] = 1800;
  const li = Array(24).fill(2); for (let h = 16; h <= 19; h++) li[h] = -7;
  const cin = Array(24).fill(5);
  const precip = Array(24).fill(0); for (let h = 16; h <= 19; h++) precip[h] = 3;
  const dew = Array(24).fill(17);
  const r = reedExpertReading(makeHours({ cape, liftedIndex: li, cin, precipitation: precip, dewPoint: dew }), "vandaag");
  assert("storm: verdict onrustig+", r.verdict === "onrustig" || r.verdict === "code");
  assert("storm: onweerspiek-moment", r.moments.some((m) => m.kind === "onweerspiek"));
}

// 3. Deksel: CIN >100 's ochtends, valt na 16u weg terwijl CAPE oploopt → deksel-breekt-moment om 16u.
{
  const cin = Array(24).fill(120); for (let h = 16; h < 24; h++) cin[h] = 10;
  const cape = Array(24).fill(100); for (let h = 16; h <= 19; h++) cape[h] = 1200;
  const r = reedExpertReading(makeHours({ cin, cape }), "vandaag");
  const deksel = r.moments.find((m) => m.kind === "deksel-breekt");
  assert("deksel: moment bestaat", !!deksel);
  assert("deksel: om 16u", deksel?.detail === "16:00");
}

// 4. Broeierig: dauwpunt >=18 → dauwpunt-laag severity >= oplettend.
{
  const r = reedExpertReading(makeHours({ dewPoint: Array(24).fill(19) }), "vandaag");
  const dew = r.layers.find((l) => l.key === "dewPoint");
  assert("broeierig: dauwpunt-laag oplettend+", dew !== undefined && dew.severity !== "rustig");
}

// 5. Lege input → safe leeg resultaat, geen crash.
{
  const r = reedExpertReading([], "morgen");
  assert("leeg: verdict rustig", r.verdict === "rustig");
  assert("leeg: geen lagen-crash", Array.isArray(r.layers));
}

// 6. DE KERNFIX: hoge CAPE onder een sterk CIN-deksel (De Bilt-scenario)
//    → GEEN onweerspiek, verdict niet onrustig/code. CIN onderdrukt onweer.
{
  const cape = Array(24).fill(1140); for (let h = 12; h <= 19; h++) cape[h] = 2200;
  const li = Array(24).fill(-2); for (let h = 12; h <= 19; h++) li[h] = -6;
  const cin = Array(24).fill(140); // sterke deksel hele dag
  const r = reedExpertReading(makeHours({ cape, liftedIndex: li, cin }), "vandaag");
  assert("deksel-dicht: geen onweerspiek", !r.moments.some((m) => m.kind === "onweerspiek"));
  assert("deksel-dicht: verdict niet onrustig/code", r.verdict !== "onrustig" && r.verdict !== "code");
}

// 7. Cascade-escalatie: matig signaal in de cijfers, maar Tesla geeft niveau 3
//    → de cascade tilt het oordeel naar code.
{
  const cape = Array(24).fill(800); for (let h = 14; h <= 18; h++) cape[h] = 1200;
  const li = Array(24).fill(-1); for (let h = 14; h <= 18; h++) li[h] = -3;
  const cin = Array(24).fill(10);
  const precip = Array(24).fill(0); for (let h = 14; h <= 18; h++) precip[h] = 1;
  const r = reedExpertReading(makeHours({ cape, liftedIndex: li, cin, precipitation: precip }), "vandaag", { tesla: teslaLevel(3) });
  assert("cascade: Tesla-3 → verdict code", r.verdict === "code");
}

if (failures > 0) { console.error(`\n${failures} test(s) gefaald`); process.exit(1); }
console.log("\nalle tests geslaagd");
