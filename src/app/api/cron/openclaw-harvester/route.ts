import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

const PROVINCES = [
  "Noord-Holland", "Zuid-Holland", "Utrecht", "Noord-Brabant", 
  "Gelderland", "Overijssel", "Flevoland", "Groningen", 
  "Friesland", "Drenthe", "Zeeland", "Limburg"
];

/**
 * OpenClaw Harvester: Autonomous Location Discovery (Upgraded)
 * Systematic discovery that rotates through provinces to avoid timeouts.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  try {
    // 1. Determine which province to patrol today (rotate based on day of year)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const province = PROVINCES[dayOfYear % PROVINCES.length];
    
    console.log(`🕵️‍♂️ OpenClaw: Patrolling ${province}...`);

    // 2. Search for common suffixes in this province to find micro-locaties
    const searchTerms = ["dorp", "buurt", "wijk", "straat", "park"];
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const query = `${randomTerm} ${province}`;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=nl&country=NL`;
    const res = await fetch(url);
    const data = await res.json();

    const newlyDiscovered: string[] = [];
    const elements = data.results || [];

    for (const loc of elements) {
      // Basic filter: must be in the target province (approximate check)
      if (loc.admin1 !== province && province !== "Utrecht") continue; // Utrecht is both province and city, tricky

      const { data: existingDB } = await supabase
        .from("discovered_places")
        .select("id")
        .eq("name", loc.name)
        .maybeSingle();

      if (!existingDB) {
        const { error } = await supabase.from("discovered_places").insert({
          name: loc.name,
          province: loc.admin1 || province,
          lat: loc.latitude,
          lon: loc.longitude,
          source: "openclaw_systematic_patrol",
          metadata: { 
            elevation: loc.elevation, 
            timezone: loc.timezone,
            feature_code: loc.feature_code,
            population: loc.population
          }
        });
        
        if (!error) newlyDiscovered.push(loc.name);
      }
    }

    if (newlyDiscovered.length > 0) {
      await logAgentAction(
        "OpenClaw",
        "location_discovered",
        `OpenClaw heeft ${newlyDiscovered.length} nieuwe locaties ontdekt tijdens de patrouille in ${province}.`,
        { province, count: newlyDiscovered.length, locations: newlyDiscovered }
      );
    }

    return NextResponse.json({
      status: `OpenClaw Patrol in ${province} Complete`,
      newCount: newlyDiscovered.length,
      locations: newlyDiscovered
    });

  } catch (e: any) {
    console.error("OpenClaw Harvester Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
