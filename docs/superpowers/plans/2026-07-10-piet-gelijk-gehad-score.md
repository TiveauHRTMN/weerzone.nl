# Piet gelijk-gehad-score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dagelijkse job die Piets voorspelde dagmax per geabonneerde plaats opslaat en 's avonds vergelijkt met de gemeten dagmax; de score verschijnt in de ochtendmail en op /piet (= /vandaag#piet). Handoff blok (c), `docs/handoff-agents-abonnementen-2026-07-10.md`.

**Architecture:** Nieuwe tabel `piet_scorecard` (service-role-only). Eén cron-route `/api/cron/piet-scorecard` met twee fasen: `?phase=predict` (05:50 UTC, vóór de 06:00-mail — multi-model-mediaan dagmax per plaats met een actief Piet-abonnement + De Bilt als landelijke referentie) en `?phase=verify` (20:30 UTC — gemeten dagmax van het dichtstbijzijnde KNMI-station via de EDR 10-min-data). De ochtendmail leest de afgeronde rij van gisteren en voegt één zin in Piets stem toe; `/vandaag` toont een score-kaart. **Nul LLM** — alles pure wiskunde.

**Tech Stack:** Next.js 16 App Router, Supabase (service role), Open-Meteo multi-model (zelfde BLEND_MODELS als `src/lib/mariana/studio/temps.ts`), KNMI EDR API (`src/lib/knmi-edr.ts`), Vercel crons (`vercel.json`).

## Global Constraints

- **Nul LLM per abonnee/plaats** — score is pure wiskunde (handoff schaalprincipe).
- **Geen bronnamen in user-facing copy**: geen "KNMI", geen "Mariana" in mail of UI (`memory/feedback_no_source_names_in_ui.md`). "gemeten" is prima.
- **Net Nederlands, geen meteo-jargon**, decimalen met komma ("1,4°"), Piet als karakter (`memory/feedback_weerzone_tone.md`).
- **Meting is ground truth** (`memory/feedback_observation_beats_model.md`).
- **Crons vuren alleen als ze in `vercel.json` staan** — repo gebruikt `vercel.json`, niet `vercel.ts`; volg de repo-conventie.
- **DDL via de Supabase SQL editor** (geen CLI; connection string leeg), daarna verifiëren via service-role API (`memory/feedback_prod_db_migrations.md`).
- **Geen unit-test-runner in de repo** — verificatie = `npx tsc --noEmit` + `npm run build` + `npx tsx`-smoketests + handmatige cron-trigger. Geen test-framework introduceren (CLAUDE.md).
- Alle DB-helpers **best-effort/fail-soft** zoals `src/lib/mariana/regions/storage.ts`, zodat deploy vóór de migratie veilig is.
- Cron-auth: Bearer `CRON_SECRET`, exact zoals `piet-morning-email/route.ts:301-309`.
- Commits op branch `feat/studio-tiktok-autopost`; Co-Authored-By-trailer verplicht.

## File Structure

| Bestand | Verantwoordelijkheid |
|---|---|
| `supabase/migrations/20260710_piet_scorecard.sql` (nieuw) | Tabel + indexes + RLS (deny alle client-rollen) |
| `src/lib/agents/scorecard.ts` (nieuw) | Types, score-wiskunde (verdict/stats/formatting), Supabase-persistentie |
| `src/lib/knmi-edr.ts` (wijzigen) | `fetchStationDayMaxTemp()` — gemeten dagmax per station |
| `src/app/(site)/api/cron/piet-scorecard/route.ts` (nieuw) | predict- + verify-fase |
| `vercel.json` (wijzigen) | Twee cron-entries |
| `src/app/(site)/api/cron/piet-morning-email/route.ts` (wijzigen) | Gisteren-score-zin in Piets verhaal |
| `src/components/PietScoreCard.tsx` (nieuw) | Score-kaart (server component) |
| `src/app/(site)/vandaag/page.tsx` (wijzigen) | Kaart mounten in appendedContent |

---

### Task 1: Migratie `piet_scorecard`

**Files:**
- Create: `supabase/migrations/20260710_piet_scorecard.sql`

**Interfaces:**
- Produces: tabel `public.piet_scorecard` met unieke sleutel `(forecast_date, province, place_slug)`; kolommen zoals hieronder. Latere tasks upserten met `onConflict: "forecast_date,province,place_slug"`.

- [ ] **Step 1: Schrijf de migratie**

