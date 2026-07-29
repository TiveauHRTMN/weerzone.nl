import "server-only";

import { serverEnvironment } from "./env";
import {
  isCalorFeatureEnabled,
  type CalorFeature,
  type CalorFeatureFlags,
} from "./feature-flags";

export function getCalorFeatureFlags(): Readonly<CalorFeatureFlags> {
  return serverEnvironment.calorFeatures;
}

export function isServerFeatureEnabled(feature: CalorFeature): boolean {
  return isCalorFeatureEnabled(getCalorFeatureFlags(), feature);
}

