import { describe, expect, it } from "vitest";

import { buildWeerzoneReferral } from "@/features/weerzone/referral";

describe("Weerzone referral", () => {
  it("builds an attributable lightweight destination URL", () => {
    const referral = buildWeerzoneReferral("https://calortravel.nl", "rain_a");
    const url = new URL(referral.destinationUrl);
    expect(url.pathname).toBe("/reis-plannen");
    expect(url.searchParams.get("utm_source")).toBe("weerzone");
    expect(url.searchParams.get("utm_content")).toBe("rain_a");
  });
});

