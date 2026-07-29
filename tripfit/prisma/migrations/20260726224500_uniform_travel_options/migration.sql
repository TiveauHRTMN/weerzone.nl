-- Additive Calor travel-option and traveler-profile foundation.
CREATE TYPE "TravelOptionType" AS ENUM (
  'ACTIVITY', 'EXCURSION', 'EVENT', 'RESTAURANT', 'BEACH',
  'SHOPPING', 'TRANSPORT', 'ESIM', 'ACCOMMODATION'
);
CREATE TYPE "ProviderType" AS ENUM (
  'LOCAL', 'VIATOR', 'GETYOURGUIDE', 'AIRALO', 'HOLAFLY', 'EDITORIAL', 'OTHER'
);
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'STALE', 'DISABLED');
CREATE TYPE "TravelPartyType" AS ENUM ('SOLO', 'COUPLE', 'FAMILY', 'FRIENDS', 'BUSINESS');
CREATE TYPE "BudgetLevel" AS ENUM ('BUDGET', 'BALANCED', 'PREMIUM');
CREATE TYPE "PreferredPace" AS ENUM ('SLOW', 'BALANCED', 'ACTIVE');
CREATE TYPE "MobilityLevel" AS ENUM ('STANDARD', 'LIMITED');

CREATE TABLE "locations" (
  "id" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  "regionId" TEXT,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "addressLine" TEXT,
  "locality" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "timezone" TEXT,
  "sourceMetadata" JSONB,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "locations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT,
  CONSTRAINT "locations_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL
);

CREATE TABLE "providers" (
  "id" TEXT NOT NULL,
  "countryId" TEXT,
  "type" "ProviderType" NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "whatsapp" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "pickupLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "paymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cancellationPolicy" TEXT,
  "commissionType" TEXT,
  "commissionValue" DECIMAL(12,2),
  "commissionCurrency" CHAR(3),
  "contractPartyNotice" TEXT,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "lastVerifiedAt" TIMESTAMP(3),
  "sourceMetadata" JSONB,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "providers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "providers_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL
);

CREATE TABLE "provider_regions" (
  "providerId" TEXT NOT NULL,
  "regionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_regions_pkey" PRIMARY KEY ("providerId", "regionId"),
  CONSTRAINT "provider_regions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE,
  CONSTRAINT "provider_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE
);

CREATE TABLE "travel_options" (
  "id" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  "regionId" TEXT,
  "locationId" TEXT,
  "providerId" TEXT,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" "TravelOptionType" NOT NULL,
  "availableFrom" DATE,
  "availableUntil" DATE,
  "availableWeekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "durationMinutes" INTEGER,
  "indoorOutdoor" "IndoorOutdoor" NOT NULL,
  "weatherRules" JSONB,
  "minAge" INTEGER,
  "familyFriendly" BOOLEAN NOT NULL DEFAULT false,
  "accessibilityNotes" TEXT,
  "priceFrom" DECIMAL(12,2),
  "currency" CHAR(3),
  "priceLevel" INTEGER,
  "externalUrl" TEXT,
  "affiliateUrl" TEXT,
  "commissionEligible" BOOLEAN NOT NULL DEFAULT false,
  "rating" DOUBLE PRECISION,
  "reviewCount" INTEGER,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "lastVerifiedAt" TIMESTAMP(3),
  "sourceUpdatedAt" TIMESTAMP(3),
  "sourceMetadata" JSONB,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isIndexable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "travel_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "travel_options_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT,
  CONSTRAINT "travel_options_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL,
  CONSTRAINT "travel_options_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL,
  CONSTRAINT "travel_options_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL,
  CONSTRAINT "travel_options_priceLevel_check" CHECK ("priceLevel" IS NULL OR "priceLevel" BETWEEN 1 AND 4),
  CONSTRAINT "travel_options_weekdays_check" CHECK ("availableWeekdays" <@ ARRAY[0,1,2,3,4,5,6]),
  CONSTRAINT "travel_options_minAge_check" CHECK ("minAge" IS NULL OR "minAge" >= 0)
);

