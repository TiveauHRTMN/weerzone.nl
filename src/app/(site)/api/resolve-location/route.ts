import { NextRequest, NextResponse } from "next/server";
import { nearestPoiName } from "@/lib/poi-places";
import { reverseGeocode } from "@/lib/types";

/**
 * Zet exacte GPS-coördinaten om naar een naam voor de plek waar je écht bent:
 * 1. Sta je binnen de straal van een bekende POI (pretpark, dierentuin, zwembad,
 *    strand, camping)? → die naam.
 * 2. Anders de woonplaats op je coördinaten (Nominatim, server-side).
 * De lat/lon blijven altijd je exacte coördinaten, zodat het weer voor jóuw plek is.
 */
export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(null, { status: 400 });
  }

  const poi = nearestPoiName(lat, lon);
  if (poi) {
    return NextResponse.json({ name: poi, lat, lon });
  }

  const city = await reverseGeocode(lat, lon);
  return NextResponse.json({ name: city.name, lat: city.lat, lon: city.lon });
}
