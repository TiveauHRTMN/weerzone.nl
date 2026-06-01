# Koos Getaway-Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw Koos' getaway-engine — een pure scoring-laag die jouw locatie vergelijkt met haalbare NL-plekken én een vaste internationale zon-set, plus de sjabloon-stem en de `/koos`-pagina die het rendert. Koos zwijgt als er niets beters is.

**Architecture:** Volgt het Blok-A-patroon: **pure logica los van I/O**. De pure functies (`comfortScore`, `scoreGetaways`, `koosTemplateLine`, `haversineKm`) zijn testbaar via een tsx assert-script — de repo heeft geen unit-runner, dus géén jest/vitest verzinnen. De I/O-laag (`fetchDailyOutlook`, `findGetaways`) haalt open-meteo daily-data op met `next.revalidate`-cache. De `/koos`-pagina wordt een async server component die de actieve locatie uit cookies leest.

**Tech Stack:** TypeScript, Next.js 16 App Router (server components), open-meteo daily API, `node:assert/strict` via `npx tsx`.

**In scope (OpenRouter-tegoed staat — 2026-06-01):** de Deepseek-V4-stem op `/koos` is nu Task 4. De sjabloon-stem (`koosTemplateLine`) blijft de veerkrachtige basis/fallback wanneer de LLM faalt of er geen tegoed is.

**Out of scope (aparte vervolgplannen, elk bouwt op deze engine):**
- Het **Koos-blok op de 10K SEO-locatiepagina's** (vraagt een caching/precompute-beslissing voor de hot path — apart plan).
- **Koos in Piets dagmail** + de `composeAgents`-laag (`AgentHeadsUp[]`).

---

## File Structure

- `src/lib/koos-getaway.ts` *(nieuw)* — de engine. Pure exports: `GetawayKind`, `GetawayOrigin`, `DailyOutlook`, `comfortScore`, `haversineKm`, `scoreGetaways`, `koosTemplateLine`, `INTERNATIONAL_SUNSET`. I/O exports: `fetchDailyOutlook`, `findGetaways`. Levert `WeatherOpportunity[]` (type bestaat al in `src/lib/agents/types.ts`). **Géén `next/cache`/`hermes`-import hier** — dan blijft de check-script puur en snel.
- `scripts/check-koos-getaway.ts` *(nieuw)* — tsx assert-script voor de pure functies (geen netwerk).
- `src/lib/koos-voice.ts` *(nieuw)* — de Deepseek-V4-stem (`koosVoice`), los van de engine zoals `piet-forecast.ts` los staat van `piet-context.ts`. Importeert `unstable_cache` + `hermesChat`; cachet per locatie/dag; faalt zacht naar `null`.
- `src/app/(site)/koos/page.tsx` *(wijzigen)* — van "coming soon" naar async server component die `findGetaways` rendert met `koosTemplateLine` + rust-staat, en in Task 4 de `koosVoice`-intro erbovenop.

**Hergebruikte bestaande interfaces (niet wijzigen):**
- `src/lib/agents/types.ts` → `WeatherOpportunity` (velden: `originLocationId`, `targetLocationId`, `targetName`, `score`, `reason`, `distanceKm?`, `confidence?`, `bestMomentStart?`, `bestMomentEnd?`, `travelTimeMinutes?`).
- `src/lib/places-data.ts` → `NL_PLACES: Place[]`, `placeRouteSlug(place)`, `Place` (`name`, `province`, `lat`, `lon`, `population?`).
- `src/lib/location-cookies.ts` → `getSavedLocationServer()` → `{ lat, lon, name } | null`.
- `src/components/WeerzoneBackground` (default export, al gebruikt op de pagina).

---

## Task 1: Pure scoring-laag in `koos-getaway.ts` (test-first)

**Files:**
- Create: `src/lib/koos-getaway.ts`
- Test: `scripts/check-koos-getaway.ts`

- [ ] **Step 1: Write the failing check-script**

Create `scripts/check-koos-getaway.ts`:

