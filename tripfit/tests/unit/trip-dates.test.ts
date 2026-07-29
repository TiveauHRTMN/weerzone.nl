import { describe, expect, it } from "vitest";

import {
  differenceInCalendarDays,
  intervalContains,
  intervalsOverlap,
  isISODate,
  toISODate,
} from "../../src/domain/trips/dates";

describe("ISO calendar dates", () => {
  it("accepts real dates and rejects impossible calendar dates", () => {
    expect(isISODate("2028-02-29")).toBe(true);
    expect(isISODate("2027-02-29")).toBe(false);
    expect(isISODate("2027-13-01")).toBe(false);
    expect(isISODate("27-01-2027")).toBe(false);
  });

  it("calculates calendar days without daylight-saving drift", () => {
    expect(differenceInCalendarDays(toISODate("2027-04-01"), toISODate("2027-03-27"))).toBe(5);
  });

  it("treats adjacent stays as non-overlapping half-open intervals", () => {
    const santoDomingo = {
      arrivalDate: toISODate("2027-01-27"),
      departureDate: toISODate("2027-01-30"),
    };
    const samana = {
      arrivalDate: toISODate("2027-01-30"),
      departureDate: toISODate("2027-02-05"),
    };

    expect(intervalsOverlap(santoDomingo, samana)).toBe(false);
    expect(
      intervalContains(
        { arrivalDate: toISODate("2027-01-27"), departureDate: toISODate("2027-02-07") },
        samana,
      ),
    ).toBe(true);
  });
});
