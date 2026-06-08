/**
 * AgentContext — het gedeelde 48u-wereldmodel dat Piet, Reed en Koos lezen.
 *
 * `buildAgentContext` is de ENIGE plek waar de agent-laag netwerk-I/O doet:
 * weer (harde eis) + best-effort Mariana/Tesla/KNMI/ESTOFEX + day-context.
 * `makeAgentContext` is de pure assembler eronder, zodat agents/orchestrator
 * volledig testbaar zijn met een hand-gebouwde context (geen netwerk).
 */

import type { WeatherData } from "@/lib/types";
import type { KNMIWarning } from "@/lib/knmi-warnings";
import type { TeslaSignal } from "@/lib/mariana/tesla/types";
import type { EstofexBeneluxSummary } from "@/lib/estofex";
import type { MarianaAgentData } from "@/lib/mariana/agent-context";
import type { AgentHeadsUp, WeatherAgent } from "@/lib/agents/types";
import { getDayContext, type DayContext } from "@/lib/agents/day-context";

import { fetchWeatherData } from "@/lib/weather";
import {
  fetchKNMIWarnings,
  warningsForProvince,
  nearestProvinceSlug,
  PROVINCE_SLUG_TO_KNMI,
} from "@/lib/knmi-warnings";
import { fetchEstofexBeneluxSummary } from "@/lib/estofex";
import { nearestRegionData } from "@/lib/mariana/regions/storage";
import { isFreshMarianaAgentData } from "@/lib/mariana/agent-context";
import { nearestTeslaRegion } from "@/lib/mariana/tesla/regions";
import { loadLatestTeslaRun } from "@/lib/mariana/tesla/storage";

export interface AgentLocation {
  name: string;
  lat: number;
  lon: number;
  provinceLabel: string | null;
}

export interface AgentContext {
  location: AgentLocation;
  now: Date;
  weather: WeatherData;
  day: DayContext;
  mariana: MarianaAgentData | null;
  tesla: TeslaSignal | null;
  knmi: KNMIWarning[];
  estofex: EstofexBeneluxSummary | null;
}

/** Wat één agent teruggeeft: zijn heads-ups (mag leeg zijn = rust) + optionele stem. */
export interface AgentReport {
  agent: WeatherAgent;
  headsUps: AgentHeadsUp[];
  /** LLM-stem voor de eigen pagina; null = UI valt terug op sjabloon. */
  voice?: string | null;
}

/** Pure assembler — geen I/O. Gebruikt door buildAgentContext en de tests. */
export function makeAgentContext(parts: {
  location: AgentLocation;
  now: Date;
  weather: WeatherData;
  mariana: MarianaAgentData | null;
  tesla: TeslaSignal | null;
  knmi: KNMIWarning[];
  estofex: EstofexBeneluxSummary | null;
}): AgentContext {
  return {
    location: parts.location,
    now: parts.now,
    weather: parts.weather,
    day: getDayContext(parts.now),
    mariana: parts.mariana,
    tesla: parts.tesla,
    knmi: parts.knmi,
    estofex: parts.estofex,
  };
}

/**
 * Bouw het wereldmodel voor een locatie. Weer is de enige harde eis; faalt dat,
 * dan null. Alle andere bronnen falen zacht (null/[]). Eén Promise.all.
 */
export async function buildAgentContext(
  location: { name: string; lat: number; lon: number },
  now: Date = new Date(),
): Promise<AgentContext | null> {
  const { lat, lon, name } = location;
  const [weather, mariana, knmiAll, provinceSlug, estofex] = await Promise.all([
    fetchWeatherData(lat, lon, false, true).catch(() => null),
    nearestRegionData(lat, lon).catch(() => null),
    fetchKNMIWarnings().catch(() => [] as KNMIWarning[]),
    nearestProvinceSlug(lat, lon).catch(() => null),
    fetchEstofexBeneluxSummary(2).catch(() => null),
  ]);
  if (!weather) return null;

  const knmi = provinceSlug ? warningsForProvince(knmiAll, provinceSlug) : [];
  const provinceLabel = provinceSlug
    ? PROVINCE_SLUG_TO_KNMI[provinceSlug] ?? provinceSlug
    : null;

  // Tesla: dichtstbijzijnde mesoschaal-regio → laatste run → signaal (best-effort).
  let tesla: TeslaSignal | null = null;
  try {
    const region = nearestTeslaRegion(lat, lon);
    const run = await loadLatestTeslaRun(region.slug);
    tesla = run?.signal ?? null;
  } catch {
    tesla = null;
  }

  return makeAgentContext({
    location: { name, lat, lon, provinceLabel },
    now,
    weather,
    mariana: isFreshMarianaAgentData(mariana) ? mariana : null,
    tesla,
    knmi,
    estofex,
  });
}
