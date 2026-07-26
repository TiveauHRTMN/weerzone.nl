import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

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

  const chosenBest = best ?? fallbackViews[0];
  if (!chosenBest) return null;

  const chosenAlternatives = alternatives.length > 0 ? alternatives : fallbackViews.slice(1, 3);
  const planB = chosenAlternatives[0] ?? chosenBest;
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
  const generatedAt = recommendations[0]?.generatedAt;
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
    sinceYesterday: generatedAt
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
    dataNotice: generatedAt ? null : "Geen verse dagranking beschikbaar; Calor toont gecontroleerde catalogusdata.",
  };
}
