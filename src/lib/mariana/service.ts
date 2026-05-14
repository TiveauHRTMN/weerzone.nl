import type { WeatherData } from "@/lib/types";
import { scoreModelConfidence } from "./confidence";
import { calculateForecastError } from "./errors";
import { toMarianaLocation } from "./location";
import { classifyWeatherRegime } from "./regime";
import {
  loadForecastsForActual,
  loadMarianaMemory,
  saveMarianaActual,
  saveMarianaErrors,
  saveMarianaForecasts,
  updateMarianaMemory,
} from "./storage";
import type {
  MarianaActualInput,
  MarianaConfidenceResult,
  MarianaForecastInput,
  MarianaForecastVariables,
  MarianaLocationMemory,
  MarianaLocationRef,
  MarianaModelName,
} from "./types";

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function hoursBetween(from: string, to: string): number {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 3_600_000));
}

export function buildMarianaForecast(args: {
  location: MarianaLocationRef;
  modelName: MarianaModelName;
  forecastTimestamp: string | Date;
  validAt: string | Date;
  variables: MarianaForecastVariables;
  source?: string;
  runId?: string;
}): MarianaForecastInput {
  const forecastTimestamp = toIso(args.forecastTimestamp);
  const validAt = toIso(args.validAt);
  return {
    location: args.location,
    modelName: args.modelName,
    forecastTimestamp,
    validAt,
    forecastHorizon: hoursBetween(forecastTimestamp, validAt),
    variables: args.variables,
    source: args.source,
    runId: args.runId,
  };
}

export function forecastsFromWeatherData(args: {
  location: { name?: string; province?: string; lat: number; lon: number; id?: string; locationId?: string };
  weather: WeatherData;
  forecastTimestamp?: string | Date;
  runId?: string;
}): MarianaForecastInput[] {
  const location = toMarianaLocation(args.location);
  const forecastTimestamp = args.forecastTimestamp ?? new Date();
  const forecasts: MarianaForecastInput[] = [];

  for (const hour of args.weather.hourly.slice(0, 48)) {
    const baseVariables: MarianaForecastVariables = {
      temperature: hour.temperature,
      precipitation: hour.precipitation,
      windSpeed: hour.windSpeed,
      weatherCode: hour.weatherCode,
    };

    forecasts.push(buildMarianaForecast({
      location,
      modelName: "WEERZONE_BLEND",
      forecastTimestamp,
      validAt: hour.time,
      variables: baseVariables,
      source: "weerzone_blend",
      runId: args.runId,
    }));

    for (const [modelName, model] of Object.entries(hour.models ?? {})) {
      if (!model) continue;
      forecasts.push(buildMarianaForecast({
        location,
        modelName: modelName.toUpperCase() as MarianaModelName,
        forecastTimestamp,
        validAt: hour.time,
        variables: {
          temperature: model.temperature,
          precipitation: model.precipitation,
          windSpeed: model.windSpeed,
          weatherCode: model.weatherCode,
        },
        source: "open_meteo_model_layer",
        runId: args.runId,
      }));
    }
  }

  return forecasts;
}

export async function logMarianaForecasts(forecasts: MarianaForecastInput[]): Promise<{
  ok: boolean;
  inserted: number;
  confidence: MarianaConfidenceResult;
  reason?: string;
}> {
  const confidence = scoreModelConfidence(forecasts);
  const stored = await saveMarianaForecasts(forecasts, confidence);
  return { ...stored, confidence };
}

export async function logMarianaActual(actual: MarianaActualInput): Promise<{
  ok: boolean;
  actualId?: string;
  matchedForecasts: number;
  verifiedForecasts: number;
  memoryUpdated: boolean;
  reason?: string;
}> {
  const storedActual = await saveMarianaActual(actual);
  if (!storedActual.ok) {
    return {
      ok: false,
      matchedForecasts: 0,
      verifiedForecasts: 0,
      memoryUpdated: false,
      reason: storedActual.reason,
    };
  }

  const forecasts = await loadForecastsForActual(actual);
  const errors = forecasts.map((forecast) => calculateForecastError(forecast, actual));
  const savedErrors = await saveMarianaErrors(storedActual.id, errors);
  const weatherRegime = classifyWeatherRegime(actual.variables);
  const memory = await updateMarianaMemory({ actual, errors, weatherRegime });

  return {
    ok: savedErrors.ok && memory.ok,
    actualId: storedActual.id,
    matchedForecasts: forecasts.length,
    verifiedForecasts: savedErrors.updated,
    memoryUpdated: memory.ok,
    reason: savedErrors.reason ?? memory.reason,
  };
}

export async function getMarianaMemory(locationId: string): Promise<MarianaLocationMemory | null> {
  return loadMarianaMemory(locationId);
}
