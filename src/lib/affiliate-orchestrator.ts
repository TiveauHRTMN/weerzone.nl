import { WeatherData } from "@/lib/types";
import { amazonUrl, amazonProductUrl, bookingUrl, thuisbezorgdUrl } from "@/lib/affiliates";

// ============================================================
// Condition tags
// ============================================================

export type ConditionTag = "RAIN" | "HEAT" | "COLD" | "WIND" | "PERFECT" | "DEFAULT";

// ============================================================
// Determine the dominant weather condition
// ============================================================

export function getConditionTag(weather: WeatherData): ConditionTag {
  const { current, hourly } = weather;

  // RAIN: precipitating now OR rain coming in next 6h
  if (current.precipitation > 0) return "RAIN";
  const next6h = hourly.slice(0, 6);
  if (next6h.some((h) => h.precipitation > 0)) return "RAIN";

  // HEAT
  if (current.temperature > 25) return "HEAT";

  // WIND
  if (current.windSpeed > 40) return "WIND";

  // COLD
  if (current.temperature < 5) return "COLD";

  // PERFECT: dry, 15-25°C, low wind
  if (
    current.temperature >= 15 &&
    current.temperature <= 25 &&
    current.windSpeed <= 25 &&
    current.precipitation === 0
  ) {
    return "PERFECT";
  }

  return "DEFAULT";
}

// ============================================================
// Map condition tag to the right affiliate URL
// ============================================================

export function getAffiliateUrl(
  tag: ConditionTag,
  city: string
): { url: string; label: string; platform: string } {
  switch (tag) {
    case "RAIN":
      return {
        url: thuisbezorgdUrl(),
        label: "Laat bezorgen via Thuisbezorgd",
        platform: "THUISBEZORGD",
      };
    case "HEAT":
      return {
        url: bookingUrl("Malaga"),
        label: "Boek een zonnige vakantie",
        platform: "BOOKING",
      };
    case "COLD":
      return {
        url: amazonUrl("winterkleding heren dames warm"),
        label: "Winterkleding op Amazon",
        platform: "AMAZON",
      };
    case "WIND":
      return {
        url: amazonProductUrl("B07B8K47M2"),
        label: "Stormparaplu op Amazon",
        platform: "AMAZON",
      };
    case "PERFECT":
      return {
        url: bookingUrl("Zeeland dagje uit"),
        label: "Dagje uit in Nederland",
        platform: "BOOKING",
      };
    case "DEFAULT":
    default:
      return {
        url: amazonUrl("outdoor regenjas windbreaker"),
        label: "Weergadgets op Amazon",
        platform: "AMAZON",
      };
  }
}

// ============================================================
// Analytics tracking — inserts into analytics_events via API
// Server-side (API routes) call this directly via Supabase;
// client components should call /api/affiliate/track instead.
// ============================================================

export async function trackEvent(
  eventType: "IMPRESSION" | "CLICK",
  tag: ConditionTag,
  weatherContext: object,
  platform: "SITE" | "MAIL",
  sessionId?: string
): Promise<void> {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event_type: eventType,
        condition_tag: tag,
        weather_context: weatherContext,
        platform,
        session_id: sessionId ?? null,
      }),
    });
  } catch {
    // Analytics failures must never crash the app
  }
}

// ============================================================
// Weekly report — aggregates clicks & impressions by tag
// ============================================================

export async function getWeeklyReport(): Promise<
  { tag: string; impressions: number; clicks: number; ctr: number }[]
> {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return [];

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceIso = since.toISOString();

    const res = await fetch(
      `${supabaseUrl}/rest/v1/analytics_events?select=event_type,condition_tag&created_at=gte.${sinceIso}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) return [];

    const rows: { event_type: string; condition_tag: string }[] = await res.json();

    // Group by condition_tag
    const map = new Map<string, { impressions: number; clicks: number }>();
    for (const row of rows) {
      const tag = row.condition_tag ?? "UNKNOWN";
      if (!map.has(tag)) map.set(tag, { impressions: 0, clicks: 0 });
      const entry = map.get(tag)!;
      if (row.event_type === "IMPRESSION") entry.impressions++;
      else if (row.event_type === "CLICK") entry.clicks++;
    }

    return Array.from(map.entries()).map(([tag, { impressions, clicks }]) => ({
      tag,
      impressions,
      clicks,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    }));
  } catch {
    return [];
  }
}
