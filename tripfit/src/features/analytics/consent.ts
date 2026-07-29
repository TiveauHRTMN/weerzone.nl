export const ANALYTICS_CONSENT_COOKIE = "calor_analytics_consent";
export const ANALYTICS_SESSION_COOKIE = "calor_analytics_session";

export function hasAnalyticsConsent(value: string | undefined): boolean {
  return value === "granted";
}

