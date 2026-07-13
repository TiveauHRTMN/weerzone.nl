-- Vrije-dag heads-up & dagplan (spec 2026-07-13): eendags-momenten met
-- optionele bestemming + routine-pauze/vakantiestand/opt-in op het profiel.
-- Draai dit in de Supabase SQL editor (production). Idempotent.
alter table public.agent_moments
  add column if not exists date date null,
  add column if not exists province text null,
  add column if not exists place_slug text null;

alter table public.user_profile
  add column if not exists routine_paused boolean not null default false,
  add column if not exists paused_until date null,
  add column if not exists freeday_headsup boolean not null default false;
