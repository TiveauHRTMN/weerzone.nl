-- Mariana Tesla: convectieve/onweer reasoning-output per mesoschaal-regio.
-- Idempotent. Geschreven/gelezen via service role.
--
-- Tesla is de interne convectieve engine onder Mariana: per regio levert ze een
-- gestructureerd signaal (GREEN/AMBER/RED + confidence + Reed-actie + reasoning).
-- Deze tabel bewaart elke run zodat Mariana/Reed de laatste diagnose kunnen lezen.

create table if not exists public.mariana_tesla (
  id uuid primary key default gen_random_uuid(),
  region_slug text not null,
  region_name text not null,
  lat numeric(9,5) not null,
  lon numeric(9,5) not null,
  run_at timestamptz not null,
  -- valid_from/until zijn naïeve lokale ISO-strings (Europe/Amsterdam) zoals
  -- Open-Meteo ze levert; bewust als text bewaard om de lokale tijd te behouden.
  valid_from text not null,
  valid_until text not null,
  trigger text not null,
  model text not null,
  -- Gedenormaliseerd voor snelle filtering/sortering.
  -- tesla_signal = ESTOFEX-ernst 1|2|3 (1 low-end, 2 enhanced, 3 high-end).
  tesla_signal integer not null check (tesla_signal in (1,2,3)),
  reed_action text not null check (reed_action in ('HOLD','OBSERVE','SHIFT','COMMIT','ABORT')),
  confidence jsonb not null default '{}'::jsonb,
  -- Het volledige TeslaSignal-object (zie src/lib/mariana/tesla/types.ts):
  signal jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_tesla_region_time
  on public.mariana_tesla(region_slug, run_at desc);

create index if not exists idx_mariana_tesla_signal_time
  on public.mariana_tesla(tesla_signal, run_at desc);
