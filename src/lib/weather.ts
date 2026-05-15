import type { WeatherData, HourlyForecast, MinutelyPrecipitation, AirQualityData, MarineData } from "./types";
import { hermesChat } from "@/lib/hermes";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { fetchGoogleWeather, mapGoogleWeatherConditionToWMO } from "./google-weather";
import type { Locale } from "@/config/locales";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const DWD_ICON_BASE = "https://api.open-meteo.com/v1/dwd-icon";

const HOURLY_PARAMS = [
  "temperature_2m",
  "weather_code",
  "precipitation",
  "wind_speed_10m",
  "cape",
].join(",");

const CURRENT_PARAMS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "is_day",
].join(",");

const DAILY_PARAMS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "wind_speed_10m_max",
  "sunrise",
  "sunset",
  "uv_index_max",
  "sunshine_duration",
].join(",");

const BASE_URL_BY_LOCALE: Record<Locale, string> = {
  nl: OPEN_METEO_BASE,
  de: DWD_ICON_BASE,
  fr: OPEN_METEO_BASE,
};

const BASE_MODEL_BY_LOCALE: Record<Locale, string> = {
  nl: "knmi_seamless",
  de: "dwd_icon_d2",
  fr: "meteofrance_seamless",
};

const SECONDARY_MODEL_BY_LOCALE: Record<Locale, string> = {
  nl: "dwd_icon_d2",
  de: "knmi_seamless",
  fr: "icon_eu",
};

const LEAD_SOURCE_LABEL: Record<Locale, string> = {
  nl: "KNMI HARMONIE",
  de: "DWD ICON-D2",
  fr: "METEOFRANCE AROME",
};

const SECONDARY_SOURCE_LABEL: Record<Locale, string> = {
  nl: "DWD ICON-D2",
  de: "KNMI HARMONIE",
  fr: "DWD ICON-EU",
};

interface RawModelHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature?: number[];
  weather_code: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  cape?: number[];
}

