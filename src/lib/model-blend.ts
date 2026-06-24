/**
 * Pure wiskunde + tekstfilters voor de gewogen modelverwachting (de pluim op
 * /vandaag en /morgen). De daggewichten komen uit de Mariana Regions-feed
 * (MarianaLocalFeed.modelWeights, sleutels = MarianaModelName-strings); zonder
 * feed gelden de statische defaults — zelfde filosofie als arbitration.ts.
 *
 * Geen Next-/Supabase-imports, zodat dit los te draaien is
 * (scripts/test-model-blend.ts) en herbruikbaar voor de proactieve e-mails.
 */
import type { HourlyForecast } from "@/lib/types";

/** Sleutels van hourly.models, in de volgorde van de getoonde pluimlijnen. */
const HOURLY_MODEL_KEYS = ["harmonie", "icon", "arome", "ecmwf", "gfs", "aifs", "google"] as const;
export type HourlyModelKey = (typeof HOURLY_MODEL_KEYS)[number];

/** Zelfde mapping als MODEL_KEY_MAP in arbitration.ts. */
const KEY_TO_MARIANA: Record<HourlyModelKey, string> = {
  harmonie: "HARMONIE",
  icon: "ICON_D2",
  arome: "AROME",
  ecmwf: "ECMWF",
  gfs: "GFS",
  aifs: "ECMWF_AIFS_SET_X",
  google: "GOOGLE",
};

/** Statische terugval-gewichten (subset van DEFAULT_WEIGHTS in arbitration.ts). */
const DEFAULT_WEIGHTS: Record<string, number> = {
  HARMONIE: 0.6,
  AROME: 0.56,
  ICON_D2: 0.54,
  ECMWF: 0.52,
  GFS: 0.42,
  ECMWF_AIFS_SET_X: 0.5,
  GOOGLE: 0.38,
};

/** De drie lijnen die de pluim toont, met hun publiekslabel-nummer. */
export const DISPLAY_MODELS = ["harmonie", "icon", "arome"] as const;
export type DisplayModelKey = (typeof DISPLAY_MODELS)[number];
export const DISPLAY_MODEL_NUMBER: Record<DisplayModelKey, 1 | 2 | 3> = {
  harmonie: 1,
  icon: 2,
  arome: 3,
};

/** Plat contract DayBriefing → ModelPluim. */
export interface PluimIntelligence {
  /** Gewogen temperatuurlijn, zelfde index als de hourly-array. */
  blended: number[];
  /** Welke getoonde lijn vandaag het zwaarst weegt (null = niet te zeggen). */
  leadModel: DisplayModelKey | null;
  /** Duidingsregel in gewone taal, al gefilterd op bron-/motornamen. */
  insight: string | null;
  /** Onweersvenster voor de dag van deze briefing (null = niet actief). */
  thunderWindow: { date: string; fromHour: number; toHour: number } | null;
}

function effectiveWeight(
  key: HourlyModelKey,
  weights: Record<string, number> | null | undefined,
): number {
  const name = KEY_TO_MARIANA[key];
  const tuned = weights?.[name];
  // Gewicht 0 valt terug op de statische default — een feed-gewicht van 0 is
  // dus niet genoeg om een model uit de blend te zetten (Regions clampt naar
  // 0.05-0.95, dus dit pad is theoretisch).
  if (typeof tuned === "number" && Number.isFinite(tuned) && tuned > 0) return tuned;
  return DEFAULT_WEIGHTS[name] ?? 0.45;
}

/**
 * Per uur het gewogen gemiddelde van alle aanwezige model-temperaturen.
 * Zonder enig model dat uur: terugval op de basistemperatuur (leidend model),
 * zodat de lijn nooit gaten heeft.
 */
