# Handoff — Piet/Reed/Koos als abonnements-agents (start 2026-07-10)

## Waar we vandaan komen (stand 2026-07-09, alles live + gecommit)

- Sitemap: 13.775 geografisch correcte URL's, 1.667 provincie-fixes, 236 Belgische
  plaatsen verwijderd, 308-fallback in de plaatspagina, IndexNow gepingd, GSC
  door Rowan opnieuw ingediend. (554106c, 87219be)
- Pluim-caption jargonvrij (safeInsight-jargonfilter) + hyperlokale spread-zin
  per plaats; Regions-prompt heeft nu toonregels per veld. (af591d2)
- Volledig verslag: `docs/seo/sitemap-validatie-2026-07-08.md`.

## De strategie (besproken en akkoord 2026-07-09)

**Kern: Piet, Reed en Koos zijn geen pagina's maar abonnementen. Het gat is
distributie, niet intelligentie.**

1. **Schaalprincipe bewaken**: LLM-duiding per régio (11×, 1×/dag via de
   Mariana-cascade), wiskunde per locatie/abonnee. Gepersonaliseerde mail voor
   50K abonnees = regio-duiding + lokale wiskunde + sjabloon, **nul LLM per
   abonnee**. Elke nieuwe feature moet deze vorm hebben.
2. **Drie agents = drie triggers, geen chatbots**:
   - Piet = tijd-getriggerd (ochtendritueel ~06:45) → gewoonte/retentie-anker.
   - Reed = event-getriggerd → moet **web push** worden (e-mail te traag voor
     "over 40 min hagel"); de 30-min-cron + Tesla/KNMI-delta bestaan al.
   - Koos = beslis-getriggerd (do/vr, weekend binnen het 48u-venster) → de
     deelbare.
3. **Inschrijf-loop**: elke van de 13.775 plaatspagina's verkoopt "Piet kent
   <plaats> — elke ochtend in je mail", one-tap met magic link. SEO-verkeer →
   abonnee → dagelijks contact (retentie boven acquisitie).
4. **Moat**: de "gelijk-gehad-score" — voorspeld vs gemeten per plaats (meting
   is ground truth), pure wiskunde, in de mail + op /piet.

**Niet doen**: chat-per-agent op pagina's (LLM per pageview + Mariana is de
enige zichtbare AI), geen vierde persona, geen horizon voorbij 48u.

## Besluit: gratis eerst, KvK + Pro daarna (Rowan, 2026-07-09)

**"Eerst abonnees binnenhalen en dan overgaan tot KvK."** Dus:

- Alles wat we nu bouwen is **gratis** voor abonnees; geen paywall, geen
  pricing-routes/UI (die mogen sowieso pas na de KvK-inschrijving bestaan).
- De gratis Piet-mail is de groeimotor en het referral-oppervlak; het doel van
  deze fase is bewezen gewoontevorming (open rate, dagelijkse terugkeer, churn
  van de eerste honderden abonnees).
- **Wel entitlement-ready bouwen**: het datamodel hieronder is identiek aan de
  latere Pro-wereld — Pro wordt te zijner tijd één gate op bestaande rijen.
  Pro-kandidaten (nu NIET bouwen): meerdere plekken per account, Reed-push,
  gelijk-gehad-historie, eerder bezorgmoment.
- Volgorde van de founder: abonnees → KvK → dan pas monetisering inrichten.

## Bouwplan — blok (a): abonnement-per-plaats + inschrijfblok

Dit is het vliegwiel; hiermee beginnen.

### 1. Datamodel (Supabase)

Nieuwe tabel `agent_subscriptions`:
`id, user_id (auth.users), agent ('piet'|'reed'|'koos'), province, place_slug,
channel ('email'; push later), created_at, unsubscribed_at`
- Uniek op (user_id, agent, province, place_slug, channel).
- RLS: owner-only (studio-tabellen als voorbeeld; RLS-gat van juli niet herhalen).
- **Migratie via de Supabase SQL-editor** (geen CLI, connection string leeg in
  .env.production.local), daarna verifiëren via service-role API.
- Bestaande account-toggles (`user_profile.piet_on/reed_on/koos_on`) blijven
  werken als landelijke fallback; `preferencesFromProfile` niet slopen.
  **Let op**: `user_profile` is een drift-gevoelige spiegel — nooit
  source-of-truth voor account-bestaan; ga altijd via `auth.users`.