```ts
import assert from "node:assert/strict";
import {
  comfortScore,
  haversineKm,
  scoreGetaways,
  koosTemplateLine,
  INTERNATIONAL_SUNSET,
  type DailyOutlook,
} from "../src/lib/koos-getaway";

function outlook(over: Partial<DailyOutlook>): DailyOutlook {
  return {
    name: "X",
    locationId: "x",
    lat: 52,
    lon: 5,
    kind: "domestic",
    tempMax: 18,
    precipProbMax: 40,
    sunshineHours: 4,
    weatherCode: 3,
    distanceKm: 0,
    ...over,
  };
}

// 1. comfortScore: zonnig+droog+22° scoort hoger dan grauw+nat+koud.
const warm = comfortScore({ tempMax: 22, precipProbMax: 5, sunshineHours: 11 });
const grey = comfortScore({ tempMax: 12, precipProbMax: 80, sunshineHours: 1 });
assert.ok(warm > grey, "zonnige dag moet hoger scoren dan grauwe");
assert.ok(warm <= 1 && grey >= 0, "score moet binnen 0..1 vallen");

// 2. haversineKm: Amsterdam -> Maastricht ~ 175 km (ruwe check 150..210).
const km = haversineKm({ lat: 52.37, lon: 4.9 }, { lat: 50.85, lon: 5.69 });
assert.ok(km >= 150 && km <= 210, `afstand AMS-MST onverwacht: ${km}`);

// 3. Binnenlandse plek die merkbaar beter is -> verschijnt, score > 0.
const origin = outlook({ tempMax: 13, precipProbMax: 70, sunshineHours: 1, locationId: "thuis" });
const better = outlook({ name: "Maastricht", locationId: "limburg/maastricht", tempMax: 21, precipProbMax: 10, sunshineHours: 9, distanceKm: 175 });
const r1 = scoreGetaways(origin, [better]);
assert.equal(r1.length, 1, "betere NL-plek moet verschijnen");
assert.ok(r1[0].score > 0, "score moet positief zijn");
assert.equal(r1[0].targetName, "Maastricht", "targetName moet kloppen");

// 4. Koos zwijgt: een even goede / slechtere plek levert lege output.
const sameish = outlook({ name: "Bijna-Thuis", locationId: "x/y", tempMax: 13, precipProbMax: 68, sunshineHours: 1, distanceKm: 40 });
assert.equal(scoreGetaways(origin, [sameish]).length, 0, "geen merkbaar betere plek -> Koos zwijgt");

// 5. Internationale zon-gate: bij prima thuisweer NIET tonen.
const mildHome = outlook({ tempMax: 21, precipProbMax: 15, sunshineHours: 8, locationId: "thuis" });
const sunny = outlook({ name: "Valencia", locationId: "sunset-valencia", kind: "sunset", tempMax: 26, precipProbMax: 5, sunshineHours: 11, distanceKm: 1500 });
assert.equal(scoreGetaways(mildHome, [sunny]).length, 0, "bij goed thuisweer geen zon-ontsnapping");

// 6. Internationale zon-gate: bij grauw/koud thuis WEL tonen.
const r2 = scoreGetaways(origin, [sunny]);
assert.equal(r2.length, 1, "bij grauw thuisweer wel zon-ontsnapping");
assert.equal(r2[0].targetName, "Valencia", "zon-bestemming moet kloppen");

// 7. koosTemplateLine: niet-lege NL-zin met de bestemmingsnaam erin.
const line = koosTemplateLine(r1[0]);
assert.ok(line.length > 0 && line.includes("Maastricht"), "sjabloon-zin moet bestemming noemen");

// 8. INTERNATIONAL_SUNSET bevat de 5 default-bestemmingen.
assert.equal(INTERNATIONAL_SUNSET.length, 5, "verwacht 5 zon-bestemmingen");
assert.ok(INTERNATIONAL_SUNSET.every((d) => d.lat && d.lon && d.name && d.locationId), "elke bestemming compleet");

console.log("OK - koos-getaway pure logica gedraagt zich correct");
```

- [ ] **Step 2: Run the check-script to verify it fails**

Run: `npx tsx scripts/check-koos-getaway.ts`
Expected: FAIL — module `../src/lib/koos-getaway` bestaat nog niet (resolve/​import error).

- [ ] **Step 3: Implement the pure layer**

Create `src/lib/koos-getaway.ts` met alléén de pure laag (I/O komt in Task 2):

