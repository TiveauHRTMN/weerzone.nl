# Calor — Designrichting

**Versie:** 2.0 — 14 juli 2026 · Hoort bij [BUSINESS_PLAN.md](BUSINESS_PLAN.md) (positionering h. 8, besliskaders h. 24) en [PRICING_STRATEGY.md](PRICING_STRATEGY.md) (prijscommunicatie §8)
**Scope:** visuele identiteit + UX van de Live-ervaring (Slice 3) en de schermen eromheen. Dit document raakt geen code; het is de opdracht aan de bouw.
**v2.0 vervangt v1.0 volledig.** De v1-richting (crème canvas, editorial serif, mosgroen) is door de oprichter verworpen. De nieuwe richting: **strak, duidelijk, less is more — het logo is de rode draad.** Consequentie: de huidige Slice 1-styling (`globals.css`) wordt vervangen, niet aangevuld (zie §9).

---

## 1. Ontwerpthesis

Het merk bestaat al: **CALOR** in zware zwarte kapitalen met een vlam als O. De interface is dat logo, uitgevouwen tot een product: wit, zwart, en de vlamkleuren precies dáár waar iets leeft.

> **Wit = wat vaststaat. Zwart = wat vandaag herberekend is. De vlam markeert wat nú geldt.**

- Statische informatie (regio's, cultuur, valuta, seizoensbeeld) staat op **wit**: veel ruimte, zwarte tekst, hairline-grijze kaders. Geen texturen, geen tinten die "sfeer" moeten maken — de inhoud is de sfeer.
- Wat dagelijks herberekend wordt (beste keuze vandaag, Plan B, wijzigingen sinds gisteren, Country Pulse) staat op **zwart**, gemarkeerd met de **vlamrand** (§5.1).
- Kleur is functie: oranje en rood verschijnen alleen met betekenis, nooit als decoratie.

**Toetssteen voor elk scherm:** kan een gebruiker in één oogopslag zien welk deel van dit scherm vanochtend is herberekend? En: kan er nog iets af zonder dat de betekenis verandert? Zolang het antwoord op de tweede vraag "ja" is, is het scherm niet af.

---

## 2. Kleur — het palet ís het logo

Alle kleuren komen uit of zijn afgeleid van het logo ("Calor 2026 Travel Clothing"; rood/oranje gesampled uit het PNG **[FEIT]**):

| Token | Hex | Rol |
| --- | --- | --- |
| `--white` | `#FFFFFF` | grond — al het vaststaande |
| `--black` | `#0A0A0A` | levend oppervlak + primaire tekst (logo-letters zijn puur `#000000`) |
| `--sun` | `#FAA72A` | zon-oranje (binnenvlam) — status "nu relevant", puls, Live-markering |
| `--deep` | `#E85D04` | diep oranje (afgeleid, tussen vlamrood en zon-oranje) — primaire actie |
| `--red` | `#EE2E2E` | vlamrood — accenten: urgentie, tijdelijke kansen, de "sinds gisteren"-marker |
| `--surface` | `#F6F6F6` | rustvlak op wit (uitgesteld, secundair) |
| `--line` | `#E8E8E8` | hairlines en kaders |
| `--muted` | `#6A6A6A` | secundaire tekst |

Regels:

1. **Neutralen zijn puur.** Geen warme bias, geen crème: grijs is grijs. De warmte van het merk komt uit de vlamkleuren, nergens anders vandaan.
2. **Hiërarchie in de vlam:** zon-oranje = status/nu, diep oranje = actie, rood = urgentie/kans. Drie kleuren, drie banen; ze wisselen nooit van rol.
3. **Rood is óók de foutkleur** — fouten en waarschuwingen gebruiken rood mét icoon en tekst, nooit kleur alleen; het onderscheid met een rode kans-accent zit in vorm en formulering, niet in een aparte kleur. Dit houdt het palet op vijf dragende kleuren.
4. **Dosering:** op een gemiddeld scherm is > 90% wit/zwart/grijs. Als oranje of rood domineert, is de betekenis weg.

---

## 3. Typografie — Inter, overal

**Eén lettertype: Inter** (self-hosted, variabel). Gekozen boven Roboto omdat het specifiek voor schermen is getekend — hogere x-hoogte, opener vormen, betere leesbaarheid op kleine maten — en een eigen karakter heeft zonder decoratief te worden. Geen tweede lettertype; hiërarchie komt uit gewicht, maat en spatiëring:

| Rol | Spec |
| --- | --- |
| Masthead / paginakop | Inter 800, `clamp(1.9rem, 6vw, 2.6rem)`, tracking −0.03em |
| Sectiekop | Inter 700, 1.25rem, tracking −0.02em |
| Kaartkop | Inter 700, 1.05rem |
| Body | Inter 400/500, 0.9375rem, lijnhoogte 1.6 |
| Label (uppercase) | Inter 700, 0.68rem, tracking +0.12em |
| Data (tijden, temperaturen, prijzen) | Inter 500 met `font-variant-numeric: tabular-nums` |

De merk-sans van het logo wordt **nooit** als teksttype gebruikt: het logo verschijnt uitsluitend als beeld (merkbalk, app-icoon, marketing). De display-serif uit v1 vervalt volledig.

---

## 4. Vorm

- **Radii:** kaarten en panelen 16px, invoervelden 12px, knoppen en chips pill (999px). Eén setje, nooit uitbreiden.
- **Kaders boven schaduwen:** hairline `--line` als standaardscheiding; maximaal één zachte schaduw voor het levende paneel. Geen gestapelde schaduwlagen, geen glaseffecten, geen achtergrondgradients of texturen.
- **Ruimte is het belangrijkste stijlmiddel.** Spacing-schaal: 4/8/12/16/24/32/48. Bij twijfel: méér wit, mínder kader.
- **Iconen:** één lijndikte (1.75px), monochroom zwart of muted; nooit gekleurd behalve binnen de vlam-betekenisregels van §2.

---

## 5. De signatuur

### 5.1 De vlamrand

Alles wat vandaag herberekend is, draagt een dunne **rood→zon-oranje gradiëntrand** (`#EE2E2E → #FAA72A`, 3px) aan de bovenzijde. Dit is de enige gradient in het hele product — en hij is letterlijk het logo (buitenvlam → binnenvlam), uitgesmeerd tot een lijn. De vlamrand verschijnt op: het levende dagpaneel, de Country Pulse-strook, de "sinds gisteren"-teaser op het dashboard, en pushmeldingen waar het platform het toelaat. Nergens anders.

### 5.2 De fit-trace

Elke aanbeveling draagt een compacte rij stempels die tonen **waarom nú** (ongewijzigd uit v1 — dit is UX, geen styling):

```text
[ Walvisseizoen · piek ] [ Zeegang rustig tot 13:00 ] [ Ok voor 6+ ] [ 45 min vanaf verblijf ]
```

- Maximaal 4 stempels; de engine kiest de 4 zwaarstwegende factoren.
- Elke stempel is een feit met herkomst, geen sfeerlabel. Categorieën: seizoen, weer/zeegang, gezelschap, afstand/reistijd, actualiteit.
- Vormgeving op zwart: pill met hairline-witrand, tekst wit; het stempel dat de doorslag gaf mag als enige zon-oranje tekst voeren.
- In previews (wit) bestaat de fit-trace alleen met statische stempels (seizoen/gezelschap): het gemis van de dag-stempels ís de Trip Pass-verkoop.

### 5.3 De dageditie

De Live-dagview opent als een editie, niet als een dashboard (ongewijzigd uit v1):

```text
┌ merkbalk: logo (zwart) + Live-chip ───┐
├ masthead (wit) ───────────────────────┤
│ VANDAAG · DAG 4 VAN 12   ● bijgewerkt │  ← label, sun-puls
│ Donderdag 30 januari — Las Terrenas   │  ← Inter 800
│ Sinds gisteren: boot 9:00 → 8:30 ·…   │  ← rode marker, retentiemotor
├ LEVEND PANEEL (zwart + vlamrand) ─────┤
│ BESTE KEUZE VANDAAG (label sun)       │
│ titel + 1 zin waarom                  │
│ fit-trace · [actie: deep] [Plan B ↓]  │
├ alternatieven (wit, 2 kaarten) ───────┤
├ beter uitstellen (surface, gedempt) ──┤
├ Country Pulse (zwart strookje) ───────┤
└ praktisch vandaag (wit) ──────────────┘
```

- **Eén** levend hoofdpaneel per dag; nooit twee schermvullende zwarte panelen boven elkaar — dan verliest zwart zijn betekenis.
- **Plan B klapt uit binnen het levende paneel** en is er altijd; bij slecht weer wisselen hoofdkeuze en Plan B automatisch van gewicht.
- **"Beter uitstellen"** staat op `--surface`, zonder kader-nadruk: visueel geparkeerd, met reden en betere dag ("betere kans zaterdag" — de dag in zwart, de rest muted).
- **Country Pulse** is een smalle zwarte strook met vlamrand, 1–2 regels.

**Mockup:** de HTML-mock (*Calor — Live dagview*, artifact) is omgebouwd naar deze richting en is de referentie voor sfeer, hiërarchie en copy; exacte spacing volgt de tokens.

---

## 6. Overige schermen — UX-besluiten (ongewijzigd uit v1, herstyled)

### 6.1 Trip Pass-activatie ("Activeer Live voor deze reis")

- Het aanbod verschijnt in de reis zelf, op het moment van maximale relevantie (≤ 14 dagen voor vertrek), als levend paneel in preview-toestand: de dagview-structuur met de eigen reis, maar zonder dag-stempels en "sinds gisteren"; in plaats daarvan één regel: *"Dit wordt elke ochtend herberekend zodra Live actief is."* Geen blur, geen sloten — tonen wat er wél is.
- Prijsregels uit [PRICING_STRATEGY.md](PRICING_STRATEGY.md) §8 zijn bindend: prijs naast de reis ("€19,99 voor jouw 12 dagen"), actieve periode altijd zichtbaar, nooit "upgrade/abonnement/lid", geen countdowns — urgentie komt uit de reis en die is echt. De activatieknop is `--deep`, de belangrijkste knop van het product.

### 6.2 Dashboard (opgeslagen reizen)

Een plank met edities: per reis een witte kaart met bestemming, data en fase-indicator; de eerstvolgende reis dominant op volle breedte en — als Live actief is — met vlamrand en de "sinds gisteren"-regel als teaser. Reisarchief als rustige rij eronder.

### 6.3 Onboarding en preview

Flow blijft (Slice 1); restyle naar dit systeem bij de omschakeling (§9). De preview eindigt op het levende-paneel-in-preview-toestand uit §6.1 — registratie wordt gemotiveerd door wat er elke dag bij zou komen, niet door een accountmuur.

### 6.4 Lege en foutstaten

- Lege staat dashboard: de onboarding-CTA. "Nog geen reis. Vul je bestemming en data in — de preview is er in één minuut."
- Data-onzekerheid is een eerste-klas staat: "Zeegang: geen verse meting — advies op seizoensbeeld." Fouten in rood mét icoon en herstelactie (§2, regel 3). Nooit stilletjes doen alsof.

---

## 7. Motion

Eén georkestreerd moment: bij het openen van de dagview schuift het levende paneel subtiel in en licht de vlamrand één keer op. Verder alleen micro-transities (hover, uitklappen Plan B). Geen scroll-reveals, geen parallax. `prefers-reduced-motion` schakelt alles uit.

---

## 8. Wat we niet doen

- Geen crème, geen papier-texturen, geen hairline-grids als sfeer, geen serif — nergens.
- Geen tweede gradient naast de vlamrand; geen gekleurde illustraties of gradient-blobs.
- Geen dark mode in v1: zwart is betekenisdragend (= vandaag herberekend); een site-brede dark mode zou de materiaalregel vernietigen.
- Geen foto's op de dagview (die belooft een beslissing, geen sfeer); foto's horen bij regio- en previewpagina's, strak gekadreerd in de 16px-radius.
- Geen badges, streaks of gamification; terugkeer komt uit de "sinds gisteren"-regel.
- Geen countdowns of kunstmatige schaarste.

---

## 9. Volgorde van uitvoering

1. **Design-tokens omzetten** — `globals.css`: v1-palet (canvas/moss/clay/sand) vervangen door §2, serif-display eruit, Inter self-hosten. Dit raakt élk scherm en moet daarom vóór of mét Slice 3 gebeuren, in overleg met de bouwsessie (die heeft onafgemaakt Slice 2-werk openstaan).
2. **Dagview (Slice 3)** — de omgebouwde mock als referentie; hier komen Trip Pass-conversie en de noordster-metric samen.
3. **Trip Pass-activatiemoment** (§6.1) — zelfde componenten in preview-toestand.
4. **Dashboard** (§6.2).
5. **Homepage + onboarding restyle** — Slice 1 oogt na stap 1 al grotendeels goed mee (kleuren/typo zijn tokens), maar het living-trip-voorbeeldpaneel krijgt de vlamrand en de genummerde principekaarten (01/02/03) verliezen hun nummering — de drie principes zijn geen volgorde.
6. **`brand-mark.tsx`** vervangen door het echte logo (zwarte variant op wit, witte variant op zwart). **[TE VALIDEREN]** vectormaster (SVG/AI) van het logo — nodig voor scherpe iconen op elke maat én voor borduurwerk/druk van de kledinglijn; zo niet aanwezig, laten vectoriseren.

**Logo-assets:** `C:\Users\rwnhr\OneDrive\Desktop\Cascada Designs\Calor\` — zwarte variant (op wit) en witte variant (op donker); de losse vlam werkt als favicon/app-icoon.
