/**
 * Mariana Tesla — convectieve data-collector.
 *
 * De bestaande weather.ts haalt per locatie al meerdere modellen op, maar bewaart
 * per model alleen temp/neerslag/wind/code. Tesla heeft de CONVECTIEVE velden
 * nodig (CAPE/CIN/LI/shear/theta-e-proxy/drukniveaus). Daarom een dedicated fetch
 * per model via Open-Meteo, met een superset aan hourly-variabelen — modellen die
 * een veld niet leveren geven simpelweg een lege/ontbrekende array terug.
 *
 * We fetchen ruw en condenseren daarna tot een compacte per-model digest, zodat
 * de LLM-packet rijk maar klein blijft (geen 96 uur x 5 modellen x 18 velden).
 */

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

/** Tesla's modellenlijst (sectie "Inputbronnen"), met Open-Meteo-slugs. */
export const TESLA_MODELS: readonly { key: string; label: string; slug: string }[] = [
  { key: "HARMONIE", label: "KNMI HARMONIE", slug: "knmi_seamless" },
  { key: "AROME", label: "Meteo-France AROME", slug: "meteofrance_arome_france_hd" },
  { key: "ICON_D2", label: "DWD ICON-D2", slug: "dwd_icon_d2" },
  { key: "ECMWF", label: "ECMWF IFS", slug: "ecmwf_ifs025" },
  { key: "GFS", label: "GFS", slug: "gfs_seamless" },
];

/** Hourly convectieve + drukniveau-variabelen (superset). */
const CONVECTIVE_HOURLY_VARS = [
  "temperature_2m",
  "dew_point_2m",
  "relative_humidity_2m",
  "precipitation",
  "cloud_cover",
  "cloud_cover_low",
  "wind_speed_10m",
  "wind_gusts_10m",
  "cape",
  "convective_inhibition",
  "lifted_index",
  "temperature_850hPa",
  "temperature_700hPa",
  "temperature_500hPa",
  "geopotential_height_500hPa",
  "wind_speed_850hPa",
  "wind_speed_500hPa",
  "wind_direction_500hPa",
].join(",");

/** Ruwe hourly-respons; alle convectieve velden optioneel (modelafhankelijk). */
export interface RawConvectiveHourly {
  time: string[];
  temperature_2m?: number[];
  dew_point_2m?: number[];
  relative_humidity_2m?: number[];
  precipitation?: number[];
  cloud_cover?: number[];
  cloud_cover_low?: number[];
  wind_speed_10m?: number[];
  wind_gusts_10m?: number[];
  cape?: number[];
  convective_inhibition?: number[];
  lifted_index?: number[];
  temperature_850hPa?: number[];
  temperature_700hPa?: number[];
  temperature_500hPa?: number[];
  geopotential_height_500hPa?: number[];
  wind_speed_850hPa?: number[];
  wind_speed_500hPa?: number[];
  wind_direction_500hPa?: number[];
}

/** Een venster waarin Tesla analyseert (lokale uren, inclusief). */
export interface AnalysisWindow {
  /** ISO-string begin (lokaal, Europe/Amsterdam-naïef zoals Open-Meteo levert). */
  fromIso: string;
  /** ISO-string eind. */
  untilIso: string;
}

/** Een numeriek extremum met het uur waarop het optreedt. */
interface Extremum {
  value: number;
  atIso: string;
}

/** Gecondenseerde per-model convectieve digest voor de LLM-packet. */
export interface ConvectiveModelDigest {
  modelKey: string;
  modelLabel: string;
  /** Of het model bruikbare data leverde. */
  available: boolean;
  peakCape: Extremum | null;
  /** CIN-extreem dat het diepst remt (Open-Meteo: negatiever = sterkere cap). */
  strongestCin: Extremum | null;
  /** Meest negatieve Lifted Index (instabielst). */
  minLiftedIndex: Extremum | null;
  maxGust: Extremum | null;
  maxDewPoint: Extremum | null;
  /** Som van neerslag in het venster (mm). */
  precipTotal: number | null;
  /** Gemiddelde lage bewolking in het venster (%). */
  meanCloudCoverLow: number | null;
  /** Bulk-shear proxy: |wind_500hPa - wind_10m| op het CAPE-piekuur (km/h). */
  bulkShearProxyAtPeak: number | null;
  /** 500 hPa temperatuur op het CAPE-piekuur (koude bovenlucht = steilere lapse). */
  t500AtPeak: number | null;
}

function defaultWindowForToday(): AnalysisWindow {
  // Convectief dagvenster 06:00-23:00 lokaal (naïeve ISO, geen tz-suffix —
  // matcht Open-Meteo's Europe/Amsterdam hourly time-strings).
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { fromIso: `${y}-${m}-${d}T06:00`, untilIso: `${y}-${m}-${d}T23:00` };
}

