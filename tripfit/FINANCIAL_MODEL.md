# Calor — Financieel model

**Versie:** 1.0 — 14 juli 2026 · Bijlage bij [BUSINESS_PLAN.md](BUSINESS_PLAN.md)
**Markeringen:** **[FEIT]** verifieerbaar · **[AANNAME]** rekenuitgangspunt · **[HYPOTHESE]** te toetsen · **[TE VALIDEREN]** placeholder, geen cijfer verzonnen

Dit model rekent bewust in **productgrootheden** (opgeslagen reizen, conversie, omzet per reis) en niet in marktaandeel, omdat betrouwbare marktcijfers voor NL/BE-reizigers naar de Caribbean nog onderzocht moeten worden. **[TE VALIDEREN]**

---

## 1. Aannameregister

Alle knoppen van het model op één plek. Wijzigt een aanname, dan wijzigt het hele model — nergens anders staan "verstopte" cijfers.

| # | Aanname | Waarde | Markering | Validatie |
| --- | --- | ---: | --- | --- |
| A1 | Gemiddelde Trip Pass-prijs | €19–€21 | **[AANNAME]** | werkelijke tierverdeling na lancering |
| A2 | Betaalconversie (opgeslagen reis → Trip Pass) | 8% / 12% / 15% | **[HYPOTHESE]** | funnel-stap 6, vanaf Fase 3 |
| A3 | Affiliate-opbrengst per opgeslagen reis | €3 / €5 / €8 | **[HYPOTHESE]** | klik- en boekingsdata, vanaf eerste programma |
| A4 | Variabele kosten per opgeslagen reis | < €2,00 | **[AANNAME]** | kostenmeting per reis in KPI-dashboard |
| A5 | Vaste jaarkosten | €1.500–€2.500 | **[AANNAME]** | werkelijke tarieven (KvK, boekhouding, verzekering) **[TE VALIDEREN]** |
| A6 | Betaalprovider-kosten | vast bedrag + % per transactie | **[TE VALIDEREN]** | offerte/tarieven gekozen provider |
| A7 | Reisduurverdeling betaalde reizen | piek in 9–14 dagen | **[HYPOTHESE]** | tierverdeling na lancering |
| A8 | Organisch aandeel acquisitie | > 80% | **[AANNAME]** | kanaalattributie |
| A9 | Betaalde acquisitie per reis (waar ingezet) | €0–€8 | **[AANNAME]** | CAC per kanaal |
| A10 | Allocatie gedeelde tooling aan Calor | 50% | **[AANNAME]** | herzien per kwartaal |

---

## 2. Trip Pass — prijsstructuur en gewogen gemiddelde

Tiers (uit [PRICING_STRATEGY.md](PRICING_STRATEGY.md)):

| Reisduur | Prijs | Aandeel betaalde reizen **[HYPOTHESE]** | Bijdrage |
| --- | ---: | ---: | ---: |
| 1–4 dagen | €7,99 | 5% | €0,40 |
| 5–8 dagen | €12,99 | 20% | €2,60 |
| 9–14 dagen | €19,99 | 50% | €10,00 |
| 15–21 dagen | €27,99 | 20% | €5,60 |
| 22–30 dagen | €34,99 | 5% | €1,75 |
| **Gewogen gemiddelde** | | | **≈ €20,35** |

De veronderstelde verdeling volgt het typische Caribbean-reispatroon (anderhalf à twee weken); het gewogen gemiddelde van ≈ €20 onderbouwt de €19–€21 in de scenario's. De werkelijke verdeling is een van de eerste metingen na betaallancering.

---

## 3. Unit economics per reis

### 3.1 Revenue per Active Trip

```text
Revenue per Active Trip =
Trip Pass-opbrengst
+ activiteitaffiliate
+ overige affiliate-opbrengst
+ B2B-allocatie
```

Rekenvoorbeeld voor een **betaalde** 11-daagse reis in scenario B-condities:

