import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { place_name, weather_code, temp, product_id } = body;

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Supabase missing" }, { status: 500 });

    // 1. Log het ruwe event
    const { error: eventError } = await supabase.from("affiliate_events").insert({
      place_name,
      weather_code,
      temp,
      product_id,
      event_type: "click"
    });

    if (eventError) throw eventError;

    // 2. Update de geaggregeerde performance (Paperclip's brein)
    // We bepalen de categorie op basis van weer
    let category = "standard";
    if (temp >= 25) category = "heat";
    else if (temp <= 5) category = "cold";
    else if (weather_code >= 51) category = "rain";
    else if (weather_code >= 95) category = "storm";

    // Update clicks in affiliate_performance
    // In een high-traffic omgeving zou je dit bufferen of via een RPC doen.
    // Voor WeerZone doen we een directe increment via Supabase rpc of een simpele fetch.
    const { data: perf } = await supabase
      .from("affiliate_performance")
      .select("clicks")
      .eq("weather_category", category)
      .eq("product_id", product_id)
      .maybeSingle();

    const { error: upsertError } = await supabase
      .from("affiliate_performance")
      .upsert({
        weather_category: category,
        product_id: product_id,
        clicks: (perf?.clicks || 0) + 1,
        last_updated: new Date().toISOString()
      });

    if (upsertError) console.error("Paperclip Upsert Error:", upsertError);

    return NextResponse.json({ status: "logged", category });
  } catch (err: any) {
    console.error("Affiliate Click Log Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
