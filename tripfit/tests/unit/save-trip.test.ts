import { describe, expect, it } from "vitest";

import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { tripPreviewRequestSchema } from "@/domain/trips/preview-request";
import type { TripRecord } from "@/features/trip-save/build-trip-record";
import { saveTripForUser, type TripWriterPort } from "@/features/trip-save/save-trip";

const request = tripPreviewRequestSchema.parse({
  countryId: "do",
  arrivalDate: "2027-01-27",
  departureDate: "2027-02-07",
  travelers: { adults: 2, childAges: [7] },
  interests: ["nature"],
  stops: [{ regionId: "do-santo-domingo", arrivalDate: "2027-01-27", departureDate: "2027-02-07" }],
});

describe("saveTripForUser", () => {
  it("writes one validated record through the port and returns the trip id", async () => {
    const written: TripRecord[] = [];
    const writer: TripWriterPort = {
      async createTrip(record) {
        written.push(record);
        return { tripId: "trip-123" };
      },
    };

    const result = await saveTripForUser(request, {
      pack: dominicanRepublicPack,
      userId: "11111111-2222-3333-4444-555555555555",
      writer,
      interestIdByCode: new Map([["nature", "interest-nature"]]),
    });

    expect(result.tripId).toBe("trip-123");
    expect(written).toHaveLength(1);
    expect(written[0].trip.userId).toBe("11111111-2222-3333-4444-555555555555");
    expect(written[0].stops[0].regionId).toBe("do-santo-domingo");
    expect(written[0].profile.userId).toBe(
      "11111111-2222-3333-4444-555555555555",
    );
    expect(written[0].preferenceSnapshot.travelPartyType).toBe("FAMILY");
  });

  it("does not touch the writer when validation fails", async () => {
    let calls = 0;
    const writer: TripWriterPort = {
      async createTrip() {
        calls += 1;
        return { tripId: "never" };
      },
    };

    await expect(
      saveTripForUser({ ...request, stops: [{ ...request.stops[0], regionId: "do-atlantis" }] }, {
        pack: dominicanRepublicPack,
        userId: "11111111-2222-3333-4444-555555555555",
        writer,
        interestIdByCode: new Map([["nature", "interest-nature"]]),
      }),
    ).rejects.toThrowError();
    expect(calls).toBe(0);
  });
});
