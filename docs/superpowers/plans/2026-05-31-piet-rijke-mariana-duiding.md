# Piet gevoed door de rijke Mariana-duiding — Implementatieplan (Blok A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Piets weerbericht (Deepseek V4) wordt gevoed door de *rijke* nieuwe-Mariana
duiding (`agent_outputs.piet.text`, `risk_summary`, `mariana_summary`, regime) i.p.v.
alleen de compacte `local_feed` (regime + vlaggen).

**Architecture:** Een nieuwe pure functie `buildMarianaContext(signal, feed)` bouwt het
prompt-contextblok. Een nieuwe storage-loader `nearestRegionSignal(lat, lon)` leest het
volledige opgeslagen `MarianaSignal` uit `mariana_regions`. `piet-forecast.ts` knoopt ze
aan elkaar in `marianaLocalContext`. Geen extra LLM-call: de rijke tekst is al door de
cascade (Hermes, 1×/dag) geschreven; we lezen 'm alleen uit en geven hem als context mee.

**Tech Stack:** TypeScript, Next.js 16, Supabase (admin client), `npx tsx` voor
pure-functie-checks, `npx tsc --noEmit` voor type-correctheid.

**Scope-grens:** dit plan raakt alleen Piets *geschreven bericht*. Pollen/UV/dagcontext
als heads-ups, de `composeAgents`-laag, Koos en Reed zijn aparte plannen (Blok B/C).

**Context die de uitvoerder moet kennen:**
- De cascade-cron (`src/app/(site)/api/cron/mariana-nl/route.ts`) draait 1×/dag en slaat
  per regio een rij op in tabel `mariana_regions` met twee jsonb-kolommen: `signal` (rijk,
  het volledige `MarianaSignal`) en `local_feed` (compact, `MarianaLocalFeed`).
- Vandaag leest `piet-forecast.ts` alleen `local_feed` via `nearestRegionFeed`. De rijke
  `signal`-kolom wordt nergens uitgelezen — er is geen loader voor.
- Types staan in `src/lib/mariana/regions/types.ts` (`MarianaSignal`, `MarianaLocalFeed`).
- De Deepseek-call zelf draait pas weer als er OpenRouter-tegoed is (maandag). De code +
  de pure-functie-check + `tsc` zijn **nu** volledig te bouwen en te verifiëren; de
  end-to-end Deepseek-output verifieer je zodra het tegoed er is.

---

### Task 1: Pure context-builder `buildMarianaContext`

Een pure functie zonder Next-/Supabase-afhankelijkheden, zodat hij met `tsx` te checken is.

**Files:**
- Create: `src/lib/mariana/piet-context.ts`
- Test (check-harness): `scripts/check-piet-context.ts`

- [ ] **Step 1: Schrijf de falende check**

Create `scripts/check-piet-context.ts`:

```ts
import assert from "node:assert/strict";
import { buildMarianaContext } from "../src/lib/mariana/piet-context";

// 1. Volledig signaal -> rijke context met dagbeeld + aandachtspunten.
const ctx = buildMarianaContext(
  {
    dominant_short_term_regime: "wisselvallig met buien",
    risk_summary: {
      rain: "kans op buien",
      wind: "matig",
      thunder: "",
      temperature: "fris",
      comfort: "",
      pollen: "",
    },
    mariana_summary: "Onrustig weerbeeld.",
    agent_outputs: {
      piet: { text: "Een grijze dag met buien.", refer_to_reed: false, referral_reason: "" },
      koos: { text: "" },
      reed: { active: false, region_slug: null, region_name: null, tesla: null },
    },
  },
  null,
);
assert.ok(ctx && ctx.includes("Een grijze dag met buien."), "dagbeeld ontbreekt");
assert.ok(ctx.includes("regen: kans op buien"), "regen-risico ontbreekt");
assert.ok(ctx.includes("Regime vandaag: wisselvallig met buien"), "regime ontbreekt");

// 2. Geen signaal, alleen feed -> val terug op regime + Reed-verwijzing.
const ctx2 = buildMarianaContext(null, {
  regionSlug: "x",
  regionName: "X",
  regimeCode: "code",
  regimeLabel: "zonnig en droog",
  confidencePrior: 0.8,
  modelWeights: {},
  hazardFlags: ["heat"],
  convectiveActive: true,
  referralReason: "onweer vanmiddag",
  generatedAt: new Date().toISOString(),
});
assert.ok(ctx2 && ctx2.includes("zonnig en droog"), "feed-regime fallback ontbreekt");
assert.ok(ctx2.includes("heat"), "hazardFlags fallback ontbreekt");
assert.ok(ctx2.includes("Reed"), "Reed-verwijzing ontbreekt");

// 3. Lege input -> null.
assert.equal(buildMarianaContext(null, null), null, "lege input moet null geven");

console.log("OK - buildMarianaContext gedraagt zich correct");
```

- [ ] **Step 2: Run de check, verifieer dat hij faalt**

