# Ontwerp — Weerzone-agents: Piet, Reed & Koos

**Datum:** 2026-05-31
**Branch:** `weerzone-agents-fase1`
**Status:** ontwerp, goedgekeurd voor implementatieplanning
**Fase-context:** dit is "fase 6" uit het v2-brief — Piet/Reed/Koos écht koppelen aan het fundament en de Mariana-cascade.

---

## 1. Doel

Piet, Reed en Koos worden **echte, autonome agents** die het dagelijks leven van de
gebruiker weer-technisch beter maken. Geen statische heads-up-generatoren, geen
open AI-chat. Ze bewaken de Mariana-cascade, redeneren, en bereiken de gebruiker
proactief — het doel is **WaaS**: zolang iemand ingelogd is en locatie aan heeft,
hoeft hij niks op te zoeken.

De drie draaien **parallel** als lenzen op dezelfde 48 uur (geen estafette):

- **Piet** — altijd aan. Het dagelijkse weerbericht, hyperlokaal, nuchter. Blijft
  het gewone weer doen óók als het stormt.
- **Reed** — parallelle extremen-specialist (onweer, zware regen, storm,
  extreem winterweer). Mag leeg zijn; dat zal niet vaak zo zijn.
- **Koos** — parallelle ontsnappings-lens: kansen om slecht óf te heet weer te
  ontvluchten, op elke locatiepagina.

## 2. Harde regels (niet onderhandelbaar)

- **Geen open AI-chat.** Proactieve heads-ups + guided buttons. Autonomie en
  redeneren = "agent", niet een chatvenster.
- **Geen zichtbaar AI-merk in het product.** Piet/Reed/Koos zijn karakters/
  buurmensen, géén AI-personas. Geen "Mariana zegt", geen modelnamen, geen
  AI-/meteo-jargon op de agent-surfaces. **Uitzondering:** `/about` mág Mariana +
  de modellen uitleggen (transparantie over hoe Weerzone werkt).
- **Copyright.** De personas zijn archetypes (Paulusma/Timmer/Postema als
  metafoor), GEEN imitaties. Nooit taal/stijl/catchphrases van de echte personen
  overnemen. De Weerzone-stem is volledig origineel.
- **Geen commercie.** Geen ads, affiliate, Booking, hotels, vluchten-links,
  sponsored. Koos is **puur adviserend**. Schone naad voor later, maar nu niets
  van bouwen.
- **Geen LLM in het 10K-pagina request-pad.** De SEO-locatiepagina's lezen de
  opgeslagen regio-duiding + wiskunde; ze raken nooit per bezoek een LLM (de
  cascade is juist gebouwd om die call-explosie te vermijden).
- **Verboden taal** (uit het brief): "droogvenster", "AI weet/leert/volgt", "ik
  zie dat je vaak", partnerdeal, boek nu, hotel zoeken, etc.

## 3. Architectuur — het brein, de stem, de zenuwen

De **Mariana-cascade is het brein** (duur denkwerk, 1×/dag, per regio, al
gebouwd). Daarbovenop komt de stem en de levering.

```
CASCADE (bestaat — mariana-nl cron, 1×/dag)
  Oracle → landelijk 48-96u regime + binaire gate
  Regions (11 mesoschaal) → MarianaRun per regio, opgeslagen in mariana_regions:
      • signal (rijk): agent_outputs.{piet,koos,reed}, risk_summary,
        mariana_summary, location_output_contract, confidence
      • local_feed (compact/wiskunde): regime, modelgewichten, confidencePrior,
        hazardFlags, convectiveActive, referralReason
  Tesla (bij gate ACTIVE) → mariana_tesla (rauw convectief signaal, per regio)
        │
        ▼
TWEE SCHRIJF-PADEN (de stem)
  A. Persoonlijke surfaces (/piet, /koos, e-mail) → LLM-geschreven (Deepseek V4
     via hermesChat "persona"), per locatie, gecached. Rijk en warm.
  B. 10K SEO-locatiepagina's → opgeslagen regio-duiding (Hermes, 1×/dag) +
     wiskunde per locatie. GEEN LLM per bezoek.
        │
        ▼
COMPOSITIE-LAAG (nieuw, gratis per request)
  composeAgents(location, now) → AgentHeadsUp[]
  emit naar: locatiepagina's · /piet /reed /koos · Mijn Weerzone · e-mailcron
             · (later) web-push / PWA
```

**Kerninzicht:** de duiding (regime/gevaar/verhaal) is regionaal gedeeld; de
getallen zijn hyperlokaal. LLM-redenering hoort per regio (paar calls/dag); de
lokale cijfers doet de wiskunde (Mariana Local) gratis per coördinaat.

**Probleem dat dit ontwerp oplost:** de rijke cascade-reasoning (Oracle/Tesla/
Regions) zit nu opgeslagen in de `signal`-kolom maar bereikt de gebruiker niet —
alleen de compacte `local_feed` (de "wiskundige Mariana") wordt uitgelezen. Dit
ontwerp brengt de rijke duiding naar Piet/Reed/Koos.

## 4. Piet — de dagelijkse compagnon

