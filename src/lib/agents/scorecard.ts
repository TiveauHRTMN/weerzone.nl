import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { meldMisser, meldSucces } from "@/lib/backend-breaker";

/**
 * Piets gelijk-gehad-score (handoff 2026-07-10, blok c): voorspelde dagmax per
 * plaats vs de gemeten dagmax — de meting is ground truth. Pure wiskunde,
 * nul LLM. Schema: supabase/migrations/20260710_piet_scorecard.sql.
 * Alle toegang loopt via de service role; best-effort zolang de migratie nog
 * niet live is (crons en UI vallen dan stil terug op "geen score").
 */

export const PIET_SCORECARD_TABLE = "piet_scorecard";

/** Hooguit één graad ernaast = gelijk gehad (weermans-maat, geen jargon). */
const HIT_MARGE_GRADEN = 1.0;

export interface ScorecardPrediction {
  forecastDate: string; // YYYY-MM-DD, NL-kalenderdag
  province: string;
  placeSlug: string;
  placeName: string;
  lat: number;
  lon: number;
  predictedMax: number;
}

export interface UnmeasuredRow {
  id: string;
  forecastDate: string;
  province: string;
  placeSlug: string;
  lat: number;
  lon: number;
}

export interface ScoreStats {
  days: number;
  hits: number;
  hitRate: number; // 0-100, afgerond
}

export interface PlaceScoreDigest {
  yesterday: { predictedMax: number; measuredMax: number } | null;
  stats: ScoreStats;
}

/** NL-kalenderdag (Europe/Amsterdam) als YYYY-MM-DD; offsetDays: -1 = gisteren. */
export function nlDateISO(d: Date = new Date(), offsetDays = 0): string {
  const shifted = new Date(d.getTime() + offsetDays * 86_400_000);
  // sv-SE geeft ISO-notatie; de timeZone doet de NL-dag-grens.
  return shifted.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/** "23", "0,4" — één decimaal met komma, hele graden zonder ",0". */
export function gradenTekst(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

/** Oordeel in Piets stem over het verschil voorspeld vs gemeten. */
export function scoreVerdict(deltaGraden: number): string {
  const diff = Math.abs(deltaGraden);
  if (diff <= 0.5) return "Strak op de graad.";
  if (diff <= HIT_MARGE_GRADEN) return "Netjes binnen de graad.";
  return `Daar zat ik ${gradenTekst(diff)}° naast — eerlijk is eerlijk.`;
}

export function computeStats(rows: { predictedMax: number; measuredMax: number }[]): ScoreStats {
  const days = rows.length;
  const hits = rows.filter((row) => Math.abs(row.measuredMax - row.predictedMax) <= HIT_MARGE_GRADEN).length;
  return { days, hits, hitRate: days ? Math.round((hits / days) * 100) : 0 };
}

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function savePredictions(
  admin: SupabaseClient,
  preds: ScorecardPrediction[],
): Promise<{ ok: boolean; saved: number; reason?: string }> {
  if (!preds.length) return { ok: true, saved: 0 };
  const rows = preds.map((p) => ({
    forecast_date: p.forecastDate,
    province: p.province,
    place_slug: p.placeSlug,
    place_name: p.placeName,
    lat: p.lat,
    lon: p.lon,
    predicted_max: Math.round(p.predictedMax * 10) / 10,
    predicted_at: new Date().toISOString(),
  }));
  const { error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .upsert(rows, { onConflict: "forecast_date,province,place_slug" });
  if (error) return { ok: false, saved: 0, reason: error.message };
  return { ok: true, saved: rows.length };
}

export async function listUnmeasured(admin: SupabaseClient, dates: string[]): Promise<UnmeasuredRow[]> {
  if (!hasServiceRole() || !dates.length) return [];
  const { data, error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .select("id, forecast_date, province, place_slug, lat, lon")
    .in("forecast_date", dates)
    .is("measured_max", null);
  if (error) {
    console.error("[scorecard] listUnmeasured:", error.message);
    return [];
  }
  return ((data ?? []) as { id: string; forecast_date: string; province: string; place_slug: string; lat: number; lon: number }[]).map(
    (row) => ({
      id: row.id,
      forecastDate: row.forecast_date,
      province: row.province,
      placeSlug: row.place_slug,
      lat: row.lat,
      lon: row.lon,
    }),
  );
}

export async function saveMeasurement(
  admin: SupabaseClient,
  id: string,
  m: { measuredMax: number; stationId: string; stationName: string },
): Promise<boolean> {
  const { error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .update({
      measured_max: Math.round(m.measuredMax * 10) / 10,
      measured_at: new Date().toISOString(),
      station_id: m.stationId,
      station_name: m.stationName,
    })
    .eq("id", id);
  if (error) console.error("[scorecard] saveMeasurement:", error.message);
  return !error;
}

/**
 * Afgeronde scores van de laatste `days` dagen, gegroepeerd per plaats.
 * Eén query voor álle plaatsen — de ochtendmail en de score-kaart lezen
 * hieruit zonder per-abonnee queries (O(plaatsen), niet O(abonnees)).
 */
export async function loadScoreDigest(
  admin: SupabaseClient,
  days = 30,
): Promise<Map<string, PlaceScoreDigest>> {
  const out = new Map<string, PlaceScoreDigest>();
  if (!hasServiceRole()) return out;
  const since = nlDateISO(new Date(), -days);
  const yesterday = nlDateISO(new Date(), -1);
  const { data, error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .select("forecast_date, province, place_slug, predicted_max, measured_max")
    .gte("forecast_date", since)
    .not("measured_max", "is", null);
  if (error) {
    console.error("[scorecard] loadScoreDigest:", error.message);
    meldMisser("loadScoreDigest");
    return out;
  }
  // De opslag antwoordde -- of er nu rijen waren of niet.
  meldSucces("loadScoreDigest");
  const grouped = new Map<string, { forecastDate: string; predictedMax: number; measuredMax: number }[]>();
  for (const raw of (data ?? []) as { forecast_date: string; province: string; place_slug: string; predicted_max: number; measured_max: number }[]) {
    const key = `${raw.province}/${raw.place_slug}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({
      forecastDate: raw.forecast_date,
      predictedMax: Number(raw.predicted_max),
      measuredMax: Number(raw.measured_max),
    });
  }
  for (const [key, rows] of grouped) {
    const y = rows.find((row) => row.forecastDate === yesterday) ?? null;
    out.set(key, {
      yesterday: y ? { predictedMax: y.predictedMax, measuredMax: y.measuredMax } : null,
      stats: computeStats(rows),
    });
  }
  return out;
}
