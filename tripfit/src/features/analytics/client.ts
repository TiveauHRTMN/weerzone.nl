"use client";

import type { CalorAnalyticsEvent } from "./events";

export async function setAnalyticsConsent(
  consent: "granted" | "denied",
): Promise<boolean> {
  const response = await fetch("/api/analytics/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consent }),
    keepalive: true,
  });
  return response.ok;
}

export async function trackClientEvent(input: {
  name: CalorAnalyticsEvent;
  tripId?: string;
  destinationId?: string;
  properties?: Record<string, string | number | boolean | null>;
  includeAttribution?: boolean;
}): Promise<void> {
  await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      name: input.name,
      occurredAt: new Date().toISOString(),
      tripId: input.tripId,
      destinationId: input.destinationId,
      properties: input.properties ?? {},
      pageUrl: input.includeAttribution ? window.location.href : undefined,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

