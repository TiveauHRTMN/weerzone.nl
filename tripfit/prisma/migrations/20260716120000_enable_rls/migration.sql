-- Row Level Security voor Supabase (PostgREST). Prisma verbindt als table owner
-- en wordt zonder FORCE niet door RLS geraakt; ownership wordt in de app-queries
-- afgedwongen. Deze policies sluiten de anon/authenticated API-sleutels af.
-- Vereist Supabase (auth.uid()); niet uitvoerbaar op kale PostgreSQL.

-- 1) RLS aan op alle app-tabellen (default deny voor anon/authenticated).
ALTER TABLE "countries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "destination_clusters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "season_windows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_stops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "travelers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_interests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_saved_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recommendation_outcomes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliate_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliate_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_passes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_pass_price_tiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "travel_signals" ENABLE ROW LEVEL SECURITY;

-- 2) Publieke catalogus: read-only voor iedereen met een API-sleutel.
CREATE POLICY "catalog_read_countries" ON "countries" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_read_regions" ON "regions" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_read_clusters" ON "destination_clusters" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_read_activities" ON "activities" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_read_season_windows" ON "season_windows" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_read_interests" ON "interests" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_read_travel_signals" ON "travel_signals" FOR SELECT TO anon, authenticated USING (true);

-- 3) Eigenaar leest eigen trip en kindrecords (schrijven loopt via de app/Prisma).
CREATE POLICY "trips_owner_select" ON "trips"
  FOR SELECT TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "trip_stops_owner_select" ON "trip_stops"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

CREATE POLICY "travelers_owner_select" ON "travelers"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

CREATE POLICY "trip_interests_owner_select" ON "trip_interests"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

CREATE POLICY "trip_saved_activities_owner_select" ON "trip_saved_activities"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

CREATE POLICY "recommendations_owner_select" ON "recommendations"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

CREATE POLICY "recommendation_outcomes_owner_select" ON "recommendation_outcomes"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

CREATE POLICY "trip_passes_owner_select" ON "trip_passes"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

-- Geen policies voor: sources, activity_sources, analytics_events, affiliate_offers,
-- affiliate_clicks, trip_pass_price_tiers -> volledig dicht via de API.