```sql
-- Gelijk-gehad-score (handoff 2026-07-10, blok c): Piets voorspelde dagmax per
-- plaats ('s ochtends opgeslagen) + de gemeten dagmax van het dichtstbijzijnde
-- weerstation ('s avonds ingevuld). Voorspeld vs gemeten = de moat; pure
-- wiskunde, nul LLM. Schrijf-/leespad is uitsluitend de service role (crons +
-- server components); er is geen client-pad, dus RLS zonder policies = dicht.
--
-- Draai dit in de Supabase SQL editor (production). Idempotent.

create table if not exists public.piet_scorecard (
  id uuid primary key default gen_random_uuid(),
  forecast_date date not null,          -- de NL-dag waarover voorspeld is
  province text not null,
  place_slug text not null,
  place_name text not null,
  lat double precision not null,
  lon double precision not null,
  predicted_max numeric(4,1) not null,  -- multi-model-mediaan, ochtendrun
  predicted_at timestamptz not null default now(),
  measured_max numeric(4,1),            -- stations-dagmax, avondrun
  measured_at timestamptz,
  station_id text,
  station_name text
);

create unique index if not exists piet_scorecard_day_place_idx
  on public.piet_scorecard (forecast_date, province, place_slug);

-- Avondrun-leespad: onafgemaakte rijen van vandaag/gisteren.
create index if not exists piet_scorecard_unmeasured_idx
  on public.piet_scorecard (forecast_date)
  where measured_max is null;

-- RLS: geen policies = geen client-toegang (les van 20260703_studio_rls.sql).
alter table public.piet_scorecard enable row level security;
revoke all on table public.piet_scorecard from anon;
revoke all on table public.piet_scorecard from authenticated;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260710_piet_scorecard.sql
git commit -m "feat(agents): schema voor Piets gelijk-gehad-score (handoff blok c)"
```

(De migratie zelf wordt in Task 7 op prod gedraaid en geverifieerd — code die de tabel raakt is fail-soft, dus volgorde is veilig.)

---

### Task 2: Score-lib `src/lib/agents/scorecard.ts`

**Files:**
- Create: `src/lib/agents/scorecard.ts`

**Interfaces:**
- Consumes: `createSupabaseAdminClient` uit `@/lib/supabase/admin`; tabel uit Task 1.
- Produces (gebruikt door Tasks 4-6):
  - `nlDateISO(d?: Date, offsetDays?: number): string` — NL-kalenderdag (Europe/Amsterdam) als `YYYY-MM-DD`.
  - `gradenTekst(value: number): string` — "23", "0,4" (1 decimaal, komma, zonder ",0").
  - `scoreVerdict(deltaGraden: number): string` — zin in Piets stem.
  - `computeStats(rows: { predictedMax: number; measuredMax: number }[]): ScoreStats` (`{ days, hits, hitRate }`, hit = |Δ| ≤ 1,0°).
  - `savePredictions(admin, preds: ScorecardPrediction[]): Promise<{ ok: boolean; saved: number; reason?: string }>`
  - `listUnmeasured(admin, dates: string[]): Promise<UnmeasuredRow[]>`
  - `saveMeasurement(admin, id: string, m: { measuredMax: number; stationId: string; stationName: string }): Promise<boolean>`
  - `loadScoreDigest(admin, days?: number): Promise<Map<string, PlaceScoreDigest>>` — key `` `${province}/${placeSlug}` ``; digest = `{ yesterday: { predictedMax, measuredMax } | null; stats: ScoreStats }`.
  - `PIET_SCORECARD_TABLE = "piet_scorecard"`.

- [ ] **Step 1: Schrijf de lib**

