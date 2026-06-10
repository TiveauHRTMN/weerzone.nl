-- Hartman WK 2026 Poule — knock-outfase.
-- De FIFA-sync vult hier per KO-wedstrijd (id 73..104) de echte teams in zodra
-- die bekend zijn (winnaars/nummers 2 + de doorgerekende beste nummers 3).
-- De client vervangt daarmee de plaatshouders ("Winnaar Poule C") in de bracket.

create table if not exists public.hartmanwk_ko_teams (
  match_id   text primary key,
  home       text not null,
  away       text not null,
  updated_at timestamptz not null default now()
);

-- RLS aan, geen publieke policies: alleen de service-role (server-API) leest/schrijft.
alter table public.hartmanwk_ko_teams enable row level security;
