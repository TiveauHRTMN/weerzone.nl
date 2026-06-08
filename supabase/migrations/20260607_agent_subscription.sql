-- Proactive agent layer: free subscribers get Piet; Reed/Koos opt-in.
alter table public.subscribers
  add column if not exists reed_on boolean not null default false,
  add column if not exists koos_on boolean not null default false,
  add column if not exists manage_token uuid not null default gen_random_uuid(),
  add column if not exists gps_updated_at timestamptz,
  add column if not exists reed_last_alert_at timestamptz,
  add column if not exists reed_last_alert_key text,
  add column if not exists koos_last_nudge_at timestamptz,
  add column if not exists koos_pref text not null default 'rain_avoider';

create unique index if not exists subscribers_manage_token_idx
  on public.subscribers (manage_token);
