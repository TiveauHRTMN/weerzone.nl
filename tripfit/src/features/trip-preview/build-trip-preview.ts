import {
  getCountryPackRegion,
  type CountryPack,
  type CoverageLevel,
  type RegionPreviewHighlight,
  type SeasonWindowStatus,
} from "@/domain/countries/types";
import {
  differenceInCalendarDays,
  isoDateFromDate,
  toISODate,
  type ISODate,
} from "@/domain/trips/dates";
import type { InterestId } from "@/domain/trips/interests";
import type { TripPhase, TripPreviewRequest, TripStop } from "@/domain/trips/model";
import { calculateTripPhase } from "@/domain/trips/phase";
import { tripPreviewRequestSchema } from "@/domain/trips/preview-request";

export interface PreviewRecommendation {
  id: string;
  title: string;
  shortDescription: string;
  kind: RegionPreviewHighlight["kind"];
  regionId: string;
  regionName: string;
  destinationClusterName?: string;
  score: number;
  seasonStatus: SeasonWindowStatus;
  familyFit: number;
  relevanceReasons: string[];
  bookingAdvice?: string;
}
export interface PreviewRouteStop {
  regionId: string;
  regionName: string;
  regionSlug: string;
  coverageLevel: CoverageLevel;
  arrivalDate: ISODate;
  departureDate: ISODate;
  nights: number;
  destinationClusterName?: string;
  timing: "PAST" | "CURRENT" | "UPCOMING";
  highlights: PreviewRecommendation[];
}

export interface TripPreview {
  country: { id: string; name: string; slug: string };
  phase: TripPhase;
  phaseGuidance: { eyebrow: string; title: string; body: string };
  trip: {
    arrivalDate: ISODate;
    departureDate: ISODate;
    nights: number;
    travelerCount: number;
    partyLabel: string;
    interestIds: InterestId[];
  };
  route: PreviewRouteStop[];
  highlights: PreviewRecommendation[];
  nationalContext: {
    headline: string;
    introduction: string;
    travelIdentity: string;
  };
  trust: {
    isSeedData: boolean;
    lastReviewedAt: string;
    confidence: number;
    note: string;
  };
}

export interface BuildTripPreviewOptions {
  countryPack: CountryPack;
  evaluationDate?: ISODate;
  highlightsPerStop?: number;
}

export class TripPreviewBuildError extends Error {
  constructor(
    message: string,
    readonly code: "COUNTRY_NOT_FOUND" | "REGION_NOT_FOUND" | "CLUSTER_NOT_FOUND",
  ) {
    super(message);
    this.name = "TripPreviewBuildError";
  }
}

const PHASE_GUIDANCE: Record<TripPhase, TripPreview["phaseGuidance"]> = {
  PLANNING_LONG_RANGE: {
    eyebrow: "Vooruitkijken",
    title: "Bouw eerst de sterke route",
    body: "Je reis ligt nog buiten de betrouwbare weersverwachting. TripFit gebruikt seizoen, regio en gezelschap en vermijdt schijnprecisie per dag.",
  },
  PLANNING_SUBSEASONAL: {
    eyebrow: "De contouren worden zichtbaar",
    title: "Leg schaarse kansen vast",
    body: "Seizoenssignalen en activiteiten met voorbereiding tellen nu zwaarder; de precieze dagvolgorde blijft flexibel.",
  },
  PLANNING_FORECAST: {
    eyebrow: "Plan A en Plan B",
    title: "De beste dagen komen in beeld",
    body: "Dagverwachtingen zijn nu bruikbaar. Live providers kunnen deze seedpreview straks aanscherpen op regen, wind, hitte en zeecondities.",
  },
  IN_TRIP: {
    eyebrow: "Je reis is live",
    title: "Kies op wat vandaag klopt",
    body: "TripFit zet je huidige regio voorop en houdt rekening met wat later in je route nog beter past.",
  },
  COMPLETED: {
    eyebrow: "Reisarchief",
    title: "Bewaar wat bij jullie paste",
    body: "De route is afgerond. Je keuzes kunnen later favorieten, feedback en een volgende living trip voeden.",
  },
};

function dateParts(value: ISODate): { month: number; day: number } {
  const [, month, day] = value.split("-").map(Number);
  return { month, day };
}

