/**
 * Mariana Studio — temperatuur-pipeline.
 *
 * Verhuisd uit de (verwijderde) mariana-tiktok-email route. Open-Meteo serveert
 * kale modeloutput; voor NL kiest best_match HARMONIE, die in hitte 2-3° boven de
 * profs loopt. De mediaan over meerdere modellen landt op het profniveau zonder
 * eigen correctie. Zie docs/superpowers/specs/2026-06-24-tiktok-brief-multimodel-temp-design.md
 */

import { getWindBeaufort } from "@/lib/weather";
import type { Region, RegionTemps, Ranked } from "./types";

export type { Ranked } from "./types";

// naam, lat, lon, regio
const PLACES: Array<[string, number, number, Region]> = [
  ["Den Helder", 52.96, 4.76, "West"], ["Texel", 53.15, 4.88, "Noord"], ["IJmuiden", 52.46, 4.61, "West"],
  ["Petten", 52.77, 4.66, "West"], ["Zandvoort", 52.37, 4.53, "West"], ["Hoek van Holland", 51.98, 4.13, "West"],
  ["Vlieland", 53.30, 5.07, "Noord"], ["Terschelling", 53.36, 5.34, "Noord"], ["Ameland", 53.45, 5.74, "Noord"],
  ["Schiermonnikoog", 53.48, 6.16, "Noord"], ["Lauwersoog", 53.41, 6.21, "Noord"], ["Harlingen", 53.17, 5.42, "Noord"],
  ["Vlissingen", 51.44, 3.57, "Zuid"], ["Middelburg", 51.50, 3.61, "Zuid"], ["Terneuzen", 51.34, 3.83, "Zuid"], ["Goes", 51.50, 3.89, "Zuid"],
  ["Maastricht", 50.85, 5.69, "Zuid"], ["Heerlen", 50.89, 5.98, "Zuid"], ["Roermond", 51.19, 5.99, "Zuid"], ["Venlo", 51.37, 6.17, "Zuid"],
  ["Eindhoven", 51.44, 5.48, "Zuid"], ["Tilburg", 51.56, 5.09, "Zuid"], ["Breda", 51.59, 4.78, "Zuid"], ["Roosendaal", 51.53, 4.46, "Zuid"],
  ["Den Bosch", 51.70, 5.30, "Zuid"], ["Nijmegen", 51.84, 5.86, "Oost"], ["Arnhem", 51.98, 5.91, "Oost"],
  ["Utrecht", 52.09, 5.12, "Midden"], ["Amersfoort", 52.16, 5.39, "Midden"], ["Apeldoorn", 52.21, 5.97, "Oost"], ["Enschede", 52.22, 6.90, "Oost"],
  ["Zwolle", 52.51, 6.09, "Oost"], ["Assen", 52.99, 6.56, "Noord"], ["Emmen", 52.78, 6.90, "Oost"], ["Groningen", 53.22, 6.57, "Noord"],
  ["Leeuwarden", 53.20, 5.79, "Noord"], ["De Bilt", 52.10, 5.18, "Midden"],
  ["Amsterdam", 52.37, 4.90, "West"], ["Rotterdam", 51.92, 4.48, "West"], ["Den Haag", 52.08, 4.31, "West"], ["Alkmaar", 52.63, 4.75, "West"],
];

const BLEND_MODELS = ["knmi_seamless", "ecmwf_ifs025", "icon_eu", "gfs_seamless", "ukmo_seamless"];

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Verwachte max per plek (multi-model mediaan), gesorteerd warm→koel. */
export async function forecastRanking(dayOffset = 0): Promise<Ranked[]> {
  const lat = PLACES.map((p) => p[1]).join(",");
  const lon = PLACES.map((p) => p[2]).join(",");
  const base = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=Europe%2FAmsterdam&forecast_days=${dayOffset + 1}`;
  try {
    const res = await fetch(`${base}&models=${BLEND_MODELS.join(",")}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: Record<string, (number | null)[]> }>;
    const ranked = PLACES
      .map((p, i) => {
        const vals = BLEND_MODELS
          .map((mdl) => rows[i]?.daily?.[`temperature_2m_max_${mdl}`]?.[dayOffset])
          .filter((v): v is number => typeof v === "number");
        return { name: p[0], region: p[3], value: vals.length ? median(vals) : undefined };
      })
      .filter((r): r is Ranked => typeof r.value === "number")
      .sort((a, b) => b.value - a.value);
    if (ranked.length) return ranked;
    throw new Error("multi-model leverde geen temperaturen");
  } catch {
    const res = await fetch(base, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: { temperature_2m_max?: number[] } }>;
    return PLACES
      .map((p, i) => ({ name: p[0], region: p[3], value: rows[i]?.daily?.temperature_2m_max?.[dayOffset] }))
      .filter((r): r is Ranked => typeof r.value === "number")
      .sort((a, b) => b.value - a.value);
  }
}

/** Nu gemeten temp per plek (multi-model mediaan van current), gesorteerd warm→koel. */
export async function currentRanking(): Promise<Ranked[]> {
  const lat = PLACES.map((p) => p[1]).join(",");
  const lon = PLACES.map((p) => p[2]).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=Europe%2FAmsterdam&models=${BLEND_MODELS.join(",")}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();
  const rows = (Array.isArray(data) ? data : [data]) as Array<{ current?: Record<string, number | null> }>;
  return PLACES
    .map((p, i) => {
      const c = rows[i]?.current ?? {};
      const vals = BLEND_MODELS
        .map((mdl) => c[`temperature_2m_${mdl}`])
        .filter((v): v is number => typeof v === "number");
      // fallback: ongesuffixte current als models-variant ontbreekt
      const single = typeof c.temperature_2m === "number" ? c.temperature_2m : undefined;
      const value = vals.length ? median(vals) : single;
      return { name: p[0], region: p[3], value };
    })
    .filter((r): r is Ranked => typeof r.value === "number")
    .sort((a, b) => b.value - a.value);
}

const ORDER: Region[] = ["Noord", "Oost", "Midden", "West", "Zuid"];

export function regionAverages(ranked: Ranked[]): RegionTemps {
  const out = {} as Record<Region, number>;
  for (const region of ORDER) {
    const vals = ranked.filter((r) => r.region === region).map((r) => r.value);
    out[region] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  return { noord: out.Noord, oost: out.Oost, midden: out.Midden, west: out.West, zuid: out.Zuid };
}

/** De Bilt als landelijke referentie voor de detail-metrics. */
export async function details(dayOffset = 0): Promise<{ uv: number; sunHours: number; windBft: number }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=52.10&longitude=5.18&daily=uv_index_max,sunshine_duration,wind_speed_10m_max&timezone=Europe%2FAmsterdam&forecast_days=${dayOffset + 1}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const d = await res.json().catch(() => null);
  const day = d?.daily ?? {};
  return {
    uv: Math.round(day.uv_index_max?.[dayOffset] ?? 0),
    sunHours: Math.round((day.sunshine_duration?.[dayOffset] ?? 0) / 3600),
    windBft: getWindBeaufort(day.wind_speed_10m_max?.[dayOffset] ?? 0).scale,
  };
}