**Rol:** altijd aan, hyperlokaal. "Staat" in jouw plaats (Paulusma presenteerde
vanaf wisselende locaties → Weerzone is hyperlokaal). Nuchter, warm, geen jargon.

**Bestaat al:** `fetchPietWeerbericht` (`piet-forecast.ts`) combineert
KNMI-bulletin + hyperlokale open-meteo data → Deepseek V4 → Piets verhaal,
gecached per ~1km² per 30 min. De `PIET_SYSTEM`-prompt is al een originele,
copyright-veilige stem. **Staat uit puur door ontbrekend OpenRouter-tegoed.**

**Gat (de echte klus):** `marianaLocalContext` voedt nu alleen de compacte
`local_feed` (regime + vlaggen) in de prompt. De **rijke** duiding
(`agent_outputs.piet.text`, `risk_summary`, `mariana_summary`, Oracle-regime)
wordt niet uitgelezen.

**Te bouwen:**
1. `nearestRegionSignal(lat, lon)` / `loadRegionSignal(slug)` in
   `regions/storage.ts` → volledig `MarianaSignal` (of de verhaal-delen).
2. `marianaLocalContext` (in `piet-forecast.ts`) uitbreiden zodat Deepseek V4
   schrijft uit de rijke nieuwe-Mariana duiding, niet alleen regime+vlaggen.
3. Rond het verhaal: **pollen/UV/dagcontext** als nette heads-ups (data bestaat:
   `getPollenLevel`, `AirQualityData`, `agents/day-context.ts`) — alleen tonen
   indien relevant.
4. **Reed-doorverwijzing** zichtbaar maken wanneer `refer_to_reed=true`.

**Heads-up-discipline:** alleen concrete acties; anders rust. Pollen alleen bij
hoog niveau, UV alleen bij noemenswaardige zonkracht.

## 5. Reed — de extremen-specialist

**Rol:** parallel aan Piet. Onweer, zware regen, storm, extreem winterweer. Stilte
als het rustig is (een feature: vertrouwen door niet te schreeuwen). Urgentie
zonder paniek als het losbarst.

**Databronnen:** `loadLatestTeslaRun(regionSlug)` (bestaat) → rauw `TeslaSignal`
(`tesla_signal` 1-3, `timing_window`, `peak_corridor`, `cape_assessment`,
`cin_status`, `expected_mode`, `reed_action`, `failure_modes`, `mariana_summary`).
Voor niet-convectieve extremen (storm/sneeuw/ijs): KNMI/DWD-waarschuwingen +
ESTOFEX (bestaat).

**Probleem:** `ReedWarningsPage.tsx` is een **bevroren mockup** — hardcoded
"29 mei"-scenario, niet aan live data gekoppeld.

**Te bouwen:**
1. `ReedWarningsPage` de hardcoded analyse + datums laten vervangen door velden uit
   `loadLatestTeslaRun`. Leeg = nette lege staat (geen Tesla-run = niks te melden).
2. Reed-stem: Tesla's rauwe velden → urgente-maar-kalme narratief (origineel, geen
   Timmer-citaten). Op persoonlijke surfaces mag dit LLM-geschreven (Deepseek),
   op SEO-pagina's uit het opgeslagen `agent_outputs.reed` + sjabloon.
3. Terugval als `mariana_tesla` leeg is (cascade nog niet gedraaid / gate OFF):
   netjes terugvallen op ESTOFEX/KNMI-waarschuwingen, geen crash.

**Afhankelijkheid:** Tesla-laag draait op Anthropic (Opus 4.8) → wacht op
ANTHROPIC_API_KEY in Vercel + OpenRouter-tegoed (na maandag). Tot dan: Reed valt
terug op de niet-convectieve bronnen.

## 6. Koos — de ontsnappings-lens

**Rol:** metafoor voor mooi weer — of juist wégwezen. Op **elke locatiepagina**
een blok "blijf of er even tussenuit, en waarheen?". Puur adviserend.

**Primair = pagina-blok** op de 10K+ SEO-locatiepagina's. De proactieve versie
(in Piets dagmail / heads-up) is dezelfde engine, secundair/afgeleid.

**Twee niveaus, twee opties dichtbij + één ver:**
1. **Dichtbij/binnenlands:** een haalbare NL-plek waar het de komende 48u/het
   weekend duidelijk fijner is ("Regen in Amsterdam, droog in Maastricht").
2. **Zonne-ontsnapping/internationaal:** als het thuis langer grauw/koud/te heet
   blijft, een zonbestemming uit een **vaste samengestelde set** (bv. Valencia,
   Barcelona, Algarve, Canarische Eilanden, Malta). Open-meteo dekt heel Europa;
   buiten de NL-cascade, simpeler ("5 dagen 24° en zon").

**Te bouwen (volledig nieuw):**
1. `koos-getaway.ts` — pure wiskunde: vergelijk de locatie vs nabije NL-plekken
   (uit `places-data`) binnen haalbare reisafstand + de internationale zonset.
   Scoort en rangschikt; levert `WeatherOpportunity[]` (type bestaat al).
