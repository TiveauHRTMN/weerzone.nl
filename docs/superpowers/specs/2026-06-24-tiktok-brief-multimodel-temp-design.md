# TikTok-brief: realistische temperaturen via multi-model-mediaan

**Datum:** 2026-06-24
**Scope:** `src/app/(site)/api/cron/mariana-tiktok-email/route.ts` (brief-only)

## Probleem

De dagelijkse TikTok-brief toont in hittegolven temperaturen die 2-3 °C boven
KNMI/Weerplaza liggen (bv. 24-6-2026: brief Breda 38°, KNMI ~35/36°).

Oorzaak, empirisch vastgesteld: de brief leest `temperature_2m_max` uit een kale
Open-Meteo-call zonder `models=`. Voor NL kiest Open-Meteo dan automatisch
`knmi_seamless` (HARMONIE) — exact dezelfde bron als `best_match`. Het verschil
met KNMI/Weerplaza is dus **niet** modelkeuze, maar dat Open-Meteo **ruwe
modeloutput** serveert terwijl KNMI/Weerplaza een statistisch + menselijk
gecorrigeerde (MOS) verwachting publiceren. Die correctielaag zit in geen enkel
Open-Meteo-model.

Meting 24-6-2026 (dagmax, °C):

| Plek | HARMONIE | ECMWF | ICON | GFS | UKMO | mediaan | KNMI |
|---|---|---|---|---|---|---|---|
| Breda | 38,2 | 35,1 | 34,4 | 34,4 | 36,0 | **35,1** | ~35/36 |
| Maastricht | 37,6 | 33,6 | 34,4 | 35,9 | 35,9 | **35,9** | ~35/36 |
| Eindhoven | 36,7 | 35,3 | 35,6 | 35,1 | 35,9 | **35,6** | ~35/36 |
| De Bilt | 33,8 | 32,5 | 34,8 | 33,5 | 34,8 | **33,8** | ~34 |

HARMONIE is de uitschieter naar boven; de **mediaan over de modellen** landt op
KNMI-niveau, zonder eigen correctie-model.

## Oplossing

Vervang de enkel-model-max in de brief door de **mediaan over meerdere modellen**
in één Open-Meteo-batch-call.

### `fetchRanking(dayOffset)`
- Voeg `&models=knmi_seamless,ecmwf_ifs025,icon_eu,gfs_seamless,ukmo_seamless`
  toe aan de bestaande batch-URL (1 call, alle 41 plekken).
- Open-Meteo geeft dan per variabele één array per model
  (`temperature_2m_max_<model>`). Per plek: verzamel de beschikbare modelwaarden
  (filter `null`/ontbrekend), neem de **mediaan**.
- Mediaan i.p.v. gemiddelde: robuust tegen één hete uitschieter (de faalmodus).
- Bij <2 beschikbare modellen voor een plek: gebruik wat er is (mediaan van 1 = die waarde).

### `fetchDetails(dayOffset)` — ongewijzigd
UV/zon/wind blijven op de huidige default-call. De bias zit in temperatuur, niet
hierin; bovendien levert HARMONIE geen UV (`uv_index_max: null`).

### Terugval
Faalt de multi-model-call (non-200 / geen data), val terug op het huidige
gedrag (enkele `temperature_2m_max`), zodat de brief nooit stilvalt.

### Afgeleiden — geen extra werk
`warmst`, `koelst`, `spread`, regio-gemiddelden en het LLM-weerbericht lezen
allemaal uit `ranked`, dus die worden automatisch realistisch.

## Niet in scope (aparte follow-up)

`src/lib/weather.ts` (de hele site, incl. actuele/verwachte temp op weerzone.nl)
heeft dezelfde HARMONIE-warmbias en toont vandaag ook ~38° in het zuiden.
Dezelfde multi-model-mediaan-aanpak hoort daar ook thuis, maar dat raakt veel
meer files + `tsc` en gebeurt los van deze brief-fix.

## Verificatie

- `npx tsc --noEmit` blijft schoon op het gewijzigde bestand.
- `?dry=1` op de route lokaal: ranglijst toont ~35/36 voor het zuiden i.p.v. 38,
  in lijn met KNMI/Weerplaza op dezelfde dag.
- Terugval testen door tijdelijk een ongeldige modelnaam te forceren → brief
  rendert nog steeds met enkele-max.
