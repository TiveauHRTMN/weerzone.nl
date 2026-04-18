import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { amazonProductUrl, amazonUrl } from "@/lib/affiliates";

// Vercel Cron: elke ochtend om 06:30 NL tijd
export const dynamic = "force-dynamic";

interface Subscriber {
  email: string;
  city: string;
  lat: number;
  lon: number;
}

const PIET_PROMPT = `
Role: Piet van WEERZONE.nl.
Persona: Een vriendelijke, deskundige lokale gids. Nooit schreeuwerig, altijd behulpzaam. 
Stijl:
1. Analyseer de weerdata voor vandaag en geef een nuchtere, deskundige conclusie.
2. Deel een interessant of uniek feitje over de STAD die je doorkrijgt (geschiedenis, architectuur of sfeer).
3. Geef kort advies voor de dag (kleding, vervoer).

REGELS:
- Max 50 woorden.
- Gebruik GEEN catchphrases zoals 'oant moarn'. 
- Spreek als 'Piet', niet als een AI.
- Houd de toon warm maar zakelijk.
`;

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Europe/Amsterdam&forecast_days=2`
  );
  return res.json();
}

// ------------------------------------------------------------
// Weer-afhankelijke Amazon productkeuze — 2 items per mail
// ------------------------------------------------------------
type AffiliatePick = { title: string; subtitle: string; href: string; emoji: string };

function pickProducts(code: number, tempMax: number, tempMin: number, precip: number, wind: number): AffiliatePick[] {
  const picks: AffiliatePick[] = [];

  // Regen
  if (precip > 2 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    picks.push({ emoji: "☔", title: "Senz° stormparaplu", subtitle: "Winddicht tot 100 km/u — geen waaier-in-de-wind drama.", href: amazonProductUrl("B07B8K47M2") });
    picks.push({ emoji: "🧥", title: "Lichte regenjas", subtitle: "Compact, past in je tas. Voor wie niet verrast wil worden.", href: amazonProductUrl("B0DLH9WJSG") });
    picks.push({ emoji: "🎒", title: "Waterdichte rugzakhoes", subtitle: "Laptop droog, rug droog. Een tientje verzekering.", href: amazonUrl("regenhoes rugzak waterdicht") });
    return picks;
  }

  // Vorst / ijskoud
  if (tempMin <= 0 || code === 71 || code === 73 || code === 75 || code === 77) {
    picks.push({ emoji: "🧊", title: "IJskrabber met handschoen", subtitle: "Voor die sikkeneurige ochtenden. Koude handen tellen niet mee.", href: amazonProductUrl("B09QGWXRY9") });
    picks.push({ emoji: "🧦", title: "Thermo-ondergoed", subtitle: "Omdat 'gewoon een trui' niet afdoet bij -2°.", href: amazonProductUrl("B0DB2TYZ3W") });
    picks.push({ emoji: "❄️", title: "Autoruit anti-vries dekzeil", subtitle: "5 minuten tijdwinst elke ijzige ochtend.", href: amazonUrl("voorruit dekzeil anti vries auto") });
    return picks;
  }

  // Hitte
  if (tempMax >= 25) {
    picks.push({ emoji: "☀️", title: "Zonnebrand SPF 50", subtitle: "Factor 8 is geen zonnebrand, dat is een marinade.", href: amazonUrl("zonnebrand spf 50 gezicht lichaam") });
    picks.push({ emoji: "🧊", title: "Koelbox (elektrisch)", subtitle: "Bier op 4° is het enige wat telt bij 28 graden.", href: amazonProductUrl("B0GLFFKWT4") });
    picks.push({ emoji: "💨", title: "Ventilator stil (slaapkamer)", subtitle: "Slapen bij 26° lukt alleen met luchtstroom.", href: amazonUrl("ventilator staand stil slaapkamer") });
    return picks;
  }

  // Wind
  if (wind >= 35) {
    picks.push({ emoji: "🌬️", title: "Windbreaker jas", subtitle: "Fietsen wordt cardio op steroïden — kleed je er naar.", href: amazonProductUrl("B0DLH9WJSG") });
    picks.push({ emoji: "🧢", title: "Muts met koord", subtitle: "Waait niet af. Je hoofd zal je bedanken.", href: amazonUrl("beanie muts wol") });
    picks.push({ emoji: "☂️", title: "Senz° stormparaplu", subtitle: "Als je tóch moet — deze overleeft het.", href: amazonProductUrl("B07B8K47M2") });
    return picks;
  }

  // Default / mild
  picks.push({ emoji: "🧥", title: "Softshell jas", subtitle: "Altijd een goede keuze in dit kikkerlandje.", href: amazonProductUrl("B0836GND15") });
  picks.push({ emoji: "🎒", title: "Picknickdeken waterafstotend", subtitle: "Voor als het park eindelijk weer open is.", href: amazonProductUrl("B0GLFFKWT4") });
  picks.push({ emoji: "👟", title: "Waterproof wandelschoenen", subtitle: "Drassig gras, natte stoep — schoenen die het aankunnen.", href: amazonUrl("waterproof wandelschoenen heren dames") });
  return picks;
}

function buildAffiliateHtml(products: AffiliatePick[]): string {
  return products.map(p => `
    <a href="${p.href}" target="_blank" rel="sponsored noopener" style="display:block;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px 20px;margin-bottom:12px;text-decoration:none;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="font-size:32px;line-height:1;">${p.emoji}</div>
        <div style="flex:1;">
          <p style="margin:0;font-size:14px;font-weight:800;color:#1e293b;line-height:1.3;">${p.title}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;line-height:1.4;">${p.subtitle}</p>
        </div>
        <div style="color:#f97316;font-size:18px;font-weight:900;">→</div>
      </div>
    </a>
  `).join("");
}

function buildEmailHtml(city: string, data: Record<string, unknown>, pietCommentary: string): string {
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

  const affiliateProducts = pickProducts(code, dailyTempMax, dailyTempMin, totalPrecip, wind);
  const affiliateHtml = buildAffiliateHtml(affiliateProducts);
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#4a9ee8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">

    <div style="text-align:center;padding:12px 0 32px;">
      <img src="https://weerzone.nl/logo-full.png" alt="WEERZONE" style="height: 42px; width: auto; margin-bottom: 4px;" />
      <p style="color:rgba(255,255,255,0.6);font-size:10px;margin:0;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Ochtend-update van Piet</p>
    </div>

    <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow: 0 8px 24px rgba(0,0,0,0.12);">
      <!-- PIET'S LOCAL VERDICT -->
      <div style="background:#f1f5f9;padding:24px;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-size:12px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Piet's Verdict voor ${city} 📍</p>
        <p style="margin:0;font-size:15px;color:#1e293b;line-height:1.6;font-weight:500;">
          ${pietCommentary}
        </p>
      </div>

      <!-- MAIN DATA -->
      <div style="padding:32px 24px;">
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;">
          <span style="font-size:56px;">${emoji}</span>
          <div>
            <p style="margin:0;font-size:42px;font-weight:900;color:#1e293b;line-height:1;">${temp}°</p>
            <p style="margin:4px 0 0;font-size:16px;color:#475569;font-weight:600;">${desc}</p>
          </div>
        </div>

        <div style="padding-top:24px;border-top:1px solid #f1f5f9;">
          <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">De komende 48 uur:</p>
          <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.7;font-size:15px;">
            <li>Kwik tussen <strong style="color:#1e293b;">${dailyTempMin}°</strong> en <strong style="color:#1e293b;">${dailyTempMax}°</strong></li>
            ${wind > 20 ? `<li>Winddruk: <strong style="color:#ef4444;">${wind} km/u</strong></li>` : `<li>Wind: Matig (${wind} km/u)</li>`}
            ${totalPrecip > 0 ? `<li>Verwachte neerslag: <strong style="color:#2563eb;">${totalPrecip.toFixed(1)}mm</strong></li>` : `<li>Neerslag: Geen druppel.</li>`}
          </ul>
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:32px 0;">
      <a href="https://weerzone.nl/weer/${city.toLowerCase().replace(/\s+/g, '-')}" style="display:inline-block;padding:16px 40px;background:#1e293b;color:#ffffff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;letter-spacing:1px;box-shadow:0 4px 20px rgba(30,41,59,0.2);">
        BEKIJK VOLLEDIGE IMPACT →
      </a>
    </div>

    <!-- WEER-RELEVANTE PICKS (AFFILIATE) -->
    <div style="background:#f8fafc;border-radius:24px;padding:28px 20px;margin:8px 0 24px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;text-align:center;">Passend bij dit weer</p>
      <p style="margin:0 0 20px;font-size:13px;color:#475569;text-align:center;font-weight:500;">Geen ruis, gewoon wat écht handig is vandaag.</p>
      ${affiliateHtml}
      <p style="margin:16px 0 0;font-size:10px;color:#94a3b8;text-align:center;line-height:1.5;">Affiliate links — jij betaalt niks extra, wij krijgen een kleine commissie.</p>
    </div>

    <!-- VIRAL SHARE -->
    <div style="background:#f0f9ff;border-radius:24px;padding:32px;margin:32px 0;text-align:center;border:1px solid #bae6fd;">
      <p style="margin:0 0 12px;font-size:16px;color:#0369a1;font-weight:800;">NIET DE ENIGE ZIJN DIE HET WEET? 🌤️</p>
      <p style="margin:0 0 24px;font-size:14px;color:#0ea5e9;line-height:1.5;">Deel WEERZONE met je vrienden zodat zij ook hun voordeel kunnen doen met de beste weerdata van Nederland.</p>
      <a href="https://api.whatsapp.com/send?text=Krijg%20je%20ook%20nog%20steeds%20van%20die%20vage%20weer-berichten?%20Check%20WEERZONE.nl.%20Echte%20data,%2048%20uur%20vooruit.%20%F0%9F%9A%80" style="display:inline-block;padding:14px 28px;background:#25d366;color:white;font-weight:800;font-size:14px;border-radius:12px;text-decoration:none;box-shadow:0 4px 15px rgba(37,211,102,0.3);">
        DEEL VIA WHATSAPP →
      </a>
    </div>

    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.7);margin:24px 0 0;">
      <strong>48 uur vooruit. De rest is ruis.</strong><br>
      Team WEERZONE<br><br>
      <a href="https://weerzone.nl/api/unsubscribe?email={{EMAIL}}" style="color:rgba(255,255,255,0.9);text-decoration:underline;">Afmelden voor dagelijkse updates</a>
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
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
  
  const resend = new Resend(resendKey);
  const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase missing" }, { status: 500 });

  const { data: subscribers, error } = await supabase.from("subscribers").select("*").eq("active", true);
  if (error || !subscribers?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  const errors: string[] = [];

  const cityGroups = new Map<string, Subscriber[]>();
  for (const sub of subscribers as Subscriber[]) {
    const key = `${sub.lat.toFixed(2)},${sub.lon.toFixed(2)}`;
    if (!cityGroups.has(key)) cityGroups.set(key, []);
    cityGroups.get(key)!.push(sub);
  }

  for (const [, groupSubscribers] of cityGroups) {
    try {
      const first = groupSubscribers[0];
      const weatherData = await fetchWeather(first.lat, first.lon);
      
      // Genereer Piet's commentaar via AI
      let pietCommentary = "De 14-daagse van Buienradar is voor mensen die nog in sprookjes geloven. Wij houden het bij de feiten.";
      
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `${PIET_PROMPT}\n\nSTAD: ${first.city}\nWEER: ${JSON.stringify(weatherData.current)}` }] }]
          });
          pietCommentary = result.response.text()?.trim().replace(/^"|"$/g, '') || pietCommentary;
        } catch (e) {
          console.error("AI error:", e);
        }
      }

      const html = buildEmailHtml(first.city, weatherData, pietCommentary);

      for (const sub of groupSubscribers) {
        const emailPayload = {
          to: sub.email,
          subject: `${getWeatherEmoji(weatherData.current.weather_code, true)} ${Math.round(weatherData.current.temperature_2m)}° in ${sub.city} — WEERZONE`,
          html: html.replace("{{EMAIL}}", encodeURIComponent(sub.email)),
        };
        const result = await resend.emails.send({ from: "Piet | WEERZONE <info@weerzone.nl>", ...emailPayload });
        if (!result.error) sent++; else errors.push(result.error.message);
      }
    } catch (e) {
      errors.push(`Group fetch failed: ${e}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.slice(0, 5) });
}
