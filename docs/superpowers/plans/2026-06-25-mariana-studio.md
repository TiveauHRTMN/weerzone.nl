# Mariana Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een vierde Mariana-cascade-laag ("Studio") die dagelijks de inhoud voor de 4 TikTok-slide-templates bouwt, plus een `/admin/studio` pagina die die data live rendert voor menselijke eindcontrole en PNG-export.

**Architecture:** Generator (`src/lib/mariana/studio/`) leest de bestaande cascade (Oracle/Regions/Tesla) + live multi-model-temps en schrijft één dag-object naar Supabase (`mariana_studio`). Draait als laatste stap van de bestaande `mariana-nl` cron. Twee endpoints (`/api/studio/today`, `/api/studio/live`) voeden de Studio-pagina, een client-side port van de zip-HTML met `html-to-image` PNG-export. De oude `mariana-tiktok-email` cron vervalt.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (admin/service-role), Open-Meteo, `hermesChat` (OpenRouter), `html-to-image`.

## Global Constraints

- **NL-only.** Geen nieuwe locale-routes of -strings. User-facing copy is Nederlands.
- **Geen bronnamen in UI.** Geen "KNMI"/"DWD"/"Mariana"/modelnamen in de slide-output (attributie staat centraal op /over). Mariana mag wél in interne mail/code.
- **Toon:** spreektaal, menselijk, geen meteo-jargon (geen "subsidentie"/"convectie"/"850hPa"), geen Engels waar het onnatuurlijk is. Temperatuur = "X graden", nooit "het waait X graden".
- **Cijferdiscipline:** narratieve LLM-tekst mag gegeven getallen/plaatsnamen niet verbouwen; faalt validatie → deterministische terugvalcopy. Cijfers komen altijd uit de cijfer-pipeline, nooit uit de LLM.
- **Type-signaal:** `next.config.ts` heeft `typescript.ignoreBuildErrors: true`. `npx tsc --noEmit` is het enige type-signaal — moet schoon zijn voor aangeraakte bestanden.
- **Geen test-runner uitvinden.** De repo heeft geen jest/vitest. Verificatie = `npx tsx <smoke-script>`, endpoint-`?dry=1`-calls en `npx tsc --noEmit`. Eén Playwright-spec bestaat als voorbeeld; nieuwe Playwright is optioneel.
- **Cron-registratie:** scheduled jobs vuren alleen via `vercel.json` `crons[]`. We voegen géén nieuwe cron toe (Studio hangt aan `mariana-nl`); we verwijderen wél de `mariana-tiktok-email` entry.
- **Prod-DB migraties:** migraties in de repo ≠ live. DDL wordt handmatig via de Supabase SQL-editor uitgevoerd; verifieer via service-role.
- **Commit-trailer:** elke commit eindigt met `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/mariana/studio/types.ts` — `StudioDay`, `Slide1..4`, `HeadsUp`, `RegionTemps`
- `src/lib/mariana/studio/temps.ts` — plekkenlijst + multi-model temps (verhuisd uit oude mail-route)
- `src/lib/mariana/studio/narrative.ts` — LLM-copy + validatie + terugval
- `src/lib/mariana/studio/headsup.ts` — heads-up beslislogica → `HeadsUp | null`
- `src/lib/mariana/studio/engine.ts` — `runStudio()` bouwt `StudioDay`
- `src/lib/mariana/studio/storage.ts` — `saveStudioDay()`, `loadLatestStudioDay()`
- `src/lib/mariana/studio/gate.ts` — secret-gate helper voor pagina + endpoints
- `supabase/migrations/20260625_mariana_studio.sql`
- `src/app/(site)/api/studio/today/route.ts`
- `src/app/(site)/api/studio/live/route.ts`
- `src/app/(site)/admin/studio/page.tsx` — server-wrapper (gate + noindex)
- `src/app/(site)/admin/studio/StudioClient.tsx` — client-component met de 4 templates
- `src/app/(site)/admin/studio/reference.html` — verbatim kopie van de zip-HTML (port-bron)
- `public/studio/weerzone-logo.png` — logo-asset voor de slides
- `scripts/test-studio.ts` — tsx-smoke voor de generator

**Modify:**
- `src/app/(site)/api/cron/mariana-nl/route.ts` — Studio-stap toevoegen aan het eind
- `vercel.json` — `mariana-tiktok-email` cron-entry verwijderen
- `package.json` — `html-to-image` dependency

**Delete:**
- `src/app/(site)/api/cron/mariana-tiktok-email/route.ts`

---

## Task 1: Types + temperatuur-helper

Fundament. Verhuist de bewezen multi-model-mediaan-logica uit de oude mail-route naar een herbruikbare helper, en voegt een "nu gemeten" variant toe.

**Files:**
- Create: `src/lib/mariana/studio/types.ts`
- Create: `src/lib/mariana/studio/temps.ts`
- Create: `scripts/test-studio-temps.ts`

**Interfaces:**
- Produces:
  - `type Region = "Noord" | "Oost" | "Midden" | "West" | "Zuid"`
  - `interface Ranked { name: string; value: number; region: Region }`
  - `interface RegionTemps { noord: number; oost: number; midden: number; west: number; zuid: number }`
  - `forecastRanking(dayOffset?: number): Promise<Ranked[]>` — verwachte max per plek (mediaan)
  - `currentRanking(): Promise<Ranked[]>` — nu gemeten temp per plek
  - `regionAverages(ranked: Ranked[]): RegionTemps`
  - `details(dayOffset?: number): Promise<{ uv: number; sunHours: number; windBft: number }>`
  - `StudioDay`, `Slide1`, `Slide2`, `Slide3`, `Slide4`/`HeadsUp` (types.ts)

- [ ] **Step 1: Schrijf `src/lib/mariana/studio/types.ts`**

```typescript
/**
 * Mariana Studio — datamodel voor de 4 TikTok-slide-templates.
 * Eén StudioDay = één rij in tabel `mariana_studio`.
 */

export type Region = "Noord" | "Oost" | "Midden" | "West" | "Zuid";

export interface RegionTemps {
  noord: number;
  oost: number;
  midden: number;
  west: number;
  zuid: number;
}

/** Slide 1 — 08:00 Dagverwachting. */
export interface Slide1 {
  badge: string;          // "Dinsdag 23 juni · 08:00"
  titel: string;          // "Vandaag"
  intro: string;          // LLM
  regionTemps: RegionTemps;            // verwachte max (mediaan)
  dayparts: { ochtend: number; middag: number; avond: number; nacht: number };
  metrics: { uvIndex: number; hooikoorts: string; windBft: number; fietsweer: string };
  tagline: string;
}

/** Slide 2 — 14:00 Actueel weer. Cijfers leeg in de rij; pagina vult ze live. */
export interface Slide2 {
  badge: string;          // "Nu · 14:00"
  titel: string;          // "Actueel weer"
  subtitel: string;
  regionTempsNow: RegionTemps | null;  // live
  warmstePlek: { naam: string; temp: number } | null;  // live
}

/** Slide 3 — 20:00 Vandaag & Morgen. */
export interface Slide3 {
  badge: string;          // "Avond · 23 juni"
  titel: string;          // "Vandaag & Morgen"
  vandaag: {
    hoogste: { temp: number; plaats: string };
    laagste: { temp: number; label: string };
    weerfeit: string;
  };
  morgen: { temp: number; alinea: string };  // alinea = LLM
}

/** Slide 4 — 22:00 Heads-up. null = geen heads-up vandaag, niet posten. */
export type HeadsUpType = "onweer" | "knmi" | "hitte" | "kou";

export interface HeadsUp {
  type: HeadsUpType;
  badge: string;          // "Heads-up · vanavond"
  titel: string;          // "Onweer trekt binnen"
  intro: string;          // LLM
  rijen: { wanneer: string; waar: string; verwacht: string };
  advies: string;
}

export interface StudioDay {
  forecastDate: string;   // ISO yyyy-mm-dd (de dag waarop de posts gaan)
  runAt: string;          // ISO timestamp van generatie
  slide1: Slide1;
  slide2: Slide2;
  slide3: Slide3;
  slide4: HeadsUp | null;
}
```

