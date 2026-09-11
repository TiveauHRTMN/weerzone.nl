# Handoff — storing weerzone.nl, 10 september 2026

Branch: `feat/studio-tiktok-autopost` (gepusht)
Laatste commit: `dc67b3e`

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
| `1dd62db` | `loading` bleef eeuwig true bij onbereikbare auth → blanco site (zie hieronder) |

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

## Tweede symptoom: de site is blanco (melding Rowan, 22:56)

> "Weerzone laat totaal niks zien, enige wat ik krijg is een navbar met logo
> maar zonder menupagina's, geen weerkaarten, helemaal niks."

Gereproduceerd op productie: `https://weerzone.nl/` geeft HTTP 200 met
`X-Vercel-Cache: MISS`, `Age: 0` — dus een verse render — maar de body bevat
alleen de schil: *"Weer op jouw locatie. Vandaag en morgen. / Vandaag Morgen /
Wat, hoe en waarom"*, negen interne links, nul temperatuurwaarden.

**Oorzaak — dezelfde dode Supabase, maar nu aan de client-kant.**
`src/lib/session-context.tsx`:

```js
async function hydrate() {
  const { data: userData } = await supabase.auth.getUser();  // <- geen try/catch
  ...
  setLoading(false);   // wordt alleen op het gelukkige pad bereikt
}
```

Geen `try`/`catch`, geen `finally`. Met het project weg gooit `getUser()` een
netwerkfout, `hydrate()` klapt eruit, en `setLoading(false)` wordt nooit
bereikt. `loading` blijft dus **eeuwig `true`** — en alles wat daarop wacht (de
navigatie, `HomeOnboarding`, de weerkaarten) blijft in zijn lege staat hangen.
Precies wat je ziet.

Dit verklaart ook waarom de fix van vanavond het niet oploste: `ad26788` is een
server-side deadline en de `/weer/...`-pagina's kwamen daardoor wél terug, maar
de homepage en de navigatie zijn client-gated op een sessie die nooit rond komt.

**Gefixt in `1dd62db`**: `hydrate()` zit nu in try/catch/finally, dus `loading`
eindigt altijd op `false` en de site valt terug op "uitgelogd" in plaats van op
niets.

> **Nog niet in een browser geverifieerd.** Er was hier geen browserextensie
> beschikbaar, dus dit is getest tot en met een groene build en een gelezen
> codepad — niet tot en met een renderende pagina. Dat is de eerste check na het
> promoten.

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
abonnementen, push en de cron-mail plat, en blijft de site in een uitgelogde
noodstand draaien (`[email-recipients] agent_subscriptions
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

---

# Vervolg — 11 september 2026, uitgerold

Laatste commit: `c9a1935`. Productie draait nu op `weerzone-d2q6vqzxk`
(`dpl_AGm4AVni2STDpKptL598246aU7Qo`).

## Wat er is gebeurd

**Item 1 hierboven is afgerond.** De begintoestand was ongewijzigd: prod draaide
nog op de deploy van 14 juli, `/weer/utrecht/utrecht` gaf `Age: 700959`
(8,1 dag) met `X-Vercel-Cache: STALE` en `dateModified 2026-09-03`, en het
Supabase-project resolvet nog steeds niet (NXDOMAIN).

Na de deploy, gemeten op `weerzone.nl`:

| Route | Voor | Na |
|---|---|---|
| `/weer/utrecht/utrecht` | STALE, `Age: 700959`, 3 sept | 200, `Age: 0`, `dateModified` = lopend uur |
| `/weer/limburg/heerlen` | — | 200, lopend uur |
| `/vandaag` | "niet beschikbaar" | 200, 12 temperatuurwaarden |
| `/` | alleen de schil | hero + weerteaser |

Steekproef van 8 koude provincie-pagina's (Haarlem, Apeldoorn, Leeuwarden,
Middelburg, Assen, Zwolle, Groningen, Lelystad): 8× 200.

De `--prod`-deploy heeft dit keer **vanzelf gealiast** — `vercel promote` gaf
daarna `409: already the current production deployment`. Blijf de output dus
lezen in plaats van blind promoten (staat ook zo in memory).

Let op: `vercel deploy` brak beide keren af met `deploy_failed / fetch failed`
ná "Build Completed". Dat is de CLI die zijn polling verliest, niet de deploy.
Beide deploys stonden gewoon op `● Ready` in `vercel list`. Niet opnieuw
deployen op die melding — eerst `vercel list` checken.

## Nieuwe bevinding: de homepage was nog steeds leeg

De sessie-fix van gisteren (`1dd62db`) is nu wél in een browser geverifieerd
(Playwright, want er was opnieuw geen browserextensie): `loading` eindigt netjes
op `false`, de nav vult zich, nul page errors. Maar de homepage bleef daarmee
alsnog zonder weerkaart — precies het symptoom dat Rowan beschreef.

Dat lag niet aan de sessie. `src/components/HomeWeatherTeaser.tsx` gaf
`fetchWeatherData` een deadline van **1500 ms**. Die call doet er op productie
~2,5 s over — ook ná `ad26788`. De race viel dus altijd terug op `null`, en de
component rendert bij `null` bewust niets ("dan blijft de hero heel"). Resultaat:
een homepage die technisch klopt en visueel leeg is, zonder één foutmelding.

Gemeten, 4 achtereenvolgende renders op de kandidaat vóór de fix: 0 van de 4
toonden de teaser. Lokaal duurt dezelfde call 1253 ms — net binnen de 1500 —
wat verklaart waarom dit lokaal nooit opviel.

`/vandaag` geeft exact dezelfde call 3500 ms (`src/lib/agents/context.ts`) en
rendeerde wél. `c9a1935` trekt de teaser daarop gelijk. Na de fix: 3 van de 3
renders met teaser, en live "15° in De Bilt · Motregen · 13° tot 19°".

De component zit in een `Suspense`-boundary met een skeleton, dus de hero wacht
niet op die 3,5 s. De volledige body van `/` gaat wel van ~1,65 s naar ~2,7 s.

Dit is dezelfde les als gisteren, maar één laag hoger: **een deadline die
strakker staat dan de call ooit haalt, is geen vangnet maar een uit-knop.** En
omdat de fallback hier stilletjes niets rendert, ziet je monitoring 200 OK.

## Wat er nog steeds op jou wacht

Ongewijzigd t.o.v. gisteren — items 2, 3 en 4 hierboven:

1. **Supabase terug.** Nog steeds NXDOMAIN. Accounts, abonnementen, push en de
   cron-mail liggen plat; de site draait in uitgelogde noodstand. Dat is nu een
   bewuste, werkende noodstand in plaats van een blanco pagina, maar het blijft
   een noodstand.
2. **OpenRouter-credits.** Zonder saldo blijven de SEO-teksten leeg. De rem zorgt
   dat dat goedkoop faalt.
3. **Open-Meteo-quotum.** ~4 calls per render, 1.977 rastercellen. Houd het in de
   gaten; de knoppen staan in item 4 hierboven.
