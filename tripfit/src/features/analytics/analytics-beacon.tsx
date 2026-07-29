"use client";

import { useEffect } from "react";

import type { CalorAnalyticsEvent } from "./events";
import { trackClientEvent } from "./client";

export function AnalyticsBeacon({
  name,
  destinationId,
  tripId,
  includeAttribution = false,
}: {
  name: CalorAnalyticsEvent;
  destinationId?: string;
  tripId?: string;
  includeAttribution?: boolean;
}) {
  useEffect(() => {
    const track = () =>
      void trackClientEvent({
        name,
        destinationId,
        tripId,
        includeAttribution,
      });
    track();
    window.addEventListener("calor:analytics-consent-granted", track);
    return () =>
      window.removeEventListener("calor:analytics-consent-granted", track);
  }, [destinationId, includeAttribution, name, tripId]);
  return null;
}
