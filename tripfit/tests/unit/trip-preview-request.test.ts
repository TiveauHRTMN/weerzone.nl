import { describe, expect, it } from "vitest";

import {
  encodeTripPreviewRequest,
  parseTripPreviewSearchParams,
  tripPreviewRequestSchema,
} from "../../src/domain/trips/preview-request";

const mainScenario = {
  countryId: "do",
  arrivalDate: "2027-01-27",
  departureDate: "2027-02-07",
  travelers: { adults: 2, childAges: [7] },
  interests: ["nature", "culture", "beach", "food", "wildlife", "family-activities"],
  stops: [
    { regionId: "do-santo-domingo", arrivalDate: "2027-01-27", departureDate: "2027-01-30" },
    { regionId: "do-samana", arrivalDate: "2027-01-30", departureDate: "2027-02-05" },
    { regionId: "do-punta-cana", arrivalDate: "2027-02-05", departureDate: "2027-02-07" },
  ],
};

describe("tripPreviewRequestSchema", () => {
  it("accepts the three-region demo route", () => {
    const result = tripPreviewRequestSchema.safeParse(mainScenario);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stops).toHaveLength(3);
  });

  it("rejects impossible dates, overlaps and stops outside the trip", () => {
    const result = tripPreviewRequestSchema.safeParse({
      ...mainScenario,
      arrivalDate: "2027-02-29",
      stops: [
        { regionId: "do-santo-domingo", arrivalDate: "2027-01-26", departureDate: "2027-02-01" },
        { regionId: "do-samana", arrivalDate: "2027-01-31", departureDate: "2027-02-05" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects reversed or non-chronological route stops", () => {
    const result = tripPreviewRequestSchema.safeParse({
      ...mainScenario,
      stops: [mainScenario.stops[1], mainScenario.stops[0]],
    });
    expect(result.success).toBe(false);
  });
});
describe("preview URL codec", () => {
  it("round-trips a validated anonymous preview without personal data", () => {
    const request = tripPreviewRequestSchema.parse(mainScenario);
    const encoded = encodeTripPreviewRequest(request);
    expect(encoded).not.toContain("email");
    expect(parseTripPreviewSearchParams(encoded)).toEqual(request);
  });

  it("reads Next.js-style search param records", () => {
    const request = tripPreviewRequestSchema.parse(mainScenario);
    const asRecord = Object.fromEntries(new URLSearchParams(encodeTripPreviewRequest(request)));
    expect(parseTripPreviewSearchParams(asRecord)).toEqual(request);
  });

  it("throws a Zod error for a tampered query", () => {
    const encoded = encodeTripPreviewRequest(tripPreviewRequestSchema.parse(mainScenario));
    const params = new URLSearchParams(encoded);
    params.set("adults", "0");
    expect(() => parseTripPreviewSearchParams(params)).toThrow();
  });
});
