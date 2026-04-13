import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchWeatherData } from "@/lib/weather";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";

const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");


// System prompt voor de autonoom draaiende agent
const SENTINEL_PROMPT = `
Role: Weather-Sentinel voor Weerzone.nl.
Persona: Een brute mix van Powned, Roddelpraat en Vandaag Inside. 
Tone: Geen genade, geen 'hallo', geen 'besten'. Schrijf alsof je aan de bar zit bij VI. Gebruik de taal van het volk, maar wees messcherp op de meteorologische data.
Cynisch. Direct. Amsterdams/Brutaal.

Taak: Schrijf een ongezouten, snoeiharde waarschuwing (max 12 woorden) op basis van de JSON weersdata. 
Context: De gebruiker gaat nat/koud/heet worden. Wrijf het erin. Maak de urgentie pijnlijk duidelijk.

REELS (STRIKT):
- Max 12 woorden.
- NOOIT woorden als 'bereid je voor', 'let op', 'waarschuwing', 'anticipeer'. Dat is AI-jargon. 
- Noem geen data-bronnen.
- Gebruik woorden als: ruk, ellende, verzopen, janken, vriespist, polder, eikel, prutser (indien gepast).
- Eén krachtige zin.
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

  // Zoek naar impact (regen > 5mm of wind > 50km/u of temp > 28 of temp < 0)
  for (const hour of relevantHours) {
    if (hour.precipitation > 5) return { type: "HEAVY_RAIN", value: `${hour.precipitation}mm`, time: hour.time };
    if (hour.windSpeed > 50) return { type: "STORM", value: `${hour.windSpeed}km/u wind`, time: hour.time };
    if (hour.temperature > 28) return { type: "HEAT", value: `${hour.temperature}°C`, time: hour.time };
    if (hour.temperature < 0) return { type: "COLD", value: `${hour.temperature}°C`, time: hour.time };
  }
  return null;
}

// Genereer de conversie-gedreven HTML e-mail
function buildAffiliateEmailHtml(city: string, anomaly: any, alertMsg: string) {
  let promoTitle = "";
  let promoDesc = "";
  let promoLink = "#";
  let promoBtn = "";
  let emoji = "⚠️";

  if (anomaly.type === "HEAVY_RAIN") {
    promoTitle = "Word In Godsnaam Niet Nat";
    promoDesc = "Een beetje regen is tot daar aan toe, maar dit wordt zeiken. Haal decente gear via Amazon voordat je morgen als een verzopen kat aankomt.";
    promoLink = "https://www.amazon.nl/s?k=regenpak&tag=jouw-amazon-tag-21";
    promoBtn = "Fix een Regenpak (Amazon)";
    emoji = "🌧️";
  } else if (anomaly.type === "STORM") {
    promoTitle = "Je Paraplu Gaat Kapot";
    promoDesc = "Trap er niet in. Die goedkope paraplu overleeft dit niet. Investeer in iets dat heel blijft bij 50+ km/u.";
    promoLink = "https://www.amazon.nl/s?k=stormparaplu+senz&tag=jouw-amazon-tag-21";
    promoBtn = "Scoor een Stormparaplu";
    emoji = "🌪️";
  } else if (anomaly.type === "COLD") {
    promoTitle = "Alles bevriest";
    promoDesc = "Het wordt tandenklapperen. Zorg dat je niet als een ijspegel eindigt. Thermokleding is nu geen luxe.";
    promoLink = "https://www.amazon.nl/s?k=thermokleding&tag=jouw-amazon-tag-21";
    promoBtn = "Check Thermokleding";
    emoji = "❄️";
  } else {
    promoTitle = "Vlucht Voor De Hitte";
    promoDesc = "Zweet je niet kapot in de stad. Pak je spullen en boek direct een verkoelend hotel aan de kust of in het bos.";
    promoLink = "https://www.booking.com/searchresults.nl.html?dest_type=region&dest_id=892&aid=1234567";
    promoBtn = "Bekijk Kust-Hotels";
    emoji = "🔥";
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 24px; max-width: 600px; margin: 0 auto; background: #4a9ee8; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height: 50px; width: auto;" />
      </div>

      <div style="background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
        <div style="background: #ef4444; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">SENTINEL ALERT: ${city} ${emoji}</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 20px; font-weight: 600; color: #1e293b; margin-top: 0; line-height: 1.4; text-align: center; font-style: italic;">
            "${alertMsg}"
          </p>
          <div style="background: #fffbeb; border-left: 4px solid #facc15; padding: 20px; border-radius: 4px; margin-top: 32px;">
            <h3 style="color: #b45309; margin-top: 0; margin-bottom: 8px; font-size: 18px;">${promoTitle}</h3>
            <p style="color: #78350f; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">${promoDesc}</p>
            <a href="${promoLink}" style="display: inline-block; background: #ffe500; color: #1e293b; font-weight: 800; text-decoration: none; padding: 14px 24px; border-radius: 999px; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(255,229,0,0.3);">${promoBtn} →</a>
          </div>
        </div>
        <div style="padding: 16px 24px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">Dit is een autonome WeerZone Sentinel notificatie op basis van ICON-D2.<br><a href="https://weerzone.nl" style="color: #475569; text-decoration: underline;">Beheer je voorkeuren</a></p>
        </div>
      </div>
    </div>
  `;
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    for (const user of users as any[]) {
      if (!user.lat || !user.lon) continue;

      const weather = await fetchWeatherData(user.lat, user.lon);
      const anomaly = findAnomaly(weather.hourly);

      if (anomaly) {
        let alertMsg = "";
        try {
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `${SENTINEL_PROMPT}\n\nDATA: ${JSON.stringify({ city: user.city, anomaly })}` }] }],
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0.9,
            },
          });
          alertMsg = result.response.text().trim().replace(/^"|"$/g, '');
        } catch (aiErr) {
          console.error("Gemini Error:", aiErr);
          alertMsg = `${user.city} wordt een teringzooi morgen. Succes ermee.`;
        }

        if (process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: "WeerZone Sentinel <no-reply@weerzone.nl>",
              to: user.email,
              subject: `🚨 SENTINEL ALERT: Weer-alarm voor ${user.city}`,
              html: buildAffiliateEmailHtml(user.city, anomaly, alertMsg)
            });
          } catch (e) {
            console.error("Email failed:", e);
          }
        }
        emailsSent.push({ email: user.email, alert: alertMsg });
      }
    }

    return NextResponse.json({ status: "ok", emailsSent });
  } catch (error: any) {
    console.error("Sentinel Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
