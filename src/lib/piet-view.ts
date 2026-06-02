/**
 * Piet view-adapter: mapt de live WeatherData (open-meteo via fetchWeatherData,
 * met Mariana/Oracle-arbitrage) + pollen naar het presentatie-model dat
 * PietWeatherPage rendert. Puur en testbaar (geen netwerk, geen client-only API)
 * — zie scripts/check-piet-view.ts.
 *
 * Bewuste keuze: dit voedt de NUMERIEKE surfaces (hero-cijfers, 48u-briefing,
 * uurstrip, UV, vandaag-vs-morgen, dagdelen, zontijden, pollen). De warme,
 * LLM-geschreven Piet-stem (Deepseek) is een apart pad (wacht op OpenRouter-
 * tegoed); tot dan zijn taglines/headline nuchtere sjabloontekst uit de cijfers.
 */

import type { AirQualityData, WeatherData } from "@/lib/types";
import { getPollenLevel } from "@/lib/weather";

export type PietHourKind = "sun" | "cloudsun" | "cloud" | "rain";

export interface PietHourCell {
  h: string;
  t: number;
  k: PietHourKind;
  peak?: boolean;
}

export interface PietDayPart {
  k: PietHourKind;
  t: number;
  label: string;
}

export interface PietDay {
  key: "vd" | "mo";
  label: string;
  /** "donderdag 28 mei" */
  date: string;
  /** Korte weekdag, hoofdletter: "Donderdag" */
  weekday: string;
  /** Nuchtere conditie-samenvatting uit de cijfers. */
  tagline: string;
  /** Korte feitelijke briefing-tekst uit de cijfers (geen LLM-stem). */
  story: string;
  /** True als er onweer/zware buien zijn: toon de Reed-doorverwijzing. */
  referToReed: boolean;
  max: number;
  min: number;
  /** Regenkans-proxy (%) uit het aandeel regen-uren. */
  regen: number;
  /** Windsnelheid (km/u), dagmaximum. */
  wind: number;
  /** Uren zon op de dag. */
  zon: number;
  hourly: PietHourCell[];
  dagdelen: { ochtend: PietDayPart; middag: PietDayPart; avond: PietDayPart };
}

export interface PietScore {
  key: "terras" | "fiets" | "bbq" | "kleding";
  label: string;
  score: number;
  tip: string;
}

export interface PietPollenRow {
  name: string;
  /** 1..5 voor de UI-dots/labels. */
  level: 1 | 2 | 3 | 4 | 5;
  advice: string;
}

export interface PietView {
  locationName: string;
  now: {
    temp: number;
    feelsLike: number;
    conditionLabel: string;
    windDir: string;
    windSpeed: number;
    weatherCode: number;
    /** "11:42" — lokale tijd van de render. */
    updatedAt: string;
  };
  /** Nuchtere kop uit vandaag→morgen. */
  headline: string;
  days: { vd: PietDay; mo: PietDay };
  uv: { value: number; label: string; peakHour: string | null } | null;
  pollen: { headline: string; topLabel: string; rows: PietPollenRow[] } | null;
  scores: PietScore[];
  sun: { sunrise: string; sunset: string; dayLength: string } | null;
}

/* ---------- WMO-code helpers ---------- */
export function kindFromCode(code: number): PietHourKind {
  if (code >= 51) return "rain";
  if (code === 0 || code === 1) return "sun";
  if (code === 2) return "cloudsun";
  return "cloud"; // 3 = bewolkt, 45/48 = mist
}

export function conditionLabel(code: number): string {
  if (code === 0) return "Onbewolkt";
  if (code === 1) return "Vrijwel onbewolkt";
  if (code === 2) return "Half bewolkt";
  if (code === 3) return "Bewolkt";
  if (code === 45 || code === 48) return "Mist";
  if (code >= 45 && code <= 57) return "Motregen";
  if (code >= 61 && code <= 67) return "Regen";
  if (code >= 71 && code <= 77) return "Sneeuw";
  if (code >= 80 && code <= 82) return "Buien";
  if (code >= 85 && code <= 86) return "Sneeuwbuien";
  if (code >= 95) return "Onweer";
  return "Wisselvallig";
}

function dayPartLabel(code: number): string {
  if (code === 0 || code === 1) return "Zonnig";
  if (code === 2) return "Half bew.";
  if (code === 3) return "Bewolkt";
  if (code === 45 || code === 48) return "Mist";
  if (code >= 95) return "Onweer";
  if (code >= 80) return "Buien";
  if (code >= 71 && code <= 86) return "Sneeuw";
  if (code >= 51) return "Regen";
  return "Wisselend";
}

