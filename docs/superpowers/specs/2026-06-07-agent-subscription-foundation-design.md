# Design — Proactieve agents (Piet/Reed/Koos, email-first, free)

**Date:** 2026-06-07
**Branch:** weerzone-agents-fase1
**Status:** Approved design — pending implementation plan
**Scope:** Full proactive layer in one build — **SP1** foundation + Piet daily,
**SP2** Reed severe-weather alerts, **SP3** Koos getaway nudges. All free,
email-only (push later), paid path stays deferred.

## Goal

Make the WEERZONE agents genuinely proactive over email: a free signup gives the
user **Piet** (always-on daily weather for their GPS location), with **Reed**
(severe-weather alerts) and **Koos** (getaway nudges) as opt-in toggles. No
login, no payment (pre-KvK). This spec covers all three sub-projects; they share
one `subscribers` schema and one delivery pattern (Resend email).

## Context / why

- The agent *engines* (`piet-forecast.ts`, `reed-view.ts`, `koos-getaway.ts`) and
  the agent pages (`/`, `/piet`, `/reed`, `/koos`) already exist. The missing
  piece is **proactive delivery**.
- Piet's daily email already exists (`/api/cron/piet-morning-email`) but it reads
  the **paid** `subscriptions` table (`status in trialing/active`, `tier`), which
  collides with the "geen prijzen tot KvK" rule. So in practice it targets a list
  that pre-KvK should be empty.
- There are two subscriber systems: `subscribers` (free email capture:
  `email, city, lat, lon, active`) and `subscriptions` (paid, account-bound). The
  free model is the correct base pre-KvK.
- Notifications = **email only for now** (Resend, already wired). Web push is a
  deliberate later layer, out of scope here.

## Superseded 2026-06-08 — moved to accounts

The no-login `subscribers` model below is **superseded** for the agent toggles.
Decision (2026-06-08): a user must always have an **account** — proactive emailing
hangs off an authenticated `user_profile` (email + `primary_lat/lon`), not a no-login
row. Piet/Reed/Koos are independent toggles (Piet default on) stored as columns on
`user_profile`, chosen at onboarding and editable on `/mijn-weerzone`; the
`piet-morning-email` cron targets accounts. Toggles govern proactive email only — the
on-site `/vandaag` and `/` always show all three (Reed safety never hidden). The
`/voorkeuren` token page is not used for agents. See the plan
`stateful-weaving-mochi.md`. The `subscribers`/Mollie content below is kept for
historical context.

## Decisions (locked — partly superseded, see above)

| Decision | Choice |
|---|---|
| Subscribe model | Free email signup on `subscribers` (no login, no payment) |
| Agent model | Piet implicit for every active subscriber; Reed/Koos = boolean toggles |
| Delivery channel | Email via Resend (push later) |
| Preferences/unsubscribe | Token-based link (`manage_token`), no account |
| GPS memory | `lat`/`lon` on `subscribers`, updatable when the user returns with GPS |
| Piet daily email audience | Repoint from `subscriptions` → `subscribers WHERE active` |

## Architecture

### 1. Data model — extend `subscribers`

Supabase migration (`supabase/migrations/YYYYMMDD_agent_subscription_toggles.sql`):

```sql
alter table public.subscribers
  -- SP1: toggles, no-login token, GPS freshness
  add column if not exists reed_on boolean not null default false,
  add column if not exists koos_on boolean not null default false,
  add column if not exists manage_token uuid not null default gen_random_uuid(),
  add column if not exists gps_updated_at timestamptz,
  -- SP2: Reed alert dedup state
  add column if not exists reed_last_alert_at timestamptz,
  add column if not exists reed_last_alert_key text,
  -- SP3: Koos nudge cadence + preference
  add column if not exists koos_last_nudge_at timestamptz,
  add column if not exists koos_pref text not null default 'rain_avoider'; -- 'rain_avoider' | 'heat_avoider'

create unique index if not exists subscribers_manage_token_idx
  on public.subscribers (manage_token);
```

Piet has no flag — every `active = true` subscriber gets Piet. `reed_on`/`koos_on`
gate SP2/SP3. `manage_token` powers the no-login preferences link. The
`reed_last_alert_*` / `koos_last_nudge_at` columns prevent re-spamming the same
event (SP2/SP3 dedup). Existing rows get a generated token via the default.

VBNCASVd wfegb rnhtm,ulik.?
### 2. Signup + GPS memory

