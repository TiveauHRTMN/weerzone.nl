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

interface BuildAgentContextOptions {
  fast?: boolean;
}

function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
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
  options: BuildAgentContextOptions = {},
): Promise<AgentContext | null> {
  const { lat, lon, name } = location;
  const weatherPromise = options.fast
    ? withDeadline(fetchWeatherData(lat, lon, false, false), 1800, null as WeatherData | null)
    : withDeadline(
        fetchWeatherData(lat, lon, false, true),
        3500,
        null as WeatherData | null,
      ).then((weather) => weather ?? withDeadline(
        fetchWeatherData(lat, lon, false, false),
        1800,
        null as WeatherData | null,
      ));
  const teslaPromise = withDeadline(
    loadLatestTeslaRun(nearestTeslaRegion(lat, lon).slug).then((run) => run?.signal ?? null),
    650,
    null as TeslaSignal | null,
  );
  const [weather, mariana, knmiAll, provinceSlug, estofex, tesla] = await Promise.all([
    weatherPromise,
    withDeadline(nearestRegionData(lat, lon), 650, null),
    withDeadline(fetchKNMIWarnings(), 650, [] as KNMIWarning[]),
    withDeadline(nearestProvinceSlug(lat, lon), 650, null),
    withDeadline(fetchEstofexBeneluxSummary(2), 650, null),
    teslaPromise,
  ]);
  if (!weather) return null;

  const knmi = provinceSlug ? warningsForProvince(knmiAll, provinceSlug) : [];
  const provinceLabel = provinceSlug
    ? PROVINCE_SLUG_TO_KNMI[provinceSlug] ?? provinceSlug
    : null;

  // Tesla: dichtstbijzijnde mesoschaal-regio → laatste run → signaal (best-effort).
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
