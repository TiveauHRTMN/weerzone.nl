/**
 * Mariana NL — engine/orkestratie (0-48u, per locatie).
 *
 * De centrale beslislaag. Verbindt de drie engines tot één lokaal besluit, met
 * twee banen die elkaar NIET middelen:
 *
 *  OPERATIONELE baan:
 *    Oracle-regimecontext + hi-res WeatherData -> Hermes -> Piet/Koos/locatie-basis.
 *
 *  CONVECTIEVE baan (alleen bij Oracle-gate ACTIVATE):
 *    Tesla draait voor de dichtstbijzijnde mesoschaal-regio -> Reed krijgt het
 *    signaal RAUW (niet gemiddeld). Mariana zet dan ook Piet's refer_to_reed aan.
 *
 * Flow (jouw architectuur):
 *    Oracle -> Mariana (+ Tesla indien gate ACTIVATE) -> Mariana beslist ->
 *    Piet / Koos / Reed / locatiepagina's.
 *
 * Geen route, geen frontend. Per-locatie on-demand.
 */

import type { WeatherData } from "@/lib/types";
import type { OracleRun } from "@/lib/mariana/oracle/types";
import { shouldRunTesla, oracleContextForTesla } from "@/lib/mariana/oracle/engine";
import { runTeslaForRegion } from "@/lib/mariana/tesla/engine";
import type { TeslaRun } from "@/lib/mariana/tesla/types";
import { nearestTeslaRegion } from "./nearest-region";
import { buildMarianaPacket, type ConvectiveGateStatus } from "./packet";
import { runMarianaReasoning } from "./client";
import {
  normalizeOperationalDraft,
  type MarianaRun,
  type MarianaSignal,
  type MarianaTrigger,
  type MarianaReedOutput,
} from "./types";

export interface RunMarianaOptions {
  trigger?: MarianaTrigger;
  /** Vooraf opgehaalde Oracle-run; anders levert de caller null (geen context). */
  oracle?: OracleRun | null;
  /** Founder-observaties voor de convectieve baan (doorgegeven aan Tesla). */
  founderNotes?: string[];
  model?: string;
}

/**
 * Draait Mariana voor één NL-locatie en geeft een volledig besluit terug.
 *
 * @param weather  hi-res 0-48u WeatherData (zelfde bron die /piet vandaag voedt)
 */
export async function runMariana(
  location: { name: string; lat: number; lon: number },
  weather: WeatherData,
  opts: RunMarianaOptions = {}
): Promise<MarianaRun> {
  const trigger: MarianaTrigger = opts.trigger ?? "on_demand";
  const oracle = opts.oracle ?? null;

  // --- CONVECTIEVE baan: draait Tesla alleen als Oracle de gate opent. ---
  let reed: MarianaReedOutput = { active: false, region_slug: null, region_name: null, tesla: null };
  let gate: ConvectiveGateStatus = { active: false, regionName: null, note: null };

  if (oracle && shouldRunTesla(oracle)) {
    const region = nearestTeslaRegion(location.lat, location.lon);
    try {
      const teslaRun: TeslaRun = await runTeslaForRegion(region, {
        trigger: "oracle_convective_gate",
        oracleContext: oracleContextForTesla(oracle),
        founderNotes: opts.founderNotes,
      });
      // Reed krijgt Tesla RAUW — geen averaging, het hele signaal onveranderd.
      reed = {
        active: true,
        region_slug: region.slug,
        region_name: region.name,
        tesla: teslaRun.signal,
      };
      gate = {
        active: true,
        regionName: region.name,
        note: teslaRun.signal.mariana_summary || null,
      };
    } catch (err) {
      // Tesla-falen mag de operationele baan niet blokkeren; Reed blijft inactief.
      console.warn(`runMariana: Tesla-run faalde voor ${region.slug}`, err);
    }
  }

  // --- OPERATIONELE baan: Hermes beslist Piet/Koos/locatie-basis. ---
  const packet = buildMarianaPacket({
    locationName: location.name,
    lat: location.lat,
    lon: location.lon,
    weather,
    oracle,
    gate,
  });
  const result = await runMarianaReasoning(packet, { model: opts.model });
  const draft = normalizeOperationalDraft(result.raw);

  // Mariana dwingt consistentie af: als de gate actief is, MOET Piet doorverwijzen,
  // ongeacht wat de LLM koos (de convectieve baan is leidend voor de pointer).
  const referReed = gate.active || draft.piet.refer_to_reed;
  const referralReason = gate.active
    ? draft.piet.referral_reason || "Onweer/convectie mogelijk — zie Reed voor de waarschuwingen."
    : "";

  const signal: MarianaSignal = {
    module: "mariana",
    model: "hermes_4_70b",
    window: "0-48h",
    location_scope: "NL",
    oracle_context_used: oracle !== null,
    tesla_context_used: reed.active,
    dominant_short_term_regime: draft.dominant_short_term_regime,
    model_blend_summary: draft.model_blend_summary,
    local_forecast_logic: draft.local_forecast_logic,
    risk_summary: draft.risk_summary,
    confidence: draft.confidence,
    agent_outputs: {
      piet: {
        text: draft.piet.text,
        refer_to_reed: referReed,
        referral_reason: referralReason,
      },
      koos: { text: draft.koos.text },
      reed,
    },
    location_output_contract: {
      ...draft.location_output_contract,
      convective_active: reed.active,
    },
    mariana_summary: draft.mariana_summary,
  };

  return {
    locationName: location.name,
    lat: location.lat,
    lon: location.lon,
    runAt: new Date().toISOString(),
    trigger,
    model: result.model,
    signal,
  };
}
