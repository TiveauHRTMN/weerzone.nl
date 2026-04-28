import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

async function checkAgentHealth() {
  const supabase = createSupabaseAdminClient();
  console.log("🚀 Starten van Architect Agent Audit...\n");

  // 1. Algemene Activiteit (agent_activity)
  const { data: recentActivity, error: activityError } = await supabase
    .from("agent_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (activityError) console.error("❌ Fout bij ophalen agent_activity:", activityError);
  else {
    console.log("📋 LAATSTE ALGEMENE ACTIVITEIT:");
    recentActivity.forEach(log => {
      console.log(`[${new Date(log.created_at).toLocaleTimeString()}] ${log.agent_name.padEnd(15)} | ${log.action_type.padEnd(20)} | ${log.description}`);
    });
    console.log("");
  }

  // 2. Hermes Health (wws_patrol_log)
  const { data: hermesLogs, error: hermesError } = await supabase
    .from("wws_patrol_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (hermesError) console.error("❌ Fout bij ophalen Hermes logs:", hermesError);
  else {
    const successRate = hermesLogs.filter(l => l.status === 'success').length / hermesLogs.length * 100;
    console.log(`📡 HERMES (Truth Patrol) STATUS: ${successRate}% Success rate (laatste 10)`);
    hermesLogs.slice(0, 3).forEach(l => {
      console.log(` - ${l.status === 'success' ? '✅' : '❌'} ${l.action} voor ${l.meta?.place || 'Unknown'}`);
    });
    console.log("");
  }

  // 3. OpenClaw & Discovery (discovered_places)
  const { count: totalDiscovered } = await supabase
    .from("discovered_places")
    .select("*", { count: "exact", head: true });
    
  console.log(`🕵️ OPENCLAW / DISCOVERY ENGINE:`);
  console.log(` - Totaal aantal unieke locaties ontdekt: ${totalDiscovered}`);
  console.log("");

  // 4. Sentinel Check (Errors in logs)
  const { count: sentinelAlerts } = await supabase
    .from("agent_activity")
    .select("*", { count: "exact", head: true })
    .eq("agent_name", "Sentinel")
    .eq("action_type", "alert_triggered");

  console.log(`🛡️ SENTINEL SAFETY ENGINE:`);
  console.log(` - Aantal actieve veiligheids-alerts afgevuurd: ${sentinelAlerts}`);
  if (sentinelAlerts > 0) {
     console.log("⚠️ WAARSCHUWING: Sentinel heeft afwijkingen gevonden!");
  } else {
     console.log("✅ Sentinel rapporteert een stabiele omgeving.");
  }
  console.log("");

  // 5. Paperclip (Yield/Performance)
  console.log(`🖇️ PAPERCLIP (Revenue Optimizer):`);
  const { data: yields } = await supabase
    .from("agent_activity")
    .select("*")
    .eq("agent_name", "Paperclip")
    .order("created_at", { ascending: false })
    .limit(1);
    
  if (yields?.[0]) {
    console.log(` - Laatste optimalisatie: ${yields[0].description}`);
    console.log(` - Tijdstip: ${new Date(yields[0].created_at).toLocaleString()}`);
  } else {
    console.log(" - Geen recente Paperclip yields gevonden.");
  }
}

checkAgentHealth().catch(console.error);
