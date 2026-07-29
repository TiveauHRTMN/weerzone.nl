import type { TravelerProfile } from "@/domain/travelers/profile";

import type { DailyPlanSnapshotRepository } from "./daily-plan-snapshot-repository";
import {
  generateDailyTravelPlan,
  type DailyTravelPlan,
} from "./generate-daily-travel-plan";
import type { TravelOptionRepository } from "./travel-option-repository";
import type { WeatherIntelligenceProvider } from "./weather-intelligence";

export const DAILY_PLAN_RANKING_VERSION = "calor-daily-v1";

export type CreateDailyPlanInput = {
  tripId: string;
  date: string;
  destinationId: string;
  regionId?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  travelerProfile: TravelerProfile;
  profileRevision: string;
};

export async function createDailyPlan(
  input: CreateDailyPlanInput,
  dependencies: {
    options: TravelOptionRepository;
    weather: WeatherIntelligenceProvider;
    snapshots: DailyPlanSnapshotRepository;
  },
): Promise<DailyTravelPlan | null> {
  const [availableOptions, weather] = await Promise.all([
    dependencies.options.findAvailable({
      destinationId: input.destinationId,
      regionId: input.regionId,
      date: input.date,
    }),
    dependencies.weather.getContext({
      latitude: input.latitude,
      longitude: input.longitude,
      date: input.date,
      timezone: input.timezone,
    }),
  ]);
  if (availableOptions.length === 0) return null;

  const cacheKey = {
    tripId: input.tripId,
    date: input.date,
    weatherRevision: weather.revision,
    profileRevision: input.profileRevision,
    rankingVersion: DAILY_PLAN_RANKING_VERSION,
  };
  const cached = await dependencies.snapshots.find(cacheKey);
  if (cached) return cached;

  const plan = await generateDailyTravelPlan({
    tripId: input.tripId,
    date: input.date,
    destinationId: input.destinationId,
    regionId: input.regionId,
    travelerProfile: input.travelerProfile,
    weatherContext: weather.context,
    availableOptions,
    latitude: input.latitude,
    longitude: input.longitude,
    generatedAt: weather.retrievedAt,
    sourceFreshness: `${weather.source} · bijgewerkt ${new Intl.DateTimeFormat(
      "nl-NL",
      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" },
    ).format(new Date(weather.retrievedAt))}`,
  });
  await dependencies.snapshots.save({
    ...cacheKey,
    weatherSource: weather.source,
    weatherFallback: weather.fallbackStatus,
    weatherRetrievedAt: weather.retrievedAt,
    plan,
  });
  return plan;
}
