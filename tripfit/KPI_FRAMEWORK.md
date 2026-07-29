# Calor — KPI-framework

**Versie:** 1.0 — 14 juli 2026 · Bijlage bij [BUSINESS_PLAN.md](BUSINESS_PLAN.md)
**Markeringen:** **[FEIT]** · **[AANNAME]** · **[HYPOTHESE]** · **[TE VALIDEREN]**

Principe uit het businessplan (h. 16): **omzet alleen is een te traag en te grof signaal.** Dit framework meet eerst of het product een dagelijkse metgezel is, daarna of het geld verdient.

---

## 1. Noordster

> **Percentage reisdagen waarop de gebruiker Calor opent.**

**Definitie:** per afgeronde reis met Trip Pass of opgeslagen reis: (aantal kalenderdagen binnen de reisperiode waarop de gebruiker de reis opende) ÷ (totaal aantal reisdagen). Gerapporteerd als cohortgemiddelde per maand van vertrek.

**Interpretatiekader (11-daagse referentiereis):**

| Actieve dagen | % reisdagen | Betekenis |
| --- | ---: | --- |
| 1 dag | ~9% | statische reisgids |
| 2–3 dagen | ~18–27% | nuttig naslagwerk |
| 4–6 dagen | ~36–55% | sterk reisproduct |
| 7–10 dagen | ~64–91% | potentiële nieuwe categorie |

**Doel:** ≥ 40% (≈ 4–6 dagen bij 11 dagen) vóór het meetpunt april/mei 2027. **[HYPOTHESE]**

Waarom deze noordster: hij is niet te manipuleren met marketing, meet exact de belofte ("iedere dag opnieuw de beste opties") en voorspelt zowel betaalbereidheid als mond-tot-mond. Ondersteunend: "zou opnieuw gebruiken" en "zou aanbevelen" (lichte in-product-vraag na de reis).

---

## 2. KPI-boom

```text
NOORDSTER: % reisdagen geopend
├── GROEI: opgeslagen reizen per maand
│   ├── organisch verkeer (Radar)
│   ├── funnel-conversie stap 1–4
│   └── partner-aangeleverde reizen
├── RETENTIE: heropening & actieve dagen
│   ├── % opnieuw geopende reizen
│   ├── actieve dagen per reis
│   └── outcome-feedback per aanbeveling
├── MONETISATIE: revenue per active trip
│   ├── Trip Pass-conversie & tierverdeling
│   ├── affiliate CTR & opbrengst per reis
│   └── (later) B2B-allocatie
└── EFFICIËNTIE: contribution margin
    ├── variabele kosten per reis
    └── CAC per kanaal
```

---

## 3. Funnelmetrics (definities)

De tien stappen uit het businessplan (h. 15), met meetdefinitie. Streefwaarden zijn **[TE VALIDEREN]** — eerste benchmarks worden gezet na golf 1 (zachte lancering); er worden hier geen conversiepercentages verzonnen.

| # | Stap | Definitie | Eerste benchmark |
| --- | --- | --- | --- |
| 1 | Landing → trip start | % sessies op publieke pagina dat het reisformulier start | na golf 1 |
| 2 | Trip start → preview | % gestarte configuraties dat de preview bereikt | na golf 1 |
| 3 | Preview → account | % previews gevolgd door registratie | na Slice 2 live |
| 4 | Account → opgeslagen reis | % accounts met ≥ 1 opgeslagen reis | na Slice 2 live |
| 5 | Opgeslagen reis → heropening | % reizen dat ná de opslagsessie opnieuw geopend wordt | na Slice 2 live |
| 6 | Heropening → Trip Pass | % heropende reizen dat Live activeert | na okt 2026 |
| 7 | Trip Pass → affiliateklik | % Live-reizen met ≥ 1 uitgaande commerciële klik | na nov 2026 |
| 8 | Affiliateklik → boeking | conversie volgens partnerrapportage, waar meetbaar | per partner |
| 9 | Activiteit uitgevoerd | % aanbevelingen gemarkeerd als "gedaan" | na outcome-loop |
| 10 | Beoordeling | % uitgevoerde activiteiten met beoordeling; scoreverdeling | na outcome-loop |

**Meetregels:** elke stap krijgt een expliciete event-naam in analytics; stappen worden per cohort (maand van reis-aanmaak) gerapporteerd, niet als losse totalen; wijziging van een definitie = nieuwe metric-naam, nooit stille herdefinitie.

---

## 4. Doelen per meetmoment

