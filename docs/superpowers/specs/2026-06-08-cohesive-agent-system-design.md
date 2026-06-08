# Design — Cohesive agentic system (Piet · Reed · Koos)

**Date:** 2026-06-08
**Branch:** weerzone-agents-fase1
**Status:** Approved design — pending implementation plan
**Scope:** Turn the three agents into one coherent, intelligent agentic system —
a shared 48h world-model, three specialist agents each owning a job, and an
orchestrator that merges, ranks and coordinates their output. Make each agent
page actually consume the intelligence already built in `src/lib/`.

## Goal

Piet, Reed and Koos should behave as **one system**, not three isolated pages:

- A **shared understanding** of the next 48 hours at a location (one world-model
  all three read), so the agents never contradict each other.
- **Clear ownership** — each agent has its own job and only speaks within it.
- **Coordination** — when danger is present, Reed leads and Piet defers; when home
  is grey and somewhere is better, Koos chimes in. The system produces one ranked,
  de-duplicated set of heads-ups.
- **Intelligence is shown** — the LLM voices and the official/severe data sources
  that already exist in `lib/` are wired into the surfaces (today they are not).

## Context / why

The agent layer was scaffolded but its core was deferred:

- `src/lib/agents/types.ts` defines `AgentHeadsUp`, `WeatherAgent`,
  `WeatherOpportunity` — the contract.
- `src/lib/agents/heads-up.ts` provides `rankHeadsUps`, `groupByAgent`,
  `filterActiveHeadsUps`, `emptyHeadsUpResult` — the glue. Its header says the real
  **production** of heads-ups "komt in fase 6". That production is what's missing.
- `src/lib/agents/day-context.ts` provides `getDayContext()` (weekend / feestdag /
  schoolvakantie / seizoen) — built, but no agent reads it.

Meanwhile each agent already has rich intelligence in `lib/` that the pages don't
fully consume:

| Agent | Built intelligence | What the page uses today | Gap |
|---|---|---|---|
| Piet | `fetchPietWeerbericht` (LLM: KNMI bulletin + Mariana cascade) | only `buildPietView` template strings | LLM voice not shown; no day-context |
| Reed | KNMI warnings, ESTOFEX, Mariana **Tesla** signal | `/reed` passes `knmi: []`, no estofex; `reed-view` hardcodes `tesla: null` | blind to every official/severe source; template-only voice |
| Koos | LLM `koosVoice` + Mariana wired | consumed ✅ | no day-context; single-day only |

So this is **not a rewrite**. It is: implement the deferred heads-up production
layer, wire the existing engines as its data sources, and connect the surfaces.

## Architecture

```
buildAgentContext(location, now)            ← the shared 48h world-model
   weather        (fetchWeatherData — Open-Meteo + Mariana/Oracle arbitrage)
   mariana        (nearestRegionData → MarianaSignal + local feed, staleness-checked)
   tesla          (loadLatestTeslaRun for nearest Tesla region → TeslaSignal | null)
   knmi           (fetchKNMIWarnings → warningsForProvince)
   estofex        (fetchEstofexBeneluxSummary)
   day            (getDayContext — weekend / feestdag / schoolvakantie / seizoen)
        │
        ├── pietAgent(context)   → { headsUps[], voice? }   job: the everyday picture
        ├── reedAgent(context)   → { headsUps[], voice? }   job: severe weather
        └── koosAgent(context)   → { headsUps[], voice? }   job: "eropuit"
        │
   orchestrateAgents(context) → merge · filterActive · dedup · rank · coordinate
        │
   AgentSystemResult { headsUps: AgentHeadsUp[], byAgent, leadAgent, emptyState }
        │
   consumed by each agent page  +  (optionally) a unified home feed
```

### 1. Shared world-model — `src/lib/agents/context.ts` (new)

```ts
export interface AgentContext {
  location: { name: string; lat: number; lon: number; provinceLabel: string | null };
  now: Date;
  weather: WeatherData;                 // 48h, already Mariana-arbitrated
  day: DayContext;                      // getDayContext(now, schoolRegion?)
  mariana: MarianaAgentData | null;     // signal + local feed, fresh-checked
  tesla: TeslaSignal | null;            // nearest Tesla region, latest run
  knmi: KNMIWarning[];                  // province warnings (already filtered)
  estofex: EstofexBeneluxSummary | null;
}

export async function buildAgentContext(
  location: { name: string; lat: number; lon: number },
  now?: Date,
): Promise<AgentContext | null>;        // null only when weather itself fails
```

All upstream fetches are `Promise.all` + soft-fail (`.catch(() => null/[])`); only a
missing `weather` returns `null` (the one hard dependency). This is the single place
network I/O for the agents happens — the agents themselves are pure over `AgentContext`.

### 2. Per-agent contract — `src/lib/agents/{piet,reed,koos}-agent.ts` (new)

