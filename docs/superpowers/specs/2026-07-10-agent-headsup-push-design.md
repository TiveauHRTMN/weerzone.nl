# Agents die je opzoeken — heads-up-push, slim profiel & regiekamer

**Datum:** 2026-07-10 · **Status:** plan 1 (de motor) LIVE 2026-07-11 — migratie gedraaid, cron geregistreerd, test-push e2e bevestigd op 2 apparaten, dry-run correct stil bij droog weer; open observaties: eerste echte omslag-push (dedup/budget in het wild) en Reed-all-clear bij een aflopende waarschuwing. Plan 2 (onboarding/PWA/regiekamer) nog te plannen.
**Vervolg op:** `docs/handoff-agents-abonnementen-2026-07-10.md` (blok a/b/c live)

## 1. Doel

**Noordster (Rowan): "Alsof je altijd je eigen meteo-team bij je hebt."**

Piet, Reed en Koos worden agents die de gebruiker **opzoeken** in plaats van
afwachten: door de dag heen pushnotificaties met concrete heads-ups, gefilterd
op het persoonlijke ritme van de gebruiker. Bij onboarding en in Mijn Weerzone
alleen de vragen die er écht toe doen — daarna werken de agents vóór je. Weerzone blijft 48 uur weer — de
agents voegen daar het hyperpersoonlijke karakter aan toe. Later smelten de
drie agents samen in een Weerzone Pro-abonnement; alles in dit ontwerp hangt
daarom aan `agent_subscriptions` (Pro = later één gate, geen verbouwing).

**Rowans eis: het moet ECHT werken.** Verificatie is een ontwerponderdeel
(test-push-knop, handmatige triggers, e2e op een echt toestel), geen sluitpost.
Les van juni: de proactieve laag stond "af" maar dood op prod.

## 2. Principes (hard)

- **Nul LLM per abonnee/push.** Agents zijn pure wiskunde over
  `buildAgentContext`; de LLM-duiding blijft 1×/dag per regio. O(plaatsen).
- **Stilte als feature.** Strak budget; elke push moet een concrete actie
  bevatten (bestaande ontwerpregel "geen heads-up zonder concrete actie").
  Vertrouwen bouw je met wat je níét stuurt.
