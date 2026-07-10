# Agent heads-up-push motor (plan 1 van 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De bezorg-motor uit `docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md`: agents die je opzoeken via pushnotificaties, gefilterd op persoonlijke momenten — plus Reed-all-clear en een test-push-route. (Plan 2 doet de UI: onboarding-vragen, PWA-install, Jouw agents-blok, regiekamer.)

**Architecture:** Nieuwe 30-min-cron `agent-headsup-push` draait per geabonneerde plaats de pure agents over `buildAgentContext`, matcht kandidaten tegen `agent_moments`, past budget/venster/dedup toe via `agent_headsup_log`, en pusht via de bestaande web-push-keten (`src/lib/push.ts`). Reeds alert-cron blijft het eigen veiligheidspad en krijgt alleen de all-clear erbij.

**Tech Stack:** Next.js 16 App Router, Supabase service role, bestaande agents-lib (`src/lib/agents/*`), web-push (`src/lib/push.ts`), Vercel crons.

## Global Constraints

- **Nul LLM per abonnee/push** — pure wiskunde; `includeVoices: false` overal in de cron.
- **Spelregels (spec §3A/B)**: Piet max **3/dag**, bezorgvenster **07:00-22:00 NL**; Koos max **1/dag**, alleen **do/vr/za**; severity `useful` of hoger; dedup via `agent_headsup_log`; push-`tag` = `"<agent>:<province>/<slug>"` zodat opeenvolgende pushes elkaar vervangen.
- **Reed-gevaar-handoff**: actieve KNMI-waarschuwing `important`/`urgent` voor de provincie → Piet en Koos pushen níéts voor die plaats (Reed leidt via zijn eigen cron).
- **Copy**: net NL, Piets/Koos' karakter, geen meteo-jargon, geen bronnamen (KNMI/Mariana), decimale komma, elke push bevat een concrete actie.
- **RLS**: `agent_headsup_log` service-role-only; `agent_moments` owner-only + service-role-leespad (patroon `agent_subscriptions`).
- **Fail-soft**: alle DB-helpers geven lege defaults zolang de migratie niet live is.
- **Cron-auth**: Bearer `CRON_SECRET` óf `x-vercel-cron: 1` (patroon `reed-alert-email/route.ts:269-279`).
- Crons registreren in `vercel.json` (anders vuren ze niet). Geen testrunner introduceren; verificatie = `npx tsc --noEmit`, tsx-smoketests, handmatige triggers.
- Migraties via de Supabase SQL editor (Rowan), daarna service-role + anon REST-verificatie.
- Commits op `feat/studio-tiktok-autopost` met de Claude-trailer.

## File Structure

| Bestand | Verantwoordelijkheid |
|---|---|
| `supabase/migrations/20260711_agent_headsup_push.sql` (nieuw) | `agent_headsup_log` + `agent_moments` |
| `src/lib/agents/moments.ts` (nieuw) | Moment-types, venster-wiskunde, storage |
| `src/lib/agents/headsup-push.ts` (nieuw) | Pure kandidaat-logica: omslagen, moment-copy, budget-selectie |
| `src/lib/agents/types.ts` (wijzigen) | `AgentHeadsUpCategory` + `"weather_shift" \| "dry_window"` |
| `src/lib/agents/headsup-log.ts` (nieuw) | Push-state laden (dedup + dagtelling), verzendingen loggen |
| `src/app/(site)/api/cron/agent-headsup-push/route.ts` (nieuw) | De motor |
| `vercel.json` (wijzigen) | Cron-registratie |
| `src/app/(site)/api/cron/reed-alert-email/route.ts` (wijzigen) | All-clear-push |
| `src/app/(site)/api/agents/test-push/route.ts` (nieuw) | Testnotificatie naar eigen apparaten |

---

### Task 1: Migratie `agent_headsup_log` + `agent_moments`

**Files:**
- Create: `supabase/migrations/20260711_agent_headsup_push.sql`

**Interfaces:**
- Produces: tabellen `public.agent_headsup_log` (uniek op `user_id, headsup_key`) en `public.agent_moments` (owner-only RLS). Kolommen exact zoals hieronder; latere tasks gebruiken deze namen letterlijk.

- [ ] **Step 1: Schrijf de migratie**

```sql
-- Agents die je opzoeken (spec 2026-07-10, plan 1): dedup/budget-log voor
-- heads-up-pushes + de persoonlijke momenten waarop gefilterd wordt.
-- Draai dit in de Supabase SQL editor (production). Idempotent.

-- 1. Dedup + dagbudget voor heads-up-pushes (patroon: reed_warning_alerts).
create table if not exists public.agent_headsup_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent text not null check (agent in ('piet', 'reed', 'koos')),
  province text not null,
  place_slug text not null,
  headsup_key text not null,
  category text not null,
  severity text not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists agent_headsup_log_user_key_idx
  on public.agent_headsup_log (user_id, headsup_key);

-- Leespad cron: recente rijen per gebruiker (dedup 48u + dagtelling).
create index if not exists agent_headsup_log_user_sent_idx
  on public.agent_headsup_log (user_id, sent_at desc);

-- Service-role-only: geen policies = geen client-toegang.
alter table public.agent_headsup_log enable row level security;
revoke all on table public.agent_headsup_log from anon;
revoke all on table public.agent_headsup_log from authenticated;

-- 2. Persoonlijke momenten ("je eigen meteo-team kent je ritme").
--    Onboarding-antwoorden worden direct als rijen opgeslagen (plan 2);
--    de regiekamer bewerkt deze rijen. days: 1=ma .. 7=zo (ISO).
create table if not exists public.agent_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('commute', 'dog', 'outdoor', 'laundry', 'sport', 'custom')),
  label text not null,
  days int[] not null default '{1,2,3,4,5}',
  window_start time not null,
  window_end time not null,
  transport text check (transport in ('bike', 'ov', 'car', 'none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_moments_user_idx
  on public.agent_moments (user_id);

-- Owner-only (patroon agent_subscriptions); cron leest via service role.
alter table public.agent_moments enable row level security;
revoke all on table public.agent_moments from anon;

drop policy if exists "agent_moments_select_own" on public.agent_moments;
create policy "agent_moments_select_own"
  on public.agent_moments for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "agent_moments_insert_own" on public.agent_moments;
create policy "agent_moments_insert_own"
  on public.agent_moments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "agent_moments_update_own" on public.agent_moments;
create policy "agent_moments_update_own"
  on public.agent_moments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "agent_moments_delete_own" on public.agent_moments;
create policy "agent_moments_delete_own"
  on public.agent_moments for delete
  to authenticated
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260711_agent_headsup_push.sql
git commit -m "feat(agents): schema voor heads-up-push — dedup-log + persoonlijke momenten"
```

