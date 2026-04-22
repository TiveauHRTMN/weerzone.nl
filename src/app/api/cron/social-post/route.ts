import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { ALL_PLACES } from "@/lib/places-data";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Buffer GraphQL IDs (bevestigd via /api/admin/buffer-check op 19-04-2026)
const BUFFER_ORG_ID = "69e51acfc3f39b8c8987146b";
const BUFFER_CHANNELS = {
  x: "69e51ee4031bfa423c1f65c6", // @weerzone
  tiktok: "69e51f4f031bfa423c1f673b", // weerzonenl
};

import { amazonUrl, temuUrl, AFFILIATE_CONFIG } from "@/lib/affiliates";
import { matchProducts } from "@/lib/amazon-matcher";
import { productHref } from "@/lib/amazon-catalog";

function buildDeterministicCaption(args: {
  ochtend: number; middag: number; avond: number; nacht: number;
  rainDay: number; product: string; affiliateUrl: string;
}): string {
  const { ochtend, middag, avond, nacht, rainDay, product, affiliateUrl } = args;
  const droog = rainDay < 1;
  const regen = rainDay >= 1 ? `${rainDay.toFixed(1)}mm regen.` : "Droog.";
  return (
    `Ochtend ${ochtend}° · middag ${middag}° · avond ${avond}° · nacht ${nacht}°. ${droog ? "Droog." : regen}\n\n` +
    `Echte voorspelling op jouw postcode → weerzone.nl\n\n` +
    `Tip bij dit weer (advertentie): ${product} → ${affiliateUrl}\n\n` +
    `#weer #weerzone #nederland #weerbericht #knmi #buienradar #vandaag #ad`
  );
}

const PERSONA_PROMPTS = {
  PIET: `
Je bent Piet van WEERZONE. 
STIJL: Vandaag Inside / PowNed. Brutaal, ongezouten mening, absolute weer-expertise. 
Je focus: De harde realiteit. Als het kutweer is, zeg je het. 
REGELLIJST: Max 240 tekens. Johan Derksen van het weer. Gebruik "virale" hooks. Max 2 emoji.
`,
  REED: `
Je bent Reed van WEERZONE. 
STIJL: Stormchaser / Survival Expert. Serieus, waarschuwend, actiegericht, tactisch.
Je focus: Veiligheid en de brute kracht van de natuur. Geen grappen, alleen feiten en voorbereiding.
REGELLIJST: Max 240 tekens. Gebruik termen als 'Impact', 'Code Rood', 'Paraat'. Zorg voor een gevoel van urgentie. Max 2 emoji (bijv. 🌪️).
`,
  STEVE: `
Je bent Steve van WEERZONE. 
STIJL: Lifestyle / Chill / Positief. Relaxte vibe, focus op genieten.
Je focus: Het goede leven. Terrasjes, strand, barbecue en ijskoude drankjes. 
REGELLIJST: Max 240 tekens. Focus op de "FOMO" van een mooie dag. Max 2 emoji (bijv. 🍺☀️).
`,
};

function getPersona(w: WeatherLite): "piet" | "reed" | "steve" {
  const cur = w.current;
  const d0 = w.daily[0];
  if (cur.windSpeed > 60 || d0.tempMin < -5 || cur.weatherCode >= 80) return "reed";
  if (d0.tempMax > 23 && cur.precipitation < 1) return "steve";
  return "piet";
}

interface WeatherLite {
  current: { temperature: number; weatherCode: number; windSpeed: number; precipitation: number };
  daily: Array<{ tempMax: number; tempMin: number; precipitationSum: number }>;
  hourly?: Array<{ temperature: number; weatherCode: number; precipitation: number }>;
}

