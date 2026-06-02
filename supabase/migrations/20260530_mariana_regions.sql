-- Mariana Regions: 0-48u LLM-duiding per mesoschaal-REGIO (11 NL-regio's).
-- Idempotent. Geschreven/gelezen via service role.
--
-- Regions is de LLM-duidingslaag van de cascade:
--   Oracle + Tesla -> Regions (per regio, 1x/dag) -> Mariana Local (wiskunde,
--   per locatie, per request) -> 10.000 paginas / Piet / Koos / Reed.
--
-- local_feed = het voederkanaal naar Mariana Local: regime + per-dag
-- modelgewichten + confidence-prior + gevaarvlaggen. De wiskunde van Local leest
-- de meest recente feed per regio en draait daarop i.p.v. statische defaults.

create table if not exists public.mariana_regions (
  id uuid primary key default gen_random_uuid(),
  region_slug text not null,
  region_name text not null,
  lat double precision not null,
  lon double precision not null,
  run_at timestamptz not null,
  trigger text not null,
  model text not null,
  oracle_context_used boolean not null default false,
  tesla_context_used boolean not null default false,
  refer_to_reed boolean not null default false,
  -- Het volledige MarianaSignal-object (zie src/lib/mariana/regions/types.ts):
  signal jsonb not null default '{}'::jsonb,
  -- Het voederkanaal naar Mariana Local (MarianaLocalFeed):
  local_feed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_regions_slug_time
  on public.mariana_regions(region_slug, run_at desc);

create index if not exists idx_mariana_regions_convective_time
  on public.mariana_regions(tesla_context_used, run_at desc);

create index if not exists idx_mariana_regions_run_at
  on public.mariana_regions(run_at desc);
