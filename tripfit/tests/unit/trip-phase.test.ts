import { describe, expect, it } from "vitest";

import { toISODate } from "../../src/domain/trips/dates";
import { calculateTripPhase } from "../../src/domain/trips/phase";

const trip = {
  arrivalDate: toISODate("2027-01-27"),
  departureDate: toISODate("2027-02-07"),
};

describe("calculateTripPhase", () => {
  it.each([
    ["2026-12-15", "PLANNING_LONG_RANGE"],
    ["2026-12-16", "PLANNING_SUBSEASONAL"],
    ["2027-01-12", "PLANNING_SUBSEASONAL"],
    ["2027-01-13", "PLANNING_FORECAST"],
    ["2027-01-27", "IN_TRIP"],
    ["2027-02-07", "IN_TRIP"],
    ["2027-02-08", "COMPLETED"],
  ] as const)("maps %s to %s", (evaluationDate, expected) => {
    expect(calculateTripPhase(trip, toISODate(evaluationDate))).toBe(expected);
  });

  it("supports configurable thresholds", () => {
    expect(
      calculateTripPhase(trip, toISODate("2027-01-06"), {
        forecastThroughDays: 21,
        longRangeAfterDays: 60,
      }),
    ).toBe("PLANNING_FORECAST");
  });
});
