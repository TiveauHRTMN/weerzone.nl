# Agent heads-up gezicht (plan 2 van 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Het gezicht op de motor uit plan 1 (`docs/superpowers/plans/2026-07-11-agent-headsup-push-motor.md`, LIVE): onboarding-vragen in Piets stem die `agent_moments` vullen, PWA-installatiestap (iPhone-push!), één "Jouw agents"-blok, en de regiekamer in Mijn Weerzone — plus persoonlijk budget en PostHog-events.

**Architecture:** Alle nieuwe UI is client-side op bestaande RLS (owner-only op `agent_moments`, `agent_subscriptions`, `push_devices`) + bestaande API-routes (`/api/agents/subscribe`, `/api/agents/push/register`, `/api/agents/test-push`). Nieuw server-werk is klein: één toggle-route, één kolom (`user_profile.headsup_budget`) met handhaving in de motor-cron, en een server-side PostHog-capture.

**Tech Stack:** Next.js 16 App Router, React 19 client components, Supabase browser-client (RLS), Tailwind v4 + bestaande inline-stijlen, PostHog (`trackEvent` client / HTTP-capture server).

## Global Constraints

- **Toon (spec §2)**: net Nederlands, geen meteo-jargon, geen bronnamen (KNMI/Mariana) in copy, decimale komma. Onboarding-vragen komen uit Piets mond, **chips om te tikken — geen formulier**, overslaan mag, "niet burgerlijk".
- **Elk onboarding-antwoord wordt zichtbaar beloond** met een voorbeeldpush (spec §3C).
- **iPhone-push werkt alléén standalone** (A2HS) — installatienudge overal waar push aangaat zonder standalone op iOS (spec §3D).
- **Privacy**: PostHog onboarding-events geaggregeerd (soorten, geen venstertijden/labels); geen agenda, geen achtergrond-GPS.
- **Fail-soft**: budget-kolom ontbreekt → motor gedraagt zich als `standard` (3/dag).
- **Geen testrunner introduceren** (CLAUDE.md): verificatie = `npx tsc --noEmit` (alleen eigen bestanden schoon; bekende drift in b2b-emails/persona-email/wkpoule-data/nl-poi-places/test-buffer negeren), `npm run build`, tsx-smoketests, handmatige e2e.
- Migratie via de Supabase SQL editor (Rowan), daarna anon-REST-verificatie.
- Commits op `feat/studio-tiktok-autopost` met de Claude-trailer.
- `/vandaag` en de plaatspagina's zijn (deels) gecachet — per-gebruiker-status altijd client-side bepalen (patroon `AgentSubscribeCard`).

## File Structure

| Bestand | Verantwoordelijkheid |
|---|---|
| `src/app/layout.tsx` (wijzigen) | `manifest` + `appleWebApp` in metadata |
| `src/instrumentation-client.ts` (wijzigen) | `beforeinstallprompt` vroeg vangen |
| `src/components/PwaInstallCard.tsx` (nieuw) | Installatiestap/nudge (Android-prompt, iOS-instructie, standalone-detectie) |
| `src/lib/agents/moments-shared.ts` (nieuw) | Moment-types zonder `server-only` |
| `src/lib/agents/moments.ts` (wijzigen) | Types her-exporteren uit moments-shared |
| `src/lib/agents/moments-client.ts` (nieuw) | Browser-CRUD op `agent_moments` + `buildOnboardingMoments` |
| `supabase/migrations/20260712_headsup_budget.sql` (nieuw) | `user_profile.headsup_budget` |
| `src/app/actions.ts` (wijzigen) | `updateProfile` accepteert `headsupBudget` |
| `src/lib/agents/headsup-log.ts` (wijzigen) | `loadHeadsupBudgets` |
| `src/lib/agents/headsup-push.ts` (wijzigen) | `selectWithinBudget` met limiet-overrides |
| `src/lib/analytics-server.ts` (nieuw) | Server-side PostHog-capture |
| `src/app/(site)/api/cron/agent-headsup-push/route.ts` (wijzigen) | Budget-handhaving + `push_sent`-event |
| `src/app/(site)/app/onboarding/OnboardingClient.tsx` (wijzigen) | Piets drie vragen + PWA-slotstap |
| `src/app/(site)/api/agents/subscriptions/toggle/route.ts` (nieuw) | Abonnement aan/uit per agent+plaats+kanaal |
| `src/components/AgentsHubCard.tsx` (nieuw) | "Jouw agents"-blok (vervangt beide losse kaarten) |
| `src/components/AgentSubscribeCard.tsx` + `ReedPushCard.tsx` (verwijderen) | vervangen door AgentsHubCard |
| `src/app/(site)/vandaag/page.tsx` + `src/app/(site)/weer/[province]/[place]/page.tsx` (wijzigen) | AgentsHubCard mounten |
| `src/components/RegiekamerPanel.tsx` (nieuw) | Regiekamer: abonnementen, momenten, apparaten, test-push, budget |
| `src/app/(site)/mijn-weerzone/page.tsx` (wijzigen) | RegiekamerPanel mounten |

---

### Task 1: PWA-fundament — manifest-link + installatiecomponent

**Files:**
- Modify: `src/app/layout.tsx` (metadata-export, regel 8-13; `<head>`, regel 81-83)
- Modify: `src/instrumentation-client.ts`
- Create: `src/components/PwaInstallCard.tsx`

**Interfaces:**
- Produces (Task 4 en 5 gebruiken dit): `PwaInstallCard` client component met props `{ compact?: boolean; onDone?: () => void }`. Rendert `null` als de app al standalone draait of installatie niet relevant is (desktop zonder prompt). `compact` = smalle nudge-variant voor in het hub-blok.

- [ ] **Step 1: Manifest + appleWebApp in de root-metadata**

In `src/app/layout.tsx` binnen het bestaande `export const metadata: Metadata = {`-object (na `metadataBase`) toevoegen:

```ts
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "WEERZONE",
    statusBarStyle: "default",
  },
```

- [ ] **Step 2: `beforeinstallprompt` vroeg vangen**

Chrome vuurt `beforeinstallprompt` vaak vóór React mount; daarom vangen we hem in `src/instrumentation-client.ts` (draait vroeg). Onderaan het bestand toevoegen:

```ts
// PWA: het install-prompt-event vuurt vóór React mount; hier vangen zodat
// PwaInstallCard hem later kan afvuren (spec agent-headsup §3D).
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    (window as unknown as { __wzInstallPrompt?: Event }).__wzInstallPrompt = e;
    window.dispatchEvent(new CustomEvent("wz-install-ready"));
  });
}
```

