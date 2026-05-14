import type { MarianaReasoningModel } from "./llm-architecture";

export type MarianaKnownModelName =
  | "HARMONIE"
  | "AROME"
  | "ECMWF"
  | "GFS"
  | "ICON";

export type MarianaModelName = MarianaKnownModelName | (string & {});

export interface MarianaLocationRef {
  locationId: string;
  name?: string;
  lat: number;
  lon: number;
  province?: string;
}

export interface MarianaForecastVariables {
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
  windGusts?: number;
  pressure?: number;
  humidity?: number;
  weatherCode?: number;
}

export interface MarianaForecastInput {
  location: MarianaLocationRef;
  modelName: MarianaModelName;
  forecastTimestamp: string;
  validAt: string;
  forecastHorizon: number;
  variables: MarianaForecastVariables;
  source?: string;
  runId?: string;
}

export interface MarianaActualInput {
  location: MarianaLocationRef;
  observedAt: string;
  variables: MarianaForecastVariables;
  stationId?: string;
  source?: string;
}

export interface MarianaVariableStats {
  count: number;
  mean: number;
  min: number;
  max: number;
  spread: number;
  stdDev: number;
}

export type MarianaDivergence = Partial<Record<keyof MarianaForecastVariables, MarianaVariableStats>>;

export interface MarianaConfidenceResult {
  score: number;
  label: "high" | "medium" | "low";
  modelCount: number;
  divergence: MarianaDivergence;
  notes: string[];
}

export interface MarianaForecastError {
  forecastId?: string;
  modelName: MarianaModelName;
  locationId: string;
  forecastTimestamp: string;
  validAt: string;
  forecastHorizon: number;
  errors: Partial<Record<keyof MarianaForecastVariables, number>>;
  absoluteErrors: Partial<Record<keyof MarianaForecastVariables, number>>;
}

export interface MarianaWeatherRegime {
  code: string;
  label: string;
  signals: string[];
}

export interface MarianaModelMemory {
  samples: number;
  meanAbsoluteError: Partial<Record<keyof MarianaForecastVariables, number>>;
  bias: Partial<Record<keyof MarianaForecastVariables, number>>;
  weightHint: number;
}

export interface MarianaLocationMemory {
  locationId: string;
  locationName?: string;
  lat: number;
  lon: number;
  weatherRegime?: MarianaWeatherRegime;
  modelStats: Partial<Record<MarianaModelName, MarianaModelMemory>>;
  correctionNotes: string[];
  sampleCount: number;
  updatedAt: string;
}

export interface MarianaCorrectionDelta {
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

export interface MarianaHourlyIntelligence {
  time: string;
  confidence: MarianaConfidenceResult;
  weatherRegime: MarianaWeatherRegime;
  correctionApplied: boolean;
  correctionDelta: MarianaCorrectionDelta;
  dominantModels: MarianaModelName[];
  risks: string[];
  notes: string[];
}

export interface MarianaForecastIntelligence {
  locationId: string;
  locationName?: string;
  confidence: MarianaConfidenceResult;
  weatherRegime: MarianaWeatherRegime;
  correctionApplied: boolean;
  memorySamples: number;
  dominantModels: MarianaModelName[];
  risks: string[];
  reasoningModels: MarianaReasoningModel[];
  interpretation: string;
  hourly: MarianaHourlyIntelligence[];
}
