-- Security-audit 2026-07-03: mariana_studio en studio_posts werden aangemaakt
-- zónder RLS, terwijl de sibling-tabellen (mariana_oracle/regions/tesla, zie
-- 20260609_mariana_control_room_rls.sql) dicht zitten. Zonder dit kan iedereen
-- met de publieke anon-key (zit in de client-bundle) beide tabellen via
-- PostgREST lezen én schrijven — o.a. een eigen rij met verse run_at injecteren
-- die loadLatestStudioDay() dan als "laatste Studio-dag" oppakt.
--
-- Alle app-reads/-writes gebruiken de service role (bypasst RLS); browser/anon
-- hoort dicht. Draai dit in de Supabase SQL editor (production). Idempotent.

alter table public.mariana_studio enable row level security;
alter table public.studio_posts enable row level security;

revoke all on table public.mariana_studio from anon, authenticated;
revoke all on table public.studio_posts from anon, authenticated;

-- Verifieer daarna met de anon-key (hoort een lege lijst / 401-achtige respons te geven):
-- curl "https://<project>.supabase.co/rest/v1/studio_posts?select=*" \
--   -H "apikey: <anon>" -H "Authorization: Bearer <anon>"
