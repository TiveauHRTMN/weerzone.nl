import type { WeatherData } from "@/lib/types";
import { toMarianaLocation } from "@/lib/mariana/location";
import { scoreModelConfidence } from "@/lib/mariana/confidence";
import { saveMarianaForecasts } from "@/lib/mariana/storage";
import { buildMarianaForecast } from "@/lib/mariana/service";
import type {
  MarianaForecastInput,
  MarianaForecastVariables,
  MarianaLocationRef,
  MarianaModelName,
} from "@/lib/mariana/types";

export function forecastsFromWeatherData(args: {
  location: { name?: string; province?: string; lat: number; lon: number; id?: string; locationId?: string };
  weather: WeatherData;
  forecastTimestamp?: string | Date;
  runId?: string;
}): MarianaForecastInput[] {
  const location = toMarianaLocation(args.location);
  const forecastTimestamp = args.forecastTimestamp ?? new Date();
  const forecasts: MarianaForecastInput[] = [];

  // Slice hours 48 to 96 (the Oracle forecasting range)
  for (const hour of args.weather.hourly.slice(48, 96)) {
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
      source: "weerzone_blend_oracle",
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
        source: "open_meteo_model_layer_oracle",
        runId: args.runId,
      }));
    }
  }

  return forecasts;
}

export async function logOracleForecasts(forecasts: MarianaForecastInput[]): Promise<{
  ok: boolean;
  inserted: number;
  reason?: string;
}> {
  const confidence = scoreModelConfidence(forecasts);
  return saveMarianaForecasts(forecasts, confidence);
}
