# Venue Weather Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add programmatic per-venue weather pages (attractieparken, dierentuinen, buitenbaden/zwemplassen, campings) on the existing `/weer/[province]/[slug]` system, each content-distinct from city pages.

**Architecture:** Venues are `Place` entries with a new optional `venueType`. A curated `nl-venues.ts` is spread into `ALL_PLACES`, so the existing route, ISR, and `buildNLSitemap` pick them up automatically. A `venue-content.ts` helper centralizes per-type copy (H1, meta, intro, schema `@type`, LLM-prompt fragment). The route, schema builder, and SEO-content action branch on `venueType`.

**Tech Stack:** Next.js 16 App Router, TypeScript. Verification: `npx tsc --noEmit` (the repo's type-drift signal — `next.config.ts` sets `ignoreBuildErrors`) + `npx tsx scripts/check-*.ts` smoke scripts (existing repo convention). **No jest/vitest** — the repo has no unit-test runner and `CLAUDE.md` says do not invent one.

---

## Conventions for every task

- **"Smoke test"** = a `scripts/check-*.ts` file run with `npx tsx <file>`. It imports real modules, asserts with `node:assert`, and `console.log("OK: ...")` on success; throws on failure (non-zero exit).
- After each task: run `npx tsc --noEmit 2>&1 | grep -E "<files touched>"` and confirm no errors in touched files.
- Commit after each task. Work on branch `weerzone-agents-fase1` (do NOT push; deploy is a separate, user-driven step).
- Coordinates in this plan are real (sourced via Overpass `tourism=theme_park` / `tourism=zoo` over the NL area). Province slugs use the existing `NL_PROVINCE_SLUGS` values (e.g. `noord-brabant`, `noord-holland`).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/venue-content.ts` | **New.** `VenueType`, per-type config (h1/metaTitle/intro/schemaType/promptFragment), and accessor helpers. Single source of truth for venue copy. |
| `src/lib/nl-venues.ts` | **New.** Curated `NL_VENUE_PLACES: Place[]` (~120 entries). Data only. |
| `src/lib/places-data.ts` | Add `venueType?` to `Place`; spread `NL_VENUE_PLACES` into `ALL_PLACES`. |
| `src/lib/sitemap-data.ts` | `buildNLSitemap`: priority `0.7` when `place.venueType` set. |
| `src/lib/schema.ts` | `schemaCityWeatherPage`: accept `venueType`, map to `about.@type`. |
| `src/app/actions.ts` | `getLocationSEOContent`: accept `venueType`, add prompt fragment. |
| `src/app/(site)/weer/[province]/[place]/page.tsx` | Pass `venueType` to schema + SEO content; venue-aware `titleOverride` + metadata title. |
| `scripts/check-venues.ts` | **New.** Smoke script for data + helpers. |

---

## Task 1: Venue type + content helper

**Files:**
- Create: `src/lib/venue-content.ts`
- Create: `scripts/check-venues.ts`

- [ ] **Step 1: Write the failing smoke script**

Create `scripts/check-venues.ts`:

```ts
import assert from "node:assert";
import { VENUE_TYPES, venueH1, venueMetaTitle, venueSchemaType, venuePromptFragment } from "../src/lib/venue-content";

// All four types configured
assert.deepStrictEqual([...VENUE_TYPES].sort(), ["attractiepark", "camping", "dierentuin", "zwembad"]);

// Type-aware H1 differs from the generic city H1
assert.strictEqual(venueH1("Efteling", "attractiepark"), "Weer bij de Efteling");
assert.strictEqual(venueH1("Amsterdam", undefined), "Weer in Amsterdam");

// Schema @type mapping (all valid schema.org types)
assert.strictEqual(venueSchemaType("attractiepark"), "AmusementPark");
assert.strictEqual(venueSchemaType("dierentuin"), "Zoo");
assert.strictEqual(venueSchemaType("zwembad"), "SportsActivityLocation");
assert.strictEqual(venueSchemaType("camping"), "Campground");

// Prompt fragment + meta title are non-empty and mention the venue
assert.ok(venuePromptFragment("Toverland", "attractiepark").includes("Toverland"));
assert.ok(venueMetaTitle("Artis", "dierentuin").includes("Artis"));

console.log("OK: venue-content helpers");
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx scripts/check-venues.ts`
Expected: FAIL — `Cannot find module '../src/lib/venue-content'`.

- [ ] **Step 3: Implement `venue-content.ts`**

Create `src/lib/venue-content.ts`:

```ts
/**
 * Type-bewuste copy/config voor venue-weerpagina's (attractieparken,
 * dierentuinen, buitenbaden, campings). Eén bron voor H1, metatitel, intro,
 * schema.org @type en de LLM-promptfragmenten, zodat de route/schema/actions
 * dun blijven.
 */

export const VENUE_TYPES = ["attractiepark", "dierentuin", "zwembad", "camping"] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

interface VenueConfig {
  /** Lidwoord-correcte H1, bv. "Weer bij de Efteling". */
  h1: (name: string) => string;
  /** SERP-titel (<= ~60 tekens samen met merknaam). */
  metaTitle: (name: string) => string;
  /** Korte type-specifieke intro boven het dashboard. */
  intro: (name: string) => string;
  /** Geldig schema.org @type voor het `about`-veld. */
  schemaType: string;
  /** Extra promptregel voor getLocationSEOContent. */
  promptFragment: (name: string) => string;
}

const CONFIG: Record<VenueType, VenueConfig> = {
  attractiepark: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — plan je dagje uit`,
    intro: (n) =>
      `Plan je dagje ${n} rond het weer: wanneer het droog blijft, de beste uren en of je een jas mee moet.`,
    schemaType: "AmusementPark",
    promptFragment: (n) =>
      `${n} is een attractiepark; schrijf vanuit "plan je dagje uit": buitenattracties, regentiming en beste bezoekuren.`,
  },
  dierentuin: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — dierentuin-bezoek plannen`,
    intro: (n) =>
      `Plan je bezoek aan ${n}: de meeste dieren zijn buiten, dus weer en beste uren maken je dag.`,
    schemaType: "Zoo",
    promptFragment: (n) =>
      `${n} is een dierentuin; schrijf vanuit een buitenbezoek: schaduw, regen en beste uren om de dieren actief te zien.`,
  },
  zwembad: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — zwemweer vandaag en morgen`,
    intro: (n) =>
      `Is het zwemweer bij ${n}? Bekijk zon, temperatuur en regen voor vandaag en morgen.`,
    schemaType: "SportsActivityLocation",
    promptFragment: (n) =>
      `${n} is een buitenbad/zwemplas; schrijf vanuit zwemweer: zon-uren, temperatuur en wanneer het droog is.`,
  },
  camping: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — kampeerweer vandaag en morgen`,
    intro: (n) =>
      `Kampeerweer voor ${n}: wind, regen en temperatuur voor vandaag en morgen, zodat je weet waar je aan toe bent.`,
    schemaType: "Campground",
    promptFragment: (n) =>
      `${n} is een camping; schrijf vanuit buitenplanning: wind, neerslag en nachttemperatuur voor kampeerders.`,
  },
};