- **48u-venster**, geen horizon erbuiten. Geen chat-per-agent, geen vierde
  persona, geen e-mail als heads-up-kanaal (mail blijft: Piets ochtendritueel,
  Reeds alerts, Koos' do-nudge).
- **Niet burgerlijk.** De onboarding-vragen komen uit Piets mond, in
  karakter, drie stuks, chips om te tikken — geen formulier.
- **Toon**: net Nederlands, geen meteo-jargon, geen bronnamen (KNMI/Mariana)
  in copy, decimalen met komma.
- **Privacy**: geen agenda-koppeling, geen achtergrond-GPS. Pushes gelden voor
  de **abonnementsplaats(en)**; GPS bepaalt alleen de getoonde plaats bij
  sitebezoek (bestaand gedrag).

## 3. Onderdelen

### A. Bezorg-motor: cron `agent-headsup-push`

Nieuwe route `/api/cron/agent-headsup-push`, elke 30 min in `vercel.json`
(Reeds `reed-alert-email` blijft onaangeroerd — veiligheid houdt een eigen
faalpad).

Per run:
1. Actieve push-abonnementen (`agent_subscriptions`, channel `push`) voor
   piet en koos laden; groeperen per unieke plaats.
2. Per plaats: `buildAgentContext` → `orchestrateAgents` (pure agents,
   `includeVoices: false`). De bestaande `coordinate()`-handoff geldt: bij
   Reed-gevaar vervallen Piets outdoor-invites. Reed-heads-ups worden hier
   **niet** gepusht (eigen cron).
3. Kandidaat-heads-ups filteren:
   - severity `useful` of hoger; `validUntil` in de toekomst; `validFrom`
     binnen 12 uur (actueel);
   - **momenten-filter** (zie C): raakt de heads-up een moment van deze
     gebruiker, dan gaat hij voor; generieke omslagen (droog→nat, nat→droog,
     zon-window) mogen ook zonder moment, binnen het budget;
   - **spelregels**: Piet max 3/dag per gebruiker, bezorgvenster 07:00-22:00
     NL; Koos max 1/dag, alleen do/vr/za; dedup via `agent_headsup_log`.
4. Versturen via bestaande `activePushDevices` + `sendPushToDevice`
   (`src/lib/push.ts`), met `tag = "<agent>:<province>/<slug>"` zodat
   opeenvolgende pushes van dezelfde agent elkaar op het toestel vervangen.
5. Loggen in `agent_headsup_log` (dedup + dagbudget-count).

### B. Datamodel

**`agent_headsup_log`** (dedup + budget; patroon = `reed_warning_alerts`):
`id, user_id (auth.users, cascade), agent, province, place_slug, headsup_key,
category, severity, sent_at`. Uniek op `(user_id, headsup_key)`.
`headsup_key = "<agent>|<category>|<province>/<slug>|<validFrom afgerond op uur>"`.
RLS: service-role-only (geen policies voor anon/authenticated, revoke all).
Dagbudget = count op `(user_id, agent, sent_at::NL-dag)`.

**`agent_moments`** (het persoonlijke ritme):
`id, user_id (auth.users, cascade), kind (commute|dog|outdoor|laundry|sport|custom),
label (NL, door gebruiker aanpasbaar), days (int[] 1=ma..7=zo),
window_start (time), window_end (time), transport (bike|ov|car|none, alleen
commute), created_at, updated_at`.
RLS: owner-only lezen/schrijven (patroon `agent_subscriptions`), service role
leest in de cron. Onboarding-antwoorden worden direct als momenten-rijen
opgeslagen — geen aparte antwoorden-opslag; de regiekamer bewerkt de momenten
zelf. Auto's krijgen géén spits-regenpushes (alleen Reed bij gladheid/storm);
`transport` filtert dat.

Beide migraties via de Supabase SQL editor; alle code fail-soft zolang de
tabellen ontbreken.

### C. Slim profiel: drie vragen in de onboarding (in Piets stem)

In de bestaande flow `(site)/app/onboarding` (na de postcode-stap), chips om
te tikken, overslaan mag:

1. **"Hoe beweeg jij meestal door de dag?"** — fiets / OV / auto / ik werk
   thuis → commute-moment(en) met vervoerstype; vervolgchip voor grof
   vertrek-/thuiskomvenster (vóór 8 · 8-9 · na 9 / rond 17 · rond 18 · later).
2. **"Wat doe jij buiten?"** — hond uitlaten / hardlopen of sporten / was
   drogen / tuin / weinig → per keuze een moment met standaardvenster
   (hond: ~7:30 & ~21:30; sport: flexibel → "beste moment"-pushes; was:
   overdag-venster op vrije dagen).
3. **"Wanneer wil je Piet zeker horen?"** — alleen als het mijn plannen
   raakt / bij elke omslag / zo min mogelijk → zet het persoonlijke budget
   (momenten-only · standaard (3/dag) · max 1/dag).

Elk antwoord wordt zichtbaar beloond met een voorbeeldpush ("Dan zeg ik
's ochtends: *regenpak mee om 8:10, je rijdt door een bui heen*"). Antwoorden
zijn `agent_moments`-rijen; bewerken kan in de regiekamer.

### D. PWA-installatiestap (poort naar alles)

Op **iPhone werkt web-push alléén als de site op het beginscherm staat**
(A2HS). Daarom:
- Onboarding-stap "Zet Weerzone op je telefoon": Android/Chrome via
  `beforeinstallprompt`; iOS via korte instructie (deelknop → Zet op
  beginscherm) met detectie of het al gebeurd is (`display-mode: standalone`).
- `public/manifest.json` bestaat; controleren dat hij in de root-layout
  gelinkt is (+ icons/start_url kloppen), anders koppelen.
- Zelfde install-nudge op de plek waar iemand Reed/Piet-push aanzet zonder
  standalone-modus op iOS.

### E. "Jouw agents"-blok (plaatspagina's + /vandaag)

De losse `AgentSubscribeCard` + `ReedPushCard` worden één blok met drie rijen
voor de getoonde plaats: **Piet** (ochtendmail ✓ + heads-ups ✓), **Reed**
(waarschuwingen ✓), **Koos** (uitjes ✓). Ingelogd = one-tap per rij;
uitgelogd = bestaande magic-link-flow (e-mailveld, één keer). PostHog-events
(`subscribe_shown/started/confirmed`) blijven, met `channel` erbij.

### F. Regiekamer in Mijn Weerzone

De bestaande agents-sectie groeit naar:
- alle abonnementen per plaats × kanaal, aan/uit (zet `unsubscribed_at`);
- de eigen momenten (uit C) bekijken/bewerken/toevoegen;
- gekoppelde apparaten (n actief) + **test-push-knop**: endpoint
  `/api/agents/test-push` (ingelogd, stuurt testnotificatie naar eigen
  apparaten) — bewijs dat de keten werkt zonder op noodweer te wachten;
- de landelijke account-toggles (piet_on/reed_on/koos_on) blijven de fallback,
  maar de per-plaats-rijen zijn leidend in de UI.

Dit paneel is later letterlijk de Pro-bundelpagina.

### G. Reed maakt af waar hij aan begint (all-clear)

In de bestaande `reed-alert-email`-cron: als een eerder gepushte waarschuwing
(rij in `reed_warning_alerts` met kanaal push) afloopt of door KNMI wordt
ingetrokken → één afmeldingspush: "Voorbij. Komende uren rustig weer."
Dedup via `warning_key + "|clear"` in dezelfde tabel. Alleen voor
waarschuwingen waarvoor de gebruiker ook de oorspronkelijke push kreeg.

## 4. Copy-voorbeelden (richting, niet letterlijk)

- Piet, commute-fiets: "Regenpak mee om 17:30 — je fietst door een bui heen.
  Om 18:15 is het droog."
- Piet, hond: "Laat 'm vóór 21:00 uit. Daarna regent het tot middernacht."
- Piet, was: "Tussen 10:00 en 16:00 perfect droogweer. Daarna niet meer."
- Piet, omslag zonder moment: "Vanaf 15:00 wordt het nat in Winkel — wat je
  buiten doet, doe het ervoor."
- Koos: "Zaterdag: 24° en droog bij het strand van Castricum. Hier blijft het
  bewolkt — de moeite waard."
- Reed all-clear: "De hagel is overgetrokken. Komende uren rustig weer."

## 5. Verificatie ("het moet ECHT werken")

1. Migraties via SQL editor, daarna service-role + anon-key REST-check
   (anon → permission denied).
2. `npx tsc --noEmit` (eigen bestanden schoon) + `npm run build`.
3. Test-push-knop → notificatie op Rowans toestellen (2 geregistreerd).
4. Cron handmatig triggeren met een geforceerd moment (regen in de tijdlijn
   van Winkel) → echte heads-up-push, daarna dedup-bewijs (tweede run pusht
   niet opnieuw).
5. Budget-bewijs: >3 kandidaten op één dag → maximaal 3 verstuurd.
6. iOS-pad: installatiestap doorlopen, push ontvangen in standalone-modus.
7. PostHog: events voor push_sent (per agent/category), onboarding-antwoorden
   (geaggregeerd, geen momentinhoud).

## 6. Buiten scope

Chat-per-agent · vierde persona · >48u · e-mail als heads-up-kanaal ·
achtergrond-GPS/geofencing · agenda-koppeling · pricing/paywall (pas na KvK;
datamodel is er klaar voor).

## 7. Implementatie-volgorde (twee plannen)

1. **Plan 1 — de motor**: `agent_headsup_log` + `agent_moments` (migraties),
   cron `agent-headsup-push` met spelregels/budget/dedup, Reed-all-clear,
   `/api/agents/test-push`. Verifieerbaar zonder nieuwe UI (momenten via SQL
   inzetbaar voor de test).
2. **Plan 2 — het gezicht**: onboarding-vragen + PWA-installatiestap,
   "Jouw agents"-blok, regiekamer-uitbreiding in Mijn Weerzone.
