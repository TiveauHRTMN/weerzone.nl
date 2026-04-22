import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";
import { getConditionTag, trackEvent, ConditionTag } from "@/lib/affiliate-orchestrator";
import { WeatherData } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    `&current=temperature_2m,weather_code,wind_speed_10m,precipitation,relative_humidity_2m,apparent_temperature` +
    `&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,sunrise,sunset,uv_index_max` +
    `&timezone=Europe/Amsterdam&forecast_days=2`
  );
  return res.json();
}

function getWeatherGradient(code: number): { bg: string; accent: string; textAccent: string } {
  if (code >= 95) return { bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", accent: "#a78bfa", textAccent: "#c4b5fd" };
  if (code >= 80) return { bg: "linear-gradient(135deg, #1e3a5f 0%, #2d4a7a 50%, #3b5998 100%)", accent: "#60a5fa", textAccent: "#93c5fd" };
  if (code >= 61) return { bg: "linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)", accent: "#9ca3af", textAccent: "#d1d5db" };
  if (code >= 51) return { bg: "linear-gradient(135deg, #475569 0%, #64748b 50%, #78909c 100%)", accent: "#94a3b8", textAccent: "#cbd5e1" };
  if (code >= 71) return { bg: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #b0bec5 100%)", accent: "#475569", textAccent: "#1e293b" };
  if (code >= 45) return { bg: "linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #b0bec5 100%)", accent: "#e2e8f0", textAccent: "#f1f5f9" };
  if (code >= 2) return { bg: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)", accent: "#fbbf24", textAccent: "#ffffff" };
  return { bg: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)", accent: "#fbbf24", textAccent: "#ffffff" };
}

function getOneLiner(temp: number, totalPrecip: number, wind: number, code: number): string {
  if (code >= 95) return "Bliksem, donder, drama. Netflix kan inpakken vandaag.";
  if (totalPrecip > 15) return "Noach bouwde voor minder een boot. Succes.";
  if (totalPrecip > 5) return "Pak je paraplu of zwem naar je werk. Jouw keuze.";
  if (wind > 40) return "Kapsel? Vergeet het. Draag een helm.";
  if (wind > 25) return "Stevig doorwaaien vandaag. Net als de Tweede Kamer.";
  if (temp > 30) return "Zelfs je airco heeft het warm. Overleven is de opdracht.";
  if (temp > 25) return "Barbecue-weer. Je buren ruiken het al.";
  if (temp < 0) return "Je adem bevriest. Net als je motivatie.";
  if (temp < 5) return "Trek een extra trui aan, watje.";
  if (code <= 1 && temp > 15) return "Perfecte dag. Maar morgen is het weer voorbij.";
  if (code <= 1) return "Zon! Niet wennen, het is Nederland.";
  if (code >= 45) return "Stille Nansen-mist. Mysterieus, maar vooral koud.";
  return "Gewoon Nederlands weer. Niet zeuren, gewoon gaan.";
}

function buildHourBlock(hour: string, temp: number, code: number, precipProb: number, wind: number): string {
  const emoji = getWeatherEmoji(code, true);
  const barWidth = Math.min(precipProb, 100);
  const precipColor = precipProb > 60 ? "#ef4444" : precipProb > 30 ? "#f59e0b" : "#22c55e";
  return `
    <td style="padding:8px 4px;text-align:center;vertical-align:top;width:12.5%;">
      <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;">${hour}</p>
      <p style="margin:4px 0;font-size:20px;line-height:1;">${emoji}</p>
      <p style="margin:0;font-size:16px;font-weight:800;color:#1e293b;">${temp}°</p>
      <div style="margin:6px auto 0;width:24px;height:4px;border-radius:2px;background:#f1f5f9;overflow:hidden;">
        <div style="width:${barWidth}%;height:100%;background:${precipColor};border-radius:2px;"></div>
      </div>
      <p style="margin:2px 0 0;font-size:9px;color:${precipColor};font-weight:600;">${precipProb}%</p>
      <p style="margin:2px 0 0;font-size:9px;color:#94a3b8;">${wind}km/u</p>
    </td>`;
}

function buildAffiliateBlock(tag: ConditionTag, weatherData: Record<string, unknown>): string {
  const current = weatherData.current as Record<string, number>;
  const daily = weatherData.daily as Record<string, number[]>;
  const temp = Math.round(current.temperature_2m);
  const wind = Math.round(current.wind_speed_10m);
  const totalRain = (daily.precipitation_sum?.[0] ?? 0) + (daily.precipitation_sum?.[1] ?? 0);
  const maxTemp = Math.round(Math.max(...(daily.temperature_2m_max?.slice(0, 2) ?? [temp])));
  const minTemp = Math.round(Math.min(...(daily.temperature_2m_min?.slice(0, 2) ?? [temp])));

  let productImage = "";
  let productTitle = "";
  let productPrice = "";
  let productOldPrice = "";
  let productUrl = "";
  let reason = "";
  let urgency = "";
  let tagLabel = "";

  switch (tag) {
    case "RAIN":
      productImage = "https://m.media-amazon.com/images/I/71W-kisuJRL._AC_UL320_.jpg";
      productTitle = "Waterdichte regenjas — ademend";
      productPrice = "€49,99";
      productOldPrice = "€69,99";
      productUrl = "https://www.amazon.nl/dp/B0DLH9WJSG?tag=tiveaubusines-21";
      reason = `${totalRain.toFixed(0)}mm regen verwacht. Een paraplu vergeet je, een jas niet.`;
      urgency = "🔴 Vandaag nog nodig";
      tagLabel = "Bestseller";
      break;
    case "HEAT":
      productImage = "https://m.media-amazon.com/images/I/714aS4VLtjL._AC_UL320_.jpg";
      productTitle = "Zonnebrand SPF 50+ waterproof";
      productPrice = "€12,99";
      productUrl = "https://www.amazon.nl/s?k=zonnebrand+spf+50+waterproof&tag=tiveaubusines-21";
      reason = `${maxTemp}° en hoge UV. Zonder smeren ben je binnen 20 minuten verbrand.`;
      urgency = "☀️ Smeren voor je de deur uit gaat";
      tagLabel = `UV hoog`;
      break;
    case "COLD":
      productImage = "https://m.media-amazon.com/images/I/61B7yOCdstL._AC_UL320_.jpg";
      productTitle = "Softshell jas — wind- en waterdicht";
      productPrice = "€49,99";
      productOldPrice = "€64,99";
      productUrl = "https://www.amazon.nl/dp/B0836GND15?tag=tiveaubusines-21";
      reason = `${minTemp}° tot ${maxTemp}°. Te koud voor een trui, te wisselvallig voor een winterjas.`;
      urgency = "🧊 Kou op komst";
      tagLabel = "Deal";
      break;
    case "WIND":
      productImage = "https://m.media-amazon.com/images/I/61zPZGagoSL._AC_UL320_.jpg";
      productTitle = "Senz stormparaplu — windproof 100 km/u";
      productPrice = "€29,95";
      productUrl = "https://www.amazon.nl/dp/B07B8K47M2?tag=tiveaubusines-21";
      reason = `Windstoten tot ${wind} km/u. Een normale paraplu overleeft dit niet.`;
      urgency = "💨 Windkracht neemt toe";
      tagLabel = "Anti-storm";
      break;
    case "PERFECT":
      productImage = "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg";
      productTitle = "Picknickdeken XL — waterdichte onderkant";
      productPrice = "€24,99";
      productUrl = "https://www.amazon.nl/dp/B0GLFFKWT4?tag=tiveaubusines-21";
      reason = `${maxTemp}°, droog, weinig wind. Dit is zeldzaam in Nederland.`;
      urgency = "🌿 Ga naar buiten — nu";
      tagLabel = "Prachtweer";
      break;
    default:
      productImage = "https://m.media-amazon.com/images/I/71W-kisuJRL._AC_UL320_.jpg";
      productTitle = "3-in-1 jas — regen, wind én kou";
      productPrice = "€59,99";
      productOldPrice = "€79,99";
      productUrl = "https://www.amazon.nl/dp/B0DLH9WJSG?tag=tiveaubusines-21";
      reason = `${minTemp}° tot ${maxTemp}°, wisselvallig. Eén jas voor alles.`;
      urgency = "📦 Morgen in huis";
      tagLabel = "Alleskunner";
      break;
  }

  return `
    <!-- AFFILIATE BLOCK -->
    <div style="background:#ffffff;padding:0;border-bottom:1px solid #e2e8f0;">
      <div style="background:#1e293b;padding:10px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">${urgency}</p>
      </div>
      <div style="padding:20px 24px;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr>
          <td style="width:90px;vertical-align:top;padding-right:16px;">
            <div style="width:90px;height:90px;border-radius:12px;overflow:hidden;position:relative;">
              <img src="${productImage}" alt="${productTitle}" style="width:100%;height:100%;object-fit:cover;" />
              ${tagLabel ? `<span style="position:absolute;top:4px;left:4px;background:#f59e0b;color:#1e293b;font-size:9px;font-weight:800;padding:2px 6px;border-radius:99px;text-transform:uppercase;">${tagLabel}</span>` : ""}
            </div>
          </td>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:800;color:#1e293b;line-height:1.3;">${productTitle}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;line-height:1.4;">${reason}</p>
            <div style="margin-top:10px;">
              <span style="font-size:18px;font-weight:900;color:#1e293b;">${productPrice}</span>
              ${productOldPrice ? `<span style="font-size:12px;color:#94a3b8;text-decoration:line-through;margin-left:6px;">${productOldPrice}</span>` : ""}
            </div>
          </td>
        </tr></table>
        <a href="${productUrl}" style="display:block;margin-top:16px;padding:13px;background:#f59e0b;color:#1e293b;font-weight:800;font-size:13px;border-radius:12px;text-decoration:none;text-align:center;box-shadow:0 4px 12px rgba(245,158,11,0.25);">
          Bekijk op Amazon.nl →
        </a>
        <p style="margin:8px 0 0;font-size:10px;color:#94a3b8;text-align:center;">Advertentie · Amazon.nl</p>
      </div>
    </div>`;
}

function buildEmailHtml(city: string, data: Record<string, unknown>, affiliateBlock: string): string {
  const current = data.current as Record<string, number>;
  const hourly = data.hourly as Record<string, (number | string)[]>;
  const daily = data.daily as Record<string, (number | string)[]>;

  const temp = Math.round(current.temperature_2m);
  const feelsLike = Math.round(current.apparent_temperature);
  const code = current.weather_code;
  const emoji = getWeatherEmoji(code, true);
  const desc = getWeatherDescription(code);
  const wind = Math.round(current.wind_speed_10m);
  const humidity = Math.round(current.relative_humidity_2m);
  const precip = current.precipitation;

  const todayMax = Math.round(daily.temperature_2m_max[0] as number);
  const todayMin = Math.round(daily.temperature_2m_min[0] as number);
  const tomorrowMax = Math.round(daily.temperature_2m_max[1] as number);
  const tomorrowMin = Math.round(daily.temperature_2m_min[1] as number);
  const todayCode = daily.weather_code[0] as number;
  const tomorrowCode = daily.weather_code[1] as number;
  const todayRain = (daily.precipitation_sum[0] as number);
  const tomorrowRain = (daily.precipitation_sum[1] as number);
  const totalPrecip = todayRain + tomorrowRain;
  const uvMax = daily.uv_index_max[0] as number;
  const sunrise = (daily.sunrise[0] as string).split("T")[1]?.slice(0, 5) || "—";
  const sunset = (daily.sunset[0] as string).split("T")[1]?.slice(0, 5) || "—";

  const { bg, accent, textAccent } = getWeatherGradient(code);
  const oneLiner = getOneLiner(temp, totalPrecip, wind, code);

  // 8 uur-blokken: vanaf huidig uur, elke 3 uur
  const now = new Date();
  const currentHourIndex = now.getHours();
  const hourBlocks: string[] = [];
  for (let i = 0; i < 8; i++) {
    const idx = currentHourIndex + (i * 3);
    if (idx >= hourly.temperature_2m.length) break;
    const h = idx % 24;
    const dayLabel = idx >= 24 ? "morgen" : "";
    const label = dayLabel ? `${h}:00` : `${h}:00`;
    hourBlocks.push(buildHourBlock(
      label,
      Math.round(hourly.temperature_2m[idx] as number),
      hourly.weather_code[idx] as number,
      hourly.precipitation_probability[idx] as number,
      Math.round(hourly.wind_speed_10m[idx] as number),
    ));
  }

  // Temp verschil morgen vs vandaag
  const tempDiff = tomorrowMax - todayMax;
  const tomorrowTrend = tempDiff > 2 ? `${tempDiff}° warmer` : tempDiff < -2 ? `${Math.abs(tempDiff)}° kouder` : "vergelijkbaar";

  // Score bars voor risico's
  const rainRisk = Math.min(100, Math.round((totalPrecip / 20) * 100));
  const windRisk = Math.min(100, Math.round((wind / 60) * 100));
  const uvRisk = Math.min(100, Math.round((uvMax / 11) * 100));

  const riskColor = (v: number) => v > 66 ? "#ef4444" : v > 33 ? "#f59e0b" : "#22c55e";

  const dateStr = now.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" });

  // Nano Banana 2: Dynamic Hero Visual Integration
  // We use Gemini to generate a specific prompt for the visual engine based on city and weather
  let visualPrompt = `Realistisch weerbeeld in ${city}: ${desc}, ${temp}°C.`;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const aiRes = await model.generateContent(`
        Geef een KORTE Engelse prompt voor een AI image generator (Stable Diffusion/Flux stijl).
        Het moet het weer in ${city} uitbeelden.
        Weer: ${desc}, Temperatuur: ${temp}°C. 
        Stijl: Hyper-realistisch, cinematic, wide angle, 8k. 
        Geen tekst in het beeld.
      `);
      visualPrompt = aiRes.response.text().trim();
    } catch (e) {
      console.error("Nano Banana Prompt Error:", e);
    }
  }

  const aiVisualUrl = `https://visuals.weerzone.nl/gen?prompt=${encodeURIComponent(visualPrompt)}&city=${encodeURIComponent(city)}&v=2.1&seed=${new Date().getDate()}`;

  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">

    <!-- NANO BANANA 2: DYNAMIC AI VISUAL -->
    <div style="background:#000;line-height:0;position:relative;">
      <img src="${aiVisualUrl}" alt="Live Weer Visual in ${city}" style="width:100%;height:auto;display:block;" />
      <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;">
        <span style="color:#fff;font-size:8px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">AI Generated · Nano Banana 2.1</span>
      </div>
    </div>

    <!-- HERO -->
    <div style="background:${bg};padding:32px 24px 28px;text-align:center;">
      <img src="https://weerzone.nl/logo-full.png" alt="WEERZONE" style="height:36px;width:auto;margin-bottom:4px;opacity:0.9;" />
      <p style="color:${textAccent};font-size:10px;margin:0 0 20px;letter-spacing:2px;text-transform:uppercase;font-weight:700;opacity:0.8;">48-Uurs Weerbericht — ${city}</p>

      <p style="font-size:72px;margin:0;line-height:1;">${emoji}</p>
      <p style="font-size:56px;font-weight:900;color:${textAccent};margin:4px 0 0;line-height:1;">${temp}°</p>
      <p style="font-size:15px;color:${textAccent};margin:6px 0 0;opacity:0.85;">${desc} · Voelt als ${feelsLike}°</p>

      <div style="margin:20px auto 0;display:inline-block;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding:0 12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:${textAccent};opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Wind</p>
            <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:${textAccent};">${wind}<span style="font-size:11px;font-weight:400;"> km/u</span></p>
          </td>
          <td style="width:1px;background:${textAccent};opacity:0.2;"></td>
          <td style="padding:0 12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:${textAccent};opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Vocht</p>
            <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:${textAccent};">${humidity}<span style="font-size:11px;font-weight:400;">%</span></p>
          </td>
          <td style="width:1px;background:${textAccent};opacity:0.2;"></td>
          <td style="padding:0 12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:${textAccent};opacity:0.6;text-transform:uppercase;letter-spacing:1px;">UV</p>
            <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:${textAccent};">${Math.round(uvMax)}</p>
          </td>
          <td style="width:1px;background:${textAccent};opacity:0.2;"></td>
          <td style="padding:0 12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:${textAccent};opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Regen</p>
            <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:${textAccent};">${precip}<span style="font-size:11px;font-weight:400;">mm</span></p>
          </td>
        </tr></table>
      </div>
    </div>

    <!-- ONE-LINER -->
    <div style="background:#1e293b;padding:14px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#f59e0b;font-weight:600;font-style:italic;">"${oneLiner}"</p>
    </div>

    <!-- 24-UURS TIJDLIJN -->
    <div style="background:#ffffff;padding:20px 12px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0 0 12px 8px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Komende 24 uur</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr>
        ${hourBlocks.join("")}
      </tr></table>
    </div>

    <!-- VANDAAG VS MORGEN -->
    <div style="background:#ffffff;padding:20px 24px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0 0 16px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">48-Uurs Vergelijking</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr>
        <td style="width:48%;background:#f8fafc;border-radius:12px;padding:16px;vertical-align:top;">
          <p style="margin:0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Vandaag</p>
          <p style="margin:6px 0 0;font-size:28px;line-height:1;">${getWeatherEmoji(todayCode, true)}</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#1e293b;">${todayMin}° / ${todayMax}°</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${getWeatherDescription(todayCode)}</p>
          ${todayRain > 0 ? `<p style="margin:4px 0 0;font-size:12px;color:#ef4444;font-weight:600;">💧 ${todayRain.toFixed(1)}mm regen</p>` : `<p style="margin:4px 0 0;font-size:12px;color:#22c55e;font-weight:600;">Droog</p>`}
        </td>
        <td style="width:4%;"></td>
        <td style="width:48%;background:#f8fafc;border-radius:12px;padding:16px;vertical-align:top;">
          <p style="margin:0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Morgen</p>
          <p style="margin:6px 0 0;font-size:28px;line-height:1;">${getWeatherEmoji(tomorrowCode, true)}</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#1e293b;">${tomorrowMin}° / ${tomorrowMax}°</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${getWeatherDescription(tomorrowCode)}</p>
          ${tomorrowRain > 0 ? `<p style="margin:4px 0 0;font-size:12px;color:#ef4444;font-weight:600;">💧 ${tomorrowRain.toFixed(1)}mm regen</p>` : `<p style="margin:4px 0 0;font-size:12px;color:#22c55e;font-weight:600;">Droog</p>`}
          <p style="margin:6px 0 0;font-size:11px;color:#f59e0b;font-weight:700;">→ ${tomorrowTrend}</p>
        </td>
      </tr></table>
    </div>

    <!-- RISICOMETERS -->
    <div style="background:#ffffff;padding:20px 24px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0 0 14px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Risicometers</p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#475569;width:80px;">💧 Regen</td>
          <td style="padding:4px 0;">
            <div style="height:8px;border-radius:4px;background:#f1f5f9;overflow:hidden;">
              <div style="width:${rainRisk}%;height:100%;background:${riskColor(rainRisk)};border-radius:4px;"></div>
            </div>
          </td>
          <td style="padding:4px 0 4px 8px;font-size:12px;font-weight:700;color:${riskColor(rainRisk)};width:55px;text-align:right;">${totalPrecip.toFixed(1)}mm</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#475569;">💨 Wind</td>
          <td style="padding:4px 0;">
            <div style="height:8px;border-radius:4px;background:#f1f5f9;overflow:hidden;">
              <div style="width:${windRisk}%;height:100%;background:${riskColor(windRisk)};border-radius:4px;"></div>
            </div>
          </td>
          <td style="padding:4px 0 4px 8px;font-size:12px;font-weight:700;color:${riskColor(windRisk)};width:55px;text-align:right;">${wind}km/u</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#475569;">☀️ UV</td>
          <td style="padding:4px 0;">
            <div style="height:8px;border-radius:4px;background:#f1f5f9;overflow:hidden;">
              <div style="width:${uvRisk}%;height:100%;background:${riskColor(uvRisk)};border-radius:4px;"></div>
            </div>
          </td>
          <td style="padding:4px 0 4px 8px;font-size:12px;font-weight:700;color:${riskColor(uvRisk)};width:55px;text-align:right;">${Math.round(uvMax)}/11</td>
        </tr>
      </table>
    </div>

    <!-- ZON -->
    <div style="background:#ffffff;padding:16px 24px;border-bottom:1px solid #e2e8f0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr>
        <td style="text-align:center;">
          <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">🌅 Opkomst</p>
          <p style="margin:2px 0 0;font-size:18px;font-weight:800;color:#f59e0b;">${sunrise}</p>
        </td>
        <td style="text-align:center;">
          <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">🌇 Ondergang</p>
          <p style="margin:2px 0 0;font-size:18px;font-weight:800;color:#6366f1;">${sunset}</p>
        </td>
      </tr></table>
    </div>

    <!-- CTA -->
    <div style="background:#ffffff;padding:24px;text-align:center;">
      <a href="https://weerzone.nl/weer/${city.toLowerCase().replace(/\s+/g, '-')}" style="display:inline-block;padding:14px 40px;background:#f59e0b;color:#1e293b;font-weight:800;font-size:14px;border-radius:999px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(245,158,11,0.3);text-transform:uppercase;">
        Bekijk Live Radar →
      </a>
    </div>

    ${affiliateBlock}

    <!-- FOOTER -->
    <div style="padding:20px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        ${dateStr} · KNMI HARMONIE data · WEERZONE.nl<br>
        <span style="font-size:10px;">48 uur. De rest is ruis.</span>
      </p>
      <p style="margin:12px 0 0;font-size:11px;">
        <a href="https://weerzone.nl/api/unsubscribe?email={{EMAIL}}" style="color:#94a3b8;text-decoration:underline;">Uitschrijven</a>
      </p>
    </div>

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

    const current = weatherData.current as Record<string, number>;
    const hourly = weatherData.hourly as Record<string, (number | string)[]>;
    const daily = weatherData.daily as Record<string, (number | string)[]>;
    const emoji = getWeatherEmoji(current.weather_code, true);
    const temp = Math.round(current.temperature_2m);

    // Build minimal WeatherData for orchestrator
    const weatherForOrchestrator: WeatherData = {
      current: {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: "N",
        windGusts: current.wind_gusts_10m ?? current.wind_speed_10m,
        precipitation: current.precipitation,
        weatherCode: current.weather_code,
        isDay: true,
        cloudCover: 0,
      },
      minutely: [],
      hourly: (hourly.temperature_2m as number[]).map((t, i) => ({
        time: String(hourly.time?.[i] ?? i),
        temperature: t,
        apparentTemperature: t, // Fallback for type compliance
        weatherCode: (hourly.weather_code as number[])[i] ?? 0,
        precipitation: (hourly.precipitation as number[])[i] ?? 0,
        windSpeed: (hourly.wind_speed_10m as number[])[i] ?? 0,
        cape: 0,
        confidence: "medium" as const,
      })),
      daily: (daily.temperature_2m_max as number[]).map((max, i) => ({
        date: String(daily.time?.[i] ?? i),
        tempMax: max,
        tempMin: (daily.temperature_2m_min as number[])[i] ?? max,
        weatherCode: (daily.weather_code as number[])[i] ?? 0,
        precipitationSum: (daily.precipitation_sum as number[])[i] ?? 0,
        windSpeedMax: (daily.wind_speed_10m_max as number[])?.[i] ?? 0,
        sunHours: 0,
      })),
      sunrise: String((daily.sunrise as string[])?.[0] ?? ""),
      sunset: String((daily.sunset as string[])?.[0] ?? ""),
      uvIndex: (daily.uv_index_max as number[])?.[0] ?? 0,
      models: { agreement: 100, label: "Open-Meteo", sources: ["open-meteo"] },
    };

    const emailSessionId = Math.random().toString(36).slice(2);
    const conditionTag = getConditionTag(weatherForOrchestrator);
    const affiliateBlock = buildAffiliateBlock(conditionTag, weatherData);

    // Track MAIL impression async (fire-and-forget)
    trackEvent(
      "IMPRESSION",
      conditionTag,
      { temp: current.temperature_2m, rain: current.precipitation, wind: current.wind_speed_10m, code: current.weather_code, city },
      "MAIL",
      emailSessionId
    ).catch(() => {});

    const html = buildEmailHtml(city, weatherData, affiliateBlock);

    for (const sub of group.subscribers) {
      try {
        const emailPayload = {
          to: sub.email,
          subject: `${emoji} ${temp}° in ${sub.city} — 48u Weerbericht | WEERZONE`,
          html: html.replace("{{EMAIL}}", encodeURIComponent(sub.email)),
        };

        let result = await resend.emails.send({ from: "WEERZONE <info@weerzone.nl>", ...emailPayload });
        if (result.error && (result.error.message?.includes("not verified") || result.error.message?.includes("domain"))) {
          result = await resend.emails.send({ from: "WEERZONE <onboarding@resend.dev>", ...emailPayload });
        }
        if (!result.error) sent++; else errors.push(`${sub.email}: ${result.error.message}`);
      } catch (e) {
        errors.push(`${sub.email}: ${e}`);
      }
    }
  }

  return NextResponse.json({ sent, total: subscribers.length, errors: errors.slice(0, 5) });
}