async function fetchConvectiveModel(
  lat: number,
  lon: number,
  slug: string
): Promise<RawConvectiveHourly | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: CONVECTIVE_HOURLY_VARS,
    models: slug,
    timezone: "Europe/Amsterdam",
    forecast_days: "2",
  });
  try {
    const res = await fetch(`${OPEN_METEO_BASE}?${params}`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hourly = data?.hourly;
    if (!hourly || !Array.isArray(hourly.time)) return null;
    return hourly as RawConvectiveHourly;
  } catch {
    return null;
  }
}

/** Haalt alle Tesla-modellen parallel op voor één analysepunt. */
export async function fetchConvectiveModels(
  lat: number,
  lon: number
): Promise<{ model: (typeof TESLA_MODELS)[number]; hourly: RawConvectiveHourly | null }[]> {
  const results = await Promise.all(
    TESLA_MODELS.map(async (model) => ({
      model,
      hourly: await fetchConvectiveModel(lat, lon, model.slug),
    }))
  );
  return results;
}

/** Indices binnen het analysevenster. */
function windowIndices(times: string[], window: AnalysisWindow): number[] {
  const idx: number[] = [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (t >= window.fromIso && t <= window.untilIso) idx.push(i);
  }
  return idx;
}

function extremum(
  arr: number[] | undefined,
  times: string[],
  idx: number[],
  mode: "max" | "min"
): Extremum | null {
  if (!arr) return null;
  let best: Extremum | null = null;
  for (const i of idx) {
    const v = arr[i];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (best === null || (mode === "max" ? v > best.value : v < best.value)) {
      best = { value: v, atIso: times[i] };
    }
  }
  return best;
}

function sumIn(arr: number[] | undefined, idx: number[]): number | null {
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

function meanIn(arr: number[] | undefined, idx: number[]): number | null {
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

/** Condenseert één ruwe model-respons tot een digest binnen het venster. */
export function digestConvectiveModel(
  modelKey: string,
  modelLabel: string,
  hourly: RawConvectiveHourly | null,
  window: AnalysisWindow
): ConvectiveModelDigest {
  const base: ConvectiveModelDigest = {
    modelKey,
    modelLabel,
    available: false,
    peakCape: null,
    strongestCin: null,
    minLiftedIndex: null,
    maxGust: null,
    maxDewPoint: null,
    precipTotal: null,
    meanCloudCoverLow: null,
    bulkShearProxyAtPeak: null,
    t500AtPeak: null,
  };
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) return base;

  const times = hourly.time;
  const idx = windowIndices(times, window);
  if (idx.length === 0) return base;

  const peakCape = extremum(hourly.cape, times, idx, "max");

  // Shear-proxy + T500 op het CAPE-piekuur (waar de updraft het sterkst kan zijn).
  let bulkShearProxyAtPeak: number | null = null;
  let t500AtPeak: number | null = null;
  if (peakCape) {
    const peakIdx = times.indexOf(peakCape.atIso);
    if (peakIdx >= 0) {
      const w500 = hourly.wind_speed_500hPa?.[peakIdx];
      const w10 = hourly.wind_speed_10m?.[peakIdx];
      if (typeof w500 === "number" && typeof w10 === "number") {
        bulkShearProxyAtPeak = Math.round(Math.abs(w500 - w10));
      }
      const t500 = hourly.temperature_500hPa?.[peakIdx];
      if (typeof t500 === "number") t500AtPeak = Math.round(t500);
    }
  }

  return {
    modelKey,
    modelLabel,
    available: true,
    peakCape,
    strongestCin: extremum(hourly.convective_inhibition, times, idx, "min"),
    minLiftedIndex: extremum(hourly.lifted_index, times, idx, "min"),
    maxGust: extremum(hourly.wind_gusts_10m, times, idx, "max"),
    maxDewPoint: extremum(hourly.dew_point_2m, times, idx, "max"),
    precipTotal: sumIn(hourly.precipitation, idx),
    meanCloudCoverLow: meanIn(hourly.cloud_cover_low, idx),
    bulkShearProxyAtPeak,
    t500AtPeak,
  };
}

/** Haalt + condenseert alle modellen voor één regio-analysepunt. */
export async function collectConvectiveDigests(
  lat: number,
  lon: number,
  window: AnalysisWindow = defaultWindowForToday()
): Promise<{ window: AnalysisWindow; digests: ConvectiveModelDigest[] }> {
  const models = await fetchConvectiveModels(lat, lon);
  const digests = models.map(({ model, hourly }) =>
    digestConvectiveModel(model.key, model.label, hourly, window)
  );
  return { window, digests };
}

export { defaultWindowForToday };
