-- Blok (b) van de agents-handoff: Reed → web push. Twee stukken:
--  1. push_devices: één rij per browser/apparaat (Web Push-endpoint + sleutels),
--     gekoppeld aan auth.users. Het abonnement zelf (agent+plaats+kanaal) staat
--     in agent_subscriptions met channel='push'.
--  2. reed_warning_alerts krijgt een channel in de dedup, zodat dezelfde
--     KNMI-uitgifte één mail én één push mag opleveren, maar nooit dubbel.
--
-- Draai dit in de Supabase SQL editor (production). Idempotent.

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  -- Gezet wanneer de push-dienst 404/410 teruggeeft (abonnement vervallen).
  disabled_at timestamptz
);

create index if not exists push_devices_user_active_idx
  on public.push_devices (user_id)
  where disabled_at is null;

alter table public.push_devices enable row level security;

revoke all on table public.push_devices from anon;

drop policy if exists "push_devices_select_own" on public.push_devices;
create policy "push_devices_select_own"
  on public.push_devices for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes lopen via de service role (register-route + cron); de browser hoeft
-- alleen eigen rijen te kunnen zien.

-- ---- reed_warning_alerts: kanaal in de dedup ----

alter table public.reed_warning_alerts
  add column if not exists channel text not null default 'email'
  check (channel in ('email', 'push'));

alter table public.reed_warning_alerts
  drop constraint if exists reed_warning_alerts_uniq;

alter table public.reed_warning_alerts
  add constraint reed_warning_alerts_uniq unique (user_id, warning_key, channel);

-- Push-rijen hebben geen mailadres.
alter table public.reed_warning_alerts
  alter column email drop not null;
