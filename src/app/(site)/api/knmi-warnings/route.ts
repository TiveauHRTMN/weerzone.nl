import { NextRequest, NextResponse } from "next/server";
import {
  fetchKNMIWarnings,
  warningsForProvince,
  enrichWarning,
  nearestProvinceSlug,
  type KNMIWarningEnriched,
} from "@/lib/knmi-warnings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");
  const enrich = req.nextUrl.searchParams.get("enrich") === "1";

  const allWarnings = await fetchKNMIWarnings();

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ warnings: allWarnings, province: null }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  }

  const province = await nearestProvinceSlug(lat, lon);
  const warnings = province ? warningsForProvince(allWarnings, province) : allWarnings;

  let enriched: KNMIWarningEnriched[] = warnings;
  if (enrich && warnings.length > 0) {
    enriched = await Promise.all(warnings.map((w) => enrichWarning(w, lat, lon)));
  }

  return NextResponse.json({ warnings: enriched, province }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