/* ---------- tijd/datum helpers (NL, Europe/Amsterdam) ---------- */
function nlLongDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

function nlWeekday(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const wd = new Intl.DateTimeFormat("nl-NL", { weekday: "long", timeZone: "Europe/Amsterdam" }).format(d);
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}

/** "14:00" -> "14"; ISO-uurstring -> uurnummer. */
function hourNum(iso: string): number {
  return Number(iso.slice(11, 13));
}
function dateOf(iso: string): string {
  return iso.slice(0, 10);
}
/** "21:43" uit een ISO- of "HH:mm"-string. */
function hhmm(iso: string | undefined | null): string {
  if (!iso) return "—";
  const t = iso.length >= 16 ? iso.slice(11, 16) : iso.slice(0, 5);
  return t;
}

/* ---------- per-dag opbouw ---------- */
function buildDay(
  weather: WeatherData,
  key: "vd" | "mo",
  isoDate: string,
  label: string,
): PietDay | null {
  const daily = weather.daily.find((d) => d.date === isoDate) ?? null;
  if (!daily) return null;

  const dayHours = weather.hourly.filter((h) => dateOf(h.time) === isoDate);

  // Regenkans-proxy: aandeel uren (06–23) met meetbare neerslag of regencode.
  const window = dayHours.filter((h) => {
    const hr = hourNum(h.time);
    return hr >= 6 && hr <= 23;
  });
  const rainHours = window.filter((h) => h.precipitation > 0.1 || h.weatherCode >= 51).length;
  const regen = window.length > 0 ? Math.round((rainHours / window.length) * 100) : 0;

  // Uurstrip: even uren 08..22.
  const cells: PietHourCell[] = dayHours
    .filter((h) => {
      const hr = hourNum(h.time);
      return hr >= 8 && hr <= 22 && hr % 2 === 0;
    })
    .map((h) => ({
      h: String(hourNum(h.time)).padStart(2, "0"),
      t: Math.round(h.temperature),
      k: kindFromCode(h.weatherCode),
    }));
  const peakT = cells.reduce((m, c) => Math.max(m, c.t), -Infinity);
  for (const c of cells) if (c.t === peakT) c.peak = true;

  const partAt = (target: number): PietDayPart => {
    const h =
      dayHours.reduce<(typeof dayHours)[number] | null>((best, cur) => {
        if (!best) return cur;
        return Math.abs(hourNum(cur.time) - target) < Math.abs(hourNum(best.time) - target) ? cur : best;
      }, null) ?? null;
    if (!h) return { k: "cloud", t: daily.tempMax, label: "—" };
    return { k: kindFromCode(h.weatherCode), t: Math.round(h.temperature), label: dayPartLabel(h.weatherCode) };
  };

  const referToReed = daily.weatherCode >= 95 || dayHours.some((h) => h.weatherCode >= 95 || h.cape >= 1000);

  return {
    key,
    label,
    date: nlLongDate(isoDate),
    weekday: nlWeekday(isoDate),
    tagline: taglineFor(daily.weatherCode, regen, daily.tempMax),
    story: storyFor(daily.tempMax, daily.tempMin, Math.round(daily.sunHours), regen, daily.windSpeedMax),
    referToReed,
    max: daily.tempMax,
    min: daily.tempMin,
    regen,
    wind: daily.windSpeedMax,
    zon: Math.round(daily.sunHours),
    hourly: cells,
    dagdelen: { ochtend: partAt(9), middag: partAt(14), avond: partAt(19) },
  };
}

// Buurman-onderbouwing (sjabloon, geen LLM): concreet, nuchter, nooit dramatisch
// — zelfde "over het hek"-stem als Koos en Piets Deepseek-pad.
function storyFor(max: number, min: number, zon: number, regen: number, wind: number): string {
  const open = `Overdag een graad of ${max}, 's nachts terug naar ${min}.`;
  let rest: string;
  if (regen >= 60) {
    rest = `Het wordt een natte boel — ${regen}% kans op regen en wind tot ${wind} km/u. Jas mee, en de buitenklusjes kun je beter naar voren halen.`;
  } else if (regen >= 30) {
    rest = `Af en toe kan er een bui vallen (${regen}% kans), met wind tot ${wind} km/u. Hou er een beetje rekening mee.`;
  } else if (zon >= 7) {
    rest = `Ruim ${zon} uur zon en grotendeels droog — prima dag om buiten te zijn. Wind tot ${wind} km/u.`;
  } else {
    rest = `Overwegend droog met ${zon} uur zon en wind tot ${wind} km/u. Niks om je druk over te maken.`;
  }
  return `${open} ${rest}`;
}

