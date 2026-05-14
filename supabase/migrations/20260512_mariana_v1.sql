-- Mariana v1: internal atmospheric memory and verification layer.
-- Idempotent. Written/read via service role only.

create table if not exists public.mariana_actual_observations (
  id uuid primary key default gen_random_uuid(),
  location_id text not null,
  location_name text,
  lat numeric(9,5) not null,
  lon numeric(9,5) not null,
  observed_at timestamptz not null,
  variables jsonb not null default '{}'::jsonb,
  station_id text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_actual_location_time
  on public.mariana_actual_observations(location_id, observed_at desc);

create table if not exists public.mariana_forecast_observations (
  id uuid primary key default gen_random_uuid(),
  location_id text not null,
  location_name text,
  lat numeric(9,5) not null,
  lon numeric(9,5) not null,
  model_name text not null,
  run_id text,
  forecast_timestamp timestamptz not null,
  valid_at timestamptz not null,
  forecast_horizon int not null,
  variables jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,3),
  confidence_label text,
  model_count int,
  divergence jsonb not null default '{}'::jsonb,
  actual_observation_id uuid references public.mariana_actual_observations(id) on delete set null,
  error jsonb,
  absolute_error jsonb,
  verified_at timestamptz,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_forecast_location_valid
  on public.mariana_forecast_observations(location_id, valid_at desc);

create index if not exists idx_mariana_forecast_model_valid
  on public.mariana_forecast_observations(model_name, valid_at desc);

create index if not exists idx_mariana_forecast_unverified
  on public.mariana_forecast_observations(location_id, valid_at)
  where verified_at is null;

create table if not exists public.mariana_location_memory (
  location_id text primary key,
  location_name text,
  lat numeric(9,5) not null,
  lon numeric(9,5) not null,
  weather_regime jsonb,
  model_stats jsonb not null default '{}'::jsonb,
  correction_notes jsonb not null default '[]'::jsonb,
  sample_count int not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_memory_updated
  on public.mariana_location_memory(updated_at desc);

alter table public.mariana_actual_observations enable row level security;
alter table public.mariana_forecast_observations enable row level security;
alter table public.mariana_location_memory enable row level security;

drop policy if exists "Mariana service role only actuals" on public.mariana_actual_observations;
drop policy if exists "Mariana service role only forecasts" on public.mariana_forecast_observations;
drop policy if exists "Mariana service role only memory" on public.mariana_location_memory;
