# weather.ts: realistische temperaturen via multi-model-mediaan

**Datum:** 2026-06-24
**Scope:** `src/lib/weather.ts` (site-breed — actuele temp, uur- en dagverwachting, alle agent-forecasts)
**Voortbouwend op:** `2026-06-24-tiktok-brief-multimodel-temp-design.md` (zelfde root-cause + fix, daar al live)

## Probleem

`weather.ts` toont voor NL kale HARMONIE-temperatuur (`knmi_seamless`), die in
hitte 2-3 °C boven de gecorrigeerde KNMI/Weerplaza-verwachting loopt. `blendHourly`
is geen echte blend: het pakt HARMONIE en valt alleen bij gaten terug op het
secundaire model. De warme bias zit dus in drie afgeleiden, allemaal HARMONIE:
**uurtemperatuur, actuele temp, en dagmax**.

De 5 extra modellen die nu (alleen bij `forceHighRes`) als 5 losse calls worden
opgehaald, dienen enkel een "agreement %" — ze corrigeren de temperatuur niet.

## Oplossing

Een **mediaan over meerdere modellen** op de temperatuur-velden, identiek aan de
brief-fix. Implementatie via een **aparte, lichte multi-model-call** die parallel
met de lead-fetch draait (patroon van het bestaande `fetchUvIndexMaxByDate`).

Reden voor een aparte call i.p.v. `models=` op de lead-call: met `models=a,b,…`
suffixt Open-Meteo *elke* variabele per model (`temperature_2m_<model>`, ook
`current`/`daily`). Dat zou de volledige parsing van het bestand breken. Een
losse temperatuur-call houdt de wijziging geïsoleerd en risicoarm.

### Nieuw: `fetchMedianTemps(lat, lon, timezone)`
- Eén call: `hourly=temperature_2m,apparent_temperature` +
  `daily=temperature_2m_max,temperature_2m_min`, met
  `models=knmi_seamless,ecmwf_ifs025,icon_eu,gfs_seamless,ukmo_seamless`,
  `forecast_days=4`, `forecast_hours=96`.
- Parseert de per-model-arrays (`<veld>_<model>`), neemt per tijdstap de **mediaan**
  over de beschikbare modellen (filter `null`).
- Retourneert:
  - `hourlyTempByTime: Map<string, number>` (mediaan-temperatuur per uur)
  - `hourlyApparentByTime: Map<string, number>` (mediaan-gevoelstemp per uur)
  - `dailyMaxByDate: Map<string, number>`, `dailyMinByDate: Map<string, number>`
- Faalt de call of komt er niets bruikbaars terug → lege maps (→ terugval op HARMONIE).
- Draait in de bestaande `Promise.all` naast `leadPromise`/`uvPromise`; geen serie-vertraging.

### Toepassing in `fetchWeatherData`
- **Uur**: in de hourly-mapping, vervang `temperature`/`apparentTemperature` door de
  mediaan-waarde uit de map als die bestaat voor dat tijdstip; anders huidige HARMONIE-waarde.
- **Actuele temp**: vereist géén aparte ingreep — het bestaande pad (regels ~489-498)
  overschrijft `currentTemp/currentFeels` al met `hourly[targetIndex]` voor het lopende
  uur, dus de mediaan-correctie werkt automatisch door. (Valt het uur niet te matchen,
  blijft `data.current` als vandaag → HARMONIE; acceptabel randgeval.)
- **Dagmax/min**: in de daily-mapping, gebruik `dailyMaxByDate`/`dailyMinByDate` per
  datum als aanwezig; anders huidige HARMONIE-`temperature_2m_max/min`.

### Niet aangeraakt
Precipitatie, `weather_code`, wind, CAPE, condities, UV, de pluim/agreement-logica
en de `forceHighRes`-fan-out blijven ongewijzigd. De hittebias zit in temperatuur,
niet hierin; HARMONIE blijft hoge-resolutie-leidend voor weersbeeld en neerslag.

### Velden waar modellen geen gevoelstemp leveren
Niet elk model levert `apparent_temperature`. Per tijdstap: mediaan over de modellen
die het wél hebben; geen enkele → HARMONIE-gevoelstemp.

## Verificatie

- `npx tsc --noEmit` blijft schoon (gefilterd op `weather.ts`).
- Lokaal een NL-locatie in het zuiden ophalen op een hete dag: getoonde
  actuele/dagmax-temp ~35/36 i.p.v. 38, in lijn met KNMI/Weerplaza.
- Terugval: forceer een lege mediaan-map → temperaturen vallen terug op HARMONIE,
  geen lege/0-waarden.
- Sanity: neerslag/weercode/wind ongewijzigd t.o.v. voor de wijziging.

## Risico / blast-radius

Raakt elke pagina die `fetchWeatherData` gebruikt. Mitigatie: temperatuur-only,
volledige terugval op het huidige gedrag bij elke faalconditie, en geen wijziging
aan de overige weervelden of de caching.
