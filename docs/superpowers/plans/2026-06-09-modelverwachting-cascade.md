# Slimme Modelverwachting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De "Modelverwachting"-sectie op /vandaag en /morgen wordt cascade-gevoed: een gewogen hoofdlijn (daggewichten uit de Mariana Regions-feed), een duidingsregel in gewone taal, een onweersvenster in de grafiek, en alle bron-attributie centraal in een Q&A op /over. Geen bron- of motornamen in de product-UI.

**Architecture:** Pure blend-helper in `src/lib/model-blend.ts` (geen netwerk, geen Next/Supabase) → `DayBriefing` (server) bouwt één plat `PluimIntelligence`-object uit `ctx` → via `WeatherVisuals` naar `ModelPluim` (domme renderer). `/vandaag` en `/morgen` gaan van `fast: true` naar het normale pad zodat `hourly.models` echt multi-model data bevat (fast-mode haalt alleen het leidende model op — de pluim toont nu feitelijk 3× dezelfde lijn).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, SVG-chart (bestaand), `npx tsx` voor het verificatiescript (bestaande `scripts/test-*`-conventie; repo heeft bewust geen unit-runner).

**Spec:** `docs/superpowers/specs/2026-06-09-modelverwachting-cascade-design.md`

**Visuele referentie (Rowan):** mercury.com — ingehouden palet, één geaccentueerde dataserie, dunne gridlijnen, geen chartjunk, royale witruimte. De va-skin zit hier al dichtbij; de pluim moet die lat halen.

---

### Task 0: Typebaseline vastleggen

`typescript.ignoreBuildErrors` staat aan; `npx tsc --noEmit` is het enige type-signaal en kan al bestaande fouten bevatten. Leg de baseline vast zodat we alleen op NIEUWE fouten beoordelen.

- [ ] **Step 1: Baseline draaien**

Run: `npx tsc --noEmit 2>&1 | Tee-Object -FilePath .tsc-baseline.txt | Select-Object -Last 5`
Expected: bestaande fouten (of geen) — output staat in `.tsc-baseline.txt` (niet committen; staat los van het werk).

---

### Task 1: Pure blend-helper `src/lib/model-blend.ts`

**Files:**
- Create: `src/lib/model-blend.ts`
- Create: `scripts/test-model-blend.ts` (verificatiescript, `npx tsx`)

- [ ] **Step 1: Verificatiescript schrijven (faalt eerst)**

