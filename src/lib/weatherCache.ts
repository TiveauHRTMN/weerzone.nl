"use client";

import type { WeatherData, WWSPayload } from "./types";
import { getWeather as fetchServer, getAiVerdict } from "@/app/actions";
import { getNeuralInsights } from "./weather";
import type { Locale } from "@/config/locales";

/**
 * Hyperintelligente client-cache.
 *
 * Lagen:
 * 1. Memory map — zelfde tab, instant.
 * 2. localStorage — overleeft reload, cross-tab, TTL 10 min hard / 60 min stale.
 * 3. In-flight dedup — gelijktijdige aanroepen delen één Promise.
 * 4. SWR — stale cache (10-60 min) wordt meteen getoond terwijl revalidatie draait.
 * 5. AI verdict non-blocking — UI rendert direct, Gemini patcht later.
 */

type CacheEntry = {
  weather: WeatherData;
  ts: number;
};

const FRESH_MS = 10 * 60 * 1000;       // 10 min — geen refetch
const STALE_MS = 60 * 60 * 1000;       // 60 min — toon direct, revalideer op achtergrond
const EMERGENCY_MS = 4 * 60 * 60 * 1000; // 4 uur — noodcache bij API-uitval
const STORAGE_KEY_PREFIX = "wz_weather_v6_";

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<WeatherData>>();
const revalidating = new Set<string>();

const wwsMemory = new Map<string, { payload: WWSPayload, ts: number }>();

function key(lat: number, lon: number, locale: Locale) {
  return `${locale}:${lat.toFixed(3)},${lon.toFixed(3)}`;
}
function storageKey(lat: number, lon: number, locale: Locale) {
  return STORAGE_KEY_PREFIX + key(lat, lon, locale);
}

function readCache(lat: number, lon: number, locale: Locale): CacheEntry | null {
  const k = key(lat, lon, locale);
  const mem = memory.get(k);
  if (mem) return mem;
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(lat, lon, locale));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    memory.set(k, entry);
    return entry;
  } catch {
    return null;
  }
}
function writeCache(lat: number, lon: number, weather: WeatherData, locale: Locale) {
  const k = key(lat, lon, locale);
  const entry: CacheEntry = { weather, ts: Date.now() };
  memory.set(k, entry);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(lat, lon, locale), JSON.stringify(entry));
  } catch {}
}
function patchCacheSummary(lat: number, lon: number, verdict: string, locale: Locale) {
  const entry = readCache(lat, lon, locale);
  if (!entry) return;
  entry.weather.summaryVerdict = verdict;
  writeCache(lat, lon, entry.weather, locale);
}
export function patchCacheDeep(lat: number, lon: number, analysis: string, locale: Locale = "nl") {
  const entry = readCache(lat, lon, locale);
  if (!entry) return;
  entry.weather.deepAnalysis = analysis;
  writeCache(lat, lon, entry.weather, locale);
}
function patchCacheNeural(lat: number, lon: number, neural: WeatherData["neuralData"], locale: Locale) {
  const entry = readCache(lat, lon, locale);
  if (!entry) return;
  entry.weather.neuralData = neural;
  writeCache(lat, lon, entry.weather, locale);
}

async function fetchAndCache(
  lat: number,
  lon: number,
  onSummary?: (v: string) => void,
  onNeural?: (n: WeatherData["neuralData"]) => void,
  forceHighRes = false,
  locale: Locale = "nl",
  includeExternalAi = false
): Promise<WeatherData> {
  const weather = await fetchServer(lat, lon, forceHighRes, locale, includeExternalAi);
  if (!weather) throw new Error("fetchServer returned null");
  writeCache(lat, lon, weather, locale);
  
  // Async background enrichment (Teaser for Homepage)
  if (onSummary) {
    getAiVerdict(weather)
      .then((v) => {
        patchCacheSummary(lat, lon, v, locale);
        onSummary(v);
      })
      .catch(() => {});
  }
  if (onNeural) {
    getNeuralInsights(lat, lon, weather)
      .then((n) => {
        patchCacheNeural(lat, lon, n, locale);
        onNeural(n);
      })
      .catch(() => {});
  }
  return weather;
}

