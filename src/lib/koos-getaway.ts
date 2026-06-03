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
import type { Place } from "@/lib/places-data";
import { KOOS_GETAWAY_PLACES_LIGHT, koosPlaceRouteSlug } from "@/lib/koos-places";

type PlaceCharacter = NonNullable<Place["character"]>;

export type GetawayKind = "domestic" | "nearby" | "sunset";

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
  /** Type bestemming (kust/natuur/camping), voor slimmere redenen. */
  character?: PlaceCharacter;
  /** Land (alleen bij buitenland-bestemmingen). */
  country?: string;
  /** Hoe je er komt, bv. "auto of trein" / "vliegtuig". */
  transport?: string;
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

/**
 * Dichtbij-buitenland (net over de grens), haalbaar met auto of trein. Koos toont
 * hier standaard 1-2 van naast de NL-tips, zodat een dagje weg ook over de grens
 * kan — zonder gelijk naar Zuid-Europa te springen.
 */
export const NEARBY_ABROAD: readonly {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  country: string;
  transport: string;
}[] = [
  { name: "Antwerpen", locationId: "nearby-antwerpen", lat: 51.2194, lon: 4.4025, country: "België", transport: "auto of trein" },
  { name: "Gent", locationId: "nearby-gent", lat: 51.0543, lon: 3.7174, country: "België", transport: "auto of trein" },
  { name: "Brugge", locationId: "nearby-brugge", lat: 51.2093, lon: 3.2247, country: "België", transport: "auto of trein" },
  { name: "Düsseldorf", locationId: "nearby-dusseldorf", lat: 51.2277, lon: 6.7735, country: "Duitsland", transport: "auto of trein" },
  { name: "Keulen", locationId: "nearby-keulen", lat: 50.9375, lon: 6.9603, country: "Duitsland", transport: "auto of trein" },
  { name: "Münster", locationId: "nearby-munster", lat: 51.9607, lon: 7.6261, country: "Duitsland", transport: "auto of trein" },
  { name: "Lille", locationId: "nearby-lille", lat: 50.6292, lon: 3.0573, country: "Frankrijk", transport: "auto of trein" },
];

/** Vaste internationale zon-set (v1). Pas hier aan om de set te wijzigen. */
export const INTERNATIONAL_SUNSET: readonly {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
}[] = [
  { name: "Valencia", locationId: "sunset-valencia", lat: 39.47, lon: -0.38 },
  { name: "Barcelona", locationId: "sunset-barcelona", lat: 41.39, lon: 2.17 },
  { name: "Málaga (Costa del Sol)", locationId: "sunset-malaga", lat: 36.72, lon: -4.42 },
  { name: "Sevilla", locationId: "sunset-sevilla", lat: 37.39, lon: -5.99 },
  { name: "Algarve (Faro)", locationId: "sunset-algarve", lat: 37.02, lon: -7.93 },
  { name: "Lissabon", locationId: "sunset-lissabon", lat: 38.72, lon: -9.14 },
  { name: "Canarische Eilanden", locationId: "sunset-canarias", lat: 28.29, lon: -16.63 },
  { name: "Malta", locationId: "sunset-malta", lat: 35.9, lon: 14.51 },
  { name: "Nice (Côte d'Azur)", locationId: "sunset-nice", lat: 43.7, lon: 7.27 },
  { name: "Athene", locationId: "sunset-athene", lat: 37.98, lon: 23.73 },
  { name: "Cyprus (Larnaca)", locationId: "sunset-cyprus", lat: 34.92, lon: 33.62 },
];

// Drempels: hoeveel beter een plek moet zijn voor Koos iets zegt.
const DRY_MAX_PRECIP = 40; // harde droogte-eis: Koos tipt geen natte plek
const WET_CODE_MIN = 51; // WMO >= 51 = (mot)regen/buien → te nat om te tippen
const MIN_DELTA = 0.06; // moet merkbaar beter zijn dan thuis
const MIN_ABS = 0.5; // ...én op zichzelf een redelijke dag (anders is het geen uitje)
const GOOD_ABS = 0.6; // thuis al zo mooi → Koos zwijgt
const MAX_NEARBY = 2; // hoogstens 1-2 dichtbij-buitenland naast de NL-tips
const SUNSET_MIN_TEMP = 20; // zon-bestemming moet écht warm zijn
const SUNSET_MAX_PRECIP = 25; // ...en droog

/** Droog genoeg om te tippen: lage regenkans én geen regen-weercode. */
function isDry(o: { precipProbMax: number; weatherCode: number }): boolean {
  return o.precipProbMax <= DRY_MAX_PRECIP && o.weatherCode < WET_CODE_MIN;
}