export function blendedTemperatureSeries(
  hours: HourlyForecast[],
  weights?: Record<string, number> | null,
): number[] {
  return hours.map((hour) => {
    let sum = 0;
    let weightSum = 0;
    for (const key of HOURLY_MODEL_KEYS) {
      const temperature = hour.models?.[key]?.temperature;
      if (typeof temperature !== "number" || !Number.isFinite(temperature)) continue;
      const weight = effectiveWeight(key, weights);
      sum += temperature * weight;
      weightSum += weight;
    }
    return weightSum > 0 ? sum / weightSum : hour.temperature;
  });
}

/**
 * Welke van de GETOONDE lijnen (harmonie/icon/arome) het zwaarst weegt.
 * Null wanneer: minder dan 2 getoonde modellen aanwezig (er valt niets te
 * vergelijken), of een niet-getoond model (bv. ECMWF) zwaarder weegt dan de
 * getoonde winnaar — dan zou de zin de lezer misleiden.
 */
export function topWeightedDisplayModel(
  hours: HourlyForecast[],
  weights?: Record<string, number> | null,
): DisplayModelKey | null {
  const present = (key: HourlyModelKey) =>
    hours.some((hour) => typeof hour.models?.[key]?.temperature === "number");

  const displayed = DISPLAY_MODELS.filter(present);
  if (displayed.length < 2) return null;

  let winner: DisplayModelKey = displayed[0];
  for (const key of displayed) {
    if (effectiveWeight(key, weights) > effectiveWeight(winner, weights)) winner = key;
  }

  const hiddenHeavier = HOURLY_MODEL_KEYS.some(
    (key) =>
      !(DISPLAY_MODELS as readonly string[]).includes(key) &&
      present(key) &&
      effectiveWeight(key, weights) > effectiveWeight(winner, weights),
  );
  return hiddenHeavier ? null : winner;
}

/**
 * "14-18", "14:00 tot 18:00", "tussen 14 en 18" → { fromHour, toHour }.
 * Als toHour < fromHour kruist het venster middernacht (bv. 22-02): het loopt
 * dan van `date` @ fromHour tot de VOLGENDE dag @ toHour. Consumenten moeten
 * dat afhandelen met (uur >= fromHour || uur <= toHour) over de datumgrens.
 */
export function parseTimingWindow(
  timingWindow: string,
): { fromHour: number; toHour: number } | null {
  const match = timingWindow.match(
    /\b(\d{1,2})(?::\d{2})?\s*(?:-|–|—|tot|to|en)\s*(\d{1,2})(?::\d{2})?\b/i,
  );
  if (!match) return null;
  const fromHour = Math.min(23, Number(match[1]));
  const toHour = Math.min(23, Number(match[2]));
  if (!Number.isFinite(fromHour) || !Number.isFinite(toHour)) return null;
  return { fromHour, toHour };
}

/** Geldt een Tesla-timing_window voor deze dag? (verplaatst uit DayBriefing) */
export function timingAppliesToDay(timingWindow: string, dayOffset: 0 | 1): boolean {
  const timing = timingWindow.toLowerCase();
  const saysToday = /\b(vandaag|today)\b/.test(timing);
  const saysTomorrow = /\b(morgen|tomorrow)\b/.test(timing);
  if (saysToday && !saysTomorrow) return dayOffset === 0;
  if (saysTomorrow && !saysToday) return dayOffset === 1;
  return true;
}

/**
 * Bron-/motornamen horen niet in de product-UI (werkregel Rowan 2026-06-09):
 * staat er tóch een naam in de LLM-duiding, dan liever gén regel.
 */
const BANNED_NAMES =
  /(?<![a-zA-Z])(mariana|knmi|dwd|estofex|harmonie|arome|icon|ecmwf|gfs|aifs|open[\s-]?meteo|m[ée]t[ée]o[\s-]?france|noaa|tesla|oracle)(?![a-zA-Z])/i;

export function safeInsight(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  if (BANNED_NAMES.test(trimmed)) return null;
  return trimmed;
}
