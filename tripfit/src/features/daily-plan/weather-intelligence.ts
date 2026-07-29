import type { WeatherContext } from "@/domain/recommendations/engine";

export type WeatherHorizon = "climate" | "subseasonal" | "forecast" | "nowcast";
export type WeatherFallbackStatus = "live" | "cached" | "seed" | "unavailable";

export type WeatherIntelligence = {
  context: WeatherContext;
  horizon: WeatherHorizon;
  confidence: number;
  retrievedAt: string;
  validThrough: string;
  source: string;
  revision: string;
  fallbackStatus: WeatherFallbackStatus;
};

export interface WeatherIntelligenceProvider {
  getContext(input: {
    latitude: number;
    longitude: number;
    date: string;
    timezone: string;
  }): Promise<WeatherIntelligence>;
}
