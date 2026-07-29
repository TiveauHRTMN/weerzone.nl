import { describe, expect, it } from "vitest";

import { SeedWeatherProvider } from "@/features/daily-plan/seed-weather-provider";

describe("SeedWeatherProvider", () => {
  it("returns the same normalized context and revision for the same grid and date", async () => {
    const provider = new SeedWeatherProvider();
    const input = {
      latitude: 19.2,
      longitude: -69.3,
      date: "2026-08-12",
      timezone: "America/Santo_Domingo",
    };
    const first = await provider.getContext(input);
    const second = await provider.getContext(input);

    expect(second).toEqual(first);
    expect(first.fallbackStatus).toBe("seed");
    expect(first.context.rainProbability).toBeGreaterThanOrEqual(0);
    expect(first.context.rainProbability).toBeLessThanOrEqual(100);
  });
});
