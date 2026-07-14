# Calor — Prijsstrategie

**Versie:** 1.0 — 14 juli 2026 · Bijlage bij [BUSINESS_PLAN.md](BUSINESS_PLAN.md)
**Markeringen:** **[FEIT]** · **[AANNAME]** · **[HYPOTHESE]** · **[TE VALIDEREN]**

---

## 1. Prijsmodel: Trip Pass, geen abonnement

Calor Live wordt verkocht als **eenmalige Trip Pass per reis**. Het woord *abonnement* wordt nergens gebruikt — niet in de UI, niet in marketing, niet in voorwaarden.

Waarom per reis en niet per maand:

1. **Het matcht de werkelijkheid van de klant.** Een Caribbean-reis is een afgebakende gebeurtenis; niemand wil een doorlopende verplichting voor een tweewekelijkse ervaring. Een abonnement dwingt tot opzeggen; een pass is klaar wanneer de reis klaar is.
2. **Het matcht de waarde-curve.** De waarde van live intelligence is extreem geconcentreerd: 14 dagen vóór vertrek t/m 2 dagen na terugkomst. Precies dát is de actieve periode van de pass.
3. **Het verlaagt de drempel.** €19,99 eenmalig voor een reis van duizenden euro's is een impulsbeslissing; €x/maand is een contractbeslissing.
4. **Het voorkomt churn-boekhouding.** Geen MRR-optiek die niet past bij seizoensgedreven gebruik; de relevante metric is revenue per active trip ([FINANCIAL_MODEL.md](FINANCIAL_MODEL.md)).

**Commerciële formulering (vast):**

> **Activeer Live voor deze reis.**

---

## 2. Tierstructuur

Prijs schaalt met reisduur — de eerlijkste proxy voor geleverde waarde (aantal dagen dagelijkse herberekening):

| Reisduur | Richtprijs | Prijs per reisdag (midden tier) |
| --- | ---: | ---: |
| 1–4 dagen | €7,99 | ≈ €3,20 |
| 5–8 dagen | €12,99 | ≈ €2,00 |
| 9–14 dagen | €19,99 | ≈ €1,74 |
| 15–21 dagen | €27,99 | ≈ €1,56 |
| 22–30 dagen | €34,99 | ≈ €1,35 |

Ontwerpprincipes achter de tabel:

- **Dalende dagprijs** beloont langere reizen en voelt rechtvaardig; de marginale kostprijs per extra dag is voor Calor vrijwel nul, dus elke tier blijft > 85% marge. **[FEIT — kostenstructuur]**
- **De 9–14-daagse tier is het anker** (€19,99): de typische Caribbean-reisduur **[HYPOTHESE — te valideren via tierverdeling]**, en de prijs waaraan de scenario's rekenen (gemiddeld €19–€21).
- **Psychologische referentie:** de pass kost minder dan één excursie voor één persoon. Die vergelijking ("minder dan je goedkoopste excursie, betere keuzes voor álle excursies") is de kern van de prijscommunicatie. **[AANNAME]**
- Actieve periode is onderdeel van de waardepropositie, niet van de prijsstaffel: elke tier krijgt dezelfde 14 dagen vooraf + 2 dagen na afloop.

---

## 3. Waarom niet gratis / goedkoper / duurder

| Alternatief | Waarom afgewezen |
| --- | --- |
| Alles gratis + alleen affiliates | maakt de ranking verdacht (verdienen aan de klik) en laat de meest overtuigde gebruikers — die op reis dagelijks terugkomen — onbetaald; strijdig met succesfactor 8 |
| Freemium-abonnement | contractdrempel, churn-administratie, past niet bij event-gedreven gebruik (zie §1) |
| Fors duurder (€49+) | verlaat het impulsdomein; vereist bewijs vóór aankoop dat een nieuw merk nog niet heeft; kan later heroverwogen worden bij bewezen outcome-data **[HYPOTHESE]** |
| Per-persoon-prijs | strafmaatregel op gezinnen — exact de kerndoelgroep; gezinsdeling zit bewust ín de pass |

---

## 4. Gratis laag — de bewuste ondergrens

