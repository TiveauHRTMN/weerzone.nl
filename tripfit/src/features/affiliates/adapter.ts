import type { ProviderType, TravelOption } from "@/domain/travel-options/model";

export type AffiliateClickInput = {
  clickId: string;
  originalUrl: string;
  trackedUrl: string;
  provider: ProviderType;
  placement: string;
  tripId?: string;
  destinationId?: string;
  userId?: string;
  anonymousSessionId?: string;
};

export interface AffiliateProviderAdapter {
  provider: ProviderType;
  normalizeProduct(input: unknown): TravelOption;
  buildTrackedUrl(params: {
    originalUrl: string;
    tripId?: string;
    destinationId?: string;
    placement: string;
    campaign?: string;
  }): string;
  trackClick(params: AffiliateClickInput): Promise<void>;
}

export type AffiliateClickWriter = {
  write(input: AffiliateClickInput): Promise<void>;
};

export function buildTrackedUrl({
  originalUrl,
  placement,
  campaign,
}: {
  originalUrl: string;
  placement: string;
  campaign?: string;
}): string {
  const url = new URL(originalUrl);
  if (url.protocol !== "https:") throw new Error("Only HTTPS affiliate URLs are allowed");
  url.searchParams.set("utm_source", "calor");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_content", placement);
  if (campaign) url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export function assertAllowedAffiliateDestination(
  rawUrl: string,
  allowedHosts: ReadonlySet<string>,
): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error("Affiliate destination is not allowlisted");
  }
  return url;
}

export async function resolveAffiliateClick({
  affiliatesEnabled,
  adapter,
  input,
  allowedHosts,
  neutralPath,
}: {
  affiliatesEnabled: boolean;
  adapter: AffiliateProviderAdapter;
  input: Omit<AffiliateClickInput, "trackedUrl">;
  allowedHosts: ReadonlySet<string>;
  neutralPath: string;
}): Promise<{ destination: string; external: boolean }> {
  if (!affiliatesEnabled) return { destination: neutralPath, external: false };
  assertAllowedAffiliateDestination(input.originalUrl, allowedHosts);
  const trackedUrl = adapter.buildTrackedUrl({
    originalUrl: input.originalUrl,
    tripId: input.tripId,
    destinationId: input.destinationId,
    placement: input.placement,
  });
  assertAllowedAffiliateDestination(trackedUrl, allowedHosts);
  await adapter.trackClick({ ...input, trackedUrl });
  return { destination: trackedUrl, external: true };
}

