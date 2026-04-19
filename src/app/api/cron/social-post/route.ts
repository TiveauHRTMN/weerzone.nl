import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { amazonUrl } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

const SOCIAL_PROMPT = `
Role: WeerZone Official.
Persona: Professioneel, data-gedreven en minimalistisch. Geen ruis, alleen de feiten.
Taak: Schrijf een LANDELIJK weerrapport voor Nederland voor de komende 48 uur.

STRIKT:
- Deel het rapport op in: Ochtend, Middag, Avond, Nacht.
- Geef een hele korte vooruitblik op morgen.
- Gebruik een zakelijke maar moderne toon.
- Voeg onderaan een "Weer-Tip" toe: raad op basis van het weer een product aan (bijv. een paraplu bij regen, zonnebrand bij zon, krabber bij vorst).
- De Weer-Tip moet eindigen met een Amazon link (gebruik de URL die ik geef).
- Eindig het bericht met: "48 uur. De rest is ruis. 👉 weerzone.nl"
- Voeg relevante hashtags toe (#weer #weerzone #nederland #data).
- Max 100 woorden.
`;

async function generateCaption(weather: any) {
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  if (!genAI) return "Landelijk weerbericht: Check weerzone.nl voor de 48-uurs waarheid. #weer #weerzone";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Weer suggestie logica voor Amazon
    let suggestion = "Paraplu";
    if (weather.current.temperature > 22) suggestion = "Zonnebrandcreme";
    if (weather.current.temperature < 3) suggestion = "IJskrabber";
    if (weather.current.windSpeed > 30) suggestion = "Stormvaste paraplu";
    
    const affiliateLink = amazonUrl(suggestion);

    const weatherSummary = JSON.stringify({
      temp: weather.current.temperature,
      desc: weather.current.weatherCode,
      rain: weather.current.precipitation,
      wind: weather.current.windSpeed,
      today_max: weather.daily.temperature_2m_max[0],
      today_min: weather.daily.temperature_2m_min[0],
      tomorrow_max: weather.daily.temperature_2m_max[1],
      affiliate_suggestion: suggestion,
      affiliate_link: affiliateLink
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${SOCIAL_PROMPT}\n\nDATA:\n${weatherSummary}` }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    });

    return result.response.text()?.trim() || "";
  } catch (e) {
    console.error("Gemini error in social service:", e);
    return "Landelijk weerbericht. 48 uur messcherp. 👉 weerzone.nl";
  }
}

/**
 * BUFFER API POSTING
 */
async function postToBuffer(caption: string, imageUrl1: string) {
  const token = process.env.BUFFER_API_TOKEN;
  if (!token) return { status: "skipped", reason: "missing_token" };

  try {
    const profilesRes = await fetch("https://api.bufferapp.com/1/profiles.json", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const profiles = await profilesRes.json();

    if (!Array.isArray(profiles)) throw new Error("Could not fetch Buffer profiles");

    const results = await Promise.all(profiles.map(async (profile: any) => {
      const res = await fetch("https://api.bufferapp.com/1/updates/create.json", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          text: caption,
          "profile_ids[]": profile.id,
          "media[photo]": imageUrl1,
          now: "true"
        })
      });
      return res.json();
    }));

    return results;
  } catch (e: any) {
    console.error("Buffer API Error:", e.message);
    return { status: "error", message: e.message };
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const authParam = searchParams.get("auth");

  const isProduction = process.env.NODE_ENV === "production";
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isAuthenticated = authHeader === `Bearer ${process.env.CRON_SECRET}` || authParam === process.env.CRON_SECRET || isVercelCron;

  if (isProduction && !isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // De Bilt (Landelijk middelpunt / KNMI basis)
    const lat = 52.11;
    const lon = 5.18;
    const weather = await fetchWeatherData(lat, lon);
    if (!weather) throw new Error("Weather data fetch failed");

    const caption = await generateCaption(weather);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://weerzone.nl";
    const imageUrl1 = `${baseUrl}/api/social/piet?city=debilt&slide=1&t=${Date.now()}`;

    const bufferResults = await postToBuffer(caption, imageUrl1);

    return NextResponse.json({
      status: "success",
      scope: "Landelijk",
      buffer: bufferResults,
      caption,
      imageUrl: imageUrl1
    });

  } catch (e: any) {
    console.error("Social Automation Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
