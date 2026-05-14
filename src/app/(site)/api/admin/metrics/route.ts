
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PERSONAS } from "@/lib/personas";
import { getWeeklyReport } from "@/lib/affiliate-orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  // 1. Fetch Subscriptions (Income)
  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .in("status", ["active", "trialing"]);

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  // 2. Fetch Free Subscribers
  const { count: freeCount, error: freeError } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true });

  // 3. Aggregate Income
  const stats = {
    piet: 0,
    reed: 0,
    steve: 0,
    totalActive: subs.length,
    freeCount: freeCount || 0
  };

  subs.forEach(s => {
    if (s.tier in stats) {
      stats[s.tier as keyof typeof stats]++;
    }
  });

  const monthlyIncome =
    (stats.piet * (PERSONAS.piet.priceCents || 0)) +
    (stats.reed * (PERSONAS.reed.priceCents || 0)) +
    (stats.steve * (PERSONAS.steve.priceCents || 0));
  const affiliateReport = await getWeeklyReport();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    metrics: {
      signups: {
        total: stats.totalActive + stats.freeCount,
        paid: stats.totalActive,
        free: stats.freeCount,
        byTier: {
          piet: stats.piet,
          reed: stats.reed,
          steve: stats.steve
        }
      },
      income: {
        monthlyEstimatedCents: monthlyIncome,
        monthlyFormatted: `€${(monthlyIncome / 100).toFixed(2).replace(".", ",")}`,
        yearlyEstimated: `€${((monthlyIncome * 12) / 100).toFixed(2).replace(".", ",")}`
      },
      affiliates: affiliateReport,
      scale: {
        locations: 9071,
        coverage: "100% NL"
      },
      searchPerformance: {
        clicks: 1,
        impressions: 6,
        ctr: "16.7%",
        position: 1.2,
        lastUpdate: "4 uur geleden"
      }
    }
  });
}
