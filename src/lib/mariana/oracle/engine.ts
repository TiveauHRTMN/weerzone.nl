/**
 * Mariana Oracle — engine/orkestratie.
 *
 * Verbindt de delen: bouw regime-packet -> laat Hermes 4 70B redeneren ->
 * normaliseer naar een gevalideerd OracleSignal -> verpak met uitvoeringscontext
 * tot een OracleRun. Dit is wat Mariana consumeert (regimecontext ALTIJD; de
 * binaire gate bepaalt of Mariana straks Tesla laat draaien).
 *
 * Deze fase (Fase 2) bouwt ALLEEN Oracle. Oracle roept Tesla NIET zelf aan —
 * de keten Oracle -> (gate) -> Tesla loopt via Mariana (Fase 3). Oracle levert
 * hier alleen het signaal + een helper om de gate uit te lezen.
 */

import { runOracleReasoning } from "./client";
import { buildOraclePacket } from "./packet";
import type { RegimeWindow } from "./regime-data";
import { normalizeOracleSignal, type OracleRun, type OracleTrigger } from "./types";

export interface RunOracleOptions {
  trigger?: OracleTrigger;
  window?: RegimeWindow;
  /** Founder regime-observaties (regime-modifier). */
  founderNotes?: string[];
  /** Optioneel ander analysepunt; default NL-centraal. */
  point?: { lat: number; lon: number };
  model?: string;
}

/** Draait Oracle (landelijk regime, 48-96u) en geeft een volledige OracleRun terug. */
export async function runOracle(opts: RunOracleOptions = {}): Promise<OracleRun> {
  const trigger: OracleTrigger = opts.trigger ?? "manual";

  const packet = await buildOraclePacket({
    trigger,
    window: opts.window,
    founderNotes: opts.founderNotes,
    point: opts.point,
  });

  const result = await runOracleReasoning(packet.text, { model: opts.model });
  const signal = normalizeOracleSignal(result.raw);

  return {
    runAt: new Date().toISOString(),
    validFrom: packet.window.fromIso,
    validUntil: packet.window.untilIso,
    trigger,
    model: result.model,
    signal,
  };
}

/**
 * Leest de Tesla-gate uit een OracleRun. Mariana gebruikt dit (Fase 3) om te
 * beslissen of Tesla moet draaien. run_tesla is in de normalizer al consistent
 * met de gate gemaakt (run_tesla <=> gate === "ACTIVATE").
 */
export function shouldRunTesla(run: OracleRun): boolean {
  return run.signal.run_tesla === true && run.signal.convective_gate === "ACTIVATE";
}

/**
 * Compacte tekstuele Oracle-context voor Tesla (Fase 3). Tesla's packet heeft een
 * losse `oracleContext`-string-haak; dit vult die met het regime + de
 * activatiereden, zonder Tesla aan Oracle's types te koppelen.
 */
export function oracleContextForTesla(run: OracleRun): string {
  const s = run.signal;
  return [
    `Oracle-regime (48-96u): ${s.dominant_regime || "n/b"}.`,
    s.regime_summary ? `Samenvatting: ${s.regime_summary}` : "",
    `Druk/rugas: ${s.pressure_pattern || "n/b"} | ${s.ridge_axis_assessment || "n/b"}`,
    `Jetstream: ${s.jetstream_assessment || "n/b"}`,
    `Luchtmassa: ${s.airmass_assessment || "n/b"}`,
    `Fronten/troggen-timing: ${s.front_trough_timing || "n/b"}`,
    `Gate: ${s.convective_gate}${s.tesla_activation_reason ? ` — ${s.tesla_activation_reason}` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}