```ts
/**
 * Koos — de ontsnappings-lens.
 *
 * Vergelijkt jouw locatie met haalbare NL-plekken (binnenlands) en een vaste
 * internationale zon-set. Koos toont alleen iets als er ÉCHT iets beters is;
 * stralende dag thuis -> Koos zwijgt (lege array = geldige output).
 *
 * Patroon volgt Blok A: pure scoring hier, I/O (open-meteo) onderaan, zodat de
 * scoring testbaar is via scripts/check-koos-getaway.ts (geen unit-runner).
 *
 * Guardrail (spec §6): nooit een boeking/vlucht/hotel/affiliate. Alleen "daar
 * is het zo."
 */

import type { WeatherOpportunity } from "@/lib/agents/types";

export type GetawayKind = "domestic" | "sunset";

export interface GetawayOrigin {
  name: string;
  lat: number;
  lon: number;
  /** Optionele interne id van de herkomst-locatie. */
  locationId?: string;
}

export interface DailyOutlook {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  kind: GetawayKind;
  /** °C, dagmaximum. */
  tempMax: number;
  /** 0..100, max neerslagkans op de dag. */
  precipProbMax: number;
  /** Uren zon op de dag. */
  sunshineHours: number;
  /** WMO weather code. */
  weatherCode: number;
  /** Afstand vanaf de herkomst, km. */
  distanceKm: number;
}

const IDEAL_TEMP = 22;

/** Comfort 0..1 uit zon (45%), droogte (35%) en temperatuur-comfort (20%). */
export function comfortScore(o: {
  tempMax: number;
  precipProbMax: number;
  sunshineHours: number;
}): number {
  const sun = Math.min(Math.max(o.sunshineHours, 0), 12) / 12;
  const dry = 1 - Math.min(Math.max(o.precipProbMax, 0), 100) / 100;
  const temp = Math.max(0, 1 - Math.abs(o.tempMax - IDEAL_TEMP) / 18);
  return 0.45 * sun + 0.35 * dry + 0.2 * temp;
}

/** Hemelsbrede afstand in hele km. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Vaste internationale zon-set (v1). Pas hier aan om de set te wijzigen. */
export const INTERNATIONAL_SUNSET: readonly {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
}[] = [
  { name: "Valencia", locationId: "sunset-valencia", lat: 39.47, lon: -0.38 },
  { name: "Barcelona", locationId: "sunset-barcelona", lat: 41.39, lon: 2.17 },
  { name: "Algarve (Faro)", locationId: "sunset-algarve", lat: 37.02, lon: -7.93 },
  { name: "Canarische Eilanden", locationId: "sunset-canarias", lat: 28.29, lon: -16.63 },
  { name: "Malta", locationId: "sunset-malta", lat: 35.9, lon: 14.51 },
];

// Drempels: hoeveel beter een plek moet zijn voor Koos iets zegt.
const DOMESTIC_THRESHOLD = 0.18; // binnenlandse plek moet merkbaar beter zijn
const SUNSET_MIN_TEMP = 20; // zon-bestemming moet écht warm zijn
const SUNSET_MAX_PRECIP = 25; // ...en droog
const HOME_GREY_PRECIP = 55; // thuis "grauw" vanaf deze neerslagkans
const HOME_COLD_TEMP = 14; // ...of zo koud

function buildReason(origin: DailyOutlook, c: DailyOutlook): string {
  const there = `${Math.round(c.tempMax)}°`;
  if (c.kind === "sunset") {
    return `Hier blijft het grauw; in ${c.name} is het ${there} en zonnig.`;
  }
  if (origin.precipProbMax - c.precipProbMax >= 30) {
    return `Hier kans op regen, in ${c.name} blijft het droog (${there}).`;
  }
  return `In ${c.name} is het zonniger en ${there}.`;
}

/**
 * Rangschik kansen. Binnenlands: alleen als merkbaar beter dan thuis.
 * Internationaal: alleen als het thuis grauw/koud is én daar écht zon.
 * Lege array = niets beters → Koos zwijgt.
 */
export function scoreGetaways(
  origin: DailyOutlook,
  candidates: readonly DailyOutlook[],
  opts: { limit?: number } = {},
): WeatherOpportunity[] {
  const limit = opts.limit ?? 3;
  const originScore = comfortScore(origin);
  const homeIsGrey =
    origin.precipProbMax >= HOME_GREY_PRECIP || origin.tempMax <= HOME_COLD_TEMP;

  const ops: WeatherOpportunity[] = [];
  for (const c of candidates) {
    if (c.kind === "sunset") {
      if (!homeIsGrey) continue;
      if (c.tempMax < SUNSET_MIN_TEMP || c.precipProbMax > SUNSET_MAX_PRECIP) continue;
    } else if (comfortScore(c) - originScore < DOMESTIC_THRESHOLD) {
      continue;
    }
    const delta = comfortScore(c) - originScore;
    if (delta <= 0) continue;
    ops.push({
      originLocationId: origin.locationId,
      targetLocationId: c.locationId,
      targetName: c.name,
      score: Math.round(delta * 100),
      reason: buildReason(origin, c),
      distanceKm: c.distanceKm,
    });
  }
  return ops.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Sjabloon-stem (gratis, schaalt naar 10K). Geen LLM. */
export function koosTemplateLine(op: WeatherOpportunity): string {
  const dist = op.distanceKm ? ` — ${op.distanceKm} km` : "";
  return `${op.reason}${dist}`;
}
```

