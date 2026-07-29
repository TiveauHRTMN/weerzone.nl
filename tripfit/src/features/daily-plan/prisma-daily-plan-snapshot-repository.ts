import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

import type { DailyTravelPlan } from "./generate-daily-travel-plan";
import type {
  DailyPlanCacheKey,
  DailyPlanSnapshotInput,
  DailyPlanSnapshotRepository,
} from "./daily-plan-snapshot-repository";

const dateValue = (date: string) => new Date(`${date}T00:00:00.000Z`);

export class PrismaDailyPlanSnapshotRepository
  implements DailyPlanSnapshotRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async find(key: DailyPlanCacheKey): Promise<DailyTravelPlan | null> {
    const snapshot = await this.prisma.dailyPlanSnapshot.findUnique({
      where: {
        tripId_planDate_weatherRevision_profileRevision_rankingVersion: {
          tripId: key.tripId,
          planDate: dateValue(key.date),
          weatherRevision: key.weatherRevision,
          profileRevision: key.profileRevision,
          rankingVersion: key.rankingVersion,
        },
      },
      select: { plan: true },
    });
    return (snapshot?.plan as DailyTravelPlan | undefined) ?? null;
  }

  async save(input: DailyPlanSnapshotInput): Promise<void> {
    const key = {
      tripId: input.tripId,
      planDate: dateValue(input.date),
      weatherRevision: input.weatherRevision,
      profileRevision: input.profileRevision,
      rankingVersion: input.rankingVersion,
    };
    await this.prisma.dailyPlanSnapshot.upsert({
      where: {
        tripId_planDate_weatherRevision_profileRevision_rankingVersion: key,
      },
      create: {
        ...key,
        weatherSource: input.weatherSource,
        weatherFallback: input.weatherFallback,
        weatherRetrievedAt: new Date(input.weatherRetrievedAt),
        plan: input.plan,
      },
      update: {},
    });
  }
}
