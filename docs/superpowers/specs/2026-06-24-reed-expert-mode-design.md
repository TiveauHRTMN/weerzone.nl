# Reed Expert-modus voor /vandaag en /morgen — ontwerp

**Datum:** 2026-06-24
**Branch:** weerzone-agents-fase1
**Status:** ontwerp goedgekeurd, klaar voor implementatieplan

## Probleem

De huidige "expert"-laag op `/vandaag` en `/morgen` is een uitklapbaar blok
(`WeatherVisuals.tsx` → `ReedExtremeCharts.tsx`) met zes losse SVG-grafiekjes
(CAPE, CIN, Lifted Index, dauwpunt, windschering, wind) met grijze gridlijnen.
Het is een dump van ruwe parameters: niemand duidt ze, ze staan los van elkaar,
en het oogt niet premium. Doel: een slimmere, mooiere, samenhangende expert-modus
waarin Reed de atmosfeer voor je leest.

## Beslissingen (uit brainstorm)

- **Kern van "slim":** alle drie tegelijk — Reed duidt de data (intelligentie),
  in één samenhangend interactief meteogram (vorm), met een echte premium look.
- **Vorm:** een echte *modus* via een `Gewoon | Expert`-toggle, niet een blok
  onderaan. In Expert neemt Reed de body van de pagina over.
- **Intelligentie:** **deterministisch** (drempels + logica). Geen LLM. Instant,
  gratis, voorspelbaar.
- **Toegang:** achter de Reed-voorkeur — alleen zichtbaar als `preferences.reed === true`.
- **Inhoud:** storm/severe-only zoals nu (CAPE, CIN, LI, schering, dauwpunt, wind +
  live bliksemkaart), maar premium herontworpen en geduid. Geen nieuwe everyday-meteogram.
- **Eerste mikpunt:** vol interactief meteogram (gedeelde scrub-lijn + readout +
  gepinde momenten).

## Architectuur

### A. De ervaring & de toggle

- In de hero-kop van `/vandaag` en `/morgen` een segmented pill `Gewoon | Expert`,
  gestyled met de bestaande `.va-day-toggle`-klasse. Alleen gerenderd als
  `preferences.reed === true`.
- **Hero + waarschuwing (`va-alert`) blijven in beide modi staan.** Reed is dé
  onweer-agent; de waarschuwing hoort juist bij hem.
- De **body wisselt**:
  - *Gewoon* = feiten-grid + dagdelen (huidige `DayBriefing`-inhoud).
  - *Expert* = Reed-kop + meteogram + gemarkeerde momenten + bliksemkaart.
- Modus-keuze onthouden in `localStorage` (key bv. `wz-day-mode`), zodat de modus
  blijft hangen tussen vandaag/morgen en reloads. Default = Gewoon bij eerste bezoek.
- `DayBriefing` blijft server-rendered. Een dunne client-wrapper houdt alleen de
  toggle-state vast en wisselt tussen twee al-geladen subtrees (geen refetch).
  De expert-reading wordt server-side berekend (pure functie) en als
  serialiseerbare prop doorgegeven.
- **Gevolg:** de huidige uitklap-sectie "Voor de expert" verdwijnt; die inhoud
  wórdt de Expert-modus. Wie Reed niet aan heeft, ziet geen toggle en geen
  expert-blok (schoner dan de huidige situatie).

### B. Reed's reading — het brein (deterministisch)

Nieuwe pure functie `src/lib/reed-expert-reading.ts`. Geen IO, geen LLM, geen
React — puur datatransformatie, los testbaar en herbruikbaar.

**Input:** de uur-forecast van de gekozen dag (zelfde filter als de huidige
`reedHours`: `weather.hourly` gefilterd op `daily[dayOffset].date`), plus een
day-label (`"vandaag" | "morgen"`).

**Output (`ReedExpertReading`):**

- `verdict: "rustig" | "oplettend" | "onrustig" | "code"` — totaaloordeel; bepaalt
  Reed's accentkleur (`#8593a8` → `#e08a08` → `#e23b34`) en de pill-tekst.
- `headline: string` — één levende zin, samengesteld uit regels (geen LLM), bv.
  *"Geduld tot een uur of vier — daarna kan het in korte tijd flink tekeergaan."*
- `moments: ReedMoment[]` — gemarkeerde sleutelmomenten: `{ time, kind, label,
  severity }`. Voorbeelden: deksel (CIN) breekt, piek onweerskans, schering-piek,
  broeierig-drempel. Deze pinnen op de tijdas van het meteogram.
- `layers: ReedLayer[]` — per parameter (CAPE, CIN, LI, schering, dauwpunt, wind):
  `{ key, title, phrase, severity, series, unit, threshold, thresholdLabel, min?, max? }`.
  `phrase` is de duiding-zin die de kale `maxLabel` van nu vervangt; `series` is de
  uur-array voor het meteogram.

