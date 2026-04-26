import { getSupabase } from "./supabase";
import type { WWSPayload } from "./types";

/**
 * Haalt de meteorologische waarheid op van de server (database).
 * Dit is de "Instant-Load" motor van Weerzone.
 */
export async function getCachedTruth(lat: number, lon: number, sector: 'public' | 'business' = 'public'): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // We snappen naar 3 decimalen om de juiste grid-cel in de cache te vinden
    const { data: cached } = await supabase
      .from("wws_truth_cache")
      .select("payload, created_at")
      .eq("sector", sector)
      .gte("lat", (lat - 0.01).toFixed(3))
      .lte("lat", (lat + 0.01).toFixed(3))
      .gte("lon", (lon - 0.01).toFixed(3))
      .lte("lon", (lon + 0.01).toFixed(3))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
        return cached.payload;
    }
  } catch (err) {
    console.error("[TRUTH-SERVER] Fetch error:", err);
  }
  return null;
}
