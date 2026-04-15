import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchWeatherData } from "@/lib/weather";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const AGENT_PROMPT = `Je bent de "Hyper-Affiliate" Timing Agent van WeerZone.nl.
Jouw doel is om gebruikers cynisch maar constructief te waarschuwen voor een naderende keiharde wolkbreuk, precies wanneer ze het niet verwachten. 
De data toont aan dat er binnen 3 uur een stortbui of zwaar onweer op hun locatie valt.
Jij schrijft een extreem korte e-mail (max 5 zinnen) met:
1. De cynische realiteit: ze gaan waarschijnlijk verzuipen als ze straks naar buiten gaan.
2. Wat ze moeten doen: thuisblijven of een aankoop doen zodat ze de volgende keer wél voorbereid zijn.
3. Optioneel een referentie naar een regenponcho, stormparaplu of droge sokken.

Houd het grof, feitelijk en sarcastisch. Gebruik géén aanhef. Begin direct met schieten.`;

export async function GET(req: Request) {
  // Beveiliging: vereist een authorization header die we matchen met env, of een bypass voor cron-job.org
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
      
      // Zoek naar een heftige bui in de komende 3 uur (> 2.5mm neerslag in 1 uur)
      const upcomingRain = weather.hourly.slice(0, 3).find(h => h.precipitation > 2.5);
      
      if (!upcomingRain) {
        continue; // Niets aan de hand, we vallen de gebruiker niet lastig
      }

      // Wow, zware regen voorspeld! Laat de Agent los!
      const timeStr = new Date(upcomingRain.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      
      let aiText = `${user.city} krijgt zo meteen ${upcomingRain.precipitation}mm op z'n dak. Succes ermee.`;
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `${AGENT_PROMPT}\n\nDe gebruiker in ${user.city} krijgt een bui van ${upcomingRain.precipitation}mm/u om ${timeStr}. Waarschuw ze en upsell iets nuttigs.` }] }],
            generationConfig: { maxOutputTokens: 250, temperature: 0.9 },
          });
          aiText = result.response.text()?.trim() || aiText;
        } catch (e) {
          console.error("Gemini error:", e);
        }
      }
      
      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-top: 5px solid #ef4444; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h2 style="color: #ef4444; margin-top: 0; text-transform: uppercase;">Acuut WeerZone Alarm</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${aiText.replace(/\n/g, '<br>')}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://weerzone.nl" style="background: #1e293b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold;">Check Radar</a>
        </div>
        <p style="text-align: center; font-size: 11px; color: #999; margin-top: 30px;">
          Wil je dit niet meer weten? <a href="https://weerzone.nl/api/unsubscribe?email=${user.email}" style="color: #999;">Uitschrijven</a>
        </p>
      </div>`;

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "WeerZone Alerts <info@weerzone.nl>",
          to: user.email,
          subject: `Noodweer om ${timeStr} in ${user.city}`,
          html: html,
        });
        emailsSent.push({ to: user.email, time: timeStr });
      }
    } catch (e) {
      console.error(`Failed to process agent alert for ${user.email}:`, e);
    }
  }

  return NextResponse.json({ status: "Agent Run Complete", emailsSent });
}
