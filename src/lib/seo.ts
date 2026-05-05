import { getSupabase } from "./supabase";

export interface SEOInjection {
  place_name: string;
  province: string;
  json_ld: any;
  meta_description: string;
  ai_strategy: string;
  geo_optimized_summary?: string; // Short summary for AI agents (Siri/Gemini/Perplexity)
  citation_hooks?: string[];      // Key phrases for AI to cite
}

export async function getHermesSEO(placeName: string, province: string): Promise<SEOInjection | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("seo_injections")
    .select("*")
    .eq("place_name", placeName)
    .eq("province", province)
    .maybeSingle();

  if (error || !data) return null;
  return data as SEOInjection;
}