- [ ] **Step 2: Schrijf `src/lib/mariana/studio/temps.ts`** (port + uitbreiding van de mail-route)

```typescript
/**
 * Mariana Studio — temperatuur-pipeline.
 *
 * Verhuisd uit de (verwijderde) mariana-tiktok-email route. Open-Meteo serveert
 * kale modeloutput; voor NL kiest best_match HARMONIE, die in hitte 2-3° boven de
 * profs loopt. De mediaan over meerdere modellen landt op het profniveau zonder
 * eigen correctie. Zie docs/superpowers/specs/2026-06-24-tiktok-brief-multimodel-temp-design.md
 */

import { getWindBeaufort } from "@/lib/weather";
import type { Region, RegionTemps, Ranked } from "./types";

export type { Ranked } from "./types";

// naam, lat, lon, regio
const PLACES: Array<[string, number, number, Region]> = [
  ["Den Helder", 52.96, 4.76, "West"], ["Texel", 53.15, 4.88, "Noord"], ["IJmuiden", 52.46, 4.61, "West"],
  ["Petten", 52.77, 4.66, "West"], ["Zandvoort", 52.37, 4.53, "West"], ["Hoek van Holland", 51.98, 4.13, "West"],
  ["Vlieland", 53.30, 5.07, "Noord"], ["Terschelling", 53.36, 5.34, "Noord"], ["Ameland", 53.45, 5.74, "Noord"],
  ["Schiermonnikoog", 53.48, 6.16, "Noord"], ["Lauwersoog", 53.41, 6.21, "Noord"], ["Harlingen", 53.17, 5.42, "Noord"],
  ["Vlissingen", 51.44, 3.57, "Zuid"], ["Middelburg", 51.50, 3.61, "Zuid"], ["Terneuzen", 51.34, 3.83, "Zuid"], ["Goes", 51.50, 3.89, "Zuid"],
  ["Maastricht", 50.85, 5.69, "Zuid"], ["Heerlen", 50.89, 5.98, "Zuid"], ["Roermond", 51.19, 5.99, "Zuid"], ["Venlo", 51.37, 6.17, "Zuid"],
  ["Eindhoven", 51.44, 5.48, "Zuid"], ["Tilburg", 51.56, 5.09, "Zuid"], ["Breda", 51.59, 4.78, "Zuid"], ["Roosendaal", 51.53, 4.46, "Zuid"],
  ["Den Bosch", 51.70, 5.30, "Zuid"], ["Nijmegen", 51.84, 5.86, "Oost"], ["Arnhem", 51.98, 5.91, "Oost"],
  ["Utrecht", 52.09, 5.12, "Midden"], ["Amersfoort", 52.16, 5.39, "Midden"], ["Apeldoorn", 52.21, 5.97, "Oost"], ["Enschede", 52.22, 6.90, "Oost"],
  ["Zwolle", 52.51, 6.09, "Oost"], ["Assen", 52.99, 6.56, "Noord"], ["Emmen", 52.78, 6.90, "Oost"], ["Groningen", 53.22, 6.57, "Noord"],
  ["Leeuwarden", 53.20, 5.79, "Noord"], ["De Bilt", 52.10, 5.18, "Midden"],
  ["Amsterdam", 52.37, 4.90, "West"], ["Rotterdam", 51.92, 4.48, "West"], ["Den Haag", 52.08, 4.31, "West"], ["Alkmaar", 52.63, 4.75, "West"],
];

const BLEND_MODELS = ["knmi_seamless", "ecmwf_ifs025", "icon_eu", "gfs_seamless", "ukmo_seamless"];

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Verwachte max per plek (multi-model mediaan), gesorteerd warm→koel. */
export async function forecastRanking(dayOffset = 0): Promise<Ranked[]> {
  const lat = PLACES.map((p) => p[1]).join(",");
  const lon = PLACES.map((p) => p[2]).join(",");
  const base = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=Europe%2FAmsterdam&forecast_days=${dayOffset + 1}`;
  try {
    const res = await fetch(`${base}&models=${BLEND_MODELS.join(",")}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: Record<string, (number | null)[]> }>;
    const ranked = PLACES
      .map((p, i) => {
        const vals = BLEND_MODELS
          .map((mdl) => rows[i]?.daily?.[`temperature_2m_max_${mdl}`]?.[dayOffset])
          .filter((v): v is number => typeof v === "number");
        return { name: p[0], region: p[3], value: vals.length ? median(vals) : undefined };
      })
      .filter((r): r is Ranked => typeof r.value === "number")
      .sort((a, b) => b.value - a.value);
    if (ranked.length) return ranked;
    throw new Error("multi-model leverde geen temperaturen");
  } catch {
    const res = await fetch(base, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: { temperature_2m_max?: number[] } }>;
    return PLACES
      .map((p, i) => ({ name: p[0], region: p[3], value: rows[i]?.daily?.temperature_2m_max?.[dayOffset] }))
      .filter((r): r is Ranked => typeof r.value === "number")
      .sort((a, b) => b.value - a.value);
  }
}

/** Nu gemeten temp per plek (multi-model mediaan van current), gesorteerd warm→koel. */
export async function currentRanking(): Promise<Ranked[]> {
  const lat = PLACES.map((p) => p[1]).join(",");
  const lon = PLACES.map((p) => p[2]).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=Europe%2FAmsterdam&models=${BLEND_MODELS.join(",")}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();
  const rows = (Array.isArray(data) ? data : [data]) as Array<{ current?: Record<string, number | null> }>;
  return PLACES
    .map((p, i) => {
      const c = rows[i]?.current ?? {};
      const vals = BLEND_MODELS
        .map((mdl) => c[`temperature_2m_${mdl}`])
        .filter((v): v is number => typeof v === "number");
      // fallback: ongesuffixte current als models-variant ontbreekt
      const single = typeof c.temperature_2m === "number" ? c.temperature_2m : undefined;
      const value = vals.length ? median(vals) : single;
      return { name: p[0], region: p[3], value };
    })
    .filter((r): r is Ranked => typeof r.value === "number")
    .sort((a, b) => b.value - a.value);
}

const ORDER: Region[] = ["Noord", "Oost", "Midden", "West", "Zuid"];

export function regionAverages(ranked: Ranked[]): RegionTemps {
  const out = {} as Record<Region, number>;
  for (const region of ORDER) {
    const vals = ranked.filter((r) => r.region === region).map((r) => r.value);
    out[region] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  return { noord: out.Noord, oost: out.Oost, midden: out.Midden, west: out.West, zuid: out.Zuid };
}

/** De Bilt als landelijke referentie voor de detail-metrics. */
export async function details(dayOffset = 0): Promise<{ uv: number; sunHours: number; windBft: number }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=52.10&longitude=5.18&daily=uv_index_max,sunshine_duration,wind_speed_10m_max&timezone=Europe%2FAmsterdam&forecast_days=${dayOffset + 1}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const d = await res.json().catch(() => null);
  const day = d?.daily ?? {};
  return {
    uv: Math.round(day.uv_index_max?.[dayOffset] ?? 0),
    sunHours: Math.round((day.sunshine_duration?.[dayOffset] ?? 0) / 3600),
    windBft: getWindBeaufort(day.wind_speed_10m_max?.[dayOffset] ?? 0).scale,
  };
}
```

Voeg `Ranked` toe aan `types.ts` (onder `RegionTemps`):

```typescript
export interface Ranked {
  name: string;
  value: number;
  region: Region;
}
```

- [ ] **Step 3: Schrijf de smoke `scripts/test-studio-temps.ts`**

```typescript
import "dotenv/config";
import { forecastRanking, currentRanking, regionAverages, details } from "@/lib/mariana/studio/temps";

async function main() {
  const fc = await forecastRanking(0);
  const now = await currentRanking();
  const avg = regionAverages(fc);
  const det = await details(0);
  console.log("forecast plekken:", fc.length, "warmst:", fc[0]?.name, Math.round(fc[0]?.value));
  console.log("current plekken:", now.length, "warmst nu:", now[0]?.name, Math.round(now[0]?.value));
  console.log("regio-gemiddeld:", avg);
  console.log("details:", det);
  if (fc.length < 30) throw new Error("te weinig forecast-plekken");
  if (now.length < 30) throw new Error("te weinig current-plekken");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

Let op: `scripts/` gebruikt `@/`-alias via tsx + tsconfig-paths. Als een bestaand script in `scripts/` het `@/`-alias al gebruikt, volg dat patroon; anders importeer met relatief pad `../src/lib/mariana/studio/temps`.

- [ ] **Step 4: Draai de smoke — verwacht succes**

Run: `npx tsx scripts/test-studio-temps.ts`
Expected: print ~40 forecast-plekken en ~40 current-plekken, een warmste plek met realistische °C, regio-gemiddelden, en details. Geen throw.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "studio/(types|temps)" || echo "studio types/temps schoon"`
Expected: `studio types/temps schoon`

- [ ] **Step 6: Commit**

```bash
git add src/lib/mariana/studio/types.ts src/lib/mariana/studio/temps.ts scripts/test-studio-temps.ts
git commit -m "feat(studio): datamodel + multi-model temperatuur-helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Narratieve copy-helper

LLM-teksten (intro slide 1, morgen-alinea slide 3) met dezelfde cijfer-validatie + terugval als de oude mail-route.

**Files:**
- Create: `src/lib/mariana/studio/narrative.ts`
- Create: `scripts/test-studio-narrative.ts`

**Interfaces:**
- Consumes: `Ranked` (temps.ts)
- Produces:
  - `humanRegime(regime: string): string`
  - `dagIntro(input: { warmst: Ranked; koelst: Ranked; spread: number; pollen: string; regime: string }): Promise<string>`
  - `morgenAlinea(input: { morgenMax: number; tendens: string; regime: string }): Promise<string>`
  - `catchyFallback(w: Ranked, k: Ranked, spread: number, pollen: string): string`

- [ ] **Step 1: Schrijf `src/lib/mariana/studio/narrative.ts`**

```typescript
/**
 * Mariana Studio — narratieve copy via Hermes.
 * Dezelfde discipline als de oude TikTok-brief: NL-guard, exacte-cijfer-validatie,
 * deterministische terugval. Cijfers komen uit de pipeline, nooit uit de LLM.
 */

import { hermesChat } from "@/lib/hermes";
import type { Ranked } from "./types";

/** Regimecode → gewone mensentaal (geen vakjargon, geen modelnamen). */
export function humanRegime(regime: string): string {
  const r = (regime || "").toLowerCase();
  if (/hitte|hittekoepel/.test(r)) return "een hittekoepel boven Nederland";
  if (/azoren|hogedruk|subsident/.test(r)) return "een stabiel hogedrukgebied";
  if (/storm|zwaar.?weer/.test(r)) return "een stormachtig weertype";
  if (/onweer|convect/.test(r)) return "een onweersgevoelige dag";
  if (/regen|nat|front|laag/.test(r)) return "wisselvallig, nat weer";
  return "wisselvallig weer";
}

const BAD_LANG = /subsidentie|convect|hpa|850|model|gateway|regime/i;
const BAD_WAAIT = /waait[^.!?]*graden/i;

/** True als de LLM-tekst bruikbaar is: lang genoeg, geen jargon, geen fout taalgebruik. */
function cleanLang(text: string): boolean {
  return text.length > 20 && !BAD_LANG.test(text) && !BAD_WAAIT.test(text) && !/het graspollen/i.test(text);
}

/** Pakkende, gegarandeerd-correcte terugval (plaatsnamen als onderwerp → altijd correct). */
export function catchyFallback(w: Ranked, k: Ranked, spread: number, pollen: string): string {
  const tw = Math.round(w.value), tk = Math.round(k.value);
  const pollenLine = /hoog/i.test(pollen) ? " Ga je naar buiten? De graspollen vliegen je om de oren." : "";
  const hook = spread >= 10
    ? `${spread} graden verschil — in hetzelfde land, op dezelfde dag.`
    : tw >= 25 ? `Nederland zit in de zon, maar niet overal even fel.`
      : `Nederland laat zich vandaag van twee kanten zien.`;
  const warmVerb = tw >= 28 ? "kookt op" : tw >= 20 ? "warmt op tot" : "komt tot";
  return `${hook} Terwijl ${w.name} ${warmVerb} ${tw} graden, blijft ${k.name} steken op ${tk}°.${pollenLine}`;
}

/** Intro voor slide 1 (Dagverwachting). Validatie tegen exacte cijfers, anders terugval. */
export async function dagIntro(input: {
  warmst: Ranked; koelst: Ranked; spread: number; pollen: string; regime: string;
}): Promise<string> {
  const tw = Math.round(input.warmst.value), tk = Math.round(input.koelst.value);
  const system = `Je bent Mariana, het weergezicht van Weerzone. Schrijf een KORTE, pakkende landelijke dagverwachting voor vandaag, voor een TikTok-slide.
STIJL: menselijk, energiek, spreektaal. 100% correct Nederlands — geen Engelse woorden, geen vaktermen (zoals 'subsidentie'), geen modelnamen.
LENGTE: 2 tot 3 korte zinnen.
TEMPERATUUR schrijf je als "het wordt X graden" of "X graden" — nooit "het waait X graden".
HARDE REGELS: gebruik de gegeven getallen en plaatsnamen EXACT. Verzin geen extra plaatsen, dagen of weersclaims. Geen emoji, geen aanhef, geen ondertekening.`;
  const user = `Cijfers van vandaag (exact overnemen):
• Warmste plek: ${input.warmst.name} ${tw} graden
• Koelste plek: ${input.koelst.name} ${tk} graden
• Verschil: ${input.spread} graden
• Graspollen: ${input.pollen}
• Weertype: ${humanRegime(input.regime)}`;
  try {
    const gen = (await hermesChat(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { model: "persona", temperature: 0.7, maxTokens: 220, nlGuard: true },
    )).trim();
    if (gen.includes(String(tw)) && gen.includes(String(tk)) && cleanLang(gen)) return gen;
  } catch { /* terugval */ }
  return catchyFallback(input.warmst, input.koelst, input.spread, input.pollen);
}

/** Alinea voor slide 3 (Morgen). Validatie tegen de morgen-max, anders terugval. */
export async function morgenAlinea(input: {
  morgenMax: number; tendens: string; regime: string;
}): Promise<string> {
  const t = Math.round(input.morgenMax);
  const system = `Je bent Mariana van Weerzone. Schrijf in 2 korte zinnen wat morgen het weer doet, voor een TikTok-slide.
STIJL: menselijk, spreektaal, 100% correct Nederlands, geen vakjargon, geen modelnamen, geen Engels.
HARDE REGELS: noem de temperatuur ${t} graden exact. Verzin geen plaatsen of harde claims. Geen emoji, geen aanhef.`;
  const user = `Morgen: maximaal ${t} graden. Tendens t.o.v. vandaag: ${input.tendens}. Weertype: ${humanRegime(input.regime)}.`;
  try {
    const gen = (await hermesChat(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { model: "persona", temperature: 0.7, maxTokens: 180, nlGuard: true },
    )).trim();
    if (gen.includes(String(t)) && cleanLang(gen)) return gen;
  } catch { /* terugval */ }
  const richting = input.tendens.includes("koeler") ? "Het koelt iets af" : input.tendens.includes("warmer") ? "Het wordt nog warmer" : "Het weer verandert weinig";
  return `${richting}: morgen ${t} graden. Verder een rustig weerbeeld zonder grote uitschieters.`;
}
```

- [ ] **Step 2: Schrijf de smoke `scripts/test-studio-narrative.ts`**

```typescript
import "dotenv/config";
import { dagIntro, morgenAlinea, catchyFallback } from "@/lib/mariana/studio/narrative";

const warmst = { name: "Maastricht", value: 34, region: "Zuid" as const };
const koelst = { name: "Ameland", value: 21, region: "Noord" as const };

async function main() {
  const fb = catchyFallback(warmst, koelst, 13, "Hoog (gras)");
  console.log("FALLBACK:", fb);
  if (!fb.includes("34") || !fb.includes("21")) throw new Error("fallback mist cijfers");

  const intro = await dagIntro({ warmst, koelst, spread: 13, pollen: "Hoog (gras)", regime: "hittekoepel" });
  console.log("INTRO:", intro);
  if (!intro.includes("34")) throw new Error("intro mist warmste cijfer");

  const morgen = await morgenAlinea({ morgenMax: 29, tendens: "iets koeler", regime: "wisselvallig" });
  console.log("MORGEN:", morgen);
  if (!morgen.includes("29")) throw new Error("morgen mist cijfer");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Draai de smoke — verwacht succes**

Run: `npx tsx scripts/test-studio-narrative.ts`
Expected: drie teksten geprint, elk met de juiste exacte cijfers; geen throw. (Bij ontbrekende `OPENROUTER_API_KEY` valt het terug op de deterministische teksten — die bevatten de cijfers ook, dus de asserts slagen nog steeds.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "studio/narrative" || echo "narrative schoon"`
Expected: `narrative schoon`

- [ ] **Step 5: Commit**

```bash
git add src/lib/mariana/studio/narrative.ts scripts/test-studio-narrative.ts
git commit -m "feat(studio): narratieve copy met cijfer-validatie + terugval

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Heads-up beslislogica

Bepaalt of slide 4 vandaag gepost wordt en met welke toon. Leest Oracle/Tesla (Supabase), KNMI-waarschuwingen, en de morgen-temps.

**Files:**
- Create: `src/lib/mariana/studio/headsup.ts`
- Create: `scripts/test-studio-headsup.ts`

**Interfaces:**
- Consumes: `loadLatestOracleRun()` (oracle/storage), `fetchKNMIWarnings()` + `highestSeverity()` (knmi-warnings), `forecastRanking()` (temps), `morgenAlinea` niet — copy hier los.
- Produces:
  - `interface HeadsUpInput { morgenRanked: Ranked[]; oracleGateActive: boolean; regionThunder: boolean }`
  - `decideHeadsUp(input: HeadsUpInput): Promise<HeadsUp | null>`

- [ ] **Step 1: Schrijf `src/lib/mariana/studio/headsup.ts`**

```typescript
/**
 * Mariana Studio — beslist of slide 4 (heads-up) vandaag gepost wordt.
 * Prioriteit bij meerdere triggers: onweer > KNMI-code > hitte > kou (één slide/dag).
 * Geen bron- of modelnamen in de output (Global Constraints).
 */

import { fetchKNMIWarnings, highestSeverity } from "@/lib/knmi-warnings";
import { hermesChat } from "@/lib/hermes";
import type { HeadsUp, HeadsUpType, Ranked } from "./types";

export interface HeadsUpInput {
  morgenRanked: Ranked[];     // forecastRanking(1)
  oracleGateActive: boolean;  // oracle.convective_gate === "ACTIVATE" || run_tesla
  regionThunder: boolean;     // een regio meldt thunder/storm
}

function morgenLabel(): string {
  return new Date(Date.now() + 86400000).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

/** Korte, menselijke heads-up-intro. Geen vakjargon; faalt → deterministische copy. */
async function headsUpCopy(type: HeadsUpType, max: number): Promise<{ titel: string; intro: string; advies: string }> {
  const presets: Record<HeadsUpType, { titel: string; intro: string; advies: string }> = {
    onweer: {
      titel: "Onweer trekt binnen",
      intro: `Na een warme dag wordt de lucht onstabiel. Vanuit het zuidwesten trekken stevige buien het land binnen, met kans op onweer en korte felle regen.`,
      advies: "Zet tuinmeubels vast en plan je rit vóór de buien arriveren.",
    },
    knmi: {
      titel: "Let op: waarschuwing morgen",
      intro: `Voor morgen geldt een weerwaarschuwing. Houd rekening met pittige omstandigheden en pas je plannen daarop aan.`,
      advies: "Check vanavond nog even de laatste verwachting voor jouw regio.",
    },
    hitte: {
      titel: "Morgen wordt het bloedheet",
      intro: `Morgen loopt de temperatuur flink op, tot ${Math.round(max)} graden. Een dag om het rustig aan te doen en de hitte voor te zijn.`,
      advies: "Drink genoeg, zoek de schaduw en check op tijd je medicatie.",
    },
    kou: {
      titel: "Winterse toestanden op komst",
      intro: `Morgen wordt het glad en koud. Houd rekening met vorst, gladheid of sneeuw en geef jezelf extra tijd onderweg.`,
      advies: "Krab je ruiten op tijd en pas je snelheid aan de weg aan.",
    },
  };
  const base = presets[type];
  // Optioneel verfijnen via LLM, maar de preset is altijd correct en cijfervrij (behalve hitte, met exacte max).
  try {
    const gen = (await hermesChat(
      [
        { role: "system", content: `Je bent Mariana van Weerzone. Herschrijf deze heads-up-intro in 2 korte, menselijke zinnen. 100% correct Nederlands, geen vakjargon, geen modelnamen, geen Engels, geen emoji.${type === "hitte" ? ` Noem ${Math.round(max)} graden exact.` : ""}` },
        { role: "user", content: base.intro },
      ],
      { model: "persona", temperature: 0.7, maxTokens: 150, nlGuard: true },
    )).trim();
    const ok = gen.length > 20 && !/subsidentie|convect|hpa|850|model|regime/i.test(gen) && (type !== "hitte" || gen.includes(String(Math.round(max))));
    if (ok) return { ...base, intro: gen };
  } catch { /* preset blijft */ }
  return base;
}

export async function decideHeadsUp(input: HeadsUpInput): Promise<HeadsUp | null> {
  const morgenMax = input.morgenRanked[0]?.value ?? 0;
  const morgenMin = input.morgenRanked[input.morgenRanked.length - 1]?.value ?? 0;

  // KNMI-severity voor morgen (landelijk hoogste).
  let knmiYellowPlus = false;
  try {
    const warnings = await fetchKNMIWarnings();
    const sev = highestSeverity(warnings);
    knmiYellowPlus = sev === "YELLOW" || sev === "ORANGE" || sev === "RED";
  } catch { /* geen warnings → false */ }

  const onweer = input.oracleGateActive || input.regionThunder;
  const hitte = morgenMax >= 30;
  const kou = morgenMin <= 0;

  let type: HeadsUpType | null = null;
  if (onweer) type = "onweer";
  else if (knmiYellowPlus) type = "knmi";
  else if (hitte) type = "hitte";
  else if (kou) type = "kou";
  if (!type) return null;

  const copy = await headsUpCopy(type, morgenMax);
  const verwacht: Record<HeadsUpType, string> = {
    onweer: "Onweer, windstoten, felle regen",
    knmi: "Pittige omstandigheden — code geel of hoger",
    hitte: `Tot ${Math.round(morgenMax)} graden, veel zon`,
    kou: "Vorst, gladheid of sneeuw",
  };
  return {
    type,
    badge: "Heads-up · morgen",
    titel: copy.titel,
    intro: copy.intro,
    rijen: {
      wanneer: `Morgen, ${morgenLabel().split(" ").slice(0, 2).join(" ")}`,
      waar: type === "onweer" ? "Zuiden & midden van het land" : "Vrijwel het hele land",
      verwacht: verwacht[type],
    },
    advies: copy.advies,
  };
}
```

- [ ] **Step 2: Schrijf de smoke `scripts/test-studio-headsup.ts`**

```typescript
import "dotenv/config";
import { decideHeadsUp } from "@/lib/mariana/studio/headsup";

const mild = [{ name: "Eindhoven", value: 22, region: "Zuid" as const }, { name: "Texel", value: 17, region: "Noord" as const }];
const heet = [{ name: "Maastricht", value: 33, region: "Zuid" as const }, { name: "Texel", value: 24, region: "Noord" as const }];

async function main() {
  const geen = await decideHeadsUp({ morgenRanked: mild, oracleGateActive: false, regionThunder: false });
  console.log("MILD (verwacht null tenzij KNMI geel):", geen?.type ?? "null");

  const onweer = await decideHeadsUp({ morgenRanked: mild, oracleGateActive: true, regionThunder: false });
  console.log("ONWEER:", onweer?.type, "—", onweer?.titel);
  if (onweer?.type !== "onweer") throw new Error("onweer-trigger faalt");

  const hitte = await decideHeadsUp({ morgenRanked: heet, oracleGateActive: false, regionThunder: false });
  console.log("HITTE:", hitte?.type, "—", hitte?.titel);
  if (hitte && hitte.type === "hitte" && !hitte.intro.includes("33")) throw new Error("hitte-intro mist cijfer");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Draai de smoke**

Run: `npx tsx scripts/test-studio-headsup.ts`
Expected: ONWEER → `onweer`, HITTE → `hitte` met "33" in de intro. MILD print `null` of `knmi` afhankelijk van actuele KNMI-status (beide geldig). Geen throw.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "studio/headsup" || echo "headsup schoon"`
Expected: `headsup schoon`

- [ ] **Step 5: Commit**

```bash
git add src/lib/mariana/studio/headsup.ts scripts/test-studio-headsup.ts
git commit -m "feat(studio): heads-up beslislogica (onweer/KNMI/hitte/kou)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Engine + storage + migratie

`runStudio()` bouwt het volledige `StudioDay`-object en `storage.ts` schrijft/leest de rij. Inclusief de Supabase-migratie.

**Files:**
- Create: `supabase/migrations/20260625_mariana_studio.sql`
- Create: `src/lib/mariana/studio/storage.ts`
- Create: `src/lib/mariana/studio/engine.ts`
- Create: `scripts/test-studio.ts`

**Interfaces:**
- Consumes: `forecastRanking`, `regionAverages`, `details`, `currentRanking` niet (live-only); `loadLatestOracleRun`; admin Supabase voor regions/tesla; `dagIntro`, `morgenAlinea`; `decideHeadsUp`.
- Produces:
  - `runStudio(opts?: { dayOffset?: number }): Promise<StudioDay>`
  - `saveStudioDay(day: StudioDay): Promise<{ ok: boolean }>`
  - `loadLatestStudioDay(): Promise<StudioDay | null>`

- [ ] **Step 1: Schrijf `supabase/migrations/20260625_mariana_studio.sql`**

```sql
-- Mariana Studio — dagelijkse TikTok-slide-inhoud (1 rij per dag).
create table if not exists public.mariana_studio (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  forecast_date date not null,
  slide1 jsonb not null,
  slide2 jsonb not null,
  slide3 jsonb not null,
  slide4 jsonb,                       -- nullable: geen heads-up = niet posten
  created_at timestamptz not null default now()
);

create index if not exists mariana_studio_run_at_idx on public.mariana_studio (run_at desc);
```

- [ ] **Step 2: Schrijf `src/lib/mariana/studio/storage.ts`** (mirror van oracle/storage soft-fail)

```typescript
/**
 * Mariana Studio — persistentie (Supabase).
 * Soft-fail als service-role ontbreekt (lokaal/dev): generatie blijft werken.
 * Schema: supabase/migrations/20260625_mariana_studio.sql
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StudioDay } from "./types";

const TABLE = "mariana_studio";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

export async function saveStudioDay(day: StudioDay): Promise<{ ok: boolean }> {
  if (!hasServiceRole()) return { ok: false };
  try {
    const { error } = await adminDb().from(TABLE).insert({
      run_at: day.runAt,
      forecast_date: day.forecastDate,
      slide1: day.slide1,
      slide2: day.slide2,
      slide3: day.slide3,
      slide4: day.slide4,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function loadLatestStudioDay(): Promise<StudioDay | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data } = await adminDb()
      .from(TABLE).select("*").order("run_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return null;
    return {
      forecastDate: data.forecast_date,
      runAt: data.run_at,
      slide1: data.slide1,
      slide2: data.slide2,
      slide3: data.slide3,
      slide4: data.slide4 ?? null,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Schrijf `src/lib/mariana/studio/engine.ts`**

```typescript
/**
 * Mariana Studio — engine. Bouwt één StudioDay uit de cascade + temps + copy.
 * Draait dagelijks (laatste stap van mariana-nl). Cijfers uit de pipeline; tekst via narrative.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadLatestOracleRun } from "@/lib/mariana/oracle/storage";
import { forecastRanking, regionAverages, details } from "./temps";
import { dagIntro, morgenAlinea } from "./narrative";
import { decideHeadsUp } from "./headsup";
import type { StudioDay, Region } from "./types";

function capDate(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}
function isoDate(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
}
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Leest de nieuwste regions-rijen om pollen + onweer-hazard af te leiden. */
async function readRegionsSignal(): Promise<{ pollenHoog: boolean; thunder: boolean }> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("mariana_regions").select("*").order("run_at", { ascending: false }).limit(30);
    const rows = (data ?? []) as Record<string, any>[];
    const seen = new Set<string>();
    const regions: Record<string, any>[] = [];
    for (const r of rows) {
      const slug = String(r.region_slug ?? "");
      if (slug && !seen.has(slug)) { seen.add(slug); regions.push(r); }
    }
    const pollenHoog = regions.some((r) => /hoog/i.test(String(r.signal?.risk_summary?.pollen ?? "")));
    const thunder = regions.some((r) => {
      const flags = (r.local_feed?.hazardFlags ?? []) as string[];
      return flags.includes("thunder") || flags.includes("storm");
    });
    return { pollenHoog, thunder };
  } catch {
    return { pollenHoog: false, thunder: false };
  }
}

export async function runStudio(opts: { dayOffset?: number } = {}): Promise<StudioDay> {
  const dayOffset = opts.dayOffset ?? 0;

  const [todayRanked, tomorrowRanked, det, oracle, regionsSig] = await Promise.all([
    forecastRanking(dayOffset),
    forecastRanking(dayOffset + 1),
    details(dayOffset),
    loadLatestOracleRun().catch(() => null),
    readRegionsSignal(),
  ]);

  if (!todayRanked.length) throw new Error("Studio: geen temperatuurdata");

  const warmst = todayRanked[0];
  const koelst = todayRanked[todayRanked.length - 1];
  const spread = Math.round(warmst.value - koelst.value);
  const regAvg = regionAverages(todayRanked);
  const pollen = regionsSig.pollenHoog ? "Hoog (gras)" : "Laag tot matig";
  const regime = oracle?.signal?.dominant_regime ?? "wisselvallig";
  const morgenMax = tomorrowRanked[0]?.value ?? warmst.value;
  const tendens = morgenMax < warmst.value - 1 ? "iets koeler" : morgenMax > warmst.value + 1 ? "iets warmer" : "vergelijkbaar";

  // Dagdelen (De Bilt-referentie via uur-curve zou exact zijn; hier benadering uit regio-gemiddelde).
  const middag = Math.round(warmst.value);
  const dayparts = {
    ochtend: Math.max(0, middag - 9),
    middag,
    avond: Math.max(0, middag - 4),
    nacht: Math.round(koelst.value) - 2,
  };

  const intro = await dagIntro({ warmst, koelst, spread, pollen, regime });
  const morgenTekst = await morgenAlinea({ morgenMax, tendens, regime });
  const headsUp = await decideHeadsUp({
    morgenRanked: tomorrowRanked,
    oracleGateActive: oracle?.signal?.convective_gate === "ACTIVATE" || oracle?.signal?.run_tesla === true,
    regionThunder: regionsSig.thunder,
  });

  const fietsweer = det.windBft >= 6 ? "Matig" : warmst.value >= 30 ? "Warm" : "Goed";
  const hooikoorts = pollen.startsWith("Hoog") ? "Hoog" : "Laag";

  return {
    forecastDate: isoDate(dayOffset),
    runAt: new Date().toISOString(),
    slide1: {
      badge: `${cap(capDate(dayOffset))} · 08:00`,
      titel: "Vandaag",
      intro,
      regionTemps: regAvg,
      dayparts,
      metrics: { uvIndex: det.uv, hooikoorts, windBft: det.windBft, fietsweer },
      tagline: "Lokale verschillen kunnen groot zijn — bekijk het weer op jouw locatie.",
    },
    slide2: {
      badge: "Nu · 14:00",
      titel: "Actueel weer",
      subtitel: "Zo staat het er nu voor in het land",
      regionTempsNow: null,   // pagina vult live
      warmstePlek: null,      // pagina vult live
    },
    slide3: {
      badge: `Avond · ${capDate(dayOffset).split(" ").slice(1, 3).join(" ")}`,
      titel: "Vandaag & Morgen",
      vandaag: {
        hoogste: { temp: Math.round(warmst.value), plaats: warmst.name },
        laagste: { temp: dayparts.nacht, label: "vannacht" },
        weerfeit: spread >= 10 ? `${spread} graden verschil in het land` : humanWeerfeit(warmst.value),
      },
      morgen: { temp: Math.round(morgenMax), alinea: morgenTekst },
    },
    slide4: headsUp,
  };
}

function humanWeerfeit(max: number): string {
  if (max >= 30) return "Eerste tropische dag";
  if (max >= 25) return "Een echte zomerse dag";
  if (max <= 0) return "IJzige dag";
  return "Wisselvallig weerbeeld";
}
```

> **Let op (regio-volgorde):** `regionAverages` levert `{noord,oost,midden,west,zuid}`; de slide-template toont de volgorde Noord-West-Midden-Oost-Zuid. De pagina (Task 7) mapt expliciet — hier alleen de waarden opslaan.

- [ ] **Step 4: Schrijf de smoke `scripts/test-studio.ts`**

```typescript
import "dotenv/config";
import { runStudio } from "@/lib/mariana/studio/engine";

async function main() {
  const day = await runStudio({ dayOffset: 0 });
  console.log(JSON.stringify(day, null, 2));
  if (!day.slide1.intro || !day.slide1.regionTemps) throw new Error("slide1 incompleet");
  if (!day.slide3.morgen.alinea) throw new Error("slide3 morgen incompleet");
  if (typeof day.slide1.metrics.uvIndex !== "number") throw new Error("metrics incompleet");
  console.log("\nslide4 (heads-up):", day.slide4 ? day.slide4.type : "geen vandaag");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 5: Draai de smoke**

Run: `npx tsx scripts/test-studio.ts`
Expected: een volledig `StudioDay`-JSON met gevulde slide1/2/3, plausibele cijfers, en slide4 = `null` of een heads-up-type. Geen throw.

- [ ] **Step 6: Voer de migratie uit op productie**

Open de Supabase SQL-editor en plak de inhoud van `supabase/migrations/20260625_mariana_studio.sql`. Voer uit. Verifieer:

Run (lokaal, met service-role env): `npx tsx -e "import('@/lib/mariana/studio/storage').then(async m => { console.log(await m.loadLatestStudioDay()); })"`
Expected: `null` (tabel bestaat, nog leeg) — géén "relation does not exist" fout.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "studio/(engine|storage)" || echo "engine/storage schoon"`
Expected: `engine/storage schoon`

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260625_mariana_studio.sql src/lib/mariana/studio/storage.ts src/lib/mariana/studio/engine.ts scripts/test-studio.ts
git commit -m "feat(studio): engine + storage + migratie (mariana_studio)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Cron-integratie + oude mail uit

Studio-generatie aan het eind van `mariana-nl` hangen, de oude `mariana-tiktok-email` cron-entry uit `vercel.json` halen, en de oude route verwijderen.

**Files:**
- Modify: `src/app/(site)/api/cron/mariana-nl/route.ts`
- Modify: `vercel.json`
- Delete: `src/app/(site)/api/cron/mariana-tiktok-email/route.ts`

**Interfaces:**
- Consumes: `runStudio()`, `saveStudioDay()`

- [ ] **Step 1: Voeg de Studio-stap toe in `mariana-nl/route.ts`**

Bovenaan bij de imports:

```typescript
import { runStudio } from "@/lib/mariana/studio/engine";
import { saveStudioDay } from "@/lib/mariana/studio/storage";
```

Breid het `result`-object uit (bij de bestaande declaratie) met:

```typescript
    studio: { ok: false as boolean, persisted: false as boolean, headsUp: null as string | null },
```

Voeg ná de regions-stap (vlak vóór de afsluitende `return NextResponse.json(...)`) toe:

```typescript
  // --- 3. Studio: dagelijkse TikTok-slide-inhoud (leest de zojuist gevulde cascade). ---
  try {
    const day = await runStudio({ dayOffset: 0 });
    result.studio.ok = true;
    result.studio.headsUp = day.slide4?.type ?? null;
    const persisted = await saveStudioDay(day);
    result.studio.persisted = persisted.ok;
  } catch (e) {
    // Studio mag de cascade-cron niet laten falen.
    result.studio.ok = false;
  }
```

> Pas exact aan op de bestaande structuur: zoek de `return NextResponse.json(result ...)` (of vergelijkbaar) onderaan en plaats het blok dáárvoor. Als `result` anders heet, gebruik die naam.

- [ ] **Step 2: Verwijder de oude cron-entry uit `vercel.json`**

Verwijder dit object uit de `crons`-array (regel ~23-26):

```json
    {
      "path": "/api/cron/mariana-tiktok-email",
      "schedule": "..."
    },
```

Verifieer dat de JSON geldig blijft:

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json geldig')"`
Expected: `vercel.json geldig`

- [ ] **Step 3: Verwijder de oude route**

```bash
git rm "src/app/(site)/api/cron/mariana-tiktok-email/route.ts"
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "mariana-nl|mariana-tiktok" || echo "cron schoon"`
Expected: `cron schoon`

- [ ] **Step 5: Smoke de cron lokaal (dev-server vereist)**

Start `npm run dev` in een aparte terminal, dan:

Run: `curl -s "http://localhost:3000/api/cron/mariana-nl?regions=veluwe" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('studio:',j.studio)})"`
Expected: een `studio`-veld in de JSON met `ok:true` (en `persisted:true` als service-role aanwezig). (Subset `?regions=` houdt de run kort.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/api/cron/mariana-nl/route.ts" vercel.json
git commit -m "feat(studio): generatie als laatste stap van mariana-nl; oude tiktok-mail eruit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Endpoints + gate

`/api/studio/today` (persisted) en `/api/studio/live` (nu gemeten, met stale-fallback), plus de secret-gate helper die pagina + endpoints delen.

**Files:**
- Create: `src/lib/mariana/studio/gate.ts`
- Create: `src/app/(site)/api/studio/today/route.ts`
- Create: `src/app/(site)/api/studio/live/route.ts`

**Interfaces:**
- Consumes: `loadLatestStudioDay()`, `currentRanking()`, `regionAverages()`
- Produces:
  - `studioGateOk(req: Request): boolean`
  - `GET /api/studio/today` → `{ ok: boolean; day: StudioDay | null }`
  - `GET /api/studio/live` → `{ ok: boolean; stale: boolean; regionTempsNow: RegionTemps; warmstePlek: { naam: string; temp: number } }`

- [ ] **Step 1: Schrijf `src/lib/mariana/studio/gate.ts`**

```typescript
/**
 * Mariana Studio — lichte secret-gate. /admin is niet afgeschermd; deze gate
 * beschermt de Studio-pagina + endpoints met een cookie tegen STUDIO_SECRET.
 * Lokaal (dev) altijd open.
 */

export const STUDIO_COOKIE = "studio_key";

export function studioGateOk(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.STUDIO_SECRET;
  if (!secret) return false; // dichtgetimmerd als er geen secret gezet is
  const url = new URL(req.url);
  if (url.searchParams.get("key") === secret) return true;
  const cookie = req.headers.get("cookie") ?? "";
  return cookie.split(";").some((c) => c.trim() === `${STUDIO_COOKIE}=${secret}`);
}
```

- [ ] **Step 2: Schrijf `src/app/(site)/api/studio/today/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { studioGateOk } from "@/lib/mariana/studio/gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!studioGateOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const day = await loadLatestStudioDay();
  return NextResponse.json({ ok: Boolean(day), day });
}
```

- [ ] **Step 3: Schrijf `src/app/(site)/api/studio/live/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { currentRanking, regionAverages } from "@/lib/mariana/studio/temps";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { studioGateOk } from "@/lib/mariana/studio/gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!studioGateOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const ranked = await currentRanking();
    if (!ranked.length) throw new Error("geen current data");
    const warmst = ranked[0];
    return NextResponse.json({
      ok: true,
      stale: false,
      regionTempsNow: regionAverages(ranked),
      warmstePlek: { naam: warmst.name, temp: Math.round(warmst.value) },
    });
  } catch {
    // Terugval: verwachte cijfers uit de persisted dag-rij.
    const day = await loadLatestStudioDay();
    const fc = day?.slide1.regionTemps ?? { noord: 0, oost: 0, midden: 0, west: 0, zuid: 0 };
    const warm = day ? Math.round(day.slide3.vandaag.hoogste.temp) : 0;
    const plaats = day?.slide3.vandaag.hoogste.plaats ?? "—";
    return NextResponse.json({
      ok: true, stale: true,
      regionTempsNow: fc,
      warmstePlek: { naam: plaats, temp: warm },
    });
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "api/studio|studio/gate" || echo "endpoints schoon"`
Expected: `endpoints schoon`

- [ ] **Step 5: Smoke de endpoints (dev-server)**

Run:
```bash
curl -s "http://localhost:3000/api/studio/today" | head -c 400; echo
curl -s "http://localhost:3000/api/studio/live" | head -c 400; echo
```
Expected: `/today` geeft `{"ok":...,"day":...}`; `/live` geeft `regionTempsNow` met 5 regio's + `warmstePlek`. (Lokaal is de gate open.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/mariana/studio/gate.ts "src/app/(site)/api/studio/today/route.ts" "src/app/(site)/api/studio/live/route.ts"
git commit -m "feat(studio): /api/studio/today + /live endpoints met secret-gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Studio-pagina (port van de zip-HTML)

De pagina rendert de 4 templates, vult ze met `/today`, patcht slide 2 met `/live`, houdt `contenteditable` + PNG-export, en zit achter de gate.

**Files:**
- Create: `src/app/(site)/admin/studio/reference.html` (verbatim kopie van de zip)
- Create: `public/studio/weerzone-logo.png`
- Create: `src/app/(site)/admin/studio/page.tsx`
- Create: `src/app/(site)/admin/studio/StudioClient.tsx`
- Modify: `package.json` (dep `html-to-image`)

**Interfaces:**
- Consumes: `GET /api/studio/today`, `GET /api/studio/live`, `studioGateOk` (gate.ts)

- [ ] **Step 1: Voeg de dependency toe**

Run: `npm install html-to-image@1.11.13`
Expected: `package.json` + lockfile bijgewerkt, geen errors.

- [ ] **Step 2: Kopieer de port-bron + assets in de repo**

Kopieer het bestand `Weerzone Studio.html` uit de uitgepakte zip naar `src/app/(site)/admin/studio/reference.html` (verbatim — dit is de bron-of-truth voor de exacte markup/CSS). Kopieer `weerzone-logo.png` uit de zip naar `public/studio/weerzone-logo.png`. (Inter is al een Next-font in de repo of via globals; gebruik de bestaande site-font — geen losse `.ttf` nodig.)

```bash
mkdir -p public/studio
# vervang <ZIP> door het uitgepakte zip-pad
cp "<ZIP>/Weerzone Studio.html" "src/app/(site)/admin/studio/reference.html"
cp "<ZIP>/weerzone-logo.png" public/studio/weerzone-logo.png
```

- [ ] **Step 3: Schrijf `src/app/(site)/admin/studio/page.tsx`** (server-wrapper: gate + noindex)

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { studioGateOk } from "@/lib/mariana/studio/gate";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const sp = await searchParams;
  const h = await headers();
  // Reconstrueer een Request-achtig object voor de gate-check.
  const fakeReq = new Request(`https://x/admin/studio?key=${sp.key ?? ""}`, {
    headers: { cookie: h.get("cookie") ?? "" },
  });
  if (!studioGateOk(fakeReq)) {
    return (
      <div style={{ padding: 48, fontFamily: "sans-serif", color: "#fff", background: "#0c1838", minHeight: "100vh" }}>
        <h1>Studio — afgeschermd</h1>
        <p>Voeg <code>?key=…</code> toe aan de URL om toegang te krijgen.</p>
      </div>
    );
  }
  return <StudioClient unlockKey={sp.key ?? ""} />;
}
```

> Als de site `STUDIO_SECRET` matcht via querystring, zet de client (Step 4) de cookie zodat verversen zonder `?key=` blijft werken.

- [ ] **Step 4: Schrijf `src/app/(site)/admin/studio/StudioClient.tsx`**

Dit is de port van `reference.html` naar één client-component. Volg deze regels exact:

1. `"use client"` bovenaan.
2. Plak de **volledige markup + inline CSS** van de vier `.slide`-blokken uit `reference.html` verbatim in de JSX (zet `class=` → `className=`, `contenteditable="true"` → `contentEditable suppressContentEditableWarning`, `style="..."` → `style={{...}}`-objecten, en de logo-`src` → `/studio/weerzone-logo.png`). Behoud de `<style>`-regels door ze in een `<style>{`...`}</style>`-tag in de component te zetten (de scaler/`.slide`/`.pad`/`.region-col`/`.rank-row` regels).
3. Vervang elke placeholder-tekst/cijfer door een waarde uit de geladen `StudioDay` (zie de binding-tabel hieronder). Houd elk veld `contentEditable` zodat handmatige tweaks mogelijk blijven.
4. Behoud de download-knoppenbalk + de `html-to-image` export (1080×1920, pixelRatio 2), maar importeer als module: `import { toPng } from "html-to-image";`.
5. Verberg `slide4` volledig als `day.slide4 == null`.

**Component-skelet:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import type { StudioDay, RegionTemps } from "@/lib/mariana/studio/types";

const SLIDES: Array<[string, string]> = [
  ["slide1", "0800-dagverwachting"],
  ["slide2", "1400-actueel"],
  ["slide3", "2000-vandaag-en-morgen"],
  ["slide4", "2200-heads-up"],
];

export default function StudioClient({ unlockKey }: { unlockKey: string }) {
  const [day, setDay] = useState<StudioDay | null>(null);
  const [live, setLive] = useState<{ regionTempsNow: RegionTemps; warmstePlek: { naam: string; temp: number } } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Zet de cookie zodat verversen zonder ?key blijft werken.
    if (unlockKey) document.cookie = `studio_key=${unlockKey}; path=/; max-age=86400`;
    fetch("/api/studio/today").then((r) => r.json()).then((d) => setDay(d.day ?? null)).catch(() => {});
    fetch("/api/studio/live").then((r) => r.json()).then(setLive).catch(() => {});
  }, [unlockKey]);

  async function exportSlide(id: string, label: string) {
    const node = document.getElementById(id);
    if (!node) return;
    const dataUrl = await toPng(node, { width: 1080, height: 1920, pixelRatio: 2, cacheBust: true, style: { transform: "none" } });
    const a = document.createElement("a");
    a.download = `weerzone-${new Date().toISOString().slice(0, 10)}-${label}.png`;
    a.href = dataUrl;
    a.click();
  }
  async function download(target: string) {
    setBusy(true);
    try {
      if (target === "all") {
        for (const [id, label] of SLIDES) {
          if (id === "slide4" && !day?.slide4) continue;
          await exportSlide(id, label);
          await new Promise((r) => setTimeout(r, 400));
        }
      } else {
        const found = SLIDES.find((s) => s[0] === target);
        await exportSlide(target, found ? found[1] : target);
      }
    } catch (e) { alert("Export mislukt: " + (e as Error).message); }
    setBusy(false);
  }

  // ... render: toolbar met knoppen (download('slide1'..'slide4','all'), disabled={busy}),
  //     daaronder de vier .slide-blokken (verbatim port), met velden uit `day`/`live`.
  //     slide4 alleen tonen als day?.slide4 bestaat.
  return null; // vervang door de volledige JSX-port
}
```

**Binding-tabel (placeholder → veld):**

| Slide | Template-placeholder | Bron |
|---|---|---|
| 1 | badge "Dinsdag 23 juni · 08:00" | `day.slide1.badge` |
| 1 | titel "Vandaag" | `day.slide1.titel` |
| 1 | intro-alinea | `day.slide1.intro` |
| 1 | regio 25°/29°/31°/30°/32° (Noord/West/Midden/Oost/Zuid) | `day.slide1.regionTemps.{noord,west,midden,oost,zuid}` + `°` |
| 1 | dagdelen 22°/31°/27°/19° (Ochtend/Middag/Avond/Nacht) | `day.slide1.dayparts.{ochtend,middag,avond,nacht}` |
| 1 | UV "7" / Hooikoorts "Hoog" / Wind "3 Bft" / Fietsweer "Goed" | `day.slide1.metrics.{uvIndex,hooikoorts,windBft+" Bft",fietsweer}` |
| 1 | tagline | `day.slide1.tagline` |
| 2 | badge "Nu · 14:00" | `day.slide2.badge` |
| 2 | titel / subtitel | `day.slide2.titel` / `day.slide2.subtitel` |
| 2 | "Nu gemeten" 23°/27°/30°/29°/33° (Noord/West/Midden/Oost/Zuid) | `live.regionTempsNow.{noord,west,midden,oost,zuid}` + `°` |
| 2 | "Warmste plek nu" Maastricht / 33° | `live.warmstePlek.naam` / `live.warmstePlek.temp+"°"` |
| 3 | badge "Avond · 23 juni" | `day.slide3.badge` |
| 3 | titel "Vandaag & Morgen" | `day.slide3.titel` |
| 3 | Hoogste 34° Maastricht | `day.slide3.vandaag.hoogste.temp+"°"` / `.plaats` |
| 3 | Laagste 12° vannacht | `day.slide3.vandaag.laagste.temp+"°"` / `.label` |
| 3 | Weerfeit | `day.slide3.vandaag.weerfeit` |
| 3 | Morgen 29° + alinea | `day.slide3.morgen.temp+"°"` / `day.slide3.morgen.alinea` |
| 4 | badge / titel / intro | `day.slide4.badge` / `.titel` / `.intro` |
| 4 | Wanneer / Waar / Verwacht | `day.slide4.rijen.{wanneer,waar,verwacht}` |
| 4 | Advies | `day.slide4.advies` |

> Bij `day == null` of `live == null`: laat de verbatim placeholder-tekst staan (gebruik `day?.slide1.intro ?? "<placeholder>"`-patroon). Zo rendert de pagina nooit leeg.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "admin/studio" || echo "pagina schoon"`
Expected: `pagina schoon`

- [ ] **Step 6: Visuele verificatie (dev-server)**

Open `http://localhost:3000/admin/studio` (lokaal is de gate open). Verwacht: vier slide-previews; slide 1/3 gevuld met de dag-data, slide 2 met live "nu gemeten" cijfers, slide 4 alleen zichtbaar bij een heads-up. Klik "↓ 08:00" → er downloadt een 1080×1920 PNG. Tweak een `contenteditable`-veld → de PNG neemt de wijziging mee.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(site)/admin/studio/" public/studio/weerzone-logo.png package.json package-lock.json
git commit -m "feat(studio): /admin/studio pagina — live-gevoede slide-templates + PNG-export

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Eindverificatie

**Files:** geen (verificatie).

- [ ] **Step 1: Volledige typecheck van alle nieuwe bestanden**

Run: `npx tsc --noEmit 2>&1 | grep -E "studio" || echo "alle studio-bestanden type-schoon"`
Expected: `alle studio-bestanden type-schoon`

- [ ] **Step 2: Build-rooktest** (CLAUDE.md/memory: build-rooktest vóór deploy)

Run: `npm run build 2>&1 | tail -20`
Expected: build slaagt (geen module-resolutie- of import-fouten op de nieuwe routes).

- [ ] **Step 3: End-to-end lokaal**

Met dev-server: draai `curl -s "http://localhost:3000/api/cron/mariana-nl?regions=veluwe"` (vult o.a. `mariana_studio`), open dan `/admin/studio` en bevestig dat de echte dag-data verschijnt.

- [ ] **Step 4: Eindcommit (indien nog losse wijzigingen)**

```bash
git add -A && git commit -m "chore(studio): eindverificatie

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || echo "niets te committen"
```

---

## Deploy (na goedkeuring, buiten dit plan)

Conform memory: productie draait op CLI-deploy + promote van branch `weerzone-agents-fase1`. Na merge naar die branch: `vercel deploy --prod` **en** `vercel promote <url>`, plus de SQL-migratie via de Supabase SQL-editor (Step 6 Task 4) en `STUDIO_SECRET` als env in Vercel zetten. Dit zit bewust níét in de geautomatiseerde taken — Rowan beslist over deploy.
