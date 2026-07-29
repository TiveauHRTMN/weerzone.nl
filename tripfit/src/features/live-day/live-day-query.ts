import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { travelerProfileSchema } from "@/domain/travelers/profile";
import { createDailyPlan } from "@/features/daily-plan/create-daily-plan";
import { PrismaDailyPlanSnapshotRepository } from "@/features/daily-plan/prisma-daily-plan-snapshot-repository";
import { PrismaTravelOptionRepository } from "@/features/daily-plan/prisma-travel-option-repository";
import { SeedWeatherProvider } from "@/features/daily-plan/seed-weather-provider";
import type { DailyTravelPlan, PlannedItem } from "@/features/daily-plan/generate-daily-travel-plan";

import type { LiveDayData, LiveDayRecommendation } from "./live-day-data";

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function differenceInDays(later: Date, earlier: Date): number {
  return Math.floor((startOfUtcDay(later).getTime() - startOfUtcDay(earlier).getTime()) / 86_400_000);
}

function recommendationView(
  recommendation: {
    id: string;
    explanationFactors: string[];
    activity: {
      name: string;
      shortDescription: string;
      sources: Array<{ source: { name: string; lastVerifiedAt: Date } }>;
    };
  },
): LiveDayRecommendation {
  return {
    id: recommendation.id,
    title: recommendation.activity.name,
    summary: recommendation.activity.shortDescription,
    factors: recommendation.explanationFactors.slice(0, 4),
    sourceNotes: recommendation.activity.sources.slice(0, 4).map(
      ({ source }) =>
        `${source.name} · gecontroleerd ${new Intl.DateTimeFormat("nl-NL", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(source.lastVerifiedAt)}`,
    ),
  };
}

function plannedItemView(
  item: PlannedItem,
  sourceFreshness: string,
): LiveDayRecommendation {
  return {
    id: item.optionId,
    title: item.title,
    summary: item.summary,
    factors: [
      ...item.reason.positiveSignals,
      ...item.practicalNotes,
    ].slice(0, 4),
    sourceNotes: [sourceFreshness, ...item.reason.warnings].slice(0, 4),
  };
}

