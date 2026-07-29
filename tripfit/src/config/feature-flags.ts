export type CalorFeatureFlags = {
  affiliatesEnabled: boolean;
  paymentsEnabled: boolean;
  publicLaunchEnabled: boolean;
  aiRecommendationsEnabled: boolean;
  liveModeEnabled: boolean;
  localPartnersEnabled: boolean;
  weerzoneReferralEnabled: boolean;
};

export type CalorFeature = keyof CalorFeatureFlags;

export const DEFAULT_CALOR_FEATURE_FLAGS: Readonly<CalorFeatureFlags> = {
  affiliatesEnabled: false,
  paymentsEnabled: false,
  publicLaunchEnabled: false,
  aiRecommendationsEnabled: false,
  liveModeEnabled: false,
  localPartnersEnabled: false,
  weerzoneReferralEnabled: false,
};

const environmentKeys = {
  affiliatesEnabled: "CALOR_AFFILIATES_ENABLED",
  paymentsEnabled: "CALOR_PAYMENTS_ENABLED",
  publicLaunchEnabled: "NEXT_PUBLIC_CALOR_PUBLIC_LAUNCH",
  aiRecommendationsEnabled: "CALOR_AI_RECOMMENDATIONS_ENABLED",
  liveModeEnabled: "CALOR_LIVE_MODE_ENABLED",
  localPartnersEnabled: "CALOR_LOCAL_PARTNERS_ENABLED",
  weerzoneReferralEnabled: "CALOR_WEERZONE_REFERRAL_ENABLED",
} as const satisfies Record<CalorFeature, string>;

function enabled(value: unknown): boolean {
  return value === "true";
}

export function resolveCalorFeatureFlags(
  environment: Readonly<Record<string, unknown>>,
): CalorFeatureFlags {
  return {
    affiliatesEnabled: enabled(environment[environmentKeys.affiliatesEnabled]),
    paymentsEnabled: enabled(environment[environmentKeys.paymentsEnabled]),
    publicLaunchEnabled: enabled(environment[environmentKeys.publicLaunchEnabled]),
    aiRecommendationsEnabled: enabled(
      environment[environmentKeys.aiRecommendationsEnabled],
    ),
    liveModeEnabled: enabled(environment[environmentKeys.liveModeEnabled]),
    localPartnersEnabled: enabled(environment[environmentKeys.localPartnersEnabled]),
    weerzoneReferralEnabled: enabled(
      environment[environmentKeys.weerzoneReferralEnabled],
    ),
  };
}

export function isCalorFeatureEnabled(
  flags: Readonly<CalorFeatureFlags>,
  feature: CalorFeature,
): boolean {
  return flags[feature];
}
