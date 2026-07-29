import { z } from "zod";

export const travelerProfileSchema = z.object({
  travelPartyType: z.enum(["solo", "couple", "family", "friends", "business"]),
  adults: z.number().int().min(1).max(20),
  children: z.array(z.object({ age: z.number().int().min(0).max(17) })).max(20),
  budgetLevel: z.enum(["budget", "balanced", "premium"]),
  interests: z
    .array(
      z.enum([
        "beach",
        "culture",
        "history",
        "food",
        "nature",
        "adventure",
        "shopping",
        "nightlife",
        "family",
        "wellness",
      ]),
    )
    .max(10),
  preferredPace: z.enum(["slow", "balanced", "active"]),
  mobility: z.enum(["standard", "limited"]),
  transport: z.string().trim().max(80).optional(),
  accommodationArea: z.string().trim().max(120).optional(),
  indoorOutdoor: z.enum(["indoor", "outdoor", "mixed"]).optional(),
  foodPreferences: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});

export type TravelerProfile = z.infer<typeof travelerProfileSchema>;

