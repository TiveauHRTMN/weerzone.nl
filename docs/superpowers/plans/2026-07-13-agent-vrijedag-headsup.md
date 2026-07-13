# Vrije-dag heads-up & routine-schakelaar — implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Piet is ook relevant op dagen zonder vaste routine: opt-in ochtend-heads-up op momentloze dagen, dagje weg als eendags-moment (incl. bestemmings-weer), routine-pauze + vakantiestand in de regiekamer.

**Architecture:** Alles rijdt op de bestaande motor (cron `agent-headsup-push`, elke 30 min): `agent_moments` krijgt een optionele `date` + bestemmings-plaats, `user_profile` krijgt drie voorkeursvlaggen. Pure logica (venster-matching, freeday-kandidaat, pauzes) blijft in de I/O-vrije libs zodat hij met tsx-scripts testbaar is; de cron doet alleen bezorging. Loaders zijn fail-soft met fallback-selects zodat een deploy vóór de migratie niets breekt (les: proactive-agents-crons waren dood door ongemigreerd schema).

**Tech Stack:** Next.js 16 App Router, Supabase (service-role in crons, RLS owner-only client), web-push (bestaand), tsx-testscripts met `node:assert`.

## Global Constraints

- User-facing copy is Nederlands, Piets stem, geen meteorologie-jargon en geen bronnamen (KNMI/Mariana) in UI (memory: feedback_tone, feedback_no_source_names_in_ui).
- Over werk/routine komt nóóit een vraag-push (spec §2.1).
- Vrije-dag heads-up: alleen opt-in (`freeday_headsup`), alleen op dagen zonder actief moment, telt in het Piet-budget, `low`-budget krijgt hem nooit (spec §2.2/2.4).
- Reed blijft altijd aan — vakantiestand raakt Reed niet (Reed heeft zijn eigen cron; wij passen die niet aan).
- Migratie draait uitsluitend Rowan in de Supabase SQL editor; code moet fail-soft zijn zolang de migratie niet gedraaid is.
- Geen nieuwe cron in `vercel.json` — alles rijdt op `agent-headsup-push` en `piet-morning-email`.
- `tsc --noEmit` heeft bekende drift buiten Weerzone (o.a. `tripfit/`) — beoordeel alleen fouten in aangeraakte bestanden.
- Testscripts: repo heeft geen unit-runner; testscripts zijn `npx tsx scripts/test-*.ts` met `node:assert` (bestaand patroon). Gebruik relatieve imports (geen `@/`-alias in scripts) en importeer nooit een module met `import "server-only"`.

---

### Task 1: Migratie-SQL + gedeelde types + fail-soft loaders

**Files:**
- Create: `supabase/migrations/20260713_freeday_dagplan.sql`
- Modify: `src/lib/agents/moments-shared.ts`
- Modify: `src/lib/agents/moments-client.ts` (interface `MomentInsert`, `MomentRow`, `fromRow`, `toRow`, `listMyMoments`)
- Modify: `src/lib/agents/moments.ts` (`loadMomentsForUsers`)
- Modify: `src/lib/agents/headsup-log.ts` (`loadHeadsupBudgets` → `loadHeadsupProfiles`)

**Interfaces:**
- Produces: `AgentMoment` met `date: string | null; province: string | null; placeSlug: string | null`; `MomentInsert` met dezelfde velden optioneel; `HeadsupProfile { budget: HeadsupBudget; routinePaused: boolean; pausedUntil: string | null; freedayHeadsup: boolean }`; `loadHeadsupProfiles(admin, userIds): Promise<Map<string, HeadsupProfile>>`.

- [ ] **Step 1: Schrijf de migratie**

```sql
-- Vrije-dag heads-up & dagplan (spec 2026-07-13): eendags-momenten met
-- optionele bestemming + routine-pauze/vakantiestand/opt-in op het profiel.
-- Draai dit in de Supabase SQL editor (production). Idempotent.
alter table public.agent_moments
  add column if not exists date date null,
  add column if not exists province text null,
  add column if not exists place_slug text null;

alter table public.user_profile
  add column if not exists routine_paused boolean not null default false,
  add column if not exists paused_until date null,
  add column if not exists freeday_headsup boolean not null default false;
```

- [ ] **Step 2: Breid `AgentMoment` uit in `moments-shared.ts`**

Voeg aan het interface toe (na `transport`):

```ts
  /** "YYYY-MM-DD": eendags-moment — geldt alléén die datum, `days` wordt genegeerd. */
  date: string | null;
  /** Optionele bestemming (dagje weg): de motor bewaakt dan óók dat weer. */
  province: string | null;
  placeSlug: string | null;
```

- [ ] **Step 3: `moments-client.ts` — insert/rows/select meenemen**

`MomentInsert` krijgt optionele velden; `MomentRow`, `fromRow`, `toRow` en de select in `listMyMoments` nemen ze mee. `listMyMoments` krijgt een fallback voor het pre-migratie-geval (kolom bestaat nog niet ⇒ oude select, nieuwe velden `null`):