function taglineFor(code: number, regen: number, tempMax: number): string {
  if (code >= 95) return "Kans op onweer";
  if (code >= 80 || regen >= 60) return "Wisselvallig met buien";
  if (code >= 51 || regen >= 40) return "Af en toe regen";
  if ((code === 0 || code === 1) && tempMax >= 22) return "Zonnige, warme dag";
  if (code === 0 || code === 1) return "Onbewolkt en helder";
  if (code === 2) return "Half bewolkt, droog";
  if (code === 3) return "Overwegend bewolkt";
  if (code === 45 || code === 48) return "Mistig begin";
  return "Wisselend bewolkt";
}

/* ---------- dagscores (wiskunde uit de cijfers, korte sjabloon-tips) ---------- */
function clamp5(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n)));
}
function buildScores(today: PietDay): PietScore[] {
  const { max, regen, wind, zon } = today;

  const droog = 1 - regen / 100;
  const terras = clamp5(2 + zon / 3 + droog * 2 + (max >= 18 ? 1 : 0) - (wind > 25 ? 1 : 0));
  const fiets = clamp5(3 + droog * 2 - (wind > 30 ? 2 : wind > 20 ? 1 : 0) - (max < 6 ? 1 : 0));
  const bbq = clamp5(1 + droog * 3 + (max >= 16 ? 1 : 0) + (today.dagdelen.avond.k !== "rain" ? 1 : 0));
  const kleding = clamp5(max >= 20 ? 5 : max >= 14 ? 4 : max >= 8 ? 3 : 2);

  return [
    {
      key: "terras",
      label: "Terrasweer",
      score: terras,
      tip:
        terras >= 4
          ? "Droog en aangenaam — pak gerust een tafeltje buiten."
          : terras >= 2
            ? "Kan net, kies een luw plekje in de zon."
            : "Liever binnen vandaag.",
    },
    {
      key: "fiets",
      label: "Fietsdag",
      score: fiets,
      tip:
        fiets >= 4
          ? "Prima fietsweer, weinig wind en droog."
          : fiets >= 2
            ? `Houd rekening met wind tot ${wind} km/u.`
            : "Nat of te winderig — neem iets met een dak.",
    },
    {
      key: "bbq",
      label: "BBQ-avond",
      score: bbq,
      tip:
        bbq >= 4
          ? "Aansteken kan — de avond blijft droog en mild."
          : bbq >= 2
            ? "Zou kunnen, hou de lucht in de gaten."
            : "Avond is te nat of te koud om buiten te eten.",
    },
    {
      key: "kleding",
      label: "Kledingadvies",
      score: kleding,
      tip:
        max >= 22
          ? "T-shirt overdag, lichte trui voor 's avonds."
          : max >= 14
            ? "Een laagje extra is genoeg, jas kan thuisblijven."
            : max >= 8
              ? "Trui en een jas — het blijft fris."
              : "Dik aankleden, het is koud.",
    },
  ];
}

/* ---------- UV ---------- */
function uvLabel(uv: number): string {
  if (uv >= 11) return "Extreem";
  if (uv >= 8) return "Zeer hoog";
  if (uv >= 6) return "Hoog";
  if (uv >= 3) return "Matig";
  return "Laag";
}

/* ---------- pollen ---------- */
const POLLEN_TYPES = [
  { name: "Gras", type: "grass" as const, peak: (a: AirQualityData) => a.peakGrass },
  { name: "Berk", type: "tree" as const, peak: (a: AirQualityData) => a.peakBirch },
  { name: "Els", type: "tree" as const, peak: (a: AirQualityData) => a.peakAlder },
  { name: "Bijvoet", type: "tree" as const, peak: (a: AirQualityData) => a.peakMugwort },
];