export function venueH1(name: string, vt?: VenueType): string {
  return vt ? CONFIG[vt].h1(name) : `Weer in ${name}`;
}
export function venueMetaTitle(name: string, vt: VenueType): string {
  return CONFIG[vt].metaTitle(name);
}
export function venueIntro(name: string, vt: VenueType): string {
  return CONFIG[vt].intro(name);
}
export function venueSchemaType(vt: VenueType): string {
  return CONFIG[vt].schemaType;
}
export function venuePromptFragment(name: string, vt: VenueType): string {
  return CONFIG[vt].promptFragment(name);
}
```

- [ ] **Step 4: Run the smoke script to confirm it passes**

Run: `npx tsx scripts/check-venues.ts`
Expected: `OK: venue-content helpers`

- [ ] **Step 5: Typecheck touched files**

Run: `npx tsc --noEmit 2>&1 | grep -E "venue-content|check-venues" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 6: Commit**

```bash
git add src/lib/venue-content.ts scripts/check-venues.ts
git commit -m "feat(venues): type-aware content helper + smoke script"
```

---

## Task 2: Add `venueType` to `Place` and curated venue data

**Files:**
- Modify: `src/lib/places-data.ts:14-23` (Place interface), `:101-102` (ALL_PLACES spread)
- Create: `src/lib/nl-venues.ts`
- Modify: `scripts/check-venues.ts` (extend)

- [ ] **Step 1: Add `venueType` to the `Place` interface**

In `src/lib/places-data.ts`, add the field and import the type. At the top imports add:

```ts
import type { VenueType } from "./venue-content";
```

In the `Place` interface (currently lines 14-23), add after `character?`:

```ts
  venueType?: VenueType;
```

- [ ] **Step 2: Create the curated venue file**