```ts
export interface MomentInsert {
  kind: MomentKind;
  label: string;
  days: number[];
  windowStart: string;
  windowEnd: string;
  transport?: MomentTransport | null;
  date?: string | null;
  province?: string | null;
  placeSlug?: string | null;
}

interface MomentRow {
  id: string;
  kind: MomentKind;
  label: string;
  days: number[];
  window_start: string;
  window_end: string;
  transport: MomentTransport | null;
  date?: string | null;
  province?: string | null;
  place_slug?: string | null;
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
    date: row.date ?? null,
    province: row.province ?? null,
    placeSlug: row.place_slug ?? null,
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
    date: m.date ?? null,
    province: m.province ?? null,
    place_slug: m.placeSlug ?? null,
  };
}

export async function listMyMoments(supabase: SupabaseClient): Promise<AgentMoment[]> {
  const full = await supabase
    .from(AGENT_MOMENTS_TABLE)
    .select("id, kind, label, days, window_start, window_end, transport, date, province, place_slug")
    .order("created_at", { ascending: true });
  const res = full.error
    ? await supabase
        .from(AGENT_MOMENTS_TABLE)
        .select("id, kind, label, days, window_start, window_end, transport")
        .order("created_at", { ascending: true })
    : full;
  if (res.error) return [];
  return ((res.data ?? []) as MomentRow[]).map(fromRow);
}
```

Let op: `toRow` stuurt de nieuwe kolommen altijd mee — pre-migratie faalt een insert mét `date` dan hard, maar `insertMoment`/`replaceOnboardingMoments` geven al `{ ok: false }` terug en de UI toont een nette fout. Ná de migratie is dit een non-issue. **Uitzondering:** stuur de nieuwe kolommen alleen mee als ze gezet zijn, zodat de bestaande onboarding pre-migratie blijft werken:

```ts
function toRow(userId: string, m: MomentInsert) {
  const row: Record<string, unknown> = {
    user_id: userId,
    kind: m.kind,
    label: m.label,
    days: m.days,
    window_start: m.windowStart,
    window_end: m.windowEnd,
    transport: m.transport ?? null,
  };
  if (m.date != null) row.date = m.date;
  if (m.province != null) row.province = m.province;
  if (m.placeSlug != null) row.place_slug = m.placeSlug;
  return row;
}
```

(Gebruik deze tweede variant; de eerste staat er alleen om het verschil expliciet te maken.)

- [ ] **Step 4: `moments.ts` — `loadMomentsForUsers` met fallback-select**

Zelfde patroon: eerst de volle select (incl. `date, province, place_slug`), bij een error de oude select. Map de nieuwe velden met `?? null` het `AgentMoment` in (raw-type krijgt `date?: string | null; province?: string | null; place_slug?: string | null`).

- [ ] **Step 5: `headsup-log.ts` — `loadHeadsupProfiles`**

Vervang `loadHeadsupBudgets` door (oude functie verwijderen, alleen de cron gebruikte hem — verifieer met grep):

```ts
export interface HeadsupProfile {
  budget: HeadsupBudget;
  routinePaused: boolean;
  /** "YYYY-MM-DD" of null — stil t/m die datum (vakantiestand / vandaag vrij). */
  pausedUntil: string | null;
  freedayHeadsup: boolean;
}

const DEFAULT_PROFILE: HeadsupProfile = {
  budget: "standard",
  routinePaused: false,
  pausedUntil: null,
  freedayHeadsup: false,
};

/** Fail-soft: lege map ⇒ defaults; pre-migratie valt terug op alleen budget. */
export async function loadHeadsupProfiles(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, HeadsupProfile>> {
  const out = new Map<string, HeadsupProfile>();
  if (!userIds.length) return out;
  const full = await admin
    .from("user_profile")
    .select("id, headsup_budget, routine_paused, paused_until, freeday_headsup")
    .in("id", userIds);
  const res = full.error
    ? await admin.from("user_profile").select("id, headsup_budget").in("id", userIds)
    : full;
  if (res.error) {
    console.error("[headsup-log] profiel niet leesbaar:", res.error.message);
    return out;
  }
  for (const row of (res.data ?? []) as {
    id: string; headsup_budget: string | null;
    routine_paused?: boolean | null; paused_until?: string | null; freeday_headsup?: boolean | null;
  }[]) {
    out.set(row.id, {
      budget:
        row.headsup_budget === "moments_only" || row.headsup_budget === "low"
          ? row.headsup_budget
          : "standard",
      routinePaused: row.routine_paused ?? false,
      pausedUntil: row.paused_until ?? null,
      freedayHeadsup: row.freeday_headsup ?? false,
    });
  }
  return out;
}
```

Export `DEFAULT_PROFILE` zodat de cron hem als fallback kan gebruiken. De cron compileert nu even niet (gebruikt nog `loadHeadsupBudgets`) — dat lost Task 3 op; draai tsc daarom pas dáár.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260713_freeday_dagplan.sql src/lib/agents/moments-shared.ts src/lib/agents/moments-client.ts src/lib/agents/moments.ts src/lib/agents/headsup-log.ts
git commit -m "feat(agents): datamodel dagplan — eendags-momenten, bestemming, pauzes (fail-soft loaders)"
```

---

### Task 2: Pure logica — datum-vensters, pauzes, vrije-dag-kandidaat

**Files:**
- Modify: `src/lib/agents/moments-shared.ts` (verplaats `MomentWindow` + `momentWindowsForDay` + helpers hierheen; voeg `effectiveMoments`, `isPausedOn`, `nlDateISO` toe)
- Modify: `src/lib/agents/moments.ts` (re-export, verwijder verplaatste code)
- Modify: `src/lib/agents/headsup-push.ts` (`freedayCandidate`, `inFreedayWindow`)
- Create: `scripts/test-dagplan.ts`

**Interfaces:**
- Consumes: `AgentMoment` (met `date`) uit Task 1.
- Produces: `nlDateISO(d: Date): string`; `momentWindowsForDay(moments, day)` (nu óók datum-momenten); `effectiveMoments(moments: AgentMoment[], routinePaused: boolean): AgentMoment[]`; `isPausedOn(pausedUntil: string | null, dayISO: string): boolean`; `inFreedayWindow(now: Date): boolean`; `freedayCandidate(placeName: string, hourly: HourlyForecast[], now: Date): PushCandidate | null`.

- [ ] **Step 1: Schrijf het testscript (faalt eerst)**

`scripts/test-dagplan.ts` — relatieve imports, geen server-only:

```ts
/** Rooktests dagplan-logica: npx tsx scripts/test-dagplan.ts */
import assert from "node:assert";
import {
  momentWindowsForDay,
  effectiveMoments,
  isPausedOn,
  nlDateISO,
  type AgentMoment,
} from "../src/lib/agents/moments-shared";
import { freedayCandidate, inFreedayWindow } from "../src/lib/agents/headsup-push";
import type { HourlyForecast } from "../src/lib/types";

