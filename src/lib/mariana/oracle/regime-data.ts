/**
 * Mariana Oracle — regime-data-collector (48-96u synoptisch).
 *
 * Oracle's primaire modellen zijn GFS, ECMWF en AIFS. Voor regime-analyse op
 * 48-96u zijn synoptische/drukniveau-velden relevant (500/700/850 hPa temp+wind,
 * geopotentiaal, MSLP, totale neerslag/wind aan de grond). We fetchen per model
 * via Open-Meteo en condenseren tot een per-model digest over het 48-96u-venster
 * — feiten, geen interpretatie. De LLM doet de regime-redenering.
 *
 * Dit staat bewust LOS van weather.ts (dat het 0-48u/locatie-pad voedt): Oracle
 * is een eigen middellange-termijn engine, net als Tesla's convective-data.
 */

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

/** Oracle's modellenlijst (GFS/ECMWF/AIFS), met Open-Meteo-slugs. */
export const ORACLE_MODELS: readonly { key: string; label: string; slug: string }[] = [
  { key: "ECMWF", label: "ECMWF IFS", slug: "ecmwf_ifs025" },
  { key: "GFS", label: "GFS", slug: "gfs_seamless" },
  { key: "AIFS", label: "ECMWF AIFS", slug: "ecmwf_aifs025_single" },
];

/** Synoptische/drukniveau hourly-variabelen (superset; modelafhankelijk). */
const SYNOPTIC_HOURLY_VARS = [
  "temperature_2m",
  "precipitation",
  "wind_speed_10m",
  "wind_gusts_10m",
  "pressure_msl",
  "cape",
  "temperature_850hPa",
  "temperature_700hPa",
  "temperature_500hPa",
  "geopotential_height_500hPa",
  "geopotential_height_850hPa",
  "wind_speed_850hPa",
  "wind_speed_500hPa",
  "wind_direction_850hPa",
  "wind_direction_500hPa",
].join(",");

export interface RawSynopticHourly {
  time: string[];
  temperature_2m?: number[];
  precipitation?: number[];
  wind_speed_10m?: number[];
  wind_gusts_10m?: number[];
  pressure_msl?: number[];
  cape?: number[];
  temperature_850hPa?: number[];
  temperature_700hPa?: number[];
  temperature_500hPa?: number[];
  geopotential_height_500hPa?: number[];
  geopotential_height_850hPa?: number[];
  wind_speed_850hPa?: number[];
  wind_speed_500hPa?: number[];
  wind_direction_850hPa?: number[];
  wind_direction_500hPa?: number[];
}

/** Het 48-96u-venster (naïeve lokale ISO, Europe/Amsterdam). */
export interface RegimeWindow {
  fromIso: string;
  untilIso: string;
}

/** Gecondenseerde per-model synoptische digest voor de regime-packet. */
export interface SynopticModelDigest {
  modelKey: string;
  modelLabel: string;
  available: boolean;
  /** Dagmax/dagmin 2m-temp over het venster. */
  tMax: number | null;
  tMin: number | null;
  /** Gemiddelde 850 hPa temp (luchtmassa-indicator). */
  t850Mean: number | null;
  /** Gemiddelde 500 hPa temp (koude bovenlucht / trog-indicator). */
  t500Mean: number | null;
  /** Spreiding 500 hPa geopotentiaal (trog/rug-amplitude-proxy, gpm). */
  z500Min: number | null;
  z500Max: number | null;
  /** MSLP min/max (laag/hoog-druk-passage). */
  mslpMin: number | null;
  mslpMax: number | null;
  /** Totale neerslag over het venster (mm). */
  precipTotal: number | null;
  /** Max windstoot (km/h). */
  maxGust: number | null;
  /** Gemiddelde 850 hPa windrichting (graden) — aanvoerrichting. */
  meanDir850: number | null;
  /** Max CAPE in het venster (grove onstabiliteits-hint voor de gate). */
  capeMax: number | null;
}

function defaultWindow4896(): RegimeWindow {
  // 48-96u vooruit, uur-precisie, naïef lokaal (matcht Open-Meteo time-strings).
  const now = Date.now();
  const fmt = (ms: number) => {
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    return `${y}-${m}-${da}T${h}:00`;
  };
  return { fromIso: fmt(now + 48 * 3600_000), untilIso: fmt(now + 96 * 3600_000) };
}

