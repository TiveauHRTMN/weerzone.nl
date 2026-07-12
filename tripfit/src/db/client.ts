import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { serverEnvironment } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";

type PrismaGlobal = typeof globalThis & {
  tripFitPrisma?: {
    databaseUrl: string;
    client: PrismaClient;
  };
};

const prismaGlobal = globalThis as PrismaGlobal;

/**
 * Returns null while no valid DATABASE_URL is configured. Importing this
 * module never creates a pool, which keeps seed/mock development operational.
 */
export function getPrismaClient(): PrismaClient | null {
  const databaseUrl = serverEnvironment.database.url;

  if (!databaseUrl) {
    return null;
  }

  if (prismaGlobal.tripFitPrisma?.databaseUrl === databaseUrl) {
    return prismaGlobal.tripFitPrisma.client;
  }

  const adapter = new PrismaPg(databaseUrl);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    prismaGlobal.tripFitPrisma = { databaseUrl, client };
  }

  return client;
}

export function requirePrismaClient(): PrismaClient {
  const client = getPrismaClient();

  if (!client) {
    throw new Error(
      "Database access requested without a valid PostgreSQL DATABASE_URL",
    );
  }

  return client;
}
