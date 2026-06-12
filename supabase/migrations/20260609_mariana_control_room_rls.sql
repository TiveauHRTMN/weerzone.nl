-- Mariana intelligence is internal operational data. All application reads and
-- writes use the service role; browser/anon access must remain closed.
alter table public.mariana_oracle enable row level security;
alter table public.mariana_regions enable row level security;
alter table public.mariana_tesla enable row level security;

revoke all on table public.mariana_oracle from anon, authenticated;
revoke all on table public.mariana_regions from anon, authenticated;
revoke all on table public.mariana_tesla from anon, authenticated;
