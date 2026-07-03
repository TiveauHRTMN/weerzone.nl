/**
 * STUDIO GENERATE — eigen cron voor de dagelijkse Studio-data, 2x geregistreerd
 * in vercel.json (04:15 en 05:30 UTC).
 *
 * mariana-nl draait Oracle + 11 regio's + Studio sequentieel in ÉÉN
 * Vercel-functie (maxDuration 300s); de Oracle-client alleen al heeft een
 * 5-minuten-timeout + 2 retries. Als die cascade traag is of vastloopt,
 * wordt de hele functie afgekapt vóórdat Studio (de laatste stap) draait —
 * dan blijft de kaart op de vorige dag staan (gebeurde 2026-07-03).
 *
 * Studio heeft geen verse Oracle/regio-data uit DEZELFDE run nodig (leest
 * altijd de laatst opgeslagen rij, met eigen fallbacks — zie engine.ts). De
 * cijfers zelf (temps.ts) zijn wel altijd live Open-Meteo/KNMI, dus twee runs:
 *   - 04:15 UTC: vroege veiligheidsnet-run, ruim vóór 08:00 als er iets misgaat.
 *   - 05:30 UTC: late ververs-run, 15 min vóór de studio-nudge (05:45 UTC) —
 *     zodat de kaart die Rowan om 08:00 reviewt de nieuwste modelrun heeft,
 *     niet een snapshot van anderhalf uur eerder.
 * mariana-nl's eigen Studio-stap blijft daarnaast draaien als extra poging
 * zodra de cascade klaar is.
 */
import { NextRequest, NextResponse } from "next/server";
import { isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { runStudio } from "@/lib/mariana/studio/engine";
import { saveStudioDay } from "@/lib/mariana/studio/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  try {
    const day = await runStudio({ dayOffset: 0 });
    const persisted = await saveStudioDay(day);
    return NextResponse.json({
      ok: true,
      forecastDate: day.forecastDate,
      persisted: persisted.ok,
      headsUp: day.slide4?.type ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
