import { NextResponse } from "next/server";
import { executeWWSOrchestrator } from "@/lib/wws-orchestrator";
import { executeBusinessOrchestrator } from "@/lib/wws-business-orchestrator";
import { KNMI_STATIONS } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

/**
 * HERMES: The Autonomous WWS Agent (Cloud Version).
 * Updates the "Meteorological Truth" for all stations in batches.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  console.log(`🚀 HERMES CLOUD: Starting WWS Patrol for ${KNMI_STATIONS.length} stations...`);

  const results = {
    publicUpdates: 0,
    businessUpdates: 0,
    errors: [] as string[]
  };

  // 1. Patrol Public Truth Stations (KNMI)
  // Note: To avoid Vercel timeout (10s on hobby), we might only process a subset 
  // or use a more efficient batching if needed. For now, we process all but with a try/catch per station.
  for (const station of KNMI_STATIONS) {
    try {
      const publicTruth = await executeWWSOrchestrator(station.lat, station.lon);
      
      if (publicTruth) {
        await supabase.from("wws_truth_cache").upsert({
          place_name: station.name,
          lat: station.lat,
          lon: station.lon,
          sector: 'public',
          payload: publicTruth,
          consensus_index: publicTruth.api_grid_1km.divergence_delta ? 100 - (publicTruth.api_grid_1km.divergence_delta * 5) : 100,
          divergence_delta: publicTruth.api_grid_1km.divergence_delta,
          is_alert: publicTruth.reed_alert?.active || false,
          valid_until: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });

        await supabase.from("wws_patrol_log").insert({
          action: 'public_truth_update',
          status: 'success',
          meta: { place: station.name, consensus: publicTruth.api_grid_1km.divergence_delta }
        });
        results.publicUpdates++;
      }
    } catch (err: any) {
      results.errors.push(`Public [${station.name}]: ${err.message}`);
    }
  }

  // 2. Patrol Business Assets (Steve)
  const businessAssets = [
    { name: "Bouwplaats Utrecht", lat: 52.09, lon: 5.12 },
    { name: "Windpark Noordzee", lat: 52.36, lon: 3.34 }
  ];

  for (const asset of businessAssets) {
    try {
      const businessVerdict = await executeBusinessOrchestrator(asset.lat, asset.lon);

      if (businessVerdict) {
        await supabase.from("wws_truth_cache").upsert({
          place_name: asset.name,
          lat: asset.lat,
          lon: asset.lon,
          sector: 'business',
          payload: businessVerdict,
          consensus_index: businessVerdict.confidence_index,
          is_alert: businessVerdict.status === "NO-GO",
          valid_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        });

        await supabase.from("wws_patrol_log").insert({
          action: 'business_verdict_update',
          status: 'success',
          meta: { place: asset.name, verdict: businessVerdict.status }
        });
        results.businessUpdates++;
      }
    } catch (err: any) {
      results.errors.push(`Business [${asset.name}]: ${err.message}`);
    }
  }

  // Final Logging
  await logAgentAction(
    "Hermes",
    "system_check",
    `Hermes Cloud Patrol voltooid. ${results.publicUpdates} publieke en ${results.businessUpdates} zakelijke updates verwerkt.`,
    { updates: results.publicUpdates + results.businessUpdates, errorCount: results.errors.length }
  );

  return NextResponse.json({
    status: "Hermes Patrol Complete",
    summary: results,
    timestamp: new Date().toISOString()
  });
}
