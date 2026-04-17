-- Cache voor Amazon PA-API resultaten.
-- Key = ASIN (bijv. "B07B8K47M2") of "search:KEYWORDS" voor zoek-based items.
create table if not exists amazon_products_cache (
  cache_key     text primary key,
  asin          text,
  data          jsonb not null,
  refreshed_at  timestamptz not null default now()
);

create index if not exists amazon_products_cache_refreshed_at_idx
  on amazon_products_cache (refreshed_at desc);

-- RLS: alleen service_role / anon read
alter table amazon_products_cache enable row level security;
create policy "public read" on amazon_products_cache
  for select using (true);
-- Schrijven alleen via server (service role key) — anon heeft geen insert.
