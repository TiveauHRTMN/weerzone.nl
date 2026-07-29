import { z } from "zod";

export const travelOptionTypes = [
  "activity",
  "excursion",
  "event",
  "restaurant",
  "beach",
  "shopping",
  "transport",
  "esim",
  "accommodation",
] as const;

export const providerTypes = [
  "local",
  "viator",
  "getyourguide",
  "airalo",
  "holafly",
  "editorial",
  "other",
] as const;

export const weatherRulesSchema = z.object({
  maxRainProbability: z.number().min(0).max(100).optional(),
  maxWindKph: z.number().nonnegative().optional(),
  maxFeelsLikeCelsius: z.number().optional(),
  minTemperatureCelsius: z.number().optional(),
  maxTemperatureCelsius: z.number().optional(),
  avoidThunderstorm: z.boolean().optional(),
  suitableConditions: z.array(z.string().trim().min(1)).default([]),
  unsuitableConditions: z.array(z.string().trim().min(1)).default([]),
});

export const travelOptionSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(travelOptionTypes),
    destinationId: z.string().min(1),
    regionId: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    availableFrom: z.iso.date().optional(),
    availableUntil: z.iso.date().optional(),
    availableWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
    durationMinutes: z.number().int().positive().optional(),
    indoorOutdoor: z.enum(["indoor", "outdoor", "mixed"]),
    weatherRules: weatherRulesSchema,
    minAge: z.number().int().nonnegative().optional(),
    familyFriendly: z.boolean(),
    accessibilityNotes: z.string().optional(),
    priceFrom: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    priceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    providerType: z.enum(providerTypes),
    providerId: z.string().min(1).optional(),
    externalUrl: z.url().optional(),
    affiliateUrl: z.url().optional(),
    commissionEligible: z.boolean(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().nonnegative().optional(),
    verificationStatus: z.enum(["unverified", "verified", "stale", "disabled"]),
    lastVerifiedAt: z.iso.datetime().optional(),
    sourceUpdatedAt: z.iso.datetime().optional(),
    isPublished: z.boolean(),
    isIndexable: z.boolean(),
    localValueScore: z.number().min(0).max(100).default(50),
  })
  .superRefine((value, context) => {
    if (
      value.availableFrom &&
      value.availableUntil &&
      value.availableFrom > value.availableUntil
    ) {
      context.addIssue({
        code: "custom",
        path: ["availableUntil"],
        message: "availableUntil must not be before availableFrom",
      });
    }
    if (value.priceFrom !== undefined && !value.currency) {
      context.addIssue({
        code: "custom",
        path: ["currency"],
        message: "currency is required when priceFrom is present",
      });
    }
  });

export type WeatherRules = z.infer<typeof weatherRulesSchema>;
export type TravelOption = z.infer<typeof travelOptionSchema>;
export type TravelOptionType = (typeof travelOptionTypes)[number];
export type ProviderType = (typeof providerTypes)[number];

