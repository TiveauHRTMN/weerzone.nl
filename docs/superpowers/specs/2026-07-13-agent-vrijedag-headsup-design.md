# Vrije-dag heads-up & routine-schakelaar — dagplannen zonder dagelijks gezeur

**Status: GEBOUWD & LIVE 2026-07-13** (migratie gedraaid, deploy auto-gealiast
naar weerzone.nl, rooktest + cron-dry-run groen). Open: Rowans geauthenticeerde
e2e (regiekamer-pauzes, dagplan-invuller, eendags-moment) en de eerste echte
vrije-dag-push in het wild. Bewuste afwijkingen: vast 07:00–09:00-venster
i.p.v. notification_time; mail-CTA statisch; geen vervoer bij dagje weg — zie
het implementatieplan (2026-07-13-agent-vrijedag-headsup.md).
Ontstaan uit de e2e-review van plan 2 (heads-up gezicht): vaste momenten vangen
de 90%-dagen, maar missen afwijkingen (dagje weg, vrije dag, vakantie) — en
niemand vult die uit zichzelf vooraf in.

## 1. Doel

Piet kan ook op dagen zónder vaste routine relevant zijn, zonder dat de
gebruiker eraan hoeft te denken. De gebruiker krijgt op zulke dagen 's ochtends
één waarde-eerst bericht met een één-tik-mogelijkheid om plannen door te geven;
een doorgegeven dagje weg wordt een eendags-moment dat de bestaande motor
verder bewaakt.

## 2. Principes (hard)

1. **Over werk/routine komt nóóit een vraag.** De routine is één keer ingevuld
   (onboarding/regiekamer); Piet bewaakt hem stil. Een heads-up over je
   ochtendrit is hinderlijk — die bestaat niet.
2. **De vraag komt alleen op dagen waarop Piet niets weet**: geen actief
   moment vandaag (routine uit, vakantiestand, of gewoon een dag zonder
   momenten — voor de meesten dus het weekend).
3. **Waarde eerst, invullen optioneel.** De heads-up ís een weerbericht
   ("Vrije dag? Droog tot 15:00, daarna buien.") met als staart "Plannen? →".
   Niks invullen is een prima antwoord; het bericht was toch al nuttig.
4. **Opt-in en binnen het Piet-budget.** Zonder expliciete toestemming bestaat
   deze heads-up niet; hij telt mee in `headsup_budget` en `low`-gebruikers
   ("zo min mogelijk") krijgen hem nooit.
5. **Geen nieuwe motor.** Een ingevuld dagje weg is een gewoon
   `agent_moments`-rij (eendags); dedup, budget en bezorging lopen via de
   bestaande cron `agent-headsup-push`.

## 3. Onderdelen

### A. Routine-schakelaar + vakantiestand (regiekamer)

- **"Vaste routine" aan/uit** in de regiekamer: uit = rit-momenten
  (`kind: commute`) tellen niet mee, zonder ze te verwijderen (pauze, geen
  delete — de vensters blijven bewaard).
- **Vakantiestand**: "Ik ben er niet t/m [datum]" — pauzeert álle momenten en
  Piet-heads-ups tot die datum. Reed blijft aan (veiligheid gaat door).
- Beide zichtbaar als status in de regiekamer ("Routine gepauzeerd" /
  "Vakantie t/m 24 juli").

### B. Vrije-dag heads-up (opt-in)

- **Toggle** in regiekamer (en als slotvraag-chip in de onboarding):
  "Mag Piet je op vrije dagen 's ochtends vragen wat je gaat doen?"
- **Wanneer**: alleen op dagen zonder actief moment (principe 2), rond de
  bestaande `notification_time` van de gebruiker; via push als er een apparaat
  geregistreerd is, anders mee in het ochtendbericht (mail).
- **Inhoud**: dagoverzicht in Piets stem + één tik "Plannen vandaag? →" die
  naar de dagplan-invuller (C) leidt.
- **Budget**: telt als Piet-heads-up. `low` ⇒ nooit; `moments_only` ⇒ alleen
  als de toggle expliciet aan is gezet (de gebruiker vroeg er zelf om).

### C. Dagje weg → eendags-moment

- Lichtgewicht invuller (sheet op /vandaag of mijn-weerzone, ook bereikbaar
  vanuit de heads-up): waarheen (plaats-zoeker, mag leeg = "gewoon buiten"),
  globaal dagdeel (ochtend / middag / hele dag), eventueel vervoer.
- Resultaat: één `agent_moments`-rij met een **datum** in plaats van weekdagen
  (zie D), label bv. "Dagje weg — Zandvoort". De motor bewaakt hem zoals elk
  moment (omslag-push als het weer erop omslaat); na de datum is hij inert en
  ruimt een bestaande run hem op.
- Zelfde invuller doet ook "Vandaag vrij" (één tik): zet alleen de routine
  voor vandaag stil (eendags-pauze), maakt niets aan.

### D. Datamodel (migratie, via Rowan in de SQL editor)

- `agent_moments.date date null` — gezet ⇒ moment geldt alléén die datum en
  `days` wordt genegeerd. Motor-filter: `(date is null and weekday in days) or date = today`.
- `user_profile.routine_paused boolean default false` en
  `user_profile.paused_until date null` (vakantiestand).
- `user_profile.freeday_headsup boolean default false` (opt-in toggle B).

### E. Copy-richting (niet letterlijk)

- Heads-up: "Vrije dag? Tot een uur of drie blijft het droog, daarna komen er
  buien vanuit het westen. Plannen vandaag? →"
- Na invullen dagje weg: "Genoteerd — ik hou Zandvoort voor je in de gaten.
  Slaat het weer om, dan hoor je het van mij."
- Vakantiestand aan: "Fijne vakantie. Ik zwijg tot de 24e — alleen bij echt
  noodweer hoor je Reed."

## 4. Verificatie ("het moet ECHT werken")

1. Routine uit ⇒ geen commute-heads-ups meer; regiekamer toont pauze-status;
   weer aan ⇒ vensters staan er nog.
2. Gebruiker mét vrije-dag-toggle en zonder momenten vandaag krijgt rond zijn
   notification_time precies één heads-up; gebruiker zonder toggle krijgt niks.
3. `low`-budget krijgt de heads-up nooit, ook niet met toggle aan.
4. Dagje weg invullen ⇒ eendags-moment zichtbaar in regiekamer; weeromslag op
   die plaats/dag ⇒ omslag-push; dag erna is het moment weg/inert.
5. Vakantiestand ⇒ stilte van Piet/Koos t/m de datum, Reed-waarschuwing komt
   nog wel door.

## 5. Buiten scope

- Kans-momenten (was/tuin als "vandaag perfect droogweer"-melding zonder vast
  venster) — apart idee, genoteerd 2026-07-13, niet in dit blok.
- Herhalende uitzonderingen ("elke vrijdag vrij") — days-array in de
  regiekamer dekt dit al.
- Agenda-koppelingen (Google Calendar e.d.).

## 6. Implementatie-volgorde (één plan, na akkoord Rowan)

1. Migratie D + motor-filter (date-momenten, pauzes respecteren).
2. Regiekamer: routine-schakelaar, vakantiestand, vrije-dag-toggle.
3. Dagplan-invuller (C) op /vandaag + mijn-weerzone.
4. Heads-up-tak in de cron (B) + copy.
5. E2e met Rowan (geauthenticeerd, desktop + iPhone).
