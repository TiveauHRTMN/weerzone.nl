import { describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { getLiveDayForUser } from "./live-day-query";

describe("getLiveDayForUser", () => {
  it("uses published travel options and the trip preference snapshot for Today in Calor", async () => {
    let persistedSnapshot: unknown;
    const prisma = {
      trip: {
        findFirst: async () => ({
          id: "trip-1",
          title: "Samaná rustig ontdekken",
          countryId: "do",
          arrivalDate: new Date("2026-08-10T00:00:00Z"),
          departureDate: new Date("2026-08-20T00:00:00Z"),
          timezone: "America/Santo_Domingo",
          country: {
            id: "do",
            name: "Dominicaanse Republiek",
            centerLatitude: 18.7,
            centerLongitude: -70.2,
          },
          preferenceSnapshot: {
            travelPartyType: "SOLO",
            adults: 1,
            childAges: [],
            budgetLevel: "BALANCED",
            interests: ["culture"],
            preferredPace: "SLOW",
            mobility: "STANDARD",
            transport: null,
            accommodationArea: null,
            indoorOutdoor: "INDOOR",
            foodPreferences: [],
            updatedAt: new Date("2026-07-28T08:00:00Z"),
          },
          travelers: [{ kind: "ADULT" }],
          stops: [{
            regionId: "samana",
            arrivalDate: new Date("2026-08-10T00:00:00Z"),
            departureDate: new Date("2026-08-20T00:00:00Z"),
            region: {
              name: "Samaná",
              centerLatitude: 19.2,
              centerLongitude: -69.3,
              timezone: "America/Santo_Domingo",
            },
          }],
        }),
      },
      travelOption: {
        findMany: async () => [{
          id: "museum",
          countryId: "do",
          regionId: "samana",
          locationId: null,
          providerId: null,
          slug: "museum",
          title: "Museum van Samaná",
          description: "Een rustige, gecontroleerde binnenoptie.",
          type: "ACTIVITY",
          availableFrom: null,
          availableUntil: null,
          availableWeekdays: [],
          durationMinutes: 90,
          indoorOutdoor: "INDOOR",
          weatherRules: {},
          minAge: null,
          familyFriendly: true,
          accessibilityNotes: null,
          priceFrom: null,
          currency: null,
          priceLevel: 2,
          externalUrl: null,
          affiliateUrl: null,
          commissionEligible: false,
          rating: 4.8,
          reviewCount: 32,
          verificationStatus: "VERIFIED",
          lastVerifiedAt: new Date("2026-07-27T10:00:00Z"),
          sourceUpdatedAt: null,
          sourceMetadata: null,
          isPublished: true,
          isIndexable: true,
          createdAt: new Date("2026-07-27T10:00:00Z"),
          updatedAt: new Date("2026-07-27T10:00:00Z"),
          deletedAt: null,
          location: null,
          provider: null,
        }],
      },
      dailyPlanSnapshot: {
        findUnique: async () => null,
        upsert: async (input: unknown) => {
          persistedSnapshot = input;
          return {};
        },
      },
      recommendation: { findMany: async () => [] },
      activity: { findMany: async () => [] },
      travelSignal: { findMany: async () => [] },
    } as unknown as PrismaClient;

    const edition = await getLiveDayForUser(
      prisma,
      "trip-1",
      "00000000-0000-0000-0000-000000000001",
      new Date("2026-08-12T12:00:00Z"),
    );

    expect(edition).toMatchObject({
      best: {
        id: "museum",
        title: "Museum van Samaná",
      },
      dataNotice: expect.stringContaining("gecontroleerd seizoensbeeld"),
    });
    expect(persistedSnapshot).toMatchObject({
      create: {
        tripId: "trip-1",
        rankingVersion: "calor-daily-v1",
        weatherFallback: "seed",
      },
    });
  });

  it("builds an owned, trip-specific edition from stored recommendations", async () => {
    const prisma = {
      trip: {
        findFirst: async () => ({
          id: "trip-1",
          title: "Samaná met het gezin",
          countryId: "do",
          arrivalDate: new Date("2026-01-27T00:00:00Z"),
          departureDate: new Date("2026-02-16T00:00:00Z"),
          timezone: "America/Santo_Domingo",
          country: { name: "Dominicaanse Republiek" },
          travelers: [
            { kind: "ADULT" },
            { kind: "ADULT" },
            { kind: "CHILD" },
          ],
          stops: [{
            regionId: "do-samana",
            arrivalDate: new Date("2026-01-27T00:00:00Z"),
            departureDate: new Date("2026-02-16T00:00:00Z"),
            region: { name: "Samaná & Las Terrenas" },
          }],
        }),
      },
      recommendation: {
        findMany: async () => [{
          id: "rec-1",
          plan: "BEST_TODAY",
          generatedAt: new Date("2026-01-30T11:15:00Z"),
          explanationFactors: ["Walvisseizoen · piek", "Rustige zeegang"],
          activity: {
            name: "Walvissen spotten",
            shortDescription: "Het sterkste venster van deze week.",
            sources: [{
              source: {
                name: "NOAA-boei Samaná",
                lastVerifiedAt: new Date("2026-01-30T10:40:00Z"),
              },
            }],
          },
        }],
      },
      activity: { findMany: async () => [] },
      travelSignal: { findMany: async () => [] },
    } as unknown as PrismaClient;

    const edition = await getLiveDayForUser(
      prisma,
      "trip-1",
      "00000000-0000-0000-0000-000000000001",
      new Date("2026-01-30T12:00:00Z"),
    );

    expect(edition).toMatchObject({
      tripId: "trip-1",
      tripTitle: "Samaná met het gezin",
      destination: "Samaná & Las Terrenas",
      dayNumber: 4,
      totalDays: 21,
      dataNotice: null,
      best: {
        id: "rec-1",
        title: "Walvissen spotten",
        factors: ["Walvisseizoen · piek", "Rustige zeegang"],
      },
    });
    expect(edition?.practical[0]?.value).toBe("2 volwassenen · 1 kind");
  });

  it("never returns another user's trip", async () => {
    const prisma = {
      trip: { findFirst: async () => null },
    } as unknown as PrismaClient;

    await expect(getLiveDayForUser(prisma, "trip-1", "other-user")).resolves.toBeNull();
  });
});
