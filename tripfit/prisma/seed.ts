import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { parseDatabaseUrl } from "../src/config/database-url";
import { buildClusterRows, buildInterestRows, buildRegionRows } from "../src/db/seed-data";
import { dominicanRepublicPack } from "../src/domain/countries/packs/dominican-republic";
import {
  CoverageLevel,
  IndoorOutdoor,
  PrismaClient,
  ProviderFallbackStatus,
  SeasonStatus,
  SeasonWindowKind,
  SourceAuthority,
} from "../src/generated/prisma/client";

const databaseUrl = parseDatabaseUrl(
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL,
);

if (!databaseUrl) {
  throw new Error(
    "Seeding requires a valid DIRECT_URL or PostgreSQL DATABASE_URL",
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
const verifiedAt = new Date("2026-07-12T00:00:00.000Z");
const countryId = dominicanRepublicPack.country.id;
const seedSourceId = "source-tripfit-dr-seed-v1";

async function seedCountryPack() {
  const country = dominicanRepublicPack.country;
  const countryData = {
    iso2: country.iso2Code,
    iso3: country.iso3Code,
    slug: country.slug,
    name: country.name,
    officialName: country.officialName,
    currencyCode: country.currencies[0].code,
    timezone: country.timeZones[0],
    centerLatitude: country.center.latitude,
    centerLongitude: country.center.longitude,
    nationalContext: { label: "Calor country pack (DR)", status: "seeddata" },
    sourceCoverage: {
      flagshipRegions: dominicanRepublicPack.regions.filter((r) => r.coverageLevel === "FLAGSHIP").length,
      standardRegions: dominicanRepublicPack.regions.filter((r) => r.coverageLevel === "STANDARD").length,
      basicRegions: dominicanRepublicPack.regions.filter((r) => r.coverageLevel === "BASIC").length,
    },
    isActive: true,
    isSeedData: true,
  };
  await prisma.country.upsert({
    where: { id: countryId },
    update: countryData,
    create: { id: countryId, ...countryData },
  });

  await prisma.source.upsert({
    where: { code: "tripfit-dr-seed-v1" },
    update: {
      countryId,
      name: "TripFit Dominican Republic seed pack v1",
      provider: "tripfit-seed",
      authority: SourceAuthority.INDICATIVE,
      retrievedAt: verifiedAt,
      lastVerifiedAt: verifiedAt,
      confidence: 0.65,
      rawReference: "prisma/seed.ts",
      fallbackStatus: ProviderFallbackStatus.SEED_FALLBACK,
      isSeedData: true,
    },
    create: {
      id: seedSourceId,
      countryId,
      code: "tripfit-dr-seed-v1",
      name: "TripFit Dominican Republic seed pack v1",
      provider: "tripfit-seed",
      authority: SourceAuthority.INDICATIVE,
      retrievedAt: verifiedAt,
      lastVerifiedAt: verifiedAt,
      confidence: 0.65,
      rawReference: "prisma/seed.ts",
      fallbackStatus: ProviderFallbackStatus.SEED_FALLBACK,
      isSeedData: true,
    },
  });

  for (const region of buildRegionRows(dominicanRepublicPack)) {
    const regionData = {
      ...region,
      coverageLevel: CoverageLevel[region.coverageLevel],
      countryId,
      timezone: country.timeZones[0],
      isActive: true,
      isSeedData: true,
    };
    await prisma.region.upsert({
      where: { countryId_slug: { countryId, slug: region.slug } },
      update: regionData,
      create: regionData,
    });
  }

  for (const interest of buildInterestRows()) {
    await prisma.interest.upsert({
      where: { code: interest.code },
      update: { labelNl: interest.labelNl, sortOrder: interest.sortOrder, isActive: true },
      create: { ...interest, isActive: true },
    });
  }
}

async function seedFlagshipExamples() {
  for (const cluster of buildClusterRows(dominicanRepublicPack)) {
    const clusterData = {
      name: cluster.name,
      aliases: cluster.aliases,
      centerLatitude: cluster.centerLatitude,
      centerLongitude: cluster.centerLongitude,
      summary: cluster.summary,
      countryId,
      isActive: true,
      isSeedData: true,
    };
    await prisma.destinationCluster.upsert({
      where: { regionId_slug: { regionId: cluster.regionId, slug: cluster.slug } },
      update: clusterData,
      create: {
        id: cluster.id,
        regionId: cluster.regionId,
        slug: cluster.slug,
        ...clusterData,
      },
    });
  }

  const activities = [
    {
      id: "activity-do-zona-colonial-walk",
      regionId: "do-santo-domingo",
      destinationClusterId: "do-sd-ciudad-colonial",
      name: "Wandeling door de Zona Colonial",
      slug: "wandeling-zona-colonial",
      latitude: 18.4738,
      longitude: -69.884,
      shortDescription: "Een compacte route langs de oudste straten en pleinen van de koloniale stad.",
      categories: ["culture", "history", "family-activities"],
      tags: ["walking", "unesco", "seeddata"],
      indoorOutdoor: IndoorOutdoor.OUTDOOR,
      minimumAge: null,
      recommendedAgeMin: 6,
      durationMinutes: 150,
      priceLevel: 1,
      bookingRequired: false,
      seasonal: false,
      weatherSensitivity: {
        rainSensitivity: 0.45,
        windSensitivity: 0.1,
        heatSensitivity: 0.65,
        seaStateSensitivity: 0,
        lightningSensitivity: 0.7,
        preferredConditions: ["ochtend", "droog of lichte buien"],
      },
      familyFit: 82,
      uniquenessScore: 90,
      localAuthenticityScore: 88,
    },
    {
      id: "activity-do-samana-whale-watching",
      regionId: "do-samana",
      destinationClusterId: "do-samana-town",
      name: "Walvissen spotten in de Baai van Samaná",
      slug: "walvissen-spotten-samana",
      latitude: 19.196,
      longitude: -69.298,
      shortDescription: "Seizoensgebonden boottocht naar bultruggen in de Baai van Samaná.",
      categories: ["wildlife", "nature", "water-activities", "family-activities"],
      tags: ["whales", "boat", "seasonal", "seeddata"],
      indoorOutdoor: IndoorOutdoor.OUTDOOR,
      minimumAge: 4,
      recommendedAgeMin: 7,
      durationMinutes: 240,
      priceLevel: 3,
      bookingRequired: true,
      seasonal: true,
      weatherSensitivity: {
        rainSensitivity: 0.45,
        windSensitivity: 0.9,
        heatSensitivity: 0.25,
        seaStateSensitivity: 1,
        lightningSensitivity: 1,
        avoidConditions: ["harde wind", "hoge zeegang", "onweer"],
      },
      familyFit: 88,
      uniquenessScore: 100,
      localAuthenticityScore: 92,
    },
    {
      id: "activity-do-playa-bavaro",
      regionId: "do-punta-cana",
      destinationClusterId: "do-pc-bavaro",
      name: "Stranddag aan Playa Bávaro",
      slug: "stranddag-playa-bavaro",
      latitude: 18.688,
      longitude: -68.419,
      shortDescription: "Een flexibele stranddag aan de lange kuststrook van Bávaro.",
      categories: ["beach", "water-activities", "family-activities"],
      tags: ["swimming", "relaxed", "seeddata"],
      indoorOutdoor: IndoorOutdoor.OUTDOOR,
      minimumAge: null,
      recommendedAgeMin: null,
      durationMinutes: 240,
      priceLevel: 1,
      bookingRequired: false,
      seasonal: false,
      weatherSensitivity: {
        rainSensitivity: 0.7,
        windSensitivity: 0.55,
        heatSensitivity: 0.65,
        seaStateSensitivity: 0.75,
        lightningSensitivity: 1,
        avoidConditions: ["onweer", "gevaarlijke branding"],
      },
      familyFit: 94,
      uniquenessScore: 72,
      localAuthenticityScore: 55,
    },
  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { countryId_slug: { countryId, slug: activity.slug } },
      update: {
        ...activity,
        countryId,
        longDescription: null,
        recommendedAgeMax: null,
        accessibilityNotes: null,
        lastVerifiedAt: verifiedAt,
        confidence: 0.65,
        coverageLevel: CoverageLevel.FLAGSHIP,
        isActive: true,
        isSeedData: true,
      },
      create: {
        ...activity,
        countryId,
        longDescription: null,
        recommendedAgeMax: null,
        accessibilityNotes: null,
        lastVerifiedAt: verifiedAt,
        confidence: 0.65,
        coverageLevel: CoverageLevel.FLAGSHIP,
        isActive: true,
        isSeedData: true,
      },
    });

    await prisma.activitySource.upsert({
      where: {
        activityId_sourceId: {
          activityId: activity.id,
          sourceId: seedSourceId,
        },
      },
      update: {
        retrievedAt: verifiedAt,
        lastVerifiedAt: verifiedAt,
        confidence: 0.65,
        rawReference: "prisma/seed.ts",
        fallbackStatus: ProviderFallbackStatus.SEED_FALLBACK,
      },
      create: {
        activityId: activity.id,
        sourceId: seedSourceId,
        retrievedAt: verifiedAt,
        lastVerifiedAt: verifiedAt,
        confidence: 0.65,
        rawReference: "prisma/seed.ts",
        fallbackStatus: ProviderFallbackStatus.SEED_FALLBACK,
      },
    });
  }

  await prisma.seasonWindow.upsert({
    where: { id: "season-do-samana-whales-annual" },
    update: {
      activityId: "activity-do-samana-whale-watching",
      sourceId: seedSourceId,
      kind: SeasonWindowKind.WILDLIFE_PERIOD,
      startMonth: 1,
      startDay: 15,
      endMonth: 3,
      endDay: 31,
      status: SeasonStatus.PEAK,
      reason: "Jaarlijkse aanwezigheid van bultruggen in en rond de Baai van Samaná.",
      recurring: true,
      confidence: 0.75,
      lastVerifiedAt: verifiedAt,
      isSeedData: true,
    },
    create: {
      id: "season-do-samana-whales-annual",
      activityId: "activity-do-samana-whale-watching",
      sourceId: seedSourceId,
      kind: SeasonWindowKind.WILDLIFE_PERIOD,
      startMonth: 1,
      startDay: 15,
      endMonth: 3,
      endDay: 31,
      status: SeasonStatus.PEAK,
      reason: "Jaarlijkse aanwezigheid van bultruggen in en rond de Baai van Samaná.",
      recurring: true,
      confidence: 0.75,
      lastVerifiedAt: verifiedAt,
      isSeedData: true,
    },
  });
}

async function seedTripPassPricing() {
  const tiers = [
    ["trip-pass-eur-1-4", 1, 4, 799],
    ["trip-pass-eur-5-8", 5, 8, 1299],
    ["trip-pass-eur-9-14", 9, 14, 1999],
    ["trip-pass-eur-15-21", 15, 21, 2799],
    ["trip-pass-eur-22-30", 22, 30, 3499],
  ] as const;

  for (const [id, minDays, maxDays, priceCents] of tiers) {
    await prisma.tripPassPriceTier.upsert({
      where: { id },
      update: {
        minDays,
        maxDays,
        priceCents,
        currency: "EUR",
        isActive: true,
      },
      create: {
        id,
        minDays,
        maxDays,
        priceCents,
        currency: "EUR",
        isActive: true,
      },
    });
  }
}

async function main() {
  await seedCountryPack();
  await seedFlagshipExamples();
  await seedTripPassPricing();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
