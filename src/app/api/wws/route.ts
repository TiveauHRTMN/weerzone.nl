import { NextResponse } from "next/server";
import { executeWWSOrchestrator } from "@/lib/wws-orchestrator";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "52.1011");
  const lon = parseFloat(searchParams.get("lon") || "5.1775");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // 1. Probeer cache te lezen (Hermes vult deze 24/7)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from("wws_truth_cache")
        .select("payload, created_at")
        .eq("sector", "public")
        .gte("lat", (lat - 0.005).toFixed(3))
        .lte("lat", (lat + 0.005).toFixed(3))
        .gte("lon", (lon - 0.005).toFixed(3))
        .lte("lon", (lon + 0.005).toFixed(3))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Als cache minder dan 15 min oud is: return direct
      if (cached && (Date.now() - new Date(cached.created_at).getTime() < 15 * 60 * 1000)) {
        console.log(`[WWS API] Serving cached truth for ${lat},${lon}`);
        return NextResponse.json(cached.payload);
      }
    } catch (err) {
      console.error("[WWS API] Cache read error:", err);
    }
  }

  // 2. Fallback: Directe synthese (traag, maar gegarandeerd data)
  console.log(`[WWS API] Cache miss or expired. Executing direct orchestrator for ${lat},${lon}`);
  const payload = await executeWWSOrchestrator(lat, lon);

  if (!payload) {
    return NextResponse.json({ error: "WWS Pipeline failed" }, { status: 500 });
  }

  return NextResponse.json(payload);
}