- [ ] **Step 4: Run the check-script to verify it passes**

Run: `npx tsx scripts/check-koos-getaway.ts`
Expected: PASS — `OK - koos-getaway pure logica gedraagt zich correct`

- [ ] **Step 5: Commit**

```bash
git add src/lib/koos-getaway.ts scripts/check-koos-getaway.ts
git commit -m "feat(koos): pure getaway-scoring + sjabloon-stem (test-first)"
```

---

## Task 2: I/O-laag — open-meteo daily fetch + `findGetaways`

**Files:**
- Modify: `src/lib/koos-getaway.ts` (append onder de pure laag)

- [ ] **Step 1: Implement the I/O layer**

Voeg onderaan `src/lib/koos-getaway.ts` toe (importeer ook de places-helpers — pas de bestaande importregels bovenaan aan):

Bovenaan, vlak ná de bestaande `WeatherOpportunity`-import, toevoegen:

```ts
import { NL_PLACES, placeRouteSlug } from "@/lib/places-data";
```

Onderaan het bestand:

```ts
const OPEN_METEO_DAILY = "https://api.open-meteo.com/v1/forecast";

// Reisband voor binnenlandse kandidaten: ver genoeg om te verschillen,
// dichtbij genoeg om er heen te gaan.
const TRAVEL_MIN_KM = 25;
const TRAVEL_MAX_KM = 160;
const DOMESTIC_CANDIDATES = 8;

interface CandidateLoc {
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  kind: GetawayKind;
  distanceKm: number;
}

function domesticCandidates(origin: GetawayOrigin): CandidateLoc[] {
  return NL_PLACES
    .map((p) => ({ p, km: haversineKm(origin, p) }))
    .filter(({ km }) => km >= TRAVEL_MIN_KM && km <= TRAVEL_MAX_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, DOMESTIC_CANDIDATES)
    .map(({ p, km }) => ({
      name: p.name,
      locationId: `${p.province}/${placeRouteSlug(p)}`,
      lat: p.lat,
      lon: p.lon,
      kind: "domestic" as const,
      distanceKm: km,
    }));
}

/** Haal de daily-outlook voor één locatie. Null bij build-tijd of fout. */
export async function fetchDailyOutlook(
  loc: CandidateLoc,
  dayIndex = 0,
): Promise<DailyOutlook | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const url = `${OPEN_METEO_DAILY}?${new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    daily: "temperature_2m_max,precipitation_probability_max,sunshine_duration,weathercode",
    forecast_days: "3",
    timezone: "auto",
  })}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.daily;
    if (!d || !Array.isArray(d.time) || d.time.length <= dayIndex) return null;
    return {
      name: loc.name,
      locationId: loc.locationId,
      lat: loc.lat,
      lon: loc.lon,
      kind: loc.kind,
      tempMax: Number(d.temperature_2m_max?.[dayIndex] ?? NaN),
      precipProbMax: Number(d.precipitation_probability_max?.[dayIndex] ?? 0),
      sunshineHours: Number(d.sunshine_duration?.[dayIndex] ?? 0) / 3600,
      weatherCode: Number(d.weathercode?.[dayIndex] ?? 0),
      distanceKm: loc.distanceKm,
    };
  } catch {
    return null;
  }
}

/**
 * Vind getaways voor een herkomst-locatie. Vergelijkt thuis met nabije NL-plekken
 * + de internationale zon-set. Lege array = niets beters (Koos zwijgt) of geen
 * data.
 */
