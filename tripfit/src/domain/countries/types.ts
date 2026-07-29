import type { InterestId } from "../trips/interests";

export type CoverageLevel = "FLAGSHIP" | "STANDARD" | "BASIC";
export type SeedDataStatus = "SEED" | "EDITORIAL" | "VERIFIED";

export interface Coordinates {
  latitude: number;
  longitude: number;
}
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Country {
  id: string;
  name: string;
  officialName: string;
  slug: string;
  iso2Code: string;
  iso3Code: string;
  defaultLocale: string;
  languages: string[];
  currencies: Currency[];
  timeZones: string[];
  center: Coordinates;
}

export type DestinationClusterKind =
  | "CITY_DISTRICT"
  | "TOWN"
  | "BEACH_AREA"
  | "RESORT_AREA"
  | "NATURE_BASE"
  | "ROUTE_BASE";

export interface DestinationCluster {
  id: string;
  countryId: string;
  regionId: string;
  name: string;
  slug: string;
  aliases: string[];
  kind: DestinationClusterKind;
  center: Coordinates;
  shortDescription: string;
}

export type SeasonWindowStatus = "PEAK" | "AVAILABLE" | "LIMITED" | "UNAVAILABLE";

export interface AnnualSeasonWindow {
  startMonth: number;
  startDay?: number;
  endMonth: number;
  endDay?: number;
  status: SeasonWindowStatus;
  reason: string;
}

export type PreviewHighlightKind =
  | "SIGNATURE"
  | "CULTURE"
  | "NATURE"
  | "BEACH"
  | "FOOD"
  | "ACTIVE"
  | "PRACTICAL";

export interface RegionPreviewHighlight {
  id: string;
  title: string;
  shortDescription: string;
  kind: PreviewHighlightKind;
  interestIds: InterestId[];
  destinationClusterId?: string;
  priority: number;
  familyFit: number;
  minimumAge?: number;
  typicalDurationMinutes?: number;
  bookingAdvice?: string;
  seasonWindows: AnnualSeasonWindow[];
  sourceIds: string[];
  dataStatus: SeedDataStatus;
}

export interface RegionalContext {
  headline: string;
  identity: string;
  bestFor: string[];
  gettingAround: string;
  seasonalNote: string;
  localEtiquette?: string;
}

export interface Region {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  aliases: string[];
  coverageLevel: CoverageLevel;
  center: Coordinates;
  shortDescription: string;
  context: RegionalContext;
  previewHighlights: RegionPreviewHighlight[];
}

export interface ContextItem {
  id: string;
  title: string;
  body: string;
  sourceIds: string[];
  dataStatus: SeedDataStatus;
}

export interface PracticalFact {
  id: string;
  label: string;
  value: string;
  note?: string;
}

export interface NationalContext {
  headline: string;
  introduction: string;
  travelIdentity: string;
  culturalContext: ContextItem[];
  practicalFacts: PracticalFact[];
  trustNote: string;
}

export interface SourceReference {
  id: string;
  name: string;
  type: "OFFICIAL" | "LOCAL_EDITORIAL" | "SEED_RESEARCH";
  url?: string;
}

export interface SourceCoverage {
  isSeedData: boolean;
  lastReviewedAt: string;
  confidence: number;
  note: string;
  sources: SourceReference[];
}

export interface CountryPack {
  country: Country;
  regions: Region[];
  destinationClusters: DestinationCluster[];
  nationalContext: NationalContext;
  sourceCoverage: SourceCoverage;
}

export function getCountryPackRegion(pack: CountryPack, regionId: string): Region | undefined {
  return pack.regions.find((region) => region.id === regionId);
}

export function getRegionClusters(pack: CountryPack, regionId: string): DestinationCluster[] {
  return pack.destinationClusters.filter((cluster) => cluster.regionId === regionId);
}