export async function generatePlatformCaption(weather: WeatherLite, platform: 'x' | 'tiktok') {
  if (!weather) throw new Error("No weather data provided to caption generator");
  const isTikTok = platform === 'tiktok';
  
  const cur = weather.current || {};
  const d0 = weather.daily?.[0] || {};
  const h = weather.hourly || [];

  const ochtend = Math.round(h[8]?.temperature ?? cur.temperature ?? 10);
  const middag = Math.round(h[13]?.temperature ?? d0.tempMax ?? 15);
  const avond = Math.round(h[19]?.temperature ?? cur.temperature ?? 10);
  const nacht = Math.round(h[25]?.temperature ?? d0.tempMin ?? 5);

  const persona = getPersona(weather);
  const personaPrompt = PERSONA_PROMPTS[persona.toUpperCase() as keyof typeof PERSONA_PROMPTS];

  // Match products
  const { products } = matchProducts(weather as any, 1, new Date(), persona);
  const deal = products[0];
  const affiliateUrl = deal ? productHref(deal) : (isTikTok ? temuUrl("regenjas") : amazonUrl("regenjas"));
  const productLabel = deal ? deal.title : "Waterdichte regenjas";

  const deterministicCaption = buildDeterministicCaption({
    ochtend, middag, avond, nacht,
    rainDay: d0.precipitationSum ?? 0,
    product: productLabel,
    affiliateUrl,
  });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return { caption: deterministicCaption, affiliateUrl, persona };

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use stable model name
    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${personaPrompt}\n\nTEMPLATE:\n${deterministicCaption}` }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
    });
    const text = res.response.text()?.trim();
    if (text && (text.includes("weerzone.nl") || text.includes("WEERZONE.NL"))) {
      return { caption: text, affiliateUrl, persona };
    }
    return { caption: deterministicCaption, affiliateUrl, persona };
  } catch {
    return { caption: deterministicCaption, affiliateUrl, persona };
  }
}



async function createBufferPost(channelId: string, text: string, imageUrls: string[]) {
  const token = process.env.BUFFER_API_TOKEN;
  if (!token) throw new Error("BUFFER_API_TOKEN missing");

  const query = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
          }
        }
      }
    }
  `;

  const variables = {
    input: {
      channelId,
      text,
      media: imageUrls.map(url => ({ url, type: "image" })),
      schedulingType: "automatic",
      mode: "shareNow"
    }
  };

  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await res.json();
  if (!res.ok || body.errors) {
    throw new Error(`Buffer GraphQL Error: ${JSON.stringify(body.errors || body)}`);
  }
  return body.data;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authParam = searchParams.get("auth");
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET;
  const authenticated =
    isVercelCron || authHeader === `Bearer ${cronSecret}` || authParam === cronSecret;

  if (process.env.NODE_ENV === "production" && !authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Dry-run: ?dry=1 → genereert caption, probeert Buffer niet
  const dryRun = searchParams.get("dry") === "1";

  try {
    // De Bilt — landelijk centrum van NL (Landelijke Nieuws focus)
    const deBilt = { name: "De Bilt", lat: 52.11, lon: 5.18 };
    const weather = await fetchWeatherData(deBilt.lat, deBilt.lon);
    if (!weather) throw new Error("Weather fetch failed");

    // Stel de caption op (Piet Social 2.1: Brutaal & Landelijk)
    const [xData, tiktokData] = await Promise.all([
      generatePlatformCaption(weather as unknown as WeatherLite, 'x'),
      generatePlatformCaption(weather as unknown as WeatherLite, 'tiktok'),
    ]);

    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://weerzone.nl";
    const bust = Date.now();
    const citySlug = "debilt";
    const xPersona = xData.persona;
    const ttPersona = tiktokData.persona;

    const xSlide1 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=1&format=x&persona=${xPersona}&t=${bust}`;
    const xSlide2 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=2&format=x&persona=${xPersona}&t=${bust}`;
    const ttSlide1 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=1&format=tiktok&persona=${ttPersona}&t=${bust}`;
    const ttSlide2 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=2&format=tiktok&persona=${ttPersona}&t=${bust}`;

    // Nano Banana 2: Viral Visual Generation for Social
    let viralVisualUrl = "";
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const promptRes = await model.generateContent(`
          Geef een KORTE Engelse prompt voor een virale weerfoto in Nederland.
          Gebaseerd op dit weerbericht: "${xData.caption}"
          Locatie: De Bilt/Nederland.
          Stijl: National Geographic, dramatic lighting, 8k, awe-inspiring. 
          Geen tekst in beeld.
        `);
        const prompt = promptRes.response.text().trim();
        viralVisualUrl = `${base}/api/visuals/gen?prompt=${encodeURIComponent(prompt)}&v=2.1&seed=${bust}`;
      } catch (e) {
        console.error("Social Visual Error:", e);
      }
    }

    const xImages = viralVisualUrl ? [viralVisualUrl, xSlide1, xSlide2] : [xSlide1, xSlide2];
    const ttImages = viralVisualUrl ? [viralVisualUrl, ttSlide1, ttSlide2] : [ttSlide1, ttSlide2];

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        x: xData,
        tiktok: tiktokData,
        images: {
          x: xImages,
          tt: ttImages
        },
      });
    }

    // Post parallel naar X en TikTok
    const [xResult, tiktokResult] = await Promise.allSettled([
      createBufferPost(BUFFER_CHANNELS.x, xData.caption, xImages),
      createBufferPost(BUFFER_CHANNELS.tiktok, tiktokData.caption, ttImages),
    ]);

    // 3. Stuur een kopie en samenvatting naar de founder (info@weerzone.nl)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Weerzone System <system@weerzone.nl>",
        to: "info@weerzone.nl",
        subject: `🚀 Social Post Status: ${deBilt.name}`,
        html: `
          <div style="font-family:sans-serif; padding:20px;">
            <h1 style="color:#0ea5e9;">WeerZone Social Automator</h1>
            <p>De dagelijkse social media posts zijn voorbereid en doorgestuurd naar Buffer.</p>
            
            <hr />
            
            <h3>X (Twitter) Content [${xPersona.toUpperCase()}]:</h3>
            <p style="background:#f1f5f9; padding:15px; border-radius:8px;">${xData.caption.replace(/\n/g, '<br>')}</p>
            <div style="display:flex; gap:10px;">
              <img src="${xSlide1}" width="300" style="border:1px solid #ddd" />
              <img src="${xSlide2}" width="300" style="border:1px solid #ddd" />
            </div>

            <h3>TikTok Content [${ttPersona.toUpperCase()}]:</h3>
            <p style="background:#f1f5f9; padding:15px; border-radius:8px;">${tiktokData.caption.replace(/\n/g, '<br>')}</p>
            <div style="display:flex; gap:10px;">
              <img src="${ttSlide1}" width="200" style="border:1px solid #ddd" />
              <img src="${ttSlide2}" width="200" style="border:1px solid #ddd" />
            </div>

            <hr />
            <p style="font-size:12px; color:#666;">Status X: ${xResult.status}<br>Status TikTok: ${tiktokResult.status}</p>
          </div>
        `
      });
    }

    return NextResponse.json({
      status: "done",
      x: xData,
      tiktok: tiktokData,
      images: [xSlide1, xSlide2, ttSlide1, ttSlide2],
      results: {
        x:
          xResult.status === "fulfilled"
            ? xResult.value
            : { error: (xResult.reason as Error).message },
        tiktok:
          tiktokResult.status === "fulfilled"
            ? tiktokResult.value
            : { error: (tiktokResult.reason as Error).message },
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("social-post error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