```ts
// scripts/test-model-blend.ts — draaien met: npx tsx scripts/test-model-blend.ts
import {
  blendedTemperatureSeries,
  topWeightedDisplayModel,
  parseTimingWindow,
  timingAppliesToDay,
  safeInsight,
} from "../src/lib/model-blend";
import type { HourlyForecast } from "../src/lib/types";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL ${name}: kreeg ${JSON.stringify(actual)}, verwachtte ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

function hour(models: HourlyForecast["models"], temperature = 10): HourlyForecast {
  return {
    time: "2026-06-09T12:00",
    temperature,
    apparentTemperature: temperature,
    weatherCode: 1,
    precipitation: 0,
    windSpeed: 10,
    cape: 0,
    confidence: "high",
    models,
  } as HourlyForecast;
}

const point = (temperature: number) => ({ temperature, precipitation: 0, weatherCode: 1, windSpeed: 10 });

// 1. Gewogen gemiddelde: HARMONIE 0.6 op 10°, ICON_D2 0.54 op 20° → (10*0.6+20*0.54)/1.14 ≈ 14.74
const twoModels = [hour({ harmonie: point(10), icon: point(20) })];
const blended = blendedTemperatureSeries(twoModels, null);
check("blend gewogen gemiddelde", Math.round(blended[0] * 100) / 100, Math.round(((10 * 0.6 + 20 * 0.54) / 1.14) * 100) / 100);

// 2. Feed-gewichten winnen van defaults: ICON_D2 op 1.0, HARMONIE op 0.1 → lijn trekt naar 20°
const tuned = blendedTemperatureSeries(twoModels, { HARMONIE: 0.1, ICON_D2: 1.0 });
check("blend volgt feed-gewichten", tuned[0] > 18, true);

// 3. Geen modellen → terugval op basistemperatuur
check("blend terugval zonder modellen", blendedTemperatureSeries([hour(undefined, 7)], null)[0], 7);

// 4. topWeightedDisplayModel: icon wint via feed
check(
  "leidend getoond model",
  topWeightedDisplayModel(twoModels, { HARMONIE: 0.1, ICON_D2: 1.0 }),
  "icon",
);

// 5. Niet-getoond model (ECMWF) wint → null
const withEcmwf = [hour({ harmonie: point(10), icon: point(20), ecmwf: point(15) })];
check(
  "verborgen winnaar geeft null",
  topWeightedDisplayModel(withEcmwf, { HARMONIE: 0.1, ICON_D2: 0.2, ECMWF: 1.0 }),
  null,
);

// 6. Minder dan 2 getoonde modellen → null (één lijn 'leunt' nergens op)
check("één model geeft null", topWeightedDisplayModel([hour({ harmonie: point(10) })], null), null);

// 7. Timing-venster parsen
check("parse 14-18", parseTimingWindow("vandaag 14-18 uur"), { fromHour: 14, toHour: 18 });
check("parse 14:00 tot 18:00", parseTimingWindow("tussen 14:00 tot 18:00"), { fromHour: 14, toHour: 18 });
check("parse zonder venster", parseTimingWindow("in de middag"), null);

// 8. timingAppliesToDay
check("vandaag-only geldt niet voor morgen", timingAppliesToDay("vandaag 14-18", 1), false);
check("morgen geldt voor morgen", timingAppliesToDay("morgen 12-16", 1), true);
check("onbepaald geldt voor beide", timingAppliesToDay("14-18 uur", 0), true);

// 9. safeInsight filtert bron-/motornamen
check("insight zonder namen blijft", safeInsight("De timing van de regen is het grootste verschil."), "De timing van de regen is het grootste verschil.");
check("insight met KNMI vervalt", safeInsight("Het KNMI verwacht regen."), null);
check("insight met Mariana vervalt", safeInsight("Mariana weegt HARMONIE zwaarder."), null);
check("lege insight geeft null", safeInsight("  "), null);

if (failures > 0) {
  console.error(`\n${failures} check(s) gefaald`);
  process.exit(1);
}
console.log("\nAlle checks geslaagd");
```

- [ ] **Step 2: Script draaien — moet falen**

Run: `npx tsx scripts/test-model-blend.ts`
Expected: FAIL — `Cannot find module '../src/lib/model-blend'`

- [ ] **Step 3: Helper implementeren**

