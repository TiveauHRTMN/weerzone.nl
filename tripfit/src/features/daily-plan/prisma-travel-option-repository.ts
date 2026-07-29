import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  travelOptionSchema,
  weatherRulesSchema,
  type TravelOption,
} from "@/domain/travel-options/model";

import type {
  TravelOptionQuery,
  TravelOptionRepository,
} from "./travel-option-repository";

const lower = <T extends string>(value: T) => value.toLowerCase() as Lowercase<T>;

export class PrismaTravelOptionRepository implements TravelOptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAvailable(query: TravelOptionQuery): Promise<TravelOption[]> {
    const date = new Date(`${query.date}T00:00:00.000Z`);
    const weekday = date.getUTCDay();
    const rows = await this.prisma.travelOption.findMany({
      where: {
        countryId: query.destinationId,
        ...(query.regionId
          ? { OR: [{ regionId: query.regionId }, { regionId: null }] }
          : {}),
        isPublished: true,
        deletedAt: null,
        verificationStatus: { in: ["VERIFIED", "STALE"] },
        AND: [
          { OR: [{ availableFrom: null }, { availableFrom: { lte: date } }] },
          { OR: [{ availableUntil: null }, { availableUntil: { gte: date } }] },
          {
            OR: [
              { availableWeekdays: { isEmpty: true } },
              { availableWeekdays: { has: weekday } },
            ],
          },
        ],
      },
      include: { location: true, provider: true },
      orderBy: [{ lastVerifiedAt: "desc" }, { id: "asc" }],
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(
    row: Prisma.TravelOptionGetPayload<{
      include: { location: true; provider: true };
    }>,
  ): TravelOption {
    const priceFrom = row.priceFrom === null ? undefined : Number(row.priceFrom);
    const rules = weatherRulesSchema.parse(row.weatherRules ?? {});

    return travelOptionSchema.parse({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      type: lower(row.type),
      destinationId: row.countryId,
      regionId: row.regionId ?? undefined,
      latitude: row.location?.latitude ?? undefined,
      longitude: row.location?.longitude ?? undefined,
      availableFrom: row.availableFrom?.toISOString().slice(0, 10),
      availableUntil: row.availableUntil?.toISOString().slice(0, 10),
      availableWeekdays: row.availableWeekdays,
      durationMinutes: row.durationMinutes ?? undefined,
      indoorOutdoor: lower(row.indoorOutdoor),
      weatherRules: rules,
      minAge: row.minAge ?? undefined,
      familyFriendly: row.familyFriendly,
      accessibilityNotes: row.accessibilityNotes ?? undefined,
      priceFrom,
      currency: row.currency ?? undefined,
      priceLevel: row.priceLevel ?? undefined,
      providerType: row.provider ? lower(row.provider.type) : "editorial",
      providerId: row.providerId ?? undefined,
      externalUrl: row.externalUrl ?? undefined,
      affiliateUrl: row.affiliateUrl ?? undefined,
      commissionEligible: row.commissionEligible,
      rating: row.rating ?? undefined,
      reviewCount: row.reviewCount ?? undefined,
      verificationStatus: lower(row.verificationStatus),
      lastVerifiedAt: row.lastVerifiedAt?.toISOString(),
      sourceUpdatedAt: row.sourceUpdatedAt?.toISOString(),
      isPublished: row.isPublished,
      isIndexable: row.isIndexable,
      localValueScore: 50,
    });
  }
}