```ts
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Piets gelijk-gehad-score (handoff 2026-07-10, blok c): voorspelde dagmax per
 * plaats vs de gemeten dagmax — de meting is ground truth. Pure wiskunde,
 * nul LLM. Schema: supabase/migrations/20260710_piet_scorecard.sql.
 * Alle toegang loopt via de service role; best-effort zolang de migratie nog
 * niet live is (crons en UI vallen dan stil terug op "geen score").
 */

export const PIET_SCORECARD_TABLE = "piet_scorecard";

/** Hooguit één graad ernaast = gelijk gehad (weermans-maat, geen jargon). */
const HIT_MARGE_GRADEN = 1.0;

export interface ScorecardPrediction {
  forecastDate: string; // YYYY-MM-DD, NL-kalenderdag
  province: string;
  placeSlug: string;
  placeName: string;
  lat: number;
  lon: number;
  predictedMax: number;
}

export interface UnmeasuredRow {
  id: string;
  forecastDate: string;
  province: string;
  placeSlug: string;
  lat: number;
  lon: number;
}

export interface ScoreStats {
  days: number;
  hits: number;
  hitRate: number; // 0-100, afgerond
}

export interface PlaceScoreDigest {
  yesterday: { predictedMax: number; measuredMax: number } | null;
  stats: ScoreStats;
}

/** NL-kalenderdag (Europe/Amsterdam) als YYYY-MM-DD; offsetDays: -1 = gisteren. */
export function nlDateISO(d: Date = new Date(), offsetDays = 0): string {
  const shifted = new Date(d.getTime() + offsetDays * 86_400_000);
  // sv-SE geeft ISO-notatie; de timeZone doet de NL-dag-grens.
  return shifted.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/** "23", "0,4" — één decimaal met komma, hele graden zonder ",0". */
export function gradenTekst(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

/** Oordeel in Piets stem over het verschil voorspeld vs gemeten. */
export function scoreVerdict(deltaGraden: number): string {
  const diff = Math.abs(deltaGraden);
  if (diff <= 0.5) return "Strak op de graad.";
  if (diff <= HIT_MARGE_GRADEN) return "Netjes binnen de graad.";
  return `Daar zat ik ${gradenTekst(diff)}° naast — eerlijk is eerlijk.`;
}

export function computeStats(rows: { predictedMax: number; measuredMax: number }[]): ScoreStats {
  const days = rows.length;
  const hits = rows.filter((row) => Math.abs(row.measuredMax - row.predictedMax) <= HIT_MARGE_GRADEN).length;
  return { days, hits, hitRate: days ? Math.round((hits / days) * 100) : 0 };
}

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function savePredictions(
  admin: SupabaseClient,
  preds: ScorecardPrediction[],
): Promise<{ ok: boolean; saved: number; reason?: string }> {
  if (!preds.length) return { ok: true, saved: 0 };
  const rows = preds.map((p) => ({
    forecast_date: p.forecastDate,
    province: p.province,
    place_slug: p.placeSlug,
    place_name: p.placeName,
    lat: p.lat,
    lon: p.lon,
    predicted_max: Math.round(p.predictedMax * 10) / 10,
    predicted_at: new Date().toISOString(),
  }));
  const { error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .upsert(rows, { onConflict: "forecast_date,province,place_slug" });
  if (error) return { ok: false, saved: 0, reason: error.message };
  return { ok: true, saved: rows.length };
}

export async function listUnmeasured(admin: SupabaseClient, dates: string[]): Promise<UnmeasuredRow[]> {
  if (!hasServiceRole() || !dates.length) return [];
  const { data, error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .select("id, forecast_date, province, place_slug, lat, lon")
    .in("forecast_date", dates)
    .is("measured_max", null);
  if (error) {
    console.error("[scorecard] listUnmeasured:", error.message);
    return [];
  }
  return ((data ?? []) as { id: string; forecast_date: string; province: string; place_slug: string; lat: number; lon: number }[]).map(
    (row) => ({
      id: row.id,
      forecastDate: row.forecast_date,
      province: row.province,
      placeSlug: row.place_slug,
      lat: row.lat,
      lon: row.lon,
    }),
  );
}

export async function saveMeasurement(
  admin: SupabaseClient,
  id: string,
  m: { measuredMax: number; stationId: string; stationName: string },
): Promise<boolean> {
  const { error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .update({
      measured_max: Math.round(m.measuredMax * 10) / 10,
      measured_at: new Date().toISOString(),
      station_id: m.stationId,
      station_name: m.stationName,
    })
    .eq("id", id);
  if (error) console.error("[scorecard] saveMeasurement:", error.message);
  return !error;
}

/**
 * Afgeronde scores van de laatste `days` dagen, gegroepeerd per plaats.
 * Eén query voor álle plaatsen — de ochtendmail en de score-kaart lezen
 * hieruit zonder per-abonnee queries (O(plaatsen), niet O(abonnees)).
 */
export async function loadScoreDigest(
  admin: SupabaseClient,
  days = 30,
): Promise<Map<string, PlaceScoreDigest>> {
  const out = new Map<string, PlaceScoreDigest>();
  if (!hasServiceRole()) return out;
  const since = nlDateISO(new Date(), -days);
  const yesterday = nlDateISO(new Date(), -1);
  const { data, error } = await admin
    .from(PIET_SCORECARD_TABLE)
    .select("forecast_date, province, place_slug, predicted_max, measured_max")
    .gte("forecast_date", since)
    .not("measured_max", "is", null);
  if (error) {
    console.error("[scorecard] loadScoreDigest:", error.message);
    return out;
  }
  const grouped = new Map<string, { forecastDate: string; predictedMax: number; measuredMax: number }[]>();
  for (const raw of (data ?? []) as { forecast_date: string; province: string; place_slug: string; predicted_max: number; measured_max: number }[]) {
    const key = `${raw.province}/${raw.place_slug}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({
      forecastDate: raw.forecast_date,
      predictedMax: Number(raw.predicted_max),
      measuredMax: Number(raw.measured_max),
    });
  }
  for (const [key, rows] of grouped) {
    const y = rows.find((row) => row.forecastDate === yesterday) ?? null;
    out.set(key, {
      yesterday: y ? { predictedMax: y.predictedMax, measuredMax: y.measuredMax } : null,
      stats: computeStats(rows),
    });
  }
  return out;
}
```

- [ ] **Step 2: Smoketest de pure wiskunde**

Run (Git Bash):
```bash
npx tsx -e "
const { gradenTekst, scoreVerdict, computeStats, nlDateISO } = require('./src/lib/agents/scorecard.ts');
console.log(gradenTekst(23), gradenTekst(0.4), gradenTekst(1.25));
console.log(scoreVerdict(0.3)); console.log(scoreVerdict(-0.9)); console.log(scoreVerdict(2.4));
console.log(computeStats([{predictedMax:20,measuredMax:20.5},{predictedMax:20,measuredMax:23}]));
console.log(nlDateISO(), nlDateISO(new Date(), -1));
"
```
Let op: `server-only` blokkeert import buiten Next. Als dat gebeurt: smoketest via `npx tsc --noEmit` + beredeneerde review; verwacht anders output `23 0,4 1,3` / `Strak op de graad.` / `Netjes binnen de graad.` / `Daar zat ik 2,4° naast — eerlijk is eerlijk.` / `{ days: 2, hits: 1, hitRate: 50 }` / vandaag + gisteren in NL-tijd.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -i scorecard` — verwacht: geen fouten in het nieuwe bestand (repo kan elders bestaande drift hebben; alleen eigen bestanden hoeven schoon).

