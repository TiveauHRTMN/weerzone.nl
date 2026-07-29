import type { DailyTravelPlan } from "./generate-daily-travel-plan";

export type DailyPlanCacheKey = {
  tripId: string;
  date: string;
  weatherRevision: string;
  profileRevision: string;
  rankingVersion: string;
};

export type DailyPlanSnapshotInput = DailyPlanCacheKey & {
  weatherSource: string;
  weatherFallback: string;
  weatherRetrievedAt: string;
  plan: DailyTravelPlan;
};

export interface DailyPlanSnapshotRepository {
  find(key: DailyPlanCacheKey): Promise<DailyTravelPlan | null>;
  save(input: DailyPlanSnapshotInput): Promise<void>;
}
