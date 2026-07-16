import { getCountryPackRegion, type CountryPack } from "@/domain/countries/types";
import type { ISODate } from "@/domain/trips/dates";
import type { TripPreviewRequest } from "@/domain/trips/model";

export class TripRecordError extends Error {
  constructor(
    message: string,
    readonly code: "COUNTRY_MISMATCH" | "REGION_NOT_FOUND" | "CLUSTER_NOT_FOUND" | "INTEREST_NOT_FOUND",
  ) {
    super(message);
    this.name = "TripRecordError";
  }
}

export interface TripRecord {
  trip: {
    userId: string;
    countryId: string;
    title: string;
    arrivalDate: Date;
    departureDate: Date;
    timezone: string;
    isPrivate: true;
    createdFromPreview: true;
  };
  stops: Array<{
    countryId: string;
    regionId: string;
    destinationClusterId: string | null;
    position: number;
    arrivalDate: Date;
    departureDate: Date;
  }>;
  travelers: Array<{ kind: "ADULT" | "CHILD"; ageAtDeparture: number | null }>;
  interests: Array<{ interestId: string; priority: number }>;
}

export interface BuildTripRecordOptions {
  pack: CountryPack;
  userId: string;
  interestIdByCode: ReadonlyMap<string, string>;
}

function utcDate(value: ISODate): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

const dayMonth = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function buildTripRecord(
  request: TripPreviewRequest,
  { pack, userId, interestIdByCode }: BuildTripRecordOptions,
): TripRecord {
  if (request.countryId !== pack.country.id) {
    throw new TripRecordError(`Onbekend land: ${request.countryId}`, "COUNTRY_MISMATCH");
  }

  const stops = request.stops.map((stop, index) => {
    const region = getCountryPackRegion(pack, stop.regionId);
    if (!region) {
      throw new TripRecordError(`Onbekende regio: ${stop.regionId}`, "REGION_NOT_FOUND");
    }

    let destinationClusterId: string | null = null;
    if (stop.destinationClusterId) {
      const cluster = pack.destinationClusters.find(
        (candidate) => candidate.id === stop.destinationClusterId && candidate.regionId === region.id,
      );
      if (!cluster) {
        throw new TripRecordError(`Onbekend cluster: ${stop.destinationClusterId}`, "CLUSTER_NOT_FOUND");
      }
      destinationClusterId = cluster.id;
    }

    return {
      countryId: pack.country.id,
      regionId: region.id,
      destinationClusterId,
      position: index + 1,
      arrivalDate: utcDate(stop.arrivalDate),
      departureDate: utcDate(stop.departureDate),
    };
  });

  const interests = request.interests.map((code, index) => {
    const interestId = interestIdByCode.get(code);
    if (!interestId) {
      throw new TripRecordError(`Onbekende interesse: ${code}`, "INTEREST_NOT_FOUND");
    }
    return { interestId, priority: index + 1 };
  });

  const travelers: TripRecord["travelers"] = [
    ...Array.from({ length: request.travelers.adults }, () => ({ kind: "ADULT" as const, ageAtDeparture: null })),
    ...request.travelers.childAges.map((age) => ({ kind: "CHILD" as const, ageAtDeparture: age })),
  ];

  const title = `${pack.country.name} · ${dayMonth.format(utcDate(request.arrivalDate))} – ${dayMonthYear.format(utcDate(request.departureDate))}`;

  return {
    trip: {
      userId,
      countryId: pack.country.id,
      title,
      arrivalDate: utcDate(request.arrivalDate),
      departureDate: utcDate(request.departureDate),
      timezone: pack.country.timeZones[0],
      isPrivate: true,
      createdFromPreview: true,
    },
    stops,
    travelers,
    interests,
  };
}
