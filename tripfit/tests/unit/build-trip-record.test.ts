import { describe, expect, it } from "vitest";

import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { tripPreviewRequestSchema } from "@/domain/trips/preview-request";
import { buildTripRecord, TripRecordError } from "@/features/trip-save/build-trip-record";

const interestIdByCode = new Map([
  ["nature", "interest-nature"],
  ["culture", "interest-culture"],
  ["family-activities", "interest-family-activities"],
]);

const request = tripPreviewRequestSchema.parse({
  countryId: "do",
  arrivalDate: "2027-01-27",
  departureDate: "2027-02-07",
  travelers: { adults: 2, childAges: [7] },
  interests: ["nature", "culture", "family-activities"],
  stops: [
    { regionId: "do-santo-domingo", arrivalDate: "2027-01-27", departureDate: "2027-01-30" },
    { regionId: "do-samana", destinationClusterId: "do-samana-las-terrenas", arrivalDate: "2027-01-30", departureDate: "2027-02-05" },
    { regionId: "do-punta-cana", arrivalDate: "2027-02-05", departureDate: "2027-02-07" },
  ],
});

const options = { pack: dominicanRepublicPack, userId: "11111111-2222-3333-4444-555555555555", interestIdByCode };

describe("buildTripRecord", () => {
  it("maps the main scenario to a complete transactional record", () => {
    const record = buildTripRecord(request, options);

    expect(record.trip.userId).toBe(options.userId);
    expect(record.trip.countryId).toBe("do");
    expect(record.trip.timezone).toBe("America/Santo_Domingo");
    expect(record.trip.isPrivate).toBe(true);
    expect(record.trip.createdFromPreview).toBe(true);
    expect(record.trip.arrivalDate.toISOString()).toBe("2027-01-27T00:00:00.000Z");
    expect(record.trip.departureDate.toISOString()).toBe("2027-02-07T00:00:00.000Z");
    expect(record.trip.title).toContain("Dominicaanse Republiek");

    expect(record.stops.map((stop) => stop.position)).toEqual([1, 2, 3]);
    expect(record.stops[1].destinationClusterId).toBe("do-samana-las-terrenas");
    expect(record.stops[0].destinationClusterId).toBeNull();

    expect(record.travelers).toEqual([
      { kind: "ADULT", ageAtDeparture: null },
      { kind: "ADULT", ageAtDeparture: null },
      { kind: "CHILD", ageAtDeparture: 7 },
    ]);

    expect(record.interests).toEqual([
      { interestId: "interest-nature", priority: 1 },
      { interestId: "interest-culture", priority: 2 },
      { interestId: "interest-family-activities", priority: 3 },
    ]);
  });

  it("rejects a request for another country", () => {
    expect(() => buildTripRecord({ ...request, countryId: "cu" }, options)).toThrowError(TripRecordError);
    try {
      buildTripRecord({ ...request, countryId: "cu" }, options);
    } catch (error) {
      expect((error as TripRecordError).code).toBe("COUNTRY_MISMATCH");
    }
  });

  it("rejects an unknown region", () => {
    const tampered = { ...request, stops: [{ ...request.stops[0], regionId: "do-atlantis" }] };
    expect(() => buildTripRecord(tampered, options)).toThrowError(TripRecordError);
  });

  it("rejects a cluster that belongs to a different region", () => {
    const tampered = {
      ...request,
      stops: [{ ...request.stops[0], destinationClusterId: "do-pc-bavaro" }],
    };
    try {
      buildTripRecord(tampered, options);
      expect.unreachable("cluster van andere regio hoort te falen");
    } catch (error) {
      expect((error as TripRecordError).code).toBe("CLUSTER_NOT_FOUND");
    }
  });

  it("rejects interests that are missing from the database map", () => {
    try {
      buildTripRecord({ ...request, interests: ["wildlife"] }, options);
      expect.unreachable("onbekende interest hoort te falen");
    } catch (error) {
      expect((error as TripRecordError).code).toBe("INTEREST_NOT_FOUND");
    }
  });
});
