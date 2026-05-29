/**
 * Mariana Tesla — types + output-schema.
 *
 * Tesla's output is een gestructureerd convectief signaal (zie sectie 16 van de
 * systeemprompt). We typen het exact, leveren een JSON-Schema voor Anthropic
 * structured outputs (output_config.format), en een lichte runtime-validator/
 * normalizer (geen externe dep — zod zit niet in de repo).
 */

export type TeslaSignalLevel = "GREEN" | "AMBER" | "RED";

export type TeslaReedAction = "HOLD" | "OBSERVE" | "SHIFT" | "COMMIT" | "ABORT";

/** Confidence-blok, alle scores 0.00-1.00 (zie sectie 14). */
export interface TeslaConfidence {
  initiation: number;
  thunder: number;
  severe: number;
  upscale: number;
  timing: number;
  location: number;
  model_agreement: number;
  founder_signal_weight: number;
}

/** Het volledige Tesla-signaal zoals teruggegeven aan Mariana. */
export interface TeslaSignal {
  tesla_signal: TeslaSignalLevel;
  convective_regime: string;
  synoptic_setup: string;
  model_consensus: string;
  model_conflict: string;
  cape_assessment: string;
  cin_status: string;
  effective_cin_assessment: string;
  trigger_alignment: string;
  timing_window: string;
  initiation_zone: string;
  upstream_hijack_risk: boolean;
  seed_cell_watch: boolean;
  peak_corridor: string;
  expected_mode: string;
  inflow_outflow_expectation: string;
  dutch_mesoscale_factors: string[];
  founder_input_assessment: string;
  confidence: TeslaConfidence;
  failure_modes: string[];
  reed_action: TeslaReedAction;
  /** Maximaal 3 zinnen, hapklaar voor Mariana. */
  mariana_summary: string;
  /** Compacte redeneerketen, geen essays. */
  reasoning_chain: string[];
}

/**
 * Een opgeslagen Tesla-run: het signaal plus de uitvoeringscontext (welke regio,
 * welk valid-window, welk model, welke trigger). Dit is wat Mariana/Reed leest.
 */
export interface TeslaRun {
  /** Stabiele id van de mesoschaal-regio (zie regions.ts). */
  regionSlug: string;
  regionName: string;
  lat: number;
  lon: number;
  /** ISO-timestamp van wanneer Tesla draaide. */
  runAt: string;
  /** Begin van het geanalyseerde venster (meestal vandaag/komende dag). */
  validFrom: string;
  validUntil: string;
  /** Wat Tesla deed draaien (zie TeslaTrigger). */
  trigger: TeslaTrigger;
  /** Het LLM-model dat de redenering deed. */
  model: string;
  signal: TeslaSignal;
}

/**
 * Waarom Tesla draaide. Primair: Oracle (48-96u) signaleert onstabiele lucht in
 * de pijplijn. Tot Oracle bestaat gebruiken we directe proxies.
 */
export type TeslaTrigger =
  | "oracle_instability_pipeline" // primair: Oracle 48-96u meldt onstabiele lucht
  | "estofex_threat" // proxy: ESTOFEX level >= drempel
  | "model_cape_threshold" // proxy: model-CAPE/instabiliteit boven drempel
  | "scheduled_season" // vaste seizoensmomenten
  | "manual" // handmatig/admin
  | "founder_observation"; // founder injecteerde live observatie

/** Geldige enum-waarden, herbruikbaar voor validatie. */
export const TESLA_SIGNAL_LEVELS: readonly TeslaSignalLevel[] = ["GREEN", "AMBER", "RED"];
export const TESLA_REED_ACTIONS: readonly TeslaReedAction[] = [
  "HOLD",
  "OBSERVE",
  "SHIFT",
  "COMMIT",
  "ABORT",
];

/**
 * JSON-Schema voor Anthropic structured outputs (output_config.format).
 * Alle objecten hebben additionalProperties:false + volledige required-lijst
 * (vereist door structured outputs). Numerieke constraints (min/max) laten we
 * weg — die worden niet ondersteund; we clampen confidence runtime.
 *
 * NB: bewust GEEN `as const` — dat maakt de required/enum-arrays unions van
 * losse string-literals, en subtype-reductie daarover (O(n^2)) liet de
 * TS-checker over de V8 Map-limiet gaan in dit grote project. Als platte data
 * is dit niet nodig; client.ts cast 'm toch naar Record<string, unknown>.
 */
