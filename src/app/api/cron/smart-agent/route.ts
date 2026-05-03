import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchWeatherData } from "@/lib/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import { getSmartAffiliateEmailHtml } from "@/lib/smart-affiliate-email";
import { getImpactAnalysis } from "@/lib/impact-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Smart Agent: De proactieve affiliate assistent.
 * Stuurt getargete emails op basis van weertriggers (regen, storm, hitte).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  type SubRow = {
    user_id: string;
    user_profile: { email: string; primary_lat: number; primary_lon: number };
  };

  const { data: subs, error: userError } = await supabase
    .from("subscriptions")
    .select("user_id, user_profile!inner(email, primary_lat, primary_lon)")
    .in("status", ["trialing", "active"]);

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  const users = ((subs ?? []) as unknown as SubRow[]).filter(
    (s) => s.user_profile?.primary_lat != null && s.user_profile?.primary_lon != null
  );

  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

  const AGENT_PROMPT = `Je bent de "Hyper-Affiliate" Timing Agent van WEERZONE.nl. 
    Je missie is om een onmisbare (en tikkeltje brutale) tip te geven op basis van het weer.
    Gebruik GEEN aanhef (geen "Hoi", geen "Beste"). Begin direct. Maximaal 2 korte zinnen.
    Toon: Direct, tikkeltje cynisch, maar behulpzaam.`;

  const results = await Promise.allSettled(
    users.map(async (sub) => {
      const { email, primary_lat: lat, primary_lon: lon } = sub.user_profile;

      const weather = await fetchWeatherData(lat, lon);

      // Detect triggers
      const rainEvent = weather.hourly.slice(0, 4).find((h: any) => h.precipitation > 2.0);
      const heatEvent = weather.current.temperature > 28;
      const coldEvent = weather.current.temperature < 2;
      const stormEvent = weather.current.windSpeed > 60;

      let trigger = "";
      let details = "";

      if (stormEvent) { trigger = "storm"; details = "Windkracht 8+ komt eraan."; }
      else if (rainEvent) { trigger = "regen"; details = `Er valt ${rainEvent.precipitation}mm om ${new Date(rainEvent.time).getHours()}:00.`; }
      else if (heatEvent) { trigger = "hitte"; details = `Het is ${weather.current.temperature}°C. Geen pretje.`; }
      else if (coldEvent) { trigger = "kou"; details = `Met ${weather.current.temperature}°C vriezen je oren eraf.`; }

      if (!trigger) return null;

      // Reverse-geocode voor city label (best-effort)
      let cityLabel = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=nl`);
        const geoData = await geo.json();
        if (geoData.results?.[0]?.name) cityLabel = geoData.results[0].name;
      } catch {}

      let aiText = `Er komt ${trigger} aan in ${cityLabel}. Bereid je voor op ellende.`;

      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(`${AGENT_PROMPT}\n\nSituatie: ${trigger} in ${cityLabel}. Details: ${details}.`);
          aiText = result.response.text()?.trim() || aiText;
        } catch (e) {
          console.error("Gemini error:", e);
        }
      }

      // Impact Analysis
      let impactData = undefined;
      try {
        impactData = await getImpactAnalysis(lat, lon);
      } catch (e) {
        console.error("Impact Analysis failed (non-fatal):", e);
      }

      const html = getSmartAffiliateEmailHtml(cityLabel, trigger, aiText, impactData);
      return {
        from: "WEERZONE Alert <info@weerzone.nl>",
        to: email,
        subject: `⚠️ Belangrijk: ${trigger.toUpperCase()} alert voor ${cityLabel}`,
        html,
        _trigger: trigger,
        _email: email,
      };
    })
  );

  const payloads: any[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      payloads.push(result.value);
    } else if (result.status === "rejected") {
      console.error(`Smart Agent processing failed for a user:`, result.reason);
    }
  }

  let sentCount = 0;
  for (let i = 0; i < payloads.length; i += 100) {
    const chunk = payloads.slice(i, i + 100);
    const emailChunk = chunk.map(p => ({
      from: p.from,
      to: p.to,
      subject: p.subject,
      html: p.html
    }));

    try {
      const { error } = await resend.batch.send(emailChunk);
      if (error) {
        console.error(`Smart Agent batch send error:`, error);
      } else {
        sentCount += chunk.length;
        for (const p of chunk) {
          console.log(`Smart Agent sent ${p._trigger} alert to ${p._email}`);
        }
      }
    } catch (e) {
      console.error(`Smart Agent batch send exception:`, e);
    }
  }

  return NextResponse.json({ status: "Smart Agent Cycle Complete", usersProcessed: users.length, sent: sentCount });
}
