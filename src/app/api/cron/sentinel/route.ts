import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchWeatherData } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince, highestSeverity } from "@/lib/knmi-warnings";
import { ALL_PLACES } from "@/lib/places-data";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { amazonProductUrl, amazonUrl } from "@/lib/affiliates";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

// System prompt voor de autonoom draaiende agent
const SENTINEL_PROMPT = `
Role: Reed van WEERZONE.nl.
Persona: De Interceptor. Je taak is de gebruiker behoeden voor weersimpact door directheid en urgentie.

STRIKT:
- NIVEAU YELLOW: Direct en alert. "Neerslag op komst voor Utrecht. Bereid je voor."
- NIVEAU ORANGE: Zeer urgent en kort. "Zware windstoten verwacht. Blijf binnen!"
- NIVEAU RED: KRITIEK. ALLES IN HOOFDLETTERS. "EXTREEM GEVAARLIJKE SITUATIE. ONMIDDELLIJKE ACTIE VEREIST."

REGELS:
- Geen catchphrases.
- Max 15 words.
- Direct ter zake. No 'Hello'.
`;

function findAnomaly(hourlyData: any[]) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const relevantHours = hourlyData.filter(d => {
    const t = new Date(d.time);
    return t >= windowStart && t <= windowEnd;
  });

  for (const hour of relevantHours) {
    if (hour.precipitation > 15) return { type: "HEAVY_RAIN", level: "RED", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 80) return { type: "STORM", level: "RED", value: `${hour.windSpeed}km/u`, time: hour.time };
    if (hour.precipitation > 10) return { type: "HEAVY_RAIN", level: "ORANGE", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 60) return { type: "STORM", level: "ORANGE", value: `${hour.windSpeed}km/u`, time: hour.time };
    if (hour.precipitation > 5) return { type: "HEAVY_RAIN", level: "YELLOW", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 45) return { type: "STORM", level: "YELLOW", value: `${hour.windSpeed}km/u`, time: hour.time };
    if (hour.temperature > 30) return { type: "HEAT", level: "YELLOW", value: `${hour.temperature}°C`, time: hour.time };
    if (hour.temperature < -5) return { type: "COLD", level: "YELLOW", value: `${hour.temperature}°C`, time: hour.time };
  }
  return null;
}