function annualOrdinal(month: number, day: number): number {
  return month * 100 + day;
}

function windowMatchesDate(window: RegionPreviewHighlight["seasonWindows"][number], date: ISODate): boolean {
  const { month, day } = dateParts(date);
  const current = annualOrdinal(month, day);
  const start = annualOrdinal(window.startMonth, window.startDay ?? 1);
  const end = annualOrdinal(window.endMonth, window.endDay ?? 31);
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function addDays(date: ISODate, days: number): ISODate {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return toISODate(result.toISOString().slice(0, 10));
}

function stayDates(stop: TripStop): ISODate[] {
  const nights = differenceInCalendarDays(stop.departureDate, stop.arrivalDate);
  const sampleLength = Math.min(nights, 366);
  return Array.from({ length: sampleLength }, (_, index) => addDays(stop.arrivalDate, index));
}

function seasonForHighlight(
  highlightValue: RegionPreviewHighlight,
  stop: TripStop,
): { status: SeasonWindowStatus; reason: string } {
  const dates = stayDates(stop);
  for (const window of highlightValue.seasonWindows) {
    if (dates.some((date) => windowMatchesDate(window, date))) {
      return { status: window.status, reason: window.reason };
    }
  }
  return { status: "UNAVAILABLE", reason: "Deze kans valt buiten de bekende seizoensperiode." };
}

function interestLabel(id: InterestId): string {
  return id.replaceAll("-", " ");
}

function rankHighlight(
  highlightValue: RegionPreviewHighlight,
  request: TripPreviewRequest,
  stop: TripStop,
): { score: number; status: SeasonWindowStatus; reasons: string[] } | undefined {
  const season = seasonForHighlight(highlightValue, stop);
  if (season.status === "UNAVAILABLE") return undefined;

  const matches = highlightValue.interestIds.filter((interest) => request.interests.includes(interest));
  const hasChildren = request.travelers.childAges.length > 0;
  const youngestChild = hasChildren ? Math.min(...request.travelers.childAges) : undefined;
  if (youngestChild !== undefined && highlightValue.minimumAge !== undefined && youngestChild < highlightValue.minimumAge) {
    return undefined;
  }

  const interestFit = matches.length / Math.max(1, request.interests.length);
  const seasonPoints = season.status === "PEAK" ? 12 : season.status === "AVAILABLE" ? 7 : -8;
  const familyPoints = hasChildren ? highlightValue.familyFit / 10 : 6;
  const exactCluster = Boolean(
    stop.destinationClusterId && highlightValue.destinationClusterId === stop.destinationClusterId,
  );
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(highlightValue.priority * 0.55 + interestFit * 25 + seasonPoints + familyPoints + (exactCluster ? 5 : 0)),
    ),
  );

  const reasons = [
    matches.length > 0
      ? `Past bij ${matches.slice(0, 2).map(interestLabel).join(" en ")}`
      : "Voegt een kenmerkende regionale ervaring toe",
    season.reason,
    `${differenceInCalendarDays(stop.departureDate, stop.arrivalDate)} nachten in deze regio`,
  ];
  if (hasChildren && highlightValue.familyFit >= 80) reasons.push("Sterke match voor jullie gezelschap met kind");
  if (exactCluster) reasons.push("Dicht bij de gekozen verblijfslocatie");

  return { score, status: season.status, reasons };
}

function timingForStop(stop: TripStop, evaluationDate: ISODate): PreviewRouteStop["timing"] {
  if (evaluationDate < stop.arrivalDate) return "UPCOMING";
  if (evaluationDate >= stop.departureDate) return "PAST";
  return "CURRENT";
}

function partyLabel(request: TripPreviewRequest): string {
  const adultLabel = `${request.travelers.adults} ${request.travelers.adults === 1 ? "volwassene" : "volwassenen"}`;
  const children = request.travelers.childAges.length;
  if (children === 0) return adultLabel;
  return `${adultLabel}, ${children} ${children === 1 ? "kind" : "kinderen"}`;
}

