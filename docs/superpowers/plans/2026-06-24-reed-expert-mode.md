# Reed Expert-modus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang de losse "Voor de expert"-grafiekjes op `/vandaag` en `/morgen` door een echte Expert-modus: een `Gewoon | Expert`-toggle die Reed de pagina laat overnemen met een deterministisch geduid, premium, interactief scrub-meteogram.

**Architecture:** Een pure regel-engine (`reed-expert-reading.ts`) zet de uur-data van de dag om naar verdict/headline/momenten/lagen (geen IO, geen LLM). `DayBriefing` (server) berekent die reading en geeft 'm door aan een client-wrapper `ExpertMode`, die de toggle + `localStorage` beheert en tussen de bestaande "gewoon"-body (als children) en de Expert-body (Reed-kop + `ReedMeteogram` + `LightningMap`) wisselt.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, inline SVG, Tailwind v4 + scoped CSS (`vandaag-skin.css`). Geen test-runner in de repo → de pure engine wordt getest met een `npx tsx` assertion-script (repo-idioom), UI wordt geverifieerd met `npx tsc --noEmit` + `next build` + handmatige check.

## Global Constraints

- **NL-only.** Geen per-locale routes/strings. Nieuwe componenten hardcoden NL (geen `detectLocale`/`usePathname`-locale). (CLAUDE.md "Locale (NL-only)")
- **Geen bronnamen in UI.** Geen KNMI/DWD/Mariana-namen in de modus. (memory `feedback_no_source_names_in_ui`)
- **Reed = karakter, géén one-liners.** Net Nederlands, geen meteo-jargon in lopende tekst; parameternamen (CAPE/CIN) mogen wél in labels van de expert-laag. (memory `feedback_weerzone_tone`, `feedback_tone`)
- **Geen prijzen/paywall.** Toegang is puur `preferences.reed`, geen prijslogica. (memory `feedback_no_pricing_until_kvk`)
- **Type-correctheid alleen via `npx tsc --noEmit`** — `next.config.ts` heeft `typescript.ignoreBuildErrors: true`, dus een groene build is géén type-signaal. (CLAUDE.md)
- **Geen nieuwe test-runner.** Tests draaien via `npx tsx <file>`. (CLAUDE.md)
- **Productie = branch `weerzone-agents-fase1`** via `vercel deploy --prod` + `vercel promote`. Niet in scope van dit plan, maar deploy gebeurt zo. (memory `feedback_deploy_main_only`, `feedback_vercel_promote_required`)

---

### Task 1: Pure regel-engine `reed-expert-reading.ts`

De testbare kern. Pure functie: dag-uren → `ReedExpertReading`. Geen React, geen IO.

**Files:**
- Create: `src/lib/reed-expert-reading.ts`
- Test: `scripts/test-reed-expert-reading.ts`

**Interfaces:**
- Consumes: `HourlyForecast` uit `@/lib/types` (velden: `time: string`, `precipitation: number`, `windSpeed: number`, `cape: number`, `cin?: number`, `dewPoint?: number`, `liftedIndex?: number`, `windShear?: number`).
- Produces:
  - `type ReedVerdict = "rustig" | "oplettend" | "onrustig" | "code"`
  - `interface ReedMoment { time: string; hourIndex: number; kind: "deksel-breekt" | "onweerspiek" | "schering-piek" | "broeierig" | "windpiek"; label: string; detail: string; severity: ReedVerdict }`
  - `interface ReedLayer { key: "cape" | "cin" | "liftedIndex" | "windShear" | "dewPoint" | "windSpeed"; title: string; phrase: string; severity: ReedVerdict; series: number[]; unit: string; threshold?: number; thresholdLabel?: string; min?: number; max: number; type: "bar" | "line" }`
  - `interface ReedExpertReading { verdict: ReedVerdict; headline: string; moments: ReedMoment[]; layers: ReedLayer[]; hours: HourlyForecast[] }`
  - `function reedExpertReading(hours: HourlyForecast[], dayLabel: "vandaag" | "morgen"): ReedExpertReading`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-reed-expert-reading.ts`:

```ts
import { reedExpertReading } from "../src/lib/reed-expert-reading";
import type { HourlyForecast } from "../src/lib/types";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) { console.log(`  ok  ${name}`); }
  else { console.error(`FAIL  ${name}`); failures++; }
}

// Bouw 24 uur vanaf middernacht met instelbare velden.
function makeHours(spec: Partial<Record<"cape" | "cin" | "liftedIndex" | "windShear" | "dewPoint" | "windSpeed" | "precipitation", number[]>>): HourlyForecast[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `2026-06-24T${String(h).padStart(2, "0")}:00`,
    temperature: 18,
    weatherCode: 0,
    precipitation: spec.precipitation?.[h] ?? 0,
    windSpeed: spec.windSpeed?.[h] ?? 5,
    cape: spec.cape?.[h] ?? 0,
    cin: spec.cin?.[h],
    dewPoint: spec.dewPoint?.[h],
    liftedIndex: spec.liftedIndex?.[h],
    windShear: spec.windShear?.[h],
  })) as unknown as HourlyForecast[];
}