async function fetchSynopticModel(
  lat: number,
  lon: number,
  slug: string
): Promise<RawSynopticHourly | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: SYNOPTIC_HOURLY_VARS,
    models: slug,
    timezone: "Europe/Amsterdam",
    forecast_days: "5",
  });
  try {
    const res = await fetch(`${OPEN_METEO_BASE}?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hourly = data?.hourly;
    if (!hourly || !Array.isArray(hourly.time)) return null;
    return hourly as RawSynopticHourly;
  } catch {
    return null;
  }
}

function windowIndices(times: string[], window: RegimeWindow): number[] {
  const idx: number[] = [];
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= window.fromIso && times[i] <= window.untilIso) idx.push(i);
  }
  return idx;
}

function ext(arr: number[] | undefined, idx: number[], mode: "max" | "min"): number | null {
  if (!arr) return null;
  let best: number | null = null;
  for (const i of idx) {
    const v = arr[i];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (best === null || (mode === "max" ? v > best : v < best)) best = v;
  }
  return best === null ? null : Math.round(best);
}

function mean(arr: number[] | undefined, idx: number[]): number | null {
  if (!arr) return null;
  let s = 0;
  let n = 0;
  for (const i of idx) {
    const v = arr[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      s += v;
      n++;
    }
  }
  return n > 0 ? Math.round(s / n) : null;
}

function sum(arr: number[] | undefined, idx: number[]): number | null {
  if (!arr) return null;
  let s = 0;
  let seen = false;
  for (const i of idx) {
    const v = arr[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      s += v;
      seen = true;
    }
  }
  return seen ? Math.round(s * 10) / 10 : null;
}

/** Circulair gemiddelde van windrichtingen (graden). */
function meanDirection(arr: number[] | undefined, idx: number[]): number | null {
  if (!arr) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const i of idx) {
    const v = arr[i];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const rad = (v * Math.PI) / 180;
    sx += Math.cos(rad);
    sy += Math.sin(rad);
    n++;
  }
  if (n === 0) return null;
  let deg = (Math.atan2(sy / n, sx / n) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

export function digestSynopticModel(
  modelKey: string,
  modelLabel: string,
  hourly: RawSynopticHourly | null,
  window: RegimeWindow
): SynopticModelDigest {
  const base: SynopticModelDigest = {
    modelKey,
    modelLabel,
    available: false,
    tMax: null,
    tMin: null,
    t850Mean: null,
    t500Mean: null,
    z500Min: null,
    z500Max: null,
    mslpMin: null,
    mslpMax: null,
    precipTotal: null,
    maxGust: null,
    meanDir850: null,
    capeMax: null,
  };
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) return base;
  const idx = windowIndices(hourly.time, window);
  if (idx.length === 0) return base;

  return {
    modelKey,
    modelLabel,
    available: true,
    tMax: ext(hourly.temperature_2m, idx, "max"),
    tMin: ext(hourly.temperature_2m, idx, "min"),
    t850Mean: mean(hourly.temperature_850hPa, idx),
    t500Mean: mean(hourly.temperature_500hPa, idx),
    z500Min: ext(hourly.geopotential_height_500hPa, idx, "min"),
    z500Max: ext(hourly.geopotential_height_500hPa, idx, "max"),
    mslpMin: ext(hourly.pressure_msl, idx, "min"),
    mslpMax: ext(hourly.pressure_msl, idx, "max"),
    precipTotal: sum(hourly.precipitation, idx),
    maxGust: ext(hourly.wind_gusts_10m, idx, "max"),
    meanDir850: meanDirection(hourly.wind_direction_850hPa, idx),
    capeMax: ext(hourly.cape, idx, "max"),
  };
}

/** Haalt + condenseert alle Oracle-modellen voor één analysepunt (NL-centraal). */
export async function collectSynopticDigests(
  lat: number,
  lon: number,
  window: RegimeWindow = defaultWindow4896()
): Promise<{ window: RegimeWindow; digests: SynopticModelDigest[] }> {
  const results = await Promise.all(
    ORACLE_MODELS.map(async (model) => ({
      model,
      hourly: await fetchSynopticModel(lat, lon, model.slug),
    }))
  );
  const digests = results.map(({ model, hourly }) =>
    digestSynopticModel(model.key, model.label, hourly, window)
  );
  return { window, digests };
}

export { defaultWindow4896 };
