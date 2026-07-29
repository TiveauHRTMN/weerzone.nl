import { describe, expect, it } from "vitest";

import {
  DEFAULT_CALOR_FEATURE_FLAGS,
  isCalorFeatureEnabled,
  resolveCalorFeatureFlags,
} from "@/config/feature-flags";

describe("Calor feature flags", () => {
  it("fails closed when configuration is absent", () => {
    expect(resolveCalorFeatureFlags({})).toEqual(DEFAULT_CALOR_FEATURE_FLAGS);
  });

  it("only enables the exact lowercase true value", () => {
    const flags = resolveCalorFeatureFlags({
      CALOR_AFFILIATES_ENABLED: "true",
      CALOR_PAYMENTS_ENABLED: "TRUE",
      NEXT_PUBLIC_CALOR_PUBLIC_LAUNCH: "false",
      CALOR_AI_RECOMMENDATIONS_ENABLED: "1",
      CALOR_LIVE_MODE_ENABLED: "true",
      CALOR_LOCAL_PARTNERS_ENABLED: "yes",
      CALOR_WEERZONE_REFERRAL_ENABLED: "true",
    });

    expect(flags).toEqual({
      affiliatesEnabled: true,
      paymentsEnabled: false,
      publicLaunchEnabled: false,
      aiRecommendationsEnabled: false,
      liveModeEnabled: true,
      localPartnersEnabled: false,
      weerzoneReferralEnabled: true,
    });
  });

  it("uses the central accessor for feature decisions", () => {
    expect(
      isCalorFeatureEnabled(
        { ...DEFAULT_CALOR_FEATURE_FLAGS, localPartnersEnabled: true },
        "localPartnersEnabled",
      ),
    ).toBe(true);
  });
});
