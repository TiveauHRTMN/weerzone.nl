"use client";

import type { WeatherData } from "./types";
import { getWeather as fetchServer, getAiVerdict } from "@/app/actions";

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

const FRESH_MS = 10 * 60 * 1000;   // 10 min — geen refetch
const STALE_MS = 60 * 60 * 1000;   // 60 min — toon direct, revalideer op achtergrond
const STORAGE_KEY_PREFIX = "wz_weather_v3_";

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<WeatherData>>();
const revalidating = new Set<string>();

function key(lat: number, lon: number) {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}
function storageKey(lat: number, lon: number) {
  return STORAGE_KEY_PREFIX + key(lat, lon);
}

function readCache(lat: number, lon: number): CacheEntry | null {
  const k = key(lat, lon);
  const mem = memory.get(k);
  if (mem) return mem;
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(lat, lon));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    memory.set(k, entry);
    return entry;
  } catch {
    return null;
  }
}
function writeCache(lat: number, lon: number, weather: WeatherData) {
  const k = key(lat, lon);
  const entry: CacheEntry = { weather, ts: Date.now() };
  memory.set(k, entry);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(lat, lon), JSON.stringify(entry));
  } catch {}
}
function patchCacheVerdict(lat: number, lon: number, verdict: string) {
  const entry = readCache(lat, lon);
  if (!entry) return;
  entry.weather.aiVerdict = verdict;
  writeCache(lat, lon, entry.weather);
}

async function fetchAndCache(
  lat: number,
  lon: number,
  onVerdict?: (v: string) => void
): Promise<WeatherData> {
  const weather = await fetchServer(lat, lon);
  writeCache(lat, lon, weather);
  if (onVerdict) {
    getAiVerdict(weather)
      .then((v) => {
        patchCacheVerdict(lat, lon, v);
        onVerdict(v);
      })
      .catch(() => {});
  }
  return weather;
}

export async function loadWeather(
  lat: number,
  lon: number,
  onVerdict?: (verdict: string) => void,
  onFresh?: (weather: WeatherData) => void
): Promise<WeatherData> {
  const k = key(lat, lon);
  const cached = readCache(lat, lon);
  const now = Date.now();

  // FRESH cache — direct terug, geen netwerk
  if (cached && now - cached.ts < FRESH_MS) {
    if (!cached.weather.aiVerdict && onVerdict) {
      getAiVerdict(cached.weather)
        .then((v) => { patchCacheVerdict(lat, lon, v); onVerdict(v); })
        .catch(() => {});
    }
    return cached.weather;
  }

  // STALE cache — toon direct, revalideer op achtergrond (SWR)
  if (cached && now - cached.ts < STALE_MS) {
    if (!revalidating.has(k)) {
      revalidating.add(k);
      fetchAndCache(lat, lon, onVerdict)
        .then((fresh) => onFresh?.(fresh))
        .catch(() => {})
        .finally(() => revalidating.delete(k));
    }
    if (!cached.weather.aiVerdict && onVerdict) {
      getAiVerdict(cached.weather)
        .then((v) => { patchCacheVerdict(lat, lon, v); onVerdict(v); })
        .catch(() => {});
    }
    return cached.weather;
  }

  // COLD — dedup
  const existing = inflight.get(k);
  if (existing) return existing;

  const promise = fetchAndCache(lat, lon, onVerdict);
  inflight.set(k, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(k);
  }
}

export function prefetchWeather(lat: number, lon: number) {
  const cached = readCache(lat, lon);
  if (cached && Date.now() - cached.ts < FRESH_MS) return;
  if (inflight.get(key(lat, lon))) return;
  loadWeather(lat, lon).catch(() => {});
}
