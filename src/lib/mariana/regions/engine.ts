/**
 * Mariana Regions — engine/orkestratie (0-48u, PER REGIO).
 *
 * De LLM-duidingslaag van de cascade. Verbindt Oracle + Tesla tot één
 * regio-besluit + een voederkanaal (MarianaLocalFeed) naar Mariana Local. Twee
 * banen die elkaar NIET middelen:
 *
 *  OPERATIONELE baan:
 *    Oracle-regimecontext + hi-res WeatherData (regio-analysepunt) -> Hermes ->
 *    Piet/Koos/locatie-basis.
 *
 *  CONVECTIEVE baan (alleen bij Oracle-gate ACTIVATE):
 *    Tesla draait voor DEZE regio -> Reed krijgt het signaal RAUW (niet
 *    gemiddeld). Regions zet dan ook Piet's refer_to_reed aan.
 *
 * Flow: Oracle + Tesla -> Regions (per regio, 1x/dag) -> Mariana Local (wiskunde,
 * per locatie) -> 10.000 paginas / Piet / Koos / Reed.
 *
 * Geen route, geen frontend.
 */

import type { WeatherData } from "@/lib/types";
import type { OracleRun } from "@/lib/mariana/oracle/types";
import { shouldRunTesla, oracleContextForTesla } from "@/lib/mariana/oracle/engine";
import { runTeslaForRegion } from "@/lib/mariana/tesla/engine";
import type { TeslaRun, TeslaSignal } from "@/lib/mariana/tesla/types";
import type { TeslaRegion } from "@/lib/mariana/tesla/regions";
import { buildMarianaPacket, type ConvectiveGateStatus } from "./packet";
import { runMarianaReasoning } from "./client";
import {
  normalizeOperationalDraft,
  type MarianaRun,
  type MarianaSignal,
  type MarianaTrigger,
  type MarianaReedOutput,
  type MarianaLocalFeed,
} from "./types";

export interface RunRegionOptions {
  trigger?: MarianaTrigger;
  /** Vooraf opgehaalde Oracle-run; anders null (geen regimecontext). */
  oracle?: OracleRun | null;
  /** Founder-observaties voor de convectieve baan (doorgegeven aan Tesla). */
  founderNotes?: string[];
  model?: string;
}

/**
 * Per-dag modelgewichten afgeleid uit het regime + modelconflict. Dit is wat
 * Regions aan Mariana Local doorgeeft i.p.v. Local's statische DEFAULT_WEIGHTS.
 *
 * Heuristiek (founder verfijnt later): hi-res modellen (HARMONIE/AROME/ICON_D2)
 * krijgen meer gewicht bij convectie/instabiel regime; de globale modellen
 * (ECMWF/GFS/AIFS) tellen zwaarder bij een rustig, grootschalig regime. De
 * absolute waarden sluiten aan op Local's bestaande 0-1 schaal.
 */
function deriveModelWeights(opts: {
  convectiveActive: boolean;
  oracle: OracleRun | null;
}): Record<string, number> {
  const convective = opts.convectiveActive;
  // Basis dicht bij Local's bestaande DEFAULT_WEIGHTS.
  const base: Record<string, number> = {
    WEERZONE_BLEND: 0.62,
    HARMONIE: 0.6,
    AROME: 0.56,
    ICON_D2: 0.54,
    ECMWF: 0.52,
    GFS: 0.42,
    ECMWF_AIFS_SET_X: 0.5,
  };
  if (convective) {
    // Hi-res wint bij convectie (lokale buienstructuur/timing).
    base.HARMONIE = 0.72;
    base.AROME = 0.7;
    base.ICON_D2 = 0.66;
    base.ECMWF = 0.46;
    base.GFS = 0.36;
  } else {
    // Rustig/grootschalig regime: globale modellen stabieler.
    base.ECMWF = 0.58;
    base.ECMWF_AIFS_SET_X = 0.56;
  }
  return base;
}

