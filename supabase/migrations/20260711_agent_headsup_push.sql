-- Agents die je opzoeken (spec 2026-07-10, plan 1): dedup/budget-log voor
-- heads-up-pushes + de persoonlijke momenten waarop gefilterd wordt.
-- Draai dit in de Supabase SQL editor (production). Idempotent.

-- 1. Dedup + dagbudget voor heads-up-pushes (patroon: reed_warning_alerts).
create table if not exists public.agent_headsup_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent text not null check (agent in ('piet', 'reed', 'koos')),
  province text not null,
  place_slug text not null,
  headsup_key text not null,
  category text not null,
  severity text not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists agent_headsup_log_user_key_idx
  on public.agent_headsup_log (user_id, headsup_key);

-- Leespad cron: recente rijen per gebruiker (dedup 48u + dagtelling).
create index if not exists agent_headsup_log_user_sent_idx
  on public.agent_headsup_log (user_id, sent_at desc);

-- Service-role-only: geen policies = geen client-toegang.
alter table public.agent_headsup_log enable row level security;
revoke all on table public.agent_headsup_log from anon;
revoke all on table public.agent_headsup_log from authenticated;

-- 2. Persoonlijke momenten ("je eigen meteo-team kent je ritme").
--    Onboarding-antwoorden worden direct als rijen opgeslagen (plan 2);
--    de regiekamer bewerkt deze rijen. days: 1=ma .. 7=zo (ISO).
create table if not exists public.agent_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('commute', 'dog', 'outdoor', 'laundry', 'sport', 'custom')),
  label text not null,
  days int[] not null default '{1,2,3,4,5}',
  window_start time not null,
  window_end time not null,
  transport text check (transport in ('bike', 'ov', 'car', 'none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_moments_user_idx
  on public.agent_moments (user_id);

-- Owner-only (patroon agent_subscriptions); cron leest via service role.
alter table public.agent_moments enable row level security;
revoke all on table public.agent_moments from anon;

drop policy if exists "agent_moments_select_own" on public.agent_moments;
create policy "agent_moments_select_own"
  on public.agent_moments for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "agent_moments_insert_own" on public.agent_moments;
create policy "agent_moments_insert_own"
  on public.agent_moments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "agent_moments_update_own" on public.agent_moments;
create policy "agent_moments_update_own"
  on public.agent_moments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "agent_moments_delete_own" on public.agent_moments;
create policy "agent_moments_delete_own"
  on public.agent_moments for delete
  to authenticated
  using (auth.uid() = user_id);
