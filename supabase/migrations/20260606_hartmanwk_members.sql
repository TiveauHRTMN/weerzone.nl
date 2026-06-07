-- Hartman WK 2026 Poule — gedeelde deelnemerslijst
-- Het /hartmanwk2026-prototype had geen backend: elke login werd alleen in de
-- localStorage van dat ene toestel bewaard, dus deelnemers zagen elkaar nooit.
-- Deze tabel is de enige gedeelde plek waar aanmeldingen samenkomen.
-- Identiteit = genormaliseerd e-mailadres of telefoonnummer (geen wachtwoord),
-- precies zoals het bestaande loginscherm werkt.

create table if not exists public.hartmanwk_members (
  id           uuid primary key default gen_random_uuid(),
  contact      text not null unique,                 -- genormaliseerd e-mail (lowercase) of telefoon (+...)
  contact_type text not null check (contact_type in ('email', 'phone')),
  name         text not null,
  photo        text,                                 -- kleine base64 jpeg (360px) of null
  joined_at    timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists hartmanwk_members_joined_idx
  on public.hartmanwk_members (joined_at asc);

-- RLS aan, geen publieke policies: alleen de service-role (server-API) leest/schrijft.
-- Zo lekken e-mailadressen/telefoonnummers van familie nooit naar de browser.
alter table public.hartmanwk_members enable row level security;