| Component | Bedrag | Toelichting |
| --- | ---: | --- |
| Trip Pass (tier 9–14) | €19,99 | eenmalig |
| Activiteitaffiliate | €4,00 | **[HYPOTHESE]** deel van A3 dat bij activiteiten valt |
| Overige affiliate (eSIM, verzekering, transfer) | €1,00 | **[HYPOTHESE]** |
| B2B-allocatie | €0,00 | fase 6, nu nul |
| **Revenue per Active Trip** | **€24,99** | binnen doelband €15–€30 |

### 3.2 Contribution Margin per Trip

```text
Contribution Margin per Trip =
Revenue per Active Trip
− datakosten
− AI-kosten
− betaalprovider
− variabele supportkosten
− acquisitiekosten
```

| Kostenpost | Bedrag | Toelichting |
| --- | ---: | --- |
| Datakosten (weer, geo, nieuws) | €0,30 | **[AANNAME]** — regio-dag-caching drukt dit; schaalt met regio's, niet gebruikers |
| AI-kosten | €0,25 | **[AANNAME]** — alleen presentatielaag; ranking deterministisch |
| Betaalprovider | €0,75 | **[TE VALIDEREN]** — indicatief vast + % op €19,99 |
| Variabele support | €0,20 | **[AANNAME]** — zelfbediening eerst |
| Acquisitie | €0,00–€8,00 | organisch €0; betaald max €8 (A9) |
| **Totaal variabel (organisch)** | **≈ €1,50** | onder de €2-doelstelling |

| Uitkomst | Organische reis | Betaald geworven reis (€8 CAC) |
| --- | ---: | ---: |
| Revenue per Active Trip | €24,99 | €24,99 |
| Variabele kosten | €1,50 | €9,50 |
| **Contribution** | **€23,49** | **€15,49** |
| **Contribution margin** | **≈ 94%** | ≈ 62% |

Conclusie: de >85%-doelmarge is alleen haalbaar bij overwegend organische acquisitie — dat maakt aanname A8 hard en verklaart de organisch-eerst-strategie in [GO_TO_MARKET.md](GO_TO_MARKET.md).

### 3.3 Gemengde omzet per opgeslagen reis (betaald + gratis)

De meeste opgeslagen reizen kopen géén pass maar leveren wel affiliatekansen:

| Scenario | Trip Pass p/reis | Affiliate p/reis | **Gemengd p/reis** |
| --- | ---: | ---: | ---: |
| A (8% × €19; €3) | €1,52 | €3,00 | **€4,52** |
| B (12% × €20; €5) | €2,40 | €5,00 | **€7,40** |
| C (15% × €21; €8) | €3,15 | €8,00 | **€11,15 + B2B** |

---

## 4. Kostenstructuur

### 4.1 Vaste kosten (jaarbasis, indicatief)

| Post | Laag | Hoog | Markering |
| --- | ---: | ---: | --- |
| KvK-inschrijving (eenmalig, jaar 1) | p.m. | p.m. | **[TE VALIDEREN]** actueel KvK-tarief |
| Boekhouding/administratie | €120 | €360 | **[TE VALIDEREN]** pakketkeuze |
| Domein + zakelijke e-mail | €25 | €75 | **[AANNAME]** |
| Verzekering | p.m. | p.m. | **[TE VALIDEREN]** offerte |
| Tooling-allocatie (zie 4.2) | €300 | €800 | **[AANNAME]** |
| Fotografie/content (projectmatig) | €0 | €500 | **[AANNAME]** alleen bij behoefte |
| Onvoorzien | €200 | €400 | **[AANNAME]** |
| **Totaal (excl. p.m.-posten)** | **≈ €650** | **≈ €2.150** | werkband A5: €1.500–€2.500 incl. p.m. |

### 4.2 Gedeelde kosten en allocatie

