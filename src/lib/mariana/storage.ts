import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  MarianaActualInput,
  MarianaConfidenceResult,
  MarianaForecastError,
  MarianaForecastInput,
  MarianaLocationMemory,
  MarianaModelMemory,
  MarianaModelName,
  MarianaLocationRef,
  MarianaWeatherRegime,
} from "./types";

const FORECAST_TABLE = "mariana_forecast_observations";
const ACTUAL_TABLE = "mariana_actual_observations";
const MEMORY_TABLE = "mariana_location_memory";

type ForecastRow = MarianaForecastInput & { id?: string };

function nowIso() {
  return new Date().toISOString();
}

function averageNumber(a: number | undefined, b: number | undefined, aWeight: number, bWeight = 1): number | undefined {
  if (typeof b !== "number") return a;
  if (typeof a !== "number") return b;
  return Number(((a * aWeight + b * bWeight) / (aWeight + bWeight)).toFixed(4));
}

export async function saveMarianaForecasts(
  forecasts: MarianaForecastInput[],
  confidence: MarianaConfidenceResult
): Promise<{ ok: boolean; inserted: number; reason?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, inserted: 0, reason: "supabase_not_configured" };

  const rows = forecasts.map((forecast) => ({
    location_id: forecast.location.locationId,
    location_name: forecast.location.name ?? null,
    lat: forecast.location.lat,
    lon: forecast.location.lon,
    model_name: forecast.modelName,
    run_id: forecast.runId ?? null,
    forecast_timestamp: forecast.forecastTimestamp,
    valid_at: forecast.validAt,
    forecast_horizon: forecast.forecastHorizon,
    variables: forecast.variables,
    confidence_score: confidence.score,
    confidence_label: confidence.label,
    model_count: confidence.modelCount,
    divergence: confidence.divergence,
    source: forecast.source ?? null,
  }));

  const { error } = await supabase.from(FORECAST_TABLE).insert(rows);
  if (error) return { ok: false, inserted: 0, reason: error.message };
  return { ok: true, inserted: rows.length };
}

export async function saveMarianaActual(actual: MarianaActualInput): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, reason: "supabase_not_configured" };

  const { data, error } = await supabase
    .from(ACTUAL_TABLE)
    .insert({
      location_id: actual.location.locationId,
      location_name: actual.location.name ?? null,
      lat: actual.location.lat,
      lon: actual.location.lon,
      observed_at: actual.observedAt,
      variables: actual.variables,
      station_id: actual.stationId ?? null,
      source: actual.source ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  return { ok: true, id: data?.id };
}

export async function loadForecastsForActual(actual: MarianaActualInput): Promise<ForecastRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const observedMs = new Date(actual.observedAt).getTime();
  const from = new Date(observedMs - 45 * 60_000).toISOString();
  const to = new Date(observedMs + 45 * 60_000).toISOString();

  const { data, error } = await supabase
    .from(FORECAST_TABLE)
    .select("id, location_id, location_name, lat, lon, model_name, forecast_timestamp, valid_at, forecast_horizon, variables, source, run_id")
    .eq("location_id", actual.location.locationId)
    .gte("valid_at", from)
    .lte("valid_at", to)
    .limit(250);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    location: {
      locationId: row.location_id,
      name: row.location_name ?? undefined,
      lat: Number(row.lat),
      lon: Number(row.lon),
    },
    modelName: row.model_name,
    forecastTimestamp: row.forecast_timestamp,
    validAt: row.valid_at,
    forecastHorizon: Number(row.forecast_horizon),
    variables: row.variables ?? {},
    source: row.source ?? undefined,
    runId: row.run_id ?? undefined,
  }));
}

export async function saveMarianaErrors(actualId: string | undefined, errors: MarianaForecastError[]): Promise<{ ok: boolean; updated: number; reason?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, updated: 0, reason: "supabase_not_configured" };

  let updated = 0;
  for (const forecastError of errors) {
    if (!forecastError.forecastId) continue;
    const { error } = await supabase
      .from(FORECAST_TABLE)
      .update({
        actual_observation_id: actualId ?? null,
        error: forecastError.errors,
        absolute_error: forecastError.absoluteErrors,
        verified_at: nowIso(),
      })
      .eq("id", forecastError.forecastId);
    if (!error) updated++;
  }

  return { ok: true, updated };
}

