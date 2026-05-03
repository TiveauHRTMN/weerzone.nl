import type { WeatherData, HourlyForecast, MinutelyPrecipitation } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { fetchGoogleWeather, mapGoogleWeatherConditionToWMO } from "./google-weather";

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

export async function fetchWeatherData(lat: number, lon: number, isBot: boolean = false, forceHighRes: boolean = false): Promise<WeatherData> {
  // Skip live API calls during Next.js build-time static generation
  if (process.env.NEXT_PHASE === 'phase-production-build') return null as any;

  const attemptFetch = async (): Promise<any> => {
    const url = `${OPEN_METEO_BASE}?${new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: CURRENT_PARAMS,
      hourly: HOURLY_PARAMS + ",apparent_temperature",
      daily: DAILY_PARAMS,
      minutely_15: "precipitation",
      forecast_minutely_15: "96",
      timezone: "Europe/Amsterdam",
      forecast_days: "2",
      forecast_hours: "48",
    })}`;
    try {
      const res = await fetch(url, { next: { revalidate: 600 } });
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
    const genericRes = await attemptFetch();

    const fetchPromises: Promise<any>[] = [Promise.resolve(genericRes)];

    // Zware extra modellen: alleen ophalen als expliciet gevraagd (forceHighRes)
    // of bij bots nooit. Default = alleen het basismodel → geen rate limiting.
    if (!isBot && forceHighRes) {
      fetchPromises.push(
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: "knmi_seamless" }).catch(() => null),
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: "dwd_icon_d2" }).catch(() => null),
        fetchModel(OPEN_METEO_BASE, lat, lon, { models: "meteofrance_arome_france_hd" }).catch(() => null),
        fetchGoogleWeather(lat, lon).catch(() => null)
      );
    }

    const results = await Promise.all(fetchPromises);
    const coreData = results[0];

    // Defensive check for core data
    if (!coreData || !coreData.current || !coreData.hourly) {
      console.error("fetchWeatherData: Core Open-Meteo data failed", { hasRes: !!coreData });
      return null as any;
    }

    const harmonieData = (!isBot && results[1]) || null;
    const iconData = (!isBot && results[2]) || null;
    const aromeData = (!isBot && results[3]) || null;
    const googleDataRaw = (!isBot && results[4]) || null;

    // Formatteer Google Data om net zo makkelijk aan te roepen als Open-Meteo arrays
    let googleData: any = null;
    if (googleDataRaw?.forecastHours && Array.isArray(googleDataRaw.forecastHours) && coreData?.hourly?.time) {
      googleData = {
        temperature: [],
        precipitation: [],
        weatherCode: [],
        windSpeed: []
      };
      // We assumes the forecastHours align roughly with the next 48 hours, but we map by matching the start hour
      const times = coreData.hourly.time;
      for (const t of times) {
        const dt = new Date(t).getTime();
        const gHour = googleDataRaw.forecastHours.find((g: any) => {
          if (!g?.interval?.startTime || !g?.interval?.endTime) return false;
          const gTime = new Date(g.interval.startTime).getTime();
          // Ligt de tijd binnen dit interval?
          return dt >= gTime && dt < new Date(g.interval.endTime).getTime();
        });
        
        if (gHour) {
          googleData.temperature.push(gHour.temperature?.degrees ?? 0);
          googleData.precipitation.push(gHour.precipitation?.qpf?.quantity ?? 0);
          googleData.weatherCode.push(mapGoogleWeatherConditionToWMO(gHour.weatherCondition?.type ?? ""));
          googleData.windSpeed.push(gHour.wind?.speed?.value ?? 0);
        } else {
          googleData.temperature.push(0);
          googleData.precipitation.push(0);
          googleData.weatherCode.push(0);
          googleData.windSpeed.push(0);
        }
      }
    }

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

      const google = googleData ? {
        temperature: Math.round(googleData.temperature[i] ?? 0),
        precipitation: googleData.precipitation[i] ?? 0,
        weatherCode: googleData.weatherCode[i] ?? 0,
        windSpeed: Math.round(googleData.windSpeed[i] ?? 0)
      } : undefined;

      // Base values (prefer Harmonie, but fallback to Generic)
      const temperature = (harmonie && typeof harmonie.temperature === 'number') ? harmonie.temperature : Math.round(data.hourly.temperature_2m[i] ?? 0);
      const precipitation = (harmonie && typeof harmonie.precipitation === 'number') ? harmonie.precipitation : (data.hourly.precipitation?.[i] ?? 0);
      const weatherCode = (harmonie && typeof harmonie.weatherCode === 'number') ? harmonie.weatherCode : (data.hourly.weather_code?.[i] ?? 0);
      const windSpeed = (harmonie && typeof harmonie.windSpeed === 'number') ? harmonie.windSpeed : Math.round(data.hourly.wind_speed_10m?.[i] ?? 0);

      return {
        time,
        temperature,
        apparentTemperature: Math.round(data.hourly.apparent_temperature?.[i] ?? temperature),
        weatherCode,
        precipitation,
        windSpeed,
        cape: Math.round(data.hourly.cape?.[i] ?? 0),
        confidence: harmonie ? "high" : "medium",
        models: { harmonie, icon, arome, google }
      };
    });

    // 2. AGREEMENT CALCULATION (Simplified for now)
    let agreement = 100;
    if (harmonieData?.precipitation && iconData?.precipitation && aromeData?.precipitation) {
      // Check for divergence in precipitation in next 12 hours
      const next12Harmonie = (harmonieData.precipitation || []).slice(0, 12).reduce((a: number, b: number) => a + b, 0);
      const next12Icon = (iconData.precipitation || []).slice(0, 12).reduce((a: number, b: number) => a + b, 0);
      const next12Arome = (aromeData.precipitation || []).slice(0, 12).reduce((a: number, b: number) => a + b, 0);
      
      const diff = Math.max(
        Math.abs(next12Harmonie - next12Icon),
        Math.abs(next12Harmonie - next12Arome)
      );
      if (diff > 2) agreement = 75;
      if (diff > 5) agreement = 50;
    }

    // 3. SYNC CURRENT WITH HARMONIE (Consistentie!)
    let currentTemp = Math.round(data.current.temperature_2m ?? 0);
    let currentFeels = Math.round(data.current.apparent_temperature ?? 0);
    let currentPrecip = data.current.precipitation ?? 0;
    let currentCode = data.current.weather_code ?? 0;
    let currentWind = Math.round(data.current.wind_speed_10m ?? 0);

    if (harmonieData && hourly.length > 0) {
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

    const sources = ["KNMI HARMONIE"];
    if (iconData) sources.push("DWD ICON-D2");
    if (aromeData) sources.push("METEOFRANCE AROME");
    if (googleData) sources.push("GOOGLE WEATHER API");

    return {
      current: {
        temperature: currentTemp,
        feelsLike: currentFeels,
        humidity: data.current?.relative_humidity_2m ?? 50,
        windSpeed: currentWind,
        windDirection: degreesToDirection(data.current?.wind_direction_10m ?? 0),
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
        label: agreement > 80 ? "Hoge modelconsensus" : agreement > 50 ? "Gemiddelde consensus" : "Lage consensus (Divergentie)",
        sources,
      },
    };
  } catch (error) {
    console.error("fetchWeatherData crash:", error);
    throw error;
  }
}

/**
 * Piet's Neural Engine: Proxy voor MetNet-3, SEED en NeuralGCM.
 * Gebruikt Gemini om de ruwe data te interpreteren naar hyper-lokale inzichten.
 */
export async function getNeuralInsights(lat: number, lon: number, weather: WeatherData): Promise<WeatherData["neuralData"]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;

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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, "");
    return JSON.parse(text);
  } catch (e) {
    console.error("Neural Insights Error:", e);
    return undefined;
  }
}

function degreesToDirection(deg: number): string {
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

export function getWeatherDescription(code: number): string {
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

export function getWindBeaufort(kmh: number): { scale: number; label: string } {
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