---

### Task 2: Momenten-lib `src/lib/agents/moments.ts`

**Files:**
- Create: `src/lib/agents/moments.ts`

**Interfaces:**
- Produces (Task 3 en 5 gebruiken dit):
  - `interface AgentMoment { id: string; kind: MomentKind; label: string; days: number[]; windowStart: string; windowEnd: string; transport: MomentTransport | null }`
  - `type MomentKind = "commute" | "dog" | "outdoor" | "laundry" | "sport" | "custom"`
  - `type MomentTransport = "bike" | "ov" | "car" | "none"`
  - `interface MomentWindow { moment: AgentMoment; start: Date; end: Date }`
  - `momentWindowsForDay(moments: AgentMoment[], day: Date): MomentWindow[]` — vensters op die NL-dag (dagfilter via ISO-weekdag).
  - `loadMomentsForUsers(admin: SupabaseClient, userIds: string[]): Promise<Map<string, AgentMoment[]>>` — fail-soft `new Map()`.

- [ ] **Step 1: Schrijf de lib**

```ts
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Persoonlijke momenten (spec 2026-07-10 §3C): het ritme van de gebruiker —
 * woon-werk, hond, was, sport — waarop de heads-up-pushes gefilterd worden.
 * Schema: supabase/migrations/20260711_agent_headsup_push.sql. Onboarding
 * (plan 2) schrijft deze rijen; de cron leest ze via de service role.
 */

export const AGENT_MOMENTS_TABLE = "agent_moments";

export type MomentKind = "commute" | "dog" | "outdoor" | "laundry" | "sport" | "custom";
export type MomentTransport = "bike" | "ov" | "car" | "none";

export interface AgentMoment {
  id: string;
  kind: MomentKind;
  label: string;
  /** ISO-weekdagen, 1=ma .. 7=zo. */
  days: number[];
  /** "HH:MM" of "HH:MM:SS" (Postgres time). */
  windowStart: string;
  windowEnd: string;
  transport: MomentTransport | null;
}

export interface MomentWindow {
  moment: AgentMoment;
  start: Date;
  end: Date;
}

/** ISO-weekdag (1=ma..7=zo) van een datum in NL-tijd. */
function nlIsoWeekday(day: Date): number {
  const short = day.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[short] ?? 1;
}

/** Date voor "HH:MM(:SS)" op de NL-kalenderdag van `day`. */
function nlTimeOnDay(day: Date, hhmm: string): Date {
  const dateISO = day.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  // Offset van NL t.o.v. UTC op die dag bepalen via een ronde-tijd-truc:
  // middernacht NL in UTC vinden door de geformatteerde NL-tijd te vergelijken.
  const probe = new Date(`${dateISO}T12:00:00Z`);
  const nlHourAtProbe = parseInt(
    probe.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  const offsetHours = nlHourAtProbe - 12; // 1 (CET) of 2 (CEST)
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + ((h - offsetHours) * 60 + (m || 0)) * 60_000);
}

/** Vensters van deze momenten op de NL-dag van `day` (leeg = geen momenten die dag). */
export function momentWindowsForDay(moments: AgentMoment[], day: Date): MomentWindow[] {
  const weekday = nlIsoWeekday(day);
  return moments
    .filter((moment) => moment.days.includes(weekday))
    .map((moment) => ({
      moment,
      start: nlTimeOnDay(day, moment.windowStart),
      end: nlTimeOnDay(day, moment.windowEnd),
    }))
    .filter((w) => w.end > w.start);
}

/** Momenten per gebruiker, één query. Fail-soft: lege map. */
export async function loadMomentsForUsers(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, AgentMoment[]>> {
  const out = new Map<string, AgentMoment[]>();
  if (!userIds.length) return out;
  const { data, error } = await admin
    .from(AGENT_MOMENTS_TABLE)
    .select("id, user_id, kind, label, days, window_start, window_end, transport")
    .in("user_id", userIds);
  if (error) {
    console.error("[moments] agent_moments niet leesbaar:", error.message);
    return out;
  }
  for (const raw of (data ?? []) as {
    id: string; user_id: string; kind: MomentKind; label: string;
    days: number[]; window_start: string; window_end: string; transport: MomentTransport | null;
  }[]) {
    if (!out.has(raw.user_id)) out.set(raw.user_id, []);
    out.get(raw.user_id)!.push({
      id: raw.id,
      kind: raw.kind,
      label: raw.label,
      days: raw.days ?? [],
      windowStart: raw.window_start,
      windowEnd: raw.window_end,
      transport: raw.transport,
    });
  }
  return out;
}
```

- [ ] **Step 2: Smoketest de venster-wiskunde**

Maak `<scratchpad>/moments-smoke.ts` (NODE_PATH-stub voor `server-only` staat al in de scratchpad van deze sessie; anders opnieuw aanmaken zoals in het scorecard-plan):

