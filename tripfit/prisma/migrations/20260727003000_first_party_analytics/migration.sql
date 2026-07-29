-- Typed Calor funnel events and first/last-touch attribution.
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'HOMEPAGE_VIEW';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'DESTINATION_VIEW';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'TRIP_STARTED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'TRIP_DATES_ADDED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'TRAVELER_PROFILE_COMPLETED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'TRIP_PREVIEW_GENERATED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'LIVE_DAY_OPENED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'RECOMMENDATION_VIEWED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'ALTERNATIVE_SELECTED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'AFFILIATE_IMPRESSION';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'AFFILIATE_CLICK';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'LOCAL_PARTNER_CLICK';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'ESIM_CLICK';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'WEATHER_PLAN_CHANGED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'WEERZONE_REFERRAL_LANDED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'PASS_PRICING_VIEWED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'CHECKOUT_STARTED';
ALTER TYPE "AnalyticsEventName" ADD VALUE IF NOT EXISTS 'PASS_PURCHASED';

ALTER TABLE "analytics_events"
  ADD COLUMN "destinationId" TEXT,
  ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "consentBasis" TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX "analytics_events_destinationId_eventName_occurredAt_idx"
  ON "analytics_events"("destinationId", "eventName", "occurredAt");

CREATE TABLE "attribution_sessions" (
  "id" TEXT NOT NULL,
  "anonymousSessionId" TEXT NOT NULL,
  "userId" UUID,
  "firstSource" TEXT,
  "firstMedium" TEXT,
  "firstCampaign" TEXT,
  "firstContent" TEXT,
  "firstTerm" TEXT,
  "firstCapturedAt" TIMESTAMP(3) NOT NULL,
  "lastSource" TEXT,
  "lastMedium" TEXT,
  "lastCampaign" TEXT,
  "lastContent" TEXT,
  "lastTerm" TEXT,
  "lastCapturedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attribution_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attribution_sessions_anonymousSessionId_key"
  ON "attribution_sessions"("anonymousSessionId");
CREATE INDEX "attribution_sessions_userId_updatedAt_idx"
  ON "attribution_sessions"("userId", "updatedAt");
CREATE INDEX "attribution_sessions_firstSource_firstCampaign_idx"
  ON "attribution_sessions"("firstSource", "firstCampaign");
CREATE INDEX "attribution_sessions_lastSource_lastCampaign_idx"
  ON "attribution_sessions"("lastSource", "lastCampaign");

ALTER TABLE "attribution_sessions" ENABLE ROW LEVEL SECURITY;
-- No API policies: analytics and attribution are written/read only by trusted
-- server-side application services.