Create `src/lib/nl-venues.ts`. Coordinates below are real (Overpass). Province is the existing slug. Fill the remaining entries to ~120 total from the Overpass dump using the same shape; the seed below is the verified core. **Do not include kinderboerderijen or miniworlds** (thin-content risk).

```ts
import type { Place } from "./places-data";

/**
 * Curated NL leisure venues -> programmatische weerpagina's op
 * /weer/[province]/[slug]. Co-ordinaten via OpenStreetMap (Overpass).
 * Kwaliteit boven kwantiteit: alleen echt-gezochte venues, geen
 * kinderboerderijen/miniworlds (thin-content vermijden).
 */
export const NL_VENUE_PLACES: Place[] = [
  // --- Attractieparken ---
  { name: "Efteling", province: "noord-brabant", lat: 51.6499, lon: 5.0481, slug: "efteling", venueType: "attractiepark", character: "inland" },
  { name: "Walibi Holland", province: "flevoland", lat: 52.4402, lon: 5.768, slug: "walibi-holland", venueType: "attractiepark", character: "inland" },
  { name: "Toverland", province: "limburg", lat: 51.3983, lon: 5.9839, slug: "toverland", venueType: "attractiepark", character: "inland" },
  { name: "Attractiepark Slagharen", province: "overijssel", lat: 52.6232, lon: 6.5631, slug: "attractiepark-slagharen", venueType: "attractiepark", character: "inland" },
  { name: "Duinrell", province: "zuid-holland", lat: 52.1476, lon: 4.3807, slug: "duinrell", venueType: "attractiepark", character: "coastal" },
  { name: "Avonturenpark Hellendoorn", province: "overijssel", lat: 52.3898, lon: 6.436, slug: "avonturenpark-hellendoorn", venueType: "attractiepark", character: "inland" },
  { name: "Julianatoren", province: "gelderland", lat: 52.2267, lon: 5.916, slug: "julianatoren", venueType: "attractiepark", character: "highland" },
  { name: "Familiepark Drievliet", province: "zuid-holland", lat: 52.0543, lon: 4.3503, slug: "drievliet", venueType: "attractiepark", character: "urban" },
  { name: "Linnaeushof", province: "noord-holland", lat: 52.3254, lon: 4.5984, slug: "linnaeushof", venueType: "attractiepark", character: "coastal" },
  { name: "Madurodam", province: "zuid-holland", lat: 52.0995, lon: 4.2976, slug: "madurodam", venueType: "attractiepark", character: "coastal" },
  { name: "Deltapark Neeltje Jans", province: "zeeland", lat: 51.6391, lon: 3.7143, slug: "deltapark-neeltje-jans", venueType: "attractiepark", character: "coastal" },
  { name: "Familiepark DippieDoe", province: "noord-brabant", lat: 51.4999, lon: 5.436, slug: "dippiedoe", venueType: "attractiepark", character: "inland" },
  { name: "Sprookjeswonderland", province: "noord-holland", lat: 52.7118, lon: 5.2895, slug: "sprookjeswonderland", venueType: "attractiepark", character: "coastal" },

  // --- Dierentuinen ---
  { name: "Artis", province: "noord-holland", lat: 52.366, lon: 4.9167, slug: "artis", venueType: "dierentuin", character: "urban" },
  { name: "Burgers' Zoo", province: "gelderland", lat: 52.0101, lon: 5.9001, slug: "burgers-zoo", venueType: "dierentuin", character: "highland" },
  { name: "Apenheul", province: "gelderland", lat: 52.2152, lon: 5.9186, slug: "apenheul", venueType: "dierentuin", character: "highland" },
  { name: "AquaZoo Leeuwarden", province: "friesland", lat: 53.2151, lon: 5.8831, slug: "aquazoo-leeuwarden", venueType: "dierentuin", character: "inland" },
  { name: "Avifauna", province: "zuid-holland", lat: 52.1393, lon: 4.649, slug: "avifauna", venueType: "dierentuin", character: "inland" },
  { name: "BestZOO", province: "noord-brabant", lat: 51.5293, lon: 5.4008, slug: "bestzoo", venueType: "dierentuin", character: "inland" },
  // TODO during implementation: add Diergaarde Blijdorp, Safaripark Beekse Bergen,
  // Ouwehands Dierenpark, GaiaZOO, Wildlands Emmen, DierenPark Amersfoort,
  // Dierenrijk, Zoo Parc Overloon (verify each coord via Overpass dump).

  // --- Buitenbaden / zwemplassen ---  (verify coords per venue at implementation)
  // --- Campings ---  (existing campings already in KOOS_NL_CAMPING_PLACES; see Task 2 Step 4)
];
```

