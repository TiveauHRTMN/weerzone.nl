/**
 * Orchestrator: draait Piet/Reed/Koos over hetzelfde wereldmodel, coördineert
 * tegenstrijdigheden (gevaar-handoff), rangschikt en rapporteert per agent.
 *
 * `coordinate` is puur en testbaar; `orchestrateAgents` doet de async agent-calls.
 */

import type { AgentContext, AgentReport } from "@/lib/agents/context";
import type { AgentHeadsUp, WeatherAgent } from "@/lib/agents/types";
import {
  rankHeadsUps,
  groupByAgent,
  filterActiveHeadsUps,
  emptyHeadsUpResult,
} from "@/lib/agents/heads-up";
import { pietAgent } from "@/lib/agents/piet-agent";
import { reedAgent } from "@/lib/agents/reed-agent";
import { koosAgent } from "@/lib/agents/koos-agent";

export interface CoordinationInput {
  piet: AgentHeadsUp[];
  reed: AgentHeadsUp[];
  koos: AgentHeadsUp[];
}

export interface AgentSystemResult {
  headsUps: AgentHeadsUp[];
  byAgent: Record<WeatherAgent, AgentHeadsUp[]>;
  leadAgent: WeatherAgent;
  emptyState: string;
  reports: Record<WeatherAgent, AgentReport>;
}

/** Categorieën die "ga lekker naar buiten" impliceren en bij gevaar wegvallen. */
const OUTDOOR_INVITE: ReadonlySet<string> = new Set(["best_moment", "going_out"]);

/**
 * Puur: combineer + filter-active + handoff + rank. Reed in gevaar
 * (important/urgent) → leidt, en Piets "ga-naar-buiten"-heads-ups vervallen;
 * Koos' lokale "going_out" vervalt ook (een "elders is het beter" mag blijven).
 */
export function coordinate(
  input: CoordinationInput,
  now: Date,
): { headsUps: AgentHeadsUp[]; leadAgent: WeatherAgent } {
  const reedDanger = input.reed.some(
    (x) => x.severity === "important" || x.severity === "urgent",
  );

  let piet = input.piet;
  let koos = input.koos;
  if (reedDanger) {
    piet = piet.filter((x) => !OUTDOOR_INVITE.has(x.category));
    koos = koos.filter((x) => x.category !== "going_out");
  }

  const merged = filterActiveHeadsUps([...input.reed, ...piet, ...koos], now);
  const headsUps = rankHeadsUps(merged);
  const leadAgent: WeatherAgent = reedDanger ? "reed" : "piet";
  return { headsUps, leadAgent };
}

/** Draai het hele systeem voor een context. */
export async function orchestrateAgents(ctx: AgentContext): Promise<AgentSystemResult> {
  const [piet, reed, koos] = await Promise.all([
    pietAgent(ctx),
    reedAgent(ctx),
    koosAgent(ctx),
  ]);

  const { headsUps, leadAgent } = coordinate(
    { piet: piet.headsUps, reed: reed.headsUps, koos: koos.headsUps },
    ctx.now,
  );

  return {
    headsUps,
    byAgent: groupByAgent(headsUps),
    leadAgent,
    emptyState: emptyHeadsUpResult().emptyStateMessage,
    reports: { piet, reed, koos, steve: { agent: "steve", headsUps: [], voice: null } },
  };
}