- `src/app/(site)/api/subscribe/route.t014(exists): the `upsert` already writes
  `email, city, lat, lon, active`. Extend to optionally accept `reed_on`/`koos_on`
  from the signup surface (default false) and to set `gps_updated_at` when
  `lat/lon` are present. `manage_token` is set by the DB default on insert; on
  conflict (re-signup) keep the existing token. On success, return the
  `manage_token` and set it as an httpOnly cookie (`wz_sub`) so a returning
  browser can be matched to its subscriber.
- **New** `src/app/(site)/api/subscribe/location/route.ts` (POST `{ lat, lon }`,
  reads the `wz_sub` token cookie): updates that subscriber's `lat/lon` +
  `gps_updated_at`. Token-based, never raw email — a caller can only move their
  own location. No cookie / unknown token → no-op. The client calls this when a
  returning subscriber grants GPS, so Piet always uses the latest spot.

### 3. Preferences page (no login)

- **New** `src/app/(site)/voorkeuren/page.tsx` — reads `?token=<manage_token>`,
  shows current location + Reed/Koos toggles + an unsubscribe button. Server
  component that loads the subscriber by token; renders a small client form.
- **New** `src/app/(site)/api/preferences/route.ts`:
  - `GET ?token=` → `{ email, city, reed_on, koos_on, active }`
  - `POST { token, reed_on?, koos_on?, active? }` → updates those fields.
  Token is the only auth. Unknown token → 404.
- Reuse existing `src/app/(site)/api/unsubscribe/route.ts` (sets `active=false`),
  or fold unsubscribe into the preferences POST (`active:false`). Keep the
  existing unsubscribe URL working for old email links.
- Every agent email footer links to `/voorkeuren?token=<manage_token>`.

### 4. Repoint Piet's daily email

In `src/app/(site)/api/cron/piet-morning-email/route.ts`, replace the
`subscriptions`-based query (lines ~303-322) with:

```ts
const { data: subs } = await supabase
  .from("subscribers")
  .select("email, city, lat, lon")
  .eq("active", true)
  .not("lat", "is", null)
  .not("lon", "is", null);