- [ ] **Step 4: Commit**

```bash
git add src/lib/agents/scorecard.ts
git commit -m "feat(agents): score-wiskunde + persistentie voor gelijk-gehad-score"
```

---

### Task 3: KNMI gemeten dagmax

**Files:**
- Modify: `src/lib/knmi-edr.ts` (append na `fetchNearestStationObservation`, ± regel 146)

**Interfaces:**
- Consumes: bestaande `nearestKNMIStationId`, `edrHeaders`, `EDR_BASE`.
- Produces: `fetchStationDayMaxTemp(lat: number, lon: number, dayISO: string): Promise<{ stationId: string; stationName: string; maxTemp: number } | null>` (gebruikt door Task 4, verify-fase).

- [ ] **Step 1: Voeg de functie toe**

```ts
/**
 * Gemeten dagmax (ta) van het station dichtst bij (lat, lon), over de UTC-dag
 * dayISO (YYYY-MM-DD). De dagmax valt vrijwel altijd midden op de dag, dus het
 * UTC-venster dekt de NL-dagmax; de avond-cron draait na 20:00 UTC zodat de
 * piek zeker binnen is. Minimaal 6 uur aan 10-min-waarden vereist, anders null
 * (halve dagen leveren geen eerlijke max op).
 */
export async function fetchStationDayMaxTemp(
  lat: number,
  lon: number,
  dayISO: string
): Promise<{ stationId: string; stationName: string; maxTemp: number } | null> {
  const station = await nearestKNMIStationId(lat, lon);
  if (!station) return null;

  const headers = edrHeaders();
  const params = new URLSearchParams({
    datetime: `${dayISO}T00:00:00Z/${dayISO}T23:59:59Z`,
    "parameter-name": "ta",
    f: "CoverageJSON",
  });

  try {
    const res = await fetch(
      `${EDR_BASE}/collections/10-minute-in-situ-meteorological-observations/locations/${encodeURIComponent(station.id)}?${params}`,
      { headers, next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const cj = await res.json();
    const coverage = cj?.type === "CoverageCollection" ? cj?.coverages?.[0] : cj;
    const values: (number | null)[] = coverage?.ranges?.ta?.values ?? [];
    const temps = values.filter((v): v is number => typeof v === "number");
    if (temps.length < 36) return null; // < 6 uur aan metingen
    return { stationId: station.id, stationName: station.name, maxTemp: Math.max(...temps) };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Live smoketest tegen de KNMI-API**

Run:
```bash
npx tsx -e "
require('dotenv').config({ path: '.env.local' });
import('./src/lib/knmi-edr.ts').then(async (m) => {
  const gisteren = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  console.log(await m.fetchStationDayMaxTemp(52.10, 5.18, gisteren));
});
"
```
Verwacht: `{ stationId: '06260', stationName: 'De Bilt…', maxTemp: <plausibele julitemp 15-35> }`. (Als `server-only`/env dwarsligt: test in Task 7 via de gedeployde verify-fase.)

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep knmi-edr` — geen fouten.

```bash
git add src/lib/knmi-edr.ts
git commit -m "feat(knmi): gemeten dagmax per station voor de gelijk-gehad-score"
```

---

### Task 4: Cron-route + registratie

**Files:**
- Create: `src/app/(site)/api/cron/piet-scorecard/route.ts`
- Modify: `vercel.json` (crons-array)