De gratis laag (businessplan §5.1) is ruim genoeg om waarde te bewijzen en SEO te voeden, maar mist structureel wat de reis *tijdens de reis* waardevol maakt: dagelijkse herberekening, beste-keuze-vandaag, Plan B, meldingen, Country Pulse.

De grens tussen gratis en Live ligt op één principe:

> **Gratis = begrijpen wat je reis wordt. Live = elke dag weten wat je vandaag moet doen.**

Feature-beslissingen toetsen aan dit principe voorkomt sluipende ontwaarding van de pass (feature-creep richting gratis) én een te schrale gratis laag (die de funnel doodt).

---

## 5. Prijstests en validatie

Volgorde van validatie (vanaf Trip Pass-lancering, okt 2026):

| Test | Vraag | Methode | Metric |
| --- | --- | --- | --- |
| 1. Tierverdeling | klopt de veronderstelde reisduurverdeling (piek 9–14)? | meten, geen experiment | verdeling betaalde passes |
| 2. Ankerprijs | converteert €19,99 in de kern-tier? | eerste cohortmeting | betaalconversie per tier |
| 3. Prijsgevoeligheid | wat doet ±€3 op het anker? | A/B zodra volume het toelaat **[TE VALIDEREN — minimaal benodigde steekproef]** | conversie × omzet per reis |
| 4. Momentgevoeligheid | converteert "14 dagen vóór vertrek" beter dan direct na opslaan? | timing-experiment op de aanbieding | conversie per aanbiedingsmoment |
| 5. Bundelwaarde | welke Live-features dragen de koopbeslissing? | enquête + gebruiksdata betaalde reizen | feature-gebruik per pass |

Discipline: **prijs is fijnregeling, geen hoofdknop.** De gevoeligheidsanalyse ([FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) §7) laat zien dat ±€2 op de pass ±€2.400 jaaromzet scheelt in scenario B, terwijl affiliate-per-reis en volume tienduizenden euro's bewegen. Prijstests mogen dus nooit de bouw- of distributieprioriteit verdringen.

---

## 6. Kortingen en acties

- **Geen structurele kortingen.** Een pass van €19,99 die "eigenlijk €29,99" is, traint gebruikers om te wachten en ondergraaft prijsintegriteit.
- **Wel toegestaan:** partner-arrangementen (bijv. reisbureau koopt passes in bulk voor klanten — B2B-prijsmodel, [PARTNERSHIP_STRATEGY.md](PARTNERSHIP_STRATEGY.md)), en een lanceerprijs mits expliciet tijdelijk en eenmalig gemarkeerd. **[AANNAME]**
- **Restitutiebeleid:** **[TE VALIDEREN]** — juridisch kader (herroepingsrecht bij digitale diensten met directe levering) uitwerken vóór betaallancering; klanttevredenheidsgebaar ("niet gebruikt, geld terug") als merkkeuze overwegen.

---

## 7. Toekomstige prijslagen (niet nu)

Pas relevant ná bewezen kernmodel; hier alleen geparkeerd zodat ze de huidige eenvoud niet vervuilen:

| Laag | Idee | Voorwaarde |
| --- | --- | --- |
| B2B per reis / white-label | reisbureau betaalt per aangemaakte of actieve Live-reis; jaarlijkse minimumafname | fase 6; retentie bewezen |
| API-/datalicentie | geaggregeerde vraag- en outcome-inzichten | datalagen (businessplan h. 17) volwassen |
| Meerlanden-pass | één reis door meerdere Caribbean-landen | fase 5; multi-country routes bestaan |
| Loyaliteit | terugkerende reiziger-voordeel i.p.v. korting | herhaalgebruik meetbaar |

---

## 8. Prijscommunicatie — regels

1. Altijd **"Activeer Live voor deze reis"** — nooit "upgrade", "abonneer", "word lid".
2. Prijs altijd naast de reis tonen ("€19,99 voor jouw 12 dagen"), nooit als losse tarieventabel in de betaalflow.
3. De vergelijking is altijd met de reis zelf (één excursie, één diner), nooit met andere software.
4. De actieve periode (14 dagen vooraf t/m 2 dagen na) staat bij elke prijsvermelding — het is de helft van de waardepropositie.
5. Geen countdown-timers, geen kunstmatige schaarste. Urgentie komt uit de reis zelf ("je vertrekt over 9 dagen"), en die is echt.
