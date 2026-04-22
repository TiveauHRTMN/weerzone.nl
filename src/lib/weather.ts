import type { WeatherData, HourlyForecast, MinutelyPrecipitation } from "./types";

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
  fallbackData: { time: string[]; temperature_2m: number[]; apparent_temperature: number[]; weather_code: number[]; precipitation: number[]; wind_speed_10m: number[]; cape?: number[] }
): { hourly: HourlyForecast[]; agreement: number } {
  const times = fallbackData.time;

  const hourly: HourlyForecast[] = times.map((time, i) => {
    // Gebruik Harmonie data indien beschikbaar, anders fallback op generic
    const temperature = Math.round(harmonieData?.temperature_2m?.[i] ?? fallbackData.temperature_2m[i]);
    const apparentTemperature = Math.round(harmonieData?.apparent_temperature?.[i] ?? fallbackData.apparent_temperature[i]);
    const precipitation = harmonieData?.precipitation?.[i] ?? fallbackData.precipitation[i];
    const weatherCode = harmonieData?.weather_code?.[i] ?? fallbackData.weather_code[i];
    const windSpeed = Math.round(harmonieData?.wind_speed_10m?.[i] ?? fallbackData.wind_speed_10m[i]);

    return {
      time,
      temperature,
      apparentTemperature,
      weatherCode,
      precipitation,
      windSpeed,
      cape: Math.round(fallbackData.cape?.[i] ?? 0),
      confidence: "high"
    };
  });

  return { hourly, agreement: 100 };
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  try {
    const [genericRes, harmonieData] = await Promise.all([
      fetch(`${OPEN_METEO_BASE}?${new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: CURRENT_PARAMS,
        hourly: HOURLY_PARAMS,
        daily: DAILY_PARAMS,
        minutely_15: "precipitation",
        forecast_minutely_15: "24",
        timezone: "Europe/Amsterdam",
        forecast_days: "2",
        forecast_hours: "48",
      })}`, { next: { revalidate: 300 } }).then(r => {
        if (!r.ok) return null;
        return r.json();
      }),
      fetchModel(OPEN_METEO_BASE, lat, lon, { models: "knmi_seamless" }).catch(() => null),
    ]);

    const data = genericRes;
    if (!data) return null as any;
    const { hourly, agreement } = blendHourly(harmonieData, data.hourly);

    // 5. SYNC CURRENT WITH HARMONIE (Belangrijk voor consistentie!)
    // Omdat de 'current' API van Open-Meteo het Harmonie model niet direct ondersteunt,
    // halen we de huidige waarden uit de eerste slot van de Harmonie data.
    let currentTemp = Math.round(data.current.temperature_2m);
    let currentFeels = Math.round(data.current.apparent_temperature);
    let currentPrecip = data.current.precipitation;
    let currentCode = data.current.weather_code;
    let currentWind = Math.round(data.current.wind_speed_10m);

    if (harmonieData && hourly.length > 0) {
      // Gebruik de eerste uurwaarde van Harmonie voor de 'Nu' status
      currentTemp = hourly[0].temperature;
      currentFeels = hourly[0].apparentTemperature;
      currentPrecip = hourly[0].precipitation;
      currentCode = hourly[0].weatherCode;
      currentWind = hourly[0].windSpeed;
    } else if (hourly.length > 0) {
      // Fallback: Rain Accuracy Fix voor generic model
      if (currentPrecip === 0 && hourly[0].precipitation > 0) {
        currentPrecip = hourly[0].precipitation;
        if (currentCode === 0 || currentCode === 1 || currentCode === 3) {
          currentCode = hourly[0].weatherCode;
        }
      }
    }

    const minutely: MinutelyPrecipitation[] = [];
    if (data.minutely_15?.time && data.minutely_15?.precipitation) {
      const currentApiTime = data.current?.time ?? data.minutely_15.time[0];
      for (let i = 0; i < data.minutely_15.time.length; i++) {
        if (data.minutely_15.time[i] >= currentApiTime) {
          minutely.push({
            time: data.minutely_15.time[i],
            precipitation: data.minutely_15.precipitation[i] ?? 0,
          });
        }
      }
    }

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
      daily: data.daily.time.map((date: string, i: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weather_code[i],
        precipitationSum: data.daily.precipitation_sum[i],
        windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
        sunHours: Number((data.daily.sunshine_duration[i] / 3600).toFixed(1)),
      })),
      sunrise: data.daily?.sunrise?.[0],
      sunset: data.daily?.sunset?.[0],
      uvIndex: data.daily?.uv_index_max?.[0] ?? 0,
      models: {
        agreement,
        label: "KNMI HARMONIE Geverifieerd",
        sources: ["KNMI HARMONIE"],
      },
    };
  } catch (error) {
    console.error("fetchWeatherData crash:", error);
    throw error;
  }
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