```ts
import { momentWindowsForDay, type AgentMoment } from "C:/Users/rwnhr/kutweer/src/lib/agents/moments";

const moments: AgentMoment[] = [
  { id: "1", kind: "commute", label: "Ochtendrit", days: [1, 2, 3, 4, 5], windowStart: "07:30", windowEnd: "08:30", transport: "bike" },
  { id: "2", kind: "dog", label: "Avondronde", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "21:00", windowEnd: "22:00", transport: null },
];
const vrijdag = new Date("2026-07-10T10:00:00Z");
const zaterdag = new Date("2026-07-11T10:00:00Z");
console.log(momentWindowsForDay(moments, vrijdag).map((w) => `${w.moment.label} ${w.start.toISOString()}–${w.end.toISOString()}`));
console.log(momentWindowsForDay(moments, zaterdag).length); // 1 (alleen hond)
```

Run: `NODE_PATH="<scratchpad>/node_modules" npx tsx <scratchpad>/moments-smoke.ts`
Verwacht: vrijdag 2 vensters (07:30 NL = 05:30Z in juli), zaterdag `1`.

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep moments` — geen fouten.

```bash
git add src/lib/agents/moments.ts
git commit -m "feat(agents): persoonlijke momenten — venster-wiskunde + storage"
```

---

### Task 3: Pure kandidaat-logica `src/lib/agents/headsup-push.ts`

**Files:**
- Create: `src/lib/agents/headsup-push.ts`
- Modify: `src/lib/agents/types.ts:18-26` (categorie-union)

**Interfaces:**
- Consumes: `AgentHeadsUp`, `HourlyForecast` (`@/lib/types`), `MomentWindow` (Task 2).
- Produces (Task 5 gebruikt dit):
  - `interface PushCandidate { agent: "piet" | "koos"; category: string; key: string; title: string; body: string; matchedMoment: boolean }`
  - `rainTransitions(hourly: HourlyForecast[], now: Date): RainTransition[]`
  - `pietPushCandidates(placeName: string, hourly: HourlyForecast[], windows: MomentWindow[], now: Date): PushCandidate[]`
  - `koosPushCandidates(headsUps: AgentHeadsUp[], province: string, placeSlug: string, now: Date): PushCandidate[]`
  - `selectWithinBudget(candidates: PushCandidate[], sentKeys: Set<string>, countsByAgent: Map<string, number>): PushCandidate[]`
  - `inDeliveryWindow(now: Date): boolean` — 07:00-22:00 NL.
  - Constantes: `PIET_MAX_PER_DAY = 3`, `KOOS_MAX_PER_DAY = 1`, `KOOS_DAYS = [4, 5, 6]` (do/vr/za), `WET_MM_PER_HOUR = 0.2`.

- [ ] **Step 1: Breid de categorie-union uit**

In `src/lib/agents/types.ts` (regel 18-26):

```ts
export type AgentHeadsUpCategory =
  | "daily_advice"
  | "best_moment"
  | "rain_risk"
  | "wind_risk"
  | "thunderstorm_risk"
  | "better_place"
  | "going_out"
  | "business_opportunity"
  | "weather_shift"
  | "dry_window";
```

- [ ] **Step 2: Schrijf de pure logica**

```ts
/**
 * Heads-up-push kandidaten (spec 2026-07-10 §3A/B): pure wiskunde van
 * uurlijkse tijdlijn + persoonlijke momenten naar push-waardige berichten.
 * Geen I/O, geen LLM — de cron (agent-headsup-push) doet de bezorging.
 *
 * Ontwerpregel: geen heads-up zonder concrete actie; stilte als feature.
 */

import type { HourlyForecast } from "@/lib/types";
import type { AgentHeadsUp } from "@/lib/agents/types";
import type { MomentWindow } from "@/lib/agents/moments";

export const PIET_MAX_PER_DAY = 3;
export const KOOS_MAX_PER_DAY = 1;
/** ISO-weekdagen waarop Koos mag pushen: do/vr/za (het beslisvenster). */
export const KOOS_DAYS = [4, 5, 6];
export const WET_MM_PER_HOUR = 0.2;
/** Bezorgvenster in NL-uren. */
const DELIVERY_FROM = 7;
const DELIVERY_TO = 22;
/** Kandidaat moet binnen dit venster vanaf nu vallen. */
const LOOKAHEAD_HOURS = 12;

export interface PushCandidate {
  agent: "piet" | "koos";
  category: string;
  /** Stabiele dedup-sleutel; de cron prefixt niet — dit ís de headsup_key. */
  key: string;
  title: string;
  body: string;
  /** Raakt een persoonlijk moment → voorrang binnen het budget. */
  matchedMoment: boolean;
}

export interface RainTransition {
  kind: "dry_to_wet" | "wet_to_dry";
  /** Eerste uur van de nieuwe toestand. */
  at: Date;
}

