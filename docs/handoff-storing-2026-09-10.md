# Handoff — storing weerzone.nl, 10–11 september 2026

Eén document over de hele storing: wat er stuk was, wat er gefixt is, wat er
live staat en wat er nog op jou wacht. Vervangt de drie losse lagen die hier
eerder achter elkaar geplakt stonden.

Branch: `feat/studio-tiktok-autopost` (gepusht)
Laatste commit: `2880881`
Productie: `weerzone-fxfs4uqs7-tiveauhrtmns-projects.vercel.app`

---

## Waar het nu staat

**De site werkt en is snel.** Verse verwachtingen, ISR ademt weer
(`X-Vercel-Cache: HIT`, `Age: 15` in plaats van `STALE` met `Age: 700959`).

**Supabase ligt er nog steeds uit** en dat is het enige wat nog écht kapot is.
Accounts, inloggen, abonnementen, push en de cron-mail liggen daarmee plat. De
site draait in een uitgelogde noodstand — bewust gebouwd, niet toevallig — en
herstelt zichzelf zodra de database terug is. Daar is geen deploy voor nodig.

| | begin 11 sept | nu |
|---|---|---|
| `/weer/utrecht/utrecht` | STALE, 8,1 dag oud | 200, lopend uur |
| `/vandaag` DOM klaar | 9882 ms | ~900 ms |
| `/` TTFB | 9993 ms | 153 ms |
| `/` sessie bruikbaar | 12450 ms | 414 ms |
| homepage | alleen de schil | hero + weerkaart |

---

## Wat er nog op jou wacht

### 1. Nieuw Supabase-project — de enige echte blocker

Het project `bhguergqkyiejyxsiwdu` is **verwijderd**, niet gepauzeerd. Bewijs:
NXDOMAIN op een publieke resolver (een gepauzeerd project blijft gewoon
resolven), en jij vindt die ref in geen van je twee organisaties terug.

Let op: `bhguergqkyiejyxsiwdu` is de project-**ref**, niet de naam. Je ziet 'm
in de dashboard-URL (`supabase.com/dashboard/project/<ref>`) of onder Project
Settings → General → Reference ID. In Tiveau staan Calor Travel en
"rwnhrtmn@gmail.com's Project" (vrijwel zeker het tweede Calor-project); de
andere organisatie is leeg.

Maak een **apart** project voor Weerzone. Niet meeliften op Calor: aparte data,
aparte keys, aparte RLS, en als je er ooit één sloopt neem je de andere niet
mee. Regio **EU (Frankfurt)** — je Vercel-functies draaien in `fra1`, dat
scheelt latency bij elke query.

Daarna, in deze volgorde:

1. Keys in Vercel zetten: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Migraties uit `supabase/migrations/` draaien via de SQL-editor (geen
   Supabase CLI hier, en de connection string in `.env.production.local` is
   leeg).
3. **Opnieuw deployen.** Dit is de valkuil: `NEXT_PUBLIC_*` wordt in de build
   ingebakken. Een nieuwe waarde in Vercel doet niets tot er een nieuwe build
   overheen gaat.
4. Controleren met `npx tsx scripts/check-supabase-herstel.ts`.
5. Crons in `vercel.json` nalopen.

### 2. OpenRouter-credits bijvullen

https://openrouter.ai/settings/credits — saldo is op (23.806 × HTTP 402 in een
week). Raakt alleen de SEO-teksten en de WWS-pipeline, niet de weerdata. De
kredietrem zorgt dat het goedkoop faalt in plaats van traag, maar de 402's staan
nog wel in de logs en kosten een round-trip per render.

### 3. Open-Meteo-quotum in de gaten houden

~4 calls per render (was ~9), 13.776 plaatsen op 1.977 rastercellen (factor
6,97). Bij ~5.500 renders per dag zit je nog steeds in de buurt van de 10.000
calls van het gratis plan. Knoppen als je marge wilt:

- `PROGRAMMATIC_GRID_STEP` van 0,05 naar 0,1 → 576 cellen in plaats van 1.977
  (afwijking ~6,5 km in plaats van ~3,3 km).
- Of een betaald plan, en dan kan de rasterstap juist omlaag.