export async function loadMarianaMemory(locationId: string): Promise<MarianaLocationMemory | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(MEMORY_TABLE)
    .select("*")
    .eq("location_id", locationId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    locationId: data.location_id,
    locationName: data.location_name ?? undefined,
    lat: Number(data.lat),
    lon: Number(data.lon),
    weatherRegime: data.weather_regime ?? undefined,
    modelStats: data.model_stats ?? {},
    correctionNotes: data.correction_notes ?? [],
    sampleCount: Number(data.sample_count ?? 0),
    updatedAt: data.updated_at,
  };
}

export async function updateMarianaMemory(args: {
  actual: MarianaActualInput;
  errors: MarianaForecastError[];
  weatherRegime: MarianaWeatherRegime;
}): Promise<{ ok: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, reason: "supabase_not_configured" };

  const existing = await loadMarianaMemory(args.actual.location.locationId);
  const modelStats: Partial<Record<MarianaModelName, MarianaModelMemory>> = { ...(existing?.modelStats ?? {}) };
  let sampleCount = existing?.sampleCount ?? 0;

  for (const forecastError of args.errors) {
    const current = modelStats[forecastError.modelName] ?? {
      samples: 0,
      meanAbsoluteError: {},
      bias: {},
      weightHint: 0.5,
    };

    const previousSamples = current.samples;
    const nextSamples = previousSamples + 1;
    const nextMae = { ...current.meanAbsoluteError };
    const nextBias = { ...current.bias };

    for (const [variable, value] of Object.entries(forecastError.absoluteErrors)) {
      nextMae[variable as keyof typeof nextMae] = averageNumber(
        nextMae[variable as keyof typeof nextMae],
        value,
        previousSamples
      );
    }
    for (const [variable, value] of Object.entries(forecastError.errors)) {
      nextBias[variable as keyof typeof nextBias] = averageNumber(
        nextBias[variable as keyof typeof nextBias],
        value,
        previousSamples
      );
    }

    const tempMae = nextMae.temperature ?? 2;
    const precipMae = nextMae.precipitation ?? 1;
    const windMae = nextMae.windSpeed ?? 8;
    const quality = 1 / (1 + tempMae / 3 + precipMae / 5 + windMae / 25);

    modelStats[forecastError.modelName] = {
      samples: nextSamples,
      meanAbsoluteError: nextMae,
      bias: nextBias,
      weightHint: Number(Math.max(0.05, Math.min(0.95, quality)).toFixed(3)),
    };
    sampleCount++;
  }

  const correctionNotes = [...(existing?.correctionNotes ?? [])].slice(-8);
  if (args.errors.length) {
    correctionNotes.push(`updated ${args.errors.length} verification sample(s) for ${args.weatherRegime.code}`);
  }

  const { error } = await supabase.from(MEMORY_TABLE).upsert({
    location_id: args.actual.location.locationId,
    location_name: args.actual.location.name ?? existing?.locationName ?? null,
    lat: args.actual.location.lat,
    lon: args.actual.location.lon,
    weather_regime: args.weatherRegime,
    model_stats: modelStats,
    correction_notes: correctionNotes.slice(-10),
    sample_count: sampleCount,
    updated_at: nowIso(),
  }, { onConflict: "location_id" });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function seedMarianaLocationMemory(location: MarianaLocationRef): Promise<{ ok: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, reason: "supabase_not_configured" };

  const { error } = await supabase.from(MEMORY_TABLE).upsert({
    location_id: location.locationId,
    location_name: location.name ?? null,
    lat: location.lat,
    lon: location.lon,
    model_stats: {},
    correction_notes: [],
    sample_count: 0,
    updated_at: nowIso(),
  }, { onConflict: "location_id", ignoreDuplicates: true });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