function buildPollen(air: AirQualityData | null): PietView["pollen"] {
  if (!air) return null;
  const rows: PietPollenRow[] = POLLEN_TYPES.map(({ name, type, peak }) => {
    const grains = peak(air);
    const { label, level } = getPollenLevel(grains, type);
    // getPollenLevel geeft 0..3; map naar 1..5 voor de UI.
    const uiLevel = (level === 0 ? 1 : level === 1 ? 2 : level === 2 ? 4 : 5) as 1 | 2 | 3 | 4 | 5;
    return {
      name,
      level: uiLevel,
      advice:
        level >= 3
          ? `${label} — hou ramen dicht in de middag.`
          : level === 2
            ? `${label}. Gevoelige neuzen merken het 's middags.`
            : level === 1
              ? "Matig, meestal goed te doen."
              : "Laag, weinig last te verwachten.",
    };
  }).filter((r) => r.level >= 2); // alleen tonen wat noemenswaardig is (heads-up-discipline)

  if (rows.length === 0) return null;
  const top = rows.reduce((a, b) => (b.level > a.level ? b : a));
  return {
    headline: `${top.name} ${top.level >= 4 ? "piekt vandaag" : "is verhoogd"}`,
    topLabel: top.level >= 5 ? "Zeer hoog" : top.level >= 4 ? "Hoog" : "Verhoogd",
    rows,
  };
}

/* ---------- zontijden ---------- */
function dayLength(sunrise: string | undefined, sunset: string | undefined): string {
  if (!sunrise || !sunset) return "—";
  const a = new Date(sunrise).getTime();
  const b = new Date(sunset).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return "—";
  const mins = Math.round((b - a) / 60000);
  return `${Math.floor(mins / 60)} u ${String(mins % 60).padStart(2, "0")}`;
}

/* ---------- hoofdadapter ---------- */
export function buildPietView(
  weather: WeatherData,
  locationName: string,
  air: AirQualityData | null = null,
  now: Date = new Date(),
): PietView {
  const todayIso = weather.daily[0]?.date ?? dateOf(weather.hourly[0]?.time ?? "");
  const tomorrowIso = weather.daily[1]?.date ?? "";

  const vd = buildDay(weather, "vd", todayIso, "Vandaag");
  const mo = buildDay(weather, "mo", tomorrowIso, "Morgen");
  // vd zou altijd moeten bestaan; val anders terug op een minimale dag uit current.
  const today: PietDay = vd ?? {
    key: "vd",
    label: "Vandaag",
    date: nlLongDate(todayIso || dateOf(now.toISOString())),
    weekday: nlWeekday(todayIso || dateOf(now.toISOString())),
    tagline: conditionLabel(weather.current.weatherCode),
    story: `Nu ${Math.round(weather.current.temperature)}°, ${conditionLabel(weather.current.weatherCode).toLowerCase()}.`,
    referToReed: weather.current.weatherCode >= 95,
    max: Math.round(weather.current.temperature),
    min: Math.round(weather.current.temperature),
    regen: 0,
    wind: weather.current.windSpeed,
    zon: 0,
    hourly: [],
    dagdelen: {
      ochtend: { k: kindFromCode(weather.current.weatherCode), t: Math.round(weather.current.temperature), label: "—" },
      middag: { k: kindFromCode(weather.current.weatherCode), t: Math.round(weather.current.temperature), label: "—" },
      avond: { k: kindFromCode(weather.current.weatherCode), t: Math.round(weather.current.temperature), label: "—" },
    },
  };
  const tomorrow: PietDay = mo ?? today;

  const uvValue = Math.round(weather.uvIndex ?? 0);
  const uv =
    uvValue >= 3
      ? { value: uvValue, label: uvLabel(uvValue), peakHour: weather.daily[0] ? "13:00" : null }
      : null;

  return {
    locationName,
    now: {
      temp: Math.round(weather.current.temperature),
      feelsLike: Math.round(weather.current.feelsLike),
      conditionLabel: conditionLabel(weather.current.weatherCode),
      windDir: weather.current.windDirection,
      windSpeed: weather.current.windSpeed,
      weatherCode: weather.current.weatherCode,
      updatedAt: new Intl.DateTimeFormat("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Amsterdam",
      }).format(now),
    },
    headline: `Vandaag ${today.tagline.toLowerCase()}, morgen ${tomorrow.tagline.toLowerCase()}.`,
    days: { vd: today, mo: tomorrow },
    uv,
    pollen: buildPollen(air),
    scores: buildScores(today),
    sun: {
      sunrise: hhmm(weather.sunrise),
      sunset: hhmm(weather.sunset),
      dayLength: dayLength(weather.sunrise, weather.sunset),
    },
  };
}
