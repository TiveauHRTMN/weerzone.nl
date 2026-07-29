import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import type { PrismaClient } from "@/generated/prisma/client";

import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  hasAnalyticsConsent,
} from "./consent";
import {
  trackCalorEvent,
  type CalorAnalyticsEvent,
} from "./events";
import { createPrismaAnalyticsWriter } from "./persistence";

export async function trackAuthenticatedServerEvent(input: {
  prisma: PrismaClient;
  userId: string;
  name: CalorAnalyticsEvent;
  tripId?: string;
  destinationId?: string;
  properties?: Record<string, string | number | boolean | null>;
}): Promise<"recorded" | "skipped" | "failed"> {
  const cookieStore = await cookies();
  const consent = hasAnalyticsConsent(
    cookieStore.get(ANALYTICS_CONSENT_COOKIE)?.value,
  );
  if (!consent) return "skipped";
  try {
    return await trackCalorEvent(
      createPrismaAnalyticsWriter(input.prisma, {
        authenticatedUserId: input.userId,
        consentBasis: "analytics_consent",
      }),
      {
        id: randomUUID(),
        name: input.name,
        occurredAt: new Date().toISOString(),
        schemaVersion: 1,
        anonymousSessionId: cookieStore.get(ANALYTICS_SESSION_COOKIE)?.value,
        userId: input.userId,
        tripId: input.tripId,
        destinationId: input.destinationId,
        properties: input.properties ?? {},
      },
      true,
    );
  } catch {
    return "failed";
  }
}