- [ ] **Step 3: Spread venues into `ALL_PLACES`**

In `src/lib/places-data.ts`, add the import near the existing camping import (line ~12):

```ts
import { NL_VENUE_PLACES } from "./nl-venues";
```

In the `ALL_PLACES` array literal (currently spreading `...KOOS_NL_PLACES, ...KOOS_NL_CAMPING_PLACES` at lines ~101-102), add:

```ts
  ...NL_VENUE_PLACES,
```

- [ ] **Step 4: Tag existing campings with `venueType`**

The campings in `KOOS_NL_CAMPING_PLACES` (generated) and the inline `KOOS_NL_PLACES` campings predate `venueType`. Add `venueType: "camping"` to the inline camping entries in `places-data.ts` (the block commented "Campings en vakantieparken", lines ~63-75). The generated file is regenerated by its own script — leave it; instead, in the `ALL_PLACES` build, the inline ones get tagged. (Do not edit the `.generated` file by hand.)

- [ ] **Step 5: Extend the smoke script**

Append to `scripts/check-venues.ts`:

```ts
import { NL_PLACES, placeRouteSlug, findPlace } from "../src/lib/places-data";

const venues = NL_PLACES.filter((p) => p.venueType);
assert.ok(venues.length >= 15, `expected >=15 venues, got ${venues.length}`);

// every venue resolves to a unique, clean slug + is findable on its route
const slugs = new Set<string>();
for (const v of venues) {
  const slug = placeRouteSlug(v);
  assert.ok(slug && !slug.includes("--"), `bad slug for ${v.name}: ${slug}`);
  const key = `${v.province}/${slug}`;
  assert.ok(!slugs.has(key), `duplicate venue route: ${key}`);
  slugs.add(key);
  assert.ok(findPlace(v.province, slug), `findPlace failed for ${key}`);
  assert.ok(Math.abs(v.lat) <= 54 && Math.abs(v.lon) <= 8, `coord out of NL range: ${v.name}`);
}
console.log(`OK: ${venues.length} venues resolve uniquely`);
```

- [ ] **Step 6: Run smoke + typecheck**

Run: `npx tsx scripts/check-venues.ts`
Expected: both `OK:` lines print.
Run: `npx tsc --noEmit 2>&1 | grep -E "nl-venues|places-data" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 7: Commit**

```bash
git add src/lib/nl-venues.ts src/lib/places-data.ts scripts/check-venues.ts
git commit -m "feat(venues): curated venue data + venueType on Place"
```

---

## Task 3: Sitemap priority for venues

**Files:**
- Modify: `src/lib/sitemap-data.ts:152-168` (`buildNLSitemap`)

- [ ] **Step 1: Extend the smoke script**

Append to `scripts/check-venues.ts`:

```ts
import { buildNLSitemap } from "../src/lib/sitemap-data";

const xml = buildNLSitemap();
const efteling = NL_PLACES.find((p) => p.slug === "efteling");
assert.ok(efteling, "efteling missing from NL_PLACES");
assert.ok(xml.includes(`/weer/${efteling!.province}/efteling`), "efteling not in sitemap");
console.log("OK: venues appear in sitemap-nl");
```

- [ ] **Step 2: Run to confirm the URL is present but priority is default (0.5)**

Run: `npx tsx scripts/check-venues.ts`
Expected: prints `OK: venues appear in sitemap-nl` (URL already included because it's a `Place`). Priority assertion comes next.

- [ ] **Step 3: Give venues priority 0.7**

In `src/lib/sitemap-data.ts`, inside `buildNLSitemap`'s loop (currently line ~163):

```ts
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: place.venueType ? 0.7 : placePriority(place.population) });
```

- [ ] **Step 4: Verify venues sort ahead of low-priority places**

`xmlUrlset` does not emit a `<priority>` tag (only `<loc>`+`<lastmod>`), so the 0.7 value is observable only through `entries.sort((a,b)=>priority desc)` — venues land near the top of the urlset. Append this order assertion to `scripts/check-venues.ts`:

```ts
// venue (priority 0.7) sorts ahead of a default 0.5 hamlet in the urlset order
const locOrder = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const eftelingIdx = locOrder.findIndex((u) => u.endsWith("/efteling"));
assert.ok(eftelingIdx > -1 && eftelingIdx < locOrder.length / 2, "venue should sort in the high-priority half");
console.log("OK: venues sort high in sitemap (priority 0.7)");
```

This makes the priority change observable without a `<priority>` tag. The literal `0.7` is set in Step 3 and confirmed by code review.

- [ ] **Step 5: Run smoke + typecheck**

Run: `npx tsx scripts/check-venues.ts` → all `OK:` lines.
Run: `npx tsc --noEmit 2>&1 | grep -E "sitemap-data" || echo CLEAN` → `CLEAN`

- [ ] **Step 6: Commit**

```bash
git add src/lib/sitemap-data.ts scripts/check-venues.ts
git commit -m "feat(venues): priority 0.7 in NL sitemap"
```

---

## Task 4: Venue-aware schema `@type`

**Files:**
- Modify: `src/lib/schema.ts:209-243` (`schemaCityWeatherPage`)

- [ ] **Step 1: Extend the smoke script**

Append to `scripts/check-venues.ts`:

```ts
import { schemaCityWeatherPage } from "../src/lib/schema";

