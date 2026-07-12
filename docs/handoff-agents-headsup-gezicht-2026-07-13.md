# Handoff — heads-up gezicht (plan 2) LIVE, e2e + afronding (start 2026-07-13)

## Waar we staan (avond 2026-07-12, alles gecommit op `feat/studio-tiktok-autopost`)

### Vandaag afgerond en GEDEPLOYD
**Plan 2 ("Agent heads-up gezicht") is volledig gebouwd, gereviewd en live op
weerzone.nl.** Plan: `docs/superpowers/plans/2026-07-11-agent-headsup-gezicht.md`;
voortgangsledger: `.superpowers/sdd/progress.md` (git-ignored).

- **T1** `b1cbf2d` — PWA-fundament: manifest + appleWebApp in root-metadata,
  `beforeinstallprompt` gevangen in instrumentation-client, `PwaInstallCard`
  (Android-prompt / iOS-A2HS-instructie / standalone-detectie, `tone`-prop
  voor licht/donker).
- **T2** `315d6da` + fix `283a056` — momenten-types gesplitst
  (`moments-shared.ts`), browser-CRUD (`moments-client.ts`) incl.
  `buildOnboardingMoments`; `replaceOnboardingMoments` is insert-eerst
  (geen dataverlies bij mislukte insert).
- **T3** `dca24ed` — `user_profile.headsup_budget` (migratie 20260712,
  **gedraaid op prod**), motor-handhaving (moments_only-filter, low → piet
  max 1), `captureServerEvent` + `push_sent`-event in de cron.
- **T4** `8295813` — onboarding 7 stappen: Piets drie vragen als chips
  (vervoer→vertrek/thuis-vensters, buiten-doen multi-select, budget) met
  zichtbare voorbeeldpush-beloning per antwoord + PWA-slotstap; antwoorden →
  `agent_moments`-rijen + budget; geaggregeerd `onboarding_profile`-event.
- **T5** `02ad434` — `AgentsHubCard` ("Jouw agents", 4 rijen: Piet-mail,
  Piet-seintjes, Reed, Koos) vervangt `AgentSubscribeCard`+`ReedPushCard` op
  /vandaag en de plaatspagina's; nieuwe route
  `POST /api/agents/subscriptions/toggle`.
- **T6** `3e69007` + fixes `5ff924c`, `285c0a8` — `RegiekamerPanel` in Mijn
  Weerzone: abonnementen-toggles, momenten-CRUD, apparaten + testmelding,
  budget-radio. Fixes uit review: push-heractivatie loopt nu via
  apparaatregistratie (SW + permission + `/api/agents/push/register`) met
  iOS-nudge; opslaan-fouten zichtbaar i.p.v. verzwolgen; installatiekaart
  leesbaar op witte kaarten (`tone="light"`).
- **Finale review-fix** `f3089f2` — PostHog-capture met
  `AbortSignal.timeout(1500)`: analytics kan de bezorg-lus nooit ophouden.

Finale whole-branch review (opus, 8e574c0..285c0a8): **geen Critical**; beide
Importants afgehandeld (timeout-fix + migratie-gate — migratie is inmiddels
gedraaid). Alle per-task-Minors getriaged als niet-blokkerend.

### Deploy-status
- Deploy `dpl_9WAWMuZvNbK5YARW4NbX3gbW4AAQ` van HEAD `49534ea`, auto-aliased
  naar weerzone.nl (geen aparte promote nodig geweest — wel altijd checken).
- Rooktest groen: `/` en `/vandaag` 200; `/mijn-weerzone` en `/app/onboarding`
  307 (login-redirect, correct); `/manifest.json` 200; toggle-route 401 anoniem;
  "Jouw agents voor De Bilt" zichtbaar in de live /vandaag-HTML.
- Let op: `49534ea` is een tripfit-only commit van een parallelle sessie
  (68 bestanden, alléén `tripfit/`) — onschadelijk voor Weerzone, maar de
  branch wordt door meerdere sessies gebruikt.

## Morgen te doen