export async function findGetaways(
  origin: GetawayOrigin,
  opts: { dayIndex?: number; limit?: number } = {},
): Promise<WeatherOpportunity[]> {
  const dayIndex = opts.dayIndex ?? 0;
  const originLoc: CandidateLoc = {
    name: origin.name,
    locationId: origin.locationId ?? "origin",
    lat: origin.lat,
    lon: origin.lon,
    kind: "domestic",
    distanceKm: 0,
  };
  const candidates: CandidateLoc[] = [
    ...domesticCandidates(origin),
    ...INTERNATIONAL_SUNSET.map((s) => ({
      ...s,
      kind: "sunset" as const,
      distanceKm: haversineKm(origin, s),
    })),
  ];
  const [originOutlook, ...rest] = await Promise.all([
    fetchDailyOutlook(originLoc, dayIndex),
    ...candidates.map((c) => fetchDailyOutlook(c, dayIndex)),
  ]);
  if (!originOutlook || Number.isNaN(originOutlook.tempMax)) return [];
  const valid = rest.filter(
    (o): o is DailyOutlook => o !== null && !Number.isNaN(o.tempMax),
  );
  return scoreGetaways(originOutlook, valid, { limit: opts.limit });
}
```

- [ ] **Step 2: Re-run the pure check-script (must still pass — I/O changes mustn't break pure layer)**

Run: `npx tsx scripts/check-koos-getaway.ts`
Expected: PASS — `OK - koos-getaway pure logica gedraagt zich correct`

- [ ] **Step 3: Smoke-test the live fetch (network)**

Create a throwaway check and run it, then delete it:

```bash
npx tsx -e "import('./src/lib/koos-getaway').then(async m => { const r = await m.findGetaways({ name: 'De Bilt', lat: 52.1, lon: 5.18 }); console.log('getaways:', r.length, r.slice(0,2)); })"
```
Expected: prints `getaways: N [...]` zonder throw (N kan 0 zijn als het overal vergelijkbaar weer is — dat is geldig).

- [ ] **Step 4: Commit**

```bash
git add src/lib/koos-getaway.ts
git commit -m "feat(koos): open-meteo daily-fetch + findGetaways I/O-laag"
```

---

## Task 3: `/koos`-pagina — van "coming soon" naar live getaways

**Files:**
- Modify: `src/app/(site)/koos/page.tsx`

- [ ] **Step 1: Replace the page with an async server component**

Vervang de volledige inhoud van `src/app/(site)/koos/page.tsx` door:

```tsx
import type { Metadata } from "next";
import WeerzoneBackground from "@/components/WeerzoneBackground";
import { hreflangSelf } from "@/lib/hreflang";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { findGetaways, koosTemplateLine } from "@/lib/koos-getaway";

export const metadata: Metadata = {
  title: "Koos — als je eropuit wilt",
  description:
    "Koos vergelijkt jouw plek met haalbare bestemmingen en zegt waar het de komende dagen fijner is. Alleen als er écht iets beters is.",
  alternates: {
    canonical: "https://weerzone.nl/koos",
    languages: hreflangSelf("nl", "/koos"),
  },
};

const DEFAULT_ORIGIN = { name: "De Bilt", lat: 52.1, lon: 5.18 };

