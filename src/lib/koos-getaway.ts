/**
 * Koos — de ontsnappings-lens.
 *
 * Vergelijkt jouw locatie met haalbare NL-plekken (binnenlands) en een vaste
 * internationale zon-set. Koos toont alleen iets als er ÉCHT iets beters is;
 * stralende dag thuis -> Koos zwijgt (lege array = geldige output).
 *
 * Patroon volgt Blok A: pure scoring hier, I/O (open-meteo) onderaan, zodat de
 * scoring testbaar is via scripts/check-koos-getaway.ts (geen unit-runner).
 *
 * Guardrail (spec §6): nooit een boeking/vlucht/hotel/affiliate. Alleen "daar
 * is het zo."
 */

import type { WeatherOpportunity } from "@/lib/agents/types";
import { NL_PLACES, placeRouteSlug } from "@/lib/places-data";

export type GetawayKind = "domestic" | "sunset";

export interface GetawayOrigin {
  name: string;
  lat: number;
  lon: number;
  /** Optionele interne id van de herkomst-locatie. */
  locationId?: string;
}

export interface DailyOutlook {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  kind: GetawayKind;
  /** °C, dagmaximum. */
  tempMax: number;
  /** 0..100, max neerslagkans op de dag. */
  precipProbMax: number;
  /** Uren zon op de dag. */
  sunshineHours: number;
  /** WMO weather code. */
  weatherCode: number;
  /** Afstand vanaf de herkomst, km. */
  distanceKm: number;
}

const IDEAL_TEMP = 22;

/** Comfort 0..1 uit zon (45%), droogte (35%) en temperatuur-comfort (20%). */
export function comfortScore(o: {
  tempMax: number;
  precipProbMax: number;
  sunshineHours: number;
}): number {
  const sun = Math.min(Math.max(o.sunshineHours, 0), 12) / 12;
  const dry = 1 - Math.min(Math.max(o.precipProbMax, 0), 100) / 100;
  const temp = Math.max(0, 1 - Math.abs(o.tempMax - IDEAL_TEMP) / 18);
  return 0.45 * sun + 0.35 * dry + 0.2 * temp;
}

/** Hemelsbrede afstand in hele km. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Vaste internationale zon-set (v1). Pas hier aan om de set te wijzigen. */
export const INTERNATIONAL_SUNSET: readonly {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
}[] = [
  { name: "Valencia", locationId: "sunset-valencia", lat: 39.47, lon: -0.38 },
  { name: "Barcelona", locationId: "sunset-barcelona", lat: 41.39, lon: 2.17 },
  { name: "Algarve (Faro)", locationId: "sunset-algarve", lat: 37.02, lon: -7.93 },
  { name: "Canarische Eilanden", locationId: "sunset-canarias", lat: 28.29, lon: -16.63 },
  { name: "Malta", locationId: "sunset-malta", lat: 35.9, lon: 14.51 },
];

// Drempels: hoeveel beter een plek moet zijn voor Koos iets zegt.
const DOMESTIC_THRESHOLD = 0.18; // binnenlandse plek moet merkbaar beter zijn
const SUNSET_MIN_TEMP = 20; // zon-bestemming moet écht warm zijn
const SUNSET_MAX_PRECIP = 25; // ...en droog
const HOME_GREY_PRECIP = 55; // thuis "grauw" vanaf deze neerslagkans
const HOME_COLD_TEMP = 14; // ...of zo koud

function buildReason(origin: DailyOutlook, c: DailyOutlook): string {
  const there = `${Math.round(c.tempMax)}°`;
  if (c.kind === "sunset") {
    return `Hier blijft het grauw; in ${c.name} is het ${there} en zonnig.`;
  }
  if (origin.precipProbMax - c.precipProbMax >= 30) {
    return `Hier kans op regen, in ${c.name} blijft het droog (${there}).`;
  }
  return `In ${c.name} is het zonniger en ${there}.`;
}

/**
 * Eén kans, verrijkt met de ruwe weerdata zodat een UI de plek volledig kan
 * renderen (temp/zon/regen/code) zonder de DailyOutlook opnieuw op te halen.
 */
export interface KoosPick {
  opportunity: WeatherOpportunity;
  kind: GetawayKind;
  tempMax: number;
  sunshineHours: number;
  precipProbMax: number;
  weatherCode: number;
}

/**
 * Rangschik kansen mét weerdata. Binnenlands: alleen als merkbaar beter dan
 * thuis. Internationaal: alleen als het thuis grauw/koud is én daar écht zon.
 * Lege array = niets beters → Koos zwijgt.
 */
export function scoreGetawayPicks(
  origin: DailyOutlook,
  candidates: readonly DailyOutlook[],
  opts: { limit?: number } = {},
): KoosPick[] {
  const limit = opts.limit ?? 3;
  const originScore = comfortScore(origin);
  const homeIsGrey =
    origin.precipProbMax >= HOME_GREY_PRECIP || origin.tempMax <= HOME_COLD_TEMP;

  const picks: KoosPick[] = [];
  for (const c of candidates) {
    if (c.kind === "sunset") {
      if (!homeIsGrey) continue;
      if (c.tempMax < SUNSET_MIN_TEMP || c.precipProbMax > SUNSET_MAX_PRECIP) continue;
    } else if (comfortScore(c) - originScore < DOMESTIC_THRESHOLD) {
      continue;
    }
    const delta = comfortScore(c) - originScore;
    if (delta <= 0) continue;
    picks.push({
      opportunity: {
        originLocationId: origin.locationId,
        targetLocationId: c.locationId,
        targetName: c.name,
        score: Math.round(delta * 100),
        reason: buildReason(origin, c),
        distanceKm: c.distanceKm,
      },
      kind: c.kind,
      tempMax: c.tempMax,
      sunshineHours: c.sunshineHours,
      precipProbMax: c.precipProbMax,
      weatherCode: c.weatherCode,
    });
  }
  return picks
    .sort((a, b) => b.opportunity.score - a.opportunity.score)
    .slice(0, limit);
}

