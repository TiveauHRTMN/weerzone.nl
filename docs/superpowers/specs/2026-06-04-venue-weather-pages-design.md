# Design — Programmatic venue weather pages

**Date:** 2026-06-04
**Branch:** weerzone-agents-fase1
**Status:** Approved design — pending implementation plan

## Goal

Add programmatic weather pages for Dutch leisure venues — attractieparken,
dierentuinen, buitenbaden/zwemplassen, and campings — that rank for
"weer <venue>" queries (e.g. "weer Efteling morgen"). These are high-intent,
high-volume searches the site does not currently target.

The pages reuse the existing programmatic city-page system at
`/weer/[province]/[place]` rather than introducing a new taxonomy. The codebase
already treats venues as `Place` entries (campings via
`KOOS_NL_CAMPING_PLACES`, nationale parken, Waddeneilanden), so this extends a
proven pattern.

## Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| URL taxonomy | Existing `/weer/<provincie>/<slug>` | Reuses route, ISR, template, schema, sitemap. Convention-consistent. Zero new infra. |
| Data source | Curated list (~120 venues) | Quality over quantity; strongest defense against thin-content/index-bloat. |
| Content strategy | Type-aware content layer | A `venueType` field drives a unique H1/intro/LLM-content/schema per type, avoiding near-duplicate pages. |
| Zwembaden definition | Buitenbaden + zwemplassen only | Indoor pools have negligible weather intent. |
| First-batch scope | ~120 venues | See scope table. |

## Architecture

### 1. Data model

Extend the `Place` interface in `src/lib/places-data.ts` with one optional field:

```ts
venueType?: "attractiepark" | "dierentuin" | "zwembad" | "camping";
```

New curated file `src/lib/nl-venues.ts`:

```ts
export const NL_VENUE_PLACES: Place[] = [
  { name: "Efteling", province: "noord-brabant", lat: 51.6498, lon: 5.0497,
    slug: "efteling", venueType: "attractiepark", character: "inland" },
  // ...
];
```

Spread into `ALL_PLACES` in `places-data.ts`, alongside the existing
`...KOOS_NL_PLACES, ...KOOS_NL_CAMPING_PLACES`. Because
`NL_PLACES = ALL_PLACES.filter(isNLProvince)` and both the route resolver
(`findPlace`) and `buildNLSitemap` iterate `NL_PLACES`, venues are picked up
automatically — no route or sitemap-builder changes required.

Existing campings (named "Camping …") are tagged with
`venueType: "camping"` so they share the type-aware layer. They may be
expanded but are not migrated (URLs unchanged).

### 2. URL & sitemap

- URLs: `/weer/<provincie>/<slug>` — unchanged route.
  Examples: `/weer/noord-brabant/efteling`, `/weer/noord-holland/artis`,
  `/weer/gelderland/openluchtbad-...`.
- Sitemap: auto-included in `sitemap-nl.xml` via `buildNLSitemap`.
  Venues lack a `population`, so they would default to priority 0.5. Give
  venues an explicit priority (0.7) in `buildNLSitemap` when `venueType` is set.
- Regenerate `public/*.xml` snapshots via `npx tsx scripts/gen-sitemap.ts`.

### 3. Type-aware content layer

When `place.venueType` is set, `src/app/(site)/weer/[province]/[place]/page.tsx`
diverges from the generic city render:

- **H1 / titleOverride**: type-specific preposition and framing —
  `Weer bij de Efteling` (not `Weer in Efteling`).
- **Metadata** (`generateMetadata`): venue + dagje-uit framing in title and
  description.
- **LLM SEO content**: pass `venueType` into `getLocationSEOContent`
  (`src/app/actions.ts:565`). The existing `character` param already injects
  into the prompt (line 591); add a parallel `venueType` context line
  (buitenplanning, beste bezoekuren, regentiming, indoor/outdoor advies).
- **Intro block**: a short type-specific lead rendered above the dashboard.
- **Schema**: in `schemaCityWeatherPage` (`src/lib/schema.ts`), map `venueType`
  to an accurate `about` `@type` instead of `City`:
  - `attractiepark` → `AmusementPark`
  - `dierentuin` → `Zoo`
  - `zwembad` → `SportsActivityLocation` (valid schema.org type; a zwemplas
    could alternatively use `LakeBodyOfWater` — decide per-venue at data time)
  - `camping` → `Campground`

  All four are valid schema.org types with rich-result/entity support.

A small helper module (e.g. `src/lib/venue-content.ts`) centralizes the
per-type copy/config (preposition, H1 template, intro text, schema type,
LLM-prompt fragment) so the route and schema builders stay thin.

### 4. Thin-content safeguards

1. Curated quality list (no harvested noise).
2. Unique type-aware H1, intro, LLM content, and schema `@type` per page.
3. Existing `isSitemapPlace` slug-quality filter (`places-data` / `sitemap-data`).
4. `character` mapping per venue so the existing `location-profile` micro-tag
   system continues to differentiate copy.

### 5. First-batch scope (~120 venues)

| Type | ~Count | Notes |
|---|---|---|
| Attractieparken | ~25 | Efteling, Walibi Holland, Toverland, Slagharen, Duinrell, … |
| Dierentuinen | ~20 | Artis, Burgers' Zoo, Blijdorp, Apenheul, Beekse Bergen, … |
| Buitenbaden / zwemplassen | ~30 | Outdoor focus — strongest weather intent |
| Campings | ~30 existing + tag | Tag existing with `venueType`, optionally expand |

## Out of scope (this iteration)

- OSM/Overpass harvest at scale (possible phase 2 with a quality gate).
- A new `/weer/[venue-type]/...` taxonomy and hub overview pages.
- Opening-hours-aware "rijke type-templates" (crowd/UV/water-temp sections).
- Venue booking/affiliate content (out of product scope per current brief).

## Affected files

| File | Change |
|---|---|
| `src/lib/places-data.ts` | Add `venueType` to `Place`; spread `NL_VENUE_PLACES` into `ALL_PLACES` |
| `src/lib/nl-venues.ts` | **New** — curated venue data |
| `src/lib/venue-content.ts` | **New** — per-type copy/config helper |
| `src/lib/sitemap-data.ts` | Priority 0.7 for `venueType` places in `buildNLSitemap` |
| `src/app/(site)/weer/[province]/[place]/page.tsx` | Type-aware H1, metadata, intro, pass `venueType` to SEO content |
| `src/app/actions.ts` | `getLocationSEOContent` accepts venue context |
| `src/lib/schema.ts` | `schemaCityWeatherPage` maps `venueType` → accurate `about` `@type` |
| `public/sitemap-nl.xml` (+ snapshots) | Regenerate via `gen-sitemap.ts` |

## Success criteria

- Venue pages resolve at `/weer/<provincie>/<slug>` and return SSR content
  with a venue-specific H1, intro, and accurate schema `@type`.
- Each venue page is content-distinct from its nearest city page (unique
  H1 + intro + LLM content keyed on `venueType`).
- All venues appear in `sitemap-nl.xml` with priority 0.7.
- `npx tsc --noEmit` clean for the touched files.
