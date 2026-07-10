/**
 * PIET SCORECARD — de gelijk-gehad-score (handoff 2026-07-10, blok c).
 *
 * phase=predict (05:50 UTC, vóór de ochtendmail): multi-model-mediaan dagmax
 *   per plaats met een actief Piet-abonnement (e-mail én push) + De Bilt als
 *   landelijke referentie. O(plaatsen), nul LLM.
 * phase=verify (20:30 UTC): gemeten dagmax van het dichtstbijzijnde station
 *   voor alle onafgemaakte rijen van vandaag en gisteren (inhaalslag).
 *
 * Vercel cron: beide fasen geregistreerd in vercel.json.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activeAgentPlaceSubscriptions } from "@/lib/agents/email-recipients";
import {
  nlDateISO,
  savePredictions,
  listUnmeasured,
  saveMeasurement,
  type ScorecardPrediction,
} from "@/lib/agents/scorecard";
import { findPlace, nearestSettlement, placeRouteSlug, type Place } from "@/lib/places-data";
import { fetchStationDayMaxTemp } from "@/lib/knmi-edr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Zelfde blend als src/lib/mariana/studio/temps.ts — kale HARMONIE loopt in
// hitte 2-3° te warm; de mediaan over 5 modellen zit op profniveau.
const BLEND_MODELS = ["knmi_seamless", "ecmwf_ifs025", "icon_eu", "gfs_seamless", "ukmo_seamless"];

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Multi-model-mediaan dagmax (vandaag) per plaats, in batches van 50 coördinaten. */
async function predictedMaxima(places: Place[]): Promise<Map<Place, number>> {
  const out = new Map<Place, number>();
  for (let i = 0; i < places.length; i += 50) {
    const chunk = places.slice(i, i + 50);
    const lat = chunk.map((p) => p.lat).join(",");
    const lon = chunk.map((p) => p.lon).join(",");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max&timezone=Europe%2FAmsterdam&forecast_days=1&models=${BLEND_MODELS.join(",")}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: Record<string, (number | null)[]> }>;
    chunk.forEach((place, j) => {
      const vals = BLEND_MODELS
        .map((mdl) => rows[j]?.daily?.[`temperature_2m_max_${mdl}`]?.[0])
        .filter((v): v is number => typeof v === "number");
      // fallback: ongesuffixte kolom als de models-variant ontbreekt
      const single = rows[j]?.daily?.temperature_2m_max?.[0];
      const value = vals.length ? median(vals) : typeof single === "number" ? single : undefined;
      if (typeof value === "number") out.set(place, value);
    });
  }
  return out;
}

async function runPredict() {
  const admin = createSupabaseAdminClient();
  const [emailSubs, pushSubs] = await Promise.all([
    activeAgentPlaceSubscriptions(admin, "piet", "email"),
    activeAgentPlaceSubscriptions(admin, "piet", "push"),
  ]);

  // Unieke plaatsen + De Bilt als landelijke referentie (score op /vandaag
  // heeft dan altijd een terugvaloptie, ook met nul abonnees).
  const byKey = new Map<string, Place>();
  for (const sub of [...emailSubs, ...pushSubs]) {
    const place = findPlace(sub.province, sub.placeSlug);
    if (place) byKey.set(`${sub.province}/${sub.placeSlug}`, place);
  }
  const deBilt = nearestSettlement(52.1017, 5.1783);
  if (deBilt) byKey.set(`${deBilt.province}/${placeRouteSlug(deBilt)}`, deBilt);

  const places = [...byKey.values()];
  if (!places.length) return NextResponse.json({ phase: "predict", saved: 0, reason: "geen plaatsen" });

  const maxima = await predictedMaxima(places);
  const forecastDate = nlDateISO();
  const preds: ScorecardPrediction[] = [];
  for (const [key, place] of byKey) {
    const value = maxima.get(place);
    if (typeof value !== "number") continue;
    const province = key.slice(0, key.indexOf("/"));
    const placeSlug = key.slice(key.indexOf("/") + 1);
    preds.push({
      forecastDate,
      province,
      placeSlug,
      placeName: place.name,
      lat: place.lat,
      lon: place.lon,
      predictedMax: value,
    });
  }

  const result = await savePredictions(admin, preds);
  return NextResponse.json({ phase: "predict", places: places.length, ...result });
}

async function runVerify() {
  const admin = createSupabaseAdminClient();
  // Vandaag + gisteren: mist een avondrun (deploy, storing), dan haalt de
  // volgende run de vorige dag alsnog in zolang de 10-min-data er nog is.
  const rows = await listUnmeasured(admin, [nlDateISO(), nlDateISO(new Date(), -1)]);
  if (!rows.length) return NextResponse.json({ phase: "verify", measured: 0, reason: "niets open" });

  let measured = 0;
  const errors: string[] = [];
  const batchSize = 8;
  for (let i = 0; i < rows.length; i += batchSize) {
    await Promise.all(
      rows.slice(i, i + batchSize).map(async (row) => {
        try {
          const obs = await fetchStationDayMaxTemp(row.lat, row.lon, row.forecastDate);
          if (!obs) return;
          const ok = await saveMeasurement(admin, row.id, {
            measuredMax: obs.maxTemp,
            stationId: obs.stationId,
            stationName: obs.stationName,
          });
          if (ok) measured += 1;
        } catch (err) {
          errors.push(`${row.province}/${row.placeSlug}: ${err instanceof Error ? err.message : err}`);
        }
      }),
    );
  }
  return NextResponse.json({ phase: "verify", open: rows.length, measured, errors: errors.slice(0, 10) });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phase = new URL(req.url).searchParams.get("phase");
  try {
    if (phase === "predict") return await runPredict();
    if (phase === "verify") return await runVerify();
    return NextResponse.json({ error: "phase=predict|verify vereist" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { phase, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
