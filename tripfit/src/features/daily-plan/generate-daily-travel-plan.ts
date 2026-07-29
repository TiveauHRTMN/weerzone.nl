import { z } from "zod";

import {
  rankTravelOptions,
  type RecommendationContext,
  type RecommendationReason,
  type WeatherContext,
} from "@/domain/recommendations/engine";
import type { TravelOption } from "@/domain/travel-options/model";
import type { TravelerProfile } from "@/domain/travelers/profile";

export type PlannedItem = {
  optionId: string;
  title: string;
  summary: string;
  reason: RecommendationReason;
  distanceKm?: number;
  priceFrom?: number;
  currency?: string;
  practicalNotes: string[];
  externalBookingUrl?: string;
};

export type DailyTravelPlan = {
  date: string;
  weatherSummary: string;
  daySummary: string;
  morning?: PlannedItem;
  afternoon?: PlannedItem;
  evening?: PlannedItem;
  warnings: string[];
  backupPlan?: PlannedItem[];
  generatedAt: string;
  sourceFreshness: string;
};

const wordingSchema = z.object({
  daySummary: z.string().trim().min(1).max(240),
  itemSummaries: z.record(z.string(), z.string().trim().min(1).max(180)),
});

export type DailyPlanWordingProvider = {
  word(input: {
    date: string;
    weatherSummary: string;
    items: Array<{ id: string; title: string; factualSignals: string[] }>;
  }): Promise<unknown>;
};

export type GenerateDailyTravelPlanInput = {
  tripId: string;
  date: string;
  destinationId: string;
  regionId?: string;
  travelerProfile: TravelerProfile;
  weatherContext: WeatherContext;
  availableOptions: readonly TravelOption[];
  latitude?: number;
  longitude?: number;
  generatedAt?: string;
  sourceFreshness?: string;
  wordingProvider?: DailyPlanWordingProvider;
};

function weatherSummary(weather: WeatherContext): string {
  if (weather.thunderstorm) return "Onweer mogelijk; Calor houdt de dag beschut.";
  if (weather.rainProbability >= 60) return "Regenkans aanwezig; binnenopties staan klaar.";
  if (weather.windKph >= 30) return "Vrij krachtige wind; activiteiten op zee vallen af.";
  return `${Math.round(weather.feelsLikeCelsius)}° gevoelstemperatuur, ${Math.round(weather.rainProbability)}% regenkans.`;
}

function plannedItem(
  ranked: ReturnType<typeof rankTravelOptions>["ranked"][number],
  summary?: string,
): PlannedItem {
  const { option, reason } = ranked;
  const practicalNotes = [
    option.durationMinutes ? `${option.durationMinutes} minuten` : "Duur bevestigen",
    option.verificationStatus === "stale"
      ? "Controleer details bij de aanbieder"
      : "Details gecontroleerd",
  ];
  return {
    optionId: option.id,
    title: option.title,
    summary: summary ?? reason.summary,
    reason,
    ...(option.priceFrom !== undefined
      ? { priceFrom: option.priceFrom, currency: option.currency }
      : {}),
    practicalNotes,
    ...(option.externalUrl ? { externalBookingUrl: option.externalUrl } : {}),
  };
}

function pickSlots(
  ranked: ReturnType<typeof rankTravelOptions>["ranked"],
): {
  morning?: (typeof ranked)[number];
  afternoon?: (typeof ranked)[number];
  evening?: (typeof ranked)[number];
} {
  const eveningIndex = ranked.findIndex((item) =>
    ["restaurant", "event"].includes(item.option.type),
  );
  const evening = eveningIndex >= 0 ? ranked[eveningIndex] : undefined;
  const daytime = ranked.filter((_, index) => index !== eveningIndex);
  return {
    morning: daytime[0],
    afternoon: daytime[1],
    evening: evening ?? daytime[2],
  };
}

export async function generateDailyTravelPlan(
  input: GenerateDailyTravelPlanInput,
): Promise<DailyTravelPlan> {
  const context: RecommendationContext = {
    date: input.date,
    destinationId: input.destinationId,
    regionId: input.regionId,
    travelerProfile: input.travelerProfile,
    weather: input.weatherContext,
    latitude: input.latitude,
    longitude: input.longitude,
  };
  const result = rankTravelOptions(input.availableOptions, context);
  const slots = pickSlots(result.ranked);
  const selected = [slots.morning, slots.afternoon, slots.evening].filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );
  const forecast = weatherSummary(input.weatherContext);
  const fallbackDaySummary = selected.length
    ? `${selected.length} passende momenten, met ruimte om de dag rustig te laten bewegen.`
    : "Nog geen betrouwbare daginvulling beschikbaar.";

  let wording: z.infer<typeof wordingSchema> | null = null;
  if (input.wordingProvider && selected.length) {
    try {
      wording = wordingSchema.parse(
        await input.wordingProvider.word({
          date: input.date,
          weatherSummary: forecast,
          items: selected.map(({ option, reason }) => ({
            id: option.id,
            title: option.title,
            factualSignals: reason.positiveSignals,
          })),
        }),
      );
    } catch {
      wording = null;
    }
  }

  const toItem = (item: (typeof selected)[number] | undefined) =>
    item
      ? plannedItem(item, wording?.itemSummaries[item.option.id])
      : undefined;
  const backup = result.ranked
    .filter(
      ({ option }) =>
        option.indoorOutdoor !== "outdoor" &&
        !selected.some((item) => item.option.id === option.id),
    )
    .slice(0, 2)
    .map((item) => plannedItem(item));

  return {
    date: input.date,
    weatherSummary: forecast,
    daySummary: wording?.daySummary ?? fallbackDaySummary,
    morning: toItem(slots.morning),
    afternoon: toItem(slots.afternoon),
    evening: toItem(slots.evening),
    warnings: result.rejected.flatMap((item) => item.reasons).slice(0, 5),
    ...(backup.length ? { backupPlan: backup } : {}),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceFreshness: input.sourceFreshness ?? "Bronmoment niet opgegeven",
  };
}

