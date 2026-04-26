import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { fetchWeatherData } from "@/lib/weather";
import { PERSONAS, type PersonaTier } from "@/lib/personas";
import {
  generatePersonaBrief,
  type WeatherSnapshot,
} from "@/lib/persona-brief";
import {
  buildPersonaEmailHtml,
  type EmailAmazonTip,
  type EmailWeatherData,
} from "@/lib/persona-email";
import { matchProducts } from "@/lib/amazon-matcher";
import { productHref, parseEmojiImage } from "@/lib/amazon-catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — ruimte voor LLM-calls

interface SubscriptionRow {
  user_id: string;
  tier: PersonaTier;
  status: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  primary_lat: number | null;
  primary_lon: number | null;
}

interface LocationRow {
  label: string;
  lat: number;
  lon: number;
  is_primary: boolean;
}

interface PrefsRow {
  prefs: Record<string, unknown>;
}

/**
 * Dagelijkse cron: loopt alle actieve/trialing persona-subs af,
 * genereert via Gemini 3 Flash een op-maat-brief en stuurt die via Resend.
 * Beveiligd via CRON_SECRET query of Vercel cron-header.
 */
export async function GET(request: NextRequest) {
  // Auth: Vercel cron stuurt `x-vercel-cron`, of manueel via ?secret=
  const auth = request.headers.get("authorization");
  const secretQuery = request.nextUrl.searchParams.get("secret");
  const CRON_SECRET = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (
    !isVercelCron &&
    (!CRON_SECRET || (auth !== `Bearer ${CRON_SECRET}` && secretQuery !== CRON_SECRET))
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY)
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY ontbreekt" }, { status: 500 });
  if (!RESEND_KEY) return NextResponse.json({ error: "RESEND_API_KEY ontbreekt" }, { status: 500 });
  if (!GEMINI_KEY) return NextResponse.json({ error: "GEMINI_API_KEY ontbreekt" }, { status: 500 });

  const resend = new Resend(RESEND_KEY);
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subs, error: subErr } = await supabase
    .from("subscriptions")
    .select("user_id, tier, status")
    .in("status", ["trialing", "active"])
    .in("tier", ["piet", "reed", "steve"]);

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0, note: "geen actieve abonnees" });

  const rows = subs as SubscriptionRow[];
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const sub of rows) {
    try {
      // Profiel
      const { data: profile } = await supabase
        .from("user_profile")
        .select("id, email, full_name, primary_lat, primary_lon")
        .eq("id", sub.user_id)
        .maybeSingle<ProfileRow>();

      if (!profile?.email) {
        errors.push(`${sub.user_id}: geen profiel/email`);
        failed++;
        continue;
      }

      // Primaire locatie — uit user_locations (is_primary) of uit profile
      const { data: locations } = await supabase
        .from("user_locations")
        .select("label, lat, lon, is_primary")
        .eq("user_id", sub.user_id)
        .returns<LocationRow[]>();

      const primaryLoc =
        (locations ?? []).find((l) => l.is_primary) ?? (locations ?? [])[0];
      const lat = Number(primaryLoc?.lat ?? profile.primary_lat);
      const lon = Number(primaryLoc?.lon ?? profile.primary_lon);
      const city = primaryLoc?.label ?? "jouw locatie";

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        errors.push(`${profile.email}: geen GPS-locatie bekend`);
        failed++;
        continue;
      }

      // Prefs
      const { data: prefsRow } = await supabase
        .from("persona_preferences")
        .select("prefs")
        .eq("user_id", sub.user_id)
        .eq("persona", sub.tier)
        .maybeSingle<PrefsRow>();

      // Weer
      const weather = await fetchWeatherData(lat, lon);
      const snap: WeatherSnapshot = {
        current: {
          temperature: weather.current.temperature,
          feelsLike: weather.current.feelsLike,
          windSpeed: weather.current.windSpeed,
          windGusts: weather.current.windGusts,
          precipitation: weather.current.precipitation,
          weatherCode: weather.current.weatherCode,
          humidity: weather.current.humidity,
        },
        daily: {
          tempMax: weather.daily[0].tempMax,
          tempMin: weather.daily[0].tempMin,
          precipitationSum: weather.daily[0].precipitationSum,
          weatherCode: weather.daily[0].weatherCode,
          windMax: weather.daily[0].windSpeedMax,
        },
        hourlySummary: weather.hourly
          .slice(0, 12)
          .filter((_, i) => i % 3 === 0)
          .map((h) => {
            const hh = new Date(h.time).toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `${hh} ${h.temperature}° ${h.precipitation}mm wind ${h.windSpeed}km/u`;
          })
          .join(", "),
      };

      const firstName =
        profile.full_name?.trim().split(/\s+/)[0] ?? null;

      const brief = await generatePersonaBrief({
        tier: sub.tier,
        firstName,
        city,
        weather: snap,
        prefs: prefsRow?.prefs ?? {},
      });

      const unsubscribeUrl = `https://weerzone.nl/api/unsubscribe?email=${encodeURIComponent(profile.email)}`;

      // Amazon-tip: top-1 match op basis van het weer. Niet blocking.
      let amazonTip: EmailAmazonTip | undefined;
      try {
        const { products } = matchProducts(weather, 1);
        const pick = products[0];
        if (pick) {
          const em = parseEmojiImage(pick.image);
          amazonTip = {
            title: pick.title,
            subtitle: pick.subtitle,
            price: pick.priceHint,
            url: productHref(pick),
            emoji: em?.emoji,
            color: em?.color,
          };
        }
      } catch {
        // negeer — tip is optioneel
      }

      const emailWeather: EmailWeatherData = {
        current: {
          temperature: weather.current.temperature,
          feelsLike: weather.current.feelsLike,
          windSpeed: weather.current.windSpeed,
          windDirection: weather.current.windDirection,
          precipitation: weather.current.precipitation,
          humidity: weather.current.humidity,
          cloudCover: weather.current.cloudCover,
          weatherCode: weather.current.weatherCode,
          isDay: weather.current.isDay,
        },
        daily: {
          tempMax: weather.daily[0].tempMax,
          tempMin: weather.daily[0].tempMin,
          precipitationSum: weather.daily[0].precipitationSum,
          weatherCode: weather.daily[0].weatherCode,
          windSpeedMax: weather.daily[0].windSpeedMax,
          sunHours: weather.daily[0].sunHours,
        },
        sunrise: weather.sunrise,
        sunset: weather.sunset,
        uvIndex: weather.uvIndex,
        hourly: weather.hourly.slice(0, 48).map((h) => ({
          time: h.time,
          temperature: h.temperature,
          precipitation: h.precipitation,
          windSpeed: h.windSpeed ?? 0,
          weatherCode: h.weatherCode,
          cape: h.cape,
        })),
      };

      const html = buildPersonaEmailHtml(sub.tier, brief, city, unsubscribeUrl, amazonTip, emailWeather);

      const fromName = PERSONAS[sub.tier].name;
      const { data: mail, error: mailErr } = await resend.emails.send({
        from: `${fromName} | WEERZONE <info@weerzone.nl>`,
        to: profile.email,
        subject: brief.subject,
        html,
      });

      if (mailErr) {
        errors.push(`${profile.email}: ${mailErr.message}`);
        failed++;
        continue;
      }

      await supabase.from("forecast_log").insert({
        user_id: sub.user_id,
        persona: sub.tier,
        forecast_json: snap as unknown as Record<string, unknown>,
        brief_text: [
          brief.greeting,
          brief.verdict,
          ...brief.details.map((d) => `• ${d}`),
          brief.closing,
        ].join("\n"),
        subject: brief.subject,
        resend_id: mail?.id ?? null,
      });

      sent++;
    } catch (e) {
      failed++;
      errors.push(
        `${sub.user_id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return NextResponse.json({
    sent,
    failed,
    total: rows.length,
    errors: errors.slice(0, 10),
  });
}
