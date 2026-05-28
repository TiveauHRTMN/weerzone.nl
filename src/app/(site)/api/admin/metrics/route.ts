import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data: accessRows, error: accessError } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .in("status", ["active", "trialing"]);

  if (accessError) {
    return NextResponse.json({ error: accessError.message }, { status: 500 });
  }

  const { count: mailOnlyCount } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true });

  const stats = {
    piet: 0,
    reed: 0,
    steve: 0,
    totalActive: accessRows.length,
    mailOnlyCount: mailOnlyCount || 0,
  };

  accessRows.forEach((row) => {
    if (row.tier === "piet" || row.tier === "reed" || row.tier === "steve") {
      stats[row.tier]++;
    }
  });

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    metrics: {
      signups: {
        total: stats.totalActive + stats.mailOnlyCount,
        agentAccess: stats.totalActive,
        mailOnly: stats.mailOnlyCount,
        byAgent: {
          piet: stats.piet,
          reed: stats.reed,
          steve: stats.steve,
        },
      },
      scale: {
        locations: 9071,
        coverage: "100% NL",
      },
      searchPerformance: {
        clicks: 1,
        impressions: 6,
        ctr: "16.7%",
        position: 1.2,
        lastUpdate: "4 uur geleden",
      },
    },
  });
}
