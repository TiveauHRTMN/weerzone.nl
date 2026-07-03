import { getSupabase } from "./supabase";

/**
 * Volledig OpenGraph-blok voor een pagina. Next vervangt bij de metadata-merge
 * het hele openGraph-object van de layout (geen deep-merge), dus een los
 * `openGraph: { url }` gooit title/images weg — deze helper levert daarom
 * alle velden. Gebruik dit i.p.v. de layout-default zodra een pagina een
 * eigen URL heeft (SEO-audit 2026-07-03: og:url wees overal naar de homepage).
 */
export function ogFor(path: string, title: string, description: string) {
  return {
    title,
    description,
    url: `https://weerzone.nl${path}`,
    type: "website" as const,
    locale: "nl_NL",
    siteName: "WEERZONE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WEERZONE" }],
  };
}

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
