import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const initialRls = readFileSync(
  join(process.cwd(), "prisma/migrations/20260716120000_enable_rls/migration.sql"),
  "utf8",
);
const travelRls = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260726224500_uniform_travel_options/migration.sql",
  ),
  "utf8",
);
const analyticsRls = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260727003000_first_party_analytics/migration.sql",
  ),
  "utf8",
);
const dailyPlanRls = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260727120000_daily_plan_snapshots/migration.sql",
  ),
  "utf8",
);

describe("Supabase RLS migration contract", () => {
  it("scopes every private trip read through auth.uid ownership", () => {
    for (const table of [
      "trips",
      "trip_stops",
      "travelers",
      "trip_interests",
      "trip_saved_activities",
      "recommendations",
      "recommendation_outcomes",
      "trip_passes",
    ]) {
      expect(initialRls).toContain(`ON "${table}"`);
    }
    expect(initialRls.match(/auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(8);
  });

  it("keeps profiles owner-only and trip snapshots behind trip ownership", () => {
    expect(travelRls).toContain(
      'CREATE POLICY "traveler_profiles_owner_all"',
    );
    expect(travelRls).toContain(
      'USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId")',
    );
    expect(travelRls).toContain(
      'CREATE POLICY "trip_preference_snapshots_owner_read"',
    );
    expect(travelRls).toContain(
      't."userId" = auth.uid()',
    );
  });

  it("publishes only explicitly published and verified provider records", () => {
    expect(travelRls).toContain(
      `"verificationStatus" = 'VERIFIED'`,
    );
    expect(travelRls).toContain('"isPublished" = true');
    expect(travelRls).toContain('"deletedAt" IS NULL');
  });

  it("keeps first-party attribution inaccessible through the public API", () => {
    expect(analyticsRls).toContain(
      'ALTER TABLE "attribution_sessions" ENABLE ROW LEVEL SECURITY',
    );
    expect(analyticsRls).not.toContain(
      'CREATE POLICY "public_attribution',
    );
  });

  it("keeps daily plan snapshots behind trip ownership", () => {
    expect(dailyPlanRls).toContain(
      'ALTER TABLE "daily_plan_snapshots" ENABLE ROW LEVEL SECURITY',
    );
    expect(dailyPlanRls).toContain(
      'CREATE POLICY "daily_plan_snapshots_owner_read"',
    );
    expect(dailyPlanRls).toContain('t."userId" = auth.uid()');
  });
});