export function buildTripPreview(
  input: TripPreviewRequest,
  options: BuildTripPreviewOptions,
): TripPreview {
  const request = tripPreviewRequestSchema.parse(input);
  const { countryPack } = options;
  const evaluationDate = options.evaluationDate ?? isoDateFromDate(new Date());
  const highlightsPerStop = Math.max(1, Math.min(4, options.highlightsPerStop ?? 2));

  if (request.countryId !== countryPack.country.id) {
    throw new TripPreviewBuildError(`Country pack ${request.countryId} is niet geladen.`, "COUNTRY_NOT_FOUND");
  }

  const route = request.stops.map<PreviewRouteStop>((stop) => {
    const region = getCountryPackRegion(countryPack, stop.regionId);
    if (!region) throw new TripPreviewBuildError(`Onbekende regio: ${stop.regionId}`, "REGION_NOT_FOUND");

    const destinationCluster = stop.destinationClusterId
      ? countryPack.destinationClusters.find(
          (cluster) => cluster.id === stop.destinationClusterId && cluster.regionId === region.id,
        )
      : undefined;
    if (stop.destinationClusterId && !destinationCluster) {
      throw new TripPreviewBuildError(
        `Onbekende verblijfslocatie voor ${region.name}: ${stop.destinationClusterId}`,
        "CLUSTER_NOT_FOUND",
      );
    }

    const highlights = region.previewHighlights
      .map((highlightValue) => ({ highlightValue, ranked: rankHighlight(highlightValue, request, stop) }))
      .filter(
        (candidate): candidate is { highlightValue: RegionPreviewHighlight; ranked: NonNullable<typeof candidate.ranked> } =>
          candidate.ranked !== undefined,
      )
      .sort(
        (left, right) =>
          right.ranked.score - left.ranked.score || left.highlightValue.id.localeCompare(right.highlightValue.id),
      )
      .slice(0, highlightsPerStop)
      .map<PreviewRecommendation>(({ highlightValue, ranked }) => {
        const highlightCluster = highlightValue.destinationClusterId
          ? countryPack.destinationClusters.find((cluster) => cluster.id === highlightValue.destinationClusterId)
          : undefined;
        return {
          id: highlightValue.id,
          title: highlightValue.title,
          shortDescription: highlightValue.shortDescription,
          kind: highlightValue.kind,
          regionId: region.id,
          regionName: region.name,
          ...(highlightCluster ? { destinationClusterName: highlightCluster.name } : {}),
          score: ranked.score,
          seasonStatus: ranked.status,
          familyFit: highlightValue.familyFit,
          relevanceReasons: ranked.reasons,
          ...(highlightValue.bookingAdvice ? { bookingAdvice: highlightValue.bookingAdvice } : {}),
        };
      });

    return {
      regionId: region.id,
      regionName: region.name,
      regionSlug: region.slug,
      coverageLevel: region.coverageLevel,
      arrivalDate: stop.arrivalDate,
      departureDate: stop.departureDate,
      nights: differenceInCalendarDays(stop.departureDate, stop.arrivalDate),
      ...(destinationCluster ? { destinationClusterName: destinationCluster.name } : {}),
      timing: timingForStop(stop, evaluationDate),
      highlights,
    };
  });

  const phase = calculateTripPhase(request, evaluationDate);
  return {
    country: {
      id: countryPack.country.id,
      name: countryPack.country.name,
      slug: countryPack.country.slug,
    },
    phase,
    phaseGuidance: PHASE_GUIDANCE[phase],
    trip: {
      arrivalDate: request.arrivalDate,
      departureDate: request.departureDate,
      nights: differenceInCalendarDays(request.departureDate, request.arrivalDate),
      travelerCount: request.travelers.adults + request.travelers.childAges.length,
      partyLabel: partyLabel(request),
      interestIds: request.interests,
    },
    route,
    highlights: route.flatMap((stop) => stop.highlights),
    nationalContext: {
      headline: countryPack.nationalContext.headline,
      introduction: countryPack.nationalContext.introduction,
      travelIdentity: countryPack.nationalContext.travelIdentity,
    },
    trust: {
      isSeedData: countryPack.sourceCoverage.isSeedData,
      lastReviewedAt: countryPack.sourceCoverage.lastReviewedAt,
      confidence: countryPack.sourceCoverage.confidence,
      note: countryPack.sourceCoverage.note,
    },
  };
}
