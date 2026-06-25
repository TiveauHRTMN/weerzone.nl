-- Mariana Studio — dagelijkse TikTok-slide-inhoud (1 rij per dag).
create table if not exists public.mariana_studio (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  forecast_date date not null,
  slide1 jsonb not null,
  slide2 jsonb not null,
  slide3 jsonb not null,
  slide4 jsonb,                       -- nullable: geen heads-up = niet posten
  created_at timestamptz not null default now()
);

create index if not exists mariana_studio_run_at_idx on public.mariana_studio (run_at desc);