export function inDeliveryWindow(now: Date): boolean {
  const hour = parseInt(
    now.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  return hour >= DELIVERY_FROM && hour < DELIVERY_TO;
}

export function nlWeekday(now: Date): number {
  const short = now.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[short] ?? 1;
}

const uurNL = (d: Date) =>
  d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

/** Sleutel-bucket: NL-datum + uur, zodat dezelfde omslag maar één push geeft. */
function hourBucket(d: Date): string {
  return `${d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" })}T${d
    .toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false })}`;
}

/**
 * Droog↔nat-omslagen in de komende LOOKAHEAD_HOURS. De nieuwe toestand moet
 * minstens 2 uur standhouden (geen geflapper). Hooguit één omslag per richting.
 */
export function rainTransitions(hourly: HourlyForecast[], now: Date): RainTransition[] {
  const horizon = new Date(now.getTime() + LOOKAHEAD_HOURS * 3600_000);
  const upcoming = hourly
    .map((h) => ({ at: new Date(h.time), wet: h.precipitation >= WET_MM_PER_HOUR }))
    .filter((h) => h.at >= new Date(now.getTime() - 3600_000) && h.at <= horizon);
  if (upcoming.length < 3) return [];

  const out: RainTransition[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < upcoming.length - 1; i++) {
    const prev = upcoming[i - 1];
    const cur = upcoming[i];
    const next = upcoming[i + 1];
    if (cur.wet !== prev.wet && cur.wet === next.wet && cur.at > now) {
      const kind = cur.wet ? "dry_to_wet" : "wet_to_dry";
      if (!seen.has(kind)) {
        seen.add(kind);
        out.push({ kind, at: cur.at });
      }
    }
  }
  return out;
}

/** Momentvenster dat door `at` geraakt wordt (incl. 60 min aanloop). */
function windowHit(windows: MomentWindow[], at: Date): MomentWindow | null {
  for (const w of windows) {
    const leadStart = new Date(w.start.getTime() - 60 * 60_000);
    if (at >= leadStart && at <= w.end) return w;
  }
  return null;
}

function momentCopy(w: MomentWindow, transition: RainTransition, placeName: string): { title: string; body: string } | null {
  const t = uurNL(transition.at);
  if (transition.kind === "dry_to_wet") {
    switch (w.moment.kind) {
      case "commute":
        if (w.moment.transport === "car") return null; // auto's geen regen-spam
        return {
          title: `Regen om ${t} — ${w.moment.label.toLowerCase()}`,
          body: `Regenpak mee: rond ${t} rijd je door een bui heen. Eerder vertrekken scheelt.`,
        };
      case "dog":
        return {
          title: `Laat de hond vóór ${t} uit`,
          body: `Daarna wordt het nat in ${placeName}. Nu is het nog droog.`,
        };
      case "laundry":
        return {
          title: `Was binnenhalen vóór ${t}`,
          body: `Vanaf ${t} regent het in ${placeName}.`,
        };
      case "sport":
      case "outdoor":
      case "custom":
        return {
          title: `${w.moment.label}: vóór ${t} blijft het droog`,
          body: `Daarna regen in ${placeName}. Plan het ervoor of erna.`,
        };
    }
  }
  // wet_to_dry raakt een moment: "vanaf dan kan het weer"
  return {
    title: `Vanaf ${t} droog — ${w.moment.label.toLowerCase()} kan door`,
    body: `De regen in ${placeName} is dan voorbij.`,
  };
}

/**
 * Piets push-kandidaten: omslagen gekoppeld aan momenten gaan voor; een kale
 * omslag (zonder moment) mag ook, met generieke maar concrete copy.
 */
export function pietPushCandidates(
  placeName: string,
  hourly: HourlyForecast[],
  windows: MomentWindow[],
  now: Date,
): PushCandidate[] {
  const out: PushCandidate[] = [];
  for (const transition of rainTransitions(hourly, now)) {
    const key = `piet|weather_shift|${transition.kind}|${hourBucket(transition.at)}`;
    const hit = windowHit(windows, transition.at);
    if (hit) {
      const copy = momentCopy(hit, transition, placeName);
      if (copy) out.push({ agent: "piet", category: "weather_shift", key, matchedMoment: true, ...copy });
      continue;
    }
    const t = uurNL(transition.at);
    out.push(
      transition.kind === "dry_to_wet"
        ? {
            agent: "piet", category: "weather_shift", key, matchedMoment: false,
            title: `Vanaf ${t} regen in ${placeName}`,
            body: `Wat je buiten wilt doen: doe het vóór ${t}.`,
          }
        : {
            agent: "piet", category: "weather_shift", key, matchedMoment: false,
            title: `Vanaf ${t} droog in ${placeName}`,
            body: `Daarna kun je weer naar buiten zonder nat te worden.`,
          },
    );
  }
  return out;
}

/**
 * Koos: alleen zijn beste `better_place`-heads-up (severity useful of hoger)
 * wordt push-waardig; hij is de schaarse stem van het stel.
 */
export function koosPushCandidates(
  headsUps: AgentHeadsUp[],
  province: string,
  placeSlug: string,
  now: Date,
): PushCandidate[] {
  const best = headsUps.find(
    (h) => h.category === "better_place" && (h.severity === "useful" || h.severity === "important"),
  );
  if (!best) return [];
  const dayISO = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  return [
    {
      agent: "koos",
      category: "better_place",
      key: `koos|better_place|${province}/${placeSlug}|${dayISO}`,
      title: best.title,
      body: `${best.message} ${best.action}`.trim().slice(0, 170),
      matchedMoment: false,
    },
  ];
}

/**
 * Budget + dedup, puur: momenten-treffers eerst, dan de rest; nooit boven
 * PIET_MAX_PER_DAY / KOOS_MAX_PER_DAY (dagtelling komt uit agent_headsup_log).
 */
export function selectWithinBudget(
  candidates: PushCandidate[],
  sentKeys: Set<string>,
  countsByAgent: Map<string, number>,
): PushCandidate[] {
  const limits: Record<string, number> = { piet: PIET_MAX_PER_DAY, koos: KOOS_MAX_PER_DAY };
  const counts = new Map(countsByAgent);
  const ordered = [...candidates].sort((a, b) => Number(b.matchedMoment) - Number(a.matchedMoment));
  const out: PushCandidate[] = [];
  for (const c of ordered) {
    if (sentKeys.has(c.key)) continue;
    const used = counts.get(c.agent) ?? 0;
    if (used >= (limits[c.agent] ?? 0)) continue;
    counts.set(c.agent, used + 1);
    out.push(c);
  }
  return out;
}
```

- [ ] **Step 3: Smoketest**

`<scratchpad>/headsup-smoke.ts`:

```ts
import { rainTransitions, pietPushCandidates, selectWithinBudget } from "C:/Users/rwnhr/kutweer/src/lib/agents/headsup-push";
import { momentWindowsForDay, type AgentMoment } from "C:/Users/rwnhr/kutweer/src/lib/agents/moments";

const now = new Date("2026-07-11T08:00:00Z"); // 10:00 NL
const hourly = Array.from({ length: 16 }, (_, i) => ({
  time: new Date(now.getTime() + (i - 1) * 3600_000).toISOString(),
  temperature: 20, apparentTemperature: 20, weatherCode: 3,
  precipitation: i >= 6 && i <= 9 ? 1.2 : 0, // regen 15:00–18:00Z
  windSpeed: 10, cape: 0, confidence: "high" as const,
}));
const moments: AgentMoment[] = [
  { id: "1", kind: "commute", label: "Avondrit", days: [6], windowStart: "17:30", windowEnd: "18:30", transport: "bike" },
];
const windows = momentWindowsForDay(moments, now);
console.log(rainTransitions(hourly as never, now)); // dry_to_wet ~13:00Z(15:00 NL... check offsets) + wet_to_dry
const cands = pietPushCandidates("Winkel", hourly as never, windows, now);
console.log(cands.map((c) => `${c.matchedMoment ? "★" : "·"} ${c.title} — ${c.body}`));
console.log(selectWithinBudget(cands, new Set(), new Map([["piet", 2]])).length); // max 1 erbij
```

Run: `NODE_PATH="<scratchpad>/node_modules" npx tsx <scratchpad>/headsup-smoke.ts`
Verwacht: één `dry_to_wet` + één `wet_to_dry`; kandidaten met NL-tijden en concrete actie; budgetselectie levert 1 (2 van de 3 al gebruikt).

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep -E "headsup-push|agents/types"` — geen fouten.

```bash
git add src/lib/agents/headsup-push.ts src/lib/agents/types.ts
git commit -m "feat(agents): pure heads-up-push kandidaten — omslagen, momenten-copy, budget"
```

---

### Task 4: Log-storage `src/lib/agents/headsup-log.ts`

**Files:**
- Create: `src/lib/agents/headsup-log.ts`

**Interfaces:**
- Consumes: tabel uit Task 1.
- Produces (Task 5):
  - `interface PushState { sentKeys: Set<string>; countsByAgent: Map<string, number> }`
  - `loadPushState(admin, userIds: string[], nlDayStart: Date): Promise<Map<string, PushState>>` — rijen van de laatste 48u; `countsByAgent` telt alleen rijen ≥ `nlDayStart`.
  - `logPushed(admin, rows: { userId: string; agent: string; province: string; placeSlug: string; key: string; category: string; severity: string }[]): Promise<void>`
  - `nlDayStart(now: Date): Date` — middernacht NL als UTC-Date.

- [ ] **Step 1: Schrijf de lib**

```ts
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dedup + dagbudget voor heads-up-pushes (spec 2026-07-10 §3B).
 * Schema: supabase/migrations/20260711_agent_headsup_push.sql. Fail-soft:
 * zonder tabel geen state → de cron pusht dan niets dubbel omdat
 * selectWithinBudget op een lege set draait maar loggen faalt zacht;
 * in de praktijk is de migratie vóór de deploy live.
 */

export const AGENT_HEADSUP_LOG_TABLE = "agent_headsup_log";

export interface PushState {
  sentKeys: Set<string>;
  countsByAgent: Map<string, number>;
}

/** Middernacht NL (Europe/Amsterdam) van de dag van `now`, als UTC-Date. */
export function nlDayStart(now: Date): Date {
  const dateISO = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const probe = new Date(`${dateISO}T12:00:00Z`);
  const nlHourAtProbe = parseInt(
    probe.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  const offsetHours = nlHourAtProbe - 12;
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) - offsetHours * 3600_000);
}

export async function loadPushState(
  admin: SupabaseClient,
  userIds: string[],
  dayStart: Date,
): Promise<Map<string, PushState>> {
  const out = new Map<string, PushState>();
  if (!userIds.length) return out;
  const since = new Date(Date.now() - 48 * 3600_000).toISOString();
  const { data, error } = await admin
    .from(AGENT_HEADSUP_LOG_TABLE)
    .select("user_id, agent, headsup_key, sent_at")
    .in("user_id", userIds)
    .gte("sent_at", since);
  if (error) {
    console.error("[headsup-log] niet leesbaar:", error.message);
    return out;
  }
  for (const row of (data ?? []) as { user_id: string; agent: string; headsup_key: string; sent_at: string }[]) {
    if (!out.has(row.user_id)) out.set(row.user_id, { sentKeys: new Set(), countsByAgent: new Map() });
    const state = out.get(row.user_id)!;
    state.sentKeys.add(row.headsup_key);
    if (new Date(row.sent_at) >= dayStart) {
      state.countsByAgent.set(row.agent, (state.countsByAgent.get(row.agent) ?? 0) + 1);
    }
  }
  return out;
}

export async function logPushed(
  admin: SupabaseClient,
  rows: { userId: string; agent: string; province: string; placeSlug: string; key: string; category: string; severity: string }[],
): Promise<void> {
  if (!rows.length) return;
  const { error } = await admin.from(AGENT_HEADSUP_LOG_TABLE).upsert(
    rows.map((r) => ({
      user_id: r.userId,
      agent: r.agent,
      province: r.province,
      place_slug: r.placeSlug,
      headsup_key: r.key,
      category: r.category,
      severity: r.severity,
    })),
    { onConflict: "user_id,headsup_key", ignoreDuplicates: true },
  );
  if (error) console.error("[headsup-log] loggen faalde:", error.message);
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep headsup-log` — geen fouten.

```bash
git add src/lib/agents/headsup-log.ts
git commit -m "feat(agents): dedup- en dagbudget-state voor heads-up-pushes"
```

---

### Task 5: De motor — cron `agent-headsup-push` + registratie

**Files:**
- Create: `src/app/(site)/api/cron/agent-headsup-push/route.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: alles uit Task 2-4; `activeAgentPlaceSubscriptions` (email-recipients), `buildAgentContext` (context), `koosAgent`, `findPlace`, `activePushDevices`/`sendPushToDevice`/`pushConfigured` (push).
- Produces: GET `/api/cron/agent-headsup-push` (+ `?dry=1` → kandidaten zonder te versturen).

- [ ] **Step 1: Schrijf de route**

```ts
/**
 * AGENT HEADS-UP PUSH — de motor (spec 2026-07-10 §3A, plan 1).
 * Elke 30 min: per plaats met een actief Piet/Koos-push-abonnement de pure
 * agents draaien, kandidaten matchen op persoonlijke momenten, budget/venster/
 * dedup toepassen en pushen. Nul LLM. Reed heeft zijn eigen cron (veiligheid).
 *
 * ?dry=1 → kandidaten teruggeven zonder te versturen of te loggen.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activeAgentPlaceSubscriptions } from "@/lib/agents/email-recipients";
import { buildAgentContext } from "@/lib/agents/context";
import { koosAgent } from "@/lib/agents/koos-agent";
import { loadMomentsForUsers, momentWindowsForDay } from "@/lib/agents/moments";
import {
  pietPushCandidates,
  koosPushCandidates,
  selectWithinBudget,
  inDeliveryWindow,
  nlWeekday,
  KOOS_DAYS,
  type PushCandidate,
} from "@/lib/agents/headsup-push";
import { loadPushState, logPushed, nlDayStart } from "@/lib/agents/headsup-log";
import { findPlace } from "@/lib/places-data";
import { activePushDevices, pushConfigured, sendPushToDevice } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  if (
    process.env.NODE_ENV === "production" &&
    !isVercelCron &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const now = new Date();
  if (!inDeliveryWindow(now) && !dry) {
    return NextResponse.json({ sent: 0, reason: "buiten bezorgvenster (07:00-22:00 NL)" });
  }
  if (!pushConfigured() && !dry) {
    return NextResponse.json({ sent: 0, reason: "VAPID niet geconfigureerd" });
  }

  const admin = createSupabaseAdminClient();
  const koosDay = KOOS_DAYS.includes(nlWeekday(now));

  const [pietSubs, koosSubs] = await Promise.all([
    activeAgentPlaceSubscriptions(admin, "piet", "push"),
    koosDay ? activeAgentPlaceSubscriptions(admin, "koos", "push") : Promise.resolve([]),
  ]);
  if (!pietSubs.length && !koosSubs.length) {
    return NextResponse.json({ sent: 0, reason: "geen push-abonnementen" });
  }

  // Per plaats één context; per plaats bijhouden welke agents er abonnees hebben.
  interface PlaceJob {
    province: string; placeSlug: string; placeName: string; lat: number; lon: number;
    pietUsers: string[]; koosUsers: string[];
  }
  const jobs = new Map<string, PlaceJob>();
  const addSub = (sub: { province: string; placeSlug: string; userId: string }, agent: "piet" | "koos") => {
    const place = findPlace(sub.province, sub.placeSlug);
    if (!place) return;
    const key = `${sub.province}/${sub.placeSlug}`;
    if (!jobs.has(key)) {
      jobs.set(key, {
        province: sub.province, placeSlug: sub.placeSlug,
        placeName: place.name, lat: place.lat, lon: place.lon,
        pietUsers: [], koosUsers: [],
      });
    }
    (agent === "piet" ? jobs.get(key)!.pietUsers : jobs.get(key)!.koosUsers).push(sub.userId);
  };
  for (const sub of pietSubs) addSub(sub, "piet");
  for (const sub of koosSubs) addSub(sub, "koos");

  const allUserIds = [...new Set([...pietSubs, ...koosSubs].map((s) => s.userId))];
  const [momentsByUser, stateByUser, devicesByUser] = await Promise.all([
    loadMomentsForUsers(admin, allUserIds),
    loadPushState(admin, allUserIds, nlDayStart(now)),
    dry ? Promise.resolve(new Map()) : activePushDevices(admin, allUserIds),
  ]);

  let sent = 0;
  const errors: string[] = [];
  const dryReport: Record<string, unknown>[] = [];

  for (const job of jobs.values()) {
    try {
      const ctx = await buildAgentContext(
        { name: job.placeName, lat: job.lat, lon: job.lon },
        now,
        { fast: true },
      );
      if (!ctx) continue;

      // Gevaar-handoff: bij een zware actieve waarschuwing zwijgen Piet en
      // Koos hier — Reed leidt via zijn eigen cron.
      const danger = ctx.knmi.some((w) => w.severity === "important" || w.severity === "urgent");
      if (danger) continue;

      // Koos-kandidaten per plaats één keer (gebruiker-onafhankelijk).
      const koosCands: PushCandidate[] =
        koosDay && job.koosUsers.length
          ? koosPushCandidates(
              (await koosAgent(ctx, { includeVoice: false, timeoutMs: 4000 })).headsUps,
              job.province, job.placeSlug, now,
            )
          : [];

      const perUserTargets = new Map<string, PushCandidate[]>();
      for (const userId of new Set([...job.pietUsers, ...job.koosUsers])) {
        const windows = momentWindowsForDay(momentsByUser.get(userId) ?? [], now);
        const cands: PushCandidate[] = [];
        if (job.pietUsers.includes(userId)) {
          cands.push(...pietPushCandidates(job.placeName, ctx.weather.hourly, windows, now));
        }
        if (job.koosUsers.includes(userId)) cands.push(...koosCands);
        // Default-state in de map zetten zodat het in-run-budget ook voor
        // nieuwe gebruikers meetelt (de map wordt hieronder bijgewerkt).
        if (!stateByUser.has(userId)) {
          stateByUser.set(userId, { sentKeys: new Set<string>(), countsByAgent: new Map<string, number>() });
        }
        const state = stateByUser.get(userId)!;
        const picked = selectWithinBudget(cands, state.sentKeys, state.countsByAgent);
        if (picked.length) perUserTargets.set(userId, picked);
      }

      if (dry) {
        dryReport.push({
          place: `${job.province}/${job.placeSlug}`,
          users: Object.fromEntries(
            [...perUserTargets].map(([u, c]) => [u, c.map((x) => `${x.matchedMoment ? "★" : "·"}${x.title}`)]),
          ),
        });
        continue;
      }

      for (const [userId, picked] of perUserTargets) {
        const devices = devicesByUser.get(userId) ?? [];
        if (!devices.length) continue;
        for (const candidate of picked) {
          let delivered = false;
          for (const device of devices) {
            const result = await sendPushToDevice(admin, device, {
              title: candidate.title,
              body: candidate.body,
              url: `https://weerzone.nl/vandaag#${candidate.agent}`,
              tag: `${candidate.agent}:${job.province}/${job.placeSlug}`,
            });
            if (result.ok) delivered = true;
            else if (result.reason) errors.push(`push ${userId}: ${result.reason}`);
          }
          if (delivered) {
            sent += 1;
            // Direct loggen én de in-memory state bijwerken zodat dezelfde
            // gebruiker binnen deze run niet over budget gaat.
            await logPushed(admin, [{
              userId, agent: candidate.agent, province: job.province,
              placeSlug: job.placeSlug, key: candidate.key,
              category: candidate.category, severity: "useful",
            }]);
            const state = stateByUser.get(userId);
            if (state) {
              state.sentKeys.add(candidate.key);
              state.countsByAgent.set(candidate.agent, (state.countsByAgent.get(candidate.agent) ?? 0) + 1);
            }
          }
        }
      }
    } catch (err) {
      errors.push(`${job.province}/${job.placeSlug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (dry) return NextResponse.json({ dry: true, places: jobs.size, report: dryReport });
  return NextResponse.json({ sent, places: jobs.size, users: allUserIds.length, errors: errors.slice(0, 10) });
}
```

- [ ] **Step 2: Registreer de cron**

In `vercel.json`, na de `piet-scorecard?phase=verify`-entry:

```json
    {
      "path": "/api/cron/agent-headsup-push",
      "schedule": "*/30 * * * *"
    },
