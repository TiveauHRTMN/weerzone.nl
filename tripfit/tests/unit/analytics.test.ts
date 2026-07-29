import { describe, expect, it, vi } from "vitest";

import { attributionFromUrl, updateAttribution } from "@/features/analytics/attribution";
import { trackCalorEvent, validateAnalyticsEvent } from "@/features/analytics/events";
import { hasAnalyticsConsent } from "@/features/analytics/consent";

const event = {
  id: "92712b95-b36c-4fbe-88ad-56cb52287ef5",
  name: "trip_started",
  occurredAt: "2026-07-26T20:00:00.000Z",
  schemaVersion: 1,
  anonymousSessionId: "session-1",
  properties: { placement: "homepage" },
};

describe("Calor analytics", () => {
  it("does not write without consent", async () => {
    const write = vi.fn();
    await expect(trackCalorEvent({ write }, event, false)).resolves.toBe("skipped");
    expect(write).not.toHaveBeenCalled();
  });

  it("rejects sensitive free-form properties", () => {
    expect(() =>
      validateAnalyticsEvent({ ...event, properties: { child_age: 8 } }),
    ).toThrow(/Sensitive/);
  });

  it("preserves first touch and updates last touch", () => {
    const first = attributionFromUrl(
      new URL("https://calortravel.nl/?utm_source=weerzone&utm_campaign=local"),
      "2026-07-01T00:00:00.000Z",
    );
    const second = attributionFromUrl(
      new URL("https://calortravel.nl/?utm_source=google&utm_medium=organic"),
      "2026-07-02T00:00:00.000Z",
    );
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const state = updateAttribution(updateAttribution(null, first!), second!);
    expect(state.firstTouch.source).toBe("weerzone");
    expect(state.lastTouch.source).toBe("google");
  });

  it("accepts only explicit analytics consent", () => {
    expect(hasAnalyticsConsent("granted")).toBe(true);
    expect(hasAnalyticsConsent("denied")).toBe(false);
    expect(hasAnalyticsConsent(undefined)).toBe(false);
  });
});
