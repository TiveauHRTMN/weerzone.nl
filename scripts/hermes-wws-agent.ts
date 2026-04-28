
import * as dotenv from "dotenv";
import { executeWWSOrchestrator } from "../src/lib/wws-orchestrator";
import { executeBusinessOrchestrator } from "../src/lib/wws-business-orchestrator";
import { KNMI_STATIONS } from "../src/lib/types";
import { getSupabaseAdmin } from "../src/lib/supabase";

dotenv.config({ path: ".env.local" });

/**
 * HERMES: The Autonomous WWS Agent.
 * Hermes runs 24/7 in background loops to maintain the "Meteorological Truth".
 */
async function hermesPatrol() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("❌ HERMES: Supabase client initialization failed.");
    return;
  }

  console.log(`🚀 HERMES: Starting WWS Patrol Loop for ${KNMI_STATIONS.length} stations...`);

  // 1. Patrol ALL Ground Truth Stations (Public)
  for (const station of KNMI_STATIONS) {
    console.log(`📡 HERMES: Analysing Public Truth for ${station.name}...`);
    
    try {
      const publicTruth = await executeWWSOrchestrator(station.lat, station.lon);
      
      if (publicTruth) {
        console.log(`✅ HERMES: Updated Public Truth for ${station.name}`);
        
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
      }
    } catch (err) {
      console.error(`❌ HERMES ERROR [Public] for ${station.name}:`, err);
    }
  }

  // 2. Patrol the Business Assets (Steve)
  console.log("💼 HERMES: Switching to Business Sector (Steve)...");
  const businessAssets = [
    { name: "Bouwplaats Utrecht", lat: 52.09, lon: 5.12 },
    { name: "Windpark Noordzee", lat: 52.36, lon: 3.34 }
  ];

  for (const asset of businessAssets) {
    console.log(`🛡️ HERMES: Calculating Operational Risk for ${asset.name}...`);
    
    try {
      const businessVerdict = await executeBusinessOrchestrator(asset.lat, asset.lon);

      if (businessVerdict) {
        console.log(`🏗️ STEVE Verdict for ${asset.name}: ${businessVerdict.status}`);
        
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
      }
    } catch (err) {
      console.error(`❌ HERMES ERROR [Business]:`, err);
    }
  }

  console.log("🏁 HERMES: Patrol Loop Complete.");
}

// Run immediately
hermesPatrol().catch(console.error);