```

- [ ] **Step 3: Typecheck + dry-run lokaal**

Run: `npx tsc --noEmit 2>&1 | grep agent-headsup-push` — geen fouten.
Optioneel: `npm run dev` + `curl "http://localhost:3000/api/cron/agent-headsup-push?dry=1"` → JSON met `dry: true` (rapport leeg zolang er geen piet/koos-push-abonnementen zijn — fail-soft-pad).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/api/cron/agent-headsup-push/route.ts" vercel.json
git commit -m "feat(agents): heads-up-push motor — 30-min cron met momenten, budget en dedup"
```

---

### Task 6: Reed-all-clear

**Files:**
- Modify: `src/app/(site)/api/cron/reed-alert-email/route.ts` (imports ~regel 19, handler ~regel 287-294 en het push-blok ~regel 385)

**Interfaces:**
- Consumes: bestaande `alreadySent`/`logSent` (channel "push"), `activePushDevices`, `sendPushToDevice`, `fetchKNMIWarnings`.
- Produces: all-clear-pushes met `warning_key = "<key>|clear"` in `reed_warning_alerts`.

- [ ] **Step 1: All-clear-functie toevoegen**

Direct na de bestaande `logSent`-functie (na regel 255) invoegen:

```ts
/**
 * All-clear (spec 2026-07-10 §3G): wie een push kreeg voor een waarschuwing
 * die niet meer actief is, krijgt één afmelding — Reed maakt af waar hij aan
 * begint. Dedup via warning_key + "|clear" in dezelfde tabel.
 */
async function sendAllClearPushes(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  activeKeys: Set<string>,
): Promise<{ cleared: number; errors: string[] }> {
  const errors: string[] = [];
  if (!pushConfigured()) return { cleared: 0, errors };

  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data, error } = await admin
    .from("reed_warning_alerts")
    .select("user_id, warning_key, province_slug, severity, type")
    .eq("channel", "push")
    .gte("sent_at", since);
  if (error || !data?.length) return { cleared: 0, errors };

  const rows = data as { user_id: string; warning_key: string; province_slug: string; severity: string; type: string }[];
  const clearedAlready = new Set(
    rows.filter((r) => r.warning_key.endsWith("|clear")).map((r) => `${r.user_id}|${r.warning_key}`),
  );
  const candidates = rows.filter(
    (r) =>
      !r.warning_key.endsWith("|clear") &&
      !activeKeys.has(r.warning_key) &&
      !clearedAlready.has(`${r.user_id}|${r.warning_key}|clear`),
  );
  if (!candidates.length) return { cleared: 0, errors };

  const devicesByUser = await activePushDevices(admin, [...new Set(candidates.map((c) => c.user_id))]);
  let cleared = 0;
  for (const c of candidates) {
    const devices = devicesByUser.get(c.user_id) ?? [];
    if (!devices.length) continue;
    let delivered = false;
    for (const device of devices) {
      const result = await sendPushToDevice(admin, device, {
        title: `✅ Voorbij: ${c.type}`,
        body: "De waarschuwing is afgelopen. Komende uren rustig weer.",
        url: "https://weerzone.nl/vandaag#reed",
        tag: `reed-${c.warning_key}-clear`,
      });
      if (result.ok) delivered = true;
      else if (result.reason) errors.push(`all-clear: ${result.reason}`);
    }
    if (delivered) {
      await logSent(
        admin,
        c.user_id,
        null,
        { key: `${c.warning_key}|clear`, provinceSlug: c.province_slug, severity: c.severity as KNMIWarning["severity"], type: c.type },
        null,
        "push",
      );
      cleared += 1;
    }
  }
  return { cleared, errors };
}
```

