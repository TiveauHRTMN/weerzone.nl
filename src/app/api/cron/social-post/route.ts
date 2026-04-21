import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { ALL_PLACES } from "@/lib/places-data";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Buffer GraphQL IDs (bevestigd via /api/admin/buffer-check op 19-04-2026)
const BUFFER_ORG_ID = "69e51acfc3f39b8c8987146b";
const BUFFER_CHANNELS = {
  x: "69e51ee4031bfa423c1f65c6", // @weerzone
  tiktok: "69e51f4f031bfa423c1f673b", // weerzonenl
};

import { amazonUrl, temuUrl, AFFILIATE_CONFIG } from "@/lib/affiliates";

interface AffiliatePick {
  product: string;
  keyword: string;
  tag: "regen" | "zon" | "wind" | "kou" | "neutraal";
}

/**
 * Kies Amazon-affiliate product op basis van weerdata.
 */
function pickAffiliate(w: {
  temp: number; rain: number; wind: number; maxTemp: number; minTemp: number;
}): AffiliatePick {
  if (w.rain > 5) return { product: "Stormparaplu", keyword: "stormparaplu windproof", tag: "regen" };
  if (w.wind > 40) return { product: "Softshell windjas", keyword: "softshell jas windproof", tag: "wind" };
  if (w.maxTemp > 25) return { product: "Zonnebrand SPF 50+", keyword: "zonnebrand spf 50 waterproof", tag: "zon" };
  if (w.minTemp < 3) return { product: "IJskrabber", keyword: "ijskrabber met handschoen", tag: "kou" };
  if (w.maxTemp < 10) return { product: "Thermo-handschoenen", keyword: "thermo handschoenen", tag: "kou" };
  return { product: "3-in-1 regenjas", keyword: "3 in 1 regenjas", tag: "neutraal" };
}

function buildDeterministicCaption(args: {
  ochtend: number; middag: number; avond: number; nacht: number;
  rainDay: number; affiliate: AffiliatePick; affiliateUrl: string;
}): string {
  const { ochtend, middag, avond, nacht, rainDay, affiliate, affiliateUrl } = args;
  const condTag = `#${affiliate.tag === "neutraal" ? "weer" : affiliate.tag}`;
  const droog = rainDay < 1;
  const regen = rainDay >= 1 ? `${rainDay.toFixed(1)}mm regen.` : "Droog.";
  return (
    `Ochtend ${ochtend}° · middag ${middag}° · avond ${avond}° · nacht ${nacht}°. ${droog ? "Droog." : regen}\n\n` +
    `Echte voorspelling op jouw postcode → weerzone.nl\n\n` +
    `Tip bij dit weer (advertentie): ${affiliate.product} → ${affiliateUrl}\n\n` +
    `#weer #weerzone #nederland #weerbericht #knmi #buienradar #vandaag ${condTag} #ad`
  );
}

const PERSONA_PROMPTS = {
  PIET: `
Je bent Piet van WEERZONE. 
STIJL: Vandaag Inside / PowNed. Brutaal, ongezouten mening, absolute weer-expertise. 
Je focus: De harde realiteit. Als het kutweer is, zeg je het. 
REGELLIJST: Max 240 tekens. Johan Derksen van het weer. Max 2 emoji.
`,
  REED: `
Je bent Reed van WEERZONE. 
STIJL: Stormchaser / Survival Expert. Serieus, waarschuwend, actiegericht, tactisch.
Je focus: Veiligheid en de brute kracht van de natuur. Geen grappen, alleen feiten en voorbereiding.
REGELLIJST: Max 240 tekens. Gebruik termen als 'Impact', 'Tactisch', 'Paraat'. Max 2 emoji (bijv. 🌪️).
`,
  STEVE: `
Je bent Steve van WEERZONE. 
STIJL: Lifestyle / Chill / Positief. Relaxte vibe, focus op genieten.
Je focus: Het goede leven. Terrasjes, strand, barbecue en ijskoude drankjes. 
REGELLIJST: Max 240 tekens. Vibe: 'Lekker man', 'Genieten'. Max 2 emoji (bijv. 🍺☀️).
`,
};

function getPersona(w: WeatherLite): "PIET" | "REED" | "STEVE" {
  const cur = w.current;
  const d0 = w.daily[0];
  
  // REED: Extreme wind, kou of onweer
  if (cur.windSpeed > 60 || d0.tempMin < -5 || cur.weatherCode >= 80) return "REED";
  
  // STEVE: Beach/Terras weer
  if (d0.tempMax > 23 && cur.precipitation < 1) return "STEVE";
  
  // PIET: De rest
  return "PIET";
}

