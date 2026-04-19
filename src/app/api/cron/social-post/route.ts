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

async function postToBuffer(caption: string, imageUrl: string) {
  const token = process.env.BUFFER_API_TOKEN;
  if (!token) return { status: "skipped", reason: "missing_token" };

  try {
    // 1. Haal profiles op (nieuwe Beta API endpoint)
    const profilesRes = await fetch("https://api.buffer.com/v1/profiles", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!profilesRes.ok) {
      const errorText = await profilesRes.text();
      throw new Error(`Buffer Profiles Error (${profilesRes.status}): ${errorText}`);
    }

    const profiles = await profilesRes.json();
    if (!Array.isArray(profiles) || profiles.length === 0) {
      throw new Error("No connected profiles found in Buffer account.");
    }

    // 2. Post naar elk profiel
    const results = await Promise.all(profiles.map(async (profile: any) => {
      const res = await fetch("https://api.buffer.com/v1/updates/create", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: caption,
          profile_ids: [profile.id],
          now: true,
          media: {
            photo: imageUrl
          }
        })
      });

      const data = await res.json();
      return { profile_id: profile.id, service: profile.service, result: data };
    }));

    return results;
  } catch (e: any) {
    console.error("Buffer Integration Error:", e.message);
    return { status: "error", message: e.message };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authParam = searchParams.get("auth");
  const authHeader = req.headers.get("authorization");

  const isProduction = process.env.NODE_ENV === "production";
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isAuthenticated = authHeader === `Bearer ${process.env.CRON_SECRET}` || authParam === process.env.CRON_SECRET || isVercelCron;

  if (isProduction && !isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lat = 52.11;
    const lon = 5.18;
    const weather = await fetchWeatherData(lat, lon);
    if (!weather) throw new Error("Weather data fetch failed");

    const caption = await generateCaption(weather);
    
    // Zorg voor een absolute URL voor de afbeeldingsgenerator
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://weerzone.nl";
    const imageUrl = `${baseUrl}/api/social/piet?city=debilt&slide=1&t=${Date.now()}`;

    console.log("Posting to Buffer...", { imageUrl, captionLength: caption.length });

    const bufferResults = await postToBuffer(caption, imageUrl);

    return NextResponse.json({
      status: "success",
      scope: "Landelijk",
      caption,
      imageUrl,
      buffer_results: bufferResults
    });

  } catch (e: any) {
    console.error("Final Route Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