// 1. Rustige dag → verdict "rustig", geen momenten.
{
  const r = reedExpertReading(makeHours({ cape: Array(24).fill(50) }), "vandaag");
  assert("rustig: verdict rustig", r.verdict === "rustig");
  assert("rustig: geen momenten", r.moments.length === 0);
  assert("rustig: headline gevuld", r.headline.length > 0);
  assert("rustig: 6 lagen", r.layers.length === 6);
}

// 2. Hoge CAPE + sterk negatieve LI → verdict onrustig + onweerspiek-moment.
{
  const cape = Array(24).fill(200); for (let h = 16; h <= 19; h++) cape[h] = 1800;
  const li = Array(24).fill(2); for (let h = 16; h <= 19; h++) li[h] = -7;
  const r = reedExpertReading(makeHours({ cape, liftedIndex: li }), "vandaag");
  assert("storm: verdict onrustig+", r.verdict === "onrustig" || r.verdict === "code");
  assert("storm: onweerspiek-moment", r.moments.some((m) => m.kind === "onweerspiek"));
}

// 3. Deksel: CIN >100 's ochtends, valt na 16u weg terwijl CAPE oploopt → deksel-breekt-moment om 16u.
{
  const cin = Array(24).fill(120); for (let h = 16; h < 24; h++) cin[h] = 10;
  const cape = Array(24).fill(100); for (let h = 16; h <= 19; h++) cape[h] = 1200;
  const r = reedExpertReading(makeHours({ cin, cape }), "vandaag");
  const deksel = r.moments.find((m) => m.kind === "deksel-breekt");
  assert("deksel: moment bestaat", !!deksel);
  assert("deksel: om 16u", deksel?.detail === "16:00");
}

// 4. Broeierig: dauwpunt >=18 → dauwpunt-laag severity >= oplettend.
{
  const r = reedExpertReading(makeHours({ dewPoint: Array(24).fill(19) }), "vandaag");
  const dew = r.layers.find((l) => l.key === "dewPoint");
  assert("broeierig: dauwpunt-laag oplettend+", dew !== undefined && dew.severity !== "rustig");
}

// 5. Lege input → safe leeg resultaat, geen crash.
{
  const r = reedExpertReading([], "morgen");
  assert("leeg: verdict rustig", r.verdict === "rustig");
  assert("leeg: geen lagen-crash", Array.isArray(r.layers));
}

if (failures > 0) { console.error(`\n${failures} test(s) gefaald`); process.exit(1); }
console.log("\nalle tests geslaagd");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/test-reed-expert-reading.ts`
Expected: FAIL — module `reed-expert-reading` bestaat nog niet (import error).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/reed-expert-reading.ts`:

