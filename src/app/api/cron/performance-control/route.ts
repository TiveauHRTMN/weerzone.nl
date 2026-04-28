import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchWeatherData } from "@/lib/weather";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

/**
 * Performance Control: De "Yield Optimizer".
 * Beheert de landelijke affiliate strategieën op basis van live weer.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch weer voor een paar strategische punten (De Bilt, Schiphol, Eindhoven)
    const stations = [
      { lat: 52.10, lon: 5.18 }, // De Bilt
      { lat: 52.31, lon: 4.76 }, // Schiphol
      { lat: 51.44, lon: 5.48 }, // Eindhoven
    ];

    const weatherData = await Promise.all(
      stations.map(s => fetchWeatherData(s.lat, s.lon))
    );

    const avgTemp = weatherData.reduce((acc, w) => acc + w.current.temperature, 0) / stations.length;
    const isRaining = weatherData.some(w => w.current.precipitation > 0);

    // 2. Bepaal de "Winst-zet"
    let strategy = "GENERIC_BRANDING";
    let flash_deal_message = "Het WeerZone 2026 Dashboard komt eraan.";
    let flash_deal_link = "/app/signup";
    let flash_deal_type = "info";

    if (isRaining) {
      strategy = "RAIN_GEAR_AFFILIATE";
      flash_deal_message = "Regen op komst? Bekijk de beste regenkleding deals.";
      flash_deal_link = "https://www.amazon.nl/s?k=regenkleding&tag=tiveaubusines-21";
      flash_deal_type = "warning";
    } else if (avgTemp > 22) {
      strategy = "BBQ_SUN_AFFILIATE";
      flash_deal_message = "Zonnig weer! Tijd voor de BBQ of zonnebrand?";
      flash_deal_link = "https://www.amazon.nl/s?k=barbecue&tag=tiveaubusines-21";
      flash_deal_type = "success";
    } else if (avgTemp < 5) {
      strategy = "WINTER_GEAR_AFFILIATE";
      flash_deal_message = "Koud buiten! Warme mutsen en handschoenen nu met korting.";
      flash_deal_link = "https://www.amazon.nl/s?k=winterkleding&tag=tiveaubusines-21";
      flash_deal_type = "info";
    }

    // 3. Update de system_state voor de global banner
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("system_state")
      .upsert({
        id: 'global',
        strategy,
        flash_deal_message,
        flash_deal_link,
        flash_deal_type,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    // 4. Log de "Winst-zet" van Piet
    await logAgentAction(
      "Performance Control",
      "system_check",
      `Piet heeft de landelijke affiliate-banner ingesteld op: ${strategy}.`,
      { 
        averageTemp: avgTemp.toFixed(1),
        isRaining,
        activeDeal: flash_deal_message
      }
    );

    // 5. Paperclip Heartbeat
    const { logPaperclipHeartbeat } = await import("@/lib/agent-logger");
    await logPaperclipHeartbeat("Performance Control", "healthy");

    return NextResponse.json({
      status: "Performance Audit Complete",
      strategy,
      avgTemp,
      activeDeal: flash_deal_message
    });
  } catch (e: any) {
    console.error("Performance Control Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
