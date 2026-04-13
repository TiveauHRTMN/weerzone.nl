import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";

// Vercel Cron: elke ochtend om 06:30 NL tijd
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

function buildEmailHtml(city: string, data: Record<string, unknown>): string {
  const current = data.current as Record<string, number>;
  const daily = data.daily as Record<string, number[]>;
  const temp = Math.round(current.temperature_2m);
  const code = current.weather_code;
  const emoji = getWeatherEmoji(code, true);
  const desc = getWeatherDescription(code);
  const wind = Math.round(current.wind_speed_10m);
  
  const dailyTempMax = Math.round(Math.max(...daily.temperature_2m_max.slice(0, 2)));
  const dailyTempMin = Math.round(Math.min(...daily.temperature_2m_min.slice(0, 2)));
  const totalPrecip = daily.precipitation_sum[0] + daily.precipitation_sum[1];
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#4a9ee8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">

    <div style="text-align:center;padding:12px 0 32px;">
      <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height: 50px; width: auto; margin-bottom: 8px;" />
      <p style="color:#ffffff;font-size:11px;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;font-weight:700;">De Komende 48 Uur In ${city}</p>
    </div>

    <div style="background:#ffffff;border-radius:18px;padding:24px;margin-bottom:16px;box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:center;gap:16px;">
        <span style="font-size:48px;">${emoji}</span>
        <div>
          <p style="margin:0;font-size:36px;font-weight:800;color:#1e293b;">${temp}°</p>
          <p style="margin:4px 0 0;font-size:15px;color:#475569;">${desc}</p>
        </div>
      </div>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
        <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Jouw Lokale Vooruitzicht (48u):</p>
        <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.6;font-size:15px;">
          <li>Temperatuur schommelt tussen <strong style="color:#1e293b;">${dailyTempMin}°</strong> en <strong style="color:#1e293b;">${dailyTempMax}°</strong></li>
          ${wind > 20 ? `<li>Windstoten tot <strong style="color:#ef4444;">${wind} km/u</strong></li>` : `<li>Windvlagen rond de ${wind} km/u</li>`}
          ${totalPrecip > 0 ? `<li style="color:#ef4444;font-weight:600;">Totale regen verwacht: ${totalPrecip.toFixed(1)}mm</li>` : `<li>Geen druppel regen verwacht.</li>`}
        </ul>
      </div>
    </div>

    <div style="text-align:center;padding:24px 0;">
      <a href="https://weerzone.nl/weer/${city.toLowerCase().replace(/\s+/g, '-')}" style="display:inline-block;padding:14px 32px;background:#ffe500;color:#1e293b;font-weight:700;font-size:14px;border-radius:999px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(255,229,0,0.3);">
        BEKIJK RADAR & IMPACT →
      </a>
    </div>

    <div style="background:#f8fafc;border-radius:18px;padding:20px;text-align:center;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;color:#64748b;font-style:italic;">
        "De 14-daagse van Buienradar is voor mensen die nog in sprookjes geloven. Wij houden het bij de feiten."
      </p>
    </div>

    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.7);margin:24px 0 0;">
      Laat de buren maar lekker onvoorbereid de deur uit gaan. Wij zien je morgen weer.<br><br>
      <a href="https://weerzone.nl/api/unsubscribe?email={{EMAIL}}" style="color:rgba(255,255,255,0.9);text-decoration:underline;">Klaar met de feiten? Schrijf je uit.</a>
    </p>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY niet geconfigureerd" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase niet geconfigureerd" }, { status: 500 });
  }

  // Haal actieve subscribers op
  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, city, lat, lon")
    .eq("active", true);

  if (error || !subscribers?.length) {
    return NextResponse.json({ sent: 0, error: error?.message });
  }

  let sent = 0;
  const errors: string[] = [];

  // Groepeer op stad voor efficiëntie
  const cityGroups = new Map<string, { subscribers: Subscriber[]; lat: number; lon: number }>();
  for (const sub of subscribers as Subscriber[]) {
    const key = `${sub.lat.toFixed(2)},${sub.lon.toFixed(2)}`;
    if (!cityGroups.has(key)) {
      cityGroups.set(key, { subscribers: [], lat: sub.lat, lon: sub.lon });
    }
    cityGroups.get(key)!.subscribers.push(sub);
  }

  for (const [, group] of cityGroups) {
    try {
      const weatherData = await fetchWeather(group.lat, group.lon);
      const city = group.subscribers[0].city;
      const html = buildEmailHtml(city, weatherData);

      // Batch verstuur per stad
      for (const sub of group.subscribers) {
        try {
          await resend.emails.send({
            from: "WeerZone <info@weerzone.nl>",
            to: sub.email,
            subject: `${getWeatherEmoji(weatherData.current.weather_code, true)} ${Math.round(weatherData.current.temperature_2m)}° in ${sub.city} — WeerZone`,
            html: html.replace("{{EMAIL}}", encodeURIComponent(sub.email)),
          });
          sent++;
        } catch (e) {
          errors.push(`${sub.email}: ${e}`);
        }
      }
    } catch (e) {
      errors.push(`Weather fetch failed: ${e}`);
    }
  }

  return NextResponse.json({ sent, total: subscribers.length, errors: errors.slice(0, 5) });
}