Run: `npx tsx scripts/check-piet-context.ts`
Expected: FAIL — module `../src/lib/mariana/piet-context` bestaat nog niet
(`Cannot find module` / resolve error).

- [ ] **Step 3: Schrijf de minimale implementatie**

Create `src/lib/mariana/piet-context.ts`:

```ts
/**
 * Pure context-builder voor Piets weerbericht.
 *
 * Zet de rijke nieuwe-Mariana duiding (uit het opgeslagen MarianaSignal) +
 * de compacte local_feed om in één contextblok dat als feitelijke basis aan
 * Deepseek V4 wordt meegegeven (zie piet-forecast.ts). Geen Next-/Supabase-
 * afhankelijkheden, zodat dit los te testen is.
 *
 * Voorkeur: signaal (rijk) boven feed (compact). Feed dient als terugval als de
 * signaal-kolom (nog) niet beschikbaar is.
 */
import type { MarianaSignal, MarianaLocalFeed } from "@/lib/mariana/regions/types";

/** Alleen de verhaal-delen die Piet nodig heeft. */
type SignalNarrative = Pick<
  MarianaSignal,
  "dominant_short_term_regime" | "risk_summary" | "mariana_summary" | "agent_outputs"
>;

export function buildMarianaContext(
  signal: SignalNarrative | null,
  feed: MarianaLocalFeed | null,
): string | null {
  const lines: string[] = [];

  const regime =
    signal?.dominant_short_term_regime || feed?.regimeLabel || feed?.regimeCode || "";
  if (regime) lines.push(`Regime vandaag: ${regime}.`);

  const pietText = signal?.agent_outputs?.piet?.text;
  if (pietText) lines.push(`Mariana's dagbeeld: ${pietText}`);

  const rs = signal?.risk_summary;
  if (rs) {
    const risks = [
      rs.rain && `regen: ${rs.rain}`,
      rs.wind && `wind: ${rs.wind}`,
      rs.thunder && `onweer: ${rs.thunder}`,
      rs.temperature && `temperatuur: ${rs.temperature}`,
      rs.comfort && `comfort: ${rs.comfort}`,
      rs.pollen && `pollen: ${rs.pollen}`,
    ].filter(Boolean);
    if (risks.length) lines.push(`Aandachtspunten — ${risks.join("; ")}.`);
  } else if (feed?.hazardFlags?.length) {
    lines.push(`Aandachtspunten: ${feed.hazardFlags.join(", ")}.`);
  }

  if (signal?.mariana_summary) lines.push(`Samenvatting: ${signal.mariana_summary}`);

  const reedReason =
    (feed?.convectiveActive && feed.referralReason) ||
    (signal?.agent_outputs?.piet?.refer_to_reed &&
      signal.agent_outputs.piet.referral_reason) ||
    "";
  if (reedReason) {
    lines.push(
      `Onweer/convectie speelt — verwijs voor de waarschuwingen kort naar Reed: "${reedReason}"`,
    );
  }

  if (!lines.length) return null;
  return lines.join(" ");
}
```

- [ ] **Step 4: Run de check, verifieer dat hij slaagt**

Run: `npx tsx scripts/check-piet-context.ts`
Expected: PASS — `OK - buildMarianaContext gedraagt zich correct`

- [ ] **Step 5: Commit**

```bash
git add src/lib/mariana/piet-context.ts scripts/check-piet-context.ts
git commit -m "feat(piet): pure context-builder voor rijke Mariana-duiding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Rijke-signaal loader in de Regions-storage

**Files:**
- Modify: `src/lib/mariana/regions/storage.ts`

- [ ] **Step 1: Breid de type-import uit**

In `src/lib/mariana/regions/storage.ts`, regel 16, vervang:

```ts
import type { MarianaRun, MarianaLocalFeed } from "./types";
```

door:

```ts
import type { MarianaRun, MarianaLocalFeed, MarianaSignal } from "./types";
```

- [ ] **Step 2: Voeg de loaders toe**

Voeg onderaan `src/lib/mariana/regions/storage.ts` toe (ná `nearestRegionFeed`):

