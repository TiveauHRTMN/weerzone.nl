-- Hartman WK 2026 — FIFA-selecties (voor de sterspeler-kieslijst) + speler-ID per deelnemer.
-- Zo kies je je sterspeler uit de echte FIFA-squad en matchen de statjes exact op ID.

create table if not exists public.hartmanwk_players (
  id_player   text primary key,
  name        text not null,
  team_code   text,
  team_name   text,
  position    integer,
  jersey      integer,
  updated_at  timestamptz not null default now()
);
alter table public.hartmanwk_players enable row level security;

-- Gekozen FIFA speler-ID per deelnemer (naast de leesbare naam player_pick).
alter table public.hartmanwk_members add column if not exists player_pick_id text;