export async function loadWeather(
  lat: number,
  lon: number,
  onSummary?: (verdict: string) => void,
  onFresh?: (weather: WeatherData) => void,
  onNeural?: (neural: WeatherData["neuralData"]) => void,
  forceHighRes = false,
  locale: Locale = "nl",
  includeExternalAi = false
): Promise<WeatherData> {
  const k = key(lat, lon, locale);
  const cached = readCache(lat, lon, locale);
  const now = Date.now();

  // FRESH cache — direct terug, maar niet als forceHighRes en modellen ontbreken
  const cachedHasModels = cached?.weather.hourly?.[0]?.models?.icon !== undefined;
  if (cached && now - cached.ts < FRESH_MS && (!forceHighRes || cachedHasModels)) {
    if (!cached.weather.summaryVerdict && onSummary) {
      getAiVerdict(cached.weather)
        .then((v) => { patchCacheSummary(lat, lon, v, locale); onSummary(v); })
        .catch(() => {});
    }
    if (!cached.weather.neuralData && onNeural) {
      getNeuralInsights(lat, lon, cached.weather)
        .then((n) => { patchCacheNeural(lat, lon, n, locale); onNeural(n); })
        .catch(() => {});
    }
    return cached.weather;
  }

  // STALE cache — toon direct, revalideer op achtergrond (SWR)
  if (cached && now - cached.ts < STALE_MS && (!forceHighRes || cachedHasModels)) {
    if (!revalidating.has(k)) {
      revalidating.add(k);
      fetchAndCache(lat, lon, onSummary, onNeural, false, locale, includeExternalAi)
        .then((fresh) => onFresh?.(fresh))
        .catch(() => {})
        .finally(() => revalidating.delete(k));
    }
    if (!cached.weather.summaryVerdict && onSummary) {
      getAiVerdict(cached.weather)
        .then((v) => { patchCacheSummary(lat, lon, v, locale); onSummary(v); })
        .catch(() => {});
    }
    if (!cached.weather.neuralData && onNeural) {
      getNeuralInsights(lat, lon, cached.weather)
        .then((n) => { patchCacheNeural(lat, lon, n, locale); onNeural(n); })
        .catch(() => {});
    }
    return cached.weather;
  }

  // COLD — dedup
  const existing = inflight.get(k);
  if (existing) return existing;

  // EMERGENCY cache: stale data > 60min maar < 4uur — toon direct bij API-uitval
  const emergencyCached = cached && now - cached.ts < EMERGENCY_MS ? cached : null;

  const promise = fetchAndCache(lat, lon, onSummary, onNeural, forceHighRes, locale, includeExternalAi).catch((err) => {
    if (emergencyCached) {
      console.warn("fetchAndCache failed, using emergency cache:", err?.message);
      return emergencyCached.weather;
    }
    throw err;
  });
  inflight.set(k, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(k);
  }
}

/**
 * Laadt de volledige Weerzone Weather System (WWS) payload.
 * Gebruikt caching om dubbele API calls te voorkomen.
 */
export async function loadWWS(lat: number, lon: number): Promise<WWSPayload | null> {
  const k = key(lat, lon, "nl");
  const cached = wwsMemory.get(k);
  const now = Date.now();

  if (cached && now - cached.ts < FRESH_MS) {
    return cached.payload;
  }

  try {
    const res = await fetch(`/api/wws?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("WWS fetch failed");
    const payload = await res.json() as WWSPayload;
    wwsMemory.set(k, { payload, ts: now });
    return payload;
  } catch (err) {
    console.error("loadWWS error:", err);
    return null;
  }
}

export function prefetchWeather(lat: number, lon: number) {
  const cached = readCache(lat, lon, "nl");
  if (cached && Date.now() - cached.ts < FRESH_MS) return;
  if (inflight.get(key(lat, lon, "nl"))) return;
  loadWeather(lat, lon).catch(() => {});
}