- [ ] **Step 2: De vroege return verplaatsen**

De bestaande regels (287-294):

```ts
  if (allWarnings.length === 0) {
    return NextResponse.json({ sent: 0, reason: "Geen actieve KNMI-waarschuwingen" });
  }
```

worden:

```ts
  // All-clear vóór de vroege return: juist als waarschuwingen verdwijnen
  // moet Reed afmelden bij wie de oorspronkelijke push kreeg.
  const activeKeys = new Set(allWarnings.map((w) => w.key));
  const allClear = await sendAllClearPushes(admin, activeKeys);

  if (allWarnings.length === 0) {
    return NextResponse.json({ sent: 0, cleared: allClear.cleared, reason: "Geen actieve KNMI-waarschuwingen" });
  }
```

En in de afsluitende `NextResponse.json({...})` (regel 426-433) `cleared: allClear.cleared,` toevoegen plus `...allClear.errors` bij de errors (`errors: [...errors, ...allClear.errors].slice(0, 10)`).

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep reed-alert-email` — geen fouten. (Check dat `KNMIWarning` als type geïmporteerd is in dit bestand; zo niet, toevoegen aan de bestaande import uit `@/lib/knmi-warnings`.)

```bash
git add "src/app/(site)/api/cron/reed-alert-email/route.ts"
git commit -m "feat(agents): Reed-all-clear — één afmeldingspush als de waarschuwing voorbij is"
```

---

### Task 7: Test-push-route

**Files:**
- Create: `src/app/(site)/api/agents/test-push/route.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (ingelogde gebruiker), `createSupabaseAdminClient`, `activePushDevices`, `sendPushToDevice`, `pushConfigured`.
- Produces: POST `/api/agents/test-push` → `{ sent, devices }`. Ingelogd = eigen apparaten; Bearer `CRON_SECRET` + `{ "userId": "..." }` = verificatiepad zonder sessie (voor e2e-tests).

