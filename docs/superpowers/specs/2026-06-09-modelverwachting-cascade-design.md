# Slimme modelverwachting — cascade-gevoed, anoniem, user-friendly

**Datum:** 2026-06-09 · **Branch:** weerzone-agents-fase1 · **Status:** goedgekeurd door Rowan (alle 5 onderdelen)

## Probleem

Sectie 04 "Modelverwachting" op /vandaag en /morgen (`ModelPluim` in `WeatherVisuals`, gemount door `DayBriefing`) is de enige domme plek op de pagina: drie anonieme modellijnen ("Verwachting 1/2/3" = HARMONIE/ICON/AROME uit `hourly.models`), een grijze marge-band en neerslagbalkjes. De Mariana-cascade (Oracle → Tesla → Regions → Local) weet per dag welk model wint (`MarianaLocalFeed.modelWeights`), hoe de modellen verschillen (`model_blend_summary`) en wanneer onweer speelt (`TeslaSignal.timing_window`) — maar de pluim gebruikt daar niets van. `hourly.models` draagt bovendien tot 7 modellen per uur; de pluim toont er 3.

## Kaders (besloten)

- **Geen bronnamen of motornamen in de product-UI.** Niet KNMI/DWD, en óók niet "Mariana" — anders ontstaat scheve attributie. Alles neutraal; attributie centraal op /over met een Q&A. (Vastgelegd als werkregel.)
- **Strikt 0-48u in de UI.** Geen Oracle-doorkijk voorbij 48 uur — strijdig met de productbelofte op de homepage ("Niet om verder vooruit te gokken"). Oracle blijft pure backend-voeding via Regions.
- **Geen extra fetches.** Alles zit al in `AgentContext` (`ctx.mariana`, `ctx.tesla`); `buildAgentContext` blijft ongewijzigd.
- **Logisch, visueel sterk, user-friendly.** Alles wat dit oplevert is direct gebruikersgericht; kwaliteit van presentatie weegt even zwaar als de berekening.
- Secties 01-03 van `DayBriefing` blijven ongemoeid.

## Ontwerp

### 1. Pure blend-helper: `src/lib/model-blend.ts`

Nieuw plat lib-module (geen netwerk, geen Next/Supabase-imports — zelfde testbaarheids­filosofie als `piet-context.ts`). Exporteert:

- `blendedTemperatureSeries(hours: HourlyForecast[], weights: Record<string, number>): number[]` — per uur het gewogen gemiddelde van alle aanwezige `hour.models.*.temperature`-waarden. Gewichtsleutels zijn `MarianaModelName`-strings (HARMONIE/AROME/ICON_D2/ECMWF/GFS/ECMWF_AIFS_SET_X/GOOGLE); de lowercase modelsleutels van `hourly.models` worden gemapt zoals `MODEL_KEY_MAP` in `arbitration.ts` (harmonie→HARMONIE, icon→ICON_D2, arome→AROME, …). Ontbreekt een model dat uur, dan telt het niet mee. Geen modellen aanwezig → terugval op `hour.temperature`.
- Terugval-gewichten: statische defaults gelijk aan de geest van `DEFAULT_WEIGHTS` in `arbitration.ts`, gebruikt wanneer `ctx.mariana?.feed?.modelWeights` ontbreekt of leeg is (cascade stale/niet-NL). Gedrag zonder feed = een eerlijk consensus­gemiddelde, nooit een lege grafiek.
- `topWeightedDisplayModel(weights): "harmonie" | "icon" | "arome" | null` — welke van de drie GETOONDE lijnen vandaag het zwaarst weegt, voor de duidingsregel ("leunt vandaag op verwachting 2"). Wint een niet-getoond model (bv. ECMWF), dan `null` en laat de duiding dat deel weg.
- `parseTimingWindow(timingWindow: string): { fromHour: number; toHour: number } | null` en `timingAppliesToDay(timingWindow, dayOffset)` — verplaatst/gedeeld vanuit de bestaande private helpers `teslaTimingLabel`/`teslaAppliesToDay` in `DayBriefing.tsx`, zodat grafiek en risicokaart dezelfde logica gebruiken (dedupe, geen gedragswijziging in DayBriefing).

Neerslag blijft de bestaande basisreeks (`hour.precipitation`); alleen temperatuur wordt gewogen. Scope bewust klein.

### 2. Smart-props door de bestaande boom

`DayBriefing` (server) berekent één plat object en geeft het door via `WeatherVisuals` → `ModelPluim`:

```ts
interface PluimIntelligence {
  blended: number[];            // gewogen temperatuurlijn, zelfde index als hours
  leadModel: "harmonie" | "icon" | "arome" | null;
  insight: string | null;       // duidingsregel, al door compactCopy + nlCopyGuard
  thunderWindow: { fromHour: number; toHour: number } | null; // alleen relevant + Reed aan
}
```

