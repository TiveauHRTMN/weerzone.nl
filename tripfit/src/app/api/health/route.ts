import { serverEnvironment } from "@/config/env";
import { getCalorFeatureFlags } from "@/config/server-features";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = getCalorFeatureFlags();
  const databaseConfigured = serverEnvironment.database.status === "CONFIGURED";
  return Response.json(
    {
      status: databaseConfigured ? "ok" : "degraded",
      database: serverEnvironment.database.status.toLowerCase(),
      publicLaunch: flags.publicLaunchEnabled,
      commercialFeatures: {
        affiliates: flags.affiliatesEnabled,
        payments: flags.paymentsEnabled,
      },
      checkedAt: new Date().toISOString(),
    },
    {
      status: databaseConfigured ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

