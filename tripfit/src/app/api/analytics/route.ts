import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { z } from "zod";

import { getPrismaClient } from "@/db/client";
import { attributionFromUrl } from "@/features/analytics/attribution";
import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  hasAnalyticsConsent,
} from "@/features/analytics/consent";
import {
  calorAnalyticsEvents,
  trackCalorEvent,
} from "@/features/analytics/events";
import {
  createPrismaAnalyticsWriter,
  persistAttribution,
} from "@/features/analytics/persistence";
import {
  readBoundedJson,
  RequestBodyTooLargeError,
} from "@/lib/http/read-json-body";
import {
  anonymizeRateLimitKey,
  checkRateLimit,
  clientAddress,
} from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAXIMUM_ANALYTICS_BODY_BYTES = 16_384;
const MAXIMUM_ANALYTICS_PROPERTIES = 24;

const requestSchema = z.object({
  id: z.uuid().optional(),
  name: z.enum(calorAnalyticsEvents),
  occurredAt: z.iso.datetime().optional(),
  tripId: z.string().trim().min(1).max(128).optional(),
  destinationId: z.string().trim().min(1).max(128).optional(),
  properties: z
    .record(
      z.string().max(64),
      z.union([z.string().max(256), z.number(), z.boolean(), z.null()]),
    )
    .refine(
      (properties) =>
        Object.keys(properties).length <= MAXIMUM_ANALYTICS_PROPERTIES,
      "Too many analytics properties",
    )
    .default({}),
  pageUrl: z.url().max(2_000).optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    bucket: "analytics:event",
    key: anonymizeRateLimitKey(clientAddress(request.headers)),
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many analytics events" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request, MAXIMUM_ANALYTICS_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: "Payload too large" }, { status: 413 });
    }
    return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  }
  const cookieStore = await cookies();
  if (
    !hasAnalyticsConsent(cookieStore.get(ANALYTICS_CONSENT_COOKIE)?.value)
  ) {
    return Response.json({ status: "skipped" }, { status: 202 });
  }
  const prisma = getPrismaClient();
  if (!prisma) {
    return Response.json({ error: "Analytics unavailable" }, { status: 503 });
  }
  const sessionId =
    cookieStore.get(ANALYTICS_SESSION_COOKIE)?.value ?? randomUUID();
  if (!cookieStore.has(ANALYTICS_SESSION_COOKIE)) {
    cookieStore.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  try {
    await trackCalorEvent(
      createPrismaAnalyticsWriter(prisma, {
        authenticatedUserId: user?.id,
        consentBasis: "analytics_consent",
      }),
      {
        id: parsed.data.id ?? randomUUID(),
        name: parsed.data.name,
        occurredAt: parsed.data.occurredAt ?? new Date().toISOString(),
        schemaVersion: 1,
        anonymousSessionId: sessionId,
        userId: user?.id,
        tripId: parsed.data.tripId,
        destinationId: parsed.data.destinationId,
        properties: parsed.data.properties,
      },
      true,
    );
    if (parsed.data.pageUrl) {
      const touch = attributionFromUrl(new URL(parsed.data.pageUrl));
      if (touch) {
        await persistAttribution(prisma, {
          anonymousSessionId: sessionId,
          userId: user?.id,
          touch,
        });
      }
    }
  } catch {
    return Response.json({ error: "Analytics event rejected" }, { status: 400 });
  }
  return Response.json({ status: "recorded" }, { status: 201 });
}