- [ ] **Step 3: Schrijf `src/components/PwaInstallCard.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return (
    ((window as unknown as { __wzInstallPrompt?: BeforeInstallPromptEvent }).__wzInstallPrompt) ?? null
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * "Zet Weerzone op je telefoon" (spec agent-headsup §3D). Op iPhone werkt
 * push alléén vanaf het beginscherm; op Android/Chrome tonen we de echte
 * install-prompt. Al standalone → niets tonen.
 */
export default function PwaInstallCard({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (isIOS()) {
      setMode("ios");
      return;
    }
    if (getDeferredPrompt()) {
      setMode("android");
      return;
    }
    const onReady = () => setMode("android");
    window.addEventListener("wz-install-ready", onReady);
    return () => window.removeEventListener("wz-install-ready", onReady);
  }, []);

  async function install() {
    const prompt = getDeferredPrompt();
    if (!prompt) return;
    trackEvent("pwa_install_prompted", {});
    await prompt.prompt();
    const choice = await prompt.userChoice;
    trackEvent("pwa_install_choice", { outcome: choice.outcome });
    if (choice.outcome === "accepted") {
      setInstalled(true);
      onDone?.();
    }
  }

  if (installed) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        Weerzone staat op je beginscherm — meldingen kunnen je overal bereiken.
      </div>
    );
  }
  if (mode === "hidden") return null;

  if (compact) {
    return (
      <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3.5 text-[13px] font-semibold text-white/75">
        {mode === "ios" ? (
          <>Meldingen op iPhone werken pas als Weerzone op je beginscherm staat: tik op de deelknop en kies <strong className="text-white">Zet op beginscherm</strong>. Open Weerzone daarna vanaf dat icoon.</>
        ) : (
          <>Zet Weerzone op je telefoon voor meldingen die je overal bereiken.{" "}
            <button type="button" onClick={() => void install()} className="font-black underline underline-offset-2">Installeer</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--wz-border)", background: "#fff" }}>
      <p className="text-[15px] font-extrabold" style={{ color: "var(--wz-text)" }}>
        Zet Weerzone op je telefoon
      </p>
      {mode === "ios" ? (
        <ol className="mt-2 grid gap-1.5 text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
          <li>1. Tik onderin op de <strong>deelknop</strong> (vierkant met pijl omhoog).</li>
          <li>2. Kies <strong>Zet op beginscherm</strong>.</li>
          <li>3. Open Weerzone voortaan vanaf dat icoon — dan kunnen mijn seintjes je bereiken.</li>
        </ol>
      ) : (
        <>
          <p className="mt-2 text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
            Eén tik en Weerzone staat tussen je apps — zo bereiken de seintjes je overal.
          </p>
          <button type="button" onClick={() => void install()} className="wz-btn wz-btn-primary mt-3">
            Installeer Weerzone
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -iE "PwaInstall|instrumentation|app/layout"` — geen fouten.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/instrumentation-client.ts src/components/PwaInstallCard.tsx
git commit -m "feat(pwa): manifest gelinkt + installatiekaart — poort naar iPhone-push"
```

---

### Task 2: Momenten-types splitsen + browser-CRUD

**Files:**
- Create: `src/lib/agents/moments-shared.ts`
- Modify: `src/lib/agents/moments.ts` (typedefinities vervangen door re-export)
- Create: `src/lib/agents/moments-client.ts`

**Interfaces:**
- Consumes: bestaande `AgentMoment`-vorm uit plan 1 (`id, kind, label, days, windowStart, windowEnd, transport`).
- Produces (Task 4 en 6 gebruiken dit):
  - `moments-shared.ts`: `type MomentKind`, `type MomentTransport`, `interface AgentMoment`, `const AGENT_MOMENTS_TABLE`, `const MOMENT_KIND_LABEL: Record<MomentKind, string>`.
  - `moments-client.ts`: `interface MomentInsert { kind: MomentKind; label: string; days: number[]; windowStart: string; windowEnd: string; transport?: MomentTransport | null }`, `listMyMoments(supabase): Promise<AgentMoment[]>`, `insertMoment(supabase, userId, m: MomentInsert)`, `updateMoment(supabase, id, patch: Partial<MomentInsert>)`, `deleteMoment(supabase, id)`, `replaceOnboardingMoments(supabase, userId, moments: MomentInsert[])`, en puur: `buildOnboardingMoments(transport, depart, home, outdoor): MomentInsert[]`.

- [ ] **Step 1: Schrijf `src/lib/agents/moments-shared.ts`**

```ts
/**
 * Moment-types zonder `server-only`, deelbaar met client components
 * (onboarding, regiekamer). Runtime-serverlogica blijft in moments.ts.
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

export const MOMENT_KIND_LABEL: Record<MomentKind, string> = {
  commute: "Onderweg",
  dog: "Hond",
  outdoor: "Buiten",
  laundry: "Was",
  sport: "Sport",
  custom: "Eigen moment",
};
```

- [ ] **Step 2: Laat `moments.ts` de types her-exporteren**

In `src/lib/agents/moments.ts` het blok van `export const AGENT_MOMENTS_TABLE` t/m het einde van `export interface AgentMoment { ... }` vervangen door:

```ts
export {
  AGENT_MOMENTS_TABLE,
  type MomentKind,
  type MomentTransport,
  type AgentMoment,
} from "@/lib/agents/moments-shared";
import type { AgentMoment, MomentKind, MomentTransport } from "@/lib/agents/moments-shared";
```

(`MomentWindow`, `momentWindowsForDay` en `loadMomentsForUsers` blijven ongewijzigd staan; de lokale interface/type-declaraties die nu dubbel zouden zijn verwijderen.)

- [ ] **Step 3: Schrijf `src/lib/agents/moments-client.ts`**

```ts
"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AGENT_MOMENTS_TABLE,
  type AgentMoment,
  type MomentKind,
  type MomentTransport,
} from "@/lib/agents/moments-shared";

/**
 * Browser-CRUD op agent_moments (RLS owner-only, migratie 20260711).
 * Onboarding schrijft hier de antwoorden als momenten-rijen; de regiekamer
 * bewerkt dezelfde rijen. De cron leest ze server-side via de service role.
 */

export interface MomentInsert {
  kind: MomentKind;
  label: string;
  days: number[];
  windowStart: string;
  windowEnd: string;
  transport?: MomentTransport | null;
}

interface MomentRow {
  id: string;
  kind: MomentKind;
  label: string;
  days: number[];
  window_start: string;
  window_end: string;
  transport: MomentTransport | null;
}

function fromRow(row: MomentRow): AgentMoment {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    days: row.days ?? [],
    windowStart: row.window_start,
    windowEnd: row.window_end,
    transport: row.transport,
  };
}

function toRow(userId: string, m: MomentInsert) {
  return {
    user_id: userId,
    kind: m.kind,
    label: m.label,
    days: m.days,
    window_start: m.windowStart,
    window_end: m.windowEnd,
    transport: m.transport ?? null,
  };
}

export async function listMyMoments(supabase: SupabaseClient): Promise<AgentMoment[]> {
  const { data, error } = await supabase
    .from(AGENT_MOMENTS_TABLE)
    .select("id, kind, label, days, window_start, window_end, transport")
    .order("created_at", { ascending: true });
  if (error) return [];
  return ((data ?? []) as MomentRow[]).map(fromRow);
}

export async function insertMoment(
  supabase: SupabaseClient,
  userId: string,
  m: MomentInsert,
): Promise<{ ok: boolean }> {
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).insert(toRow(userId, m));
  return { ok: !error };
}

export async function updateMoment(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<MomentInsert>,
): Promise<{ ok: boolean }> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.days !== undefined) row.days = patch.days;
  if (patch.windowStart !== undefined) row.window_start = patch.windowStart;
  if (patch.windowEnd !== undefined) row.window_end = patch.windowEnd;
  if (patch.transport !== undefined) row.transport = patch.transport;
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).update(row).eq("id", id);
  return { ok: !error };
}

export async function deleteMoment(supabase: SupabaseClient, id: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).delete().eq("id", id);
  return { ok: !error };
}

/** Onboarding is de bron: bestaande rijen weg, nieuwe set erin. */
export async function replaceOnboardingMoments(
  supabase: SupabaseClient,
  userId: string,
  moments: MomentInsert[],
): Promise<{ ok: boolean }> {
  const { error: delError } = await supabase.from(AGENT_MOMENTS_TABLE).delete().eq("user_id", userId);
  if (delError) return { ok: false };
  if (!moments.length) return { ok: true };
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).insert(moments.map((m) => toRow(userId, m)));
  return { ok: !error };
}

/** Onboarding-antwoorden (spec §3C) → momenten-rijen. Puur; smoketestbaar. */
export type OnboardingTransport = "bike" | "ov" | "car" | "home";
export type OnboardingDepart = "voor8" | "8tot9" | "na9";
export type OnboardingHome = "rond17" | "rond18" | "later";
export type OnboardingOutdoor = "dog" | "sport" | "laundry" | "garden";

const DEPART_WINDOW: Record<OnboardingDepart, [string, string]> = {
  voor8: ["07:00", "08:00"],
  "8tot9": ["08:00", "09:00"],
  na9: ["09:00", "10:00"],
};
const HOME_WINDOW: Record<OnboardingHome, [string, string]> = {
  rond17: ["16:30", "17:30"],
  rond18: ["17:30", "18:30"],
  later: ["18:30", "20:00"],
};