```ts
// src/lib/model-blend.ts
/**
 * Pure wiskunde + tekstfilters voor de gewogen modelverwachting (de pluim op
 * /vandaag en /morgen). De daggewichten komen uit de Mariana Regions-feed
 * (MarianaLocalFeed.modelWeights, sleutels = MarianaModelName-strings); zonder
 * feed gelden de statische defaults — zelfde filosofie als arbitration.ts.
 *
 * Geen Next-/Supabase-imports, zodat dit los te draaien is
 * (scripts/test-model-blend.ts) en herbruikbaar voor de proactieve e-mails.
 */
import type { HourlyForecast } from "@/lib/types";

/** Sleutels van hourly.models, in de volgorde van de getoonde pluimlijnen. */
const HOURLY_MODEL_KEYS = ["harmonie", "icon", "arome", "ecmwf", "gfs", "aifs", "google"] as const;
export type HourlyModelKey = (typeof HOURLY_MODEL_KEYS)[number];

/** Zelfde mapping als MODEL_KEY_MAP in arbitration.ts. */
const KEY_TO_MARIANA: Record<HourlyModelKey, string> = {
  harmonie: "HARMONIE",
  icon: "ICON_D2",
  arome: "AROME",
  ecmwf: "ECMWF",
  gfs: "GFS",
  aifs: "ECMWF_AIFS_SET_X",
  google: "GOOGLE",
};

/** Statische terugval-gewichten (subset van DEFAULT_WEIGHTS in arbitration.ts). */
const DEFAULT_WEIGHTS: Record<string, number> = {
  HARMONIE: 0.6,
  AROME: 0.56,
  ICON_D2: 0.54,
  ECMWF: 0.52,
  GFS: 0.42,
  ECMWF_AIFS_SET_X: 0.5,
  GOOGLE: 0.38,
};

/** De drie lijnen die de pluim toont, met hun publiekslabel-nummer. */
export const DISPLAY_MODELS = ["harmonie", "icon", "arome"] as const;
export type DisplayModelKey = (typeof DISPLAY_MODELS)[number];
export const DISPLAY_MODEL_NUMBER: Record<DisplayModelKey, 1 | 2 | 3> = {
  harmonie: 1,
  icon: 2,
  arome: 3,
};

/** Plat contract DayBriefing → WeatherVisuals → ModelPluim. */
export interface PluimIntelligence {
  /** Gewogen temperatuurlijn, zelfde index als de hourly-array. */
  blended: number[];
  /** Welke getoonde lijn vandaag het zwaarst weegt (null = niet te zeggen). */
  leadModel: DisplayModelKey | null;
  /** Duidingsregel in gewone taal, al gefilterd op bron-/motornamen. */
  insight: string | null;
  /** Onweersvenster voor de dag van deze briefing (null = niet actief). */
  thunderWindow: { date: string; fromHour: number; toHour: number } | null;
}

function effectiveWeight(key: HourlyModelKey, weights: Record<string, number> | null | undefined): number {
  const name = KEY_TO_MARIANA[key];
  const tuned = weights?.[name];
  if (typeof tuned === "number" && Number.isFinite(tuned) && tuned > 0) return tuned;
  return DEFAULT_WEIGHTS[name] ?? 0.45;
}

/**
 * Per uur het gewogen gemiddelde van alle aanwezige model-temperaturen.
 * Zonder enig model dat uur: terugval op de basistemperatuur (leidend model),
 * zodat de lijn nooit gaten heeft.
 */
export function blendedTemperatureSeries(
  hours: HourlyForecast[],
  weights?: Record<string, number> | null,
): number[] {
  return hours.map((hour) => {
    let sum = 0;
    let weightSum = 0;
    for (const key of HOURLY_MODEL_KEYS) {
      const temperature = hour.models?.[key]?.temperature;
      if (typeof temperature !== "number" || !Number.isFinite(temperature)) continue;
      const weight = effectiveWeight(key, weights);
      sum += temperature * weight;
      weightSum += weight;
    }
    return weightSum > 0 ? sum / weightSum : hour.temperature;
  });
}

/**
 * Welke van de GETOONDE lijnen (harmonie/icon/arome) het zwaarst weegt.
 * Null wanneer: minder dan 2 getoonde modellen aanwezig (er valt niets te
 * vergelijken), of een niet-getoond model (bv. ECMWF) zwaarder weegt dan de
 * getoonde winnaar — dan zou de zin de lezer misleiden.
 */
export function topWeightedDisplayModel(
  hours: HourlyForecast[],
  weights?: Record<string, number> | null,
): DisplayModelKey | null {
  const present = (key: HourlyModelKey) =>
    hours.some((hour) => typeof hour.models?.[key]?.temperature === "number");

  const displayed = DISPLAY_MODELS.filter(present);
  if (displayed.length < 2) return null;

  let winner: DisplayModelKey = displayed[0];
  for (const key of displayed) {
    if (effectiveWeight(key, weights) > effectiveWeight(winner, weights)) winner = key;
  }

  const hiddenHeavier = HOURLY_MODEL_KEYS.some(
    (key) =>
      !(DISPLAY_MODELS as readonly string[]).includes(key) &&
      present(key) &&
      effectiveWeight(key, weights) > effectiveWeight(winner, weights),
  );
  return hiddenHeavier ? null : winner;
}

/** "14-18", "14:00 tot 18:00", "tussen 14 en 18" → { fromHour, toHour }. */
export function parseTimingWindow(timingWindow: string): { fromHour: number; toHour: number } | null {
  const match = timingWindow.match(
    /\b(\d{1,2})(?::\d{2})?\s*(?:-|–|—|tot|to|en)\s*(\d{1,2})(?::\d{2})?\b/i,
  );
  if (!match) return null;
  const fromHour = Math.min(23, Number(match[1]));
  const toHour = Math.min(23, Number(match[2]));
  if (!Number.isFinite(fromHour) || !Number.isFinite(toHour)) return null;
  return { fromHour, toHour };
}

/** Geldt een Tesla-timing_window voor deze dag? (verplaatst uit DayBriefing) */
export function timingAppliesToDay(timingWindow: string, dayOffset: 0 | 1): boolean {
  const timing = timingWindow.toLocaleLowerCase("nl-NL");
  const saysToday = /\b(vandaag|today)\b/.test(timing);
  const saysTomorrow = /\b(morgen|tomorrow)\b/.test(timing);
  if (saysToday && !saysTomorrow) return dayOffset === 0;
  if (saysTomorrow && !saysToday) return dayOffset === 1;
  return true;
}

/**
 * Bron-/motornamen horen niet in de product-UI (werkregel Rowan 2026-06-09):
 * staat er tóch een naam in de LLM-duiding, dan liever géén regel.
 */
const BANNED_NAMES =
  /mariana|knmi|dwd|estofex|harmonie|arome|icon|ecmwf|gfs|aifs|open[\s-]?meteo|m[ée]t[ée]o[\s-]?france|noaa|tesla|oracle/i;

export function safeInsight(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  if (BANNED_NAMES.test(trimmed)) return null;
  return trimmed;
}
```