2. Koos-stem: dezelfde Deepseek-V4-zorg als Piet op persoonlijke surfaces; op
   SEO-pagina's sjabloon + de opgeslagen `agent_outputs.koos`.
3. **Slim, niet ruis:** Koos toont alleen iets als er écht een betere optie is.
   Stralende dag thuis → Koos zwijgt.

**Gelegenheden v1:** vandaag · dit weekend · aankomend lang weekend (bv. Pasen) ·
eigen datumrange.

**Guardrail:** nooit een boeking/vlucht/hotel/affiliate. Alleen "daar is het zo."

## 7. Levering

**v1 (nu bouwen):**
- **In-app heads-ups** op de pagina's (basis, werkt altijd).
- **Piet — dagelijkse e-mailcron** (`piet-morning-email`, bestaat): de
  ochtend-heads-up, met **Koos eronder alleen als die iets te melden heeft**.
- **Reed — conditionele e-mail** (`reed-alert-email`, bestaat): alleen vuren als
  de gate open is / onweer binnen 48u.

**Later (fase D, ontworpen maar uitgesteld):**
- **PWA-installatie + echte web-push** (VAPID + PushSubscription-opslag +
  server-scheduler). Dit is de echte WaaS-ontknoping ("het komt naar je toe met de
  site dicht"), vooral voor Reed. Bewust uitgesteld; het heads-up-datamodel is nu
  al zo ontworpen dat push er later bovenop klikt zonder herbouw.

## 8. Heads-up-model

Eén output-type voor álle surfaces: **`AgentHeadsUp[]`** (bestaat al in
`src/lib/agents/types.ts`). `rankHeadsUps` / `groupByAgent` / `filterActiveHeadsUps`
/ `emptyHeadsUpResult` bestaan. De compositie-laag vult dit; elke surface
(pagina/mail/push) rendert hetzelfde model. Lege array = geldige output (toon rust).

## 9. Inventaris — bestaat vs nieuw

| Onderdeel | Status |
|---|---|
| Cascade Oracle/Tesla/Regions/Local + `mariana-nl` cron | bestaat |
| `MarianaSignal` met `agent_outputs.{piet,koos,reed}` | bestaat |
| `loadRegionFeed` / `nearestRegionFeed` (compacte feed) | bestaat |
| `loadLatestTeslaRun` (rauw Tesla-signaal) | bestaat |
| `fetchPietWeerbericht` (KNMI + Deepseek V4, 30-min cache) | bestaat |
| `AgentHeadsUp` types + ranking-helpers | bestaat |
| Pollen/UV-data (`getPollenLevel`, `AirQualityData`) | bestaat |
| `agents/day-context.ts` (weekend/schooldag/feestdag) | bestaat (skelet) |
| E-mailcrons `piet-morning-email`, `reed-alert-email` | bestaat |
| `public/sw.js` (primitief, geen echte push) | bestaat |
| **`nearestRegionSignal` / `loadRegionSignal` (rijke signaal-loader)** | **nieuw** |
| **Rijke duiding → Piet-prompt** (`piet-forecast.ts` uitbreiden) | **nieuw** |
| **`composeAgents` compositie-laag** | **nieuw** |
| **Karakter-/stem-laag** (Piet/Reed/Koos sjablonen + LLM-pad) | **nieuw** |
| **`koos-getaway.ts` getaway-engine** | **nieuw** |
| **`ReedWarningsPage` op live Tesla** (mockup → echt) | **nieuw** |
| PWA + web-push | later (fase D) |

## 10. Bouwvolgorde

- **A (nu, unblocked):** rijke-signaal loader → Piet voeden met rijke duiding +
  pollen/UV/dagcontext + Reed-link. Werkt op Local + KNMI die al draaien (Piet's
  Deepseek-pad heeft wel OpenRouter-tegoed nodig — maandag).
- **B (nu, unblocked):** Koos getaway-engine + Koos-stem + Koos-pagina + Koos in
  Piets dagmail. Open-meteo, geen billing-afhankelijkheid voor de wiskunde.
- **C (na maandag):** Reed live op Tesla + Reed-stem + Reed-alarm-mail. Wacht op
  ANTHROPIC_API_KEY + OpenRouter-tegoed.
- **D (later):** PWA + web-push.

## 11. Bewuste keuzes / uitgesteld

- **Karakter-stem op SEO-pagina's = sjabloon** (gevoed door opgeslagen regio-
  duiding), op persoonlijke surfaces = Deepseek V4. Resolutie van de "voelt
  vlak"-zorg: de surface die ertoe doet krijgt LLM-warmte; de 10K blijven gratis.
- **Personalisatie blijft licht in v1** (locatie + opgeslagen plekken). Geen
  "het kent jou"-patronen (brief verbiedt creepy copy).
- **Push uitgesteld** maar het datamodel is er klaar voor.
- **Koos-commercie** uitgesteld; schone naad, nu niets van bouwen.

## 12. Buiten scope

- Steve (zakelijk) — in de ijskast.
- Backend-sloop van oude commerce/reiszone-lib — apart traject.
- Locaties buiten NL voor de cascade (oude Mariana blijft daar intact).
- Diepe personalisatie / gedragsleren.