### 2. Inschrijfblok op de plaatspagina

- Component op `/weer/[province]/[place]` (en /piet): e-mailveld → magic link
  (bestaande auth-flow, `AuthShell`/auth-i18n) → subscription-rij met de plaats
  van de pagina. Ingelogd = one-tap.
- Copy in Piet's karakter, net Nederlands, geen "AI" (Mariana is de enige
  zichtbare AI; toonregels: `memory/feedback_weerzone_tone.md`).
- PostHog-events: subscribe_shown / subscribe_started / subscribe_confirmed.

### 3. Crons ombouwen naar per-plaats

- `src/lib/agents/email-recipients.ts` uitbreiden: eerst `agent_subscriptions`
  (per plaats), dan de oude account-toggles als fallback zonder plaats.
  Let op: de huidige implementatie scant álle users per run — prima nu, maar
  bouw de nieuwe query subscription-first zodat het O(abonnees) blijft.
- `piet-morning-email`: per abonnee de mail samenstellen uit regio-duiding +
  Mariana Local-wiskunde voor zíjn plaats (pure helpers in `src/lib/agents/`
  zijn hierop ontworpen). Nul LLM per abonnee — dat is de hele poot.
- Crons staan al in `vercel.json` (06:00 piet / */30 reed / do 07:00 koos);
  nieuwe cron-routes ook dáár registreren, anders vuren ze niet.

### 4. Verificatie

- Testabonnement op eigen mail (rwnhrtmn@gmail.com) voor een kleine plaats;
  cron handmatig triggeren; mail moet de plaatsnaam + lokale getallen tonen.
- `npm run build` + `npx tsc --noEmit` (build verbergt type-fouten!).
- Deploy vanaf `feat/studio-tiktok-autopost` via CLI; check of de deploy
  auto-aliast, anders `vercel promote`. Werkmap committen vóór deploy
  (dirty-tree-les) — let op rondslingerende untracked mappen (`mirrorly/`,
  `src/seo`).

## Daarna (volgorde)

- **(b)** Reed → web push (PWA; VAPID + service worker; zelfde delta-cron).
  ✅ 2026-07-10 live (232b969 + fix add2706).
- **(c)** Gelijk-gehad-score: dagelijkse job die Piets voorspelling per plaats
  opslaat + 's avonds vergelijkt met metingen (KNMI 10-min-data ligt er al
  van de kaart-temps); score in mail + /piet.
  ✅ 2026-07-10 gebouwd & gedeployd: `piet_scorecard`-migratie,
  `src/lib/agents/scorecard.ts` (wiskunde + persistentie),
  `fetchStationDayMaxTemp` (KNMI EDR dagmax), cron
  `/api/cron/piet-scorecard?phase=predict|verify` (05:50/20:30 UTC in
  vercel.json), score-zin in de ochtendmail, `PietScoreCard` op /vandaag.
  Plan: `docs/superpowers/plans/2026-07-10-piet-gelijk-gehad-score.md`.
  ✅ Migratie door Rowan gedraaid (2026-07-10 avond); end-to-end geverifieerd:
  predict `ok:true saved:2` (Winkel + De Bilt), verify `measured:2`
  (Winkel 25,3° voorspeld / 26,0° gemeten via station Berkhout; De Bilt
  28,1°/27,2°), anon-key → 42501 permission denied. Zoutkamp-testrij
  uitgeschreven — Rowan woont in Winkel. De gisteren-zin en de /vandaag-kaart
  horen morgen (11 juli) te verschijnen op basis van de rij van 10 juli;
  kanttekening: die eerste rij is 's avonds voorspeld (na de dagmax), de
  eerste éérlijke cyclus start met de 05:50-cron van morgenochtend.
- **(d)** Koos deelbaar (share-kaart van de weekend-keuze).

## Sleutelbestanden

`src/lib/agents/{context,orchestrator,email-recipients,preferences-server}.ts`,
cron-routes onder `src/app/(site)/api/cron/{piet-morning-email,reed-alert-email,koos-getaway-nudge}/`,
`src/lib/mariana/regions/*` (cascade), `src/lib/persona-email.ts` + Resend,
`vercel.json` (crons), plaatspagina `src/app/(site)/weer/[province]/[place]/page.tsx`.