const base = { id: "x", label: "T", windowStart: "10:00", windowEnd: "12:00", transport: null, province: null, placeSlug: null };
const wk = (kind: AgentMoment["kind"], days: number[]): AgentMoment => ({ ...base, kind, days, date: null });
const oneOff = (date: string): AgentMoment => ({ ...base, kind: "outdoor", days: [], date });

// Zondag 2026-07-19 12:00 NL (10:00Z in CEST)
const sunday = new Date("2026-07-19T10:00:00Z");
assert.equal(nlDateISO(sunday), "2026-07-19");

// datum-moment matcht alleen op zijn datum; days genegeerd
assert.equal(momentWindowsForDay([oneOff("2026-07-19")], sunday).length, 1);
assert.equal(momentWindowsForDay([oneOff("2026-07-20")], sunday).length, 0);
// weekdag-moment blijft werken (7 = zondag)
assert.equal(momentWindowsForDay([wk("dog", [7])], sunday).length, 1);
assert.equal(momentWindowsForDay([wk("dog", [1])], sunday).length, 0);

// routine-pauze filtert alleen commute
const mix = [wk("commute", [7]), wk("dog", [7])];
assert.deepEqual(effectiveMoments(mix, true).map((m) => m.kind), ["dog"]);
assert.equal(effectiveMoments(mix, false).length, 2);

// vakantiestand: t/m de datum stil
assert.equal(isPausedOn("2026-07-19", "2026-07-19"), true);
assert.equal(isPausedOn("2026-07-18", "2026-07-19"), false);
assert.equal(isPausedOn(null, "2026-07-19"), false);

// freeday-venster: 07:00–09:00 NL
assert.equal(inFreedayWindow(new Date("2026-07-19T06:00:00Z")), true);  // 08:00 NL
assert.equal(inFreedayWindow(new Date("2026-07-19T10:00:00Z")), false); // 12:00 NL

// freeday-kandidaat: droog → nat om 14:00 NL
const mkHourly = (fn: (i: number) => number): HourlyForecast[] =>
  Array.from({ length: 18 }, (_, i) => ({
    time: new Date(Date.parse("2026-07-19T04:00:00Z") + i * 3600_000).toISOString(),
    temperature: 20, precipitation: fn(i), windSpeed: 10, weatherCode: 3,
  } as HourlyForecast));
const now = new Date("2026-07-19T05:30:00Z"); // 07:30 NL
const cand = freedayCandidate("Winkel", mkHourly((i) => (i >= 8 ? 1 : 0)), now);
assert.ok(cand && cand.agent === "piet" && cand.category === "freeday");
assert.equal(cand!.key, "piet|freeday|2026-07-19");
assert.ok(cand!.title.includes("Winkel"));
// hele dag droog → ook een kandidaat (waarde-eerst), zelfde sleutel
const dryAll = freedayCandidate("Winkel", mkHourly(() => 0), now);
assert.ok(dryAll && dryAll.key === "piet|freeday|2026-07-19");