async function fetchModel(
  url: string,
  lat: number,
  lon: number,
  extraParams?: Record<string, string>
): Promise<RawModelHourly | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: HOURLY_PARAMS + ",apparent_temperature",
    timezone: "Europe/Amsterdam",
    forecast_days: "2",
    forecast_hours: "48",
    ...extraParams,
  });

  try {
    const res = await fetch(`${url}?${params}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.hourly as RawModelHourly;
  } catch {
    return null;
  }
}

function blendHourly(
  harmonieData: RawModelHourly | null,
  fallbackData: { time: string[]; temperature_2m: number[]; apparent_temperature: number[]; weather_code: number[]; precipitation: number[]; wind_speed_10m: number[]; cape?: number[] }
): { hourly: HourlyForecast[]; agreement: number } {
  const times = fallbackData?.time ?? [];

  const hourly: HourlyForecast[] = times.map((time, i) => {
    // Gebruik Harmonie data indien beschikbaar, anders fallback op generic
    const temperature = Math.round(harmonieData?.temperature_2m?.[i] ?? fallbackData?.temperature_2m?.[i] ?? 0);
    const apparentTemperature = Math.round(harmonieData?.apparent_temperature?.[i] ?? fallbackData?.apparent_temperature?.[i] ?? 0);
    const precipitation = harmonieData?.precipitation?.[i] ?? fallbackData?.precipitation?.[i] ?? 0;
    const weatherCode = harmonieData?.weather_code?.[i] ?? fallbackData?.weather_code?.[i] ?? 0;
    const windSpeed = Math.round(harmonieData?.wind_speed_10m?.[i] ?? fallbackData?.wind_speed_10m?.[i] ?? 0);

    return {
      time,
      temperature,
      apparentTemperature,
      weatherCode,
      precipitation,
      windSpeed,
      cape: Math.round(fallbackData?.cape?.[i] ?? 0),
      confidence: "high"
    };
  });

  return { hourly, agreement: 100 };
}

export async function fetchWeatherData(
  lat: number,
  lon: number,
  isBot: boolean = false,
  forceHighRes: boolean = false,
  marianaLocation?: { name?: string; province?: string; lat: number; lon: number; id?: string; locationId?: string },
  locale: Locale = "nl"
): Promise<WeatherData> {
  // Skip live API calls during Next.js build-time static generation
  if (process.env.NEXT_PHASE === 'phase-production-build') return null as any;

  const attemptFetch = async (): Promise<any> => {
    const url = `${BASE_URL_BY_LOCALE[locale]}?${new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      models: BASE_MODEL_BY_LOCALE[locale],
      current: CURRENT_PARAMS,
      hourly: HOURLY_PARAMS + ",apparent_temperature",
      daily: DAILY_PARAMS,
      minutely_15: "precipitation",
      forecast_minutely_15: "96",
      timezone: locale === "de" ? "Europe/Berlin" : locale === "fr" ? "Europe/Paris" : "Europe/Amsterdam",
      forecast_days: "2",
      forecast_hours: "48",
    })}`;
    try {
      const res = await fetch(url, { 
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) {
        console.error("Open-Meteo non-ok", res.status, url.slice(0, 80));
        return null;
      }
      return await res.json();
    } catch (e) {
      console.error("Open-Meteo fetch error", e instanceof Error ? e.message : String(e));
      return null;
    }
  };

  try {
    const leadRes = await attemptFetch();

    const fetchPromises: Promise<any>[] = [Promise.resolve(leadRes)];

    // Zware extra modellen: alleen ophalen als expliciet gevraagd (forceHighRes)
    // of bij bots nooit. Default = alleen het basismodel → geen rate limiting.
    if (!isBot && forceHighRes) {
      fetchPromises.push(
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: SECONDARY_MODEL_BY_LOCALE[locale] }).catch(() => null),
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: "meteofrance_arome_france_hd" }).catch(() => null),
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: "ecmwf_ifs0p25" }).catch(() => null),
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: "gfs_seamless" }).catch(() => null)
      );
    }

    const results = await Promise.all(fetchPromises);
    const coreData = results[0];

    // Defensive check for core data
    if (!coreData || !coreData.current || !coreData.hourly) {
      console.error("fetchWeatherData: Core Open-Meteo data failed", { hasRes: !!coreData, locale, lat, lon });
      return null as any;
    }

    const secondaryData = (!isBot && forceHighRes ? results[1] : null) || null;
    const aromeData = (!isBot && forceHighRes ? results[2] : null) || null;
    const ecmwfData = (!isBot && forceHighRes ? results[3] : null) || null;
    const gfsData = (!isBot && forceHighRes ? results[4] : null) || null;

    const harmonieData = locale === "nl" ? coreData : secondaryData;
    const iconData = locale === "de" ? coreData : (locale === "fr" ? secondaryData : null);
    const googleData: any = null;

    const data = coreData;
    if (!data || !data.hourly || !data.daily || !data.current) {
      // Laatste strohalm: probeer tenminste iets terug te geven als de API structuur gek doet
      console.error("fetchWeatherData: Missing critical data fields", { hasData: !!data });
      if (data?.current) return { current: data.current, hourly: [], daily: [], minutely: [], models: { agreement: 0, label: "Geen data", sources: [] } } as any;
      return null as any;
    }
    
    // 1. BLEND HOURLY DATA WITH MULTIPLE MODELS
    const times = data.hourly.time ?? [];
    const hourly: HourlyForecast[] = times.map((time: string, i: number) => {
      const harmonie = (harmonieData && Array.isArray(harmonieData.temperature_2m)) ? {
        temperature: Math.round(harmonieData.temperature_2m[i] ?? 0),
        precipitation: harmonieData.precipitation?.[i] ?? 0,
        weatherCode: harmonieData.weather_code?.[i] ?? 0,
        windSpeed: Math.round(harmonieData.wind_speed_10m?.[i] ?? 0)
      } : undefined;

      const icon = (iconData && Array.isArray(iconData.temperature_2m)) ? {
        temperature: Math.round(iconData.temperature_2m[i] ?? 0),
        precipitation: iconData.precipitation?.[i] ?? 0,
        weatherCode: iconData.weather_code?.[i] ?? 0,
        windSpeed: Math.round(iconData.wind_speed_10m?.[i] ?? 0)
      } : undefined;

      const arome = (aromeData && Array.isArray(aromeData.temperature_2m)) ? {
        temperature: Math.round(aromeData.temperature_2m[i] ?? 0),
        precipitation: aromeData.precipitation?.[i] ?? 0,
        weatherCode: aromeData.weather_code?.[i] ?? 0,
        windSpeed: Math.round(aromeData.wind_speed_10m?.[i] ?? 0)
      } : undefined;

      const ecmwf = (ecmwfData && Array.isArray(ecmwfData.temperature_2m)) ? {
        temperature: Math.round(ecmwfData.temperature_2m[i] ?? 0),
        precipitation: ecmwfData.precipitation?.[i] ?? 0,
        weatherCode: ecmwfData.weather_code?.[i] ?? 0,
        windSpeed: Math.round(ecmwfData.wind_speed_10m?.[i] ?? 0)
      } : undefined;

      const gfs = (gfsData && Array.isArray(gfsData.temperature_2m)) ? {
        temperature: Math.round(gfsData.temperature_2m[i] ?? 0),
        precipitation: gfsData.precipitation?.[i] ?? 0,
        weatherCode: gfsData.weather_code?.[i] ?? 0,
        windSpeed: Math.round(gfsData.wind_speed_10m?.[i] ?? 0)
      } : undefined;

      const google = googleData ? {
        temperature: Math.round(googleData.temperature[i] ?? 0),
        precipitation: googleData.precipitation[i] ?? 0,
        weatherCode: googleData.weatherCode[i] ?? 0,
        windSpeed: Math.round(googleData.windSpeed[i] ?? 0)
      } : undefined;
      const leadModelEntry = locale === "de" ? icon : (locale === "fr" ? arome : harmonie);

      // Base values volgen altijd het land-specifieke leidende model.
      const temperature = Math.round(data.hourly.temperature_2m[i] ?? 0);
      const precipitation = data.hourly.precipitation?.[i] ?? 0;
      const weatherCode = data.hourly.weather_code?.[i] ?? 0;
      const windSpeed = Math.round(data.hourly.wind_speed_10m?.[i] ?? 0);

      return {
        time,
        temperature,
        apparentTemperature: Math.round(data.hourly.apparent_temperature?.[i] ?? temperature),
        weatherCode,
        precipitation,
        windSpeed,
        cape: Math.round(data.hourly.cape?.[i] ?? 0),
        confidence: leadModelEntry ? "high" : "medium",
        models: { harmonie, icon, arome, ecmwf, gfs, google }
      };
    });

    // 2. AGREEMENT CALCULATION (Simplified for now)
    let agreement = 100;
    if (harmonieData?.precipitation && iconData?.precipitation && aromeData?.precipitation) {
      // Check for divergence in precipitation in next 12 hours
      const leadSeries = locale === "de" ? iconData : (locale === "fr" ? aromeData : harmonieData);
      const secondarySeries = locale === "de" ? harmonieData : iconData;
      const next12Lead = (leadSeries?.precipitation || []).slice(0, 12).reduce((a: number, b: number) => a + b, 0);
      const next12Secondary = (secondarySeries?.precipitation || []).slice(0, 12).reduce((a: number, b: number) => a + b, 0);
      const next12Arome = (aromeData.precipitation || []).slice(0, 12).reduce((a: number, b: number) => a + b, 0);
      
      const diff = Math.max(
        Math.abs(next12Lead - next12Secondary),
        Math.abs(next12Lead - next12Arome)
      );
      if (diff > 2) agreement = 75;
      if (diff > 5) agreement = 50;
    }

    // 3. SYNC CURRENT WITH THE LEADING MODEL (Consistentie!)
    let currentTemp = Math.round(data.current.temperature_2m ?? 0);
    let currentFeels = Math.round(data.current.apparent_temperature ?? 0);
    let currentPrecip = data.current.precipitation ?? 0;
    let currentCode = data.current.weather_code ?? 0;
    let currentWind = Math.round(data.current.wind_speed_10m ?? 0);

    if (hourly.length > 0) {
      const currentApiTime = data.current.time;
      const currentIndex = times.indexOf(currentApiTime);
      const targetIndex = currentIndex !== -1 ? currentIndex : 0;

      if (hourly[targetIndex]) {
        currentTemp = hourly[targetIndex].temperature;
        currentFeels = hourly[targetIndex].apparentTemperature;
        currentPrecip = hourly[targetIndex].precipitation;
        currentCode = hourly[targetIndex].weatherCode;
        currentWind = hourly[targetIndex].windSpeed;
      }
    }

    const minutely: MinutelyPrecipitation[] = [];
    if (data.minutely_15?.time && data.minutely_15?.precipitation) {
      // Use the actual current time in Amsterdam timezone so cached/stale API responses
      // never cause the radar to show historical data instead of forecasted data.
      const nowAmsterdam = new Date()
        .toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam" })
        .replace(" ", "T")
        .slice(0, 16);
      for (let i = 0; i < data.minutely_15.time.length; i++) {
        if (data.minutely_15.time[i] >= nowAmsterdam) {
          minutely.push({
            time: data.minutely_15.time[i],
            precipitation: data.minutely_15.precipitation[i] ?? 0,
          });
        }
      }
    }

    const sources = [LEAD_SOURCE_LABEL[locale]];
    if (secondaryData) sources.push(SECONDARY_SOURCE_LABEL[locale]);
    if (aromeData) sources.push("METEOFRANCE AROME");
    if (googleData) sources.push("GOOGLE WEATHER API");

    const weather: WeatherData = {
      current: {
        temperature: currentTemp,
        feelsLike: currentFeels,
        humidity: data.current?.relative_humidity_2m ?? 50,
        windSpeed: currentWind,
        windDirection: degreesToDirection(data.current?.wind_direction_10m ?? 0, locale),
        windGusts: Math.round(data.current?.wind_gusts_10m ?? 0),
        precipitation: currentPrecip,
        weatherCode: currentCode,
        isDay: data.current?.is_day === 1,
        cloudCover: data.current?.cloud_cover ?? 0,
      },
      minutely,
      hourly,
      daily: (data.daily?.time ?? []).map((date: string, i: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max?.[i] ?? 0),
        tempMin: Math.round(data.daily.temperature_2m_min?.[i] ?? 0),
        weatherCode: data.daily.weather_code?.[i] ?? 0,
        precipitationSum: data.daily.precipitation_sum?.[i] ?? 0,
        windSpeedMax: Math.round(data.daily.wind_speed_10m_max?.[i] ?? 0),
        sunHours: Number(((data.daily.sunshine_duration?.[i] ?? 0) / 3600).toFixed(1)),
      })),
      sunrise: data.daily?.sunrise?.[0],
      sunset: data.daily?.sunset?.[0],
      uvIndex: data.daily?.uv_index_max?.[0] ?? 0,
      models: {
        agreement,
        label: locale === "de"
          ? (agreement > 80 ? "Hohe Modellübereinstimmung" : agreement > 50 ? "Mittlere Übereinstimmung" : "Geringe Übereinstimmung (Divergenz)")
          : (agreement > 80 ? "Hoge modelconsensus" : agreement > 50 ? "Gemiddelde consensus" : "Lage consensus (Divergentie)"),
        sources,
      },
    };

    try {
      const [{ applyMarianaArbitration }, { toMarianaLocation }, { loadMarianaMemory }] = await Promise.all([
        import("@/lib/mariana/arbitration"),
        import("@/lib/mariana/location"),
        import("@/lib/mariana/storage"),
      ]);
      const location = toMarianaLocation(marianaLocation ?? { lat, lon });
      const memory = await loadMarianaMemory(location.locationId).catch(() => null);
      return applyMarianaArbitration({ location, weather, memory });
    } catch (error) {
      console.error("Mariana arbitration skipped:", error instanceof Error ? error.message : String(error));
      return weather;
    }
  } catch (error) {
    console.error("fetchWeatherData crash:", error);
    throw error;
  }
}

/**
 * Piet's Neural Engine: Proxy voor MetNet-3 en NeuralGCM.
 * Gebruikt Gemini om de ruwe data te interpreteren naar hyper-lokale inzichten.
 */
export async function getNeuralInsights(lat: number, lon: number, weather: WeatherData): Promise<WeatherData["neuralData"]> {
  // TEST MODE: Forceer Reed-gate event voor demo
  const isSimulation = false; 
  if (isSimulation) {
    return {
      metNetNowcast: "Zware ontlading nadert vanuit het zuidwesten. Impact binnen 12 minuten.",
      seedScenario: "95% kans op supercell-vorming in deze regio.",
      neuralGcmImpact: "Lokaal verhoogd risico door stedelijke hitte-accumulatie.",
      opticalDepth: 94,
      solarRadiation: 42,
      windTurbulence: "Extreme Gusts Detected",
      lightningRisk: 88, // Reed trigger (>40)
      stormSeverity: 9   // Reed trigger (>6)
    };
  }

  try {
    const prompt = `
      Je bent het neurale weer-brein van WEERZONE. Interpreteer de volgende data voor coördinaten ${lat}, ${lon}:
      - Temp: ${weather.current.temperature}C
      - Neerslag: ${weather.current.precipitation}mm
      - Wind: ${weather.current.windSpeed}km/u
      
      Simuleer de output van de WEERZONE Intelligence Engine:
      1. Nowcasting: Focus op neerslag-timing per minuut op deze exacte plek.
      2. Ensemble Scenario: Geef een scenario-kans (bijv. 85% kans op...).
      3. Micro-klimaat: Focus op lokaal micro-klimaat impact.
      4. Technische Layers: 
         - opticalDepth (0-100)
         - solarRadiation (W/m2)
         - windTurbulence (tekst)
         - lightningRisk (0-100)
         - stormSeverity (0-12 Bft)

      BELANGRIJK: Noem GEEN modelnamen in de tekstvelden.
      Antwoord in PUUR JSON:
      {
        "metNetNowcast": "...",
        "seedScenario": "...",
        "neuralGcmImpact": "...",
        "opticalDepth": number,
        "solarRadiation": number,
        "windTurbulence": "...",
        "lightningRisk": number,
        "stormSeverity": number
      }
    `.trim();

    const raw = await hermesChat([{ role: "user", content: prompt }], { json: true });
    return JSON.parse(raw.trim().replace(/```json|```/g, ""));
  } catch (e) {
    console.error("Neural Insights Error:", e);
    return undefined;
  }
}

const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";
const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";

export async function fetchAirQuality(lat: number, lon: number, locale: Locale = "nl"): Promise<AirQualityData | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: "grass_pollen,birch_pollen,alder_pollen,mugwort_pollen",
      domains: "cams_europe",
      timezone: locale === "de" ? "Europe/Berlin" : "Europe/Amsterdam",
      forecast_days: "5",
    });
    const res = await fetch(`${AIR_QUALITY_BASE}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const h = data.hourly;
    const times: string[] = h.time ?? [];
    const hourly = times.map((time, i) => ({
      time,
      grass: h.grass_pollen?.[i] ?? null,
      birch: h.birch_pollen?.[i] ?? null,
      alder: h.alder_pollen?.[i] ?? null,
      mugwort: h.mugwort_pollen?.[i] ?? null,
    }));
    const peak = (arr: (number | null)[]) =>
      arr.reduce<number | null>((max, v) => (v !== null && (max === null || v > max) ? v : max), null);
    return {
      hourly,
      peakGrass: peak(hourly.map((r) => r.grass)),
      peakBirch: peak(hourly.map((r) => r.birch)),
      peakAlder: peak(hourly.map((r) => r.alder)),
      peakMugwort: peak(hourly.map((r) => r.mugwort)),
    };
  } catch {
    return null;
  }
}