export async function getLiveDayForUser(
  prisma: PrismaClient,
  tripId: string,
  userId: string,
  now = new Date(),
): Promise<LiveDayData | null> {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      country: true,
      preferenceSnapshot: true,
      stops: {
        orderBy: { position: "asc" },
        include: { region: true },
      },
      travelers: true,
    },
  });
  if (!trip) return null;

  const today = startOfUtcDay(now);
  const arrival = startOfUtcDay(trip.arrivalDate);
  const departure = startOfUtcDay(trip.departureDate);
  const editionDate = today < arrival ? arrival : today > departure ? departure : today;
  const dayNumber = Math.max(1, differenceInDays(editionDate, arrival) + 1);
  const totalDays = Math.max(1, differenceInDays(departure, arrival) + 1);
  const activeStop =
    trip.stops.find((stop) => startOfUtcDay(stop.arrivalDate) <= editionDate && startOfUtcDay(stop.departureDate) >= editionDate) ??
    trip.stops[0];

  const dateKey = editionDate.toISOString().slice(0, 10);
  const profile = trip.preferenceSnapshot
    ? travelerProfileSchema.safeParse({
        travelPartyType: trip.preferenceSnapshot.travelPartyType.toLowerCase(),
        adults: trip.preferenceSnapshot.adults,
        children: trip.preferenceSnapshot.childAges.map((age) => ({ age })),
        budgetLevel: trip.preferenceSnapshot.budgetLevel.toLowerCase(),
        interests: trip.preferenceSnapshot.interests,
        preferredPace: trip.preferenceSnapshot.preferredPace.toLowerCase(),
        mobility: trip.preferenceSnapshot.mobility.toLowerCase(),
        transport: trip.preferenceSnapshot.transport ?? undefined,
        accommodationArea: trip.preferenceSnapshot.accommodationArea ?? undefined,
        indoorOutdoor: trip.preferenceSnapshot.indoorOutdoor?.toLowerCase(),
        foodPreferences: trip.preferenceSnapshot.foodPreferences,
      })
    : null;
  const latitude =
    activeStop?.region.centerLatitude ?? trip.country.centerLatitude;
  const longitude =
    activeStop?.region.centerLongitude ?? trip.country.centerLongitude;
  let generatedPlan: DailyTravelPlan | null = null;
  if (
    profile?.success &&
    typeof latitude === "number" &&
    typeof longitude === "number"
  ) {
    try {
      generatedPlan = await createDailyPlan(
        {
          tripId,
          date: dateKey,
          destinationId: trip.countryId,
          regionId: activeStop?.regionId,
          latitude,
          longitude,
          timezone: activeStop?.region.timezone ?? trip.timezone,
          travelerProfile: profile.data,
          profileRevision: trip.preferenceSnapshot!.updatedAt.toISOString(),
        },
        {
          options: new PrismaTravelOptionRepository(prisma),
          weather: new SeedWeatherProvider(),
          snapshots: new PrismaDailyPlanSnapshotRepository(prisma),
        },
      );
    } catch {
      // The proven Activity fallback below stays available during catalog rollout.
      generatedPlan = null;
    }
  }

  const recommendations = await prisma.recommendation.findMany({
    where: { tripId, recommendedFor: editionDate },
    orderBy: [{ plan: "asc" }, { rank: "asc" }],
    include: {
      activity: {
        include: {
          sources: {
            include: { source: true },
            orderBy: { confidence: "desc" },
          },
        },
      },
    },
  });

  const byPlan = (plan: "BEST_TODAY" | "ALTERNATIVE" | "DEFER") =>
    recommendations.filter((item) => item.plan === plan).map(recommendationView);
  const best = byPlan("BEST_TODAY")[0];
  const alternatives = byPlan("ALTERNATIVE");
  const deferred = byPlan("DEFER")[0] ?? null;

  const fallbackActivities = best || !activeStop
    ? []
    : await prisma.activity.findMany({
        where: { regionId: activeStop.regionId, isActive: true },
        orderBy: [{ coverageLevel: "asc" }, { uniquenessScore: "desc" }],
        take: 4,
        include: {
          sources: {
            include: { source: true },
            orderBy: { confidence: "desc" },
          },
        },
      });

  const fallbackViews: LiveDayRecommendation[] = fallbackActivities.map((activity) => ({
    id: activity.id,
    title: activity.name,
    summary: activity.shortDescription,
    factors: [
      activity.seasonal ? "Seizoen gecontroleerd" : "Het hele jaar mogelijk",
      activity.minimumAge ? `Vanaf ${activity.minimumAge} jaar` : "Geschikt voor het gezelschap",
      activity.bookingRequired ? "Reserveren aanbevolen" : "Flexibel te plannen",
      `${activity.durationMinutes ?? 120} min`,
    ],
    sourceNotes: activity.sources.slice(0, 4).map(
      ({ source }) => `${source.name} · bronvertrouwen ${Math.round(source.confidence * 100)}%`,
    ),
  }));

  const generatedItems = generatedPlan
    ? [generatedPlan.morning, generatedPlan.afternoon, generatedPlan.evening]
        .filter((item): item is PlannedItem => Boolean(item))
        .map((item) => plannedItemView(item, generatedPlan.sourceFreshness))
    : [];
  const generatedBackup = generatedPlan?.backupPlan?.map((item) =>
    plannedItemView(item, generatedPlan.sourceFreshness),
  ) ?? [];
  const chosenBest = generatedItems[0] ?? best ?? fallbackViews[0];
  if (!chosenBest) return null;

  const chosenAlternatives = generatedItems.length > 1
    ? generatedItems.slice(1)
    : alternatives.length > 0 ? alternatives : fallbackViews.slice(1, 3);
  const planB = generatedBackup[0] ?? chosenAlternatives[0] ?? chosenBest;
  const signals = await prisma.travelSignal.findMany({
    where: {
      countryId: trip.countryId,
      OR: [{ regionId: null }, ...(activeStop ? [{ regionId: activeStop.regionId }] : [])],
      publishedAt: { lte: addDays(editionDate, 1) },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: editionDate } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: editionDate } }] },
      ],
    },
    orderBy: [{ impact: "asc" }, { publishedAt: "desc" }],
    take: 1,
  });

  const destination = activeStop?.region.name ?? trip.country.name;
  const generatedAt = generatedPlan
    ? new Date(generatedPlan.generatedAt)
    : recommendations[0]?.generatedAt;
  const adults = trip.travelers.filter((traveler) => traveler.kind === "ADULT").length;
  const children = trip.travelers.filter((traveler) => traveler.kind === "CHILD").length;

  return {
    tripId,
    tripTitle: trip.title ?? trip.country.name,
    destination,
    dateLabel: `${dateFormatter.format(editionDate)} — ${destination}`,
    dayNumber,
    totalDays,
    updatedLabel: generatedAt
      ? new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: trip.timezone }).format(generatedAt)
      : "seizoensbeeld",
    sinceYesterday: generatedPlan
      ? generatedPlan.daySummary
      : generatedAt
      ? `De rangschikking is opnieuw berekend voor ${destination}.`
      : "Nog geen verse dagberekening — advies staat op het gecontroleerde seizoensbeeld.",
    best: chosenBest,
    planB,
    alternatives: chosenAlternatives.slice(0, 2),
    defer: deferred,
    countryPulse: signals[0]?.summary ?? `Geen actuele reissignalen met directe impact voor ${destination}.`,
    practical: [
      { label: "Gezelschap", value: `${adults} volwassene${adults === 1 ? "" : "n"}${children ? ` · ${children} kind${children === 1 ? "" : "eren"}` : ""}` },
      { label: "Lokale tijd", value: trip.timezone },
      { label: "Reisdag", value: `${dayNumber} van ${totalDays}` },
    ],
    dataNotice: generatedPlan
      ? `Calor gebruikt ${generatedPlan.sourceFreshness.toLowerCase()}.`
      : generatedAt ? null : "Geen verse dagranking beschikbaar; Calor toont gecontroleerde catalogusdata.",
  };
}
