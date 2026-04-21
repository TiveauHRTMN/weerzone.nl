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
// Persona & Deal logic
// ============================================================

export interface AffiliateDeal {
  id: string;
  name: string;
  url: string;
  price: number;
  originalPrice: number;
  discount: number; // percentage
  platform: "AMAZON" | "TEMU" | "BOOKING" | "THUISBEZORGD";
  persona: "PIET" | "REED" | "STEVE";
  reason: string;
  badge?: string;
  score: number;
}

const DEALS_CATALOG: Partial<Record<ConditionTag, Partial<AffiliateDeal>[]>> = {
  RAIN: [
    {
      id: "rain-1",
      name: "Smart Paraplu - Windproof",
      price: 14.95,
      originalPrice: 24.95,
      discount: 40,
      platform: "AMAZON",
      persona: "PIET",
      reason: "Houd je kop droog zonder 20 euro te verspillen.",
      badge: "BESTSELLER",
    },
    {
      id: "rain-2",
      name: "Waterdichte Schoenhoezen (Siliconen)",
      price: 8.50,
      originalPrice: 15.00,
      discount: 43,
      platform: "TEMU",
      persona: "STEVE",
      reason: "Je sneakers blijven fresh, ook in deze teringregen.",
      badge: "FLASHSALE",
    }
  ],
  HEAT: [
    {
      id: "heat-1",
      name: "Draadloze Nek-Ventilator",
      price: 19.99,
      originalPrice: 39.99,
      discount: 50,
      platform: "AMAZON",
      persona: "REED",
      reason: "Handen vrij en je kop koel. Tactisch voordeel in de hitte.",
      badge: "TREENDING",
    },
    {
      id: "heat-2",
      name: "UV-Zonnebril Polarized",
      price: 12.00,
      originalPrice: 45.00,
      discount: 73,
      platform: "TEMU",
      persona: "STEVE",
      reason: "Ziet er duur uit, kost niks. Ideaal voor het terras.",
      badge: "90% VERKOCHT",
    }
  ],
  COLD: [
    {
      id: "cold-1",
      name: "USB Verwarmde Handschoenen",
      price: 16.50,
      originalPrice: 29.95,
      discount: 45,
      platform: "AMAZON",
      persona: "REED",
      reason: "Nooit meer bevroren vingers tijdens het fietsen.",
      badge: "WINTER-DEAL",
    }
  ],
  PERFECT: [
    {
      id: "perf-1",
      name: "Draagbaar Picknickkleed XL",
      price: 12.95,
      originalPrice: 19.95,
      discount: 35,
      platform: "TEMU",
      persona: "STEVE",
      reason: "Vandaag is de dag. Pak die rust.",
      badge: "WEEKEND-FAVORIET",
    }
  ]
};

/**
 * Get the best deals based on weather and impulse potential
 */
export function getRecommendedDeals(weather: WeatherData, city: string): AffiliateDeal[] {
  const tag = getConditionTag(weather);
  const deals = (DEALS_CATALOG[tag] || DEALS_CATALOG["PERFECT"]) as AffiliateDeal[];
  
  return deals.map(deal => {
    // Dynamische scoring
    let score = 50;
    if (deal.discount > 40) score += 30; // High discount priority
    if (deal.price < 20) score += 20;    // Impulse price point priority
    
    return {
      ...deal,
      score,
      // Inject variables into reasoning
      reason: deal.reason.replace("[Plaats]", city)
    };
  }).sort((a, b) => b.score - a.score);
/**
 * Analytics tracking — inserts into analytics_events via API
 */
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
