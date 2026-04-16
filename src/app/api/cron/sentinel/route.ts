import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchWeatherData } from "@/lib/weather";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

// System prompt voor de autonoom draaiende agent
const SENTINEL_PROMPT = `
Role: Reed van WeerZone.nl.
Persona: De Interceptor. Je taak is de gebruiker behoeden voor weersimpact door directheid en urgentie.

STRIKT:
- NIVEAU YELLOW: Direct en alert. "Neerslag op komst voor Utrecht. Bereid je voor."
- NIVEAU ORANGE: Zeer urgent en kort. "Zware windstoten verwacht. Blijf binnen!"
- NIVEAU RED: KRITIEK. ALLES IN HOOFDLETTERS. "EXTREEM GEVAARLIJKE SITUATIE. ONMIDDELLIJKE ACTIE VEREIST."

REGELS:
- Geen catchphrases.
- Max 15 woorden.
- Direct ter zake. Geen 'Hallo'.
`;

// Helper: vind de ergste weersomstandigheid binnen 6 tot 24 uur.
function findAnomaly(hourlyData: any[]) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const relevantHours = hourlyData.filter(d => {
    const t = new Date(d.time);
    return t >= windowStart && t <= windowEnd;
  });

  for (const hour of relevantHours) {
    // CODE RED logic
    if (hour.precipitation > 15) return { type: "HEAVY_RAIN", level: "RED", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 80) return { type: "STORM", level: "RED", value: `${hour.windSpeed}km/u`, time: hour.time };
    
    // CODE ORANGE logic
    if (hour.precipitation > 10) return { type: "HEAVY_RAIN", level: "ORANGE", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 60) return { type: "STORM", level: "ORANGE", value: `${hour.windSpeed}km/u`, time: hour.time };

    // CODE YELLOW logic
    if (hour.precipitation > 5) return { type: "HEAVY_RAIN", level: "YELLOW", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 45) return { type: "STORM", level: "YELLOW", value: `${hour.windSpeed}km/u`, time: hour.time };
    if (hour.temperature > 30) return { type: "HEAT", level: "YELLOW", value: `${hour.temperature}°C`, time: hour.time };
    if (hour.temperature < -5) return { type: "COLD", level: "YELLOW", value: `${hour.temperature}°C`, time: hour.time };
  }
  return null;
}

