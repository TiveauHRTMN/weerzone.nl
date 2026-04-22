import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchWeatherData } from "@/lib/weather";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const AGENT_PROMPT = `Je bent de "Hyper-Affiliate" Timing Agent van WEERZONE.nl.
Jouw doel is om gebruikers cynisch maar constructief te waarschuwen voor naderend ongemak (regen, hitte, kou of storm).
De data toont aan dat er binnenkort iets vervelends gebeurt op hun locatie.
Jij schrijft een extreem korte e-mail (max 5 zinnen) met:
1. De cynische realiteit van het weertype (regen = verzuipen, hitte = smelten, kou = bevriezen, storm = wegwaaien).
2. Een sarcastisch advies.
3. Een "nuttige" product-referentie die ze NU nodig hebben (paraplu, zonnebrand, dikke trui, stormhaken).

Houd het grof, feitelijk en sarcastisch. Gebruik géén aanhef. Begin direct met schieten.`;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: users, error } = await supabase
    .from("subscribers")
    .select("email, city, lat, lon")
    .eq("active", true);

  if (error || !users) return NextResponse.json({ error: "DB Fetch failed" });

  const emailsSent = [];
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

  for (const user of users as any[]) {
    if (!user.lat || !user.lon) continue;

    try {
      const weather = await fetchWeatherData(user.lat, user.lon);
      
      // Detect triggers
      const rainEvent = weather.hourly.slice(0, 4).find(h => h.precipitation > 2.0);
      const heatEvent = weather.current.temperature > 28;
      const coldEvent = weather.current.temperature < 2;
      const stormEvent = weather.current.windSpeed > 60;

      let trigger = "";
      let details = "";

      if (stormEvent) { trigger = "storm"; details = "Windkracht 8+ komt eraan."; }
      else if (rainEvent) { trigger = "regen"; details = `Er valt ${rainEvent.precipitation}mm om ${new Date(rainEvent.time).getHours()}:00.`; }
      else if (heatEvent) { trigger = "hitte"; details = `Het is ${weather.current.temperature}°C. Geen pretje.`; }
      else if (coldEvent) { trigger = "kou"; details = `Met ${weather.current.temperature}°C vriezen je oren eraf.`; }

      if (!trigger) continue; 

      let aiText = `Er komt ${trigger} aan in ${user.city}. Bereid je voor op ellende.`;
      
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
          const result = await model.generateContent(`${AGENT_PROMPT}\n\nSituatie: ${trigger} in ${user.city}. Details: ${details}.`);
          aiText = result.response.text()?.trim() || aiText;
        } catch (e) {
          console.error("Gemini error:", e);
        }
      }
      
      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-top: 5px solid #ef4444; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #ef4444; margin-top: 0; text-transform: uppercase;">Acuut WEERZONE Alarm</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${aiText.replace(/\n/g, '<br>')}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://weerzone.nl" style="background: #1e293b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold;">Bekijk Real-time Data</a>
        </div>
        <p style="text-align: center; font-size: 11px; color: #999; margin-top: 30px;">
          WEERZONE.nl — 48 uur vooruit. De rest is ruis.
        </p>
      </div>`;

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "WEERZONE Smart Agent <info@weerzone.nl>",
          to: user.email,
          subject: `WAARSCHUWING: ${trigger.toUpperCase()} in ${user.city}`,
          html: html,
        });
        emailsSent.push({ to: user.email, trigger });
      }
    } catch (e) {
      console.error(`Failed to process agent alert for ${user.email}:`, e);
    }
  }

  return NextResponse.json({ status: "Smart Agent Run Complete", emailsSent });
}
