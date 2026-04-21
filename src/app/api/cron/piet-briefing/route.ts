import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import { fetchWeatherData } from "@/lib/weather";
import { DUTCH_CITIES } from "@/lib/types";
import { getRecommendedDeals } from "@/lib/affiliate-orchestrator";
import { PERSONAS } from "@/lib/personas";

// Config
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const dynamic = "force-dynamic";
export const maxDuration = 300; 

/**
 * LANDELIJK WEEROVERZICHT
 * Versie 3.0 — The Master Briefing
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const REGIONS = [
      { name: "Midden", city: "De Bilt", lat: 52.1092717, lon: 5.1809676 },
      { name: "Noord", city: "Leeuwarden", lat: 53.2012334, lon: 5.7999133 },
      { name: "Oost", city: "Enschede", lat: 52.2215372, lon: 6.8936619 },
      { name: "West", city: "Amsterdam", lat: 52.3675734, lon: 4.9041389 },
      { name: "Zuid", city: "Eindhoven", lat: 51.441642, lon: 5.4697225 },
    ];

    // 1. Parallel fetch weather
    const regionWeather = await Promise.all(REGIONS.map(async (reg) => {
      const weather = await fetchWeatherData(reg.lat, reg.lon).catch(() => null);
      return { ...reg, weather };
    }));

    const validWeather = regionWeather.filter(r => r.weather);
    if (validWeather.length === 0) throw new Error("Could not fetch any weather data");

    // Anchor data (National Center)
    const main = validWeather[0].weather!;
    
    // 2. Build Daily Slots (Landelijk Gemiddelde)
    const slots = ["Ochtend", "Middag", "Avond", "Nacht"].map((name, i) => {
      const hour = i * 6 + 8; // start around 8:00
      const temps = validWeather.map(r => r.weather!.hourly[hour]?.temperature || 10);
      const rains = validWeather.map(r => r.weather!.hourly[hour]?.precipitation || 0);
      
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const avgRain = rains.reduce((a, b) => a + b, 0) / rains.length;

      return {
        name,
        temp: `${Math.round(avgTemp)}°C`,
        rain: avgRain > 0 ? `${avgRain.toFixed(1)}mm` : "Droog",
        emoji: avgRain > 0.5 ? "🌧️" : avgRain > 0 ? "🌦️" : avgTemp > 18 ? "☀️" : "🌤️"
      };
    });

    // 3. Smart Affiliate Deal
    const deals = getRecommendedDeals(main, "Nederland", "MAIL");
    const topDeal = deals[0];

    // 4. AI Copy (Piet Style)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `
      Je bent Piet van WEERZONE. STIJL: Doortastend, scherp, tikkeltje brutaal ("Vandaag Inside" vibe).
      CONTEXT: Landelijk weerbericht voor Nederland.
      DATA: 
      - Ochtend: ${slots[0].temp}, ${slots[0].rain}
      - Middag: ${slots[1].temp}, ${slots[1].rain}
      - Avond: ${slots[2].temp}, ${slots[2].rain}
      - Nacht: ${slots[3].temp}, ${slots[3].rain}
      - Zon: ${main.daily[0].sunHours}u, UV: ${main.uvIndex.toFixed(1)}
      - Regio's: ${validWeather.map(r => `${r.name}: ${r.weather!.current.temperature}°`).join(', ')}

      TAAK: Schrijf een weerpraatje van max 100 woorden. Geen poespas. Harde feiten met een mening. 
      Eindig met een scherpe oneliner. Gebruik GEEN opsommingstekens.
    `;

    const aiRes = await model.generateContent(prompt);
    const commentary = aiRes.response.text().trim();

    // 5. Send EXTREME High-End Email
    const reportDate = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    
    await resend.emails.send({
      from: "WeerZone Landelijk <piet@weerzone.nl>",
      to: "info@weerzone.nl",
      subject: `Landelijke Weerupdate: ${main.current.temperature}°C & ${main.current.precipitation > 0 ? 'Regen' : 'Droog'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background-color:#f4f7f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.12); border: 1px solid #e2e8f0;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; text-align: center;">
              <div style="background: rgba(255,255,255,0.1); display: inline-block; padding: 6px 16px; border-radius: 100px; margin-bottom: 20px;">
                <span style="color: #60a5fa; font-size: 11px; font-weight: 900; letter-spacing: 2px;">OFFICIAL BRIEFING · ${reportDate}</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">LANDELIJK</h1>
              <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-weight: 600; font-size: 16px;">WeerZone: 48 uur vooruit. De rest is ruis.</p>
            </div>

            <!-- Stats Grid -->
            <div style="padding: 30px; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; background: #f8fafc;">
              ${slots.map(s => `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; width: 110px; text-align: center;">
                  <span style="display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">${s.name}</span>
                  <span style="display: block; font-size: 32px; margin-bottom: 5px;">${s.emoji}</span>
                  <span style="display: block; font-size: 18px; font-weight: 900; color: #1e293b;">${s.temp}</span>
                  <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b;">${s.rain}</span>
                </div>
              `).join('')}
            </div>

            <!-- AI Section -->
            <div style="padding: 40px; background: white;">
              <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                <div style="width: 50px; height: 50px; background: #ffd60a; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🌤️</div>
                <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #0f172a;">HET WEERPRAATJE</h2>
              </div>
              <div style="font-size: 17px; line-height: 1.8; color: #334155; font-weight: 500; border-left: 5px solid #ffd60a; padding-left: 25px;">
                ${commentary.replace(/\n/g, '<br><br>')}
              </div>
            </div>

            <!-- Regional Table -->
            <div style="padding: 0 40px 40px;">
               <div style="background: #f1f5f9; border-radius: 24px; padding: 25px;">
                 <span style="font-size: 12px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 15px;">Regionale Kerncijfers</span>
                 <table style="width: 100%; border-collapse: collapse;">
                    ${validWeather.map(r => `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 0; font-weight: 800; color: #334155;">${r.name} (${r.city})</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 900; color: #0f172a;">${Math.round(r.weather!.current.temperature)}°C</td>
                      </tr>
                    `).join('')}
                 </table>
               </div>
            </div>

            <!-- Affiliate Section (Smart Match) -->
            ${topDeal ? `
              <div style="margin: 0 40px 40px; background: #000; border-radius: 24px; padding: 30px; position: relative; overflow: hidden;">
                <div style="position: absolute; top:0; right:0; background: #ffd60a; color: #000; font-size: 10px; font-weight: 900; padding: 5px 15px; border-radius: 0 0 0 15px;">PRODUCT TIP</div>
                <div style="display: flex; align-items: center; gap: 20px;">
                  <div style="font-size: 40px;">📦</div>
                  <div style="flex: 1;">
                    <h3 style="color: white; margin: 0; font-size: 18px; font-weight: 900;">${topDeal.name}</h3>
                    <p style="color: #94a3b8; margin: 5px 0 15px; font-size: 14px; font-weight: 500;">${topDeal.reason}</p>
                    <a href="${topDeal.url}" style="display: inline-block; background: #ffd60a; color: #000; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase;">Check Prijs op ${topDeal.platform}</a>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-weight: 900; color: #1e293b; letter-spacing: 1px;">WEERZONE OFFICIAL SYSTEM</p>
              <p style="margin: 10px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Deze mail is voor intern gebruik door de founder. De data is afkomstig van KNMI HARMONIE.</p>
            </div>

          </div>
        </body>
        </html>
      `
    });

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("Master Briefing Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
