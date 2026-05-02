import { NextRequest, NextResponse } from "next/server";
import { fetchKNMIWarnings, warningsForProvince } from "@/lib/knmi-warnings";
import { ALL_PLACES } from "@/lib/places-data";

export const dynamic = "force-dynamic";

function nearestProvince(lat: number, lon: number): string | null {
  let nearest = ALL_PLACES[0];
  let minDist = Infinity;
  for (const p of ALL_PLACES) {
    const dLat = (p.lat - lat) * Math.PI / 180;
    const dLon = (p.lon - lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
    if (dist < minDist) { minDist = dist; nearest = p; }
  }
  return nearest?.province ?? null;
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");

  const allWarnings = await fetchKNMIWarnings();

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ warnings: allWarnings, province: null }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" }
    });
  }

  const province = nearestProvince(lat, lon);
  const warnings = province ? warningsForProvince(allWarnings, province) : allWarnings;

  return NextResponse.json({ warnings, province }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" }
  });
}
