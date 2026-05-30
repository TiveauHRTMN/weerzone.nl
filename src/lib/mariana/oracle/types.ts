/**
 * Mariana Oracle — types + output-contract (48-96u regime-engine).
 *
 * Oracle is de interne middellange-termijn regime-engine. Geen publieksagent,
 * geen route. Ze voedt Mariana ALTIJD met regimecontext en activeert Tesla
 * ALLEEN wanneer er een onstabiliteits-/onweer-signaal is.
 *
 * De gate naar Tesla is BINAIR (founder-beslissing): OFF (slaap) of ACTIVATE
 * (onstabiliteitskans aanwezig -> Tesla draait en zoekt de ernst zelf uit).
 *
 * Hermes (OpenRouter) ondersteunt geen json_schema-tool zoals Anthropic; we
 * forceren JSON via response_format en normaliseren defensief.
 */

export type OracleGate = "OFF" | "ACTIVATE";

export type OracleConflictLevel = "low" | "medium" | "high";

/** Eén tak van de scenario-boom (48-96u). */
export interface OracleScenario {
  scenario: string;
  probability: number; // 0..1
  driver: string;
  confirmation_signal: string;
  failure_signal: string;
}

export interface OracleModelConflict {
  level: OracleConflictLevel;
  type: string[];
  summary: string;
}

export interface OracleDomainImpacts {
  temperature: string;
  rain: string;
  wind: string;
  thunder: string;
  pollen: string;
  comfort: string;
}

export interface OracleConfidence {
  regime: number;
  temperature_trend: number;
  precipitation_regime: number;
  wind_regime: number;
  convective_gate: number;
  model_agreement: number;
}

/** Het volledige Oracle-signaal zoals teruggegeven aan Mariana. */
export interface OracleSignal {
  module: "mariana_oracle";
  model: "hermes_4_70b";
  oracle_window: "48-96h";
  dominant_regime: string;
  regime_summary: string;
  pressure_pattern: string;
  ridge_axis_assessment: string;
  jetstream_assessment: string;
  airmass_assessment: string;
  "850hpa_trend": string;
  "700hpa_cap_signal": string;
  "500hpa_pattern": string;
  front_trough_timing: string;
  regime_shift_watch: boolean;
  /** Binaire gate: OFF of ACTIVATE. */
  convective_gate: OracleGate;
  /** Afgeleid/consistent met de gate: true <=> gate === "ACTIVATE". */
  run_tesla: boolean;
  tesla_activation_reason: string;
  scenario_tree: OracleScenario[];
  model_conflict: OracleModelConflict;
  domain_impacts: OracleDomainImpacts;
  confidence: OracleConfidence;
  mariana_action: string;
  /** Maximaal 3 zinnen. */
  oracle_summary: string;
}

/** Waarom Oracle draaide. Oracle draait dagelijks; handmatig voor debug. */
export type OracleTrigger = "scheduled_daily" | "manual";

/** Een opgeslagen Oracle-run: signaal + uitvoeringscontext. */
export interface OracleRun {
  runAt: string;
  /** Begin/eind van het 48-96u-venster (naïeve lokale ISO, Europe/Amsterdam). */
  validFrom: string;
  validUntil: string;
  trigger: OracleTrigger;
  model: string;
  signal: OracleSignal;
}

/** Geldige enum-waarden, herbruikbaar voor validatie. */
export const ORACLE_GATES: readonly OracleGate[] = ["OFF", "ACTIVATE"];
export const ORACLE_CONFLICT_LEVELS: readonly OracleConflictLevel[] = ["low", "medium", "high"];

function clamp01(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asString).filter((s) => s.length > 0);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizeConflict(value: unknown): OracleModelConflict {
  const c = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const level = ORACLE_CONFLICT_LEVELS.includes(c.level as OracleConflictLevel)
    ? (c.level as OracleConflictLevel)
    : "medium";
  return { level, type: asStringArray(c.type), summary: asString(c.summary) };
}

function normalizeScenarios(value: unknown): OracleScenario[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).map((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    return {
      scenario: asString(o.scenario),
      probability: clamp01(o.probability),
      driver: asString(o.driver),
      confirmation_signal: asString(o.confirmation_signal),
      failure_signal: asString(o.failure_signal),
    };
  });
}

function normalizeImpacts(value: unknown): OracleDomainImpacts {
  const d = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    temperature: asString(d.temperature),
    rain: asString(d.rain),
    wind: asString(d.wind),
    thunder: asString(d.thunder),
    pollen: asString(d.pollen),
    comfort: asString(d.comfort),
  };
}

/**
 * Normaliseert ruwe (geparste) LLM-output naar een gevalideerd OracleSignal.
 * Hard: module/model/window. De gate wordt geforceerd binair, en run_tesla
 * wordt consistent afgeleid (run_tesla <=> gate === "ACTIVATE") zodat het
 * contract nooit tegenstrijdig is.
 */
export function normalizeOracleSignal(raw: unknown): OracleSignal {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.confidence && typeof r.confidence === "object" ? r.confidence : {}) as Record<
    string,
    unknown
  >;

  // Gate: accepteer "ACTIVE"/"ACTIVATE"/true als ACTIVATE; al het andere -> OFF.
  const gateRaw = asString(r.convective_gate).toUpperCase();
  const gate: OracleGate =
    gateRaw === "ACTIVATE" || gateRaw === "ACTIVE" || r.run_tesla === true ? "ACTIVATE" : "OFF";

  return {
    module: "mariana_oracle",
    model: "hermes_4_70b",
    oracle_window: "48-96h",
    dominant_regime: asString(r.dominant_regime),
    regime_summary: asString(r.regime_summary),
    pressure_pattern: asString(r.pressure_pattern),
    ridge_axis_assessment: asString(r.ridge_axis_assessment),
    jetstream_assessment: asString(r.jetstream_assessment),
    airmass_assessment: asString(r.airmass_assessment),
    "850hpa_trend": asString(r["850hpa_trend"]),
    "700hpa_cap_signal": asString(r["700hpa_cap_signal"]),
    "500hpa_pattern": asString(r["500hpa_pattern"]),
    front_trough_timing: asString(r.front_trough_timing),
    regime_shift_watch: r.regime_shift_watch === true,
    convective_gate: gate,
    run_tesla: gate === "ACTIVATE",
    tesla_activation_reason: asString(r.tesla_activation_reason),
    scenario_tree: normalizeScenarios(r.scenario_tree),
    model_conflict: normalizeConflict(r.model_conflict),
    domain_impacts: normalizeImpacts(r.domain_impacts),
    confidence: {
      regime: clamp01(c.regime),
      temperature_trend: clamp01(c.temperature_trend),
      precipitation_regime: clamp01(c.precipitation_regime),
      wind_regime: clamp01(c.wind_regime),
      convective_gate: clamp01(c.convective_gate),
      model_agreement: clamp01(c.model_agreement),
    },
    mariana_action: asString(r.mariana_action),
    oracle_summary: asString(r.oracle_summary),
  };
}
