import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PIPELINE_DIR = path.join(process.cwd(), "pipeline");
const TEMPLATE_HTML = path.join(PIPELINE_DIR, "Weerzone TikTok Slides.html");
const SYSTEM_PROMPT_PATH = path.join(PIPELINE_DIR, "system-prompt.md");
// Screenshots go here — temp HTML must live in PIPELINE_DIR so relative asset
// paths (deck-stage.js, uploads/) resolve correctly when loaded via file://
const SLIDES_TMP_HTML = path.join(PIPELINE_DIR, "_slides-tmp.html");
const SCREENSHOTS_DIR = path.join(PIPELINE_DIR, ".screenshots");

// TikTok @weerzonenl — Buffer GraphQL channel ID
const BUFFER_TIKTOK_CHANNEL = "69e51f4f031bfa423c1f673b";

// ──────────────────────────────────────────────────────────────────
// 1. Open-Meteo — landelijk weerdata Nederland
// ──────────────────────────────────────────────────────────────────
async function fetchWeather() {
  const params = new URLSearchParams({
    latitude: "52.37",
    longitude: "4.89",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    hourly: "temperature_2m,weather_code,precipitation",
    current: "temperature_2m,weather_code,is_day",
    timezone: "Europe/Amsterdam",
    forecast_days: "2",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );
  if (!res.ok) throw new Error(`Open-Meteo fout: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────────
// 2. DeepSeek V4 — JSON genereren conform schema
// ──────────────────────────────────────────────────────────────────
async function generateSlideJson(
  weatherData: object
): Promise<Record<string, unknown>> {
  const systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, "utf8");
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY ontbreekt");

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://weerzone.nl",
      "X-Title": "Weerzone Pipeline",
    },
  });

  const result = await client.chat.completions.create({
    model: "deepseek/deepseek-v4-flash",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Genereer het dagelijks JSON-weerbericht voor de Weerzone TikTok-slides.\n\nWeerdata van Open-Meteo:\n${JSON.stringify(weatherData, null, 2)}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });

  const raw = result.choices[0].message.content ?? "";
  if (!raw.trim()) {
    // Fallback to Hermes 4 if DeepSeek returns empty
    console.log("  DeepSeek lege response, fallback naar Hermes 4…");
    const retry = await client.chat.completions.create({
      model: "nousresearch/hermes-4-70b",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Genereer het dagelijks JSON-weerbericht voor de Weerzone TikTok-slides.\n\nWeerdata van Open-Meteo:\n${JSON.stringify(weatherData, null, 2)}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    });
    const retryRaw = retry.choices[0].message.content ?? "";
    const retryMatch = retryRaw.match(/\{[\s\S]*\}/);
    if (!retryMatch) throw new Error(`Geen JSON in Hermes response:\n${retryRaw.slice(0, 300)}`);
    return JSON.parse(retryMatch[0]) as Record<string, unknown>;
  }
  // Extract JSON object from the response (model may wrap it in markdown code fences)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Geen JSON gevonden in AI-response:\n${raw.slice(0, 300)}`);
  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  if (Object.keys(parsed).length === 0) {
    throw new Error("AI returneerde leeg JSON-object");
  }
  return parsed;
}

// ──────────────────────────────────────────────────────────────────
// 3. JSON injecteren in HTML-template via EDITMODE-BEGIN/END
// ──────────────────────────────────────────────────────────────────
function injectJson(json: object): string {
  const html = fs.readFileSync(TEMPLATE_HTML, "utf8");
  const updated = html.replace(
    /\/\*EDITMODE-BEGIN\*\/[\s\S]*?\/\*EDITMODE-END\*\//,
    `/*EDITMODE-BEGIN*/${JSON.stringify(json)}/*EDITMODE-END*/`
  );
  if (updated === html) {
    throw new Error("EDITMODE-BEGIN/END markers niet gevonden in template");
  }
  return updated;
}

// ──────────────────────────────────────────────────────────────────
// 4. Puppeteer — 3 slides screenshotten (1080×1920 @2x)
// ──────────────────────────────────────────────────────────────────
async function screenshotSlides(htmlContent: string): Promise<string[]> {
  // puppeteer is a lazy import so it doesn't bloat cold-start for other scripts
  const puppeteer = await import("puppeteer");

  // Write injected HTML alongside the assets so relative paths resolve
  fs.writeFileSync(SLIDES_TMP_HTML, htmlContent, "utf8");
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
    await page.goto(`file://${SLIDES_TMP_HTML}`, { waitUntil: "load" });

    // Wait for deck-stage custom element to be defined and CDN scripts to run
    await page.evaluate(() =>
      (window as any).customElements.whenDefined("deck-stage")
    );
    // Extra render pass for fonts and CSS animations
    await new Promise((r) => setTimeout(r, 2000));

    const slidePaths: string[] = [];
    for (let i = 0; i < 3; i++) {
      await page.evaluate((n: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document.querySelector("deck-stage") as any).goTo(n);
      }, i);
      await new Promise((r) => setTimeout(r, 600));

      const stage = await page.$("deck-stage");
      if (!stage) throw new Error("deck-stage element niet gevonden");

      const slidePath = path.join(SCREENSHOTS_DIR, `slide-${i + 1}.png`);
      await stage.screenshot({ path: slidePath as `${string}.png` });
      slidePaths.push(slidePath);
      console.log(`  Slide ${i + 1} → ${slidePath}`);
    }

    return slidePaths;
  } finally {
    await browser.close();
    // Clean up temp HTML
    try { fs.unlinkSync(SLIDES_TMP_HTML); } catch {}
  }
}

