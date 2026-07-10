/**
 * KNMI Data Platform client
 * EDR API: near real-time station observations + climate data
 * Open Data API: radar file listing
 *
 * Keys (free, registered tier via developer.dataplatform.knmi.nl → API Catalog):
 *   KNMI_EDR_API_KEY  → EDR API subscription
 *   KNMI_ODA_API_KEY  → Open Data API subscription
 *
 * If KNMI issues the same key value for both, just set them to the same string.
 * Fallback: if only KNMI_API_KEY is set, it is used for both.
 */

const EDR_BASE = "https://api.dataplatform.knmi.nl/edr/v1";
const ODA_BASE = "https://api.dataplatform.knmi.nl/open-data/v1";

// 5-minute radar datasets to try in order (first successful wins)
const RADAR_CANDIDATES: Array<{ dataset: string; version: string }> = [
  { dataset: "radar_reflectivity_composites_2km_5min", version: "2.0" },
  { dataset: "radar_reflectivity_composites_2km_5min", version: "1.0" },
  { dataset: "radar_tar_5min_vol", version: "1.0" },
  { dataset: "radar_echotopheight_5min", version: "1.0" },
];

function edrHeaders(): HeadersInit {
  const key = process.env.KNMI_EDR_API_KEY ?? process.env.KNMI_API_KEY;
  if (!key) throw new Error("KNMI_EDR_API_KEY not set");
  return { Authorization: key };
}

function odaHeaders(): HeadersInit {
  const key = process.env.KNMI_ODA_API_KEY ?? process.env.KNMI_API_KEY;
  if (!key) throw new Error("KNMI_ODA_API_KEY not set");
  return { Authorization: key };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KNMIObservation {
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  temperature: number | null;   // ta °C
  humidity: number | null;      // rh %
  windSpeed: number | null;     // ff m/s
  windDirection: number | null; // dd degrees
  precipitation: number | null; // pr mm per 10 min
  measuredAt: string;           // ISO timestamp of latest value
}

export interface KNMIClimateMonth {
  stationId: string;
  stationName: string;
  avgTemp: number | null;
  avgTempMax: number | null;
  avgTempMin: number | null;
  totalPrecipitation: number | null;
  totalSunHours: number | null;
  daysWithData: number;
}

export interface KNMIRadarFile {
  dataset: string;
  filename: string;
  size: number;
  lastModified: string; // ISO timestamp
  downloadUrl?: string;
}

// ─── CoverageJSON helpers ─────────────────────────────────────────────────────

function parseLatestValue(ranges: Record<string, any>, param: string): number | null {
  const range = ranges?.[param];
  if (!range) return null;
  const values: (number | null)[] = range.values ?? [];
  // Most recent non-null value (last in the time series)
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== null && values[i] !== undefined) return values[i] as number;
  }
  return null;
}

function parseAllValues(ranges: Record<string, any>, param: string): (number | null)[] {
  return ranges?.[param]?.values ?? [];
}

// ─── EDR: station observation ─────────────────────────────────────────────────

/**
 * Returns the latest 10-minute observation for the station nearest to (lat, lon).
 * Uses the EDR position query which resolves to the nearest station automatically.
 */
