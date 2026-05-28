import type { HourlyForecast, WeatherData } from "@/lib/types";
import { scoreModelConfidence } from "@/lib/mariana/confidence";
import { classifyWeatherRegime } from "@/lib/mariana/regime";
import type {
  MarianaCorrectionDelta,
  MarianaForecastInput,
  MarianaForecastVariables,
  MarianaLocationMemory,
  MarianaLocationRef,
  MarianaModelMemory,
  MarianaModelName,
} from "@/lib/mariana/types";
import type { OracleForecastIntelligence, OracleHourlyIntelligence } from "./types";

const DEFAULT_ORACLE_WEIGHTS: Record<string, number> = {
  WEERZONE_BLEND: 0.5,
  ECMWF_AIFS_SET_X: 0.65, // Prioritize machine-learning weather forecast
  ECMWF: 0.55,
  GFS: 0.45,
  GOOGLE: 0.35,
};

const MODEL_KEY_MAP: Record<string, MarianaModelName> = {
  aifs: "ECMWF_AIFS_SET_X",
  ecmwf: "ECMWF",
  gfs: "GFS",
  google: "GOOGLE",
};

type HourlyModelPoint = {
  temperature: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

function confidenceToHourlyLabel(score: number): HourlyForecast["confidence"] {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

function memoryWeight(modelName: MarianaModelName, memory?: MarianaLocationMemory | null): number {
  const stats = memory?.modelStats?.[modelName];
  const base = DEFAULT_ORACLE_WEIGHTS[String(modelName)] ?? 0.45;
  if (!stats?.samples) return base;
  const sampleTrust = clamp(stats.samples / 30, 0.2, 1);
  return clamp(base * (1 - sampleTrust) + stats.weightHint * sampleTrust, 0.05, 0.95);
}

function biasCorrection(
  modelMemory: MarianaModelMemory | undefined,
  variable: keyof MarianaForecastVariables
): number {
  if (!modelMemory?.samples) return 0;
  const bias = modelMemory.bias[variable];
  if (typeof bias !== "number" || !Number.isFinite(bias)) return 0;
  const trust = clamp(modelMemory.samples / 40, 0, 0.8);
  return bias * trust;
}

function variableBlend(
  forecasts: MarianaForecastInput[],
  variable: keyof MarianaForecastVariables,
  memory?: MarianaLocationMemory | null
): number | undefined {
  let weighted = 0;
  let totalWeight = 0;

  for (const forecast of forecasts) {
    const value = forecast.variables[variable];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;

    const stats = memory?.modelStats?.[forecast.modelName];
    const corrected = value - biasCorrection(stats, variable);
    const weight = memoryWeight(forecast.modelName, memory);
    weighted += corrected * weight;
    totalWeight += weight;
  }

  return totalWeight ? weighted / totalWeight : undefined;
}

function forecastsForHour(location: MarianaLocationRef, hour: HourlyForecast): MarianaForecastInput[] {
  const base: MarianaForecastInput = {
    location,
    modelName: "WEERZONE_BLEND",
    forecastTimestamp: new Date().toISOString(),
    validAt: hour.time,
    forecastHorizon: 0,
    variables: {
      temperature: hour.temperature,
      precipitation: hour.precipitation,
      windSpeed: hour.windSpeed,
      weatherCode: hour.weatherCode,
    },
    source: "weerzone_blend",
  };

  const modelForecasts = Object.entries(hour.models ?? {})
    .filter((entry): entry is [string, HourlyModelPoint] => Boolean(entry[1]))
    .map(([key, model]) => ({
      location,
      modelName: MODEL_KEY_MAP[key] ?? key.toUpperCase(),
      forecastTimestamp: base.forecastTimestamp,
      validAt: hour.time,
      forecastHorizon: 0,
      variables: {
        temperature: model.temperature,
        precipitation: model.precipitation,
        windSpeed: model.windSpeed,
        weatherCode: model.weatherCode,
      },
      source: "model_layer",
    }));

  return [base, ...modelForecasts];
}

function dominantModels(forecasts: MarianaForecastInput[], memory?: MarianaLocationMemory | null): MarianaModelName[] {
  return [...new Set(forecasts.map((forecast) => forecast.modelName))]
    .sort((a, b) => memoryWeight(b, memory) - memoryWeight(a, memory))
    .slice(0, 3);
}

function risksFor(hour: HourlyForecast, confidenceScore: number, regimeSignals: string[]): string[] {
  const risks: string[] = [];
  if (hour.precipitation >= 3 || regimeSignals.includes("heavy_precipitation")) risks.push("neerslagintensiteit");
  if (hour.windSpeed >= 45 || regimeSignals.includes("windy")) risks.push("windgevoelig");
  if (hour.cape >= 500) risks.push("convectieve onzekerheid");
  if (confidenceScore < 0.55) risks.push("modeldivergentie");
  return risks;
}

function applyHourlyCorrection(
  hour: HourlyForecast,
  forecasts: MarianaForecastInput[],
  memory?: MarianaLocationMemory | null
): { hour: HourlyForecast; delta: MarianaCorrectionDelta; applied: boolean } {
  const temperature = variableBlend(forecasts, "temperature", memory);
  const precipitation = variableBlend(forecasts, "precipitation", memory);
  const windSpeed = variableBlend(forecasts, "windSpeed", memory);

  const next: HourlyForecast = { ...hour };
  const delta: MarianaCorrectionDelta = {};

  if (typeof temperature === "number") {
    const value = Math.round(temperature);
    delta.temperature = value - hour.temperature;
    next.temperature = value;
    next.apparentTemperature = Math.round(hour.apparentTemperature + delta.temperature);
  }
  if (typeof precipitation === "number") {
    const value = round(Math.max(0, precipitation), 2);
    delta.precipitation = round(value - hour.precipitation, 2);
    next.precipitation = value;
  }
  if (typeof windSpeed === "number") {
    const value = Math.round(Math.max(0, windSpeed));
    delta.windSpeed = value - hour.windSpeed;
    next.windSpeed = value;
  }

  const applied = Object.values(delta).some((value) => typeof value === "number" && Math.abs(value) >= 0.01);
  return { hour: next, delta, applied };
}

// boundary smoothing at 48h transitions
function applyBoundarySmoothing(
  hour: HourlyForecast,
  index: number,
  lastMarianaHour: HourlyForecast
): HourlyForecast {
  const diff = index - 48; // index 48 is hour 49 (first hour of Oracle)
  if (diff < 0 || diff >= 12) return hour;

  // w starts at 0.6 at index 48 and decays to 0.0 at index 60
  const w = 0.6 * (1 - diff / 12);
  const smoothedTemp = Math.round(hour.temperature * (1 - w) + lastMarianaHour.temperature * w);
  const tempDelta = smoothedTemp - hour.temperature;

  return {
    ...hour,
    temperature: smoothedTemp,
    apparentTemperature: Math.round(hour.apparentTemperature + tempDelta),
  };
}

function interpretation(args: {
  placeName?: string;
  confidence: OracleForecastIntelligence["confidence"];
  weatherRegime: OracleForecastIntelligence["weatherRegime"];
  correctionApplied: boolean;
  memorySamples: number;
  risks: string[];
}): string {
  const target = args.placeName ? `voor ${args.placeName}` : "voor deze locatie";
  const riskText = args.risks.length ? ` Let op middellange termijn risico: ${args.risks.slice(0, 2).join(" en ")}.` : "";
  const memoryText = args.memorySamples >= 3
    ? ` Oracle AI kalibreert de AIFS en IFS modellen op basis van ${args.memorySamples} verificaties.`
    : " Oracle AI evalueert het AIFS model voor deze regio.";
  const correctionText = args.correctionApplied
    ? " De verwachting is gecorrigeerd voor middellange-termijn modelafwijkingen."
    : " De verwachting volgt de leidende middellange-termijn trends.";

  return `Oracle AI voorziet ${target} een ${args.weatherRegime.label.toLowerCase()} voor de 48-96 uursperiode met ${args.confidence.label} vertrouwen.${riskText}${memoryText}${correctionText}`;
}

export function applyOracleArbitration(args: {
  location: MarianaLocationRef;
  weather: WeatherData;
  memory?: MarianaLocationMemory | null;
}): WeatherData {
  const hourlyIntelligence: OracleHourlyIntelligence[] = [];
  let correctionApplied = false;

  // Retrieve hour 47 (last hour of Mariana, which is index 47)
  const lastMarianaHour = args.weather.hourly[47];

  const hourly = args.weather.hourly.map((hour, idx) => {
    // Only arbitrate and smooth hours 48 to 96 (index 48 to 95)
    if (idx < 48 || idx >= 96) {
      return hour;
    }

    const forecasts = forecastsForHour(args.location, hour);
    const confidence = scoreModelConfidence(forecasts);
    const regime = classifyWeatherRegime({
      temperature: hour.temperature,
      precipitation: hour.precipitation,
      windSpeed: hour.windSpeed,
      weatherCode: hour.weatherCode,
    });
    
    let corrected = applyHourlyCorrection(hour, forecasts, args.memory);
    correctionApplied ||= corrected.applied;

    // Apply smoothing at boundary if lastMarianaHour exists
    if (lastMarianaHour) {
      corrected.hour = applyBoundarySmoothing(corrected.hour, idx, lastMarianaHour);
    }

    const risks = risksFor(corrected.hour, confidence.score, regime.signals);

    const intelligence: OracleHourlyIntelligence = {
      time: hour.time,
      confidence,
      weatherRegime: regime,
      correctionApplied: corrected.applied,
      correctionDelta: corrected.delta,
      dominantModels: dominantModels(forecasts, args.memory),
      risks,
      notes: confidence.notes,
    };
    hourlyIntelligence.push(intelligence);

    return {
      ...corrected.hour,
      confidence: confidenceToHourlyLabel(confidence.score),
      oracle: intelligence,
    };
  });

  const oracleSlice = hourlyIntelligence.slice(0, 48);
  const aggregateForecasts = args.weather.hourly.slice(48, 96).flatMap((hour) => forecastsForHour(args.location, hour));
  const confidence = scoreModelConfidence(aggregateForecasts);
  
  // Weather regime for the 48-96h range
  const midTemp = args.weather.hourly[72]?.temperature ?? args.weather.current.temperature;
  const midPrecip = args.weather.hourly[72]?.precipitation ?? args.weather.current.precipitation;
  const midWind = args.weather.hourly[72]?.windSpeed ?? args.weather.current.windSpeed;
  const midCode = args.weather.hourly[72]?.weatherCode ?? args.weather.current.weatherCode;

  const weatherRegime = classifyWeatherRegime({
    temperature: midTemp,
    precipitation: midPrecip,
    windSpeed: midWind,
    weatherCode: midCode,
  });

  const risks = [...new Set(oracleSlice.flatMap((hour) => hour.risks))].slice(0, 4);
  const models = dominantModels(aggregateForecasts, args.memory);

  return {
    ...args.weather,
    hourly,
    oracle: {
      locationId: args.location.locationId,
      locationName: args.location.name,
      confidence,
      weatherRegime,
      correctionApplied,
      memorySamples: args.memory?.sampleCount ?? 0,
      dominantModels: models,
      risks,
      interpretation: interpretation({
        placeName: args.location.name,
        confidence,
        weatherRegime,
        correctionApplied,
        memorySamples: args.memory?.sampleCount ?? 0,
        risks,
      }),
      hourly: hourlyIntelligence,
    },
  };
}