// ──────────────────────────────────────────────────────────────────
// 5a. Supabase storage — slides uploaden → publieke URLs
// ──────────────────────────────────────────────────────────────────
async function uploadSlides(slidePaths: string[]): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey)
    throw new Error("Supabase env vars ontbreken");

  const supabase = createClient(supabaseUrl, serviceKey);
  const timestamp = Date.now();
  const urls: string[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const file = fs.readFileSync(slidePaths[i]);
    const storagePath = `tiktok-slides/${timestamp}-slide-${i + 1}.png`;

    const { error } = await supabase.storage
      .from("Pipeline")
      .upload(storagePath, file, { contentType: "image/png", upsert: true });

    if (error)
      throw new Error(`Supabase upload slide ${i + 1}: ${error.message}`);

    const { data } = supabase.storage
      .from("Pipeline")
      .getPublicUrl(storagePath);

    urls.push(data.publicUrl);
    console.log(`  Slide ${i + 1} URL → ${data.publicUrl}`);
  }

  return urls;
}

// ──────────────────────────────────────────────────────────────────
// 5b. Buffer GraphQL — post inplannen voor morgen 08:00
// ──────────────────────────────────────────────────────────────────
async function postToBuffer(imageUrls: string[], caption: string) {
  const token = process.env.BUFFER_API_TOKEN;
  if (!token) throw new Error("BUFFER_API_TOKEN ontbreekt");

  // Morgen 08:00 lokale tijd
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(8, 0, 0, 0);

  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post { id }
        }
      }
    }
  `;

  const variables = {
    input: {
      channelId: BUFFER_TIKTOK_CHANNEL,
      text: caption,
      assets: {
        images: imageUrls.map((url) => ({ url })),
      },
      schedulingType: "automatic",
      mode: "addToQueue",
    },
  };

  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const body = await res.json();
  if (!res.ok || body.errors) {
    throw new Error(
      `Buffer API fout: ${JSON.stringify(body.errors ?? body)}`
    );
  }
  return body.data;
}

// ──────────────────────────────────────────────────────────────────
// Caption bouwen vanuit de slide-JSON
// ──────────────────────────────────────────────────────────────────
function buildCaption(json: Record<string, unknown>): string {
  const condition = (json.conditionTekst as string) ?? "";
  const tempMax = json.tempMax as number;
  const extra = (json.extraLabel as string) ?? "";
  return (
    `${condition} — max ${tempMax}°. ${extra} 🌤️\n` +
    `Hyperlokaal weer op weerzone.nl\n` +
    `#weer #weerzone #nederland #weerbericht #vandaag`
  );
}

// ──────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes("--dry");
  console.log(`🌤️  Weerzone TikTok pipeline${dryRun ? " (dry run)" : ""}…\n`);

  console.log("[1/5] Open-Meteo weerdata ophalen…");
  const weather = await fetchWeather();
  console.log(
    `  max ${weather.daily?.temperature_2m_max?.[0]}° · min ${weather.daily?.temperature_2m_min?.[0]}°\n`
  );

  console.log("[2/5] Slide-JSON genereren via DeepSeek V4…");
  const slideJson = await generateSlideJson(weather);
  console.log("  JSON:\n", JSON.stringify(slideJson, null, 2), "\n");

  console.log("[3/5] JSON injecteren in template…");
  const injectedHtml = injectJson(slideJson);
  console.log("  OK\n");

  console.log("[4/5] Slides screenshotten via Puppeteer (1080×1920 @2x)…");
  const slidePaths = await screenshotSlides(injectedHtml);
  console.log();

  if (dryRun) {
    console.log(`✅ Dry run klaar. Screenshots in ${SCREENSHOTS_DIR}`);
    return;
  }

  console.log("[5a/5] Slides uploaden naar Supabase storage…");
  const imageUrls = await uploadSlides(slidePaths);
  console.log();

  console.log("[5b/5] Post inplannen via Buffer API…");
  const caption = buildCaption(slideJson);
  const result = await postToBuffer(imageUrls, caption);
  console.log("  Buffer result:", JSON.stringify(result, null, 2));

  console.log("\n✅ Pipeline klaar. Post staat ingepland voor morgen 08:00.");
}

main().catch((err) => {
  console.error("\n❌ Pipeline mislukt:", err.message);
  process.exit(1);
});
