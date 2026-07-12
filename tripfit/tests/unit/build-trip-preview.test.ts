import { describe, expect, it } from "vitest";

import { dominicanRepublicPack } from "../../src/domain/countries/packs/dominican-republic";
import { toISODate } from "../../src/domain/trips/dates";
import { tripPreviewRequestSchema } from "../../src/domain/trips/preview-request";
import {
  buildTripPreview,
  TripPreviewBuildError,
} from "../../src/features/trip-preview/build-trip-preview";

const request = tripPreviewRequestSchema.parse({
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
});
describe("buildTripPreview", () => {
  it("builds a deterministic, route-aware preview for the main scenario", () => {
    const first = buildTripPreview(request, {
      countryPack: dominicanRepublicPack,
      evaluationDate: toISODate("2026-07-12"),
    });
    const second = buildTripPreview(request, {
      countryPack: dominicanRepublicPack,
      evaluationDate: toISODate("2026-07-12"),
    });

    expect(second).toEqual(first);
    expect(first.phase).toBe("PLANNING_LONG_RANGE");
    expect(first.trip.nights).toBe(11);
    expect(first.trip.travelerCount).toBe(3);
    expect(first.route.map((stop) => stop.regionName)).toEqual([
      "Santo Domingo",
      "Samaná / Las Terrenas",
      "Punta Cana / Bávaro",
    ]);
    expect(first.route.every((stop) => stop.highlights.length === 2)).toBe(true);
    expect(first.route[1].highlights[0].id).toBe("samana-whales");
    expect(first.route[1].highlights[0].seasonStatus).toBe("PEAK");
    expect(first.trust.isSeedData).toBe(true);
    expect(() => JSON.stringify(first)).not.toThrow();
  });

  it("marks the active stop during the trip", () => {
    const preview = buildTripPreview(request, {
      countryPack: dominicanRepublicPack,
      evaluationDate: toISODate("2027-01-31"),
    });
    expect(preview.phase).toBe("IN_TRIP");
    expect(preview.route.map((stop) => stop.timing)).toEqual(["PAST", "CURRENT", "UPCOMING"]);
  });

  it("does not recommend seasonal whale watching outside its window", () => {
    const summerRequest = tripPreviewRequestSchema.parse({
      ...request,
      arrivalDate: "2027-07-01",
      departureDate: "2027-07-06",
      stops: [{ regionId: "do-samana", arrivalDate: "2027-07-01", departureDate: "2027-07-06" }],
    });
    const preview = buildTripPreview(summerRequest, {
      countryPack: dominicanRepublicPack,
      evaluationDate: toISODate("2027-06-20"),
      highlightsPerStop: 4,
    });
    expect(preview.highlights.map((highlight) => highlight.id)).not.toContain("samana-whales");
  });

  it("fails closed for an unknown region", () => {
    const unknownRegion = tripPreviewRequestSchema.parse({
      ...request,
      stops: [{ regionId: "do-unknown", arrivalDate: "2027-01-27", departureDate: "2027-02-07" }],
    });
    expect(() =>
      buildTripPreview(unknownRegion, {
        countryPack: dominicanRepublicPack,
        evaluationDate: toISODate("2026-07-12"),
      }),
    ).toThrowError(TripPreviewBuildError);
  });
});