/** Korte plaatsaanduiding op basis van het karakter van de bestemming. */
function placePhrase(c: DailyOutlook): string {
  const isCamping = /^camping\b/i.test(c.name) || /vakantiepark/i.test(c.name);
  if (isCamping) return `op ${c.name}`;
  switch (c.character) {
    case "coastal":
      return `aan zee bij ${c.name}`;
    case "highland":
      return `op de hoge gronden bij ${c.name}`;
    case "inland":
      return `in de natuur bij ${c.name}`;
    default:
      return `in ${c.name}`;
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Buurman-onderbouwing (sjabloon, geen LLM — schaalt naar 10K). Concreet: noemt
 * graden, zon-uren en droog/nat tegenover thuis, in de "over het hek"-stem van
 * Koos. De warme intro komt apart van koosVoice (Deepseek) als die er is.
 */
function buildReason(origin: DailyOutlook, c: DailyOutlook): string {
  const temp = `${Math.round(c.tempMax)}°`;
  const zonU = Math.round(c.sunshineHours);
  if (c.kind === "sunset") {
    return `Hier komt de zon er voorlopig niet door; in ${c.name} is het ${temp} en strak weer. Als je er echt even tussenuit wilt.`;
  }
  if (c.kind === "nearby") {
    const land = c.country ? ` (${c.country})` : "";
    const how = c.transport ? `, met de ${c.transport} te doen` : "";
    return `Net over de grens in ${c.name}${land} is het ${temp} en droog — zo'n ${zonU} uur zon${how}.`;
  }
  const where = placePhrase(c);
  const dRain = origin.precipProbMax - c.precipProbMax;
  const dSun = c.sunshineHours - origin.sunshineHours;
  if (dRain >= 30) {
    return `Bij jou valt regen, ${where} houden ze het droog — ${temp} en zo'n ${zonU} uur zon.`;
  }
  if (dSun >= 3) {
    return `${cap(where)} schijnt de zon een stuk vaker, een uur of ${zonU}, en met ${temp} zit je goed.`;
  }
  return `${cap(where)} is het ${temp} en een stuk rustiger weer dan bij jou — net even prettiger.`;
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
/** Standaard aantal getaways dat Koos toont (meer dan v1's 3). */
const DEFAULT_LIMIT = 8;

export function scoreGetawayPicks(
  origin: DailyOutlook,
  candidates: readonly DailyOutlook[],
  opts: { limit?: number } = {},
): KoosPick[] {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const originScore = comfortScore(origin);

  // Thuis is al zo mooi dat eropuit gaan weinig oplevert → Koos zwijgt.
  if (originScore >= GOOD_ABS) return [];

  const toPick = (c: DailyOutlook, cScore: number): KoosPick => ({
    opportunity: {
      originLocationId: origin.locationId,
      targetLocationId: c.locationId,
      targetName: c.name,
      score: Math.round((cScore - originScore) * 100),
      reason: buildReason(origin, c),
      distanceKm: c.distanceKm,
    },
    kind: c.kind,
    tempMax: c.tempMax,
    sunshineHours: c.sunshineHours,
    precipProbMax: c.precipProbMax,
    weatherCode: c.weatherCode,
  });

  const sortByScore = (a: KoosPick, b: KoosPick) => b.opportunity.score - a.opportunity.score;

  // NL + dichtbij-buitenland: harde droogte-eis + merkbaar beter dan thuis.
  const qualifyLocal = (c: DailyOutlook): KoosPick | null => {
    const cScore = comfortScore(c);
    if (!isDry(c)) return null;
    if (cScore < MIN_ABS) return null;
    if (cScore - originScore < MIN_DELTA) return null;
    return toPick(c, cScore);
  };

  const domesticPicks = candidates
    .filter((c) => c.kind === "domestic")
    .map(qualifyLocal)
    .filter((p): p is KoosPick => p !== null)
    .sort(sortByScore);
  const nearbyPicks = candidates
    .filter((c) => c.kind === "nearby")
    .map(qualifyLocal)
    .filter((p): p is KoosPick => p !== null)
    .sort(sortByScore);

  // Verre zon-set: alleen warm + droog + beter dan thuis.
  const sunsetPicks = candidates
    .filter((c) => c.kind === "sunset")
    .map((c) => {
      if (c.tempMax < SUNSET_MIN_TEMP || c.precipProbMax > SUNSET_MAX_PRECIP) return null;
      const cScore = comfortScore(c);
      if (cScore - originScore <= 0) return null;
      return toPick(c, cScore);
    })
    .filter((p): p is KoosPick => p !== null)
    .sort(sortByScore);

  if (domesticPicks.length > 0) {
    // Normaal: NL voorop, hooguit 1-2 dichtbij-buitenland erbij (~75% NL).
    const nNearby = Math.min(MAX_NEARBY, nearbyPicks.length);
    return [...domesticPicks.slice(0, limit - nNearby), ...nearbyPicks.slice(0, nNearby)].slice(0, limit);
  }

  // Heel NL nat/niets beters → dichtbij-buitenland eerst, dan de verre zon-set.
  return [...nearbyPicks, ...sunsetPicks].slice(0, limit);
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

// Reisband voor binnenlandse getaways: ver genoeg om écht te verschillen,
// dichtbij genoeg voor een (lang) weekend. Ruimer dan v1 (160km) zodat de Wadden
// en Zeeland vanuit het midden binnen bereik vallen.
const TRAVEL_MIN_KM = 25;
const TRAVEL_MAX_KM = 220;
const DOMESTIC_NEAREST_CANDIDATES = 8;
const DOMESTIC_MAX_CANDIDATES = 18;

interface CandidateLoc {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  kind: GetawayKind;
  distanceKm: number;
  character?: PlaceCharacter;
  country?: string;
  transport?: string;
}

function domesticCandidates(origin: GetawayOrigin): CandidateLoc[] {
  const eligible = KOOS_GETAWAY_PLACES_LIGHT
    .map((p) => ({ p, km: haversineKm(origin, p) }))
    .filter(({ km }) => km >= TRAVEL_MIN_KM && km <= TRAVEL_MAX_KM)
    .sort((a, b) => a.km - b.km);

  const selected = new Map<string, { p: Place; km: number }>();
  const add = (item: { p: Place; km: number } | undefined) => {
    if (!item || selected.size >= DOMESTIC_MAX_CANDIDATES) return;
    selected.set(`${item.p.province}/${koosPlaceRouteSlug(item.p)}`, item);
  };

  eligible.slice(0, DOMESTIC_NEAREST_CANDIDATES).forEach(add);

  // Daarna landelijke spreiding: pak per provincie nog de dichtstbijzijnde optie.
  // Zo kan Koos campings/kust/natuur elders in NL vinden zonder 3000 plekken op te halen.
  const byProvince = new Map<string, { p: Place; km: number }>();
  for (const item of eligible) {
    if (!byProvince.has(item.p.province)) byProvince.set(item.p.province, item);
  }
  [...byProvince.values()].sort((a, b) => a.km - b.km).forEach(add);

  // Tot slot wat karakter-spreiding binnen de reisband, zodat campings/kust/natuur
  // elkaar niet volledig wegdrukken door alleen afstand.
  for (const character of ["coastal", "highland", "inland"] satisfies PlaceCharacter[]) {
    eligible.filter(({ p }) => p.character === character).slice(0, 3).forEach(add);
  }

  return [...selected.values()]
    .slice(0, DOMESTIC_MAX_CANDIDATES)
    .map(({ p, km }) => ({
      name: p.name,
      locationId: `${p.province}/${koosPlaceRouteSlug(p)}`,
      lat: p.lat,
      lon: p.lon,
      kind: "domestic" as const,
      distanceKm: km,
      character: p.character,
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
      character: loc.character,
      country: loc.country,
      transport: loc.transport,
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
  const domestic = domesticCandidates(origin);
  const nearby: CandidateLoc[] = NEARBY_ABROAD.map((s) => ({
    name: s.name,
    locationId: s.locationId,
    lat: s.lat,
    lon: s.lon,
    kind: "nearby" as const,
    distanceKm: haversineKm(origin, s),
    country: s.country,
    transport: s.transport,
  }));

  // Thuis + NL-pool + dichtbij-buitenland in één keer; verre zon-set pas daarna.
  const [originOutlook, ...rest] = await Promise.all([
    fetchDailyOutlook(originLoc, dayIndex),
    ...domestic.map((c) => fetchDailyOutlook(c, dayIndex)),
    ...nearby.map((c) => fetchDailyOutlook(c, dayIndex)),
  ]);
  if (!originOutlook || Number.isNaN(originOutlook.tempMax)) {
    return { origin: null, picks: [] };
  }
  const valid = rest.filter((o): o is DailyOutlook => o !== null && !Number.isNaN(o.tempMax));

  const picks = scoreGetawayPicks(originOutlook, valid, { limit: opts.limit });
  if (picks.length > 0) {
    return { origin: originOutlook, picks };
  }

  // Niets droog/beter binnen reach (NL + dichtbij). Thuis al mooi → Koos zwijgt;
  // anders kijken we naar de verre zon-set (vliegtuig), met dichtbij ernaast.
  if (comfortScore(originOutlook) >= GOOD_ABS) {
    return { origin: originOutlook, picks: [] };
  }

  const international = INTERNATIONAL_SUNSET.map((s) => ({
    ...s,
    kind: "sunset" as const,
    distanceKm: haversineKm(origin, s),
    transport: "vliegtuig",
  }));
  const internationalOutlooks = await Promise.all(
    international.map((c) => fetchDailyOutlook(c, dayIndex)),
  );
  const validInternational = internationalOutlooks.filter(
    (o): o is DailyOutlook => o !== null && !Number.isNaN(o.tempMax),
  );
  return {
    origin: originOutlook,
    picks: scoreGetawayPicks(originOutlook, [...valid, ...validInternational], { limit: opts.limit }),
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
