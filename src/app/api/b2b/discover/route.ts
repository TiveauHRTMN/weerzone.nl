import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Zoektermen per branche voor Google Places
const INDUSTRY_QUERIES: Record<string, string[]> = {
  glazenwasser:     ["glazenwasserbedrijf", "gevelreiniging bedrijf"],
  bouw:             ["aannemersbedrijf", "bouwbedrijf"],
  horeca:           ["restaurant terras", "strandpaviljoen", "horecabedrijf met terras"],
  evenementen:      ["evenementenbureau", "festival organisator", "outdoor events"],
  agrarisch:        ["loonbedrijf agrarisch", "tuinbouw bedrijf"],
  transport:        ["transportbedrijf logistiek", "koeriersdienst"],
  sport:            ["voetbalvereniging", "openlucht sportvereniging"],
  schoonmaak:       ["schoonmaakbedrijf", "facilitaire diensten"],
  schildersbedrijf: ["schildersbedrijf", "restauratieschilder"],
  dakdekker:        ["dakdekker bedrijf", "dakbedekkingsbedrijf"],
  tuinonderhoud:    ["hovenier", "tuinonderhoud bedrijf", "tuinaanleg"],
  bezorging:        ["bezorgdienst", "fietskoerier"],
  strandpaviljoen:  ["strandpaviljoen", "strandtent", "beach club nederland"],
};

// Haal email op van website via eenvoudige scrape
async function scrapeEmail(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WEERZONE/1.0)" },
    });
    const html = await res.text();

    // Decodeer mailto: links eerst
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    if (mailtoMatch) return mailtoMatch[1].toLowerCase();

    // Zoek op zichtbare emailadressen
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const all = [...new Set((html.match(emailRegex) || []))];

    const valid = all.filter(
      (e) =>
        !e.match(/\.(png|jpg|gif|svg|woff|ttf|eot|css|js)$/i) &&
        !e.includes("example.") &&
        !e.includes("sentry.io") &&
        !e.includes("@2x") &&
        !e.includes("schema.org") &&
        e.split("@")[1]?.includes(".")
    );

    return valid[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

// Google Places Text Search
async function placesSearch(query: string, apiKey: string) {
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}&language=nl&region=nl&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results ?? []) as Array<{
    name: string;
    place_id: string;
    formatted_address?: string;
  }>;
}

// Google Place Details (website + telefoon)
async function placeDetails(placeId: string, apiKey: string) {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=website,formatted_phone_number&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    website: (data.result?.website as string | undefined) ?? null,
    phone: (data.result?.formatted_phone_number as string | undefined) ?? null,
  };
}

export async function POST(req: Request) {
  // Auth
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { industry, city } = body as { industry?: string; city?: string };
  return await runDiscovery(industry, city);
}

export async function GET(req: Request) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let industry = searchParams.get("industry");
  let city = searchParams.get("city");

  // Als er geen industry/city is (bijv via cron), kies een willekeurige
  if (!industry) {
    const industries = Object.keys(INDUSTRY_QUERIES);
    industry = industries[Math.floor(Math.random() * industries.length)];
  }
  
  if (!city) {
    const cities = ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Apeldoorn", "Haarlem", "Arnhem"];
    city = cities[Math.floor(Math.random() * cities.length)];
  }

  return await runDiscovery(industry, city);
}

async function runDiscovery(industry?: string, city?: string) {
  if (!industry || !city) {
    return NextResponse.json({ error: "industry en city zijn verplicht" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "GOOGLE_MAPS_API_KEY niet geconfigureerd",
        hint: "Voeg GOOGLE_MAPS_API_KEY toe in Vercel → Settings → Environment Variables",
      },
      { status: 503 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 500 });
  }

  const queries = INDUSTRY_QUERIES[industry] ?? [industry];
  let found = 0;
  let saved = 0;
  let noEmail = 0;

  for (const term of queries.slice(0, 2)) {
    let places;
    try {
      places = await placesSearch(`${term} ${city}`, apiKey);
    } catch {
      continue;
    }

    for (const place of places.slice(0, 6)) {
      found++;

      let website: string | null = null;
      let phone: string | null = null;

      try {
        const details = await placeDetails(place.place_id, apiKey);
        website = details.website;
        phone = details.phone;
      } catch {
        // Geen details beschikbaar — skip
      }

      if (!website) { noEmail++; continue; }

      const email = await scrapeEmail(website);
      if (!email) { noEmail++; continue; }

      // Stad uit adres halen
      const leadCity =
        place.formatted_address?.split(",").find((p) => p.trim().match(/\b[A-Z][a-z]+\b/))?.trim() || city;

      const { error } = await supabase.from("b2b_leads").upsert(
        {
          business_name: place.name,
          email,
          city: leadCity,
          industry,
          phone,
          source: "discovery",
          status: "new",
          notes: website,
        },
        { onConflict: "email" }
      );

      if (!error) saved++;
    }
  }

  return NextResponse.json({ found, saved, noEmail });
}
