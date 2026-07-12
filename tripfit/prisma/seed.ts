import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { parseDatabaseUrl } from "../src/config/database-url";
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
const countryId = "country-do";
const seedSourceId = "source-tripfit-dr-seed-v1";

const regions: Array<{
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  aliases: string[];
  coverageLevel: CoverageLevel;
  summary: string;
  centerLatitude: number;
  centerLongitude: number;
  sortOrder: number;
}> = [
  {
    id: "region-do-punta-cana-bavaro",
    slug: "punta-cana-bavaro",
    name: "Punta Cana / Bávaro",
    shortName: "Punta Cana",
    aliases: ["Punta Cana", "Bávaro", "Bavaro"],
    coverageLevel: CoverageLevel.FLAGSHIP,
    summary: "Stranden, wateractiviteiten en toegankelijke gezinskeuzes aan de oostkust.",
    centerLatitude: 18.5601,
    centerLongitude: -68.3725,
    sortOrder: 10,
  },
  {
    id: "region-do-santo-domingo",
    slug: "santo-domingo",
    name: "Santo Domingo",
    aliases: ["Santo Domingo", "Distrito Nacional"],
    coverageLevel: CoverageLevel.FLAGSHIP,
    summary: "Historische hoofdstad met cultuur, eten en een levende Caribische stadscultuur.",
    centerLatitude: 18.4861,
    centerLongitude: -69.9312,
    sortOrder: 20,
  },
  {
    id: "region-do-samana-las-terrenas",
    slug: "samana-las-terrenas",
    name: "Samaná / Las Terrenas",
    shortName: "Samaná",
    aliases: ["Samaná", "Samana", "Las Terrenas", "Las Galeras"],
    coverageLevel: CoverageLevel.FLAGSHIP,
    summary: "Walvissen, regenwoud, stranden en bootroutes op het groene schiereiland.",
    centerLatitude: 19.205,
    centerLongitude: -69.336,
    sortOrder: 30,
  },
  {
    id: "region-do-puerto-plata-cabarete",
    slug: "puerto-plata-cabarete",
    name: "Puerto Plata / Cabarete",
    aliases: ["Puerto Plata", "Cabarete", "Sosúa", "Sosua"],
    coverageLevel: CoverageLevel.STANDARD,
    summary: "Noordkust met watersport, stranden en de historische stad Puerto Plata.",
    centerLatitude: 19.7808,
    centerLongitude: -70.6871,
    sortOrder: 40,
  },
  {
    id: "region-do-la-romana-bayahibe",
    slug: "la-romana-bayahibe",
    name: "La Romana / Bayahíbe",
    aliases: ["La Romana", "Bayahíbe", "Bayahibe", "Dominicus"],
    coverageLevel: CoverageLevel.STANDARD,
    summary: "Zuidoostkust met eilandexcursies, duiklocaties en rustige stranden.",
    centerLatitude: 18.4273,
    centerLongitude: -68.9728,
    sortOrder: 50,
  },
  {
    id: "region-do-santiago",
    slug: "santiago",
    name: "Santiago de los Caballeros",
    shortName: "Santiago",
    aliases: ["Santiago", "Santiago de los Caballeros"],
    coverageLevel: CoverageLevel.STANDARD,
    summary: "Cibao-cultuur, tabaksgeschiedenis en stedelijk leven in het binnenland.",
    centerLatitude: 19.4517,
    centerLongitude: -70.697,
    sortOrder: 60,
  },
  {
    id: "region-do-jarabacoa-constanza",
    slug: "jarabacoa-constanza",
    name: "Jarabacoa / Constanza",
    aliases: ["Jarabacoa", "Constanza", "Cordillera Central"],
    coverageLevel: CoverageLevel.STANDARD,
    summary: "Berglandschap voor wandelingen, watervallen en actieve roadtrips.",
    centerLatitude: 19.1218,
    centerLongitude: -70.6401,
    sortOrder: 70,
  },
  {
    id: "region-do-barahona-bahoruco",
    slug: "barahona-bahoruco",
    name: "Barahona / Bahoruco",
    aliases: ["Barahona", "Bahoruco", "Bahoruco-gebergte"],
    coverageLevel: CoverageLevel.BASIC,
    summary: "Ruige zuidwestkust, bergnatuur en bijzondere biodiversiteit.",
    centerLatitude: 18.2085,
    centerLongitude: -71.1008,
    sortOrder: 80,
  },
  {
    id: "region-do-pedernales",
    slug: "pedernales",
    name: "Pedernales",
    aliases: ["Pedernales", "Cabo Rojo", "Bahía de las Águilas"],
    coverageLevel: CoverageLevel.BASIC,
    summary: "Afgelegen natuur, Cabo Rojo en Bahía de las Águilas.",
    centerLatitude: 18.0384,
    centerLongitude: -71.744,
    sortOrder: 90,
  },
  {
    id: "region-do-miches",
    slug: "miches-costa-esmeralda",
    name: "Miches / Costa Esmeralda",
    shortName: "Miches",
    aliases: ["Miches", "Costa Esmeralda"],
    coverageLevel: CoverageLevel.BASIC,
    summary: "Groene oostkust en verbindende route tussen Punta Cana en Samaná.",
    centerLatitude: 18.9836,
    centerLongitude: -69.0476,
    sortOrder: 100,
  },
];

const interests = [
  ["beach", "Strand"],
  ["nature", "Natuur"],
  ["culture", "Cultuur"],
  ["history", "Geschiedenis"],
  ["food", "Eten"],
  ["adventure", "Avontuur"],
  ["wellness", "Wellness"],
  ["wildlife", "Wildlife"],
  ["nightlife", "Nightlife"],
  ["shopping", "Shopping"],
  ["photography", "Fotografie"],
  ["water-activities", "Wateractiviteiten"],
  ["family", "Gezinsactiviteiten"],
  ["roadtrips", "Roadtrips"],
] as const;