export function getPollenLevel(grains: number | null, type: "grass" | "tree", locale: Locale = "nl"): { label: string; level: 0 | 1 | 2 | 3 } {
  const de = locale === "de";
  const fr = locale === "fr";
  if (grains === null) return { label: fr ? "Inconnu" : (de ? "Unbekannt" : "Onbekend"), level: 0 };
  if (type === "grass") {
    if (grains < 10) return { label: fr ? "Faible" : (de ? "Niedrig" : "Laag"), level: 0 };
    if (grains < 30) return { label: fr ? "Modéré" : (de ? "Mäßig" : "Matig"), level: 1 };
    if (grains < 50) return { label: fr ? "Élevé" : (de ? "Hoch" : "Hoog"), level: 2 };
    return { label: fr ? "Très élevé" : (de ? "Sehr hoch" : "Zeer hoog"), level: 3 };
  }
  // tree (birch, alder, mugwort)
  if (grains < 10) return { label: fr ? "Faible" : (de ? "Niedrig" : "Laag"), level: 0 };
  if (grains < 50) return { label: fr ? "Modéré" : (de ? "Mäßig" : "Matig"), level: 1 };
  if (grains < 200) return { label: fr ? "Élevé" : (de ? "Hoch" : "Hoog"), level: 2 };
  return { label: fr ? "Très élevé" : (de ? "Sehr hoch" : "Zeer hoog"), level: 3 };
}

