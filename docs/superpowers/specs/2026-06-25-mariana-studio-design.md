# Mariana Studio — dagelijkse TikTok-slide-inhoud

**Datum:** 2026-06-25
**Branch:** `weerzone-agents-fase1`
**Status:** ontwerp goedgekeurd, klaar voor implementatieplan

## Probleem

Er is een nieuwe "Weerzone Studio" (Claude Design): vier TikTok-slide-templates
(1080×1920) met `contenteditable`-velden en PNG-export. Drie vaste posts per dag
plus een optionele vierde bij extreem weer:

1. **08:00 — Dagverwachting** (`slide1`)
2. **14:00 — Actueel weer** (`slide2`)
3. **20:00 — Vandaag & Morgen** (`slide3`)
4. **22:00 — Heads-up** (`slide4`, alleen bij onweer/extremiteiten)

De Studio is nu een losse, stilstaande HTML-download met placeholdertekst. Er
moet een nieuwe **Mariana-extensie** komen — naast Oracle, Regions en Tesla —
die dagelijks puur de *inhoud* voor deze slides levert.

De bestaande `mariana-tiktok-email` cron produceert al TikTok-content, maar voor
het **oude 2-slide formaat**. Die wordt vervangen.

## Beslissingen (uit brainstorm)

- **Aanpak:** Studio komt de repo in als pagina, gevoed door live Mariana-data.
  Eindcontrole blijft menselijk (human-in-the-loop vóór posten op TikTok).
- **Versheid:** één ochtendrun maakt de duiding/teksten; de Studio-pagina
  ververst de kale "nu gemeten" cijfers live op het moment dat je 'm opent.
- **Slide-4 trigger:** breed — fire bij één van: Tesla onweer/storm-gate ·
  KNMI-waarschuwing geel+ voor morgen · hitte/tropisch (≥30° of hittegolf) ·
  winterse extremen (vorst/gladheid/sneeuw/ijzel).
- **Oude mail:** `mariana-tiktok-email` cron wordt verwijderd, vervangen door
  Studio.
- **Toegang:** `/admin/studio`, achter een lichte secret-gate (`/admin` is nu
  niet afgeschermd: geen `middleware.ts`, admin-layout is pass-through).

## Architectuur

Drie losse stukken, conform de bestaande cascade-conventie
(`src/lib/mariana/{oracle,regions,tesla}/` elk met `engine.ts` + `storage.ts`):

```
1. Mariana Studio (generator)   src/lib/mariana/studio/{engine,storage,types,temps}.ts
   - leest laatste Oracle/Regions/Tesla uit Supabase + live multi-model temps
   - bouwt 1 gestructureerd dag-object met alle slide-velden
   - schrijft naar tabel mariana_studio (1 rij per dag)

2. Twee endpoints   src/app/(site)/api/studio/
   - GET /api/studio/today  -> het persisted dag-object (narratief + cijfers)
   - GET /api/studio/live    -> alleen 'nu gemeten' temps + warmste plek NU (live)

3. Studio-pagina   src/app/(site)/admin/studio/
   - rendert de 4 templates (port van de zip-HTML naar React-client-component)
   - bij load: /today vult alles in, /live patcht slide 2
   - contenteditable blijft (handmatige tweak), html-to-image PNG-export blijft
   - mens downloadt PNG('s) en post op TikTok
```

**Scheduling:** de generator draait als **laatste stap van de bestaande
`mariana-nl` cron** (het enige scheduled entrypoint by design) — ná Oracle/
Regions/Tesla zodat de cascade-tabellen gevuld zijn. Geen nieuwe cron-registratie
in `vercel.json` nodig; wél de `mariana-tiktok-email` cron-entry verwijderen.

### Waarom deze aanpak

- **Eén bron van waarheid:** de Studio leeft mee met de huisstijl en de
  dag-data i.p.v. een losse kopie in Downloads.