export function buildOnboardingMoments(
  transport: OnboardingTransport | null,
  depart: OnboardingDepart,
  home: OnboardingHome,
  outdoor: OnboardingOutdoor[],
): MomentInsert[] {
  const out: MomentInsert[] = [];
  if (transport && transport !== "home") {
    const t = transport === "bike" ? "bike" : transport === "ov" ? "ov" : "car";
    const [ds, de] = DEPART_WINDOW[depart];
    const [hs, he] = HOME_WINDOW[home];
    out.push(
      { kind: "commute", label: "Ochtendrit", days: [1, 2, 3, 4, 5], windowStart: ds, windowEnd: de, transport: t },
      { kind: "commute", label: "Avondrit", days: [1, 2, 3, 4, 5], windowStart: hs, windowEnd: he, transport: t },
    );
  }
  if (outdoor.includes("dog")) {
    out.push(
      { kind: "dog", label: "Ochtendronde", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "07:00", windowEnd: "08:00" },
      { kind: "dog", label: "Avondronde", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "21:00", windowEnd: "22:00" },
    );
  }
  if (outdoor.includes("sport")) {
    out.push({ kind: "sport", label: "Sport of hardlopen", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "17:00", windowEnd: "20:30" });
  }
  if (outdoor.includes("laundry")) {
    out.push({ kind: "laundry", label: "Was buiten", days: [6, 7], windowStart: "10:00", windowEnd: "16:00" });
  }
  if (outdoor.includes("garden")) {
    out.push({ kind: "outdoor", label: "Tuin", days: [6, 7], windowStart: "10:00", windowEnd: "17:00" });
  }
  return out;
}
```

- [ ] **Step 4: Smoketest `buildOnboardingMoments`**

`<scratchpad>/onboarding-moments-smoke.ts` (NODE_PATH-stub voor `server-only`; `"use client"` is voor tsx een no-op string — het bestand importeert alleen types uit moments-shared, geen supabase-runtime bij deze aanroep):

```ts
import { buildOnboardingMoments } from "C:/Users/rwnhr/kutweer/src/lib/agents/moments-client";

console.log(buildOnboardingMoments("bike", "8tot9", "rond18", ["dog", "laundry"]).map((m) => `${m.kind} ${m.label} ${m.days.join("")} ${m.windowStart}-${m.windowEnd} ${m.transport ?? ""}`));
// verwacht: 2 commutes (08:00-09:00 bike / 17:30-18:30 bike), 2 hond, 1 was (za-zo)
console.log(buildOnboardingMoments("home", "voor8", "rond17", []).length); // 0
```

Run: `NODE_PATH="<scratchpad>/node_modules" npx tsx <scratchpad>/onboarding-moments-smoke.ts`

- [ ] **Step 5: Typecheck (let op: motor moet blijven compileren) + commit**

Run: `npx tsc --noEmit 2>&1 | grep -iE "moments"` — geen fouten (moments.ts, moments-client.ts, moments-shared.ts, cron-route).

```bash
git add src/lib/agents/moments-shared.ts src/lib/agents/moments.ts src/lib/agents/moments-client.ts
git commit -m "feat(agents): momenten deelbaar met de browser — types gesplitst + owner-CRUD"
```

---

### Task 3: Persoonlijk budget — kolom, motor-handhaving, push_sent-event

**Files:**
- Create: `supabase/migrations/20260712_headsup_budget.sql`
- Modify: `src/app/actions.ts:33-58` (`updateProfile`)
- Modify: `src/lib/agents/headsup-log.ts` (nieuwe loader)
- Modify: `src/lib/agents/headsup-push.ts` (`selectWithinBudget`-signatuur)
- Create: `src/lib/analytics-server.ts`
- Modify: `src/app/(site)/api/cron/agent-headsup-push/route.ts`

**Interfaces:**
- Consumes: `selectWithinBudget(candidates, sentKeys, countsByAgent)` uit plan 1; `PIET_MAX_PER_DAY`/`KOOS_MAX_PER_DAY`.
- Produces (Task 4 en 6 gebruiken dit):
  - `updateProfile({ headsupBudget?: "moments_only" | "standard" | "low", ... })`
  - `type HeadsupBudget = "moments_only" | "standard" | "low"` + `loadHeadsupBudgets(admin, userIds): Promise<Map<string, HeadsupBudget>>` (fail-soft lege map = standard) in `headsup-log.ts`
  - `selectWithinBudget(candidates, sentKeys, countsByAgent, limitOverrides?: Partial<Record<string, number>>)`
  - `captureServerEvent(distinctId: string, event: string, properties?: Record<string, unknown>): Promise<void>` in `analytics-server.ts`

- [ ] **Step 1: Schrijf de migratie**

```sql
-- Persoonlijk heads-up-budget (spec agent-headsup §3C, vraag 3):
-- moments_only = alleen pushes die een persoonlijk moment raken;
-- standard = spelregel-budget (Piet 3/dag); low = hooguit 1/dag.
-- Draai dit in de Supabase SQL editor (production). Idempotent.
alter table public.user_profile
  add column if not exists headsup_budget text not null default 'standard'
  check (headsup_budget in ('moments_only', 'standard', 'low'));
```

- [ ] **Step 2: `updateProfile` uitbreiden**

In `src/app/actions.ts`: aan de args-interface (na `koosOn?: boolean;`) toevoegen:

```ts
  headsupBudget?: "moments_only" | "standard" | "low";
```

En in de updates-opbouw (na de `args.lon`-regel):

```ts
  if (args.headsupBudget !== undefined) updates.headsup_budget = args.headsupBudget;
```

- [ ] **Step 3: `loadHeadsupBudgets` in `headsup-log.ts`**

Onderaan `src/lib/agents/headsup-log.ts` toevoegen:

```ts
export type HeadsupBudget = "moments_only" | "standard" | "low";

/** Persoonlijk budget per gebruiker (user_profile.headsup_budget).
 *  Fail-soft: lege map ⇒ iedereen `standard`. */