**Interfaces:**
- Consumes: `savePredictions`, `listUnmeasured`, `saveMeasurement`, `nlDateISO` (Task 2); `fetchStationDayMaxTemp` (Task 3); `activeAgentPlaceSubscriptions` uit `@/lib/agents/email-recipients`; `findPlace`, `nearestSettlement`, `placeRouteSlug` uit `@/lib/places-data`; `createSupabaseAdminClient`.
- Produces: GET `/api/cron/piet-scorecard?phase=predict|verify` met JSON-status.

- [ ] **Step 1: Schrijf de route**

```ts
/**
 * PIET SCORECARD — de gelijk-gehad-score (handoff 2026-07-10, blok c).
 *
 * phase=predict (05:50 UTC, vóór de ochtendmail): multi-model-mediaan dagmax
 *   per plaats met een actief Piet-abonnement (e-mail én push) + De Bilt als
 *   landelijke referentie. O(plaatsen), nul LLM.
 * phase=verify (20:30 UTC): gemeten dagmax van het dichtstbijzijnde station
 *   voor alle onafgemaakte rijen van vandaag en gisteren (inhaalslag).
 *
 * Vercel cron: beide fasen geregistreerd in vercel.json.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activeAgentPlaceSubscriptions } from "@/lib/agents/email-recipients";
import {
  nlDateISO,
  savePredictions,
  listUnmeasured,
  saveMeasurement,
  type ScorecardPrediction,
} from "@/lib/agents/scorecard";
import { findPlace, nearestSettlement, placeRouteSlug, type Place } from "@/lib/places-data";
import { fetchStationDayMaxTemp } from "@/lib/knmi-edr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Zelfde blend als src/lib/mariana/studio/temps.ts — kale HARMONIE loopt in
// hitte 2-3° te warm; de mediaan over 5 modellen zit op profniveau.
const BLEND_MODELS = ["knmi_seamless", "ecmwf_ifs025", "icon_eu", "gfs_seamless", "ukmo_seamless"];

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Multi-model-mediaan dagmax (vandaag) per plaats, in batches van 50 coördinaten. */
async function predictedMaxima(places: Place[]): Promise<Map<Place, number>> {
  const out = new Map<Place, number>();
  for (let i = 0; i < places.length; i += 50) {
    const chunk = places.slice(i, i + 50);
    const lat = chunk.map((p) => p.lat).join(",");
    const lon = chunk.map((p) => p.lon).join(",");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max&timezone=Europe%2FAmsterdam&forecast_days=1&models=${BLEND_MODELS.join(",")}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: Record<string, (number | null)[]> }>;
    chunk.forEach((place, j) => {
      const vals = BLEND_MODELS
        .map((mdl) => rows[j]?.daily?.[`temperature_2m_max_${mdl}`]?.[0])
        .filter((v): v is number => typeof v === "number");
      // fallback: ongesuffixte kolom als de models-variant ontbreekt
      const single = rows[j]?.daily?.temperature_2m_max?.[0];
      const value = vals.length ? median(vals) : typeof single === "number" ? single : undefined;
      if (typeof value === "number") out.set(place, value);
    });
  }
  return out;
}

async function runPredict() {
  const admin = createSupabaseAdminClient();
  const [emailSubs, pushSubs] = await Promise.all([
    activeAgentPlaceSubscriptions(admin, "piet", "email"),
    activeAgentPlaceSubscriptions(admin, "piet", "push"),
  ]);

  // Unieke plaatsen + De Bilt als landelijke referentie (score op /vandaag
  // heeft dan altijd een terugvaloptie, ook met nul abonnees).
  const byKey = new Map<string, Place>();
  for (const sub of [...emailSubs, ...pushSubs]) {
    const place = findPlace(sub.province, sub.placeSlug);
    if (place) byKey.set(`${sub.province}/${sub.placeSlug}`, place);
  }
  const deBilt = nearestSettlement(52.1017, 5.1783);
  if (deBilt) byKey.set(`${deBilt.province}/${placeRouteSlug(deBilt)}`, deBilt);

  const places = [...byKey.values()];
  if (!places.length) return NextResponse.json({ phase: "predict", saved: 0, reason: "geen plaatsen" });

  const maxima = await predictedMaxima(places);
  const forecastDate = nlDateISO();
  const preds: ScorecardPrediction[] = [];
  for (const [key, place] of byKey) {
    const value = maxima.get(place);
    if (typeof value !== "number") continue;
    const [province, placeSlug] = [key.slice(0, key.indexOf("/")), key.slice(key.indexOf("/") + 1)];
    preds.push({
      forecastDate,
      province,
      placeSlug,
      placeName: place.name,
      lat: place.lat,
      lon: place.lon,
      predictedMax: value,
    });
  }

  const result = await savePredictions(admin, preds);
  return NextResponse.json({ phase: "predict", places: places.length, ...result });
}

async function runVerify() {
  const admin = createSupabaseAdminClient();
  // Vandaag + gisteren: mist een avondrun (deploy, storing), dan haalt de
  // volgende run de vorige dag alsnog in zolang de 10-min-data er nog is.
  const rows = await listUnmeasured(admin, [nlDateISO(), nlDateISO(new Date(), -1)]);
  if (!rows.length) return NextResponse.json({ phase: "verify", measured: 0, reason: "niets open" });

  let measured = 0;
  const errors: string[] = [];
  const batchSize = 8;
  for (let i = 0; i < rows.length; i += batchSize) {
    await Promise.all(
      rows.slice(i, i + batchSize).map(async (row) => {
        try {
          const obs = await fetchStationDayMaxTemp(row.lat, row.lon, row.forecastDate);
          if (!obs) return;
          const ok = await saveMeasurement(admin, row.id, {
            measuredMax: obs.maxTemp,
            stationId: obs.stationId,
            stationName: obs.stationName,
          });
          if (ok) measured += 1;
        } catch (err) {
          errors.push(`${row.province}/${row.placeSlug}: ${err instanceof Error ? err.message : err}`);
        }
      }),
    );
  }
  return NextResponse.json({ phase: "verify", open: rows.length, measured, errors: errors.slice(0, 10) });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phase = new URL(req.url).searchParams.get("phase");
  try {
    if (phase === "predict") return await runPredict();
    if (phase === "verify") return await runVerify();
    return NextResponse.json({ error: "phase=predict|verify vereist" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { phase, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
```