- `insight` komt uit `ctx.mariana.signal.model_blend_summary` (terugval: `local_forecast_logic`), gecompacteerd tot max 2 zinnen en door `nlCopyGuard`. Bevat de tekst tóch een motor-/bronnaam (Mariana/KNMI/HARMONIE/…), dan wordt de regel weggelaten — liever niets dan een naam. Daarna wordt, indien `leadModel` bekend is, één geconstrueerde zin toegevoegd: "De doorgetrokken lijn leunt vandaag het meest op verwachting N."
- `thunderWindow` alleen gevuld als: Reed-voorkeur aan ÉN `ctx.tesla` aanwezig ÉN `timingAppliesToDay(..., dayOffset)` ÉN (zelfde drempels als `riskForDay`: `tesla_signal >= 2` of `confidence.thunder >= 0.4` of `confidence.severe >= 0.3`) ÉN het venster parsebaar is.
- Alles is platte data; `ModelPluim` blijft een domme renderer.

### 3. Visueel ontwerp van de pluim

- **Hoofdlijn "Weerzone-verwachting":** dik (3px), donker slate (`#0f172a`), bovenop getekend, met een eindpunt-dot. Eerste item in de legenda, visueel duidelijk de héld van de grafiek.
- **Ruwe lijnen "Verwachting 1/2/3":** dunner (1.6px) en met verlaagde opacity (~0.55), kleuren behouden. Ze worden context, geen concurrenten.
- **Marge-band:** blijft, footer-label "Grijs = marge" blijft.
- **Onweersvenster:** verticale amber band (`#f59e0b`, ~12% opacity, met subtiele topborder) over `thunderWindow`, met een klein chip-label "⚡ Verhoogde onweerkans" erboven. Geen "Tesla" in beeld.
- **Duidingsregel:** onder de SVG, klein tekstblok zonder icoon (alleen typografie, consistent met de bestaande footer-legenda), alleen gerenderd als `insight` bestaat.
- **Header van de kaart:** subtitel wordt "Komende 48 uur · meerdere verwachtingen gewogen tot één lijn" zodat de gebruiker zonder uitleg begrijpt wat hij ziet.
- De `<details>`-disclosure in `WeatherVisuals` blijft (pluim achter één tik), maar de summary-tekst benoemt de nieuwe waarde: "Bekijk de gewogen modelverwachting".

### 4. Verwijzing in plaats van namen

Onderaan sectie 04 één rustige tekstlink: **"Hoe komt deze verwachting tot stand?" → `/over#qa`**. Stijl: klein, secundair, geen knop.

### 5. Q&A op /over

Nieuwe sectie met anchor `id="qa"` op `src/app/(site)/over/page.tsx`, in dezelfde kaartstijl als de rest. Inhoud (4-5 vragen, antwoorden van 2-4 zinnen, gewone taal):

1. **Welke gegevens gebruikt Weerzone?** — eerlijke bronvermelding: de daadwerkelijke modellen/bronnen die `fetchWeatherData` en de waarschuwingslaag gebruiken (KNMI, DWD, en de feitelijke modelleveranciers — exacte lijst bij implementatie uit `weather.ts`/`knmi-warnings.ts` verifiëren, niets noemen dat niet echt gebruikt wordt).
2. **Wat is de doorgetrokken lijn in de grafiek?** — uitleg gewogen verwachting: meerdere modellen, per dag en per regio gewogen op wat recent het best presteert.
3. **Wat is Mariana?** — de motor; hier mag de naam en de cascade-uitleg (sluit aan op de bestaande "Mariana, de motor achter Weerzone"-sectie).
4. **Waarom noemen jullie de modellen niet in de grafiek?** — omdat we het beeld leesbaar houden; de volledige lijst staat hier op één plek.
5. **Waarom maar 48 uur?** — de bestaande losse sectie "Waarom maar 48 uur?" verhuist als item de Q&A in (zelfde copy, geen duplicatie; de losse sectie vervalt).

## Foutpaden

- Cascade stale of leeg (`ctx.mariana` null): blend op default-gewichten, geen duidingsregel, geen onweersvenster. Grafiek altijd compleet.
- `model_blend_summary` leeg of bevat bron-/motornaam: duidingsregel weglaten.
- `timing_window` niet parsebaar: geen band (risicokaart in sectie 02 vangt het verhaal al op).
- Minder dan 4 uur data: bestaande null-render van `ModelPluim` blijft.

## Verificatie

- `npx tsc --noEmit` (enige type-signaal; build negeert fouten).
- Dev-server: /vandaag en /morgen visueel controleren — met en zonder Reed-voorkeur, en gedrag bij ontbrekende cascade-data (feed-loos pad).
- Pure helper handmatig doorgerekend met een mini-fixture (geen unit-runner in de repo; geen nieuwe testinfra introduceren).

## Niet in scope

Oracle-doorkijk in UI, wijziging secties 01-03, extra fetches in `buildAgentContext`, neerslag-blending, echte modelnamen in de UI, wijziging van de proactieve-e-mailpijplijn (de helper is er wel alvast herbruikbaar voor).