interface WeatherLite {
  current: { temperature: number; weatherCode: number; windSpeed: number; precipitation: number };
  daily: Array<{ tempMax: number; tempMin: number; precipitationSum: number }>;
  hourly?: Array<{ temperature: number; weatherCode: number; precipitation: number }>;
}

export async function generatePlatformCaption(weather: WeatherLite, platform: 'x' | 'tiktok') {
  if (!weather) throw new Error("No weather data provided to caption generator");
  
  const isTikTok = platform === 'tiktok';
  
  // Ultra-safe extraction
  const cur = weather.current || {};
  const d0 = weather.daily?.[0] || {};
  const h = weather.hourly || [];

  const ochtend = Math.round(h[8]?.temperature ?? cur.temperature ?? 10);
  const middag = Math.round(h[13]?.temperature ?? d0.tempMax ?? 15);
  const avond = Math.round(h[19]?.temperature ?? cur.temperature ?? 10);
  const nacht = Math.round(h[25]?.temperature ?? d0.tempMin ?? 5);

  const affiliate = pickAffiliate({
    temp: cur.temperature ?? 10,
    rain: cur.precipitation ?? 0,
    wind: cur.windSpeed ?? 10,
    maxTemp: d0.tempMax ?? 15,
    minTemp: d0.tempMin ?? 5,
  });

  const useTemu = AFFILIATE_CONFIG.temu.enabled && isTikTok;
  const affiliateUrl = useTemu ? temuUrl(affiliate.keyword) : amazonUrl(affiliate.keyword);

  const persona = getPersona(weather);
  const personaPrompt = PERSONA_PROMPTS[persona];

  const deterministicCaption = buildDeterministicCaption({
    ochtend, middag, avond, nacht,
    rainDay: d0.precipitationSum ?? 0,
    affiliate,
    affiliateUrl,
  });

  // Gemini voor variatie
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { caption: deterministicCaption, affiliate, affiliateUrl, persona };

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${personaPrompt}\n\nTEMPLATE:\n${deterministicCaption}` }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
    });
    const text = res.response.text()?.trim();
    if (text && text.includes("weerzone.nl") && text.includes(affiliateUrl)) {
      return { caption: text, affiliate, affiliateUrl };
    }
    return { caption: deterministicCaption, affiliate, affiliateUrl };
  } catch {
    return { caption: deterministicCaption, affiliate, affiliateUrl };
  }
}

interface BufferResponse {
  data?: unknown;
  errors?: Array<{ message: string; path?: string[] }>;
}

async function bufferGraphQL(query: string, variables: Record<string, unknown>): Promise<BufferResponse> {
  const token = process.env.BUFFER_API_TOKEN;
  if (!token) throw new Error("BUFFER_API_TOKEN missing");
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as BufferResponse;
  if (!res.ok) throw new Error(`Buffer HTTP ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function createBufferPost(channelId: string, text: string, imageUrls: string[]) {
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on CreatePostSuccess { post { id scheduledAt } }
        ... on MutationError { message }
      }
    }
  `;
  const variables = {
    input: {
      organizationId: BUFFER_ORG_ID,
      channelIds: [channelId],
      text,
      media: imageUrls.map((url) => ({ url, type: "image" })),
      schedulingType: "custom",
      mode: "shareNow",
    },
  };
  return bufferGraphQL(mutation, variables);
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
    const xSlide1 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=1&format=x&t=${bust}`;
    const xSlide2 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=2&format=x&t=${bust}`;
    const ttSlide1 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=1&format=tiktok&t=${bust}`;
    const ttSlide2 = `${base}/api/social/piet-v2?city=${citySlug}&lat=${deBilt.lat}&lon=${deBilt.lon}&slide=2&format=tiktok&t=${bust}`;

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        x: xData,
        tiktok: tiktokData,
        images: {
          x: [xSlide1, xSlide2],
          tt: [ttSlide1, ttSlide2]
        },
      });
    }

    // Post parallel naar X en TikTok
    const [xResult, tiktokResult] = await Promise.allSettled([
      createBufferPost(BUFFER_CHANNELS.x, xData.caption, [xSlide1, xSlide2]),
      createBufferPost(BUFFER_CHANNELS.tiktok, tiktokData.caption, [ttSlide1, ttSlide2]),
    ]);

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