```ts
import type { HourlyForecast } from "@/lib/types";

export type ReedVerdict = "rustig" | "oplettend" | "onrustig" | "code";

export type ReedMomentKind =
  | "deksel-breekt"
  | "onweerspiek"
  | "schering-piek"
  | "broeierig"
  | "windpiek";

export interface ReedMoment {
  time: string;
  hourIndex: number;
  kind: ReedMomentKind;
  label: string;
  detail: string;
  severity: ReedVerdict;
}

export interface ReedLayer {
  key: "cape" | "cin" | "liftedIndex" | "windShear" | "dewPoint" | "windSpeed";
  title: string;
  phrase: string;
  severity: ReedVerdict;
  series: number[];
  unit: string;
  threshold?: number;
  thresholdLabel?: string;
  min?: number;
  max: number;
  type: "bar" | "line";
}

export interface ReedExpertReading {
  verdict: ReedVerdict;
  headline: string;
  moments: ReedMoment[];
  layers: ReedLayer[];
  hours: HourlyForecast[];
}

const RANK: Record<ReedVerdict, number> = { rustig: 0, oplettend: 1, onrustig: 2, code: 3 };
function worst(a: ReedVerdict, b: ReedVerdict): ReedVerdict { return RANK[a] >= RANK[b] ? a : b; }
function hhmm(iso: string): string { return iso.slice(11, 16); }

export function reedExpertReading(hours: HourlyForecast[], dayLabel: "vandaag" | "morgen"): ReedExpertReading {
  if (hours.length === 0) {
    return { verdict: "rustig", headline: `Geen uurdata beschikbaar voor ${dayLabel}.`, moments: [], layers: [], hours: [] };
  }

  const cape = hours.map((h) => h.cape ?? 0);
  const cin = hours.map((h) => h.cin ?? 0);
  const li = hours.map((h) => h.liftedIndex ?? 0);
  const shear = hours.map((h) => h.windShear ?? 0);
  const dew = hours.map((h) => h.dewPoint ?? 0);
  const wind = hours.map((h) => h.windSpeed ?? 0);

  const capeMax = Math.max(...cape);
  const moments: ReedMoment[] = [];

  // Onweerspiek: CAPE > 1500 samen met LI < -6 (sterk), of CAPE > 1000 + LI < -2 (matig).
  let peakStart = -1, peakEnd = -1, peakSev: ReedVerdict = "rustig";
  for (let i = 0; i < hours.length; i++) {
    const strong = cape[i] > 1500 && li[i] < -6;
    const moderate = cape[i] > 1000 && li[i] < -2;
    if (strong || moderate) {
      if (peakStart === -1) peakStart = i;
      peakEnd = i;
      peakSev = worst(peakSev, strong ? "code" : "onrustig");
    }
  }
  if (peakStart !== -1) {
    moments.push({
      time: hours[peakStart].time, hourIndex: peakStart, kind: "onweerspiek",
      label: "Piek onweerskans", detail: `${hhmm(hours[peakStart].time)}–${hhmm(hours[peakEnd].time)}`,
      severity: peakSev,
    });
  }

  // Deksel breekt: CIN >= 100 in een eerder uur, dan eerste uur waar CIN < 35 terwijl CAPE > 500.
  const hadLid = cin.some((c, i) => c >= 100 && i < hours.length - 1);
  if (hadLid) {
    const firstLidHour = cin.findIndex((c) => c >= 100);
    for (let i = firstLidHour + 1; i < hours.length; i++) {
      if (cin[i] < 35 && cape[i] > 500) {
        moments.push({
          time: hours[i].time, hourIndex: i, kind: "deksel-breekt",
          label: "Deksel breekt", detail: hhmm(hours[i].time), severity: "onrustig",
        });
        break;
      }
    }
  }

  // Scheringpiek: hoogste windschering > 35 tijdens CAPE > 500.
  let shearIdx = -1, shearVal = 35;
  for (let i = 0; i < hours.length; i++) {
    if (shear[i] > shearVal && cape[i] > 500) { shearVal = shear[i]; shearIdx = i; }
  }
  if (shearIdx !== -1) {
    moments.push({
      time: hours[shearIdx].time, hourIndex: shearIdx, kind: "schering-piek",
      label: "Stormen kunnen zich organiseren", detail: hhmm(hours[shearIdx].time), severity: "oplettend",
    });
  }

  // Windpiek: wind > 50 km/u.
  let windIdx = -1, windVal = 50;
  for (let i = 0; i < hours.length; i++) { if (wind[i] > windVal) { windVal = wind[i]; windIdx = i; } }
  if (windIdx !== -1) {
    moments.push({
      time: hours[windIdx].time, hourIndex: windIdx, kind: "windpiek",
      label: "Harde wind", detail: hhmm(hours[windIdx].time), severity: "oplettend",
    });
  }

  // Broeierig: dauwpunt >= 18.
  const dewMax = Math.max(...dew);
  if (dewMax >= 18) {
    const i = dew.indexOf(dewMax);
    moments.push({
      time: hours[i].time, hourIndex: i, kind: "broeierig",
      label: "Broeierig", detail: hhmm(hours[i].time), severity: "oplettend",
    });
  }

  // Lagen.
  const capeSev: ReedVerdict = capeMax > 1500 ? "onrustig" : capeMax > 500 ? "oplettend" : "rustig";
  const layers: ReedLayer[] = [
    {
      key: "cape", title: "Onweerskans (CAPE)", type: "bar", unit: "", series: cape,
      max: Math.max(2000, capeMax), threshold: 1000, thresholdLabel: "Pas op", severity: capeSev,
      phrase: capeMax > 1500 ? "Genoeg brandstof voor flinke buien." : capeMax > 500 ? "Wat opbouw, maar nog beheersbaar." : "Weinig opbouw — rustige lucht.",
    },
    {
      key: "dewPoint", title: "Vocht (dauwpunt)", type: "line", unit: "°C", series: dew,
      max: 25, threshold: 15, thresholdLabel: "Broeierig", severity: dewMax >= 18 ? "oplettend" : "rustig",
      phrase: dewMax >= 18 ? "Drukkend en zwoel." : dewMax >= 15 ? "Wat vochtig." : "Aangenaam droog.",
    },
    {
      key: "cin", title: "Deksel (CIN)", type: "bar", unit: "J/kg", series: cin,
      max: 150, threshold: 100, thresholdLabel: "Sterk deksel", severity: hadLid ? "oplettend" : "rustig",
      phrase: hadLid ? "Een deksel houdt buien voorlopig tegen." : "Geen rem op de buienvorming.",
    },
    {
      key: "liftedIndex", title: "Stabiliteit (Lifted Index)", type: "line", unit: "°C", series: li,
      min: -10, max: 15, threshold: 0, thresholdLabel: "Instabiel (< 0)",
      severity: Math.min(...li) <= -6 ? "onrustig" : Math.min(...li) < 0 ? "oplettend" : "rustig",
      phrase: Math.min(...li) <= -6 ? "Zeer onstabiel — storm mogelijk." : Math.min(...li) < 0 ? "Licht onstabiel." : "Stabiele opbouw.",
    },
    {
      key: "windShear", title: "Windschering (0–80m)", type: "line", unit: "km/u", series: shear,
      max: 50, threshold: 35, thresholdLabel: "Organisatie",
      severity: Math.max(...shear) >= 35 ? "oplettend" : "rustig",
      phrase: Math.max(...shear) >= 35 ? "Buien kunnen zich organiseren." : "Te weinig schering voor organisatie.",
    },
    {
      key: "windSpeed", title: "Wind", type: "line", unit: "km/u", series: wind,
      max: Math.max(80, Math.max(...wind)), threshold: 50, thresholdLabel: "Harde wind",
      severity: Math.max(...wind) > 50 ? "oplettend" : "rustig",
      phrase: Math.max(...wind) > 50 ? "Stevige wind op komst." : "Rustige wind.",
    },
  ];

  const verdict = [...moments.map((m) => m.severity), ...layers.map((l) => l.severity)].reduce(worst, "rustig" as ReedVerdict);

  const deksel = moments.find((m) => m.kind === "deksel-breekt");
  const peak = moments.find((m) => m.kind === "onweerspiek");
  let headline: string;
  if (peak && deksel) {
    headline = `Geduld tot een uur of ${parseInt(deksel.detail)} — daarna kan het in korte tijd flink tekeergaan.`;
  } else if (peak) {
    headline = `Vanaf ${peak.detail.split("–")[0]} staat de atmosfeer op scherp; korte, felle buien liggen op de loer.`;
  } else if (verdict === "oplettend") {
    headline = `Grotendeels rustig, maar houd de lucht in de gaten.`;
  } else {
    headline = `Een rustige, stabiele ${dayLabel}; geen onweer of storm in de cijfers.`;
  }

  return { verdict, headline, moments, layers, hours };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/test-reed-expert-reading.ts`
