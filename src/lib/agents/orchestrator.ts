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
import {
  ALL_AGENT_PREFERENCES,
  hasActiveAgents,
  isAgentEnabled,
  type AgentPreferences,
} from "@/lib/agents/preferences";

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
  preferences: AgentPreferences;
  sources: {
    mariana: boolean;
    tesla: boolean;
    knmi: boolean;
    estofex: boolean;
  };
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
  preferences: AgentPreferences = ALL_AGENT_PREFERENCES,
): { headsUps: AgentHeadsUp[]; leadAgent: WeatherAgent } {
  const reedDanger = isAgentEnabled(preferences, "reed") && input.reed.some(
    (x) => x.severity === "important" || x.severity === "urgent",
  );

  const reed = isAgentEnabled(preferences, "reed") ? input.reed : [];
  let piet = isAgentEnabled(preferences, "piet") ? input.piet : [];
  let koos = isAgentEnabled(preferences, "koos") ? input.koos : [];
  if (reedDanger) {
    piet = piet.filter((x) => !OUTDOOR_INVITE.has(x.category));
    koos = koos.filter((x) => x.category !== "going_out");
  }

  const merged = filterActiveHeadsUps([...reed, ...piet, ...koos], now);
  const headsUps = rankHeadsUps(merged);
  const leadAgent: WeatherAgent = reedDanger
    ? "reed"
    : isAgentEnabled(preferences, "piet")
      ? "piet"
      : isAgentEnabled(preferences, "koos")
        ? "koos"
        : "reed";
  return { headsUps, leadAgent };
}

/** Draai het hele systeem voor een context. */
export async function orchestrateAgents(
  ctx: AgentContext,
  preferences: AgentPreferences = ALL_AGENT_PREFERENCES,
  options: { includeVoices?: boolean; koosTimeoutMs?: number; koosLocalOnly?: boolean } = {},
): Promise<AgentSystemResult> {
  const emptyReport = (agent: WeatherAgent): AgentReport => ({ agent, headsUps: [], voice: null });
  const [piet, reed, koos] = await Promise.all([
    isAgentEnabled(preferences, "piet") ? pietAgent(ctx, { includeVoice: options.includeVoices }) : Promise.resolve(emptyReport("piet")),
    isAgentEnabled(preferences, "reed") ? reedAgent(ctx, { includeVoice: options.includeVoices }) : Promise.resolve(emptyReport("reed")),
    isAgentEnabled(preferences, "koos") ? koosAgent(ctx, { includeVoice: options.includeVoices, timeoutMs: options.koosTimeoutMs, localOnly: options.koosLocalOnly }) : Promise.resolve(emptyReport("koos")),
  ]);

  const { headsUps, leadAgent } = coordinate(
    { piet: piet.headsUps, reed: reed.headsUps, koos: koos.headsUps },
    ctx.now,
    preferences,
  );

  return {
    headsUps,
    byAgent: groupByAgent(headsUps),
    leadAgent,
    emptyState: hasActiveAgents(preferences)
      ? emptyHeadsUpResult().emptyStateMessage
      : "Je hebt alle weeragents uitgezet.",
    reports: { piet, reed, koos, steve: { agent: "steve", headsUps: [], voice: null } },
    preferences,
    sources: {
      mariana: ctx.mariana !== null,
      tesla: ctx.tesla !== null,
      knmi: ctx.knmi.length > 0,
      estofex: ctx.estofex !== null,
    },
  };
}
