/**
 * Heads-up skelet voor de agent-laag.
 *
 * Echte productie van heads-ups (Piet/Reed/Koos prompts + weerdata-integratie)
 * komt in fase 6. Voor nu staat hier:
 *
 *  - emptyHeadsUpResult() — canonieke "geen heads-ups" output met de
 *    juiste lege-staat copy uit de productdefinitie.
 *  - rankHeadsUps() — stabiele ranking-helper zodat de UI nu al kan
 *    ontwikkelen tegen een vaste volgorde.
 *  - groupByAgent() — convenience voor UI die per-agent rendert.
 *
 * Ontwerpregel uit de brief (sectie 4):
 *   "Geen heads-up zonder concrete actie. Als de gebruiker niets hoeft te
 *    doen, toon rust."
 *
 * Lege-staat copy is óók in NL en moet onveranderd door de UI getoond worden.
 */

import type {
  AgentHeadsUp,
  AgentHeadsUpSeverity,
  WeatherAgent,
} from "./types";

const SEVERITY_RANK: Record<AgentHeadsUpSeverity, number> = {
  urgent: 0,
  important: 1,
  useful: 2,
  info: 3,
};

const AGENT_RANK: Record<WeatherAgent, number> = {
  reed: 0,   // veiligheidssignalen eerst
  piet: 1,
  koos: 2,
  steve: 3,
};

export interface HeadsUpResult {
  headsUps: AgentHeadsUp[];
  /** Copy voor de lege staat. Altijd ingevuld; UI gebruikt het wanneer
   *  `headsUps.length === 0`. */
  emptyStateMessage: string;
}

/**
 * Lege-staat resultaat met de canonieke NL copy.
 *
 * Niet aanpassen zonder overleg — staat letterlijk in de productdefinitie
 * (sectie 4: "Goede empty-state").
 */
export function emptyHeadsUpResult(): HeadsUpResult {
  return {
    headsUps: [],
    emptyStateMessage: "Geen heads-ups. Je weerbeeld is stabiel.",
  };
}

/**
 * Sorteer heads-ups op urgentie en agent-prioriteit.
 *
 * Volgorde: severity (urgent → info), dan agent (Reed → Piet → Koos → Steve),
 * dan validFrom oplopend. Stabiele sort zodat input-volgorde de tiebreaker is.
 */
export function rankHeadsUps(headsUps: readonly AgentHeadsUp[]): AgentHeadsUp[] {
  return headsUps
    .map((h, idx) => ({ h, idx }))
    .sort((a, b) => {
      const bySev = SEVERITY_RANK[a.h.severity] - SEVERITY_RANK[b.h.severity];
      if (bySev !== 0) return bySev;
      const byAgent = AGENT_RANK[a.h.agent] - AGENT_RANK[b.h.agent];
      if (byAgent !== 0) return byAgent;
      const aFrom = a.h.validFrom ?? "";
      const bFrom = b.h.validFrom ?? "";
      if (aFrom !== bFrom) return aFrom.localeCompare(bFrom);
      return a.idx - b.idx;
    })
    .map(({ h }) => h);
}

/**
 * Groepeer heads-ups per agent met behoud van ranking-volgorde binnen elke
 * groep. Lege agents worden weggelaten — de UI maakt zelf de placeholder.
 */
export function groupByAgent(
  headsUps: readonly AgentHeadsUp[],
): Record<WeatherAgent, AgentHeadsUp[]> {
  const ranked = rankHeadsUps(headsUps);
  const out: Record<WeatherAgent, AgentHeadsUp[]> = {
    piet: [],
    reed: [],
    koos: [],
    steve: [],
  };
  for (const h of ranked) {
    out[h.agent].push(h);
  }
  return out;
}

/**
 * Filter heads-ups die niet meer relevant zijn voor het meegegeven moment.
 *  - `validUntil` in het verleden → drop.
 *  - `validFrom` in de verre toekomst (>48u) → drop; agents kijken
 *    bewust niet verder dan 48 uur (zie productdefinitie).
 */
export function filterActiveHeadsUps(
  headsUps: readonly AgentHeadsUp[],
  now: Date = new Date(),
): AgentHeadsUp[] {
  const nowIso = now.toISOString();
  const horizonIso = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  return headsUps.filter((h) => {
    if (h.validUntil && h.validUntil < nowIso) return false;
    if (h.validFrom && h.validFrom > horizonIso) return false;
    return true;
  });
}