Expected: PASS — "alle tests geslaagd".

- [ ] **Step 5: Type-check the new module**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "reed-expert-reading|test-reed" || echo "geen type-fouten in de nieuwe bestanden"`
Expected: "geen type-fouten in de nieuwe bestanden".

- [ ] **Step 6: Commit**

```bash
git add src/lib/reed-expert-reading.ts scripts/test-reed-expert-reading.ts
git commit -m "feat(reed): deterministische expert-reading engine (verdict/headline/moments/layers)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Premium interactief meteogram `ReedMeteogram.tsx`

Eén gelaagd SVG-meteogram op een gedeelde tijdas, met scrub-lijn + readout + gepinde momenten. Vervangt `ReedExtremeCharts` in het vandaag/morgen-pad (niet op /reed).

**Files:**
- Create: `src/components/ReedMeteogram.tsx`
- Modify: `src/app/(site)/vandaag/vandaag-skin.css` (voeg `.va-meteo-*` klassen toe, onderaan)

**Interfaces:**
- Consumes: `ReedLayer`, `ReedMoment` uit `@/lib/reed-expert-reading` (Task 1); `HourlyForecast` uit `@/lib/types`.
- Produces: `export default function ReedMeteogram(props: { layers: ReedLayer[]; moments: ReedMoment[]; hours: HourlyForecast[] }): JSX.Element`

- [ ] **Step 1: Implement the component**