export async function loadHeadsupBudgets(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, HeadsupBudget>> {
  const out = new Map<string, HeadsupBudget>();
  if (!userIds.length) return out;
  const { data, error } = await admin
    .from("user_profile")
    .select("id, headsup_budget")
    .in("id", userIds);
  if (error) {
    console.error("[headsup-log] budget niet leesbaar:", error.message);
    return out;
  }
  for (const row of (data ?? []) as { id: string; headsup_budget: string | null }[]) {
    if (row.headsup_budget === "moments_only" || row.headsup_budget === "low") {
      out.set(row.id, row.headsup_budget);
    }
  }
  return out;
}
```

- [ ] **Step 4: `selectWithinBudget` accepteert limiet-overrides**

In `src/lib/agents/headsup-push.ts` de functie-signatuur en de limits-regel aanpassen:

```ts
export function selectWithinBudget(
  candidates: PushCandidate[],
  sentKeys: Set<string>,
  countsByAgent: Map<string, number>,
  limitOverrides?: Partial<Record<string, number>>,
): PushCandidate[] {
  const limits: Record<string, number> = {
    piet: PIET_MAX_PER_DAY,
    koos: KOOS_MAX_PER_DAY,
    ...limitOverrides,
  };
```

(De rest van de functie ongewijzigd.)

- [ ] **Step 5: Schrijf `src/lib/analytics-server.ts`**

```ts
import "server-only";

/**
 * Server-side PostHog-capture (crons/routes) via het HTTP-endpoint — de
 * client-side trackEvent kan hier niet. Fire-and-forget met vangnet: analytics
 * mag nooit een push tegenhouden.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!key) return;
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties: properties ?? {} }),
    });
  } catch {
    // stil: analytics is bijzaak
  }
}
```

- [ ] **Step 6: Motor: budget toepassen + push_sent loggen**

In `src/app/(site)/api/cron/agent-headsup-push/route.ts`:

Imports uitbreiden:

```ts
import { loadPushState, logPushed, nlDayStart, loadHeadsupBudgets } from "@/lib/agents/headsup-log";
import { captureServerEvent } from "@/lib/analytics-server";
```

De `Promise.all` die momenten/state/apparaten laadt wordt:

```ts
  const [momentsByUser, stateByUser, devicesByUser, budgetByUser] = await Promise.all([
    loadMomentsForUsers(admin, allUserIds),
    loadPushState(admin, allUserIds, nlDayStart(now)),
    dry ? Promise.resolve(new Map()) : activePushDevices(admin, allUserIds),
    loadHeadsupBudgets(admin, allUserIds),
  ]);
```

In de per-gebruiker-lus wordt het `selectWithinBudget`-blok:

```ts
        const state = stateByUser.get(userId)!;
        const budget = budgetByUser.get(userId) ?? "standard";
        const eligible =
          budget === "moments_only"
            ? cands.filter((c) => c.agent !== "piet" || c.matchedMoment)
            : cands;
        const picked = selectWithinBudget(
          eligible,
          state.sentKeys,
          state.countsByAgent,
          budget === "low" ? { piet: 1 } : undefined,
        );
```

En in het bezorg-blok, direct na `sent += 1;`:

```ts
            await captureServerEvent(userId, "push_sent", {
              agent: candidate.agent,
              category: candidate.category,
              matched_moment: candidate.matchedMoment,
              province: job.province,
              place: job.placeSlug,
            });
```

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep -iE "headsup|analytics-server|actions"` — geen fouten.

```bash
git add supabase/migrations/20260712_headsup_budget.sql src/app/actions.ts src/lib/agents/headsup-log.ts src/lib/agents/headsup-push.ts src/lib/analytics-server.ts "src/app/(site)/api/cron/agent-headsup-push/route.ts"
git commit -m "feat(agents): persoonlijk heads-up-budget + push_sent-event in de motor"
```

---

### Task 4: Onboarding — Piets drie vragen + PWA-slotstap

**Files:**
- Modify: `src/app/(site)/app/onboarding/OnboardingClient.tsx`

**Interfaces:**
- Consumes: `buildOnboardingMoments`, `replaceOnboardingMoments`, types uit Task 2 (`moments-client.ts`); `updateProfile({ headsupBudget })` uit Task 3; `PwaInstallCard` uit Task 1; bestaand `trackEvent`.
- Produces: onboarding-flow met stappen: 0 locatie (bestaand) → 1 vervoer → 2 buiten-doen → 3 hoe vaak → 4 agents+onderwerpen (bestaand) → 5 tijdstip (bestaand) → 6 telefoon (PWA). Antwoorden landen als `agent_moments`-rijen + `user_profile.headsup_budget`.

- [ ] **Step 1: Imports + typen + chip-data toevoegen**

Bovenaan `OnboardingClient.tsx`, bij de bestaande imports:

```ts
import { trackEvent } from "@/lib/analytics";
import PwaInstallCard from "@/components/PwaInstallCard";
import {
  buildOnboardingMoments,
  replaceOnboardingMoments,
  type OnboardingTransport,
  type OnboardingDepart,
  type OnboardingHome,
  type OnboardingOutdoor,
} from "@/lib/agents/moments-client";
```

Na het bestaande `TIMES`-blok (regel 32-37) de chip-data toevoegen. Elke keuze heeft een `reward`: Piets voorbeeldpush die na het tikken verschijnt (spec: elk antwoord zichtbaar beloond).

```ts
type BudgetKey = "moments_only" | "standard" | "low";

const TRANSPORTS: Array<{ k: OnboardingTransport; t: string; reward: string }> = [
  { k: "bike", t: "Fiets", reward: "“Regenpak mee om 8:10 — je rijdt door een bui heen. Eerder weg scheelt.”" },
  { k: "ov", t: "OV", reward: "“Paraplu mee naar de halte — rond 8:20 trekt er een bui over.”" },
  { k: "car", t: "Auto", reward: "“Bij gladheid of storm hoor je het van Reed vóór je vertrekt.”" },
  { k: "home", t: "Ik werk thuis", reward: "“Dan hou ik het droogste venster voor je lunchrondje in de gaten.”" },
];

const DEPARTS: Array<{ k: OnboardingDepart; t: string }> = [
  { k: "voor8", t: "Vóór 8" },
  { k: "8tot9", t: "Tussen 8 en 9" },
  { k: "na9", t: "Na 9" },
];

const HOMES: Array<{ k: OnboardingHome; t: string }> = [
  { k: "rond17", t: "Rond 17:00" },
  { k: "rond18", t: "Rond 18:00" },
  { k: "later", t: "Later" },
];

const OUTDOORS: Array<{ k: OnboardingOutdoor; t: string; reward: string }> = [
  { k: "dog", t: "Hond uitlaten", reward: "“Laat 'm vóór 21:00 uit — daarna regent het tot middernacht.”" },
  { k: "sport", t: "Hardlopen of sporten", reward: "“Tussen 18:00 en 19:30 is het droog — mooi venster voor je rondje.”" },
  { k: "laundry", t: "Was buiten drogen", reward: "“Tussen 10:00 en 16:00 perfect droogweer. Daarna niet meer.”" },
  { k: "garden", t: "Tuin", reward: "“Zaterdagochtend blijft het droog — de middag wordt nat.”" },
];

const BUDGETS: Array<{ k: BudgetKey; t: string; d: string; reward: string }> = [
  { k: "moments_only", t: "Alleen als het mijn plannen raakt", d: "Piet zwijgt tenzij een bui jouw momenten kruist", reward: "“Afgesproken: alleen als het jouw dag raakt.”" },
  { k: "standard", t: "Bij elke omslag", d: "Nooit meer dan drie seintjes per dag", reward: "“Bij elke omslag een seintje — en verder hou ik m'n mond.”" },
  { k: "low", t: "Zo min mogelijk", d: "Hooguit één per dag", reward: "“Hooguit één per dag, alleen als het er echt toe doet.”" },
];
```

- [ ] **Step 2: State + stappen uitbreiden**

Na de bestaande state-declaraties (bij `const [time, setTime] = ...`):

```ts
  const [transport, setTransport] = useState<OnboardingTransport | null>(null);
  const [depart, setDepart] = useState<OnboardingDepart>("8tot9");
  const [home, setHome] = useState<OnboardingHome>("rond18");
  const [outdoor, setOutdoor] = useState<OnboardingOutdoor[]>([]);
  const [budget, setBudget] = useState<BudgetKey>("standard");
```

Het `stepTitles`-array wordt (bestaande titels behouden, nieuwe ertussen — volgorde: locatie, vervoer, buiten, budget, agents, tijd, telefoon):

```ts
  const stepTitles = [
    {
      title: "Waar ben je?",
      sub: "We gebruiken GPS om je thuislocatie eenmalig te bepalen. Later kun je meer plekken toevoegen.",
    },
    {
      title: "Hoe beweeg jij je meestal?",
      sub: "Piet: “Dan weet ik wanneer jij buiten bent — en wanneer ik m'n mond moet houden.”",
    },
    {
      title: "Wat doe jij buiten?",
      sub: "Piet: “Tik aan wat op jou slaat. Alles is later bij te stellen.”",
    },
    {
      title: "Wanneer wil je Piet zeker horen?",
      sub: "Piet: “Zeg het maar — ik ben er niet om je scherm te laten trillen.”",
    },
    {
      title: "Waar wil je op geattendeerd worden?",
      sub: "Kies de onderwerpen die jij belangrijk vindt. Je kunt dit altijd aanpassen.",
    },
    {
      title: "Wanneer wil je je bericht?",
      sub: "We sturen je één keer per dag een e-mail met Piet's Update, afgestemd op jouw voorkeuren.",
    },
    {
      title: "Zet Weerzone op je telefoon",
      sub: "Piet: “Dan bereiken mijn seintjes je ook onderweg — op iPhone kan het alleen zo.”",
    },
  ];
```

`canAdvance()` wordt:

```ts
  function canAdvance(): boolean {
    if (step === 0) return postcode.trim().length >= 4 || !!gpsCoords;
    if (step === 4) return topics.length > 0;
    return true; // vragen 1-3 en de telefoon-stap mogen altijd door (overslaan is oké)
  }
```

En de bestaande stap-renders verhuizen mee: het `{step === 1 && (`-blok (agents+topics) wordt `{step === 4 && (`, het `{step === 2 && (`-blok (tijden) wordt `{step === 5 && (`.

- [ ] **Step 3: De drie vraag-stappen renderen**

Een herbruikbare chip in hetzelfde bestand (boven de `return`), plus de drie stap-blokken ná het `{step === 0 && (...)}`-blok:

```tsx
  function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-bold transition-colors"
        style={{
          borderColor: active ? "var(--wz-brand)" : "var(--wz-border)",
          background: active ? "var(--wz-brand-soft)" : "#fff",
          color: "var(--wz-text)",
        }}
      >
        {label}
      </button>
    );
  }

  function Reward({ text }: { text: string | null }) {
    if (!text) return null;
    return (
      <div
        className="rounded-2xl p-3.5 text-[13px] font-semibold leading-relaxed"
        style={{ background: "var(--wz-brand-soft)", color: "var(--wz-text)" }}
      >
        <span className="mr-1.5" aria-hidden>💬</span>
        Piet zegt dan bijvoorbeeld: {text}
      </div>
    );
  }
```

```tsx
          {step === 1 && (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {TRANSPORTS.map((o) => (
                  <Chip key={o.k} active={transport === o.k} label={o.t} onClick={() => setTransport(o.k)} />
                ))}
              </div>
              {transport && transport !== "home" && (
                <>
                  <div className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>Wanneer ga je meestal weg?</div>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTS.map((o) => (
                      <Chip key={o.k} active={depart === o.k} label={o.t} onClick={() => setDepart(o.k)} />
                    ))}
                  </div>
                  <div className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>En weer thuis?</div>
                  <div className="flex flex-wrap gap-2">
                    {HOMES.map((o) => (
                      <Chip key={o.k} active={home === o.k} label={o.t} onClick={() => setHome(o.k)} />
                    ))}
                  </div>
                </>
              )}
              <Reward text={TRANSPORTS.find((o) => o.k === transport)?.reward ?? null} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {OUTDOORS.map((o) => (
                  <Chip
                    key={o.k}
                    active={outdoor.includes(o.k)}
                    label={o.t}
                    onClick={() =>
                      setOutdoor((prev) => (prev.includes(o.k) ? prev.filter((x) => x !== o.k) : [...prev, o.k]))
                    }
                  />
                ))}
                <Chip active={outdoor.length === 0} label="Weinig, eigenlijk" onClick={() => setOutdoor([])} />
              </div>
              <Reward
                text={
                  outdoor.length === 0
                    ? "“Prima — dan hoor je me alleen als het echt uitmaakt.”"
                    : OUTDOORS.find((o) => o.k === outdoor[outdoor.length - 1])?.reward ?? null
                }
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2.5">
              {BUDGETS.map((o) => {
                const active = budget === o.k;
                return (
                  <label
                    key={o.k}
                    className="wz-card flex items-center gap-3 cursor-pointer transition-colors"
                    style={{
                      padding: 14,
                      borderColor: active ? "var(--wz-brand)" : "var(--wz-border)",
                      background: active ? "var(--wz-brand-soft)" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="wz-budget"
                      checked={active}
                      onChange={() => setBudget(o.k)}
                      className="w-[18px] h-[18px]"
                      style={{ accentColor: "var(--wz-brand)" }}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[15px]" style={{ color: "var(--wz-text)" }}>{o.t}</div>
                      <div className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>{o.d}</div>
                    </div>
                  </label>
                );
              })}
              <Reward text={BUDGETS.find((o) => o.k === budget)?.reward ?? null} />
            </div>
          )}
```

En ná het (verhuisde) `{step === 5 && (...)}`-blok de PWA-slotstap:

```tsx
          {step === 6 && (
            <div className="grid gap-4">
              <PwaInstallCard />
              <p className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
                Al gebeurd of liever niet? Dan ben je nu klaar — je vindt alles terug in Mijn Weerzone.
              </p>
            </div>
          )}
```

- [ ] **Step 4: Antwoorden opslaan in `persistAndGo`**

In `persistAndGo`, direct na het bestaande `updateProfile(...)`-blok (en vóór de `user_locations`-writes):

```ts
      // Piets vragen (spec agent-headsup §3C): antwoorden zijn momenten-rijen +
      // een persoonlijk budget. Fail-soft: mislukt dit, dan blokkeert het de
      // onboarding niet (bijstellen kan altijd in de regiekamer).
      const moments = buildOnboardingMoments(transport, depart, home, outdoor);
      const momentsResult = await replaceOnboardingMoments(supabase, uid, moments);
      const budgetResult = await updateProfile({ headsupBudget: budget });
      if (!momentsResult.ok || !budgetResult.ok) {
        console.error("[onboarding] momenten/budget opslaan mislukte (niet blokkerend)");
      }
      trackEvent("onboarding_profile", {
        transport: transport ?? "geen",
        outdoor: [...outdoor].sort().join(",") || "geen",
        moments: moments.length,
        budget,
      });
```

- [ ] **Step 5: Typecheck + handmatige rooktest**

Run: `npx tsc --noEmit 2>&1 | grep -i onboarding` — geen fouten.
Run: `npm run dev` → inloggen → `/app/onboarding` doorlopen: 7 stappen, chips togglen, beloningen verschijnen, afronden zonder fouten. (De momenten-rijen zelf verifieert Task 6 via de regiekamer, of nu al via de browser-console: `agent_moments` select geeft de eigen rijen.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/app/onboarding/OnboardingClient.tsx"
git commit -m "feat(onboarding): Piets drie vragen + telefoon-stap — antwoorden worden momenten"
```

---

### Task 5: "Jouw agents"-blok + toggle-route

**Files:**
- Create: `src/app/(site)/api/agents/subscriptions/toggle/route.ts`
- Create: `src/components/AgentsHubCard.tsx`
- Modify: `src/app/(site)/vandaag/page.tsx:5-6,65-75`
- Modify: `src/app/(site)/weer/[province]/[place]/page.tsx:16-17,256-257`
- Delete: `src/components/AgentSubscribeCard.tsx`, `src/components/ReedPushCard.tsx`

**Interfaces:**
- Consumes: `/api/agents/subscribe` (piet-mail aan, incl. magic-link-pad), `/api/agents/push/register` (push aan/uit per agent), `upsertAgentSubscription` + `isAgentKey` (`@/lib/agents/subscriptions`), `PwaInstallCard`/`isIOS`/`isStandalone` (Task 1), `trackEvent`.
- Produces:
  - `POST /api/agents/subscriptions/toggle` body `{ agent, province, place, channel: "email" | "push", active: boolean }` → `{ status: "on" | "off" }` (sessie-gebonden; Task 6 hergebruikt dit met dezelfde body).
  - `AgentsHubCard` client component met props `{ placeName, province, placeSlug }`.

- [ ] **Step 1: Schrijf de toggle-route**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findPlace, isNLProvince } from "@/lib/places-data";
import {
  AGENT_SUBSCRIPTIONS_TABLE,
  isAgentKey,
  upsertAgentSubscription,
} from "@/lib/agents/subscriptions";

export const dynamic = "force-dynamic";

/**
 * Abonnement aan/uit voor de ingelogde gebruiker (spec agent-headsup §3E/F).
 * Aan = upsert (heractiveert bestaande rij); uit = unsubscribed_at zetten.
 * Push-áánzetten loopt níét hierlangs maar via /api/agents/push/register,
 * omdat daar de apparaat-registratie bij hoort.
 */
export async function POST(req: Request) {
  let body: { agent?: unknown; province?: unknown; place?: unknown; channel?: unknown; active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const agent = body.agent;
  const province = typeof body.province === "string" ? body.province : "";
  const placeSlug = typeof body.place === "string" ? body.place : "";
  const channel = body.channel === "push" ? "push" : body.channel === "email" ? "email" : null;
  const active = body.active === true;
  if (!isAgentKey(agent) || !isNLProvince(province) || !channel || !findPlace(province, placeSlug)) {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log eerst in" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (active) {
    const result = await upsertAgentSubscription(admin, {
      userId: user.id,
      agent,
      province,
      placeSlug,
      channel,
    });
    if (!result.ok) {
      console.error("[subscriptions/toggle] aanzetten mislukt:", result.reason);
      return NextResponse.json({ error: "Opslaan lukte even niet" }, { status: 500 });
    }
    return NextResponse.json({ status: "on" });
  }

  const { error } = await admin
    .from(AGENT_SUBSCRIPTIONS_TABLE)
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("agent", agent)
    .eq("province", province)
    .eq("place_slug", placeSlug)
    .eq("channel", channel);
  if (error) {
    console.error("[subscriptions/toggle] uitzetten mislukt:", error.message);
    return NextResponse.json({ error: "Uitzetten lukte even niet" }, { status: 500 });
  }
  return NextResponse.json({ status: "off" });
}
```

- [ ] **Step 2: Schrijf `src/components/AgentsHubCard.tsx`**

Panel-logica: vier schakelbare regels — Piet-mail (email), Piet-heads-ups (push), Reed (push), Koos (push). Push-helpers (`urlBase64ToUint8Array`, service-worker-registratie) komen letterlijk uit de oude `ReedPushCard`; het magic-link-pad uit `AgentSubscribeCard`.

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import PwaInstallCard, { isIOS, isStandalone } from "@/components/PwaInstallCard";

interface AgentsHubCardProps {
  placeName: string;
  province: string;
  placeSlug: string;
}

type RowKey = "piet_email" | "piet_push" | "reed_push" | "koos_push";
type SessionState = "loading" | "anon" | "auth";

const ROWS: Array<{
  key: RowKey;
  agent: "piet" | "reed" | "koos";
  channel: "email" | "push";
  dot: string;
  title: string;
  desc: string;
}> = [
  { key: "piet_email", agent: "piet", channel: "email", dot: "#0284C7", title: "Piet — ochtendbericht", desc: "Elke ochtend het weer in je mail, 48 uur vooruit" },
  { key: "piet_push", agent: "piet", channel: "push", dot: "#0284C7", title: "Piet — seintjes op dit toestel", desc: "Alleen bij een omslag die jouw dag raakt, max 3 per dag" },
  { key: "reed_push", agent: "reed", channel: "push", dot: "#EA580C", title: "Reed — weeralarm", desc: "Melding zodra er een waarschuwing geldt voor de provincie" },
  { key: "koos_push", agent: "koos", channel: "push", dot: "#059669", title: "Koos — weekendtip", desc: "Hooguit één seintje, alleen do t/m za" },
];

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * "Jouw agents" (spec agent-headsup §3E): één blok met alle agent-schakelaars
 * voor de getoonde plaats. Vervangt AgentSubscribeCard + ReedPushCard.
 * Per-gebruiker-status client-side (pagina's zijn gecachet; RLS owner-only).
 */
export default function AgentsHubCard({ placeName, province, placeSlug }: AgentsHubCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<SessionState>("loading");
  const [on, setOn] = useState<Record<RowKey, boolean>>({ piet_email: false, piet_push: false, reed_push: false, koos_push: false });
  const [busy, setBusy] = useState<RowKey | null>(null);
  const [email, setEmail] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownTracked = useRef(false);

  const pushSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const needsInstall = isIOS() && !isStandalone();

  useEffect(() => {
    if (!shownTracked.current) {
      shownTracked.current = true;
      trackEvent("subscribe_shown", { surface: "agents_hub", place: placeSlug, province });
    }
    // Terugkeer uit de magic-link mail (zelfde contract als voorheen).
    const returned = new URLSearchParams(window.location.search).get("abonnement");
    if (returned === "piet") {
      setOn((s) => ({ ...s, piet_email: true }));
      trackEvent("subscribe_confirmed", { agent: "piet", channel: "email", place: placeSlug, province, via: "magic_link" });
    }
    if (returned === "mislukt") setError("Het bevestigen lukte net niet — probeer de schakelaar hieronder.");

    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setSession("anon");
        return;
      }
      const { data } = await supabase
        .from("agent_subscriptions")
        .select("agent, channel")
        .eq("province", province)
        .eq("place_slug", placeSlug)
        .is("unsubscribed_at", null);
      if (cancelled) return;
      const next: Record<RowKey, boolean> = { piet_email: false, piet_push: false, reed_push: false, koos_push: false };
      const pushGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
      for (const row of (data ?? []) as { agent: string; channel: string }[]) {
        const key = `${row.agent}_${row.channel}` as RowKey;
        if (key in next) next[key] = row.channel !== "push" || pushGranted;
      }
      setOn(next);
      setSession("auth");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, province, placeSlug]);

  async function enablePush(row: (typeof ROWS)[number]) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error(permission === "denied" ? "Meldingen zijn geblokkeerd in je browserinstellingen." : "Geen toestemming gegeven.");
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error("Meldingen zijn even niet beschikbaar.");
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));
    const res = await fetch("/api/agents/push/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent: row.agent, province, place: placeSlug, subscription: subscription.toJSON() }),
    });
    if (!res.ok) throw new Error("Dat lukte even niet.");
  }

  async function toggle(row: (typeof ROWS)[number]) {
    if (busy) return;
    setBusy(row.key);
    setError(null);
    const turningOn = !on[row.key];
    trackEvent(turningOn ? "subscribe_started" : "subscribe_disabled", { agent: row.agent, channel: row.channel, place: placeSlug, province });
    try {
      if (turningOn && row.channel === "push") {
        await enablePush(row);
      } else {
        const res = await fetch("/api/agents/subscriptions/toggle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agent: row.agent, province, place: placeSlug, channel: row.channel, active: turningOn }),
        });
        if (!res.ok) throw new Error("Dat lukte even niet.");
      }
      setOn((s) => ({ ...s, [row.key]: turningOn }));
      if (turningOn) trackEvent("subscribe_confirmed", { agent: row.agent, channel: row.channel, place: placeSlug, province, via: "one_tap" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(null);
    }
  }

  async function subscribeAnonymous(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }
    setBusy("piet_email");
    setError(null);
    trackEvent("subscribe_started", { agent: "piet", channel: "email", place: placeSlug, province, via: "magic_link" });
    try {
      const res = await fetch("/api/agents/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent: "piet", province, place: placeSlug, email: email.trim() }),
      });
      if (!res.ok) throw new Error("Dat lukte even niet — probeer het zo nog eens.");
      setMailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dat lukte even niet.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="rounded-3xl bg-slate-900 p-6 text-white shadow-[0_18px_42px_-22px_rgba(15,23,42,0.9)] sm:p-7"
      aria-label={`Jouw agents voor ${placeName}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Jouw agents · gratis</p>
      <h2 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl">
        Piet, Reed en Koos kennen {placeName}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">
        Jouw eigen meteo-team: ze melden zich alleen als het ertoe doet — stilte hoort erbij.
      </p>

      {session === "loading" && <div className="mt-5 h-32 animate-pulse rounded-2xl bg-white/10" />}

      {session === "anon" && (
        mailSent ? (
          <p className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-4 text-[14px] leading-relaxed text-white/85">
            De mail is onderweg naar {email.trim() || "je inbox"}. Eén klik daarin en Piet staat elke ochtend voor je klaar — daarna kun je hier ook de seintjes aanzetten.
          </p>
        ) : (
          <form onSubmit={subscribeAnonymous} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="je@voorbeeld.nl"
              autoComplete="email"
              required
              className="w-full flex-1 rounded-2xl border border-white/30 bg-white/15 px-4 py-3.5 text-[15px] font-semibold text-white placeholder:text-white/50 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? "Even geduld…" : "Zet Piet aan"}
            </button>
          </form>
        )
      )}

      {session === "auth" && (
        <div className="mt-5 grid gap-2.5">
          {ROWS.map((row) => {
            const pushRow = row.channel === "push";
            if (pushRow && !pushSupported && !needsInstall) return null;
            const active = on[row.key];
            const blocked = pushRow && needsInstall && !active;
            return (
              <div key={row.key} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-3.5">
                <span className="inline-block h-2 w-2 flex-none rounded-full" style={{ background: row.dot }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">{row.title}</div>
                  <div className="truncate text-[12px] text-white/60">{row.desc}</div>
                </div>
                {blocked ? (
                  <span className="flex-none text-[11px] font-bold text-white/50">op beginscherm eerst</span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    aria-label={`${row.title} ${active ? "uitzetten" : "aanzetten"}`}
                    onClick={() => void toggle(row)}
                    disabled={busy !== null}
                    className="relative h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-60"
                    style={{ background: active ? "#34d399" : "rgba(255,255,255,0.18)" }}
                  >
                    <span
                      className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all"
                      style={{ left: active ? 22 : 2 }}
                    />
                  </button>
                )}
              </div>
            );
          })}
          {needsInstall && <PwaInstallCard compact />}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-amber-300">{error}</p>}
    </section>
  );
}
```

- [ ] **Step 3: Beide oppervlakken omzetten en de oude kaarten verwijderen**

In `src/app/(site)/vandaag/page.tsx`: de imports `AgentSubscribeCard`/`ReedPushCard` vervangen door `import AgentsHubCard from "@/components/AgentsHubCard";` en in `appendedContent` de twee kaart-elementen vervangen door één:

```tsx
            <AgentsHubCard
              placeName={subscribePlace.name}
              province={subscribePlace.province}
              placeSlug={placeRouteSlug(subscribePlace)}
            />
```

(`PietScoreCard` erboven blijft staan.)

In `src/app/(site)/weer/[province]/[place]/page.tsx` idem: beide imports en beide elementen (regel 256-257) vervangen door één `<AgentsHubCard placeName={place.name} province={province} placeSlug={slug} />`.

Daarna:

```bash
git rm src/components/AgentSubscribeCard.tsx src/components/ReedPushCard.tsx
```

Run: `npx tsc --noEmit 2>&1 | grep -iE "AgentSubscribeCard|ReedPushCard"` — geen verwijzingen meer.

- [ ] **Step 4: Rooktest + commit**

Run: `npm run dev` → `/vandaag` ingelogd: vier rijen zichtbaar, Piet-mail-toggle aan/uit werkt (rij in `agent_subscriptions` heractiveert/deactiveert), push-toggle vraagt browser-toestemming. Uitgelogd: e-mailveld.

```bash
git add src/components/AgentsHubCard.tsx "src/app/(site)/api/agents/subscriptions/toggle/route.ts" "src/app/(site)/vandaag/page.tsx" "src/app/(site)/weer/[province]/[place]/page.tsx"
git commit -m "feat(agents): Jouw agents-blok — één paneel voor Piet, Reed en Koos per plaats"
```

---

### Task 6: Regiekamer in Mijn Weerzone

**Files:**
- Create: `src/components/RegiekamerPanel.tsx`
- Modify: `src/app/(site)/mijn-weerzone/page.tsx:74-85` (agents-sectie)

**Interfaces:**
- Consumes: `listMyMoments`/`insertMoment`/`updateMoment`/`deleteMoment` + `MOMENT_KIND_LABEL` (Task 2), `POST /api/agents/subscriptions/toggle` (Task 5), `POST /api/agents/test-push` (plan 1), `updateProfile({ headsupBudget })` (Task 3), browser-selects op `agent_subscriptions` en `push_devices` (RLS select-own).
- Produces: `RegiekamerPanel` client component met props `{ initialBudget: "moments_only" | "standard" | "low" }`; server-pagina levert het budget uit `user_profile`.

- [ ] **Step 1: Schrijf `src/components/RegiekamerPanel.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";
import { MOMENT_KIND_LABEL, type AgentMoment, type MomentKind } from "@/lib/agents/moments-shared";
import {
  listMyMoments,
  insertMoment,
  updateMoment,
  deleteMoment,
  type MomentInsert,
} from "@/lib/agents/moments-client";

interface SubscriptionRow {
  id: string;
  agent: string;
  province: string;
  place_slug: string;
  channel: string;
  unsubscribed_at: string | null;
}

type Budget = "moments_only" | "standard" | "low";

const AGENT_LABEL: Record<string, string> = { piet: "Piet", reed: "Reed", koos: "Koos" };
const CHANNEL_LABEL: Record<string, string> = { email: "mail", push: "seintjes" };
const BUDGET_OPTIONS: Array<{ k: Budget; t: string }> = [
  { k: "moments_only", t: "Alleen mijn momenten" },
  { k: "standard", t: "Elke omslag (max 3/dag)" },
  { k: "low", t: "Zo min mogelijk (1/dag)" },
];
const DAY_LABELS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const KIND_OPTIONS: MomentKind[] = ["commute", "dog", "outdoor", "laundry", "sport", "custom"];

function fmtTime(t: string): string {
  return t.slice(0, 5);
}

function fmtPlace(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Regiekamer (spec agent-headsup §3F): abonnementen per plaats × kanaal,
 * de eigen momenten, gekoppelde apparaten + test-push, en het persoonlijke
 * budget. Dit paneel is later letterlijk de Pro-bundelpagina.
 */
export default function RegiekamerPanel({ initialBudget }: { initialBudget: Budget }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [moments, setMoments] = useState<AgentMoment[]>([]);
  const [devices, setDevices] = useState<number>(0);
  const [budget, setBudget] = useState<Budget>(initialBudget);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentMoment | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);
      const [subsRes, momentRows, devicesRes] = await Promise.all([
        supabase
          .from("agent_subscriptions")
          .select("id, agent, province, place_slug, channel, unsubscribed_at")
          .order("province")
          .order("place_slug"),
        listMyMoments(supabase),
        supabase.from("push_devices").select("id").is("disabled_at", null),
      ]);
      if (cancelled) return;
      setSubs((subsRes.data ?? []) as SubscriptionRow[]);
      setMoments(momentRows);
      setDevices(devicesRes.data?.length ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function toggleSub(row: SubscriptionRow) {
    setBusy(row.id);
    const activate = row.unsubscribed_at !== null;
    const res = await fetch("/api/agents/subscriptions/toggle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent: row.agent, province: row.province, place: row.place_slug, channel: row.channel, active: activate }),
    });
    if (res.ok) {
      setSubs((s) => s.map((r) => (r.id === row.id ? { ...r, unsubscribed_at: activate ? null : new Date().toISOString() } : r)));
    }
    setBusy(null);
  }

  async function saveBudget(next: Budget) {
    setBudget(next);
    await updateProfile({ headsupBudget: next });
    trackEvent("regiekamer_budget", { budget: next });
  }

  async function sendTestPush() {
    setBusy("test");
    setTestResult(null);
    try {
      const res = await fetch("/api/agents/test-push", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { sent?: number; devices?: number; reason?: string };
      setTestResult(
        json.sent
          ? `Verstuurd naar ${json.sent} van je ${json.devices} apparaten — kijk op je toestel.`
          : json.reason ?? "Er ging iets mis — probeer het zo nog eens.",
      );
    } catch {
      setTestResult("Er ging iets mis — probeer het zo nog eens.");
    } finally {
      setBusy(null);
    }
  }

  async function saveMoment(values: MomentInsert, id?: string) {
    if (!userId) return;
    if (id) {
      const { ok } = await updateMoment(supabase, id, values);
      if (ok) setMoments((m) => m.map((x) => (x.id === id ? { ...x, ...values, transport: values.transport ?? null } : x)));
    } else {
      const { ok } = await insertMoment(supabase, userId, values);
      if (ok) setMoments(await listMyMoments(supabase));
    }
    setEditing(null);
    setAdding(false);
  }

  async function removeMoment(id: string) {
    const { ok } = await deleteMoment(supabase, id);
    if (ok) setMoments((m) => m.filter((x) => x.id !== id));
    setEditing(null);
  }

  return (
    <div className="grid gap-3">
      {/* Abonnementen per plaats × kanaal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waar je agents werken</p>
        {subs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nog geen abonnementen — zet een agent aan via Vandaag of een plaatspagina.</p>
        ) : (
          <div className="mt-2 grid gap-2">
            {subs.map((row) => {
              const active = row.unsubscribed_at === null;
              return (
                <div key={row.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">
                      {AGENT_LABEL[row.agent] ?? row.agent} · {fmtPlace(row.place_slug)}
                    </div>
                    <div className="text-xs text-slate-500">{CHANNEL_LABEL[row.channel] ?? row.channel}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    aria-label={`${AGENT_LABEL[row.agent] ?? row.agent} voor ${fmtPlace(row.place_slug)} ${active ? "uitzetten" : "aanzetten"}`}
                    onClick={() => void toggleSub(row)}
                    disabled={busy !== null}
                    className="relative h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-60"
                    style={{ background: active ? "#10b981" : "#e2e8f0" }}
                  >
                    <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: active ? 22 : 2 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Momenten */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jouw momenten</p>
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }} className="text-xs font-black text-slate-900 hover:underline">
            + Toevoegen
          </button>
        </div>
        {moments.length === 0 && !adding ? (
          <p className="mt-2 text-sm text-slate-500">
            Nog geen momenten. Vertel Piet je ritme — dan weet hij wanneer een bui jou raakt.
          </p>
        ) : (
          <div className="mt-2 grid gap-2">
            {moments.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setEditing(m); setAdding(false); }}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-slate-300"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900">{m.label}</div>
                  <div className="text-xs text-slate-500">
                    {MOMENT_KIND_LABEL[m.kind]} · {m.days.map((d) => DAY_LABELS[d - 1]).join(" ")} · {fmtTime(m.windowStart)}–{fmtTime(m.windowEnd)}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">Bewerk</span>
              </button>
            ))}
          </div>
        )}
        {(editing || adding) && (
          <MomentEditor
            initial={editing}
            onSave={(values) => void saveMoment(values, editing?.id)}
            onDelete={editing ? () => void removeMoment(editing.id) : undefined}
            onCancel={() => { setEditing(null); setAdding(false); }}
          />
        )}
      </div>

      {/* Budget */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hoe vaak mag Piet zich melden</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => void saveBudget(o.k)}
              className="rounded-full border px-4 py-2 text-[13px] font-bold transition-colors"
              style={{
                borderColor: budget === o.k ? "#0f172a" : "#e2e8f0",
                background: budget === o.k ? "#0f172a" : "#fff",
                color: budget === o.k ? "#fff" : "#0f172a",
              }}
            >
              {o.t}
            </button>
          ))}
        </div>
      </div>

      {/* Apparaten + test-push */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apparaten</p>
        <p className="mt-1 text-sm text-slate-700">
          {devices === 0
            ? "Nog geen apparaat met meldingen — zet een agent-seintje aan via Vandaag."
            : `${devices} ${devices === 1 ? "apparaat ontvangt" : "apparaten ontvangen"} meldingen.`}
        </p>
        {devices > 0 && (
          <button
            type="button"
            onClick={() => void sendTestPush()}
            disabled={busy !== null}
            className="mt-3 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            {busy === "test" ? "Versturen…" : "Stuur een testmelding"}
          </button>
        )}
        {testResult && <p className="mt-2 text-sm font-semibold text-slate-600">{testResult}</p>}
      </div>
    </div>
  );
}

