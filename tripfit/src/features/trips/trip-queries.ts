import { isoDateFromDate } from "@/domain/trips/dates";
import type { InterestId } from "@/domain/trips/interests";
import type { TripPreviewRequest } from "@/domain/trips/model";
import type { PrismaClient } from "@/generated/prisma/client";

export interface StoredTripStop {
  id: string;
  tripId: string;
  regionId: string;
  destinationClusterId: string | null;
  position: number;
  arrivalDate: Date;
  departureDate: Date;
  countryId: string;
}

export interface StoredTraveler {
  id: string;
  tripId: string;
  kind: "ADULT" | "CHILD";
  ageAtDeparture: number | null;
}

export interface StoredTripInterest {
  tripId: string;
  interestId: string;
  priority: number;
}

export interface StoredTrip {
  id: string;
  countryId: string;
  title: string | null;
  arrivalDate: Date;
  departureDate: Date;
  timezone: string;
  stops: StoredTripStop[];
  travelers: StoredTraveler[];
  interests: StoredTripInterest[];
}

export function tripOwnershipWhere(tripId: string, userId: string): { id: string; userId: string } {
  return { id: tripId, userId };
}

export function toTripPreviewRequest(
  stored: StoredTrip,
  interestCodeById: ReadonlyMap<string, string>,
): TripPreviewRequest {
  const orderedStops = [...stored.stops].sort((a, b) => a.position - b.position);
  const adults = stored.travelers.filter((traveler) => traveler.kind === "ADULT").length;
  const childAges = stored.travelers
    .filter((traveler) => traveler.kind === "CHILD")
    .map((traveler) => traveler.ageAtDeparture ?? 0);

  const interests = [...stored.interests]
    .sort((a, b) => a.priority - b.priority)
    .map((interest) => interestCodeById.get(interest.interestId))
    .filter((code): code is string => Boolean(code)) as InterestId[];

  return {
    countryId: stored.countryId,
    arrivalDate: isoDateFromDate(stored.arrivalDate),
    departureDate: isoDateFromDate(stored.departureDate),
    travelers: { adults, childAges },
    interests,
    stops: orderedStops.map((stop) => ({
      regionId: stop.regionId,
      ...(stop.destinationClusterId ? { destinationClusterId: stop.destinationClusterId } : {}),
      arrivalDate: isoDateFromDate(stop.arrivalDate),
      departureDate: isoDateFromDate(stop.departureDate),
    })),
  };
}

const tripInclude = {
  stops: { orderBy: { position: "asc" as const } },
  travelers: true,
  interests: true,
};

export async function listTripsForUser(prisma: PrismaClient, userId: string): Promise<StoredTrip[]> {
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { arrivalDate: "asc" },
    include: tripInclude,
  });
}

export async function getTripForUser(
  prisma: PrismaClient,
  tripId: string,
  userId: string,
): Promise<StoredTrip | null> {
  return prisma.trip.findFirst({
    where: tripOwnershipWhere(tripId, userId),
    include: tripInclude,
  });
}
