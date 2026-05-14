import type {
  MarianaConfidenceResult,
  MarianaDivergence,
  MarianaForecastInput,
  MarianaForecastVariables,
  MarianaVariableStats,
} from "./types";

const VARIABLES: Array<keyof MarianaForecastVariables> = [
  "temperature",
  "precipitation",
  "windSpeed",
  "windGusts",
  "pressure",
  "humidity",
];

const SPREAD_PENALTY: Partial<Record<keyof MarianaForecastVariables, number>> = {
  temperature: 8,
  precipitation: 10,
  windSpeed: 45,
  windGusts: 60,
  pressure: 18,
  humidity: 80,
};

function stats(values: number[]): MarianaVariableStats | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    count: values.length,
    mean: Number(mean.toFixed(3)),
    min,
    max,
    spread: Number((max - min).toFixed(3)),
    stdDev: Number(Math.sqrt(variance).toFixed(3)),
  };
}

export function calculateModelDivergence(forecasts: MarianaForecastInput[]): MarianaDivergence {
  const divergence: MarianaDivergence = {};

  for (const variable of VARIABLES) {
    const values = forecasts
      .map((forecast) => forecast.variables[variable])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const variableStats = stats(values);
    if (variableStats) divergence[variable] = variableStats;
  }

  return divergence;
}

export function scoreModelConfidence(forecasts: MarianaForecastInput[]): MarianaConfidenceResult {
  const modelNames = new Set(forecasts.map((forecast) => forecast.modelName));
  const divergence = calculateModelDivergence(forecasts);
  const notes: string[] = [];

  if (modelNames.size <= 1) {
    return {
      score: 0.58,
      label: "medium",
      modelCount: modelNames.size,
      divergence,
      notes: ["single_model_available"],
    };
  }

  let penalty = 0;
  let scoredVariables = 0;

  for (const [variable, variableStats] of Object.entries(divergence) as Array<[keyof MarianaForecastVariables, MarianaVariableStats]>) {
    const tolerance = SPREAD_PENALTY[variable] ?? 20;
    penalty += Math.min(0.35, variableStats.spread / tolerance);
    scoredVariables++;
    if (variableStats.spread > tolerance * 0.55) notes.push(`divergence_${variable}`);
  }

  const modelBonus = Math.min(0.14, (modelNames.size - 1) * 0.035);
  const averagePenalty = scoredVariables ? penalty / scoredVariables : 0.18;
  const score = Math.max(0.05, Math.min(0.98, 0.88 + modelBonus - averagePenalty));

  return {
    score: Number(score.toFixed(3)),
    label: score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low",
    modelCount: modelNames.size,
    divergence,
    notes,
  };
}
