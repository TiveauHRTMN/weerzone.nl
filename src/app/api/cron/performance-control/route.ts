import { NextResponse } from "next/server";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

/**
 * Performance Control: Piet.
 * Deze agent optimaliseert de koppelvlakken tussen weerdata en commerciële conversie.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Analyseer landelijke trends (sample van 3 grote steden)
    const cities = ["Utrecht", "Amsterdam", "Eindhoven"];
    const trends = [];

    for (const cityName of cities) {
      const p = ALL_PLACES.find(x => x.name === cityName);
      if (p) {
        const weather = await fetchWeatherData(p.lat, p.lon);
        const temp = weather.current.temperature;
        const rain = weather.current.precipitation;
        
        trends.push({ cityName, temp, rain });
      }
    }

    // 2. Commerciële logica bepaalt focus
    const avgTemp = trends.reduce((acc, curr) => acc + curr.temp, 0) / trends.length;
    const isRaining = trends.some(t => t.rain > 0.5);
    
    let strategy = "Balanced Revenue";
    let flash_deal_message = "Volg WeerZone voor de scherpste updates!";
    let flash_deal_link = "https://weerzone.nl";
    let flash_deal_type: 'neutral' | 'storm' | 'heat' | 'cold' = 'neutral';

    if (isRaining) {
       strategy = "Rain-Response Active";
       flash_deal_message = "Regen op komst! Bekijk de best-geteste stormparaplu's.";
       flash_deal_link = "https://amzn.to/3B8K47M2";
       flash_deal_type = 'storm';
    } else if (avgTemp > 22) {
      strategy = "High-Heat Conversion";
      flash_deal_message = "Hittegolf waarschuwing! Mobiele airco's nu nog leverbaar.";
      flash_deal_link = "https://amzn.to/3mobiele-airco";
      flash_deal_type = 'heat';
    } else if (avgTemp < 5) {
      strategy = "Cold-Snap Protection";
      flash_deal_message = "Vorst aan de grond! IJskrabbers en thermo-kleding nodig?";
      flash_deal_link = "https://amzn.to/3ijskrabber";
      flash_deal_type = 'cold';
    }

    // 3. Update de Centrale Hersenen (System State)
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
