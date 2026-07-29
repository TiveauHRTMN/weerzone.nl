import "server-only";

import type { Attribution } from "./attribution";
import type {
  AnalyticsEnvelope,
  AnalyticsWriter,
  CalorAnalyticsEvent,
} from "./events";
import type { AnalyticsEventName, PrismaClient } from "@/generated/prisma/client";

const eventNameMap = {
  homepage_view: "HOMEPAGE_VIEW",
  destination_view: "DESTINATION_VIEW",
  trip_started: "TRIP_STARTED",
  trip_dates_added: "TRIP_DATES_ADDED",
  traveler_profile_completed: "TRAVELER_PROFILE_COMPLETED",
  trip_preview_generated: "TRIP_PREVIEW_GENERATED",
  account_created: "ACCOUNT_CREATED",
  trip_saved: "TRIP_SAVED",
  live_day_opened: "LIVE_DAY_OPENED",
  recommendation_viewed: "RECOMMENDATION_VIEWED",
  recommendation_saved: "RECOMMENDATION_SAVED",
  alternative_selected: "ALTERNATIVE_SELECTED",
  affiliate_impression: "AFFILIATE_IMPRESSION",
  affiliate_click: "AFFILIATE_CLICK",
  local_partner_click: "LOCAL_PARTNER_CLICK",
  esim_click: "ESIM_CLICK",
  weather_plan_changed: "WEATHER_PLAN_CHANGED",
  weerzone_referral_landed: "WEERZONE_REFERRAL_LANDED",
  pass_pricing_viewed: "PASS_PRICING_VIEWED",
  checkout_started: "CHECKOUT_STARTED",
  pass_purchased: "PASS_PURCHASED",
} as const satisfies Record<CalorAnalyticsEvent, AnalyticsEventName>;

export type AnalyticsWriteContext = {
  authenticatedUserId?: string;
  consentBasis: "analytics_consent";
};

export function createPrismaAnalyticsWriter(
  prisma: PrismaClient,
  context: AnalyticsWriteContext,
): AnalyticsWriter {
  return {
    async write(event: AnalyticsEnvelope) {
      if (event.userId && event.userId !== context.authenticatedUserId) {
        throw new Error("Analytics user does not match the authenticated user");
      }
      if (event.tripId) {
        if (!context.authenticatedUserId) {
          throw new Error("Trip analytics requires an authenticated owner");
        }
        const owned = await prisma.trip.count({
          where: { id: event.tripId, userId: context.authenticatedUserId },
        });
        if (owned !== 1) throw new Error("Trip analytics ownership check failed");
      }
      await prisma.analyticsEvent.upsert({
        where: { id: event.id },
        create: {
          id: event.id,
          eventName: eventNameMap[event.name],
          tripId: event.tripId,
          userId: event.userId,
          anonymousSessionId: event.anonymousSessionId,
          destinationId: event.destinationId,
          properties: event.properties,
          schemaVersion: event.schemaVersion,
          consentBasis: context.consentBasis,
          occurredAt: new Date(event.occurredAt),
        },
        update: {},
      });
    },
  };
}

function touchFields(touch: Attribution) {
  return {
    Source: touch.source,
    Medium: touch.medium,
    Campaign: touch.campaign,
    Content: touch.content,
    Term: touch.term,
  };
}

export async function persistAttribution(
  prisma: PrismaClient,
  input: {
    anonymousSessionId: string;
    userId?: string;
    touch: Attribution;
  },
): Promise<void> {
  const fields = touchFields(input.touch);
  await prisma.attributionSession.upsert({
    where: { anonymousSessionId: input.anonymousSessionId },
    create: {
      anonymousSessionId: input.anonymousSessionId,
      userId: input.userId,
      firstSource: fields.Source,
      firstMedium: fields.Medium,
      firstCampaign: fields.Campaign,
      firstContent: fields.Content,
      firstTerm: fields.Term,
      firstCapturedAt: new Date(input.touch.capturedAt),
      lastSource: fields.Source,
      lastMedium: fields.Medium,
      lastCampaign: fields.Campaign,
      lastContent: fields.Content,
      lastTerm: fields.Term,
      lastCapturedAt: new Date(input.touch.capturedAt),
    },
    update: {
      userId: input.userId,
      lastSource: fields.Source,
      lastMedium: fields.Medium,
      lastCampaign: fields.Campaign,
      lastContent: fields.Content,
      lastTerm: fields.Term,
      lastCapturedAt: new Date(input.touch.capturedAt),
    },
  });
}