const NL_COASTAL_POINTS: [number, number][] = [
  [51.44, 3.57],  // Vlissingen
  [51.97, 4.12],  // Hoek van Holland
  [52.10, 4.27],  // Scheveningen
  [52.37, 4.53],  // Zandvoort
  [52.46, 4.53],  // IJmuiden
  [52.96, 4.75],  // Den Helder
  [53.05, 4.80],  // Texel
  [53.38, 5.22],  // Terschelling
  [53.52, 6.20],  // Eemshaven
];

const DE_COASTAL_POINTS: [number, number][] = [
  [53.86, 8.70],  // Cuxhaven (Nordsee)
  [54.90, 8.32],  // Sylt (Nordsee)
  [54.18, 7.88],  // Helgoland (Nordsee)
  [54.32, 10.12], // Kiel (Ostsee)
  [54.09, 12.09], // Rostock (Ostsee)
  [54.43, 13.57], // Rügen (Ostsee)
];

function nearestCoastalPoint(lat: number, lon: number, locale: Locale = "nl"): [number, number] {
  const points = locale === "de" ? DE_COASTAL_POINTS : NL_COASTAL_POINTS;
  let best = points[0];
  let bestDist = Infinity;
  for (const p of points) {
    const d = (p[0] - lat) ** 2 + (p[1] - lon) ** 2;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

export async function fetchMarineData(lat: number, lon: number, locale: Locale = "nl"): Promise<MarineData | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const [clat, clon] = nearestCoastalPoint(lat, lon, locale);
  try {
    const params = new URLSearchParams({
      latitude: clat.toString(),
      longitude: clon.toString(),
      hourly: "wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,sea_surface_temperature",
      timezone: locale === "de" ? "Europe/Berlin" : "Europe/Amsterdam",
      forecast_days: "5",
    });
    const res = await fetch(`${MARINE_BASE}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const h = data.hourly;
    const times: string[] = h.time ?? [];
    return {
      hourly: times.map((time, i) => ({
        time,
        waveHeight: h.wave_height?.[i] ?? null,
        waveDirection: h.wave_direction?.[i] ?? null,
        wavePeriod: h.wave_period?.[i] ?? null,
        windWaveHeight: h.wind_wave_height?.[i] ?? null,
        swellWaveHeight: h.swell_wave_height?.[i] ?? null,
        seaSurfaceTemperature: h.sea_surface_temperature?.[i] ?? null,
      })),
    };
  } catch {
    return null;
  }
}

function degreesToDirection(deg: number, locale: Locale = "nl"): string {
  if (locale === "de") {
    const dirs = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
  }
  if (locale === "fr") {
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    return dirs[Math.round(deg / 22.5) % 16];
  }
  const dirs = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function getWeatherEmoji(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code === 1 || code === 2) return isDay ? "⛅" : "☁️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "⛈️";
  if (code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

export function getWeatherDescription(code: number, locale: Locale = "nl"): string {
  if (locale === "de") {
    if (code === 0) return "Wolkenlos";
    if (code <= 2) return "Teilweise bewölkt";
    if (code === 3) return "Bewölkt";
    if (code <= 48) return "Nebel";
    if (code <= 55) return "Nieselregen";
    if (code <= 57) return "Gefrierender Nieselregen";
    if (code <= 65) return "Regen";
    if (code <= 67) return "Gefrierender Regen";
    if (code <= 75) return "Schnee";
    if (code === 77) return "Graupel";
    if (code <= 82) return "Regenschauer";
    if (code <= 86) return "Schneeschauer";
    if (code >= 95) return "Gewitter";
    return "Wechselhaft";
  }
  if (locale === "fr") {
    if (code === 0) return "Dégagé";
    if (code <= 2) return "Partiellement nuageux";
    if (code === 3) return "Nuageux";
    if (code <= 48) return "Brouillard";
    if (code <= 55) return "Bruine";
    if (code <= 57) return "Bruine verglaçante";
    if (code <= 65) return "Pluie";
    if (code <= 67) return "Pluie verglaçante";
    if (code <= 75) return "Neige";
    if (code === 77) return "Grésil";
    if (code <= 82) return "Averses de pluie";
    if (code <= 86) return "Averses de neige";
    if (code >= 95) return "Orage";
    return "Variable";
  }
  if (code === 0) return "Onbewolkt";
  if (code <= 2) return "Half bewolkt";
  if (code === 3) return "Bewolkt";
  if (code <= 48) return "Mistig";
  if (code <= 55) return "Motregen";
  if (code <= 57) return "IJzel motregen";
  if (code <= 65) return "Regen";
  if (code <= 67) return "IJzel regen";
  if (code <= 75) return "Sneeuw";
  if (code === 77) return "Korrelsneeuw";
  if (code <= 82) return "Regenbuien";
  if (code <= 86) return "Sneeuwbuien";
  if (code >= 95) return "Onweer";
  return "Wisselend";
}

export function getWindBeaufort(kmh: number, locale: Locale = "nl"): { scale: number; label: string } {
  if (locale === "de") {
    if (kmh < 1) return { scale: 0, label: "Windstille" };
    if (kmh <= 5) return { scale: 1, label: "Leiser Zug" };
    if (kmh <= 11) return { scale: 2, label: "Leichte Brise" };
    if (kmh <= 19) return { scale: 3, label: "Schwache Brise" };
    if (kmh <= 28) return { scale: 4, label: "Mäßige Brise" };
    if (kmh <= 38) return { scale: 5, label: "Frische Brise" };
    if (kmh <= 49) return { scale: 6, label: "Starker Wind" };
    if (kmh <= 61) return { scale: 7, label: "Steifer Wind" };
    if (kmh <= 74) return { scale: 8, label: "Stürmischer Wind" };
    if (kmh <= 88) return { scale: 9, label: "Sturm" };
    if (kmh <= 102) return { scale: 10, label: "Schwerer Sturm" };
    if (kmh <= 117) return { scale: 11, label: "Orkanartiger Sturm" };
    return { scale: 12, label: "Orkan" };
  }
  if (kmh < 1) return { scale: 0, label: "Windstil" };
  if (kmh <= 5) return { scale: 1, label: "Zwak" };
  if (kmh <= 11) return { scale: 2, label: "Zwak" };
  if (kmh <= 19) return { scale: 3, label: "Normaal" };
  if (kmh <= 28) return { scale: 4, label: "Normaal" };
  if (kmh <= 38) return { scale: 5, label: "Vrij krachtig" };
  if (kmh <= 49) return { scale: 6, label: "Krachtig" };
  if (kmh <= 61) return { scale: 7, label: "Hard" };
  if (kmh <= 74) return { scale: 8, label: "Stormachtig" };
  if (kmh <= 88) return { scale: 9, label: "Storm" };
  if (kmh <= 102) return { scale: 10, label: "Zware storm" };
  if (kmh <= 117) return { scale: 11, label: "Orkaankracht" };
  return { scale: 12, label: "Orkaan" };
}
