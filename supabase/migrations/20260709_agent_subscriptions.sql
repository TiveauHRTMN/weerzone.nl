-- Agents als abonnementen (handoff 2026-07-10, blok a): een abonnement is
-- agent + plaats + kanaal, gekoppeld aan auth.users. Dit is het entitlement-
-- ready datamodel: Pro wordt later één gate op deze rijen, geen nieuw schema.
--
-- user_profile.piet_on/reed_on/koos_on blijven bestaan als landelijke fallback
-- zonder plaats (preferencesFromProfile); deze tabel is de per-plaats-laag.
--
-- Draai dit in de Supabase SQL editor (production). Idempotent.

create table if not exists public.agent_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent text not null check (agent in ('piet', 'reed', 'koos')),
  province text not null,
  place_slug text not null,
  channel text not null default 'email' check (channel in ('email', 'push')),
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists agent_subscriptions_unique_idx
  on public.agent_subscriptions (user_id, agent, province, place_slug, channel);

-- Cron-leespad: alle actieve abonnees van één agent.
create index if not exists agent_subscriptions_agent_active_idx
  on public.agent_subscriptions (agent, channel)
  where unsubscribed_at is null;

-- RLS: owner-only (les van de studio-tabellen, 20260703_studio_rls.sql — de
-- anon-key zit in de client-bundle). App-writes lopen via de service role
-- (bypasst RLS); de browser mag alléén eigen rijen zien en beheren.
alter table public.agent_subscriptions enable row level security;

revoke all on table public.agent_subscriptions from anon;

drop policy if exists "agent_subscriptions_select_own" on public.agent_subscriptions;
create policy "agent_subscriptions_select_own"
  on public.agent_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "agent_subscriptions_insert_own" on public.agent_subscriptions;
create policy "agent_subscriptions_insert_own"
  on public.agent_subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "agent_subscriptions_update_own" on public.agent_subscriptions;
create policy "agent_subscriptions_update_own"
  on public.agent_subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Verifieer daarna met de anon-key (hoort leeg/geweigerd te zijn):
-- curl "https://<project>.supabase.co/rest/v1/agent_subscriptions?select=*" \
--   -H "apikey: <anon>" -H "Authorization: Bearer <anon>"
