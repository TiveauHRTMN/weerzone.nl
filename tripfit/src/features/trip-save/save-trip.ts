import "server-only";

import type { CountryPack } from "@/domain/countries/types";
import { INTEREST_IDS } from "@/domain/trips/interests";
import type { TripPreviewRequest } from "@/domain/trips/model";
import type { PrismaClient } from "@/generated/prisma/client";

import { buildTripRecord, type TripRecord } from "./build-trip-record";

export interface TripWriterPort {
  createTrip(record: TripRecord): Promise<{ tripId: string }>;
}

export function createPrismaTripWriter(prisma: PrismaClient): TripWriterPort {
  return {
    async createTrip(record) {
      return prisma.$transaction(async (tx) => {
        const trip = await tx.trip.create({ data: record.trip, select: { id: true } });
        await tx.tripStop.createMany({
          data: record.stops.map((stop) => ({ ...stop, tripId: trip.id })),
        });
        await tx.traveler.createMany({
          data: record.travelers.map((traveler) => ({ ...traveler, tripId: trip.id })),
        });
        await tx.tripInterest.createMany({
          data: record.interests.map((interest) => ({ ...interest, tripId: trip.id })),
        });
        return { tripId: trip.id };
      });
    },
  };
}

export async function loadInterestIdByCode(prisma: PrismaClient): Promise<Map<string, string>> {
  const interests = await prisma.interest.findMany({
    where: { code: { in: [...INTEREST_IDS] }, isActive: true },
    select: { id: true, code: true },
  });
  return new Map(interests.map((interest) => [interest.code, interest.id]));
}

export interface SaveTripOptions {
  pack: CountryPack;
  userId: string;
  writer: TripWriterPort;
  interestIdByCode: ReadonlyMap<string, string>;
}

export async function saveTripForUser(
  request: TripPreviewRequest,
  { pack, userId, writer, interestIdByCode }: SaveTripOptions,
): Promise<{ tripId: string }> {
  const record = buildTripRecord(request, { pack, userId, interestIdByCode });
  return writer.createTrip(record);
}
