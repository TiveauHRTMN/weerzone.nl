import type {
  WeatherIntelligence,
  WeatherIntelligenceProvider,
} from "./weather-intelligence";

function stableNumber(value: string): number {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash;
}

export class SeedWeatherProvider implements WeatherIntelligenceProvider {
  async getContext(input: {
    latitude: number;
    longitude: number;
    date: string;
    timezone: string;
  }): Promise<WeatherIntelligence> {
    const key = `${input.date}:${input.latitude.toFixed(2)}:${input.longitude.toFixed(2)}`;
    const seed = stableNumber(key);
    const retrievedAt = `${input.date}T06:00:00.000Z`;
    return {
      context: {
        rainProbability: 25 + (seed % 41),
        windKph: 8 + (seed % 18),
        feelsLikeCelsius: 27 + (seed % 7),
        thunderstorm: seed % 13 === 0,
        condition: "seasonal",
      },
      horizon: "climate",
      confidence: 0.45,
      retrievedAt,
      validThrough: `${input.date}T23:59:59.999Z`,
      source: "Gecontroleerd seizoensbeeld",
      revision: `seed-v1:${key}`,
      fallbackStatus: "seed",
    };
  }
}