Let op: check of `Place` als type geëxporteerd wordt uit `places-data.ts` (regel 24: ja, `export interface Place`).

- [ ] **Step 2: Registreer de crons in `vercel.json`**

Voeg toe aan de `crons`-array (na de `koos-getaway-nudge`-entry):

```json
    {
      "path": "/api/cron/piet-scorecard?phase=predict",
      "schedule": "50 5 * * *"
    },
    {
      "path": "/api/cron/piet-scorecard?phase=verify",
      "schedule": "30 20 * * *"
    },
```

(Precedent voor query-params in cron-paths: de `studio-nudge?slot=`-entries. 05:50 UTC = vóór de 06:00-mail; 20:30 UTC = 22:30 zomertijd, dagmax is dan zeker binnen.)

- [ ] **Step 3: Typecheck + lokale smoketest**

Run: `npx tsc --noEmit 2>&1 | grep piet-scorecard` — geen fouten.

Optioneel lokaal (dev-server draait niet in prod-mode dus auth-guard is uit):
```bash
npm run dev &
curl "http://localhost:3000/api/cron/piet-scorecard?phase=predict"
```
Verwacht: `{"phase":"predict","places":≥1,"ok":true/false,...}` (ok=false met reason zolang de migratie niet live is — dat is het fail-soft-pad).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/api/cron/piet-scorecard/route.ts" vercel.json
git commit -m "feat(agents): scorecard-cron — ochtend voorspelling, avond meting (blok c)"
```

---

### Task 5: Score-zin in de ochtendmail

**Files:**
- Modify: `src/app/(site)/api/cron/piet-morning-email/route.ts`

**Interfaces:**
- Consumes: `loadScoreDigest`, `gradenTekst`, `scoreVerdict`, type `PlaceScoreDigest` (Task 2).
- Produces: extra alinea in Piets verhaal, alléén voor plaats-abonnementen met een afgeronde score van gisteren.

- [ ] **Step 1: Import toevoegen**

Na de bestaande import van `email-recipients` (regel 20):

```ts
import { loadScoreDigest, gradenTekst, scoreVerdict, type PlaceScoreDigest } from "@/lib/agents/scorecard";
```

- [ ] **Step 2: `buildNarrative` uitbreiden**

Signatuur wordt (regel 75):

```ts
function buildNarrative(
  city: string,
  data: Record<string, unknown>,
  region: RegionDuiding | null,
  score: PlaceScoreDigest | null,
): string {
```

En vlak vóór de afsluitende signature-regel (`if (!parts.some((part) => part.includes("— Piet")))`) invoegen:

```ts
  // Gelijk-gehad: gisteren beloofd vs gemeten — de meting is ground truth.
  if (score?.yesterday) {
    const { predictedMax, measuredMax } = score.yesterday;
    let zin =
      `Gisteren beloofde ik maximaal ${gradenTekst(predictedMax)}° — het werd ${gradenTekst(measuredMax)}°. ` +
      scoreVerdict(measuredMax - predictedMax);
    if (score.stats.days >= 7) {
      zin += ` Zo houd ik mezelf scherp: de afgelopen ${score.stats.days} dagen zat ik er ${score.stats.hits} keer hooguit één graad naast.`;
    }
    parts.push(zin);
  }
```

- [ ] **Step 3: Digest één keer laden en per unit doorgeven**

In de handler, na `const admin = createSupabaseAdminClient();` (regel 315):

```ts
  // Gelijk-gehad-scores: één query voor alle plaatsen (blok c).
  const scoreDigest = await loadScoreDigest(admin).catch(() => new Map<string, PlaceScoreDigest>());
```

`SendUnit` krijgt de sleutel mee. Interface (regel 337) wordt:

```ts
  interface SendUnit { label: string | null; lat: number; lon: number; scoreKey: string | null; recipients: Recipient[] }
```

Bij het aanmaken van plaats-units (regel 345):

```ts
    if (!units.has(key)) units.set(key, { label: place.name, lat: place.lat, lon: place.lon, scoreKey: `${sub.province}/${sub.placeSlug}`, recipients: [] });
```

Bij de grid-fallback-units (regel 355): `scoreKey: null` toevoegen:

```ts
    if (!units.has(key)) units.set(key, { label: null, lat: sub.primary_lat, lon: sub.primary_lon, scoreKey: null, recipients: [] });
```

En de aanroep (regel 390):

```ts
      const narrative = buildNarrative(
        cityLabel,
        data,
        region,
        unit.scoreKey ? scoreDigest.get(unit.scoreKey) ?? null : null,
      );
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep piet-morning-email` — geen fouten.

```bash
git add "src/app/(site)/api/cron/piet-morning-email/route.ts"
git commit -m "feat(agents): gelijk-gehad-zin van gisteren in Piets ochtendmail"
```

---

### Task 6: Score-kaart op /vandaag (waar /piet heen wijst)

**Files:**
- Create: `src/components/PietScoreCard.tsx`
- Modify: `src/app/(site)/vandaag/page.tsx`

**Interfaces:**
- Consumes: `loadScoreDigest`, `gradenTekst`, `scoreVerdict` (Task 2); `createSupabaseAdminClient`; `nearestSettlement`, `placeRouteSlug` uit `@/lib/places-data`.
- Produces: async server component `PietScoreCard({ province, placeSlug, placeName })` — rendert `null` zonder data (eerste dagen, migratie nog niet live, of DB-storing).

- [ ] **Step 1: Schrijf de component**

```tsx
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadScoreDigest, gradenTekst, scoreVerdict, type PlaceScoreDigest } from "@/lib/agents/scorecard";
import { nearestSettlement, placeRouteSlug } from "@/lib/places-data";

