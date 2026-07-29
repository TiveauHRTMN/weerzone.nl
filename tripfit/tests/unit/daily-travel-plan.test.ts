import { describe, expect, it } from "vitest";

import { generateDailyTravelPlan } from "@/features/daily-plan/generate-daily-travel-plan";
import { travelOptionSchema } from "@/domain/travel-options/model";

const base = {
  destinationId: "do",
  description: "Gecontroleerde keuze",
  indoorOutdoor: "mixed" as const,
  weatherRules: {},
  familyFriendly: true,
  providerType: "editorial" as const,
  commissionEligible: false,
  verificationStatus: "verified" as const,
  isPublished: true,
  isIndexable: true,
};

const input = {
  tripId: "trip-1",
  date: "2026-08-12",
  destinationId: "do",
  travelerProfile: {
    travelPartyType: "solo" as const,
    adults: 1,
    children: [],
    budgetLevel: "balanced" as const,
    interests: ["culture" as const],
    preferredPace: "balanced" as const,
    mobility: "standard" as const,
    foodPreferences: [],
  },
  weatherContext: {
    rainProbability: 70,
    windKph: 12,
    feelsLikeCelsius: 31,
    thunderstorm: false,
  },
  availableOptions: [
    travelOptionSchema.parse({
      ...base,
      id: "museum",
      slug: "museum",
      title: "Museum",
      type: "activity",
      indoorOutdoor: "indoor",
    }),
    travelOptionSchema.parse({
      ...base,
      id: "dinner",
      slug: "dinner",
      title: "Diner",
      type: "restaurant",
    }),
  ],
  generatedAt: "2026-08-12T08:00:00.000Z",
};

describe("Today in Calor plan", () => {
  it("creates deterministic slots and a rain-ready plan", async () => {
    const result = await generateDailyTravelPlan(input);
    expect(result.morning?.optionId).toBe("museum");
    expect(result.evening?.optionId).toBe("dinner");
    expect(result.weatherSummary).toMatch(/Regenkans/);
  });

  it("falls back safely when AI wording is invalid", async () => {
    const result = await generateDailyTravelPlan({
      ...input,
      wordingProvider: { word: async () => ({ invented: "facts" }) },
    });
    expect(result.daySummary).toMatch(/passende momenten/);
  });
});

