import { NextRequest, NextResponse } from "next/server";
import { isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { runOracle } from "@/lib/mariana/oracle/engine";
import { saveOracleRun } from "@/lib/mariana/oracle/storage";
import { TESLA_REGIONS } from "@/lib/mariana/tesla/regions";
import { runMarianaRegion } from "@/lib/mariana/regions/engine";
import { saveMarianaRun } from "@/lib/mariana/regions/storage";
import { fetchWeatherData } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Mariana NL — dagelijkse cascade-cron (het ENIGE scheduled entrypoint).
 *
 * Draait de hele cascade 1x/dag:
 *   1. Oracle  -> landelijk 48-96u regime + binaire gate (1 LLM-call).
 *   2. Regions -> per mesoschaal-regio (11) de LLM-duiding; bij gate ACTIVATE
 *      draait Regions intern Tesla voor die regio. Schrijft mariana_regions +
 *      het voederkanaal (local_feed) waar Mariana Local per request uit leest.
 *
 * Tesla en Oracle hebben GEEN eigen route — alleen Mariana (de orchestrator)
 * heeft dit cron-entrypoint. Registreer in vercel.json (crons[]).
 *
 * De 10.000 locatiepagina's draaien hier NIET in mee: die lezen per request de
 * opgeslagen regio-feed via Mariana Local (gratis, geen LLM in het request-pad).
 *
 * Auth: in productie Bearer MARIANA_SECRET/CRON_SECRET; lokaal vrij.
 */
export async function GET(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY ontbreekt — Mariana/Oracle kunnen niet redeneren" },
      { status: 503 }
    );
  }

  const params = request.nextUrl.searchParams;
  // Optioneel: subset regio's draaien (?regions=slug,slug) voor debug/batching.
  const only = params.get("regions");
  const wanted = only ? new Set(only.split(",").map((s) => s.trim())) : null;
  const regions = wanted ? TESLA_REGIONS.filter((r) => wanted.has(r.slug)) : [...TESLA_REGIONS];

  const result = {
    oracle: { ok: false as boolean, gate: "" as string, persisted: false as boolean },
    regions: { processed: 0, saved: 0, convective: 0, errors: [] as string[] },
  };

  // --- 1. Oracle: landelijk regime + gate. ---
  let oracle = null as Awaited<ReturnType<typeof runOracle>> | null;
  try {
    oracle = await runOracle({ trigger: "scheduled_daily" });
    result.oracle.ok = true;
    result.oracle.gate = oracle.signal.convective_gate;
    const persisted = await saveOracleRun(oracle);
    result.oracle.persisted = persisted.ok;
  } catch (err) {
    result.regions.errors.push(`oracle: ${err instanceof Error ? err.message : String(err)}`);
  }

  // --- 2. Regions: per mesoschaal-regio de duiding (sequentieel; kosten/limiet). ---
  for (const region of regions) {
    try {
      // Hi-res WeatherData voor het regio-analysepunt (zelfde bron als /piet).
      const weather = await fetchWeatherData(
        region.lat,
        region.lon,
        false,
        true,
        { name: region.name, lat: region.lat, lon: region.lon },
        "nl"
      );
      if (!weather) {
        result.regions.errors.push(`${region.slug}: geen WeatherData`);
        continue;
      }
      const run = await runMarianaRegion(region, weather, {
        trigger: "scheduled_daily",
        oracle,
      });
      const saved = await saveMarianaRun(run);
      result.regions.processed++;
      if (saved.ok) result.regions.saved++;
      if (run.signal.tesla_context_used) result.regions.convective++;
    } catch (err) {
      result.regions.errors.push(`${region.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