| KPI | okt 2026 | jan 2027 | apr/mei 2027 (meetpunt) |
| --- | ---: | ---: | ---: |
| Opgeslagen reizen/mnd | 75 | 450 | 575–650 |
| Noordster (% reisdagen) | eerste meting | ≥ 30% | ≥ 40% **[HYPOTHESE]** |
| Actieve dagen per reis (11d-ref.) | eerste meting | ≥ 3 | ≥ 4 |
| Trip Pass-conversie | eerste meting | ≥ 8% | 8–12% |
| Revenue per active trip | — | ≥ €10 (betaalde reizen) | €15–€30 |
| Gemengde omzet per opgeslagen reis | — | ≥ €5 | ≈ €7,40 |
| Variabele kosten per reis | < €2 | < €2 | < €2 |
| Contribution margin | — | > 70% | > 85% |
| Organisch aandeel | > 80% | > 80% | > 70–80% |
| Maandomzet | ≈ €190 | ≈ €2.700 | €4.000–€4.500 |

Volumepad en omzetopbouw: [FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) §8. Alle tussenwaarden zijn **[AANNAME]**; het meetpunt-besluit (go/bijsturen/stop) staat in businessplan §27.4.

---

## 5. Koppeling KPI ↔ kritieke succesfactor

| Succesfactor (businessplan h. 23) | Bewakende KPI |
| --- | --- |
| 1. Aanbevelingen beter dan generieke lijsten | outcome-score; % "gedaan en goed" |
| 2. Gebruikers komen meerdere dagen terug | noordster; actieve dagen per reis |
| 3. Data actueel en betrouwbaar | leeftijd oudste bron per regio; meldingen onjuistheid |
| 4. Revenue per trip voldoende | revenue per active trip |
| 5. Variabele kosten laag | kosten per reis (data/AI/betaal apart) |
| 6. Distributie organisch/partners | organisch aandeel; CAC per kanaal |
| 7. Landuitbreiding herhaalbaar | doorlooptijd + kosten country pack 2 (meting jun 2027) |
| 8. Commercie raakt ranking niet | audit: 0 commissievelden in engine; klachtenmonitor |
| 9. Interface eenvoudiger dan techniek | taakvoltooiing onboarding (stap 1–2); supportvragen per 100 reizen |
| 10. Commercieel inzetbaar vóór herfst/winter | binaire mijlpaal: Trip Pass live ≤ half okt 2026 |

---

## 6. Dashboard en cadans

**Toplaag (wekelijks, één scherm):** de acht regels uit businessplan h. 25 — noordster, opgeslagen reizen/mnd, heropeningspercentage, Trip Pass-conversie, revenue per active trip, variabele kosten per reis, outcome-score, organisch aandeel.

**Cadans:**

| Ritme | Wat |
| --- | --- |
| Wekelijks | toplaag doornemen; funnel-stap met grootste terugval identificeren; één verbeteractie kiezen |
| Maandelijks | cohortanalyse (noordster + retentie per vertrekmaand); Radar-review (nieuwe zoekvraag → contentplanning); kosten per reis |
| Per kwartaal | aannameregister ([FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) §1) bijwerken: welke aannames zijn feiten geworden, welke gesneuveld; tooling-allocatie herzien |
| apr/mei 2027 | run-rate-meetpunt en go/bijsturen/stop-toets (businessplan §27.4) |

**Instrumentatie:** analytics-events per funnel-stap, GSC als Destination Demand Radar, betaalprovider-rapportage, affiliatenetwerk-rapportages, eigen database (reizen, activering, outcome). **[TE VALIDEREN]** definitieve analytics-inrichting bij Slice 2/3-bouw — meetinstrumentatie is onderdeel van de bouw (actieplan aug 2026), geen naschrift.

---

## 7. Anti-vanity-regels

1. **Paginaweergaven, volgers en impressies zijn geen KPI's** — ze zijn diagnostiek onder de groeitak.
2. **Geen gemiddelden zonder verdeling** waar de verdeling het verhaal is (noordster, actieve dagen): mediaan + spreiding rapporteren.
3. **Cohorten boven totalen:** een groeiend totaal kan een verslechterend product verbergen.
4. **Elke KPI heeft een eigenaar-actie:** als een metric twee reviews achtereen rood is zonder actie, wordt hij ofwel geactioneerd ofwel geschrapt uit de toplaag.
5. **Meet vóór je bouwt:** een feature zonder vooraf benoemde doel-KPI (besliskader: gebruik, terugkeer, conversie, omzet per reis of vertrouwen) start niet.