Each agent is a **pure function** `AgentContext → AgentReport`:

```ts
export interface AgentReport {
  agent: WeatherAgent;
  headsUps: AgentHeadsUp[];   // may be empty — empty is valid (rust)
  /** Optional LLM voice for the agent's own page; null = use template fallback. */
  voice?: string | null;
}
```

The heads-up *production* (thresholds → `AgentHeadsUp` with a concrete `action`)
lives here, reusing the existing analysis engines so logic is not duplicated:

- **`pietAgent`** — job: the everyday picture + daily planning. Reads `buildPietView`
  numbers + `day`. Emits `daily_advice` and a `best_moment` (best dry/sun window
  today) heads-up. Day-context tunes tone/relevance ("eerste mooie zaterdag",
  "Hemelvaart"). **Never** emits danger heads-ups — that's Reed's job; instead it
  sets a `referToReed` signal the orchestrator uses for handoff.
- **`reedAgent`** — job: severe weather. Reads `buildReedView` (now fed the real
  `knmi` + `estofex` + `tesla` from context). Emits `thunderstorm_risk` /
  `wind_risk` / `rain_risk` heads-ups with severity mapped from
  KNMI/ESTOFEX/Tesla/CAPE. Calm context → empty (no heads-up).
- **`koosAgent`** — job: "eropuit". Reads `findGetawayPicks(origin)` + `day`. Emits
  `better_place` / `going_out` heads-ups only when home is bad **and** a reachable
  place is meaningfully better. Day-context weights it: a strong opportunity that
  lands on the upcoming weekend / free day outranks a mid-week one.

The pure `reedSevereForWeather` / `koosHomeIsBad` style helpers stay extractable for
later proactive-email reuse (cross-ref the subscription spec), but are not required
to live in the email layer.

### 3. Orchestrator — `src/lib/agents/orchestrator.ts` (new)

```ts
export interface AgentSystemResult {
  headsUps: AgentHeadsUp[];                       // ranked, active-only, de-duped
  byAgent: Record<WeatherAgent, AgentHeadsUp[]>;
  leadAgent: WeatherAgent;                        // who the surface should lead with
  emptyState: string;                             // canonical rust copy
  reports: Record<WeatherAgent, AgentReport>;     // for each agent's own page
}

export async function orchestrateAgents(ctx: AgentContext): Promise<AgentSystemResult>;
```

Pipeline: run the three agents over the same `ctx` → collect heads-ups →
`filterActiveHeadsUps(now)` → **coordinate** → `rankHeadsUps` → `groupByAgent`.

**Coordination rules (the cohesion):**
1. **Danger handoff** — if Reed has an `important`/`urgent` heads-up, suppress Piet
   "lekker buiten"-style `best_moment`/`daily_advice` advice that would contradict it,
   and set `leadAgent = "reed"`. Piet's narrative keeps its `referToReed` pointer.
2. **No double-counting** — Piet never emits rain/wind/thunder heads-ups; if Reed is
   calm, Piet's plain daily picture stands alone.
3. **Koos yields to Reed** — if Reed is in `warning`, Koos does not nudge "go out
   locally"; a "het is elders rustig én beter" tip is still allowed.
4. **Lead order** when no danger: Piet (baseline) unless Koos has a strong
   weekend-weighted opportunity, then the surface may feature Koos secondarily.
   `rankHeadsUps` already encodes severity→agent ordering; coordination only adjusts
   `leadAgent` and prunes contradictions.

### 4. Voice layer (intelligence shown)

Each agent's own page keeps its LLM voice, all fed from the same `AgentContext` so
writing stays consistent and soft-fails to template:

- **Piet** — wire `fetchPietWeerbericht(lat, lon, city, weather)` into `/piet` as the
  lead narrative; `piet-view`'s template `story`/`headline` become the fallback.
- **Reed** — new `reedVoice(view, ctx)` (`src/lib/reed-voice.ts`): calm-but-sharp
  summary of the active danger, fed by the wired `ReedView`. Template
  (`convectiveSummary`/`knmiWarningSummary`) is the fallback. Same `hermesChat`
  persona + soft-fail pattern as `koosVoice`.
- **Koos** — unchanged (`koosVoice` already wired), now also receives `day` context
  in its prompt so timing language matches ("dit weekend").

### 5. Surfaces

- **Each agent page** (`/piet`, `/reed`, `/koos`) builds `AgentContext` once and
  renders its own `AgentReport` (heads-ups + voice) on top of its existing view. The
  pages stay SSR with the existing graceful fallbacks; no user-facing crash path.
- **Reed page** specifically: stop passing `knmi: []` / no-estofex; pass the real
  context so `buildReedView` reflects official danger and `tesla` is no longer null.
