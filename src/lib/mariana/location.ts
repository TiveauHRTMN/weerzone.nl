import type { City } from "@/lib/types";
import type { Place } from "@/lib/places-data";
import { placeSlug } from "@/lib/places-data";
import type { MarianaLocationRef } from "./types";

type LocationLike = Partial<City & Place> & {
  locationId?: string;
  id?: string;
  lat: number;
  lon: number;
};

function coordKey(value: number): string {
  return value.toFixed(3).replace("-", "m").replace(".", "p");
}

export function marianaLocationId(location: LocationLike): string {
  if (location.locationId) return location.locationId;
  if (location.id) return `wz:${location.id}`;
  if (location.name && location.province) {
    return `place:${location.province}:${placeSlug(location.name)}`;
  }
  if (location.name) return `city:${placeSlug(location.name)}`;
  return `grid:${coordKey(location.lat)}:${coordKey(location.lon)}`;
}

export function toMarianaLocation(location: LocationLike): MarianaLocationRef {
  return {
    locationId: marianaLocationId(location),
    name: location.name,
    lat: Number(location.lat),
    lon: Number(location.lon),
    province: location.province,
  };
}