CREATE TABLE "traveler_profiles" (
  "id" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "travelPartyType" "TravelPartyType" NOT NULL,
  "adults" INTEGER NOT NULL,
  "childAges" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "budgetLevel" "BudgetLevel" NOT NULL,
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferredPace" "PreferredPace" NOT NULL,
  "mobility" "MobilityLevel" NOT NULL,
  "transport" TEXT,
  "indoorOutdoor" "IndoorOutdoor",
  "foodPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "traveler_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "traveler_profiles_adults_check" CHECK ("adults" >= 1),
  CONSTRAINT "traveler_profiles_childAges_check" CHECK (0 <= ALL ("childAges") AND 17 >= ALL ("childAges"))
);

CREATE TABLE "trip_preference_snapshots" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "travelPartyType" "TravelPartyType" NOT NULL,
  "adults" INTEGER NOT NULL,
  "childAges" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "budgetLevel" "BudgetLevel" NOT NULL,
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferredPace" "PreferredPace" NOT NULL,
  "mobility" "MobilityLevel" NOT NULL,
  "transport" TEXT,
  "accommodationArea" TEXT,
  "indoorOutdoor" "IndoorOutdoor",
  "foodPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trip_preference_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trip_preference_snapshots_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE
);

CREATE TABLE "trip_saved_options" (
  "tripId" TEXT NOT NULL,
  "travelOptionId" TEXT NOT NULL,
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  CONSTRAINT "trip_saved_options_pkey" PRIMARY KEY ("tripId", "travelOptionId"),
  CONSTRAINT "trip_saved_options_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE,
  CONSTRAINT "trip_saved_options_travelOptionId_fkey" FOREIGN KEY ("travelOptionId") REFERENCES "travel_options"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "locations_countryId_slug_key" ON "locations"("countryId", "slug");
CREATE INDEX "locations_regionId_isPublished_idx" ON "locations"("regionId", "isPublished");
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");
CREATE INDEX "providers_type_verificationStatus_isPublished_idx" ON "providers"("type", "verificationStatus", "isPublished");
CREATE INDEX "provider_regions_regionId_idx" ON "provider_regions"("regionId");
CREATE UNIQUE INDEX "travel_options_countryId_slug_key" ON "travel_options"("countryId", "slug");
CREATE INDEX "travel_options_regionId_type_isPublished_idx" ON "travel_options"("regionId", "type", "isPublished");
CREATE INDEX "travel_options_providerId_verificationStatus_idx" ON "travel_options"("providerId", "verificationStatus");
CREATE INDEX "travel_options_availableFrom_availableUntil_idx" ON "travel_options"("availableFrom", "availableUntil");
CREATE INDEX "travel_options_isIndexable_isPublished_idx" ON "travel_options"("isIndexable", "isPublished");
CREATE UNIQUE INDEX "traveler_profiles_userId_key" ON "traveler_profiles"("userId");
CREATE UNIQUE INDEX "trip_preference_snapshots_tripId_key" ON "trip_preference_snapshots"("tripId");
CREATE INDEX "trip_saved_options_travelOptionId_idx" ON "trip_saved_options"("travelOptionId");

ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "travel_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "traveler_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_preference_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_saved_options" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_locations_read" ON "locations" FOR SELECT TO anon, authenticated
  USING ("isPublished" = true AND "deletedAt" IS NULL);
CREATE POLICY "public_providers_read" ON "providers" FOR SELECT TO anon, authenticated
  USING ("isPublished" = true AND "verificationStatus" = 'VERIFIED' AND "deletedAt" IS NULL);
CREATE POLICY "public_provider_regions_read" ON "provider_regions" FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM "providers" p
    WHERE p.id = "providerId" AND p."isPublished" = true
      AND p."verificationStatus" = 'VERIFIED' AND p."deletedAt" IS NULL
  ));
CREATE POLICY "public_travel_options_read" ON "travel_options" FOR SELECT TO anon, authenticated
  USING (
    "isPublished" = true
    AND "verificationStatus" IN ('VERIFIED', 'STALE')
    AND "deletedAt" IS NULL
  );
CREATE POLICY "traveler_profiles_owner_all" ON "traveler_profiles" FOR ALL TO authenticated
  USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");
CREATE POLICY "trip_preference_snapshots_owner_read" ON "trip_preference_snapshots" FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));
CREATE POLICY "trip_saved_options_owner_read" ON "trip_saved_options" FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "trips" t WHERE t.id = "tripId" AND t."userId" = auth.uid()));

