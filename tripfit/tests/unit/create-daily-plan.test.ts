import { describe, expect, it } from "vitest";

import { travelOptionSchema } from "@/domain/travel-options/model";
import { createDailyPlan } from "@/features/daily-plan/create-daily-plan";
import type { DailyPlanSnapshotInput } from "@/features/daily-plan/daily-plan-snapshot-repository";

const option = travelOptionSchema.parse({
  id: "museum",
  slug: "museum",
  title: "Museum",
  description: "Een gecontroleerde binnenoptie.",
  type: "activity",
  destinationId: "do",
  regionId: "samana",
  indoorOutdoor: "indoor",
  weatherRules: {},
  familyFriendly: true,
  providerType: "editorial",
  commissionEligible: false,
  verificationStatus: "verified",
  isPublished: true,
  isIndexable: true,
});

const input = {
  tripId: "trip-1",
  date: "2026-08-12",
  destinationId: "do",
  regionId: "samana",
  latitude: 19.2,
  longitude: -69.3,
  timezone: "America/Santo_Domingo",
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
  profileRevision: "profile-v1",
};

describe("createDailyPlan", () => {
  it("persists and then reuses a weather/profile-specific snapshot", async () => {
    let stored: DailyPlanSnapshotInput | null = null;
    let generated = 0;
    const dependencies = {
      options: {
        findAvailable: async () => {
          generated += 1;
          return [option];
        },
      },
      weather: {
        getContext: async () => ({
          context: {
            rainProbability: 70,
            windKph: 10,
            feelsLikeCelsius: 30,
            thunderstorm: false,
          },
          horizon: "climate" as const,
          confidence: 0.45,
          retrievedAt: "2026-08-12T06:00:00.000Z",
          validThrough: "2026-08-12T23:59:59.999Z",
          source: "Seizoensbeeld",
          revision: "weather-v1",
          fallbackStatus: "seed" as const,
        }),
      },
      snapshots: {
        find: async () => stored?.plan ?? null,
        save: async (value: DailyPlanSnapshotInput) => {
          stored = value;
        },
      },
    };

    const first = await createDailyPlan(input, dependencies);
    const second = await createDailyPlan(input, dependencies);

    expect(first?.morning?.optionId).toBe("museum");
    expect(second).toEqual(first);
    expect(stored).toMatchObject({
      weatherRevision: "weather-v1",
      profileRevision: "profile-v1",
      rankingVersion: "calor-daily-v1",
    });
    expect(generated).toBe(2);
  });
});
