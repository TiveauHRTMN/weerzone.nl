# Calor — Go-to-market

**Versie:** 1.0 — 14 juli 2026 · Bijlage bij [BUSINESS_PLAN.md](BUSINESS_PLAN.md)
**Markeringen:** **[FEIT]** · **[AANNAME]** · **[HYPOTHESE]** · **[TE VALIDEREN]**

Uitgangspunt uit het businessplan: distributie hoofdzakelijk **organisch of via partners** (kritieke succesfactor 6), met een harde grens van €0–€8 betaalde acquisitie per opgeslagen reis. De contribution-margin-doelstelling van >85% ([FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) §3.2) is alleen haalbaar bij overwegend organische instroom — organisch-eerst is dus een financiële noodzaak, geen voorkeur.

---

## 1. GTM in één zin

Calor wint verkeer op **specifieke, tijdgebonden Caribbean-zoekvragen** die grote platforms structureel slecht beantwoorden ("Samaná in januari", "Punta Cana bij regen"), converteert dat verkeer naar een **opgeslagen reis** via een persoonlijke preview, en laat het product zichzelf verkopen tijdens de reis.

---

## 2. Lanceervolgorde

| Golf | Wanneer | Kanaal | Doel |
| --- | --- | --- | --- |
| 0 — Zachte lancering | sep 2026 | eigen netwerk, NL/BE reis-communities, expatgroepen DR | eerste echte cohort, kwalitatieve feedback, bugbestrijding |
| 1 — SEO-basis | sep–nov 2026 | 10–15 hoogseizoenpagina's + Destination Demand Radar aan | eerste organische instroom vóór het boekseizoen |
| 2 — Hoogseizoen | dec 2026–apr 2027 | SEO-uitbouw + social-cadans + eerste partnerpilots | volumegroei richting 575 reizen/mnd (meetpunt apr/mei) |
| 3 — Partnerschaal | vanaf mrt 2027 | reisbureaus, creators, accommodaties | tweede distributielijn naast SEO |

**Timing-logica:** NL/BE-reizigers boeken hun winterse Caribbean-reis grotendeels in het najaar; content moet dus in september–november live en geïndexeerd zijn om het boekseizoen te vangen. **[HYPOTHESE — boekingswindow te valideren via Radar-data]** Dit is dezelfde deadline als kritieke succesfactor 10 (commercieel inzetbaar vóór herfst/winter).

---

## 3. SEO — het hoofdkanaal

### 3.1 Paginatypen

Publieke pagina's rond: bestemmingen, regio's, activiteiten, seizoenen, reizen met kinderen, weersafhankelijke activiteiten, tijdelijke kansen en exacte reisperioden.

| Type | Patroon | Voorbeeld | Uniek datavoordeel |
| --- | --- | --- | --- |
| Land | `/dominicaanse-republiek` | overzicht + seizoenen | **[FEIT]** bestaat (Slice 1) |
| Regio | `/dominicaanse-republiek/[regio]` | Samaná/Las Terrenas | **[FEIT]** 13 pagina's live |
| Regio × maand | regio + reisperiode | Samaná in januari | seizoensbeeld + weerprofiel + activiteitenpassing uit eigen data |
| Activiteit × seizoen | activiteit + periode | walvissen spotten in februari | Temporal Activity Graph |
| Weer-conditioneel | "bij regen / bij wind" | wat te doen in Punta Cana bij regen | Weather-to-Activity Graph — vrijwel geen concurrent beantwoordt dit |
| Gezelschap | regio + kinderen | Santo Domingo met kinderen | leeftijdspassing uit de engine |
| Vergelijking | keuzevragen | beste regio's in de Dominicaanse Republiek | onafhankelijke ranking |

### 3.2 Thin-content-poort

Harde publicatieregel: **elke pagina beantwoordt zelfstandig een vraag met eigen data** (seizoensbeeld, weerprofiel, activiteitenpassing). Kan een pagina dat niet, dan wordt hij niet gepubliceerd — geen programmatische lege hulzen. Kwaliteit per pagina weegt zwaarder dan aantal pagina's; de engine-data maakt pagina's mogelijk die concurrenten niet kúnnen schrijven, en dát is het SEO-voordeel.

**[FEIT]** Technisch fundament staat: canonicals, breadcrumbs, JSON-LD, robots, sitemap; persoonlijke previews zijn `noindex`.

### 3.3 Destination Demand Radar

Google Search Console wordt gebruikt als **Destination Demand Radar**. Gemeten: impressies, zoektermen, CTR, positie, seizoensvraag, bestemmingsvraag, conversie naar opgeslagen reizen.

De Radar heeft drie functies:

1. **SEO-sturing** — welke pagina's uitbreiden, welke zoekintenties onbeantwoord zijn;
2. **Roadmap-sturing** — welke regio's van BASIC naar STANDARD/FLAGSHIP promoveren, en welk land na de DR komt (aangetoonde vraag in plaats van onderbuik);
3. **Seizoenskalender** — wanneer welke vraag piekt, als input voor de contentplanning van jaar 2.

### 3.4 Contentproductie

De engine zelf is de contentfabriek: seizoensbeelden, weerprofielen en activiteitenpassing per regio bestaan al als data en worden redactioneel afgewerkt in plaats van vanaf nul geschreven. Doel-cadans: 3–5 nieuwe of verdiepte pagina's per week in golf 1–2 zonder de bouw te verdringen. **[AANNAME]**

