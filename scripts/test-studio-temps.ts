import { config } from "dotenv";
config({ path: ".env.local" }); // KNMI_EDR_API_KEY leeft daar; kaal "dotenv/config" laadt alleen .env
import { forecastRanking, currentRanking, observedRanking, regionMaxima, details } from "@/lib/mariana/studio/temps";

async function main() {
  const fc = await forecastRanking(0);
  const now = await currentRanking();
  const obs = await observedRanking();
  const max = regionMaxima(fc);
  const det = await details(0);
  console.log("forecast plekken:", fc.length, "warmst:", fc[0]?.name, Math.round(fc[0]?.value));
  console.log("current plekken:", now.length, "warmst nu:", now[0]?.name, Math.round(now[0]?.value));
  console.log("gemeten plekken (KNMI):", obs.length, "warmst gemeten:", obs[0]?.name, obs[0]?.value);
  console.log("regio-max:", max);
  console.log("details:", det);
  if (fc.length < 30) throw new Error("te weinig forecast-plekken");
  if (now.length < 30) throw new Error("te weinig current-plekken");
  const obsRegions = new Set(obs.map((r) => r.region));
  if (obsRegions.size < 5) throw new Error(`KNMI-metingen dekken maar ${obsRegions.size}/5 regio's`);
  // regio-max moet ≥ het warmste-plek-afgeronde regio-lid zijn — max kan nooit onder een lid liggen
  for (const r of fc) {
    const key = r.region.toLowerCase() as keyof typeof max;
    if (max[key] < Math.floor(r.value)) throw new Error(`regio-max ${key}=${max[key]} < plaats ${r.name} ${r.value}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
