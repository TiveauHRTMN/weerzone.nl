# Handoff — heads-up-push motor afmaken (start 2026-07-12)

## Waar we staan (avond 2026-07-11, alles gecommit op `feat/studio-tiktok-autopost`)

### Vandaag afgerond en LIVE
- **Blok (c) gelijk-gehad-score volledig live** (migratie gedraaid, e2e
  geverifieerd): predict 05:50 / verify 20:30 UTC, score-zin in de ochtendmail,
  `PietScoreCard` op /vandaag. Eerste meting: Winkel 25,3° voorspeld / 26,0°
  gemeten (Berkhout). **Check vanmorgen**: bevat Rowans Winkel-mail de
  "Gisteren beloofde ik…"-zin en staat de kaart op /vandaag?
- Zoutkamp-testabonnement uitgeschreven; Rowan woont in **Winkel (NH)** en
  heeft daar piet/email + reed/push; 2 actieve push-apparaten.

### Nieuwe richting (besproken en akkoord): agents die je opzoeken
**Noordster: "Alsof je altijd je eigen meteo-team bij je hebt."**
Spec: `docs/superpowers/specs/2026-07-10-agent-headsup-push-design.md`
Plan 1 (de motor): `docs/superpowers/plans/2026-07-11-agent-headsup-push-motor.md`

Kern: Piet/Reed/Koos sturen door de dag heen pushes, gefilterd op persoonlijke
momenten (woon-werk/hond/was/sport — 3 vragen in Piets stem bij onboarding,
plan 2). Spelregels: Piet max 3/dag 07:00-22:00, Koos 1/dag do-za, Reed
onbeperkt (eigen cron); bij zware KNMI-waarschuwing zwijgen Piet/Koos.
Later smelten de agents samen in Weerzone Pro (= gate op agent_subscriptions).
Nul LLM per push. PWA-install hoort bij plan 2 (iPhone-push vereist
beginscherm!).

## Plan 1 voortgang: T1-T3 af, T4-T8 open

✅ **T1** migratie `supabase/migrations/20260711_agent_headsup_push.sql`
   (`agent_headsup_log` + `agent_moments`) — **NOG NIET op prod gedraaid!**
✅ **T2** `src/lib/agents/moments.ts` (venster-wiskunde + storage, smoketest ok)
✅ **T3** `src/lib/agents/headsup-push.ts` (pure kandidaten; omslagen +
   natte-venster-check per moment + budget/dedup; smoketest ok — de ★
   "Regenpak mee om 17:30"-case werkt) + categorie-union uitgebreid

⬜ **T4** `src/lib/agents/headsup-log.ts` — dedup/budget-state (code staat
   volledig uitgeschreven in het plan)
⬜ **T5** cron `/api/cron/agent-headsup-push` + `vercel.json` (*/30) — code in
   het plan, inclusief de in-run-budget-fix (default state in de map zetten)
⬜ **T6** Reed-all-clear in `reed-alert-email` (all-clear vóór de vroege
   return zetten!)
⬜ **T7** `/api/agents/test-push` (ingelogd óf CRON_SECRET+userId)
⬜ **T8** verificatie: tsc + build, **migratie 20260711 door Rowan in de
   Supabase SQL editor**, deploy (auto-alias checken), testdata (piet/push-
   abonnement Winkel + hond-moment via service-role REST), e2e-keten
   (test-push op Rowans toestellen, dry-run, dedup- en budget-bewijs)

**Gewoon het plan volgen** — elke task heeft complete code en exacte stappen.

## Praktische lessen van vandaag (voor de uitvoering)

- `server-only` en `dotenv` resolven niet onder kale tsx: smoketests draaien
  met een stub in de scratchpad (`NODE_PATH=<scratchpad>/node_modules`, map
  `server-only` → leeg bestand) en env handmatig parsen. Dynamic import op
  Windows: `file:///C:/...`-URL gebruiken.
- Browser-extensie was offline en er is géén DB-wachtwoord in de env →
  migraties kunnen alleen door Rowan (SQL editor). `vercel env pull` wordt
  door de permissie-classifier geweigerd — niet opnieuw proberen.
- `npx vercel` werkt (54.2.0, ingelogd als tiveauhrtmn); deploys aliassen
  momenteel automatisch naar weerzone.nl, toch altijd checken.
- Bestaande tsc-drift (persona-email, wkpoule-data, b2b-emails, test-buffer,
  nl-poi-places) is bekend en níét van ons — alleen eigen bestanden schoon
  houden.

## Daarna (volgorde)

1. Plan 1 afmaken (T4-T8, zie boven).
2. **Plan 2 — het gezicht**: onboarding-vragen in Piets stem + PWA-install-
   stap, "Jouw agents"-blok (vervangt de losse kaarten), regiekamer in Mijn
   Weerzone (abonnementen + momenten + apparaten + test-push-knop). Nog geen
   implementatieplan — eerst schrijven (writing-plans) vanuit de spec.
   PostHog-events (push_sent, onboarding) horen bij plan 2.
3. Uit de vorige handoff staat óók nog open: **(d) Koos deelbaar**
   (share-kaart van de weekend-keuze) — na de push-motor oppakken, of
   combineren met plan 2 (Koos' push linkt naar de share-kaart).
4. Reed-push heeft nog nooit echt gevuurd bij noodweer; de test-push-route
   (T7) dekt de keten, het eerste echte event blijft een observatiemoment.

## Sleutelbestanden

Spec + plan (zie boven), `src/lib/agents/{headsup-push,moments,headsup-log*}.ts`
(*T4), `src/lib/push.ts` (web-push-keten), cron-routes onder
`src/app/(site)/api/cron/{agent-headsup-push*,reed-alert-email,piet-scorecard}/`,
`supabase/migrations/20260711_agent_headsup_push.sql`, `vercel.json`.
