import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { amazonUrl } from "@/lib/affiliates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Buffer GraphQL IDs (bevestigd via /api/admin/buffer-check op 19-04-2026)
const BUFFER_ORG_ID = "69e51acfc3f39b8c8987146b";
const BUFFER_CHANNELS = {
  x: "69e51ee4031bfa423c1f65c6", // @weerzone
  tiktok: "69e51f4f031bfa423c1f673b", // weerzonenl
};

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
  if (w.rain > 5) return { product: "Stormparaplu", keyword: "stormparaplu+windproof", tag: "regen" };
  if (w.wind > 40) return { product: "Softshell windjas", keyword: "softshell+jas+windproof", tag: "wind" };
  if (w.maxTemp > 25) return { product: "Zonnebrand SPF 50+", keyword: "zonnebrand+spf+50+waterproof", tag: "zon" };
  if (w.minTemp < 3) return { product: "IJskrabber", keyword: "ijskrabber+met+handschoen", tag: "kou" };
  if (w.maxTemp < 10) return { product: "Thermo-handschoenen", keyword: "thermo+handschoenen+dames+heren", tag: "kou" };
  return { product: "3-in-1 regenjas", keyword: "3in1+regenjas", tag: "neutraal" };
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
    `#weer #weerzone #nederland ${condTag} #ad`
  );
}

const CAPTION_PROMPT = `
Je bent Piet — de brutale, nuchtere Nederlandse weerman van WEERZONE.
Herschrijf onderstaande template in jouw stem. Max 260 tekens vóór de link.
Behoud de perioden (ochtend/middag/avond/nacht), de call-to-action naar weerzone.nl,
de Amazon-tip-link en de hashtags. Geen emoji-overload (max 2).
`;

interface WeatherLite {
  current: { temperature: number; weatherCode: number; windSpeed: number; precipitation: number };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum?: number[] };
  hourly?: { temperature_2m?: number[]; weather_code?: number[] };
}

async function generateCaption(weather: WeatherLite): Promise<{
  caption: string;
  affiliate: AffiliatePick;
  affiliateUrl: string;
}> {
  const ochtend = Math.round(weather.hourly?.temperature_2m?.[8] ?? weather.current.temperature);
  const middag = Math.round(
    weather.hourly?.temperature_2m?.[13] ?? weather.daily.temperature_2m_max[0],
  );
  const avond = Math.round(weather.hourly?.temperature_2m?.[19] ?? weather.current.temperature);
  const nacht = Math.round(
    weather.hourly?.temperature_2m?.[25] ?? weather.daily.temperature_2m_min[0],
  );

  const affiliate = pickAffiliate({
    temp: weather.current.temperature,
    rain: weather.current.precipitation,
    wind: weather.current.windSpeed,
    maxTemp: weather.daily.temperature_2m_max[0],
    minTemp: weather.daily.temperature_2m_min[0],
  });
  const affiliateUrl = amazonUrl(affiliate.keyword);

  const deterministicCaption = buildDeterministicCaption({
    ochtend,
    middag,
    avond,
    nacht,
    rainDay: weather.daily.precipitation_sum?.[0] ?? 0,
    affiliate,
    affiliateUrl,
  });

  // Gemini poging voor variatie; val anders terug op de deterministische versie.
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { caption: deterministicCaption, affiliate, affiliateUrl };

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const res = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${CAPTION_PROMPT}\n\nTEMPLATE:\n${deterministicCaption}` }],
        },
      ],
      generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
    });
    const text = res.response.text()?.trim();
    // Safety: alleen gebruiken als Gemini de link + URL behouden heeft
    if (text && text.includes("weerzone.nl") && text.includes(affiliateUrl)) {
      return { caption: text, affiliate, affiliateUrl };
    }
    return { caption: deterministicCaption, affiliate, affiliateUrl };
  } catch (e) {
    console.error("Gemini caption error:", e);
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
    // De Bilt — landelijk centrum van NL, gebruikt KNMI als referentie
    const weather = await fetchWeatherData(52.11, 5.18);
    if (!weather) throw new Error("Weather fetch failed");

    const { caption, affiliate, affiliateUrl } = await generateCaption(
      weather as unknown as WeatherLite,
    );

    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://weerzone.nl";
    const bust = Date.now();
    const slide1 = `${base}/api/social/piet?city=debilt&slide=1&t=${bust}`;
    const slide2 = `${base}/api/social/piet?city=debilt&slide=2&t=${bust}`;

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        caption,
        caption_length: caption.length,
        affiliate,
        affiliate_url: affiliateUrl,
        images: [slide1, slide2],
      });
    }

    // Post parallel naar X en TikTok
    const [xResult, tiktokResult] = await Promise.allSettled([
      createBufferPost(BUFFER_CHANNELS.x, caption, [slide1, slide2]),
      createBufferPost(BUFFER_CHANNELS.tiktok, caption, [slide1, slide2]),
    ]);

    return NextResponse.json({
      status: "done",
      caption,
      caption_length: caption.length,
      affiliate,
      affiliate_url: affiliateUrl,
      images: [slide1, slide2],
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
