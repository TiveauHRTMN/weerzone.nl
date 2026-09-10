# Handoff — storing weerzone.nl, 10 september 2026

Branch: `feat/studio-tiktok-autopost` (gepusht)
Laatste commit: `dde77e4`

## Wat er aan de hand was

weerzone.nl serveerde weken oude verwachtingen. `/weer/utrecht/utrecht` was
7,5 dag oud (`Age: 651658`, `X-Vercel-Cache: STALE`); sommige plaatsen 16,8 dag.
`/vandaag` toonde "De weergegevens zijn even niet beschikbaar".

## Oorzaak (gemeten, niet geraden)

Het Supabase-project `bhguergqkyiejyxsiwdu` is **verwijderd** — NXDOMAIN op een
publieke resolver. Een *gepauzeerd* project blijft resolven, een verwijderd niet.

Binnen `fetchWeatherData` zit een verrijkingsblok dat twee dingen uit Supabase
leest: `loadMarianaMemory()` en `nearestRegionFeed()`. Daar stond
`.catch(() => null)` omheen — dat vangt de fout op, maar niet de tijd. De
supabase-js-client doet namelijk zijn eigen retries.

Gemeten op een Vercel-preview in fra1:

```
    86 ms  raw Open-Meteo
    14 ms  raw fetch naar de dode Supabase-host  (faalt meteen)
  8614 ms  loadMarianaMemory   (supabase-js)
  7038 ms  nearestRegionFeed   (supabase-js)
 14103 ms  fetchWeatherData    <- vóór de fix
  2469 ms  fetchWeatherData    <- ná de fix
```

