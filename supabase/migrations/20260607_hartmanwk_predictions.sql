-- Hartman WK 2026 Poule — voorspellingen, sterspeler, echte uitslagen & speler-statjes.
-- Deelnemers slaan hun eigen groepsvoorspellingen + 1 sterspeler op; de eigenaar
-- voert de echte uitslagen + speler-statjes in. De ranglijst wordt server-side berekend.

-- 1. Sterspeler per deelnemer (vrije tekst, bv. "Mbappé"). Blijft het hele toernooi staan.
alter table public.hartmanwk_members
  add column if not exists player_pick text;

-- 2. Voorspellingen per deelnemer per wedstrijd.
create table if not exists public.hartmanwk_predictions (
  member_id  uuid not null references public.hartmanwk_members(id) on delete cascade,
  match_id   text not null,
  home       integer not null check (home >= 0 and home <= 30),
  away       integer not null check (away >= 0 and away <= 30),
  updated_at timestamptz not null default now(),
  primary key (member_id, match_id)
);
create index if not exists hartmanwk_predictions_member_idx
  on public.hartmanwk_predictions (member_id);

-- 3. Echte uitslagen (door de eigenaar).
create table if not exists public.hartmanwk_results (
  match_id   text primary key,
  home       integer not null check (home >= 0),
  away       integer not null check (away >= 0),
  updated_at timestamptz not null default now()
);

-- 4. Speler-statjes, toernooi-cumulatief (door de eigenaar). player_key = genormaliseerde naam.
create table if not exists public.hartmanwk_player_stats (
  player_key   text primary key,
  display_name text not null,
  goals        integer not null default 0,
  assists      integer not null default 0,
  minutes      integer not null default 0,
  yellow       integer not null default 0,
  red          integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- RLS aan, geen publieke policies: alleen de service-role (server-API) leest/schrijft.
alter table public.hartmanwk_predictions   enable row level security;
alter table public.hartmanwk_results        enable row level security;
alter table public.hartmanwk_player_stats   enable row level security;
