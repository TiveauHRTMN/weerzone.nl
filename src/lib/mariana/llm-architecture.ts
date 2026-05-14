export type MarianaReasoningModel =
  | "gpt-5.5-pro-xhigh"
  | "hermes-4-70b"
  | "deepseek-v4-pro";

export type MarianaExecutionTrigger =
  | "morning_strategic_control"
  | "new_model_run"
  | "realtime_cycle"
  | "storm"
  | "severe_convection"
  | "heatwave"
  | "snowfall"
  | "fog"
  | "major_instability"
  | "strong_model_divergence"
  | "uncertainty_spike"
  | "confidence_anomaly"
  | "fallback";

export interface MarianaModelRole {
  model: MarianaReasoningModel;
  label: string;
  role: "strategic" | "operational" | "critic";
  responsibilities: string[];
  avoid: string[];
  defaultTriggers: MarianaExecutionTrigger[];
  maxDailyRuns?: number;
  strategicRunsDaily?: number;
  cadenceMinutes?: { min: number; max: number };
}

export const MARIANA_LLM_ARCHITECTURE: Record<MarianaReasoningModel, MarianaModelRole> = {
  "gpt-5.5-pro-xhigh": {
    model: "gpt-5.5-pro-xhigh",
    label: "GPT-5.5 Pro xHigh",
    role: "strategic",
    responsibilities: [
      "morning_atmospheric_control",
      "strategic_atmospheric_analysis",
      "weather_regime_interpretation",
      "severe_weather_reasoning",
      "large_scale_model_arbitration",
      "confidence_recalibration",
      "hyperlocal_correction_strategy",
      "forecast_doctrine_refinement",
      "long_context_atmospheric_reasoning",
      "daily_and_event_driven_deep_analysis",
    ],
    avoid: [
      "continuous_low_latency_cycles",
      "rest_of_day_operational_takeover",
      "generic_realtime_summaries",
      "lightweight_operational_updates",
    ],
    defaultTriggers: [
      "morning_strategic_control",
      "storm",
      "severe_convection",
      "heatwave",
      "snowfall",
      "fog",
      "major_instability",
      "strong_model_divergence",
    ],
    strategicRunsDaily: 14,
  },
  "hermes-4-70b": {
    model: "hermes-4-70b",
    label: "Hermes 4 70B",
    role: "operational",
    responsibilities: [
      "rest_of_day_operational_execution",
      "realtime_atmospheric_monitoring",
      "frequent_weather_cycle_execution",
      "radar_interpretation",
      "rapid_model_comparison",
      "hyperlocal_operational_updates",
      "short_term_forecast_reasoning",
      "local_anomaly_detection",
      "fast_atmospheric_interpretation",
      "continuous_low_latency_execution",
    ],
    avoid: [
      "long_context_doctrine_refinement",
      "expensive_deep_analysis_without_trigger",
    ],
    defaultTriggers: ["new_model_run", "realtime_cycle"],
    cadenceMinutes: { min: 5, max: 30 },
  },
  "deepseek-v4-pro": {
    model: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    role: "critic",
    responsibilities: [
      "rest_of_day_validation_and_challenge",
      "contradiction_analysis",
      "second_opinion_reasoning",
      "fallback_atmospheric_analysis",
      "confidence_validation",
      "hallucination_reduction",
      "model_disagreement_detection",
      "edge_case_review",
      "overconfidence_detection",
    ],
    avoid: [
      "primary_realtime_execution",
      "untriggered_generic_forecasts",
    ],
    defaultTriggers: [
      "strong_model_divergence",
      "new_model_run",
      "uncertainty_spike",
      "severe_convection",
      "storm",
      "confidence_anomaly",
      "fallback",
    ],
  },
};

export interface MarianaRuntimeContext {
  newModelRunAvailable?: boolean;
  morningStrategicControl?: boolean;
  modelDivergenceScore?: number;
  confidenceScore?: number;
  severeWeatherRisk?: boolean;
  weatherRegimeCode?: string;
  fallbackRequired?: boolean;
  scheduledStrategicRun?: boolean;
}

export function selectMarianaReasoningModels(context: MarianaRuntimeContext): MarianaReasoningModel[] {
  const selected = new Set<MarianaReasoningModel>();
  const divergence = context.modelDivergenceScore ?? 0;
  const confidence = context.confidenceScore ?? 1;
  const severe = context.severeWeatherRisk === true;
  const unstable = context.weatherRegimeCode === "dynamic_low" || context.weatherRegimeCode === "heat";

  if (context.newModelRunAvailable) {
    selected.add("hermes-4-70b");
  }

  if (context.morningStrategicControl) {
    selected.add("gpt-5.5-pro-xhigh");
  }

  if (context.fallbackRequired || severe || unstable || divergence >= 0.5 || confidence < 0.55) {
    selected.add("deepseek-v4-pro");
  }

  return [...selected];
}