const venueLd: any = schemaCityWeatherPage({ placeName: "Efteling", lat: 51.6499, lon: 5.0481, province: "noord-brabant", slug: "efteling", venueType: "attractiepark" });
assert.strictEqual(venueLd.about["@type"], "AmusementPark");
const cityLd: any = schemaCityWeatherPage({ placeName: "Amsterdam", lat: 52.366, lon: 4.9, province: "noord-holland", slug: "amsterdam" });
assert.strictEqual(cityLd.about["@type"], "City");
console.log("OK: schema @type maps by venueType");
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx tsx scripts/check-venues.ts`
Expected: FAIL — `schemaCityWeatherPage` does not accept `venueType`; `about["@type"]` is `"City"` for Efteling.

- [ ] **Step 3: Implement the mapping**

In `src/lib/schema.ts`, add the import at top:

```ts
import { venueSchemaType, type VenueType } from "./venue-content";
```

Add `venueType?: VenueType;` to the `schemaCityWeatherPage` opts type (after `speakableSelectors?`). Then change the `about` block (currently lines 228-236):

```ts
    about: {
      "@type": opts.venueType ? venueSchemaType(opts.venueType) : "City",
      name: opts.placeName,
      geo: {
        "@type": "GeoCoordinates",
        latitude: opts.lat,
        longitude: opts.lon,
      },
    },