- **Unified feed (optional, confirmed in planning):** the homepage `/` (or a
  `mijnweer`-style surface) can render `orchestrateAgents().headsUps` as one ranked
  list led by `leadAgent`. Decision deferred to planning after reading `/`; the
  orchestrator already returns everything both a combined feed and per-page need, so
  this is a consumer choice, not new core work.

## Affected files

| File | Change |
|---|---|
| `src/lib/agents/context.ts` | **New** — `AgentContext` + `buildAgentContext` (the only I/O) |
| `src/lib/agents/piet-agent.ts` | **New** — `pietAgent(ctx) → AgentReport` (daily picture + best moment) |
| `src/lib/agents/reed-agent.ts` | **New** — `reedAgent(ctx) → AgentReport` (severe) |
| `src/lib/agents/koos-agent.ts` | **New** — `koosAgent(ctx) → AgentReport` (eropuit, day-weighted) |
| `src/lib/agents/orchestrator.ts` | **New** — `orchestrateAgents(ctx)` merge/rank/coordinate |
| `src/lib/reed-view.ts` | Accept + pass through `tesla`; small estofex adapter input (stop returning `tesla: null`) |
| `src/lib/reed-voice.ts` | **New** — `reedVoice()` LLM layer, template fallback |
| `src/lib/koos-voice.ts` | Accept `day` context in prompt (timing language) |
| `src/app/(site)/piet/page.tsx` | Build context; show `fetchPietWeerbericht` voice + Piet heads-ups |
| `src/app/(site)/reed/page.tsx` | Build context; wire real KNMI + ESTOFEX + Tesla; Reed voice + heads-ups |
| `src/app/(site)/koos/page.tsx` | Build context; pass `day` to koosVoice; Koos heads-ups |
| `scripts/check-agents-orchestrator.ts` | **New** — smoke for context→agents→orchestrate over seeded weather |

No new dependencies. No DB migration (read-only over existing tables/APIs).

## Build order

1. `buildAgentContext` (+ Tesla region resolution, estofex→ReedView adapter, wire
   `reed-view` to accept `tesla`). Smoke: context builds from a seeded location.
2. **Reed** — `reedAgent` + `reedVoice`; wire `/reed` to real context. (Biggest gap.)
3. **Piet** — `pietAgent`; wire `fetchPietWeerbericht` into `/piet`; day-context tone.
4. **Koos** — `koosAgent`; day-context into `koosVoice`.
5. `orchestrateAgents` + coordination rules; per-page consumption.
6. Unified feed surface (after reading `/`) — optional within this build.

## Out of scope

- Proactive email/push delivery — covered by the separate
  `2026-06-07-agent-subscription-foundation-design.md` spec. The pure agent helpers
  here are reusable by that pipeline, but this spec is on-site/SSR only.
- Personalization beyond `getDayContext` (saved-place memory, habit learning) — a
  later layer; `AgentContext` is the seam it will plug into.
- Steve (business agent) — remains later.
- New weather sources (radar/nowcast/lightning ingestion) — uses existing data only.

## Success criteria

- `buildAgentContext` returns a populated world-model (weather + day + best-effort
  mariana/tesla/knmi/estofex) and `null` only when weather fails.
- `/reed` reflects a real KNMI code geel/oranje/rood when one is active for the
  province, shows ESTOFEX when present, and uses the Tesla signal (no more
  `tesla: null`); Reed's voice reads in his calm-sharp tone with template fallback.
- `/piet` leads with the LLM narrative (KNMI+Mariana) and falls back to the template
  story cleanly; advice reflects day-context (weekend/feestdag).
- `/koos` timing language reflects the upcoming weekend/free day.
- `orchestrateAgents` returns one ranked, de-duplicated, active-only heads-up set;
  when Reed is in danger, `leadAgent === "reed"` and contradicting Piet advice is
  pruned; calm everywhere → `emptyState` (canonical rust copy), zero heads-ups.
- `npx tsc --noEmit` clean on touched files; `scripts/check-agents-orchestrator.ts`
  exercises context→agents→orchestrate (incl. a danger case and a calm case) and the
  pure ranking/coordination, all without network.

## Testing

No jest in repo (per CLAUDE.md). Verify via:
- `npx tsc --noEmit` on touched files.
- `scripts/check-agents-orchestrator.ts` — feed seeded `WeatherData` (a calm day and a
  CAPE/thunder day) through `buildAgentContext`-shaped fixtures → agents →
  `orchestrateAgents`; assert: calm ⇒ empty + Piet lead; danger ⇒ Reed heads-up,
  `leadAgent === "reed"`, Piet "buiten"-advice pruned; Koos gated by home-bad +
  weekend weighting.
- Existing `scripts/check-{piet,reed,koos}-view.ts` stay green.
- Manual: `npm run dev`, open `/reed` during/with-mocked active warning, `/piet`,
  `/koos`; confirm voices render and fall back gracefully when `hermesChat` is down.
