import { z } from "zod";

export const calorAnalyticsEvents = [
  "homepage_view",
  "destination_view",
  "trip_started",
  "trip_dates_added",
  "traveler_profile_completed",
  "trip_preview_generated",
  "account_created",
  "trip_saved",
  "live_day_opened",
  "recommendation_viewed",
  "recommendation_saved",
  "alternative_selected",
  "affiliate_impression",
  "affiliate_click",
  "local_partner_click",
  "esim_click",
  "weather_plan_changed",
  "weerzone_referral_landed",
  "pass_pricing_viewed",
  "checkout_started",
  "pass_purchased",
] as const;

export type CalorAnalyticsEvent = (typeof calorAnalyticsEvents)[number];

const safeId = z.string().trim().min(1).max(128);
const propertiesSchema = z
  .record(
    z.string().max(64),
    z.union([z.string().max(256), z.number(), z.boolean(), z.null()]),
  )
  .default({});

export const analyticsEnvelopeSchema = z.object({
  id: z.uuid(),
  name: z.enum(calorAnalyticsEvents),
  occurredAt: z.iso.datetime(),
  schemaVersion: z.literal(1),
  anonymousSessionId: safeId.optional(),
  userId: z.uuid().optional(),
  tripId: safeId.optional(),
  destinationId: safeId.optional(),
  properties: propertiesSchema,
});

export type AnalyticsEnvelope = z.infer<typeof analyticsEnvelopeSchema>;

export type AnalyticsWriter = {
  write(event: AnalyticsEnvelope): Promise<void>;
};

const forbiddenPropertyPattern =
  /(email|e-mail|childage|child_age|accommodation|address|full.?url|name)/i;

export function validateAnalyticsEvent(input: unknown): AnalyticsEnvelope {
  const event = analyticsEnvelopeSchema.parse(input);
  for (const key of Object.keys(event.properties)) {
    if (forbiddenPropertyPattern.test(key)) {
      throw new Error(`Sensitive analytics property is not allowed: ${key}`);
    }
  }
  if (!event.userId && !event.anonymousSessionId) {
    throw new Error("Analytics requires a user or privacy-safe anonymous session");
  }
  return event;
}

export async function trackCalorEvent(
  writer: AnalyticsWriter,
  input: unknown,
  consent: boolean,
): Promise<"recorded" | "skipped"> {
  if (!consent) return "skipped";
  await writer.write(validateAnalyticsEvent(input));
  return "recorded";
}