interface PietScoreCardProps {
  province: string;
  placeSlug: string;
  placeName: string;
}

/**
 * Piets gelijk-gehad-score (handoff 2026-07-10, blok c): gisteren beloofd vs
 * gemeten, plus het lopende 30-dagen-cijfer. Pure wiskunde uit piet_scorecard;
 * geen data (eerste dagen / storing) = geen kaart. Valt terug op De Bilt
 * (landelijk) zolang de getoonde plaats zelf nog geen score heeft.
 */
export default async function PietScoreCard({ province, placeSlug, placeName }: PietScoreCardProps) {
  let digest: PlaceScoreDigest | null = null;
  let label = placeName;
  try {
    const admin = createSupabaseAdminClient();
    const all = await loadScoreDigest(admin);
    digest = all.get(`${province}/${placeSlug}`) ?? null;
    if (!digest) {
      const deBilt = nearestSettlement(52.1017, 5.1783);
      if (deBilt) {
        digest = all.get(`${deBilt.province}/${placeRouteSlug(deBilt)}`) ?? null;
        label = "Nederland";
      }
    }
  } catch {
    return null;
  }
  if (!digest?.yesterday) return null;

  const { predictedMax, measuredMax } = digest.yesterday;
  const showStats = digest.stats.days >= 7;

  return (
    <section className="va-card p-7">
      <div className="va-micro text-slate-400">Piet · gelijk gehad?</div>
      <h2 className="mt-3 text-xl font-extrabold text-slate-950">
        Gisteren beloofde Piet {label === "Nederland" ? "voor Nederland" : label} maximaal {gradenTekst(predictedMax)}°
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Het werd {gradenTekst(measuredMax)}°. {scoreVerdict(measuredMax - predictedMax)} Elke ochtend legt Piet
        zijn verwachting vast, elke avond wordt hij langs de meting gelegd.
      </p>
      {showStats ? (
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-slate-950">{digest.stats.hitRate}%</span>
          <span className="text-sm text-slate-600">
            van de afgelopen {digest.stats.days} dagen hooguit één graad ernaast
          </span>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Mount op /vandaag**

In `src/app/(site)/vandaag/page.tsx`: import toevoegen (na `ReedPushCard`, regel 6):

```tsx
import PietScoreCard from "@/components/PietScoreCard";
```

En in `appendedContent` (regel 57-70) de kaart vóór `AgentSubscribeCard` zetten — de score is het bewijs dat het inschrijfblok verkoopt:

```tsx
          <>
            <PietScoreCard
              placeName={subscribePlace.name}
              province={subscribePlace.province}
              placeSlug={placeRouteSlug(subscribePlace)}
            />
            <AgentSubscribeCard
              placeName={subscribePlace.name}
              province={subscribePlace.province}
              placeSlug={placeRouteSlug(subscribePlace)}
            />
            <ReedPushCard
              placeName={subscribePlace.name}
              province={subscribePlace.province}
              placeSlug={placeRouteSlug(subscribePlace)}
            />
          </>
```

- [ ] **Step 3: Typecheck + visuele check**

Run: `npx tsc --noEmit 2>&1 | grep -E "PietScoreCard|vandaag"` — geen fouten.
Run `npm run dev` en open `http://localhost:3000/vandaag`: zonder data hoort de pagina er exact uit te zien als voorheen (kaart rendert null, geen layout-shift, geen error).

- [ ] **Step 4: Commit**

```bash
git add src/components/PietScoreCard.tsx "src/app/(site)/vandaag/page.tsx"
git commit -m "feat(agents): gelijk-gehad-scorekaart op /vandaag (blok c)"
```

---

### Task 7: Migratie live, build, deploy & end-to-end-verificatie

**Files:** geen nieuwe code; migratie uit Task 1, deploy van alles.

- [ ] **Step 1: Volledige typecheck + build**

```bash
npx tsc --noEmit
npm run build
```
`ignoreBuildErrors` staat aan — de build is géén type-signaal; beide moeten los slagen (bestaande, niet-gerelateerde tsc-drift documenteren maar niet fixen).

- [ ] **Step 2: Migratie op prod draaien**

`supabase/migrations/20260710_piet_scorecard.sql` uitvoeren via de Supabase SQL editor (of Management API als er een token in de env staat — check eerst). Daarna verifiëren via de service-role REST API:

```bash
curl "https://<project>.supabase.co/rest/v1/piet_scorecard?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
Verwacht: `[]` (tabel bestaat, leeg). En met de **anon**-key: 401/permission denied of `[]` met 0 rows — géén data-toegang.

- [ ] **Step 3: Committen en deployen**

Werkmap moet schoon zijn vóór CLI-deploy (dirty-tree-les; `mirrorly/`, `src/seo`, `.audits_tmp_nl.xml` zijn bekende zwervers — niet meecommitten, wel checken dat ze de build niet raken):

```bash
git status --short
vercel deploy --prod
```
Check de output: aliast de deploy automatisch naar weerzone.nl? Zo niet: `vercel promote <url>` (crons draaien anders op de oude deploy).

- [ ] **Step 4: Predict-fase handmatig triggeren**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://weerzone.nl/api/cron/piet-scorecard?phase=predict"
```
Verwacht: `{"phase":"predict","places":≥1,"ok":true,"saved":≥1}` — minimaal De Bilt plus de plaats van het bestaande testabonnement (rwnhrtmn@gmail.com). Verifieer de rij via de service-role REST-call uit Step 2 (nu 1+ rows met `predicted_max`).

- [ ] **Step 5: Verify-fase handmatig triggeren**

Direct daarna (zelfde dag — er is dan al ruim 6 uur aan metingen als het na ~07:00 NL is; anders 's avonds herhalen):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://weerzone.nl/api/cron/piet-scorecard?phase=verify"
```
Verwacht: `{"phase":"verify","open":≥1,"measured":≥1}`. Let op: een meting van halverwege de dag is nog geen echte dagmax — dit valideert alleen de pijplijn; de echte cyclus start vannacht.

- [ ] **Step 6: Mail- en kaartpad**

- Morgenochtend (of nu, met een handmatig gecompleteerde gisteren-rij): `piet-morning-email` triggeren met het testabonnement en checken dat de mail de zin "Gisteren beloofde ik maximaal …" bevat.
- `https://weerzone.nl/vandaag` openen: zodra er een afgeronde gisteren-rij is, hoort de score-kaart te verschijnen; tot die tijd géén kaart en géén fouten.

- [ ] **Step 7: Handoff-doc bijwerken + afsluitende commit**

In `docs/handoff-agents-abonnementen-2026-07-10.md` blok (c) afvinken met een regel over wat er live staat. Committen:

```bash
git add docs/handoff-agents-abonnementen-2026-07-10.md
git commit -m "docs: blok c (gelijk-gehad-score) afgerond in handoff"
```