Create `src/components/ReedMeteogram.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { ReedLayer, ReedMoment } from "@/lib/reed-expert-reading";
import type { HourlyForecast } from "@/lib/types";

const SEV_COLOR: Record<string, string> = {
  rustig: "#2f6bed", oplettend: "#e08a08", onrustig: "#e0701a", code: "#e23b34",
};

const W = 520, H = 96, PL = 40, PR = 14, PT = 14, PB = 20;
const CW = W - PL - PR, CH = H - PT - PB;

function xAt(i: number, n: number) { return PL + (i / Math.max(n - 1, 1)) * CW; }

function Panel({ layer, hours, active, onScrub }: {
  layer: ReedLayer; hours: HourlyForecast[]; active: number | null; onScrub: (i: number | null) => void;
}) {
  const n = layer.series.length;
  const lo = layer.min ?? 0;
  const hi = Math.max(layer.max, ...layer.series, 1);
  const range = hi - lo || 1;
  const yOf = (v: number) => PT + CH * (1 - (v - lo) / range);
  const color = SEV_COLOR[layer.severity] ?? "#2f6bed";
  const barW = Math.max(2, CW / n - 2);
  const gradId = `meteo-${layer.key}`;

  return (
    <div className="va-meteo-panel">
      <div className="va-meteo-panel-head">
        <span className="va-meteo-title">{layer.title}</span>
        <span className="va-meteo-phrase" style={{ color }}>{layer.phrase}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`} className="va-meteo-svg" preserveAspectRatio="none"
        onMouseLeave={() => onScrub(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - PL) / CW) * (n - 1));
          onScrub(Math.max(0, Math.min(n - 1, i)));
        }}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.touches[0].clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - PL) / CW) * (n - 1));
          onScrub(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {layer.threshold != null && layer.threshold > lo && layer.threshold < hi && (
          <line x1={PL} y1={yOf(layer.threshold)} x2={W - PR} y2={yOf(layer.threshold)}
            stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        )}

        {layer.type === "bar" ? (
          layer.series.map((v, i) => {
            if (v <= 0.01) return null;
            const bh = Math.max(1.5, (v - lo) / range * CH);
            return <rect key={i} x={xAt(i, n) - barW / 2} y={PT + CH - bh} width={barW} height={bh} rx="1.5" fill={color} opacity="0.85" />;
          })
        ) : (
          <>
            <path d={`M${xAt(0, n)},${PT + CH} ` + layer.series.map((v, i) => `L${xAt(i, n).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ") + ` L${xAt(n - 1, n)},${PT + CH} Z`} fill={`url(#${gradId})`} />
            <path d={layer.series.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {active != null && (
          <>
            <line x1={xAt(active, n)} y1={PT} x2={xAt(active, n)} y2={PT + CH} stroke="#0f172a" strokeWidth="1" opacity="0.25" />
            <circle cx={xAt(active, n)} cy={yOf(layer.series[active])} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
          </>
        )}

        <text x={PL - 6} y={PT + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="700">{Math.round(hi)}</text>
        <text x={PL - 6} y={PT + CH} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="700">{Math.round(lo)}</text>
      </svg>
    </div>
  );
}

export default function ReedMeteogram({ layers, moments, hours }: {
  layers: ReedLayer[]; moments: ReedMoment[]; hours: HourlyForecast[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = hours.length;
  if (n === 0) return null;
  const readoutHour = active != null ? hours[active] : null;

  return (
    <div className="va-card va-meteo">
      <div className="va-meteo-readout" aria-live="polite">
        {readoutHour ? (
          <>
            <strong>{readoutHour.time.slice(11, 16)}</strong>
            <span>
              {layers.map((l) => `${l.title.replace(/\s*\(.*\)/, "")} ${Math.round(l.series[active!])}${l.unit}`).join(" · ")}
            </span>
          </>
        ) : (
          <span className="va-meteo-hint">Beweeg over het meteogram voor de cijfers per uur.</span>
        )}
      </div>

      {moments.length > 0 && (
        <ul className="va-meteo-moments">
          {moments.map((m) => (
            <li key={m.kind + m.hourIndex} style={{ "--mc": SEV_COLOR[m.severity] } as React.CSSProperties}>
              <span className="va-meteo-moment-dot" />
              <strong>{m.label}</strong>
              <span>{m.detail}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="va-meteo-panels">
        {layers.map((l) => (
          <Panel key={l.key} layer={l} hours={hours} active={active} onScrub={setActive} />
        ))}
      </div>

      <div className="va-meteo-axis">
        {hours.map((h, i) => (i % 6 === 0 ? <span key={i} style={{ left: `${(i / Math.max(n - 1, 1)) * 100}%` }}>{i === 0 ? "nu" : `${new Date(h.time).getHours()}u`}</span> : null))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the meteogram styling**

Append to `src/app/(site)/vandaag/vandaag-skin.css`:

```css
/* ---- Reed meteogram (Expert-modus) ---- */
.va-meteo { padding: 18px 18px 22px; }
.va-meteo-readout {
  display: flex; align-items: baseline; gap: 10px; min-height: 22px;
  padding-bottom: 12px; border-bottom: 1px solid rgba(148,163,184,0.16);
}
.va-meteo-readout strong { color: #0f172a; font-size: 15px; font-weight: 900; font-variant-numeric: tabular-nums; }
.va-meteo-readout span { color: #51607a; font-size: 12px; font-weight: 650; }
.va-meteo-hint { color: #94a3b8; font-weight: 650; }
.va-meteo-moments { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 4px; }
.va-meteo-moments li {
  display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px 6px 9px;
  border-radius: 999px; border: 1px solid color-mix(in srgb, var(--mc) 30%, transparent);
  background: color-mix(in srgb, var(--mc) 8%, #fff);
}
.va-meteo-moment-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--mc); flex: none; }
.va-meteo-moments strong { color: #0f172a; font-size: 12px; font-weight: 800; }
.va-meteo-moments li > span { color: color-mix(in srgb, var(--mc) 70%, #0b1220); font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; }
.va-meteo-panels { display: flex; flex-direction: column; gap: 16px; margin-top: 14px; }
.va-meteo-panel-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.va-meteo-title { color: #475569; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
.va-meteo-phrase { font-size: 12px; font-weight: 750; text-align: right; }
.va-meteo-svg { display: block; width: 100%; height: 86px; touch-action: none; cursor: crosshair; }
.va-meteo-axis { position: relative; height: 14px; margin-top: 6px; }
.va-meteo-axis span { position: absolute; transform: translateX(-50%); color: #94a3b8; font-size: 9px; font-weight: 800; }
.va-meteo-axis span:first-child { color: #2f6bed; }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "ReedMeteogram" || echo "geen type-fouten in ReedMeteogram"`
Expected: "geen type-fouten in ReedMeteogram".

- [ ] **Step 4: Commit**

```bash
git add src/components/ReedMeteogram.tsx "src/app/(site)/vandaag/vandaag-skin.css"
git commit -m "feat(reed): premium interactief scrub-meteogram (ReedMeteogram)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Client-wrapper `ExpertMode.tsx` (toggle + Reed-kop)

De client-grens: toggle + `localStorage`, en compositie van de Expert-body (Reed-kop + meteogram + lightning). De "gewoon"-body komt als `children` binnen (blijft server-gerenderd).

**Files:**
- Create: `src/components/ExpertMode.tsx`
- Modify: `src/app/(site)/vandaag/vandaag-skin.css` (voeg `.va-modeswitch` + `.va-reedhead` klassen toe)

**Interfaces:**
- Consumes: `ReedExpertReading` (Task 1); `ReedMeteogram` default export (Task 2); `LightningMap` (bestaand, default export, props `{ lat: number; lon: number }`); `HourlyForecast`.
- Produces: `export default function ExpertMode(props: { reed: boolean; reading: ReedExpertReading; lat: number; lon: number; dayOffset: 0 | 1; children: React.ReactNode }): JSX.Element`

- [ ] **Step 1: Implement the component**

Create `src/components/ExpertMode.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReedExpertReading, ReedVerdict } from "@/lib/reed-expert-reading";
import ReedMeteogram from "@/components/ReedMeteogram";

const LightningMap = dynamic(() => import("@/components/LightningMap"), {
  ssr: false, loading: () => <div className="va-card h-48 animate-pulse bg-white/70" aria-label="Kaart laden" />,
});

const VERDICT_LABEL: Record<ReedVerdict, string> = {
  rustig: "Rustig", oplettend: "Oplettend", onrustig: "Onrustig", code: "Code",
};
const VERDICT_TILE: Record<ReedVerdict, string> = {
  rustig: "is-quiet", oplettend: "is-watching", onrustig: "is-watching", code: "is-urgent",
};
const STORE_KEY = "wz-day-mode";

export default function ExpertMode({ reed, reading, lat, lon, dayOffset, children }: {
  reed: boolean;
  reading: ReedExpertReading;
  lat: number;
  lon: number;
  dayOffset: 0 | 1;
  children: React.ReactNode;
}) {
  const [expert, setExpert] = useState(false);

  useEffect(() => {
    if (!reed) return;
    setExpert(window.localStorage.getItem(STORE_KEY) === "expert");
  }, [reed]);

  function choose(mode: "gewoon" | "expert") {
    setExpert(mode === "expert");
    try { window.localStorage.setItem(STORE_KEY, mode); } catch {}
  }

  if (!reed) return <>{children}</>;

  return (
    <>
      <nav className="va-modeswitch" aria-label="Gewoon of expert">
        <button type="button" className={!expert ? "is-active" : ""} aria-pressed={!expert} onClick={() => choose("gewoon")}>Gewoon</button>
        <button type="button" className={expert ? "is-active" : ""} aria-pressed={expert} onClick={() => choose("expert")}>Expert</button>
      </nav>

      {!expert ? children : (
        <div className="space-y-7">
          <section className={`va-card va-reedhead ${VERDICT_TILE[reading.verdict]}`}>
            <div className="va-reedhead-top">
              <span className="va-agent-mark" style={{ "--agent-accent": "#e0701a" } as React.CSSProperties}>R</span>
              <div>
                <div className="va-micro text-slate-400">Reed · de atmosfeer ontleed</div>
                <span className="va-state-pill" style={{ "--agent-accent": "#e0701a" } as React.CSSProperties}>{VERDICT_LABEL[reading.verdict]}</span>
              </div>
            </div>
            <p className="va-reedhead-line">{reading.headline}</p>
          </section>

          <ReedMeteogram layers={reading.layers} moments={reading.moments} hours={reading.hours} />

          {dayOffset === 0 && (
            <section className="space-y-3">
              <div className="va-section-head px-1"><div><span className="va-onsky va-micro">Live</span><h2>Bliksem op de kaart</h2></div></div>
              <div className="va-visual-stack"><LightningMap lat={lat} lon={lon} /></div>
            </section>
          )}

          <p className="px-1 text-right">
            <Link href="/over#qa" className="text-[11px] font-bold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline">
              Hoe komt deze verwachting tot stand?
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Add the mode-switch + Reed-head styling**

Append to `src/app/(site)/vandaag/vandaag-skin.css`:

```css
/* ---- Expert-modus: mode-switch + Reed-kop ---- */
.va-modeswitch {
  display: inline-flex; align-self: flex-start; gap: 4px; padding: 4px;
  border: 1px solid rgba(148,163,184,0.16); border-radius: 999px;
  background: #f1f5f9; box-shadow: inset 0 1px 0 rgba(255,255,255,0.9);
}
.va-modeswitch button {
  min-height: 32px; padding: 0 16px; border-radius: 999px;
  color: #64748b; font-size: 11px; font-weight: 900; letter-spacing: 0.08em;
  text-transform: uppercase; cursor: pointer;
}
.va-modeswitch button.is-active {
  background: #0f172a; color: #fff; box-shadow: 0 8px 18px -12px rgba(15,23,42,0.8);
}
.va-reedhead { padding: 22px 24px; border-left: 5px solid var(--agent-accent, #e0701a); }
.va-reedhead.is-quiet { --agent-accent: #8593a8; }
.va-reedhead.is-watching { --agent-accent: #e08a08; }
.va-reedhead.is-urgent { --agent-accent: #e23b34; }
.va-reedhead-top { display: flex; align-items: center; gap: 14px; }
.va-reedhead-line { margin-top: 14px; color: #16233b; font-size: 16px; font-weight: 700; line-height: 1.5; }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "ExpertMode" || echo "geen type-fouten in ExpertMode"`
Expected: "geen type-fouten in ExpertMode".

- [ ] **Step 4: Commit**

```bash
git add src/components/ExpertMode.tsx "src/app/(site)/vandaag/vandaag-skin.css"
git commit -m "feat(reed): ExpertMode client-wrapper met Gewoon|Expert-toggle + Reed-kop

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Wire ExpertMode in `DayBriefing` + retire WeatherVisuals

Bereken de reading server-side, wikkel de wisselbare body in `ExpertMode`, verwijder de oude `WeatherVisuals`-aanroep.

**Files:**
- Modify: `src/components/DayBriefing.tsx` (import + reading + wrap body, ~regel 22, 319-321, 393-448)
- Delete: `src/components/WeatherVisuals.tsx` (na verificatie dat niets anders importeert)

**Interfaces:**
- Consumes: `reedExpertReading` (Task 1), `ExpertMode` default export (Task 3).
- Produces: niets nieuws (interne wiring).

- [ ] **Step 1: Vervang de WeatherVisuals-import**

In `src/components/DayBriefing.tsx`, vervang regel 22:

```tsx
// verwijder:
import WeatherVisuals from "@/components/WeatherVisuals";
// voeg toe:
import ExpertMode from "@/components/ExpertMode";
import { reedExpertReading } from "@/lib/reed-expert-reading";
```

- [ ] **Step 2: Bereken de reading naast `hours`**

In `src/components/DayBriefing.tsx`, direct na regel 321 (`const hours = ...`):

```tsx
const reading = reedExpertReading(hours, dayOffset === 0 ? "vandaag" : "morgen");
```

- [ ] **Step 3: Wikkel de wisselbare body in ExpertMode**

In `src/components/DayBriefing.tsx`: de secties vanaf "Temperatuurverwachting" (regel ~394) t/m de dagdelen (regel ~444) plus de `WeatherVisuals`-regel (446) worden de inhoud. Vervang de `<WeatherVisuals ... />`-regel (446) volledig dóór niets, en wikkel de "gewoon"-secties (Temperatuurverwachting t/m dagdelen) als `children` in `ExpertMode`. Concreet: zet rond de blokken vanaf `{/* Temperatuurverwachting ... */}` tot en met de afsluitende `</section>` van de dagdelen:

```tsx
<ExpertMode reed={preferences.reed} reading={reading} lat={ctx.location.lat} lon={ctx.location.lon} dayOffset={dayOffset}>
  {/* Temperatuurverwachting — direct onder de hero, altijd zichtbaar */}
  <section className="space-y-3">
    {/* ... bestaande ModelPluim-sectie ongewijzigd ... */}
  </section>

  <section className="space-y-3">
    {/* ... bestaande facts-grid-sectie ongewijzigd ... */}
  </section>

  {dayOffset === 0 && (
    <section className="space-y-3">
      {/* ... bestaande BuienradarRadar-sectie ongewijzigd ... */}
    </section>
  )}

  <section className="space-y-3">
    {/* ... bestaande dagdelen-sectie ongewijzigd ... */}
  </section>
</ExpertMode>
```

Laat de `{appendedContent}` (regel 448) ná `ExpertMode` staan, buiten de wrapper. Verwijder de `<WeatherVisuals ... />`-regel volledig.

> Let op: `ExpertMode` is een client-component met `children`. De doorgegeven `children` blijven server-gerenderd (React serialiseert ze als al-gerenderde nodes), dus `ModelPluim`/`BuienradarRadar` etc. veranderen niet van rendering-grens.

- [ ] **Step 4: Verwijder WeatherVisuals als niets het meer importeert**

Run: `grep -rn "WeatherVisuals" src/ || echo "geen verwijzingen meer"`
Expected: alleen `src/components/WeatherVisuals.tsx` zelf (de definitie). Als dat zo is:

```bash
git rm src/components/WeatherVisuals.tsx
```

- [ ] **Step 5: Type-check de hele app**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: geen nieuwe fouten in `DayBriefing.tsx`, `ExpertMode.tsx`, `ReedMeteogram.tsx`, `reed-expert-reading.ts`. (Bestaande, niet-gerelateerde fouten elders mogen blijven staan — vergelijk met de baseline vóór dit plan.)

- [ ] **Step 6: Build**

Run: `npm run build 2>&1 | tail -15`
Expected: build slaagt (Compiled successfully). `/vandaag` en `/morgen` blijven in de routelijst.

- [ ] **Step 7: Commit**

```bash
git add src/components/DayBriefing.tsx
git commit -m "feat(reed): Expert-modus live op /vandaag en /morgen; WeatherVisuals vervangen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Handmatige verificatie (visueel)

Geen test-runner voor UI; verifieer in de dev-server.

**Files:** geen.

- [ ] **Step 1: Start de dev-server**

Run: `npm run dev` (achtergrond), open `http://localhost:3000/vandaag`.

- [ ] **Step 2: Verifieer zonder Reed-voorkeur**

Zorg dat de Reed-voorkeur uit staat. Verwacht: **geen** `Gewoon | Expert`-toggle, pagina toont de normale body (feiten + dagdelen), geen expert-sectie.

- [ ] **Step 3: Verifieer met Reed-voorkeur aan**

Zet `preferences.reed` aan (via de agent-voorkeuren). Verwacht:
- `Gewoon | Expert`-toggle zichtbaar onder de hero.
- "Gewoon" toont de normale body.
- "Expert" toont Reed-kop (verdict-pill + headline), het meteogram met momenten-chips, en (op /vandaag) de bliksemkaart.
- Scrub: muis over een paneel → readout-balk bovenin toont de cijfers per uur; markeerlijn volgt.
- Herlaad de pagina → de laatst gekozen modus blijft staan (localStorage).
- Ga naar `/morgen` → modus blijft staan; geen bliksemkaart (alleen vandaag).

- [ ] **Step 4: Noteer afwijkingen**

Als iets niet klopt (lege grafiek, verkeerde kleur, scrub hapert), terug naar de betreffende task. Anders: klaar voor deploy.

---

## Self-Review

**Spec coverage:**
- A (toggle/modus, hero+alert blijven, localStorage, server children) → Task 3 + Task 4. ✓
- B (deterministische reading: verdict/headline/moments/layers) → Task 1. ✓
- C (premium interactief scrub-meteogram + momenten + lightning) → Task 2 + Task 3. ✓
- D (bestanden) → Task 1–4. ✓
- Toegang achter Reed-voorkeur → `reed` prop, Task 3/4. ✓
- Storm-only parameters (CAPE/CIN/LI/schering/dauwpunt/wind + bliksem) → Task 1 layers + Task 3 lightning. ✓
- `ReedExtremeCharts` blijft (ReedExtended) → niet verwijderd, Task 4 verwijdert alleen WeatherVisuals. ✓

**Placeholder scan:** geen TBD/TODO; alle code-stappen bevatten volledige code. ✓

**Type consistency:** `reedExpertReading(hours, dayLabel)` → `ReedExpertReading{ verdict, headline, moments, layers, hours }`; `ReedMeteogram({ layers, moments, hours })`; `ExpertMode({ reed, reading, lat, lon, dayOffset, children })`. Namen consistent tussen Task 1→2→3→4. `LightningMap` props `{ lat, lon }` consistent met huidig gebruik in WeatherVisuals. ✓

> **Open puntje voor de uitvoerder:** controleer bij Task 3 de echte default-export-signatuur van `src/components/LightningMap.tsx` (props-namen `lat`/`lon`) en pas aan indien afwijkend.
