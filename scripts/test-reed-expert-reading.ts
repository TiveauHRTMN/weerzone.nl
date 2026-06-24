import { reedExpertReading } from "../src/lib/reed-expert-reading";
import type { HourlyForecast } from "../src/lib/types";

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

// 1. Rustige dag → verdict "rustig", geen momenten.
{
  const r = reedExpertReading(makeHours({ cape: Array(24).fill(50) }), "vandaag");
  assert("rustig: verdict rustig", r.verdict === "rustig");
  assert("rustig: geen momenten", r.moments.length === 0);
  assert("rustig: headline gevuld", r.headline.length > 0);
  assert("rustig: 6 lagen", r.layers.length === 6);
}

// 2. Hoge CAPE + sterk negatieve LI → verdict onrustig + onweerspiek-moment.
{
  const cape = Array(24).fill(200); for (let h = 16; h <= 19; h++) cape[h] = 1800;
  const li = Array(24).fill(2); for (let h = 16; h <= 19; h++) li[h] = -7;
  const r = reedExpertReading(makeHours({ cape, liftedIndex: li }), "vandaag");
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

if (failures > 0) { console.error(`\n${failures} test(s) gefaald`); process.exit(1); }
console.log("\nalle tests geslaagd");
