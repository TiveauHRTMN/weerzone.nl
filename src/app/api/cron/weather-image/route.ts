import { NextResponse } from "next/server";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";

export const dynamic = "force-dynamic";

interface Subscriber {
  email: string;
  city: string;
  lat: number;
  lon: number;
}

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Europe/Amsterdam&forecast_days=2`
  );
  return res.json();
}

function buildImagePrompt(city: string, data: Record<string, unknown>): string {
  const current = data.current as Record<string, number>;
  const daily = data.daily as Record<string, number[]>;
  const temp = Math.round(current.temperature_2m);
  const code = current.weather_code;
  const desc = getWeatherDescription(code);
  const wind = Math.round(current.wind_speed_10m);
  const precip = current.precipitation;
  const maxTemp = Math.round(Math.max(...daily.temperature_2m_max.slice(0, 2)));
  const minTemp = Math.round(Math.min(...daily.temperature_2m_min.slice(0, 2)));
  const totalRain = daily.precipitation_sum[0] + daily.precipitation_sum[1];

  let mood = "calm and pleasant";
  if (code >= 95) mood = "dramatic and stormy with lightning";
  else if (code >= 61) mood = "rainy and moody with grey skies";
  else if (code >= 51) mood = "drizzly with light rain";
  else if (code >= 71) mood = "snowy and cold, winter wonderland";
  else if (code >= 45) mood = "foggy and mysterious";
  else if (code >= 2) mood = "partly cloudy with scattered clouds";
  else if (code <= 1) mood = "bright and sunny with blue skies";

  return (
    `A beautiful Dutch landscape in ${city} showing ${mood}. ` +
    `Weather: ${desc}, ${temp}°C (range ${minTemp}°–${maxTemp}°), wind ${wind} km/h` +
    `${totalRain > 0 ? `, ${totalRain.toFixed(1)}mm rain expected` : ", dry"}. ` +
    `Modern weather infographic style with clean data overlay. ` +
    `Show temperature prominently. Vibrant colors, WeerZone branding in corner. ` +
    `Photorealistic Dutch scenery with windmills, canals, or tulip fields as appropriate for the season.`
  );
}

async function generateWeatherImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-image-preview",
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    } as never,
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }
  }
  return null;
}

function buildEmailHtml(city: string, data: Record<string, unknown>, cid: string): string {
  const current = data.current as Record<string, number>;
  const daily = data.daily as Record<string, number[]>;
  const temp = Math.round(current.temperature_2m);
  const code = current.weather_code;
  const emoji = getWeatherEmoji(code, true);
  const desc = getWeatherDescription(code);
  const wind = Math.round(current.wind_speed_10m);
  const maxTemp = Math.round(Math.max(...daily.temperature_2m_max.slice(0, 2)));
  const minTemp = Math.round(Math.min(...daily.temperature_2m_min.slice(0, 2)));
  const totalPrecip = daily.precipitation_sum[0] + daily.precipitation_sum[1];

  // Brutale Dutch one-liners
  const oneLiners = [
    temp > 25 ? "Zweten als een otter in een sauna. Geniet ervan." :
    temp < 5 ? "Trek een extra trui aan, watje." :
    totalPrecip > 10 ? "Pak je paraplu of zwem maar naar je werk." :
    wind > 30 ? "Je kapsel is toch al niks, dus die wind maakt niet uit." :
    "Gewoon normaal weer. Niet zeuren.",
    "Buienradar kijkers in shambles.",
    "Dit is geen sprookje, dit zijn de feiten.",
  ];
  const oneLiner = oneLiners[Math.floor(Math.random() * oneLiners.length)];

  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#4a9ee8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">

    <div style="text-align:center;padding:12px 0 32px;">
      <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height:50px;width:auto;margin-bottom:8px;" />
      <p style="color:#ffffff;font-size:11px;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Weerbeeld Voor ${city}</p>
    </div>

    <div style="background:#ffffff;border-radius:18px;overflow:hidden;margin-bottom:16px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      <img src="cid:${cid}" alt="Weer visualisatie ${city}" style="width:100%;height:auto;display:block;" />
      <div style="padding:24px;">
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="font-size:48px;">${emoji}</span>
          <div>
            <p style="margin:0;font-size:36px;font-weight:800;color:#1e293b;">${temp}°</p>
            <p style="margin:4px 0 0;font-size:15px;color:#475569;">${desc}</p>
          </div>
        </div>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
          <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">48-Uurs Vooruitzicht:</p>
          <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.6;font-size:15px;">
            <li>Tussen <strong style="color:#1e293b;">${minTemp}°</strong> en <strong style="color:#1e293b;">${maxTemp}°</strong></li>
            ${wind > 20 ? `<li>Windstoten tot <strong style="color:#ef4444;">${wind} km/u</strong></li>` : `<li>Wind rond de ${wind} km/u</li>`}
            ${totalPrecip > 0 ? `<li style="color:#ef4444;font-weight:600;">Regen verwacht: ${totalPrecip.toFixed(1)}mm</li>` : `<li>Droog! Geen regen verwacht.</li>`}
          </ul>
        </div>
      </div>
    </div>

    <div style="background:#f8fafc;border-radius:18px;padding:20px;text-align:center;border:1px solid #e2e8f0;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-style:italic;">"${oneLiner}"</p>
    </div>

    <div style="text-align:center;padding:16px 0;">
      <a href="https://weerzone.nl/weer/${city.toLowerCase().replace(/\s+/g, '-')}" style="display:inline-block;padding:14px 32px;background:#f59e0b;color:#1e293b;font-weight:700;font-size:14px;border-radius:999px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
        BEKIJK RADAR & IMPACT →
      </a>
    </div>

    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.7);margin:24px 0 0;">
      AI-gegenereerd weerbeeld speciaal voor jou. Zie je morgen weer.<br><br>
      <a href="https://weerzone.nl/api/unsubscribe?email={{EMAIL}}" style="color:rgba(255,255,255,0.9);text-decoration:underline;">Uitschrijven</a>
    </p>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY niet geconfigureerd" }, { status: 500 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY niet geconfigureerd" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase niet geconfigureerd" }, { status: 500 });
  }

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, city, lat, lon")
    .eq("active", true);

  if (error || !subscribers?.length) {
    return NextResponse.json({ sent: 0, error: error?.message });
  }

  let sent = 0;
  const errors: string[] = [];

  // Groepeer op stad (zelfde lat/lon)
  const cityGroups = new Map<string, { subscribers: Subscriber[]; lat: number; lon: number }>();
  for (const sub of subscribers as Subscriber[]) {
    const key = `${sub.lat.toFixed(2)},${sub.lon.toFixed(2)}`;
    if (!cityGroups.has(key)) {
      cityGroups.set(key, { subscribers: [], lat: sub.lat, lon: sub.lon });
    }
    cityGroups.get(key)!.subscribers.push(sub);
  }

  for (const [, group] of cityGroups) {
    const city = group.subscribers[0].city;
    let weatherData: Record<string, unknown>;
    try {
      weatherData = await fetchWeather(group.lat, group.lon);
    } catch (e) {
      errors.push(`Weather fetch ${city}: ${e}`);
      continue;
    }

    // Genereer image voor deze stad
    let imageData: { base64: string; mimeType: string } | null = null;
    try {
      const prompt = buildImagePrompt(city, weatherData);
      imageData = await generateWeatherImage(prompt);
    } catch (e) {
      errors.push(`Image gen ${city}: ${e}`);
    }

    if (!imageData) {
      errors.push(`Geen image gegenereerd voor ${city}, subscribers overgeslagen`);
      continue;
    }

    const cid = "weather-image";
    const html = buildEmailHtml(city, weatherData, cid);
    const current = weatherData.current as Record<string, number>;
    const emoji = getWeatherEmoji(current.weather_code, true);
    const temp = Math.round(current.temperature_2m);

    // Verstuur naar alle subscribers in deze stad
    for (const sub of group.subscribers) {
      try {
        const emailPayload = {
          to: sub.email,
          subject: `${emoji} ${temp}° ${sub.city} — Jouw Weerbeeld | WeerZone`,
          html: html.replace("{{EMAIL}}", encodeURIComponent(sub.email)),
          attachments: [
            {
              filename: "weerbeeld.png",
              content: imageData.base64,
              content_type: imageData.mimeType,
              cid,
            },
          ],
        };

        let result = await resend.emails.send({ from: "WeerZone <info@weerzone.nl>", ...emailPayload } as never);
        if (result.error && (result.error.message?.includes("not verified") || result.error.message?.includes("domain"))) {
          result = await resend.emails.send({ from: "WeerZone <onboarding@resend.dev>", ...emailPayload } as never);
        }
        if (!result.error) sent++; else errors.push(`${sub.email}: ${result.error.message}`);
      } catch (e) {
        errors.push(`${sub.email}: ${e}`);
      }
    }
  }

  return NextResponse.json({ sent, total: subscribers.length, errors: errors.slice(0, 5) });
}