function buildAffiliateEmailHtml(city: string, anomaly: any, alertMsg: string) {
  const emoji = anomaly.type === "HEAVY_RAIN" ? "🌧️" : anomaly.type === "STORM" ? "🌪️" : "🌡️";
  
  // Dynamische styling op basis van ernst
  const level = anomaly.level || "YELLOW";
  const colors = {
    YELLOW: { bg: "#fefce8", border: "#eab308", text: "#854d0e", btn: "#eab308" },
    ORANGE: { bg: "#fff7ed", border: "#f97316", text: "#9a3412", btn: "#f97316" },
    RED: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", btn: "#ef4444" }
  }[level as "YELLOW" | "ORANGE" | "RED"];

  const promos = {
    HEAVY_RAIN: { title: "Houd je voeten droog", desc: "Forse neerslag op komst. Deze stormparaplu's zijn getest tot windkracht 10.", link: "https://www.bol.com/nl/nl/l/stormparaplu-s/20340/", btn: "Bekijk stormparaplu's" },
    STORM: { title: "Zware windvlagen", desc: "Houd je tuinmeubels veilig. Check deze stevige buitenhoezen en verankering.", link: "https://www.bol.com/nl/nl/l/tuinmeubelhoezen/12975/", btn: "Bescherm je terras" },
    HEAT: { title: "Hittegolf op komst", desc: "Zorg voor voldoende koeling en hydratatie. Mobiele airco's en ventilatoren nu leverbaar.", link: "https://www.bol.com/nl/nl/l/mobiele-airco-s/30349/", btn: "Bekijk koeling" },
    COLD: { title: "Vorst aan de grond", desc: "Bescherm je planten en auto tegen de kou. Krabbers en vliesdoeken op voorraad.", link: "https://www.bol.com/nl/nl/l/ijskrabbers-en-sneeuwborstels/14066/", btn: "Winter-essentials" }
  } as const;
  
  const promo = promos[anomaly.type as keyof typeof promos] || promos.HEAVY_RAIN;

  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      <div style="background:${colors.border};padding:24px;text-align:center;">
        <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height:28px;filter:brightness(0) invert(1);" />
        <p style="color:rgba(255,255,255,0.8);font-size:10px;margin:12px 0 0;text-transform:uppercase;letter-spacing:2px;font-weight:800;">Reed | Weer-Alarm 📍 ${city}</p>
      </div>
      
      <div style="padding:40px 32px;text-align:center;">
        <div style="background:${colors.bg};border:2px solid ${colors.border};padding:24px;border-radius:16px;margin-bottom:32px;">
          <p style="margin:0;font-size:18px;font-weight:800;color:${colors.text};line-height:1.4;">
            "${alertMsg.toUpperCase()}"
          </p>
        </div>

        <div style="text-align:left;border-top:1px solid #f1f5f9;padding-top:32px;">
          <h3 style="margin:0 0 8px;font-size:18px;color:#1e293b;font-weight:800;">${promo.title}</h3>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${promo.desc}</p>
          <a href="${promo.link}" style="display:block;text-align:center;background:${colors.btn};color:#ffffff;font-weight:800;text-decoration:none;padding:18px;border-radius:12px;font-size:15px;">
            ${promo.btn.toUpperCase()} →
          </a>
        </div>
      </div>

    <!-- VIRAL ALERT -->
    <div style="background:#fef2f2;border-radius:24px;padding:32px;margin:32px 0;text-align:center;border:2px solid #fee2e2;">
      <p style="margin:0 0 12px;font-size:16px;color:#991b1b;font-weight:900;">LAAT JE VRIENDEN NIET VERRASSEN! 🚨</p>
      <p style="margin:0 0 24px;font-size:14px;color:#b91c1c;line-height:1.5;">Stuur deze waarschuwing door zodat niemand in jouw omgeving overvallen wordt door het weer.</p>
      <a href="https://api.whatsapp.com/send?text=PAS%20OP%3A%20Reed%20waarschuwt%20voor%20extreem%20weer.%20Check%20je%20locatie%20direct%20op%20WeerZone.nl%20%F0%9F%9A%80" style="display:inline-block;padding:14px 28px;background:#25d366;color:white;font-weight:800;font-size:14px;border-radius:12px;text-decoration:none;box-shadow:0 10px 20px rgba(37,211,102,0.4);">
        DEEL VIA WHATSAPP →
      </a>
    </div>

      <div style="padding:20px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9;">
        <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:1px;">48 uur vooruit. De rest is ruis.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Vercel Cron handler
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

    for (const user of users as any[]) {
      if (!user.lat || !user.lon) continue;

      const weather = await fetchWeatherData(user.lat, user.lon);
      const anomaly = findAnomaly(weather.hourly);

      if (anomaly) {
        let alertMsg = "";
        try {
          if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: `${SENTINEL_PROMPT.trim()}\n\nNIVEAU: ${anomaly.level}\nDATA: ${JSON.stringify({ city: user.city, anomaly })}` }] }],
              generationConfig: { maxOutputTokens: 60, temperature: 0.9 },
            });
            alertMsg = result.response.text()?.trim().replace(/^"|"$/g, '') || "";
          }
        } catch (e) {
          console.error("Gemini error:", e);
        }

        if (alertMsg && process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: "Reed | WEERZONE <no-reply@weerzone.nl>",
              to: user.email,
              subject: `🚨 REED | WEER-ALARM voor ${user.city}`,
              html: buildAffiliateEmailHtml(user.city, anomaly, alertMsg)
            });
            emailsSent.push(user.email);
          } catch (e) {
            console.error("Resend error:", e);
          }
        }
      }
    }

    return NextResponse.json({ status: "success", sent: emailsSent.length });
  } catch (e: any) {
    console.error("Sentinel Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