function buildAffiliateEmailHtml(city: string, anomaly: any, alertMsg: string) {
  const level = anomaly.level || "YELLOW";
  const colors = {
    YELLOW: { bg: "#fefce8", border: "#eab308", text: "#854d0e", btn: "#eab308" },
    ORANGE: { bg: "#fff7ed", border: "#f97316", text: "#9a3412", btn: "#f97316" },
    RED: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", btn: "#ef4444" }
  }[level as "YELLOW" | "ORANGE" | "RED"];

  const promos: any = {
    HEAVY_RAIN: { title: "Houd je voeten droog", desc: "Forse neerslag op komst. Deze Senz° stormparaplu is getest tot 100 km/u.", link: amazonProductUrl("B07B8K47M2"), btn: "Bekijk Senz° stormparaplu", extras: [] },
    STORM: { title: "Zware windvlagen", desc: "Zet je tuinmeubels vast. Stevige hoezen & verankering.", link: amazonUrl("tuinmeubel afdekhoes"), btn: "Bescherm je terras", extras: [] },
    HEAT: { title: "Hittegolf op komst", desc: "Koeling & hydratatie. Mobiele airco nu leverbaar.", link: amazonUrl("mobiele airco"), btn: "Bekijk mobiele airco", extras: [] },
    COLD: { title: "Vorst aan de grond", desc: "Bescherm je auto. IJskrabber nu bestellen.", link: amazonProductUrl("B09QGWXRY9"), btn: "IJskrabber nu bestellen", extras: [] },
  };

  const promo = promos[anomaly.type as string] || promos.HEAVY_RAIN;

  return `
<!DOCTYPE html>
<html lang="nl">
<body style="background:#f1f5f9;font-family:sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:24px;border:2px solid ${colors.border};padding:40px;text-align:center;">
       <h1 style="color:${colors.text};text-transform:uppercase;">🚨 ${alertMsg}</h1>
       <p>${promo.desc}</p>
       <a href="${promo.link}" style="display:block;background:${colors.btn};color:white;padding:15px;border-radius:12px;text-decoration:none;font-weight:bold;">
         ${promo.btn.toUpperCase()} →
       </a>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is niet geconfigureerd");

    const { data: users, error } = await supabase
      .from("subscribers")
      .select("email, city, lat, lon")
      .eq("active", true);

    if (error || !users) throw error;

    const emailsSent = [];
    const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
    const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

    // Haal KNMI warnings eenmalig op (geldig voor alle gebruikers)
    const allKNMIWarnings = await fetchKNMIWarnings();

    for (const user of users as any[]) {
      if (!user.lat || !user.lon) continue;

      // Bepaal provincie voor KNMI-filtering
      let userProvince: string | null = null;
      let minDist = Infinity;
      for (const p of ALL_PLACES) {
        const dLat = (p.lat - user.lat) * Math.PI / 180;
        const dLon = (p.lon - user.lon) * Math.PI / 180;
        const dist = 2 * Math.atan2(Math.sqrt(Math.sin(dLat/2)**2 + Math.cos(user.lat*Math.PI/180) * Math.cos(p.lat*Math.PI/180) * Math.sin(dLon/2)**2), Math.sqrt(1 - Math.sin(dLat/2)**2 - Math.cos(user.lat*Math.PI/180) * Math.cos(p.lat*Math.PI/180) * Math.sin(dLon/2)**2)) * 6371;
        if (dist < minDist) { minDist = dist; userProvince = p.province; }
      }
      const knmiForUser = userProvince ? warningsForProvince(allKNMIWarnings, userProvince) : allKNMIWarnings;
      const knmiSeverity = highestSeverity(knmiForUser);

      const weather = await fetchWeatherData(user.lat, user.lon);
      const anomaly = findAnomaly(weather.hourly);

      // KNMI officieel alarm overschrijft/versterkt Open-Meteo drempel
      const knmiAnomaly = knmiSeverity ? {
        type: knmiForUser[0]?.type?.toUpperCase().replace(" ", "_") ?? "WEATHER",
        level: knmiSeverity,
        value: knmiForUser.map(w => w.type).join(", "),
        time: new Date().toISOString(),
        source: "KNMI",
      } : null;

      const activeAnomaly = knmiAnomaly ?? anomaly;
      if (activeAnomaly) {
        let alertMsg = knmiAnomaly
          ? `Officieel KNMI-alarm voor ${user.city}: ${knmiForUser.map(w => w.type).join(", ")}`
          : `Waarschuwing voor ${user.city}`;
        if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: `${SENTINEL_PROMPT.trim()}\n\nNIVEAU: ${activeAnomaly.level}\nDATA: ${JSON.stringify({ city: user.city, anomaly: activeAnomaly })}` }] }],
              generationConfig: { maxOutputTokens: 60, temperature: 0.9 },
            });
            alertMsg = result.response.text()?.trim().replace(/^"|"$/g, '') || alertMsg;
        }

        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: "Sentinel | WEERZONE <no-reply@weerzone.nl>",
            to: user.email,
            subject: `🚨 WEER-ALARM: ${user.city}`,
            html: buildAffiliateEmailHtml(user.city, activeAnomaly, alertMsg)
          });
          emailsSent.push(user.email);
        }
      }
    }

    if (emailsSent.length > 0) {
        await logAgentAction(
            "Sentinel",
            "alert_triggered",
            `Sentinel heeft ${emailsSent.length} waarschuwingen verstuurd voor weers-anomalieën.`,
            { emailsCount: emailsSent.length }
        );
    }

    return NextResponse.json({ status: "success", sent: emailsSent.length });
  } catch (e: any) {
    console.error("Sentinel Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
