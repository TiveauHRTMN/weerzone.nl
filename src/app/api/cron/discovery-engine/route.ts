import { NextResponse } from "next/server";
import { ALL_PLACES, type Place } from "@/lib/places-data";
import { logAgentAction } from "@/lib/agent-logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

/**
 * OpenClaw: Discovery Engine.
 * Deze agent zoekt naar "micro-locaties" (wijken, gehuchten, parken) 
 * om het SEO-netwerk van WeerZone uit te breiden tot voorbij de standaard steden.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  
  try {
    // 1. Zoek locaties die we nog niet geanalyseerd hebben (location_metadata)
    const { data: processed } = await supabase
      .from("location_metadata")
      .select("place_name");
    
    const processedNames = new Set((processed || []).map(p => p.place_name));

    // Selecteer een batch van 10 kandidaten
    const targets = ALL_PLACES.filter(p => !processedNames.has(p.name)).slice(0, 10);

    if (targets.length === 0) {
      return NextResponse.json({ status: "No discovery needed", count: 0 });
    }

    // 2. AI Analyse van de batch
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Je bent OpenClaw, de Discovery Agent van WEERZONE.nl.
        Analyseer deze locaties: ${targets.map(t => t.name).join(", ")}.
        
        Bepaal per locatie: Is dit coastal, inland, highland of urban?
        Antwoord in een JSON array van objecten: [{"name": "...", "type": "...", "reason": "..."}]
      `.trim();
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      try {
        const results = JSON.parse(responseText.replace(/```json|```/g, ""));
        
        for (const res of results) {
          const target = targets.find(t => t.name === res.name);
          if (!target) continue;

          await supabase.from("location_metadata").upsert({
            place_name: target.name,
            province: target.province,
            lat: target.lat,
            lon: target.lon,
            character: res.type,
            discovery_reason: `OpenClaw: ${res.reason}`,
            last_seo_update: new Date().toISOString()
          });
        }

        await logAgentAction(
          "OpenClaw",
          "location_discovered",
          `Batch-audit voltooid voor ${results.length} locaties.`,
          { locations: results.map((r: any) => r.name) }
        );

        return NextResponse.json({ status: "Batch Discovery Complete", count: results.length });
      } catch (e) {
        console.error("JSON Parse error in OpenClaw Batch:", responseText);
      }
    }

    return NextResponse.json({ status: "Fallback or No AI key" });
  } catch (e: any) {
    console.error("OpenClaw Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