```

Map `lat/lon` → the existing grid-grouping + narrative + HTML send logic
(unchanged). Update the footer link to the token-based `/voorkeuren`. (The cron
already declares `maxDuration = 300`.) Piet ignores `reed_on/koos_on` — it's
always-on.

### 5. Components

- The existing `EmailSubscribe` component / homepage signup posts to
  `/api/subscribe` — no change required for SP1 beyond it continuing to send
  `email + lat/lon`. (Adding Reed/Koos checkboxes at signup is optional polish;
  the toggles are reachable via `/voorkeuren` regardless.)

## SP2 — Reed severe-weather alerts (email)

**Audience:** `subscribers WHERE active AND reed_on`.

**Trigger logic** — reuse `reed-view.ts` severe detection (don't reinvent
thresholds). Extract the per-day risk check (thunder hours present, `cape >= 800`,
strong gusts, heavy rain → `ReedState` `watch`/`warning`) into a small pure
helper `reedSevereForWeather(weather): { severe: boolean; key: string; summary }`
usable off a `WeatherData`/48h fetch. `key` encodes the event window (e.g.
`"<isoDate>:<firstRiskHour>:<state>"`).

**Dedup:** only email when the computed `key` differs from `reed_last_alert_key`
(new/escalated event), AND `reed_last_alert_at` is older than a min interval
(e.g. 6h). On send, store the new `key` + `now`. Calm → clear nothing (we just
don't send). This prevents re-sending the same storm every run.

**Pipeline:** new cron `src/app/(site)/api/cron/reed-alert-patrol/route.ts`
(`maxDuration = 300`): load `reed_on` subscribers, grid-group by `lat/lon` (reuse
Piet's grid helper), fetch 48h weather per grid, run `reedSevereForWeather`, and
for each subscriber with a new severe `key` send a Reed-voiced email via Resend
(`reed@weerzone.nl`). Email facts come from the engine; voice via the existing
`hermesChat` persona path with a template fallback (same soft-fail pattern as
`koos-voice.ts`). Footer → `/voorkeuren?token=`.

**Schedule (`vercel.json`):** `0 */6 * * *` (every 6h) — Reed looks 48h ahead, so
6-hourly catches new severe weather well without spamming.

## SP3 — Koos getaway nudges (email)

**Audience:** `subscribers WHERE active AND koos_on`.

**Trigger logic** — reuse `koos-getaway.ts` `findGetaways(origin)` (and/or
`findGetawayPicks`) for the subscriber's home `lat/lon`. Send only when **home is
"bad" for their `koos_pref`** AND meaningfully better options exist:
- `rain_avoider` (default): home is wet/grey today → tip dry places (engine already
  orders NL-first, then abroad).
- `heat_avoider`: home is too hot → tip cooler places.
A small pure helper `koosHomeIsBad(homeOutlook, pref): boolean` gates it;
`findGetaways` already encodes "is it actually nicer there."

**Cadence/dedup:** Koos is "when relevant," not daily. Only send if
`koos_last_nudge_at` is older than e.g. 3 days AND home-is-bad AND ≥1 strong
opportunity. Store `koos_last_nudge_at` on send.

**Pipeline:** new cron `src/app/(site)/api/cron/koos-getaway-nudge/route.ts`
(`maxDuration = 300`): load `koos_on` subscribers, for each compute home outlook +
`findGetaways`, gate via `koosHomeIsBad` + cadence, send Koos-voiced email
(reuse `koosVoice()` which already exists, template fallback). Footer →
`/voorkeuren?token=`.

**Schedule (`vercel.json`):** `0 7 * * *` (daily 07:00 UTC, morning) — evaluate
once a day; the 3-day cadence gate prevents over-mailing.

## Out of scope

- **Web push** — VAPID + `sw.js` push handler + push-subscription storage
  (deliberate later layer; SP2/SP3 email pipelines are built channel-agnostic so
  push can be added beside email).
- The paid `subscriptions`/Mollie path (stays dead per KvK rule).

## Affected files

| File | Change |
|---|---|
| `supabase/migrations/*_agent_subscription_toggles.sql` | **New** — add columns + token index |
| `src/app/(site)/api/subscribe/route.ts` | Accept toggles, set `gps_updated_at`, preserve token on conflict |
| `src/app/(site)/api/subscribe/location/route.ts` | **New** — update GPS for known subscriber |
| `src/app/(site)/voorkeuren/page.tsx` | **New** — token-based preferences page |
| `src/app/(site)/api/preferences/route.ts` | **New** — GET/POST prefs by token |
| `src/app/(site)/api/cron/piet-morning-email/route.ts` | Audience: `subscriptions` → `subscribers WHERE active`; token footer link |
| `src/lib/reed-view.ts` | Extract pure `reedSevereForWeather(weather)` helper (SP2) |
| `src/app/(site)/api/cron/reed-alert-patrol/route.ts` | **New** — Reed severe-weather alert cron (SP2) |
| `src/lib/koos-getaway.ts` | Add pure `koosHomeIsBad(outlook, pref)` helper (SP3) |
| `src/app/(site)/api/cron/koos-getaway-nudge/route.ts` | **New** — Koos nudge cron (SP3) |
| `vercel.json` | Register `reed-alert-patrol` (`0 */6 * * *`) + `koos-getaway-nudge` (`0 7 * * *`) crons |

## Success criteria

- A free signup (email + GPS) lands in `subscribers` with a `manage_token`.
- `/voorkeuren?token=…` shows and updates Reed/Koos toggles + unsubscribe, no login.
- A returning subscriber's GPS update changes their stored `lat/lon`.
- The daily Piet cron sends to `active` `subscribers` (not the paid table), using
  each subscriber's latest `lat/lon`, with a working preferences link.
- **SP2:** `reed-alert-patrol` emails only `reed_on` subscribers when a *new*
  severe-weather window appears in 48h (dedup via `reed_last_alert_key`), never
  re-spamming the same event.
- **SP3:** `koos-getaway-nudge` emails only `koos_on` subscribers when home is bad
  for their `koos_pref` and a better getaway exists, at most ~once/3 days.
- Both new crons registered in `vercel.json`. `npx tsc --noEmit` clean on touched
  files; smoke covers the prefs token flow + the `reedSevereForWeather` /
  `koosHomeIsBad` pure helpers.

## Testing

No jest in repo (per CLAUDE.md). Verify via:
- `npx tsc --noEmit` on touched files.
- A `scripts/check-subscriber-prefs.ts` smoke that exercises the preferences
  GET/POST handlers against a seeded test row (admin client), asserting toggle
  round-trip + unknown-token 404.
- Manual: `npm run dev`, sign up, open `/voorkeuren?token=…`, flip toggles, trigger
  the cron route locally with a test subscriber.