export async function fetchNearestStationObservation(
  lat: number,
  lon: number
): Promise<KNMIObservation | null> {
  // Step 1: find the nearest station ID
  const station = await nearestKNMIStationId(lat, lon);
  if (!station) return null;

  const headers = edrHeaders();
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 60_000);
  const datetime = `${from.toISOString().replace(/\.\d+Z$/, "Z")}/${now.toISOString().replace(/\.\d+Z$/, "Z")}`;

  const params = new URLSearchParams({
    datetime,
    "parameter-name": "ta,rh,ff,dd,R1H",
    f: "CoverageJSON",
  });

  try {
    const res = await fetch(
      `${EDR_BASE}/collections/10-minute-in-situ-meteorological-observations/locations/${encodeURIComponent(station.id)}?${params}`,
      { headers, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const cj = await res.json();

    const axes = cj?.domain?.axes;
    const stationLon = axes?.x?.values?.[0] ?? lon;
    const stationLat = axes?.y?.values?.[0] ?? lat;
    const times: string[] = axes?.t?.values ?? [];
    const measuredAt = times[times.length - 1] ?? now.toISOString();

    // EDR returns CoverageCollection when querying a location; unwrap first coverage
    const coverage = cj?.type === "CoverageCollection" ? cj?.coverages?.[0] : cj;
    const ranges = coverage?.ranges ?? {};

    return {
      stationId: station.id,
      stationName: station.name,
      lat: stationLat,
      lon: stationLon,
      temperature: parseLatestValue(ranges, "ta"),
      humidity: parseLatestValue(ranges, "rh"),
      windSpeed: parseLatestValue(ranges, "ff"),
      windDirection: parseLatestValue(ranges, "dd"),
      precipitation: parseLatestValue(ranges, "R1H"),
      measuredAt,
    };
  } catch {
    return null;
  }
}

/**
 * Gemeten dagmax (ta) van het station dichtst bij (lat, lon), over de UTC-dag
 * dayISO (YYYY-MM-DD). De dagmax valt vrijwel altijd midden op de dag, dus het
 * UTC-venster dekt de NL-dagmax; de avond-cron draait na 20:00 UTC zodat de
 * piek zeker binnen is. Minimaal 6 uur aan 10-min-waarden vereist, anders null
 * (halve dagen leveren geen eerlijke max op).
 */
export async function fetchStationDayMaxTemp(
  lat: number,
  lon: number,
  dayISO: string
): Promise<{ stationId: string; stationName: string; maxTemp: number } | null> {
  const station = await nearestKNMIStationId(lat, lon);
  if (!station) return null;

  const headers = edrHeaders();
  const params = new URLSearchParams({
    datetime: `${dayISO}T00:00:00Z/${dayISO}T23:59:59Z`,
    "parameter-name": "ta",
    f: "CoverageJSON",
  });

  try {
    const res = await fetch(
      `${EDR_BASE}/collections/10-minute-in-situ-meteorological-observations/locations/${encodeURIComponent(station.id)}?${params}`,
      { headers, next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const cj = await res.json();
    const coverage = cj?.type === "CoverageCollection" ? cj?.coverages?.[0] : cj;
    const values: (number | null)[] = coverage?.ranges?.ta?.values ?? [];
    const temps = values.filter((v): v is number => typeof v === "number");
    if (temps.length < 36) return null; // < 6 uur aan metingen
    return { stationId: station.id, stationName: station.name, maxTemp: Math.max(...temps) };
  } catch {
    return null;
  }
}

// ─── EDR: nearest station ID ──────────────────────────────────────────────────

interface LocationFeature {
  id: string;
  geometry: { coordinates: [number, number] };
  properties: { name?: string };
}

/**
 * Returns the KNMI station ID + name closest to (lat, lon).
 * Calls the /locations endpoint which returns a GeoJSON FeatureCollection.
 */
export async function nearestKNMIStationId(
  lat: number,
  lon: number
): Promise<{ id: string; name: string } | null> {
  const headers = edrHeaders();
  try {
    const res = await fetch(
      `${EDR_BASE}/collections/10-minute-in-situ-meteorological-observations/locations`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const fc = await res.json();
    const features: LocationFeature[] = fc?.features ?? [];

    let nearest: { id: string; name: string } | null = null;
    let minDist = Infinity;

    for (const f of features) {
      const [sLon, sLat] = f.geometry.coordinates;
      const dLat = (sLat - lat) * (Math.PI / 180);
      const dLon = (sLon - lon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(sLat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
      const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
      if (dist < minDist) {
        minDist = dist;
        nearest = { id: f.id, name: f.properties.name ?? f.id };
      }
    }
    return nearest;
  } catch {
    return null;
  }
}

// ─── EDR: monthly climate data ────────────────────────────────────────────────

/**
 * Fetches daily observations for the given month from the validated collection.
 * Falls back to the previous month if the current month has no validated data yet
 * (validated data typically lags a few weeks behind).
 */
export async function fetchMonthlyClimateData(
  stationId: string,
  year: number,
  month: number // 1-indexed
): Promise<KNMIClimateMonth | null> {
  const result = await _fetchDailyRange(stationId, year, month);
  if (result && result.daysWithData > 0) return result;

  // Validated data not yet available for this month — try previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return _fetchDailyRange(stationId, prevYear, prevMonth);
}

async function _fetchDailyRange(
  stationId: string,
  year: number,
  month: number
): Promise<KNMIClimateMonth | null> {
  const headers = edrHeaders();

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Math.min(Date.UTC(year, month, 0, 23, 59, 59), Date.now()));
  const datetime = `${from.toISOString().replace(/\.\d+Z$/, "Z")}/${to.toISOString().replace(/\.\d+Z$/, "Z")}`;

  const params = new URLSearchParams({
    datetime,
    "parameter-name": "TG,TX,TN,RH,SQ",
    f: "CoverageJSON",
  });

  try {
    const res = await fetch(
      `${EDR_BASE}/collections/daily-in-situ-meteorological-observations-validated/locations/${encodeURIComponent(stationId)}?${params}`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const cj = await res.json();

    const coverage = cj?.type === "CoverageCollection" ? cj?.coverages?.[0] : cj;
    const ranges = coverage?.ranges ?? {};

    const tg = parseAllValues(ranges, "TG").filter((v) => v !== null) as number[];
    const tx = parseAllValues(ranges, "TX").filter((v) => v !== null) as number[];
    const tn = parseAllValues(ranges, "TN").filter((v) => v !== null) as number[];
    const rh = parseAllValues(ranges, "RH").filter((v) => v !== null && (v as number) >= 0) as number[];
    // SQ = sunshine duration in 0.1 h/day; negative values mean <0.05 h, treat as 0
    const sq = parseAllValues(ranges, "SQ").filter((v) => v !== null) as number[];

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const sum = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) : null;

    // EDR API returns values in SI units (°C, mm, h) — no scaling needed
    return {
      stationId,
      stationName: coverage?.parameters?.TG?.description?.en ?? stationId,
      avgTemp: tg.length ? Math.round(avg(tg)! * 10) / 10 : null,
      avgTempMax: tx.length ? Math.round(avg(tx)! * 10) / 10 : null,
      avgTempMin: tn.length ? Math.round(avg(tn)! * 10) / 10 : null,
      totalPrecipitation: rh.length ? Math.round(sum(rh)! * 10) / 10 : null,
      totalSunHours: sq.length ? Math.round(sum(sq.map((v) => Math.max(0, v)))! * 10) / 10 : null,
      daysWithData: tg.length,
    };
  } catch {
    return null;
  }
}

// ─── Open Data API: short-term weather forecast (text bulletin) ───────────────

const FORECAST_DATASET = "short_term_weather_forecast";
const FORECAST_VERSION = "1.0";

function stripXmlTags(xml: string): string {
  return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fetches the latest KNMI short-term weather forecast text bulletin.
 * Published several times a day; covers today + tomorrow for the Netherlands.
 * Prefers .txt files; falls back to .xml with tag stripping.
 * Returns the raw Dutch text, or null on failure.
 */
export async function fetchKNMIShortForecast(): Promise<string | null> {
  const headers = odaHeaders();

  try {
    // Fetch 5 recent files — KNMI publishes txt+xml pairs so txt may not be #1
    const listRes = await fetch(
      `${ODA_BASE}/datasets/${FORECAST_DATASET}/versions/${FORECAST_VERSION}/files?orderBy=lastModified&sorting=desc&maxKeys=5`,
      { headers, next: { revalidate: 1800 } }
    );
    if (!listRes.ok) return null;
    const listData = await listRes.json();
    const files: Array<{ filename: string }> = listData?.files ?? [];
    if (!files.length) return null;

    // Prefer .txt; fall back to .xml
    const pick =
      files.find((f) => String(f.filename).endsWith(".txt")) ??
      files.find((f) => String(f.filename).endsWith(".xml")) ??
      files[0];

    const urlRes = await fetch(
      `${ODA_BASE}/datasets/${FORECAST_DATASET}/versions/${FORECAST_VERSION}/files/${encodeURIComponent(pick.filename)}/url`,
      { headers, next: { revalidate: 1800 } }
    );
    if (!urlRes.ok) return null;
    const downloadUrl: string | undefined = (await urlRes.json())?.temporaryDownloadUrl;
    if (!downloadUrl) return null;

    const textRes = await fetch(downloadUrl);
    if (!textRes.ok) return null;

    const raw = await textRes.text();
    const text = pick.filename.endsWith(".xml") ? stripXmlTags(raw) : raw;
    return text.trim().slice(0, 1000) || null;
  } catch {
    return null;
  }
}

// ─── Open Data API: radar ─────────────────────────────────────────────────────

/**
 * Returns metadata for the most recently published radar file.
 * If the dataset name needs to be adjusted after initial API registration,
 * update RADAR_DATASET at the top of this file.
 */
export async function fetchLatestRadarFile(): Promise<KNMIRadarFile | null> {
  const headers = odaHeaders();

  for (const { dataset, version } of RADAR_CANDIDATES) {
    try {
      const listRes = await fetch(
        `${ODA_BASE}/datasets/${dataset}/versions/${version}/files?orderBy=lastModified&sorting=desc&maxKeys=1`,
        { headers, next: { revalidate: 300 } }
      );
      if (!listRes.ok) continue;
      const listData = await listRes.json();
      const file = listData?.files?.[0];
      if (!file) continue;

      const urlRes = await fetch(
        `${ODA_BASE}/datasets/${dataset}/versions/${version}/files/${encodeURIComponent(file.filename)}/url`,
        { headers, next: { revalidate: 300 } }
      );
      const downloadUrl: string | undefined = urlRes.ok
        ? (await urlRes.json())?.temporaryDownloadUrl
        : undefined;

      return {
        dataset,
        filename: file.filename as string,
        size: file.size as number,
        lastModified: file.lastModified as string,
        downloadUrl,
      };
    } catch {
      continue;
    }
  }
  return null;
}