/**
 * Rangschik kansen (alleen de WeatherOpportunity-laag). Dunne wrapper over
 * scoreGetawayPicks zodat surfaces die geen weerdata nodig hebben simpel blijven.
 */
export function scoreGetaways(
  origin: DailyOutlook,
  candidates: readonly DailyOutlook[],
  opts: { limit?: number } = {},
): WeatherOpportunity[] {
  return scoreGetawayPicks(origin, candidates, opts).map((p) => p.opportunity);
}

/** Sjabloon-stem (gratis, schaalt naar 10K). Geen LLM. */
export function koosTemplateLine(op: WeatherOpportunity): string {
  const dist = op.distanceKm ? ` — ${op.distanceKm} km` : "";
  return `${op.reason}${dist}`;
}

const OPEN_METEO_DAILY = "https://api.open-meteo.com/v1/forecast";

// Reisband voor binnenlandse kandidaten: ver genoeg om te verschillen,
// dichtbij genoeg om er heen te gaan.
const TRAVEL_MIN_KM = 25;
const TRAVEL_MAX_KM = 160;
const DOMESTIC_CANDIDATES = 8;

interface CandidateLoc {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  kind: GetawayKind;
  distanceKm: number;
}

function domesticCandidates(origin: GetawayOrigin): CandidateLoc[] {
  return NL_PLACES
    .map((p) => ({ p, km: haversineKm(origin, p) }))
    .filter(({ km }) => km >= TRAVEL_MIN_KM && km <= TRAVEL_MAX_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, DOMESTIC_CANDIDATES)
    .map(({ p, km }) => ({
      name: p.name,
      locationId: `${p.province}/${placeRouteSlug(p)}`,
      lat: p.lat,
      lon: p.lon,
      kind: "domestic" as const,
      distanceKm: km,
    }));
}

/** Haal de daily-outlook voor één locatie. Null bij build-tijd of fout. */
export async function fetchDailyOutlook(
  loc: CandidateLoc,
  dayIndex = 0,
): Promise<DailyOutlook | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const url = `${OPEN_METEO_DAILY}?${new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    daily: "temperature_2m_max,precipitation_probability_max,sunshine_duration,weathercode",
    forecast_days: "3",
    timezone: "auto",
  })}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.daily;
    if (!d || !Array.isArray(d.time) || d.time.length <= dayIndex) return null;
    return {
      name: loc.name,
      locationId: loc.locationId,
      lat: loc.lat,
      lon: loc.lon,
      kind: loc.kind,
      tempMax: Number(d.temperature_2m_max?.[dayIndex] ?? NaN),
      precipProbMax: Number(d.precipitation_probability_max?.[dayIndex] ?? 0),
      sunshineHours: Number(d.sunshine_duration?.[dayIndex] ?? 0) / 3600,
      weatherCode: Number(d.weathercode?.[dayIndex] ?? 0),
      distanceKm: loc.distanceKm,
    };
  } catch {
    return null;
  }
}

/**
 * Vind getaways mét weerdata + het thuis-outlook. Vergelijkt thuis met nabije
 * NL-plekken + de internationale zon-set. `origin` is null bij geen data;
 * `picks` is leeg als niets beter is (Koos zwijgt).
 */
export async function findGetawayPicks(
  origin: GetawayOrigin,
  opts: { dayIndex?: number; limit?: number } = {},
): Promise<{ origin: DailyOutlook | null; picks: KoosPick[] }> {
  const dayIndex = opts.dayIndex ?? 0;
  const originLoc: CandidateLoc = {
    name: origin.name,
    locationId: origin.locationId ?? "origin",
    lat: origin.lat,
    lon: origin.lon,
    kind: "domestic",
    distanceKm: 0,
  };
  const candidates: CandidateLoc[] = [
    ...domesticCandidates(origin),
    ...INTERNATIONAL_SUNSET.map((s) => ({
      ...s,
      kind: "sunset" as const,
      distanceKm: haversineKm(origin, s),
    })),
  ];
  const [originOutlook, ...rest] = await Promise.all([
    fetchDailyOutlook(originLoc, dayIndex),
    ...candidates.map((c) => fetchDailyOutlook(c, dayIndex)),
  ]);
  if (!originOutlook || Number.isNaN(originOutlook.tempMax)) {
    return { origin: null, picks: [] };
  }
  const valid = rest.filter(
    (o): o is DailyOutlook => o !== null && !Number.isNaN(o.tempMax),
  );
  return {
    origin: originOutlook,
    picks: scoreGetawayPicks(originOutlook, valid, { limit: opts.limit }),
  };
}

/**
 * Vind getaways (alleen WeatherOpportunity[]). Dunne wrapper over
 * findGetawayPicks voor surfaces die geen weerdata nodig hebben.
 */
export async function findGetaways(
  origin: GetawayOrigin,
  opts: { dayIndex?: number; limit?: number } = {},
): Promise<WeatherOpportunity[]> {
  const { picks } = await findGetawayPicks(origin, opts);
  return picks.map((p) => p.opportunity);
}
