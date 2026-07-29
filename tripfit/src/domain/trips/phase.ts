import { compareISODates, differenceInCalendarDays, type ISODate } from "./dates";
import {
  DEFAULT_TRIP_PHASE_THRESHOLDS,
  type TripPhase,
  type TripPhaseThresholds,
} from "./model";

export interface PhaseTripDates {
  arrivalDate: ISODate;
  departureDate: ISODate;
}
export function calculateTripPhase(
  trip: PhaseTripDates,
  evaluationDate: ISODate,
  thresholds: TripPhaseThresholds = DEFAULT_TRIP_PHASE_THRESHOLDS,
): TripPhase {
  if (thresholds.forecastThroughDays < 0 || thresholds.longRangeAfterDays <= thresholds.forecastThroughDays) {
    throw new RangeError("Ongeldige reisfasedrempels.");
  }

  if (compareISODates(evaluationDate, trip.departureDate) > 0) return "COMPLETED";
  if (compareISODates(evaluationDate, trip.arrivalDate) >= 0) return "IN_TRIP";

  const daysUntilArrival = differenceInCalendarDays(trip.arrivalDate, evaluationDate);
  if (daysUntilArrival <= thresholds.forecastThroughDays) return "PLANNING_FORECAST";
  if (daysUntilArrival <= thresholds.longRangeAfterDays) return "PLANNING_SUBSEASONAL";
  return "PLANNING_LONG_RANGE";
}
