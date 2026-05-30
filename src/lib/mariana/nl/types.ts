/**
 * Mariana NL — types + output-contract (0-48u operationele orchestrator, NL).
 *
 * Mariana is de centrale beslislaag. Twee INTERNE banen die elkaar nooit middelen:
 *
 *  - Operationele baan (Oracle + hi-res WeatherData): blendt/verzacht -> voedt
 *    Piet, Koos en de locatie-basis. Hier mag genuanceerd/afgevlakt worden.
 *  - Convectieve baan (Tesla, alleen bij Oracle-gate ACTIVATE): draagt Tesla's
 *    harde waarheid DOOR zonder te middelen -> voedt Reed (rauw) en de
 *    onweerlaag van locatiepagina's.
 *
 * Verbindingsstuk: Mariana kan Piet de OPDRACHT geven door te verwijzen naar
 * /reed voor de waarschuwingen (refer_to_reed) — een gestuurde pointer, geen
 * data-dump. Zo blijft Piet praktisch en draagt Reed de convectieve diepte.
 *
 * Geen frontend, geen route. Scope NL 0-48u; oude Mariana buiten NL blijft intact.
 */

import type { TeslaSignal } from "@/lib/mariana/tesla/types";

export type MarianaConfidenceBand = "high" | "medium" | "low";

/** Per-agent risico-/domeinsamenvatting (operationele baan). */
export interface MarianaRiskSummary {
  rain: string;
  wind: string;
  thunder: string;
  temperature: string;
  pollen: string;
  comfort: string;
}

export interface MarianaConfidence {
  temperature: number;
  rain: number;
  wind: number;
  thunder: number;
  timing: number;
  local_detail: number;
}

/**
 * Piet-output. Praktisch, 0-48u. Draagt convectieve diepte NIET zelf; bij actief
 * onweer stuurt Mariana Piet door naar /reed via refer_to_reed.
 */
export interface MarianaPietOutput {
  text: string;
  /** Mariana's opdracht: verwijs voor de waarschuwingen door naar /reed. */
  refer_to_reed: boolean;
  /** Korte reden/aankondiging bij doorverwijzing (bv. "onweer vanmiddag"). */
  referral_reason: string;
}

/** Koos-output: comfort / reizen / beter-weer. */
export interface MarianaKoosOutput {
  text: string;
}

/**
 * Reed-output. Convectieve baan: Tesla's signaal wordt RAUW doorgegeven (niet
 * gemiddeld). `active` is false als de gate OFF was (dan is er geen Tesla-run en
 * heeft Reed niets te melden). De `tesla` payload is exact Tesla's contract.
 */
export interface MarianaReedOutput {
  active: boolean;
  /** Dichtstbijzijnde mesoschaal-regio waarvoor Tesla draaide (indien actief). */
  region_slug: string | null;
  region_name: string | null;
  /** Tesla's rauwe signaal — onveranderd doorgegeven. */
  tesla: TeslaSignal | null;
}

/** Contract dat een NL-locatiepagina toont (operationele basis + onweerlaag). */
export interface MarianaLocationContract {
  summary: string;
  hourly_focus: string;
  warnings: string[];
  uncertainty: string;
  best_action: string;
  /** True als de convectieve baan actief is voor deze locatie. */
  convective_active: boolean;
}

/** Het volledige Mariana-besluit voor één locatie. */
export interface MarianaSignal {
  module: "mariana";
  model: "hermes_4_70b";
  window: "0-48h";
  location_scope: "NL";
  /** Of de operationele baan Oracle-context kon gebruiken. */
  oracle_context_used: boolean;
  /** Of de convectieve baan (Tesla) actief was. */
  tesla_context_used: boolean;
  dominant_short_term_regime: string;
  model_blend_summary: string;
  local_forecast_logic: string;
  risk_summary: MarianaRiskSummary;
  confidence: MarianaConfidence;
  agent_outputs: {
    piet: MarianaPietOutput;
    koos: MarianaKoosOutput;
    reed: MarianaReedOutput;
  };
  location_output_contract: MarianaLocationContract;
  mariana_summary: string;
}

/** Trigger-bron voor een Mariana-run. */
export type MarianaTrigger = "scheduled_daily" | "on_demand" | "manual";

/** Een Mariana-besluit voor een specifieke locatie + uitvoeringscontext. */
export interface MarianaRun {
  locationName: string;
  lat: number;
  lon: number;
  runAt: string;
  trigger: MarianaTrigger;
  model: string;
  signal: MarianaSignal;
}

/** ---- Normalizer voor de LLM-output van de operationele baan ---- */

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

/**
 * Wat de operationele LLM-baan teruggeeft (vóór samenvoeging met de convectieve
 * baan). Bewust een kleinere shape dan MarianaSignal: Reed/Tesla worden NIET door
 * de LLM bepaald maar door de convectieve baan ingevoegd.
 */
export interface MarianaOperationalDraft {
  dominant_short_term_regime: string;
  model_blend_summary: string;
  local_forecast_logic: string;
  risk_summary: MarianaRiskSummary;
  confidence: MarianaConfidence;
  piet: { text: string; refer_to_reed: boolean; referral_reason: string };
  koos: { text: string };
  location_output_contract: Omit<MarianaLocationContract, "convective_active">;
  mariana_summary: string;
}

export function normalizeOperationalDraft(raw: unknown): MarianaOperationalDraft {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const risk = (r.risk_summary && typeof r.risk_summary === "object" ? r.risk_summary : {}) as Record<
    string,
    unknown
  >;
  const conf = (r.confidence && typeof r.confidence === "object" ? r.confidence : {}) as Record<
    string,
    unknown
  >;
  const piet = (r.piet && typeof r.piet === "object" ? r.piet : {}) as Record<string, unknown>;
  const koos = (r.koos && typeof r.koos === "object" ? r.koos : {}) as Record<string, unknown>;
  const loc = (r.location_output_contract && typeof r.location_output_contract === "object"
    ? r.location_output_contract
    : {}) as Record<string, unknown>;

  return {
    dominant_short_term_regime: asString(r.dominant_short_term_regime),
    model_blend_summary: asString(r.model_blend_summary),
    local_forecast_logic: asString(r.local_forecast_logic),
    risk_summary: {
      rain: asString(risk.rain),
      wind: asString(risk.wind),
      thunder: asString(risk.thunder),
      temperature: asString(risk.temperature),
      pollen: asString(risk.pollen),
      comfort: asString(risk.comfort),
    },
    confidence: {
      temperature: clamp01(conf.temperature),
      rain: clamp01(conf.rain),
      wind: clamp01(conf.wind),
      thunder: clamp01(conf.thunder),
      timing: clamp01(conf.timing),
      local_detail: clamp01(conf.local_detail),
    },
    piet: {
      text: asString(piet.text),
      refer_to_reed: piet.refer_to_reed === true,
      referral_reason: asString(piet.referral_reason),
    },
    koos: { text: asString(koos.text) },
    location_output_contract: {
      summary: asString(loc.summary),
      hourly_focus: asString(loc.hourly_focus),
      warnings: asStringArray(loc.warnings),
      uncertainty: asString(loc.uncertainty),
      best_action: asString(loc.best_action),
    },
    mariana_summary: asString(r.mariana_summary),
  };
}
