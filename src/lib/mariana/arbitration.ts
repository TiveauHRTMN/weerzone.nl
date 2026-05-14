import type { HourlyForecast, WeatherData } from "@/lib/types";
import { scoreModelConfidence } from "./confidence";
import { selectMarianaReasoningModels } from "./llm-architecture";
import { classifyWeatherRegime } from "./regime";
import type {
  MarianaCorrectionDelta,
  MarianaForecastInput,
  MarianaForecastIntelligence,
  MarianaForecastVariables,
  MarianaHourlyIntelligence,
  MarianaLocationMemory,
  MarianaLocationRef,
  MarianaModelMemory,
  MarianaModelName,
} from "./types";

const DEFAULT_WEIGHTS: Record<string, number> = {
  WEERZONE_BLEND: 0.62,
  HARMONIE: 0.6,
  AROME: 0.56,
  ICON: 0.5,
  ECMWF: 0.52,
  GFS: 0.42,
  GOOGLE: 0.38,
};

const MODEL_KEY_MAP: Record<string, MarianaModelName> = {
  harmonie: "HARMONIE",
  arome: "AROME",
  icon: "ICON",
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
  const base = DEFAULT_WEIGHTS[String(modelName)] ?? 0.45;
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
  if (!memory || memory.sampleCount < 3) {
    return { hour, delta: {}, applied: false };
  }

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

function interpretation(args: {
  placeName?: string;
  confidence: MarianaForecastIntelligence["confidence"];
  weatherRegime: MarianaForecastIntelligence["weatherRegime"];
  correctionApplied: boolean;
  memorySamples: number;
  risks: string[];
}): string {
  const target = args.placeName ? `voor ${args.placeName}` : "voor deze locatie";
  const riskText = args.risks.length ? ` Aandachtspunt: ${args.risks.slice(0, 2).join(" en ")}.` : "";
  const memoryText = args.memorySamples >= 3
    ? ` Mariana gebruikt ${args.memorySamples} lokale verificaties voor bijsturing.`
    : " Mariana bouwt hier nog lokale verificatie op.";
  const correctionText = args.correctionApplied
    ? " De verwachting is lokaal gecorrigeerd met historisch modelgedrag."
    : " De verwachting blijft dicht bij de ruwe modelblend.";

  return `Mariana ziet ${target} een ${args.weatherRegime.label.toLowerCase()} met ${args.confidence.label} vertrouwen.${riskText}${memoryText}${correctionText}`;
}

export function applyMarianaArbitration(args: {
  location: MarianaLocationRef;
  weather: WeatherData;
  memory?: MarianaLocationMemory | null;
}): WeatherData {
  const hourlyIntelligence: MarianaHourlyIntelligence[] = [];
  let correctionApplied = false;

  const hourly = args.weather.hourly.map((hour) => {
    const forecasts = forecastsForHour(args.location, hour);
    const confidence = scoreModelConfidence(forecasts);
    const regime = classifyWeatherRegime({
      temperature: hour.temperature,
      precipitation: hour.precipitation,
      windSpeed: hour.windSpeed,
      weatherCode: hour.weatherCode,
    });
    const corrected = applyHourlyCorrection(hour, forecasts, args.memory);
    correctionApplied ||= corrected.applied;
    const risks = risksFor(corrected.hour, confidence.score, regime.signals);

    const intelligence: MarianaHourlyIntelligence = {
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
      mariana: intelligence,
    };
  });

  const first12 = hourlyIntelligence.slice(0, 12);
  const aggregateForecasts = args.weather.hourly.slice(0, 12).flatMap((hour) => forecastsForHour(args.location, hour));
  const confidence = scoreModelConfidence(aggregateForecasts);
  const weatherRegime = classifyWeatherRegime({
    temperature: args.weather.current.temperature,
    precipitation: args.weather.current.precipitation,
    windSpeed: args.weather.current.windSpeed,
    windGusts: args.weather.current.windGusts,
    humidity: args.weather.current.humidity,
    weatherCode: args.weather.current.weatherCode,
  });
  const risks = [...new Set(first12.flatMap((hour) => hour.risks))].slice(0, 4);
  const models = dominantModels(aggregateForecasts, args.memory);
  const reasoningModels = selectMarianaReasoningModels({
    newModelRunAvailable: true,
    confidenceScore: confidence.score,
    modelDivergenceScore: 1 - confidence.score,
    severeWeatherRisk: risks.includes("convectieve onzekerheid") || risks.includes("windgevoelig"),
    weatherRegimeCode: weatherRegime.code,
  });

  const next: WeatherData = {
    ...args.weather,
    hourly,
    models: {
      ...args.weather.models,
      agreement: Math.round(confidence.score * 100),
      label: confidence.label === "high"
        ? "Hoge Mariana-consensus"
        : confidence.label === "medium"
          ? "Gemiddelde Mariana-consensus"
          : "Lage Mariana-consensus",
      sources: [...new Set([...args.weather.models.sources, "Mariana arbitration"])],
    },
    mariana: {
      locationId: args.location.locationId,
      locationName: args.location.name,
      confidence,
      weatherRegime,
      correctionApplied,
      memorySamples: args.memory?.sampleCount ?? 0,
      dominantModels: models,
      risks,
      reasoningModels,
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

  if (hourly[0]) {
    const tempDelta = hourly[0].temperature - args.weather.hourly[0].temperature;
    const windDelta = hourly[0].windSpeed - args.weather.hourly[0].windSpeed;
    const rainDelta = hourly[0].precipitation - args.weather.hourly[0].precipitation;
    next.current = {
      ...next.current,
      temperature: next.current.temperature + tempDelta,
      feelsLike: next.current.feelsLike + tempDelta,
      windSpeed: Math.max(0, next.current.windSpeed + windDelta),
      precipitation: Math.max(0, round(next.current.precipitation + rainDelta, 2)),
    };
  }

  return next;
}