- [ ] **Step 4: Script draaien — moet slagen**

Run: `npx tsx scripts/test-model-blend.ts`
Expected: alle checks `ok`, exit 0. NB: check 1 verwacht exact `(10*0.6 + 20*0.54) / 1.14` — het script rekent dit zelf uit, dus afronding kan niet scheeflopen.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/model-blend.ts scripts/test-model-blend.ts
git commit -m "feat(pluim): pure blend-helper met cascade-gewichten + timing/insight-filters"
```

---

### Task 2: DayBriefing bouwt PluimIntelligence

**Files:**
- Modify: `src/components/DayBriefing.tsx` (regels 62-78: lokale tesla-helpers vervangen; regel 296: prop doorgeven; nieuwe builder-functie)

- [ ] **Step 1: Imports + lokale helpers vervangen**

Bovenaan toevoegen:

```ts
import {
  blendedTemperatureSeries,
  topWeightedDisplayModel,
  parseTimingWindow,
  timingAppliesToDay,
  safeInsight,
  DISPLAY_MODEL_NUMBER,
  type PluimIntelligence,
} from "@/lib/model-blend";
```

De lokale functies `teslaAppliesToDay` (regels 62-69) en `teslaTimingLabel` (regels 71-78) verwijderen. `teslaTimingLabel` wordt een dunne wrapper op de gedeelde parser (zelfde output als voorheen, geen gedragswijziging in de risicokaart):

```ts
function teslaTimingLabel(timingWindow: string): string | null {
  const window = parseTimingWindow(timingWindow);
  if (!window) return null;
  return `tussen ${String(window.fromHour).padStart(2, "0")}:00 en ${String(window.toHour).padStart(2, "0")}:00`;
}
```

In `riskForDay` de aanroep `teslaAppliesToDay(tesla.timing_window, dayOffset)` vervangen door `timingAppliesToDay(tesla.timing_window, dayOffset)`.

- [ ] **Step 2: Builder-functie toevoegen (boven het component, naast riskForDay)**

```ts
function pluimIntelligence(
  ctx: AgentContext,
  preferences: AgentPreferences,
  dayOffset: 0 | 1,
  date: string,
): PluimIntelligence {
  const weights = ctx.mariana?.feed?.modelWeights ?? null;
  const blended = blendedTemperatureSeries(ctx.weather.hourly, weights);
  const leadModel = topWeightedDisplayModel(ctx.weather.hourly, weights);

  const baseInsight = safeInsight(compactCopy(
    ctx.mariana?.signal?.model_blend_summary || ctx.mariana?.signal?.local_forecast_logic,
    2,
  ));
  const leadSentence = leadModel
    ? `De doorgetrokken lijn leunt ${dayOffset === 0 ? "vandaag" : "voor morgen"} het meest op verwachting ${DISPLAY_MODEL_NUMBER[leadModel]}.`
    : null;
  const insight = [baseInsight, leadSentence].filter(Boolean).join(" ") || null;

  const tesla = ctx.tesla;
  const teslaRisk = Boolean(
    preferences.reed && tesla && timingAppliesToDay(tesla.timing_window, dayOffset) && (
      tesla.tesla_signal >= 2 || tesla.confidence.thunder >= 0.4 || tesla.confidence.severe >= 0.3
    ),
  );
  const window = teslaRisk && tesla ? parseTimingWindow(tesla.timing_window) : null;

  return {
    blended,
    leadModel,
    insight,
    thunderWindow: window ? { date, ...window } : null,
  };
}
```

(Drempels identiek aan `riskForDay` — grafiek en risicokaart spreken elkaar nooit tegen.)

- [ ] **Step 3: Aanroepen + doorgeven**

In het component (na `const choice = ...`):

```ts
const pluim = pluimIntelligence(ctx, preferences, dayOffset, date);
```

Regel 296 wordt:

```tsx
<WeatherVisuals weather={ctx.weather} lat={ctx.location.lat} lon={ctx.location.lon} locationName={ctx.location.name} dayOffset={dayOffset} reedEnabled={preferences.reed} pluim={pluim} />
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | Select-Object -Last 5`
Expected: WeatherVisuals-prop-fout (`pluim` bestaat nog niet) — die lost Task 3 op; verder geen NIEUWE fouten t.o.v. `.tsc-baseline.txt`. (Commit volgt na Task 3, dan compileert de boom weer.)

---

### Task 3: ModelPluim + WeatherVisuals — visueel sterk, anoniem

**Files:**
- Modify: `src/components/ModelPluim.tsx`
- Modify: `src/components/WeatherVisuals.tsx`

Visuele lat: mercury.com — één held-lijn, al het andere gedimde context, dunne gridlijnen, rust.

- [ ] **Step 1: ModelPluim — props + render**

Wijzigingen in `src/components/ModelPluim.tsx`:

**a. Props uitbreiden:**

```ts
import type { PluimIntelligence } from "@/lib/model-blend";