Eén ding heb ik bewust **niet** aangeraakt: de lead-fetch in `attemptFetch`
staat nog op `revalidate: 600` terwijl de rest naar 1800 ging. Die call draagt
het `current`-blok — de actuele meting — en jouw lijn is dat de meting het van
elk model wint. Dat leek me niets om stilletjes op 30 minuten te zetten, maar
het is wel de grootste knop als je verder omlaag wilt.

---

## Wat er stuk was

Vier symptomen, en ze bleken allemaal op dezelfde fout terug te voeren.

### Symptoom 1 — weken oude verwachtingen

`/weer/utrecht/utrecht` was 7,5 dag oud (`Age: 651658`, `X-Vercel-Cache:
STALE`), sommige plaatsen 16,8 dag. `/vandaag` toonde "De weergegevens zijn
even niet beschikbaar".

Het Supabase-project was verwijderd. In `fetchWeatherData` lezen
`loadMarianaMemory()` en `nearestRegionFeed()` daaruit, met alleen
`.catch(() => null)` eromheen. Gemeten op een fra1-preview:

```
    86 ms  raw Open-Meteo
    14 ms  raw fetch naar de dode Supabase-host  (faalt meteen)
  8614 ms  loadMarianaMemory   (supabase-js)
  7038 ms  nearestRegionFeed   (supabase-js)
 14103 ms  fetchWeatherData    <- vóór de fix
  2469 ms  fetchWeatherData    <- ná de fix
```

Een kale fetch naar de dode host faalt in 14 ms; de supabase-js-client doet zijn
eigen retries en doet er 8,6 s over. **`.catch()` vangt de fout, maar niet de
tijd.**

De keten: 15 s in `fetchWeatherData` → `buildAgentContext` kapt af op 3,5 s
(`/vandaag`) of 8 s (`/weer`) → geeft `null` terug, **zonder één logregel** →
pagina gooit → bij ISR-revalidatie betekent een throw: oude versie laten staan →
Vercel serveert de stale prerender eindeloos door.

Open-Meteo was al die tijd gezond (86 ms). Dat was een dwaalspoor.

### Symptoom 2 — de site is blanco

> "Weerzone laat totaal niks zien, enige wat ik krijg is een navbar met logo
> maar zonder menupagina's, geen weerkaarten, helemaal niks."

Dezelfde dode backend, nu client-side. `session-context.tsx` `hydrate()` riep
`supabase.auth.getUser()` aan zonder `try`/`catch`/`finally`. Bij een netwerkfout
klapte `hydrate()` eruit en werd `setLoading(false)` nooit bereikt — `loading`
bleef eeuwig `true`, en alles wat daarop wacht (navigatie, `HomeOnboarding`, de
weerkaarten) bleef in zijn lege staat hangen.

### Symptoom 3 — de homepage bleef leeg, ook na die fix

`HomeWeatherTeaser` gaf `fetchWeatherData` een deadline van **1500 ms**, terwijl
die call op productie ~2,5 s doet — ook ná de fix van symptoom 1. De race viel
dus altijd terug op `null`, en de component rendert bij `null` bewust niets
("dan blijft de hero heel"). Resultaat: een homepage die technisch klopt en
visueel leeg is, zonder één foutmelding. 0 van de 4 renders toonden de kaart.

Lokaal duurt diezelfde call 1253 ms — net binnen de grens. Daarom viel dit
lokaal nooit op.

`/vandaag` geeft exact dezelfde call 3500 ms en rendeerde wél. De teaser is
daarop gelijkgetrokken. De component zit in een Suspense-boundary, dus de hero
wacht niet op die 3,5 s.

### Symptoom 4 — alles werkt, maar tergend traag

> "Alles doet het op zich wel, maar inloggen oa en laden is tergend traag."

Vier plekken, allemaal `try/catch` om een supabase-js-call **zonder deadline**:

1. `getAgentPreferences()` — zat ongelimiteerd in de `Promise.all` van
   `/vandaag` en bepaalde daarmee de rendertijd van de hele pagina.
