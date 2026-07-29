import type { InterestId } from "./interests";
import type { DateInterval, ISODate } from "./dates";

export type TripPhase =
  | "PLANNING_LONG_RANGE"
  | "PLANNING_SUBSEASONAL"
  | "PLANNING_FORECAST"
  | "IN_TRIP"
  | "COMPLETED";

export interface TravelerParty {
  adults: number;
  childAges: number[];
}

export interface TripStop extends DateInterval {
  regionId: string;
  destinationClusterId?: string;
}

export interface TripPreviewRequest extends DateInterval {
  countryId: string;
  travelers: TravelerParty;
  interests: InterestId[];
  stops: TripStop[];
}

export interface LivingTrip extends TripPreviewRequest {
  id: string;
  phase: TripPhase;
  createdAt: string;
  updatedAt: string;
}

export interface TripPhaseThresholds {
  longRangeAfterDays: number;
  forecastThroughDays: number;
}

export const DEFAULT_TRIP_PHASE_THRESHOLDS: Readonly<TripPhaseThresholds> = {
  longRangeAfterDays: 42,
  forecastThroughDays: 14,
};

export type { ISODate };
