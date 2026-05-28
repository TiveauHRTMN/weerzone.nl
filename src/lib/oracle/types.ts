import type {
  MarianaConfidenceResult,
  MarianaWeatherRegime,
  MarianaCorrectionDelta,
  MarianaModelName,
} from "@/lib/mariana/types";

export interface OracleHourlyIntelligence {
  time: string;
  confidence: MarianaConfidenceResult;
  weatherRegime: MarianaWeatherRegime;
  correctionApplied: boolean;
  correctionDelta: MarianaCorrectionDelta;
  dominantModels: MarianaModelName[];
  risks: string[];
  notes: string[];
}

export interface OracleForecastIntelligence {
  locationId: string;
  locationName?: string;
  confidence: MarianaConfidenceResult;
  weatherRegime: MarianaWeatherRegime;
  correctionApplied: boolean;
  memorySamples: number;
  dominantModels: MarianaModelName[];
  risks: string[];
  interpretation: string;
  hourly: OracleHourlyIntelligence[];
}