- [ ] **Step 1: Schrijf de route**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activePushDevices, pushConfigured, sendPushToDevice } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Testnotificatie naar de eigen apparaten (spec 2026-07-10 §3F): bewijs dat
 * de keten werkt zonder op noodweer te wachten. Ingelogd = zelf; met Bearer
 * CRON_SECRET + userId in de body kan de keten ook zonder sessie geverifieerd
 * worden (e2e-pad).
 */
export async function POST(req: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push is niet geconfigureerd" }, { status: 500 });
  }

  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    const body = await req.json().catch(() => ({}));
    if (typeof body.userId === "string") userId = body.userId;
  }
  if (!userId) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Log eerst in" }, { status: 401 });
    userId = user.id;
  }

  const admin = createSupabaseAdminClient();
  const devices = (await activePushDevices(admin, [userId])).get(userId) ?? [];
  if (!devices.length) {
    return NextResponse.json({ sent: 0, devices: 0, reason: "Geen apparaten met meldingen aan" });
  }

  let sent = 0;
  for (const device of devices) {
    const result = await sendPushToDevice(admin, device, {
      title: "Test van je meteo-team",
      body: "Werkt. Zo melden Piet, Reed en Koos zich als het erop aankomt.",
      url: "https://weerzone.nl/vandaag",
      tag: "weerzone-test",
    });
    if (result.ok) sent += 1;
  }
  return NextResponse.json({ sent, devices: devices.length });
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep test-push` — geen fouten.

```bash
git add "src/app/(site)/api/agents/test-push/route.ts"
git commit -m "feat(agents): test-push route — bewijs de keten zonder noodweer"
```

---

### Task 8: Verificatie, deploy & e2e ("het moet ECHT werken")

**Files:** geen nieuwe code.

- [ ] **Step 1: Volledige typecheck + build**

```bash
npx tsc --noEmit   # eigen bestanden schoon; bekende drift elders documenteren
npm run build      # moet groen zijn (let op: build verbergt type-fouten)
```

- [ ] **Step 2: Migratie live (Rowan)**

`supabase/migrations/20260711_agent_headsup_push.sql` in de Supabase SQL editor. Daarna verifiëren:

```bash
# service role: beide tabellen bestaan (leeg)
curl "$SUPABASE_URL/rest/v1/agent_headsup_log?select=id&limit=1" -H "apikey: $SR" -H "Authorization: Bearer $SR"
curl "$SUPABASE_URL/rest/v1/agent_moments?select=id&limit=1" -H "apikey: $SR" -H "Authorization: Bearer $SR"
# anon: headsup_log → permission denied; moments → lege array (RLS owner-only)
```

- [ ] **Step 3: Deploy**

```bash
git status --short   # geen nieuwe zwervers meecommitteren
npx vercel deploy --prod   # check auto-alias, anders: npx vercel promote <url>
```

- [ ] **Step 4: Testdata voor Rowan (Winkel)**

Via service-role REST: (a) Piet-push-abonnement voor Winkel, (b) een moment dat vandaag valt:

```bash
curl -X POST "$SUPABASE_URL/rest/v1/agent_subscriptions" -H "apikey: $SR" -H "Authorization: Bearer $SR" \
  -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" \
  -d '{"user_id":"<rowan-uid>","agent":"piet","province":"noord-holland","place_slug":"winkel","channel":"push"}'