export const TESLA_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    tesla_signal: { type: "string", enum: ["GREEN", "AMBER", "RED"] },
    convective_regime: { type: "string" },
    synoptic_setup: { type: "string" },
    model_consensus: { type: "string" },
    model_conflict: { type: "string" },
    cape_assessment: { type: "string" },
    cin_status: { type: "string" },
    effective_cin_assessment: { type: "string" },
    trigger_alignment: { type: "string" },
    timing_window: { type: "string" },
    initiation_zone: { type: "string" },
    upstream_hijack_risk: { type: "boolean" },
    seed_cell_watch: { type: "boolean" },
    peak_corridor: { type: "string" },
    expected_mode: { type: "string" },
    inflow_outflow_expectation: { type: "string" },
    dutch_mesoscale_factors: { type: "array", items: { type: "string" } },
    founder_input_assessment: { type: "string" },
    confidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        initiation: { type: "number" },
        thunder: { type: "number" },
        severe: { type: "number" },
        upscale: { type: "number" },
        timing: { type: "number" },
        location: { type: "number" },
        model_agreement: { type: "number" },
        founder_signal_weight: { type: "number" },
      },
      required: [
        "initiation",
        "thunder",
        "severe",
        "upscale",
        "timing",
        "location",
        "model_agreement",
        "founder_signal_weight",
      ],
    },
    failure_modes: { type: "array", items: { type: "string" } },
    reed_action: { type: "string", enum: ["HOLD", "OBSERVE", "SHIFT", "COMMIT", "ABORT"] },
    mariana_summary: { type: "string" },
    reasoning_chain: { type: "array", items: { type: "string" } },
  },
  required: [
    "tesla_signal",
    "convective_regime",
    "synoptic_setup",
    "model_consensus",
    "model_conflict",
    "cape_assessment",
    "cin_status",
    "effective_cin_assessment",
    "trigger_alignment",
    "timing_window",
    "initiation_zone",
    "upstream_hijack_risk",
    "seed_cell_watch",
    "peak_corridor",
    "expected_mode",
    "inflow_outflow_expectation",
    "dutch_mesoscale_factors",
    "founder_input_assessment",
    "confidence",
    "failure_modes",
    "reed_action",
    "mariana_summary",
    "reasoning_chain",
  ],
};

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
 * Normaliseert ruwe (geparste) LLM-output naar een gevalideerd TeslaSignal.
 * Defensief: structured outputs garandeert de vorm meestal al, maar we clampen
 * confidence en vallen terug op veilige defaults bij ontbrekende velden.
 */
export function normalizeTeslaSignal(raw: unknown): TeslaSignal {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.confidence && typeof r.confidence === "object" ? r.confidence : {}) as Record<
    string,
    unknown
  >;

  const level = TESLA_SIGNAL_LEVELS.includes(r.tesla_signal as TeslaSignalLevel)
    ? (r.tesla_signal as TeslaSignalLevel)
    : "RED";
  const action = TESLA_REED_ACTIONS.includes(r.reed_action as TeslaReedAction)
    ? (r.reed_action as TeslaReedAction)
    : "OBSERVE";

  return {
    tesla_signal: level,
    convective_regime: asString(r.convective_regime),
    synoptic_setup: asString(r.synoptic_setup),
    model_consensus: asString(r.model_consensus),
    model_conflict: asString(r.model_conflict),
    cape_assessment: asString(r.cape_assessment),
    cin_status: asString(r.cin_status),
    effective_cin_assessment: asString(r.effective_cin_assessment),
    trigger_alignment: asString(r.trigger_alignment),
    timing_window: asString(r.timing_window),
    initiation_zone: asString(r.initiation_zone),
    upstream_hijack_risk: r.upstream_hijack_risk === true,
    seed_cell_watch: r.seed_cell_watch === true,
    peak_corridor: asString(r.peak_corridor),
    expected_mode: asString(r.expected_mode),
    inflow_outflow_expectation: asString(r.inflow_outflow_expectation),
    dutch_mesoscale_factors: asStringArray(r.dutch_mesoscale_factors),
    founder_input_assessment: asString(r.founder_input_assessment),
    confidence: {
      initiation: clamp01(c.initiation),
      thunder: clamp01(c.thunder),
      severe: clamp01(c.severe),
      upscale: clamp01(c.upscale),
      timing: clamp01(c.timing),
      location: clamp01(c.location),
      model_agreement: clamp01(c.model_agreement),
      founder_signal_weight: clamp01(c.founder_signal_weight),
    },
    failure_modes: asStringArray(r.failure_modes),
    reed_action: action,
    mariana_summary: asString(r.mariana_summary),
    reasoning_chain: asStringArray(r.reasoning_chain),
  };
}
