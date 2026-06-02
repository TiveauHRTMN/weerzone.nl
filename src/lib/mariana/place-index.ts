import { NL_PLACES, isNLProvince, placeRouteSlug, type Place } from "@/lib/places-data";
import { toMarianaLocation } from "./location";
import type { MarianaLocationRef } from "./types";

export interface MarianaPlaceTarget {
  place: Place;
  location: MarianaLocationRef;
  url: string;
}

function canonicalUrlForPlace(place: Place): string {
  return `/weer/${place.province}/${placeRouteSlug(place)}`;
}

export function marianaTargetForPlace(place: Place): MarianaPlaceTarget {
  return {
    place,
    location: toMarianaLocation(place),
    url: canonicalUrlForPlace(place),
  };
}

export function getMarianaPlaceTargetCount(args: {
  minPopulation?: number;
  province?: string;
} = {}): number {
  if (args.province && !isNLProvince(args.province)) return 0;

  return NL_PLACES
    .filter((place) => !args.province || place.province === args.province)
    .filter((place) => !args.minPopulation || (place.population ?? 0) >= args.minPopulation)
    .length;
}

export function getMarianaPlaceTargets(args: {
  limit?: number;
  offset?: number;
  minPopulation?: number;
  province?: string;
} = {}): MarianaPlaceTarget[] {
  const limit = Math.max(1, Math.min(1000, args.limit ?? 250));
  const offset = Math.max(0, args.offset ?? 0);

  if (args.province && !isNLProvince(args.province)) return [];

  return NL_PLACES
    .filter((place) => !args.province || place.province === args.province)
    .filter((place) => !args.minPopulation || (place.population ?? 0) >= args.minPopulation)
    .slice(offset, offset + limit)
    .map(marianaTargetForPlace);
}