function MomentEditor({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: AgentMoment | null;
  onSave: (values: MomentInsert) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<MomentKind>(initial?.kind ?? "custom");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [days, setDays] = useState<number[]>(initial?.days ?? [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(initial ? fmtTime(initial.windowStart) : "17:00");
  const [end, setEnd] = useState(initial ? fmtTime(initial.windowEnd) : "18:00");

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  const valid = label.trim().length > 0 && days.length > 0 && start < end;

  return (
    <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap gap-1.5">
        {KIND_OPTIONS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className="rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              borderColor: kind === k ? "#0f172a" : "#e2e8f0",
              background: kind === k ? "#0f172a" : "#fff",
              color: kind === k ? "#fff" : "#0f172a",
            }}
          >
            {MOMENT_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Bijvoorbeeld: Avondronde"
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900"
      />
      <div className="flex flex-wrap gap-1.5">
        {DAY_LABELS.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDay(i + 1)}
            className="rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              borderColor: days.includes(i + 1) ? "#0f172a" : "#e2e8f0",
              background: days.includes(i + 1) ? "#0f172a" : "#fff",
              color: days.includes(i + 1) ? "#fff" : "#0f172a",
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
        <span>tot</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave({ kind, label: label.trim(), days, windowStart: start, windowEnd: end })}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-40"
          >
            Bewaar
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500">
            Annuleer
          </button>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="text-xs font-bold text-red-500 hover:underline">
            Verwijder
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mounten in Mijn Weerzone**

In `src/app/(site)/mijn-weerzone/page.tsx`:

Import toevoegen:

```ts
import RegiekamerPanel from "@/components/RegiekamerPanel";
```

Het profiel-type op regel 42 uitbreiden met `headsup_budget?: string`. De agents-sectie (regel 74-85) wordt — per-plaats-rijen leidend, landelijke toggles als fallback eronder:

```tsx
        {/* Regiekamer — abonnementen, momenten, apparaten (spec §3F) */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
              Regiekamer — Piet, Reed en Koos
            </h2>
            <Link href="/vandaag" className="text-[11px] font-bold text-white/75 hover:text-white">
              Naar Vandaag →
            </Link>
          </div>
          <RegiekamerPanel
            initialBudget={
              profile?.headsup_budget === "moments_only" || profile?.headsup_budget === "low"
                ? profile.headsup_budget
                : "standard"
            }
          />
          <details className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <summary className="cursor-pointer text-xs font-bold text-white/70">
              Landelijke instellingen (gelden als er geen plaats-abonnement is)
            </summary>
            <div className="mt-3">
              <AgentTogglesForm initial={agentPreferences} />
            </div>
          </details>
        </section>
```

- [ ] **Step 3: Rooktest + typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep -iE "Regiekamer|mijn-weerzone"` — geen fouten.
Run: `npm run dev` → `/mijn-weerzone` ingelogd: abonnementen tonen (incl. de Winkel-testrijen), toggle werkt, momenten-lijst toont "Avondronde", bewerken/toevoegen/verwijderen werkt, apparaten-teller klopt, testmelding komt aan, budget-chips slaan op (check `user_profile.headsup_budget` na klik).

```bash
git add src/components/RegiekamerPanel.tsx "src/app/(site)/mijn-weerzone/page.tsx"
git commit -m "feat(agents): regiekamer in Mijn Weerzone — abonnementen, momenten, apparaten, test-push"
```

---

### Task 7: Verificatie, deploy & e2e ("het moet ECHT werken")

**Files:** geen nieuwe code (alleen spec-status + geheugen).

- [ ] **Step 1: Volledige typecheck + build**

```bash
npx tsc --noEmit   # eigen bestanden schoon; bekende drift elders negeren
npm run build      # groen; /app/onboarding, /mijn-weerzone, /vandaag in de output
```

- [ ] **Step 2: Migratie live (Rowan)**

`supabase/migrations/20260712_headsup_budget.sql` in de Supabase SQL editor. Verificatie kan zonder service-role: na stap 4 hieronder bewijst de budget-chip in de regiekamer de kolom (opslaan zonder fout = kolom bestaat).

- [ ] **Step 3: Deploy**

```bash
git status --short          # geen zwervers meecommitteren
npx vercel deploy --prod    # check auto-alias naar weerzone.nl (anders: npx vercel promote <url>)
```

- [ ] **Step 4: E2E-keten (desktop + Rowans iPhone)**

1. **Onboarding**: op weerzone.nl inloggen → `/app/onboarding` doorlopen met fiets + hond + "bij elke omslag" → regiekamer toont de aangemaakte momenten (Ochtendrit/Avondrit/Ochtendronde/Avondronde) en budget "Elke omslag".
2. **Hub**: op `/vandaag` staan vier rijen; Piet-seintjes aanzetten → rij `piet/push` in `agent_subscriptions` (zichtbaar in de regiekamer); uitzetten → toggle uit.
3. **Regiekamer**: testmelding-knop → notificatie op het toestel; moment bewerken → gewijzigd venster zichtbaar na herladen.
4. **iOS-pad (Rowan)**: op de iPhone zonder standalone → hub toont "op beginscherm eerst" + installatie-instructie; na A2HS en openen vanaf het icoon → push aanzetten lukt en testmelding komt binnen (spec §5.6).
5. **Budget-bewijs**: budget op "Zo min mogelijk" → `?dry=1` van de motor blijft werken; de handhaving zelf (max 1) bewijst zich bij de eerstvolgende dag met meerdere omslagen — noteer als open observatie naast de bestaande twee uit plan 1.
6. **PostHog**: events `onboarding_profile`, `subscribe_confirmed` (met `channel`), `pwa_install_*` zichtbaar in het project; `push_sent` volgt bij de eerste echte omslag-push.

- [ ] **Step 5: Spec-status + geheugen bijwerken + afsluitende commit**

In `docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md` de status-regel bijwerken (plan 2 live, open observaties benoemen). Geheugenbestand `project_agents_headsup_push.md` bijwerken.

```bash
git add docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md
git commit -m "docs: heads-up-push gezicht (plan 2) live — status in spec"
```