console.log("test-dagplan: alles groen");
```

Controleer de shape van `HourlyForecast` in `src/lib/types.ts` en pas de mock aan op de echte velden vóór je verder gaat.

- [ ] **Step 2: Draai het script — verwacht FAIL**

Run: `npx tsx scripts/test-dagplan.ts`
Expected: FAIL — `momentWindowsForDay`/`nlDateISO` bestaan niet in moments-shared.

- [ ] **Step 3: Verplaats en implementeer in `moments-shared.ts`**

Verplaats uit `moments.ts` (letterlijk overnemen): `MomentWindow`, `nlIsoWeekday`, `nlTimeOnDay`, `momentWindowsForDay`. Voeg toe:

```ts
/** NL-kalenderdatum ("YYYY-MM-DD") van een Date. */
export function nlDateISO(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/** Bij routine-pauze tellen woon-werk-momenten niet mee (vensters blijven bewaard). */
export function effectiveMoments(moments: AgentMoment[], routinePaused: boolean): AgentMoment[] {
  return routinePaused ? moments.filter((m) => m.kind !== "commute") : moments;
}

/** Vakantiestand / "vandaag vrij": stil t/m de datum (inclusief). */
export function isPausedOn(pausedUntil: string | null, dayISO: string): boolean {
  return !!pausedUntil && pausedUntil >= dayISO;
}
```

En pas `momentWindowsForDay` aan:

```ts
export function momentWindowsForDay(moments: AgentMoment[], day: Date): MomentWindow[] {
  const weekday = nlIsoWeekday(day);
  const dayISO = nlDateISO(day);
  return moments
    .filter((moment) => (moment.date ? moment.date === dayISO : moment.days.includes(weekday)))
    .map((moment) => ({
      moment,
      start: nlTimeOnDay(day, moment.windowStart),
      end: nlTimeOnDay(day, moment.windowEnd),
    }))
    .filter((w) => w.end > w.start);
}
```

In `moments.ts`: verwijder de verplaatste code en re-export zodat bestaande imports blijven werken:

```ts
export {
  momentWindowsForDay,
  effectiveMoments,
  isPausedOn,
  nlDateISO,
  type MomentWindow,
} from "@/lib/agents/moments-shared";
```

- [ ] **Step 4: `freedayCandidate` + `inFreedayWindow` in `headsup-push.ts`**

```ts
/** Vrije-dag-heads-up-venster in NL-uren (ochtendbericht-moment). */
const FREEDAY_FROM = 7;
const FREEDAY_TO = 9;

export function inFreedayWindow(now: Date): boolean {
  const hour = parseInt(
    now.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  return hour >= FREEDAY_FROM && hour < FREEDAY_TO;
}

/**
 * Vrije-dag-heads-up (spec 2026-07-13 §3B): waarde eerst — het dagbeeld ís de
 * push, de dagplan-uitnodiging is de staart. Elke variant levert iets, dus er
 * is altijd een kandidaat zodra er uurdata is.
 */
export function freedayCandidate(
  placeName: string,
  hourly: HourlyForecast[],
  now: Date,
): PushCandidate | null {
  const dayISO = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const key = `piet|freeday|${dayISO}`;
  const first = hourly
    .map((h) => ({ at: new Date(h.time), wet: h.precipitation >= WET_MM_PER_HOUR }))
    .find((h) => h.at >= new Date(now.getTime() - 3600_000));
  if (!first) return null;
  const transitions = rainTransitions(hourly, now);
  const invite = "Plannen vandaag? Vertel het Piet — dan waak ik erover.";
  const mk = (title: string, body: string): PushCandidate => ({
    agent: "piet", category: "freeday", key, matchedMoment: false, title, body,
  });
  const t = transitions[0];
  if (t?.kind === "dry_to_wet") {
    const uur = t.at.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
    return mk(`Vrije dag? Tot ${uur} droog in ${placeName}`, `Daarna komt er regen. ${invite}`);
  }
  if (t?.kind === "wet_to_dry") {
    const uur = t.at.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
    return mk(`Vrije dag? Vanaf ${uur} droog in ${placeName}`, `Tot die tijd is het nat. ${invite}`);
  }
  return first.wet
    ? mk(`Vrije dag? Het blijft vandaag nat in ${placeName}`, `Binnenplannen dan maar — ga je toch, dan hoor je het van mij.`)
    : mk(`Vrije dag? Heel de dag droog in ${placeName}`, invite);
}
```

- [ ] **Step 5: Draai het testscript — verwacht PASS**

Run: `npx tsx scripts/test-dagplan.ts`
Expected: `test-dagplan: alles groen`

Run ook `npx tsc --noEmit` en filter op de aangeraakte bestanden (de cron mag nog rood zijn op `loadHeadsupBudgets`, dat is Task 3).

- [ ] **Step 6: Commit**

```bash
git add src/lib/agents/moments-shared.ts src/lib/agents/moments.ts src/lib/agents/headsup-push.ts scripts/test-dagplan.ts
git commit -m "feat(agents): pure dagplan-logica — datum-vensters, pauzes, vrije-dag-kandidaat (+tests)"
```

---

### Task 3: Motor-integratie in cron `agent-headsup-push`

**Files:**
- Modify: `src/app/(site)/api/cron/agent-headsup-push/route.ts`

**Interfaces:**
- Consumes: `loadHeadsupProfiles`/`DEFAULT_PROFILE` (Task 1), `effectiveMoments`/`isPausedOn`/`nlDateISO` (Task 2), `freedayCandidate`/`inFreedayWindow` (Task 2).
- Produces: n.v.t. (route).

- [ ] **Step 1: Imports en profielen**

Vervang de import `loadHeadsupBudgets` door `loadHeadsupProfiles, DEFAULT_PROFILE`; importeer `effectiveMoments, isPausedOn, nlDateISO` uit `@/lib/agents/moments` en `freedayCandidate, inFreedayWindow` uit `@/lib/agents/headsup-push`. In de `Promise.all`: `loadHeadsupBudgets(admin, allUserIds)` → `loadHeadsupProfiles(admin, allUserIds)` (hernoem `budgetByUser` naar `profileByUser`).

- [ ] **Step 2: Verlopen eendags-momenten opruimen + bestemmings-jobs**

Direct ná de `Promise.all` (vóór de job-loop):

```ts
const todayISO = nlDateISO(now);

// Verlopen eendags-momenten zijn inert — ruim ze op (fail-soft).
if (!dry) {
  const { error: cleanupError } = await admin
    .from("agent_moments")
    .delete()
    .lt("date", todayISO);
  if (cleanupError) console.error("[headsup-push] opruimen eendags-momenten faalde:", cleanupError.message);
}

// Bestemmings-jobs: een dagje-weg-moment mét plaats laat Piet ook dáár het
// weer bewaken voor die gebruiker (spec 2026-07-13 §3C).
const pietPushUsers = new Set(pietSubs.map((s) => s.userId));
for (const [userId, userMoments] of momentsByUser) {
  if (!pietPushUsers.has(userId)) continue;
  for (const m of userMoments) {
    if (m.date !== todayISO || !m.province || !m.placeSlug) continue;
    addSub({ province: m.province, placeSlug: m.placeSlug, userId }, "piet");
  }
}
```

Let op: `addSub` en `jobs` staan nu vóór de `Promise.all` gedefinieerd — dat blijft zo; alleen deze extra `addSub`-aanroepen komen erna. `AGENT_MOMENTS_TABLE` kan i.p.v. het string-literal (import bestaat al via moments).

- [ ] **Step 3: Per-gebruiker: pauzes, plaats-filter, freeday-kandidaat**

Vervang binnen de job-loop het blok vanaf `const windows = ...` t/m `const eligible = ...` door:

```ts
        const profile = profileByUser.get(userId) ?? DEFAULT_PROFILE;
        // Vakantiestand / "vandaag vrij": Piet en Koos zwijgen (Reed niet — eigen cron).
        if (isPausedOn(profile.pausedUntil, todayISO)) continue;

        const allWindows = momentWindowsForDay(
          effectiveMoments(momentsByUser.get(userId) ?? [], profile.routinePaused),
          now,
        );
        // Momenten mét plaats gelden alleen voor de job van die plaats;
        // momenten zonder plaats gelden voor de abonnements-plaatsen.
        const windows = allWindows.filter((w) =>
          w.moment.placeSlug
            ? w.moment.province === job.province && w.moment.placeSlug === job.placeSlug
            : true,
        );
        const cands: PushCandidate[] = [];
        if (job.pietUsers.includes(userId)) {
          cands.push(...pietPushCandidates(job.placeName, ctx.weather.hourly, windows, now));
          // Vrije-dag-heads-up: opt-in, nooit bij `low`, alleen als er vandaag
          // geen enkel actief moment is, en alleen in het ochtendvenster.
          if (
            profile.freedayHeadsup &&
            profile.budget !== "low" &&
            allWindows.length === 0 &&
            inFreedayWindow(now)
          ) {
            const freeday = freedayCandidate(job.placeName, ctx.weather.hourly, now);
            if (freeday) cands.push(freeday);
          }
        }
        if (job.koosUsers.includes(userId)) cands.push(...koosCands);
        if (!stateByUser.has(userId)) {
          stateByUser.set(userId, { sentKeys: new Set<string>(), countsByAgent: new Map<string, number>() });
        }
        const state = stateByUser.get(userId)!;
        // moments_only: alleen momenten-treffers — behalve de vrije-dag-vraag,
        // daar heeft de gebruiker expliciet om gevraagd (toggle).
        const eligible =
          profile.budget === "moments_only"
            ? cands.filter((c) => c.agent !== "piet" || c.matchedMoment || c.category === "freeday")
            : cands;
        const picked = selectWithinBudget(
          eligible,
          state.sentKeys,
          state.countsByAgent,
          profile.budget === "low" ? { piet: 1 } : undefined,
        );
```

- [ ] **Step 4: Push-URL per kandidaat**

In de bezorg-loop: de freeday-push moet naar de dagplan-invuller leiden. Vervang de vaste `url` door:

```ts
              url:
                candidate.category === "freeday"
                  ? "https://weerzone.nl/vandaag?dagplan=1"
                  : `https://weerzone.nl/vandaag#${candidate.agent}`,
```

- [ ] **Step 5: Typecheck + dry-run-shape**

Run: `npx tsc --noEmit` → geen fouten in `agent-headsup-push/route.ts`, `headsup-log.ts`, `moments*.ts`, `headsup-push.ts`.
De functionele dry-run (`GET /api/cron/agent-headsup-push?dry=1` met `Authorization: Bearer $CRON_SECRET`) volgt na deploy in Task 7.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/api/cron/agent-headsup-push/route.ts"
git commit -m "feat(agents): motor kent pauzes, eendags-/bestemmings-momenten en de vrije-dag-heads-up"
```

---

### Task 4: Profiel-actie + plaats-zoek-API

**Files:**
- Modify: `src/app/actions.ts` (`updateProfile`)
- Create: `src/app/(site)/api/agents/place-search/route.ts`

**Interfaces:**
- Produces: `updateProfile({ routinePaused?, pausedUntil?, freedayHeadsup? })` (naast bestaande velden); `GET /api/agents/place-search?q=zand` → `{ results: Array<{ name: string; province: string; slug: string }> }` (max 8).

- [ ] **Step 1: `updateProfile` uitbreiden**

Args-type aanvullen:

```ts
  headsupBudget?: "moments_only" | "standard" | "low";
  routinePaused?: boolean;
  /** "YYYY-MM-DD" of null om de pauze op te heffen. */
  pausedUntil?: string | null;
  freedayHeadsup?: boolean;
```

`updates`-type verruimen naar `Record<string, string | number | boolean | null>` en toevoegen:

```ts
  if (args.routinePaused !== undefined) updates.routine_paused = args.routinePaused;
  if (args.pausedUntil !== undefined) updates.paused_until = args.pausedUntil;
  if (args.freedayHeadsup !== undefined) updates.freeday_headsup = args.freedayHeadsup;
```

- [ ] **Step 2: Plaats-zoek-route**

`src/app/(site)/api/agents/place-search/route.ts` (server-side over `NL_PLACES`; places.json mag nooit de client-bundle in):

```ts
import { NextResponse } from "next/server";
import { NL_PLACES, placeRouteSlug } from "@/lib/places-data";

export const dynamic = "force-dynamic";

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Lichtgewicht plaats-zoeker voor de dagplan-invuller (max 8 resultaten). */
export async function GET(req: Request) {
  const q = norm(new URL(req.url).searchParams.get("q")?.trim() ?? "");
  if (q.length < 2) return NextResponse.json({ results: [] });
  const starts: typeof NL_PLACES = [];
  const contains: typeof NL_PLACES = [];
  for (const place of NL_PLACES) {
    if (starts.length >= 8) break;
    const name = norm(place.name);
    if (name.startsWith(q)) starts.push(place);
    else if (contains.length < 8 && name.includes(q)) contains.push(place);
  }
  const results = [...starts, ...contains].slice(0, 8).map((place) => ({
    name: place.name,
    province: place.province,
    slug: placeRouteSlug(place),
  }));
  return NextResponse.json({ results });
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit` (aangeraakte bestanden schoon), dan:

```bash
git add src/app/actions.ts "src/app/(site)/api/agents/place-search/route.ts"
git commit -m "feat(agents): profiel-pauzes in updateProfile + plaats-zoek-API voor dagplan"
```

---

### Task 5: Regiekamer — Ritme & vrije dagen + eendags-momenten tonen

**Files:**
- Modify: `src/components/RegiekamerPanel.tsx`
- Modify: `src/app/(site)/mijn-weerzone/page.tsx`

**Interfaces:**
- Consumes: `updateProfile` met nieuwe velden (Task 4); `AgentMoment.date` (Task 1); `nlDateISO` uit `@/lib/agents/moments-shared`.
- Produces: `RegiekamerPanel`-props: `{ initialBudget: Budget; initialRoutinePaused: boolean; initialPausedUntil: string | null; initialFreedayHeadsup: boolean }`.

- [ ] **Step 1: Props + state**

`RegiekamerPanel` krijgt de drie extra props (defaults: `false`, `null`, `false`) en state `routinePaused`, `pausedUntil`, `freedayHeadsup`, `ritmeError`, plus een `vacationDate`-inputstate (string, default ""). Bewaar-patroon = exact het bestaande `saveBudget`-patroon (optimistisch, terugdraaien bij `!result?.ok`, `busy`-vlag, foutmelding "Bewaren lukte even niet — probeer het zo nog eens.").

```ts
async function saveRitme(patch: { routinePaused?: boolean; pausedUntil?: string | null; freedayHeadsup?: boolean }) {
  const prev = { routinePaused, pausedUntil, freedayHeadsup };
  if (patch.routinePaused !== undefined) setRoutinePaused(patch.routinePaused);
  if (patch.pausedUntil !== undefined) setPausedUntil(patch.pausedUntil);
  if (patch.freedayHeadsup !== undefined) setFreedayHeadsup(patch.freedayHeadsup);
  setRitmeError(null);
  setBusy("ritme");
  try {
    const result = await updateProfile(patch);
    if (!result?.ok) throw new Error();
    trackEvent("regiekamer_ritme", patch as Record<string, unknown>);
  } catch {
    setRoutinePaused(prev.routinePaused);
    setPausedUntil(prev.pausedUntil);
    setFreedayHeadsup(prev.freedayHeadsup);
    setRitmeError("Bewaren lukte even niet — probeer het zo nog eens.");
  } finally {
    setBusy(null);
  }
}
```

- [ ] **Step 2: Kaart "Ritme & vrije dagen"**

Nieuwe kaart tussen "Jouw momenten" en "Budget", zelfde kaart-styling (`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`, micro-kop). Drie blokken:

1. **Vaste routine** — switch (zelfde switch-markup als bij abonnementen, `role="switch"`): aan = "Piet bewaakt je vaste ritten." / uit = "Gepauzeerd — je ritten tellen even niet mee." → `saveRitme({ routinePaused: !routinePaused })` (let op: switch toont `!routinePaused` als "aan").
2. **Vrije-dag-vraag** — switch: "Piet mag op vrije dagen 's ochtends vragen wat ik ga doen." → `saveRitme({ freedayHeadsup: !freedayHeadsup })`.
3. **Even weg** — als `pausedUntil && pausedUntil >= nlDateISO(new Date())`: tekst "Stil t/m {pausedUntil} — alleen bij echt noodweer hoor je Reed." + knop "Zet weer aan" → `saveRitme({ pausedUntil: null })`. Anders: `<input type="date">` (min = vandaag) + knop "Zet stil t/m die datum" (disabled zolang leeg) → `saveRitme({ pausedUntil: vacationDate })`.

`{ritmeError && <p className="mt-2 text-sm font-semibold text-red-600">{ritmeError}</p>}` onderaan de kaart.

- [ ] **Step 3: Eendags-momenten in de lijst en editor**

In de momenten-lijst de dagregel:

```tsx
{m.date
  ? `${MOMENT_KIND_LABEL[m.kind]} · eenmalig ${m.date} · ${fmtTime(m.windowStart)}–${fmtTime(m.windowEnd)}`
  : `${MOMENT_KIND_LABEL[m.kind]} · ${m.days.map((d) => DAY_LABELS[d - 1]).join(" ")} · ${fmtTime(m.windowStart)}–${fmtTime(m.windowEnd)}`}
```

In `MomentEditor`: `const isOneOff = !!initial?.date;` — verberg de dag-chips bij `isOneOff`, en:

```ts
const valid = label.trim().length > 0 && (isOneOff || days.length > 0) && start < end;
// onSave:
onSave({
  kind, label: label.trim(), windowStart: start, windowEnd: end,
  ...(isOneOff
    ? { days: [], date: initial!.date, province: initial!.province, placeSlug: initial!.placeSlug }
    : { days }),
});
```

- [ ] **Step 4: `mijn-weerzone/page.tsx` — props doorgeven**

Profiel-cast uitbreiden met `routine_paused?: boolean; paused_until?: string | null; freeday_headsup?: boolean` en:

```tsx
<RegiekamerPanel
  initialBudget={...bestaand...}
  initialRoutinePaused={profile?.routine_paused ?? false}
  initialPausedUntil={profile?.paused_until ?? null}
  initialFreedayHeadsup={profile?.freeday_headsup ?? false}
/>
```

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (aangeraakte bestanden schoon).

```bash
git add src/components/RegiekamerPanel.tsx "src/app/(site)/mijn-weerzone/page.tsx"
git commit -m "feat(regiekamer): ritme & vrije dagen — routine-pauze, vakantiestand, vrije-dag-toggle"
```

---

### Task 6: DagplanSheet op /vandaag + onboarding-chip + mail-CTA

**Files:**
- Create: `src/components/DagplanSheet.tsx`
- Modify: `src/app/(site)/vandaag/page.tsx`
- Modify: `src/app/(site)/app/onboarding/OnboardingClient.tsx`
- Modify: `src/app/(site)/api/cron/piet-morning-email/route.ts`

**Interfaces:**
- Consumes: `insertMoment`/`MomentInsert` met `date`/`province`/`placeSlug` (Task 1), `updateProfile({ pausedUntil, freedayHeadsup })` (Task 4), `GET /api/agents/place-search` (Task 4), `nlDateISO` uit moments-shared.
- Produces: `<DagplanSheet />` (client, geen props) — verbergt zichzelf voor uitgelogde bezoekers; opent automatisch bij `?dagplan=1`.

- [ ] **Step 1: `DagplanSheet.tsx`**

Client component, opbouw naar het patroon van `RegiekamerPanel` (browser-supabase, `busy`-vlaggen, nette foutcopy). Kern:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";
import { insertMoment } from "@/lib/agents/moments-client";
import { nlDateISO } from "@/lib/agents/moments-shared";

interface PlaceHit { name: string; province: string; slug: string }

const DAGDEEL: Array<{ k: string; t: string; start: string; end: string }> = [
  { k: "ochtend", t: "Ochtend", start: "09:00", end: "13:00" },
  { k: "middag", t: "Middag", start: "12:00", end: "17:00" },
  { k: "dag", t: "Hele dag", start: "09:00", end: "18:00" },
];

/**
 * Dagplan-invuller (spec 2026-07-13 §3C): "Vandaag anders?" — vandaag vrij
 * (eendags-pauze) of een dagje weg (eendags-moment, optioneel met bestemming
 * die Piet dan ook bewaakt). Alleen zichtbaar voor ingelogde gebruikers.
 */
export default function DagplanSheet() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "trip">("idle");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [place, setPlace] = useState<PlaceHit | null>(null);
  const [dagdeel, setDagdeel] = useState(DAGDEEL[2]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  useEffect(() => {
    if (searchParams?.get("dagplan") === "1") setOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setHits([]); return; }
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/agents/place-search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { results?: PlaceHit[] };
        if (seq === searchSeq.current) setHits(json.results ?? []);
      } catch { /* zoeken is best-effort */ }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!userId) return null;

  async function vandaagVrij() {
    setBusy(true);
    setError(null);
    try {
      const result = await updateProfile({ pausedUntil: nlDateISO(new Date()) });
      if (!result?.ok) throw new Error();
      trackEvent("dagplan_saved", { mode: "vrij" });
      setDone("Genoteerd — vandaag geen seintjes over je vaste ritme. Morgen sta ik weer voor je klaar.");
    } catch {
      setError("Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(false);
    }
  }

  async function bewaarDagjeWeg() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const { ok } = await insertMoment(supabase, userId, {
        kind: "outdoor",
        label: place ? `Dagje weg — ${place.name}` : "Dagje weg",
        days: [],
        date: nlDateISO(new Date()),
        windowStart: dagdeel.start,
        windowEnd: dagdeel.end,
        province: place?.province ?? null,
        placeSlug: place?.slug ?? null,
      });
      if (!ok) throw new Error();
      trackEvent("dagplan_saved", { mode: "trip", met_plaats: !!place, dagdeel: dagdeel.k });
      setDone(
        place
          ? `Genoteerd — ik hou ${place.name} voor je in de gaten. Slaat het weer om, dan hoor je het van mij.`
          : "Genoteerd — ik hou het weer voor je in de gaten. Slaat het om, dan hoor je het van mij.",
      );
    } catch {
      setError("Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(false);
    }
  }

  /* render: va-card met kop "Vandaag anders?" ... (zie stap-tekst hieronder) */
}
```

Render-structuur (zelfde kaartstijl als de andere /vandaag-kaarten, `va-card`):
- Dicht (`!open`): kaart met kop "Vandaag anders dan anders?" + subtekst "Vrije dag of een dagje weg? Vertel het Piet." + knop "Vertel het Piet" → `setOpen(true)`.
- Open, `done` gezet: alleen de bevestigingstekst + knopje "Sluit".
- Open, `mode === "idle"`: twee grote knoppen "Vandaag vrij" (→ `vandaagVrij()`) en "Dagje weg" (→ `setMode("trip")`).
- Open, `mode === "trip"`: tekstveld "Waarheen? (mag leeg)" met zoekresultaten-lijst (klik = `setPlace(hit); setQuery(hit.name); setHits([])`), dagdeel-chips, knop "Bewaar" (→ `bewaarDagjeWeg()`, disabled bij `busy`) en "Terug".
- `error` onderaan in rood.

- [ ] **Step 2: Mount op /vandaag**

In `vandaag/page.tsx` binnen `appendedContent`, direct na `<AgentsHubCard ... />`:

```tsx
<DagplanSheet />
```

(plus import). `DagplanSheet` gebruikt `useSearchParams` — hij staat al onder een `<Suspense>`-boundary via `VandaagContent`, dus dat is gedekt. Buiten het `subscribePlace`-blok plaatsen zodat hij ook zonder plaats rendert: zet hem als sibling in de fragment — `appendedContent={<>{subscribePlace ? (...) : null}<DagplanSheet /></>}`.

- [ ] **Step 3: Onboarding-chip (slotvraag bij budget-stap)**

In `OnboardingClient.tsx`, stap 3 (budget): onder de `BUDGETS`-radio's en boven de `Reward`:

```tsx
<div className="wz-micro mt-2" style={{ color: "var(--wz-text-mute)" }}>
  Mag Piet op een vrije dag &rsquo;s ochtends vragen wat je gaat doen?
</div>
<div className="flex flex-wrap gap-2">
  <Chip active={freeday} label="Ja, handig" onClick={() => setFreeday(true)} />
  <Chip active={!freeday} label="Nee, alleen mijn ritme" onClick={() => setFreeday(false)} />
</div>
```

State: `const [freeday, setFreeday] = useState(false);` (opt-in ⇒ default uit). In `persistAndGo`: `updateProfile({ headsupBudget: budget })` wordt `updateProfile({ headsupBudget: budget, freedayHeadsup: freeday })`, en het `onboarding_profile`-event krijgt `freeday` erbij.

- [ ] **Step 4: Ochtendmail-CTA (statisch, geen per-gebruiker-state)**

In `buildMorningEmailHtml` (piet-morning-email), vlak vóór het footer-/uitschrijfblok, een vast blokje (bewust ongepersonaliseerd — de dagplan-pagina zelf is de gate; per-gebruiker conditioneel maken is een latere verfijning):

```ts
  const dagplanBlock = `
    <div style="margin:22px 0;padding:16px 18px;background:#eef4ff;border-radius:14px;text-align:center;">
      <p style="margin:0 0 10px;font-size:14px;color:#1e293b;font-weight:600;">
        Vandaag anders dan anders — vrij of een dagje weg?
      </p>
      <a href="https://weerzone.nl/vandaag?dagplan=1"
         style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;">
        Vertel het Piet →
      </a>
    </div>`;
```

en voeg `${dagplanBlock}` toe in de template op die plek (zoek het footer-blok onderin de template-string op en zet het erboven).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (aangeraakte bestanden schoon) en `npx tsx scripts/test-dagplan.ts` (nog groen).

```bash
git add src/components/DagplanSheet.tsx "src/app/(site)/vandaag/page.tsx" "src/app/(site)/app/onboarding/OnboardingClient.tsx" "src/app/(site)/api/cron/piet-morning-email/route.ts"
git commit -m "feat(agents): dagplan-invuller op /vandaag, vrije-dag-chip in onboarding, mail-CTA"
```

---

### Task 7: Migratie-gate, deploy en verificatie

**Files:**
- Modify: `docs/superpowers/specs/2026-07-13-agent-vrijedag-headsup-design.md` (statusregel)

- [ ] **Step 1: Volledige typecheck + tests**

Run: `npx tsc --noEmit` — geen fouten buiten de bekende drift (`tripfit/` e.a.); `npx tsx scripts/test-dagplan.ts` groen.

- [ ] **Step 2: MIGRATIE-GATE (Rowan)** — geef Rowan de inhoud van `supabase/migrations/20260713_freeday_dagplan.sql` om in de Supabase SQL editor (production) te draaien. Wacht op bevestiging. Verifieer daarna functioneel (na deploy: vakantiestand zetten in de regiekamer slaat op zonder fout) of via een service-role select op de nieuwe kolommen.

- [ ] **Step 3: Deploy volgens vast recept** — schone `git archive HEAD`-export in de scratchpad + gekopieerde `.vercel/`, `vercel deploy --prod --yes --scope tiveauhrtmns-projects`, daarna alias-check op weerzone.nl (zo nodig `vercel promote`). Let op: prod-deploy alleen na letterlijk akkoord van Rowan.

- [ ] **Step 4: Rooktest live** — `/`, `/vandaag` 200; `/api/agents/place-search?q=zand` geeft resultaten met Zandvoort; cron-dry-run: `GET https://weerzone.nl/api/cron/agent-headsup-push?dry=1` met `Authorization: Bearer $CRON_SECRET` geeft een JSON-rapport zonder error.

- [ ] **Step 5: E2e (Rowan, geauthenticeerd)** — regiekamer: routine-pauze aan/uit, vakantiestand zetten + "Zet weer aan", vrije-dag-toggle; /vandaag: DagplanSheet → "Dagje weg" met plaats → moment "eenmalig <datum>" zichtbaar in regiekamer; "Vandaag vrij" → vakantiestand vandaag in regiekamer zichtbaar; PostHog: `dagplan_saved`, `regiekamer_ritme`.

- [ ] **Step 6: Statusregel in de spec bijwerken** ("GEBOUWD & LIVE <datum>, open observaties: eerste echte freeday-push in het wild") + commit:

```bash
git add docs/superpowers/specs/2026-07-13-agent-vrijedag-headsup-design.md
git commit -m "docs: vrije-dag heads-up live — status in spec"
```

---

## Bewuste afwijkingen van de spec (klein, benoemen bij oplevering)

1. **Timing heads-up**: vast ochtendvenster 07:00–09:00 NL i.p.v. "rond de bestaande notification_time" — die tijd leeft in auth-metadata die de cron niet goedkoop per batch kan lezen; de dedup-sleutel houdt het op één per dag.
2. **Mail-fallback**: statische CTA in élke ochtendmail i.p.v. conditioneel per gebruiker — de 457-regelige mail-cron heeft geen per-ontvanger-profielstate; conditioneel maken is een latere verfijning.
3. **Vervoer bij dagje weg**: weggelaten (YAGNI) — het venster + de bestemming zijn wat de motor nodig heeft.
