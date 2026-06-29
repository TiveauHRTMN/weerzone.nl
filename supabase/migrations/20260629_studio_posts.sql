-- Mariana Studio — TikTok-post log + dedupe-lock (1 rij per geslaagde slot-post per dag).
create table if not exists public.studio_posts (
  id uuid primary key default gen_random_uuid(),
  forecast_date date not null,
  slot text not null,                 -- slide1 | slide2 | slide3 | slide4
  status text not null,               -- posted | failed
  buffer_id text,
  image_url text,
  caption text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Harde lock: max één GESLAAGDE post per (dag, slot). Mislukte pogingen mogen blijven.
create unique index if not exists studio_posts_posted_unique
  on public.studio_posts (forecast_date, slot)
  where status = 'posted';

create index if not exists studio_posts_date_idx on public.studio_posts (forecast_date desc);