curl -X POST "$SUPABASE_URL/rest/v1/agent_moments" -H "apikey: $SR" -H "Authorization: Bearer $SR" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<rowan-uid>","kind":"dog","label":"Avondronde","days":[1,2,3,4,5,6,7],"window_start":"21:00","window_end":"22:00"}'
```

- [ ] **Step 5: E2E-keten**

1. `POST /api/agents/test-push` met Bearer CRON_SECRET + Rowans userId → notificatie op zijn 2 apparaten (`{sent:≥1}`), Rowan bevestigt visueel.
2. `GET /api/cron/agent-headsup-push?dry=1` (Bearer) → rapport toont Winkel met kandidaten (afhankelijk van echte tijdlijn; bij strak droog weer: leeg = correct, stilte is een feature).
3. Zonder `dry`: echte run → `sent` ≥ 0; bij een verzonden push: tweede run direct erna → zelfde kandidaat niet opnieuw (dedup-bewijs via `agent_headsup_log`-rijen).
4. Budget-bewijs: 3 rijen voor vandaag handmatig inserten voor Rowan+piet → run → `sent: 0` voor Piet.
5. All-clear: kan pas bij een echt aflopende waarschuwing — logica is puur genoeg om via de dedup-tabel te controleren zodra het eerste event passeert; noteer dit als openstaande observatie in het geheugen.

- [ ] **Step 6: Documentatie + afsluitende commit**

Spec-status bijwerken in `docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md` (plan 1 live), geheugen bijwerken, committen:

```bash
git add docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md
git commit -m "docs: heads-up-push motor (plan 1) live — status in spec"
```
