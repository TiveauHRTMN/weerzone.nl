import { describe, expect, it } from "vitest";

import { rankTravelOptions, type RecommendationContext } from "@/domain/recommendations/engine";
import { travelOptionSchema, type TravelOption } from "@/domain/travel-options/model";

function option(overrides: Partial<TravelOption> = {}): TravelOption {
  return travelOptionSchema.parse({
    id: "base",
    slug: "base",
    title: "Base",
    description: "Verified option",
    type: "activity",
    destinationId: "do",
    indoorOutdoor: "outdoor",
    weatherRules: {},
    familyFriendly: true,
    providerType: "editorial",
    commissionEligible: false,
    verificationStatus: "verified",
    isPublished: true,
    isIndexable: true,
    rating: 4.5,
    reviewCount: 100,
    ...overrides,
  });
}

const context: RecommendationContext = {
  date: "2026-08-12",
  destinationId: "do",
  latitude: 18.48,
  longitude: -69.9,
  travelerProfile: {
    travelPartyType: "family",
    adults: 2,
    children: [{ age: 8 }],
    budgetLevel: "balanced",
    interests: ["nature", "family"],
    preferredPace: "balanced",
    mobility: "standard",
    foodPreferences: [],
  },
  weather: {
    rainProbability: 20,
    windKph: 12,
    feelsLikeCelsius: 31,
    thunderstorm: false,
  },
};

describe("deterministic recommendation engine", () => {
  it("rejects an option outside its date window", () => {
    const result = rankTravelOptions(
      [option({ availableUntil: "2026-08-11" })],
      context,
    );
    expect(result.ranked).toHaveLength(0);
    expect(result.rejected[0]?.reasons).toContain("Niet meer beschikbaar");
  });

  it("rejects an option when a child is too young", () => {
    const result = rankTravelOptions([option({ minAge: 12 })], context);
    expect(result.rejected[0]?.reasons).toContain("Minimumleeftijd is 12 jaar");
  });

  it("rejects a boat option above its safe wind limit", () => {
    const result = rankTravelOptions(
      [option({ type: "excursion", weatherRules: { maxWindKph: 10, suitableConditions: [], unsuitableConditions: [] } })],
      context,
    );
    expect(result.rejected[0]?.reasons).toContain("Te veel wind");
  });

  it("ranks profile, weather and local value without commission", () => {
    const local = option({ id: "local", localValueScore: 95, priceLevel: 2 });
    const affiliate = option({
      id: "affiliate",
      localValueScore: 20,
      priceLevel: 4,
      commissionEligible: true,
      affiliateUrl: "https://example.com/affiliate",
    });
    const result = rankTravelOptions([affiliate, local], context);
    expect(result.ranked[0]?.option.id).toBe("local");
  });

  it("is stable for identical input", () => {
    const options = [option({ id: "b" }), option({ id: "a" })];
    expect(rankTravelOptions(options, context)).toEqual(
      rankTravelOptions(options, context),
    );
    expect(rankTravelOptions(options, context).ranked[0]?.option.id).toBe("a");
  });
});