- **Mens in de lus:** vóór een gloednieuw formaat naar TikTok gaat, is een
  laatste blik (typo's, toon, en vooral: *moet* slide 4 vandaag mee) waardevol.
- **Hergebruik:** download-knoppen, Inter-font en template-CSS bestaan al; we
  koppelen ze alleen aan een databron.
- **Volledig auto-PNG (headless render)** is bewust *fase 2*: je moet de PNG's
  toch handmatig op TikTok zetten, dus de winst is klein t.o.v. de bouwkosten en
  het verlies van het vangnet.

## Datamodel — tabel `mariana_studio`

Eén rij per dag. Kolommen: `id`, `run_at` (timestamptz), `forecast_date`
(date), plus per slide een `jsonb`-kolom (`slide1`..`slide4`). `slide4` is
nullable: `null` betekent "geen heads-up vandaag, niet posten".

Migratie: `supabase/migrations/20260625_mariana_studio.sql`. Conform repo-praktijk
wordt DDL via de Supabase SQL-editor op productie uitgevoerd (migraties in de
repo ≠ live).

Veldinhoud (exact de template-velden):

- **slide1 — Dagverwachting**
  - `badge` (bv. "Dinsdag 23 juni · 08:00"), `titel`, `intro` *(LLM)*
  - `regionTemps {noord,west,midden,oost,zuid}` — verwachte max, multi-model mediaan
  - `dayparts {ochtend,middag,avond,nacht}`
  - `metrics {uvIndex, hooikoorts, windBft, fietsweer}`
  - `tagline`
- **slide2 — Actueel** (cijfers leeg in de rij, live ingevuld door pagina)
  - `badge` ("Nu · 14:00"), `titel`, `subtitel`
  - `regionTempsNow {noord,west,midden,oost,zuid}` — *live*
  - `warmstePlek {naam, temp}` — *live*
- **slide3 — Vandaag & Morgen**
  - `badge`, `titel`
  - `vandaag {hoogste{temp,plaats}, laagste{temp,label}, weerfeit}`
  - `morgen {temp, alinea}` *(LLM)*
- **slide4 — Heads-up** (nullable)
  - `type` ("onweer" | "knmi" | "hitte" | "kou")
  - `badge`, `titel`, `intro` *(LLM)*
  - `rijen {wanneer, waar, verwacht}`
  - `advies`

### Narratieve teksten (LLM-velden)

`intro` (slide 1 + 4), `morgen.alinea`, `weerfeit` en de heads-up-copy komen via
`hermesChat` met dezelfde discipline als de huidige TikTok-brief
(`mariana-tiktok-email/route.ts`):

- NL-guard, spreektaal, geen vakjargon/modelnamen, geen Engels.
- **Exacte-cijfer-validatie:** de LLM mag de gegeven getallen/plaatsnamen niet
  verbouwen; gebeurt dat (of faalt de call), dan deterministische terugvalcopy.
- Cijfers komen *altijd* uit de cijfer-pipeline, nooit uit de LLM.

### Gedeelde temperatuur-helper — `studio/temps.ts`

De multi-model-mediaan-ranking en regio-gemiddelden zitten nu in
`mariana-tiktok-email/route.ts` (PLACES-lijst, `BLEND_MODELS`, `median`,
`fetchRanking`, `regionAverages`, `fetchDetails`). Die route wordt verwijderd;
de logica verhuist naar `src/lib/mariana/studio/temps.ts` zodat zowel de
generator (verwachte temps) als `/api/studio/live` (nu gemeten temps) hem
gebruiken. `temps.ts` levert:

- `forecastRanking(dayOffset)` — verwachte max per plek (multi-model mediaan)
- `currentRanking()` — nu gemeten temp per plek (`current=temperature_2m`)
- `regionAverages(ranked)` — `{noord,west,midden,oost,zuid}`
- `details(dayOffset)` — `{uv, sunHours, windBft}` (De Bilt-referentie)

### Slide-4 beslislogica (in de generator)

`headsUp` wordt gevuld als één van deze condities waar is voor **morgen**:

1. **Onweer/storm** — Tesla-gate ON / `convective_gate === "ON"` /
   region `hazardFlags` bevat `thunder`/`storm` (zoals de mail-route nu checkt).
2. **KNMI-waarschuwing geel+** — code geel/oranje/rood (via bestaande
   `knmi-warnings` lib).
3. **Hitte/tropisch** — verwachte max ≥ 30° of hittegolf-conditie.
4. **Winterse extremen** — vorst/gladheid/sneeuw/ijzel (uit verwachting/warnings).

Het type bepaalt titel- en advies-toon. Bij meerdere tegelijk: prioriteit
onweer > KNMI-code > hitte > kou (één slide per dag).

## Endpoints

### `GET /api/studio/today`
Leest de nieuwste `mariana_studio`-rij. Geeft het volledige dag-object terug.
Ontbreekt de rij → `{ ok:false }` zodat de pagina de template-placeholders laat
staan (nooit een lege render).

### `GET /api/studio/live`
Rekent via `studio/temps.ts#currentRanking()` de regio-temps NU + warmste plek
NU. Faalt Open-Meteo → het endpoint leest zelf de verwachte cijfers uit de
nieuwste `mariana_studio`-rij (slide1.regionTemps) en geeft die terug met een
`stale: true`-vlag, zodat slide 2 nooit leeg is.

## Studio-pagina — `/admin/studio`

- 1-op-1 port van de zip-HTML naar een React-client-component: zelfde gradient/
  CSS, Inter-font, logo, `html-to-image` PNG-export (1080×1920), `contenteditable`.
- **Bij load:** `fetch /api/studio/today` → vult alle velden; `fetch
  /api/studio/live` → patcht slide 2 (`regionTempsNow`, `warmstePlek`).
- **Assets:** `weerzone-logo.png` + Inter-font in de pagina opnemen (hergebruik
  bestaande repo-assets waar aanwezig).
- **Slide 4:** verborgen wanneer `today.slide4 == null`; anders getoond met de
  juiste type-toon.
- **Download:** bestaande knoppen (08:00 / 14:00 / 20:00 / 22:00 / Alle) blijven;
  bestandsnaam met datumstempel zoals nu.

### Toegang / gate

`/admin` is nu niet afgeschermd. Lichte gate, geen volledige auth-bouw:
- cookie-check tegen env `STUDIO_SECRET` (eenmalig zetten via
  `/admin/studio?key=…`), plus `noindex` op de pagina.
- Endpoints `/api/studio/*` delen dezelfde secret-check.

## Foutafhandeling

- **Generator:** zacht falen bij ontbrekende service-role (zoals
  `oracle/storage.ts`); LLM-fail → deterministische terugvalcopy; cijfers altijd
  uit de cijfer-pipeline.
- **Live-endpoint:** Open-Meteo-fail → terugval op verwachte cijfers.
- **Pagina:** ontbrekende dag-rij → template-placeholders blijven staan.

## Testen

- Generator-cron: `?dry=1` (JSON terug, niets opgeslagen) en `?day=1` (morgen),
  net als de mail-route nu.
- Handmatig: `/admin/studio` openen, controleren dat alle velden vullen en slide
  2 live ververst; PNG-export downloaden.
- `npx tsc --noEmit` schoon voor de aangeraakte bestanden (build negeert
  type-errors).
- Optioneel later: één Playwright-smoke op `/admin/studio`.

## Buiten scope (expliciet)

- Volledig automatische server-side PNG-render (fase 2).
- Automatisch posten naar TikTok (geen praktische carousel-API; blijft handmatig).
- Wijzigingen aan Oracle/Regions/Tesla zelf — Studio is puur consument.

## Te verwijderen

- `src/app/(site)/api/cron/mariana-tiktok-email/route.ts` en de bijbehorende
  cron-entry in `vercel.json` (vervangen door Studio; gedeelde temp-logica
  verhuist naar `studio/temps.ts`).
