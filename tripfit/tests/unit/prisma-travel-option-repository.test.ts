import { describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { PrismaTravelOptionRepository } from "@/features/daily-plan/prisma-travel-option-repository";

describe("PrismaTravelOptionRepository", () => {
  it("queries only published, current options available in the region and on the weekday", async () => {
    let receivedWhere: unknown;
    const prisma = {
      travelOption: {
        findMany: async ({ where }: { where: unknown }) => {
          receivedWhere = where;
          return [
            {
              id: "option-1",
              countryId: "do",
              regionId: "samana",
              locationId: null,
              providerId: null,
              slug: "museum",
              title: "Museum",
              description: "Een gecontroleerde binnenoptie.",
              type: "ACTIVITY",
              availableFrom: null,
              availableUntil: null,
              availableWeekdays: [3],
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
              rating: 4.7,
              reviewCount: 20,
              verificationStatus: "VERIFIED",
              lastVerifiedAt: new Date("2026-07-27T10:00:00.000Z"),
              sourceUpdatedAt: null,
              sourceMetadata: null,
              isPublished: true,
              isIndexable: true,
              createdAt: new Date("2026-07-27T10:00:00.000Z"),
              updatedAt: new Date("2026-07-27T10:00:00.000Z"),
              deletedAt: null,
              location: null,
              provider: null,
            },
          ];
        },
      },
    } as unknown as PrismaClient;

    const result = await new PrismaTravelOptionRepository(prisma).findAvailable({
      destinationId: "do",
      regionId: "samana",
      date: "2026-08-12",
    });

    expect(receivedWhere).toMatchObject({
      countryId: "do",
      isPublished: true,
      deletedAt: null,
      verificationStatus: { in: ["VERIFIED", "STALE"] },
      OR: [{ regionId: "samana" }, { regionId: null }],
      AND: expect.arrayContaining([
        {
          OR: [
            { availableWeekdays: { isEmpty: true } },
            { availableWeekdays: { has: 3 } },
          ],
        },
      ]),
    });
    expect(result[0]).toMatchObject({
      id: "option-1",
      type: "activity",
      indoorOutdoor: "indoor",
      verificationStatus: "verified",
    });
  });
});
