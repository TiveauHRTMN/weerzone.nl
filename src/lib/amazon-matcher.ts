// ============================================================
// Amazon matching-engine.
//
// Input: WeatherData (per GPS) + datum/tijd
// Output: top-N producten, gesorteerd op relevantie, met anti-herhaling.
// ============================================================

import type { WeatherData } from "./types";
import { CATALOG, type CatalogProduct, type WeatherTag } from "./amazon-catalog";

// ============================================================
// 1. Weer + context → actieve tags met weight
// ============================================================

export interface WeatherContext {
  tags: Map<WeatherTag, number>; // tag → weight (0-1)
  summary: {
    temp: number;
    feelsLike: number;
    rain48h: number;
    windMax: number;
    uv: number;
    season: "spring" | "summer" | "autumn" | "winter";
  };
}

function currentSeason(now: Date): "spring" | "summer" | "autumn" | "winter" {
  const m = now.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export function buildContext(weather: WeatherData, now: Date = new Date()): WeatherContext {
  const tags = new Map<WeatherTag, number>();
  const bump = (t: WeatherTag, w: number) => tags.set(t, Math.max(tags.get(t) ?? 0, w));

  const c = weather.current;
  const d0 = weather.daily[0];
  const d1 = weather.daily[1] ?? d0;
  const rain48h = d0.precipitationSum + d1.precipitationSum;
  const rainNext6h = weather.hourly.slice(0, 6).reduce((a, h) => a + h.precipitation, 0);
  const windMax = Math.max(d0.windSpeedMax, d1.windSpeedMax);
  const tempMin = Math.min(d0.tempMin, d1.tempMin);
  const tempMax = Math.max(d0.tempMax, d1.tempMax);
  const uv = weather.uvIndex ?? 0;
  const capeMax = Math.max(...weather.hourly.slice(0, 24).map(h => h.cape ?? 0));

  // regen
  if (c.precipitation > 0.1) bump("rain_now", 1.0);
  if (rainNext6h > 0.5) bump("rain_soon", 0.9);
  if (rain48h > 5) bump("rain_heavy", 0.9);

  // wind
  if (windMax >= 75) bump("storm", 1.0);
  else if (windMax >= 60) bump("storm", 0.8);
  else if (windMax >= 40) bump("windy", 0.7);

  // temperatuur
  if (tempMin <= -5) bump("extreme_cold", 1.0);
  if (tempMin <= 0) bump("freezing", 0.9);
  if (tempMin < 5) bump("cold", 0.7);
  if (tempMax >= 30) bump("heatwave", 1.0);
  if (tempMax >= 26) bump("hot", 0.9);
  if (tempMax >= 18 && tempMax < 26) bump("warm", 0.6);

  // UV
  if (uv >= 8) bump("uv_extreme", 1.0);
  else if (uv >= 6) bump("uv_high", 0.8);

  // droog / perfect
  if (rain48h < 0.5) bump("dry_spell", 0.5);
  if (rain48h < 0.5 && tempMax >= 15 && tempMax <= 23 && windMax < 25) bump("perfect", 0.9);

  // onweer / mist (mist: hoge luchtvochtigheid + lage wind)
  if (capeMax > 1000) bump("thunder", 0.8);
  if (c.humidity >= 95 && c.windSpeed < 8) bump("fog", 0.6);

  // sneeuw (weathercode 71-77 / 85-86)
  const snowCodes = [71, 73, 75, 77, 85, 86];
  if (snowCodes.includes(c.weatherCode) ||
      weather.hourly.slice(0, 24).some(h => snowCodes.includes(h.weatherCode))) {
    bump("snow", 0.9);
  }

  // seizoen
  const season = currentSeason(now);
  bump(season, 0.4);
  if (season === "spring" && tempMax > 12) bump("allergy", 0.5);

  // dagdeel + weekdag
  const hour = now.getHours();
  const dow = now.getDay();
  if (hour >= 18) bump("evening", 0.3);
  if (hour < 10) bump("morning", 0.3);
  if (dow === 0 || dow === 6) bump("weekend", 0.4);
  else if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) bump("commute", 0.5);

  // indoor: stug weer (veel regen + kou, of storm)
  if ((rain48h > 8 && tempMax < 12) || windMax >= 60) bump("indoor", 0.5);

  // garden: droog + warm genoeg + seizoen
  if (rain48h < 1 && tempMax >= 15 && (season === "spring" || season === "summer")) bump("garden", 0.4);

  return {
    tags,
    summary: { temp: c.temperature, feelsLike: c.feelsLike, rain48h, windMax, uv, season },
  };
}

// ============================================================
// 2. Scoring: product × context → score
// ============================================================

function scoreProduct(p: CatalogProduct, ctx: WeatherContext): number {
  let score = 0;
  let matches = 0;
  for (const tag of p.tags) {
    const w = ctx.tags.get(tag);
    if (w !== undefined) {
      score += w;
      matches++;
    }
  }
  if (matches === 0) return 0;
  // baseScore beïnvloedt sterkte maar is niet dominant
  return score * (1 + p.baseScore / 20);
}

// ============================================================
// 3. Anti-herhaling via localStorage
// ============================================================

const SEEN_KEY = "wz_seen_products_v1";
const SEEN_TTL_MS = 24 * 60 * 60 * 1000; // 24u

function readSeen(): Record<string, number> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const cleaned: Record<string, number> = {};
    for (const [id, ts] of Object.entries(data)) {
      if (now - ts < SEEN_TTL_MS) cleaned[id] = ts;
    }
    return cleaned;
  } catch {
    return {};
  }
}

export function markSeen(ids: string[]) {
  if (typeof localStorage === "undefined") return;
  const seen = readSeen();
  const now = Date.now();
  for (const id of ids) seen[id] = now;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {}
}

// ============================================================
// 4. Pick top-N — de main entry point
// ============================================================

export function matchProducts(
  weather: WeatherData,
  n: number = 3,
  now: Date = new Date()
): { products: CatalogProduct[]; ctx: WeatherContext } {
  const ctx = buildContext(weather, now);
  const seen = readSeen();

  // score alle producten
  const scored = CATALOG
    .map(p => {
      const raw = scoreProduct(p, ctx);
      // zachte rotatie-penalty voor recent geziene producten
      const age = seen[p.id] ? Date.now() - seen[p.id] : Infinity;
      const rotationPenalty = age < 2 * 60 * 60 * 1000 ? 0.3 : age < SEEN_TTL_MS ? 0.7 : 1.0;
      return { p, score: raw * rotationPenalty };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Fallback: als niks matcht (onwaarschijnlijk), pak hoog-baseScore items
  if (scored.length === 0) {
    const fallback = [...CATALOG]
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, n);
    return { products: fallback, ctx };
  }

  // Diversiteit: voorkom dat 3 hero's dezelfde tag dragen
  const picked: CatalogProduct[] = [];
  const usedTags = new Set<WeatherTag>();
  for (const { p } of scored) {
    const primaryTag = p.tags.find(t => ctx.tags.has(t));
    if (primaryTag && usedTags.has(primaryTag) && picked.length > 0) continue;
    picked.push(p);
    if (primaryTag) usedTags.add(primaryTag);
    if (picked.length >= n) break;
  }
  // Als diversiteit-filter te streng was, vul aan
  if (picked.length < n) {
    for (const { p } of scored) {
      if (!picked.includes(p)) picked.push(p);
      if (picked.length >= n) break;
    }
  }

  return { products: picked, ctx };
}