async function seedCountryPack() {
  await prisma.country.upsert({
    where: { id: countryId },
    update: {
      iso2: "DO",
      iso3: "DOM",
      slug: "dominicaanse-republiek",
      name: "Dominicaanse Republiek",
      officialName: "Dominicaanse Republiek",
      currencyCode: "DOP",
      timezone: "America/Santo_Domingo",
      centerLatitude: 18.7357,
      centerLongitude: -70.1627,
      nationalContext: {
        label: "TripFit start-country-pack",
        status: "seeddata",
      },
      sourceCoverage: {
        flagshipRegions: 3,
        standardRegions: 4,
        basicRegions: 3,
      },
      isActive: true,
      isSeedData: true,
    },
    create: {
      id: countryId,
      iso2: "DO",
      iso3: "DOM",
      slug: "dominicaanse-republiek",
      name: "Dominicaanse Republiek",
      officialName: "Dominicaanse Republiek",
      currencyCode: "DOP",
      timezone: "America/Santo_Domingo",
      centerLatitude: 18.7357,
      centerLongitude: -70.1627,
      nationalContext: {
        label: "TripFit start-country-pack",
        status: "seeddata",
      },
      sourceCoverage: {
        flagshipRegions: 3,
        standardRegions: 4,
        basicRegions: 3,
      },
      isActive: true,
      isSeedData: true,
    },
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

  for (const region of regions) {
    await prisma.region.upsert({
      where: { countryId_slug: { countryId, slug: region.slug } },
      update: {
        ...region,
        countryId,
        timezone: "America/Santo_Domingo",
        isActive: true,
        isSeedData: true,
      },
      create: {
        ...region,
        countryId,
        timezone: "America/Santo_Domingo",
        isActive: true,
        isSeedData: true,
      },
    });
  }

  for (const [sortOrder, [code, labelNl]] of interests.entries()) {
    await prisma.interest.upsert({
      where: { code },
      update: { labelNl, sortOrder, isActive: true },
      create: {
        id: `interest-${code}`,
        code,
        labelNl,
        sortOrder,
        isActive: true,
      },
    });
  }
}

async function seedFlagshipExamples() {
  const clusters = [
    {
      id: "cluster-do-zona-colonial",
      regionSlug: "santo-domingo",
      slug: "zona-colonial",
      name: "Zona Colonial",
      aliases: ["Ciudad Colonial"],
      centerLatitude: 18.4738,
      centerLongitude: -69.884,
      summary: "Historische kern van Santo Domingo.",
    },
    {
      id: "cluster-do-samana-bay",
      regionSlug: "samana-las-terrenas",
      slug: "samana-bay",
      name: "Baai van Samaná",
      aliases: ["Samaná Bay", "Bahía de Samaná"],
      centerLatitude: 19.196,
      centerLongitude: -69.298,
      summary: "Vertrekpunt voor seizoensgebonden boot- en wildlife-activiteiten.",
    },
    {
      id: "cluster-do-bavaro",
      regionSlug: "punta-cana-bavaro",
      slug: "bavaro",
      name: "Bávaro",
      aliases: ["Bavaro"],
      centerLatitude: 18.678,
      centerLongitude: -68.414,
      summary: "Strand- en verblijfscluster ten noorden van Punta Cana.",
    },
  ];

  for (const cluster of clusters) {
    const region = regions.find(({ slug }) => slug === cluster.regionSlug);
    if (!region) throw new Error(`Unknown seed region: ${cluster.regionSlug}`);

    await prisma.destinationCluster.upsert({
      where: { regionId_slug: { regionId: region.id, slug: cluster.slug } },
      update: {
        name: cluster.name,
        aliases: cluster.aliases,
        centerLatitude: cluster.centerLatitude,
        centerLongitude: cluster.centerLongitude,
        summary: cluster.summary,
        countryId,
        isActive: true,
        isSeedData: true,
      },
      create: {
        id: cluster.id,
        countryId,
        regionId: region.id,
        slug: cluster.slug,
        name: cluster.name,
        aliases: cluster.aliases,
        centerLatitude: cluster.centerLatitude,
        centerLongitude: cluster.centerLongitude,
        summary: cluster.summary,
        isActive: true,
        isSeedData: true,
      },
    });
  }

  const activities = [
    {
      id: "activity-do-zona-colonial-walk",
      regionId: "region-do-santo-domingo",
      destinationClusterId: "cluster-do-zona-colonial",
      name: "Wandeling door de Zona Colonial",
      slug: "wandeling-zona-colonial",
      latitude: 18.4738,
      longitude: -69.884,
      shortDescription: "Een compacte route langs de oudste straten en pleinen van de koloniale stad.",
      categories: ["culture", "history", "family"],
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
      regionId: "region-do-samana-las-terrenas",
      destinationClusterId: "cluster-do-samana-bay",
      name: "Walvissen spotten in de Baai van Samaná",
      slug: "walvissen-spotten-samana",
      latitude: 19.196,
      longitude: -69.298,
      shortDescription: "Seizoensgebonden boottocht naar bultruggen in de Baai van Samaná.",
      categories: ["wildlife", "nature", "water-activities", "family"],
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
      regionId: "region-do-punta-cana-bavaro",
      destinationClusterId: "cluster-do-bavaro",
      name: "Stranddag aan Playa Bávaro",
      slug: "stranddag-playa-bavaro",
      latitude: 18.688,
      longitude: -68.419,
      shortDescription: "Een flexibele stranddag aan de lange kuststrook van Bávaro.",
      categories: ["beach", "water-activities", "family"],
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
