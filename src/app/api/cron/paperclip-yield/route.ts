import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

/**
 * Paperclip: Revenue & Yield Optimizer (Upgraded)
 * Deep analysis of CTR and conversion patterns to optimize affiliate placement.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  try {
    // 1. Fetch performance aggregates
    const { data: performers } = await supabase
      .from("affiliate_performance")
      .select("*")
      .order("clicks", { ascending: false });

    if (!performers || performers.length === 0) {
      return NextResponse.json({ status: "Insufficient data for yield optimization" });
    }

    // 2. Identify the "Alpha" product (Best CTR / High Volume)
    const bestOverall = performers[0];
    
    // 3. Category analysis
    const categories = ["regen", "zon", "wind", "kou", "onweer"];
    const optimizationMap: Record<string, any> = {};

    categories.forEach(cat => {
      const bestInCat = performers
        .filter(p => p.weather_category === cat)
        .sort((a, b) => (b.clicks / (b.impressions || 1)) - (a.clicks / (a.impressions || 1)))[0];
      
      if (bestInCat) {
        optimizationMap[cat] = {
          product_id: bestInCat.product_id,
          ctr: ((bestInCat.clicks / (bestInCat.impressions || 1)) * 100).toFixed(2) + "%",
          volume: bestInCat.impressions
        };
      }
    });

    // 4. Log "Strategic Pivot"
    await logAgentAction(
      "Paperclip",
      "yield_optimized",
      `Paperclip heeft de advertentie-yield geoptimaliseerd. Alpha product: ${bestOverall.product_id}. Categorieën gedekt: ${Object.keys(optimizationMap).length}.`,
      { 
        alpha_product: bestOverall.product_id,
        category_map: optimizationMap,
        total_tracked_products: performers.length
      }
    );

    return NextResponse.json({
      status: "Paperclip Yield Optimization Complete",
      top_performer: bestOverall.product_id,
      strategy: optimizationMap
    });

  } catch (e: any) {
    console.error("Paperclip Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