Vercel Pro, Supabase en AI-ontwikkeltooling worden gedeeld met de andere ondernemingen van de oprichter. **[FEIT]** Voor zuivere Calor-cijfers wordt 50% gealloceerd (A10), per kwartaal herzien op werkelijk gebruik. Zolang Calor binnen bestaande abonnementen past, is de *kasstroom*-impact ~€0 en is de allocatie boekhoudkundig.

**Financiële discipline (uit het businessplan):**

> Geen duurdere tooling voordat het product de upgrade betaalt.

Claude Max, betaalde data-API's en monitoringtools worden pas geactiveerd wanneer omzet of aantoonbare productiviteitswinst de meerkosten dekt. Elke tooling-upgrade krijgt een regel in het aannameregister met de omzetdrempel die hem rechtvaardigt.

### 4.3 Variabele kosten

Zie §3.2. Sturingsprincipe: **kosten schalen met regio's × dagen (caching), niet met gebruikers.** Daardoor daalt de variabele kost per reis naarmate het volume groeit — het omgekeerde van een typisch AI-product.

---

## 5. Scenario's doorgerekend

Scenariodefinities uit het businessplan (hoofdstuk 13). Alle bedragen per jaar; **aannames, geen garanties**.

| | **A — start** | **B — niche** | **C — speler** |
| --- | ---: | ---: | ---: |
| Opgeslagen reizen | 2.500 | 10.000 | 50.000 |
| Betaalconversie | 8% | 12% | 15% |
| Betaalde reizen | 200 | 1.200 | 7.500 |
| Gemiddelde Trip Pass | €19 | €20 | €21 |
| **Trip Pass-omzet** | **€3.800** | **€24.000** | **€157.500** |
| Affiliate per reis | €3 | €5 | €8 |
| **Affiliate-omzet** | **€7.500** | **€50.000** | **€400.000** |
| **B2B-omzet** | €0 | €0 | **€75.000** |
| **Totale omzet** | **€11.300** | **€74.000** | **€632.500** |
| Variabele kosten (€1,50/reis org.) | €3.750 | €15.000 | €75.000 |
| Vaste kosten (A5, midden) | €2.000 | €2.000 | €2.500 |
| **Indicatief resultaat vóór IB** | **≈ €5.550** | **≈ €57.000** | **≈ €555.000** |
| Marge | ≈ 49% | ≈ 77% | ≈ 88% |

Kanttekeningen:

- Scenario A haalt het €38.000-doel niet — het is het signaal om distributie bij te sturen, niet om te stoppen (product kan prima zijn; zie besliskader businessplan §27.4).
- Scenario B draagt het persoonlijke minimumdoel (§12.1) ruim. **Planningsdoel.**
- In scenario A drukken de vaste kosten en het lagere volume de marge onder de 85%-doelstelling; de doelmarge is een schaaleffect, geen startgarantie. **[AANNAME]**
- Scenario C veronderstelt fase 5+6 (meerlanden, B2B) en is geen planningsbasis.

---

## 6. Break-evenanalyse

```text
Break-even (opgeslagen reizen/jaar) =
vaste jaarkosten / contribution per opgeslagen reis
```

Contribution per opgeslagen reis = gemengde omzet per reis (§3.3) − variabele kosten (€1,50):

| Scenario-condities | Contribution p/reis | Break-even bij €1.500 vast | bij €2.000 | bij €2.500 |
| --- | ---: | ---: | ---: | ---: |
| A-condities (€4,52) | €3,02 | 497 reizen | 662 | 828 |
| B-condities (€7,40) | €5,90 | 254 reizen | 339 | 424 |

Zelfs onder de zwakste condities ligt break-even onder de 1.000 opgeslagen reizen per jaar (< 3 per dag). Het financiële risico van Calor is dus **niet verlies, maar opportuniteitskosten**: de tijd van de oprichter. Daarom sturen de PMF-metrics (actieve dagen per reis) op de go/bijsturen/stop-beslissing, niet de kaspositie.

---

## 7. Gevoeligheidsanalyse

Effect op jaaromzet rond scenario B (basis €74.000), één knop per keer:

