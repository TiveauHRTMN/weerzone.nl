import type { TravelOption } from "@/domain/travel-options/model";
import type { TravelerProfile } from "@/domain/travelers/profile";

export type WeatherContext = {
  rainProbability: number;
  windKph: number;
  feelsLikeCelsius: number;
  thunderstorm: boolean;
  condition?: string;
};

export type RecommendationContext = {
  date: string;
  destinationId: string;
  regionId?: string;
  latitude?: number;
  longitude?: number;
  travelerProfile: TravelerProfile;
  weather: WeatherContext;
};

export type RecommendationScore = {
  total: number;
  weatherFit: number;
  profileFit: number;
  dateFit: number;
  distanceFit: number;
  budgetFit: number;
  qualityFit: number;
  localValue: number;
  diversityAdjustment: number;
};

export type RecommendationReason = {
  summary: string;
  positiveSignals: string[];
  warnings: string[];
  alternativeOptionIds: string[];
};

export type RankedTravelOption = {
  option: TravelOption;
  score: RecommendationScore;
  reason: RecommendationReason;
};

export type RejectedTravelOption = {
  optionId: string;
  reasons: string[];
};

export type RankingResult = {
  ranked: RankedTravelOption[];
  rejected: RejectedTravelOption[];
};

const weights = {
  weatherFit: 0.2,
  profileFit: 0.18,
  dateFit: 0.16,
  distanceFit: 0.12,
  budgetFit: 0.1,
  qualityFit: 0.14,
  localValue: 0.1,
} as const;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function distanceKm(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const radius = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(toLat - fromLat);
  const deltaLon = radians(toLon - fromLon);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(fromLat)) *
      Math.cos(radians(toLat)) *
      Math.sin(deltaLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hardGateReasons(
  option: TravelOption,
  context: RecommendationContext,
): string[] {
  const reasons: string[] = [];
  if (!option.isPublished || option.verificationStatus === "disabled") {
    reasons.push("Niet gepubliceerd of uitgeschakeld");
  }
  if (option.destinationId !== context.destinationId) {
    reasons.push("Buiten de gekozen bestemming");
  }
  if (option.availableFrom && context.date < option.availableFrom) {
    reasons.push("Nog niet beschikbaar");
  }
  if (option.availableUntil && context.date > option.availableUntil) {
    reasons.push("Niet meer beschikbaar");
  }
  const weekday = new Date(`${context.date}T12:00:00Z`).getUTCDay();
  if (
    option.availableWeekdays?.length &&
    !option.availableWeekdays.includes(weekday)
  ) {
    reasons.push("Niet beschikbaar op deze reisdag");
  }
  const youngest = Math.min(
    ...context.travelerProfile.children.map(({ age }) => age),
    99,
  );
  if (option.minAge !== undefined && youngest < option.minAge) {
    reasons.push(`Minimumleeftijd is ${option.minAge} jaar`);
  }
  const rules = option.weatherRules;
  if (rules.avoidThunderstorm && context.weather.thunderstorm) {
    reasons.push("Onveilig bij onweer");
  }
  if (
    rules.maxWindKph !== undefined &&
    context.weather.windKph > rules.maxWindKph
  ) {
    reasons.push("Te veel wind");
  }
  return reasons;
}

function weatherFit(option: TravelOption, weather: WeatherContext): number {
  const rules = option.weatherRules;
  let score = 100;
  if (
    rules.maxRainProbability !== undefined &&
    weather.rainProbability > rules.maxRainProbability
  ) {
    score -= (weather.rainProbability - rules.maxRainProbability) * 1.5;
  }
  if (
    rules.maxFeelsLikeCelsius !== undefined &&
    weather.feelsLikeCelsius > rules.maxFeelsLikeCelsius
  ) {
    score -= (weather.feelsLikeCelsius - rules.maxFeelsLikeCelsius) * 8;
  }
  if (
    rules.minTemperatureCelsius !== undefined &&
    weather.feelsLikeCelsius < rules.minTemperatureCelsius
  ) {
    score -= (rules.minTemperatureCelsius - weather.feelsLikeCelsius) * 8;
  }
  if (
    rules.maxTemperatureCelsius !== undefined &&
    weather.feelsLikeCelsius > rules.maxTemperatureCelsius
  ) {
    score -= (weather.feelsLikeCelsius - rules.maxTemperatureCelsius) * 8;
  }
  if (
    weather.condition &&
    rules.unsuitableConditions.some(
      (condition) => condition.toLowerCase() === weather.condition?.toLowerCase(),
    )
  ) {
    score -= 50;
  }
  return clamp(score);
}

function profileFit(
  option: TravelOption,
  profile: TravelerProfile,
): number {
  let score = 55;
  if (option.familyFriendly && profile.children.length) score += 25;
  if (profile.mobility === "limited" && option.accessibilityNotes) score += 10;
  if (
    profile.indoorOutdoor &&
    (profile.indoorOutdoor === "mixed" ||
      profile.indoorOutdoor === option.indoorOutdoor)
  ) {
    score += 15;
  }
  if (profile.interests.includes(option.type === "restaurant" ? "food" : option.type as never)) {
    score += 20;
  }
  return clamp(score);
}

function budgetFit(option: TravelOption, profile: TravelerProfile): number {
  if (!option.priceLevel) return 65;
  const target = { budget: 1, balanced: 2.5, premium: 4 }[profile.budgetLevel];
  return clamp(100 - Math.abs(option.priceLevel - target) * 28);
}

function qualityFit(option: TravelOption): number {
  const ratingScore = option.rating === undefined ? 55 : (option.rating / 5) * 100;
  const evidence = option.reviewCount === undefined
    ? 0
    : Math.min(15, Math.log10(option.reviewCount + 1) * 5);
  const verified = option.verificationStatus === "verified" ? 10 : 0;
  return clamp(ratingScore * 0.8 + evidence + verified);
}

function scoreOption(
  option: TravelOption,
  context: RecommendationContext,
): RecommendationScore {
  const distance =
    context.latitude !== undefined &&
    context.longitude !== undefined &&
    option.latitude !== undefined &&
    option.longitude !== undefined
      ? distanceKm(
          context.latitude,
          context.longitude,
          option.latitude,
          option.longitude,
        )
      : null;
  const components = {
    weatherFit: weatherFit(option, context.weather),
    profileFit: profileFit(option, context.travelerProfile),
    dateFit: option.availableWeekdays?.length ? 100 : 80,
    distanceFit: distance === null ? 60 : clamp(100 - distance * 3),
    budgetFit: budgetFit(option, context.travelerProfile),
    qualityFit: qualityFit(option),
    localValue: clamp(option.localValueScore),
    diversityAdjustment: 0,
  };
  const total = Object.entries(weights).reduce(
    (sum, [key, weight]) =>
      sum + components[key as keyof typeof weights] * weight,
    0,
  );
  return { ...components, total: clamp(total) };
}

function reasonFor(option: TravelOption, score: RecommendationScore): RecommendationReason {
  const positives: string[] = [];
  if (score.weatherFit >= 80) positives.push("Past goed bij het verwachte weer");
  if (score.profileFit >= 75) positives.push("Past bij je gezelschap en voorkeuren");
  if (score.distanceFit >= 80) positives.push("Dicht bij je route");
  if (score.localValue >= 75) positives.push("Sterke lokale waarde");
  const warnings: string[] = [];
  if (option.verificationStatus === "stale") warnings.push("Controleer actuele details bij de aanbieder");
  if (score.weatherFit < 50) warnings.push("Het weer maakt dit een minder sterke keuze");
  return {
    summary: positives[0] ?? "Een passende optie voor deze reisdag",
    positiveSignals: positives,
    warnings,
    alternativeOptionIds: [],
  };
}

export function rankTravelOptions(
  options: readonly TravelOption[],
  context: RecommendationContext,
): RankingResult {
  const rejected: RejectedTravelOption[] = [];
  const eligible = options.flatMap((option) => {
    const reasons = hardGateReasons(option, context);
    if (reasons.length) {
      rejected.push({ optionId: option.id, reasons });
      return [];
    }
    const score = scoreOption(option, context);
    return [{ option, score, reason: reasonFor(option, score) }];
  });

  eligible.sort(
    (left, right) =>
      right.score.total - left.score.total ||
      right.score.weatherFit - left.score.weatherFit ||
      right.score.localValue - left.score.localValue ||
      left.option.id.localeCompare(right.option.id),
  );

  const seenTypes = new Map<string, number>();
  const diversified = eligible.map((item) => {
    const seen = seenTypes.get(item.option.type) ?? 0;
    seenTypes.set(item.option.type, seen + 1);
    const adjustment = seen === 0 ? 0 : -Math.min(18, seen * 6);
    return {
      ...item,
      score: {
        ...item.score,
        diversityAdjustment: adjustment,
        total: clamp(item.score.total + adjustment),
      },
    };
  });
  diversified.sort(
    (left, right) =>
      right.score.total - left.score.total ||
      left.option.id.localeCompare(right.option.id),
  );
  return {
    ranked: diversified.map((item, index, all) => ({
      ...item,
      reason: {
        ...item.reason,
        alternativeOptionIds: all
          .filter((candidate) => candidate.option.id !== item.option.id)
          .slice(0, 3)
          .map((candidate) => candidate.option.id),
      },
    })),
    rejected,
  };
}

