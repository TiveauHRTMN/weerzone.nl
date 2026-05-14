import { NextRequest, NextResponse } from "next/server";
import { ALL_PLACES, placeSlug } from "@/lib/places-data";

const NL_PROVINCES = new Set([
  "groningen","friesland","drenthe","overijssel","flevoland",
  "gelderland","utrecht","noord-holland","zuid-holland","zeeland",
  "noord-brabant","limburg",
]);

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(null, { status: 400 });
  }

  // GPS navigation always resolves to a Dutch place — Belgian pages exist for
  // SEO indexing but are not stable enough to route live users to yet.
  const pool = ALL_PLACES.filter(p => NL_PROVINCES.has(p.province));

  let nearest = pool[0];
  let minDist = Infinity;

  for (const p of pool) {
    const dLat = (p.lat - lat) * Math.PI / 180;
    const dLon = (p.lon - lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
    if (dist < minDist) { minDist = dist; nearest = p; }
  }

  return NextResponse.json({
    name: nearest.name,
    province: nearest.province,
    slug: placeSlug(nearest.name),
    lat: nearest.lat,
    lon: nearest.lon,
  });
}