De keten: 15 s in `fetchWeatherData` → `buildAgentContext` kapt af op 3,5 s
(`/vandaag`) of 8 s (de `/weer`-pagina's) → die geeft `null` terug, **zonder één
logregel** → de pagina gooit "Weerdata tijdelijk niet beschikbaar" → bij
ISR-revalidatie betekent een throw: oude versie laten staan → Vercel serveert de
stale prerender eindeloos door.

Open-Meteo was al die tijd gezond (86 ms). Dat was een dwaalspoor.

## Wat er gefixt en geverifieerd is

| Commit | Wat |
|---|---|
| `e6bea53` | Open-Meteo-quotum: `snapToGrid` (0,05° ≈ 5 km), `highRes:false` op de programmatische pagina's (9 → 4 calls), `revalidate` 600 → 1800, `break` bij 429, `regions: fra1` |
| `7f0d618` | Kredietrem in `hermes.ts` sprong nooit aan (zie hieronder) + regressietest |
| `ad26788` | **De echte fix**: deadline van 1,2 s om de Mariana/Oracle-verrijking |
| `dde77e4` | Tijdelijke debug-route weer weg |

Geverifieerd op de preview ná de fix:

- `/weer/utrecht/utrecht` — 500 → **200**, `dateModified` = het lopende uur, echte temperaturen
- `/vandaag` — de "niet beschikbaar"-kaart is weg
- `/weer/limburg/heerlen` — 200
- `npm run build` groen
- `npx tsx scripts/test-hermes-credit-brake.ts` — PASS (en faalt aantoonbaar op de commit ervóór)

### Over die kredietrem

Het OpenRouter-saldo is op: 23.806 × HTTP 402 in een week, 3.110 gebruikers.
De rem die daarvoor gebouwd was zat alleen om de eerste modelcall heen, maar in
de praktijk faalt het eerste model om een andere reden en loopt pas het
*fallback*-model tegen het lege saldo aan — en die call stond buiten de
try/catch. De rem werd dus nooit gezet en elke render betaalde alsnog ~8 s aan
mislukte round-trips. Dat is nu dicht, met een test die het afvangt.

Dit raakte overigens niet de weerdata (`getLocationSEOContent` is `.catch()`'t) —
alleen de SEO-tekst op de pagina's.

## Wat er nog moet gebeuren

### 1. Uitrollen naar productie — NIET gedaan

De fix staat op de branch en is op preview geverifieerd, maar productie draait
nog steeds op `dpl_74HgHECRGESQZaTMQcEWJ9n5sfkE` van **14 juli**. Uitrollen:

```
npx vercel promote <deployment-url> --scope tiveauhrtmns-projects
```

Let op (staat ook in memory): kutweer wijst prod-deploys niet vanzelf toe aan
weerzone.nl — zonder `promote` blijven het domein én de crons op de oude versie.

Ik heb dit bewust laten liggen: promoten is een productie-actie en jij was aan
het afronden.

### 2. Supabase terug — alleen jij kan dit

Het project is wég, niet gepauzeerd. Zolang dat zo is liggen accounts,
abonnementen, push en de cron-mail plat (`[email-recipients] agent_subscriptions
niet leesbaar: TypeError: fetch failed`). De site rendert nu wel weer zelfstandig
verder, maar dat is een pleister, geen herstel.

Check in het Supabase-dashboard of het project te restoren is. Zo niet: opnieuw
aanmaken, migraties uit `supabase/migrations/` draaien, en de keys in Vercel
bijwerken. Houd er rekening mee dat er ook een tweede Supabase-project in het
spel is via calortravel — check welke je voor je hebt.

### 3. OpenRouter-credits bijvullen

https://openrouter.ai/settings/credits — zonder saldo blijven de SEO-teksten en
de WWS-pipeline leeg. De kredietrem zorgt er nu voor dat dat goedkoop faalt in
plaats van traag.

### 4. Open-Meteo-quotum in de gaten houden

`e6bea53` brengt het terug van ~9 naar 4 calls per render en laat 13.776 plaatsen
op 1.977 rastercellen vallen (factor 6,97, gemeten op `NL_PLACES`). Dat is een
flinke reductie, maar **geen garantie**: bij het huidige verkeer (~5.500 renders
per dag) kom je nog steeds in de buurt van de 10.000 calls per dag van het
gratis plan. Als je marge wilt:

- `PROGRAMMATIC_GRID_STEP` van 0,05 naar 0,1 → 576 cellen i.p.v. 1.977 (max
  afwijking ~6,5 km i.p.v. ~3,3 km), of
- een betaald Open-Meteo-plan, en dan kan de rasterstap juist weer omlaag.

Eén ding heb ik bewust **niet** aangepast: de lead-fetch in `attemptFetch` staat
nog op `revalidate: 600` terwijl de andere fetches naar 1800 zijn gegaan. Die
call draagt het `current`-blok — de actuele meting — en jouw lijn is dat de
meting het van elk model wint. Dat leek me niet iets om stilletjes op 30 minuten
te zetten. Als je het quotum verder omlaag wilt is dit wel de grootste knop.

### 5. Kleine dingen

- `docs/superpowers/specs/2026-06-07-agent-subscription-foundation-design.md`
  heeft een niet-gecommitte regelafbreking in een al beschadigde regel
  ("VBNCASVd wfegb rnhtm,ulik.?"). Buiten deze fix gelaten.
- Web Analytics staat uit op het Vercel-project; daardoor moest ik verkeer uit
  de runtime-logs afleiden. Aanzetten maakt de volgende audit makkelijker.

## Twee dingen om te onthouden voor de volgende keer

**`.catch()` vangt een fout, geen tijd.** Elke I/O in een render-pad met een
deadline erboven heeft zelf een timeout nodig. Een dode backend die *snel* faalt
is ongevaarlijk; een client die er beleefd 8 s over doet, sloopt je ISR.

**`X-Vercel-Cache: STALE` met een hoge `Age`** betekent dat de *regeneratie*
faalt, niet dat de cache verkeerd staat. En pas op met "first seen" in de
Vercel-runtime-errors: die logs gaan maar 7 dagen terug, dus het leek alsof alles
op 3 september tegelijk omviel terwijl dat gewoon de rand van het venster was.