2. `session-context` `hydrate()` — wachtte dezelfde ~8 s uit aan de clientkant.
   De fix van symptoom 2 haalde de site uit "eeuwig blanco", maar liet 'm in
   "8 seconden leeg" staan: nav en inlogknop bleven al die tijd leeg.
3. `PietScoreCard` — servercomponent die `loadScoreDigest()` zonder deadline
   aanriep en zo de hele `/vandaag`-stream ophield. Veruit de grootste brok.
4. `AgentsHubCard`, `DagplanSheet`, `RegiekamerPanel` — drie client-side
   `getUser()`-calls die elk hun eigen ~8 s openhielden en het load-event
   vertraagden.

### En een vijfde, los van Supabase

De kredietrem voor OpenRouter sprong nooit aan. Hij zat om de eerste modelcall
heen, maar in de praktijk faalt het eerste model om een andere reden en loopt
pas het **fallback**-model tegen het lege saldo aan — en die call stond buiten
de try/catch. Elke render betaalde dus alsnog ~8 s aan mislukte round-trips.
Dicht, met een regressietest (`scripts/test-hermes-credit-brake.ts`) die
aantoonbaar faalt op de commit ervóór.

Dit raakte de weerdata overigens niet (`getLocationSEOContent` is `.catch()`'t) —
alleen de SEO-tekst op de pagina's.

---

## Alle fixes

| Commit | Wat |
|---|---|
| `e6bea53` | Open-Meteo-quotum: `snapToGrid` (0,05° ≈ 5 km), `highRes:false` op de programmatische pagina's (9 → 4 calls), `revalidate` 600 → 1800, `break` bij 429, `regions: fra1` |
| `7f0d618` | Kredietrem in `hermes.ts` sprong nooit aan + regressietest |
| `ad26788` | **Kernfix**: deadline van 1,2 s om de Mariana/Oracle-verrijking |
| `dde77e4` | Tijdelijke debug-route weg |
| `1dd62db` | `loading` bleef eeuwig true bij onbereikbare auth → blanco site |
| `c9a1935` | Weerteaser haalde zijn eigen deadline nooit (1500 → 3500 ms) |
| `9a49c35` | Diagnostiek: enrichment-logging + `check-supabase-herstel.ts` |
| `c3b95e9` | `auth-deadline.ts` — deadline om `auth.getUser()` (8 s → 2,5 s) |
| `d0b4a1f` | `backend-breaker.ts` — zekering rond een backend die al plat ligt |
| `1ec4a63` | Zekering ging telkens weer dicht bij een dode backend (eigen bug) |
| `e7246fd` | Deadline om `PietScoreCard` — hield de hele `/vandaag`-stream op |
| `5c40dcd` | Deadline om de laatste drie client-side `getUser()`-calls |

---

## Nieuw gereedschap

### `src/lib/auth-deadline.ts`

`AUTH_DEADLINE_MS` = 2500, met `getUserWithDeadline()`. Ruim voor een gezonde
Supabase (tientallen tot honderden ms), dus de deadline hoort nooit te vuren als
alles werkt — vuurt hij tóch, dan staat het in de log.

Afweging die erin zit: bij een overschrijding gaat de bezoeker als uitgelogd
verder. Voor een ingelogde gebruiker is dat even een verkeerde staat, maar dat
weegt niet op tegen een pagina die tien seconden niets doet.

### `src/lib/backend-breaker.ts`

Een deadline beschermt één render, maar onthoudt niets. De logs lieten letterlijk
zien wat dat kost: `[enrichment] ... over de deadline van 1200 ms` bij iedere
weergave, 2,4 s per pagina, ~5.500 renders per dag — puur wachten op een host
waarvan we al wisten dat hij niet bestond.

De zekering onthoudt het wel: 3 missers op rij → 60 s overslaan → één nieuwe
poging. Lukt die, dan sluit hij. **Daardoor herstelt de site vanzelf zodra
Supabase terugkomt, zonder deploy.** De staat leeft per lambda-instance, bewust:
geen gedeelde opslag nodig (die ligt in dit scenario juist plat), en een nieuwe
instance begint met een frisse poging.

Belangrijk detail: alleen een fout of een overschreden deadline telt als misser.
Een call die netjes `null` teruggeeft niet — `loadMarianaMemory` geeft terecht
`null` als er voor die locatie nog geen geheugen is. Dat als storing tellen zou
de verrijking uitzetten terwijl de backend kerngezond is.

### `scripts/check-supabase-herstel.ts`

Per laag een harde ja/nee: DNS, REST-endpoint, de vijf tabellen waar de site op
leunt, en de latency tegen de 1200 ms-deadline. Draait nu tot en met DNS en
stopt daar. Dit is je eerste check zodra het nieuwe project staat.

---

## Twee dingen die ik fout deed, het onthouden waard

**De zekering bleef nooit open.** Eerste versie meldde "succes" zodra
`withTimeout` een waarde terugkreeg. Maar `loadMarianaMemory` en
`loadRegionFeed` vangen hun netwerkfout intern af en geven `null` — dus zag die
laag een geslaagde call en reset de zekering bij élke render. In de logs stond
`[breaker] nearestRegionFeed antwoordt weer — zekering dicht` terwijl Supabase
aantoonbaar plat lag. Alleen de bronfunctie kent het verschil tussen "niets
opgeslagen" en "fout opgevangen", dus melden die het nu zelf.

Zonder de logging uit `9a49c35` was dat onzichtbaar gebleven — de besparing die
`d0b4a1f` beloofde ging gewoon verloren en niemand had het gemerkt.

**De eerste uitrol was niet af.** Na het promoten stond de homepage er nog
steeds leeg bij (symptoom 3). Een groene build en 200-codes waren niet genoeg;
pas een echte render in een browser liet het zien.

---

## Hoe er gemeten is

Er was geen browserextensie beschikbaar, dus alles via **Playwright** (zit al in
de repo). Werkt prima en is reproduceerbaar. Let op: preview- en
prod-deployment-URL's zitten achter deployment protection; gebruik de
`x-vercel-protection-bypass`-header (secret staat in `.env.local`) of hang
`?x-vercel-protection-bypass=<secret>&x-vercel-set-bypass-cookie=true` aan de
URL voor een browser.

Twee dingen over de Vercel-CLI die tijd kostten:

- `vercel deploy` brak meermaals af met `deploy_failed / fetch failed` **ná**
  "Build Completed". Dat is de CLI die zijn polling verliest, niet de deploy.
  Die stond gewoon op `● Ready`. Eerst `vercel list` checken, niet opnieuw
  deployen.
- De `--prod`-deploy **aliaste vanzelf** naar weerzone.nl; `vercel promote` gaf
  daarna `409: already the current production deployment`. Blijf de output dus
  lezen in plaats van blind promoten.

---

## Diagnostische patronen om te bewaren

**`.catch()` vangt een fout, geen tijd.** Elke I/O in een render-pad met een
deadline erboven heeft zelf een timeout nodig. Een dode backend die *snel* faalt
is ongevaarlijk; een client die er beleefd 8 s over doet, sloopt je ISR.

**Een deadline die strakker staat dan de call ooit haalt, is geen vangnet maar
een uit-knop.** En met een stille null-fallback ziet je monitoring gewoon 200 OK.

**Een deadline beschermt één render en onthoudt niets.** Ligt een backend er echt
uit, dan wil je een zekering, geen timeout per keer.

**`X-Vercel-Cache: STALE` met een hoge `Age`** betekent dat de *regeneratie*
faalt, niet dat de cache verkeerd staat.

**Vercel-runtime-errors gaan maar 7 dagen terug.** "First seen" is vaak gewoon de
rand van je queryvenster — het leek alsof alles op 3 september tegelijk omviel,
maar dat was het einde van de logbewaring.

---

## Losse eindjes

- `docs/superpowers/specs/2026-06-07-agent-subscription-foundation-design.md`
  heeft een niet-gecommitte regelafbreking in een al beschadigde regel
  ("VBNCASVd wfegb rnhtm,ulik.?"). Buiten deze fix gelaten.
- Web Analytics staat uit op het Vercel-project; daardoor moest verkeer uit de
  runtime-logs worden afgeleid. Aanzetten maakt de volgende audit makkelijker.
- `src/seo` is een submodule en staat permanent als "modified" in `git status`.
  Niets aan de hand.