**Regel-voorbeelden (indicatief, niet uitputtend):**
- `CIN > 100` op uur X, daarna `< 35` → moment "deksel breekt {X}u".
- `CAPE > 1500` samenvallend met `LiftedIndex < -6` → moment "hoog onweersrisico
  {start}–{eind}u", verdict ≥ `onrustig`.
- `windShear > 35` tijdens hoge CAPE → moment/laag-phrase "stormen kunnen zich
  organiseren".
- `dewPoint ≥ 18` → laag-phrase "broeierig".
- Geen drempels gehaald → verdict `rustig`, headline neutraal.

Drempels sluiten aan op de bestaande grenzen in `ReedExtremeCharts` (CAPE 500/1500,
CIN 35/100, LI 0/-2/-6, schering 35/45, dauwpunt 15/18) zodat de duiding consistent
is met wat het meteogram toont.

Herbruikbaar: dezelfde functie kan later de proactieve Reed-mail voeden (past in
het cohesieve agent-systeem, zie `2026-06-08-cohesive-agent-system-design.md`).

### C. Het premium meteogram — het pronkstuk

Nieuwe client-component `src/components/ReedMeteogram.tsx` die
`ReedExtremeCharts.tsx` vervangt. Eén samenhangend, gelaagd meteogram op één
gedeelde tijdas i.p.v. zes losse kaarten.

- **Lagen:** dezelfde parameters als nu (CAPE, CIN, LI, schering, dauwpunt, wind),
  als panelen onder elkaar met een gedeelde x-as (tijd).
- **Scrub-lijn (vol interactief):** hover/sleep op desktop, tap op mobiel. Eén
  verticale lijn over alle panelen; een readout toont de waarde van élke actieve
  laag op dat uur tegelijk. State leeft in de component (geselecteerde uur-index).
- **Gemarkeerde momenten** uit `reading.moments` staan als markers op de gedeelde
  as ("deksel breekt 16u"), met de Reed-severity-kleur.
- **Premium look:** `va-card`-tokens (frosted glass, zachte schaduw, 26px radius),
  zachte gradient-fills onder de lijnen i.p.v. grijze gridlijnen, tabular nums,
  accentkleur per verdict, subtiele entree-animatie (`vaRise`, respecteert
  `prefers-reduced-motion`).
- **`LightningMap`** blijft (alleen vandaag, live) als aparte premium kaart binnen
  de Expert-modus.

### D. Bestanden

| Bestand | Wat |
|---|---|
| `src/lib/reed-expert-reading.ts` | **nieuw** — pure regel-engine (verdict/headline/moments/layers) |
| `src/components/ReedMeteogram.tsx` | **nieuw** — gelaagd scrub-meteogram (vervangt ReedExtremeCharts) |
| `src/components/ExpertMode.tsx` | **nieuw** — client: toggle-state + Reed-kop + meteogram + moments + lightning |
| `src/components/DayBriefing.tsx` | toggle in hero, body-swap, expert-reading doorgeven |
| `src/components/WeatherVisuals.tsx` | vervalt / opgaat in `ExpertMode` |
| `src/app/(site)/vandaag/vandaag-skin.css` | nieuwe `.va-expert-*` klassen (meteogram, Reed-kop, scrub-readout, momenten) |
| `src/components/ReedExtremeCharts.tsx` | blijft tot meteogram af is, daarna verwijderen |

## Datastromen

1. `vandaag/page.tsx` (en `morgen/page.tsx`) bouwen `ctx` via `buildAgentContext` en
   lezen `preferences` (server). Geen wijziging in de fetch-laag.
2. `DayBriefing` (server) berekent `reading = reedExpertReading(reedHours, dayLabel)`
   en geeft `reading` + `weather`/`lat`/`lon` door aan de client-wrapper
   `ExpertMode`, samen met `preferences.reed`.
3. `ExpertMode` (client) rendert de toggle (alleen als `reed`), houdt modus-state +
   `localStorage`, en toont óf de Gewoon-body (children) óf de Expert-body
   (Reed-kop uit `reading` + `ReedMeteogram` + `LightningMap`).
4. `ReedMeteogram` (client) krijgt `reading.layers` + `reading.moments`, beheert de
   scrub-index en rendert de gelaagde SVG met readout.

## Niet in scope (YAGNI)

- Geen everyday-meteogram-lagen (temp/druk/bewolking) — bewust storm-only.
- Geen LLM-duiding — bewust deterministisch.
- Geen premie/paywall — achter Reed-voorkeur, geen prijslogica (KvK-constraint).
- Geen nieuwe parameters t.o.v. de huidige zes + bliksem.

## Open punten / risico's

- `DayBriefing` is nu server-component met directe JSX-body; de toggle vereist een
  client-grens. De wrapper moet de Gewoon-body als `children` (server-gerenderd)
  ontvangen zodat die niet onnodig client wordt.
- `ReedExtremeCharts` gebruikt `detectLocale`/`usePathname` (NL-only soft-disabled);
  het nieuwe meteogram kan locale droppen en hardcoded NL gebruiken.
- Scrub-interactie moet toegankelijk blijven (toetsenbord/links, `prefers-reduced-motion`).
