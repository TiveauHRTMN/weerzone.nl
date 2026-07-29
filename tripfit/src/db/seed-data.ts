import type { CountryPack } from "@/domain/countries/types";
import { INTERESTS } from "@/domain/trips/interests";

export interface RegionSeedRow {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  coverageLevel: "FLAGSHIP" | "STANDARD" | "BASIC";
  summary: string;
  centerLatitude: number;
  centerLongitude: number;
  sortOrder: number;
}

export interface ClusterSeedRow {
  id: string;
  regionId: string;
  slug: string;
  name: string;
  aliases: string[];
  centerLatitude: number;
  centerLongitude: number;
  summary: string;
}

export interface InterestSeedRow {
  id: string;
  code: string;
  labelNl: string;
  sortOrder: number;
}

export function buildRegionRows(pack: CountryPack): RegionSeedRow[] {
  return pack.regions.map((region, index) => ({
    id: region.id,
    slug: region.slug,
    name: region.name,
    aliases: [...region.aliases],
    coverageLevel: region.coverageLevel,
    summary: region.shortDescription,
    centerLatitude: region.center.latitude,
    centerLongitude: region.center.longitude,
    sortOrder: (index + 1) * 10,
  }));
}

export function buildClusterRows(pack: CountryPack): ClusterSeedRow[] {
  return pack.destinationClusters.map((cluster) => ({
    id: cluster.id,
    regionId: cluster.regionId,
    slug: cluster.slug,
    name: cluster.name,
    aliases: [...cluster.aliases],
    centerLatitude: cluster.center.latitude,
    centerLongitude: cluster.center.longitude,
    summary: cluster.shortDescription,
  }));
}

export function buildInterestRows(): InterestSeedRow[] {
  return INTERESTS.map((interest, index) => ({
    id: `interest-${interest.id}`,
    code: interest.id,
    labelNl: interest.label,
    sortOrder: (index + 1) * 10,
  }));
}