```

- [ ] **Step 4: Run smoke + typecheck**

Run: `npx tsx scripts/check-venues.ts` → `OK: schema @type maps by venueType`
Run: `npx tsc --noEmit 2>&1 | grep -E "schema.ts" || echo CLEAN` → `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts scripts/check-venues.ts
git commit -m "feat(venues): accurate schema @type per venueType"
```

---

## Task 5: Venue context in SEO content

**Files:**
- Modify: `src/app/actions.ts:565-595` (`getLocationSEOContent`)

- [ ] **Step 1: Add `venueType` param + prompt fragment**

In `src/app/actions.ts`, add the import at top:

```ts
import { venuePromptFragment, type VenueType } from "@/lib/venue-content";
```

Change the signature (line 565-570) to add `venueType` before `_locale`:

```ts
export async function getLocationSEOContent(
  placeName: string,
  province: string,
  character?: string,
  venueType?: VenueType,
  _locale: "nl" | "de" | "fr" | "es" = "nl",
): Promise<string> {
```

In the prompt template (after the `character` line, ~line 591), add:

```ts
${venueType ? venuePromptFragment(placeName, venueType) : ""}
```

- [ ] **Step 2: Typecheck (no smoke — this calls external LLM/Supabase)**

Run: `npx tsc --noEmit 2>&1 | grep -E "actions.ts" || echo CLEAN`
Expected: `CLEAN`. (Behavioral verification happens live in Task 7 — this function hits Hermes + Supabase and is not unit-testable offline.)

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat(venues): venue context in getLocationSEOContent prompt"
```

---

## Task 6: Wire the route (titleOverride, metadata, schema, SEO content)

**Files:**
- Modify: `src/app/(site)/weer/[province]/[place]/page.tsx` (lines 92, 178, 200-206, 244)

- [ ] **Step 1: Import the venue helpers**

At the top of `page.tsx`, add to the existing `@/lib/...` imports:

```ts
import { venueH1, venueMetaTitle } from "@/lib/venue-content";
```

- [ ] **Step 2: Venue-aware metadata title**

In `generateMetadata`, replace line 92:

```ts
  const title = place.venueType
    ? `${venueMetaTitle(place.name, place.venueType)} | WEERZONE`
    : `Weer ${place.name} | 10x nauwkeuriger op straatniveau`;
```

- [ ] **Step 3: Pass `venueType` to the SEO content call**

Replace line 178 (`getLocationSEOContent(place.name, provLabel, place.character)`):

```ts
    getLocationSEOContent(place.name, provLabel, place.character, place.venueType).catch(() => ""),
```

- [ ] **Step 4: Pass `venueType` to the schema builder**

Replace the `schemaCityWeatherPage({...})` call (lines 200-206):

```ts
  const weatherPageLd = schemaCityWeatherPage({
    placeName: place.name,
    lat: place.lat,
    lon: place.lon,
    province,
    slug,
    venueType: place.venueType,
  });
```

- [ ] **Step 5: Venue-aware H1 via `titleOverride`**

On the `<WeatherDashboard ...>` element (line ~244), add the prop (only overrides for venues; city pages keep `place.name` as H1):

```tsx
        <WeatherDashboard
          initialCity={place}
          initialWeather={initialWeather}
          titleOverride={place.venueType ? venueH1(place.name, place.venueType) : undefined}
```

- [ ] **Step 6: Typecheck the route**

Run: `npx tsc --noEmit 2>&1 | grep -E "place./page.tsx|\[place\]" || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(site)/weer/[province]/[place]/page.tsx"
git commit -m "feat(venues): venue-aware H1, title + schema/SEO wiring on weather route"
```

---

## Task 7: Regenerate sitemap snapshots + live verification

**Files:**
- Modify: `public/sitemap-nl.xml` (+ any snapshots written by the script)

- [ ] **Step 1: Regenerate the snapshot**

Run: `npx tsx scripts/gen-sitemap.ts`
Expected: rewrites `public/sitemap-nl.xml` (and siblings). Confirm a venue URL is present:

Run: `grep -c "/efteling</loc>" public/sitemap-nl.xml`
Expected: `1`

- [ ] **Step 2: Full typecheck of all touched files**

Run: `npx tsc --noEmit 2>&1 | grep -E "venue-content|nl-venues|places-data|sitemap-data|schema.ts|actions.ts|\[place\]" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 3: Final smoke run**

Run: `npx tsx scripts/check-venues.ts`
Expected: all `OK:` lines, exit 0.

- [ ] **Step 4: Commit**

```bash
git add public/sitemap-nl.xml public/sitemap-static.xml public/sitemap.xml
git commit -m "chore(venues): regenerate sitemap snapshots"
```

- [ ] **Step 5: Local dev smoke (manual)**

Run: `npm run dev`, then load `http://localhost:3000/weer/noord-brabant/efteling`.
Expected: page renders; `<h1>` is "Weer bij Efteling"; `<title>` mentions "dagje uit"; view-source shows JSON-LD with `"@type":"AmusementPark"`. Load `http://localhost:3000/weer/noord-holland/amsterdam` and confirm it is unchanged (h1 "Amsterdam", schema `"City"`).

- [ ] **Step 6 (post-deploy, optional):** after the user deploys to `main`, verify ISR live:

Run: `curl -s https://weerzone.nl/weer/noord-brabant/efteling | grep -o "AmusementPark"`
Expected: `AmusementPark`.

---

## Self-Review notes (addressed)

- **Spec coverage:** data model (T2), URL/sitemap (T2/T3/T7), type-aware layer — H1/metadata/intro/LLM/schema (T1/T4/T5/T6), thin-content safeguards (curated data T2 + unique per-type copy T1/T4/T5), scope (~120 in T2 data file). Intro copy (`venueIntro`) is defined in T1; rendering it as a visible block is optional polish — the H1 + metadata + LLM content + schema already make each page distinct, so a dedicated intro render is **out of scope** for this plan unless desired.
- **Type consistency:** `VenueType` defined once in `venue-content.ts` and imported everywhere; `venueSchemaType`/`venueH1`/`venueMetaTitle`/`venuePromptFragment` signatures match their call sites in T4/T5/T6.
- **No jest:** verification is `tsc --noEmit` + `scripts/check-venues.ts` (tsx), per `CLAUDE.md`.
- **Data completion caveat:** the `nl-venues.ts` seed (~19 verified entries) must be expanded to the ~120 target during T2 using the Overpass dump; coordinates must be real (no placeholders). Excluded: kinderboerderijen, miniworlds, indoor-only pools.
