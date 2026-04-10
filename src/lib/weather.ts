import type { WeatherData, HourlyForecast } from "./types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const DWD_ICON_BASE = "https://api.open-meteo.com/v1/dwd-icon";

const HOURLY_PARAMS = [
  "temperature_2m",
  "weather_code",
  "precipitation",
  "wind_speed_10m",
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
].join(",");

interface RawModelHourly {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation: number[];
  wind_speed_10m: number[];
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
    hourly: HOURLY_PARAMS,
    timezone: "Europe/Amsterdam",
    forecast_days: "2",
    forecast_hours: "48",
    ...extraParams,
  });

  try {
    const res = await fetch(`${url}?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.hourly as RawModelHourly;
  } catch {
    return null;
  }
}

function blendHourly(
  harmonieData: RawModelHourly | null,
  iconData: RawModelHourly | null,
  fallbackData: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation: number[]; wind_speed_10m: number[] }
): { hourly: HourlyForecast[]; agreement: number } {
  const times = fallbackData.time;
  let agreeCount = 0;
  let compareCount = 0;

  const hourly: HourlyForecast[] = times.map((time, i) => {
    const hTemp = harmonieData?.temperature_2m[i] ?? null;
    const hPrecip = harmonieData?.precipitation[i] ?? null;
    const hCode = harmonieData?.weather_code[i] ?? null;
    const iTemp = iconData?.temperature_2m[i] ?? null;
    const iPrecip = iconData?.precipitation[i] ?? null;
    const iCode = iconData?.weather_code[i] ?? null;

    // Blended temperature: prefer HARMONIE, fallback to ICON, then generic
    let temperature: number;
    let precipitation: number;
    let weatherCode: number;

    if (hTemp !== null && iTemp !== null) {
      // Both available — average for temperature, max for precipitation (conservative)
      temperature = Math.round((hTemp + iTemp) / 2);
      precipitation = Math.round(Math.max(hPrecip ?? 0, iPrecip ?? 0) * 10) / 10;
      // Weather code: prefer HARMONIE (higher resolution for NL)
      weatherCode = hCode ?? iCode ?? fallbackData.weather_code[i];

      // Check agreement
      const tempDiff = Math.abs(hTemp - iTemp);
      const precipDiff = Math.abs((hPrecip ?? 0) - (iPrecip ?? 0));
      compareCount++;
      if (tempDiff <= 2 && precipDiff <= 0.5) agreeCount++;
    } else if (hTemp !== null) {
      temperature = Math.round(hTemp);
      precipitation = hPrecip ?? fallbackData.precipitation[i];
      weatherCode = hCode ?? fallbackData.weather_code[i];
    } else if (iTemp !== null) {
      temperature = Math.round(iTemp);
      precipitation = iPrecip ?? fallbackData.precipitation[i];
      weatherCode = iCode ?? fallbackData.weather_code[i];
    } else {
      temperature = Math.round(fallbackData.temperature_2m[i]);
      precipitation = fallbackData.precipitation[i];
      weatherCode = fallbackData.weather_code[i];
    }

    // Confidence based on model agreement
    let confidence: "high" | "medium" | "low" = "medium";
    if (hTemp !== null && iTemp !== null) {
      const tempDiff = Math.abs(hTemp - iTemp);
      const precipDiff = Math.abs((hPrecip ?? 0) - (iPrecip ?? 0));
      if (tempDiff <= 1 && precipDiff <= 0.3) confidence = "high";
      else if (tempDiff > 3 || precipDiff > 1) confidence = "low";
    }

    const models: HourlyForecast["models"] = {};
    if (hTemp !== null) models.harmonie = { temperature: Math.round(hTemp), precipitation: hPrecip ?? 0, weatherCode: hCode ?? 0 };
    if (iTemp !== null) models.icon = { temperature: Math.round(iTemp), precipitation: iPrecip ?? 0, weatherCode: iCode ?? 0 };

    return {
      time,
      temperature,
      weatherCode,
      precipitation,
      windSpeed: Math.round(fallbackData.wind_speed_10m[i] ?? 0),
      confidence,
      models: Object.keys(models).length > 0 ? models : undefined,
    };
  });

  const agreement = compareCount > 0 ? Math.round((agreeCount / compareCount) * 100) : 50;
  return { hourly, agreement };
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  // Fetch all three sources in parallel
  const [genericRes, harmonieData, iconData] = await Promise.all([
    // Generic forecast (always reliable, used for current + daily + fallback hourly)
    fetch(`${OPEN_METEO_BASE}?${new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: CURRENT_PARAMS,
      hourly: HOURLY_PARAMS,
      daily: DAILY_PARAMS,
      timezone: "Europe/Amsterdam",
      forecast_days: "2",
      forecast_hours: "48",
    })}`, { next: { revalidate: 300 } }).then(r => {
      if (!r.ok) throw new Error(`Open-Meteo API error: ${r.status}`);
      return r.json();
    }),
    // KNMI HARMONIE
    fetchModel(OPEN_METEO_BASE, lat, lon, { models: "knmi_seamless" }),
    // DWD ICON
    fetchModel(DWD_ICON_BASE, lat, lon),
  ]);

  const data = genericRes;

  // Blend hourly data from models
  const { hourly, agreement } = blendHourly(harmonieData, iconData, data.hourly);

  // Model comparison info
  const sources: string[] = ["Open-Meteo"];
  if (harmonieData) sources.push("KNMI HARMONIE");
  if (iconData) sources.push("DWD ICON");

  let label: string;
  if (agreement >= 80) label = "Modellen zeer eens";
  else if (agreement >= 60) label = "Modellen grotendeels eens";
  else if (agreement >= 40) label = "Modellen verschillen";
  else label = "Modellen oneens — onzekerheid";

  return {
    current: {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: degreesToDirection(data.current.wind_direction_10m),
      windGusts: Math.round(data.current.wind_gusts_10m),
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      cloudCover: data.current.cloud_cover,
    },
    hourly,
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      weatherCode: data.daily.weather_code[i],
      precipitationSum: data.daily.precipitation_sum[i],
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
    })),
    sunrise: data.daily.sunrise[0],
    sunset: data.daily.sunset[0],
    uvIndex: data.daily.uv_index_max[0],
    models: {
      agreement,
      label,
      sources,
    },
  };
}

function degreesToDirection(deg: number): string {
  const dirs = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function getWeatherEmoji(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 3) return isDay ? "⛅" : "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
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
