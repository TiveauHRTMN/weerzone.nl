import "server-only";

import { z } from "zod";

import { parseDatabaseUrl } from "./database-url";

const optionalBoolean = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  FEATURE_DATABASE_READS: optionalBoolean,
  FEATURE_DEMO_MODES: optionalBoolean,
  FEATURE_TRIP_PASS_PAYMENTS: optionalBoolean,
  FEATURE_EXTERNAL_PROVIDERS: optionalBoolean,
});

const parsedEnvironment = serverEnvironmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  throw new Error("Invalid server environment configuration");
}

const databaseUrl = parseDatabaseUrl(parsedEnvironment.data.DATABASE_URL);

export const serverEnvironment = {
  appUrl: parsedEnvironment.data.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  database: {
    url: databaseUrl,
    status: databaseUrl
      ? ("CONFIGURED" as const)
      : parsedEnvironment.data.DATABASE_URL
        ? ("INVALID" as const)
        : ("MISSING" as const),
  },
  supabase: {
    url: parsedEnvironment.data.NEXT_PUBLIC_SUPABASE_URL ?? null,
    anonymousKey:
      parsedEnvironment.data.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    serviceRoleKey: parsedEnvironment.data.SUPABASE_SERVICE_ROLE_KEY ?? null,
  },
  features: {
    databaseReads: parsedEnvironment.data.FEATURE_DATABASE_READS,
    demoModes: parsedEnvironment.data.FEATURE_DEMO_MODES,
    tripPassPayments: parsedEnvironment.data.FEATURE_TRIP_PASS_PAYMENTS,
    externalProviders: parsedEnvironment.data.FEATURE_EXTERNAL_PROVIDERS,
  },
} as const;
