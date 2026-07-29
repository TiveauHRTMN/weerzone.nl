import { describe, expect, it, vi } from "vitest";

import { createPrismaAnalyticsWriter, persistAttribution } from "@/features/analytics/persistence";
import type { PrismaClient } from "@/generated/prisma/client";

function prismaStub({
  ownedTrips = 1,
}: {
  ownedTrips?: number;
} = {}) {
  return {
    trip: { count: vi.fn().mockResolvedValue(ownedTrips) },
    analyticsEvent: { upsert: vi.fn().mockResolvedValue({}) },
    attributionSession: { upsert: vi.fn().mockResolvedValue({}) },
  };
}

const event = {
  id: "92712b95-b36c-4fbe-88ad-56cb52287ef5",
  name: "trip_saved" as const,
  occurredAt: "2026-07-27T00:00:00.000Z",
  schemaVersion: 1 as const,
  userId: "11111111-2222-3333-4444-555555555555",
  tripId: "trip-1",
  properties: {},
};

describe("analytics persistence", () => {
  it("checks trip ownership and uses the event id as idempotency key", async () => {
    const stub = prismaStub();
    const writer = createPrismaAnalyticsWriter(stub as unknown as PrismaClient, {
      authenticatedUserId: event.userId,
      consentBasis: "analytics_consent",
    });
    await writer.write(event);
    expect(stub.trip.count).toHaveBeenCalledWith({
      where: { id: "trip-1", userId: event.userId },
    });
    expect(stub.analyticsEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: event.id },
        update: {},
      }),
    );
  });

  it("rejects analytics for another user's trip", async () => {
    const stub = prismaStub({ ownedTrips: 0 });
    const writer = createPrismaAnalyticsWriter(stub as unknown as PrismaClient, {
      authenticatedUserId: event.userId,
      consentBasis: "analytics_consent",
    });
    await expect(writer.write(event)).rejects.toThrow(/ownership/);
    expect(stub.analyticsEvent.upsert).not.toHaveBeenCalled();
  });

  it("keeps first touch immutable while updating last touch", async () => {
    const stub = prismaStub();
    await persistAttribution(stub as unknown as PrismaClient, {
      anonymousSessionId: "session-1",
      touch: {
        source: "weerzone",
        campaign: "local_weather_pages",
        capturedAt: "2026-07-27T00:00:00.000Z",
      },
    });
    const call = stub.attributionSession.upsert.mock.calls[0]?.[0];
    expect(call.create.firstSource).toBe("weerzone");
    expect(call.update.lastSource).toBe("weerzone");
    expect(call.update.firstSource).toBeUndefined();
  });
});

