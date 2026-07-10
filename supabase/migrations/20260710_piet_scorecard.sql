-- Gelijk-gehad-score (handoff 2026-07-10, blok c): Piets voorspelde dagmax per
-- plaats ('s ochtends opgeslagen) + de gemeten dagmax van het dichtstbijzijnde
-- weerstation ('s avonds ingevuld). Voorspeld vs gemeten = de moat; pure
-- wiskunde, nul LLM. Schrijf-/leespad is uitsluitend de service role (crons +
-- server components); er is geen client-pad, dus RLS zonder policies = dicht.
--
-- Draai dit in de Supabase SQL editor (production). Idempotent.

create table if not exists public.piet_scorecard (
  id uuid primary key default gen_random_uuid(),
  forecast_date date not null,          -- de NL-dag waarover voorspeld is
  province text not null,
  place_slug text not null,
  place_name text not null,
  lat double precision not null,
  lon double precision not null,
  predicted_max numeric(4,1) not null,  -- multi-model-mediaan, ochtendrun
  predicted_at timestamptz not null default now(),
  measured_max numeric(4,1),            -- stations-dagmax, avondrun
  measured_at timestamptz,
  station_id text,
  station_name text
);

create unique index if not exists piet_scorecard_day_place_idx
  on public.piet_scorecard (forecast_date, province, place_slug);

-- Avondrun-leespad: onafgemaakte rijen van vandaag/gisteren.
create index if not exists piet_scorecard_unmeasured_idx
  on public.piet_scorecard (forecast_date)
  where measured_max is null;

-- RLS: geen policies = geen client-toegang (les van 20260703_studio_rls.sql).
alter table public.piet_scorecard enable row level security;
revoke all on table public.piet_scorecard from anon;
revoke all on table public.piet_scorecard from authenticated;
