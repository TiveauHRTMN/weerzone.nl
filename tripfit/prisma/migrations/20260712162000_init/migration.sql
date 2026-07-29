-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CoverageLevel" AS ENUM ('FLAGSHIP', 'STANDARD', 'BASIC');

-- CreateEnum
CREATE TYPE "IndoorOutdoor" AS ENUM ('INDOOR', 'OUTDOOR', 'MIXED');

-- CreateEnum
CREATE TYPE "SeasonWindowKind" AS ENUM ('FIXED_PERIOD', 'ANNUAL_RECURRING', 'PEAK_SEASON', 'SHOULDER_SEASON', 'TEMPORARY_EVENT', 'WILDLIFE_PERIOD', 'WET_SEASON', 'DRY_SEASON', 'PUBLIC_HOLIDAY');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('PEAK', 'AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "SourceAuthority" AS ENUM ('OFFICIAL', 'LOCAL_VERIFIED', 'CURRENT', 'HISTORICAL', 'INDICATIVE', 'AI_SUMMARY');

-- CreateEnum
CREATE TYPE "ProviderFallbackStatus" AS ENUM ('LIVE', 'CACHED', 'SEED_FALLBACK', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "TravelerKind" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "RecommendationPlan" AS ENUM ('BEST_TODAY', 'ALTERNATIVE', 'DEFER', 'DISCOVER');

-- CreateEnum
CREATE TYPE "RecommendationOutcomeType" AS ENUM ('IMPRESSION', 'OPENED', 'SAVED', 'DISMISSED', 'BOOKED', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AnalyticsEventName" AS ENUM ('LANDING_VIEWED', 'TRIP_FORM_STARTED', 'TRIP_PREVIEW_VIEWED', 'ACCOUNT_CREATED', 'TRIP_SAVED', 'TRIP_REOPENED', 'RECOMMENDATION_IMPRESSION', 'RECOMMENDATION_OPENED', 'RECOMMENDATION_SAVED', 'RECOMMENDATION_DISMISSED', 'AFFILIATE_CLICKED', 'TRIP_PASS_VIEWED', 'TRIP_PASS_STARTED', 'TRIP_PASS_PURCHASED', 'ACTIVITY_COMPLETED', 'ACTIVITY_RATED');

-- CreateEnum
CREATE TYPE "TripPassStatus" AS ENUM ('FREE', 'PREVIEW', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TravelImpact" AS ENUM ('DIRECT_IMPACT', 'LOCAL_OPPORTUNITY', 'GOOD_TO_KNOW', 'GENERAL');

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "iso2" CHAR(2) NOT NULL,
    "iso3" CHAR(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "currencyCode" CHAR(3) NOT NULL,
    "defaultLocale" TEXT NOT NULL DEFAULT 'nl-NL',
    "timezone" TEXT NOT NULL,
    "centerLatitude" DOUBLE PRECISION,
    "centerLongitude" DOUBLE PRECISION,
    "nationalContext" JSONB,
    "sourceCoverage" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverageLevel" "CoverageLevel" NOT NULL,
    "summary" TEXT,
    "timezone" TEXT,
    "centerLatitude" DOUBLE PRECISION,
    "centerLongitude" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_clusters" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "centerLatitude" DOUBLE PRECISION,
    "centerLongitude" DOUBLE PRECISION,
    "summary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destination_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationClusterId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "indoorOutdoor" "IndoorOutdoor" NOT NULL,
    "minimumAge" INTEGER,
    "recommendedAgeMin" INTEGER,
    "recommendedAgeMax" INTEGER,
    "durationMinutes" INTEGER,
    "priceLevel" INTEGER,
    "bookingRequired" BOOLEAN NOT NULL DEFAULT false,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "weatherSensitivity" JSONB NOT NULL,
    "openingHours" JSONB,
    "familyFit" INTEGER NOT NULL,
    "uniquenessScore" INTEGER NOT NULL,
    "localAuthenticityScore" INTEGER NOT NULL,
    "accessibilityNotes" TEXT,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "coverageLevel" "CoverageLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_windows" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "sourceId" TEXT,
    "kind" "SeasonWindowKind" NOT NULL DEFAULT 'ANNUAL_RECURRING',
    "startMonth" INTEGER,
    "startDay" INTEGER,
    "endMonth" INTEGER,
    "endDay" INTEGER,
    "startsAt" DATE,
    "endsAt" DATE,
    "status" "SeasonStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "countryId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "authority" "SourceAuthority" NOT NULL,
    "url" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rawReference" TEXT,
    "fallbackStatus" "ProviderFallbackStatus" NOT NULL DEFAULT 'SEED_FALLBACK',
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_sources" (
    "activityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rawReference" TEXT,
    "fallbackStatus" "ProviderFallbackStatus" NOT NULL DEFAULT 'SEED_FALLBACK',

    CONSTRAINT "activity_sources_pkey" PRIMARY KEY ("activityId","sourceId")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "labelNl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "countryId" TEXT NOT NULL,
    "title" TEXT,
    "arrivalDate" DATE NOT NULL,
    "departureDate" DATE NOT NULL,
    "timezone" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdFromPreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationClusterId" TEXT,
    "position" INTEGER NOT NULL,
    "arrivalDate" DATE NOT NULL,
    "departureDate" DATE NOT NULL,
    "accommodationLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travelers" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "kind" "TravelerKind" NOT NULL,
    "ageAtDeparture" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_interests" (
    "tripId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_interests_pkey" PRIMARY KEY ("tripId","interestId")
);

-- CreateTable
CREATE TABLE "trip_saved_activities" (
    "tripId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "trip_saved_activities_pkey" PRIMARY KEY ("tripId","activityId")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "recommendedFor" DATE NOT NULL,
    "plan" "RecommendationPlan" NOT NULL DEFAULT 'DISCOVER',
    "rank" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "seasonScore" DOUBLE PRECISION NOT NULL,
    "weatherScore" DOUBLE PRECISION NOT NULL,
    "travelerFitScore" DOUBLE PRECISION NOT NULL,
    "logisticsScore" DOUBLE PRECISION NOT NULL,
    "interestScore" DOUBLE PRECISION NOT NULL,
    "availabilityScore" DOUBLE PRECISION NOT NULL,
    "uniquenessScore" DOUBLE PRECISION NOT NULL,
    "valueScore" DOUBLE PRECISION NOT NULL,
    "explanationFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weightSnapshot" JSONB NOT NULL,
    "contextSnapshot" JSONB NOT NULL,
    "rankingVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_outcomes" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" UUID,
    "outcome" "RecommendationOutcomeType" NOT NULL,
    "reasonCode" TEXT,
    "reasonDetail" TEXT,
    "rating" INTEGER,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "eventName" "AnalyticsEventName" NOT NULL,
    "tripId" TEXT,
    "userId" UUID,
    "anonymousSessionId" TEXT,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_offers" (
    "id" TEXT NOT NULL,
    "activityId" TEXT,
    "provider" TEXT NOT NULL,
    "externalUrl" TEXT NOT NULL,
    "trackingUrl" TEXT,
    "price" DECIMAL(12,2),
    "currency" CHAR(3),
    "commissionType" TEXT,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "activityId" TEXT,
    "tripId" TEXT,
    "userId" UUID,
    "anonymousSessionId" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_passes" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "status" "TripPassStatus" NOT NULL DEFAULT 'FREE',
    "priceCents" INTEGER,
    "currency" CHAR(3),
    "validFrom" DATE,
    "validThrough" DATE,
    "activatedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "paymentProvider" TEXT,
    "externalPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_pass_price_tiers" (
    "id" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pass_price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_signals" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT,
    "sourceId" TEXT NOT NULL,
    "impact" "TravelImpact" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "externalUrl" TEXT,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso2_key" ON "countries"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso3_key" ON "countries"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "countries_slug_key" ON "countries"("slug");

-- CreateIndex
CREATE INDEX "regions_countryId_coverageLevel_sortOrder_idx" ON "regions"("countryId", "coverageLevel", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "regions_countryId_slug_key" ON "regions"("countryId", "slug");

-- CreateIndex
CREATE INDEX "destination_clusters_countryId_idx" ON "destination_clusters"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "destination_clusters_regionId_slug_key" ON "destination_clusters"("regionId", "slug");

-- CreateIndex
CREATE INDEX "activities_regionId_coverageLevel_isActive_idx" ON "activities"("regionId", "coverageLevel", "isActive");

-- CreateIndex
CREATE INDEX "activities_destinationClusterId_idx" ON "activities"("destinationClusterId");

-- CreateIndex
CREATE UNIQUE INDEX "activities_countryId_slug_key" ON "activities"("countryId", "slug");

-- CreateIndex
CREATE INDEX "season_windows_activityId_status_idx" ON "season_windows"("activityId", "status");

-- CreateIndex
CREATE INDEX "season_windows_startsAt_endsAt_idx" ON "season_windows"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "sources_code_key" ON "sources"("code");

-- CreateIndex
CREATE INDEX "sources_countryId_authority_idx" ON "sources"("countryId", "authority");

-- CreateIndex
CREATE UNIQUE INDEX "interests_code_key" ON "interests"("code");

-- CreateIndex
CREATE INDEX "trips_userId_arrivalDate_idx" ON "trips"("userId", "arrivalDate");

-- CreateIndex
CREATE INDEX "trips_countryId_arrivalDate_departureDate_idx" ON "trips"("countryId", "arrivalDate", "departureDate");

-- CreateIndex
CREATE INDEX "trip_stops_regionId_arrivalDate_departureDate_idx" ON "trip_stops"("regionId", "arrivalDate", "departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stops_tripId_position_key" ON "trip_stops"("tripId", "position");

-- CreateIndex
CREATE INDEX "travelers_tripId_kind_idx" ON "travelers"("tripId", "kind");

-- CreateIndex
CREATE INDEX "recommendations_tripId_recommendedFor_plan_rank_idx" ON "recommendations"("tripId", "recommendedFor", "plan", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_tripId_recommendedFor_activityId_key" ON "recommendations"("tripId", "recommendedFor", "activityId");

-- CreateIndex
CREATE INDEX "recommendation_outcomes_recommendationId_occurredAt_idx" ON "recommendation_outcomes"("recommendationId", "occurredAt");

-- CreateIndex
CREATE INDEX "recommendation_outcomes_tripId_outcome_occurredAt_idx" ON "recommendation_outcomes"("tripId", "outcome", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_occurredAt_idx" ON "analytics_events"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_tripId_occurredAt_idx" ON "analytics_events"("tripId", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_anonymousSessionId_occurredAt_idx" ON "analytics_events"("anonymousSessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "affiliate_offers_activityId_isActive_idx" ON "affiliate_offers"("activityId", "isActive");

-- CreateIndex
CREATE INDEX "affiliate_clicks_offerId_occurredAt_idx" ON "affiliate_clicks"("offerId", "occurredAt");

-- CreateIndex
CREATE INDEX "affiliate_clicks_tripId_occurredAt_idx" ON "affiliate_clicks"("tripId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "trip_passes_tripId_key" ON "trip_passes"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_passes_externalPaymentId_key" ON "trip_passes"("externalPaymentId");

-- CreateIndex
CREATE INDEX "trip_passes_status_validThrough_idx" ON "trip_passes"("status", "validThrough");

-- CreateIndex
CREATE INDEX "trip_pass_price_tiers_isActive_currency_minDays_maxDays_idx" ON "trip_pass_price_tiers"("isActive", "currency", "minDays", "maxDays");

-- CreateIndex
CREATE UNIQUE INDEX "trip_pass_price_tiers_minDays_maxDays_currency_validFrom_key" ON "trip_pass_price_tiers"("minDays", "maxDays", "currency", "validFrom");

-- CreateIndex
CREATE INDEX "travel_signals_countryId_impact_publishedAt_idx" ON "travel_signals"("countryId", "impact", "publishedAt");

-- CreateIndex
CREATE INDEX "travel_signals_regionId_startsAt_endsAt_idx" ON "travel_signals"("regionId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_clusters" ADD CONSTRAINT "destination_clusters_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_clusters" ADD CONSTRAINT "destination_clusters_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_destinationClusterId_fkey" FOREIGN KEY ("destinationClusterId") REFERENCES "destination_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_windows" ADD CONSTRAINT "season_windows_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_windows" ADD CONSTRAINT "season_windows_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sources" ADD CONSTRAINT "activity_sources_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sources" ADD CONSTRAINT "activity_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_destinationClusterId_fkey" FOREIGN KEY ("destinationClusterId") REFERENCES "destination_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travelers" ADD CONSTRAINT "travelers_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_interests" ADD CONSTRAINT "trip_interests_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_interests" ADD CONSTRAINT "trip_interests_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_saved_activities" ADD CONSTRAINT "trip_saved_activities_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_saved_activities" ADD CONSTRAINT "trip_saved_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_outcomes" ADD CONSTRAINT "recommendation_outcomes_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_outcomes" ADD CONSTRAINT "recommendation_outcomes_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_offers" ADD CONSTRAINT "affiliate_offers_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "affiliate_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_passes" ADD CONSTRAINT "trip_passes_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_signals" ADD CONSTRAINT "travel_signals_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_signals" ADD CONSTRAINT "travel_signals_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_signals" ADD CONSTRAINT "travel_signals_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