interface Props {
  hourly: HourlyForecast[]; // verwacht 48 items
  sunrise?: string;
  sunset?: string;
  pluim?: PluimIntelligence | null;
}
```

Component-signatuur: `export default function ModelPluim({ hourly, sunrise, sunset, pluim }: Props)`.

**b. Alleen échte modellijnen tonen.** Na `const hours = hourly.slice(0, 48);` bepalen welke modellen echt data hebben (fast-/degraded-pad: alles valt nu terug op `h.temperature` → drie identieke lijnen; dat mag niet meer):

```ts
const availableModels = MODELS.filter((m) =>
  hours.some((h) => typeof h.models?.[m.key]?.temperature === "number"),
);
```

Overal waar nu over `MODELS` wordt geïtereerd (series voor de band, legenda, lijnen) `availableModels` gebruiken. De `series`-opbouw wordt:

```ts
// Een model kan in sommige uren ontbreken (verschillende forecast-lengtes):
// per uur terugvallen op de basistemperatuur, net als de huidige code.
const series = Object.fromEntries(
  availableModels.map((m) => [m.key, hours.map((h) => h.models?.[m.key]?.temperature ?? h.temperature)]),
) as Record<(typeof MODELS)[number]["key"], number[]>;
```

De band (`bandMin`/`bandMax`) over `availableModels`; bij `availableModels.length < 2` geen band renderen (marge van één model is geen marge).

**c. Gewogen hoofdlijn.** Na de series:

```ts
const blended = pluim?.blended?.slice(0, 48) ?? null;
const showBlend = blended !== null && blended.length === n;
```

`allT` (voor tMin/tMax) moet de blend meenemen:

```ts
const allT = [...Object.values(series).flat(), ...(showBlend ? blended : [])];
if (!allT.length) allT.push(...hours.map((h) => h.temperature));
```

In de SVG, NA de modellijnen (bovenop):

```tsx
{showBlend && (() => {
  const pts = blended.map((t, i): [number, number] => [xAt(i, n), yTemp(t, tMin, tMax)]);
  const [endX, endY] = pts[pts.length - 1];
  return (
    <g>
      <path d={linePath(pts)} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={endX} cy={endY} r="3.5" fill="#0f172a" />
    </g>
  );
})()}
```

Zonder blend (`pluim` null/leeg): grafiek rendert exact als nu, alleen met eerlijke `availableModels`.

**d. Modellijnen dimmen.** In de bestaande `MODELS.map`-render (`strokeWidth="2.2"`): wordt `availableModels.map`, met `strokeWidth="1.6"` en `opacity="0.55"` zodra `showBlend` waar is (anders 2.2/1 zoals nu — zonder held blijven de lijnen leesbaar).

**e. Onweersvenster.** Vóór de return, na de bands-berekening:

```ts
const tw = pluim?.thunderWindow ?? null;
let thunderRect: { x: number; w: number } | null = null;
if (tw) {
  const idx = hours
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => {
      if (h.time.slice(0, 10) !== tw.date) return false;
      const hr = new Date(h.time).getHours();
      return hr >= tw.fromHour && hr <= tw.toHour;
    })
    .map(({ i }) => i);
  if (idx.length >= 2) {
    const x1 = xAt(idx[0], n);
    const x2 = xAt(idx[idx.length - 1], n);
    thunderRect = { x: x1, w: x2 - x1 };
  }
}
```

In de SVG, direct na de dag/nacht-shading (dus achter gridlijnen en lijnen):

```tsx
{thunderRect && (
  <g>
    <rect x={thunderRect.x} y={PT} width={thunderRect.w} height={TEMP_H + GAP + PREC_H} fill="#f59e0b" opacity="0.12" />
    <line x1={thunderRect.x} y1={PT} x2={thunderRect.x + thunderRect.w} y2={PT} stroke="#f59e0b" strokeWidth="2" opacity="0.7" />
    {thunderRect.w > 70 && (
      <text x={thunderRect.x + thunderRect.w / 2} y={PT + 11} fill="#b45309" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
        ⚡ VERHOOGDE ONWEERKANS
      </text>
    )}
  </g>
)}
```

**f. Header + legenda.** Micro-label wordt dynamisch; de legenda krijgt de hoofdlijn als eerste item:

```tsx
<p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
  {showBlend ? "Komende 48 uur · gewogen tot één lijn" : "Komende 48 uur"}