---

## 4. Social media — het bewijs-kanaal

Social is geen acquisitiemachine maar het geloofwaardigheidskanaal: het laat dagelijks zien dat Calor iets weet wat statische bronnen niet weten.

Formats (uit het businessplan):

- korte destination intelligence;
- seizoenscontent;
- tijdelijke kansen ("dit kan alleen deze weken");
- weather-to-activitycontent ("morgen 25 knopen in Cabarete — dit doe je wél");
- lokale context;
- voorbeelden van dagelijkse aanbevelingen — **het product als content**.

Sturingsprincipes:

- de productoutput is de contentbron → marginale contentkosten ≈ €0;
- kanaalkeuze volgt de doelgroep (NL/BE-reizigers): **[TE VALIDEREN]** welk platform de doelgroep het best bereikt; starten waar de oprichter kan volhouden, meten, dan concentreren;
- social verwijst altijd naar één actie: *maak je reis aan* — geen losse virality zonder funnel-ingang.

---

## 5. Partnerships — de tweede lijn

Details en volgorde in [PARTNERSHIP_STRATEGY.md](PARTNERSHIP_STRATEGY.md); GTM-rol per partnertype:

| Partner | GTM-rol | Wanneer |
| --- | --- | --- |
| Caribbean-creators | bereik + geloofwaardigheid bij precies de juiste doelgroep | vanaf golf 2 |
| Reisbureaus / Caribbean-specialisten | Calor als service-laag bij hun klantreizen (pilot: preview meegeven bij boeking) | pilots vanaf mrt 2027 |
| Lokale accommodaties | QR/link "jouw verblijf, jouw levende reis" richting gasten | vanaf golf 2, flagship-regio's |
| Excursieaanbieders | wederzijds: zij leveren actualiteit, Calor levert gekwalificeerde vraag | na eerste affiliate-fase |
| Toerismeorganisaties & communities | autoriteit, backlinks, expatnetwerk DR | doorlopend, laag volume |

---

## 6. Funnel-activatie per stap

De funnel (businessplan h. 15) met per stap het GTM-instrument:

| Stap | Instrument |
| --- | --- |
| Landing → trip start | paginatype matcht zoekintentie; één CTA: "maak je reis aan" |
| Trip start → preview | progressieve onboarding, geen accountdwang **[FEIT — gebouwd]** |
| Preview → account | de preview toont wat "live" zou zijn: gepersonaliseerde waarde als registratiereden |
| Account → opgeslagen reis | opslaan = default-afronding van de flow |
| Opgeslagen reis → heropening | e-mail op sleutelmomenten (reis nadert, seizoen verandert); meldingen na opt-in |
| Heropening → Trip Pass | "Activeer Live voor deze reis" op het moment dat de reis < 14 dagen weg is — het moment van maximale relevantie |
| Trip Pass → affiliateklik | aanbevelingen koppelen aan boekbare acties, transparant gemarkeerd |
| Boeking → outcome | lichte feedbackvraag per uitgevoerde activiteit (1 tik, geen formulier) |

---

## 7. Betaalde acquisitie — de uitzondering

Alleen binnen de €0–€8-grens per opgeslagen reis, en alleen voor:

1. **prijstest-verkeer** (kleine budgetten om conversiehypotheses sneller te toetsen dan organische groei toelaat);
2. **seizoenspieken** waar organische posities nog niet gevestigd zijn (bijv. walvisseizoen jan–mrt 2027).

Nooit voor structureel volume: als de organische motor het volume niet levert, is dat een productsignaal (of SEO-signaal), geen advertentiebudget-signaal. **[AANNAME — besliskader]**

---

## 8. GTM-kalender (12 maanden)

Gedetailleerd actieplan per maand: businessplan hoofdstuk 26. GTM-hoogtepunten:

| Periode | GTM-mijlpaal |
| --- | --- |
| sep 2026 | zachte lancering; Radar aan; eerste 10–15 SEO-pagina's |
| okt 2026 | Trip Pass live; social-cadans start |
| nov 2026 | eerste affiliate-aanvraag met aantoonbaar klikvolume |
| dec 2026–feb 2027 | hoogseizoen-sprint: SEO-uitbouw, walvisseizoen-content, conversie-optimalisatie |
| mrt 2027 | drie partnerpilots afgesproken |
| apr/mei 2027 | run-rate-meetpunt → go/bijsturen/stop (businessplan §27.4) |

---

## 9. GTM-metrics

| Metric | Doel | Bron |
| --- | --- | --- |
| Organisch aandeel nieuwe opgeslagen reizen | > 80% **[AANNAME]** | attributie |
| Impressies + clicks op doeltermen | groeiend per maand | Radar (GSC) |
| Landing → trip start | **[TE VALIDEREN]** eerste benchmark na golf 1 | analytics |
| Opgeslagen reizen per maand | pad uit [FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) §8 (30 → 575) | database |
| CAC waar betaald | ≤ €8 | kanaalrapportage |
| Partner-aangeleverde reizen | meetbaar per partnercode | attributie |

Definities en dashboard: [KPI_FRAMEWORK.md](KPI_FRAMEWORK.md).