/** Gevaarvlaggen voor Local's risks-laag, afgeleid uit Tesla + Oracle + draft. */
function deriveHazardFlags(args: {
  tesla: TeslaSignal | null;
  thunderText: string;
  windText: string;
  rainText: string;
}): string[] {
  const flags = new Set<string>();
  if (args.tesla) {
    flags.add("thunder");
    if (args.tesla.tesla_signal >= 2) flags.add("severe_convection");
    if (args.tesla.tesla_signal >= 3) flags.add("high_end_convection");
  }
  const t = `${args.thunderText} ${args.windText} ${args.rainText}`.toLowerCase();
  if (/onweer|bliksem|buien/.test(t)) flags.add("thunder");
  if (/wind|storm|stoot|gust/.test(t)) flags.add("wind");
  if (/zware regen|extreme neerslag|hoosbui|wateroverlast/.test(t)) flags.add("heavy_rain");
  return [...flags];
}

/**
 * Draait Mariana Regions voor één mesoschaal-regio en geeft een volledig besluit
 * + het voederkanaal naar Local terug.
 *
 * @param region   de Tesla-mesoschaal-regio (analysepunt = region.lat/lon)
 * @param weather  hi-res 0-48u WeatherData voor het regio-analysepunt
 */
export async function runMarianaRegion(
  region: TeslaRegion,
  weather: WeatherData,
  opts: RunRegionOptions = {}
): Promise<MarianaRun> {
  const trigger: MarianaTrigger = opts.trigger ?? "scheduled_daily";
  const oracle = opts.oracle ?? null;

  // --- CONVECTIEVE baan: Tesla draait voor DEZE regio als Oracle de gate opent. ---
  let reed: MarianaReedOutput = { active: false, region_slug: null, region_name: null, tesla: null };
  let gate: ConvectiveGateStatus = { active: false, regionName: null, note: null };

  if (oracle && shouldRunTesla(oracle)) {
    try {
      const teslaRun: TeslaRun = await runTeslaForRegion(region, {
        trigger: "oracle_convective_gate",
        oracleContext: oracleContextForTesla(oracle),
        founderNotes: opts.founderNotes,
      });
      reed = {
        active: true,
        region_slug: region.slug,
        region_name: region.name,
        tesla: teslaRun.signal,
      };
      gate = { active: true, regionName: region.name, note: teslaRun.signal.mariana_summary || null };
    } catch (err) {
      console.warn(`runMarianaRegion: Tesla-run faalde voor ${region.slug}`, err);
    }
  }

  // --- OPERATIONELE baan: Hermes beslist Piet/Koos/locatie-basis voor de regio. ---
  const packet = buildMarianaPacket({
    locationName: region.name,
    lat: region.lat,
    lon: region.lon,
    weather,
    oracle,
    gate,
  });
  const result = await runMarianaReasoning(packet, { model: opts.model });
  const draft = normalizeOperationalDraft(result.raw);

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
      piet: { text: draft.piet.text, refer_to_reed: referReed, referral_reason: referralReason },
      koos: { text: draft.koos.text },
      reed,
    },
    location_output_contract: {
      ...draft.location_output_contract,
      convective_active: reed.active,
    },
    mariana_summary: draft.mariana_summary,
  };

  // --- VOEDERKANAAL naar Mariana Local. ---
  const runAt = new Date().toISOString();
  const local_feed: MarianaLocalFeed = {
    regionSlug: region.slug,
    regionName: region.name,
    regimeCode: oracle?.signal.dominant_regime || draft.dominant_short_term_regime || "onbekend",
    regimeLabel: draft.dominant_short_term_regime || oracle?.signal.dominant_regime || "onbekend",
    // confidence-prior: gemiddelde van de operationele confidence-scores.
    confidencePrior:
      (draft.confidence.temperature +
        draft.confidence.rain +
        draft.confidence.wind +
        draft.confidence.timing) /
      4,
    modelWeights: deriveModelWeights({ convectiveActive: reed.active, oracle }),
    hazardFlags: deriveHazardFlags({
      tesla: reed.tesla,
      thunderText: draft.risk_summary.thunder,
      windText: draft.risk_summary.wind,
      rainText: draft.risk_summary.rain,
    }),
    convectiveActive: reed.active,
    referralReason,
    generatedAt: runAt,
  };

  return {
    regionSlug: region.slug,
    regionName: region.name,
    lat: region.lat,
    lon: region.lon,
    runAt,
    trigger,
    model: result.model,
    signal,
    local_feed,
  };
}