</p>
```

In de legenda-flexbox vóór de `availableModels.map`:

```tsx
{showBlend && (
  <div className="flex items-center gap-1.5">
    <div className="w-5 h-[3px] rounded-full" style={{ background: "#0f172a" }} />
    <span className="text-[10px] font-bold text-slate-900">Weerzone-verwachting</span>
  </div>
)}
```

**g. Duidingsregel.** Tussen de SVG-div en de footer-legenda:

```tsx
{pluim?.insight && (
  <p className="text-[11px] font-semibold leading-relaxed text-slate-500">{pluim.insight}</p>
)}
```

**h. Footer-legenda.** "Grijs = marge" alleen tonen als de band rendert (`availableModels.length >= 2`); bij onweersvenster een derde item toevoegen:

```tsx
{thunderRect && (
  <div className="flex items-center gap-1.5">
    <div className="w-3 h-3 rounded-sm bg-amber-400/40" />
    <span>Onweerkans</span>
  </div>
)}
```

- [ ] **Step 2: WeatherVisuals — prop doorgeven, copy, link**

```tsx
import Link from "next/link";
import type { PluimIntelligence } from "@/lib/model-blend";
```

Props-interface uitbreiden met `pluim?: PluimIntelligence | null;` en in de signatuur opnemen. De `ModelPluim`-aanroep (regel 40) wordt:

```tsx
<ModelPluim hourly={weather.hourly} sunrise={weather.sunrise} sunset={weather.sunset} pluim={pluim} />
```

Summary-copy (regel 36): `"Bekijk de modelverwachting"` → `"Bekijk de gewogen modelverwachting"` en de `<small>` wordt `Meerdere verwachtingen gewogen tot één lijn{reedEnabled ? ", plus weerrisico" : ""}`.

Na de `</details>` (binnen de section), de rustige attributielink:

```tsx
<p className="px-1 text-right">
  <Link href="/over#qa" className="text-[11px] font-bold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline">
    Hoe komt deze verwachting tot stand?
  </Link>