export default async function KoosPage() {
  const saved = await getSavedLocationServer();
  const origin = saved ?? DEFAULT_ORIGIN;
  const getaways = await findGetaways(origin);

  return (
    <>
      <WeerzoneBackground />
      <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center text-white">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
          Koos
        </h1>
        <p className="mt-3 text-lg text-white/85">Als je eropuit wilt.</p>

        {getaways.length === 0 ? (
          <p className="mt-10 max-w-sm text-base text-white/80">
            Thuis zit je de komende dagen prima. Koos houdt het in de gaten en
            zegt het zodra er ergens iets beters opduikt.
          </p>
        ) : (
          <ul className="mt-10 w-full space-y-3 text-left">
            {getaways.map((op) => (
              <li
                key={op.targetLocationId}
                className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm"
              >
                <p className="text-base font-semibold text-white">
                  {op.targetName}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {koosTemplateLine(op)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-[11px] font-medium text-white/50">
          Koos adviseert alleen — nooit boekingen.
        </p>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Type-check the touched file (project-wide `tsc` is bekend kapot — alleen dit bestand redeneren)**

Lees `src/app/(site)/koos/page.tsx` terug en bevestig: imports kloppen met de exports uit Task 1/2 (`findGetaways`, `koosTemplateLine`), `getSavedLocationServer()` wordt `await`'d, en `op.targetLocationId`/`op.targetName`/`op.distanceKm` bestaan op `WeatherOpportunity`.

> Let op: `next.config.ts` heeft `typescript.ignoreBuildErrors: true`, en project-brede `npx tsc --noEmit` crasht op de bekende V8-Map-bug (zie `mariana/tesla/types.ts`-comments). Verifieer dit bestand dus met de hand, niet via `tsc`.

- [ ] **Step 3: Run the dev server and verify the page renders**

Run: `npm run dev`
Open `http://localhost:3000/koos` in de browser.
Expected: De Koos-pagina rendert zonder runtime-error; toont óf een lijst getaways, óf de rust-staat ("Thuis zit je de komende dagen prima…"). Beide zijn geldig.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/koos/page.tsx"
git commit -m "feat(koos): /koos rendert live getaways met sjabloon-stem + rust-staat"
```

---

## Task 4: Deepseek-V4-stem (`koos-voice.ts`) + wire into `/koos`

**Files:**
- Create: `src/lib/koos-voice.ts`
- Modify: `src/app/(site)/koos/page.tsx`

- [ ] **Step 1: Create the voice module**

Create `src/lib/koos-voice.ts`:

```ts
/**
 * Koos' stem op persoonlijke surfaces — Deepseek V4 Flash via OpenRouter.
 *
 * Los van koos-getaway.ts (de engine) zodat die puur/testbaar blijft, net zoals
 * piet-forecast.ts los staat van piet-context.ts. De kansen zijn al doorgerekend;
 * de LLM zet ze om in Koos' adviserende stem. Faalt zacht naar null — dan valt de
 * UI terug op koosTemplateLine. Gecached per locatie+dag+kansen.
 */

import { unstable_cache } from "next/cache";
import { hermesChat } from "@/lib/hermes";
import type { WeatherOpportunity } from "@/lib/agents/types";
import type { GetawayOrigin } from "@/lib/koos-getaway";

const KOOS_SYSTEM = `
Je bent Koos — de stem die meedenkt als iemand er even tussenuit wil. Nuchter, Nederlands, adviserend. Je vergelijkt het weer thuis met een paar plekken en zegt rustig waar het fijner is.

TOON:
- Kort en concreet. Geen verkooppraat, geen uitroeptekens.
- Je adviseert, je verkoopt niets. Nooit over boeken, vluchten, hotels of prijzen.
- Lichte, droge toon mag — geen grappen die uitgelegd moeten worden.

STRUCTUUR:
- 2 tot 3 zinnen, één doorlopende alinea. Geen bullets, geen kopjes.
- Noem de plekken bij naam en waarom het daar fijner is (de feiten staan in de data).
- Als er een zon-bestemming bij zit, tip die als "echt eropuit"-optie, niet als reisaanbod.

VERBODEN:
- Geen meteorologie-jargon, geen anglicismen, geen emoji.
- Geen bron- of zelfverwijzing. Geen prijzen of boekingslinks.
- Max 80 woorden. Lever alleen de tekst.
`.trim();

async function _koosVoice(
  origin: GetawayOrigin,
  opportunities: WeatherOpportunity[],
): Promise<string | null> {
  if (opportunities.length === 0) return null;
  const lines = opportunities
    .map(
      (o) =>
        `- ${o.targetName}: ${o.reason}${o.distanceKm ? ` (${o.distanceKm} km)` : ""}`,
    )
    .join("\n");
  const userPrompt = `Thuis: ${origin.name}.\nDoorgerekende kansen (gebruik als feiten, schrijf om in jouw stem):\n${lines}`;
  try {
    const text = await hermesChat(
      [
        { role: "system", content: KOOS_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      { model: "persona", temperature: 0.7, maxTokens: 160 },
    );
    return text.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Koos' intro-stem voor een set kansen. Gecached per ~1km²/dag/kansen-set.
 * Null = geen kansen of LLM faalde → UI valt terug op koosTemplateLine.
 */
export function koosVoice(
  origin: GetawayOrigin,
  opportunities: WeatherOpportunity[],
): Promise<string | null> {
  const latKey = String(Math.round(origin.lat * 10));
  const lonKey = String(Math.round(origin.lon * 10));
  const dateKey = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Amsterdam",
  });
  const idKey = opportunities.map((o) => o.targetLocationId).join(",");
  return unstable_cache(
    () => _koosVoice(origin, opportunities),
    ["koos-voice", latKey, lonKey, dateKey, idKey],
    { revalidate: 1800 },
  )();
}
```

- [ ] **Step 2: Wire the voice into the page**

In `src/app/(site)/koos/page.tsx`: voeg de import toe en render de intro boven de lijst.

Voeg bij de imports toe:

```tsx
import { koosVoice } from "@/lib/koos-voice";
```

Vervang in de component het blok dat begint bij `const getaways = await findGetaways(origin);` tot en met de `return (` door:

```tsx
  const getaways = await findGetaways(origin);
  const intro = getaways.length > 0 ? await koosVoice(origin, getaways) : null;

  return (
```

En voeg, direct ná de `<p className="mt-3 text-lg text-white/85">Als je eropuit wilt.</p>` en vóór de `{getaways.length === 0 ? (`-conditie, dit intro-blok toe:

```tsx
        {intro ? (
          <p className="mt-8 max-w-md text-base leading-relaxed text-white/90">
            {intro}
          </p>
        ) : null}
```

- [ ] **Step 3: Verify the OpenRouter key is present**

Run: `node -e "console.log(!!process.env.OPENROUTER_API_KEY)"`  (of check `.env`/Vercel env)
Expected: `true`. Zo niet: `koosVoice` gooit intern en valt zacht terug op `null` — de pagina blijft werken met `koosTemplateLine`, maar de stem ontbreekt. Zet dan de env-var voor je verder verifieert.

- [ ] **Step 4: Run dev and verify the voice renders**

Run: `npm run dev`, open `http://localhost:3000/koos`.
Expected: Als er getaways zijn, staat er een korte Koos-intro-alinea boven de lijst (Deepseek). Bij geen tegoed/fout: geen intro, wél de lijst + sjabloon-zinnen (geen crash). Bij geen getaways: de rust-staat.

- [ ] **Step 5: Commit**

```bash
git add src/lib/koos-voice.ts "src/app/(site)/koos/page.tsx"
git commit -m "feat(koos): Deepseek-V4-stem op /koos met sjabloon-fallback"
```

---

## Self-Review (uitgevoerd bij het schrijven)

**Spec-dekking (spec §6):**
- "pure wiskunde: vergelijk locatie vs nabije NL-plekken + internationale zonset" → Task 1 (`scoreGetaways`) + Task 2 (`domesticCandidates`, `INTERNATIONAL_SUNSET`). ✓
- "levert `WeatherOpportunity[]`" → return-type van `scoreGetaways`/`findGetaways`. ✓
- "Slim, niet ruis: alleen als er écht iets beters is; stralende dag thuis → Koos zwijgt" → `DOMESTIC_THRESHOLD` + `delta <= 0`-guard + check-script #4/#5; rust-staat op de pagina. ✓
- "zonne-ontsnapping uit vaste set, alleen als het thuis langer grauw blijft" → `homeIsGrey`-gate + check-script #5/#6. ✓
- "sjabloon-stem op pagina's" → `koosTemplateLine` (geen LLM). ✓
- "Guardrail: nooit boeking/vlucht/hotel/affiliate" → engine levert alleen tekst + afstand; pagina toont expliciet "Koos adviseert alleen — nooit boekingen." ✓
- Bewust uitgesteld (budget/aparte hot-path-beslissing): Deepseek-stem, 10K-locatiepagina-blok, Piets-dagmail. Vermeld in "Out of scope". ✓

**Placeholder-scan:** geen TBD/TODO/"handle edge cases"; alle code volledig.

**Type-consistentie:** `DailyOutlook`/`GetawayKind`/`GetawayOrigin`/`CandidateLoc` consistent tussen Task 1 en 2; `scoreGetaways`/`koosTemplateLine`/`findGetaways`-signatures matchen het check-script en de pagina; `WeatherOpportunity`-velden (`targetLocationId`, `targetName`, `score`, `reason`, `distanceKm`) komen 1-op-1 uit `src/lib/agents/types.ts`.