```ts
/**
 * Laatste volledige MarianaSignal voor een regio-slug (meest recente run).
 * Leest de rijke `signal`-kolom — de duiding die Piet/Koos/Reed nodig hebben,
 * naast de compacte local_feed. Best-effort: faalt zacht zonder service-role.
 */
export async function loadRegionSignal(regionSlug: string): Promise<MarianaSignal | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data, error } = await adminDb()
      .from(TABLE)
      .select("signal, run_at")
      .eq("region_slug", regionSlug)
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const signal = (data as { signal?: unknown }).signal;
    return signal ? (signal as MarianaSignal) : null;
  } catch {
    return null;
  }
}

/**
 * Volledig MarianaSignal voor een locatie: mapt naar de dichtstbijzijnde
 * mesoschaal-regio en geeft die rijke duiding terug. Leespunt voor de
 * persoonlijke surfaces (Piet/Koos) — niet voor de 10K-pagina's in het hete pad.
 */
export async function nearestRegionSignal(
  lat: number,
  lon: number,
): Promise<MarianaSignal | null> {
  const region = nearestTeslaRegion(lat, lon);
  return loadRegionSignal(region.slug);
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: geen NIEUWE fouten in `src/lib/mariana/regions/storage.ts`. (Het project kan
elders pre-existing fouten hebben — `ignoreBuildErrors` staat aan; let alleen op de
aangeraakte file.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/mariana/regions/storage.ts
git commit -m "feat(mariana): loader voor het rijke MarianaSignal per regio/locatie

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire de rijke duiding in Piets weerbericht

**Files:**
- Modify: `src/lib/piet-forecast.ts` (regels 1-4 imports; 89-109 `marianaLocalContext`)

- [ ] **Step 1: Voeg de import toe**

In `src/lib/piet-forecast.ts`, ná regel 4 (`import type { WeatherData } from "@/lib/types";`),
voeg toe:

```ts
import { buildMarianaContext } from "@/lib/mariana/piet-context";
```

- [ ] **Step 2: Vervang `marianaLocalContext`**

Vervang de hele functie `marianaLocalContext` (regels 89-109, het blok dat begint met de
JSDoc `/** Mariana Local-context voor de KNMI-briefing ...` t/m de sluitende `}` van de
functie) door:

```ts
/**
 * Mariana-dagduiding voor de KNMI-briefing. Combineert de RIJKE signaal-duiding
 * (agent_outputs.piet.text + risk_summary + mariana_summary + regime) met de
 * compacte local_feed (regime/gevaar/Reed-verwijzing) van de dichtstbijzijnde
 * regio. Zo krijgt de 30-min live-overlay het volledige dagfundament van de
 * cascade mee, zonder zelf een LLM-redenering te draaien. Best-effort; faalt zacht.
 */
async function marianaLocalContext(lat: number, lon: number): Promise<string | null> {
  try {
    const { nearestRegionFeed, nearestRegionSignal } = await import(
      "@/lib/mariana/regions/storage"
    );
    const [feed, signal] = await Promise.all([
      nearestRegionFeed(lat, lon).catch(() => null),
      nearestRegionSignal(lat, lon).catch(() => null),
    ]);
    return buildMarianaContext(signal, feed);
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: geen NIEUWE fouten in `src/lib/piet-forecast.ts`.

- [ ] **Step 4: Verifieer dat de pure-functie-check nog groen is**

Run: `npx tsx scripts/check-piet-context.ts`
Expected: PASS (ongewijzigd — Task 1 raakte deze functie niet).

- [ ] **Step 5: Commit**

```bash
git add src/lib/piet-forecast.ts
git commit -m "feat(piet): voed weerbericht met de rijke Mariana-duiding i.p.v. alleen local_feed

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Functionele eindverificatie (zodra OpenRouter-tegoed er is, ~maandag)

Niet blokkerend voor de bovenstaande commits; dit bevestigt de end-to-end keten:

- [ ] Draai de cascade-cron zodat `mariana_regions` gevuld is:
  `curl -s -H "Authorization: Bearer weerzone-cron-2026-djaelito" https://weerzone.nl/api/cron/mariana-nl`
  Verwacht: `regions.saved: 11`.
- [ ] Open `/piet` voor een NL-locatie en bevestig dat Piets tekst de toon/inhoud van de
  Mariana-duiding weerspiegelt (regime, aandachtspunten, eventueel Reed-verwijzing) — en
  géén jargon of modelnamen bevat.

---

## Self-review (uitgevoerd)

- **Spec-dekking:** dit plan dekt spec §4 (Piet, het "gat": rijke duiding i.p.v. compacte
  feed) + spec §9 rijen "rijke-signaal loader" en "rijke duiding → Piet-prompt". Pollen/UV/
  dagcontext-heads-ups, `composeAgents`, Koos (§6) en Reed (§5) zijn bewust buiten dit plan
  — eigen plannen.
- **Placeholders:** geen TBD/TODO; alle code volledig uitgeschreven.
- **Type-consistentie:** `buildMarianaContext(signal, feed)` — dezelfde signatuur in Task 1
  (definitie), de check (Task 1) en de aanroep (Task 3). `nearestRegionSignal(lat, lon)` —
  gedefinieerd in Task 2, aangeroepen in Task 3. Veldnamen (`agent_outputs.piet.text`,
  `risk_summary.*`, `mariana_summary`, `dominant_short_term_regime`, `local_feed`-velden)
  komen overeen met `src/lib/mariana/regions/types.ts`.

## Volgende plannen (apart te schrijven)

- **Blok A-vervolg / Compose:** `composeAgents` + pollen/UV/dagcontext + Reed-link als
  `AgentHeadsUp[]` op de pagina's.
- **Blok B — Koos:** `koos-getaway.ts` getaway-engine + Koos-stem + pagina + mail-integratie.
- **Blok C — Reed:** `ReedWarningsPage` op live `loadLatestTeslaRun` + Reed-stem +
  conditionele alarm-mail (na Anthropic-key + tegoed).
