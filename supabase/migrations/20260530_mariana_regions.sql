-- Mariana NL: 0-48u operationele orchestrator-output per locatie.
-- Idempotent. Geschreven/gelezen via service role.
--
-- Mariana is de centrale 0-48u beslislaag voor Nederland: ze consumeert Oracle
-- (regimecontext) + Tesla (convectie, alleen bij gate ACTIVATE) + hi-res modellen
-- en levert per locatie lokale output voor Piet, Koos, Reed en locatiepagina's.
-- Twee banen die niet middelen; Reed krijgt Tesla rauw. Deze tabel bewaart elk
-- per-locatie besluit.

create table if not exists public.mariana_nl (
  id uuid primary key default gen_random_uuid(),
  location_name text not null,
  lat double precision not null,
  lon double precision not null,
  run_at timestamptz not null,
  trigger text not null,
  model text not null,
  -- Gedenormaliseerd voor snelle filtering:
  oracle_context_used boolean not null default false,
  tesla_context_used boolean not null default false,
  refer_to_reed boolean not null default false,
  -- Het volledige MarianaSignal-object (zie src/lib/mariana/nl/types.ts):
  signal jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_nl_loc_time
  on public.mariana_nl(location_name, run_at desc);

create index if not exists idx_mariana_nl_convective_time
  on public.mariana_nl(tesla_context_used, run_at desc);

create index if not exists idx_mariana_nl_run_at
  on public.mariana_nl(run_at desc);
