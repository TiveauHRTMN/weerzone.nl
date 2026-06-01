/**
 * Koos view-adapter: mapt de engine-output (KoosPick[] + thuis-outlook) naar het
 * presentatie-model dat KoosTravelPage rendert. Puur en testbaar (geen netwerk,
 * geen client-only API) — zie scripts/check-koos-getaway.ts.
 *
 * Bewuste spec-keuze: Koos is puur adviserend. Geen reistijd/route/boeking in dit
 * model — alleen "daar is het zo" + afstand als oriëntatie.
 */

import type { DailyOutlook, KoosPick } from "@/lib/koos-getaway";

export type KoosHourKind = "sun" | "cloudsun" | "cloud" | "rain";
export type KoosTone = "yellow" | "orange" | "red" | "cyan" | "lime" | "blue";

export interface KoosDestinationView {
  city: string;
  country: string;
  flag: string;
  temp: number;
  k: KoosHourKind;
  zon: number;
  regen: number;
  distanceKm: number;
  tip: string;
  tone: KoosTone;
}

export interface KoosView {
  locationName: string;
  /** Thuis-dagmaximum, voor de "hier: …"-chip. Null als onbekend. */
  homeTemp: number | null;
  /** WMO-code thuis, voor de achtergrond. */
  homeWeatherCode: number;
  /** Deepseek-intro; null → UI valt terug op de losse tips. */
  intro: string | null;
  top: KoosDestinationView | null;
  alternatives: KoosDestinationView[];
}

/** Land + korte vlagcode per internationale zon-bestemming (op locationId). */
const SUNSET_COUNTRY: Record<string, { country: string; flag: string }> = {
  "sunset-valencia": { country: "Spanje", flag: "ES" },
  "sunset-barcelona": { country: "Spanje", flag: "ES" },
  "sunset-algarve": { country: "Portugal", flag: "PT" },
  "sunset-canarias": { country: "Spanje", flag: "ES" },
  "sunset-malta": { country: "Malta", flag: "MT" },
};

export function hourKind(weatherCode: number, sunshineHours: number, precipProbMax: number): KoosHourKind {
  if (precipProbMax >= 50 || weatherCode >= 51) return "rain";
  if (sunshineHours >= 7 && weatherCode <= 1) return "sun";
  if (weatherCode <= 3) return "cloudsun";
  return "cloud";
}

export function toneForTemp(tempMax: number): KoosTone {
  if (tempMax >= 26) return "orange";
  if (tempMax >= 22) return "yellow";
  if (tempMax >= 18) return "lime";
  return "cyan";
}

function pickToView(pick: KoosPick): KoosDestinationView {
  const meta =
    pick.kind === "sunset"
      ? SUNSET_COUNTRY[pick.opportunity.targetLocationId] ?? { country: "Zuid-Europa", flag: "EU" }
      : { country: "Nederland", flag: "NL" };
  return {
    city: pick.opportunity.targetName,
    country: meta.country,
    flag: meta.flag,
    temp: Math.round(pick.tempMax),
    k: hourKind(pick.weatherCode, pick.sunshineHours, pick.precipProbMax),
    zon: Math.round(pick.sunshineHours),
    regen: Math.round(pick.precipProbMax),
    distanceKm: pick.opportunity.distanceKm ?? 0,
    tip: pick.opportunity.reason,
    tone: toneForTemp(pick.tempMax),
  };
}

export function buildKoosView(
  locationName: string,
  origin: DailyOutlook | null,
  picks: KoosPick[],
  intro: string | null,
): KoosView {
  const views = picks.map(pickToView);
  return {
    locationName,
    homeTemp: origin ? Math.round(origin.tempMax) : null,
    homeWeatherCode: origin?.weatherCode ?? 3,
    intro,
    top: views[0] ?? null,
    alternatives: views.slice(1),
  };
}