</p>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | Select-Object -Last 5`
Expected: geen NIEUWE fouten t.o.v. `.tsc-baseline.txt` (de prop-fout uit Task 2 is nu weg).

- [ ] **Step 4: Commit**

```powershell
git add src/components/DayBriefing.tsx src/components/ModelPluim.tsx src/components/WeatherVisuals.tsx
git commit -m "feat(pluim): gewogen Weerzone-lijn, duiding en onweersvenster uit de cascade"
```

---

### Task 4: /vandaag en /morgen — echte multi-model data

**Files:**
- Modify: `src/app/(site)/vandaag/page.tsx:37`
- Modify: `src/app/(site)/morgen/page.tsx:32`

Context: `buildAgentContext(..., { fast: true })` → `fetchWeatherData(lat, lon, false, false)` haalt alléén `knmi_seamless`; `hourly.models.icon/arome/ecmwf/gfs/aifs` zijn dan `undefined`. Het normale pad probeert high-res (alle modellen, parallel, elk `revalidate: 600` → meestal cache-hit) met 1200ms-deadline en valt terug op het lichte pad. De pagina's streamen achter Suspense, dus de shell blijft instant; alleen de briefing-stream kan in het ergste geval ~1,8s later komen (gelijk aan het huidige fast-pad worst-case + 1,2s deadline).

- [ ] **Step 1: fast-optie verwijderen op beide pagina's**

In `vandaag/page.tsx` (regel 37) en `morgen/page.tsx` (regel 32):

```ts
buildAgentContext({ name, lat, lon }),
```

(i.p.v. `buildAgentContext({ name, lat, lon }, undefined, { fast: true })`.)

- [ ] **Step 2: Sanity-check dat de pagina's nog renderen**

NB: een tekst-grep op de HTML kan hier niets bewijzen — `ModelPluim` laadt met `ssr: false` (client-only) én /vandaag zit achter de login-proxy (anoniem → redirect naar `/`). Dus alleen checken dat niets stuk is:

Run: `npm run dev` (achtergrond), daarna:
`curl -s -o $null -w "%{http_code}" http://localhost:3000/vandaag`
Expected: `307` (redirect naar `/` zonder sessie) of `200` (met dev-sessie). De inhoudelijke controle is de visuele check in Task 6, ingelogd in de browser. NB: lokaal zonder Supabase service-role is `ctx.mariana` null → blend draait op default-gewichten; dat is het bedoelde terugvalpad.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(site)/vandaag/page.tsx" "src/app/(site)/morgen/page.tsx"
git commit -m "fix(vandaag,morgen): high-res modeldata voor de pluim (fast-pad had maar 1 model)"
```

---

### Task 5: Q&A op /over met alle attributie

**Files:**
- Modify: `src/app/(site)/over/page.tsx`

Bronnen geverifieerd in code (`src/lib/weather.ts` BASE_MODELS/LEAD_SOURCE_LABEL, `knmi-warnings.ts`): KNMI HARMONIE (`knmi_seamless`), DWD ICON-D2, Météo-France AROME, ECMWF (IFS + AIFS), NOAA GFS — allemaal opgehaald via Open-Meteo; waarschuwingen van het KNMI. Niets anders noemen.

- [ ] **Step 1: Q&A-sectie toevoegen, "Waarom maar 48 uur?" verhuist erin**

Na de `LAYERS`-const een nieuwe const:

```ts
const QA = [
  [
    "Welke gegevens gebruikt Weerzone?",
    "We combineren meerdere professionele weermodellen: HARMONIE van het KNMI, ICON van de Duitse weerdienst DWD, AROME van Météo-France, en de Europese en Amerikaanse wereldmodellen ECMWF en GFS. Die halen we op via Open-Meteo. Officiële waarschuwingen komen rechtstreeks van het KNMI.",
  ],
  [
    "Wat is de doorgetrokken lijn in de grafiek?",
    "Dat is onze gewogen verwachting. Elk weermodel telt mee, maar niet even zwaar: per dag en per regio krijgt het model dat de situatie het best aankan het meeste gewicht. Zo zie je één duidelijke lijn, met de losse verwachtingen er transparant omheen.",
  ],
  [
    "Wat is Mariana?",
    "Mariana is de motor achter Weerzone. Ze leest elke dag het grotere weerbeeld, herkent regionale verschillen en bepaalt hoe zwaar elk weermodel die dag meetelt. Piet, Reed en Koos vertalen haar werk naar gewone taal.",
  ],
  [
    "Waarom staan er geen modelnamen in de grafiek?",
    "Omdat het beeld dan leesbaar blijft. Welke modellen en bronnen meedoen lees je hier, op één plek — zo weet je altijd waar de verwachting vandaan komt zonder dat elke grafiek een voetnoot nodig heeft.",
  ],
  [
    "Waarom maar 48 uur?",
    "Omdat daar de meeste bruikbare keuzes liggen: eerder vertrekken, een buitenplan verschuiven, regenkleding meenemen of morgen kiezen. Verder vooruit geeft richting, maar minder zekerheid voor concrete beslissingen.",
  ],
] as const;
```

De bestaande losse sectie "Waarom maar 48 uur?" (regels 67-70) verwijderen. Op die plek de Q&A-sectie, zelfde kaartstijl als de rest van de pagina:

```tsx
<section id="qa" className="scroll-mt-24 space-y-3">
  <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Vraag en antwoord</h2>
  <div className="space-y-3">
    {QA.map(([question, answer]) => (
      <details key={question} className="group rounded-3xl border border-white/20 bg-white p-6 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-black text-slate-950">
          {question}
          <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
        </summary>
        <p className="mt-3 text-sm leading-6 text-slate-700">{answer}</p>
      </details>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Typecheck + visueel**

Run: `npx tsc --noEmit 2>&1 | Select-Object -Last 5` → geen nieuwe fouten.
Dev-server: http://localhost:3000/over#qa — Q&A klapt open/dicht, anchor scrollt netjes (scroll-mt-24).

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(site)/over/page.tsx"
git commit -m "feat(over): Q&A met bronvermelding — attributie op één plek i.p.v. in de UI"
```

---

### Task 6: Eindverificatie

- [ ] **Step 1: Blend-script + typecheck**

Run: `npx tsx scripts/test-model-blend.ts` → alle checks ok.
Run: `npx tsc --noEmit 2>&1 | Select-Object -Last 5` → vergelijk met `.tsc-baseline.txt`: geen nieuwe fouten.

- [ ] **Step 2: Visuele controle (dev-server, ingelogd — /vandaag en /morgen zitten achter de login-proxy)**

- `/vandaag`: sectie 04 open­klappen → dikke donkere "Weerzone-verwachting"-lijn met eindpunt-dot, gedimde dunne modellijnen (alleen modellen met echte data), duidingsregel onder de grafiek (of geen regel — nooit een regel met een bronnaam), link "Hoe komt deze verwachting tot stand?" rechtsonder.
- `/morgen`: zelfde, duiding zegt "voor morgen".
- Reed uit (via Mijn Weerzone of cookie): geen amber onweersvenster, geen "plus weerrisico" in de summary.
- `/over#qa`: Q&A rendert, "Waarom maar 48 uur?" staat erin, losse sectie is weg.
- Mercury-lat: één held-lijn, rust, geen chartjunk — beoordeel het eindbeeld hierop en stel zonodig opacity/diktes bij (alleen de waarden uit Task 3, geen structuurwijziging).

- [ ] **Step 3: Opruimen**

`.tsc-baseline.txt` verwijderen (niet committen).
