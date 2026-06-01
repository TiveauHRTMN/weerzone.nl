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
 * Rangschik kansen. Binnenlands: alleen als merkbaar beter dan thuis.
 * Internationaal: alleen als het thuis grauw/koud is én daar écht zon.
 * Lege array = niets beters → Koos zwijgt.
 */
export function scoreGetaways(
  origin: DailyOutlook,
  candidates: readonly DailyOutlook[],
  opts: { limit?: number } = {},
): WeatherOpportunity[] {
  const limit = opts.limit ?? 3;
  const originScore = comfortScore(origin);
  const homeIsGrey =
    origin.precipProbMax >= HOME_GREY_PRECIP || origin.tempMax <= HOME_COLD_TEMP;

  const ops: WeatherOpportunity[] = [];
  for (const c of candidates) {
    if (c.kind === "sunset") {
      if (!homeIsGrey) continue;
      if (c.tempMax < SUNSET_MIN_TEMP || c.precipProbMax > SUNSET_MAX_PRECIP) continue;
    } else if (comfortScore(c) - originScore < DOMESTIC_THRESHOLD) {
      continue;
    }
    const delta = comfortScore(c) - originScore;
    if (delta <= 0) continue;
    ops.push({
      originLocationId: origin.locationId,
      targetLocationId: c.locationId,
      targetName: c.name,
      score: Math.round(delta * 100),
      reason: buildReason(origin, c),
      distanceKm: c.distanceKm,
    });
  }
  return ops.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Sjabloon-stem (gratis, schaalt naar 10K). Geen LLM. */
export function koosTemplateLine(op: WeatherOpportunity): string {
  const dist = op.distanceKm ? ` — ${op.distanceKm} km` : "";
  return `${op.reason}${dist}`;
}
