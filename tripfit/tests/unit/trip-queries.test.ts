import { describe, expect, it } from "vitest";

import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { tripPreviewRequestSchema } from "@/domain/trips/preview-request";
import { buildTripRecord } from "@/features/trip-save/build-trip-record";
import { toTripPreviewRequest, tripOwnershipWhere, type StoredTrip } from "@/features/trips/trip-queries";

const request = tripPreviewRequestSchema.parse({
  countryId: "do",
  arrivalDate: "2027-01-27",
  departureDate: "2027-02-07",
  travelers: { adults: 2, childAges: [7] },
  interests: ["nature", "family-activities"],
  stops: [
    { regionId: "do-santo-domingo", arrivalDate: "2027-01-27", departureDate: "2027-01-30" },
    { regionId: "do-samana", destinationClusterId: "do-samana-las-terrenas", arrivalDate: "2027-01-30", departureDate: "2027-02-07" },
  ],
});

describe("trip queries", () => {
  it("always scopes ownership on both trip id and user id", () => {
    expect(tripOwnershipWhere("trip-1", "user-1")).toEqual({ id: "trip-1", userId: "user-1" });
  });

  it("round-trips a saved record back to the original preview request", () => {
    const interestIdByCode = new Map([
      ["nature", "interest-nature"],
      ["family-activities", "interest-family-activities"],
    ]);
    const record = buildTripRecord(request, {
      pack: dominicanRepublicPack,
      userId: "11111111-2222-3333-4444-555555555555",
      interestIdByCode,
    });

    const stored: StoredTrip = {
      id: "trip-1",
      ...record.trip,
      stops: record.stops.map((stop, index) => ({ id: `stop-${index}`, tripId: "trip-1", ...stop })),
      travelers: record.travelers.map((traveler, index) => ({ id: `traveler-${index}`, tripId: "trip-1", ...traveler })),
      interests: record.interests.map((interest) => ({ tripId: "trip-1", ...interest })),
    };

    const interestCodeById = new Map([
      ["interest-nature", "nature"],
      ["interest-family-activities", "family-activities"],
    ]);

    expect(toTripPreviewRequest(stored, interestCodeById)).toEqual(request);
  });
});
