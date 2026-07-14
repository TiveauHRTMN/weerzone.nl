# Deelkaarten + kanalen — design (2026-07-14)

## Waarom

De machine is af, maar er zit bijna niemand in: 394 bezoekers in 30 dagen
(~13/dag), subscribe-funnel 12 shown → 4 confirmed sinds blok a live ging.
Conversie op de pagina is niet het knelpunt — bereik is het. SEO (13.775
URL's, GSC-herindiening 9 juli) gaat maanden duren. Dit is blok d ("Koos
deelbaar") breed getrokken tot een acquisitielaag: elke agent krijgt een
deelbaar moment dat zowel gebruikers als Rowans eigen kanalen (Mariana
Studio → TikTok/X) de wereld in duwen.

Besluit Rowan (2026-07-14): deelkaarten voor **alle drie** de agents, landend
op **publieke deel-pagina's**, verspreid via **product-share-knoppen én
Mariana Studio**.

## Wat

Per agent één deelbaar moment: een kaart als beeld (link-preview + TikTok-
slide) plus een publieke landingspagina met één subscribe-CTA. Nul LLM per
kaart — alles komt uit bestaande data.

### 1. Deel-pagina's (`/deel/...`)

Nieuwe publieke routes, server-rendered, cachebaar, geen login, `noindex`
(conversiepagina's; geen thin-content-risico toevoegen aan het sitemap-domein):

- **`/deel/koos/[datum]`** — Koos' weekend-keuze: beste dag + plek uit de
  bestaande getaway-scoring (`src/lib/koos-getaway.ts`, `koos-view.ts`,
  `agents/koos-agent.ts`). `[datum]` = de zaterdag van dat weekend.
- **`/deel/piet/[datum]`** — Piets gelijk-gehad-kaart: voorspeld vs gemeten
  van die dag + 30-dagenscore, uit `piet_scorecard` via
  `src/lib/agents/scorecard.ts`.
- **`/deel/reed/[datum]`** — waarschuwingskaart: regio + niveau + Reeds
  duiding, snapshot van de KNMI-waarschuwing van die dag
  (`src/lib/knmi-warnings.ts`). Bij meerdere waarschuwingen op één dag
  toont de pagina ze allemaal; het kaart-beeld toont de zwaarste (hoogste
  niveau, dan grootste gebied).

Opbouw per pagina: agent als afzender (naam + gezicht, vaste toon), de
kaart-inhoud als HTML, het bestaande inschrijfblok als enige CTA
(subscribe-flow via `/api/agents/subscribe`), doorklik naar `/vandaag`.

Randgevallen:
- Verlopen datum → "dit was toen"-weergave (originele inhoud, gedempt) met
  de actuele versie ernaast.
- Geen data (geen scorecard-rij, geen weekend-pick, geen waarschuwing die
  dag) → de kaart wordt niet aangeboden: nette lege staat met CTA, en de
  deel-knoppen in het product verschijnen dan ook niet.
- Ongeldige datum → 404.

### 2. Kaart-beelden

Per route twee formaten:
- **1200×630 OG-image** via `next/og` `ImageResponse`, zelfde patroon als de
  bestaande plaatspagina-OG's (`weer/[province]/[place]/opengraph-image.tsx`).
- **1080×1920 slide** voor TikTok via de bestaande slide-machinerie
  (`api/social/wz-slide`-patroon).

Toon: Piet/Reed/Koos als karakters volgens de vaste toonregels — géén
one-liners. De grappen uit het oude `api/share/route.tsx` worden **niet**
hergebruikt. Geen bronnamen (KNMI e.d.) op de kaarten.

### 3. Deel-knoppen in product

Web Share API (`navigator.share`), fallback link-kopiëren, op:
- de Koos-weekendkaart op `/koos` en `/vandaag`;
- de `PietScoreCard` op `/vandaag`;
- de Reed-waarschuwingskaart;
- een deel-linkje in Piets ochtendmail (naar `/deel/piet/[datum]`).

Alle gedeelde URL's dragen `utm_source=share&utm_medium=user`.

### 4. Mariana Studio-integratie

Drie nieuwe post-types in Studio (`src/lib/mariana/studio/`):
- **koos-weekend** — do/vr, de weekend-keuze als slide;
- **piet-score** — dagelijks bewijsje (voorspeld vs gemeten);
- **reed-warning** — alleen bij KNMI oranje/rood.

Zelfde flow als de bestaande posts: Studio genereert kaart + caption, Rowan
approvet, Buffer post naar TikTok/X. Caption linkt naar de deel-pagina met
`utm_source=tiktok|x`.

### 5. Meting

- Nieuw PostHog-event `share_clicked` met properties `card` (koos/piet/reed)
  en `channel` (webshare/copy).
- De bestaande `subscribe_shown/started/confirmed` draaien op de
  deel-pagina's gewoon mee.
- Daarmee is de funnel per kanaal zichtbaar: utm → deel-pagina-pageview →
  subscribe_confirmed.

## Buiten scope

- Geen LLM-calls per kaart of per bezoeker.
- Geen nieuwe agent-logica, geen vierde persona, niets >48u.
- Geen GRADEN-gokspel (blijft apart op de plank).
- Geen mail-lijst-features; de ochtendmail krijgt alleen een deel-linkje.
- Geen index-opname van `/deel`-pagina's en geen sitemap-wijziging.

## Testen

- `npx tsx scripts/test-deelkaarten.ts`: rendert de drie deel-routes en de
  beeld-routes voor een datum mét en zónder data (fail-soft-paden).
- Rooktest na deploy: de drie `/deel`-routes en hun OG-images 200 op prod;
  één echte share-flow (Web Share of copy) handmatig door Rowan.
- Studio: dry-run van de drie nieuwe post-types vóór de eerste approve.