| Knop | −koers | Basis | +koers |
| --- | ---: | ---: | ---: |
| Opgeslagen reizen (±25%) | 7.500 → €55.500 | 10.000 → €74.000 | 12.500 → €92.500 |
| Betaalconversie (8% ↔ 15%) | €66.000 | €74.000 | €80.000 |
| Affiliate per reis (€3 ↔ €8) | €54.000 | €74.000 | €104.000 |
| Trip Pass-prijs (±€2) | €71.600 | €74.000 | €76.400 |

Lezing:

1. **Affiliate-opbrengst per reis is de gevoeligste knop** (spreiding €50.000) — én de minst gevalideerde aanname (A3). Prioriteit 1 in validatie.
2. **Volume (opgeslagen reizen) is knop 2** — dit is de distributievraag; zie [GO_TO_MARKET.md](GO_TO_MARKET.md).
3. Prijs en conversie zijn fijnregeling: belangrijk, maar geen orde-van-grootte-verschil. Prijstesten hoeven dus niet vóór lancering perfect te zijn ([PRICING_STRATEGY.md](PRICING_STRATEGY.md)).

---

## 8. Pad naar het run-rate-doel (april/mei 2027)

Doel: €4.000–€4.500 maandomzet ≈ €48.000–€54.000 run rate, met zicht op ≥ €38.000 winst.

Terugrekenend onder B-condities (gemengd €7,40 per opgeslagen reis):

```text
€4.250 maandomzet / €7,40 per reis ≈ 575 opgeslagen reizen per maand
```

Indicatief groeipad (**[AANNAME]** — seizoenscurve volgt DR-hoogseizoen december–april **[FEIT]**):

| Maand | Opgeslagen reizen/mnd | Gemengd p/reis | Maandomzet (indicatie) |
| --- | ---: | ---: | ---: |
| sep 2026 (zachte lancering) | 30 | €0 (nog geen betaling) | €0 |
| okt 2026 (Trip Pass live) | 75 | €2,50 | ≈ €190 |
| nov 2026 (1e affiliate) | 150 | €4,00 | ≈ €600 |
| dec 2026 (hoogseizoen start) | 300 | €5,00 | ≈ €1.500 |
| jan 2027 (walvisseizoen) | 450 | €6,00 | ≈ €2.700 |
| feb 2027 | 500 | €6,50 | ≈ €3.250 |
| mrt 2027 | 550 | €7,00 | ≈ €3.850 |
| **apr/mei 2027 (meetpunt)** | **575–650** | **€7,40** | **≈ €4.250–€4.800** |

Dit pad veronderstelt dat de gemengde omzet per reis groeit terwijl het volume groeit (affiliates komen erbij, conversie verbetert). Beide moeten waar worden — het meetpunt in april/mei 2027 toetst ze afzonderlijk (volume én omzet per reis), zodat bijsturing gericht kan zijn.

**Seizoenswaarschuwing:** mei–oktober is het lage seizoen voor Caribbean-reizen vanuit NL/BE (orkaanseizoen juni–november **[FEIT]**). De run rate van april/mei mag niet lineair naar de zomer worden doorgetrokken; het jaardoel wordt beoordeeld op twaalfmaandsbasis.

---

## 9. Wat dit model níét doet

- Geen marktomvangschatting (TAM/SAM/SOM) — **[TE VALIDEREN]** met CBS/NBTC/DR-toerismedata voordat er investeerdersgesprekken zijn.
- Geen kasstroomprognose per maand — bij deze kostenstructuur (< €2.500 vast/jaar) is werkkapitaal geen knelpunt; wordt toegevoegd zodra er personeel, voorraad of B2B-betaaltermijnen ontstaan.
- Geen belastingberekening — het doel is gedefinieerd **vóór inkomstenbelasting**; fiscale optimalisatie (rechtsvorm, aftrekposten) is **[TE VALIDEREN]** met een fiscalist vóór KvK-inschrijving.
