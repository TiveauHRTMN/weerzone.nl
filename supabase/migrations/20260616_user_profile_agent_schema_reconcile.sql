-- Reconcile: het account/agent-datamodel waar de proactieve laag op leunt was
-- nooit volledig als migratie geschreven én nooit op productie toegepast. De code
-- (onboarding, /mijn-weerzone, piet/reed/koos-crons, preferences) leest/schrijft
-- kolommen + een user_locations-tabel die in productie ontbreken. Daardoor:
--   * onboarding crasht bij het opslaan van voorkeuren/locatie
--   * de proactieve e-mail-crons falen elke run (kolom bestaat niet)
-- Deze migratie is idempotent (if not exists) en consolideert het volledige schema.

-- 1. user_profile: locatie + agent-toggles + Koos-cadans
alter table public.user_profile
  add column if not exists primary_lat double precision,
  add column if not exists primary_lon double precision,
  add column if not exists piet_on boolean not null default true,
  add column if not exists reed_on boolean not null default false,
  add column if not exists koos_on boolean not null default false,
  add column if not exists koos_last_nudge_at timestamptz,
  add column if not exists koos_pref text not null default 'rain_avoider';

-- 2. user_locations: opgeslagen locaties per gebruiker (onboarding schrijft "Thuis"
--    als is_primary). Geschreven vanuit de browser (auth-client) → RLS verplicht.
create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  lat double precision not null,
  lon double precision not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_locations_user_id_idx on public.user_locations (user_id);
-- Hooguit één primaire locatie per gebruiker.
create unique index if not exists user_locations_one_primary_idx
  on public.user_locations (user_id) where is_primary;

alter table public.user_locations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_locations'
      and policyname = 'user_locations_owner_all'
  ) then
    create policy user_locations_owner_all on public.user_locations
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 3. Backfill: bestaande primaire user_locations → user_profile.primary_lat/lon.
update public.user_profile as profile
set primary_lat = location.lat,
    primary_lon = location.lon,
    updated_at = now()
from public.user_locations as location
where location.user_id = profile.id
  and location.is_primary = true
  and (profile.primary_lat is null or profile.primary_lon is null);