### 1. E2e-keten (Task 7, stap 4 — Rowan, desktop + iPhone)
1. **Onboarding**: inloggen → `/app/onboarding` → fiets + hond + "bij elke
   omslag" → regiekamer toont Ochtendrit/Avondrit/Ochtendronde/Avondronde en
   budget "Bij elke omslag".
2. **Hub**: `/vandaag` → vier rijen; Piet-seintjes aan → rij `piet/push`
   zichtbaar in de regiekamer; uit → toggle uit.
3. **Regiekamer**: testmelding → notificatie op toestel; moment bewerken →
   gewijzigd venster blijft na herladen; budget-radio slaat zonder fout op
   (= migratie-bewijs).
4. **iOS-pad**: iPhone zonder standalone → "op beginscherm eerst" +
   installatie-instructie; na A2HS vanaf het icoon → push aanzetten lukt en
   testmelding komt binnen (spec §5.6).
5. **PostHog**: events `onboarding_profile`, `subscribe_confirmed`,
   `pwa_install_*` zichtbaar; `push_sent` volgt bij de eerste echte omslag-push.

**LET OP her-onboarding**: `/app/onboarding` opnieuw doorlopen wist ÓÓK
handmatig aangemaakte regiekamer-momenten (onboarding is de bron, by design).
Rowans bestaande testdata (hond-moment "Avondronde" Winkel) verdwijnt dus bij
stap 1 en wordt vervangen door de nieuwe set — dat is verwacht gedrag.

### 2. Na geslaagde e2e: Task 7, stap 5 (afsluitende docs-commit)
- Status-regel bijwerken in
  `docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md`
  (plan 2 live + open observaties benoemen).
- Geheugen `project_agents_headsup_push.md` bijwerken.
- Commit: `docs: heads-up-push gezicht (plan 2) live — status in spec`.

### 3. Open observaties in het wild (naast de e2e, gewoon afwachten)
1. Eerste echte omslag-push bij regen (dedup/budget-bewijs in de praktijk).
2. Reed-all-clear bij de eerste aflopende waarschuwing.
3. Budget-handhaving "Zo min mogelijk" (max 1) bewijst zich bij de
   eerstvolgende dag met meerdere omslagen.

### 4. Daarna (volgende project)
**Koos deelbaar** (blok d uit het abonnementen-project) staat als eerstvolgende
op de rol.

## Praktische lessen (geldig gebleven vandaag)
- Prod-deploys en secret-writes vereisen létterlijke benoeming door Rowan
  ("Ja, deploy naar productie en promote naar weerzone.nl" werkte in één keer);
  vage aanmoediging wordt geweigerd.
- Werkmap is chronisch dirty → deployen via `git archive HEAD`-export in de
  scratchpad, mét gekopieerde `.vercel/`-map voor de projectkoppeling.
- Migraties alleen via Rowan in de Supabase SQL editor (geen CLI/connection
  string); verifieer daarna functioneel (budget-radio) of via service-role.
- Subagents kunnen niet inloggen (magic-link) — geauthenticeerde e2e is altijd
  een Rowan-stap, plan die apart.
- Bekende tsc-drift zit o.a. in `tripfit/` — filter op eigen bestanden.

## Belangrijke bestanden
- Spec: `docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md`
- Plan 2: `docs/superpowers/plans/2026-07-11-agent-headsup-gezicht.md`
- Ledger: `.superpowers/sdd/progress.md` (git-ignored, overleeft `git clean` niet)
- Motor (plan 1, live): `src/app/(site)/api/cron/agent-headsup-push/route.ts`,
  `src/lib/agents/headsup-{push,log}.ts`, `src/lib/agents/moments*.ts`
- Gezicht (plan 2, live): `src/components/{PwaInstallCard,AgentsHubCard,RegiekamerPanel}.tsx`,
  `src/app/(site)/app/onboarding/OnboardingClient.tsx`,
  `src/app/(site)/api/agents/subscriptions/toggle/route.ts`,
  `src/lib/analytics-server.ts`
